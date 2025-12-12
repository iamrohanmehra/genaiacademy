export type Course = {
    id: string
    title: string
    desc: string
    schedule: string
    type: string
    topic: number
    price: string
    payable: string
    certificateFee: string
    association: string
    limit: number
    banner: string
    startDate: string
    endDate: string
    whatsAppGroupLink: string
    resourcesLink: string
    nextClassTopic: string
    nextClassLink: string
    nextClassDesc: string
    status: "live" | "private" | "completed" | "inProgress"
    createdAt: string
    updatedAt: string
}

export type CourseSection = {
    id: string
    courseId: string
    title: string
    order: number
    createdAt?: string
    updatedAt?: string
}

export type CourseContent = {
    id: string
    sectionId: string
    courseId: string
    title: string
    type: "video" | "liveClass" | "assignment" | "article"
    desc?: string
    videoLink?: string
    order: number
    xp?: number
    accessOn?: number
    accessTill?: number
    accessOnDate?: string
    accessTillDate?: string
    createdAt?: string
    updatedAt?: string
}
