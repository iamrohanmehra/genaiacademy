"use client"

import { useState, Suspense, lazy } from "react"
import { useNavigate, Link } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { format, isValid } from "date-fns"
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldSeparator,
} from "~/components/ui/field"
import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"

const Calendar = lazy(() => import("~/components/ui/calendar").then(module => ({ default: module.Calendar })))

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters."),
    desc: z.string().min(10, "Description must be at least 10 characters."),
    schedule: z.string().min(1, "Schedule is required."),
    type: z.enum(["workshop", "course", "cohort", "mentorship"]),
    topic: z.coerce.number().min(1, "Topic ID is required."),
    price: z.coerce.number().min(0, "Price must be positive."),
    payable: z.coerce.number().min(0, "Payable amount must be positive."),
    certificateFee: z.coerce.number().min(0, "Certificate fee must be positive."),
    limit: z.coerce.number().min(1, "Limit must be at least 1."),
    startDate: z.date(),
    endDate: z.date(),
    status: z.enum(["private", "live", "inProgress", "completed"]),
    association: z.string().optional(),
    banner: z.string().url("Invalid URL").optional().or(z.literal("")),
    whatsAppGroupLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    resourcesLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    nextClassTopic: z.string().optional(),
    nextClassLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    nextClassDesc: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateCoursePage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { register, control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            desc: "",
            schedule: "",
            type: "course",
            topic: 1,
            price: 0,
            payable: 0,
            certificateFee: 0,
            limit: 100,
            status: "private",
            association: "",
            banner: "",
            whatsAppGroupLink: "",
            resourcesLink: "",
            nextClassTopic: "",
            nextClassLink: "",
            nextClassDesc: "",
            startDate: new Date(),
            endDate: new Date(),
        },
    })

    const { mutate: createCourse, isPending: submitting } = useMutation({
        mutationFn: async (values: FormValues) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)

            // Format dates to ISO string for API and numbers to fixed string
            const rawPayload = {
                ...values,
                price: values.price.toFixed(2),
                payable: values.payable.toFixed(2),
                certificateFee: values.certificateFee.toFixed(2),
                startDate: values.startDate.toISOString(),
                endDate: values.endDate.toISOString(),
            }

            // Remove empty strings to avoid backend validation errors on optional fields
            const payload = Object.fromEntries(
                Object.entries(rawPayload).filter(([_, v]) => v !== "")
            )

            const result = await api.post<{ success: boolean; message: string; data: any }>('/api/admin/courses', payload, token)
            return result
        },
        onSettled: (data) => {
            if (data?.success) {
                toast.success("Course created successfully")
                navigate("/admin/courses")
                queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
            }
        },
        onError: (err) => {
            console.error(err)
            toast.error(err instanceof Error ? err.message : "Failed to create course")
        }
    })

    function onSubmit(values: FormValues) {
        createCourse(values)
    }

    const renderDatePicker = (name: keyof FormValues, label: string) => (
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
                                {field.value && (field.value instanceof Date || typeof field.value === 'string') && isValid(new Date(field.value)) ? (
                                    format(new Date(field.value), "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Suspense fallback={<div className="p-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                                <Calendar
                                    mode="single"
                                    selected={field.value instanceof Date ? field.value : new Date(field.value as string)}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </Suspense>
                        </PopoverContent>
                    </Popover>
                    <FieldError errors={[errors[name]]} />
                </Field>
            )}
        />
    )

    return (
        <div className="flex flex-1 flex-col gap-8 p-8 max-w-xl mx-auto w-full">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
                        <p className="text-muted-foreground">Add a new course to the catalog.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <FieldGroup>
                    {/* Basic Info */}
                    <Field>
                        <FieldLabel>Course Title</FieldLabel>
                        <Input placeholder="e.g. Python Masterclass" {...register("title")} />
                        <FieldError errors={[errors.title]} />
                    </Field>

                    <Field>
                        <FieldLabel>Description</FieldLabel>
                        <Textarea placeholder="Course description..." {...register("desc")} />
                        <FieldError errors={[errors.desc]} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>Type</FieldLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="course">Course</SelectItem>
                                            <SelectItem value="workshop">Workshop</SelectItem>
                                            <SelectItem value="cohort">Cohort</SelectItem>
                                            <SelectItem value="mentorship">Mentorship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError errors={[errors.type]} />
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
                                            <SelectItem value="private">Private</SelectItem>
                                            <SelectItem value="live">Live</SelectItem>
                                            <SelectItem value="inProgress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError errors={[errors.status]} />
                                </Field>
                            )}
                        />
                    </div>

                    <Field>
                        <FieldLabel>Topic ID</FieldLabel>
                        <Input type="number" {...register("topic", { valueAsNumber: true })} />
                        <FieldError errors={[errors.topic]} />
                    </Field>

                    <Field>
                        <FieldLabel>Association (Optional)</FieldLabel>
                        <Input placeholder="e.g. CodeKaro" {...register("association")} />
                        <FieldError errors={[errors.association]} />
                    </Field>

                    <Field>
                        <FieldLabel>Banner URL (Optional)</FieldLabel>
                        <Input placeholder="https://..." {...register("banner")} />
                        <FieldError errors={[errors.banner]} />
                    </Field>

                    <FieldSeparator>Schedule & Pricing</FieldSeparator>

                    <Field>
                        <FieldLabel>Schedule</FieldLabel>
                        <Input placeholder="e.g. Mon-Fri 7PM IST" {...register("schedule")} />
                        <FieldError errors={[errors.schedule]} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        {renderDatePicker("startDate", "Start Date")}
                        {renderDatePicker("endDate", "End Date")}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>Price</FieldLabel>
                            <Input type="number" {...register("price", { valueAsNumber: true })} />
                            <FieldError errors={[errors.price]} />
                        </Field>

                        <Field>
                            <FieldLabel>Payable Amount</FieldLabel>
                            <Input type="number" {...register("payable", { valueAsNumber: true })} />
                            <FieldError errors={[errors.payable]} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>Certificate Fee</FieldLabel>
                            <Input type="number" {...register("certificateFee", { valueAsNumber: true })} />
                            <FieldError errors={[errors.certificateFee]} />
                        </Field>

                        <Field>
                            <FieldLabel>Student Limit</FieldLabel>
                            <Input type="number" {...register("limit", { valueAsNumber: true })} />
                            <FieldError errors={[errors.limit]} />
                        </Field>
                    </div>

                    <FieldSeparator>Communication & Resources</FieldSeparator>

                    <Field>
                        <FieldLabel>WhatsApp Group Link (Optional)</FieldLabel>
                        <Input placeholder="https://..." {...register("whatsAppGroupLink")} />
                        <FieldError errors={[errors.whatsAppGroupLink]} />
                    </Field>

                    <Field>
                        <FieldLabel>Resources Link (Optional)</FieldLabel>
                        <Input placeholder="https://..." {...register("resourcesLink")} />
                        <FieldError errors={[errors.resourcesLink]} />
                    </Field>

                    <FieldSeparator>Next Class Details</FieldSeparator>

                    <Field>
                        <FieldLabel>Next Class Topic (Optional)</FieldLabel>
                        <Input placeholder="e.g. Advanced OOP" {...register("nextClassTopic")} />
                        <FieldError errors={[errors.nextClassTopic]} />
                    </Field>

                    <Field>
                        <FieldLabel>Next Class Link (Optional)</FieldLabel>
                        <Input placeholder="https://..." {...register("nextClassLink")} />
                        <FieldError errors={[errors.nextClassLink]} />
                    </Field>

                    <Field>
                        <FieldLabel>Next Class Description (Optional)</FieldLabel>
                        <Textarea placeholder="Description..." {...register("nextClassDesc")} />
                        <FieldError errors={[errors.nextClassDesc]} />
                    </Field>

                    <div className="pt-4">
                        <Button type="submit" disabled={submitting} size="lg" className="w-full">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Course
                        </Button>
                    </div>
                </FieldGroup>
            </form>
        </div>
    )
}
