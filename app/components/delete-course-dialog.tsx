"use client"

import { useState } from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
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
import { supabase } from "~/lib/supabase"
import { api } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import type { Course } from "~/types/course"

interface DeleteCourseDialogProps {
    course: Course
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function DeleteCourseDialog({ course, open, onOpenChange }: DeleteCourseDialogProps) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [confirmInput, setConfirmInput] = useState("")
    const [loading, setLoading] = useState(false)

    const isValid = confirmInput === "delete course"

    const handleDelete = async () => {
        if (!isValid) return
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const result = await api.delete<{ success: boolean }>(`/api/admin/courses/${course.id}`, token)
            if (result.success) {
                toast.success("Course deleted successfully")
                await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
                navigate("/admin/courses")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete course")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Course</DialogTitle>
                    <DialogDescription>This will permanently delete the course and all related information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>To confirm, type ‘delete course’.</Label>
                        <Input
                            value={confirmInput}
                            onChange={e => setConfirmInput(e.target.value)}
                            placeholder="delete course"
                        />
                    </div>
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Deleting a course cannot be undone.
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={!isValid || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Course
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
