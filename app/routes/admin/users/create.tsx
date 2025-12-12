"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
    FieldGroup,
} from "~/components/ui/field"
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
    role: z.enum(["student", "operations", "admin"]),
    status: z.enum(["active", "banned"]),
    globalXp: z.number().min(0),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateUserPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
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
        mutationFn: async (values: FormValues) => {
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

                const signupResponse = await api.post<{ success: boolean; data: { user: { id: string } } }>(
                    "/api/auth/signup",
                    signupPayload
                )

                const userId = signupResponse.data.user.id

                // 2. Update user details (Role, Status, GlobalXP) via Admin API
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

    function onSubmit(values: FormValues) {
        createUser(values)
    }

    return (
        <div className="flex flex-1 flex-col gap-8 p-8 max-w-xl mx-auto w-full">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
                        <p className="text-muted-foreground">Enter the details of the new user.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <FieldGroup>
                    <Field>
                        <FieldLabel>Name</FieldLabel>
                        <Input placeholder="John Doe" {...register("name")} />
                        <FieldError errors={[errors.name]} />
                    </Field>

                    <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input placeholder="john@example.com" {...register("email")} />
                        <FieldError errors={[errors.email]} />
                    </Field>

                    <Field>
                        <FieldLabel>Password</FieldLabel>
                        <Input type="password" placeholder="******" {...register("password")} />
                        <FieldDescription>
                            Optional. Leave blank to create without a password (user can reset later).
                        </FieldDescription>
                        <FieldError errors={[errors.password]} />
                    </Field>

                    <Field>
                        <FieldLabel>Mobile</FieldLabel>
                        <Input placeholder="+1234567890" {...register("mobile")} />
                        <FieldError errors={[errors.mobile]} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            control={control}
                            name="role"
                            render={({ field }) => (
                                <Field>
                                    <FieldLabel>Role</FieldLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="operations">Operations</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError errors={[errors.role]} />
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
                                            <SelectValue placeholder="Select a status" />
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
                    </div>

                    <Field>
                        <FieldLabel>Global XP</FieldLabel>
                        <Input type="number" {...register("globalXp", { valueAsNumber: true })} />
                        <FieldError errors={[errors.globalXp]} />
                    </Field>

                    <div className="pt-4">
                        <Button type="submit" disabled={isPending} size="lg" className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </div>
                </FieldGroup>
            </form>
        </div>
    )
}
