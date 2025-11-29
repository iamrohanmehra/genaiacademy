# Troubleshooting Supabase 422 Signup Error

## Common Causes of 422 Error

### 1. **Email Confirmation Required**
Supabase might have email confirmation enabled.

**Check in Supabase Dashboard:**
1. Go to Authentication → Settings
2. Look for "Enable email confirmations"
3. If enabled, users must confirm email before login

**Solutions:**
- Disable email confirmation for development
- Or check your email for confirmation link

### 2. **Email Already Registered**
The email is already in use.

**Check:**
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'your-email@example.com';
```

**Solution:**
- Use a different email
- Or delete the existing user:
```sql
-- In Supabase SQL Editor
DELETE FROM auth.users WHERE email = 'your-email@example.com';
```

### 3. **Password Too Weak**
Supabase has minimum password requirements.

**Requirements:**
- Minimum 6 characters (default)
- Can be configured in Supabase settings

**Solution:**
- Use a stronger password
- Check Supabase → Authentication → Settings → Password requirements

### 4. **Invalid Email Format**
Email doesn't match expected format.

**Solution:**
- Ensure email is valid (e.g., user@example.com)
- No spaces or special characters

### 5. **Redirect URL Not Allowed**
The `emailRedirectTo` URL is not in allowed list.

**Fix in Supabase Dashboard:**
1. Go to Authentication → URL Configuration
2. Add your redirect URLs to "Redirect URLs":
   ```
   http://localhost:5173/student/dashboard
   http://localhost:5173/admin/dashboard
   https://yourdomain.com/student/dashboard
   https://yourdomain.com/admin/dashboard
   ```

### 6. **Rate Limiting**
Too many signup attempts.

**Solution:**
- Wait a few minutes
- Check Supabase → Authentication → Rate Limits

## How to Debug

### 1. Check Browser Console
Open DevTools → Console and look for detailed error message:
```javascript
console.log(error)
```

### 2. Check Network Tab
Open DevTools → Network → Look for the signup request:
- Status: 422
- Response body will have detailed error

### 3. Check Supabase Logs
Supabase Dashboard → Logs → Look for authentication errors

## Quick Fixes

### Disable Email Confirmation (Development Only)
1. Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. Toggle OFF
4. Save

### Add Redirect URLs
1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `http://localhost:5173`
3. Redirect URLs:
   ```
   http://localhost:5173/**
   ```

### Clear Existing User
```sql
-- If email already exists
DELETE FROM auth.users WHERE email = 'test@example.com';
```

## Testing Signup

### Test 1: Simple Signup
```bash
# Use these test credentials:
Email: test123@example.com
Password: password123
Name: Test User
```

### Test 2: Check Supabase
```sql
-- After signup, check if user was created
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 1;
```

### Test 3: Check Your Database
```sql
-- Check if user was created in your users table
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
```

## Updated Signup Form

The signup form now:
- ✅ Redirects to `/student/dashboard` (not `/admin/dashboard`)
- ✅ Uses `name` in metadata (not `full_name`)
- ✅ Shows helpful error messages
- ✅ Handles "already registered" error
- ✅ Validates password length

## Common Error Messages

### "User already registered"
```
Solution: Use different email or delete existing user
```

### "Invalid email"
```
Solution: Check email format (must be valid email)
```

### "Password should be at least 6 characters"
```
Solution: Use longer password
```

### "Email link is invalid or has expired"
```
Solution: Request new confirmation email
```

### "Signups not allowed"
```
Solution: Enable signups in Supabase Dashboard → Authentication → Settings
```

## Supabase Configuration Checklist

- [ ] Email confirmations: Disabled (for development)
- [ ] Signups enabled: Yes
- [ ] Password requirements: Minimum 6 characters
- [ ] Redirect URLs: Added localhost URLs
- [ ] Site URL: Set to http://localhost:5173
- [ ] Rate limiting: Not too restrictive

## Production Setup

For production, you should:
1. ✅ Enable email confirmation
2. ✅ Require strong passwords (8+ characters)
3. ✅ Add production redirect URLs
4. ✅ Enable rate limiting
5. ✅ Set up email templates
6. ✅ Configure SMTP settings

## Still Having Issues?

### Check Supabase Status
Visit: https://status.supabase.com

### Check Your Configuration
```bash
# In your .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Make sure these are correct!
```

### Try Minimal Signup
```typescript
// Test with minimal options
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})

console.log('Data:', data)
console.log('Error:', error)
```

### Contact Support
If none of this works:
1. Check Supabase Discord
2. Check Supabase GitHub Issues
3. Contact Supabase Support

## Quick Test Script

Run this in browser console to test signup:

```javascript
// Test Supabase signup
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)

const testSignup = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123'
  })
  
  console.log('Success:', data)
  console.log('Error:', error)
}

testSignup()
```
