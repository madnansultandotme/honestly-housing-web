# Changelog

## Latest Updates - May 5, 2026

### 🗑️ Cleanup
- Removed unnecessary files from root directory:
  - `cors.json` - Not needed for App Hosting
  - `honestlyhousing-4d7f0-firebase-adminsdk-fbsvc-c14e125c5e.json` - Service account credentials (now in .env files)
  - `AGENTS.md`, `CLAUDE.md` - Agent-specific documentation
  - `APPHOSTING_SETUP.md`, `DEPLOY_QUICK_START.md`, `DEPLOY_NOW.md`, `DEPLOY_COMMANDS.md` - Duplicate deployment docs (consolidated in DEPLOYMENT.md)
  - `deploy.sh`, `setup-secrets.sh` - Shell scripts (commands documented in DEPLOYMENT.md)
  - `ARCHITECTURE-NOTE.md` - Architecture info moved to main docs

### ✨ Loading Animations
Added comprehensive loading states across the application:

#### New Loading Components (`src/components/ui/LoadingSpinner.tsx`)
- `LoadingSpinner` - Animated spinner with size variants (sm, md, lg, xl)
- `LoadingOverlay` - Full-screen or relative overlay with spinner and message
- `LoadingCard` - Skeleton loading cards for grid layouts
- `LoadingTable` - Skeleton loading table with configurable rows/columns

#### Updated Pages with Loading States
- **Builder Dashboard** (`src/app/builder/page.tsx`)
  - Skeleton cards for stats grid
  - Animated header placeholders
  
- **Client Portal** (`src/app/client/page.tsx`)
  - Skeleton cards for stats grid
  - Animated header placeholders

- **Projects List** (`src/app/projects/page.tsx`)
  - Skeleton cards for project grid
  - Maintains header during loading

- **Project Detail** (`src/app/projects/[id]/page.tsx`)
  - Full-screen loading overlay with message

- **Options Library** (`src/app/builder/options/page.tsx`)
  - Skeleton table for options list
  - Maintains header during loading

### 💬 Messaging Feature
Implemented complete project messaging system:

#### Backend APIs
- **GET `/api/messages`** - Fetch messages for a project
  - Query param: `projectId`
  - Returns last 100 messages ordered by creation date
  
- **POST `/api/messages`** - Send a new message
  - Required fields: `projectId`, `senderId`, `senderName`, `senderRole`, `text`
  - Optional: `attachments` array
  - Auto-adds sender to `readBy` array

- **PATCH `/api/messages/[id]`** - Mark message as read
  - Query param: `projectId`
  - Body: `userId`
  - Adds user to `readBy` array if not already present

#### Frontend
- **Messages Page** (`src/app/projects/[id]/messages/page.tsx`)
  - Real-time chat interface with 5-second polling
  - Auto-scrolls to latest message
  - Shows sender name, role, and timestamp
  - Marks messages as read automatically
  - Supports message attachments (images, documents)
  - Responsive design with proper headers for both builders and clients
  - Loading states and empty state handling

#### Project Detail Integration
- Added "Messages" card to project detail page
- Icon: Chat bubble
- Links to `/projects/[id]/messages`

#### Database
- Added Firestore index for messages collection:
  ```json
  {
    "collectionGroup": "messages",
    "queryScope": "COLLECTION_GROUP",
    "fields": [
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  }
  ```

### 📋 Message Schema
Messages are stored in subcollection: `projects/{projectId}/messages/{messageId}`

```typescript
interface Message {
  senderId: string;           // User ID of sender
  senderName: string;         // Display name (denormalized)
  senderRole: 'builder' | 'client';
  text: string;               // Message content
  attachments?: Array<{       // Optional attachments
    type: 'image' | 'document';
    url: string;
    name: string;
  }>;
  readBy: string[];          // Array of user IDs who read the message
  createdAt: string;         // ISO timestamp
}
```

### 🎨 UI/UX Improvements
- Consistent loading states across all pages
- Smooth animations with Tailwind's `animate-pulse` and `animate-spin`
- Skeleton loaders match actual content layout
- Loading overlays prevent interaction during data fetching
- Messages UI with color-coded bubbles (blue for own messages, gray for others)
- Relative timestamps (e.g., "2:30 PM", "Mon 3:45 PM", "Jan 15 4:20 PM")

### 🔧 Technical Details
- All loading components use Tailwind CSS for animations
- No external animation libraries required
- Loading states preserve page structure (headers, navigation)
- Messages use polling instead of WebSockets for simplicity
- Auto-read functionality marks messages when viewing the page

### 📦 Files Modified
- `src/components/ui/LoadingSpinner.tsx` (new)
- `src/app/api/messages/route.ts` (new)
- `src/app/api/messages/[id]/route.ts` (new)
- `src/app/projects/[id]/messages/page.tsx` (new)
- `src/app/projects/[id]/page.tsx` (updated - added Messages card)
- `src/app/builder/page.tsx` (updated - loading states)
- `src/app/client/page.tsx` (updated - loading states)
- `src/app/projects/page.tsx` (updated - loading states)
- `src/app/builder/options/page.tsx` (updated - loading states)
- `firestore.indexes.json` (updated - added messages index)

### 🚀 Next Steps
1. Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
2. Test messaging feature with multiple users
3. Consider adding:
   - File upload for message attachments
   - Message notifications
   - Typing indicators
   - WebSocket support for real-time updates
   - Message search functionality
   - Message editing/deletion

---

## Previous Updates
See git history for previous changes.
