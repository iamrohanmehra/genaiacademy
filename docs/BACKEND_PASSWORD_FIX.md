# Backend Fix: Password Update

The "Change Password" functionality is failing because the backend endpoint `PUT /api/admin/users/:id/password` is likely not updating the password in Supabase Auth. It might be updating the local database or doing nothing.

To fix this, you need to update your Hono backend implementation for this endpoint.

## Required Changes

Add or update the `PUT /api/admin/users/:id/password` route in your Hono application. It **must** use `supabase.auth.admin.updateUserById` to update the password in Supabase.

### Code Snippet

```typescript
// PUT /api/admin/users/:id/password
app.put('/api/admin/users/:id/password', async (c) => {
  const supabaseUser = c.get('supabaseUser')
  const userId = c.req.param('id')
  const { password } = await c.req.json()

  // 1. Verify Admin Role (if not handled by middleware)
  // ...

  try {
    // 2. Update Password in Supabase Auth
    // This requires the Supabase client initialized with SERVICE_ROLE_KEY
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: password }
    )

    if (error) {
      console.error('Supabase Auth Update Error:', error)
      return c.json({ success: false, error: error.message }, 400)
    }

    // 3. (Optional) Update local DB if you track password changed at
    // await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId))

    return c.json({ 
      success: true, 
      message: 'Password changed successfully' 
    })

  } catch (error) {
    console.error('Password Update Error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to update password' 
    }, 500)
  }
})
```

## Verification
After applying this change to your backend:
1. Restart the backend server.
2. Go to the Admin Panel -> User Details -> Security.
3. Click "Change Password" and enter a new password.
4. Logout and try to Login with the **new** password.
5. It should work successfully.
