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
};
