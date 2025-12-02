# GenAI Academy LMS - API Documentation

Base URL: `http://localhost:3000` (Development)  
Production URL: `https://your-app.ondigitalocean.app`

---

## 📋 Table of Contents
- [Public Auth API](#public-auth-api)
- [Authentication](#authentication)
- [Users API](#users-api)
- [Courses API](#courses-api)
- [Enrollments API](#enrollments-api)
- [Response Format](#response-format)
- [Error Codes](#error-codes)

---

## 🔓 Public Auth API

These endpoints are publicly accessible and do not require authentication.

Base path: `/api/auth`

### 1. User Signup

**Endpoint:** `POST /api/auth/signup`

**Description:** Register a new user account. Creates user in both Supabase Auth and application database.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "mobile": "+1234567890"
}
```

**Required Fields:**
- `name` (string) - User's full name
- `email` (string) - Valid email address
- `password` (string) - Minimum 6 characters recommended

**Optional Fields:**
- `mobile` (string) - Phone number

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "mobile": "+1234567890"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "role": "student",
      "status": "active",
      "createdAt": "2024-11-28T10:00:00Z",
      "updatedAt": "2024-11-28T10:00:00Z"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Missing required fields:
```json
{
  "success": false,
  "error": "Name, email, and password are required"
}
```

`409 Conflict` - User already exists:
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Description:** Login with email and password. Returns JWT token for authenticated requests.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "role": "student",
      "status": "active"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "...",
      "expires_in": 3600
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

`400 Bad Request` - Missing fields:
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

`401 Unauthorized` - Invalid credentials:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3. Verify Token

**Endpoint:** `GET /api/auth/verify`

**Description:** Verify JWT token validity and get current user details. Updates user's last activity timestamp.

**Headers:**
- `Authorization: Bearer <jwt-token>` (required)

**Request:**
```bash
curl http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Token verified successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "role": "student",
      "status": "active",
      "lastActivity": "2024-11-28T10:00:00Z",
      "createdAt": "2024-11-01T10:00:00Z",
      "updatedAt": "2024-11-28T10:00:00Z"
    },
    "tokenValid": true
  }
}
```

**Use Cases:**
- ✅ Verify user session on app load
- ✅ Check if token is still valid
- ✅ Refresh user data in frontend
- ✅ Track user activity
- ✅ Validate protected route access

**Error Responses:**

`401 Unauthorized` - No token provided:
```json
{
  "success": false,
  "error": "No authorization token provided"
}
```

`401 Unauthorized` - Invalid/expired token:
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

`404 Not Found` - User not in database:
```json
{
  "success": false,
  "error": "User not found in database"
}
```

---

## 🔐 Authentication

All admin endpoints require authentication with a valid JWT token from Supabase Auth and admin role.

### Requirements:
1. **Valid JWT Token** - Obtained from Supabase Auth after login
2. **Admin Role** - User must have `role: "admin"` in the users table

### How to Authenticate:

#### Step 1: Login with Supabase Auth
```javascript
// In your frontend
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'your-password'
})

// Get the access token
const token = data.session.access_token
```

#### Step 2: Include Token in API Requests
```bash
# Add Authorization header to all requests:
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Authentication Flow:
1. User logs in via Supabase Auth → Receives JWT token
2. JWT token is sent in `Authorization` header as `Bearer <token>`
3. Backend validates token with Supabase
4. Backend checks if user has admin role in database
5. If valid + admin → Request proceeds
6. If invalid or not admin → Returns 401/403 error

### Error Responses:

**401 Unauthorized - No Token:**
```json
{
  "success": false,
  "error": "Unauthorized - No token provided"
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "error": "Unauthorized - Invalid token"
}
```

**403 Forbidden - Not Admin:**
```json
{
  "success": false,
  "error": "Forbidden - Admin access required"
}
```

**404 Not Found - User Not in Database:**
```json
{
  "success": false,
  "error": "User not found"
}
```

### Testing Authentication:

```bash
# 1. Set your token as environment variable
export TOKEN="your-jwt-token-here"

# 2. Test API with authentication
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Overview API

Base path: `/api/admin/overview`

### Get Overview Statistics

**Endpoint:** `GET /api/admin/overview`

**Description:** Get overview statistics with time-based filtering. Returns user signups, enrollments, paid enrollments, and revenue with comparison to previous period.

**Query Parameters:**
- `filter` (optional) - Time filter type. Default: `today`
  - `today` - Today's data vs yesterday
  - `yesterday` - Yesterday's data vs day before
  - `thisWeek` - This week vs last week
  - `thisMonth` - This month vs last month
  - `lastMonth` - Last month vs month before
  - `last90Days` - Last 90 days vs previous 90 days
  - `customDate` - Specific date (requires `customDate` param)
  - `customRange` - Date range (requires `startDate` and `endDate` params)
- `customDate` (required for customDate filter) - Date in ISO format (e.g., `2024-11-15`)
- `startDate` (required for customRange filter) - Start date in ISO format
- `endDate` (required for customRange filter) - End date in ISO format

**Examples:**

```bash
# Today (default)
curl http://localhost:3000/api/admin/overview \
  -H "Authorization: Bearer <your-jwt-token>"

# Yesterday
curl "http://localhost:3000/api/admin/overview?filter=yesterday" \
  -H "Authorization: Bearer <your-jwt-token>"

# This week
curl "http://localhost:3000/api/admin/overview?filter=thisWeek" \
  -H "Authorization: Bearer <your-jwt-token>"

# This month
curl "http://localhost:3000/api/admin/overview?filter=thisMonth" \
  -H "Authorization: Bearer <your-jwt-token>"

# Custom date (Nov 15, 2024)
curl "http://localhost:3000/api/admin/overview?filter=customDate&customDate=2024-11-15" \
  -H "Authorization: Bearer <your-jwt-token>"

# Custom range (Nov 1-15, 2024)
curl "http://localhost:3000/api/admin/overview?filter=customRange&startDate=2024-11-01&endDate=2024-11-15" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userSignups": {
      "current": 10,
      "previous": 8,
      "change": 2,
      "changePercentage": 25.0,
      "trend": "up"
    },
    "totalEnrollments": {
      "current": 15,
      "previous": 12,
      "change": 3,
      "changePercentage": 25.0,
      "trend": "up"
    },
    "paidEnrollments": {
      "current": 8,
      "previous": 5,
      "change": 3,
      "changePercentage": 60.0,
      "trend": "up"
    },
    "totalRevenue": {
      "current": 3599200,
      "previous": 2249500,
      "change": 1349700,
      "changePercentage": 60.0,
      "trend": "up"
    }
  },
  "filter": "today"
}
```

**Response Fields:**

Each metric contains:
- `current` (number) - Current period value
- `previous` (number) - Previous period value
- `change` (number) - Difference between current and previous
- `changePercentage` (number) - Percentage change (handles 0 and infinity)
- `trend` (string) - `"up"`, `"down"`, or `"neutral"`

**Metrics:**
- `userSignups` - Number of new user registrations
- `totalEnrollments` - Total course enrollments
- `paidEnrollments` - Enrollments where `hasPaid: true`
- `totalRevenue` - Sum of `amountPaid` (in paise/cents)

**Notes:**
- Revenue is in paise/cents (divide by 100 for INR/USD display)
- Comparison period is automatically calculated based on filter duration
- Handles edge cases: zero division returns 0%, new data on zero baseline returns 100%

---

## 👥 Users API

Base path: `/api/admin/users`

### 1. Get All Users

**Endpoint:** `GET /api/admin/users`

**Description:** Retrieve all users in the system, ordered by creation date (newest first).

**Request:**
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "avatar": "https://example.com/avatar.jpg",
      "status": "active",
      "role": "admin",
      "globalXp": 1250,
      "lastActivity": "2024-11-28T10:00:00Z",
      "createdAt": "2024-11-01T10:00:00Z",
      "updatedAt": "2024-11-28T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. Search Users by Email (Dropdown)

**Endpoint:** `GET /api/admin/users/search/email?q={email}`

**Description:** Search users by email for dropdown selection. Returns limited fields (id, name, email, mobile, avatar) and max 20 results.

**Query Parameters:**
- `q` (required) - Email to search for (partial match)

**Request:**
```bash
curl "http://localhost:3000/api/admin/users/search/email?q=john@example" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "avatar": "https://example.com/avatar.jpg"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Johnny Smith",
      "email": "johnny@example.com",
      "mobile": "+1234567891",
      "avatar": null
    }
  ]
}
```

---

### 3. Search Users

**Endpoint:** `GET /api/admin/users/search?q={searchTerm}`

**Description:** Search for users by name, email, or mobile number. Case-insensitive partial matching.

**Query Parameters:**
- `q` (required) - Search term to match against name, email, or mobile

**Request:**
```bash
# Search by name
curl "http://localhost:3000/api/admin/users/search?q=john" \
  -H "Authorization: Bearer <your-jwt-token>"

