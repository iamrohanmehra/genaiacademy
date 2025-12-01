export interface CourseSection {
    id: string
    courseId: string
    title: string
    order: number
    createdAt: string
    updatedAt: string
}

export interface CourseContent {
    id: string
    courseId: string
    sectionId: string
    title: string
    desc?: string
    type: 'video' | 'liveClass' | 'assignment' | 'article'
    videoLink?: string
    order: number
    xp: number
    accessOn?: number
    accessTill?: number
    accessOnDate?: string
    accessTillDate?: string
    createdAt: string
    updatedAt: string
}

export interface SortOrderPayload {
    type: 'section' | 'content'
    sortedOrder: { id: string; order: number }[]
}
