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
