import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "~/hooks/useAuth"
import { Loader2 } from "lucide-react"

import type { Route } from "./+types/home"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "GenAI Academy" },
    { name: "description", content: "Redirecting..." },
  ]
}

export default function Home() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login")
      } else if (role === "admin") {
        navigate("/admin/dashboard")
      } else if (role === "student" || role === "instructor" || role === "user") {
        navigate("/student/dashboard")
      }
    }
  }, [user, role, loading, navigate])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-muted-foreground">Loading...</p>
    </div>
  )
}