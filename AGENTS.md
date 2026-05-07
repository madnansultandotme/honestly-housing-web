# Agent Instructions for Honestly Housing

This document provides guidance for AI coding assistants working on the Honestly Housing project.

## Project Overview

Honestly Housing is a premium home builder selection management platform built with Next.js 15+, TypeScript, and Firebase. It enables builders to manage client selections with a boutique, luxury aesthetic.

## Key Technologies

- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom theme
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Authentication:** Firebase Auth
- **Database:** Cloud Firestore with subcollections

## Project Lifecycle & Testing Flow

### Project Status Stages

The system uses 3 main project statuses:

1. **active** - Project is in progress with selections being made (default after creation)
2. **completed** - All selections approved and project finished
3. **archived** - Project is archived for historical reference

### Project Creation & Configuration

**Project Creation Wizard** (`/projects/new`) - Complete setup in one flow:
- Creates project with all configuration
- Sets up rooms, categories, and budgets
- Project is immediately **active** after creation
- No separate "setup" phase required

**Edit Configuration Page** (`/projects/[id]/setup`) - Modify existing project:
- Edit rooms configuration
- Update categories and budgets
- Save/load templates
- **Only accessible to Builder, Designer, and Admin roles**
- **Clients cannot access this page**

### Complete Testing Flow

#### Phase 1: Project Creation (Builder/Designer/Admin)
1. **Login as Builder**
   - Go to `/login`
   - Use builder credentials
   - Should redirect to `/builder`

2. **Create New Project** (Complete Setup in One Flow)
   - Click "New Project" or go to `/projects/new`
   - **Step 1: Basic Info**
     - Enter project name (e.g., "Smith Residence")
     - Enter address
     - **Search and select client by email:**
       - **Option A: Select Existing Client**
         - Type client email in search box
         - Select from search results
       - **Option B: Create New Client** (if no results found)
         - Type new client's email
         - System shows "No client found" message
         - Enter client's full name
         - Click "Create Client"
         - System generates random password
         - Welcome email sent to client with credentials
         - Client automatically selected
     - Enter budget (optional)
   - **Step 2: Room Configuration**
     - Set bedroom count (e.g., 4)
     - Set bathroom count (e.g., 3)
     - Set office count (e.g., 1)
     - Select specific rooms (Primary Bedroom, Kitchen, etc.)
     - Set fixture counts per room
   - **Step 3: Categories**
     - Mark required categories (Flooring, Lighting, Plumbing, etc.)
     - Mark optional categories (Appliances, Cabinetry)
   - **Step 4: Allowances**
     - Set budget for each category
     - Choose "Fixed Amount" or "Per Sq Ft"
   - **Step 5: Template (Optional)**
     - Save configuration as template for future projects
   - **Step 6: Review & Create**
     - Review all settings
     - Click "Create Project"
   - **Result**: Project created with status **"active"** and ready to use

#### Phase 2: Edit Project Configuration (Builder/Designer/Admin Only)
1. **Access Edit Page**
   - Go to project detail page
   - Click "Edit Configuration" button (only visible to builder/designer/admin)
   - Or go to `/projects/[id]/setup`
   - **Clients are automatically redirected if they try to access**

2. **Modify Configuration**
   - Adjust rooms if needed
   - Modify categories
   - Update allowances
   - Load from template (optional)
   - Save as new template (optional)
   - Click "Save Configuration"

3. **Changes Applied**
   - Configuration updated immediately
   - Project remains "active"
   - No status change required

#### Phase 3: Add Team Members (Any Role)
1. **Add Team Member**
   - Go to project detail page
   - Click "Add Team Member"
   - Enter team member's email
   - Select role (Builder, Designer, or Client)
   - Click "Add Team Member"

2. **Verify Team Member**
   - Check team members list on project page
   - Team member should appear with role badge

#### Phase 4: Create Selections (Builder/Designer)
1. **Add Selection Items**
   - Go to `/projects/[id]/selections`
   - Click "Add Selection"
   - Choose category
   - Enter item details (name, brand, description)
   - Upload image
   - Set price
   - Assign to room (if applicable)
   - Set due date
   - Click "Create Selection"

2. **Curate Options**
   - Add Good/Better/Best options
   - Set tier pricing
   - Add product links
   - Upload product images

#### Phase 5: Client Review & Approval (Client)
1. **Login as Client**
   - Use client credentials
   - Should redirect to `/client`

2. **View Selections**
   - See project on dashboard
   - Click project to view details
   - Go to Selections tab
   - Review each selection item

3. **Approve or Request Changes**
   - **To Approve**: Click "Approve" button
   - **To Request Change**: Click "Request Change"
     - Enter reason for change
     - Suggest alternative (optional)
     - Submit request

4. **Track Progress**
   - View progress bar on dashboard
   - See pending approvals count
   - Check due dates

#### Phase 6: Handle Change Requests (Builder)
1. **View Change Requests**
   - Go to project selections
   - See items with "Change Requested" status

2. **Respond to Request**
   - Review client's reason
   - Update selection item
   - Mark as resolved
   - Notify client

