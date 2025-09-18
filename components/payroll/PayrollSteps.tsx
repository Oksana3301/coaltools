'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Interface untuk definisi langkah dalam proses payroll
 */
export interface PayrollStep {
  id: string
  title: string
  description: string
  isCompleted: boolean
  isActive: boolean
  isDisabled?: boolean
}

/**
 * Props untuk komponen PayrollSteps
 */
interface PayrollStepsProps {
  steps: PayrollStep[]
  currentStep: number
  onStepChange: (stepIndex: number) => void
  onNext?: () => void
  onPrevious?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  className?: string
}

/**
 * Komponen untuk menampilkan dan mengelola langkah-langkah dalam proses payroll
 * Menyediakan navigasi visual dan kontrol untuk setiap tahap perhitungan gaji
 */
export function PayrollSteps({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  className
}: PayrollStepsProps) {
  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Proses Payroll</span>
          <Badge variant="outline">
            Langkah {currentStep + 1} dari {steps.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          {currentStepData?.description || 'Ikuti langkah-langkah untuk menyelesaikan perhitungan payroll'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => !step.isDisabled && onStepChange(index)}
                disabled={step.isDisabled}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  {
                    'bg-primary border-primary text-primary-foreground': step.isActive,
                    'bg-green-500 border-green-500 text-white': step.isCompleted,
                    'border-muted-foreground text-muted-foreground': !step.isActive && !step.isCompleted,
                    'cursor-pointer hover:border-primary': !step.isDisabled && !step.isActive,
                    'cursor-not-allowed opacity-50': step.isDisabled
                  }
                )}
              >
                {step.isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 mx-2',
                  step.isCompleted ? 'bg-green-500' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'text-center p-3 rounded-lg border transition-colors',
                {
                  'border-primary bg-primary/5': step.isActive,
                  'border-green-500 bg-green-50': step.isCompleted,
                  'border-muted': !step.isActive && !step.isCompleted
                }
              )}
            >
              <h4 className="font-medium text-sm">{step.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {step.isCompleted ? 'Selesai' : step.isActive ? 'Aktif' : 'Menunggu'}
              </p>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || !canGoPrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Sebelumnya
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentStepData?.title}
          </div>

          <Button
            onClick={onNext}
            disabled={isLastStep || !canGoNext}
            className="flex items-center gap-2"
          >
            Selanjutnya
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Hook untuk mengelola state langkah-langkah payroll
 */
export function usePayrollSteps(initialSteps: Omit<PayrollStep, 'isActive'>[]) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<PayrollStep[]>(
    initialSteps.map((step, index) => ({
      ...step,
      isActive: index === 0
    }))
  )

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex)
      setSteps(prev => prev.map((step: PayrollStep, index: number) => ({
        ...step,
        isActive: index === stepIndex
      })))
    }
  }, [steps.length])

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, steps.length, goToStep])

  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const markStepCompleted = useCallback((stepIndex: number) => {
    setSteps(prev => prev.map((step: PayrollStep, index: number) => 
      index === stepIndex ? { ...step, isCompleted: true } : step
    ))
  }, [])

  const markStepIncomplete = useCallback((stepIndex: number) => {
    setSteps(prev => prev.map((step: PayrollStep, index: number) => 
      index === stepIndex ? { ...step, isCompleted: false } : step
    ))
  }, [])

  return {
    steps,
    currentStep,
    goToStep,
    goNext,
    goPrevious,
    markStepCompleted,
    markStepIncomplete,
    canGoNext: currentStep < steps.length - 1,
    canGoPrevious: currentStep > 0,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1
  }
}