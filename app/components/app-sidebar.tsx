"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { NavProjects } from "~/components/nav-projects"
import { NavUser } from "~/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar"
import { supabase } from "~/lib/supabase"

// This is sample data.
const data = {
  user: {
    name: "Admin User",
    email: "admin@genaiacademy.com",
    avatar: "https://github.com/shadcn.png",
  },
  teams: [
    {
      name: "GenAI Academy",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: SquareTerminal,
      items: [
        {
          title: "Overview",
          url: "/admin/dashboard",
        },
        {
          title: "Analytics",
          url: "/admin/dashboard/analytics",
        },
      ],
    },
    {
      title: "Courses",
      url: "/admin/courses",
      icon: Bot,
      items: [
        {
          title: "All Courses",
          url: "/admin/courses",
        },
        {
          title: "Create Course",
          url: "/admin/courses/create",
        },
        {
          title: "Active Courses",
          url: "/admin/courses/active",
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: BookOpen,
      items: [
        {
          title: "All Users",
          url: "/admin/users",
        },
        {
          title: "Enrollments",
          url: "/admin/enrollments",
        },
        {
          title: "Performance",
          url: "/admin/users/performance",
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/admin/settings",
        },
        {
          title: "Users",
          url: "/admin/settings/users",
        },
        {
          title: "Billing",
          url: "/admin/settings/billing",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Reports",
      url: "/admin/reports",
      icon: PieChart,
    },
    {
      name: "Resources",
      url: "/admin/resources",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState(data.user)

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "User",
          email: session.user.email || "",
          avatar: session.user.user_metadata.avatar_url || "https://github.com/shadcn.png",
        })
      }
    }
    getUser()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GenAI Academy</span>
                  <span className="truncate text-xs">Admin Console</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
