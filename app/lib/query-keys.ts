export const queryKeys = {
    session: ['user-session'] as const,
    courses: {
        all: ['courses'] as const,
        detail: (id: string) => ['course', id] as const,
        content: (id: string) => ['course-content', id] as const,
        search: (query: string) => ['courses', 'search', query] as const,
    },
    users: {
        all: ['users'] as const,
        list: (page: number, query: string) => ['users', page, query] as const,
        detail: (id: string) => ['user', id] as const,
        searchByEmail: (email: string) => ['users', 'search', 'email', email] as const,
    },
    overview: (filter: string, customDate?: string, startDate?: string, endDate?: string) =>
        ['overview', filter, customDate, startDate, endDate] as const,
} as const;
