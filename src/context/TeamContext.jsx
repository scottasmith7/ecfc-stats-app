import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getAllTeams, getTeam, addTeam, updateTeam, deleteTeam, getTeamCount } from '../db/database'

const TeamContext = createContext(null)

const ACTIVE_TEAM_KEY = 'ecfc-active-team-id'

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([])
  const [activeTeam, setActiveTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  // Load teams and determine initial state
  const loadTeams = useCallback(async () => {
    try {
      const allTeams = await getAllTeams()
      setTeams(allTeams)

      if (allTeams.length === 0) {
        // No teams exist, need first-time setup
        setNeedsSetup(true)
        setActiveTeam(null)
      } else {
        // Check for stored active team ID
        const storedTeamId = localStorage.getItem(ACTIVE_TEAM_KEY)
        let team = null

        if (storedTeamId) {
          team = allTeams.find(t => t.id === parseInt(storedTeamId))
        }

        // Fall back to first team if stored one not found
        if (!team) {
          team = allTeams[0]
        }

        setActiveTeam(team)
        localStorage.setItem(ACTIVE_TEAM_KEY, team.id.toString())
        setNeedsSetup(false)
      }
    } catch (err) {
      console.error('Failed to load teams:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  // Switch active team
  const switchTeam = useCallback((teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (team) {
      setActiveTeam(team)
      localStorage.setItem(ACTIVE_TEAM_KEY, teamId.toString())
    }
  }, [teams])

  // Create a new team
  const createTeam = useCallback(async (teamData) => {
    try {
      const id = await addTeam(teamData)
      const newTeam = { ...teamData, id, createdAt: new Date().toISOString() }
      setTeams(prev => [...prev, newTeam])
      setActiveTeam(newTeam)
      localStorage.setItem(ACTIVE_TEAM_KEY, id.toString())
      setNeedsSetup(false)
      return newTeam
    } catch (err) {
      console.error('Failed to create team:', err)
      return null
    }
  }, [])

  // Update a team
  const editTeam = useCallback(async (id, updates) => {
    try {
      await updateTeam(id, updates)
      setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
      if (activeTeam?.id === id) {
        setActiveTeam(prev => ({ ...prev, ...updates }))
      }
      return true
    } catch (err) {
      console.error('Failed to update team:', err)
      return false
    }
  }, [activeTeam])

  // Remove a team
  const removeTeam = useCallback(async (id) => {
    try {
      // Check if this is the only team
      const count = await getTeamCount()
      if (count <= 1) {
        throw new Error('Cannot delete the only team')
      }

      await deleteTeam(id)
      const remainingTeams = teams.filter(t => t.id !== id)
      setTeams(remainingTeams)

      // If we deleted the active team, switch to another one
      if (activeTeam?.id === id && remainingTeams.length > 0) {
        setActiveTeam(remainingTeams[0])
        localStorage.setItem(ACTIVE_TEAM_KEY, remainingTeams[0].id.toString())
      }

      return true
    } catch (err) {
      console.error('Failed to delete team:', err)
      return false
    }
  }, [activeTeam, teams])

  const value = {
    teams,
    activeTeam,
    loading,
    needsSetup,
    switchTeam,
    createTeam,
    editTeam,
    removeTeam,
    refreshTeams: loadTeams
  }

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => {
  const context = useContext(TeamContext)
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}

export default TeamContext
