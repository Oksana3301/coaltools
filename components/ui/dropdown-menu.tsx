"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Custom dropdown menu implementation to avoid Radix UI ref issues
interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  children, 
  open = false, 
  onOpenChange 
}) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange } as any)
        }
        return child
      })}
    </div>
  )
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  children, 
  className,
  open = false,
  onOpenChange 
}) => {
  const handleClick = () => {
    onOpenChange?.(!open)
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:not([class*='size-']):size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      {children}
    </button>
  )
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  sideOffset?: number
  open?: boolean
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  className,
  sideOffset = 4,
  open = false 
}) => {
  if (!open) return null

  return (
    <div
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-96 min-w-[8rem] origin-top-right overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      )}
      style={{ 
        position: 'absolute',
        top: `calc(100% + ${sideOffset}px)`,
        right: 0,
        minWidth: '8rem'
      }}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  inset?: boolean
  variant?: "default" | "destructive"
  onClick?: () => void
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className,
  inset = false,
  variant = "default",
  onClick 
}) => {
  return (
    <button
      type="button"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:not([class*='size-']):size-4 w-full text-left",
        inset && "pl-8",
        variant === "destructive" && "text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 focus:text-destructive",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode
  className?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const DropdownMenuCheckboxItem: React.FC<DropdownMenuCheckboxItemProps> = ({ 
  children, 
  className,
  checked = false,
  onCheckedChange 
}) => {
  return (
    <button
      type="button"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:not([class*='size-']):size-4 w-full text-left",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        {checked && <CheckIcon className="size-4" />}
      </span>
      {children}
    </button>
  )
}

interface DropdownMenuRadioGroupProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}

const DropdownMenuRadioGroup: React.FC<DropdownMenuRadioGroupProps> = ({ 
  children, 
  value,
  onValueChange 
}) => {
  return (
    <div className="flex flex-col gap-1">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange } as any)
        }
        return child
      })}
    </div>
  )
}

interface DropdownMenuRadioItemProps {
  children: React.ReactNode
  className?: string
  value: string
  currentValue?: string
  onValueChange?: (value: string) => void
}

const DropdownMenuRadioItem: React.FC<DropdownMenuRadioItemProps> = ({ 
  children, 
  className,
  value,
  currentValue,
  onValueChange 
}) => {
  const isSelected = value === currentValue

  return (
    <button
      type="button"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:not([class*='size-']):size-4 w-full text-left",
        className
      )}
      onClick={() => onValueChange?.(value)}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        {isSelected && <CircleIcon className="size-2 fill-current" />}
      </span>
      {children}
    </button>
  )
}

interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
  inset?: boolean
}

const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ 
  children, 
  className,
  inset = false 
}) => {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
    >
      {children}
    </div>
  )
}

interface DropdownMenuSeparatorProps {
  className?: string
}

const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({ 
  className 
}) => {
  return (
    <div
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
    />
  )
}

interface DropdownMenuShortcutProps {
  children: React.ReactNode
  className?: string
}

const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
    >
      {children}
    </span>
  )
}

interface DropdownMenuSubProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({ 
  children, 
  open = false,
  onOpenChange 
}) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open, onOpenChange } as any)
        }
        return child
      })}
    </div>
  )
}

interface DropdownMenuSubTriggerProps {
  children: React.ReactNode
  className?: string
  inset?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenuSubTrigger: React.FC<DropdownMenuSubTriggerProps> = ({ 
  children, 
  className,
  inset = false,
  open = false,
  onOpenChange 
}) => {
  return (
    <button
      type="button"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:not([class*='size-']):size-4 w-full text-left",
        inset && "pl-8",
        className
      )}
      onClick={() => onOpenChange?.(!open)}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </button>
  )
}

interface DropdownMenuSubContentProps {
  children: React.ReactNode
  className?: string
  sideOffset?: number
  open?: boolean
}

const DropdownMenuSubContent: React.FC<DropdownMenuSubContentProps> = ({ 
  children, 
  className,
  sideOffset = 4,
  open = false 
}) => {
  if (!open) return null

  return (
    <div
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-top-left overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      style={{ 
        position: 'absolute',
        top: 0,
        left: `calc(100% + ${sideOffset}px)`,
        minWidth: '8rem'
      }}
    >
      {children}
    </div>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