# Search by email
curl "http://localhost:3000/api/admin/users/search?q=john@example" \
  -H "Authorization: Bearer <your-jwt-token>"

# Search by mobile
curl "http://localhost:3000/api/admin/users/search?q=1234567" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+1234567890",
      "avatar": "https://example.com/avatar.jpg",
      "status": "active",
      "role": "student",
      "globalXp": 850,
      "lastActivity": "2024-11-28T10:00:00Z",
      "createdAt": "2024-11-01T10:00:00Z",
      "updatedAt": "2024-11-28T10:00:00Z"
    }
  ],
  "count": 1,
  "searchTerm": "john"
}
```

**Search Features:**
- ✅ Case-insensitive search
- ✅ Partial matching (finds "john" in "John Doe")
- ✅ Searches across name, email, AND mobile fields
- ✅ Returns all matching users
- ✅ Empty array if no matches found

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Search query parameter \"q\" is required"
}
```

---

### 4. Get User by ID (with Enrollments)

**Endpoint:** `GET /api/admin/users/:id`

**Description:** Retrieve a specific user by their UUID along with all their course enrollments.

**Parameters:**
- `id` (path, required) - User UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "avatar": "https://example.com/avatar.jpg",
    "status": "active",
    "role": "student",
    "globalXp": 500,
    "lastActivity": "2024-11-28T10:00:00Z",
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-28T10:00:00Z",
    "enrollments": [
      {
        "enrollment": {
          "id": "750e8400-e29b-41d4-a716-446655440002",
          "userId": "550e8400-e29b-41d4-a716-446655440000",
          "courseId": "650e8400-e29b-41d4-a716-446655440001",
          "amountPaid": 449900,
          "paidAt": "2024-11-28T10:00:00Z",
          "hasPaid": true,
          "progress": 45,
          "timeSpent": 3600,
          "xp": 350,
          "status": "active",
          "certificateId": "CERT-001",
          "certificateGeneratedAt": "2025-03-01T10:00:00Z",
          "createdAt": "2024-11-28T10:00:00Z",
          "updatedAt": "2024-11-28T12:00:00Z"
        },
        "course": {
          "id": "650e8400-e29b-41d4-a716-446655440001",
          "title": "Python Masterclass",
          "desc": "Learn Python from scratch to advanced",
          "type": "course",
          "price": 499900,
          "status": "live",
          "startDate": "2024-12-01T00:00:00Z",
          "endDate": "2025-02-28T00:00:00Z"
        }
      }
    ]
  }
}
```

**Response Notes:**
- Returns user details with an `enrollments` array
- Each enrollment includes both enrollment details and associated course information
- Enrollments are ordered by creation date (newest first)
- Empty array if user has no enrollments

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 5. Create User

**Endpoint:** `POST /api/admin/users`

**Description:** Create a new user account. Password will be automatically hashed if provided. This endpoint is for admin use only.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "mobile": "+1234567890",
  "avatar": "https://example.com/avatar.jpg",
  "role": "student",
  "status": "active",
  "globalXp": 0
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "mobile": "+1234567890",
    "role": "student",
    "status": "active"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "mobile": "+1234567890",
    "avatar": null,
    "status": "active",
    "role": "student",
    "globalXp": 0,
    "lastActivity": null,
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:00:00Z"
  }
}
```

