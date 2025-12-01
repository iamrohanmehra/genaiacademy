"use client"


import { DataTable } from "~/components/data-table"
import { SectionCards } from "~/components/section-cards"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
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
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 pb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/admin/dashboard">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 md:gap-6">
          <SectionCards />
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}
