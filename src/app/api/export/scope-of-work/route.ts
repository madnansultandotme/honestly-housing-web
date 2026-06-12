import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET - Export scope of work for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const format = searchParams.get('format') || 'txt'; // txt, md, or html

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Get project details
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();

    // Get categories with scope of work
    const categoriesSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('categories')
      .orderBy('displayOrder', 'asc')
      .get();

    const categories = categoriesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((cat: any) => cat.scopeOfWork && cat.scopeOfWork.trim().length > 0);

    if (categories.length === 0) {
      return NextResponse.json(
        { error: 'No scope of work defined for this project' },
        { status: 404 }
      );
    }

    // Generate content based on format
    let content: string;
    let contentType: string;
    let filename: string;

    const projectName = projectData?.name || 'Project';
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    switch (format) {
      case 'md':
        content = generateMarkdown(projectName, projectData?.address, date, categories);
        contentType = 'text/markdown';
        filename = `${projectName.replace(/\s+/g, '_')}_Scope_of_Work.md`;
        break;
      
      case 'html':
        content = generateHTML(projectName, projectData?.address, date, categories);
        contentType = 'text/html';
        filename = `${projectName.replace(/\s+/g, '_')}_Scope_of_Work.html`;
        break;
      
      case 'txt':
      default:
        content = generatePlainText(projectName, projectData?.address, date, categories);
        contentType = 'text/plain';
        filename = `${projectName.replace(/\s+/g, '_')}_Scope_of_Work.txt`;
        break;
    }

    // Return as downloadable file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Export scope of work error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export scope of work' },
      { status: 500 }
    );
  }
}

function generatePlainText(projectName: string, address: string, date: string, categories: any[]): string {
  let content = '';
  
  content += '='.repeat(60) + '\n';
  content += `SCOPE OF WORK\n`;
  content += '='.repeat(60) + '\n\n';
  
  content += `Project: ${projectName}\n`;
  if (address) content += `Address: ${address}\n`;
  content += `Generated: ${date}\n`;
  content += '\n' + '-'.repeat(60) + '\n\n';

  categories.forEach((category: any, index: number) => {
    content += `${index + 1}. ${category.name.toUpperCase()}\n`;
    content += '-'.repeat(60) + '\n\n';
    
    if (category.required) {
      content += `Status: REQUIRED\n\n`;
    }
    
    if (category.allowanceAmount && category.allowanceAmount > 0) {
      const allowanceType = category.allowanceType === 'perSqFt' ? 'per sq ft' : 'fixed amount';
      content += `Budget: $${category.allowanceAmount.toLocaleString()} (${allowanceType})\n\n`;
    }
    
    content += `${category.scopeOfWork}\n\n`;
    content += '\n';
  });

  content += '='.repeat(60) + '\n';
  content += 'END OF SCOPE OF WORK\n';
  content += '='.repeat(60) + '\n';

  return content;
}

function generateMarkdown(projectName: string, address: string, date: string, categories: any[]): string {
  let content = '';
  
  content += `# Scope of Work\n\n`;
  content += `## ${projectName}\n\n`;
  
  if (address) content += `**Address:** ${address}\n\n`;
  content += `**Generated:** ${date}\n\n`;
  content += `---\n\n`;

  categories.forEach((category: any, index: number) => {
    content += `## ${index + 1}. ${category.name}\n\n`;
    
    if (category.required) {
      content += `> **Status:** REQUIRED\n\n`;
    }
    
    if (category.allowanceAmount && category.allowanceAmount > 0) {
      const allowanceType = category.allowanceType === 'perSqFt' ? 'per sq ft' : 'fixed amount';
      content += `**Budget:** $${category.allowanceAmount.toLocaleString()} (${allowanceType})\n\n`;
    }
    
    content += `${category.scopeOfWork}\n\n`;
    content += `---\n\n`;
  });

  return content;
}

function generateHTML(projectName: string, address: string, date: string, categories: any[]): string {
  let content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scope of Work - ${projectName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 {
      color: #B8860B;
      border-bottom: 3px solid #B8860B;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #2c3e50;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    .header-info {
      background: #f5f5dc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header-info p {
      margin: 5px 0;
    }
    .category {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
    }
    .category-header {
      margin-bottom: 15px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    .badge-required {
      background: #fee;
      color: #c00;
    }
    .budget {
      color: #B8860B;
      font-weight: bold;
      margin: 10px 0;
    }
    .scope-content {
      white-space: pre-wrap;
      line-height: 1.8;
      color: #555;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .category {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>Scope of Work</h1>
  
  <div class="header-info">
    <p><strong>Project:</strong> ${projectName}</p>`;
  
  if (address) {
    content += `\n    <p><strong>Address:</strong> ${address}</p>`;
  }
  
  content += `\n    <p><strong>Generated:</strong> ${date}</p>
  </div>\n\n`;

  categories.forEach((category: any, index: number) => {
    content += `  <div class="category">
    <div class="category-header">
      <h2>${index + 1}. ${category.name}`;
    
    if (category.required) {
      content += `<span class="badge badge-required">REQUIRED</span>`;
    }
    
    content += `</h2>\n`;
    
    if (category.allowanceAmount && category.allowanceAmount > 0) {
      const allowanceType = category.allowanceType === 'perSqFt' ? 'per sq ft' : 'fixed amount';
      content += `      <p class="budget">Budget: $${category.allowanceAmount.toLocaleString()} (${allowanceType})</p>\n`;
    }
    
    content += `    </div>
    <div class="scope-content">${category.scopeOfWork}</div>
  </div>\n\n`;
  });

  content += `  <div class="footer">
    <p>End of Scope of Work</p>
  </div>
</body>
</html>`;

  return content;
}
