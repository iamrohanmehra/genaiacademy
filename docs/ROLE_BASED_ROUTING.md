# Role-Based Dashboard Routing

## Overview

The application now has two separate dashboards:
1. **Admin Dashboard** (`/admin/dashboard`) - For users with `role: 'admin'`
2. **Student Dashboard** (`/student/dashboard`) - For users with `role: 'student'` or `role: 'instructor'`

## Authentication Flow

### Signup Flow
```
User signs up → Supabase Auth creates account
    ↓
Backend creates user with role: 'student' (default)
    ↓
Frontend routes based on role:
  - admin → /admin/dashboard
  - student/instructor → /student/dashboard
```

### Login Flow
```
User logs in → Supabase Auth validates credentials
    ↓
Frontend calls /api/auth/verify with JWT token
    ↓
Backend returns user with role
    ↓
Frontend routes based on role:
  - admin → /admin/dashboard
  - student/instructor → /student/dashboard
```

### Logout Flow
```
User clicks logout → Frontend calls supabase.auth.signOut()
    ↓
Session cleared
    ↓
User redirected to /login
```

## Backend Endpoint Required

### GET /api/auth/verify

Verifies the authenticated user and returns their profile (for all roles).

**Request:**
```typescript
Headers: {
  Authorization: Bearer <supabase-jwt-token>
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+91 98765 43210",
    "avatar": null,
    "role": "student",
    "status": "active",
    "lastActivity": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Response (Not Found - 404):**
```json
{
  "success": false,
  "error": "User not found in database"
}
```

**Response (Forbidden - 403):**
```json
{
  "success": false,
  "error": "Account is not active"
}
```

**Response (Unauthorized - 401):**
```json
{
  "success": false,
  "error": "Unauthorized - Invalid token"
}
```

## Backend Implementation

```typescript
import { Hono } from 'hono'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'

// GET /api/auth/verify - Verify any authenticated user
app.get('/api/auth/verify', async (c) => {
  const supabaseUser = c.get('supabaseUser') // From auth middleware

  try {
    // Get user from database by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, supabaseUser.email))
      .limit(1)

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found in database' 
      }, 404)
    }

    // Check if user is active
    if (user.status !== 'active') {
      return c.json({ 
        success: false, 
        error: 'Account is not active' 
      }, 403)
    }

    // Update last activity
    await db
      .update(users)
      .set({ 
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    // Return user profile (frontend will route based on role)
    return c.json({ 
      success: true, 
      user: user 
    })
  } catch (error) {
    console.error('Verify error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to verify user' 
    }, 500)
  }
})

// GET /api/admin/verify - Keep this for backward compatibility
// This endpoint specifically checks for admin role
app.get('/api/admin/verify', async (c) => {
  const supabaseUser = c.get('supabaseUser')

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, supabaseUser.email))
      .limit(1)

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found in database' 
      }, 404)
    }

    if (user.status !== 'active') {
      return c.json({ 
        success: false, 
        error: 'Account is not active' 
      }, 403)
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return c.json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, 403)
    }

    await db
      .update(users)
      .set({ 
        lastActivity: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    return c.json({ success: true, user })
  } catch (error) {
    console.error('Verify error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to verify admin access' 
    }, 500)
  }
})
```

## Frontend Routing Logic

### Login Form
```typescript
// After successful authentication
const { user: userData } = await response.json()

// Route based on role
if (userData.role === 'admin') {
  navigate("/admin/dashboard")
} else if (userData.role === 'student' || userData.role === 'instructor') {
  navigate("/student/dashboard")
} else {
  toast.error("Invalid user role")
  await supabase.auth.signOut()
}
```

### Signup Form
```typescript
// After successful signup and backend user creation
const { user: backendUser } = await response.json()

// Route based on role
if (backendUser.role === 'admin') {
  navigate("/admin/dashboard")
} else {
  // Students and instructors go to student dashboard
  navigate("/student/dashboard")
}
```

## User Roles

### Admin
- **Role**: `'admin'`
- **Dashboard**: `/admin/dashboard`
- **Permissions**: Full access to admin features
- **How to create**: Manually promote user in database

### Student (Default)
- **Role**: `'student'`
- **Dashboard**: `/student/dashboard`
- **Permissions**: Access to learning features
- **How to create**: Automatic on signup

### Instructor
- **Role**: `'instructor'`
- **Dashboard**: `/student/dashboard` (same as student for now)
- **Permissions**: Can be customized later
- **How to create**: Manually promote user in database

## Promoting Users

### Promote to Admin
```sql
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';
```

### Promote to Instructor
```sql
UPDATE users 
SET role = 'instructor', updated_at = NOW()
WHERE email = 'user@example.com';
```

### Demote to Student
```sql
UPDATE users 
SET role = 'student', updated_at = NOW()
WHERE email = 'user@example.com';
```

## Logout Implementation

The logout button is now functional in the sidebar:

```typescript
const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      toast.error("Failed to logout")
    } else {
      toast.success("Logged out successfully")
      navigate("/login")
    }
  } catch (error) {
    toast.error("An error occurred during logout")
  }
}
```

## Testing

### Test Student Flow
1. Sign up with a new account
2. Should be created with `role: 'student'`
3. Should be redirected to `/student/dashboard`
4. Click logout → Should redirect to `/login`

### Test Admin Flow
1. Promote a user to admin in database
2. Login with that account
3. Should be redirected to `/admin/dashboard`
4. Click logout → Should redirect to `/login`

### Test Role Switching
1. Login as student → Goes to `/student/dashboard`
2. Logout
3. Promote to admin in database
4. Login again → Goes to `/admin/dashboard`

## Security Notes

- ✅ All users must be authenticated
- ✅ Role is verified on backend
- ✅ Status is checked (must be 'active')
- ✅ Last activity is tracked
- ✅ Logout clears Supabase session
- ✅ Frontend routes based on backend-verified role

## Dashboard Customization

You can now customize each dashboard independently:

- **Admin Dashboard** (`app/routes/admin/dashboard.tsx`)
  - Batch management
  - User management
  - Analytics
  - Settings

- **Student Dashboard** (`app/routes/student/dashboard.tsx`)
  - Course enrollment
  - Learning progress
  - Assignments
  - Certificates
