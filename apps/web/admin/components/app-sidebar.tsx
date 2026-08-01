"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Settings2,
  Command,
  LifeBuoy,
  Send,
  Store,
  Bike,
  Route,
  BarChart,
  Users,
  Settings,
  ShoppingCart,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin User",
    email: "admin@lagchow.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Platform",
      url: "#",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/",
        },
        {
          title: "Orders",
          url: "/orders",
        },
        {
          title: "Active Riders",
          url: "/active-riders",
        },
        {
          title: "Delivery Ops",
          url: "/delivery-ops",
        },
        {
          title: "Riders Directory",
          url: "/riders",
        },
        {
          title: "Delivery Modes",
          url: "/delivery-modes",
        },
        {
          title: "Vendors",
          url: "/vendors",
        },
      ],
    },
    {
      title: "Management",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Team Members",
          url: "/team",
        },
        {
          title: "Finance",
          url: "/finance",
        },
        {
          title: "Analytics",
          url: "/analytics",
        },
        {
          title: "Customers",
          url: "/customers",
        },
        {
          title: "Settings",
          url: "/settings",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Top Vendors",
      url: "/top-vendors",
      icon: Store,
    },
    {
      name: "Active Riders",
      url: "/active-riders",
      icon: Bike,
    },
    {
      name: "Performance",
      url: "/performance",
      icon: BarChart,
    },
  ],
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar: string }
}) {
  const sidebarUser = user || data.user;
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="grid flex-1 text-left leading-tight py-1">
                  <span className="truncate font-black text-xl tracking-tighter text-accent">LagChow<span className="text-foreground">.</span></span>
                  <span className="truncate text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Admin Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
