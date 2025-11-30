"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
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
import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { supabase } from "~/lib/supabase"
import { api } from "~/lib/api.client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"

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
    startDate: z.date({ required_error: "Start date is required." }),
    endDate: z.date({ required_error: "End date is required." }),
    status: z.enum(["private", "live", "inProgress", "completed"]),
    association: z.string().optional(),
    banner: z.string().url("Invalid URL").optional().or(z.literal("")),
    whatsAppGroupLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    resourcesLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    nextClassTopic: z.string().optional(),
    nextClassLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    nextClassDesc: z.string().optional(),
})

export default function CreateCoursePage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            if (!token) {
                toast.error("Unauthorized")
                return
            }

            // Format dates to ISO string for API
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
            );

            const result = await api.post<{ success: boolean }>('/api/admin/courses', payload, token)
            if (result.success) {
                toast.success("Course created successfully")
                navigate("/admin/courses")
            }
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to create course")
        } finally {
            setLoading(false)
        }
    }

    return (

        <div className="flex flex-1 flex-col p-4 pt-0">
            <div className="container mx-auto space-y-6 max-w-5xl">
                <div className="flex items-center gap-2 py-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/admin/courses">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-lg font-semibold">Create New Course</h2>
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
                                                    <Input type="number" {...field} />
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
                                                                {field.value ? (
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
                                                                {field.value ? (
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
                                                    <Input type="number" {...field} />
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
                                                    <Input type="number" {...field} />
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
                                                    <Input type="number" {...field} />
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
                                                    <Input type="number" {...field} />
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
                            <Button type="submit" disabled={loading} size="lg">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Course
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
