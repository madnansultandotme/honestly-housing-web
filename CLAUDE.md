# Claude-Specific Instructions

This document contains specific guidance for Claude (Anthropic's AI assistant) when working on the Honestly Housing project.

## Context Management

When starting a new conversation:
1. Read `AGENTS.md` for general project guidelines
2. Check `docs/implementation-status.md` for current feature status
3. Review `CHANGELOG.md` for recent changes
4. Examine relevant schema files in `docs/firebase-schema/`

## Working Style

### Be Proactive
- Suggest improvements when you see opportunities
- Point out potential issues before they become problems
- Offer alternative approaches when appropriate

### Be Thorough
- Check related files when making changes
- Update documentation when adding features
- Verify TypeScript types are correct
- Test edge cases mentally before suggesting code

### Be Clear
- Explain your reasoning for significant changes
- Point out breaking changes explicitly
- Highlight dependencies between changes
- Mention files that need updating together

## Next.js 15+ Specifics

**CRITICAL:** Always use async params pattern:

```typescript
// Route handlers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}

// Page components
export default async function Page({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  // ...
}
```

## Firebase Patterns

### Subcollections (Correct)
```typescript
// ✅ Use subcollections
await adminDb
  .collection('projects')
  .doc(projectId)
  .collection('categories')
  .add(categoryData);
```

### Query Patterns
```typescript
// ✅ Query with proper ordering
const snapshot = await adminDb
  .collection('projects')
  .doc(projectId)
  .collection('messages')
  .orderBy('createdAt', 'desc')
  .limit(100)
  .get();
```

### Index Requirements
When adding queries with multiple fields or ordering, add to `firestore.indexes.json`:

```json
{
  "collectionGroup": "messages",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Component Patterns

### Loading States
Always implement loading states:

```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return <LoadingOverlay fullScreen message="Loading..." />;
}
```

### Error Handling
```typescript
try {
  const data = await apiClient.get('/endpoint');
  setData(data);
} catch (error) {
  console.error('Failed to load:', error);
  setError('Failed to load data. Please try again.');
}
```

### Role-Based Rendering
```typescript
const { profile } = useAuth();
const isBuilder = profile?.role === 'builder';

return (
  <div>
    {isBuilder ? <BuilderHeader /> : <ClientHeader />}
    {/* content */}
  </div>
);
```

## API Development

### Route Handler Template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Query Firestore
    const snapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Common Mistakes to Avoid

### ❌ Don't Do This
```typescript
// Wrong: Not awaiting params
const { id } = params;

// Wrong: Including /api in apiClient calls
await apiClient.get('/api/projects');

// Wrong: Top-level collection with foreign key
await adminDb.collection('categories').add({ projectId, ...data });

// Wrong: Forgetting loading states
return <div>{data.map(...)}</div>;
```

### ✅ Do This Instead
```typescript
// Correct: Await params
const { id } = await params;

// Correct: No /api prefix with apiClient
await apiClient.get('/projects');

// Correct: Use subcollections
await adminDb
  .collection('projects')
  .doc(projectId)
  .collection('categories')
  .add(data);

// Correct: Add loading states
if (loading) return <LoadingSpinner />;
return <div>{data.map(...)}</div>;
```

## Design System Usage

### Colors
```typescript
// Primary actions
className="bg-blue-600 hover:bg-blue-700"

// Secondary actions
className="bg-brass-600 hover:bg-brass-700"

// Neutral backgrounds
className="bg-taupe-50"

// Text
className="text-neutral-900" // headings
className="text-neutral-600" // body
```

### Spacing
```typescript
// Cards
className="p-6 rounded-card shadow-sm"

// Buttons
className="px-4 py-2 rounded-button"

// Sections
className="space-y-6" // vertical spacing
className="gap-4"     // grid/flex spacing
```

### Typography
```typescript
// Headings
className="text-3xl font-display font-bold"

// Body
className="text-base font-body"

// Small text
className="text-sm text-neutral-600"
```

## Testing Approach

Before suggesting code is complete:

1. **Mental Execution:** Walk through the code path mentally
2. **Type Safety:** Verify all TypeScript types are correct
3. **Error Cases:** Consider what could go wrong
4. **Edge Cases:** Think about empty states, loading states, error states
5. **Dependencies:** Check if other files need updates
6. **Documentation:** Update relevant docs if needed

## Communication Style

### When Explaining Changes
- Start with the "why" before the "how"
- Highlight breaking changes prominently
- Mention files that need updating together
- Provide context for non-obvious decisions

### When Suggesting Improvements
- Explain the benefit clearly
- Note any tradeoffs
- Indicate priority (critical vs nice-to-have)
- Offer alternatives when appropriate

### When Encountering Issues
- Describe the problem clearly
- Explain the root cause if known
- Suggest a solution with reasoning
- Mention any workarounds if applicable

## File Organization

### When Creating New Files
- Follow existing patterns in the directory
- Use consistent naming conventions
- Add appropriate imports at the top
- Export components/functions properly

### When Modifying Files
- Keep changes focused and minimal
- Maintain existing code style
- Update related files together
- Check for unused imports

## Deployment Considerations

### Environment Variables
- Public vars: `NEXT_PUBLIC_*` (available in browser)
- Private vars: No prefix (server-side only)
- Secrets: Use Google Cloud Secret Manager for production

### Build Process
1. TypeScript compilation must succeed
2. No ESLint errors (warnings OK)
3. All imports must resolve
4. Environment variables must be defined

### Firebase Deployment
- Indexes: `firebase deploy --only firestore:indexes`
- Rules: `firebase deploy --only firestore:rules`
- App Hosting: `firebase deploy --only apphosting`

## Feature Implementation Checklist

When implementing a new feature:

- [ ] Create/update API routes
- [ ] Add Firestore indexes if needed
- [ ] Create UI components
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Add TypeScript types
- [ ] Update navigation if needed
- [ ] Test with both builder and client roles
- [ ] Update `docs/implementation-status.md`
- [ ] Update `CHANGELOG.md`

## Known Limitations

### Not Implemented
- **AI Mood Board:** Marked as "coming soon" in UI
- **Client Invitations:** System not built yet
- **Affiliate Links:** Partial implementation only

### Technical Constraints
- Firebase Admin SDK requires server-side execution
- Next.js 15+ requires async params pattern
- Firestore queries need indexes for complex operations
- File uploads limited by Firebase Storage rules

## Quick Reference

### Important Files
- `src/lib/api/client.ts` - API client
- `src/lib/firebase/admin.ts` - Firebase Admin SDK
- `src/contexts/AuthContext.tsx` - Authentication context
- `firestore.indexes.json` - Database indexes
- `apphosting.yaml` - Deployment configuration

### Common Commands
```bash
# Development
npm run dev

# Build
npm run build

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy app
firebase deploy --only apphosting
```

### Useful Patterns
```typescript
// Get current user
const { user, profile } = useAuth();

// API call
const data = await apiClient.get('/endpoint');

// Loading state
if (loading) return <LoadingSpinner />;

// Role check
const isBuilder = profile?.role === 'builder';
```

---

**Remember:** When in doubt, check existing implementations for patterns. The codebase is consistent and well-structured.

**Last Updated:** May 5, 2026
