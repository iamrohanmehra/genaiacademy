"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { useNavigate, Link, useParams } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, isValid } from "date-fns"
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
// import { Calendar } from "~/components/ui/calendar"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
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
import { supabase } from "~/lib/supabase"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

const Calendar = lazy(() => import("~/components/ui/calendar").then(module => ({ default: module.Calendar })))

// Reuse schema from create page
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

type Course = {
    id: string
    title: string
    desc: string
    schedule: string
    type: string
    topic: number
    price: string
    payable: string
    certificateFee: string
    association: string
    limit: number
    banner: string
    startDate: string
    endDate: string
    whatsAppGroupLink: string
    resourcesLink: string
    nextClassTopic: string
    nextClassLink: string
    nextClassDesc: string
    status: "live" | "private" | "completed"
    createdAt: string
    updatedAt: string
}

export default function EditCoursePage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const queryClient = useQueryClient()
    const form = useForm({
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
        },
    })

    // Fetch course details
    const { data: course, isLoading } = useQuery({
        queryKey: queryKeys.courses.detail(id || ''),
        queryFn: async () => {
            if (!id) throw new Error("No course ID")
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                throw new ApiError("Unauthorized", 401)
            }

            const result = await api.get<{ success: boolean; data: Course }>(`/api/admin/courses/${id}`, token)
            return result.data
        },
        enabled: !!id,
    })

    // Pre-fill form when data is loaded
    useEffect(() => {
        if (course) {
            form.reset({
                title: course.title,
                desc: course.desc,
                schedule: course.schedule,
                type: course.type as any,
                topic: course.topic,
                price: parseFloat(course.price),
                payable: parseFloat(course.payable),

                certificateFee: parseFloat(course.certificateFee),
                limit: course.limit,
                startDate: new Date(course.startDate),
                endDate: new Date(course.endDate),
                status: course.status as any,
                association: course.association || "",
                banner: course.banner || "",
                whatsAppGroupLink: course.whatsAppGroupLink || "",
                resourcesLink: course.resourcesLink || "",
                nextClassTopic: course.nextClassTopic || "",
                nextClassLink: course.nextClassLink || "",
                nextClassDesc: course.nextClassDesc || "",
            })
        }
    }, [course, form])

    const { mutate: updateCourse, isPending: submitting } = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)

            const rawPayload = {
                ...values,
                price: values.price.toFixed(2),
                payable: values.payable.toFixed(2),
                certificateFee: values.certificateFee.toFixed(2),
                startDate: values.startDate.toISOString(),
                endDate: values.endDate.toISOString(),
            }

            const result = await api.put<{ success: boolean; message: string; data: Course }>(`/api/admin/courses/${id}`, rawPayload, token)
            return result
        },
        onMutate: async (newCourseData) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.courses.detail(id || '') })
            const previousCourse = queryClient.getQueryData<Course>(queryKeys.courses.detail(id || ''))

            if (previousCourse) {
                // Optimistically update
                // Note: We need to be careful with types here. The form data structure is slightly different from the Course type (e.g. dates are Date objects vs strings).
                // For a true optimistic update, we'd need to convert form values to match the Course type perfectly.
                // Given the complexity of date conversions and potential partial updates, we'll do a "best effort" optimistic update
                // or simply rely on the loading state if the transformation is too complex to replicate client-side reliably without duplication.

                // However, for this requirement, let's implement the optimistic update by merging compatible fields.
                queryClient.setQueryData(queryKeys.courses.detail(id || ''), {
                    ...previousCourse,
                    ...newCourseData,
                    // Convert dates to strings to match Course type if needed for display immediately, 
                    // though the UI might be using Date objects if we parsed them in the component.
                    // Actually, the component parses strings to Dates in useEffect.
                    // So we should be careful. 
                    // The safest bet for now is to rely on invalidation for the full refresh, 
                    // BUT since we want optimistic updates, let's try to update the simple fields.
                    title: newCourseData.title,
                    desc: newCourseData.desc,
                    price: newCourseData.price.toFixed(2),
                    payable: newCourseData.payable.toFixed(2),
                })
            }

            return { previousCourse }
        },
        onError: (err, newCourseData, context) => {
            if (context?.previousCourse) {
                queryClient.setQueryData(queryKeys.courses.detail(id || ''), context.previousCourse)
            }
            toast.error(err instanceof Error ? err.message : "Failed to update course")
        },
        onSettled: (data) => {
            if (data?.success) {
                toast.success("Course updated successfully")
                navigate(`/admin/courses/${id}`)
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(id || '') })
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        updateCourse(values)
    }

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Course not found</p>
                <Button asChild variant="outline">
                    <Link to="/admin/courses">Go Back</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col p-4 pt-0">
            <div className="container mx-auto space-y-6 max-w-5xl">
                <div className="flex items-center gap-2 py-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/courses/${id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-lg font-semibold">Edit Course</h2>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Basic Info */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>General details about the course.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Course Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Python Masterclass" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="desc"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Course description..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="course">Course</SelectItem>
                                                        <SelectItem value="workshop">Workshop</SelectItem>
                                                        <SelectItem value="cohort">Cohort</SelectItem>
                                                        <SelectItem value="mentorship">Mentorship</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
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
                                                        <SelectItem value="private">Private</SelectItem>
                                                        <SelectItem value="live">Live</SelectItem>
                                                        <SelectItem value="inProgress">In Progress</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="topic"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Topic ID</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value as number} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="association"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Association (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. CodeKaro" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="banner"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Banner URL (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Schedule & Dates */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Schedule & Dates</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="schedule"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Schedule</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Mon-Fri 7PM IST" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Start Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value && isValid(field.value) ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Suspense fallback={<div className="p-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value}
                                                                onSelect={field.onChange}
                                                                disabled={(date) =>
                                                                    date < new Date("1900-01-01")
                                                                }
                                                                initialFocus
                                                            />
                                                        </Suspense>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>End Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value && isValid(field.value) ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) =>
                                                                date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Pricing & Limits */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pricing & Limits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value as number} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="payable"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Payable Amount</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value as number} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="certificateFee"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Certificate Fee</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value as number} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="limit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Student Limit</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value as number} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Additional Links */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Additional Links & Next Class</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="whatsAppGroupLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp Group Link (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="resourcesLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Resources Link (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nextClassTopic"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Next Class Topic (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Advanced OOP" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nextClassLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Next Class Link (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nextClassDesc"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Next Class Description (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Description..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={submitting} size="lg">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Course
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
