"use client"

import { AppSidebar } from "~/components/app-sidebar"
import { CreateBatchForm } from "~/components/create-batch-form"
import { SiteHeader } from "~/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "~/components/ui/sidebar"

export default function CreateBatchPage() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex items-center justify-between space-y-2 py-4">
                        <h2 className="text-lg font-semibold">Create Batch</h2>
                    </div>
                    <CreateBatchForm />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
