import { adminDb, adminStorage } from '@/lib/firebase/admin';
import type {
  BudgetRow,
  BudgetStatus,
  BudgetSummary,
  DrawInvoice,
  DrawInvoiceLineItem,
} from './types';

const BUDGET_DOC_ID = 'main';

export interface BudgetProjectState {
  project: Record<string, unknown> & { id: string };
  client: Record<string, unknown> & { id: string } | null;
  builderOrg: Record<string, unknown> & { id: string } | null;
  budget: BudgetSummary;
  rows: BudgetRow[];
  draws: DrawInvoice[];
}

export interface InvoiceParticipant {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface InvoicePdfContext {
  project: BudgetProjectState['project'];
  client: InvoiceParticipant | null;
  builderOrg: InvoiceParticipant | null;
  budget: BudgetSummary;
  drawNumber: number;
  invoiceNumber: string;
  date: string;
  lineItems: DrawInvoiceLineItem[];
  totalAmount: number;
}

export interface InvoiceCalculationResult {
  lineItems: DrawInvoiceLineItem[];
  totalAmount: number;
  summaries: Array<{
    row: BudgetRow;
    previousDrawn: number;
    availableForCurrentDraw: number;
    currentDrawAmount: number;
    remainingAmount: number;
    isOverLimit: boolean;
  }>;
  errors: string[];
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getBudgetDocRef(projectId: string) {
  return adminDb.collection('projects').doc(projectId).collection('budget').doc(BUDGET_DOC_ID);
}

function getRowsCollection(projectId: string) {
  return adminDb.collection('projects').doc(projectId).collection('budgetRows');
}

function getDrawsCollection(projectId: string) {
  return adminDb.collection('projects').doc(projectId).collection('drawInvoices');
}

function nowIso() {
  return new Date().toISOString();
}

function toBudgetSummary(id: string, data: FirebaseFirestore.DocumentData | undefined): BudgetSummary {
  const createdAt = typeof data?.createdAt === 'string' ? data.createdAt : nowIso();
  const updatedAt = typeof data?.updatedAt === 'string' ? data.updatedAt : createdAt;

  return {
    id,
    status: data?.status === 'finalApprovedBudget' ? 'finalApprovedBudget' : 'draft',
    totalAmount: typeof data?.totalAmount === 'number' ? data.totalAmount : 0,
    createdAt,
    updatedAt,
    finalizedAt: typeof data?.finalizedAt === 'string' ? data.finalizedAt : null,
    finalizedBy: typeof data?.finalizedBy === 'string' ? data.finalizedBy : null,
  };
}

function toBudgetRow(id: string, data: FirebaseFirestore.DocumentData): BudgetRow {
  const quantity = typeof data.quantity === 'number' ? data.quantity : 0;
  const unitCost = typeof data.unitCost === 'number' ? data.unitCost : 0;
  const markup = typeof data.markup === 'number' ? data.markup : 0;
  const totalAmount = typeof data.totalAmount === 'number' ? data.totalAmount : quantity * unitCost + markup;

  return {
    id,
    categoryCode: typeof data.categoryCode === 'string' ? data.categoryCode : '',
    categoryName: typeof data.categoryName === 'string' ? data.categoryName : '',
    itemCode: typeof data.itemCode === 'string' ? data.itemCode : '',
    itemName: typeof data.itemName === 'string' ? data.itemName : '',
    description: typeof data.description === 'string' ? data.description : '',
    quantity,
    unitCost,
    markup,
    totalAmount,
    costType: data.costType === 'material' || data.costType === 'laborMaterial' ? data.costType : 'labor',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
  };
}

function toDrawInvoice(id: string, data: FirebaseFirestore.DocumentData): DrawInvoice {
  return {
    id,
    drawNumber: typeof data.drawNumber === 'number' ? data.drawNumber : 0,
    invoiceNumber: typeof data.invoiceNumber === 'string' ? data.invoiceNumber : '',
    date: typeof data.date === 'string' ? data.date : nowIso(),
    totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
    pdfPath: typeof data.pdfPath === 'string' ? data.pdfPath : '',
    downloadUrl: typeof data.downloadUrl === 'string' ? data.downloadUrl : '',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : nowIso(),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    lineItems: Array.isArray(data.lineItems) ? data.lineItems : [],
  };
}

export async function ensureBudgetDocument(projectId: string): Promise<BudgetSummary> {
  const docRef = getBudgetDocRef(projectId);
  const snapshot = await docRef.get();

  if (snapshot.exists) {
    return toBudgetSummary(snapshot.id, snapshot.data());
  }

  const now = nowIso();
  const budget: BudgetSummary = {
    id: BUDGET_DOC_ID,
    status: 'draft',
    totalAmount: 0,
    createdAt: now,
    updatedAt: now,
    finalizedAt: null,
    finalizedBy: null,
  };

  await docRef.set(budget);
  return budget;
}

export async function loadBudgetState(projectId: string): Promise<BudgetProjectState> {
  const projectSnapshot = await adminDb.collection('projects').doc(projectId).get();

  if (!projectSnapshot.exists) {
    throw new Error('Project not found');
  }

  const projectData = projectSnapshot.data() || {};
  const clientId = typeof projectData.clientId === 'string' ? projectData.clientId : null;
  const builderOrgId = typeof projectData.builderOrgId === 'string' ? projectData.builderOrgId : null;

  const [clientSnapshot, builderOrgSnapshot, budgetSnapshot, rowsSnapshot, drawsSnapshot] = await Promise.all([
    clientId ? adminDb.collection('users').doc(clientId).get() : Promise.resolve(null),
    builderOrgId ? adminDb.collection('builderOrgs').doc(builderOrgId).get() : Promise.resolve(null),
    getBudgetDocRef(projectId).get(),
    getRowsCollection(projectId).orderBy('createdAt', 'asc').get(),
    getDrawsCollection(projectId).orderBy('createdAt', 'asc').get(),
  ]);

  return {
    project: {
      id: projectSnapshot.id,
      ...projectData,
    },
    client: clientSnapshot?.exists ? { id: clientSnapshot.id, ...(clientSnapshot.data() || {}) } : null,
    builderOrg: builderOrgSnapshot?.exists ? { id: builderOrgSnapshot.id, ...(builderOrgSnapshot.data() || {}) } : null,
    budget: toBudgetSummary(budgetSnapshot.exists ? budgetSnapshot.id : BUDGET_DOC_ID, budgetSnapshot.data()),
    rows: rowsSnapshot.docs.map((doc) => toBudgetRow(doc.id, doc.data())),
    draws: drawsSnapshot.docs.map((doc) => toDrawInvoice(doc.id, doc.data())),
  };
}

export function getPreviousDrawTotals(draws: DrawInvoice[]): Record<string, number> {
  return draws.reduce<Record<string, number>>((totals, draw) => {
    draw.lineItems.forEach((lineItem) => {
      totals[lineItem.budgetRowId] = (totals[lineItem.budgetRowId] || 0) + lineItem.currentDrawAmount;
    });
    return totals;
  }, {});
}

export function calculateInvoiceLineItems(
  rows: BudgetRow[],
  draws: DrawInvoice[],
  currentAmounts: Record<string, number>
): InvoiceCalculationResult {
  const previousTotals = getPreviousDrawTotals(draws);
  const summaries: InvoiceCalculationResult['summaries'] = [];
  const lineItems: DrawInvoiceLineItem[] = [];
  const errors: string[] = [];

  rows.forEach((row) => {
    const previousDrawn = previousTotals[row.id] || 0;
    const rawCurrentAmount = currentAmounts[row.id] ?? 0;
    const currentDrawAmount = Number(rawCurrentAmount);
    const safeCurrentDrawAmount = Number.isFinite(currentDrawAmount) ? currentDrawAmount : 0;
    const availableForCurrentDraw = row.totalAmount - previousDrawn;
    const remainingAmount = row.totalAmount - previousDrawn - safeCurrentDrawAmount;
    const isOverLimit = safeCurrentDrawAmount > availableForCurrentDraw;

    if (safeCurrentDrawAmount < 0) {
      errors.push(`${row.categoryCode} ${row.itemCode}: draw amount cannot be negative.`);
    }

    if (isOverLimit) {
      errors.push(
        `${row.categoryCode} ${row.itemCode}: draw amount exceeds the remaining available balance (${formatCurrency(availableForCurrentDraw)}).`
      );
    }

    if (safeCurrentDrawAmount > 0) {
      lineItems.push({
        budgetRowId: row.id,
        categoryCode: row.categoryCode,
        categoryName: row.categoryName,
        itemCode: row.itemCode,
        itemName: row.itemName,
        description: row.description,
        quantity: row.quantity,
        unitCost: row.unitCost,
        markup: row.markup,
        totalAmount: row.totalAmount,
        costType: row.costType,
        previousDrawn,
        currentDrawAmount: safeCurrentDrawAmount,
        remainingAmount,
      });
    }

    summaries.push({
      row,
      previousDrawn,
      availableForCurrentDraw,
      currentDrawAmount: safeCurrentDrawAmount,
      remainingAmount,
      isOverLimit,
    });
  });

  const totalAmount = lineItems.reduce((sum, item) => sum + item.currentDrawAmount, 0);

  return {
    lineItems,
    totalAmount,
    summaries,
    errors,
  };
}

export function getNextDrawNumber(draws: DrawInvoice[]): number {
  return draws.reduce((max, draw) => Math.max(max, draw.drawNumber), 0) + 1;
}

export function getBudgetTotal(rows: BudgetRow[]): number {
  return rows.reduce((sum, row) => sum + row.totalAmount, 0);
}

export function getInvoiceDownloadUrl(projectId: string, drawId: string): string {
  return `/api/budget/draws/${drawId}/download?projectId=${projectId}`;
}

function getBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error('FIREBASE_STORAGE_BUCKET is required to store invoice PDFs');
  }

