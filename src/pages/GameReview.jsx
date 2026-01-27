import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame, getGameLineup, getGameEvents, getAllPlayers } from '../db/database'
import { calculatePlayerStats, calculateDerivedStats, calculateSecondsPlayed, formatPlayingTime, calculatePossession } from '../utils/stats'
import { exportGameCSV } from '../utils/export'
import { formatDate, formatTime, POSITIONS, STAT_TYPES } from '../utils/constants'
import { useTeam } from '../context/TeamContext'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'
import Button from '../components/common/Button'

const GameReview = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeTeam } = useTeam()
  const gameId = parseInt(id)

  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [lineup, setLineup] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('minutes')
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      if (!activeTeam) return
      try {
        const [gameData, playersData, lineupData, eventsData] = await Promise.all([
          getGame(gameId),
          getAllPlayers(activeTeam.id),
          getGameLineup(gameId),
          getGameEvents(gameId)
        ])
        setGame(gameData)
        setPlayers(playersData)
        setLineup(lineupData)
        setEvents(eventsData)
      } catch (err) {
        console.error('Failed to load game:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [gameId, activeTeam])

  // Calculate player stats
  const playerStats = useMemo(() => {
    const stats = []

    players.forEach(player => {
      const playerLineup = lineup.filter(l => l.playerId === player.id)
      if (playerLineup.length === 0) return

      const playerEvents = events.filter(e => e.playerId === player.id)
      const rawStats = calculatePlayerStats(playerEvents)
      const derived = calculateDerivedStats(rawStats)
      const seconds = calculateSecondsPlayed(playerLineup, game?.clockTime || 0, game?.status || 'completed')

      stats.push({
        player,
        seconds,
        ...rawStats,
        ...derived,
        events: playerEvents
      })
    })

    // Sort
    stats.sort((a, b) => {
      switch (sortBy) {
        case 'minutes': return b.seconds - a.seconds
        case 'goals': return b.goal - a.goal
        case 'assists': return b.assist - a.assist
        case 'passes': return b.pass_complete - a.pass_complete
        default: return b.seconds - a.seconds
      }
    })

    return stats
  }, [players, lineup, events, game, sortBy])

  // Calculate team totals and possession
  const teamTotals = useMemo(() => {
    const allStats = calculatePlayerStats(events)
    const derived = calculateDerivedStats(allStats)
    const opponentPasses = events.filter(e => e.eventType === 'opponent_pass').length
    const possession = calculatePossession(allStats.pass_complete, opponentPasses)

    return {
      ...allStats,
      ...derived,
      opponentPasses,
      possession
    }
  }, [events])

  // Get selected player events
  const selectedPlayerStats = useMemo(() => {
    return playerStats.find(ps => ps.player.id === selectedPlayerId)
  }, [playerStats, selectedPlayerId])

  const handleExport = () => {
    if (game) {
      exportGameCSV(game, players, lineup, events, activeTeam?.teamName)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Game not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Game Review" showBack />

      <main className="p-4 space-y-4">
        {/* Score Header */}
        <div className="card text-center">
          <div className="text-sm text-slate-400 mb-1">{formatDate(game.date)}</div>
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="text-xl font-bold text-ecfc-green truncate max-w-[100px]">{activeTeam?.teamName || 'Home'}</span>
            <span className={`text-4xl font-bold ${
              game.homeScore > game.awayScore ? 'text-green-400' :
              game.homeScore < game.awayScore ? 'text-red-400' : 'text-white'
            }`}>
              {game.homeScore} - {game.awayScore}
            </span>
            <span className="text-xl font-bold text-slate-400">{game.opponent}</span>
          </div>
          <div className="text-sm text-slate-500">
            {game.homeScore > game.awayScore ? 'WIN' :
             game.homeScore < game.awayScore ? 'LOSS' : 'DRAW'}
          </div>
        </div>

        {/* Team Stats Summary */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Team Stats</h3>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {teamTotals.possession !== null && (
              <div className="bg-slate-700 rounded-lg p-2">
                <div className="text-lg font-bold text-ecfc-green">{teamTotals.possession}%</div>
                <div className="text-xs text-slate-400">Possession</div>
              </div>
            )}
            <div className="bg-slate-700 rounded-lg p-2">
              <div className="text-lg font-bold">{teamTotals.pass_complete}</div>
              <div className="text-xs text-slate-400">Passes</div>
              {teamTotals.passCompletion !== null && (
                <div className="text-xs text-slate-500">{teamTotals.passCompletion}%</div>
              )}
            </div>
            <div className="bg-slate-700 rounded-lg p-2">
              <div className="text-lg font-bold">{teamTotals.totalShots || 0}</div>
              <div className="text-xs text-slate-400">Shots</div>
              {teamTotals.shotAccuracy !== null && (
                <div className="text-xs text-slate-500">{teamTotals.shotAccuracy}% on target</div>
              )}
            </div>
            <div className="bg-slate-700 rounded-lg p-2">
              <div className="text-lg font-bold">{teamTotals.totalTakeOns || 0}</div>
              <div className="text-xs text-slate-400">Take-ons</div>
              {teamTotals.dribbleSuccess !== null && (
                <div className="text-xs text-slate-500">{teamTotals.dribbleSuccess}%</div>
              )}
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button variant="secondary" className="w-full" onClick={handleExport}>
          Export Game CSV
        </Button>

        {/* Sort Options */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'minutes', label: 'Minutes' },
            { key: 'goals', label: 'Goals' },
            { key: 'assists', label: 'Assists' },
            { key: 'passes', label: 'Passes' }
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                sortBy === opt.key
                  ? 'bg-ecfc-blue text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Player Stats Table */}
        <div className="space-y-2">
          {playerStats.map(ps => {
            const positions = ps.player.positions || [ps.player.position] || ['MID']
            const primaryPos = POSITIONS[positions[0]] || POSITIONS.MID
            const positionDisplay = positions.map(p => POSITIONS[p]?.label || p).join('/')
            return (
              <button
                key={ps.player.id}
                onClick={() => setSelectedPlayerId(
                  selectedPlayerId === ps.player.id ? null : ps.player.id
                )}
                className={`w-full card text-left transition-all ${
                  selectedPlayerId === ps.player.id ? 'ring-2 ring-ecfc-green' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold">#{ps.player.jerseyNumber}</span>
                  <span className="flex-1 font-medium">{ps.player.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${primaryPos.color}`}>
                    {positionDisplay}
                  </span>
                  <span className="text-slate-400 font-mono">{formatPlayingTime(ps.seconds)}</span>
                </div>

                <div className="grid grid-cols-6 gap-2 text-center text-sm">
                  <div>
                    <div className="text-slate-400 text-xs">Passes</div>
                    <div className="font-semibold">{ps.pass_complete}</div>
                    {ps.passCompletion !== null && (
                      <div className="text-xs text-slate-500">{ps.passCompletion}%</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Shots</div>
                    <div className="font-semibold">{ps.totalShots || 0}</div>
                    {ps.shotAccuracy !== null && (
                      <div className="text-xs text-slate-500">{ps.shotAccuracy}%</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Goals</div>
                    <div className="font-semibold text-green-400">{ps.goal}</div>
                    {ps.scoringRate !== null && (
                      <div className="text-xs text-slate-500">{ps.scoringRate}%</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Assists</div>
                    <div className="font-semibold text-blue-400">{ps.assist}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Dribbles</div>
                    <div className="font-semibold">{ps.totalTakeOns || 0}</div>
                    {ps.dribbleSuccess !== null && (
                      <div className="text-xs text-slate-500">{ps.dribbleSuccess}%</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs">Tackles</div>
                    <div className="font-semibold">{ps.tackle}</div>
                  </div>
                </div>

                {/* Expanded event timeline */}
                {selectedPlayerId === ps.player.id && ps.events.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-xs text-slate-400 mb-2">Event Timeline</div>
                    <div className="flex flex-wrap gap-1">
                      {ps.events
                        .sort((a, b) => a.gameTime - b.gameTime)
                        .map(event => (
                          <span
                            key={event.id}
                            className="text-xs bg-slate-700 px-2 py-1 rounded"
                          >
                            {formatTime(event.gameTime)} - {STAT_TYPES[event.eventType]?.abbrev || event.eventType}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </main>

      <Navigation />
    </div>
  )
}

export default GameReview
