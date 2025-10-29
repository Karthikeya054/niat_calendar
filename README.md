# EdTech Calendar UI

## 1. Overview

This is a modern, feature-rich, and responsive frontend application for an EdTech calendar and scheduling system. It provides a highly interactive and user-friendly interface for students, teachers, and administrators to manage academic and extracurricular schedules.

Built with **React**, **TypeScript**, and **Tailwind CSS**, this application is designed for performance, scalability, and easy integration with a backend API. It currently operates with a mock API service for standalone demonstration and development.

---

## 2. Key Features

The application is packed with features designed to meet the needs of a busy educational institution:

-   **Multiple Calendar Views**: Seamlessly switch between **Month**, **Week**, **Agenda**, and a high-level **Year** view to visualize your schedule in the way that suits you best.
-   **Role-Based Access Control (RBAC)**: A sophisticated permission system ensures that users can only perform actions appropriate for their role (e.g., Program Ops can create events, while Students have read-only access).
-   **Dynamic Event Management**:
    -   Create, view, and update events through an intuitive modal.
    -   Drag-and-drop events to quickly reschedule them.
    -   Support for both all-day and timed events.
-   **Color-Coded Event Types**: Assign custom colors to different event types (e.g., Holiday, Exam, Club Activity) for at-a-glance clarity.
-   **Intuitive Event Highlighting**: Filter the calendar by selecting one or more event types. Selected events are highlighted, while others are de-emphasized, keeping the full schedule in context.
-   **Secure & Configurable Login**: User permissions are determined by a configurable list of authorized emails, ensuring only specific users have editing access.
-   **Calendar Sharing**: Generate a secure, read-only link to share a calendar with guests or external stakeholders.
-   **Fully Responsive**: The interface is optimized for a seamless experience on both desktop and mobile devices.

---

## 3. Project Structure

The project follows a standard React application structure. Key files and directories are organized as follows:

```
/
├── index.html            # The main HTML entry point for the application.
├── metadata.json         # Project metadata.
├── package.json          # Project dependencies and scripts.
├── README.md             # This documentation file.
└── src/
    ├── App.tsx           # Main application component, handles routing and auth state.
    ├── components/       # Contains all reusable React components.
    │   ├── CalendarDashboard.tsx # The main view after login, orchestrating all calendar components.
    │   ├── CustomEvent.tsx       # Renders a single event in the calendar.
    │   ├── CustomToolbar.tsx     # Custom navigation/view-switcher for the calendar.
    │   ├── EventModal.tsx        # Modal for creating/editing events.
    │   ├── Header.tsx            # Top navigation bar with user profile.
    │   ├── Icons.tsx             # SVG icon components.
    │   ├── LoginScreen.tsx       # The user login page.
    │   ├── ShareModal.tsx        # Modal for displaying the shareable calendar link.
    │   ├── Sidebar.tsx           # Left sidebar for calendar/filter selection.
    │   └── YearView.tsx          # Component for the annual overview.
    ├── services/         # API service definitions.
    │   └── mockApiService.ts   # Simulates a backend API for development.
    ├── constants.ts      # Global constants (roles, event types, permissions).
    ├── index.tsx         # The main entry point that renders the React app.
    └── types.ts          # TypeScript type definitions for data models (User, Event, etc.).
```

---

## 4. Getting Started (Frontend Setup)

Follow these steps to get the frontend application running on your local machine.

### Prerequisites

-   A modern web browser.
-   This project is set up to run in a web-based development environment and requires no local installation of Node.js or npm.

### Running the Application

This application is designed to run directly in a compatible web-based development environment. Simply load the project files, and the environment's live server will automatically serve the application.

You can then open the preview pane or the provided URL to use the application. The app uses a mock API service, so it works fully out-of-the-box for demonstration and development purposes.

---

## 5. Connecting to a Backend API

The application is designed for easy integration with a real backend. To connect, you will need to replace the mock service with a real API service and configure the API's base URL.

### Step 1: Create a `.env` File

In a real-world setup, you would create a `.env` file in the root directory to store your API URL.

**.env.local**
```
VITE_API_BASE_URL=http://localhost:8000/api
```
*Note: The environment variable mechanism (`import.meta.env`) is standard in Vite-based projects. Adjust the URL to match your backend server's address.*

### Step 2: Create a Real API Service

Create a new file `src/services/apiService.ts`. This file will handle all network requests to your backend using `fetch` or a library like `axios`.

Here is a template to get you started:
**src/services/apiService.ts**
```typescript
import { User, Event, Calendar, EventType } from '../types';

// In a real app, this would come from an environment variable.
const API_BASE_URL = 'http://localhost:8000/api'; // Replace with your backend URL

// Helper to handle API requests and errors
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken'); // The real JWT from your backend
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An API error occurred');
  }
  return response.json();
}

// Implement methods to match mockApiService.ts
class ApiService {
  async login(email: string): Promise<User> {
    const { user, token } = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    localStorage.setItem('authToken', token); // Store the real JWT
    return user;
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  async getMe(): Promise<User> {
    return apiRequest<User>('/users/me');
  }
  
  // ... implement all other methods: getEvents, createEvent, updateEvent, etc.
}

export const apiService = new ApiService();
```

### Step 3: Replace Mock Service with Real Service

In the application components (`src/App.tsx`, `src/components/LoginScreen.tsx`, etc.), replace imports and calls from `mockApiService` to your new `apiService`.

**Before:**
```typescript
import { mockApiService } from './services/mockApiService';
const currentUser = await mockApiService.getMe();
```

**After:**
```typescript
import { apiService } from './services/apiService'; // Your new service
const currentUser = await apiService.getMe();
```

---

## 6. Backend API Contract

For the frontend to function correctly, the backend server must provide a RESTful API that adheres to this contract.

### Authentication & Permissions

The backend is the source of truth for permissions. The login logic should be implemented as follows:

1.  The backend maintains a list of users who are authorized to have editing permissions.
2.  When a user logs in via `POST /api/auth/login`, the backend checks if their email is on the authorized list.
3.  Based on this check, the backend assigns the appropriate role (`PROGRAM_OPS` for editors, `STUDENT` for read-only) to the user object.
4.  The backend returns the `user` object and a JWT, which will be used for all subsequent authenticated requests.

### Endpoints

-   `POST /api/auth/login`
    -   **Request Body**: `{ "email": "user@example.com" }`
    -   **Response Body**: `{ "user": User, "token": "your_jwt_token" }`
-   `GET /api/users/me`
    -   **Headers**: `Authorization: Bearer <token>`
    -   **Response Body**: `User` object for the authenticated user.
-   `GET /api/calendars`
-   `GET /api/event-types`
-   `GET /api/calendars/:calendarId/events?start=<ISO_DATE>&end=<ISO_DATE>`
-   `POST /api/events` (Body: `Omit<Event, 'id'>`)
-   `PUT /api/events/:eventId` (Body: `Partial<Event>`)
-   `DELETE /api/events/:eventId`
-   `POST /api/calendars/:calendarId/share`

*The data models (`User`, `Event`, etc.) must match the structures defined in **`src/types.ts`**.*
