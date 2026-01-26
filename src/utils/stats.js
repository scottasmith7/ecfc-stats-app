import { STAT_TYPES } from './constants'

// Calculate stat counts for a player from events
export const calculatePlayerStats = (events) => {
  const stats = {}

  // Initialize all stat types to 0
  Object.keys(STAT_TYPES).forEach(type => {
    stats[type] = 0
  })

  // Count each event type
  events.forEach(event => {
    if (stats[event.eventType] !== undefined) {
      stats[event.eventType]++
    }
  })

  return stats
}

// Calculate derived percentages
export const calculateDerivedStats = (stats, teamStats = null) => {
  const derived = {}

  // Pass completion %
  const totalPasses = stats.pass_complete + stats.pass_incomplete
  derived.passCompletion = totalPasses > 0
    ? Math.round((stats.pass_complete / totalPasses) * 100)
    : null

  // Shot accuracy % (shots on target / total shots)
  const totalShots = stats.shot_on_target + stats.shot_off_target
  derived.shotAccuracy = totalShots > 0
    ? Math.round((stats.shot_on_target / totalShots) * 100)
    : null

  // Scoring % (goals / shots on target)
  derived.scoringRate = stats.shot_on_target > 0
    ? Math.round((stats.goal / stats.shot_on_target) * 100)
    : null

  // Cross success %
  const totalCrosses = stats.cross_complete + stats.cross_incomplete
  derived.crossSuccess = totalCrosses > 0
    ? Math.round((stats.cross_complete / totalCrosses) * 100)
    : null

  // Dribbling success % (take-ons)
  const totalTakeOns = (stats.takeon_success || 0) + (stats.takeon_fail || 0)
  derived.totalTakeOns = totalTakeOns
  derived.dribbleSuccess = totalTakeOns > 0
    ? Math.round((stats.takeon_success / totalTakeOns) * 100)
    : null

  // Total passes (completed only for display)
  derived.totalPassesCompleted = stats.pass_complete

  // Total shots
  derived.totalShots = totalShots

  // Goals and assists
  derived.goals = stats.goal
  derived.assists = stats.assist

  return derived
}

// Calculate team-wide possession percentage
export const calculatePossession = (ourCompletedPasses, opponentPasses) => {
  const totalPasses = ourCompletedPasses + opponentPasses
  return totalPasses > 0
    ? Math.round((ourCompletedPasses / totalPasses) * 100)
    : null
}

// Calculate seconds played from lineup entries (precise tracking)
export const calculateSecondsPlayed = (lineupEntries, currentClockTime = 0, gameStatus = 'completed') => {
  let totalSeconds = 0

  lineupEntries.forEach(entry => {
    if (entry.inTime !== null) {
      const outTime = entry.outTime !== null
        ? entry.outTime
        : (gameStatus === 'live' ? currentClockTime : entry.inTime)
      totalSeconds += Math.max(0, outTime - entry.inTime)
    }
  })

  return totalSeconds
}

// Legacy function for backward compatibility - returns minutes
export const calculateMinutesPlayed = (lineupEntries, currentClockTime = 0, gameStatus = 'completed') => {
  return Math.round(calculateSecondsPlayed(lineupEntries, currentClockTime, gameStatus) / 60)
}

// Format playing time as MM:SS
export const formatPlayingTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format playing time as HH:MM:SS for long durations, MM:SS for shorter
export const formatPlayingTimeLong = (seconds) => {
  if (seconds === null || seconds === undefined) return '-'

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Generate mini stat summary for player tile (e.g., "3P 1S 1G")
export const generateMiniStatLine = (events) => {
  const stats = calculatePlayerStats(events)
  const parts = []

  // Passes (completed)
  if (stats.pass_complete > 0) {
    parts.push(`${stats.pass_complete}P`)
  }

  // Shots
  const shots = stats.shot_on_target + stats.shot_off_target
  if (shots > 0) {
    parts.push(`${shots}S`)
  }

  // Goals
  if (stats.goal > 0) {
    parts.push(`${stats.goal}G`)
  }

  // Assists
  if (stats.assist > 0) {
    parts.push(`${stats.assist}A`)
  }

  // Tackles
  if (stats.tackle > 0) {
    parts.push(`${stats.tackle}T`)
  }

  // Saves (for GK)
  if (stats.save > 0) {
    parts.push(`${stats.save}SV`)
  }

  return parts.slice(0, 4).join(' ') || '-'
}

// Aggregate stats across multiple games
export const aggregateStats = (allEvents) => {
  const totals = {}

  Object.keys(STAT_TYPES).forEach(type => {
    totals[type] = 0
  })

  allEvents.forEach(event => {
    if (totals[event.eventType] !== undefined) {
      totals[event.eventType]++
    }
  })

  return totals
}

// Get leaderboard for a specific stat
export const getLeaderboard = (playerStats, statKey, limit = 5) => {
  return Object.entries(playerStats)
    .map(([playerId, stats]) => ({
      playerId: parseInt(playerId),
      value: stats[statKey] || 0
    }))
    .filter(entry => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

// Format stat value for display (with percentage if applicable)
export const formatStatValue = (value, isPercentage = false) => {
  if (value === null || value === undefined) return '-'
  if (isPercentage) return `${value}%`
  return value.toString()
}
