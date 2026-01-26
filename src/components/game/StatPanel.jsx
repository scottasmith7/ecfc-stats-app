import StatButton from '../common/StatButton'
import { STAT_CATEGORIES } from '../../utils/constants'

const StatPanel = ({
  selectedPlayer,
  onStatRecord,
  disabled = false,
  compact = false
}) => {
  const positions = selectedPlayer?.positions || [selectedPlayer?.position] || []
  const isGoalkeeper = positions.includes('GK')

  if (compact) {
    // Compact landscape mode - all stats in tight grid, no scrolling
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Selected player indicator - minimal */}
        <div className="text-center py-1 bg-slate-800 border-b border-slate-700 shrink-0">
          {selectedPlayer ? (
            <span className="text-sm font-semibold text-ecfc-green">
              #{selectedPlayer.jerseyNumber} {selectedPlayer.name.split(' ')[0]}
            </span>
          ) : (
            <span className="text-sm text-slate-400">
              Tap player to record
            </span>
          )}
        </div>

        {/* All stat buttons in compact grid */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(STAT_CATEGORIES).map(([key, category]) => {
              // Hide GK stats if not a goalkeeper
              if (key === 'goalkeeper' && selectedPlayer && !isGoalkeeper) {
                return null
              }

              return category.stats.map(statType => (
                <StatButton
                  key={statType}
                  statType={statType}
                  category={key}
                  disabled={disabled || !selectedPlayer}
                  onClick={() => onStatRecord(statType)}
                  compact={true}
                />
              ))
            })}
          </div>
        </div>
      </div>
    )
  }

  // Portrait mode - original layout with categories
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {/* Selected player indicator */}
      <div className="text-center py-2 bg-slate-800 rounded-lg">
        {selectedPlayer ? (
          <span className="text-lg font-semibold text-ecfc-green">
            Selected: #{selectedPlayer.jerseyNumber} {selectedPlayer.name}
          </span>
        ) : (
          <span className="text-lg text-slate-400">
            Tap a player to record stats
          </span>
        )}
      </div>

      {/* Stat categories */}
      {Object.entries(STAT_CATEGORIES).map(([key, category]) => {
        // Hide GK stats if not a goalkeeper, unless on bench/no selection
        if (key === 'goalkeeper' && selectedPlayer && !isGoalkeeper) {
          return null
        }

        return (
          <div key={key}>
            <div className="text-xs text-slate-500 mb-2 font-semibold">
              {category.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {category.stats.map(statType => (
                <StatButton
                  key={statType}
                  statType={statType}
                  category={key}
                  disabled={disabled || !selectedPlayer}
                  onClick={() => onStatRecord(statType)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatPanel
