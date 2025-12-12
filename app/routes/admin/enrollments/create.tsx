import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldContent,
} from "~/components/ui/field";

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

    const { register, control, handleSubmit, formState: { errors } } = useForm({
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
        <div className="flex flex-1 flex-col gap-8 p-8 max-w-xl mx-auto w-full">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Create Enrollment</h1>
                    <p className="text-muted-foreground">Enroll a user in a course manually.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <FieldGroup>
                    <Field>
                        <FieldLabel>User ID</FieldLabel>
                        <Input placeholder="User UUID" {...register("userId")} />
                        <FieldDescription>
                            The UUID of the user to enroll.
                        </FieldDescription>
                        <FieldError errors={[errors.userId]} />
                    </Field>

                    <Field>
                        <FieldLabel>Course ID</FieldLabel>
                        <Input placeholder="Course UUID" {...register("courseId")} />
                        <FieldDescription>
                            The UUID of the course.
                        </FieldDescription>
                        <FieldError errors={[errors.courseId]} />
                    </Field>

                    <Field>
                        <FieldLabel>Amount Paid (in paise)</FieldLabel>
                        <Input type="number" placeholder="0" {...register("amountPaid")} />
                        <FieldDescription>
                            e.g., 499900 for ₹4999.00
                        </FieldDescription>
                        <FieldError errors={[errors.amountPaid]} />
                    </Field>

                    <Controller
                        control={control}
                        name="hasPaid"
                        render={({ field }) => (
                            <Field orientation="horizontal">
                                <Checkbox
                                    id="hasPaid"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                <FieldContent>
                                    <FieldLabel htmlFor="hasPaid">Payment Received</FieldLabel>
                                </FieldContent>
                            </Field>
                        )}
                    />

                    <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                            <Field>
                                <FieldLabel>Status</FieldLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="banned">Banned</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError errors={[errors.status]} />
                            </Field>
                        )}
                    />

                    <div className="pt-4">
                        <Button type="submit" disabled={isPending} size="lg" className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Enrollment
                        </Button>
                    </div>
                </FieldGroup>
            </form>
        </div>
    );
}
