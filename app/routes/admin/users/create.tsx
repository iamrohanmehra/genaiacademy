"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "~/components/ui/button"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { api, ApiError } from "~/lib/api.client"
import { queryKeys } from "~/lib/query-keys"
import { supabase } from "~/lib/supabase"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }).optional().or(z.literal("")),
    mobile: z.string().optional(),
    role: z.enum(["student", "operations", "admin"], {
        required_error: "Please select a role.",
    }),
    status: z.enum(["active", "banned"], {
        required_error: "Please select a status.",
    }),
    globalXp: z.coerce.number().min(0),
})

export default function CreateUserPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            mobile: "",
            role: "student",
            status: "active",
            globalXp: 0,
        },
    })

    const { mutate: createUser, isPending } = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new ApiError("Unauthorized", 401)

            // If password is provided, use the public signup endpoint to ensure 
            // the user is created in Supabase Auth correctly, then update the role/status.
            if (values.password && values.password.length > 0) {
                // 1. Create user via Signup API
                const signupPayload = {
                    name: values.name,
                    email: values.email,
                    password: values.password,
                    mobile: values.mobile || undefined,
                }

                // We use api.post but we don't strictly need the token for signup. 
                // However, passing it doesn't hurt.
                const signupResponse = await api.post<{ success: boolean; data: { user: { id: string } } }>(
                    "/api/auth/signup",
                    signupPayload
                )

                const userId = signupResponse.data.user.id

                // 2. Update user details (Role, Status, GlobalXP) via Admin API
                // Only update fields that differ from default signup (which sets role=student, status=active)
                // or fields that signup didn't handle (globalXp)
                const updatePayload = {
                    role: values.role,
                    status: values.status,
                    globalXp: values.globalXp,
                }

                return api.put<{ success: boolean; data: any }>(
                    `/api/admin/users/${userId}`,
                    updatePayload,
                    token
                )
            } else {
                // If no password, use the Admin Create User endpoint
                // This assumes the backend handles "create without password" correctly
                // (e.g. for invite-only flows where user sets password later)
                const payload = {
                    ...values,
                    password: undefined,
                }
                return api.post<{ success: boolean; data: any }>("/api/admin/users", payload, token)
            }
        },
        onSuccess: () => {
            toast.success("User created successfully")
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
            navigate("/admin/users")
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                toast.error(error.message)
            } else {
                toast.error("Failed to create user")
            }
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        createUser(values)
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Create User</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                        Enter the details of the new user.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="john@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="******" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Optional. Leave blank to create without a password (user can reset later).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1234567890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="student">Student</SelectItem>
                                                    <SelectItem value="operations">Operations</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
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
                                                        <SelectValue placeholder="Select a status" />
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
                                <FormField
                                    control={form.control}
                                    name="globalXp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Global XP</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <Button variant="outline" type="button" onClick={() => navigate("/admin/users")}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
