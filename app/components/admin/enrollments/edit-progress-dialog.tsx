import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Loader2, Pencil } from "lucide-react";
import type { ProgressDetail } from "~/types/enrollment";

interface EditProgressDialogProps {
    enrollmentId: string;
    contentId: string;
    contentTitle: string;
    currentProgress: ProgressDetail | null;
}

export function EditProgressDialog({
    enrollmentId,
    contentId,
    contentTitle,
    currentProgress,
}: EditProgressDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const [visited, setVisited] = useState(currentProgress?.visited || 0);
    const [timeSpent, setTimeSpent] = useState(currentProgress?.timeSpent || 0);
    const [progress, setProgress] = useState(currentProgress?.progress || 0);
    const [status, setStatus] = useState<'inProgress' | 'completed'>(currentProgress?.status || 'inProgress');
    const [attendedLive, setAttendedLive] = useState(currentProgress?.attendedLive || false);

    useEffect(() => {
        if (open) {
            setVisited(currentProgress?.visited || 0);
            setTimeSpent(currentProgress?.timeSpent || 0);
            setProgress(currentProgress?.progress || 0);
            setStatus(currentProgress?.status || 'inProgress');
            setAttendedLive(currentProgress?.attendedLive || false);
        }
    }, [open, currentProgress]);

    const updateProgressMutation = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new ApiError("Unauthorized", 401);

            return api.updateContentProgress(
                enrollmentId,
                contentId,
                {
                    visited,
                    timeSpent,
                    progress,
                    status,
                    attendedLive,
                },
                token
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.progress(enrollmentId) });
            toast.success("Progress updated successfully");
            setOpen(false);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update progress");
        },
    });

    const handleSave = () => {
        updateProgressMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit Progress</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Progress</DialogTitle>
                    <DialogDescription>
                        Update progress for "{contentTitle}".
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select
                            value={status}
                            onValueChange={(value: 'inProgress' | 'completed') => setStatus(value)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inProgress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="progress" className="text-right">
                            Progress (%)
                        </Label>
                        <Input
                            id="progress"
                            type="number"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => setProgress(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="timeSpent" className="text-right">
                            Time (sec)
                        </Label>
                        <Input
                            id="timeSpent"
                            type="number"
                            min="0"
                            value={timeSpent}
                            onChange={(e) => setTimeSpent(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="visited" className="text-right">
                            Visited
                        </Label>
                        <Input
                            id="visited"
                            type="number"
                            min="0"
                            value={visited}
                            onChange={(e) => setVisited(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="attendedLive" className="text-right">
                            Attended Live
                        </Label>
                        <div className="flex items-center space-x-2 col-span-3">
                            <Switch
                                id="attendedLive"
                                checked={attendedLive}
                                onCheckedChange={setAttendedLive}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updateProgressMutation.isPending}>
                        {updateProgressMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
