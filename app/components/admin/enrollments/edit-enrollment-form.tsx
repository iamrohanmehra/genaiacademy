import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "~/lib/api.client";
import { queryKeys } from "~/lib/query-keys";
import { supabase } from "~/lib/supabase";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldContent,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Loader2, CalendarIcon } from "lucide-react";
import { type Enrollment } from "~/types/enrollment";
import { type Course } from "~/types/course";
import { type User } from "~/types/user";
import { format } from "date-fns";
import { cn } from "~/lib/utils";

const formSchema = z.object({
    courseId: z.string().optional(),
    invoiceId: z.string().optional(),
    transactionId: z.string().optional(),
    paymentMethod: z.string().optional(),
    amountPaid: z.number().min(0).optional(),
    hasPaid: z.boolean().optional(),
    paidAt: z.string().optional(),
    accessOnDate: z.string().optional(),
    // courseStartDate is read-only, not in schema for submission usually, but we can ignore it or just not include in schema if not submitting.
    accessTillDate: z.string().optional(),
    certificateId: z.string().optional(),
    certificateGeneratedAt: z.string().optional(),
});

type EnrollmentFormValues = z.infer<typeof formSchema>;

interface EditEnrollmentFormProps {
    enrollment: Enrollment;
    course?: Course;
    user?: User;
    onSuccess: () => void;
    onCancel?: () => void;
}

export function EditEnrollmentForm({ enrollment, course, user, onSuccess, onCancel }: EditEnrollmentFormProps) {
    const queryClient = useQueryClient();

    const { register, handleSubmit, control, formState: { errors } } = useForm<EnrollmentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            courseId: enrollment.courseId || "",
            invoiceId: enrollment.invoiceId || "",
            transactionId: enrollment.transactionId || "",
            paymentMethod: enrollment.paymentMethod || "",
            amountPaid: enrollment.amountPaid,
            hasPaid: enrollment.hasPaid,
            paidAt: enrollment.paidAt ? new Date(enrollment.paidAt).toISOString() : "",
            accessOnDate: enrollment.accessOnDate ? new Date(enrollment.accessOnDate).toISOString() : "",
            accessTillDate: enrollment.accessTillDate ? new Date(enrollment.accessTillDate).toISOString() : "",
            certificateId: enrollment.certificateId || "",
            certificateGeneratedAt: enrollment.certificateGeneratedAt ? new Date(enrollment.certificateGeneratedAt).toISOString() : "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (values: EnrollmentFormValues) => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new ApiError("Unauthorized", 401);
            }

            const payload = {
                ...values,
                paidAt: values.paidAt || undefined,
                accessOnDate: values.accessOnDate || undefined,
                accessTillDate: values.accessTillDate || undefined,
                certificateGeneratedAt: values.certificateGeneratedAt || undefined,
                transactionId: values.transactionId || undefined,
                invoiceId: values.invoiceId || undefined,
                paymentMethod: values.paymentMethod || undefined,
                certificateId: values.certificateId || undefined,
                courseId: values.courseId || undefined,
            };

            return api.updateEnrollment(enrollment.id, payload, token);
        },
        onSuccess: () => {
            toast.success("Enrollment updated successfully");
            queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.detail(enrollment.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
            onSuccess();
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
                toast.error("Session expired. Please login again.");
            } else {
                toast.error(error.message || "Failed to update enrollment");
            }
        },
    });

    function onSubmit(values: EnrollmentFormValues) {
        mutate(values);
    }

    const renderDatePicker = (name: keyof EnrollmentFormValues, label: string) => (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <Field className="flex flex-col">
                    <FieldLabel>{label}</FieldLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value ? (
                                    format(new Date(field.value as string), "PPP h:mm a")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value as string) : undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        const current = field.value ? new Date(field.value as string) : new Date();
                                        date.setHours(current.getHours(), current.getMinutes());
                                        field.onChange(date.toISOString());
                                    } else {
                                        field.onChange("");
                                    }
                                }}
                                disabled={(date) =>
                                    date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            <div className="p-3 border-t">
                                <Input
                                    type="time"
                                    value={field.value ? format(new Date(field.value as string), "HH:mm") : ""}
                                    onChange={(e) => {
                                        const date = field.value ? new Date(field.value as string) : new Date();
                                        const [hours, minutes] = e.target.value.split(":");
                                        if (hours && minutes) {
                                            date.setHours(parseInt(hours), parseInt(minutes));
                                            field.onChange(date.toISOString());
                                        }
                                    }}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                    <FieldError errors={[errors[name]]} />
                </Field>
            )}
        />
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>

                {/* Course ID */}
                <Field>
                    <FieldLabel>Course ID</FieldLabel>
                    <Input placeholder="Course ID" {...register("courseId")} />
                    <FieldError errors={[errors.courseId]} />
                </Field>

                {/* Order ID */}
                <Field>
                    <FieldLabel>Order ID</FieldLabel>
                    <Input placeholder="e.g. INV-2024-001" {...register("invoiceId")} />
                    <FieldError errors={[errors.invoiceId]} />
                </Field>

                {/* Payment ID */}
                <Field>
                    <FieldLabel>Payment ID</FieldLabel>
                    <Input placeholder="e.g. pay_Pl88..." {...register("transactionId")} />
                    <FieldError errors={[errors.transactionId]} />
                </Field>

                {/* Payment Method */}
                <Field>
                    <FieldLabel>Payment Method</FieldLabel>
                    <Input placeholder="e.g. UPI, Card, Netbanking" {...register("paymentMethod")} />
                    <FieldError errors={[errors.paymentMethod]} />
                </Field>

                {/* Amount Paid */}
                <Field>
                    <FieldLabel>Amount Paid</FieldLabel>
                    <Input
                        type="number"
                        min="0"
                        {...register("amountPaid", { valueAsNumber: true })}
                    />
                    <FieldDescription>Amount in paise (e.g., 499900 for ₹4999.00)</FieldDescription>
                    <FieldError errors={[errors.amountPaid]} />
                </Field>

                {/* Paid At */}
                {renderDatePicker("paidAt", "Paid At (Date & Time)")}

                {/* Payment Received */}
                <Controller
                    control={control}
                    name="hasPaid"
                    render={({ field: { value, onChange } }) => (
                        <Field orientation="horizontal">
                            <Checkbox
                                id="hasPaid"
                                checked={value}
                                onCheckedChange={onChange}
                            />
                            <FieldContent>
                                <FieldLabel htmlFor="hasPaid">Payment Received</FieldLabel>
                            </FieldContent>
                        </Field>
                    )}
                />

                {/* Access On */}
                {renderDatePicker("accessOnDate", "Course Start Date")}

                {/* Access Till */}
                {renderDatePicker("accessTillDate", "Access Till")}

                <div className="border-t my-2"></div>

                {/* Certificate ID */}
                <Field>
                    <FieldLabel>Certificate ID</FieldLabel>
                    <Input {...register("certificateId")} />
                    <FieldError errors={[errors.certificateId]} />
                </Field>

                {/* Certificate Generated At */}
                {renderDatePicker("certificateGeneratedAt", "Certificate Generated At")}

                <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={isPending} className="flex-1">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                    )}
                </div>
            </FieldGroup>
        </form>
    );
}
