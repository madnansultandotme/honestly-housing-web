import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ensureBudgetDocument } from '@/lib/budget/service';

const allowedCostTypes = new Set(['labor', 'material', 'laborMaterial']);

function toNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getProjectId(request: NextRequest) {
  return new URL(request.url).searchParams.get('projectId');
}

async function assertDraftBudget(projectId: string) {
  const budget = await ensureBudgetDocument(projectId);

  if (budget.status === 'finalApprovedBudget') {
    throw new Error('Finalized budgets are read-only');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rowId } = await params;
    const projectId = getProjectId(request);

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const payload = await request.json();
    const updates: Record<string, unknown> = {};

    await assertDraftBudget(projectId);

    if (typeof payload.categoryCode === 'string') updates.categoryCode = payload.categoryCode;
    if (typeof payload.categoryName === 'string') updates.categoryName = payload.categoryName;
    if (typeof payload.itemCode === 'string') updates.itemCode = payload.itemCode;
    if (typeof payload.itemName === 'string') updates.itemName = payload.itemName;
    if (typeof payload.description === 'string') updates.description = payload.description;
    if (typeof payload.costType === 'string') {
      if (!allowedCostTypes.has(payload.costType)) {
        return NextResponse.json(
          { error: 'costType must be Labor, Material, or Labor & Material' },
          { status: 400 }
        );
      }
      updates.costType = payload.costType;
    }
    if (payload.quantity !== undefined) {
      const numericQuantity = toNumber(payload.quantity);
      if (numericQuantity < 0) {
        return NextResponse.json({ error: 'quantity must be a valid non-negative number' }, { status: 400 });
      }
      updates.quantity = numericQuantity;
    }
    if (payload.unitCost !== undefined) {
      const numericUnitCost = toNumber(payload.unitCost);
      if (numericUnitCost < 0) {
        return NextResponse.json({ error: 'unitCost must be a valid non-negative number' }, { status: 400 });
      }
      updates.unitCost = numericUnitCost;
    }
    if (payload.markup !== undefined) {
      const numericMarkup = toNumber(payload.markup);
      if (numericMarkup < 0) {
        return NextResponse.json({ error: 'markup must be a valid non-negative number' }, { status: 400 });
      }
      updates.markup = numericMarkup;
    }

    const currentQuantity = typeof updates.quantity === 'number' ? updates.quantity : toNumber(payload.quantity ?? 0);
    const currentUnitCost = typeof updates.unitCost === 'number' ? updates.unitCost : toNumber(payload.unitCost ?? 0);
    const currentMarkup = typeof updates.markup === 'number' ? updates.markup : toNumber(payload.markup ?? 0);
    updates.totalAmount = currentQuantity * currentUnitCost + currentMarkup;

    updates.updatedAt = new Date().toISOString();

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('budgetRows')
      .doc(rowId)
      .set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update budget row error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update budget row' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rowId } = await params;
    const projectId = getProjectId(request);

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    await assertDraftBudget(projectId);

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('budgetRows')
      .doc(rowId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete budget row error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete budget row' },
      { status: 500 }
    );
  }
}