#### Phase 7: Upload Photos (Any Role)
1. **Access Photos Page**
   - Go to `/projects/[id]/photos`

2. **Upload Photo**
   - Click "Upload Photo"
   - Select image file
   - Choose category (Progress, Before, After, Detail)
   - Add caption (optional)
   - Click "Upload"

3. **View Gallery**
   - Photos displayed in grid
   - Click to view full size
   - Filter by category

#### Phase 8: Messaging (Any Role)
1. **Access Messages**
   - Go to `/projects/[id]/messages`

2. **Send Message**
   - Type message in input box
   - Click "Send"
   - Message appears in chat

3. **Real-time Updates**
   - Messages refresh every 5 seconds
   - Unread messages marked automatically

#### Phase 9: Project Completion (Builder)
1. **Review Progress**
   - Check all selections approved
   - Verify all items installed
   - Review photos

2. **Mark as Completed**
   - Update project status to "completed"
   - Export materials list (CSV)
   - Archive if needed

#### Phase 10: Admin Management (Admin Only)
1. **Access Admin Dashboard**
   - Login as admin
   - Go to `/admin`

2. **Manage Users**
   - Go to `/admin/users`
   - Search/filter users
   - Edit user details
   - Change user roles
   - Delete users (with confirmation)

3. **Manage Projects**
   - Go to `/admin/projects`
   - View all projects
   - Search/filter projects
   - Delete projects (with confirmation)

4. **View Statistics**
   - Total users by role
   - Total projects
   - Active projects
   - System-wide metrics

### Testing Checklist

**Project Creation:**
- [ ] Can create project with all required fields
- [ ] Client search works correctly
- [ ] Can select existing client from search results
- [ ] Can create new client when no results found
- [ ] New client receives welcome email with credentials
- [ ] Newly created client is automatically selected
- [ ] Room configuration saves properly
- [ ] Categories are created as subcollections
- [ ] Allowances are saved correctly
- [ ] Project status is "active" after creation
- [ ] Can save configuration as template

**Edit Configuration (Builder/Designer/Admin Only):**
- [ ] Can access edit page from project detail
- [ ] Clients are redirected away from edit page
- [ ] Can modify rooms
- [ ] Can update categories
- [ ] Can change allowances
- [ ] Can save as template
- [ ] Can load from template
- [ ] Changes save correctly

**Team Management:**
- [ ] Can add team members
- [ ] Email search finds users
- [ ] Team members appear in list
- [ ] Can remove team members
- [ ] Cannot add admin as team member

**Selections:**
- [ ] Can create selections
- [ ] Can upload images
- [ ] Can assign to rooms
- [ ] Can set due dates
- [ ] Client can approve
- [ ] Client can request changes

**Photos:**
- [ ] Can upload photos
- [ ] Photos appear in gallery
- [ ] Can filter by category
- [ ] Storage rules allow upload

**Messages:**
- [ ] Can send messages
- [ ] Messages appear in chat
- [ ] Real-time updates work
- [ ] Read status tracked

**Admin:**
- [ ] Can view all users
- [ ] Can edit users
- [ ] Can delete users
- [ ] Can view all projects
- [ ] Can delete projects
- [ ] Statistics display correctly

### Common Issues & Solutions

**Issue**: User search returns no results
**Solution**: Ensure email is normalized (lowercase) in database

**Issue**: Photo upload fails with permission error
**Solution**: Deploy updated storage rules with `firebase deploy --only storage`

**Issue**: Team member can't access project
**Solution**: Ensure user is added to project's teamMembers subcollection

**Issue**: Client can't see project
**Solution**: Verify clientId matches user's UID in project document

**Issue**: Admin can't access admin dashboard
**Solution**: Manually set user's role to 'admin' in Firestore

## Important Conventions

### Admin Role

**IMPORTANT:** Admin role is not available in the signup UI but is fully supported in the backend.

- Admin users must be created directly in the database (Firestore)
- Admin users have full system access (same as builder/designer permissions)
- Admin users are routed to `/builder` dashboard on login
- Admin users cannot be added as team members to projects (they have system-wide access)
- To create an admin user, manually set `role: 'admin'` in the Firestore `users` collection

### Next.js 15+ Breaking Changes

**CRITICAL:** Next.js 15+ requires async params in route handlers and pages:

```typescript
// ❌ OLD WAY (will cause build errors)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
}

// ✅ NEW WAY (required in Next.js 15+)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Firebase Schema Structure

**IMPORTANT:** This project uses subcollections, not top-level collections with foreign keys.

```typescript
// ✅ CORRECT - Subcollections
projects/{projectId}/categories/{categoryId}
projects/{projectId}/selections/{selectionId}
projects/{projectId}/messages/{messageId}
builderOrgs/{orgId}/options/{optionId}

