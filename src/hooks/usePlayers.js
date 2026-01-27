import { useState, useCallback, useEffect } from 'react'
import { getAllPlayers, addPlayer, updatePlayer, deletePlayer } from '../db/database'

export const usePlayers = (teamId = null) => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  // Load all players for the team
  const loadPlayers = useCallback(async () => {
    try {
      const allPlayers = await getAllPlayers(teamId)
      setPlayers(allPlayers)
    } catch (err) {
      console.error('Failed to load players:', err)
    } finally {
      setLoading(false)
    }
  }, [teamId])

  // Load when teamId changes
  useEffect(() => {
    if (teamId) {
      setLoading(true)
      loadPlayers()
    }
  }, [teamId, loadPlayers])

  // Add a new player (automatically assigned to current team)
  const createPlayer = useCallback(async (playerData) => {
    try {
      const dataWithTeam = { ...playerData, teamId }
      const id = await addPlayer(dataWithTeam)
      const newPlayer = { ...dataWithTeam, id }
      setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber))
      return newPlayer
    } catch (err) {
      console.error('Failed to add player:', err)
      return null
    }
  }, [teamId])

  // Update a player
  const editPlayer = useCallback(async (id, updates) => {
    try {
      await updatePlayer(id, updates)
      setPlayers(prev =>
        prev.map(p => p.id === id ? { ...p, ...updates } : p)
          .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
      )
      return true
    } catch (err) {
      console.error('Failed to update player:', err)
      return false
    }
  }, [])

  // Remove a player
  const removePlayer = useCallback(async (id) => {
    try {
      await deletePlayer(id)
      setPlayers(prev => prev.filter(p => p.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete player:', err)
      return false
    }
  }, [])

  // Get player by ID
  const getPlayerById = useCallback((id) => {
    return players.find(p => p.id === id)
  }, [players])

  return {
    players,
    loading,
    createPlayer,
    editPlayer,
    removePlayer,
    getPlayerById,
    refreshPlayers: loadPlayers
  }
}

export default usePlayers
