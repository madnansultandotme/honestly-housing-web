# Level 4+ Page Specifications

## Builder Selection Items List (Level 4)

**Navigation:** Builder Project Detail → Tap category or status section
**Role:** Builder only

Build a filtered list page showing selection items by category or status. Display items in card format with item name, image thumbnail, **status_badge**, due date, and budget summary. Add filter controls for status (All, Awaiting Approval, Approved, Ordered, Installed), category dropdown, and room filter (for lighting). Include "Add Option" button in header. Query items filtered by projectId and selected filters. Tap item navigates to Builder Selection Item Detail (Level 5). Design on white (#FFFFFF) with list cards using soft taupe (#D4C4B0) borders, brass accent (#B8956A) for Add Option button, warm neutral gray (#8B8680) for metadata. Apply professional spacing with clear touch targets.

---

## Builder Selection Item Detail (Level 5)

**Navigation:** Builder Selection Items List → Tap item
**Role:** Builder only

Build detailed item view for Builder management. Use **visual_approval_card** showing product image, category, brand, item name. Use **budget_impact_row** for allowance/cost/difference. Use **status_badge** for current status. Show client approval status prominently: if approved, display approvedAt timestamp and "Locked" indicator; if change requested, show change request details with client reason. Add edit controls: "Edit Details" (price, notes, due date), "Change Image", "Assign Room" (lighting only, uses **room_assignment_selector**), "Mark as Ordered", "Mark as Installed", "Delete Item". Query item, category, allowance, change requests. Write to item fields. Design on white (#FFFFFF) with brass accent (#B8956A) for action buttons, soft taupe (#D4C4B0) for info sections, warm neutral gray (#8B8680) for metadata. Apply professional spacing.

---

## Client Category Items List (Level 4)

**Navigation:** Client Selection Categories → Tap category
**Role:** Client only

Build filtered list showing items in selected category. Display items in card format with item name, image thumbnail, **status_badge**, due date, and budget impact preview using **budget_impact_row**. Show completion count at top: "X of Y completed in [Category Name]". Add room filter for lighting categories. Include sort options: Due Date, Status, Budget Impact. Query items by projectId and categoryId. Tap item navigates to Client Selection Item Detail (09). Design on white (#FFFFFF) with list cards using soft taupe (#D4C4B0) borders, brass accent (#B8956A) for progress indicators, warm neutral gray (#8B8680) for metadata. Apply professional spacing with comfortable touch targets.

---

## Curated Options View (Level 4)

**Navigation:** Client Selection Item Detail → Tap "View Options" or auto-show for new items
**Role:** Client only

Build options selection view showing Good/Better/Best tiers. Use **curated_option_card** component for each tier showing tier label, item name, image, price, upgrade difference from allowance. Highlight selected option with brass accent border. Show comparison: allowance amount, selected tier price, difference (upgrade or savings). Add "Select" button for each tier. Query options by categoryId and builderOrgId. On selection, update item with chosen option details (name, price, imageUrl, linkUrl) and return to Client Selection Item Detail. Design on white (#FFFFFF) with tier cards using soft taupe (#D4C4B0) backgrounds, brass accent (#B8956A) for selected tier and positive differences, warm neutral gray (#8B8680) for tier labels. Apply premium spacing for luxury feel.

---

## Modal Specifications

### Option Upload Modal (Builder)

**Trigger:** Builder Project Detail or Builder Selection Items List → Tap "Add Option"
**Component:** Uses **option_upload_form**

Build modal overlay with form to add curated option. Fields: Title (text input), Link URL (text input), Image (upload button), Price (currency input), Category (dropdown), Tier (Good/Better/Best dropdown). Image upload writes to Firebase Storage path `/options/{builderOrgId}/{optionId}`. On save, write to options collection with builderOrgId, categoryId, name, imageUrl, linkUrl, price, tier. Include "Save" button (brass accent #B8956A) and "Cancel" button (warm neutral gray #8B8680). Design with white (#FFFFFF) modal card, soft taupe (#D4C4B0) input borders. Apply rounded corners and premium spacing.

---

### Approval Confirmation Modal (Client)

**Trigger:** Client Selection Item Detail → Tap "Approve" button

Build confirmation dialog overlay. Show item name, image thumbnail, final cost, and budget impact. Display warning text: "Once approved, this selection will be locked and cannot be changed without a change request." Include "Confirm Approval" button (brass accent #B8956A) and "Cancel" button (soft taupe #D4C4B0). On confirm, write approvedAt timestamp, set status to "Approved", set locked flag to true, close modal, show success toast, return to previous page. Design with white (#FFFFFF) modal card, rounded corners, premium spacing.

---

### Change Request Form (Client)

**Trigger:** Client Selection Item Detail → Tap "Request Change" button

Build form overlay to submit change request. Show current item details (name, image, price). Add text area for reason (required, min 10 characters). Include optional fields: preferred alternative (text), budget concern (checkbox). Add "Submit Request" button (brass accent #B8956A) and "Cancel" button (soft taupe #D4C4B0). On submit, create document in changeRequests collection with projectId, itemId, requestedBy (userId), reason, status "Pending", createdAt timestamp. Send notification to builder. Close modal, show success toast, return to previous page. Design with white (#FFFFFF) modal card, soft taupe (#D4C4B0) input borders, warm neutral gray (#8B8680) for helper text.

---

### Room Assignment Modal (Builder)

**Trigger:** Builder Selection Item Detail → Tap "Assign Room" (lighting items only)
**Component:** Uses **room_assignment_selector**

Build modal overlay with room picker. Display list of rooms from project with fixture counts: "Master Bedroom (2/3 fixtures assigned)". Use **room_assignment_selector** component logic to hide rooms when fixture count is met. Show current assignment if exists. Include "Assign" button (brass accent #B8956A) and "Cancel" button. On assign, write selected roomId to item.roomId, increment room fixture count, close modal. Design with white (#FFFFFF) modal card, soft taupe (#D4C4B0) for room cards, brass accent (#B8956A) for selected room. Apply rounded corners and premium spacing.

---

## Navigation Components

### Breadcrumb Trail (Level 4+)

Build breadcrumb navigation for deep pages. Show path: "Projects > [Project Name] > [Category Name] > [Item Name]". Each segment is tappable to navigate back. Display at top of page below header. Design with warm neutral gray (#8B8680) text, brass accent (#B8956A) for current page, chevron separators. Apply compact spacing.

---

### Item Swipe Navigation (Client Selection Item Detail)

Build swipe gesture or arrow buttons to navigate between items in same category. Show "Previous" and "Next" buttons at bottom of Client Selection Item Detail. Disable buttons at list boundaries. Query adjacent items by category and sort order. Design with brass accent (#B8956A) for enabled buttons, soft taupe (#D4C4B0) for disabled. Apply professional spacing.
