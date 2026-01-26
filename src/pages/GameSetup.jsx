import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame, updateGame, setGameLineup, getAllPlayers } from '../db/database'
import { formatDate, POSITIONS } from '../utils/constants'
import Header from '../components/layout/Header'
import Button from '../components/common/Button'

const GameSetup = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const gameId = parseInt(id)

  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [gameData, playersData] = await Promise.all([
          getGame(gameId),
          getAllPlayers()
        ])
        setGame(gameData)
        setPlayers(playersData)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [gameId])

  const togglePlayer = (playerId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else if (next.size < 11) {
        next.add(playerId)
      }
      return next
    })
  }

  const selectAll = () => {
    // Select first 11 players
    setSelectedIds(new Set(players.slice(0, 11).map(p => p.id)))
  }

  const clearAll = () => {
    setSelectedIds(new Set())
  }

  const handleStartGame = async () => {
    if (selectedIds.size !== 11) return

    const starterIds = Array.from(selectedIds)
    const allPlayerIds = players.map(p => p.id)

    await setGameLineup(gameId, allPlayerIds, starterIds)
    await updateGame(gameId, {
      status: 'live',
      clockTime: 0,
      currentHalf: 1
    })

    navigate(`/game/${gameId}/live`)
  }

  // Validation
  const selectedPlayers = players.filter(p => selectedIds.has(p.id))
  const gkCount = selectedPlayers.filter(p => {
    const positions = p.positions || [p.position] || []
    return positions.includes('GK')
  }).length
  const hasValidLineup = selectedIds.size === 11 && gkCount >= 1

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
    <div className="min-h-screen pb-24">
      <Header title="Game Setup" showBack />

      <main className="p-4">
        {/* Game Info */}
        <div className="card mb-4">
          <div className="text-xl font-bold text-white">vs {game.opponent}</div>
          <div className="text-slate-400">{formatDate(game.date)}</div>
          <div className="text-sm text-slate-500 mt-1">
            {game.halfLength} min halves
          </div>
        </div>

        {/* Selection Counter */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">
            <span className={selectedIds.size === 11 ? 'text-green-400' : 'text-white'}>
              {selectedIds.size}/11
            </span>
            <span className="text-slate-400 ml-2">selected</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={clearAll}>
              Clear
            </Button>
            <Button size="sm" variant="secondary" onClick={selectAll}>
              Select 11
            </Button>
          </div>
        </div>

        {/* Validation Messages */}
        {selectedIds.size === 11 && gkCount === 0 && (
          <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-3 mb-4">
            <span className="text-yellow-400">⚠️ No goalkeeper selected</span>
          </div>
        )}

        {/* Player List */}
        {players.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No players in roster</p>
            <Button onClick={() => navigate('/roster')}>Add Players First</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {players.map(player => {
              const positions = player.positions || [player.position] || ['MID']
              const primaryPos = POSITIONS[positions[0]] || POSITIONS.MID
              const positionDisplay = positions.map(p => POSITIONS[p]?.label || p).join('/')
              const isSelected = selectedIds.has(player.id)

              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`
                    p-3 rounded-lg text-left transition-all active:scale-95
                    ${isSelected
                      ? 'bg-ecfc-green/20 border-2 border-ecfc-green'
                      : 'bg-slate-800 border-2 border-transparent'}
                    ${!isSelected && selectedIds.size >= 11 ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-white">
                      #{player.jerseyNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {player.name}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${primaryPos.color}`}>
                        {positionDisplay}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="text-ecfc-green text-xl">✓</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-700">
        <Button
          variant="success"
          className="w-full text-lg"
          disabled={!hasValidLineup}
          onClick={handleStartGame}
        >
          {selectedIds.size === 11 ? 'Start Game' : `Select ${11 - selectedIds.size} more`}
        </Button>
      </div>
    </div>
  )
}

export default GameSetup
