import PlayerTile from '../common/PlayerTile'
import { generateMiniStatLine, calculateSecondsPlayed, formatPlayingTime } from '../../utils/stats'

const PlayerGrid = ({
  players,
  activePlayerIds,
  selectedPlayerId,
  playerEvents,
  playerLineups = {},
  clockTime = 0,
  onSelectPlayer,
  compact = false
}) => {
  // Separate active and bench players
  const activePlayers = players.filter(p => activePlayerIds.includes(p.id))
  const benchPlayers = players.filter(p => !activePlayerIds.includes(p.id))

  // Calculate playing time for a player
  const getPlayingTime = (playerId) => {
    const lineups = playerLineups[playerId] || []
    if (lineups.length === 0) return null
    return calculateSecondsPlayed(lineups, clockTime, 'live')
  }

  if (compact) {
    // Compact landscape mode - vertical scrolling list on left side
    return (
      <div className="flex flex-col min-h-0 h-full bg-slate-900">
        {/* Active players - scrollable vertical grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="text-[10px] text-slate-500 px-1.5 pt-1 font-semibold sticky top-0 bg-slate-900 z-10">
            ON ({activePlayers.length})
          </div>
          <div className="grid grid-cols-2 gap-0.5 p-0.5">
            {activePlayers.map(player => (
              <CompactPlayerTile
                key={player.id}
                player={player}
                isSelected={player.id === selectedPlayerId}
                playingTime={getPlayingTime(player.id)}
                miniStats={generateMiniStatLine(playerEvents[player.id] || [])}
                onClick={() => onSelectPlayer(player.id)}
              />
            ))}
          </div>

          {/* Bench players */}
          {benchPlayers.length > 0 && (
            <>
              <div className="text-[10px] text-slate-500 px-1.5 pt-1 font-semibold sticky top-0 bg-slate-900 z-10">
                BENCH ({benchPlayers.length})
              </div>
              <div className="grid grid-cols-2 gap-0.5 p-0.5">
                {benchPlayers.map(player => (
                  <CompactPlayerTile
                    key={player.id}
                    player={player}
                    isSelected={player.id === selectedPlayerId}
                    isOnBench={true}
                    playingTime={getPlayingTime(player.id)}
                    miniStats={generateMiniStatLine(playerEvents[player.id] || [])}
                    onClick={() => onSelectPlayer(player.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Portrait mode - original horizontal scrolling layout
  return (
    <div className="bg-slate-900 border-b border-slate-700">
      {/* Active players - scrollable row */}
      <div className="p-2">
        <div className="text-xs text-slate-500 mb-1 px-1">ON FIELD ({activePlayers.length})</div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {activePlayers.map(player => (
            <PlayerTile
              key={player.id}
              player={player}
              isSelected={player.id === selectedPlayerId}
              playingTime={getPlayingTime(player.id)}
              miniStats={generateMiniStatLine(playerEvents[player.id] || [])}
              onClick={() => onSelectPlayer(player.id)}
            />
          ))}
        </div>
      </div>

      {/* Bench players - if any */}
      {benchPlayers.length > 0 && (
        <div className="p-2 pt-0">
          <div className="text-xs text-slate-500 mb-1 px-1">BENCH ({benchPlayers.length})</div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {benchPlayers.map(player => (
              <PlayerTile
                key={player.id}
                player={player}
                isSelected={player.id === selectedPlayerId}
                isOnBench={true}
                playingTime={getPlayingTime(player.id)}
                miniStats={generateMiniStatLine(playerEvents[player.id] || [])}
                onClick={() => onSelectPlayer(player.id)}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Truncate name to fit compact tile
const truncateName = (name, maxLength = 8) => {
  if (!name) return ''
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength - 1) + '…'
}

// Compact player tile for landscape mode
const CompactPlayerTile = ({
  player,
  isSelected = false,
  isOnBench = false,
  playingTime = null,
  miniStats = '-',
  onClick
}) => {
  const displayName = truncateName(player.name || player.firstName || '', 8)

  return (
    <button
      onClick={onClick}
      className={`
        p-1 rounded-md border-2 transition-all duration-150 active:scale-95
        flex flex-col items-center justify-center min-h-[52px]
        ${isSelected ? 'border-ecfc-green bg-slate-700' : 'border-transparent bg-slate-800'}
        ${isOnBench ? 'opacity-50' : ''}
      `}
    >
      {/* Player name - primary */}
      <span className="text-[11px] font-semibold text-white leading-none truncate w-full text-center">
        {displayName}
      </span>

      {/* Jersey number - secondary */}
      <span className="text-[9px] text-slate-400 leading-tight">
        #{player.jerseyNumber}
      </span>

      {/* Playing time */}
      {playingTime !== null && (
        <span className="text-[9px] text-ecfc-green font-mono leading-tight">
          {formatPlayingTime(playingTime)}
        </span>
      )}

      {/* Mini stats */}
      <span className="text-[8px] text-slate-500 truncate w-full text-center leading-tight">
        {miniStats}
      </span>
    </button>
  )
}

export default PlayerGrid
