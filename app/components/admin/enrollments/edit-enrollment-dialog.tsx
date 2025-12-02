import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2, Pencil } from "lucide-react";
import { type Enrollment } from "~/types/enrollment";
import { useState } from "react";

const formSchema = z.object({
    hasPaid: z.boolean().optional(),
    amountPaid: z.coerce.number().min(0).optional(),
    paidAt: z.string().optional(), // Using string for date input for simplicity
    transactionId: z.string().optional(),
    progress: z.coerce.number().min(0).max(100).optional(),
    certificateId: z.string().optional(),
    certificateGeneratedAt: z.string().optional(),
});

interface EditEnrollmentDialogProps {
    enrollment: Enrollment;
}

export function EditEnrollmentDialog({ enrollment }: EditEnrollmentDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hasPaid: enrollment.hasPaid,
            amountPaid: enrollment.amountPaid,
            paidAt: enrollment.paidAt ? new Date(enrollment.paidAt).toISOString().slice(0, 16) : "", // Format for datetime-local
            transactionId: enrollment.transactionId || "",
            progress: enrollment.progress || 0,
            certificateId: enrollment.certificateId || "",
            certificateGeneratedAt: enrollment.certificateGeneratedAt ? new Date(enrollment.certificateGeneratedAt).toISOString().slice(0, 16) : "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new ApiError("Unauthorized", 401);
            }

            // Clean up empty strings to undefined or null if needed, but API might handle it.
            // For dates, if empty string, maybe send undefined?
            const payload = {
                ...values,
                paidAt: values.paidAt || undefined,
                certificateGeneratedAt: values.certificateGeneratedAt || undefined,
                transactionId: values.transactionId || undefined,
                certificateId: values.certificateId || undefined,
            };

            return api.updateEnrollment(enrollment.id, payload, token);
        },
        onSuccess: () => {
            toast.success("Enrollment updated successfully");
            queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.detail(enrollment.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
            setOpen(false);
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
                toast.error("Session expired. Please login again.");
                // Redirect handled by page or global handler usually, but here just toast.
            } else {
                toast.error(error.message || "Failed to update enrollment");
            }
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutate(values);
    }

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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="hasPaid"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Payment Received
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amountPaid"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount Paid (in paise)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="paidAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Paid At</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="transactionId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transaction ID</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="progress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Progress (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="0" max="100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="certificateId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Certificate ID</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="certificateGeneratedAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Certificate Generated At</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
