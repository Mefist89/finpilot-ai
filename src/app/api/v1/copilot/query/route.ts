import { NextResponse } from "next/server";
import { z } from "zod";

import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

const requestSchema = z.object({ query: z.string().trim().min(2).max(500) });

type Intent = "period_summary" | "price_creation" | "document_review" | "unpaid_supplier_invoices" | "general";
type CopilotSource = { id: string; label: string; type: "document" | "entry" | "invoice" | "price"; href: string };
type CopilotAnswer = { answer: string; amount?: string; bullets?: string[]; sources?: CopilotSource[] };

function normalized(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function detectIntent(question: string): Intent {
  const value = normalized(question);
  if (/(neachitat|restant|furnizor|dator)/.test(value)) return "unpaid_supplier_invoices";
  if (/(pret|adaos|marja|formarea)/.test(value)) return "price_creation";
  if (/(verific|document|atentie|eroare)/.test(value)) return "document_review";
  if (/(rezumat|perioad|luna|raport)/.test(value)) return "period_summary";
  return "general";
}

function number(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("ro-MD", { style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function monthBounds(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const next = new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10);
  const label = new Intl.DateTimeFormat("ro-MD", { month: "long", year: "numeric", timeZone: "UTC" }).format(now);
  return { start, next, label };
}

async function askBotHub(question: string, context: string) {
  const apiKey = process.env.BOTHUB_API_KEY;
  if (!apiKey) return null;
  const baseUrl = (process.env.BOTHUB_BASE_URL || "https://openai.bothub.chat/v1").replace(/\/$/, "");
  const model = process.env.BOTHUB_MODEL || "gpt-5-mini";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: "Ești FinPilot AI, asistent contabil pentru o companie din Republica Moldova. Răspunde în limba română, clar și concis. Folosește numai contextul contabil primit; nu inventa sume, documente sau reguli fiscale. Dacă informația lipsește, spune exact ce date trebuie adăugate. Nu prezenta răspunsul ca înlocuitor al verificării unui contabil autorizat.",
        },
        { role: "user", content: `Context verificat din baza de date:\n${context}\n\nÎntrebarea utilizatorului: ${question}` },
      ],
    }),
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("choices" in payload) || !Array.isArray(payload.choices)) return null;
  const first = payload.choices[0];
  if (!first || typeof first !== "object" || !("message" in first) || !first.message || typeof first.message !== "object" || !("content" in first.message) || typeof first.message.content !== "string") return null;
  return first.message.content.trim() || null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Autentificați-vă pentru a utiliza FinPilot." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_QUERY", message: "Introduceți o întrebare validă." }, { status: 400 });
  }

  const intent = detectIntent(parsed.data.query);
  const { data: profile } = await supabase.from("profiles").select("base_currency").eq("id", userData.user.id).maybeSingle();
  const currency = profile?.base_currency ?? "MDL";
  let result: CopilotAnswer;

  try {
    if (intent === "period_summary") {
      const { start, next, label } = monthBounds();
      const [invoicesResult, entriesResult, documentsResult] = await Promise.all([
        supabase.from("invoices").select("id,direction,invoice_number,total_amount,vat_amount,source_document_id").gte("issue_date", start).lt("issue_date", next).neq("status", "cancelled"),
        supabase.from("ledger_entries").select("id,entry_number,status").gte("entry_date", start).lt("entry_date", next).neq("status", "voided"),
        supabase.from("documents").select("id,status").gte("created_at", `${start}T00:00:00Z`).lt("created_at", `${next}T00:00:00Z`),
      ]);
      if (invoicesResult.error || entriesResult.error || documentsResult.error) throw new Error("summary_query_failed");
      const invoices = invoicesResult.data ?? [];
      const entries = entriesResult.data ?? [];
      const documents = documentsResult.data ?? [];
      const sales = invoices.filter((item) => item.direction === "sale").reduce((sum, item) => sum + number(item.total_amount), 0);
      const purchases = invoices.filter((item) => item.direction === "purchase").reduce((sum, item) => sum + number(item.total_amount), 0);
      const vat = invoices.reduce((sum, item) => sum + number(item.vat_amount), 0);
      const posted = entries.filter((item) => item.status === "posted").length;
      const attention = documents.filter((item) => ["needs_review", "failed", "processing"].includes(item.status)).length;
      result = {
        answer: `Rezumatul perioadei curente (${label}) a fost calculat din facturile și operațiunile existente în baza de date.`,
        bullets: [`Vânzări|${money(sales, currency)}`, `Achiziții|${money(purchases, currency)}`, `TVA în facturi|${money(vat, currency)}`, `Operațiuni contabilizate|${posted}`, `Documente cu atenție|${attention}`],
        sources: [
          { id: "summary-registers", label: "Registrul facturilor", type: "invoice", href: "/registers" },
          { id: "summary-ledger", label: "Jurnalul operațiunilor", type: "entry", href: "/ledger" },
          ...entries.slice(0, 5).map((entry) => ({ id: entry.id, label: `Operațiunea #${entry.entry_number}`, type: "entry" as const, href: "/ledger" })),
        ],
      };
    } else if (intent === "price_creation") {
      const [invoicesResult, sheetsResult] = await Promise.all([
        supabase.from("invoices").select("id,invoice_number,counterparty_name,total_amount,source_document_id").eq("direction", "purchase").neq("status", "cancelled").order("issue_date", { ascending: false }),
        supabase.from("price_sheets").select("purchase_invoice_id").neq("status", "cancelled"),
      ]);
      if (invoicesResult.error || sheetsResult.error) throw new Error("price_query_failed");
      const invoices = invoicesResult.data ?? [];
      const completed = new Set((sheetsResult.data ?? []).map((sheet) => sheet.purchase_invoice_id));
      const pending = invoices.filter((invoice) => !completed.has(invoice.id));
      result = {
        answer: pending.length > 0
          ? `Am găsit ${pending.length} facturi de intrare pentru care puteți forma prețurile de vânzare. Selectați factura dorită și completați adaosul comercial.`
          : "Toate facturile de intrare disponibile au deja fișe de formare a prețurilor.",
        bullets: [`Facturi de intrare|${invoices.length}`, `Fișe create|${completed.size}`, `De procesat|${pending.length}`],
        sources: [
          { id: "prices-open", label: "Deschide formarea prețurilor", type: "price", href: "/prices" },
          ...pending.slice(0, 8).map((invoice) => ({ id: invoice.id, label: `${invoice.invoice_number} · ${invoice.counterparty_name}`, type: "price" as const, href: `/prices?invoice=${invoice.id}` })),
        ],
      };
    } else if (intent === "document_review") {
      const { data: documents, error } = await supabase.from("documents").select("id,original_filename,status,confidence").in("status", ["uploaded", "processing", "needs_review", "failed"]).order("created_at", { ascending: false });
      if (error) throw new Error("document_query_failed");
      const rows = documents ?? [];
      const review = rows.filter((document) => document.status === "needs_review").length;
      const failed = rows.filter((document) => document.status === "failed").length;
      const processing = rows.filter((document) => ["uploaded", "processing"].includes(document.status)).length;
      result = {
        answer: rows.length > 0 ? `Am găsit ${rows.length} documente care necesită procesare sau verificare.` : "Nu există documente care necesită atenție în acest moment.",
        bullets: [`De verificat|${review}`, `În procesare|${processing}`, `Cu eroare|${failed}`],
        sources: [
          { id: "documents-open", label: "Registrul documentelor", type: "document", href: "/documents" },
          ...rows.slice(0, 8).map((document) => ({ id: document.id, label: document.original_filename, type: "document" as const, href: `/documents/${document.id}` })),
        ],
      };
    } else if (intent === "unpaid_supplier_invoices") {
      const { data: invoices, error } = await supabase.from("invoices").select("id,invoice_number,counterparty_name,total_amount,amount_paid,due_date,source_document_id").eq("direction", "purchase").neq("status", "cancelled").order("issue_date", { ascending: false });
      if (error) throw new Error("supplier_query_failed");
      const unpaid = (invoices ?? []).map((invoice) => ({ ...invoice, balance: number(invoice.total_amount) - number(invoice.amount_paid) })).filter((invoice) => invoice.balance > 0.005);
      const total = unpaid.reduce((sum, invoice) => sum + invoice.balance, 0);
      const overdue = unpaid.filter((invoice) => invoice.due_date && invoice.due_date < new Date().toISOString().slice(0, 10)).length;
      result = {
        answer: unpaid.length > 0 ? `Sunt ${unpaid.length} facturi neachitate ale furnizorilor, cu un sold total de ${money(total, currency)}.` : "Nu există facturi neachitate ale furnizorilor.",
        amount: money(total, currency),
        bullets: [`Facturi neachitate|${unpaid.length}`, `Depășite|${overdue}`, `Sold total|${money(total, currency)}`],
        sources: [
          { id: "supplier-register", label: "Registrul de procurări", type: "invoice", href: "/registers" },
          ...unpaid.slice(0, 8).map((invoice) => ({ id: invoice.id, label: `${invoice.invoice_number} · ${invoice.counterparty_name}`, type: "invoice" as const, href: "/registers" })),
        ],
      };
    } else {
      const [documentsResult, invoicesResult, entriesResult] = await Promise.all([
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("invoices").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
        supabase.from("ledger_entries").select("*", { count: "exact", head: true }).neq("status", "voided"),
      ]);
      const counts = {
        documents: documentsResult.count ?? 0,
        invoices: invoicesResult.count ?? 0,
        entries: entriesResult.count ?? 0,
      };
      const aiAnswer = await askBotHub(parsed.data.query, `Documente: ${counts.documents}; facturi active: ${counts.invoices}; operațiuni contabile active: ${counts.entries}; moneda de bază: ${currency}.`);
      result = {
        answer: aiAnswer ?? "BotHub nu a răspuns momentan. Pot analiza perioada curentă, facturile furnizorilor, documentele care necesită verificare și facturile de intrare disponibile pentru formarea prețurilor.",
        bullets: [`Documente|${counts.documents}`, `Facturi|${counts.invoices}`, `Operațiuni|${counts.entries}`],
        sources: [
          { id: "general-documents", label: "Documente", type: "document", href: "/documents" },
          { id: "general-registers", label: "Registre facturi", type: "invoice", href: "/registers" },
          { id: "general-ledger", label: "Jurnalul operațiunilor", type: "entry", href: "/ledger" },
        ],
      };
    }

    const { data: interaction, error: saveError } = await supabase.from("copilot_interactions").insert({
      user_id: userData.user.id,
      question: parsed.data.query,
      intent,
      answer: result.answer,
      amount: result.amount ?? null,
      bullets: (result.bullets ?? []) as Json,
      sources: (result.sources ?? []) as Json,
    }).select("id").single();

    if (saveError || !interaction) {
      return NextResponse.json({ error: "SAVE_FAILED", message: "Răspunsul a fost calculat, dar nu a putut fi salvat în baza de date." }, { status: 500 });
    }

    await supabase.from("audit_events").insert({
      user_id: userData.user.id,
      entity_type: "copilot_interaction",
      entity_id: interaction.id,
      action: "query_completed",
      metadata: { intent },
    });

    return NextResponse.json({ ...result, interactionId: interaction.id });
  } catch {
    return NextResponse.json({ error: "QUERY_FAILED", message: "FinPilot nu a putut citi datele contabile. Verificați conexiunea la baza de date." }, { status: 500 });
  }
}
