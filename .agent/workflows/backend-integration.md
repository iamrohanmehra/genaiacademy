---
description: Integrate Hono Backend and Supabase
---

# Backend Integration Guide

This guide walks you through integrating your React Router frontend with:
1. Hono backend API (deployed on DigitalOcean)
2. Supabase (for database and authentication)

## Architecture Overview

```
Frontend (React Router) 
    ↓
    ├─→ Supabase (Auth + Database with RLS)
    └─→ Hono Backend API (DigitalOcean) → Supabase (Service Role for admin operations)
```

## Step 1: Environment Variables Setup

Create/update your `.env` file with the following:

```env
# Supabase Configuration (Client-side - safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Hono Backend API
VITE_API_URL=https://your-api.digitalocean.app

# Server-side only (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: 
- Variables with `VITE_` prefix are exposed to the browser
- Only use `VITE_` for public/safe values
- Keep service role keys server-side only

## Step 2: Install Dependencies

```bash
bun add @supabase/supabase-js
bun add @supabase/ssr
```

## Step 3: Create Supabase Client

Create `app/lib/supabase.client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
}
```

## Step 4: Create API Client for Hono Backend

Create `app/lib/api.client.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL

interface FetchOptions extends RequestInit {
  token?: string
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', token })
  }

  async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    })
  }

  async put<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    })
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', token })
  }
}

export const api = new ApiClient()
```

## Step 5: Create Authentication Hook

Create `app/hooks/useAuth.ts`:

```typescript
import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '~/lib/supabase.client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getAccessToken,
  }
}
```

## Step 6: Create Protected Route Component

Create `app/components/protected-route.tsx`:

```typescript
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '~/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

## Step 7: Update Login Form to Use Supabase

Update `app/components/login-form.tsx` to use the auth hook:

```typescript
import { useAuth } from '~/hooks/useAuth'
import { useNavigate } from 'react-router'

export function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      navigate('/admin/dashboard')
    }
  }

  // ... rest of your form JSX
}
```

## Step 8: Integrate with Hono Backend

Example of calling your Hono API with authentication:

```typescript
import { api } from '~/lib/api.client'
import { useAuth } from '~/hooks/useAuth'

export function BatchList() {
  const { getAccessToken } = useAuth()
  const [batches, setBatches] = useState([])

  useEffect(() => {
    async function fetchBatches() {
      const token = await getAccessToken()
      const data = await api.get('/api/batches', token)
      setBatches(data)
    }
    fetchBatches()
  }, [])

  // ... render batches
}
```

## Step 9: Hono Backend Configuration

Your Hono backend should:

1. **Verify Supabase JWT tokens**:

```typescript
import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

// Middleware to verify Supabase token
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('user', user)
  await next()
})

// Your API routes
app.get('/api/batches', async (c) => {
  const user = c.get('user')
  // Fetch batches from Supabase or your database
  return c.json({ batches: [] })
})
```

2. **Use Service Role Key for admin operations** (server-side only)

## Step 10: Supabase Row Level Security (RLS)

Enable RLS on your tables:

```sql
-- Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read batches they're enrolled in
CREATE POLICY "Users can view their batches"
ON batches FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM enrollments WHERE batch_id = batches.id
  )
);

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access"
ON batches FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

## Step 11: CORS Configuration

Ensure your Hono backend allows requests from your frontend:

```typescript
import { cors } from 'hono/cors'

app.use('/*', cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true,
}))
```

## Architecture Decision: When to Use What?

### Use Supabase Directly (Client → Supabase):
- ✅ User authentication (login, signup, logout)
- ✅ Reading user's own data (protected by RLS)
- ✅ Simple CRUD operations on user data
- ✅ Real-time subscriptions
- ✅ File uploads to Supabase Storage

### Use Hono Backend (Client → Hono → Supabase):
- ✅ Complex business logic
- ✅ Admin operations requiring service role
- ✅ Operations that bypass RLS
- ✅ Third-party API integrations
- ✅ Data aggregation and processing
- ✅ Email sending, notifications
- ✅ Payment processing

## Security Checklist

- [ ] Enable RLS on all Supabase tables
- [ ] Use `VITE_` prefix only for public values
- [ ] Never expose service role key to client
- [ ] Verify JWT tokens in Hono backend
- [ ] Set up CORS properly
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Enable email confirmation for signups
- [ ] Set up domain restrictions in Supabase

## Testing

1. **Test Supabase Auth**: Try login/signup
2. **Test Protected Routes**: Access admin dashboard
3. **Test API Calls**: Fetch data from Hono backend
4. **Test RLS**: Ensure users can only see their data
5. **Test Error Handling**: Invalid credentials, network errors

## Deployment

1. **Frontend**: Deploy to Vercel/Netlify
2. **Backend**: Already on DigitalOcean
3. **Environment Variables**: Set in deployment platform
4. **Update CORS**: Add production domain
5. **Update Supabase**: Add production URL to allowed domains

## Troubleshooting

**Issue**: CORS errors
- Solution: Check Hono CORS configuration includes your frontend URL

**Issue**: 401 Unauthorized from Hono
- Solution: Ensure you're passing the token correctly

**Issue**: RLS blocking queries
- Solution: Check your RLS policies match your use case

**Issue**: "Invalid token" errors
- Solution: Verify token hasn't expired, check Supabase JWT settings
