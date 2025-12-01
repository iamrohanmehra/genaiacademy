export const queryKeys = {
    session: ['user-session'] as const,
    courses: {
        all: ['courses'] as const,
        detail: (id: string) => ['course', id] as const,
        content: (id: string) => ['course-content', id] as const,
    },
    users: {
        all: ['users'] as const,
        list: (page: number, query: string) => ['users', page, query] as const,
        detail: (id: string) => ['user', id] as const,
        searchByEmail: (email: string) => ['users', 'search', 'email', email] as const,
    },
} as const;
