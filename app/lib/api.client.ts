const API_URL = import.meta.env.VITE_API_URL

import { type Enrollment, type EnrollmentsResponse, type CreateEnrollmentPayload, type UpdateEnrollmentPayload, type CourseProgressResponse, type ProgressDetail } from "~/types/enrollment";

interface FetchOptions extends RequestInit {
    token?: string
}

export class ApiError extends Error {
    constructor(public message: string, public status: number, public data?: any) {
        super(message)
        this.name = 'ApiError'
    }
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

        const headers = new Headers(fetchOptions.headers)
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json')
        }

        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error)
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

    // Enrollments
    // Enrollments
    async getEnrollments(token?: string): Promise<EnrollmentsResponse> {
        return this.get<EnrollmentsResponse>("/api/admin/enrollments", token);
    }

    async getEnrollmentById(id: string, token?: string): Promise<{ success: boolean; data: Enrollment }> {
        return this.get<{ success: boolean; data: Enrollment }>(`/api/admin/enrollments/${id}`, token);
    }

    async createEnrollment(data: CreateEnrollmentPayload, token?: string): Promise<{ success: boolean; data: Enrollment }> {
        return this.post<{ success: boolean; data: Enrollment }>("/api/admin/enrollments", data, token);
    }

    async updateEnrollment(id: string, data: UpdateEnrollmentPayload, token?: string): Promise<{ success: boolean; data: Enrollment }> {
        return this.put<{ success: boolean; data: Enrollment }>(`/api/admin/enrollments/${id}`, data, token);
    }

    async deleteEnrollment(id: string, token?: string): Promise<{ success: boolean; data: Enrollment }> {
        return this.delete<{ success: boolean; data: Enrollment }>(`/api/admin/enrollments/${id}`, token);
    }

    async getCourseProgress(enrollmentId: string, token?: string): Promise<CourseProgressResponse> {
        return this.get<CourseProgressResponse>(`/api/admin/enrollments/${enrollmentId}/progress`, token);
    }

    async getContentProgress(enrollmentId: string, contentId: string, token?: string): Promise<{ success: boolean; data: ProgressDetail }> {
        return this.get<{ success: boolean; data: ProgressDetail }>(`/api/admin/enrollments/${enrollmentId}/content/${contentId}/progress`, token);
    }

    async updateContentProgress(enrollmentId: string, contentId: string, data: any, token?: string): Promise<{ success: boolean; data: ProgressDetail }> {
        return this.post<{ success: boolean; data: ProgressDetail }>(`/api/admin/enrollments/${enrollmentId}/content/${contentId}/progress`, data, token);
    }

    // Users
    async searchUsers(query: string, token?: string): Promise<{ success: boolean; data: any[] }> {
        return this.get<{ success: boolean; data: any[] }>(`/api/admin/users/search?q=${encodeURIComponent(query)}`, token);
    }
}

export const api = new ApiClient()
