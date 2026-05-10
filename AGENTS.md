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
   - **Step 2: Room & Fixture Configuration**
     - **Add rooms dynamically** with custom names
       - Enter room name (e.g., "Primary Bedroom", "Half Bath", "Pantry")
       - Select room type (Bedroom, Bathroom, Kitchen, Living Room, etc.)
       - Click "Add Room"
     - **Add fixtures to each room**
       - Expand room to see details
       - Click "Add Fixture"
       - Select category (Electrical, Plumbing, Flooring, Paint Colors, etc.)
       - Enter fixture name (e.g., "Fan", "Down Rod", "Vanity Light")
       - Set quantity
       - **Upload sample image (optional)** - Builder can upload reference images
       - Use quick-add buttons for common fixtures
     - **Example configurations:**
       - Living Room: Electrical (Fan, Down Rod), Flooring, Paint Colors (Trim, Ceiling, Walls, Cabinets)
       - Half Bath: Electrical (Vanity Light), Plumbing (Bathroom Faucet, Drain), Mirror, Paint Colors
       - Kitchen: Electrical (multiple lights), Plumbing (Faucet), Countertops, Cabinetry, Appliances
   - **Step 3: Categories**
     - Mark required categories (Flooring, Lighting, Plumbing, etc.)
     - Mark optional categories (Appliances, Cabinetry)
     - **Add custom categories** using "Add Custom Category" section
       - Enter category name (e.g., "Window Treatments", "Landscaping")
       - Click "Add Category" button
       - Custom category appears immediately in list
       - Can toggle custom categories between required/optional
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
   - Modify categories (including adding custom categories)
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
   - **Option A: Bulk Upload CSV**
     - Click "Bulk Upload CSV"
     - Download template
     - Fill in selections
     - Upload CSV file
   - **Option B: Manual Entry**
     - Click "Add Selection"
     - Choose category
     - Enter item details (name, brand, description)
     - Upload image
     - Set price
     - Assign to room (if applicable)
     - Set due date
     - Click "Create Selection"
   - **Option C: Dynamic Room Builder** (during project creation)
     - Items automatically created from room fixtures
     - Status: "notStarted"
     - Visible to client immediately

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
   - **See all items including those from room builder**
   - Review each selection item

3. **Approve or Request Changes**
   - Click on individual selection to view details
   - **To Approve**: 
     - Click "Approve" button
     - Item status changes to "approved"
     - Item becomes locked
   - **To Request Change**: 
     - Click "Request Change"
     - Enter reason for change (required)
     - Suggest alternative (optional)
     - Submit request
     - Change request sent to builder
   - **To Add Custom Option**:
     - Click "Don't like these options? Add your own"
     - Enter product name, brand, price
     - **Upload sample image (optional)** - Client can upload their preferred option image
     - Add product link and notes
     - Submit for builder approval

4. **Track Progress**
   - View progress bar on dashboard
   - See pending approvals count ("Awaiting Approval" section)
   - Check due dates

#### Phase 6: Handle Change Requests (Builder)
1. **View Change Requests**
   - Go to project selections
   - Check "Change Requests" subcollection in Firestore
   - See items with change requests

2. **Respond to Request**
   - Review client's reason
   - **Option A: Update existing item**
     - Edit the selection item
     - Update details based on client feedback
     - Notify client
   - **Option B: Create new item**
     - Add new selection with requested changes
     - Link to original item (optional)
     - Set status to "awaitingClientApproval"
   - Mark change request as resolved

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

#### Phase 10: User Profile Management (All Roles)
1. **Access Settings Page**
   - Click on user avatar/initials in header
   - Click "Profile Settings" from dropdown menu
   - Or go to `/settings`

