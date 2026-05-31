import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage, isAdminInitialized } from '@/lib/firebase/admin';
import {
  calculateInvoiceLineItems,
  ensureBudgetDocument,
  ensureProjectExists,
  generateInvoiceNumber,
  getInvoiceDownloadUrl,
  getNextDrawNumber,
  loadBudgetState,
  buildInvoicePdfBuffer,
  saveInvoicePdf,
} from '@/lib/budget/service';

function toParticipant(source: Record<string, unknown> & { id: string } | null, fallbackName: string) {
  if (!source) {
    return null;
  }

  const name = typeof source.displayName === 'string'
    ? source.displayName
    : typeof source.name === 'string'
      ? source.name
      : typeof source.email === 'string'
        ? source.email
        : fallbackName;

  return {
    id: source.id,
    name,
    email: typeof source.email === 'string' ? source.email : null,
    phone: typeof source.phone === 'string' ? source.phone : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const state = await loadBudgetState(projectId);
    return NextResponse.json({ success: true, draws: state.draws });
  } catch (error) {
    console.error('Get draw invoices error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load draw invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { projectId, amounts, createdBy, date } = payload;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    await ensureProjectExists(projectId);
    const budget = await ensureBudgetDocument(projectId);
    if (budget.status !== 'finalApprovedBudget') {
      return NextResponse.json({ error: 'Finalize the budget before creating draw invoices' }, { status: 409 });
    }

    const state = await loadBudgetState(projectId);
    const calculation = calculateInvoiceLineItems(state.rows, state.draws, amounts || {});

    if (calculation.errors.length > 0) {
      return NextResponse.json({ error: calculation.errors.join(' ') }, { status: 400 });
    }

    if (calculation.lineItems.length === 0) {
      return NextResponse.json({ error: 'Enter at least one draw amount greater than 0' }, { status: 400 });
    }

    const drawNumber = getNextDrawNumber(state.draws);
    const invoiceNumber = generateInvoiceNumber(projectId, drawNumber);
    const drawId = adminDb.collection('projects').doc(projectId).collection('drawInvoices').doc().id;
    const invoiceDate = typeof date === 'string' && date ? date : new Date().toISOString().slice(0, 10);

    // Diagnostic logging for PDF generation/storage
    console.log('PDF generation: FIREBASE_STORAGE_BUCKET=', process.env.FIREBASE_STORAGE_BUCKET);
    console.log('PDF generation: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    console.log('PDF generation: admin initialized=', isAdminInitialized());

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await buildInvoicePdfBuffer({
        project: state.project,
        client: toParticipant(state.client, 'Client'),
        builderOrg: toParticipant(state.builderOrg, 'Builder'),
        budget,
        drawNumber,
        invoiceNumber,
        date: invoiceDate,
        lineItems: calculation.lineItems,
        totalAmount: calculation.totalAmount,
      });
      console.log('PDF generation: buffer bytes=', Buffer.byteLength(pdfBuffer));
    } catch (err) {
      console.error('Error generating PDF buffer:', err instanceof Error ? err.stack || err.message : err);
      throw err;
    }

    let pdfPath: string;
    try {
      pdfPath = await saveInvoicePdf(projectId, drawId, pdfBuffer);
      console.log('PDF saved to path:', pdfPath);
    } catch (err) {
      console.error('Error saving PDF to storage:', err instanceof Error ? err.stack || err.message : err);
      throw err;
    }
    const downloadUrl = getInvoiceDownloadUrl(projectId, drawId);
    const createdAt = new Date().toISOString();

    const drawRecord = {
      drawNumber,
      invoiceNumber,
      date: invoiceDate,
      totalAmount: calculation.totalAmount,
      pdfPath,
      downloadUrl,
      createdAt,
      createdBy: typeof createdBy === 'string' ? createdBy : '',
      lineItems: calculation.lineItems,
    };

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('drawInvoices')
      .doc(drawId)
      .set(drawRecord);

    return NextResponse.json({
      success: true,
      draw: {
        id: drawId,
        ...drawRecord,
      },
    });
  } catch (error) {
    console.error('Create draw invoice error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create draw invoice' },
      { status: 500 }
    );
  }
}
