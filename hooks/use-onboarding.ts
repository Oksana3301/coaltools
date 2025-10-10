import { useState, useEffect } from 'react'

interface OnboardingStatus {
  hasCompletedOnboarding: boolean
  isLoading: boolean
  error: string | null
}

export function useOnboarding(userId: string | null) {
  const [status, setStatus] = useState<OnboardingStatus>({
    hasCompletedOnboarding: false,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    if (!userId) {
      setStatus({
        hasCompletedOnboarding: false,
        isLoading: false,
        error: null
      })
      return
    }

    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch(`/api/onboarding?userId=${userId}`)
        const result = await response.json()

        if (result.success) {
          setStatus({
            hasCompletedOnboarding: result.data.hasCompletedOnboarding,
            isLoading: false,
            error: null
          })
        } else {
          setStatus({
            hasCompletedOnboarding: false,
            isLoading: false,
            error: result.error
          })
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setStatus({
          hasCompletedOnboarding: false,
          isLoading: false,
          error: 'Failed to check onboarding status'
        })
      }
    }

    checkOnboardingStatus()
  }, [userId])

  const markCompleted = () => {
    setStatus(prev => ({
      ...prev,
      hasCompletedOnboarding: true
    }))
  }

  return {
    ...status,
    markCompleted
  }
}
