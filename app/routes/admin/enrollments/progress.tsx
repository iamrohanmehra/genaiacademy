import * as React from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, ArrowLeft, Clock } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { Skeleton } from "~/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { supabase } from "~/lib/supabase"
import type { Enrollment, CourseProgressResponse, SectionProgress } from "~/types/enrollment"
import type { Course } from "~/types/course"

// Mock type for User since it's not fully exported from a central place yet, 
// matching what we saw in enrollments.tsx
interface User {
    id: string
    name: string
    email: string
    mobile?: string
    avatar?: string | null
}

const ProgressPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // 1. Fetch Enrollment to get userId and courseId
    const { data: enrollmentData, isLoading: isLoadingEnrollment, error: enrollmentError } = useQuery({
        queryKey: queryKeys.enrollments.detail(id || ""),
        queryFn: async () => {
            if (!id) throw new Error("No enrollment ID")
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            const response = await api.getEnrollmentById(id, token)
            return response.data
        },
        enabled: !!id,
    })

    const enrollment = enrollmentData
    const userId = enrollment?.userId
    const courseId = enrollment?.courseId

    // 2. Fetch User Details
    const { data: userData, isLoading: isLoadingUser } = useQuery({
        queryKey: ['users', userId], // TODO: Add to queryKeys factory if needed
        queryFn: async () => {
            if (!userId) return null
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            const response = await api.getUserById(userId, token)
            return response.data as User // Cast response data
        },
        enabled: !!userId,
    })

    // 3. Fetch Course Details
    const { data: courseData, isLoading: isLoadingCourse } = useQuery({
        queryKey: queryKeys.courses.detail(courseId || ""),
        queryFn: async () => {
            if (!courseId) return null
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            const response = await api.getCourseById(courseId, token)
            return response.data as Course
        },
        enabled: !!courseId,
    })

    // 4. Fetch Course Progress
    const { data: progressData, isLoading: isLoadingProgress } = useQuery({
        queryKey: ['enrollments', id, 'progress'], // TODO: Add to queryKeys factory
        queryFn: async () => {
            if (!id) return null
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)
            const response = await api.getCourseProgress(id, token)
            return response.data
        },
        enabled: !!id,
    })

    const isLoading = isLoadingEnrollment || isLoadingUser || isLoadingCourse || isLoadingProgress




    if (enrollmentError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-red-500">
                <p>Failed to load enrollment data.</p>
                <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                    Go Back
                </Button>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-8 space-y-8">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-6 w-96" />
                <div className="space-y-2 pt-8">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="pt-8 space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        )
    }

    // Helper to format seconds to "XXm YYs"
    const formatTime = (seconds: number) => {
        if (!seconds) return "0s"
        const m = Math.floor(seconds / 60)
        const s = Math.round(seconds % 60)
        if (m === 0) return `${s}s`
        return `${m}m ${s}s`
    }

    return (
        <div className="flex flex-col flex-1 gap-8 p-8 max-w-5xl mx-auto w-full">
            {/* Header Section - Matched to Edit Enrollment Page */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {courseData?.title || "Course Title"}
                    </h1>
                    <div className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                            {courseData?.schedule || "No schedule available"}
                        </span>
                    </div>
                </div>

                {/* Info Stack - Learner & Course Meta */}
                <div className="flex flex-col gap-1 text-sm mt-2">
                    <span className="font-medium">{userData?.name || "Unknown"}</span>
                    <span className="text-muted-foreground">{userData?.email || "-"}</span>
                    <span className="text-muted-foreground">{userData?.mobile || "-"}</span>
                </div>
            </div>

            <Separator />

            {/* Sections & Chapters Progress Table */}
            <div className="w-full flex flex-col gap-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[50%]">Chapter Title</TableHead>
                                <TableHead>Time Watched</TableHead>
                                <TableHead>Last Accessed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {progressData && progressData.length > 0 ? (
                                progressData.map((section: SectionProgress) => (
                                    <React.Fragment key={section.id}>
                                        {/* Section Row */}
                                        <TableRow className="bg-muted/50 hover:bg-muted/60">
                                            <TableCell colSpan={3} className="font-semibold py-3 text-foreground">
                                                {section.title}
                                            </TableCell>
                                        </TableRow>
                                        {/* Chapter Rows */}
                                        {section.contents?.map((content, index) => (
                                            <TableRow key={content.id} className="hover:bg-muted/30">
                                                <TableCell className="font-medium align-middle">
                                                    <div className="flex items-center gap-3 pl-4">
                                                        <div
                                                            className={`w-2 h-2 rounded-full shrink-0 ${content.progress?.status === 'completed' ? 'bg-green-500' :
                                                                content.progress?.status === 'inProgress' ? 'bg-yellow-500' : 'bg-gray-300'
                                                                }`}
                                                        />
                                                        <span>{content.title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-middle">
                                                    {content.progress?.timeSpent ? (
                                                        <span className="font-mono text-sm max-w-fit px-2 py-1 rounded bg-secondary">
                                                            {/* Helper formatTime could be used, or consistent Math.round */}
                                                            {formatTime(content.progress.timeSpent)}
                                                        </span>
                                                    ) : "-"}
                                                </TableCell>
                                                <TableCell className="align-middle">
                                                    {content.progress?.updatedAt ? (
                                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                            {format(new Date(content.progress.updatedAt), "h:mm a, dd MMM yyyy")}
                                                        </span>
                                                    ) : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No progress data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}

export default ProgressPage
