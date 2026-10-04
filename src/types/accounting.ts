export type DocumentStatus = "Ready" | "Needs review" | "Posted" | "Processing";

export type DocumentRecord = {
  id: string;
  fileName: string;
  type: "Invoice" | "Receipt" | "Bank statement";
  counterparty: string;
  date: string;
  amount: string;
  status: DocumentStatus;
  confidence: number;
  documentNumber: string;
  counterpartyTaxId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number | null;
  vatAmount: number | null;
  totalAmount: number | null;
};
