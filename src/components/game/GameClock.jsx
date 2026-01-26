import { formatTime } from '../../utils/constants'
import Button from '../common/Button'

const GameClock = ({
  clockTime,
  isRunning,
  currentHalf,
  isPastHalfLength,
  onToggle,
  onEndHalf,
  onSubs,
  homeScore,
  awayScore,
  opponent,
  compact = false
}) => {
  if (compact) {
    // Compact landscape mode - single row, minimal height
    return (
      <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center gap-3 shrink-0">
        {/* Score */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ecfc-green">ECFC</span>
          <span className="text-xl font-bold text-white">
            {homeScore} - {awayScore}
          </span>
          <span className="text-sm font-bold text-slate-400 truncate max-w-[60px]">{opponent}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-600" />

        {/* Clock */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">
            {currentHalf === 1 ? '1H' : '2H'}
          </span>
          <span className={`text-xl font-mono font-bold ${isPastHalfLength ? 'text-red-400' : 'text-white'}`}>
            {formatTime(clockTime)}
          </span>
          {isPastHalfLength && (
            <span className="text-xs text-red-400">+</span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggle}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm min-h-[36px] transition-all active:scale-95 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {isRunning ? '⏸' : '▶'}
          </button>
          <button
            onClick={onSubs}
            className="px-3 py-1.5 rounded-lg font-medium text-sm min-h-[36px] bg-slate-700 hover:bg-slate-600 text-white transition-all active:scale-95"
          >
            Subs
          </button>
          <button
            onClick={onEndHalf}
            className="px-2 py-1.5 rounded-lg font-medium text-xs min-h-[36px] bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all active:scale-95"
          >
            {currentHalf === 1 ? 'End 1st' : 'End'}
          </button>
        </div>
      </div>
    )
  }

  // Portrait mode - original layout
  return (
    <div className="bg-slate-800 p-3 border-b border-slate-700">
      {/* Score line */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <span className="text-xl font-bold text-ecfc-green">ECFC</span>
        <span className="text-3xl font-bold text-white">
          {homeScore} - {awayScore}
        </span>
        <span className="text-xl font-bold text-slate-400">{opponent}</span>
      </div>

      {/* Clock controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {currentHalf === 1 ? '1st Half' : '2nd Half'}
          </span>
          <span className={`text-2xl font-mono font-bold ${isPastHalfLength ? 'text-red-400' : 'text-white'}`}>
            {formatTime(clockTime)}
          </span>
          {isPastHalfLength && (
            <span className="text-xs text-red-400">+</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onToggle}
            variant={isRunning ? 'danger' : 'success'}
            size="sm"
            className="min-w-[70px]"
          >
            {isRunning ? '⏸ Pause' : '▶ Play'}
          </Button>
          <Button
            onClick={onSubs}
            variant="secondary"
            size="sm"
          >
            Subs
          </Button>
          <Button
            onClick={onEndHalf}
            variant="outline"
            size="sm"
          >
            {currentHalf === 1 ? 'End 1st' : 'End Game'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default GameClock
