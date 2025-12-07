export const queryKeys = {
    session: ['user-session'] as const,
    courses: {
        all: ['courses'] as const,
        detail: (id: string) => ['course', id] as const,
        sections: (id: string) => ['course', id, 'sections'] as const,
        section: (id: string) => ['section', id] as const,
        content: (id: string) => ['course', id, 'content'] as const,
        sectionContent: (sectionId: string) => ['section', sectionId, 'content'] as const,
        contentDetail: (id: string) => ['content', id] as const,
        search: (query: string) => ['courses', 'search', query] as const,
    },
    users: {
        all: ['users'] as const,
        list: (page: number, query: string) => ['users', page, query] as const,
        detail: (id: string) => ['user', id] as const,
        searchByEmail: (email: string) => ['users', 'search', 'email', email] as const,
    },
    enrollments: {
        all: ['enrollments'] as const,
        list: (courseId: string) => ['enrollments', 'list', courseId] as const,
        detail: (id: string) => [...queryKeys.enrollments.all, id] as const,
        progress: (id: string) => [...queryKeys.enrollments.detail(id), 'progress'] as const,
    },
    overview: (filter: string, customDate?: string, startDate?: string, endDate?: string) =>
        ['overview', filter, customDate, startDate, endDate] as const,
} as const;
