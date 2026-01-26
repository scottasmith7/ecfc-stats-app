import { POSITIONS } from '../../utils/constants'
import { formatPlayingTime } from '../../utils/stats'

const PlayerTile = ({
  player,
  isSelected = false,
  isOnBench = false,
  playingTime = null,
  miniStats = '-',
  onClick,
  size = 'md'
}) => {
  const positions = player.positions || [player.position] || ['MID']
  const primaryPosition = POSITIONS[positions[0]] || POSITIONS.MID
  const positionDisplay = positions.map(p => POSITIONS[p]?.label || p).join('/')

  const sizes = {
    sm: 'min-w-[70px] min-h-[85px] p-1.5',
    md: 'min-w-[80px] min-h-[100px] p-2',
    lg: 'min-w-[90px] min-h-[110px] p-3'
  }

  return (
    <button
      onClick={() => onClick?.(player)}
      className={`
        player-tile
        ${sizes[size]}
        ${isSelected ? 'player-tile-selected' : 'bg-slate-800'}
        ${isOnBench ? 'player-tile-bench' : ''}
        active:scale-95
      `}
    >
      {/* Jersey number */}
      <span className="text-2xl font-bold text-white">
        #{player.jerseyNumber}
      </span>

      {/* Playing time - shown prominently if available */}
      {playingTime !== null && (
        <span className="text-xs text-ecfc-green font-mono font-semibold">
          {formatPlayingTime(playingTime)}
        </span>
      )}

      {/* Mini stats */}
      <span className="text-[10px] text-slate-400 truncate w-full text-center">
        {miniStats}
      </span>

      {/* Position badge */}
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${primaryPosition.color} font-medium`}>
        {positionDisplay}
      </span>
    </button>
  )
}

export default PlayerTile
