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
import { useQuery, useQueryClient } from "@tanstack/react-query"

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

function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: { user: UserDetails, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdated: () => void }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        mobile: user.mobile || "",
        role: user.role,
        status: user.status
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const apiUrl = import.meta.env.VITE_API_URL
            const response = await fetch(`${apiUrl}/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error('Failed to update user')

            const result = await response.json()
            if (result.success) {
                toast.success("User updated successfully")
                onUserUpdated()
                onOpenChange(false)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to update user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                    <DialogDescription>Make changes to the user's profile here.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required type="email" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input id="mobile" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={formData.role} onValueChange={(val: any) => setFormData({ ...formData, role: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="operations">Operations</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="banned">Banned</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

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



function DeleteUserDialog({ user, open, onOpenChange }: { user: UserDetails, open: boolean, onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [nameInput, setNameInput] = useState("")
    const [confirmInput, setConfirmInput] = useState("")
    const [loading, setLoading] = useState(false)

    const isValid = nameInput === user.name && confirmInput === "delete user"

    const handleDelete = async () => {
        if (!isValid) return
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const apiUrl = import.meta.env.VITE_API_URL
            const response = await fetch(`${apiUrl}/api/admin/users/${user.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Failed to delete user')

            const result = await response.json()
            if (result.success) {
                toast.success("User deleted successfully")
                await queryClient.invalidateQueries({ queryKey: ['users'] })
                navigate("/admin/users")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>This will permanently delete the user and all related information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>To confirm, type the user’s full name.</Label>
                        <Input
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            placeholder={user.name}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>To confirm, type ‘delete user’.</Label>
                        <Input
                            value={confirmInput}
                            onChange={e => setConfirmInput(e.target.value)}
                            placeholder="delete user"
                        />
                    </div>
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Deleting a user cannot be undone.
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={!isValid || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ProfileContent({ user }: { user: UserDetails }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
                                    <Button variant="outline">
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
    const [actionLoading, setActionLoading] = useState(false)
    const queryClient = useQueryClient()

    const { data: user, isLoading: loading } = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            if (!id) throw new Error("No user ID")
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                throw new Error("Unauthorized")
            }

            const apiUrl = import.meta.env.VITE_API_URL
            const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch user details')
            }

            const result = await response.json()
            return result.data as UserDetails
        },
        enabled: !!id,
    })

    const handleStatusChange = async (newStatus: 'active' | 'banned') => {
        if (!id || !user) return

        try {
            setActionLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) return

            const apiUrl = import.meta.env.VITE_API_URL
            const endpoint = newStatus === 'banned' ? 'ban' : 'activate'

            const response = await fetch(`${apiUrl}/api/admin/users/${id}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to ${endpoint} user`)
            }

            const result = await response.json()
            if (result.success) {
                toast.success(`User ${newStatus === 'banned' ? 'banned' : 'activated'} successfully`)
                queryClient.invalidateQueries({ queryKey: ['user', id] })
            }
        } catch (error) {
            console.error(`Error changing status:`, error)
            toast.error(`Failed to update user status`)
        } finally {
            setActionLoading(false)
        }
    }

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
                        onStatusChange={handleStatusChange}
                        actionLoading={actionLoading}
                        onUserUpdated={() => queryClient.invalidateQueries({ queryKey: ['user', id] })}
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
