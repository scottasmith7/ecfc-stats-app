import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllPlayers, getAllGames } from '../db/database'
import { db } from '../db/database'
import { calculatePlayerStats, calculateDerivedStats, calculateSecondsPlayed, formatPlayingTime, formatPlayingTimeLong, getLeaderboard, calculatePossession } from '../utils/stats'
import { POSITIONS } from '../utils/constants'
import { useTeam } from '../context/TeamContext'
import Header from '../components/layout/Header'
import Navigation from '../components/layout/Navigation'

const TeamStats = () => {
  const navigate = useNavigate()
  const { activeTeam } = useTeam()
  const [players, setPlayers] = useState([])
  const [games, setGames] = useState([])
  const [allLineups, setAllLineups] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('leaders')

  useEffect(() => {
    const loadData = async () => {
      if (!activeTeam) return
      try {
        const [playersData, gamesData] = await Promise.all([
          getAllPlayers(activeTeam.id),
          getAllGames(activeTeam.id)
        ])
        const completedGames = gamesData.filter(g => g.status === 'completed')
        const gameIds = completedGames.map(g => g.id)

        // Only load lineups and events for this team's games
        const [lineupsData, eventsData] = await Promise.all([
          gameIds.length > 0 ? db.gameLineups.where('gameId').anyOf(gameIds).toArray() : [],
          gameIds.length > 0 ? db.gameEvents.where('gameId').anyOf(gameIds).toArray() : []
        ])

        setPlayers(playersData)
        setGames(completedGames)
        setAllLineups(lineupsData)
        setAllEvents(eventsData)
      } catch (err) {
        console.error('Failed to load team stats:', err)
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    loadData()
  }, [activeTeam])

  // Calculate player stats map
  const playerStatsMap = useMemo(() => {
    const map = {}

    players.forEach(player => {
      const playerEvents = allEvents.filter(e => e.playerId === player.id)
      const playerLineups = allLineups.filter(l => l.playerId === player.id)

      const rawStats = calculatePlayerStats(playerEvents)
      const derived = calculateDerivedStats(rawStats)

      // Calculate total seconds
      let totalSeconds = 0
      const gameIds = [...new Set(playerLineups.map(l => l.gameId))]
      gameIds.forEach(gameId => {
        const game = games.find(g => g.id === gameId)
        const gameLineups = playerLineups.filter(l => l.gameId === gameId)
        totalSeconds += calculateSecondsPlayed(gameLineups, game?.clockTime || 0, game?.status || 'completed')
      })

      map[player.id] = {
        ...rawStats,
        ...derived,
        totalSeconds,
        gamesPlayed: gameIds.length
      }
    })

    return map
  }, [players, games, allLineups, allEvents])

  // Team totals
  const teamTotals = useMemo(() => {
    // Aggregate raw stats across all players
    const rawStats = calculatePlayerStats(allEvents)
    const derived = calculateDerivedStats(rawStats)

    // Count opponent passes from events
    const opponentPasses = allEvents.filter(e => e.eventType === 'opponent_pass').length
    const possession = calculatePossession(rawStats.pass_complete, opponentPasses)

    const totals = {
      games: games.length,
      wins: games.filter(g => g.homeScore > g.awayScore).length,
      draws: games.filter(g => g.homeScore === g.awayScore).length,
      losses: games.filter(g => g.homeScore < g.awayScore).length,
      goalsFor: games.reduce((sum, g) => sum + (g.homeScore || 0), 0),
      goalsAgainst: games.reduce((sum, g) => sum + (g.awayScore || 0), 0),
      ...rawStats,
      ...derived,
      possession,
      opponentPasses
    }
    return totals
  }, [games, allEvents])

  // Leaderboards
  const leaderboards = useMemo(() => {
    return {
      goals: getLeaderboard(playerStatsMap, 'goal', 5),
      assists: getLeaderboard(playerStatsMap, 'assist', 5),
      passes: getLeaderboard(playerStatsMap, 'pass_complete', 5),
      tackles: getLeaderboard(playerStatsMap, 'tackle', 5),
      playingTime: Object.entries(playerStatsMap)
        .map(([playerId, stats]) => ({ playerId: parseInt(playerId), value: stats.totalSeconds }))
        .filter(e => e.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    }
  }, [playerStatsMap])

  const getPlayerById = (id) => players.find(p => p.id === id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Team Stats" />

      <main className="p-4 space-y-4">
        {/* Season Record */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Season Record</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{teamTotals.games}</div>
              <div className="text-xs text-slate-400">Played</div>
            </div>
            <div className="bg-green-900/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{teamTotals.wins}</div>
              <div className="text-xs text-slate-400">Wins</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-slate-400">{teamTotals.draws}</div>
              <div className="text-xs text-slate-400">Draws</div>
            </div>
            <div className="bg-red-900/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">{teamTotals.losses}</div>
              <div className="text-xs text-slate-400">Losses</div>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{teamTotals.goalsFor}</div>
              <div className="text-xs text-slate-400">Goals For</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{teamTotals.goalsAgainst}</div>
              <div className="text-xs text-slate-400">Goals Against</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {teamTotals.goalsFor - teamTotals.goalsAgainst > 0 ? '+' : ''}
                {teamTotals.goalsFor - teamTotals.goalsAgainst}
              </div>
              <div className="text-xs text-slate-400">Goal Diff</div>
            </div>
          </div>
        </div>

        {/* Team Performance Stats */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Team Performance</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            {teamTotals.possession !== null && (
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="text-2xl font-bold text-ecfc-green">{teamTotals.possession}%</div>
                <div className="text-xs text-slate-400">Avg Possession</div>
              </div>
            )}
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{teamTotals.pass_complete || 0}</div>
              <div className="text-xs text-slate-400">Total Passes</div>
              {teamTotals.passCompletion !== null && (
                <div className="text-xs text-slate-500">{teamTotals.passCompletion}% completion</div>
              )}
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{teamTotals.totalShots || 0}</div>
              <div className="text-xs text-slate-400">Total Shots</div>
              {teamTotals.shotAccuracy !== null && (
                <div className="text-xs text-slate-500">{teamTotals.shotAccuracy}% on target</div>
              )}
            </div>
            {teamTotals.scoringRate !== null && (
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{teamTotals.scoringRate}%</div>
                <div className="text-xs text-slate-400">Scoring Rate</div>
                <div className="text-xs text-slate-500">goals per shot on target</div>
              </div>
            )}
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{teamTotals.totalTakeOns || 0}</div>
              <div className="text-xs text-slate-400">Take-ons</div>
              {teamTotals.dribbleSuccess !== null && (
                <div className="text-xs text-slate-500">{teamTotals.dribbleSuccess}% success</div>
              )}
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{teamTotals.tackle || 0}</div>
              <div className="text-xs text-slate-400">Total Tackles</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('leaders')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'leaders' ? 'bg-ecfc-blue text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Leaders
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'roster' ? 'bg-ecfc-blue text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            Full Roster
          </button>
        </div>

        {activeTab === 'leaders' ? (
          // Leaderboards
          <div className="space-y-4">
            <LeaderboardCard
              title="Top Scorers"
              icon="⚽"
              entries={leaderboards.goals}
              getPlayer={getPlayerById}
              onPlayerClick={(id) => navigate(`/stats/player/${id}`)}
            />
            <LeaderboardCard
              title="Top Assists"
              icon="👟"
              entries={leaderboards.assists}
              getPlayer={getPlayerById}
              onPlayerClick={(id) => navigate(`/stats/player/${id}`)}
            />
            <LeaderboardCard
              title="Most Passes"
              icon="🎯"
              entries={leaderboards.passes}
              getPlayer={getPlayerById}
              onPlayerClick={(id) => navigate(`/stats/player/${id}`)}
            />
            <LeaderboardCard
              title="Most Tackles"
              icon="🛡"
              entries={leaderboards.tackles}
              getPlayer={getPlayerById}
              onPlayerClick={(id) => navigate(`/stats/player/${id}`)}
            />
            <LeaderboardCard
              title="Most Playing Time"
              icon="⏱"
              entries={leaderboards.playingTime}
              getPlayer={getPlayerById}
              onPlayerClick={(id) => navigate(`/stats/player/${id}`)}
              formatValue={(seconds) => formatPlayingTimeLong(seconds)}
            />
          </div>
        ) : (
          // Full Roster Stats
          <div className="space-y-2">
            {players.map(player => {
              const stats = playerStatsMap[player.id] || {}
              const positions = player.positions || [player.position] || ['MID']
              const primaryPos = POSITIONS[positions[0]] || POSITIONS.MID
              const positionDisplay = positions.map(p => POSITIONS[p]?.label || p).join('/')

              return (
                <button
                  key={player.id}
                  onClick={() => navigate(`/stats/player/${player.id}`)}
                  className="w-full card text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-bold">#{player.jerseyNumber}</span>
                    <span className="flex-1 font-medium">{player.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${primaryPos.color}`}>
                      {positionDisplay}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
                    <span>{stats.gamesPlayed || 0} games</span>
                    <span className="font-mono">{formatPlayingTimeLong(stats.totalSeconds || 0)}</span>
                    <span className="text-green-400">{stats.goal || 0}G</span>
                    <span className="text-blue-400">{stats.assist || 0}A</span>
                    {stats.passCompletion !== null && <span>{stats.passCompletion}% pass</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  )
}

const LeaderboardCard = ({ title, icon, entries, getPlayer, onPlayerClick, suffix = '', formatValue = null }) => {
  if (entries.length === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-2">{icon} {title}</h3>
        <div className="text-slate-500 text-center py-2">No data yet</div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">{icon} {title}</h3>
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const player = getPlayer(entry.playerId)
          if (!player) return null

          const positions = player.positions || [player.position] || ['MID']
          const primaryPos = POSITIONS[positions[0]] || POSITIONS.MID
          const positionDisplay = positions.map(p => POSITIONS[p]?.label || p).join('/')

          return (
            <button
              key={entry.playerId}
              onClick={() => onPlayerClick(entry.playerId)}
              className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-500 text-black' :
                index === 1 ? 'bg-slate-400 text-black' :
                index === 2 ? 'bg-amber-700 text-white' :
                'bg-slate-600 text-white'
              }`}>
                {index + 1}
              </span>
              <span className="font-bold">#{player.jerseyNumber}</span>
              <span className="flex-1 text-left">{player.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${primaryPos.color}`}>
                {positionDisplay}
              </span>
              <span className="font-bold text-ecfc-green font-mono">
                {formatValue ? formatValue(entry.value) : `${entry.value}${suffix}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TeamStats
