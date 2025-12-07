import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Pencil } from "lucide-react";
import { type Enrollment } from "~/types/enrollment";
import { useState } from "react";
import { EditEnrollmentForm } from "./edit-enrollment-form";

interface EditEnrollmentDialogProps {
    enrollment: Enrollment;
}

export function EditEnrollmentDialog({ enrollment }: EditEnrollmentDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Enrollment</DialogTitle>
                    <DialogDescription>
                        Update enrollment details here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <EditEnrollmentForm
                    enrollment={enrollment}
                    onSuccess={() => setOpen(false)}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

