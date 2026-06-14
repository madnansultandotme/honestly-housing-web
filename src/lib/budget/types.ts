export type BudgetStatus = 'draft' | 'finalApprovedBudget';

export type CostType = 'labor' | 'material' | 'laborMaterial';

export interface BudgetRow {
  id: string;
  categoryCode: string;
  categoryName: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unitCost: number;
  markup: number;
  totalAmount: number;
  costType: CostType;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetSummary {
  id: string;
  status: BudgetStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string | null;
  finalizedBy?: string | null;
}

export interface DrawInvoiceLineItem {
  budgetRowId: string;
  categoryCode: string;
  categoryName: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unitCost: number;
  markup: number;
  totalAmount: number;
  costType: CostType;
  previousDrawn: number;
  currentDrawAmount: number;
  remainingAmount: number;
}

export interface InvoiceCategorySummary {
  categoryCode: string;
  categoryName: string;
  budgetTotal: number;
  lastInvoiced: number;
  totalInvoiced: number;
  currentInvoice: number;
  remainingAmount: number;
}

export interface DrawInvoice {
  id: string;
  drawNumber: number;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  pdfPath: string;
  downloadUrl: string;
  createdAt: string;
  createdBy: string;
  lineItems: DrawInvoiceLineItem[];
}
