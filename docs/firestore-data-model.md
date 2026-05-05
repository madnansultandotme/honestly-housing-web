# Firestore Data Model

## Collections Overview

1. **users** - User profiles for authentication and role management
2. **builderOrgs** - Builder organization information and branding
3. **projects** - Project details, room counts, and configuration
4. **rooms** - Individual rooms within projects with fixture tracking
5. **categories** - Selection categories with budget settings per project
6. **items** - Individual selection items (products) with approval status
7. **options** - Curated product options (Good/Better/Best) uploaded by builders
8. **messages** - Project-scoped chat messages between builder and client
9. **photos** - Project photo gallery with captions
10. **changeRequests** - Client requests to change approved selections
11. **templates** - Saved project configurations for reuse
12. **notifications** - System notifications for users

---

## Collection Schemas

### 1. users
**Path:** `/users/{userId}`
**Description:** User profiles linked to Firebase Auth

```
{
  uid: string (Firebase Auth UID),
  email: string,
  displayName: string,
  role: string ("builder" | "client"),
  builderOrgId: string | null (reference to builderOrgs, null for clients),
  projectIds: array<string> (array of project IDs user has access to),
  phone: string | null,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp,
  notificationPreferences: {
    email: boolean,
    push: boolean
  }
}
```

**Indexes:**
- role
- builderOrgId
- projectIds (array-contains)

---

### 2. builderOrgs
**Path:** `/builderOrgs/{orgId}`
**Description:** Builder organization details

