"use client"

import { useEffect, useState, Suspense, lazy } from "react"
import { useParams, Link, useNavigate } from "react-router"
import { format } from "date-fns"
import {
    ArrowLeft,
    Calendar,
    Clock,
    Users,
    MoreHorizontal,
    ExternalLink,
    DollarSign,
    BookOpen,
    Loader2,
    Trash2
} from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "~/components/ui/tabs"
import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { OptimizedImage } from "~/components/optimized-image"

// Define Course Type (same as in courses.tsx)
type Course = {
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
    status: "live" | "private" | "completed"
    createdAt: string
    updatedAt: string
}

const DeleteCourseDialog = lazy(() => import("~/components/delete-course-dialog"))

export default function CourseDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const { data: course, isLoading: loading } = useQuery({
        queryKey: queryKeys.courses.detail(id || ''),
        queryFn: async () => {
            if (!id) throw new Error("No course ID")
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                throw new ApiError("Unauthorized", 401)
            }

            const result = await api.get<{ success: boolean; data: Course }>(`/api/admin/courses/${id}`, token)
            return result.data
        },
        enabled: !!id,
    })

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Course not found</p>
                <Button asChild variant="outline">
                    <Link to="/admin/courses">Go Back</Link>
                </Button>
            </div>
        )
    }

    return (

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <DeleteCourseDialog course={course} open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} />
            <div className="flex items-center gap-2 py-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin/courses">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-lg font-semibold">Course Details</h2>
            </div>

            <div className="grid gap-6">
                {/* Banner */}
                {course.banner && (
                    <div className="w-full aspect-video relative rounded-lg overflow-hidden border bg-muted">
                        <OptimizedImage
                            src={course.banner}
                            alt={course.title}
                            className="w-full h-full"
                        />
                    </div>
                )}

                {/* Header Card */}
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{course.title}</CardTitle>
                            <CardDescription>{course.desc}</CardDescription>
                            <div className="flex items-center gap-2 pt-2">
                                <Badge variant={course.status === "live" ? "default" : "secondary"}>
                                    {course.status}
                                </Badge>
                                <Badge variant="outline" className="capitalize">{course.type}</Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link to={`/admin/courses/${id}/content`}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Manage Content
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link to={`/admin/courses/${id}/edit`}>Edit Course</Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Course
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Schedule & Timing</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Start Date</span>
                                        </div>
                                        <span className="font-medium">{format(new Date(course.startDate), "PP")}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>End Date</span>
                                        </div>
                                        <span className="font-medium">{format(new Date(course.endDate), "PP")}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>Schedule</span>
                                        </div>
                                        <span className="font-medium">{course.schedule}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Pricing & Limits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DollarSign className="h-4 w-4" />
                                            <span>Price</span>
                                        </div>
                                        <span className="font-medium">₹{course.price}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DollarSign className="h-4 w-4" />
                                            <span>Payable</span>
                                        </div>
                                        <span className="font-medium">₹{course.payable}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>Student Limit</span>
                                        </div>
                                        <span className="font-medium">{course.limit}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Resources & Links</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    {course.whatsAppGroupLink && (
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <p className="font-medium">WhatsApp Group</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{course.whatsAppGroupLink}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={course.whatsAppGroupLink} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                    {course.resourcesLink && (
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <p className="font-medium">Course Resources</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{course.resourcesLink}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={course.resourcesLink} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="curriculum">
                        <Card>
                            <CardHeader>
                                <CardTitle>Next Class</CardTitle>
                                <CardDescription>Upcoming session details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {course.nextClassTopic ? (
                                    <>
                                        <div className="space-y-1">
                                            <p className="font-medium text-lg">{course.nextClassTopic}</p>
                                            <p className="text-muted-foreground">{course.nextClassDesc}</p>
                                        </div>
                                        {course.nextClassLink && (
                                            <Button asChild>
                                                <a href={course.nextClassLink} target="_blank" rel="noreferrer">
                                                    Join Class <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">No upcoming class scheduled.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
