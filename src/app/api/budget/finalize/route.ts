import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ensureBudgetDocument } from '@/lib/budget/service';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { projectId, finalizedBy } = payload;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const budget = await ensureBudgetDocument(projectId);
    if (budget.status === 'finalApprovedBudget') {
      return NextResponse.json({ error: 'Budget is already finalized' }, { status: 409 });
    }

    const rowsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('budgetRows')
      .orderBy('createdAt', 'asc')
      .get();

    const rows = rowsSnapshot.docs.map((doc) => doc.data() as Record<string, unknown>);
    const totalAmount = rows.reduce((sum, row) => sum + (typeof row.totalAmount === 'number' ? row.totalAmount : 0), 0);
    const now = new Date().toISOString();

    const finalBudget = {
      id: 'main',
      status: 'finalApprovedBudget',
      totalAmount,
      createdAt: budget.createdAt,
      updatedAt: now,
      finalizedAt: now,
      finalizedBy: typeof finalizedBy === 'string' ? finalizedBy : null,
    };

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('budget')
      .doc('main')
      .set(finalBudget, { merge: true });

    return NextResponse.json({ success: true, budget: finalBudget });
  } catch (error) {
    console.error('Finalize budget error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to finalize budget' },
      { status: 500 }
    );
  }
}
