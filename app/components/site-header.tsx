import { useLocation } from "react-router"
import React from "react"
import { Separator } from "~/components/ui/separator"
import { SidebarTrigger } from "~/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { NavActions } from "~/components/nav-actions"
import { BreadcrumbResolver } from "~/components/breadcrumb-resolver"

export function SiteHeader() {
  const location = useLocation()
  const pathSegments = location.pathname.split("/").filter(Boolean)

  // Filter logic for Dashboard requirements
  // Requirement 1: Replace "admin" text with "Dashboard" (Visual only, handled in Resolver)
  // Requirement 2: On /admin/dashboard, show only single item "Dashboard".
  // Requirement 3: On other pages, show hierarchy.
  // Requirement 4: Remove "create" and "edit" segments and make parent clickable.

  let segmentsToRender = pathSegments
  let forceLinkIndex = -1

  // Handle /admin/dashboard special case
  if (pathSegments.length === 2 && pathSegments[0] === "admin" && pathSegments[1] === "dashboard") {
    segmentsToRender = ["admin"]
  } else {
    // Check if last segment is create or edit (Removed to show current page)
    // const lastSegment = pathSegments[pathSegments.length - 1]
    // if (["create", "edit"].includes(lastSegment)) {
    //   segmentsToRender = pathSegments.slice(0, -1)
    //   forceLinkIndex = segmentsToRender.length - 1
    // }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-2 px-4 overflow-hidden">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="flex-1 overflow-hidden">
          <div className="relative flex items-center overflow-hidden">
            <BreadcrumbList className="flex-nowrap overflow-x-auto overflow-y-hidden py-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:overflow-visible md:px-0">
              {segmentsToRender.map((segment, index) => {
                const isLast = index === segmentsToRender.length - 1
                const shouldBeLink = index === forceLinkIndex

                return (
                  <React.Fragment key={`${segment}-${index}`}>
                    <BreadcrumbResolver
                      segment={segment}
                      index={index}
                      segments={segmentsToRender}
                      isLast={isLast && !shouldBeLink}
                    />
                    {!isLast && <BreadcrumbSeparator className="shrink-0" />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </div>
        </Breadcrumb>
      </div>
      <div className="ml-auto px-3">
        <NavActions />
      </div>
    </header>
  )
}
