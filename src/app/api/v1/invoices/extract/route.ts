import { NextResponse } from "next/server";
import { z } from "zod";

import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

const partySchema = z.object({
  name: z.string(),
  tax_id: z.string(),
  vat_code: z.string(),
  address: z.string(),
  iban: z.string(),
});

const extractedInvoiceSchema = z.object({
  invoice_number: z.string(),
  issue_date: z.string(),
  due_date: z.string(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  supplier: partySchema,
  customer: partySchema,
  items: z.array(z.object({
    product_name: z.string(),
    sku: z.string(),
    unit: z.string(),
    quantity: z.number().nonnegative(),
    unit_price: z.number().nonnegative(),
    vat_rate: z.number().min(0).max(100),
    vat_amount: z.number().nonnegative(),
    total_amount: z.number().nonnegative(),
  })).min(1),
  subtotal: z.number().nonnegative(),
  vat_amount: z.number().nonnegative(),
  total_amount: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()),
});

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["invoice_number", "issue_date", "due_date", "currency", "supplier", "customer", "items", "subtotal", "vat_amount", "total_amount", "confidence", "warnings"],
  properties: {
    invoice_number: { type: "string", description: "Numărul exact al facturii fiscale, fără eticheta câmpului" },
    issue_date: { type: "string", description: "YYYY-MM-DD or empty string" },
    due_date: { type: "string", description: "YYYY-MM-DD or empty string" },
    currency: { type: "string", pattern: "^[A-Z]{3}$", description: "Codul ISO 4217 al monedei, de exemplu MDL" },
    supplier: partyJsonSchema("Furnizorul care a emis factura"),
    customer: partyJsonSchema("Cumpărătorul care a primit factura"),
    items: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["product_name", "sku", "unit", "quantity", "unit_price", "vat_rate", "vat_amount", "total_amount"],
        properties: {
          product_name: { type: "string", description: "Denumirea exactă a produsului sau serviciului" },
          sku: { type: "string", description: "Codul produsului; șir gol dacă nu este tipărit" },
          unit: { type: "string", description: "Unitatea de măsură; folosește buc. dacă lipsește" },
          quantity: { type: "number", minimum: 0 },
          unit_price: { type: "number", minimum: 0, description: "Unit price without VAT" },
          vat_rate: { type: "number", minimum: 0, maximum: 100 },
          vat_amount: { type: "number", minimum: 0 },
          total_amount: { type: "number", minimum: 0 },
        },
      },
    },
    subtotal: { type: "number", minimum: 0 },
    vat_amount: { type: "number", minimum: 0 },
    total_amount: { type: "number", minimum: 0 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

function partyJsonSchema(description: string) {
  return {
    type: "object",
    description,
    additionalProperties: false,
    required: ["name", "tax_id", "vat_code", "address", "iban"],
    properties: {
      name: { type: "string", description: "Denumirea juridică exactă" },
      tax_id: { type: "string", description: "IDNO sau cod fiscal; șir gol dacă lipsește" },
      vat_code: { type: "string", description: "Cod TVA; șir gol dacă lipsește" },
      address: { type: "string", description: "Adresa juridică; șir gol dacă lipsește" },
      iban: { type: "string", description: "Contul IBAN; șir gol dacă lipsește" },
    },
  } as const;
}

function outputText(response: unknown) {
  if (!response || typeof response !== "object" || !("output" in response) || !Array.isArray(response.output)) return "";
  for (const item of response.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "type" in content && content.type === "output_text" && "text" in content && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function safeFilename(name: string) {
  const normalized = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return normalized.slice(-120) || "factura.pdf";
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ code: "AI_NOT_CONFIGURED", message: "Serviciul OpenAI nu este configurat. Adăugați OPENAI_API_KEY în mediul serverului." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ code: "UNAUTHORIZED", message: "Autentificați-vă pentru a analiza factura." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ code: "FILE_REQUIRED", message: "Selectați factura fiscală." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ code: "UNSUPPORTED_FILE", message: "Sunt acceptate fișiere PDF, JPG și PNG." }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ code: "FILE_SIZE", message: "Fișierul trebuie să aibă maximum 20 MB." }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
  const model = process.env.OPENAI_INVOICE_MODEL || "gpt-5-mini";
  const fileContent = file.type === "application/pdf"
    ? { type: "input_file", filename: file.name, file_data: dataUrl }
    : { type: "input_image", image_url: dataUrl, detail: "high" };

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "minimal" },
      input: [{
        role: "user",
        content: [
          fileContent,
          { type: "input_text", text: "Extrage această factură fiscală primită din Republica Moldova. Returnează datele strict conform schemei JSON. Prețul unitar trebuie să fie fără TVA. Dacă unitatea sau codul produsului nu sunt tipărite, folosește «buc.» respectiv șir gol. Nu inventa identificatori sau date: folosește șir gol și explică lipsa în warnings. Verifică matematic subtotalul, TVA-ul și totalul. confidence trebuie să reflecte lizibilitatea și consistența documentului." },
        ],
      }],
      text: { format: { type: "json_schema", name: "received_fiscal_invoice", strict: true, schema: jsonSchema } },
    }),
  });

  if (!aiResponse.ok) {
    const requestId = aiResponse.headers.get("x-request-id");
    if (aiResponse.status === 429) {
      return NextResponse.json({ code: "AI_RATE_LIMITED", message: "Limita OpenAI a fost atinsă. Verificați creditul și limitele proiectului OpenAI, apoi încercați din nou.", requestId }, { status: 429 });
    }
    if (aiResponse.status === 401 || aiResponse.status === 403) {
      return NextResponse.json({ code: "AI_AUTH_FAILED", message: "Cheia OpenAI nu este acceptată. Verificați cheia configurată pe server.", requestId }, { status: 502 });
    }
    return NextResponse.json({ code: "AI_REQUEST_FAILED", message: "Factura nu a putut fi analizată de serviciul AI.", requestId }, { status: 502 });
  }

  const rawResponse: unknown = await aiResponse.json();
  const text = outputText(rawResponse);
  let extracted: z.infer<typeof extractedInvoiceSchema>;
  try {
    extracted = extractedInvoiceSchema.parse(JSON.parse(text));
  } catch {
    return NextResponse.json({ code: "INVALID_AI_OUTPUT", message: "Serviciul AI a returnat date incomplete. Încercați din nou sau completați factura manual." }, { status: 502 });
  }

  const storagePath = `${userData.user.id}/invoices/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ code: "STORAGE_FAILED", message: "Factura a fost analizată, dar fișierul nu a putut fi salvat." }, { status: 500 });

  const { data: document, error: documentError } = await supabase.from("documents").insert({
    original_filename: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    document_type: "invoice",
    status: "needs_review",
    document_number: extracted.invoice_number || null,
    counterparty_name: extracted.supplier.name || null,
    counterparty_tax_id: extracted.supplier.tax_id || null,
    issue_date: extracted.issue_date || null,
    due_date: extracted.due_date || null,
    currency: extracted.currency,
    subtotal: extracted.subtotal,
    vat_amount: extracted.vat_amount,
    total_amount: extracted.total_amount,
    confidence: extracted.confidence,
    metadata: { direction: "purchase", supplier: extracted.supplier, customer: extracted.customer, items: extracted.items, warnings: extracted.warnings } as Json,
  }).select("id").single();

  if (documentError || !document) {
    await supabase.storage.from("documents").remove([storagePath]);
    return NextResponse.json({ code: "DOCUMENT_FAILED", message: "Datele extrase nu au putut fi înregistrate." }, { status: 500 });
  }

  await supabase.from("document_extractions").insert({
    document_id: document.id,
    provider: "openai",
    model,
    status: "completed",
    extracted_data: extracted as unknown as Json,
    confidence: extracted.confidence,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({ documentId: document.id, extraction: extracted });
}
