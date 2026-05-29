import { NextRequest, NextResponse } from 'next/server';
import { loadBudgetState } from '@/lib/budget/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const state = await loadBudgetState(projectId);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Get budget state error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load budget' },
      { status: 500 }
    );
  }
}
