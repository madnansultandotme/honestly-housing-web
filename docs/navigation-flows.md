# Navigation Flows & Page Hierarchy

## Builder Flow

### Level 1: Builder Dashboard (02a)
**Entry Point:** Login with Builder role
**Actions:**
- View summary metrics (approvals pending, due this week, active projects)
- Tap "Projects" → Navigate to Builder Projects (03a)
- Tap "Messages" → Navigate to Messages (12)
- Tap item in due_this_week_list → Navigate to Builder Project Detail (04a)

### Level 2: Builder Projects (03a)
**From:** Builder Dashboard
**Actions:**
- Tap "New Project" → Navigate to Builder Project Setup (05)
- Tap project card → Navigate to Builder Project Detail (04a)

### Level 3: Builder Project Detail (04a)
**From:** Builder Projects, Builder Dashboard
**Actions:**
- Tap "Edit Setup" → Navigate to Builder Project Setup (05)
- Tap "Add Options" → Navigate to Option Upload Modal (uses option_upload_form component)
- Tap "Photos" → Navigate to Photos (11)
- Tap "Messages" → Navigate to Messages (12)
- Tap "Due Dates" → Navigate to Due Dates (10)
- Tap category in status breakdown → Navigate to Builder Selection Items List (Level 4)

### Level 4: Builder Selection Items List
**From:** Builder Project Detail
**Description:** Filtered list of selection items by category or status. Shows all items with status_badge, due dates, client approval status. Tap item opens Builder Selection Item Detail (Level 5).
**Actions:**
- Tap "Add Option" → Navigate to Option Upload Modal
- Tap item → Navigate to Builder Selection Item Detail (Level 5)
- Filter by status, category, room

### Level 5: Builder Selection Item Detail
**From:** Builder Selection Items List
**Description:** Builder view of selection item showing visual_approval_card, budget_impact_row, status_badge. Shows client approval status, approval timestamp if approved, change requests if any.
**Actions:**
- Edit item details (price, notes, due date)
- Upload/change product image
- Assign to room (for lighting using room_assignment_selector)
- View change requests from client
- Mark as "Ordered" or "Installed"
- Delete item

### Level 4: Builder Project Setup (05)
**From:** Builder Projects (new project), Builder Project Detail (edit)
**Description:** Configuration page using category_checklist and allowance_prompt components.
**Actions:**
- Save project configuration
- Save as template
- Load from template
- Return to Builder Project Detail (04a)

---

## Client Flow

### Level 1: Client Dashboard (02b)
**Entry Point:** Login with Client role
**Actions:**
- View decisions needed, progress summary
- Tap "Selections" → Navigate to Client Selections Home (07)
- Tap "Photos" → Navigate to Photos (11)
- Tap "Messages" → Navigate to Messages (12)
- Tap item in due_this_week_list → Navigate to Client Selection Item Detail (09)

### Level 2: Client Selections Home (07)
**From:** Client Dashboard
**Actions:**
- View progress_bar showing overall completion
- Tap "View All" in Due This Week → Navigate to Due Dates (10)
- Tap item in any section → Navigate to Client Selection Item Detail (09)
- Tap "Browse by Category" → Navigate to Client Selection Categories (08)

### Level 3: Client Selection Categories (08)
**From:** Client Selections Home
**Description:** Category navigation using category_checklist and progress_bar per category.
**Actions:**
- Tap category card → Navigate to Client Category Items List (Level 4)

### Level 4: Client Category Items List
**From:** Client Selection Categories
**Description:** Filtered list of items in selected category. Shows item name, image thumbnail, status_badge, due date, budget impact preview.
**Actions:**
- Tap item → Navigate to Client Selection Item Detail (09)
- Filter by room (for lighting)
- Sort by due date, status

### Level 3: Client Selection Item Detail (09)
**From:** Client Selections Home, Client Category Items List, Due Dates, Client Dashboard
**Description:** Full selection review using visual_approval_card, budget_impact_row, status_badge.
**Actions:**
- Tap "Approve" → Show confirmation modal → Write approval → Return to previous page
- Tap "Request Change" → Show change request form → Submit request → Return to previous page
- View curated options (Good/Better/Best) using curated_option_card
- Swipe to next/previous item in category

### Level 4: Curated Options View
**From:** Client Selection Item Detail
**Description:** Modal or expanded view showing Good/Better/Best options using curated_option_card component. Shows tier label, image, price, upgrade difference.
**Actions:**
- Select option → Updates item with selected option details
- Close → Return to Client Selection Item Detail (09)

### Level 2: Client Projects (03b)
**From:** Client Dashboard (if multiple projects)
**Actions:**
- Tap project card → Navigate to Client Project Detail (04b)

### Level 3: Client Project Detail (04b)
**From:** Client Projects
**Actions:**
- Tap "Selections" → Navigate to Client Selections Home (07)
- Tap "Photos" → Navigate to Photos (11)
- Tap "Messages" → Navigate to Messages (12)
- Tap "Due Dates" → Navigate to Due Dates (10)

---

## Shared Flows (Both Roles)

### Due Dates (10)
**From:** Any dashboard, project detail, selections home
**Description:** Chronological list using due_this_week_list and status_badge.
**Actions:**
- Tap item → Navigate to role-appropriate Selection Item Detail (Builder Level 5 or Client 09)
- Filter by overdue, this week, this month

### Photos (11)
**From:** Any dashboard, project detail
**Description:** Grid gallery with upload capability.
**Actions:**
- Tap photo → Open full-screen view with caption
- Tap upload → Open image picker → Add caption → Upload to Firebase Storage
- Delete photo (Builder only)

### Messages (12)
**From:** Any dashboard, project detail
**Description:** Project-scoped chat thread.
**Actions:**
- Type message → Tap send → Write to messages collection
- Scroll to load older messages
- View message timestamps and sender

---

## Modal/Overlay Flows

### Option Upload Modal (Builder Only)
**Triggered From:** Builder Project Detail, Builder Selection Items List
**Description:** Uses option_upload_form component.
**Actions:**
- Fill form (title, link, image, price, category)
- Upload image to Firebase Storage
- Save to options collection
- Close → Return to previous page

### Approval Confirmation Modal (Client Only)
**Triggered From:** Client Selection Item Detail "Approve" button
**Description:** Confirmation dialog before locking approval.
**Actions:**
- Confirm → Write approvedAt, lock item, close modal
- Cancel → Close modal

### Change Request Form (Client Only)
**Triggered From:** Client Selection Item Detail "Request Change" button
**Description:** Form to submit change request with reason.
**Actions:**
- Enter reason text
- Submit → Create change request document, notify builder
- Cancel → Close form

### Room Assignment Modal (Builder Only)
**Triggered From:** Builder Selection Item Detail (for lighting items)
**Description:** Uses room_assignment_selector component.
**Actions:**
- Select room → Write to item.roomId
- Room hides when fixture count met
- Close → Return to Builder Selection Item Detail

---

## Navigation Patterns

### Back Navigation
- All pages support back button to previous page
- Breadcrumb trail for deep navigation (Level 4+)

### Bottom Navigation (Optional)
- Builder: Dashboard, Projects, Messages
- Client: Dashboard, Selections, Photos, Messages

### Deep Linking
- Support direct links to specific items: `/project/{projectId}/item/{itemId}`
- Maintains role-based access control