**Required Fields:**
- `name` (string) - User's full name
- `email` (string) - Valid email address (must be unique)

**Optional Fields:**
- `password` (string) - Will be automatically hashed if provided
- `mobile` (string) - Phone number
- `avatar` (string) - Profile picture URL
- `role` (enum: "admin", "operations", "student") - Default: "student"
- `status` (enum: "active", "banned") - Default: "active"
- `globalXp` (integer) - Experience points, default: 0
- `lastActivity` (timestamp) - Last activity timestamp

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Name and email are required"
}
```

**Error Response:** `500 Internal Server Error` (e.g., duplicate email)
```json
{
  "success": false,
  "error": "Failed to create user"
}
```

---

### 6. Update User

**Endpoint:** `PUT /api/admin/users/:id`

**Description:** Update user details. Only provide fields you want to update.

**Parameters:**
- `id` (path, required) - User UUID

**Request Body:**
```json
{
  "name": "Jane Doe",
  "mobile": "+9876543210",
  "role": "operations",
  "status": "active"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Jane Doe",
    "role": "operations"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "john@example.com",
    "mobile": "+9876543210",
    "avatar": "https://example.com/avatar.jpg",
    "status": "active",
    "role": "operations",
    "lastActivity": "2024-11-28T10:00:00Z",
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-28T12:00:00Z"
  }
}
```

**Updatable Fields:**
- `name` (string)
- `email` (string, unique)
- `mobile` (string, optional)
- `avatar` (string, optional, URL)
- `status` (enum: "active", "banned")
- `role` (enum: "admin", "operations", "student")
- `globalXp` (integer, default: 0) - Total experience points across all courses
- `lastActivity` (timestamp)

**Note:** To change password, use the dedicated password change endpoint below.

---

### 7. Change User Password

**Endpoint:** `PUT /api/admin/users/:id/password`

**Description:** Change a user's password. Password will be automatically hashed. This endpoint is for admin use only.

**Parameters:**
- `id` (path, required) - User UUID

**Request Body:**
```json
{
  "password": "newSecurePassword123"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "password": "newSecurePassword123"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "updatedAt": "2024-12-01T12:00:00Z"
  }
}
```

**Required Fields:**
- `password` (string) - New password (minimum 6 characters)

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Password is required"
}
```

```json
{
  "success": false,
  "error": "Password must be at least 6 characters"
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "User not found"
}
```

**Security Notes:**
- Password is automatically hashed before storage
- Only admins can change user passwords
- Password is not returned in the response for security

---

### 8. Ban User

**Endpoint:** `POST /api/admin/users/:id/ban`

**Description:** Ban a user by setting their status to "banned". Banned users cannot access the platform.

**Parameters:**
- `id` (path, required) - User UUID

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/ban \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User banned successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "banned",
    "updatedAt": "2024-11-28T12:00:00Z"
  }
}
```

---

### 5. Activate User

**Endpoint:** `POST /api/admin/users/:id/activate`

**Description:** Activate a banned user by setting their status to "active".

**Parameters:**
- `id` (path, required) - User UUID

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000/activate \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active",
    "updatedAt": "2024-11-28T12:00:00Z"
  }
}
```

---

### 9. Delete User

**Endpoint:** `DELETE /api/admin/users/:id`

**Description:** Permanently delete a user from the system.

