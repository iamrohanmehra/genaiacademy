export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    amountPaid: number;
    paidAt?: string;
    certificateFee?: number;
    coupanCode?: string;
    invoiceId?: string;
    transactionId?: string;
    paymentMethod?: string;
    hasPaid: boolean;
    certificateId?: string;
    certificateGeneratedAt?: string;
    status: 'active' | 'banned';
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    accessOnDate?: string;
    accessTillDate?: string;
    progress?: number;
    timeSpent?: number;
    xp?: number;
    remark?: string;
    createdAt: string;
    updatedAt: string;
    // Expanded fields (if API returns them, though docs don't explicitly say so for list, usually they do or we might need to fetch them separately. 
    // Based on "Get All Enrollments" response example, it returns flat structure. 
    // However, for a table we usually need User name and Course title. 
    // The example response in docs shows just IDs. 
    // I will assume for now we might need to fetch users/courses or the API might be updated to return them.
    // For now I'll stick to the docs.)
}

export interface EnrollmentsResponse {
    success: boolean;
    data: Enrollment[];
    count: number;
}

export interface CreateEnrollmentPayload {
    userId: string;
    courseId: string;
    amountPaid?: number;
    paidAt?: string;
    hasPaid?: boolean;
    status?: 'active' | 'banned';
    certificateFee?: number;
    coupanCode?: string;
    invoiceId?: string;
    transactionId?: string;
    paymentMethod?: string;
    certificateId?: string;
    certificateGeneratedAt?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    accessOnDate?: string;
    accessTillDate?: string;
    progress?: number;
    timeSpent?: number;
    xp?: number;
    remark?: string;
}

export interface UpdateEnrollmentPayload {
    hasPaid?: boolean;
    amountPaid?: number;
    paidAt?: string;
    transactionId?: string;
    progress?: number;
    certificateId?: string;
    certificateGeneratedAt?: string;
}

export interface ProgressDetail {
    id: string;
    visited: number;
    timeSpent: number;
    progress: number;
    status: 'inProgress' | 'completed';
    userStatus: 'inProgress' | 'completed';
    attendedLive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ContentProgress {
    id: string;
    title: string;
    order: number;
    progress: ProgressDetail | null;
}

export interface SectionProgress {
    id: string;
    title: string;
    order: number;
    contents: ContentProgress[];
}

export interface CourseProgressResponse {
    success: boolean;
    data: SectionProgress[];
}