// ❌ WRONG - Don't use top-level collections
categories/{categoryId} with projectId field
```

### Project Schema

The authoritative schema is in `docs/firebase-schema/03-projects-schema.json`. Key points:

- `rooms` is an object (not array) with keys: bedrooms, bathrooms, offices, etc.
- `fixtureCounts` is an object with fixture types as keys
- Status values: "setup", "active", "completed", "archived"
- `progress` object tracks completion percentages

### API Client

Use the centralized API client in `src/lib/api/client.ts`:

```typescript
import { apiClient } from '@/lib/api/client';

// Automatically handles /api prefix
const data = await apiClient.get('/projects/123');
const result = await apiClient.post('/projects', projectData);
```

### Component Imports

Always use absolute imports from `@/components`:

```typescript
import Button from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
```

## Design System

### Colors

- **Primary:** Brass (#B8860B variants)
- **Neutral:** Warm grays
- **Background:** Taupe (#F5F5DC variants)
- **Accents:** Soft, muted tones

### Typography

- **Display Font:** Playfair Display (headings)
- **Body Font:** Inter (content)

### Spacing & Borders

- Use `rounded-button` (0.5rem) for buttons
- Use `rounded-card` (1rem) for cards
- Consistent padding: p-4, p-6, p-8

## Common Patterns

### Loading States

Always add loading states to pages:

```typescript
import { LoadingOverlay, LoadingCard, LoadingSpinner } from '@/components/ui/LoadingSpinner';

if (loading) {
  return <LoadingOverlay fullScreen message="Loading..." />;
}
```

### Error Handling

```typescript
try {
  const data = await apiClient.get('/endpoint');
} catch (error) {
  console.error('Operation failed:', error);
  // Show user-friendly error message
}
```

### Role-Based Access

```typescript
const { user, profile } = useAuth();
const isBuilder = profile?.role === 'builder';

// Use appropriate header
const Header = isBuilder ? BuilderHeader : ClientHeader;
```

## File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── builder/           # Builder-specific pages
│   ├── client/            # Client-specific pages
│   └── projects/          # Project pages
├── components/
│   ├── ui/                # Reusable UI components
│   ├── navigation/        # Headers and navigation
│   └── selections/        # Selection-specific components
├── contexts/              # React contexts (Auth, etc.)
├── hooks/                 # Custom React hooks
└── lib/
    ├── api/               # API client and utilities
    └── firebase/          # Firebase configuration
```

## Testing Checklist

Before marking a feature complete:

1. ✅ Build succeeds without errors
2. ✅ TypeScript has no errors
3. ✅ Loading states are implemented
4. ✅ Error handling is in place
5. ✅ Role-based access is enforced
6. ✅ Mobile responsive (if applicable)
7. ✅ Follows design system

## Common Issues & Solutions

### Build Error: "params is not a Promise"

**Solution:** Update to async params pattern (see Next.js 15+ section above)

### API Double Prefix (/api/api/)

**Solution:** Don't include `/api` in endpoint strings when using `apiClient`

### Firebase Index Missing

**Solution:** Add index to `firestore.indexes.json` and deploy with `firebase deploy --only firestore:indexes`

### Component Not Found

**Solution:** Check import path uses `@/` prefix and component is exported correctly

## Documentation

- **Schema:** `docs/firebase-schema/`
- **Implementation Status:** `docs/implementation-status.md`
- **Navigation Flows:** `docs/navigation-flows.md`
- **Deployment:** `DEPLOYMENT.md`

## Feature Status

### ✅ Implemented
- Authentication & user management (4 roles: builder, designer, homeowner/client, admin)
- Project CRUD operations
- Selection workflow with approvals
- Builder and client dashboards
- Options library with CSV upload
- Photo gallery
- Messaging system
- Loading animations
- Role-based routing
- Client invitation system with email notifications
- Team member management (add/remove builders, designers, clients)
- **Admin Dashboard** with full system management
- **User Management** (view, edit, delete users)
- **Project Management** (view, delete projects)
- Email normalization for consistent user search
- **Auto-create client accounts during project creation** with credential email
- **Room-based selection configuration** with category assignment
- **Sub-selections/fixtures** with quantity support
- **Paint sub-types** (Trim, Ceiling, Walls, Cabinets)
- **Room-category mapping** workflow
- **CSV bulk upload for selections** with template download
- **Manual one-by-one selection creation** with full form
- **Builder-to-Client workflow** - selections automatically appear in client portal
- **Awaiting Approval status** display in client portal
- **Dual input methods** - builders can add selections via CSV bulk upload OR manual form

### ❌ Not Implemented
- AI Mood Board generation (marked as "coming soon")
- Full affiliate links support
- Admin Analytics (placeholder created)
- Admin Settings (placeholder created)

## Getting Help

1. Check `docs/implementation-status.md` for feature status
2. Review `docs/firebase-schema/` for data structure
3. Look at existing similar components for patterns
4. Check `CHANGELOG.md` for recent changes

## Code Style

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use async/await over promises
- Add JSDoc comments for complex functions
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

## Git Workflow

- Write clear, descriptive commit messages
- Keep commits focused on single changes
- Update documentation when adding features
- Test thoroughly before committing

---

**Last Updated:** May 5, 2026
