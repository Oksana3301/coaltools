"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  description, 
  children, 
  className 
}: FormFieldProps) {
  const id = React.useId()

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          className: cn(
            (children as React.ReactElement).props.className,
            error && "border-destructive focus-visible:ring-destructive"
          )
        })}
      </div>
      
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span className="font-medium">⚠</span>
          {error}
        </p>
      )}
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
