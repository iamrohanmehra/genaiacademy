---
trigger: always_on
---

# Antigravity IDE Rules - GenAI Academy Frontend

You are an expert senior frontend engineer working on the GenAI Academy project.
This is a **STRICTLY FRONTEND** repository.

## 1. Project Context & Architecture
- **Type**: Frontend Web Application.
- **Framework**: React Router v7.
- **Build Tool**: Vite.
- **Deployment**: Vercel (India Region).
- **Backend**: Hono (External, deployed on DigitalOcean).
- **Database & Auth**: Supabase (External).
- **Strict Constraint**: **NEVER** write backend code, database queries, or API routes (Next.js style `api/` folders) in this repository. All logic must be client-side or consume the external Hono API.

## 2. Tech Stack & Standards
- **Package Manager**: **ALWAYS** use `bun`. Do not use `npm`, `yarn`, or `pnpm`.
- **Language**: TypeScript (Strict mode). Use `import type` for types.
- **Styling**: Tailwind CSS v4. Use utility classes. Avoid custom CSS files.
- **UI Components**: Shadcn UI (Radix Primitives).
- **Icons**: `lucide-react`.
- **State Management**: `@tanstack/react-query` (React Query) for server state.
- **Forms**: `react-hook-form` + `zod` validation.
- **Date Handling**: `date-fns`.
- **Toast Notifications**: `sonner`.

## 3. Coding Rules & Patterns

### API Communication
- **Mandatory Client**: **ALWAYS** use the centralized `api` client from `app/lib/api.client.ts` (e.g., `api.get`, `api.post`). **NEVER** use raw `fetch` in components.
- **Global Error Handling**: 401 Unauthorized errors are handled globally by `QueryClient`. Do not manually catch 401s unless specific local logic is required.
- **Response Format**: Handle responses following the standard format: `{ success: boolean, message?: string, data?: any, error?: string }`.
- **Authentication**: The `api` client automatically handles the `Authorization` header when the token is passed.

### State Management (React Query)
- Use `useQuery` for fetching data.
- Use `useMutation` for modifying data (POST, PUT, DELETE).
- **CRITICAL**: Always invalidate relevant query keys (e.g., `queryClient.invalidateQueries({ queryKey: ['users'] })`) after a successful mutation to ensure UI consistency.

### Navigation & Routing
- Use `<Link>` from `react-router` for all internal navigation. **NEVER** use `<a>` tags for internal links as they cause full page reloads.
- **Sidebar Logic**: **NEVER** hardcode `isActive: true` in sidebar navigation data. Expansion must be dynamic based on the current URL (use `useLocation`).

### UI & Accessibility
- **High Contrast**: Ensure interactive elements (like checkboxes) have sufficient contrast against their background.
- **Conditional Styling**: When using colored row highlights (e.g., for banned users), adjust child element styles (borders, backgrounds) to ensure visibility.

### Component Structure
- Use Functional Components with Hooks.
- Co-locate related components if they are specific to a route.
- Use `export default` for Route components (pages).
- Use named exports for reusable UI components.
- Follow the `app/` directory structure: `routes`, `components`, `hooks`, `lib`.

### Supabase Integration
- Use the exported `supabase` client from `app/lib/supabase.ts`.
- **Security**: Do not use Supabase Admin SDK or service keys in this repo. Client-side keys (`ANON_KEY`) only.
- **Environment Variables**: Use `import.meta.env.VITE_*` for client-side variables. **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

## 4. Vercel Deployment Optimization
- Ensure `vite.config.ts` and `react-router.config.ts` are optimized for Vercel.
- Do not include heavy server-side dependencies that bloat the client bundle.
- Respect the `build` script: `bun run build` (aliased to `react-router build`).

## 5. Agent Behavior
- **Proactive Fixes**: If you see unused imports or type errors in files you are editing, fix them.
- **Verification**: After implementing a feature, verify it doesn't break the build (`bun run build`) or typecheck (`bun run typecheck`).
- **Conciseness**: Write clean, readable code. Avoid over-engineering.
