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
  // Requirement 1: Replace "admin" text with "Dashboard" (Visual only, handled in Resolver or here via props)
  // Requirement 2: On /admin/dashboard, show only single item "Dashboard".
  // Requirement 3: On other pages, show hierarchy.

  let segmentsToRender = pathSegments

  // Special case for /admin/dashboard -> just ["Dashboard"]
  // Path is ["admin", "dashboard"]
  if (pathSegments.length === 2 && pathSegments[0] === "admin" && pathSegments[1] === "dashboard") {
    // We want to render just one item "Dashboard"
    // We can mock this as just one segment "admin" which resolves to "Dashboard",
    // or just rely on the fact that "admin" maps to "Dashboard".
    // If we keep just ["admin"], BreadcrumbResolver rendering "admin" will show "Dashboard".
    segmentsToRender = ["admin"]
  }
  // General case: /admin/... -> We want "Dashboard > ..."
  // The "admin" segment should resolve to "Dashboard".
  // If we have ["admin", "users"], it becomes "Dashboard > Users".
  // This works if BreadcrumbResolver handles "admin" -> "Dashboard".

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-2 px-4 overflow-hidden">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="flex-1 overflow-hidden">
          <div className="relative flex items-center overflow-hidden">
            {/* Fade masks for scrolling - visible only when needed technically, 
                            but subtle permanent fades are often used or we can just use simple scroll.
                            Request: "subtle transparent fade effects on both ends" */}

            <BreadcrumbList className="flex-nowrap overflow-x-auto overflow-y-hidden py-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:overflow-visible md:px-0">
              {segmentsToRender.map((segment, index) => {
                const isLast = index === segmentsToRender.length - 1
                return (
                  <React.Fragment key={`${segment}-${index}`}>
                    <BreadcrumbResolver
                      segment={segment}
                      index={index}
                      segments={pathSegments} // Pass full original segments context for logic if needed, or mapped ones?
                      // Actually BreadcrumbResolver needs correct context for resolving IDs.
                      // If we sliced segmentsToRender, we might lose context (e.g. parent "users").
                      // But for "admin" -> "Dashboard" single item, context doesn't matter much.
                      // For other routes, pathSegments usually starts with "admin".
                      // If we are at /admin/courses/123, segments are [admin, courses, 123]
                      // BreadcrumbResolver for 123 needs to know prev is courses.
                      // Index in segmentsToRender matches if we didn't slice from the middle.
                      // We only sliced off "dashboard" from the end in the special case.
                      // So passing pathSegments vs segmentsToRender:
                      // Case 1: /admin/dashboard -> segmentsToRender=["admin"], pathSegments=["admin", "dashboard"]
                      // Resolver gets "admin", index 0. logic: if segment=="admin" return "Dashboard". Correct.
                      // Case 2: /admin/courses -> segmentsToRender=["admin", "courses"].
                      // Resolver 0: admin -> Dashboard. Resolver 1: courses -> Courses. Correct.
                      isLast={isLast}
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
