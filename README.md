# Honestly Housing - Premium Selection Management Platform

A boutique luxury home builder selection management platform built with Next.js 15+, TypeScript, and Firebase.

## 🎯 Project Overview

Honestly Housing enables home builders to manage client selections with a premium, boutique aesthetic. The platform streamlines the selection process from initial setup through final approval, with dedicated portals for both builders and clients.

## ✨ Key Features

### For Builders
- **Project Management** - Create and manage multiple projects with room configurations
- **Options Library** - Curate Good/Better/Best options with CSV bulk upload
- **Selection Tracking** - Monitor client selections and approval status
- **Budget Management** - Set allowances and track actual costs
- **Template System** - Save and reuse project configurations
- **CSV Export** - Export materials lists for ordering
- **Real-time Messaging** - Communicate with clients per project
- **Photo Gallery** - Upload and organize project photos

### For Clients
- **Selection Portal** - Browse and approve builder-curated options
- **Progress Tracking** - View completion status across all categories
- **Due Date Management** - See upcoming selection deadlines
- **Change Requests** - Request changes to approved selections
- **Budget Visibility** - Track spending against allowances
- **Messaging** - Chat with builder about project details
- **Photo Access** - View project progress photos

## 🏗️ Tech Stack

- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom theme
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Authentication:** Firebase Auth
- **Database:** Cloud Firestore with subcollections
- **Hosting:** Firebase App Hosting
- **External APIs:** Rainforest API (Amazon price scraping)

## 📁 Project Structure

```
honestly-housing/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── builder/           # Builder-specific pages
│   │   ├── client/            # Client-specific pages
│   │   ├── projects/          # Project pages
│   │   └── login/             # Authentication pages
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── navigation/        # Headers and navigation
│   │   ├── selections/        # Selection-specific components
│   │   └── builder/           # Builder-specific components
│   ├── contexts/              # React contexts (Auth, etc.)
│   ├── hooks/                 # Custom React hooks
│   └── lib/
│       ├── api/               # API client and utilities
│       └── firebase/          # Firebase configuration
├── docs/                      # Documentation
│   ├── firebase-schema/       # Database schema definitions
│   └── *.md                   # Feature documentation
├── public/                    # Static assets
├── .env.local                 # Local environment variables
├── .env.production            # Production environment variables
├── apphosting.yaml            # Firebase App Hosting config
├── firestore.indexes.json     # Firestore indexes
├── firestore.rules            # Firestore security rules
└── storage.rules              # Storage security rules
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Auth, Firestore, and Storage enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd honestly-housing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

   Required variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `RAINFOREST_API_KEY` (optional, for Amazon price scraping)

4. **Deploy Firestore indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

5. **Deploy Firestore rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

### Firebase App Hosting

1. **Create secrets in Google Cloud Secret Manager**
   ```bash
   firebase apphosting:secrets:set firebase-admin-private-key
   # Paste your private key when prompted
   
   firebase apphosting:secrets:set rainforest-api-key
   # Paste your API key when prompted
   ```

2. **Deploy to Firebase App Hosting**
   ```bash
   firebase deploy --only apphosting
   ```

3. **Verify deployment**
   - Check Firebase Console for deployment status
   - Test the live application URL
   - Verify authentication and database operations

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📚 Documentation

- **[AGENTS.md](AGENTS.md)** - Guidelines for AI coding assistants
- **[CLAUDE.md](CLAUDE.md)** - Claude-specific instructions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
- **[CHANGELOG.md](CHANGELOG.md)** - Recent changes and updates
- **[FEATURES_VERIFICATION.md](FEATURES_VERIFICATION.md)** - Complete feature verification
- **[docs/implementation-status.md](docs/implementation-status.md)** - Implementation status
- **[docs/firebase-schema/](docs/firebase-schema/)** - Database schema definitions

## 🎨 Design System

### Colors
- **Primary:** Blue (#2563EB)
- **Accent:** Brass (#B8860B)
- **Neutral:** Warm grays
- **Background:** Taupe (#F5F5DC)

### Typography
- **Display Font:** Playfair Display (headings)
- **Body Font:** Inter (content)

### Components
- Rounded cards (1rem border radius)
- Rounded buttons (0.5rem border radius)
- Soft shadows
- Smooth transitions
- Premium spacing

## 🔐 Security

- Firebase Authentication for user management
- Role-based access control (builder, client, admin)
- Firestore security rules for data protection
- Storage security rules for file uploads
- Server-side API routes with Firebase Admin SDK
- Environment variables for sensitive data
- Google Cloud Secret Manager for production secrets

## 📊 Features Status

### ✅ Implemented (95%)
- Authentication & user management
- Project CRUD operations
- Selection workflow with approvals
- Builder and client dashboards
- Options library with CSV upload
- Photo gallery
- Messaging system
- Loading animations
- All 12 required pages
- All 10 required UI components
- Complete API backend
- Role-based access control

### ❌ Not Implemented
- **AI Mood Board** - Marked as "coming soon" (future enhancement)
- **Client Invitation System** - Can be added later
- **Full Affiliate Link Tracking** - Partially implemented

See [FEATURES_VERIFICATION.md](FEATURES_VERIFICATION.md) for complete feature list.

## 🧪 Testing

### Manual Testing
1. Create a builder account
2. Create a project with rooms and fixture counts
3. Add options to the options library
4. Create selections for the project
5. Create a client account
6. Assign client to project
7. Test approval workflow as client
8. Test messaging between builder and client
9. Upload photos to project
10. Export materials list as CSV

### Automated Testing
- Unit tests: Not yet implemented
- Integration tests: Not yet implemented
- E2E tests: Not yet implemented

## 🤝 Contributing

1. Read [AGENTS.md](AGENTS.md) for coding guidelines
2. Follow the existing code style and patterns
3. Update documentation when adding features
4. Test thoroughly before committing
5. Write clear commit messages

## 📝 License

[Add your license here]

## 👥 Team

[Add team information here]

## 📞 Support

For questions or issues:
- Check documentation in `/docs`
- Review [FEATURES_VERIFICATION.md](FEATURES_VERIFICATION.md)
- Check [CHANGELOG.md](CHANGELOG.md) for recent changes

---

**Built with ❤️ for home builders and their clients**

**Last Updated:** May 5, 2026