```
{
  name: string,
  email: string,
  phone: string,
  address: string | null,
  branding: {
    logoUrl: string | null,
    primaryColor: string (hex),
    accentColor: string (hex)
  },
  settings: {
    defaultAllowanceType: string ("fixed" | "perSqFt"),
    defaultCategories: array<string>
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 3. projects
**Path:** `/projects/{projectId}`
**Description:** Project information and configuration

```
{
  name: string,
  builderOrgId: string (reference to builderOrgs),
  clientId: string (reference to users),
  status: string ("setup" | "active" | "completed" | "archived"),
  address: string,
  startDate: timestamp,
  targetCompletionDate: timestamp | null,
  
  rooms: {
    bedrooms: number,
    bathrooms: number,
    offices: number,
    kitchens: number,
    livingRooms: number,
    diningRooms: number,
    laundryRooms: number,
    garages: number,
    other: number
  },
  
  fixtureCounts: {
    plumbingFixtures: number,
    lightingFixtures: number
  },
  
  squareFootage: number | null,
  
  progress: {
    totalItems: number,
    completedItems: number,
    approvedItems: number,
    pendingItems: number,
    installedItems: number
  },
  
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (userId)
}
```

**Indexes:**
- builderOrgId
- clientId
- status
- builderOrgId + status (composite)

---

### 4. rooms
**Path:** `/projects/{projectId}/rooms/{roomId}`
**Description:** Individual rooms within a project (subcollection)

```
{
  name: string ("Master Bedroom", "Kitchen", "Guest Bath", etc.),
  type: string ("bedroom" | "bathroom" | "kitchen" | "living" | "dining" | "office" | "laundry" | "garage" | "other"),
  floor: number | null,
  
  fixtureCounts: {
    total: number (required fixtures for this room),
    assigned: number (fixtures currently assigned)
  },
  
  notes: string | null,
  createdAt: timestamp
}
```

**Indexes:**
- type

---

### 5. categories
**Path:** `/projects/{projectId}/categories/{categoryId}`
**Description:** Selection categories with budget settings (subcollection)

```
{
  name: string ("Flooring", "Lighting", "Plumbing", "Paint", "Tile", "Countertops", "Hardware"),
  displayOrder: number,
  required: boolean,
  
  allowanceType: string ("fixed" | "perSqFt"),
  allowanceAmount: number,
  
  progress: {
    totalItems: number,
    completedItems: number
  },
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Indexes:**
- displayOrder
- required

---

### 6. items
**Path:** `/projects/{projectId}/items/{itemId}`
**Description:** Individual selection items (products) (subcollection)

```
{
  categoryId: string (reference to categories),
  categoryName: string (denormalized for queries),
  
  name: string (product name),
  brand: string | null,
  description: string | null,
  
  imageUrl: string | null,
  linkUrl: string | null (product link, Amazon, etc.),
  
  allowance: number,
  actualCost: number,
  difference: number (actualCost - allowance, calculated),
  
  status: string ("notStarted" | "needsBuilderInput" | "awaitingClientApproval" | "approved" | "ordered" | "installed"),
  
  dueDate: timestamp | null,
  
  roomId: string | null (reference to rooms, for lighting assignments),
  roomName: string | null (denormalized),
  
  notes: string | null,
  
  locked: boolean (true after client approval),
  approvedAt: timestamp | null,
  approvedBy: string | null (userId),
  
  orderedAt: timestamp | null,
  installedAt: timestamp | null,
  
  tier: string | null ("good" | "better" | "best"),
  
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (userId)
}
```

**Indexes:**
- categoryId
- status
- dueDate
- locked
- categoryId + status (composite)
- status + dueDate (composite)

---

### 7. options
**Path:** `/builderOrgs/{orgId}/options/{optionId}`
**Description:** Curated product options uploaded by builders (subcollection)

```
{
  categoryId: string (which category this option belongs to),
  categoryName: string (denormalized),
  
  name: string (product name),
  brand: string | null,
  description: string | null,
  
  imageUrl: string,
  linkUrl: string | null,
  
  price: number,
  tier: string ("good" | "better" | "best"),
  
  isActive: boolean,
  
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (userId)
}
```

**Indexes:**
- categoryId
- tier
- isActive
- categoryId + tier (composite)

---

### 8. messages
**Path:** `/projects/{projectId}/messages/{messageId}`
**Description:** Project-scoped chat messages (subcollection)

```
{
  senderId: string (userId),
  senderName: string (denormalized),
  senderRole: string ("builder" | "client"),
  
  text: string,
  
  attachments: array<{
    type: string ("image" | "document"),
    url: string,
    name: string
  }> | null,
  
  readBy: array<string> (array of userIds who have read),
  
  createdAt: timestamp
}
```

**Indexes:**
- createdAt (descending)
- senderId

---

### 9. photos
**Path:** `/projects/{projectId}/photos/{photoId}`
**Description:** Project photo gallery (subcollection)

```
{
  imageUrl: string (Firebase Storage path),
  thumbnailUrl: string | null,
  
  caption: string | null,
  
  uploadedBy: string (userId),
  uploaderName: string (denormalized),
  uploaderRole: string ("builder" | "client"),
  
  category: string | null ("progress" | "before" | "after" | "detail"),
  
  createdAt: timestamp
}
```

**Indexes:**
- createdAt (descending)
- category

---

### 10. changeRequests
**Path:** `/projects/{projectId}/changeRequests/{requestId}`
**Description:** Client requests to change selections (subcollection)

```
{
  itemId: string (reference to items),
  itemName: string (denormalized),
  
  requestedBy: string (userId, always client),
  requestedByName: string (denormalized),
  
  reason: string (required text explaining why change is needed),
  preferredAlternative: string | null,
  budgetConcern: boolean,
  
  status: string ("pending" | "approved" | "rejected" | "completed"),
  
  builderResponse: string | null,
  respondedAt: timestamp | null,
  respondedBy: string | null (userId),
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Indexes:**
- itemId
- status
- requestedBy
- createdAt (descending)

---

### 11. templates
**Path:** `/builderOrgs/{orgId}/templates/{templateId}`
**Description:** Saved project configurations for reuse (subcollection)

```
{
  name: string,
  description: string | null,
  
  rooms: {
    bedrooms: number,
    bathrooms: number,
    offices: number,
    kitchens: number,
    livingRooms: number,
    diningRooms: number,
    laundryRooms: number,
    garages: number,
    other: number
  },
  
  fixtureCounts: {
    plumbingFixtures: number,
    lightingFixtures: number
  },
  
  categories: array<{
    name: string,
    allowanceType: string,
    allowanceAmount: number,
    required: boolean
  }>,
  
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (userId),
  
  usageCount: number
}
```

**Indexes:**
- createdAt (descending)
- usageCount (descending)

---

### 12. notifications
**Path:** `/users/{userId}/notifications/{notificationId}`
**Description:** User notifications (subcollection)

```
{
  type: string ("approval" | "changeRequest" | "message" | "dueDate" | "statusUpdate"),
  
  title: string,
  body: string,
  
  projectId: string | null,
  projectName: string | null,
  
  itemId: string | null,
  itemName: string | null,
  
  actionUrl: string | null (deep link),
  
  read: boolean,
  readAt: timestamp | null,
  
  createdAt: timestamp
}
```

**Indexes:**
- read
- createdAt (descending)
- type

---

## Firebase Storage Structure

```
/projects/{projectId}/photos/{photoId}.jpg
/projects/{projectId}/photos/thumbnails/{photoId}_thumb.jpg
/options/{builderOrgId}/{optionId}.jpg
/messages/{projectId}/{messageId}/{attachmentId}.{ext}
/builderOrgs/{orgId}/logo.png
```

---

## Security Rules Considerations

1. **users**: Users can read their own document, builders can read users in their org
2. **builderOrgs**: Members can read their org, only admins can write
3. **projects**: Builders can read/write their org's projects, clients can read assigned projects
4. **items**: Builders can read/write, clients can read and update status/approval fields only
5. **options**: Builders can read/write their org's options, clients can read
6. **messages**: Both builder and client can read/write in their project
7. **photos**: Both roles can read/write in their project
8. **changeRequests**: Clients can create, builders can read/update
9. **templates**: Builders can read/write their org's templates
10. **notifications**: Users can only read/write their own notifications

---

## Denormalization Strategy

To optimize queries and reduce reads:
- Store `categoryName` in items (avoid join with categories)
- Store `senderName` and `senderRole` in messages
- Store `uploaderName` and `uploaderRole` in photos
- Store `itemName` in changeRequests
- Store `projectName` in notifications
- Update progress counts in projects and categories when items change

---

## Query Patterns

### Builder Dashboard
- Count items where `status == "awaitingClientApproval"` across all projects
- Count items where `dueDate <= thisWeek` across all projects
- Count projects where `builderOrgId == currentOrg && status == "active"`

### Client Dashboard
- Count items where `projectId == userProject && status == "awaitingClientApproval"`
- Get items where `projectId == userProject && dueDate <= thisWeek`
- Get progress from project document

### Due Dates Page
- Query items where `dueDate != null` ordered by `dueDate ASC`
- Filter by `projectId` for specific project

### Selection Items List
- Query items where `projectId == current && categoryId == selected`
- Query items where `projectId == current && status == selected`

### Messages
- Query messages where `projectId == current` ordered by `createdAt DESC`
- Limit to last 50, paginate for older

### Photos
- Query photos where `projectId == current` ordered by `createdAt DESC`
