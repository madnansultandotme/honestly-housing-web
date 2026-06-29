import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateScopeOfWorkHTML } from '@/lib/pdf/scope-of-work-template';
import { getHierarchicalBudgetCategories } from '@/lib/constants/hierarchical-budget-categories';

// GET /api/scope-of-work/export?projectId={id}&format={html|pdf}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const format = searchParams.get('format') || 'html';

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch project data
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    const project = {
      name: projectData?.name || 'Untitled Project',
      address: projectData?.address || '',
      clientEmail: projectData?.clientEmail || '',
    };

    // Fetch budget categories (hierarchical)
    const budgetCategories = getHierarchicalBudgetCategories();
    
    // Try to get project-specific budget from Firestore
    const budgetDoc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('budget')
      .limit(1)
      .get();

    let projectBudget = budgetCategories;
    
    if (!budgetDoc.empty) {
      // Load budget rows to populate amounts
      const budgetRowsSnapshot = await adminDb
        .collection('projects')
        .doc(projectId)
        .collection('budgetRows')
        .get();

      // Map budget rows to categories
      const budgetMap = new Map<string, number>();
      budgetRowsSnapshot.docs.forEach(doc => {
        const rowData = doc.data();
        const categoryCode = rowData.categoryCode;
        const amount = rowData.totalAmount || 0;
        
        if (budgetMap.has(categoryCode)) {
          budgetMap.set(categoryCode, budgetMap.get(categoryCode)! + amount);
        } else {
          budgetMap.set(categoryCode, amount);
        }
      });

      // Update categories with actual budget amounts
      projectBudget = budgetCategories.map(cat => {
        const categoryTotal = budgetMap.get(cat.code) || 0;
        
        // Distribute total across subcategories if needed
        // For now, just put the total on the main category
        return {
          ...cat,
          total: categoryTotal,
          subcategories: cat.subcategories.map((sub, index) => ({
            ...sub,
            amount: index === 0 ? categoryTotal : 0, // Put all on first subcategory for now
          })),
        };
      });
    }

    // Fetch scope of work documents
    const scopesSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('scopeOfWork')
      .get();

    const scopeDocuments = scopesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Generate HTML
    const html = generateScopeOfWorkHTML({
      project,
      budgetCategories: projectBudget,
      scopeDocuments,
    });

    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="scope-of-work-${projectId}.html"`,
        },
      });
    }

    // For PDF, return HTML that can be printed to PDF by browser
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="scope-of-work-${projectId}.html"`,
      },
    });
  } catch (error) {
    console.error('Error exporting scope of work:', error);
    return NextResponse.json(
      { error: 'Failed to export scope of work' },
      { status: 500 }
    );
  }
}
