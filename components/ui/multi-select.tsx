"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface MultiSelectOption {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  error?: boolean
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
  error = false
}: MultiSelectProps) {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const handleRemove = (optionValue: string) => {
    onChange(value.filter(v => v !== optionValue))
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(val => {
            const option = options.find(opt => opt.value === val)
            if (!option) return null
            
            return (
              <Badge 
                key={val} 
                variant="secondary" 
                className="flex items-center gap-1 pl-2 pr-1"
              >
                {option.icon && <span className="text-xs">{option.icon}</span>}
                <span className="text-xs">{option.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemove(val)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Options grid */}
      <div className={cn(
        "grid grid-cols-1 gap-2 p-3 rounded-lg border transition-colors",
        error && "border-destructive",
        "hover:border-accent"
      )}>
        {options.map(option => {
          const isSelected = value.includes(option.value)
          
          return (
            <div
              key={option.value}
              className={cn(
                "flex items-start space-x-3 p-3 rounded-md cursor-pointer transition-all",
                "hover:bg-accent/50",
                isSelected && "bg-accent border border-primary/20"
              )}
              onClick={() => handleToggle(option.value)}
            >
              <div className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 transition-colors",
                isSelected 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-muted-foreground"
              )}>
                {isSelected && (
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {option.icon && <span className="text-sm">{option.icon}</span>}
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          {placeholder}
        </p>
      )}
    </div>
  )
}
