import { CopilotChat } from "@/features/copilot/copilot-chat";

export default async function CopilotPage({ searchParams }: PageProps<"/copilot">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  return <CopilotChat initialQuery={query} />;
}
