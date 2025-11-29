# Authentication Implementation

This document details the final, working implementation of authentication in the frontend, fully compliant with `API_DOCUMENTATION.md`.

## 1. Login Flow (`login-form.tsx`)

The login process now uses the backend's `POST /api/auth/login` endpoint.

### Steps:
1.  **User Input**: User enters email and password.
2.  **Backend Call**: Frontend calls `POST /api/auth/login` with credentials.
3.  **Response Handling**:
    *   Backend returns `{ success: true, data: { user, session } }`.
    *   **Session Sync**: Frontend calls `supabase.auth.setSession(session)` to ensure the Supabase client is authenticated for future requests.
    *   **Routing**:
        *   If `user.role === 'admin'` -> Redirect to `/admin/dashboard`.
        *   If `user.role === 'student'` -> Redirect to `/student/dashboard`.

## 2. Signup Flow (`signup-form.tsx`)

The signup process now uses the backend's `POST /api/auth/signup` endpoint.

### Steps:
1.  **User Input**: User enters name, email, password, mobile.
2.  **Backend Call**: Frontend calls `POST /api/auth/signup`.
    *   *Note*: This endpoint handles both Supabase Auth creation and Database user creation atomically.
3.  **Response Handling**:
    *   Backend returns `{ success: true, data: { user, session } }`.
    *   **Session Sync**: Frontend calls `supabase.auth.setSession(session)`.
    *   **Routing**: Redirects to `/student/dashboard` (default for new users).

## 3. Google OAuth

Google login remains client-side initiated:
1.  `supabase.auth.signInWithOAuth({ provider: 'google' })`.
2.  Redirects to `/student/dashboard`.
3.  *Future Improvement*: You may want to add a `useEffect` on the dashboard to call `GET /api/auth/verify` to ensure the Google user exists in your backend database.

## ✅ Compliance

- **No Undocumented APIs**: We are only using `POST /api/auth/login` and `POST /api/auth/signup`.
- **Role-Based Routing**: Fully implemented based on the `role` returned by the backend.
- **Session Management**: Supabase session is correctly synchronized.