2. **Update Profile Information**
   - **Upload Avatar:**
     - Click "Upload Photo" button
     - Select image file
     - Preview displays immediately
     - Click "Cancel" to remove selection
     - Avatar must be uploaded before saving
   - **Edit Display Name:**
     - Update full name in text field
     - Required field (cannot be empty)
   - **Edit Phone Number:**
     - Update phone number (optional)
     - Format: (555) 123-4567
   - **View Email (Read-Only):**
     - Email address cannot be changed
   - **View Role (Read-Only):**
     - Role badge displays current role
   - Click "Save Changes" to update profile

3. **Change Password**
   - Enter current password
   - Enter new password (minimum 6 characters)
   - Confirm new password (must match)
   - Click "Change Password"
   - System re-authenticates with current password
   - Password updated in Firebase Auth

4. **Verify Changes**
   - Avatar displays in header (both builder and client)
   - Profile information updated in database
   - Password change requires re-login on other devices

#### Phase 11: Admin Management (Admin Only)
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
- [ ] Can add rooms dynamically with custom names
- [ ] Can add fixtures to each room by category
- [ ] Fixtures support quantity specification
- [ ] Quick-add buttons work for common fixtures
- [ ] Room and fixture summary displays correctly
- [ ] Categories are created as subcollections
- [ ] Allowances are saved correctly
- [ ] Project status is "active" after creation
- [ ] Can save configuration as template

**Edit Configuration (Builder/Designer/Admin Only):**
- [ ] Can access edit page from project detail
- [ ] Clients are redirected away from edit page
- [ ] Can modify rooms
- [ ] Can update categories
- [ ] Can add custom categories
- [ ] Custom categories appear immediately in list
- [ ] Can toggle custom categories required/optional
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
- [ ] Can create selections via bulk upload
- [ ] Can create selections manually
- [ ] Items from room builder appear in selections list
- [ ] Can upload images
- [ ] Can assign to rooms
- [ ] Can set due dates
- [ ] Custom categories appear in category dropdown
- [ ] Can create selections with custom categories
- [ ] Client can view all selections (including room builder items)
- [ ] Client can approve selections
- [ ] Client can request changes with reason
- [ ] Approved items become locked
- [ ] Change requests are saved to Firestore

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

**Profile/Settings:**
- [ ] Can access settings page from user menu
- [ ] Can upload profile avatar
- [ ] Avatar preview displays correctly
- [ ] Can remove/cancel avatar upload
- [ ] Can update display name
- [ ] Can update phone number
- [ ] Email is read-only
- [ ] Role is read-only
- [ ] Profile changes save correctly
- [ ] Avatar displays in header after upload
- [ ] Avatar displays for both builder and client roles
- [ ] Can change password with current password
- [ ] Password change requires matching new passwords
- [ ] Password change validates minimum length (6 chars)
- [ ] Incorrect current password shows error
- [ ] Profile refreshes after save
- [ ] Settings page accessible to all roles

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

**Issue**: Custom category doesn't appear in list after adding
**Solution**: This was fixed by making CategoryChecklist a fully controlled component. Categories now appear immediately when added.

**Issue**: Custom category doesn't appear in selections dropdown
**Solution**: Ensure project was saved after adding custom category. Selection modals fetch categories from database via `/api/categories`.

**Issue**: Edit configuration page not loading project data
**Solution**: Fixed API response structure - APIs now return direct arrays instead of wrapped objects. Updated all API endpoints (`/api/rooms`, `/api/categories`, `/api/items`) to return arrays directly. Updated frontend to handle new response format.

**Issue**: Edit configuration page not updating room counts when adding more rooms
**Solution**: Replaced static room checkboxes with DynamicRoomBuilder component. Edit configuration now loads actual rooms and fixtures created during project creation. Room counts are automatically calculated from roomDetails. When saving, existing rooms/items are deleted and recreated with new configuration.

**Issue**: Image upload failing when adding selections
**Solution**: 
1. Added storage rules for `/selections/{fileName}` and `/fixtures/{fileName}` paths
2. Deployed rules with `firebase deploy --only storage`
3. Fixed AddSelectionModal and EditSelectionModal to use client-side Firebase Storage upload (`uploadImage` from `@/lib/api/upload`) instead of calling non-existent `/api/upload` endpoint
4. Fixed API client calls to use correct format (without `/api` prefix)
5. Builders, designers, and admins can now upload images for selections and fixtures

