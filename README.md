# GenAI Academy - Admin Dashboard

A modern, high-performance admin interface for managing the GenAI Academy platform. This comprehensive dashboard allows administrators to manage users, courses, enrollments, and platform content with a seamless, responsive user experience.

## 🚀 Features

### 👤 User Management
-   **Advanced Filtering**: Client-side filtering for "All Time", "Today", "Yesterday", and custom date ranges, ensuring instant and accurate results.
-   **Search**: Real-time search by name or email.
-   **Actions**: Ban, Activate, and Edit user details.
-   **Responsive Table**: Horizontally scrolling data table with configurable columns.

### 📚 Course Management
-   **CRUD Operations**: Full Create, Read, Update, Delete capabilities for courses.
-   **Content Builder**: Drag-and-drop curriculum builder for Sections and Chapters (`@dnd-kit`).
-   **Scheduling**: Manage Live class schedules and recordings.
-   **Rich Media**: Support for video links, meeting links, and session tracking.

### 🎓 Enrollment & Progress
-   **Enrollment Tracking**: Monitor student enrollments, payment status, and validity.
-   **Progress Monitoring**: View detailed progress (time watched, chapters completed) for individual students.
-   **Manual Management**: Manually enroll users or revoke access.

### 🎨 UI & UX
-   **Modern Design**: Built with Shadcn UI and Tailwind CSS v4 for a premium, consistent aesthetic.
-   **Responsive**: Fully optimized for Desktop, Tablet, and Mobile devices.
-   **Performance**: Optimized with React Query for caching, optimistic updates, and background re-fetching.

---

## 🛠️ Tech Stack

-   **Runtime**: [Bun](https://bun.sh) (Required)
-   **Framework**: [React Router v7](https://reactrouter.com/)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest)
-   **Forms**: React Hook Form + Zod
-   **Utilities**: date-fns, sonner (Toasts)

---

## 🏁 Getting Started

### Prerequisites
-   **Bun**: This project explicitly uses `bun` as the package manager. [Install Bun](https://bun.sh/docs/installation).

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd genaiacademy
    ```

2.  **Install Dependencies**
    ```bash
    bun install
    ```

3.  **Environment Setup**
    Copy the example environment file and configure your API keys (Supabase, Backend URL).
    ```bash
    cp .env.example .env
    ```

4.  **Run Development Server**
    ```bash
    bun run dev
    ```
    The app will be available at `http://localhost:5173`.

---

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `bun run dev` | Starts the development server with HMR. |
| `bun run build` | Builds the application for production (Vite + React Router). |
| `bun run start` | Speculative start command (check package.json). |
| `bun run typecheck` | Runs TypeScript validation across the project. |
| `bun run lint` | Runs ESLint to catch code quality issues. |

---

## 📂 Project Structure

```
genaiacademy/
├── app/
│   ├── components/      # Reusable UI components (Shadcn, Admin specific)
│   ├── hooks/           # Custom React hooks (useDebounce, etc.)
│   ├── lib/             # Utilities, API client, Query Keys, Supabase client
│   ├── routes/          # Page routes (admin/users, admin/courses, etc.)
│   ├── types/           # TypeScript definitions
│   ├── root.tsx         # Root layout
│   └── routes.ts        # Route definitions
├── public/              # Static assets
└── ...config files      # Vite, Tailwind, TSConfig
```

## 🔒 Deployment

The project is configured for deployment on **Vercel** located in the **Mumbai (ap-south-1)** region.
-   **Build Command**: `bun run build`
-   **Output Directory**: `dist` (or as configured in Vite)

---

Built with ❤️ by the GenAI Academy Engineering Team.
