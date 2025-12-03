"use client"


import { DataTable } from "~/components/data-table"
import { SectionCards } from "~/components/section-cards"
import { Separator } from "~/components/ui/separator"


import data from "~/dashboard/data.json"

import { useEffect } from "react"
import { supabase } from "~/lib/supabase"

export default function Page() {
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        console.log("🔹 [Initial] Bearer Token:", session.access_token)
      } else {
        console.log("🔸 [Initial] No active session found")
      }
    })

    // Listen for auth changes (e.g. session restore)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        console.log("🔹 [AuthChange] Bearer Token:", session.access_token)
      } else {
        console.log("🔸 [AuthChange] No active session found")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 px-4">
      <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">
        <SectionCards />
        <DataTable data={data} />
      </div>
    </div>
  )
}