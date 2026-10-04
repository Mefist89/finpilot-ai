import { CopilotChat, type Message, type Source } from "@/features/copilot/copilot-chat";
import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

function strings(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sources(value: Json): Source[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || Array.isArray(item) || typeof item !== "object") return [];
    const source = item as Record<string, Json | undefined>;
    if (typeof source.id !== "string" || typeof source.label !== "string" || typeof source.href !== "string") return [];
    if (!["document", "entry", "invoice", "price"].includes(String(source.type))) return [];
    return [{ id: source.id, label: source.label, href: source.href, type: source.type as Source["type"] }];
  });
}

export default async function CopilotPage({ searchParams }: PageProps<"/copilot">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const supabase = await createClient();
  const { data: history } = await supabase.from("copilot_interactions").select("id,question,answer,amount,bullets,sources,created_at").order("created_at", { ascending: false }).limit(20);
  const initialMessages: Message[] = (history ?? []).reverse().flatMap((interaction) => [
    { role: "user" as const, text: interaction.question },
    { role: "assistant" as const, text: interaction.answer, amount: interaction.amount ?? undefined, bullets: strings(interaction.bullets), sources: sources(interaction.sources) },
  ]);

  return <CopilotChat initialQuery={query} initialMessages={initialMessages} />;
}
