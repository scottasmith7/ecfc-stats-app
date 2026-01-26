import { useState, useCallback, useEffect } from 'react'
import { addGameEvent, deleteGameEvent, getGameEvents, updateGame, getGame } from '../db/database'

export const useGameEvents = (gameId) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Load events from database
  const loadEvents = useCallback(async () => {
    if (!gameId) return
    try {
      const gameEvents = await getGameEvents(gameId)
      setEvents(gameEvents)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }, [gameId])

  // Initial load
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Add a new event
  const addEvent = useCallback(async (playerId, eventType, gameTime, linkedEventId = null) => {
    if (!gameId) return null

    const event = {
      gameId,
      playerId,
      eventType,
      gameTime,
      linkedEventId
    }

    try {
      const id = await addGameEvent(event)
      const newEvent = { ...event, id }
      setEvents(prev => [...prev, newEvent])

      // Update score if it's a goal
      if (eventType === 'goal') {
        const game = await getGame(gameId)
        await updateGame(gameId, { homeScore: (game.homeScore || 0) + 1 })
      }

      // Update opponent score if it's a goal against
      if (eventType === 'goal_against') {
        const game = await getGame(gameId)
        await updateGame(gameId, { awayScore: (game.awayScore || 0) + 1 })
      }

      return newEvent
    } catch (err) {
      console.error('Failed to add event:', err)
      return null
    }
  }, [gameId])

  // Add goal with assist
  const addGoalWithAssist = useCallback(async (scorerId, assisterId, gameTime) => {
    if (!gameId) return null

    try {
      // Add the goal event first
      const goalEvent = await addEvent(scorerId, 'goal', gameTime)

      // If there's an assister, add the assist event linked to the goal
      if (assisterId && goalEvent) {
        await addEvent(assisterId, 'assist', gameTime, goalEvent.id)
      }

      return goalEvent
    } catch (err) {
      console.error('Failed to add goal with assist:', err)
      return null
    }
  }, [gameId, addEvent])

  // Remove an event (and linked events)
  const removeEvent = useCallback(async (eventId) => {
    try {
      const eventToRemove = events.find(e => e.id === eventId)
      if (!eventToRemove) return false

      // Find any linked events (assist linked to goal)
      const linkedEvents = events.filter(e => e.linkedEventId === eventId)

      // Delete linked events first
      for (const linked of linkedEvents) {
        await deleteGameEvent(linked.id)
      }

      // Delete the main event
      await deleteGameEvent(eventId)

      // Update score if it was a goal
      if (eventToRemove.eventType === 'goal') {
        const game = await getGame(gameId)
        await updateGame(gameId, { homeScore: Math.max(0, (game.homeScore || 0) - 1) })
      }

      if (eventToRemove.eventType === 'goal_against') {
        const game = await getGame(gameId)
        await updateGame(gameId, { awayScore: Math.max(0, (game.awayScore || 0) - 1) })
      }

      // Update state
      const removedIds = [eventId, ...linkedEvents.map(e => e.id)]
      setEvents(prev => prev.filter(e => !removedIds.includes(e.id)))

      return true
    } catch (err) {
      console.error('Failed to remove event:', err)
      return false
    }
  }, [gameId, events])

  // Get events for a specific player
  const getPlayerEvents = useCallback((playerId) => {
    return events.filter(e => e.playerId === playerId)
  }, [events])

  // Get last N events
  const getLastEvents = useCallback((count = 3) => {
    return [...events].sort((a, b) => b.gameTime - a.gameTime).slice(0, count)
  }, [events])

  return {
    events,
    loading,
    addEvent,
    addGoalWithAssist,
    removeEvent,
    getPlayerEvents,
    getLastEvents,
    refreshEvents: loadEvents
  }
}

export default useGameEvents
