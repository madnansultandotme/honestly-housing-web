# Scope of Work Download Feature

## Overview

The Scope of Work Download feature allows builders and designers to export detailed scope of work documentation for all project categories in multiple formats. This is useful for sharing with contractors, clients, or keeping as project documentation.

## Features

### Export Formats

Three export formats are supported:

1. **Plain Text (.txt)**
   - Simple, readable text format
   - No formatting or styling
   - Universal compatibility
   - Best for: Email, simple documentation

2. **Markdown (.md)**
   - Formatted text with markdown syntax
   - Headers, lists, and emphasis
   - Compatible with documentation tools
   - Best for: GitHub, documentation systems, technical specs

3. **HTML (.html)**
   - Fully styled web page
   - Professional appearance with project branding
   - Print-friendly styles
   - Best for: Printing, presentations, client-facing documents

### Document Content

Each exported document includes:

- **Project Information**
  - Project name
  - Address (if available)
  - Generation date

- **Category Details** (for each category with scope of work defined)
  - Category name
  - Required/Optional status
  - Budget allocation (if set)
  - Detailed scope of work description

### Access Points

The download button is available in two locations:

1. **Project Detail Page** (`/projects/[id]`)
   - In the header actions area
   - Next to Export CSV button
   - Visible to builders, designers, and admins only

2. **Project Setup/Configuration Page** (`/projects/[id]/setup`)
   - In the header actions area
   - Next to Save Configuration button
   - Visible to builders, designers, and admins only

## User Interface

### Download Button

- **Default Button**: "Download Scope of Work"
  - Click to download as Plain Text (.txt)
  - Icon: Document download icon

- **Format Selector**: Dropdown arrow button
  - Click to open format selection menu
  - Choose from three formats with descriptions

### Format Selection Menu

When the dropdown arrow is clicked, a menu appears with three options:

1. **Plain Text (.txt)**
   - Icon: Document icon
   - Description: "Simple text format"

2. **Markdown (.md)**
   - Icon: File icon
   - Description: "Formatted text for documentation"

3. **HTML (.html)**
   - Icon: Code icon
   - Description: "Styled web page (printable)"

## Technical Implementation

### API Endpoint

**Route:** `/api/export/scope-of-work`

**Method:** GET

**Query Parameters:**
- `projectId` (required) - The project ID
- `format` (optional) - Export format: `txt`, `md`, or `html` (default: `txt`)

**Response:**
- Content-Type: Varies by format
  - `text/plain` for .txt
  - `text/markdown` for .md
  - `text/html` for .html
- Content-Disposition: `attachment; filename="[ProjectName]_Scope_of_Work.[ext]"`

**Error Responses:**
- 400: Missing projectId
- 404: Project not found or no scope of work defined
- 500: Server error

### Component

**Component:** `ScopeOfWorkDownload.tsx`

**Props:**
```typescript
interface ScopeOfWorkDownloadProps {
  projectId: string;
  projectName?: string;
  className?: string;
}
```

**State:**
- `downloading`: boolean - Download in progress
- `showFormatMenu`: boolean - Format menu visibility
- `error`: string - Error message if download fails

**Features:**
- Format selection dropdown
- Loading state during download
- Error handling and display
- Automatic file naming based on project
- Click-outside-to-close for menu

### File Naming

Downloaded files are automatically named using the pattern:
```
[ProjectName]_Scope_of_Work.[ext]
```

Examples:
- `Smith_Residence_Scope_of_Work.txt`
- `Downtown_Loft_Scope_of_Work.md`
- `Oak_Street_House_Scope_of_Work.html`

Spaces in project names are replaced with underscores for filename compatibility.

## HTML Export Styling

The HTML export includes:

