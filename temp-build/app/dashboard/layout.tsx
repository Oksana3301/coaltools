"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { Menu } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <SidebarNav />
            </SheetContent>
          </Sheet>
          <div className="flex w-full items-center justify-between">
            <span className="font-bold">Dashboard</span>
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="flex-1 items-start md:grid md:grid-cols-[220px_1fr]">
        <aside className="fixed top-0 z-30 hidden h-screen w-[220px] border-r bg-background lg:block">
          <div className="flex h-[60px] items-center px-6 font-bold">
            Dashboard
          </div>
          <Separator />
          <SidebarNav className="px-3" />
        </aside>
        <main className="flex w-full flex-col overflow-hidden lg:pl-[220px]">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex-1 space-y-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
