import * as React from "react"
import {
  IconAccessPoint,
  IconChartDots,
  IconDownload,
  IconHome,
  IconInnerShadowTop,
  IconPlus,
  IconSchool,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "~/components/nav-main"
import { NavUser } from "~/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: IconHome,
    },
    {
      title: "Batches",
      url: "#",
      icon: IconSchool,
    },
    {
      title: "Create Batch",
      url: "#",
      icon: IconPlus,
    },
    {
      title: "Learners",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Add Learner",
      url: "#",
      icon: IconPlus,
    },
    {
      title: "Grant Access",
      url: "#",
      icon: IconAccessPoint,
    },
    {
      title: "Course Progress",
      url: "#",
      icon: IconChartDots,
    },
    {
      title: "Download Invoices",
      url: "#",
      icon: IconDownload,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">GenAI Academy</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
