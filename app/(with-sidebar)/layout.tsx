import { LayoutWithSidebar } from "@/components/layout-with-sidebar"

export default function WithSidebarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>
}
