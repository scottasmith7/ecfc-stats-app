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

export const getAllPlayers = async () => {
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

export const getAllGames = async () => {
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
export const exportAllData = async () => {
  const players = await db.players.toArray()
  const games = await db.games.toArray()
  const gameLineups = await db.gameLineups.toArray()
  const gameEvents = await db.gameEvents.toArray()

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    data: { players, games, gameLineups, gameEvents }
  }
}

export const importAllData = async (backup) => {
  if (backup.version !== 1) {
    throw new Error('Unsupported backup version')
  }

  await db.transaction('rw', db.players, db.games, db.gameLineups, db.gameEvents, async () => {
    await db.players.clear()
    await db.games.clear()
    await db.gameLineups.clear()
    await db.gameEvents.clear()

    if (backup.data.players?.length) await db.players.bulkAdd(backup.data.players)
    if (backup.data.games?.length) await db.games.bulkAdd(backup.data.games)
    if (backup.data.gameLineups?.length) await db.gameLineups.bulkAdd(backup.data.gameLineups)
    if (backup.data.gameEvents?.length) await db.gameEvents.bulkAdd(backup.data.gameEvents)
  })
}

export default db