**Issue**: Approval/Reject buttons not visible on client side for selections
**Solution**: Updated selection detail page to check for multiple status values: `'awaitingClientApproval'`, `'awaiting_approval'`, `'notStarted'`, and `'NotStarted'`. The `showActions` prop now displays buttons for any of these statuses (as long as the item is not locked).

## Important Conventions

### Navigation Headers by Role

**IMPORTANT:** Each role has its own dedicated navigation header component:

- **AdminHeader** (`src/components/navigation/AdminHeader.tsx`)
  - Used exclusively for admin role
  - Red accent color scheme (red-600, red-50, red-200)
  - Navigation: Dashboard, Users, Projects, Analytics, Settings
  - Shows "ADMIN" badge next to logo
  - Links to: /admin, /admin/users, /admin/projects, /admin/analytics, /admin/settings
  - Dropdown includes: Profile Settings, Builder Dashboard, All Projects, Sign Out

- **BuilderHeader** (`src/components/navigation/BuilderHeader.tsx`)
  - Used exclusively for builder role
  - Brass accent color scheme (brass-600, brass-50, brass-200)
  - Navigation: Dashboard, Projects, Options, Organization
  - Links to: /builder, /projects, /builder/options, /builder/org
  - Dropdown includes: Profile Settings, Organization Settings, Sign Out

- **DesignerHeader** (`src/components/navigation/DesignerHeader.tsx`)
  - Used exclusively for designer role
  - Purple accent color scheme (purple-600, purple-50, purple-200)
  - Navigation: Dashboard, Projects, Options Library
  - Shows "DESIGNER" badge next to logo
  - Links to: /builder, /projects, /builder/options
  - Dropdown includes: Profile Settings, Sign Out

- **ClientHeader** (`src/components/navigation/ClientHeader.tsx`)
  - Used exclusively for client/homeowner role
  - Brass accent color scheme (brass-600, brass-50, brass-200)
  - Navigation: Dashboard, Projects, Selections
  - Links to: /client, /projects, /projects/{firstProjectId}/selections
  - Dropdown includes: Profile Settings, Sign Out

**Usage Pattern:**
```typescript
// In settings page or other multi-role pages
let Header;
if (profile?.role === 'admin') {
  Header = AdminHeader;
} else if (profile?.role === 'designer') {
  Header = DesignerHeader;
} else if (profile?.role === 'builder') {
  Header = BuilderHeader;
} else {
  Header = ClientHeader;
}
```

**DO NOT:**
- Mix admin navigation with builder/designer/client navigation
- Show admin links in non-admin headers
- Use BuilderHeader for admin pages
- Add role-specific links to other role headers

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

### Dynamic Room & Fixture Builder

**Implementation Details:**
- Builders can add unlimited rooms with custom names during project creation
- Each room can have multiple fixtures across different categories
- Fixtures are automatically created as items (subcollection) when project is saved
- Categories are auto-created if they don't exist (e.g., "Mirrors" category created on-the-fly)
- Room types: Bedroom, Bathroom, Kitchen, Living Room, Dining Room, Office, Laundry, Foyer, Mudroom, Pantry, Garage, Bonus Room, Other
- Fixture categories: Electrical, Plumbing, Flooring, Paint Colors, Tile, Countertops, Hardware, Cabinetry, Appliances, Mirrors, Other
- Common fixtures are pre-populated for quick selection (e.g., Fan, Down Rod, Vanity Light for Electrical)
- Each fixture supports quantity specification (e.g., 2 Vanity Lights, 1 Ceiling Fan)

**Backend Integration:**
- Rooms saved to: `projects/{projectId}/rooms/{roomId}` via `/api/rooms`
- Items saved to: `projects/{projectId}/items/{itemId}` via `/api/items`
- Categories saved to: `projects/{projectId}/categories/{categoryId}` via `/api/categories`
- All data follows the schema in `docs/firebase-schema/03-projects-schema.json`
- Items include: categoryId, categoryName, roomId, roomName, quantity, status, subType, etc.

