import { notFound } from "next/navigation";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  await params;
  notFound();
}
