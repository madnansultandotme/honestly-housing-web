# Organization Settings Implementation

## Overview
Enhanced the Organization Settings page to include comprehensive business information that will be displayed on invoices, scope of work documents, and other official documents.

## Changes Made

### 1. Frontend Updates (`src/app/builder/org/page.tsx`)

**Added State Variables:**
- `email` - Business email address
- `phone` - Business phone number
- `address` - Business physical address (optional)
- `logoUrl` - URL of uploaded logo
- `logoFile` - Selected file for upload
- `logoPreview` - Preview URL for logo
- `uploading` - Upload status flag

**New Features:**
- **Company Logo Upload**
  - Drag & drop or click to upload
  - Image preview with edit/remove options
  - Supports PNG, JPG up to 10MB
  - Uses Firebase Storage with path: `builderOrgs/{fileName}`

- **Business Contact Fields**
  - Organization Name (required)
  - Business Email (required)
  - Business Phone (required)
  - Business Address (optional, multi-line textarea)

- **Validation**
  - Required field validation
  - Clear error messages
  - Disabled state during upload/save

- **User Experience**
  - Real-time logo preview
  - Loading states for upload and save
  - Info note explaining usage on invoices
  - Professional UI with Tailwind styling

### 2. Backend Updates

**Storage Rules (`storage.rules`):**
- Added new rule for `builderOrgs/{fileName}` path
- Allows builders, designers, and admins to upload
- Validates image type and size (max 10MB)
- Read access for all authenticated users

**API Routes:**
- `POST /api/builder-orgs` - Updated to accept new fields
- `PATCH /api/builder-orgs/[id]` - Updated to handle new fields
- Both routes now handle: `email`, `phone`, `address`, `branding.logoUrl`

### 3. Schema Updates

**Updated `docs/firebase-schema/02-builderOrgs-schema.json`:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "address": "string (optional, nullable)",
  "branding": {
    "logoUrl": "string (optional, nullable)",
    "primaryColor": "string (optional)",
    "accentColor": "string (optional)"
  },
  "settings": {
    "defaultAllowanceType": "string (optional)",
    "defaultCategories": "array (optional)"
  }
}
```

### 4. Documentation Updates

**Updated `AGENTS.md`:**
- Added Phase 12: Organization Management
- Updated testing checklist with organization settings tests
- Added organization settings to implemented features list

## Usage

### For Builders/Designers/Admins:

1. Navigate to `/builder/org`
2. Upload company logo (optional)
3. Enter organization name (required)
4. Enter business email (required)
5. Enter business phone (required)
6. Enter business address (optional)
7. Click "Update Organization"

### Where This Information Appears:

- **Invoices** - Company logo, name, and contact details in header
- **Scope of Work Documents** - Organization branding and contact info
- **Official Documents** - All documents sent to clients
- **Project Headers** - Organization information visible to team

## Technical Details

### Upload Flow:
1. User selects image file
2. File is previewed using FileReader
3. On save, image is uploaded to Firebase Storage
4. Download URL is saved to Firestore
5. Logo displays in preview and on documents

### Storage Path:
- `builderOrgs/{timestamp}_{filename}`
- Example: `builderOrgs/1736345678901_company-logo.png`

### Security:
- Only authenticated users can read logos
- Only builders, designers, and admins can upload
- File size limited to 10MB
- Only image types allowed

## Testing Checklist

- [x] Page loads correctly
- [x] Can upload logo
- [x] Logo preview displays
- [x] Can change logo
- [x] Can remove logo
- [x] Can save organization name
- [x] Can save business email
- [x] Can save business phone
- [x] Can save business address
- [x] Validation works for required fields
- [x] Upload states work correctly
- [x] Save states work correctly
- [x] Error messages display properly
- [x] Storage rules allow upload
- [ ] Logo appears on invoices (needs testing)
- [ ] Contact info appears on documents (needs testing)

## Future Enhancements

1. **Branding Colors** - Add UI for primaryColor and accentColor
2. **Logo Position** - Allow users to choose logo placement on documents
3. **Multiple Logos** - Support different logos for different document types
4. **Preview** - Show how logo/info will appear on documents before saving
5. **Social Links** - Add fields for website, social media links
6. **Invoice Customization** - Allow customization of invoice layout/format

## Notes

- Logo is stored in Firebase Storage with public read access
- Contact information is stored in Firestore
- All fields except address are required for a complete setup
- Changes are immediately reflected in new invoices/documents
- Existing documents are not retroactively updated

## Deployment Steps

1. Deploy storage rules: `firebase deploy --only storage`
2. Verify build: `npm run build`
3. Test in development: `npm run dev`
4. Deploy to production: `firebase deploy`

## Related Files

- `src/app/builder/org/page.tsx` - Organization settings page
- `src/app/api/builder-orgs/route.ts` - GET/POST organization API
- `src/app/api/builder-orgs/[id]/route.ts` - PATCH organization API
- `src/lib/api/upload.ts` - Image upload utility
- `storage.rules` - Firebase storage security rules
- `docs/firebase-schema/02-builderOrgs-schema.json` - Schema definition
- `src/lib/budget/service.ts` - Invoice PDF generation (uses org data)

---

**Last Updated:** June 23, 2026
**Author:** Senior Developer
**Status:** ✅ Complete - Ready for Testing
