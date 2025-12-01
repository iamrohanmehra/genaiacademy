"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
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
import { supabase } from "~/lib/supabase"
import { api } from "~/lib/api.client"

type UserDetails = {
    id: string
    name: string
    email: string
    mobile: string | null
    role: "student" | "admin" | "instructor" | "operations" | "ops"
    status: "active" | "banned" | "suspended"
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: { user: UserDetails, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdated: () => void }) {
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

            const result = await api.put<{ success: boolean }>(`/api/admin/users/${user.id}`, formData, token)
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
