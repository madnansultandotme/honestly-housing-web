import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ensureBudgetDocument } from '@/lib/budget/service';

const allowedCostTypes = new Set(['labor', 'material', 'laborMaterial']);

function toNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { projectId, categoryCode, categoryName, itemCode, itemName, description, quantity, unitCost, markup, costType } = payload;

    if (!projectId || !categoryCode || !categoryName || !itemCode || !itemName || !costType) {
      return NextResponse.json(
        { error: 'projectId, categoryCode, categoryName, itemCode, itemName, and costType are required' },
        { status: 400 }
      );
    }

    if (!allowedCostTypes.has(costType)) {
      return NextResponse.json(
        { error: 'costType must be Labor, Material, or Labor & Material' },
        { status: 400 }
      );
    }

    const numericQuantity = toNumber(quantity);
    const numericUnitCost = toNumber(unitCost);
    const numericMarkup = toNumber(markup);

    if (numericQuantity < 0 || numericUnitCost < 0 || numericMarkup < 0) {
      return NextResponse.json(
        { error: 'quantity, unitCost, and markup must be valid non-negative numbers' },
        { status: 400 }
      );
    }

    const totalAmount = numericQuantity * numericUnitCost + numericMarkup;

    const budget = await ensureBudgetDocument(projectId);
    if (budget.status === 'finalApprovedBudget') {
      return NextResponse.json(
        { error: 'Finalized budgets are read-only' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const rowRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('budgetRows')
      .add({
        categoryCode,
        categoryName,
        itemCode,
        itemName,
        description: typeof description === 'string' ? description : '',
        quantity: numericQuantity,
        unitCost: numericUnitCost,
        markup: numericMarkup,
        totalAmount,
        costType,
        createdAt: now,
        updatedAt: now,
      });

    await adminDb.collection('projects').doc(projectId).collection('budget').doc('main').set(
      {
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      row: {
        id: rowRef.id,
        categoryCode,
        categoryName,
        itemCode,
        itemName,
        description: typeof description === 'string' ? description : '',
        quantity: numericQuantity,
        unitCost: numericUnitCost,
        markup: numericMarkup,
        totalAmount,
        costType,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Create budget row error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create budget row' },
      { status: 500 }
    );
  }
}