**Example Use Cases:**
- **Living Room**: Electrical (Fan, Down Rod), Flooring, Paint Colors (Trim, Ceiling, Walls, Cabinets)
- **Half Bath**: Electrical (Vanity Light), Plumbing (Bathroom Faucet, Drain), Mirror, Paint Colors (Trim, Ceiling, Walls)
- **Kitchen**: Electrical (Recessed Lights x6, Pendant Lights x3), Plumbing (Kitchen Faucet), Countertops, Cabinetry, Appliances

**Key Files:**
- `src/components/ui/DynamicRoomBuilder.tsx` - Main room and fixture builder component
- `src/app/projects/new/page.tsx` - Project creation wizard with dynamic room builder integration
- `src/app/api/items/route.ts` - Items API (GET, POST, DELETE)
- `src/app/api/items/[id]/route.ts` - Individual item API (GET, PUT, DELETE)
- `src/app/api/rooms/route.ts` - Rooms API
- `src/app/api/categories/route.ts` - Categories API

**Implementation Details:**
- Custom categories can be added during project creation (Step 4) or in project edit/setup page
- Custom category IDs use format: `custom-{timestamp}` (e.g., `custom-1736345678901`)
- Custom categories are saved to Firestore subcollection: `projects/{projectId}/categories/{categoryId}`
- CategoryChecklist component is fully controlled - updates appear immediately when categories prop changes
- Custom categories automatically appear in Add/Edit selection dropdowns (fetched from `/api/categories`)
- Custom categories support all same features as default categories (required/optional, allowances, etc.)

**Key Files:**
- `src/components/ui/CategoryChecklist.tsx` - Fully controlled component, no local state
- `src/app/projects/new/page.tsx` - Project creation with custom category support
- `src/app/projects/[id]/setup/page.tsx` - Project edit with custom category support
- `src/app/api/categories/route.ts` - Backend API for category CRUD operations

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
- **Dynamic room builder** - add any room with custom name and type
- **Per-room fixture specification** - define exact fixtures needed per room
- **Fixture categories** - Electrical, Plumbing, Flooring, Paint Colors, Tile, Hardware, etc.
- **Fixture quantity support** - specify how many of each fixture needed
- **Quick-add common fixtures** - pre-populated suggestions for each category
- **Image upload for fixtures** - builders can upload sample images during room configuration
- **Client image upload** - clients can upload their own sample images when adding custom options
- **Custom category creation** during project setup
- **Add custom categories** in project creation wizard
- **Dynamic category management** - not limited to defaults
- **Custom categories appear immediately** in UI (fully controlled component)
- **Custom categories in selections** - automatically available in Add/Edit selection dropdowns
- **Sub-selections/fixtures** with quantity support
- **Paint sub-types** (Trim, Ceiling, Walls, Cabinets)
- **Room-category mapping** workflow
- **CSV bulk upload for selections** with template download
- **Manual one-by-one selection creation** with full form
- **Image upload for selections** (add and edit)
- **Image preview and removal** in forms
- **Full CRUD operations on selections** (Create, Read, Update, Delete)
- **Edit selection modal** with all fields editable
- **Delete selection** with confirmation dialog
- **Builder-to-Client workflow** - selections automatically appear in client portal
- **Awaiting Approval status** display in client portal
- **Dual input methods** - builders can add selections via CSV bulk upload OR manual form
- **User Profile/Settings Page** - comprehensive profile management
- **Avatar upload** - users can upload profile pictures with preview
- **Profile editing** - update display name, phone number
- **Password change** - secure password update with re-authentication
- **Avatar display in headers** - profile pictures shown in both Builder and Client headers
- **Profile settings link** - accessible from user menu dropdown

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

**Last Updated:** May 8, 2026