  return adminStorage.bucket(bucketName);
}

export async function saveInvoicePdf(projectId: string, drawId: string, pdfBuffer: Buffer): Promise<string> {
  const pdfPath = `projects/${projectId}/draws/${drawId}.pdf`;
  const file = getBucket().file(pdfPath);

  await file.save(pdfBuffer, {
    contentType: 'application/pdf',
    resumable: false,
    metadata: {
      cacheControl: 'private, max-age=0, no-transform',
    },
  });

  return pdfPath;
}

export async function readInvoicePdf(projectId: string, drawId: string): Promise<Buffer> {
  const pdfPath = `projects/${projectId}/draws/${drawId}.pdf`;
  const [fileBuffer] = await getBucket().file(pdfPath).download();
  return fileBuffer;
}

export async function buildInvoicePdfBuffer(context: InvoicePdfContext): Promise<Buffer> {
  const { default: PDFDocument } = await import('pdfkit');

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidths = [55, 140, 42, 70, 54, 64, 70, 74];
    let y = doc.y;

    const ensureSpace = (neededHeight: number) => {
      if (y + neededHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    };

    const drawLabelValue = (label: string, value: string, x: number, width: number) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#6B7280').text(label, x, y, { width });
      y += 12;
      doc.font('Helvetica').fontSize(11).fillColor('#111827').text(value, x, y, { width });
    };

    const groupedItems = Array.from(
      context.lineItems.reduce((groups, item) => {
        const groupKey = `${item.categoryCode}__${item.categoryName}`;
        const group = groups.get(groupKey) || {
          categoryCode: item.categoryCode,
          categoryName: item.categoryName,
          totalAmount: 0,
          lineItems: [] as DrawInvoiceLineItem[],
        };

        group.totalAmount += item.totalAmount;
        group.lineItems.push(item);
        groups.set(groupKey, group);
        return groups;
      }, new Map<string, { categoryCode: string; categoryName: string; totalAmount: number; lineItems: DrawInvoiceLineItem[] }>() )
        .values()
    );

    doc.font('Helvetica-Bold').fontSize(24).fillColor('#111827').text('Draw Invoice', { align: 'left' });
    y = doc.y + 12;

    doc.font('Helvetica').fontSize(10).fillColor('#6B7280').text(`Invoice Number: ${context.invoiceNumber}`);
    doc.text(`Draw Number: ${context.drawNumber}`);
    doc.text(`Date: ${context.date}`);
    y = doc.y + 18;

    ensureSpace(90);
    const sectionTop = y;
    const sectionWidth = pageWidth / 3;

    drawLabelValue('Project', String(context.project.name || 'Project'), doc.page.margins.left, sectionWidth - 12);
    y = sectionTop;
    drawLabelValue('Client', context.client?.name || 'Client not assigned', doc.page.margins.left + sectionWidth, sectionWidth - 12);
    y = sectionTop;
    drawLabelValue('Builder / Company', context.builderOrg?.name || 'Builder', doc.page.margins.left + sectionWidth * 2, sectionWidth - 12);
    y = Math.max(doc.y + 10, sectionTop + 48);

    const projectAddress = typeof context.project.address === 'string' ? context.project.address : '';
    if (projectAddress) {
      doc.font('Helvetica').fontSize(10).fillColor('#4B5563').text(projectAddress, { width: pageWidth });
      y = doc.y + 12;
    }

    const summaryTop = y;
    const summaryWidth = pageWidth / 3;
    doc.roundedRect(doc.page.margins.left, summaryTop, pageWidth, 64, 10).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#6B7280').text('Budget Status', doc.page.margins.left + 14, summaryTop + 14, { width: summaryWidth - 28 });
    doc.font('Helvetica').fontSize(11).fillColor('#111827').text(context.budget.status === 'finalApprovedBudget' ? 'Final Approved Budget' : 'Draft', doc.page.margins.left + 14, summaryTop + 28, { width: summaryWidth - 28 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#6B7280').text('Draw Total', doc.page.margins.left + summaryWidth + 14, summaryTop + 14, { width: summaryWidth - 28 });
    doc.font('Helvetica').fontSize(11).fillColor('#111827').text(formatCurrency(context.totalAmount), doc.page.margins.left + summaryWidth + 14, summaryTop + 28, { width: summaryWidth - 28 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#6B7280').text('Remaining Budget', doc.page.margins.left + summaryWidth * 2 + 14, summaryTop + 14, { width: summaryWidth - 28 });
    doc.font('Helvetica').fontSize(11).fillColor('#111827').text(formatCurrency(Math.max(context.budget.totalAmount - context.totalAmount, 0)), doc.page.margins.left + summaryWidth * 2 + 14, summaryTop + 28, { width: summaryWidth - 28 });
    y = summaryTop + 84;

    ensureSpace(28);
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text('Budget Draw Detail', { continued: false });
    y = doc.y + 8;

    const tableLeft = doc.page.margins.left;
    const tableHeaders = ['Code', 'Item', 'Qty', 'Unit Cost', 'Markup', 'Total', 'Draw', 'Remaining'];
    const tableWidths = [58, 150, 38, 68, 58, 68, 68, 70];

    const renderTableHeader = () => {
      ensureSpace(22);
      let x = tableLeft;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#6B7280');
      tableHeaders.forEach((header, index) => {
        doc.text(header, x, y, { width: tableWidths[index] });
        x += tableWidths[index];
      });
      y += 14;
      doc.moveTo(tableLeft, y).lineTo(tableLeft + pageWidth, y).strokeColor('#D1D5DB').lineWidth(1).stroke();
      y += 6;
    };

    const renderGroupHeader = (group: { categoryCode: string; categoryName: string; totalAmount: number }) => {
      ensureSpace(24);
      doc.roundedRect(tableLeft, y, pageWidth, 22, 6).fillAndStroke('#F8F4EA', '#E5E7EB');
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text(group.categoryCode, tableLeft + 10, y + 7, { width: 54 });
      doc.text(group.categoryName, tableLeft + 66, y + 7, { width: pageWidth - 180 });
      doc.text(formatCurrency(group.totalAmount), tableLeft + pageWidth - 110, y + 7, { width: 100, align: 'right' });
      y += 28;
    };

    const renderRow = (lineItem: DrawInvoiceLineItem) => {
      ensureSpace(34);
      let x = tableLeft;
      doc.font('Helvetica').fontSize(8.5).fillColor('#111827');
      doc.text(lineItem.itemCode, x, y, { width: tableWidths[0] });
      x += tableWidths[0];
      doc.text(lineItem.itemName, x, y, { width: tableWidths[1] });
      const itemBottom = doc.y;
      doc.font('Helvetica').fontSize(7.5).fillColor('#6B7280').text([lineItem.description, lineItem.costType === 'laborMaterial' ? 'Labor & Material' : lineItem.costType[0].toUpperCase() + lineItem.costType.slice(1)].filter(Boolean).join(' | '), tableLeft + tableWidths[0], y + 12, { width: tableWidths[1] });
      x += tableWidths[1];
      doc.fillColor('#111827').font('Helvetica').fontSize(8.5).text(String(lineItem.quantity), x, y, { width: tableWidths[2], align: 'right' });
      x += tableWidths[2];
      doc.text(formatCurrency(lineItem.unitCost), x, y, { width: tableWidths[3], align: 'right' });
      x += tableWidths[3];
      doc.text(formatCurrency(lineItem.markup), x, y, { width: tableWidths[4], align: 'right' });
      x += tableWidths[4];
      doc.text(formatCurrency(lineItem.totalAmount), x, y, { width: tableWidths[5], align: 'right' });
      x += tableWidths[5];
      doc.text(formatCurrency(lineItem.currentDrawAmount), x, y, { width: tableWidths[6], align: 'right' });
      x += tableWidths[6];
      doc.text(formatCurrency(lineItem.remainingAmount), x, y, { width: tableWidths[7], align: 'right' });
      y = Math.max(y + 18, itemBottom + 18);
      doc.moveTo(tableLeft, y - 6).lineTo(tableLeft + pageWidth, y - 6).strokeColor('#E5E7EB').lineWidth(0.5).stroke();
    };

    if (groupedItems.length === 0) {
      ensureSpace(24);
      doc.font('Helvetica').fontSize(10).fillColor('#6B7280').text('No finalized budget line items were included in this draw.', tableLeft, y, { width: pageWidth });
      y = doc.y + 12;
    } else {
      groupedItems.forEach((group) => {
        renderGroupHeader(group);
        renderTableHeader();
        group.lineItems.forEach(renderRow);
        y += 4;
      });
    }

    ensureSpace(70);
    doc.roundedRect(tableLeft, y, pageWidth, 54, 10).strokeColor('#E5E7EB').lineWidth(1).stroke();
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Total Invoice Amount', tableLeft + 14, y + 14);
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#0F172A').text(formatCurrency(context.totalAmount), tableLeft + 14, y + 28);

    doc.font('Helvetica').fontSize(9).fillColor('#6B7280').text('Generated from final approved budget line items.', tableLeft + pageWidth - 220, y + 20, {
      width: 186,
      align: 'right',
    });

    doc.end();
  });
}

export function generateInvoiceNumber(projectId: string, drawNumber: number): string {
  const prefix = projectId.slice(0, 4).toUpperCase();
  return `INV-${prefix}-${String(drawNumber).padStart(3, '0')}`;
}

export async function ensureProjectExists(projectId: string) {
  const snapshot = await adminDb.collection('projects').doc(projectId).get();

  if (!snapshot.exists) {
    throw new Error('Project not found');
  }

  return { id: snapshot.id, ...(snapshot.data() || {}) };
}
