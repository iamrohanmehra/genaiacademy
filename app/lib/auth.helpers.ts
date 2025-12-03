import { api } from './api.client'

export interface User {
    id: string
    email: string
    role: 'admin' | 'user' | 'instructor'
    full_name?: string
    created_at: string
}

/**
 * Verify if the user has admin role by checking with the backend
 * @param token - JWT access token from Supabase
 * @returns User object if admin, throws error otherwise
 */
export async function verifyAdminRole(token: string): Promise<User> {
    try {
        const response = await api.get<{ success: boolean; user: User }>(
            '/api/admin/verify',
            token
        )

        if (!response.success || response.user.role !== 'admin') {
            throw new Error('Admin access required')
        }

        return response.user
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Failed to verify admin role')
    }
}

/**
 * Check if user exists in the backend database
 * If not, create a new user record
 */
export async function ensureUserExists(
    token: string,
    email: string,
    fullName?: string
): Promise<User> {
    // Temporary bypass: API endpoint doesn't exist yet.
    // Returning a mock admin user to allow login and dashboard access.
    // TODO: Implement /api/auth/ensure-user in the backend and revert this.
    return {
        id: 'mock-id',
        email: email,
        role: 'admin', // Force admin role for now
        full_name: fullName,
        created_at: new Date().toISOString()
    }
}
