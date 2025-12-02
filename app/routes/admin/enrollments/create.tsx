import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const formSchema = z.object({
    userId: z.string().uuid({ message: "Invalid User ID" }),
    courseId: z.string().uuid({ message: "Invalid Course ID" }),
    amountPaid: z.coerce.number().min(0, { message: "Amount must be positive" }),
    hasPaid: z.boolean().default(false),
    status: z.enum(["active", "banned"]).default("active"),
});

export default function CreateEnrollmentPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: "",
            courseId: "",
            amountPaid: 0,
            hasPaid: false,
            status: "active" as "active" | "banned",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new ApiError("Unauthorized", 401);
            }

            // Convert amount to paise/cents if needed, but schema says number.
            // API docs say "Amount in paise/cents".
            // Assuming input is in major units (e.g. Rupees) and we convert to minor (Paise) * 100?
            // Or input is raw?
            // Let's assume input is raw for now as per "Amount in paise/cents" description in docs, 
            // but usually admins enter Rupees. 
            // Let's stick to raw input to be safe with API docs, or maybe add a note.
            // Actually, let's assume the admin enters the value in paise directly for now to match API 1:1.

            return api.createEnrollment(values, token);
        },
        onSuccess: () => {
            toast.success("Enrollment created successfully");
            queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
            navigate("/admin/enrollments");
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
                toast.error("Session expired. Please login again.");
                navigate("/login");
            } else {
                toast.error(error.message || "Failed to create enrollment");
            }
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutate(values);
    }

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link to="/admin/enrollments">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Create Enrollment</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>New Enrollment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>User ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="User UUID" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The UUID of the user to enroll.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="courseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Course UUID" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The UUID of the course.
                                        </FormDescription>
                                        <FormMessage />
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
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            e.g., 499900 for ₹4999.00
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                            <FormDescription>
                                                Check if the user has already paid.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="banned">Banned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Enrollment
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
