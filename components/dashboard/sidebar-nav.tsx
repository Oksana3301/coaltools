"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  LayoutDashboard, 
  BarChart, 
  Settings,
  Users,
  FileText,
  Mail
} from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
    icon?: React.ComponentType
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  const defaultItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart
    },
    {
      title: "Customers",
      href: "/dashboard/customers",
      icon: Users
    },
    {
      title: "Documents",
      href: "/dashboard/documents",
      icon: FileText
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: Mail
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings
    },
  ]

  const navItems = items?.length ? items : defaultItems

  return (
    <ScrollArea className="h-full py-6">
      <div className={cn("space-y-1", className)} {...props}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.title}
              </Button>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  )
}
