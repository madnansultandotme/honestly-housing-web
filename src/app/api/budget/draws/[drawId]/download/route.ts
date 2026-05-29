import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { readInvoicePdf } from '@/lib/budget/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ drawId: string }> }
) {
  try {
    const { drawId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('drawInvoices')
      .doc(drawId)
      .get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const pdfBuffer = await readInvoicePdf(projectId, drawId);
    const invoiceNumber = typeof snapshot.data()?.invoiceNumber === 'string' ? snapshot.data()?.invoiceNumber : drawId;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Download draw invoice error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download invoice' },
      { status: 500 }
    );
  }
}
