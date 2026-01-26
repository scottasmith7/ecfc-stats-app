import { useState } from 'react'
import { formatTime, STAT_TYPES } from '../../utils/constants'
import Button from '../common/Button'

const UndoPanel = ({
  events,
  players,
  onUndo,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false)

  // Get last 3 events
  const recentEvents = [...events]
    .sort((a, b) => b.gameTime - a.gameTime)
    .slice(0, 3)

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId)
    return player ? `#${player.jerseyNumber}` : '?'
  }

  const getEventLabel = (eventType) => {
    return STAT_TYPES[eventType]?.abbrev || STAT_TYPES[eventType]?.label || eventType
  }

  if (recentEvents.length === 0) {
    if (compact) {
      return (
        <div className="px-2 py-1.5 border-t border-slate-700 bg-slate-800">
          <span className="text-xs text-slate-500">No events yet</span>
        </div>
      )
    }
    return (
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800">
        <Button variant="secondary" disabled className="w-full">
          ↩ No events to undo
        </Button>
      </div>
    )
  }

  // Compact mode - single line with last event
  if (compact) {
    const lastEvent = recentEvents[0]
    return (
      <div className="px-2 py-1.5 border-t border-slate-700 bg-slate-800 flex items-center gap-2">
        <span className="text-xs text-slate-500">Last:</span>
        <span className="text-xs text-slate-300 flex-1 truncate">
          {formatTime(lastEvent.gameTime)} {getPlayerName(lastEvent.playerId)} {getEventLabel(lastEvent.eventType)}
        </span>
        <button
          onClick={() => onUndo(lastEvent.id)}
          className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded min-h-[32px] flex items-center"
        >
          ↩ Undo
        </button>
      </div>
    )
  }

  // Portrait mode - expandable panel
  return (
    <div className="border-t border-slate-700 bg-slate-800">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-slate-400 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <span>↩ Undo</span>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
            {recentEvents.length} recent
          </span>
        </span>
        <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expanded event list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {recentEvents.map(event => (
            <div
              key={event.id}
              className="flex items-center justify-between bg-slate-700 rounded-lg p-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {formatTime(event.gameTime)}
                </span>
                <span className="font-medium">
                  {getPlayerName(event.playerId)}
                </span>
                <span className="text-slate-400">
                  {STAT_TYPES[event.eventType]?.label || event.eventType}
                </span>
              </div>
              <button
                onClick={() => onUndo(event.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UndoPanel
