# Backend Specification (Firebase)

Platform: Firebase Auth, Firestore, Storage

## Auth
- Provider: Email/Password
- Custom claims (optional): role, builderOrgId

## Collections and Attributes

### users
- uid (string, doc id)
- role (string: builder, client)
- builderOrgId (string)
- displayName (string)
- email (string)
- projectIds (array<string>)
- createdAt (timestamp)
- updatedAt (timestamp)

### builderOrgs
- id (string, doc id)
- name (string)
- branding (map)
  - logoUrl (string)
  - primaryColor (string)
  - accentColor (string)
- createdAt (timestamp)
- updatedAt (timestamp)

### projects
- id (string, doc id)
- builderOrgId (string)
- clientId (string)
- name (string)
- status (string)
- rooms (array<string>)
- counts (map)
  - bedrooms (number)
  - bathrooms (number)
  - offices (number)
  - plumbingFixtures (number)
- dueDates (map)
  - categoryId -> timestamp
- createdAt (timestamp)
- updatedAt (timestamp)

### categories
- id (string, doc id)
- projectId (string)
- name (string)
- required (bool)
- allowanceType (string: allowance, pricePerSqFt)
- allowanceAmount (number)
- createdAt (timestamp)
- updatedAt (timestamp)

### items
- id (string, doc id)
- projectId (string)
- categoryId (string)
- name (string)
- brand (string)
- imageUrl (string)
- linkUrl (string)
- allowance (number)
- actualCost (number)
- difference (number)
- notes (string)
- status (string)
- dueDate (timestamp)
- approvedAt (timestamp)
- approvedBy (string)
- locked (bool)
- roomId (string)
- createdAt (timestamp)
- updatedAt (timestamp)

### options
- id (string, doc id)
- builderOrgId (string)
- categoryId (string)
- name (string)
- imageUrl (string)
- linkUrl (string)
- price (number)
- tier (string: good, better, best)
- createdAt (timestamp)
- updatedAt (timestamp)

### rooms
- id (string, doc id)
- projectId (string)
- name (string)
- fixtureCounts (map)
  - lighting (number)
- createdAt (timestamp)
- updatedAt (timestamp)

### messages
- id (string, doc id)
- projectId (string)
- senderId (string)
- text (string)
- createdAt (timestamp)

### photos
- id (string, doc id)
- projectId (string)
- imageUrl (string)
- caption (string)
- createdAt (timestamp)

### changeRequests
- id (string, doc id)
- projectId (string)
- itemId (string)
- requestedBy (string)
- reason (string)
- status (string)
- createdAt (timestamp)
- updatedAt (timestamp)

## Storage
- /projects/{projectId}/photos/{photoId}
- /options/{builderOrgId}/{optionId}

## Rules (high level)
- Users can read their own profile.
- Builders can access projects within builderOrgId.
- Clients can access only assigned projects and related items.
- Writes for approvals limited to clients on assigned projects.
