import Modal from '../common/Modal'
import Button from '../common/Button'
import { POSITIONS } from '../../utils/constants'

const GoalAssistModal = ({
  isOpen,
  onClose,
  scorer,
  players,
  activePlayerIds,
  onSelect
}) => {
  // Get active players except the scorer
  const eligiblePlayers = players.filter(
    p => activePlayerIds.includes(p.id) && p.id !== scorer?.id
  )

  const handleSelect = (assisterId) => {
    onSelect(assisterId)
    onClose()
  }

  const handleUnassisted = () => {
    onSelect(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Who Assisted?"
      size="md"
    >
      <div className="space-y-2">
        {/* Goal scorer info */}
        <div className="bg-green-600/20 border border-green-600 rounded-lg p-3 mb-4 text-center">
          <span className="text-green-400 font-semibold">
            ⚽ GOAL: #{scorer?.jerseyNumber} {scorer?.name}
          </span>
        </div>

        {/* Assister options */}
        <div className="text-sm text-slate-400 mb-2">Select assister:</div>

        {eligiblePlayers.map(player => {
          const pos = POSITIONS[player.position]
          return (
            <button
              key={player.id}
              onClick={() => handleSelect(player.id)}
              className="w-full p-3 rounded-lg bg-slate-700 hover:bg-slate-600
                         text-left flex items-center gap-3 active:scale-95 transition-all"
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

        {/* Unassisted option */}
        <Button
          variant="secondary"
          className="w-full mt-4"
          onClick={handleUnassisted}
        >
          Unassisted
        </Button>
      </div>
    </Modal>
  )
}

export default GoalAssistModal
