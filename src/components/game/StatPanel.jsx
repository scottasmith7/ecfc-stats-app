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
    // Compact landscape mode - all stats visible without scrolling
    // Group stats into rows by category for better organization
    const statRows = [
      { categories: ['passing'], label: 'PASS' },
      { categories: ['shooting', 'dribbling'], label: 'ATTACK' },
      { categories: ['defending'], label: 'DEF' },
      { categories: ['other', ...(isGoalkeeper ? ['goalkeeper'] : [])], label: 'OTHER' }
    ]

    return (
      <div className="flex-1 flex flex-col min-h-0 p-1.5 gap-1">
        {/* Selected player indicator - minimal */}
        <div className="text-center py-0.5 shrink-0">
          {selectedPlayer ? (
            <span className="text-xs font-semibold text-ecfc-green">
              #{selectedPlayer.jerseyNumber} {selectedPlayer.name.split(' ')[0]}
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Tap player to record
            </span>
          )}
        </div>

        {/* Stat buttons organized in rows - no scrolling */}
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          {statRows.map((row, rowIndex) => {
            const rowStats = row.categories.flatMap(catKey => {
              const category = STAT_CATEGORIES[catKey]
              if (!category) return []
              return category.stats.map(statType => ({ statType, category: catKey }))
            })

            if (rowStats.length === 0) return null

            return (
              <div key={rowIndex} className="flex gap-1 flex-1 min-h-0">
                {/* Row label */}
                <div className="w-10 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500 font-semibold -rotate-90 whitespace-nowrap">
                    {row.label}
                  </span>
                </div>
                {/* Stat buttons */}
                <div className="flex-1 flex gap-1">
                  {rowStats.map(({ statType, category }) => (
                    <StatButton
                      key={statType}
                      statType={statType}
                      category={category}
                      disabled={disabled || !selectedPlayer}
                      onClick={() => onStatRecord(statType)}
                      compact={true}
                      className="flex-1"
                    />
                  ))}
                </div>
              </div>
            )
          })}
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
