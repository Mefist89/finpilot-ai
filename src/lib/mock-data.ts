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

export const documents: DocumentRecord[] = [
  { id: "FP-1048", fileName: "invoice_1048_linella.pdf", type: "Invoice", counterparty: "Linella Market SRL", date: "Sep 28, 2026", amount: "12,480.00 MDL", status: "Ready", confidence: 97 },
  { id: "FP-1047", fileName: "factura_0926_omega.pdf", type: "Invoice", counterparty: "Omega Construct SRL", date: "Sep 27, 2026", amount: "6,840.00 MDL", status: "Needs review", confidence: 76 },
  { id: "FP-1046", fileName: "bon_fiscal_coffee.jpg", type: "Receipt", counterparty: "Coffee Point", date: "Sep 25, 2026", amount: "785.00 MDL", status: "Posted", confidence: 99 },
  { id: "FP-1045", fileName: "invoice_cloud_eu.pdf", type: "Invoice", counterparty: "Northstar Cloud Ltd", date: "Sep 24, 2026", amount: "2,190.00 EUR", status: "Processing", confidence: 88 },
  { id: "FP-1044", fileName: "extras_cont_septembrie.pdf", type: "Bank statement", counterparty: "maib", date: "Sep 23, 2026", amount: "—", status: "Posted", confidence: 98 },
];

export const ledgerEntries = [
  { id: "JE-0284", date: "Sep 28, 2026", source: "FP-1048", description: "Inventory purchase — Linella Market SRL", debit: "217.1 Inventory", credit: "521.1 Trade payables", amount: "12,480.00 MDL", status: "Draft" },
  { id: "JE-0283", date: "Sep 25, 2026", source: "FP-1046", description: "Office refreshments — Coffee Point", debit: "713.9 Administrative expenses", credit: "241.1 Cash", amount: "785.00 MDL", status: "Posted" },
  { id: "JE-0282", date: "Sep 23, 2026", source: "FP-1044", description: "Monthly bank service fee", debit: "714.1 Bank charges", credit: "242.1 Current accounts", amount: "240.00 MDL", status: "Posted" },
  { id: "JE-0281", date: "Sep 21, 2026", source: "FP-1042", description: "Professional services — Legal Office", debit: "713.4 Professional fees", credit: "521.1 Trade payables", amount: "4,500.00 MDL", status: "Posted" },
  { id: "JE-0280", date: "Sep 20, 2026", source: "FP-1041", description: "Customer payment — Inv. #00918", debit: "242.1 Current accounts", credit: "221.1 Trade receivables", amount: "18,900.00 MDL", status: "Posted" },
];

export const reviewFields = [
  { label: "Document type", value: "Supplier invoice", confidence: 99 },
  { label: "Invoice number", value: "INV-2026-1048", confidence: 98 },
  { label: "Issue date", value: "2026-09-28", confidence: 99 },
  { label: "Supplier", value: "Linella Market SRL", confidence: 97 },
  { label: "Tax ID / IDNO", value: "1003600044118", confidence: 95 },
  { label: "Subtotal", value: "10,400.00 MDL", confidence: 98 },
  { label: "VAT (20%)", value: "2,080.00 MDL", confidence: 98 },
  { label: "Total", value: "12,480.00 MDL", confidence: 99 },
];
