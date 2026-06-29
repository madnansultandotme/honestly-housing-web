/**
 * Scope of Work PDF Generation
 * Generates a comprehensive PDF document from scope of work data
 */

import { HierarchicalBudgetCategory, calculateCategoryTotal } from '@/lib/constants/hierarchical-budget-categories';
import { ScopeOfWorkDocument } from '@/lib/scope-of-work/types';
import { formatPlumbingSummary, formatElectricalSummary } from '@/lib/scope-of-work/integration';

interface Project {
  name: string;
  address?: string;
  clientEmail?: string;
}

interface ScopeOfWorkPDFData {
  project: Project;
  budgetCategories: HierarchicalBudgetCategory[];
  scopeDocuments: ScopeOfWorkDocument[];
}

/**
 * Generate HTML for Scope of Work PDF
 */
export function generateScopeOfWorkHTML(data: ScopeOfWorkPDFData): string {
  const { project, budgetCategories, scopeDocuments } = data;

  // Create a map for quick lookup
  const scopeMap = new Map<string, ScopeOfWorkDocument>();
  scopeDocuments.forEach(scope => {
    scopeMap.set(scope.categoryId, scope);
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Scope of Work - ${project.name}</title>
  <style>
    @page {
      margin: 0.75in;
      size: letter;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid #b8860b;
    }
    
    .header h1 {
      font-size: 28pt;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }
    
    .header .subtitle {
      font-size: 14pt;
      color: #6b7280;
      margin: 0.25rem 0;
    }
    
    .project-info {
      background-color: #f9fafb;
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .project-info table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .project-info td {
      padding: 0.5rem;
      vertical-align: top;
    }
    
    .project-info .label {
      font-weight: 600;
      color: #374151;
      width: 30%;
    }
    
    .budget-summary {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    
    .budget-summary h2 {
      font-size: 18pt;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #b8860b;
    }
    
    .budget-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    
    .budget-table th {
      background-color: #b8860b;
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border: 1px solid #9a7209;
    }
    
    .budget-table td {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
    }
    
    .budget-table tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    .budget-total {
      font-weight: bold;
      background-color: #fef3c7 !important;
    }
    
    .scope-section {
      margin-bottom: 2rem;
      page-break-inside: avoid;
    }
    
    .scope-header {
      background-color: #f3f4f6;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      border-left: 4px solid #b8860b;
    }
    
    .scope-header h3 {
      font-size: 16pt;
      font-weight: bold;
      color: #1f2937;
      margin: 0;
    }
    
    .scope-header .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 600;
      margin-left: 1rem;
    }
    
    .status-completed {
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .status-skipped {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .scope-content {
      padding: 0 1rem;
    }
    
    .field-group {
      margin-bottom: 1rem;
    }
    
    .field-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.25rem;
    }
    
    .field-value {
      color: #4b5563;
      margin-left: 1rem;
    }
    
    .checkbox-list {
      list-style: none;
      padding-left: 0;
      margin: 0.5rem 0;
    }
    
    .checkbox-list li {
      padding: 0.25rem 0;
    }
    
    .checkbox-checked::before {
      content: "☑ ";
      color: #059669;
      font-weight: bold;
    }
    
    .checkbox-unchecked::before {
      content: "☐ ";
      color: #9ca3af;
    }
    
    .room-summary {
      background-color: #eff6ff;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
    }
    
    .room-summary-title {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }
    
    .room-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid #dbeafe;
    }
    
    .room-item:last-child {
      border-bottom: none;
    }
    
    .room-name {
      font-weight: 600;
      color: #1e3a8a;
    }
    
    .fixture-list {
      color: #3b82f6;
      margin-left: 1rem;
    }
    
    .notes-section {
      background-color: #fef9e7;
      padding: 1rem;
      margin-top: 1rem;
      border-radius: 4px;
      border: 1px solid #fde68a;
    }
    
    .notes-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.5rem;
    }
    
    .files-section {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f3f4f6;
      border-radius: 4px;
    }
    
    .files-title {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }
    
    .file-list {
      list-style: none;
      padding-left: 0;
      margin: 0.5rem 0;
    }
    
    .file-list li {
      padding: 0.25rem 0;
      color: #6b7280;
    }
    
    .footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>Scope of Work</h1>
    <div class="subtitle">${project.name}</div>
    <div class="subtitle">${currentDate}</div>
  </div>

  <!-- Project Information -->
  <div class="project-info">
    <table>
      <tr>
        <td class="label">Project Name:</td>
        <td>${project.name}</td>
      </tr>
      ${project.address ? `
      <tr>
        <td class="label">Address:</td>
        <td>${project.address}</td>
      </tr>
      ` : ''}
      ${project.clientEmail ? `
      <tr>
        <td class="label">Client:</td>
        <td>${project.clientEmail}</td>
      </tr>
      ` : ''}
      <tr>
        <td class="label">Date Generated:</td>
        <td>${currentDate}</td>
      </tr>
    </table>
  </div>

  <!-- Budget Summary -->
  <div class="budget-summary">
    <h2>Construction Budget Summary</h2>
    <table class="budget-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Category</th>
          <th style="text-align: right;">Budget Amount</th>
        </tr>
      </thead>
      <tbody>
        ${budgetCategories.map(cat => {
          const total = calculateCategoryTotal(cat);
          if (total === 0) return '';
          
          return `
        <tr>
          <td><strong>${cat.code}</strong></td>
          <td><strong>${cat.name}</strong></td>
          <td style="text-align: right;"><strong>$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
        </tr>
        ${cat.subcategories.filter(sub => (sub.amount || 0) > 0).map(sub => `
        <tr>
          <td></td>
          <td style="padding-left: 2rem;">${sub.name}</td>
          <td style="text-align: right;">$${(sub.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
        `).join('')}
          `;
        }).join('')}
        <tr class="budget-total">
          <td colspan="2" style="text-align: right; padding-right: 1rem;">Grand Total:</td>
          <td style="text-align: right;">$${budgetCategories.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- Scope of Work Details -->
  ${budgetCategories.map(cat => {
    const scope = scopeMap.get(cat.id);
    const total = calculateCategoryTotal(cat);
    
    if (total === 0 || !scope) return '';
    
    return generateCategoryScopeHTML(cat, scope);
  }).join('')}

  <!-- Footer -->
  <div class="footer">
    <p>This document was generated electronically and contains the agreed-upon scope of work for the project.</p>
    <p>© ${new Date().getFullYear()} Honestly Housing. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for a single category's scope
 */
function generateCategoryScopeHTML(category: HierarchicalBudgetCategory, scope: ScopeOfWorkDocument): string {
  const statusClass = scope.status === 'completed' ? 'status-completed' : 'status-skipped';
  const statusText = scope.status === 'completed' ? 'Completed' : 'Skipped';

  let contentHTML = '';

  // Generate content based on category type and data
  const lowerName = category.name.toLowerCase();

  if (lowerName.includes('roofing') && scope.data?.options) {
    contentHTML = generateRoofingContent(scope.data);
  } else if (lowerName.includes('insulation') && scope.data?.exteriorWalls) {
    contentHTML = generateInsulationContent(scope.data);
  } else if (lowerName.includes('hvac') && scope.data?.systemType) {
    contentHTML = generateHVACContent(scope.data);
  } else if (lowerName.includes('plumbing') && scope.data?.roomSummary) {
    contentHTML = generatePlumbingContent(scope.data);
  } else if (lowerName.includes('electrical') && scope.data?.roomSummary) {
    contentHTML = generateElectricalContent(scope.data);
  }

  return `
  <div class="scope-section">
    <div class="scope-header">
      <h3>${category.code}. ${category.name}</h3>
      <span class="status ${statusClass}">${statusText}</span>
    </div>
    <div class="scope-content">
      ${contentHTML}
      
      ${scope.notes ? `
      <div class="notes-section">
        <div class="notes-title">Notes:</div>
        <div>${scope.notes.replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}
      
      ${scope.files && scope.files.length > 0 ? `
      <div class="files-section">
        <div class="files-title">Attached Documents (${scope.files.length}):</div>
        <ul class="file-list">
          ${scope.files.map((_, index) => `<li>Document ${index + 1}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
  </div>
  `;
}

function generateRoofingContent(data: any): string {
  return `
    <div class="field-group">
      <div class="field-label">Roofing Materials:</div>
      <ul class="checkbox-list">
        <li class="${data.options.composite30Year ? 'checkbox-checked' : 'checkbox-unchecked'}">Composite 30 Year</li>
        <li class="${data.options.rPanel ? 'checkbox-checked' : 'checkbox-unchecked'}">R Panel</li>
        <li class="${data.options.standingSeamMetal ? 'checkbox-checked' : 'checkbox-unchecked'}">Standing Seam Metal</li>
        <li class="${data.options.accents ? 'checkbox-checked' : 'checkbox-unchecked'}">Accents</li>
      </ul>
    </div>
  `;
}

function generateInsulationContent(data: any): string {
  const sections = [
    { key: 'exteriorWalls', label: 'Exterior walls of improved living areas' },
    { key: 'otherWalls', label: 'Walls in other areas of the home' },
    { key: 'ceilings', label: 'Ceilings on improved living areas' },
    { key: 'floors', label: 'Floors of improved living areas not applied to a slab foundation' },
    { key: 'otherAreas', label: 'Other Insulated areas' },
  ];

  return sections.map((section, index) => {
    const sectionData = data[section.key];
    if (!sectionData || (!sectionData.insulationType && !sectionData.thickness && !sectionData.rValue)) {
      return '';
    }

    return `
    <div class="field-group">
      <div class="field-label">${index + 1}. ${section.label}:</div>
      <div class="field-value">
        ${sectionData.insulationType ? `Type: ${sectionData.insulationType}<br>` : ''}
        ${sectionData.thickness ? `Thickness: ${sectionData.thickness} inches<br>` : ''}
        ${sectionData.rValue ? `R-Value: ${sectionData.rValue}` : ''}
      </div>
    </div>
    `;
  }).join('');
}

function generateHVACContent(data: any): string {
  return `
    <div class="field-group">
      <div class="field-label">System Type:</div>
      <div class="field-value">${data.systemType ? data.systemType.charAt(0).toUpperCase() + data.systemType.slice(1) : 'Not specified'}</div>
    </div>
    ${data.size ? `
    <div class="field-group">
      <div class="field-label">Size:</div>
      <div class="field-value">${data.size} Ton</div>
    </div>
    ` : ''}
    ${data.brand ? `
    <div class="field-group">
      <div class="field-label">Brand:</div>
      <div class="field-value">${data.brand}</div>
    </div>
    ` : ''}
    ${data.interiorUnitLocation ? `
    <div class="field-group">
      <div class="field-label">Interior Unit Location:</div>
      <div class="field-value">${data.interiorUnitLocation}</div>
    </div>
    ` : ''}
    ${data.exteriorUnitLocation ? `
    <div class="field-group">
      <div class="field-label">Exterior Unit Location:</div>
      <div class="field-value">${data.exteriorUnitLocation}</div>
    </div>
    ` : ''}
  `;
}

function generatePlumbingContent(data: any): string {
  return `
    ${data.roomSummary && data.roomSummary.length > 0 ? `
    <div class="room-summary">
      <div class="room-summary-title">Plumbing Fixtures by Room:</div>
      ${data.roomSummary.map((room: any) => `
        <div class="room-item">
          <div class="room-name">${room.roomName}</div>
          <div class="fixture-list">${formatPlumbingSummary(room)}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.gasAppliances && data.gasAppliances.length > 0 ? `
    <div class="field-group">
      <div class="field-label">Gas Appliances:</div>
      <ul class="field-value" style="list-style: disc; margin-left: 2rem;">
        ${data.gasAppliances.map((appliance: string) => `<li>${appliance}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${data.fireplace?.type ? `
    <div class="field-group">
      <div class="field-label">Fireplace:</div>
      <div class="field-value">Type: ${data.fireplace.type.charAt(0).toUpperCase() + data.fireplace.type.slice(1)}${data.fireplace.location ? ` | Location: ${data.fireplace.location}` : ''}</div>
    </div>
    ` : ''}
    
    ${data.waterHeater?.type ? `
    <div class="field-group">
      <div class="field-label">Water Heater:</div>
      <div class="field-value">
        Type: ${data.waterHeater.type.charAt(0).toUpperCase() + data.waterHeater.type.slice(1).replace(/([A-Z])/g, ' $1')}
        ${data.waterHeater.location ? `<br>Location: ${data.waterHeater.location === 'other' ? data.waterHeater.otherLocation : data.waterHeater.location.charAt(0).toUpperCase() + data.waterHeater.location.slice(1)}` : ''}
      </div>
    </div>
    ` : ''}
    
    ${typeof data.outdoorGrill === 'boolean' ? `
    <div class="field-group">
      <div class="field-label">Outdoor Grill:</div>
      <div class="field-value">${data.outdoorGrill ? 'Yes' : 'No'}</div>
    </div>
    ` : ''}
    
    ${typeof data.propane === 'boolean' ? `
    <div class="field-group">
      <div class="field-label">Propane:</div>
      <div class="field-value">${data.propane ? 'Yes' : 'No'}${data.propane && data.propaneLocation ? ` | Location: ${data.propaneLocation}` : ''}</div>
    </div>
    ` : ''}
  `;
}

function generateElectricalContent(data: any): string {
  return `
    ${data.roomSummary && data.roomSummary.length > 0 ? `
    <div class="room-summary">
      <div class="room-summary-title">Electrical Fixtures by Room:</div>
      ${data.roomSummary.map((room: any) => `
        <div class="room-item">
          <div class="room-name">${room.roomName}</div>
          <div class="fixture-list">${formatElectricalSummary(room)}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.additionalNotes ? `
    <div class="field-group">
      <div class="field-label">Additional Specifications:</div>
      <div class="field-value">${data.additionalNotes.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}
  `;
}
