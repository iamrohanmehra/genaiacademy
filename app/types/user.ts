// User type matching your Drizzle schema

export type UserStatus = 'active' | 'inactive' | 'suspended'
export type UserRole = 'admin' | 'student' | 'instructor'

export interface User {
    id: string
    name: string
    email: string
    mobile: string | null
    avatar: string | null
    status: UserStatus
    role: UserRole
    lastActivity: string | null
    createdAt: string
    updatedAt: string
}

export interface AuthResponse {
    success: boolean
    user?: User
    error?: string
    message?: string
}
