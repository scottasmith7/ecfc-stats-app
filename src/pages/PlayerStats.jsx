import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getPlayer, getAllGames, getGameLineup, getPlayerAllEvents } from '../db/database'
import { db } from '../db/database'
import { calculatePlayerStats, calculateDerivedStats, calculateSecondsPlayed, formatPlayingTime, formatPlayingTimeLong } from '../utils/stats'
import { exportPlayerCSV } from '../utils/export'
import { formatDate, POSITIONS, STAT_TYPES } from '../utils/constants'
import { useTeam } from '../context/TeamContext'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'
import Button from '../components/common/Button'

const PlayerStats = () => {
  const { id } = useParams()
  const { activeTeam } = useTeam()
  const playerId = parseInt(id)

  const [player, setPlayer] = useState(null)
  const [games, setGames] = useState([])
  const [allLineups, setAllLineups] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!activeTeam) return
      try {
        const [playerData, gamesData, lineupsData, eventsData] = await Promise.all([
          getPlayer(playerId),
          getAllGames(activeTeam.id),
          db.gameLineups.where('playerId').equals(playerId).toArray(),
          getPlayerAllEvents(playerId)
        ])
        setPlayer(playerData)
        setGames(gamesData.filter(g => g.status === 'completed'))
        setAllLineups(lineupsData)
        setAllEvents(eventsData)
      } catch (err) {
        console.error('Failed to load player stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [playerId, activeTeam])

  // Calculate season totals
  const seasonStats = useMemo(() => {
    const rawStats = calculatePlayerStats(allEvents)
    const derived = calculateDerivedStats(rawStats)

    // Calculate total seconds
    let totalSeconds = 0
    const gameIds = [...new Set(allLineups.map(l => l.gameId))]
    gameIds.forEach(gameId => {
      const game = games.find(g => g.id === gameId)
      const gameLineups = allLineups.filter(l => l.gameId === gameId)
      totalSeconds += calculateSecondsPlayed(gameLineups, game?.clockTime || 0, game?.status || 'completed')
    })

    return {
      ...rawStats,
      ...derived,
      totalSeconds,
      gamesPlayed: gameIds.length,
      avgSeconds: gameIds.length > 0 ? Math.round(totalSeconds / gameIds.length) : 0
    }
  }, [allEvents, allLineups, games])

  // Per-game breakdown
  const gameBreakdown = useMemo(() => {
    const breakdown = []

    games.forEach(game => {
      const gameLineups = allLineups.filter(l => l.gameId === game.id)
      if (gameLineups.length === 0) return

      const gameEvents = allEvents.filter(e => e.gameId === game.id)
      const rawStats = calculatePlayerStats(gameEvents)
      const derived = calculateDerivedStats(rawStats)
      const seconds = calculateSecondsPlayed(gameLineups, game.clockTime || 0, game.status)

      breakdown.push({
        game,
        seconds,
        ...rawStats,
        ...derived
      })
    })

    return breakdown.sort((a, b) => b.game.date.localeCompare(a.game.date))
  }, [games, allLineups, allEvents])

  const handleExport = async () => {
    if (player) {
      const allGamesData = await getAllGames()
      const allLineupsData = await db.gameLineups.toArray()
      const allEventsData = await db.gameEvents.toArray()
      exportPlayerCSV(player, allGamesData, allLineupsData, allEventsData)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Player not found</div>
      </div>
    )
  }

  const positions = player.positions || [player.position] || ['MID']
  const primaryPos = POSITIONS[positions[0]] || POSITIONS.MID
  const positionDisplay = positions.map(p => POSITIONS[p]?.name || p).join(' / ')

  return (
    <div className="min-h-screen pb-20">
      <Header title="Player Stats" showBack />

      <main className="p-4 space-y-4">
        {/* Player Header */}
        <div className="card text-center">
          <div className="text-4xl font-bold text-white mb-2">#{player.jerseyNumber}</div>
          <div className="text-xl font-semibold text-white mb-1">{player.name}</div>
          <span className={`text-sm px-2 py-1 rounded ${primaryPos.color}`}>
            {positionDisplay}
          </span>
        </div>

        {/* Season Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Season Summary</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{seasonStats.gamesPlayed}</div>
              <div className="text-xs text-slate-400">Games</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-xl font-bold text-white font-mono">{formatPlayingTimeLong(seasonStats.totalSeconds)}</div>
              <div className="text-xs text-slate-400">Total Time</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-xl font-bold text-white font-mono">{formatPlayingTime(seasonStats.avgSeconds)}</div>
              <div className="text-xs text-slate-400">Avg/Game</div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Season Totals</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatRow label="Goals" value={seasonStats.goal} />
            <StatRow label="Assists" value={seasonStats.assist} />
            <StatRow label="Passes" value={seasonStats.pass_complete} suffix={
              seasonStats.passCompletion !== null ? `(${seasonStats.passCompletion}%)` : ''
            } />
            <StatRow label="Shots" value={seasonStats.totalShots || 0} suffix={
              seasonStats.shotAccuracy !== null ? `(${seasonStats.shotAccuracy}% on target)` : ''
            } />
            <StatRow label="Scoring Rate" value={
              seasonStats.scoringRate !== null ? `${seasonStats.scoringRate}%` : '-'
            } />
            <StatRow label="Take-ons" value={seasonStats.totalTakeOns || 0} suffix={
              seasonStats.dribbleSuccess !== null ? `(${seasonStats.dribbleSuccess}%)` : ''
            } />
            <StatRow label="Tackles" value={seasonStats.tackle} />
            <StatRow label="Interceptions" value={seasonStats.interception} />
            <StatRow label="Clearances" value={seasonStats.clearance} />
            <StatRow label="Key Passes" value={seasonStats.key_pass} />
            {positions.includes('GK') && (
              <>
                <StatRow label="Saves" value={seasonStats.save} />
                <StatRow label="Goals Against" value={seasonStats.goal_against} />
              </>
            )}
          </div>
        </div>

        {/* Export */}
        <Button variant="secondary" className="w-full" onClick={handleExport}>
          Export Player Stats CSV
        </Button>

        {/* Per-Game Breakdown */}
        {gameBreakdown.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Game by Game</h3>
            <div className="space-y-2">
              {gameBreakdown.map(gb => (
                <div key={gb.game.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">vs {gb.game.opponent}</div>
                      <div className="text-sm text-slate-400">{formatDate(gb.game.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        gb.game.homeScore > gb.game.awayScore ? 'text-green-400' :
                        gb.game.homeScore < gb.game.awayScore ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {gb.game.homeScore}-{gb.game.awayScore}
                      </div>
                      <div className="text-sm text-slate-400 font-mono">{formatPlayingTime(gb.seconds)}</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
                    {gb.goal > 0 && <span className="text-green-400">{gb.goal}G</span>}
                    {gb.assist > 0 && <span className="text-blue-400">{gb.assist}A</span>}
                    <span>{gb.pass_complete}P {gb.passCompletion !== null && `(${gb.passCompletion}%)`}</span>
                    {gb.totalShots > 0 && <span>{gb.totalShots}S {gb.shotAccuracy !== null && `(${gb.shotAccuracy}%)`}</span>}
                    {gb.totalTakeOns > 0 && <span>{gb.totalTakeOns}TO {gb.dribbleSuccess !== null && `(${gb.dribbleSuccess}%)`}</span>}
                    {gb.tackle > 0 && <span>{gb.tackle}T</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Navigation />
    </div>
  )
}

const StatRow = ({ label, value, suffix = '' }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-700">
    <span className="text-slate-400">{label}</span>
    <span className="font-semibold">
      {value} {suffix && <span className="text-slate-500 text-sm">{suffix}</span>}
    </span>
  </div>
)

export default PlayerStats
