import { calculatePlayerStats, calculateDerivedStats, calculateSecondsPlayed, formatPlayingTime } from './stats'
import { STAT_TYPES, formatDate } from './constants'

// Download helper
const downloadFile = (content, filename, type = 'text/csv') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export single game to CSV
export const exportGameCSV = (game, players, lineups, events) => {
  const headers = [
    'Player', 'Number', 'Position', 'Time (MM:SS)', 'Seconds',
    'Passes', 'Pass%', 'Crosses', 'Cross%',
    'Key Passes', 'Assists', 'Chances',
    'Shots', 'Shot%', 'Scoring%', 'Goals',
    'Take-ons', 'Dribble%',
    'Tackles', 'Interceptions', 'Clearances', 'Headers',
    'Saves', 'Goals Against',
    'Poss Lost', 'Fouls', 'Opp Fouls'
  ]

  const rows = []

  players.forEach(player => {
    const playerLineups = lineups.filter(l => l.playerId === player.id)
    const playerEvents = events.filter(e => e.playerId === player.id)

    if (playerLineups.length === 0) return // Player not in this game

    const stats = calculatePlayerStats(playerEvents)
    const derived = calculateDerivedStats(stats)
    const seconds = calculateSecondsPlayed(playerLineups, game.clockTime, game.status)
    const positions = player.positions || [player.position] || ['MID']

    rows.push([
      player.name,
      player.jerseyNumber,
      positions.join('/'),
      formatPlayingTime(seconds),
      seconds,
      stats.pass_complete,
      derived.passCompletion !== null ? `${derived.passCompletion}%` : '-',
      stats.cross_complete,
      derived.crossSuccess !== null ? `${derived.crossSuccess}%` : '-',
      stats.key_pass,
      stats.assist,
      stats.chance_created,
      derived.totalShots,
      derived.shotAccuracy !== null ? `${derived.shotAccuracy}%` : '-',
      derived.scoringRate !== null ? `${derived.scoringRate}%` : '-',
      stats.goal,
      derived.totalTakeOns || 0,
      derived.dribbleSuccess !== null ? `${derived.dribbleSuccess}%` : '-',
      stats.tackle,
      stats.interception,
      stats.clearance,
      stats.header,
      stats.save,
      stats.goal_against,
      stats.possession_lost,
      stats.foul,
      stats.opponent_foul
    ])
  })

  // Calculate team possession
  const allPlayerEvents = events.filter(e => e.playerId)
  const teamStats = calculatePlayerStats(allPlayerEvents)
  const opponentPasses = events.filter(e => e.eventType === 'opponent_pass').length
  const possession = teamStats.pass_complete + opponentPasses > 0
    ? Math.round((teamStats.pass_complete / (teamStats.pass_complete + opponentPasses)) * 100)
    : null

  const csv = [
    `ECFC vs ${game.opponent} - ${formatDate(game.date)}`,
    `Final Score: ${game.homeScore} - ${game.awayScore}`,
    possession !== null ? `Team Possession: ${possession}%` : '',
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const filename = `ECFC_vs_${game.opponent.replace(/\s+/g, '_')}_${game.date}.csv`
  downloadFile(csv, filename)
}

// Export player stats across all games
export const exportPlayerCSV = (player, games, allLineups, allEvents) => {
  const headers = [
    'Date', 'Opponent', 'Result', 'Time (MM:SS)', 'Seconds',
    'Passes', 'Pass%', 'Shots', 'Shot%', 'Scoring%', 'Goals', 'Assists',
    'Take-ons', 'Dribble%',
    'Tackles', 'Interceptions', 'Saves'
  ]

  const rows = []

  games.forEach(game => {
    const playerLineups = allLineups.filter(l => l.gameId === game.id && l.playerId === player.id)
    const playerEvents = allEvents.filter(e => e.gameId === game.id && e.playerId === player.id)

    if (playerLineups.length === 0) return // Player not in this game

    const stats = calculatePlayerStats(playerEvents)
    const derived = calculateDerivedStats(stats)
    const seconds = calculateSecondsPlayed(playerLineups, game.clockTime, game.status)

    rows.push([
      game.date,
      game.opponent,
      `${game.homeScore}-${game.awayScore}`,
      formatPlayingTime(seconds),
      seconds,
      stats.pass_complete,
      derived.passCompletion !== null ? `${derived.passCompletion}%` : '-',
      derived.totalShots,
      derived.shotAccuracy !== null ? `${derived.shotAccuracy}%` : '-',
      derived.scoringRate !== null ? `${derived.scoringRate}%` : '-',
      stats.goal,
      stats.assist,
      derived.totalTakeOns || 0,
      derived.dribbleSuccess !== null ? `${derived.dribbleSuccess}%` : '-',
      stats.tackle,
      stats.interception,
      stats.save
    ])
  })

  const positions = player.positions || [player.position] || ['MID']
  const csv = [
    `${player.name} (#${player.jerseyNumber}) - ${positions.join('/')} - Season Stats`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const filename = `${player.name.replace(/\s+/g, '_')}_season_stats.csv`
  downloadFile(csv, filename)
}

// Export season summary for all players
export const exportSeasonSummaryCSV = (players, games, allLineups, allEvents) => {
  const headers = [
    'Player', 'Number', 'Position', 'Games', 'Time (MM:SS)', 'Seconds',
    'Passes', 'Pass%', 'Shots', 'Shot%', 'Scoring%', 'Goals', 'Assists',
    'Take-ons', 'Dribble%',
    'Tackles', 'Interceptions', 'Clearances',
    'Saves', 'Fouls'
  ]

  const rows = []

  players.forEach(player => {
    const playerLineups = allLineups.filter(l => l.playerId === player.id)
    const playerEvents = allEvents.filter(e => e.playerId === player.id)

    const gamesPlayed = new Set(playerLineups.map(l => l.gameId)).size
    if (gamesPlayed === 0) return

    const stats = calculatePlayerStats(playerEvents)
    const derived = calculateDerivedStats(stats)

    // Calculate total seconds across all games
    let totalSeconds = 0
    const gameIds = [...new Set(playerLineups.map(l => l.gameId))]
    gameIds.forEach(gameId => {
      const game = games.find(g => g.id === gameId)
      const gameLineups = playerLineups.filter(l => l.gameId === gameId)
      totalSeconds += calculateSecondsPlayed(gameLineups, game?.clockTime || 0, game?.status || 'completed')
    })

    const positions = player.positions || [player.position] || ['MID']

    rows.push([
      player.name,
      player.jerseyNumber,
      positions.join('/'),
      gamesPlayed,
      formatPlayingTime(totalSeconds),
      totalSeconds,
      stats.pass_complete,
      derived.passCompletion !== null ? `${derived.passCompletion}%` : '-',
      derived.totalShots,
      derived.shotAccuracy !== null ? `${derived.shotAccuracy}%` : '-',
      derived.scoringRate !== null ? `${derived.scoringRate}%` : '-',
      stats.goal,
      stats.assist,
      derived.totalTakeOns || 0,
      derived.dribbleSuccess !== null ? `${derived.dribbleSuccess}%` : '-',
      stats.tackle,
      stats.interception,
      stats.clearance,
      stats.save,
      stats.foul
    ])
  })

  const csv = [
    'ECFC Season Summary',
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  downloadFile(csv, 'ECFC_season_summary.csv')
}

// Export full backup as JSON
export const exportBackupJSON = (data) => {
  const json = JSON.stringify(data, null, 2)
  const filename = `ECFC_backup_${new Date().toISOString().split('T')[0]}.json`
  downloadFile(json, filename, 'application/json')
}

// Read file for restore
export const readRestoreFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (err) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