**Parameters:**
- `id` (path, required) - User UUID

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "john@example.com"
  }
}
```

---

## 📚 Courses API

Base path: `/api/admin/courses`

### 1. Search Courses (Dropdown)

**Endpoint:** `GET /api/admin/courses/search?q={searchTerm}`

**Description:** Search courses by title for dropdown selection. Returns limited fields (id, title, type, status) and max 20 results.

**Query Parameters:**
- `q` (required) - Search term to match against course title

**Request:**
```bash
curl "http://localhost:3000/api/admin/courses/search?q=python" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "title": "Python Masterclass",
      "type": "course",
      "status": "live"
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440002",
      "title": "Python for Data Science",
      "type": "workshop",
      "status": "inProgress"
    }
  ]
}
```

---

### 2. Get All Courses

**Endpoint:** `GET /api/admin/courses`

**Description:** Retrieve all courses, ordered by creation date (newest first).

**Request:**
```bash
curl http://localhost:3000/api/admin/courses \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "title": "Python Masterclass",
      "desc": "Learn Python from scratch to advanced",
      "schedule": "Mon-Fri 7PM IST",
      "type": "course",
      "topic": 1,
      "price": 499900,
      "payable": 449900,
      "priceInUsd": 5999,
      "certificateFee": 50000,
      "association": "CodeKaro",
      "limit": 100,
      "banner": "https://example.com/banner.jpg",
      "startDate": "2024-12-01T00:00:00Z",
      "endDate": "2025-02-28T00:00:00Z",
      "whatsAppGroupLink": "https://chat.whatsapp.com/xyz",
      "resourcesLink": "https://drive.google.com/xyz",
      "nextClassTopic": "Advanced OOP",
      "nextClassLink": "https://meet.google.com/xyz",
      "nextClassDesc": "Deep dive into OOP concepts",
      "status": "live",
      "createdAt": "2024-11-20T10:00:00Z",
      "updatedAt": "2024-11-28T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Course by ID

**Endpoint:** `GET /api/admin/courses/:id`

**Description:** Retrieve a specific course by its UUID.

**Parameters:**
- `id` (path, required) - Course UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/courses/650e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "title": "Python Masterclass",
    "desc": "Learn Python from scratch to advanced",
    "schedule": "Mon-Fri 7PM IST",
    "type": "course",
    "topic": 1,
    "price": 499900,
    "payable": 449900,
    "priceInUsd": 5999,
    "certificateFee": 50000,
    "association": "CodeKaro",
    "limit": 100,
    "banner": "https://example.com/banner.jpg",
    "startDate": "2024-12-01T00:00:00Z",
    "endDate": "2025-02-28T00:00:00Z",
    "whatsAppGroupLink": "https://chat.whatsapp.com/xyz",
    "resourcesLink": "https://drive.google.com/xyz",
    "nextClassTopic": "Advanced OOP",
    "nextClassLink": "https://meet.google.com/xyz",
    "nextClassDesc": "Deep dive into OOP concepts",
    "status": "live",
    "createdAt": "2024-11-20T10:00:00Z",
    "updatedAt": "2024-11-28T10:00:00Z"
  }
}
```

---

### 4. Create Course

**Endpoint:** `POST /api/admin/courses`

**Description:** Create a new course.

**Request Body:** (All required fields must be provided)
```json
{
  "title": "Python Masterclass",
  "desc": "Learn Python from scratch to advanced",
  "schedule": "Mon-Fri 7PM IST",
  "type": "course",
  "topic": 1,
  "price": 499900,
  "payable": 449900,
  "priceInUsd": 5999,
  "certificateFee": 50000,
  "limit": 100,
  "startDate": "2024-12-01T00:00:00Z",
  "endDate": "2025-02-28T00:00:00Z",
  "status": "private"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "title": "Python Masterclass",
    "desc": "Learn Python from scratch to advanced",
    "schedule": "Mon-Fri 7PM IST",
    "type": "course",
    "topic": 1,
    "price": 499900,
    "payable": 449900,
    "priceInUsd": 5999,
    "certificateFee": 50000,
    "limit": 100,
    "startDate": "2024-12-01T00:00:00Z",
    "endDate": "2025-02-28T00:00:00Z",
    "status": "private"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "title": "Python Masterclass",
    ...
  }
}
```

**Required Fields:**
- `title` (string)
- `desc` (text)
- `schedule` (string)
- `type` (enum: "workshop", "course", "cohort", "mentorship")
- `topic` (integer)
- `price` (integer) - **Amount in paise/cents** (e.g., 499900 = ₹4999.00)
- `payable` (integer) - **Amount in paise/cents** (e.g., 449900 = ₹4499.00)
- `certificateFee` (integer, default: 0) - **Amount in paise/cents**
- `limit` (integer, default: 1000)
- `startDate` (timestamp - ISO 8601 format)
- `endDate` (timestamp - ISO 8601 format)
- `status` (enum: "private", "live", "inProgress", "completed", default: "private")

**Optional Fields:**
- `priceInUsd` (integer) - **Amount in cents** (e.g., 5999 = $59.99)
- `association` (string)
- `banner` (string, URL)
- `whatsAppGroupLink` (string, URL)
- `resourcesLink` (string, URL)
- `nextClassTopic` (string)
- `nextClassLink` (string, URL)
- `nextClassDesc` (text)

**Important:** All monetary values must be provided as integers in the smallest currency unit (paise for INR, cents for USD) to avoid floating-point precision issues.

---

### 5. Update Course

**Endpoint:** `PUT /api/admin/courses/:id`

**Description:** Update course details. Only provide fields you want to update.

**Parameters:**
- `id` (path, required) - Course UUID

**Request Body:**
```json
{
  "status": "live",
  "whatsAppGroupLink": "https://chat.whatsapp.com/xyz",
  "nextClassTopic": "Advanced Functions",
  "nextClassLink": "https://meet.google.com/abc"
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/courses/650e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "status": "live",
    "whatsAppGroupLink": "https://chat.whatsapp.com/xyz"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "status": "live",
    "whatsAppGroupLink": "https://chat.whatsapp.com/xyz",
    ...
  }
}
```

---

### 6. Delete Course

**Endpoint:** `DELETE /api/admin/courses/:id`

**Description:** Permanently delete a course.

**Parameters:**
- `id` (path, required) - Course UUID

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/courses/650e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "title": "Python Masterclass"
  }
}
```

