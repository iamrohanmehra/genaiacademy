"use client"

import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { cn } from "~/lib/utils"
import { supabase } from "~/lib/supabase"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "~/components/ui/field"
import { Input } from "~/components/ui/input"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobile: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validate passwords match
            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match")
                setLoading(false)
                return
            }

            // Validate password length
            if (formData.password.length < 6) {
                toast.error("Password must be at least 6 characters")
                setLoading(false)
                return
            }

            const apiUrl = import.meta.env.VITE_API_URL
            if (!apiUrl) {
                toast.error("API URL not configured")
                setLoading(false)
                return
            }

            // Call Backend Signup API
            const response = await fetch(`${apiUrl}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    mobile: formData.mobile || undefined
                })
            })

            const responseData = await response.json()

            if (!response.ok) {
                throw new Error(responseData.error || 'Signup failed')
            }

            const { user, session } = responseData.data

            // Sync session with Supabase client
            if (session) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                })

                if (sessionError) {
                    console.error('Failed to set Supabase session:', sessionError)
                }
            }

            toast.success(`Account created successfully! Welcome, ${user.name}`)

            // Route based on role
            if (user.role === 'admin') {
                navigate("/admin/dashboard")
            } else {
                navigate("/student/dashboard")
            }

        } catch (error) {
            console.error('Signup error:', error)
            toast.error(error instanceof Error ? error.message : "An error occurred during signup")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/student/dashboard`
                }
            })

            if (error) {
                toast.error(error.message)
            }
        } catch (error) {
            toast.error("An error occurred with Google signup")
            console.error(error)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create an account</CardTitle>
                    <CardDescription>
                        Sign up with your Google account or email
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Field>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={handleGoogleSignup}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Sign up with Google
                                </Button>
                            </Field>
                            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                Or continue with
                            </FieldSeparator>
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="mobile">Mobile Number (Optional)</FieldLabel>
                                <Input
                                    id="mobile"
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                                <FieldDescription className="text-xs">
                                    Optional - for account recovery
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <FieldDescription className="text-xs">
                                    Must be at least 6 characters
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </Field>
                            <Field>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Creating account..." : "Sign up"}
                                </Button>
                                <FieldDescription className="text-center">
                                    Already have an account? <a href="/login">Login</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}
