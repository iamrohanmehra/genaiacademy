# Authentication API Integration

## Overview

Your frontend is now integrated with your Hono backend for authentication and admin role verification.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────┘

1. User enters email & password
   ↓
2. Frontend → Supabase Auth (signInWithPassword)
   ↓
3. Supabase returns JWT token + user data
   ↓
4. Frontend → Hono Backend (/api/admin/verify)
   Headers: Authorization: Bearer <JWT>
   ↓
5. Backend verifies JWT with Supabase
   ↓
6. Backend checks user role in database
   ↓
7. If role === 'admin' → Success ✅
   If role !== 'admin' → 403 Forbidden ❌
   If user not found → 404 Not Found ❌
   ↓
8. Frontend navigates to /admin/dashboard


┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOW                               │
└─────────────────────────────────────────────────────────────┘

1. User enters name, email, password
   ↓
2. Frontend → Supabase Auth (signUp)
   ↓
3. Supabase creates auth user & returns JWT
   ↓
4. Frontend → Hono Backend (/api/auth/signup)
   Headers: Authorization: Bearer <JWT>
   Body: { email, full_name }
   ↓
5. Backend creates user record in database
   Default role: 'user' (not admin)
   ↓
6. Frontend checks user role
   ↓
7. If admin → Navigate to dashboard
   If not admin → Show "wait for approval" message
```

## API Endpoints Required in Your Hono Backend

### 1. POST /api/auth/signup
Creates a new user in your database after Supabase signup.

**Request:**
```typescript
Headers: {
  Authorization: Bearer <supabase-jwt-token>
  Content-Type: application/json
}

Body: {
  email: string
  full_name: string
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response (Error - 400/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### 2. GET /api/admin/verify
Verifies that the authenticated user has admin role.

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
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response (Forbidden - 403):**
```json
{
  "success": false,
  "error": "Forbidden - Admin access required"
}
```

**Response (Not Found - 404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Response (Unauthorized - 401):**
```json
{
  "success": false,
  "error": "Unauthorized - Invalid token"
}
```

## Hono Backend Implementation Example

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

// CORS configuration
app.use('/*', cors({
  origin: [
    'http://localhost:5173',
    'https://yourdomain.com'
  ],
  credentials: true,
}))

// Supabase client with service role
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Middleware to verify JWT and extract user
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      success: false, 
      error: 'Unauthorized - No token provided' 
    }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, 401)
    }

    // Store user in context
    c.set('supabaseUser', user)
    await next()
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Unauthorized - Invalid token' 
    }, 401)
  }
})

// POST /api/auth/signup - Create user in database
app.post('/api/auth/signup', async (c) => {
  const supabaseUser = c.get('supabaseUser')
  const { email, full_name } = await c.req.json()

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    if (existingUser) {
      return c.json({ success: true, user: existingUser })
    }

    // Create new user with default 'user' role
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: supabaseUser.id,
        email: email,
        full_name: full_name,
        role: 'user' // Default role
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return c.json({ success: true, user: newUser }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to create user' 
    }, 500)
  }
})

// GET /api/admin/verify - Verify admin role
app.get('/api/admin/verify', async (c) => {
  const supabaseUser = c.get('supabaseUser')

  try {
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    if (error || !user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return c.json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, 403)
    }

    return c.json({ success: true, user })
  } catch (error) {
    console.error('Verify error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to verify admin access' 
    }, 500)
  }
})

// All other admin endpoints
app.use('/api/admin/*', async (c, next) => {
  const supabaseUser = c.get('supabaseUser')

  // Get user and verify admin role
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', supabaseUser.id)
    .single()

  if (!user || user.role !== 'admin') {
    return c.json({ 
      success: false, 
      error: 'Forbidden - Admin access required' 
    }, 403)
  }

  await next()
})

export default app
```

## Database Schema

Your `users` table should have:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'instructor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster role lookups
CREATE INDEX idx_users_role ON users(role);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Only admins can update roles
CREATE POLICY "Admins can update users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Testing

### 1. Test Signup
```bash
# This will be done through the UI
# Navigate to /signup and create an account
```

### 2. Test Login (Non-Admin)
```bash
# Login with a regular user account
# Should see: "Your account has been created. Please wait for admin approval"
```

### 3. Promote User to Admin
```sql
-- In Supabase SQL Editor
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 4. Test Login (Admin)
```bash
# Login again with the same account
# Should successfully navigate to /admin/dashboard
```

### 5. Test API Directly
```bash
# Get your JWT token from browser DevTools after login
# Look in: Application → Local Storage → supabase.auth.token

export TOKEN="your-jwt-token"

# Test verify endpoint
curl http://localhost:3000/api/admin/verify \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling

The frontend now handles these scenarios:

1. **Invalid Credentials** → Shows error toast
2. **Not Admin** → Shows "Admin privileges required" and signs out
3. **User Not Found** → Shows "Contact administrator" and signs out
4. **Backend Down** → Shows "Failed to verify admin access"
5. **Network Error** → Shows generic error message

## Security Checklist

- [x] JWT tokens sent in Authorization header
- [x] Admin role verified on backend
- [x] User signed out if not admin
- [x] Service role key only on backend
- [x] CORS configured for your domain
- [x] RLS enabled on users table
- [ ] Rate limiting on auth endpoints
- [ ] Email confirmation enabled
- [ ] Password strength requirements
- [ ] Account lockout after failed attempts

## Next Steps

1. Deploy your Hono backend to DigitalOcean
2. Update `VITE_API_URL` in `.env` with production URL
3. Create your first admin user in Supabase
4. Test the complete flow
5. Set up email confirmation in Supabase
6. Add rate limiting to prevent brute force attacks