---

## 📑 Course Content Sections API

Base path: `/api/admin`

### 1. Get All Sections for a Course

**Endpoint:** `GET /api/admin/courses/:courseId/sections`

**Description:** Retrieve all content sections for a specific course, ordered by their order field.

**Parameters:**
- `courseId` (path, required) - Course UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/courses/{courseId}/sections \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "section-uuid",
      "courseId": "course-uuid",
      "title": "Introduction to AI Fundamentals",
      "order": 1,
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Section by ID

**Endpoint:** `GET /api/admin/sections/:id`

**Parameters:**
- `id` (path, required) - Section UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/sections/{sectionId} \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "section-uuid",
    "courseId": "course-uuid",
    "title": "Introduction to AI Fundamentals",
    "order": 1,
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:00:00Z"
  }
}
```

---

### 3. Create Section

**Endpoint:** `POST /api/admin/courses/:courseId/sections`

**Parameters:**
- `courseId` (path, required) - Course UUID

**Request Body:**
```json
{
  "title": "Getting Started",
  "order": 1
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/courses/{courseId}/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "title": "Getting Started",
    "order": 1
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Section created successfully",
  "data": {
    "id": "section-uuid",
    "courseId": "course-uuid",
    "title": "Getting Started",
    "order": 1,
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:00:00Z"
  }
}
```

**Required Fields:**
- `title` (string) - Section title
- `order` (integer) - Display order

---

### 4. Update Section

**Endpoint:** `PUT /api/admin/sections/:id`

**Parameters:**
- `id` (path, required) - Section UUID

**Request Body:**
```json
{
  "title": "Getting Started - Updated",
  "order": 2
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Section updated successfully",
  "data": {
    "id": "section-uuid",
    "title": "Getting Started - Updated",
    "order": 2,
    "updatedAt": "2024-12-01T12:00:00Z"
  }
}
```

---

### 5. Delete Section

**Endpoint:** `DELETE /api/admin/sections/:id`

**Parameters:**
- `id` (path, required) - Section UUID

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/sections/{sectionId} \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Section deleted successfully",
  "data": {
    "id": "section-uuid",
    "title": "Getting Started"
  }
}
```

---

## 📝 Course Content API

Base path: `/api/admin`

### 1. Get All Content by Section

**Endpoint:** `GET /api/admin/sections/:sectionId/content`

**Description:** Retrieve all content items for a specific section, ordered by their order field.

**Parameters:**
- `sectionId` (path, required) - Section UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/sections/{sectionId}/content \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "content-uuid",
      "courseId": "course-uuid",
      "sectionId": "section-uuid",
      "title": "Introduction to Python",
      "desc": "Learn the basics of Python programming",
      "type": "video",
      "videoLink": "https://youtube.com/watch?v=xyz",
      "order": 1,
      "xp": 50,
      "accessOn": 0,
      "accessTill": 7,
      "accessOnDate": "2024-12-01T00:00:00Z",
      "accessTillDate": "2025-02-28T23:59:59Z",
      "createdAt": "2024-12-01T10:00:00Z",
      "updatedAt": "2024-12-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get All Content by Course

**Endpoint:** `GET /api/admin/courses/:courseId/content`

**Parameters:**
- `courseId` (path, required) - Course UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/courses/{courseId}/content \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

### 3. Get Content by ID

**Endpoint:** `GET /api/admin/content/:id`

