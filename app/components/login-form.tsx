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


export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Try Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user && data.session) {
        // Get the JWT access token
        const token = data.session.access_token

        // Verify user role with backend
        try {
          const apiUrl = import.meta.env.VITE_API_URL

          // If backend URL is not configured, allow login temporarily to student dashboard
          if (!apiUrl) {
            console.warn('VITE_API_URL not configured. Skipping role verification.')
            toast.warning("Backend not configured. Proceeding without role verification.")
            toast.success(`Welcome back!`)
            navigate("/student/dashboard")
            return
          }

          const response = await fetch(`${apiUrl}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))

            // Handle 404 - endpoint doesn't exist yet
            if (response.status === 404) {
              console.warn('Backend /api/auth/verify endpoint not found.')
              toast.warning("Backend verification not available yet.")
              toast.info("Proceeding to student dashboard.")
              navigate("/student/dashboard")
              return
            }

            if (response.status === 403) {
              toast.error("Account is not active or access denied")
              await supabase.auth.signOut()
              return
            }

            throw new Error(errorData.error || 'Failed to verify user')
          }

          const { user: userData } = await response.json()

          // Route based on role
          if (userData.role === 'admin') {
            toast.success(`Welcome back, ${userData.name}!`)
            navigate("/admin/dashboard")
          } else if (userData.role === 'student' || userData.role === 'instructor') {
            toast.success(`Welcome back, ${userData.name}!`)
            navigate("/student/dashboard")
          } else {
            toast.error("Invalid user role")
            await supabase.auth.signOut()
          }
        } catch (verifyError) {
          console.error('User verification error:', verifyError)

          // If it's a network error, the backend might be down
          if (verifyError instanceof TypeError && verifyError.message.includes('fetch')) {
            toast.warning("Backend is not reachable. Proceeding to student dashboard.")
            navigate("/student/dashboard")
          } else {
            toast.error(verifyError instanceof Error ? verifyError.message : "Failed to verify user")
            await supabase.auth.signOut()
          }
        }
      }
    } catch (error) {
      toast.error("An error occurred during login")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
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
      toast.error("An error occurred with Google login")
      console.error(error)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
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
