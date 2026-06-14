import { adminDb, adminStorage } from '@/lib/firebase/admin';
import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib';
import type {
  BudgetRow,
  BudgetStatus,
  BudgetSummary,
  DrawInvoice,
  InvoiceCategorySummary,
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
  categorySummaries: InvoiceCategorySummary[];
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

function getCategoryKey(categoryCode: string, categoryName: string) {
  return `${categoryCode}__${categoryName}`;
}

function getLatestDraw(draws: DrawInvoice[]) {
  return draws.reduce<DrawInvoice | null>((latest, draw) => {
    if (!latest || draw.drawNumber > latest.drawNumber) return draw;
    return latest;
  }, null);
}

function getDrawTotalsByCategory(draw: DrawInvoice | null) {
  const totals: Record<string, number> = {};

  draw?.lineItems.forEach((lineItem) => {
    const key = getCategoryKey(lineItem.categoryCode, lineItem.categoryName);
    totals[key] = (totals[key] || 0) + lineItem.currentDrawAmount;
  });

  return totals;
}

function getCumulativeDrawTotalsByCategory(draws: DrawInvoice[]) {
  return draws.reduce<Record<string, number>>((totals, draw) => {
    draw.lineItems.forEach((lineItem) => {
      const key = getCategoryKey(lineItem.categoryCode, lineItem.categoryName);
      totals[key] = (totals[key] || 0) + lineItem.currentDrawAmount;
    });
    return totals;
  }, {});
}

function getCurrentDrawTotalsByCategory(rows: BudgetRow[], currentAmounts: Record<string, number>) {
  return rows.reduce<Record<string, number>>((totals, row) => {
    const amount = Number(currentAmounts[row.id] || 0);
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

    if (safeAmount > 0) {
      const key = getCategoryKey(row.categoryCode, row.categoryName);
      totals[key] = (totals[key] || 0) + safeAmount;
    }

    return totals;
  }, {});
}

export function buildInvoiceCategorySummaries(
  rows: BudgetRow[],
  draws: DrawInvoice[],
  currentAmounts: Record<string, number>
): InvoiceCategorySummary[] {
  const groupedRows = rows.reduce<Map<string, { categoryCode: string; categoryName: string; budgetTotal: number }>>((groups, row) => {
    const key = getCategoryKey(row.categoryCode, row.categoryName);
    const group = groups.get(key) || {
      categoryCode: row.categoryCode,
      categoryName: row.categoryName,
      budgetTotal: 0,
    };

    group.budgetTotal += row.totalAmount;
    groups.set(key, group);
    return groups;
  }, new Map());

  const latestDrawTotals = getDrawTotalsByCategory(getLatestDraw(draws));
  const cumulativeTotals = getCumulativeDrawTotalsByCategory(draws);
  const currentTotals = getCurrentDrawTotalsByCategory(rows, currentAmounts);

  return Array.from(groupedRows.values()).map((group) => {
    const key = getCategoryKey(group.categoryCode, group.categoryName);
    const totalInvoiced = cumulativeTotals[key] || 0;
    const currentInvoice = currentTotals[key] || 0;

    return {
      categoryCode: group.categoryCode,
      categoryName: group.categoryName,
      budgetTotal: group.budgetTotal,
      lastInvoiced: latestDrawTotals[key] || 0,
      totalInvoiced,
      currentInvoice,
      remainingAmount: Math.max(group.budgetTotal - totalInvoiced - currentInvoice, 0),
    };
  });
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
  const pdfDoc = await PDFDocument.create();
  const pageSize = PageSizes.A4;
  let page = pdfDoc.addPage(pageSize);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marginLeft = 48;
  const marginRight = 48;
  const marginTop = 48;
  const marginBottom = 48;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const contentWidth = pageWidth - marginLeft - marginRight;

  let cursorTop = marginTop;

  const colors = {
    text: rgb(0.07, 0.09, 0.13),
    muted: rgb(0.42, 0.45, 0.52),
    line: rgb(0.82, 0.84, 0.86),
    panel: rgb(0.97, 0.96, 0.92),
    panelBorder: rgb(0.90, 0.89, 0.86),
    accent: rgb(0.72, 0.62, 0.31),
    white: rgb(1, 1, 1),
  };

  const topToPdfY = (topY: number, height = 0) => pageHeight - topY - height;

  const beginNewPage = () => {
    page = pdfDoc.addPage(pageSize);
    cursorTop = marginTop;
  };

  const ensureSpace = (neededHeight: number) => {
    if (cursorTop + neededHeight > pageHeight - marginBottom) {
      beginNewPage();
      return true;
    }
    return false;
  };

  const splitText = (text: string, font = regularFont, size = 10, width = contentWidth) => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [''];

    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines.length > 0 ? lines : [''];
  };

  const drawText = (
    text: string,
    x: number,
    topY: number,
    font = regularFont,
    size = 10,
    color = colors.text,
    options: Record<string, unknown> = {}
  ) => {
    page.drawText(String(text ?? ''), {
      x,
      y: topToPdfY(topY, size),
      size,
      font,
      color,
      ...options,
    });
  };

  const drawWrappedText = (
    text: string,
    x: number,
    topY: number,
    width: number,
    font = regularFont,
    size = 10,
    color = colors.text,
    lineHeight = size + 2
  ) => {
    const lines = splitText(text, font, size, width);
    lines.forEach((line, index) => {
      drawText(line, x, topY + index * lineHeight, font, size, color, { maxWidth: width });
    });
    return Math.max(1, lines.length) * lineHeight;
  };

  const drawLine = (x1: number, yTop: number, x2: number, thickness = 1, color = colors.line) => {
    page.drawLine({
      start: { x: x1, y: topToPdfY(yTop) },
      end: { x: x2, y: topToPdfY(yTop) },
      thickness,
      color,
    });
  };

  const drawPanel = (x: number, topY: number, width: number, height: number, fill = colors.white, border = colors.line) => {
    page.drawRectangle({
      x,
      y: topToPdfY(topY, height),
      width,
      height,
      color: fill,
      borderColor: border,
      borderWidth: 1,
    });
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
    }, new Map<string, { categoryCode: string; categoryName: string; totalAmount: number; lineItems: DrawInvoiceLineItem[] }>())
      .values()
  );
  const remainingBudget = context.categorySummaries.length > 0
    ? context.categorySummaries.reduce((sum, summary) => sum + summary.remainingAmount, 0)
    : Math.max(context.budget.totalAmount - context.totalAmount, 0);

  drawText('Draw Invoice', marginLeft, cursorTop, boldFont, 24, colors.text);
  cursorTop += 34;

  drawText(`Invoice Number: ${context.invoiceNumber}`, marginLeft, cursorTop, regularFont, 10, colors.muted);
  cursorTop += 14;
  drawText(`Draw Number: ${context.drawNumber}`, marginLeft, cursorTop, regularFont, 10, colors.muted);
  cursorTop += 14;
  drawText(`Date: ${context.date}`, marginLeft, cursorTop, regularFont, 10, colors.muted);
  cursorTop += 22;

  const sectionWidth = contentWidth / 3;
  const labelHeight = 12;
  const valueHeight = 14;
  const sectionHeight = 38;

  ensureSpace(sectionHeight + 8);
  drawText('Project', marginLeft, cursorTop, boldFont, 9, colors.muted);
  drawText(String(context.project.name || 'Project'), marginLeft, cursorTop + labelHeight, regularFont, 11, colors.text);
  drawText('Client', marginLeft + sectionWidth, cursorTop, boldFont, 9, colors.muted);
  drawText(context.client?.name || 'Client not assigned', marginLeft + sectionWidth, cursorTop + labelHeight, regularFont, 11, colors.text);
  drawText('Builder / Company', marginLeft + sectionWidth * 2, cursorTop, boldFont, 9, colors.muted);
  drawText(context.builderOrg?.name || 'Builder', marginLeft + sectionWidth * 2, cursorTop + labelHeight, regularFont, 11, colors.text);
  cursorTop += sectionHeight;

  const projectAddress = typeof context.project.address === 'string' ? context.project.address : '';
  if (projectAddress) {
    cursorTop += drawWrappedText(projectAddress, marginLeft, cursorTop, contentWidth, regularFont, 10, colors.muted) + 8;
  }

  ensureSpace(72);
  drawPanel(marginLeft, cursorTop, contentWidth, 64, colors.white, colors.panelBorder);
  const summarySectionWidth = contentWidth / 3;
  drawText('Budget Status', marginLeft + 14, cursorTop + 14, boldFont, 9, colors.muted);
  drawText(context.budget.status === 'finalApprovedBudget' ? 'Final Approved Budget' : 'Draft', marginLeft + 14, cursorTop + 28, regularFont, 11, colors.text);
  drawText('Draw Total', marginLeft + summarySectionWidth + 14, cursorTop + 14, boldFont, 9, colors.muted);
  drawText(formatCurrency(context.totalAmount), marginLeft + summarySectionWidth + 14, cursorTop + 28, regularFont, 11, colors.text);
  drawText('Remaining Budget', marginLeft + summarySectionWidth * 2 + 14, cursorTop + 14, boldFont, 9, colors.muted);
  drawText(formatCurrency(remainingBudget), marginLeft + summarySectionWidth * 2 + 14, cursorTop + 28, regularFont, 11, colors.text);
  cursorTop += 84;

  if (context.categorySummaries.length > 0) {
    ensureSpace(28);
    drawText('Category Invoice Summary', marginLeft, cursorTop, boldFont, 14, colors.text);
    cursorTop += 18;

    const categoryHeaders = ['Code', 'Category', 'Budget', 'Last Invoiced', 'This Invoice', 'Still Left'];
    const categoryWidths = [52, 154, 74, 78, 78, 74];

    const renderCategorySummaryHeader = () => {
      ensureSpace(22);
      let x = marginLeft;
      categoryHeaders.forEach((header, index) => {
        drawText(header, x, cursorTop, boldFont, 8, colors.muted, {
          maxWidth: categoryWidths[index],
          align: index >= 2 ? 'right' : 'left',
        });
        x += categoryWidths[index];
      });
      cursorTop += 14;
      drawLine(marginLeft, cursorTop, marginLeft + contentWidth, 1, colors.line);
      cursorTop += 8;
    };

    renderCategorySummaryHeader();

    context.categorySummaries.forEach((summary) => {
      const categoryNameLines = splitText(summary.categoryName, regularFont, 8.5, categoryWidths[1]);
      const rowHeight = Math.max(20, categoryNameLines.length * 10 + 6);

      ensureSpace(rowHeight + 4);
      let x = marginLeft;
      drawText(summary.categoryCode, x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: categoryWidths[0] });
      x += categoryWidths[0];
      categoryNameLines.forEach((line, index) => {
        drawText(line, x, cursorTop + 2 + index * 10, regularFont, 8.5, colors.text, { maxWidth: categoryWidths[1] });
      });
      x += categoryWidths[1];
      drawText(formatCurrency(summary.budgetTotal), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: categoryWidths[2], align: 'right' });
      x += categoryWidths[2];
      drawText(formatCurrency(summary.lastInvoiced), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: categoryWidths[3], align: 'right' });
      x += categoryWidths[3];
      drawText(formatCurrency(summary.currentInvoice), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: categoryWidths[4], align: 'right' });
      x += categoryWidths[4];
      drawText(formatCurrency(summary.remainingAmount), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: categoryWidths[5], align: 'right' });
      cursorTop += rowHeight;
      drawLine(marginLeft, cursorTop, marginLeft + contentWidth, 0.5, colors.line);
      cursorTop += 4;
    });

    cursorTop += 12;
  }

  ensureSpace(28);
  drawText('Budget Draw Detail', marginLeft, cursorTop, boldFont, 14, colors.text);
  cursorTop += 18;

  const tableHeaders = ['Code', 'Item', 'Qty', 'Unit Cost', 'Markup', 'Total', 'Draw', 'Remaining'];
  const tableWidths = [58, 150, 38, 68, 58, 68, 68, 70];

  const renderTableHeader = () => {
    ensureSpace(22);
    let x = marginLeft;
    tableHeaders.forEach((header, index) => {
      drawText(header, x, cursorTop, boldFont, 8, colors.muted, { maxWidth: tableWidths[index] });
      x += tableWidths[index];
    });
    cursorTop += 14;
    drawLine(marginLeft, cursorTop, marginLeft + contentWidth, 1, colors.line);
    cursorTop += 8;
  };

  const renderGroupHeader = (group: { categoryCode: string; categoryName: string; totalAmount: number }) => {
    ensureSpace(24);
    drawPanel(marginLeft, cursorTop, contentWidth, 22, colors.panel, colors.panelBorder);
    drawText(group.categoryCode, marginLeft + 10, cursorTop + 7, boldFont, 9, colors.text, { maxWidth: 54 });
    drawText(group.categoryName, marginLeft + 66, cursorTop + 7, boldFont, 9, colors.text, { maxWidth: contentWidth - 180 });
    drawText(formatCurrency(group.totalAmount), marginLeft + contentWidth - 110, cursorTop + 7, boldFont, 9, colors.text, { maxWidth: 100 });
    cursorTop += 28;
  };

  const renderRow = (lineItem: DrawInvoiceLineItem) => {
    const descriptor = [
      lineItem.description,
      lineItem.costType === 'laborMaterial' ? 'Labor & Material' : lineItem.costType[0].toUpperCase() + lineItem.costType.slice(1),
    ].filter(Boolean).join(' | ');

    const itemNameLines = splitText(lineItem.itemName, regularFont, 8.5, tableWidths[1]);
    const descriptorLines = splitText(descriptor, regularFont, 7.5, tableWidths[1]);
    const rowHeight = Math.max(26, itemNameLines.length * 10 + descriptorLines.length * 8 + 8);

    ensureSpace(rowHeight + 6);

    let x = marginLeft;
    drawText(lineItem.itemCode, x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: tableWidths[0] });
    x += tableWidths[0];

    itemNameLines.forEach((line, index) => {
      drawText(line, x, cursorTop + 2 + index * 10, regularFont, 8.5, colors.text, { maxWidth: tableWidths[1] });
    });
    descriptorLines.forEach((line, index) => {
      drawText(line, x, cursorTop + 2 + itemNameLines.length * 10 + index * 8, regularFont, 7.5, colors.muted, { maxWidth: tableWidths[1] });
    });
    x += tableWidths[1];

    drawText(String(lineItem.quantity), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: tableWidths[2], align: 'right' });
    x += tableWidths[2];
    drawText(formatCurrency(lineItem.unitCost), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: tableWidths[3], align: 'right' });
    x += tableWidths[3];
    drawText(formatCurrency(lineItem.markup), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: tableWidths[4], align: 'right' });
    x += tableWidths[4];
    drawText(formatCurrency(lineItem.totalAmount), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: tableWidths[5], align: 'right' });
    x += tableWidths[5];
    drawText(formatCurrency(lineItem.currentDrawAmount), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: tableWidths[6], align: 'right' });
    x += tableWidths[6];
    drawText(formatCurrency(lineItem.remainingAmount), x, cursorTop + 2, regularFont, 8.5, colors.text, { maxWidth: tableWidths[7], align: 'right' });

    cursorTop += rowHeight;
    drawLine(marginLeft, cursorTop, marginLeft + contentWidth, 0.5, colors.line);
    cursorTop += 4;
  };

  if (groupedItems.length === 0) {
    ensureSpace(24);
    drawText('No finalized budget line items were included in this draw.', marginLeft, cursorTop, regularFont, 10, colors.muted, { maxWidth: contentWidth });
    cursorTop += 14;
  } else {
    groupedItems.forEach((group) => {
      renderGroupHeader(group);
      renderTableHeader();
      group.lineItems.forEach((lineItem) => renderRow(lineItem));
      cursorTop += 4;
    });
  }

  ensureSpace(70);
  drawPanel(marginLeft, cursorTop, contentWidth, 54, colors.white, colors.panelBorder);
  drawText('Total Invoice Amount', marginLeft + 14, cursorTop + 14, boldFont, 11, colors.text);
  drawText(formatCurrency(context.totalAmount), marginLeft + 14, cursorTop + 28, boldFont, 15, rgb(0.06, 0.09, 0.17));
  drawText('Generated from final approved budget line items.', marginLeft + contentWidth - 220, cursorTop + 20, regularFont, 9, colors.muted, {
    maxWidth: 186,
    align: 'right',
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
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
