# Authentication with Your Schema

## Your Database Schema

```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  mobile: varchar('mobile', { length: 20 }),
  avatar: varchar('avatar', { length: 500 }),
  status: userStatusEnum('status').default('active').notNull(),
  role: userRoleEnum('role').default('student').notNull(),
  lastActivity: timestamp('last_activity', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

## Key Differences from Standard Setup

1. **Separate ID**: Your `users.id` is NOT linked to Supabase `auth.users.id`
2. **Email as Key**: We'll use `email` to link Supabase auth with your users table
3. **Role Values**: Default is `'student'`, need `'admin'` for admin access
4. **Status Field**: Can be used to enable/disable users

## Updated Backend Endpoints

### 1. POST /api/auth/signup

Creates a new user in your database after Supabase signup.

```typescript
import { Hono } from 'hono'
import { db } from './db' // Your Drizzle database instance
import { users } from './schema'
import { eq } from 'drizzle-orm'

app.post('/api/auth/signup', async (c) => {
  const supabaseUser = c.get('supabaseUser') // From auth middleware
  const { name, email, mobile } = await c.req.json()

  try {
    // Check if user already exists by email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return c.json({ 
        success: true, 
        user: existingUser[0],
        message: 'User already exists'
      })
    }

    // Create new user with default 'student' role
    const [newUser] = await db
      .insert(users)
      .values({
        name: name,
        email: email,
        mobile: mobile || null,
        role: 'student', // Default role
        status: 'active', // Default status
        lastActivity: new Date(),
      })
      .returning()

    return c.json({ 
      success: true, 
      user: newUser 
    }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to create user' 
    }, 500)
  }
})
```

### 2. GET /api/admin/verify

Verifies that the authenticated user has admin role.

```typescript
app.get('/api/admin/verify', async (c) => {
  const supabaseUser = c.get('supabaseUser') // From auth middleware

  try {
    // Get user from database by email (linking to Supabase auth)
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

    // Check if user has admin role
    if (user.role !== 'admin') {
      return c.json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, 403)
    }

    // Update last activity
    await db
      .update(users)
      .set({ lastActivity: new Date() })
      .where(eq(users.id, user.id))

    return c.json({ 
      success: true, 
      user: user 
    })
  } catch (error) {
    console.error('Verify error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to verify admin access' 
    }, 500)
  }
})
```

### 3. Admin Middleware (for all /api/admin/* routes)

```typescript
// Middleware to verify admin role for all admin routes
app.use('/api/admin/*', async (c, next) => {
  const supabaseUser = c.get('supabaseUser')

  try {
    // Get user and verify admin role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, supabaseUser.email))
      .limit(1)

    if (!user) {
      return c.json({ 
        success: false, 
        error: 'User not found' 
      }, 404)
    }

    if (user.status !== 'active') {
      return c.json({ 
        success: false, 
        error: 'Account is not active' 
      }, 403)
    }

    if (user.role !== 'admin') {
      return c.json({ 
        success: false, 
        error: 'Forbidden - Admin access required' 
      }, 403)
    }

    // Store user in context for use in route handlers
    c.set('user', user)
    await next()
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Authorization failed' 
    }, 500)
  }
})
```

## Frontend Updates

### Update Signup Form

The signup form needs to send `name` instead of `full_name`:

```typescript
// In app/components/signup-form.tsx
const response = await fetch(`${apiUrl}/api/auth/signup`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: formData.name,      // Changed from full_name
    email: formData.email,
    mobile: formData.mobile || null
  })
})
```

### Update User Type

Create a type that matches your schema:

```typescript
// app/types/user.ts
export interface User {
  id: string
  name: string
  email: string
  mobile: string | null
  avatar: string | null
  status: 'active' | 'inactive' | 'suspended' // Adjust based on your enum
  role: 'admin' | 'student' | 'instructor'    // Adjust based on your enum
  lastActivity: string | null
  createdAt: string
  updatedAt: string
}
```

## Role & Status Enums

Make sure your backend has these enums defined:

```typescript
// In your schema file
export const userRoleEnum = pgEnum('user_role', ['admin', 'student', 'instructor'])
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended'])
```

## Creating Your First Admin

### Method 1: Direct Database Insert

```sql
-- In your PostgreSQL database
INSERT INTO users (name, email, role, status)
VALUES ('Admin User', 'admin@example.com', 'admin', 'active');
```

### Method 2: Update Existing User

```sql
-- After signing up through the UI
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Method 3: Using Drizzle

