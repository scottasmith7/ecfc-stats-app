import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame, updateGame, getGameLineup, updateLineupEntry, getAllPlayers } from '../db/database'
import { useGameClock } from '../hooks/useGameClock'
import { useGameEvents } from '../hooks/useGameEvents'
import { useToast, ToastContainer } from '../components/common/Toast'
import { formatTime, STAT_TYPES } from '../utils/constants'
import GameClock from '../components/game/GameClock'
import PlayerGrid from '../components/game/PlayerGrid'
import StatPanel from '../components/game/StatPanel'
import UndoPanel from '../components/game/UndoPanel'
import SubstitutionModal from '../components/game/SubstitutionModal'
import GoalAssistModal from '../components/game/GoalAssistModal'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'

// Hook to detect landscape orientation
const useIsLandscape = () => {
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight
    }
    return false
  })

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return isLandscape
}

const LiveGame = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const gameId = parseInt(id)
  const isLandscape = useIsLandscape()

  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [lineup, setLineup] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [showSubsModal, setShowSubsModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalScorer, setGoalScorer] = useState(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // Toast notifications
  const { toasts, addToast, removeToast } = useToast()

  // Game events hook
  const {
    events,
    addEvent,
    addGoalWithAssist,
    removeEvent,
    getPlayerEvents
  } = useGameEvents(gameId)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [gameData, playersData, lineupData] = await Promise.all([
          getGame(gameId),
          getAllPlayers(),
          getGameLineup(gameId)
        ])
        setGame(gameData)
        setPlayers(playersData)
        setLineup(lineupData)
      } catch (err) {
        console.error('Failed to load game:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [gameId])

  // Game clock hook
  const {
    clockTime,
    isRunning,
    toggle: toggleClock,
    reset: resetClock,
    isPastHalfLength
  } = useGameClock(gameId, game?.clockTime || 0, game?.halfLength || 35)

  // Get active player IDs (currently on field)
  const activePlayerIds = useMemo(() => {
    return lineup
      .filter(entry => entry.inTime !== null && entry.outTime === null)
      .map(entry => entry.playerId)
  }, [lineup])

  // Get player events map
  const playerEventsMap = useMemo(() => {
    const map = {}
    players.forEach(p => {
      map[p.id] = events.filter(e => e.playerId === p.id)
    })
    return map
  }, [players, events])

  // Get player lineups map (for playing time calculation)
  const playerLineupsMap = useMemo(() => {
    const map = {}
    players.forEach(p => {
      map[p.id] = lineup.filter(l => l.playerId === p.id)
    })
    return map
  }, [players, lineup])

  // Get selected player object
  const selectedPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId)
  }, [players, selectedPlayerId])

  // Handle stat recording
  const handleStatRecord = useCallback(async (statType) => {
    if (!selectedPlayerId) return

    // Special handling for goals
    if (statType === 'goal') {
      setGoalScorer(selectedPlayer)
      setShowGoalModal(true)
      return
    }

    await addEvent(selectedPlayerId, statType, clockTime)

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15)
    }

    // Toast notification
    const playerName = `#${selectedPlayer.jerseyNumber}`
    const statLabel = STAT_TYPES[statType]?.label || statType
    addToast(`${statLabel} - ${playerName} @ ${formatTime(clockTime)}`)
  }, [selectedPlayerId, selectedPlayer, clockTime, addEvent, addToast])

  // Handle goal with assist
  const handleGoalAssist = useCallback(async (assisterId) => {
    if (!goalScorer) return

    await addGoalWithAssist(goalScorer.id, assisterId, clockTime)

    // Update local game state
    setGame(prev => prev ? { ...prev, homeScore: (prev.homeScore || 0) + 1 } : prev)

    const assisterName = assisterId
      ? `#${players.find(p => p.id === assisterId)?.jerseyNumber}`
      : 'Unassisted'

    addToast(`⚽ GOAL! #${goalScorer.jerseyNumber} (${assisterName}) @ ${formatTime(clockTime)}`)

    setGoalScorer(null)
  }, [goalScorer, clockTime, addGoalWithAssist, players, addToast])

  // Handle substitution
  const handleSubstitute = useCallback(async (playerOutId, playerInId) => {
    const playerOutEntry = lineup.find(l => l.playerId === playerOutId && l.outTime === null)
    const playerInEntry = lineup.find(l => l.playerId === playerInId)

    if (playerOutEntry) {
      await updateLineupEntry(playerOutEntry.id, { outTime: clockTime })
    }

    if (playerInEntry) {
      await updateLineupEntry(playerInEntry.id, { inTime: clockTime, outTime: null })
    }

    // Refresh lineup
    const newLineup = await getGameLineup(gameId)
    setLineup(newLineup)

    const outPlayer = players.find(p => p.id === playerOutId)
    const inPlayer = players.find(p => p.id === playerInId)
    addToast(`Sub: #${outPlayer?.jerseyNumber} → #${inPlayer?.jerseyNumber}`)
  }, [lineup, clockTime, gameId, players, addToast])

  // Handle undo
  const handleUndo = useCallback(async (eventId) => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    await removeEvent(eventId)

    // Update local score if it was a goal
    if (event.eventType === 'goal') {
      setGame(prev => prev ? { ...prev, homeScore: Math.max(0, (prev.homeScore || 0) - 1) } : prev)
    }
    if (event.eventType === 'goal_against') {
      setGame(prev => prev ? { ...prev, awayScore: Math.max(0, (prev.awayScore || 0) - 1) } : prev)
    }

    addToast('Event removed')
  }, [events, removeEvent, addToast])

  // Handle end half/game
  const handleEndAction = useCallback(async () => {
    setShowEndConfirm(false)

    if (game?.currentHalf === 1) {
      // End first half
      await updateGame(gameId, { currentHalf: 2 })
      await resetClock()
      setGame(prev => prev ? { ...prev, currentHalf: 2 } : prev)
      addToast('First half ended. Ready for second half.')
    } else {
      // End game
      await updateGame(gameId, { status: 'completed', clockTime })
      navigate(`/game/${gameId}/review`)
    }
  }, [game, gameId, clockTime, resetClock, addToast, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading game...</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Game not found</div>
      </div>
    )
  }

  // Landscape layout - two column with top bar
  if (isLandscape) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
        {/* Compact Top Bar */}
        <GameClock
          clockTime={clockTime}
          isRunning={isRunning}
          currentHalf={game.currentHalf}
          isPastHalfLength={isPastHalfLength}
          onToggle={toggleClock}
          onEndHalf={() => setShowEndConfirm(true)}
          onSubs={() => setShowSubsModal(true)}
          homeScore={game.homeScore || 0}
          awayScore={game.awayScore || 0}
          opponent={game.opponent}
          compact={true}
        />

        {/* Two Column Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Player Grid */}
          <div className="w-[180px] shrink-0">
            <PlayerGrid
              players={players.filter(p => lineup.some(l => l.playerId === p.id))}
              activePlayerIds={activePlayerIds}
              selectedPlayerId={selectedPlayerId}
              playerEvents={playerEventsMap}
              playerLineups={playerLineupsMap}
              clockTime={clockTime}
              onSelectPlayer={setSelectedPlayerId}
              compact={true}
            />
          </div>

          {/* Right: Stat Buttons */}
          <div className="flex-1 flex flex-col min-h-0">
            <StatPanel
              selectedPlayer={selectedPlayer}
              onStatRecord={handleStatRecord}
              disabled={!isRunning}
              compact={true}
            />
          </div>
        </div>

        {/* Compact Undo - just last event */}
        <div className="shrink-0">
          <UndoPanel
            events={events}
            players={players}
            onUndo={handleUndo}
            compact={true}
          />
        </div>

        {/* Modals */}
        <SubstitutionModal
          isOpen={showSubsModal}
          onClose={() => setShowSubsModal(false)}
          players={players.filter(p => lineup.some(l => l.playerId === p.id))}
          activePlayerIds={activePlayerIds}
          onSubstitute={handleSubstitute}
        />

        <GoalAssistModal
          isOpen={showGoalModal}
          onClose={() => {
            setShowGoalModal(false)
            setGoalScorer(null)
          }}
          scorer={goalScorer}
          players={players}
          activePlayerIds={activePlayerIds}
          onSelect={handleGoalAssist}
        />

        <Modal
          isOpen={showEndConfirm}
          onClose={() => setShowEndConfirm(false)}
          title={game.currentHalf === 1 ? 'End First Half?' : 'End Game?'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowEndConfirm(false)}>
                Cancel
              </Button>
              <Button variant={game.currentHalf === 1 ? 'primary' : 'success'} onClick={handleEndAction}>
                {game.currentHalf === 1 ? 'End Half' : 'End Game'}
              </Button>
            </>
          }
        >
          <p className="text-slate-300">
            {game.currentHalf === 1
              ? 'This will pause the clock and prepare for the second half.'
              : 'This will end the game and save all stats.'}
          </p>
          <p className="text-slate-400 mt-2">
            Current time: {formatTime(clockTime)}
          </p>
        </Modal>

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    )
  }

  // Portrait layout - original vertical stack
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Clock and Score Header */}
      <GameClock
        clockTime={clockTime}
        isRunning={isRunning}
        currentHalf={game.currentHalf}
        isPastHalfLength={isPastHalfLength}
        onToggle={toggleClock}
        onEndHalf={() => setShowEndConfirm(true)}
        onSubs={() => setShowSubsModal(true)}
        homeScore={game.homeScore || 0}
        awayScore={game.awayScore || 0}
        opponent={game.opponent}
      />

      {/* Player Grid */}
      <PlayerGrid
        players={players.filter(p => lineup.some(l => l.playerId === p.id))}
        activePlayerIds={activePlayerIds}
        selectedPlayerId={selectedPlayerId}
        playerEvents={playerEventsMap}
        playerLineups={playerLineupsMap}
        clockTime={clockTime}
        onSelectPlayer={setSelectedPlayerId}
      />

      {/* Stat Buttons */}
      <StatPanel
        selectedPlayer={selectedPlayer}
        onStatRecord={handleStatRecord}
        disabled={!isRunning}
      />

      {/* Undo Panel */}
      <UndoPanel
        events={events}
        players={players}
        onUndo={handleUndo}
      />

      {/* Substitution Modal */}
      <SubstitutionModal
        isOpen={showSubsModal}
        onClose={() => setShowSubsModal(false)}
        players={players.filter(p => lineup.some(l => l.playerId === p.id))}
        activePlayerIds={activePlayerIds}
        onSubstitute={handleSubstitute}
      />

      {/* Goal Assist Modal */}
      <GoalAssistModal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false)
          setGoalScorer(null)
        }}
        scorer={goalScorer}
        players={players}
        activePlayerIds={activePlayerIds}
        onSelect={handleGoalAssist}
      />

      {/* End Half/Game Confirmation */}
      <Modal
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        title={game.currentHalf === 1 ? 'End First Half?' : 'End Game?'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEndConfirm(false)}>
              Cancel
            </Button>
            <Button variant={game.currentHalf === 1 ? 'primary' : 'success'} onClick={handleEndAction}>
              {game.currentHalf === 1 ? 'End Half' : 'End Game'}
            </Button>
          </>
        }
      >
        <p className="text-slate-300">
          {game.currentHalf === 1
            ? 'This will pause the clock and prepare for the second half.'
            : 'This will end the game and save all stats.'}
        </p>
        <p className="text-slate-400 mt-2">
          Current time: {formatTime(clockTime)}
        </p>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default LiveGame