**Parameters:**
- `id` (path, required) - Content UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/content/{contentId} \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "content-uuid",
    "courseId": "course-uuid",
    "sectionId": "section-uuid",
    "title": "Introduction to Python",
    "desc": "Learn the basics of Python programming",
    "type": "video",
    "videoLink": "https://youtube.com/watch?v=xyz",
    "order": 1,
    "xp": 50,
    "accessOn": 0,
    "accessTill": 7,
    "accessOnDate": "2024-12-01T00:00:00Z",
    "accessTillDate": "2025-02-28T23:59:59Z",
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:00:00Z"
  }
}
```

---

### 4. Create Content

**Endpoint:** `POST /api/admin/sections/:sectionId/content`

**Parameters:**
- `sectionId` (path, required) - Section UUID

**Request Body:**
```json
{
  "courseId": "course-uuid",
  "title": "Introduction to Python",
  "desc": "Learn the basics of Python programming",
  "type": "video",
  "videoLink": "https://youtube.com/watch?v=xyz",
  "order": 1,
  "xp": 50,
  "accessOn": 0,
  "accessTill": 7,
  "accessOnDate": "2024-12-01T00:00:00.000Z",
  "accessTillDate": "2025-02-28T23:59:59.000Z"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/sections/{sectionId}/content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "courseId": "course-uuid",
    "title": "Introduction to Python",
    "desc": "Learn the basics of Python programming",
    "type": "video",
    "videoLink": "https://youtube.com/watch?v=xyz",
    "order": 1,
    "xp": 50
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Content created successfully",
  "data": {
    "id": "content-uuid",
    "courseId": "course-uuid",
    "sectionId": "section-uuid",
    "title": "Introduction to Python",
    "type": "video",
    "order": 1,
    "xp": 50,
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:00:00Z"
  }
}
```

**Required Fields:**
- `courseId` (UUID) - Course identifier
- `title` (string) - Content title
- `type` (enum: "liveClass", "video", "assignment", "article") - Content type
- `order` (integer) - Display order within section

**Optional Fields:**
- `desc` (text) - Content description (supports MDX/rich text)
- `videoLink` (string) - URL for video or live class
- `xp` (integer, default: 0) - Experience points awarded
- `accessOn` (integer) - Access after N days
- `accessTill` (integer) - Access until N days
- `accessOnDate` (timestamp) - Specific access start date
- `accessTillDate` (timestamp) - Specific access end date

---

### 5. Update Content

**Endpoint:** `PUT /api/admin/content/:id`

**Parameters:**
- `id` (path, required) - Content UUID

**Request Body:**
```json
{
  "title": "Introduction to Python - Updated",
  "xp": 100,
  "order": 2
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Content updated successfully",
  "data": {
    "id": "content-uuid",
    "title": "Introduction to Python - Updated",
    "xp": 100,
    "order": 2,
    "updatedAt": "2024-12-01T12:00:00Z"
  }
}
```

---

### 6. Delete Content

**Endpoint:** `DELETE /api/admin/content/:id`

**Parameters:**
- `id` (path, required) - Content UUID

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/content/{contentId} \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Content deleted successfully",
  "data": {
    "id": "content-uuid",
    "title": "Introduction to Python"
  }
}
```

---

## 🔄 Sort Order API

Base path: `/api/admin`

### Update Sort Order (Drag & Drop)

**Endpoint:** `PUT /api/admin/sort-order`

**Description:** Update the display order of sections or content items. Used for drag-and-drop reordering in the frontend.

**Request Body:**
```json
{
  "type": "section",
  "sortedOrder": [
    { "id": "section-uuid-1", "order": 1 },
    { "id": "section-uuid-2", "order": 2 },
    { "id": "section-uuid-3", "order": 3 }
  ]
}
```

**For Content Reordering:**
```json
{
  "type": "content",
  "sortedOrder": [
    { "id": "content-uuid-1", "order": 1 },
    { "id": "content-uuid-2", "order": 2 },
    { "id": "content-uuid-3", "order": 3 }
  ]
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/sort-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "type": "section",
    "sortedOrder": [
      { "id": "section-uuid-1", "order": 1 },
      { "id": "section-uuid-2", "order": 2 }
    ]
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "section order updated successfully"
}
```

**Required Fields:**
- `type` (enum: "section", "content") - What to reorder
- `sortedOrder` (array) - Array of objects with `id` and `order` fields

**Use Case:**
- Frontend implements drag-and-drop with a library like `react-beautiful-dnd`
- After user reorders items, send the new order array to this endpoint
- Backend updates all items' order values in a single request

---

## 📊 Course Progress API

Base path: `/api/admin`

### 1. Get Course Progress

**Endpoint:** `GET /api/admin/enrollments/:enrollmentId/progress`

**Description:** Retrieve course progress for a specific enrollment. Returns a nested structure: Sections → Content (with progress). Each section contains its content items ordered by their order field, with progress data if available. Course ID is automatically fetched from the enrollment.

**Parameters:**
- `enrollmentId` (path, required) - Enrollment UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/enrollments/{enrollmentId}/progress \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "section-uuid-1",
      "title": "Introduction",
      "order": 1,
      "contents": [
        {
          "id": "content-uuid-1",
          "title": "Intro to JS",
          "order": 1,
          "progress": {
            "id": "progress-uuid-1",
            "visited": 2,
            "timeSpent": 1200,
            "progress": 75,
            "status": "inProgress",
            "userStatus": "inProgress",
            "attendedLive": false,
            "createdAt": "2024-12-01T11:00:00Z",
            "updatedAt": "2024-12-01T12:00:00Z"
          }
        },
        {
          "id": "content-uuid-2",
          "title": "Loops and Conditionals",
          "order": 2,
          "progress": null
        }
      ]
    },
    {
      "id": "section-uuid-2",
      "title": "Advanced Topics",
      "order": 2,
      "contents": [
        {
          "id": "content-uuid-3",
          "title": "Async/Await",
          "order": 1,
          "progress": {
            "id": "progress-uuid-2",
            "visited": 1,
            "timeSpent": 600,
            "progress": 50,
            "status": "inProgress",
            "userStatus": "inProgress",
            "attendedLive": false,
            "createdAt": "2024-12-01T13:00:00Z",
            "updatedAt": "2024-12-01T14:00:00Z"
          }
        }
      ]
    }
  ]
}
```

**Response Structure:**
- Returns array of sections ordered by `order` field
- Each section contains `contents` array ordered by `order` field
- Each content includes minimal fields: `id`, `title`, `order`
- Progress is `null` if content not started
- Progress tracks: visited count, time spent (seconds), completion %, status, live attendance

---

### 2. Get Specific Content Progress

**Endpoint:** `GET /api/admin/enrollments/:enrollmentId/content/:contentId/progress`

**Description:** Get progress details for a specific content item.

**Parameters:**
- `enrollmentId` (path, required) - Enrollment UUID
- `contentId` (path, required) - Content UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/enrollments/{enrollmentId}/content/{contentId}/progress \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "progress-uuid",
    "enrollmentId": "enrollment-uuid",
    "courseContentId": "content-uuid",
    "visited": 3,
    "timeSpent": 1800,
    "progress": 100,
    "status": "completed",
    "userStatus": "completed",
    "attendedLive": true,
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T15:00:00Z"
  }
}
```

