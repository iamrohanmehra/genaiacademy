"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { NavProjects } from "~/components/nav-projects"
import { NavUser } from "~/components/nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Admin User",
    email: "admin@genaiacademy.com",
    avatar: "/avatars/admin.jpg",
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
      isActive: true,
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
