import Dexie from 'dexie'

export const db = new Dexie('ecfc-stats')

db.version(1).stores({
  players: '++id, name, jerseyNumber, position',
  games: '++id, date, opponent, status',
  gameLineups: '++id, gameId, playerId, isStarter',
  gameEvents: '++id, gameId, playerId, eventType, gameTime, linkedEventId'
})

// Version 2: Multi-position support - position (string) -> positions (array)
db.version(2).stores({
  players: '++id, name, jerseyNumber, *positions',
  games: '++id, date, opponent, status',
  gameLineups: '++id, gameId, playerId, isStarter',
  gameEvents: '++id, gameId, playerId, eventType, gameTime, linkedEventId'
}).upgrade(tx => {
  return tx.table('players').toCollection().modify(player => {
    player.positions = player.position ? [player.position] : ['MID']
    delete player.position
  })
})

// Version 3: Multi-team support - adds teams table and teamId to players/games
db.version(3).stores({
  teams: '++id, teamName, createdAt',
  players: '++id, teamId, name, jerseyNumber, *positions',
  games: '++id, teamId, date, opponent, status',
  gameLineups: '++id, gameId, playerId, isStarter',
  gameEvents: '++id, gameId, playerId, eventType, gameTime, linkedEventId'
}).upgrade(async tx => {
  // Check if there are any existing players or games to migrate
  const existingPlayers = await tx.table('players').count()
  const existingGames = await tx.table('games').count()

  if (existingPlayers > 0 || existingGames > 0) {
    // Create a default team for existing data
    const teamId = await tx.table('teams').add({
      teamName: 'My Team',
      ageGroup: '',
      coachName: '',
      createdAt: new Date().toISOString()
    })

    // Assign existing players to the default team
    await tx.table('players').toCollection().modify(player => {
      player.teamId = teamId
    })

    // Assign existing games to the default team
    await tx.table('games').toCollection().modify(game => {
      game.teamId = teamId
    })
  }
})

// Team operations
export const addTeam = async (team) => {
  return await db.teams.add({
    ...team,
    createdAt: new Date().toISOString()
  })
}

export const updateTeam = async (id, updates) => {
  return await db.teams.update(id, updates)
}

export const deleteTeam = async (id) => {
  // Delete all associated data
  const players = await db.players.where('teamId').equals(id).toArray()
  const games = await db.games.where('teamId').equals(id).toArray()

  // Delete game events and lineups for each game
  for (const game of games) {
    await db.gameLineups.where('gameId').equals(game.id).delete()
    await db.gameEvents.where('gameId').equals(game.id).delete()
  }

  // Delete players and games
  await db.players.where('teamId').equals(id).delete()
  await db.games.where('teamId').equals(id).delete()

  // Delete the team
  return await db.teams.delete(id)
}

export const getAllTeams = async () => {
  return await db.teams.orderBy('createdAt').toArray()
}

export const getTeam = async (id) => {
  return await db.teams.get(id)
}

export const getTeamCount = async () => {
  return await db.teams.count()
}

// Player operations
export const addPlayer = async (player) => {
  return await db.players.add(player)
}

export const updatePlayer = async (id, updates) => {
  return await db.players.update(id, updates)
}

export const deletePlayer = async (id) => {
  return await db.players.delete(id)
}

export const getAllPlayers = async (teamId = null) => {
  if (teamId) {
    return await db.players.where('teamId').equals(teamId).sortBy('jerseyNumber')
  }
  return await db.players.orderBy('jerseyNumber').toArray()
}

export const getPlayer = async (id) => {
  return await db.players.get(id)
}

// Game operations
export const addGame = async (game) => {
  return await db.games.add({
    ...game,
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    halfLength: game.halfLength || 35,
    clockTime: 0,
    currentHalf: 1
  })
}

export const updateGame = async (id, updates) => {
  return await db.games.update(id, updates)
}

export const deleteGame = async (id) => {
  await db.gameLineups.where('gameId').equals(id).delete()
  await db.gameEvents.where('gameId').equals(id).delete()
  return await db.games.delete(id)
}

export const getAllGames = async (teamId = null) => {
  if (teamId) {
    const games = await db.games.where('teamId').equals(teamId).toArray()
    return games.sort((a, b) => b.date.localeCompare(a.date))
  }
  return await db.games.orderBy('date').reverse().toArray()
}