---

### 3. Create or Update Progress

**Endpoint:** `POST /api/admin/enrollments/:enrollmentId/content/:contentId/progress`

**Description:** Create new progress record or update existing one for a content item. Automatically handles both create and update operations.

**Parameters:**
- `enrollmentId` (path, required) - Enrollment UUID
- `contentId` (path, required) - Content UUID

**Request Body:**
```json
{
  "visited": 1,
  "timeSpent": 600,
  "progress": 50,
  "status": "inProgress",
  "userStatus": "inProgress",
  "attendedLive": false
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/enrollments/{enrollmentId}/content/{contentId}/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "visited": 1,
    "timeSpent": 600,
    "progress": 50,
    "status": "inProgress"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Progress updated successfully",
  "data": {
    "id": "progress-uuid",
    "enrollmentId": "enrollment-uuid",
    "courseContentId": "content-uuid",
    "visited": 1,
    "timeSpent": 600,
    "progress": 50,
    "status": "inProgress",
    "userStatus": "inProgress",
    "attendedLive": false,
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T10:30:00Z"
  }
}
```

**Optional Fields:**
- `visited` (integer) - Number of times content was visited
- `timeSpent` (integer) - Time spent in seconds
- `progress` (integer, 0-100) - Completion percentage
- `status` (enum: "inProgress", "completed") - Content completion status
- `userStatus` (enum: "inProgress", "completed") - User's status
- `attendedLive` (boolean) - Whether user attended live class

**Use Cases:**
- Track when user opens a video/article
- Update time spent on content
- Mark content as completed
- Track live class attendance

---

## 🎓 Enrollments API

Base path: `/api/admin/enrollments`

### 1. Get All Enrollments

**Endpoint:** `GET /api/admin/enrollments`

**Description:** Retrieve all enrollments, ordered by creation date (newest first).

**Request:**
```bash
curl http://localhost:3000/api/admin/enrollments \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "750e8400-e29b-41d4-a716-446655440002",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "courseId": "650e8400-e29b-41d4-a716-446655440001",
      "amountPaid": 449900,
      "paidAt": "2024-11-28T10:00:00Z",
      "certificateFee": 50000,
      "coupanCode": "SAVE10",
      "invoiceId": "INV-001",
      "transactionId": "TXN-12345",
      "paymentMethod": "razorpay",
      "hasPaid": true,
      "certificateId": "CERT-001",
      "certificateGeneratedAt": "2025-03-01T10:00:00Z",
      "status": "active",
      "utmSource": "google",
      "utmMedium": "cpc",
      "utmCampaign": "winter-sale",
      "accessOnDate": "2024-12-01T00:00:00Z",
      "accessTillDate": "2025-02-28T23:59:59Z",
      "progress": 45,
      "timeSpent": 3600,
      "xp": 350,
      "remark": "Good progress",
      "createdAt": "2024-11-28T10:00:00Z",
      "updatedAt": "2024-11-28T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Enrollment by ID

**Endpoint:** `GET /api/admin/enrollments/:id`

**Description:** Retrieve a specific enrollment by its UUID.

**Parameters:**
- `id` (path, required) - Enrollment UUID

**Request:**
```bash
curl http://localhost:3000/api/admin/enrollments/750e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "courseId": "650e8400-e29b-41d4-a716-446655440001",
    "amountPaid": 449900,
    "hasPaid": true,
    "status": "active",
    ...
  }
}
```

---

### 3. Create Enrollment

**Endpoint:** `POST /api/admin/enrollments`

**Description:** Create a new enrollment (enroll a user in a course).

**Request Body:** (userId and courseId are required)
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "courseId": "650e8400-e29b-41d4-a716-446655440001",
  "amountPaid": 449900,
  "paidAt": "2024-11-28T10:00:00Z",
  "hasPaid": true,
  "status": "active"
}
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "courseId": "650e8400-e29b-41d4-a716-446655440001",
    "amountPaid": 449900,
    "hasPaid": true,
    "status": "active"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Enrollment created successfully",
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "courseId": "650e8400-e29b-41d4-a716-446655440001",
    "hasPaid": true,
    "status": "active",
    ...
  }
}
```

**Required Fields:**
- `userId` (UUID) - Foreign key to users table
- `courseId` (UUID) - Foreign key to courses table

