import { createContext, useContext, ReactNode, useEffect, useRef, useCallback } from 'react'
import { useLocalStorage } from '@/hooks/utils/use-local-storage'
import { useTriggerSpeak } from '@/hooks/utils/use-trigger-speak'
import { useAiState, AiStateEnum } from '@/context/ai-state-context'

interface ProactiveSpeakSettings {
  allowProactiveSpeak: boolean
  idleSecondsToSpeak: number
}

interface ProactiveSpeakContextType {
  settings: ProactiveSpeakSettings
  updateSettings: (newSettings: ProactiveSpeakSettings) => void
}

const defaultSettings: ProactiveSpeakSettings = {
  allowProactiveSpeak: false,
  idleSecondsToSpeak: 5,
}

export const ProactiveSpeakContext = createContext<ProactiveSpeakContextType | null>(null)

export function ProactiveSpeakProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<ProactiveSpeakSettings>(
    'proactiveSpeakSettings',
    defaultSettings
  )

  const { aiState } = useAiState()
  const { sendTriggerSignal } = useTriggerSpeak()

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const idleStartTimeRef = useRef<number | null>(null)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    idleStartTimeRef.current = null
  }, [])

  const startIdleTimer = useCallback(() => {
    clearIdleTimer()
    
    if (!settings.allowProactiveSpeak) return
    
    idleStartTimeRef.current = Date.now()
    idleTimerRef.current = setTimeout(() => {
      const actualIdleTime = (Date.now() - idleStartTimeRef.current!) / 1000
      sendTriggerSignal(actualIdleTime)
    }, settings.idleSecondsToSpeak * 1000)
  }, [settings.allowProactiveSpeak, settings.idleSecondsToSpeak, sendTriggerSignal, clearIdleTimer])

  useEffect(() => {
    if (aiState === AiStateEnum.IDLE) {
      startIdleTimer()
    } else {
      clearIdleTimer()
    }
  }, [aiState, startIdleTimer, clearIdleTimer])

  useEffect(() => {
    return () => {
      clearIdleTimer()
    }
  }, [clearIdleTimer])

  const updateSettings = (newSettings: ProactiveSpeakSettings) => {
    setSettings(newSettings)
  }

  return (
    <ProactiveSpeakContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ProactiveSpeakContext.Provider>
  )
}

export function useProactiveSpeak() {
  const context = useContext(ProactiveSpeakContext)
  if (!context) {
    throw new Error('useProactiveSpeak must be used within a ProactiveSpeakProvider')
  }
  return context
}