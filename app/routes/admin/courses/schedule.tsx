import { useEffect, Suspense, lazy } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Checkbox } from "~/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
// Static import removed
// import { Calendar } from "~/components/ui/calendar"
import { cn } from "~/lib/utils"
import { api } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { supabase } from "~/lib/supabase"
import type { Course } from "~/types/course"

// Lazy load Calendar
const Calendar = lazy(() => import("~/components/ui/calendar").then(module => ({ default: module.Calendar })))

const scheduleSchema = z.object({
    nextClassTopic: z.string().min(1, "Topic is required"),
    nextClassDate: z.date(),
    meetingLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    screenVideoLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    notifyWhatsApp: z.boolean(),
    notifyEmail: z.boolean(),
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

export default function CourseSchedulePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Fetch Course Details
    const { data: course, isLoading } = useQuery({
        queryKey: queryKeys.courses.detail(id!),
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new Error("Unauthorized")
            const res = await api.get<{ success: boolean; data: Course }>(`/api/admin/courses/${id}`, token)
            return res.data
        },
        enabled: !!id,
    })

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            nextClassTopic: "",
            meetingLink: "",
            screenVideoLink: "",
            notifyWhatsApp: false,
            notifyEmail: false,
            nextClassDate: new Date(),
        },
    })

    // Populate form when data loads
    useEffect(() => {
        if (course) {
            form.reset({
                nextClassTopic: course.nextClassTopic || "",
                meetingLink: course.nextClassLink || "",
                screenVideoLink: course.resourcesLink || "",
                nextClassDate: (() => {
                    const date = course.schedule ? new Date(course.schedule) : new Date()
                    return isNaN(date.getTime()) ? new Date() : date
                })(),
                notifyWhatsApp: false,
                notifyEmail: false,
            })
        }
    }, [course, form])

    const updateScheduleMutation = useMutation({
        mutationFn: async (values: ScheduleFormValues) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new Error("Unauthorized")

            const payload = {
                nextClassTopic: values.nextClassTopic,
                nextClassLink: values.meetingLink,
                resourcesLink: values.screenVideoLink,
                schedule: values.nextClassDate.toISOString(),
                notifyWhatsApp: values.notifyWhatsApp,
                notifyEmail: values.notifyEmail,
            }

            return api.put(`/api/admin/courses/${id}`, payload, token)
        },
        onSuccess: () => {
            toast.success("Schedule updated successfully")
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(id!) })
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update schedule")
        },
    })

    function onSubmit(values: ScheduleFormValues) {
        updateScheduleMutation.mutate(values)
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!course) {
        return <div className="p-8">Course not found</div>
    }

    return (
        <div className="flex flex-1 flex-col gap-8 p-8 max-w-xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground">Manage upcoming class details and notifications for this course.</p>
                </div>

                {/* Current Schedule Display */}
                <div className="mt-4 text-sm">
                    {course.startDate && course.endDate ? (
                        <>
                            {format(new Date(course.startDate), "d MMM yyyy")} – {format(new Date(course.endDate), "d MMM yyyy")}
                        </>
                    ) : (
                        "No schedule set"
                    )}
                    {course.schedule && (() => {
                        const date = new Date(course.schedule)
                        return !isNaN(date.getTime()) ? (
                            <> | Class Time: {format(date, "h:mm a")}</>
                        ) : null
                    })()}
                </div>
            </div>

            <div className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control as any}
                            name="nextClassTopic"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Next Class Topic</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Advanced React Patterns" {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="nextClassDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Next Class Schedule</FormLabel>
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
                                                    {field.value ? (
                                                        format(field.value as Date, "PPP HH:mm")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Suspense fallback={<div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value as Date}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </Suspense>
                                            <div className="p-3 border-t">
                                                <Input
                                                    type="time"
                                                    onChange={(e) => {
                                                        const date = (field.value as Date) || new Date()
                                                        const [hours, minutes] = e.target.value.split(":")
                                                        date.setHours(parseInt(hours), parseInt(minutes))
                                                        field.onChange(date)
                                                    }}
                                                    defaultValue={field.value ? format(field.value as Date, "HH:mm") : ""}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Date and time for the upcoming session.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="meetingLink"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Meeting Link / User Video HLS</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://meet.google.com/..." {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control as any}
                            name="screenVideoLink"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Screen Video HLS</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                            <FormField
                                control={form.control as any}
                                name="notifyWhatsApp"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value as boolean}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Notify on WhatsApp
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="notifyEmail"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value as boolean}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Notify on Email
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={updateScheduleMutation.isPending} className="w-full">
                            {updateScheduleMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Update Schedule
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}
