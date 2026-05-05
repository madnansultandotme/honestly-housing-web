# Firestore Collection Tree Structure

```
📁 Firestore Database
│
├── 📂 users (collection)
│   └── 📄 {userId} (document)
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── role: string
│       ├── builderOrgId: string | null
│       ├── projectIds: array<string>
│       ├── phone: string | null
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       ├── lastLoginAt: timestamp
│       └── notificationPreferences: map
│           ├── email: boolean
│           └── push: boolean
│       │
│       └── 📂 notifications (subcollection)
│           └── 📄 {notificationId} (document)
│               ├── type: string
│               ├── title: string
│               ├── body: string
│               ├── projectId: string | null
│               ├── projectName: string | null
│               ├── itemId: string | null
│               ├── itemName: string | null
│               ├── actionUrl: string | null
│               ├── read: boolean
│               ├── readAt: timestamp | null
│               └── createdAt: timestamp
│
├── 📂 builderOrgs (collection)
│   └── 📄 {orgId} (document)
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── address: string | null
│       ├── branding: map
│       │   ├── logoUrl: string | null
│       │   ├── primaryColor: string
│       │   └── accentColor: string
│       ├── settings: map
│       │   ├── defaultAllowanceType: string
│       │   └── defaultCategories: array<string>
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│       │
│       ├── 📂 options (subcollection)
│       │   └── 📄 {optionId} (document)
│       │       ├── categoryId: string
│       │       ├── categoryName: string
│       │       ├── name: string
│       │       ├── brand: string | null
│       │       ├── description: string | null
│       │       ├── imageUrl: string
│       │       ├── linkUrl: string | null
│       │       ├── price: number
│       │       ├── tier: string
│       │       ├── isActive: boolean
│       │       ├── createdAt: timestamp
│       │       ├── updatedAt: timestamp
│       │       └── createdBy: string
│       │
│       └── 📂 templates (subcollection)
│           └── 📄 {templateId} (document)
│               ├── name: string
│               ├── description: string | null
│               ├── rooms: map
│               │   ├── bedrooms: number
│               │   ├── bathrooms: number
│               │   ├── offices: number
│               │   ├── kitchens: number
│               │   ├── livingRooms: number
│               │   ├── diningRooms: number
│               │   ├── laundryRooms: number
│               │   ├── garages: number
│               │   └── other: number
│               ├── fixtureCounts: map
│               │   ├── plumbingFixtures: number
│               │   └── lightingFixtures: number
│               ├── categories: array<map>
│               ├── createdAt: timestamp
│               ├── updatedAt: timestamp
│               ├── createdBy: string
│               └── usageCount: number
│
└── 📂 projects (collection)
    └── 📄 {projectId} (document)
        ├── name: string
        ├── builderOrgId: string
        ├── clientId: string
        ├── status: string
        ├── address: string
        ├── startDate: timestamp
        ├── targetCompletionDate: timestamp | null
        ├── rooms: map
        │   ├── bedrooms: number
        │   ├── bathrooms: number
        │   ├── offices: number
        │   ├── kitchens: number
        │   ├── livingRooms: number
        │   ├── diningRooms: number
        │   ├── laundryRooms: number
        │   ├── garages: number
        │   └── other: number
        ├── fixtureCounts: map
        │   ├── plumbingFixtures: number
        │   └── lightingFixtures: number
        ├── squareFootage: number | null
        ├── progress: map
        │   ├── totalItems: number
        │   ├── completedItems: number
        │   ├── approvedItems: number
        │   ├── pendingItems: number
        │   └── installedItems: number
        ├── createdAt: timestamp
        ├── updatedAt: timestamp
        └── createdBy: string
        │
        ├── 📂 rooms (subcollection)
        │   └── 📄 {roomId} (document)
        │       ├── name: string
        │       ├── type: string
        │       ├── floor: number | null
        │       ├── fixtureCounts: map
        │       │   ├── total: number
        │       │   └── assigned: number
        │       ├── notes: string | null
        │       └── createdAt: timestamp
        │
        ├── 📂 categories (subcollection)
        │   └── 📄 {categoryId} (document)
        │       ├── name: string
        │       ├── displayOrder: number
        │       ├── required: boolean
        │       ├── allowanceType: string
        │       ├── allowanceAmount: number
        │       ├── progress: map
        │       │   ├── totalItems: number
        │       │   └── completedItems: number
        │       ├── createdAt: timestamp
        │       └── updatedAt: timestamp
        │
        ├── 📂 items (subcollection)
        │   └── 📄 {itemId} (document)
        │       ├── categoryId: string
        │       ├── categoryName: string
        │       ├── name: string
        │       ├── brand: string | null
        │       ├── description: string | null
        │       ├── imageUrl: string | null
        │       ├── linkUrl: string | null
        │       ├── allowance: number
        │       ├── actualCost: number
        │       ├── difference: number
        │       ├── status: string
        │       ├── dueDate: timestamp | null
        │       ├── roomId: string | null
        │       ├── roomName: string | null
        │       ├── notes: string | null
        │       ├── locked: boolean
        │       ├── approvedAt: timestamp | null
        │       ├── approvedBy: string | null
        │       ├── orderedAt: timestamp | null
        │       ├── installedAt: timestamp | null
        │       ├── tier: string | null
        │       ├── createdAt: timestamp
        │       ├── updatedAt: timestamp
        │       └── createdBy: string
        │
        ├── 📂 messages (subcollection)
        │   └── 📄 {messageId} (document)
        │       ├── senderId: string
        │       ├── senderName: string
        │       ├── senderRole: string
        │       ├── text: string
        │       ├── attachments: array<map> | null
        │       ├── readBy: array<string>
        │       └── createdAt: timestamp
        │
        ├── 📂 photos (subcollection)
        │   └── 📄 {photoId} (document)
        │       ├── imageUrl: string
        │       ├── thumbnailUrl: string | null
        │       ├── caption: string | null
        │       ├── uploadedBy: string
        │       ├── uploaderName: string
        │       ├── uploaderRole: string
        │       ├── category: string | null
        │       └── createdAt: timestamp
        │
        └── 📂 changeRequests (subcollection)
            └── 📄 {requestId} (document)
                ├── itemId: string
                ├── itemName: string
                ├── requestedBy: string
                ├── requestedByName: string
                ├── reason: string
                ├── preferredAlternative: string | null
                ├── budgetConcern: boolean
                ├── status: string
                ├── builderResponse: string | null
                ├── respondedAt: timestamp | null
                ├── respondedBy: string | null
                ├── createdAt: timestamp
                └── updatedAt: timestamp
```

## Collection Hierarchy Summary

**Top-Level Collections (3):**
1. users
2. builderOrgs
3. projects

**Subcollections (9):**
- users/{userId}/notifications
- builderOrgs/{orgId}/options
- builderOrgs/{orgId}/templates
- projects/{projectId}/rooms
- projects/{projectId}/categories
- projects/{projectId}/items
- projects/{projectId}/messages
- projects/{projectId}/photos
- projects/{projectId}/changeRequests

**Total Collections: 12**
