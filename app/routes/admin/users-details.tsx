"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { toast } from "sonner"
import { format } from "date-fns"
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    Shield,
    Ban,
    CheckCircle,
    MoreHorizontal,
    Loader2,
    Camera,
    Key,
    Trash2
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"

type Enrollment = {
    courseId: string
    courseName: string
    enrolledAt: string
    status: string
}

type UserDetails = {
    id: string
    name: string
    email: string
    mobile: string | null
    role: "student" | "admin" | "instructor" | "operations" | "ops"
    status: "active" | "banned" | "suspended"
    createdAt: string
    avatar?: string
    enrollments: Enrollment[]
    lastActivity?: string
    ipAddress?: string
    userAgent?: string
}

const getAvatarUrl = (url?: string) => {
    if (!url) return undefined
    if (url.startsWith('http') || url.startsWith('https')) return url
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || ''
    const path = url.startsWith('/') ? url : `/${url}`
    return `${baseUrl}${path}`
}

const getInitials = (name: string) => {
    if (!name) return "U"
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

import { EditUserDialog } from "~/components/admin/users/edit-user-dialog"
import { DeleteUserDialog } from "~/components/admin/users/delete-user-dialog"
import { ChangePasswordDialog } from "~/components/admin/users/change-password-dialog"

function ProfileHeader({ user, onStatusChange, actionLoading, onUserUpdated }: { user: UserDetails, onStatusChange: (status: 'active' | 'banned') => void, actionLoading: boolean, onUserUpdated: () => void }) {
    const [isEditOpen, setIsEditOpen] = useState(false)

    return (
        <>
            <EditUserDialog user={user} open={isEditOpen} onOpenChange={setIsEditOpen} onUserUpdated={onUserUpdated} />
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={getAvatarUrl(user.avatar)} alt={user.name} className="object-cover" />
                                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <Button
                                size="icon"
                                variant="outline"
                                className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full">
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                    {user.role}
                                </Badge>
                                <Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
                                    {user.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">User ID: {user.id}</p>
                            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Mail className="size-4" />
                                    {user.email}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Phone className="size-4" />
                                    {user.mobile || "No mobile"}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-4" />
                                    Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(true)}>Edit Profile</Button>
                            {user.status === 'active' ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => onStatusChange('banned')}
                                    disabled={actionLoading}
                                >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Ban User
                                </Button>
                            ) : (
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => onStatusChange('active')}
                                    disabled={actionLoading}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}




function ProfileContent({ user }: { user: UserDetails }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

    return (
        <>
            <DeleteUserDialog user={user} open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} />
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity & Details</CardTitle>
                            <CardDescription>Recent activity and device information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-base text-muted-foreground">Last Activity</Label>
                                    <p className="font-medium">
                                        {user.lastActivity ? format(new Date(user.lastActivity), "PP p") : "Never"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-base text-muted-foreground">IP Address</Label>
                                    <p className="font-medium">{user.ipAddress || "Unknown"}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-base text-muted-foreground">User Agent</Label>
                                    <p className="font-medium text-sm break-all">{user.userAgent || "Unknown"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="enrollments" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enrolled Courses</CardTitle>
                            <CardDescription>List of courses this user has enrolled in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course Name</TableHead>
                                        <TableHead>Enrolled Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {user.enrollments && user.enrollments.length > 0 ? (
                                        user.enrollments.map((enrollment) => (
                                            <TableRow key={enrollment.courseId}>
                                                <TableCell className="font-medium">{enrollment.courseName}</TableCell>
                                                <TableCell>{format(new Date(enrollment.enrolledAt), "PP")}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{enrollment.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem>View Course</DropdownMenuItem>
                                                            <DropdownMenuItem>Unenroll</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No enrollments found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage account security and authentication.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base">Password</Label>
                                        <p className="text-muted-foreground text-sm">Last changed 3 months ago</p>
                                    </div>
                                    <ChangePasswordDialog
                                        userId={user.id}
                                        open={isChangePasswordOpen}
                                        onOpenChange={setIsChangePasswordOpen}
                                    />
                                    <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                                        <Key className="mr-2 h-4 w-4" />
                                        Change Password
                                    </Button>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base">Active Sessions</Label>
                                        <p className="text-muted-foreground text-sm">
                                            Manage devices that are logged into your account
                                        </p>
                                    </div>
                                    <Button variant="outline">
                                        <Shield className="mr-2 h-4 w-4" />
                                        View Sessions
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Irreversible and destructive actions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-base">Delete Account</Label>
                                    <p className="text-muted-foreground text-sm">
                                        Permanently delete this account and all data
                                    </p>
                                </div>
                                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}

export default function UserDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const queryClient = useQueryClient()

    const { data: user, isLoading: loading } = useQuery({
        queryKey: queryKeys.users.detail(id || ''),
        queryFn: async () => {
            if (!id) throw new Error("No user ID")
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                throw new ApiError("Unauthorized", 401)
            }

            const result = await api.get<{ data: UserDetails }>(`/api/admin/users/${id}`, token)
            return result.data
        },
        enabled: !!id,
    })

    const { mutate: toggleStatus, isPending: actionLoading } = useMutation({
        mutationFn: async (newStatus: 'active' | 'banned') => {
            if (!id) throw new Error("No user ID")
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)

            const endpoint = newStatus === 'banned' ? 'ban' : 'activate'
            const result = await api.post<{ success: boolean }>(`/api/admin/users/${id}/${endpoint}`, {}, token)
            return result
        },
        onMutate: async (newStatus) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id || '') })
            const previousUser = queryClient.getQueryData<UserDetails>(queryKeys.users.detail(id || ''))

            if (previousUser) {
                queryClient.setQueryData(queryKeys.users.detail(id || ''), {
                    ...previousUser,
                    status: newStatus,
                })
            }

            return { previousUser }
        },
        onError: (err, newStatus, context) => {
            if (context?.previousUser) {
                queryClient.setQueryData(queryKeys.users.detail(id || ''), context.previousUser)
            }
            toast.error(`Failed to update user status`)
        },
        onSettled: (data, error, variables) => {
            if (data?.success) {
                toast.success(`User ${variables === 'banned' ? 'banned' : 'activated'} successfully`)
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id || '') })
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
        },
    })

    return (

        <div className="flex flex-1 flex-col p-4 pt-0">
            <div className="flex items-center gap-4 py-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">Back to Users</h2>
            </div>

            {loading ? (
                <div className="flex h-[50vh] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : user ? (
                <div className="container mx-auto space-y-6 max-w-5xl">
                    <ProfileHeader
                        user={user}
                        onStatusChange={(status) => toggleStatus(status)}
                        actionLoading={actionLoading}
                        onUserUpdated={() => {
                            queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id || '') })
                            queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
                        }}
                    />
                    <ProfileContent user={user} />
                </div>
            ) : (
                <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
                    <p className="text-muted-foreground">User not found</p>
                    <Button onClick={() => navigate("/admin/users")}>Go Back</Button>
                </div>
            )}
        </div>
    )
}
