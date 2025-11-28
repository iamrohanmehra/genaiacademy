"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

const formSchema = z.object({
    courseId: z.string().min(1, { message: "Course ID is required" }),
    batchName: z.string().min(1, { message: "Batch Name is required" }),
    teacher: z.string().min(1, { message: "Teacher is required" }),
    price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
    amountPayable: z.coerce.number().min(0, { message: "Amount Payable must be a positive number" }),
    seatLimit: z.coerce.number().min(1, { message: "Seat Limit must be at least 1" }),
    classType: z.string().min(1, { message: "Class Type is required" }),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    whatsappLink: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
    resourcesLink: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
    nextClassTopic: z.string().optional(),
    nextClassDate: z.date().optional(),
    nextClassTime: z.string().optional(),
    status: z.string().min(1, { message: "Status is required" }),
})

export function CreateBatchForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            courseId: "",
            batchName: "",
            teacher: "",
            price: 0,
            amountPayable: 0,
            seatLimit: 30,
            classType: "",
            startDate: undefined,
            endDate: undefined,
            whatsappLink: "",
            resourcesLink: "",
            nextClassTopic: "",
            nextClassTime: "10:00",
            status: "Private",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // TODO: When Supabase database is connected, replace this with actual API call
            // Example:
            // const { data, error } = await supabase
            //   .from('batches')
            //   .insert([{
            //     course_id: values.courseId,
            //     batch_name: values.batchName,
            //     teacher: values.teacher,
            //     price: values.price,
            //     amount_payable: values.amountPayable,
            //     seat_limit: values.seatLimit,
            //     class_type: values.classType,
            //     start_date: values.startDate,
            //     end_date: values.endDate,
            //     whatsapp_link: values.whatsappLink,
            //     resources_link: values.resourcesLink,
            //     next_class_topic: values.nextClassTopic,
            //     next_class_date: values.nextClassDate,
            //     next_class_time: values.nextClassTime,
            //     status: values.status,
            //   }])
            //
            // if (error) {
            //   toast.error(`Failed to create batch: ${error.message}`)
            //   return
            // }

            console.log("Batch data:", values)

            // Simulate API success
            toast.success("Batch created successfully!", {
                description: `${values.batchName} has been added to the system.`,
            })

            // Reset form after successful submission
            form.reset()
        } catch (error) {
            console.error("Error creating batch:", error)
            toast.error("Failed to create batch", {
                description: "An unexpected error occurred. Please try again.",
            })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8 max-w-2xl mx-auto">
                <div className="flex flex-col gap-6">
                    <FormField
                        control={form.control}
                        name="courseId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Course ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. CS101" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="batchName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Batch Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Summer 2025" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="teacher"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assign Teacher</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a teacher" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Ashish Shukla">Ashish Shukla</SelectItem>
                                        <SelectItem value="Arpit Khare">Arpit Khare</SelectItem>
                                        <SelectItem value="Himanshu Srivastava">Himanshu Srivastava</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="classType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select class type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Course">Course</SelectItem>
                                        <SelectItem value="Workshop">Workshop</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                        name="amountPayable"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount Payable</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seatLimit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Seat Limit</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Batch Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Live">Live</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Private">Private</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
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
                    <FormField
                        control={form.control}
                        name="whatsappLink"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WhatsApp Group Link</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://chat.whatsapp.com/..." {...field} />
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
                                <FormLabel>Resources Link</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://drive.google.com/..." {...field} />
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
                                <FormLabel>Next Class Topic</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Introduction to React" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex gap-4">
                        <FormField
                            control={form.control}
                            name="nextClassDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col flex-1">
                                    <FormLabel>Next Class Date</FormLabel>
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
                                                    date < new Date()
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
                            name="nextClassTime"
                            render={({ field }) => (
                                <FormItem className="flex flex-col w-32">
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <Button type="submit">Create Batch</Button>
            </form>
        </Form>
    )
}