```typescript
// In a migration or seed script
await db
  .update(users)
  .set({ role: 'admin' })
  .where(eq(users.email, 'your-email@example.com'))
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOW                               │
└─────────────────────────────────────────────────────────────┘

1. User fills signup form (name, email, password, mobile)
   ↓
2. Frontend → Supabase Auth (signUp)
   Creates auth user with email/password
   ↓
3. Supabase returns JWT token
   ↓
4. Frontend → Backend (/api/auth/signup)
   Headers: Authorization: Bearer <JWT>
   Body: { name, email, mobile }
   ↓
5. Backend verifies JWT with Supabase
   ↓
6. Backend creates user in YOUR database
   - Generates new UUID for id
   - Sets role = 'student' (default)
   - Sets status = 'active' (default)
   - Links via email to Supabase auth
   ↓
7. Frontend receives user object
   ↓
8. If role === 'admin' → Dashboard
   If role !== 'admin' → "Wait for approval" message


┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                                │
└─────────────────────────────────────────────────────────────┘

1. User enters email & password
   ↓
2. Frontend → Supabase Auth (signInWithPassword)
   ↓
3. Supabase returns JWT token
   ↓
4. Frontend → Backend (/api/admin/verify)
   Headers: Authorization: Bearer <JWT>
   ↓
5. Backend verifies JWT with Supabase
   Gets email from JWT
   ↓
6. Backend queries YOUR database
   SELECT * FROM users WHERE email = <email>
   ↓
7. Backend checks:
   - User exists? (404 if not)
   - Status = 'active'? (403 if not)
   - Role = 'admin'? (403 if not)
   ↓
8. Backend updates lastActivity
   ↓
9. If all checks pass → Success ✅
   Frontend navigates to dashboard
```

## User Lifecycle

### New User (via Signup)
- ✅ Created in Supabase Auth
- ✅ Created in your database
- 📊 Role: `'student'` (default)
- 📊 Status: `'active'` (default)
- ❌ Cannot access admin dashboard

### Promoted to Admin
```sql
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';
```
- ✅ Can access admin dashboard
- ✅ Can use all admin endpoints

### Suspended User
```sql
UPDATE users 
SET status = 'suspended', updated_at = NOW()
WHERE email = 'user@example.com';
```
- ❌ Cannot login (403 Forbidden)
- ❌ Cannot access any endpoints

## Complete Backend Example

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'

const app = new Hono()

// CORS
app.use('/*', cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true,
}))

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Auth middleware - verifies JWT token
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
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

    c.set('supabaseUser', user)
    await next()
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Unauthorized - Invalid token' 
    }, 401)
  }
})

// POST /api/auth/signup
app.post('/api/auth/signup', async (c) => {
  const supabaseUser = c.get('supabaseUser')
  const { name, email, mobile } = await c.req.json()

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return c.json({ success: true, user: existingUser[0] })
    }

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        mobile: mobile || null,
        role: 'student',
        status: 'active',
        lastActivity: new Date(),
      })
      .returning()

    return c.json({ success: true, user: newUser }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ success: false, error: 'Failed to create user' }, 500)
  }
})

// GET /api/admin/verify
app.get('/api/admin/verify', async (c) => {
  const supabaseUser = c.get('supabaseUser')

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, supabaseUser.email))
      .limit(1)

    if (!user) {
      return c.json({ success: false, error: 'User not found in database' }, 404)
    }

    if (user.status !== 'active') {
      return c.json({ success: false, error: 'Account is not active' }, 403)
    }

    if (user.role !== 'admin') {
      return c.json({ success: false, error: 'Forbidden - Admin access required' }, 403)
    }

    await db
      .update(users)
      .set({ lastActivity: new Date() })
      .where(eq(users.id, user.id))

    return c.json({ success: true, user })
  } catch (error) {
    console.error('Verify error:', error)
    return c.json({ success: false, error: 'Failed to verify admin access' }, 500)
  }
})

// Admin middleware for all /api/admin/* routes
app.use('/api/admin/*', async (c, next) => {
  const supabaseUser = c.get('supabaseUser')

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, supabaseUser.email))
    .limit(1)

  if (!user || user.status !== 'active' || user.role !== 'admin') {
    return c.json({ success: false, error: 'Forbidden' }, 403)
  }

  c.set('user', user)
  await next()
})

// Example admin endpoint
app.get('/api/admin/users', async (c) => {
  const currentUser = c.get('user')
  
  const allUsers = await db.select().from(users)
  
  return c.json({ success: true, users: allUsers })
})

export default app
```

## Testing

### 1. Create a Test User

```bash
# Navigate to http://localhost:5173/signup
# Fill in:
# - Name: Test User
# - Email: test@example.com
# - Password: password123
# - Mobile: (optional)
```

### 2. Check Database

```sql
SELECT * FROM users WHERE email = 'test@example.com';
-- Should see: role = 'student', status = 'active'
```

### 3. Promote to Admin

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'test@example.com';
```

### 4. Test Login

```bash
# Navigate to http://localhost:5173/login
# Login with test@example.com / password123
# Should successfully access /admin/dashboard
```

## Security Checklist

- [x] JWT tokens verified on every request
- [x] User linked via email (not Supabase auth ID)
- [x] Role checked before admin access
- [x] Status checked (active/inactive/suspended)
- [x] Last activity tracked
- [ ] Rate limiting on auth endpoints
- [ ] Email confirmation enabled
- [ ] Password strength requirements
- [ ] Account lockout after failed attempts

## Troubleshooting

**"User not found in database"**
- User exists in Supabase Auth but not in your users table
- Backend `/api/auth/signup` may have failed
- Check backend logs

**"Account is not active"**
- User status is not 'active'
- Check: `SELECT status FROM users WHERE email = '...'`

**"Admin access required"**
- User role is not 'admin'
- Promote user: `UPDATE users SET role = 'admin' WHERE email = '...'`

**Email mismatch**
- Ensure Supabase auth email matches users table email
- Case-sensitive comparison
