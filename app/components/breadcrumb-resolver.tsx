import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { api } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { supabase } from "~/lib/supabase"
import type { Course } from "~/types/course"
import type { User } from "~/routes/admin/users"

interface BreadcrumbResolverProps {
    segment: string
    index: number
    segments: string[]
    isLast: boolean
}

async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
}

export function BreadcrumbResolver({ segment, index, segments, isLast }: BreadcrumbResolverProps) {
    // 1. Handle "admin" -> "Dashboard" replacement
    if (segment === "admin") {
        // If the next segment is "dashboard", we skip "admin" to avoid "Dashboard > Dashboard"
        // OR we can just rename "admin" to "Dashboard" and handle the /admin/dashboard route specifically in the parent.
        // Based on the requirement: "On the Dashboard page, show only a single breadcrumb item: Dashboard."
        // Let's assume the parent component handles the structural simplification,
        // and this component handles the rendering of a single segment.

        // However, usually /admin is a layout and /admin/dashboard is the page.
        // If we are at /admin, we probably redirect or it's just the root.
        // Let's render "Dashboard" for "admin" but link it to /admin/dashboard if not active.

        // Special case handled in SiteHeader usually, but if it passes through:
        return (
            <BreadcrumbItem>
                {isLast ? (
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                ) : (
                    <BreadcrumbLink asChild>
                        <Link to="/admin/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                )}
            </BreadcrumbItem>
        )
    }

    // 2. Handle "dashboard" segment
    // If we are at /admin/dashboard, "admin" is index 0, "dashboard" is index 1.
    // If we renamed "admin" to "Dashboard", we shouldn't show "Dashboard > Dashboard".
    // This logic is better handled by filtering segments in the parent (SiteHeader).
    // But if it comes here:
    if (segment === "dashboard") {
        // If parent already rendered Dashboard, skip this? 
        // Return null is safest if we want to hide it, but the separator might still be there in parent map.
        // Best approach: SiteHeader filters the segments list.

        // For now, let's just capitalize if it shows up.
        return (
            <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
        )
    }

    // 3. Resolve IDs
    // Check if segment is a UUID (roughly).
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

    if (isUuid) {
        const previousSegment = segments[index - 1]
        let resolvedName = segment // Fallback
        let isLoading = false
        let isUnclickable = false

        // Identify resource type based on previous segment
        if (previousSegment === "courses") {
            const { data: course, isLoading: loadingContent } = useQuery({
                queryKey: queryKeys.courses.detail(segment),
                queryFn: async () => {
                    const token = await getToken()
                    if (!token) return null
                    const res = await api.get<{ data: Course }>(`/api/admin/courses/${segment}`, token)
                    return res.data
                },
                enabled: isUuid,
                staleTime: 1000 * 60 * 5, // 5 mins
            })
            if (course) resolvedName = course.title
            isLoading = loadingContent
        } else if (previousSegment === "users") {
            const { data: user, isLoading: loadingContent } = useQuery({
                queryKey: queryKeys.users.detail(segment),
                queryFn: async () => {
                    const token = await getToken()
                    if (!token) return null
                    // Note: User detail API response might vary, usually { data: User }
                    // Based on users-details.tsx: await api.get<{ data: UserDetails }>(`/api/admin/users/${id}`, token)
                    const res = await api.get<{ data: any }>(`/api/admin/users/${segment}`, token)
                    return res.data
                },
                enabled: isUuid,
                staleTime: 1000 * 60 * 5,
            })
            if (user) resolvedName = user.name
            isLoading = loadingContent
        } else if (previousSegment === "enrollments") {
            // 1. Fetch Enrollment (Standard Return to avoid cache pollution)
            const { data: enrollmentRes, isLoading: isLoadingEnrollment } = useQuery({
                queryKey: queryKeys.enrollments.detail(segment),
                queryFn: async () => {
                    const token = await getToken()
                    if (!token) return null
                    return api.getEnrollmentById(segment, token)
                },
                enabled: isUuid,
                staleTime: 1000 * 60 * 5,
            })

            const enrollment = enrollmentRes?.data
            const userId = enrollment?.userId

            // 2. Fetch User Name
            const { data: userRes, isLoading: isLoadingUser } = useQuery({
                queryKey: queryKeys.users.detail(userId || "placeholder"), // Use "placeholder" to keep key valid but query disabled
                queryFn: async () => {
                    const token = await getToken()
                    if (!token) return null
                    return api.getUserById(userId!, token)
                },
                enabled: !!userId,
                staleTime: 1000 * 60 * 5,
            })

            const userName = userRes?.data?.name

            if (userName) {
                resolvedName = userName
            } else if (enrollment) {
                resolvedName = "Enrollment"
            }

            // The /admin/enrollments/:id page is removed, so this segment should not be clickable
            isUnclickable = true
            isLoading = isLoadingEnrollment || (!!userId && isLoadingUser)
        }

        if (isLoading) {
            return (
                <BreadcrumbItem>
                    <span className="flex items-center gap-1 opacity-50">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                    </span>
                </BreadcrumbItem>
            )
        }

        const href = "/" + segments.slice(0, index + 1).join("/")

        return (
            <BreadcrumbItem>
                {isLast || isUnclickable ? (
                    <BreadcrumbPage className="max-w-[200px] truncate md:max-w-none">{resolvedName}</BreadcrumbPage>
                ) : (
                    <BreadcrumbLink asChild>
                        <Link to={href} className="max-w-[150px] truncate md:max-w-none block">{resolvedName}</Link>
                    </BreadcrumbLink>
                )}
            </BreadcrumbItem>
        )
    }

    // 4. Default: Static Text
    // Format: "course-content" -> "Course Content"
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
    const href = "/" + segments.slice(0, index + 1).join("/")

    return (
        <BreadcrumbItem>
            {isLast ? (
                <BreadcrumbPage>{title}</BreadcrumbPage>
            ) : (
                <BreadcrumbLink asChild>
                    <Link to={href}>{title}</Link>
                </BreadcrumbLink>
            )}
        </BreadcrumbItem>
    )
}
