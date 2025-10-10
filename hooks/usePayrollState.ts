import { useState, useCallback, useEffect } from 'react'
import { Employee, PayComponent, PayrollRun } from '@/lib/api'

// Unified state interface
interface PayrollState {
  ui: {
    currentStep: number
    isLoading: boolean
    saveStatus: 'idle' | 'saving' | 'saved' | 'error'
    activeDialog: 'none' | 'save' | 'rename' | 'component' | 'tutorial'
  }
  data: {
    payrollRun: PayrollRun | null
    employees: Employee[]
    components: PayComponent[]
    selectedEmployees: string[]
    payrollRuns: PayrollRun[]
  }
  form: {
    periode: { awal: string; akhir: string }
    overrides: Record<string, any>
    hasChanges: boolean
    customFileName: string
    notes: string
  }
  config: {
    overtimeEnabled: boolean
    autoSaveEnabled: boolean
    showTutorial: boolean
  }
}

const initialState: PayrollState = {
  ui: {
    currentStep: 1,
    isLoading: false,
    saveStatus: 'idle',
    activeDialog: 'none'
  },
  data: {
    payrollRun: null,
    employees: [],
    components: [],
    selectedEmployees: [],
    payrollRuns: []
  },
  form: {
    periode: { awal: '', akhir: '' },
    overrides: {},
    hasChanges: false,
    customFileName: '',
    notes: ''
  },
  config: {
    overtimeEnabled: false,
    autoSaveEnabled: true,
    showTutorial: false
  }
}

export function usePayrollState() {
  const [state, setState] = useState<PayrollState>(initialState)

  // UI Actions
  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, currentStep: step }
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, isLoading: loading }
    }))
  }, [])

  const setSaveStatus = useCallback((status: PayrollState['ui']['saveStatus']) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, saveStatus: status }
    }))
  }, [])

  const setActiveDialog = useCallback((dialog: PayrollState['ui']['activeDialog']) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, activeDialog: dialog }
    }))
  }, [])

  // Data Actions
  const setPayrollRun = useCallback((payrollRun: PayrollRun | null) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, payrollRun }
    }))
  }, [])

  const setEmployees = useCallback((employees: Employee[]) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, employees }
    }))
  }, [])

  const setComponents = useCallback((components: PayComponent[]) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, components }
    }))
  }, [])

  const setSelectedEmployees = useCallback((selectedEmployees: string[]) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, selectedEmployees },
      form: { ...prev.form, hasChanges: true }
    }))
  }, [])

  const toggleEmployeeSelection = useCallback((employeeId: string) => {
    setState(prev => {
      const isSelected = prev.data.selectedEmployees.includes(employeeId)
      const newSelected = isSelected
        ? prev.data.selectedEmployees.filter(id => id !== employeeId)
        : [...prev.data.selectedEmployees, employeeId]
      
      return {
        ...prev,
        data: { ...prev.data, selectedEmployees: newSelected },
        form: { ...prev.form, hasChanges: true }
      }
    })
  }, [])

  const selectAllEmployees = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        selectedEmployees: prev.data.employees.filter(emp => emp.aktif).map(emp => emp.id || '').filter(id => id !== '')
      },
      form: { ...prev.form, hasChanges: true }
    }))
  }, [])

  const deselectAllEmployees = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, selectedEmployees: [] },
      form: { ...prev.form, hasChanges: true }
    }))
  }, [])

  // Form Actions
  const setPeriode = useCallback((periode: { awal: string; akhir: string }) => {
    setState(prev => ({
      ...prev,
      form: { ...prev.form, periode, hasChanges: true }
    }))
  }, [])

  const setEmployeeOverride = useCallback((employeeId: string, override: any) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        overrides: { ...prev.form.overrides, [employeeId]: override },
        hasChanges: true
      }
    }))
  }, [])

  const setCustomFileName = useCallback((fileName: string) => {
    setState(prev => ({
      ...prev,
      form: { ...prev.form, customFileName: fileName, hasChanges: true }
    }))
  }, [])

  const setNotes = useCallback((notes: string) => {
    setState(prev => ({
      ...prev,
      form: { ...prev.form, notes, hasChanges: true }
    }))
  }, [])

  const markSaved = useCallback(() => {
    setState(prev => ({
      ...prev,
      form: { ...prev.form, hasChanges: false },
      ui: { ...prev.ui, saveStatus: 'saved' }
    }))
  }, [])

  // Config Actions
  const toggleOvertime = useCallback(() => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, overtimeEnabled: !prev.config.overtimeEnabled },
      form: { ...prev.form, hasChanges: true }
    }))
  }, [])

  const toggleAutoSave = useCallback(() => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, autoSaveEnabled: !prev.config.autoSaveEnabled }
    }))
  }, [])

  const toggleTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, showTutorial: !prev.config.showTutorial }
    }))
  }, [])

  // Reset Actions
  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      form: initialState.form,
      data: { ...prev.data, selectedEmployees: [] }
    }))
  }, [])

  const resetAll = useCallback(() => {
    setState(initialState)
  }, [])

  // Computed values
  const selectedEmployeeCount = state.data.selectedEmployees.length
  const totalEmployeeCount = state.data.employees.filter(emp => emp.aktif).length
  const isAllSelected = selectedEmployeeCount === totalEmployeeCount && totalEmployeeCount > 0
  const canProceedToNextStep = {
    1: state.form.periode.awal && state.form.periode.akhir,
    2: selectedEmployeeCount > 0,
    3: true, // Component selection is optional
    4: true  // Review step
  }

  return {
    // State
    state,
    
    // UI Actions
    setCurrentStep,
    setLoading,
    setSaveStatus,
    setActiveDialog,
    
    // Data Actions
    setPayrollRun,
    setEmployees,
    setComponents,
    setSelectedEmployees,
    toggleEmployeeSelection,
    selectAllEmployees,
    deselectAllEmployees,
    
    // Form Actions
    setPeriode,
    setEmployeeOverride,
    setCustomFileName,
    setNotes,
    markSaved,
    
    // Config Actions
    toggleOvertime,
    toggleAutoSave,
    toggleTutorial,
    
    // Reset Actions
    resetForm,
    resetAll,
    
    // Computed values
    selectedEmployeeCount,
    totalEmployeeCount,
    isAllSelected,
    canProceedToNextStep
  }
}

// Hook for auto-save functionality
export function useAutoSave(
  payrollState: ReturnType<typeof usePayrollState>,
  saveFunction: () => Promise<void>,
  delay: number = 2000
) {
  useEffect(() => {
    if (!payrollState.state.config.autoSaveEnabled || !payrollState.state.form.hasChanges) {
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        payrollState.setSaveStatus('saving')
        await saveFunction()
        payrollState.markSaved()
      } catch (error) {
        payrollState.setSaveStatus('error')
        console.error('Auto-save failed:', error)
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [payrollState.state.form.hasChanges, payrollState.state.config.autoSaveEnabled, saveFunction, delay])
}