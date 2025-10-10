"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Receipt, 
  FileText, 
  Truck,
  Coins,
  DollarSign,
  TrendingUp,
  Users,
  Calculator,
  Home,
  Settings,
  BarChart3,
  Building2,
  Activity,
  Wallet,
  CreditCard
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Halaman utama aplikasi"
  },
  {
    name: "Generator Kwitansi",
    href: "/kwitansi",
    icon: Receipt,
    description: "Buat kwitansi profesional"
  },
  {
    name: "Invoice Generator",
    href: "/invoice",
    icon: FileText,
    description: "Buat invoice profesional"
  },
  {
    name: "Coal Tools",
    href: "/coal-tools-kaskecil",
    icon: Truck,
    description: "Sistem manajemen terintegrasi",
    children: [
      {
        name: "Kas Kecil",
        href: "/coal-tools-kaskecil",
        icon: Coins,
        description: "Manajemen pengeluaran kecil"
      },
      {
        name: "Kas Besar",
        href: "/coal-tools-kasbesar",
        icon: DollarSign,
        description: "Pengelolaan transaksi besar"
      },
      {
        name: "Karyawan",
        href: "/coal-tools-karyawan",
        icon: Users,
        description: "Manajemen data karyawan"
      },
      {
        name: "Kalkulator Gaji",
        href: "/payroll-integrated",
        icon: Calculator,
        description: "Kalkulator gaji karyawan"
      },
      {
        name: "Laporan Metrics",
        href: "/onboarding-demo",
        icon: BarChart3,
        description: "Dashboard analytics Core12 metrics"
      },
      {
        name: "Laporan Produksi",
        href: "/coal-tools-laporanproduksi",
        icon: TrendingUp,
        description: "Tracking produksi batu bara"
      },
      {
        name: "Admin Status & Delete Test",
        href: "/admin-status-test",
        icon: Settings,
        description: "Test status and delete button functionality"
      }
    ]
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col space-y-2 px-3">
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
          (item.children && item.children.some(child => pathname === child.href))
        
        return (
          <div key={item.name}>
            <Link href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 text-left",
                  isActive && "bg-primary text-primary-foreground shadow-sm"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-medium truncate">{item.name}</span>
                  <span className="text-xs opacity-70 truncate w-full">{item.description}</span>
                </div>
              </Button>
            </Link>
            
            {/* Show children if active */}
            {isActive && item.children && (
              <div className="ml-6 mt-2 space-y-1">
                {item.children.map((child) => {
                  const isChildActive = pathname === child.href
                  return (
                    <Link key={child.name} href={child.href}>
                      <Button
                        variant={isChildActive ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-2 h-10 text-sm",
                          isChildActive && "bg-secondary text-secondary-foreground shadow-sm"
                        )}
                      >
                        <child.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{child.name}</span>
                      </Button>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
