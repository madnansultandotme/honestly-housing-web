import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET - Export materials list as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Get all approved selections for the project
    const snapshot = await adminDb
      .collection('selections')
      .where('projectId', '==', projectId)
      .where('status', '==', 'approved')
      .get();

    const selections = snapshot.docs.map(doc => doc.data());

    // Generate CSV
    const csvHeaders = 'Category,Item Name,Brand,Quantity,Price,Link,Notes\n';
    const csvRows = selections.map(selection => {
      return [
        selection.categoryName || '',
        selection.name || '',
        selection.brand || '',
        selection.quantity || 1,
        selection.actualCost || selection.allowance || 0,
        selection.linkUrl || '',
        selection.notes || '',
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    const csv = csvHeaders + csvRows;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="materials-list-${projectId}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export materials error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export materials' },
      { status: 500 }
    );
  }
}
