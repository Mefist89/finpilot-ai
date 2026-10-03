import { DocumentReview } from "@/features/documents/document-review";
import { documents } from "@/lib/mock-data";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const document = documents.find((item) => item.id === id);
  return <DocumentReview documentId={id} fileName={document?.fileName ?? "uploaded_document.pdf"} />;
}
