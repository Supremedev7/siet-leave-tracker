# SIET Leave Tracker

A role-based leave management system for students and staff at Srinivasa Institute of Engineering and Technology (SIET). The application streamlines leave applications, multi-level approvals, user management, notifications, and leave history through a responsive web interface.

**Live application:** [siet-leave-tracker.vercel.app](https://siet-leave-tracker.vercel.app)

## Features

### Student portal

- Apply for leave with date, duration, reason, and supporting details.
- View leave requests and approval status.
- Cancel eligible leave requests.
- Review profile information and leave history.
- Receive in-app notifications about request updates.

### Faculty portal

- Apply for faculty leave.
- Review and process student leave requests assigned to faculty.
- View personal leave requests and approval history.
- Access faculty profile information.

### Head of Department portal

- Review department leave requests.
- Approve or reject student and faculty leave requests.
- View all requests within the department.
- Manage faculty information.
- Configure department working days.
- Monitor leave activity through the department dashboard.

### Administrator portal

- View system-wide leave requests and approvals.
- Manage users and staff records.
- Process staff and faculty approvals.
- Maintain administrative profile information.
- Review system activity and request status.

### Platform capabilities

- Firebase Authentication and Cloud Firestore integration.
- Role-based access control for administrators, HODs, faculty, and students.
- Firestore security rules for users, leave requests, notifications, and audit data.
- In-app toast notifications and Firebase Cloud Messaging support.
- Responsive UI with light/dark theme support.
- Animated and data-driven dashboards.
- Vercel-ready production deployment.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS
- **Routing:** React Router
- **Backend services:** Firebase Authentication and Cloud Firestore
- **Forms and validation:** React Hook Form, Zod
- **UI components:** Radix UI, Lucide React
- **Charts and motion:** Recharts, Framer Motion
- **Notifications:** Sonner and Firebase Cloud Messaging
- **Deployment:** Vercel

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm
- A Firebase project with Authentication and Cloud Firestore enabled

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Supremedev7/siet-leave-tracker.git
   cd siet-leave-tracker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

4. Add your Firebase configuration to `.env`:

   ```dotenv
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   VITE_FIREBASE_VAPID_KEY="your-cloud-messaging-vapid-key"
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

   Vite will print the local development URL in the terminal.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production build. |
| `npm run lint` | Run ESLint across the project. |
| `npm run preview` | Preview the production build locally. |

## Firebase setup

Before using the application, configure the Firebase project used by the deployment:

1. Create or select a Firebase project.
2. Enable the authentication providers required by the application.
3. Create a Cloud Firestore database.
4. Register a web application and copy its configuration into `.env`.
5. Configure Firebase Cloud Messaging if push notifications are required.
6. Deploy or apply the rules in [`firestore.rules`](./firestore.rules).
7. Create the initial administrator account and required role records.

The application uses role-based authorization for `admin`, `hod`, `faculty`, and `student` users. Review the Firestore rules and application code before deploying to production, and never commit real Firebase credentials or private keys.

## Project structure

```text
.
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/           # Authentication and theme providers
│   ├── lib/                # Firebase and shared utilities
│   ├── pages/              # Landing, auth, student, faculty, HOD, and admin pages
│   ├── routes/             # Application routing and protected routes
│   ├── types/              # Shared TypeScript types
│   ├── App.tsx             # Application providers and shell
│   └── main.tsx            # React entry point
├── firestore.rules         # Firestore authorization rules
├── .env.example            # Required environment variable template
├── package.json            # Scripts and dependencies
└── vite.config.ts          # Vite configuration
```

## Deployment

The project can be deployed to Vercel:

1. Import the repository into Vercel.
2. Set the project framework to Vite, if it is not detected automatically.
3. Add all variables from `.env` to the Vercel project environment settings.
4. Deploy the project.
5. Add the deployed domain to the Firebase Authentication authorized domains.

## Security

- Keep `.env` files out of version control.
- Use the provided Firestore rules as a starting point and audit them for your deployment.
- Restrict Firebase services and user roles according to your institution's policies.
- Do not expose service-account credentials in frontend code.
- Test role-based access and approval workflows before going live.

## Contributing

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes and run the checks:

   ```bash
   npm run lint
   npm run build
   ```

4. Commit your changes and open a pull request.

## License

No license has been specified for this repository yet. Contact the repository owner before redistributing or using the project commercially.
