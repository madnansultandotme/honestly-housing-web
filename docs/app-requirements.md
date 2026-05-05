# Home Builder Client Selections App Requirements (Developer POV)

Date: May 1, 2026
Platform: FlutterFlow + Firebase Auth, Firestore, Storage
Roles: Builder Team, Clients

## Architecture and Implementation Notes
- Auth: Firebase Auth with role-based routing; user profile stores role and builder org.
- Data: Firestore for projects, rooms, selections, options, approvals; Storage for images.
- Navigation: Guarded routes per role; project-scoped deep links for selections and messages.
- UI: Boutique luxury style, clean white space, warm neutrals, soft taupe, brass accent, rounded cards.
- MVP: All approvals inside app; status tracking and due dates are visible to both roles.

## Core Flows (FlutterFlow)
- Builder flow: Login -> Dashboard -> Projects -> Project Detail -> Project Setup -> Categories -> Options -> Review Approvals -> Photos -> Messages.
- Client flow: Login -> Client Portal -> Selections Home -> Category -> Item Detail -> Approve or Request Change -> Messages -> Photos.

## Pages (12) with Specs (each <= 1000 chars)
1) Login: Email/password auth for both roles. After auth, load user profile and route to Builder Dashboard or Client Portal. Include password reset.
2) Dashboard: Role-based summary. Builder shows counts of approvals pending, due dates, and active projects. Client shows this week decisions and latest messages.
3) Projects: Builder sees list of all projects with status. Client sees assigned project(s) only. Tap goes to Project Detail.
4) Project Detail: Shows project info, room counts (beds/baths/fixtures), selection progress, due date list, and status counts. Builder can edit setup.
5) Builder Project Setup: Builder selects rooms, sets counts, sets per-category allowance or price per sq ft, and saves as a template for reuse.
6) Client Portal: Client entry point to selections, photos, messages. Shows a summary of progress and decisions needed.
7) Selections Home: Progress bar (completed/total), sections for Due This Week, Awaiting Approval, Approved, Installed.
8) Selection Categories: List of categories and sub-items. Tap opens item list filtered to the category.
9) Selection Item Detail: Visual approval card with image, brand/item name, allowance, actual cost, difference, notes, due date, and actions (Approve, Request Change).
10) Due Dates: Chronological list of upcoming selection due dates for the project.
11) Photos: Project photo gallery with captions and timestamps.
12) Messages: Project-scoped chat thread for builder and client.

## Components (10) with Specs (each <= 1000 chars)
1) Visual Approval Card: Displays product image, category, brand/item name, allowance, actual cost, upgrade difference, notes, due date, and actions.
2) Status Badge: Shows one of Not Started, Needs Builder Input, Awaiting Client Approval, Approved, Ordered, Installed.
3) Budget Impact Row: Shows allowance, chosen cost, and delta; positive for upgrade, negative for savings.
4) Progress Bar: Shows completed selections count (e.g., 18/26) and percent.
5) Due This Week List: Short list of upcoming due selections with due date and category.
6) Curated Option Card: Good/Better/Best option with price and upgrade difference.
7) Room Assignment Selector: Assigns lighting to rooms; hides a room when required fixture count is met.
8) Allowance Prompt: Toggle and input for category allowance or price per sq ft budget.
9) Option Upload Form: Title, link, image, price, category; builder-only.
10) Category Checklist: Per-project checklist of required categories and completion status.

## Selection Categories and Items (from requirements)
- Flooring: Tile, LVP, Engineered Hardwood, Hardwood
- Lighting: Ceiling Fan, Down Rod, Vanity Light, Interior Sconce, Exterior Sconce, Chandelier, Exterior Chandelier, Under Cabinet Lighting, Upper Cabinet Lighting, Flood Lights, Exterior Uplights
- Plumbing: Kitchen Faucet, Kitchen Sink Drain, Kitchen Sink, Pot Filler, Disposal, Bathroom Faucet, Tub/Shower Faucet, Shower System, Shower Drain, Tub Drain + Overflow, Laundry Sink, Laundry Faucet, Alcove Tub, Free Standing Tub, Tub Filler
- Paint: Wall, Ceiling, Trim, Cabinet, Door, Stain
- Tile: Floor Tile, Wall Tile
- Countertops: Granite, Quartz, Quartzite
- Hardware: Knobs, Pulls

## Firestore Data Outline (developer view)
- users: role, builderOrgId, displayName, projectIds
- builderOrgs: name, branding
- projects: builderOrgId, clientId, rooms, counts, status, dueDates
- categories: projectId, name, required
- items: projectId, categoryId, name, brand, imageUrl, linkUrl, allowance, actualCost, notes, status, dueDate, approvedAt
- options: builderOrgId, categoryId, name, imageUrl, linkUrl, price
- messages: projectId, senderId, text, createdAt
- photos: projectId, imageUrl, caption, createdAt

## Budget and Approval Rules
- Always show allowance, chosen cost, and delta on item detail.
- Approve action stores timestamp and locks item; future change requires a change request.

## Open Questions (from requirements)
- CSV upload for options vs one-by-one entry.
- Format to provide initial materials list.
- Pulling prices from affiliate links (Amazon).
- Mood board image generation after selections.
- App Store release requirements after MVP.
