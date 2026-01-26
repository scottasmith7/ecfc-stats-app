import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { POSITIONS } from '../../utils/constants'

const SubstitutionModal = ({
  isOpen,
  onClose,
  players,
  activePlayerIds,
  onSubstitute
}) => {
  const [playerOut, setPlayerOut] = useState(null)
  const [playerIn, setPlayerIn] = useState(null)

  const activePlayers = players.filter(p => activePlayerIds.includes(p.id))
  const benchPlayers = players.filter(p => !activePlayerIds.includes(p.id))

  const handleConfirm = () => {
    if (playerOut && playerIn) {
      onSubstitute(playerOut, playerIn)
      setPlayerOut(null)
      setPlayerIn(null)
      onClose()
    }
  }

  const handleClose = () => {
    setPlayerOut(null)
    setPlayerIn(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Substitution"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleConfirm}
            disabled={!playerOut || !playerIn}
          >
            Confirm Sub
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Player going out */}
        <div>
          <div className="text-sm text-slate-400 mb-2 font-semibold">
            Player OUT ({activePlayers.length})
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activePlayers.map(player => {
              const pos = POSITIONS[player.position]
              return (
                <button
                  key={player.id}
                  onClick={() => setPlayerOut(player.id)}
                  className={`
                    w-full p-3 rounded-lg text-left flex items-center gap-3
                    ${playerOut === player.id ? 'bg-red-600' : 'bg-slate-700'}
                    active:scale-95 transition-all
                  `}
                >
                  <span className="text-xl font-bold">#{player.jerseyNumber}</span>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${pos?.color}`}>
                      {pos?.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Player coming in */}
        <div>
          <div className="text-sm text-slate-400 mb-2 font-semibold">
            Player IN ({benchPlayers.length})
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {benchPlayers.length === 0 ? (
              <div className="text-slate-500 text-center py-4">
                No players on bench
              </div>
            ) : (
              benchPlayers.map(player => {
                const pos = POSITIONS[player.position]
                return (
                  <button
                    key={player.id}
                    onClick={() => setPlayerIn(player.id)}
                    className={`
                      w-full p-3 rounded-lg text-left flex items-center gap-3
                      ${playerIn === player.id ? 'bg-green-600' : 'bg-slate-700'}
                      active:scale-95 transition-all
                    `}
                  >
                    <span className="text-xl font-bold">#{player.jerseyNumber}</span>
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${pos?.color}`}>
                        {pos?.label}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {(playerOut || playerIn) && (
        <div className="mt-4 p-3 bg-slate-700 rounded-lg text-center">
          <span className="text-red-400">
            {playerOut ? `#${players.find(p => p.id === playerOut)?.jerseyNumber}` : '?'}
          </span>
          <span className="mx-3 text-slate-400">→</span>
          <span className="text-green-400">
            {playerIn ? `#${players.find(p => p.id === playerIn)?.jerseyNumber}` : '?'}
          </span>
        </div>
      )}
    </Modal>
  )
}

export default SubstitutionModal