### Visual Design
- **Colors:**
  - Primary: Brass (#B8860B)
  - Background: Taupe (#F5F5DC)
  - Text: Dark gray (#333)
- **Typography:**
  - System font stack
  - Clear hierarchy with headers
  - Readable line height

### Layout Elements
- **Header Section:**
  - Project title with brass underline
  - Project info in highlighted card
  - Generation date

- **Category Sections:**
  - Bordered cards for each category
  - Category name as header
  - Required badge (if applicable)
  - Budget display with brass color
  - Scope content with preserved whitespace

- **Print Styles:**
  - Optimized page breaks
  - Clean margins
  - Professional appearance

## Usage Examples

### Basic Usage (Default Format)

```typescript
<ScopeOfWorkDownload 
  projectId="abc123" 
  projectName="Smith Residence"
/>
```

This renders a button that downloads the scope of work as a .txt file when clicked.

### With Format Selection

1. Click the dropdown arrow next to the main button
2. Select desired format from the menu
3. File downloads automatically

### In Project Detail Page

```typescript
<BuilderHeader
  actions={
    <>
      <ScopeOfWorkDownload 
        projectId={id} 
        projectName={project.name}
      />
      <Button onClick={handleExportCSV}>
        Export CSV
      </Button>
    </>
  }
/>
```

## Data Requirements

### Minimum Requirements

For the download to work, the project must have:
1. At least one category defined in the categories subcollection
2. At least one category with a non-empty `scopeOfWork` field

If no categories have scope of work defined, the API returns a 404 error with the message:
> "No scope of work defined for this project"

### Data Source

Scope of work data is retrieved from:
```
projects/{projectId}/categories/{categoryId}
```

Each category document includes:
- `name`: Category name
- `scopeOfWork`: Scope description (optional)
- `required`: Boolean flag
- `allowanceAmount`: Budget amount (optional)
- `allowanceType`: "fixed" or "perSqFt" (optional)
- `displayOrder`: Sort order

## Error Handling

### Client-Side Errors

**No Project ID:**
- Button is disabled if projectId is not provided

**Download Failed:**
- Error message displays below the button
- Red error box with descriptive message
- User can retry by clicking again

**No Categories with Scope:**
- API returns 404
- Error message: "No scope of work defined for this project"
- Displayed to user in error box

### Server-Side Errors

**Project Not Found:**
```json
{
  "error": "Project not found"
}
```
HTTP Status: 404

**Missing Required Parameters:**
```json
{
  "error": "projectId is required"
}
```
HTTP Status: 400

**Server Error:**
```json
{
  "error": "Failed to export scope of work"
}
```
HTTP Status: 500

## Testing Checklist

### Functionality Tests
- [x] Download as Plain Text (.txt)
- [x] Download as Markdown (.md)
- [x] Download as HTML (.html)
- [x] Correct filename generation
- [x] Multiple categories exported correctly
- [x] Budget information included when present
- [x] Required badge shown for required categories
- [x] Categories sorted by display order

### UI Tests
- [x] Button appears in project detail page
- [x] Button appears in setup/configuration page
- [x] Format menu opens on dropdown click
- [x] Format menu closes on click outside
- [x] Loading state shows during download
- [x] Error message displays on failure
- [x] Button disabled during download

### Edge Cases
- [x] Project with no categories
- [x] Project with categories but no scope of work
- [x] Project with one category
- [x] Project with many categories
- [x] Very long scope of work text
- [x] Special characters in project name
- [x] Missing allowance amount
- [x] Missing project address

### Permission Tests
- [x] Builder can download
- [x] Designer can download
- [x] Admin can download
- [x] Client cannot see button (button only shows for builders/designers/admins)

## Future Enhancements

Potential improvements for future iterations:

1. **Additional Formats:**
   - PDF export (requires PDF library)
   - Word document (.docx)
   - Excel spreadsheet (.xlsx)

2. **Customization Options:**
   - Select specific categories to include
   - Add custom notes or disclaimer
   - Include/exclude budget information
   - Company logo in HTML export

3. **Email Integration:**
   - Send scope of work via email directly
   - Email to multiple recipients
   - Include as attachment in project invitations

4. **Version Control:**
   - Save scope of work versions
   - Track changes over time
   - Compare versions

5. **Templates:**
   - Scope of work templates by category
   - Industry-standard language
   - Reusable boilerplate text

6. **Collaboration:**
   - Comments on scope items
   - Approval workflow for scope changes
   - Contractor feedback integration

## Files Created/Modified

### New Files
- `src/app/api/export/scope-of-work/route.ts` - API endpoint
- `src/components/ui/ScopeOfWorkDownload.tsx` - Download component
- `docs/scope-of-work-download.md` - This documentation

### Modified Files
- `src/app/projects/[id]/page.tsx` - Added download button to project detail
- `src/app/projects/[id]/setup/page.tsx` - Added download button to setup page
- `AGENTS.md` - Updated feature list

## Dependencies

No new dependencies required. Uses:
- Native Blob API for file downloads
- Native fetch for API calls
- React hooks (useState) for state management

---

**Implementation Date:** June 13, 2026
**Status:** ✅ Complete and Tested
**Build Status:** ✅ Passing
