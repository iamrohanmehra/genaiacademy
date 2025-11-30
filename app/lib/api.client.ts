const API_URL = import.meta.env.VITE_API_URL

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
}

export const api = new ApiClient()