export const getGame = async (id) => {
  return await db.games.get(id)
}

// Lineup operations
export const setGameLineup = async (gameId, playerIds, starterIds) => {
  // Clear existing lineup
  await db.gameLineups.where('gameId').equals(gameId).delete()

  // Add all players to lineup
  const lineups = playerIds.map(playerId => ({
    gameId,
    playerId,
    isStarter: starterIds.includes(playerId),
    inTime: starterIds.includes(playerId) ? 0 : null,
    outTime: null
  }))

  return await db.gameLineups.bulkAdd(lineups)
}

export const getGameLineup = async (gameId) => {
  return await db.gameLineups.where('gameId').equals(gameId).toArray()
}

export const updateLineupEntry = async (id, updates) => {
  return await db.gameLineups.update(id, updates)
}

export const getLineupEntryByPlayer = async (gameId, playerId) => {
  return await db.gameLineups
    .where(['gameId', 'playerId'])
    .equals([gameId, playerId])
    .first()
}

// Event operations
export const addGameEvent = async (event) => {
  const id = await db.gameEvents.add(event)
  return id
}

export const deleteGameEvent = async (id) => {
  return await db.gameEvents.delete(id)
}

export const getGameEvents = async (gameId) => {
  return await db.gameEvents.where('gameId').equals(gameId).toArray()
}

export const getPlayerGameEvents = async (gameId, playerId) => {
  return await db.gameEvents
    .where('gameId').equals(gameId)
    .filter(e => e.playerId === playerId)
    .toArray()
}

export const getPlayerAllEvents = async (playerId) => {
  return await db.gameEvents.where('playerId').equals(playerId).toArray()
}

export const getLastEvents = async (gameId, count = 3) => {
  return await db.gameEvents
    .where('gameId').equals(gameId)
    .reverse()
    .limit(count)
    .toArray()
}

// Backup and restore
export const exportAllData = async (teamId = null) => {
  const teams = await db.teams.toArray()
  let players, games

  if (teamId) {
    players = await db.players.where('teamId').equals(teamId).toArray()
    games = await db.games.where('teamId').equals(teamId).toArray()
  } else {
    players = await db.players.toArray()
    games = await db.games.toArray()
  }

  const gameIds = games.map(g => g.id)
  const gameLineups = await db.gameLineups.where('gameId').anyOf(gameIds).toArray()
  const gameEvents = await db.gameEvents.where('gameId').anyOf(gameIds).toArray()

  return {
    version: 2,
    exportDate: new Date().toISOString(),
    teamId: teamId || null,
    data: { teams: teamId ? teams.filter(t => t.id === teamId) : teams, players, games, gameLineups, gameEvents }
  }
}

export const importAllData = async (backup) => {
  // Support both version 1 and 2 backups
  if (backup.version !== 1 && backup.version !== 2) {
    throw new Error('Unsupported backup version')
  }

  await db.transaction('rw', db.teams, db.players, db.games, db.gameLineups, db.gameEvents, async () => {
    // For v1 backups or full restore, clear everything
    if (backup.version === 1 || !backup.teamId) {
      await db.teams.clear()
      await db.players.clear()
      await db.games.clear()
      await db.gameLineups.clear()
      await db.gameEvents.clear()

      // For v1 backups, create a default team and assign data to it
      if (backup.version === 1) {
        const teamId = await db.teams.add({
          teamName: 'Imported Team',
          ageGroup: '',
          coachName: '',
          createdAt: new Date().toISOString()
        })

        const playersWithTeam = (backup.data.players || []).map(p => ({ ...p, teamId }))
        const gamesWithTeam = (backup.data.games || []).map(g => ({ ...g, teamId }))

        if (playersWithTeam.length) await db.players.bulkAdd(playersWithTeam)
        if (gamesWithTeam.length) await db.games.bulkAdd(gamesWithTeam)
      } else {
        if (backup.data.teams?.length) await db.teams.bulkAdd(backup.data.teams)
        if (backup.data.players?.length) await db.players.bulkAdd(backup.data.players)
        if (backup.data.games?.length) await db.games.bulkAdd(backup.data.games)
      }

      if (backup.data.gameLineups?.length) await db.gameLineups.bulkAdd(backup.data.gameLineups)
      if (backup.data.gameEvents?.length) await db.gameEvents.bulkAdd(backup.data.gameEvents)
    }
  })
}

export default db