**Optional Fields:**
- `amountPaid` (integer) - **Amount in paise/cents**
- `paidAt` (timestamp)
- `certificateFee` (integer) - **Amount in paise/cents**
- `coupanCode` (string)
- `invoiceId` (string)
- `transactionId` (string)
- `paymentMethod` (string)
- `hasPaid` (boolean, default: false)
- `certificateId` (string)
- `certificateGeneratedAt` (timestamp)
- `status` (enum: "active", "banned", default: "active")
- `utmSource` (string)
- `utmMedium` (string)
- `utmCampaign` (string)
- `accessOnDate` (timestamp, default: now())
- `accessTillDate` (timestamp)
- `progress` (integer)
- `timeSpent` (integer, in seconds)
- `xp` (integer, default: 0) - Experience points earned in this course
- `remark` (text)

---

### 4. Update Enrollment

**Endpoint:** `PUT /api/admin/enrollments/:id`

**Description:** Update enrollment details. Common use: update payment status, progress, certificate info.

**Parameters:**
- `id` (path, required) - Enrollment UUID

**Request Body:**
```json
{
  "hasPaid": true,
  "amountPaid": 449900,
  "paidAt": "2024-11-28T10:00:00Z",
  "transactionId": "TXN-12345",
  "progress": 75
}
```

**Request:**
```bash
curl -X PUT http://localhost:3000/api/admin/enrollments/750e8400-e29b-41d4-a716-446655440002 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "hasPaid": true,
    "progress": 75,
    "certificateId": "CERT-001",
    "certificateGeneratedAt": "2025-03-01T10:00:00Z"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Enrollment updated successfully",
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "hasPaid": true,
    "progress": 75,
    "certificateId": "CERT-001",
    ...
  }
}
```

---

### 5. Delete Enrollment

**Endpoint:** `DELETE /api/admin/enrollments/:id`

**Description:** Permanently delete an enrollment (unenroll a user from a course).

**Parameters:**
- `id` (path, required) - Enrollment UUID

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/enrollments/750e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Enrollment deleted successfully",
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "courseId": "650e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

## 📤 Response Format

### Success Response
All successful responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

For list endpoints:
```json
{
  "success": true,
  "data": [ ... ],
  "count": 10
}
```

### Error Response
All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## ⚠️ Error Codes

| Status Code | Description |
|------------|-------------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error |

---

## 🔧 Common Use Cases

### Use Case 1: Enroll a User in a Course
```bash
# 1. Create/Get User ID
# 2. Get Course ID
# 3. Create Enrollment
curl -X POST http://localhost:3000/api/admin/enrollments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "courseId": "course-uuid",
    "hasPaid": false,
    "status": "active"
  }'
```

### Use Case 2: Mark Payment as Received
```bash
curl -X PUT http://localhost:3000/api/admin/enrollments/{enrollment-id} \
  -H "Content-Type: application/json" \
  -d '{
    "hasPaid": true,
    "amountPaid": 449900,
    "paidAt": "2024-11-28T10:00:00Z",
    "transactionId": "TXN-12345",
    "paymentMethod": "razorpay"
  }'
```

### Use Case 3: Generate Certificate
```bash
curl -X PUT http://localhost:3000/api/admin/enrollments/{enrollment-id} \
  -H "Content-Type: application/json" \
  -d '{
    "certificateId": "CERT-2024-001",
    "certificateGeneratedAt": "2025-03-01T10:00:00Z"
  }'
```

### Use Case 4: Update Course Status to Live
```bash
curl -X PUT http://localhost:3000/api/admin/courses/{course-id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "live",
    "whatsAppGroupLink": "https://chat.whatsapp.com/xyz",
    "resourcesLink": "https://drive.google.com/xyz"
  }'
```

---

## 📝 Notes

- All timestamps should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- All UUIDs are v4 format
- **All monetary values are stored as integers in paise/cents** (e.g., ₹4999.00 = 499900 paise, $59.99 = 5999 cents)
- This avoids floating-point precision issues and is the industry standard for handling money
- **Authentication is REQUIRED** - All endpoints need valid JWT token with admin role
- CORS is configured for localhost:3000, localhost:5173, localhost:5174
- User must exist in both Supabase Auth AND users table with admin role

---

## 🚀 Quick Test Commands

```bash
# Health check (no auth required)
curl http://localhost:3000/

# Set your token first
export TOKEN="your-jwt-token-here"

# Get all users
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Get all courses
curl http://localhost:3000/api/admin/courses \
  -H "Authorization: Bearer $TOKEN"

# Get all enrollments
curl http://localhost:3000/api/admin/enrollments \
  -H "Authorization: Bearer $TOKEN"
```

## 🔑 Getting Your First Admin Token

1. **Create a user in Supabase Auth Dashboard:**
   - Go to Authentication → Users → Add User
   - Create user with email/password

2. **Add user to your database with admin role:**
   ```sql
   INSERT INTO users (name, email, role, status)
   VALUES ('Admin User', 'admin@example.com', 'admin', 'active');
   ```

3. **Login via Supabase to get token:**
   ```javascript
   const { data } = await supabase.auth.signInWithPassword({
     email: 'admin@example.com',
     password: 'your-password'
   })
   const token = data.session.access_token
   ```

4. **Use token in all API requests**

