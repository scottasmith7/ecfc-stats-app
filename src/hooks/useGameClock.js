import { useState, useEffect, useRef, useCallback } from 'react'
import { updateGame } from '../db/database'

export const useGameClock = (gameId, initialTime = 0, halfLength = 35) => {
  const [clockTime, setClockTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const lastSaveRef = useRef(initialTime)

  // Persist clock time to database every 5 seconds
  const persistTime = useCallback(async (time) => {
    if (gameId && Math.abs(time - lastSaveRef.current) >= 5) {
      await updateGame(gameId, { clockTime: time })
      lastSaveRef.current = time
    }
  }, [gameId])

  // Start the clock
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true)
    }
  }, [isRunning])

  // Pause the clock
  const pause = useCallback(async () => {
    if (isRunning) {
      setIsRunning(false)
      // Save immediately when pausing
      if (gameId) {
        await updateGame(gameId, { clockTime })
        lastSaveRef.current = clockTime
      }
    }
  }, [isRunning, gameId, clockTime])

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (isRunning) {
      pause()
    } else {
      start()
    }
  }, [isRunning, pause, start])

  // Reset clock (for new half)
  const reset = useCallback(async () => {
    setClockTime(0)
    setIsRunning(false)
    if (gameId) {
      await updateGame(gameId, { clockTime: 0 })
      lastSaveRef.current = 0
    }
  }, [gameId])

  // Set clock to specific time
  const setTime = useCallback(async (time) => {
    setClockTime(time)
    if (gameId) {
      await updateGame(gameId, { clockTime: time })
      lastSaveRef.current = time
    }
  }, [gameId])

  // Clock tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setClockTime(prev => {
          const newTime = prev + 1
          persistTime(newTime)
          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, persistTime])

  // Calculate if we're past half length (for stoppage time indicator)
  const isPastHalfLength = clockTime > halfLength * 60

  return {
    clockTime,
    isRunning,
    start,
    pause,
    toggle,
    reset,
    setTime,
    isPastHalfLength
  }
}

export default useGameClock
