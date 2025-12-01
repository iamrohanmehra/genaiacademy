"use client"

import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Loader2, Shield } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

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
import { supabase } from "~/lib/supabase"
import { api } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"

type UserDetails = {
    id: string
    name: string
}

export function DeleteUserDialog({ user, open, onOpenChange, onSuccess }: { user: UserDetails, open: boolean, onOpenChange: (open: boolean) => void, onSuccess?: () => void }) {
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

            const result = await api.delete<{ success: boolean }>(`/api/admin/users/${user.id}`, token)
            if (result.success) {
                toast.success("User deleted successfully")
                await queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
                onOpenChange(false)
                if (onSuccess) {
                    onSuccess()
                } else {
                    // Default behavior if no onSuccess provided (e.g. from details page)
                    navigate("/admin/users")
                }
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
