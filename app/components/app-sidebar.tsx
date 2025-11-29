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
      title: "Batches",
      url: "/admin/dashboard/batches",
      icon: Bot,
      items: [
        {
          title: "All Batches",
          url: "/admin/dashboard/batches",
        },
        {
          title: "Create Batch",
          url: "/admin/dashboard/create-batch",
        },
        {
          title: "Active Batches",
          url: "/admin/dashboard/batches/active",
        },
      ],
    },
    {
      title: "Students",
      url: "/admin/dashboard/students",
      icon: BookOpen,
      items: [
        {
          title: "All Students",
          url: "/admin/dashboard/students",
        },
        {
          title: "Enrollments",
          url: "/admin/dashboard/students/enrollments",
        },
        {
          title: "Performance",
          url: "/admin/dashboard/students/performance",
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/admin/dashboard/settings",
        },
        {
          title: "Users",
          url: "/admin/dashboard/settings/users",
        },
        {
          title: "Billing",
          url: "/admin/dashboard/settings/billing",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Course Management",
      url: "/admin/dashboard/courses",
      icon: Frame,
    },
    {
      name: "Reports",
      url: "/admin/dashboard/reports",
      icon: PieChart,
    },
    {
      name: "Resources",
      url: "/admin/dashboard/resources",
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
