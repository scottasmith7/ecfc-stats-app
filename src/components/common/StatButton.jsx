import { useState, useCallback } from 'react'
import { STAT_TYPES } from '../../utils/constants'

const StatButton = ({
  statType,
  onClick,
  disabled = false,
  category = 'other',
  compact = false,
  className = ''
}) => {
  const [flash, setFlash] = useState(false)
  const stat = STAT_TYPES[statType]

  const categoryClasses = {
    passing: 'bg-blue-600 hover:bg-blue-500',
    shooting: 'bg-orange-600 hover:bg-orange-500',
    dribbling: 'bg-teal-600 hover:bg-teal-500',
    defending: 'bg-purple-600 hover:bg-purple-500',
    goalkeeper: 'bg-yellow-600 hover:bg-yellow-500 text-black',
    other: 'bg-slate-600 hover:bg-slate-500'
  }

  const handleClick = useCallback(() => {
    if (disabled) return

    // Trigger haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15)
    }

    // Flash animation
    setFlash(true)
    setTimeout(() => setFlash(false), 300)

    onClick?.(statType)
  }, [disabled, onClick, statType])

  const isGoal = statType === 'goal'
  const label = compact ? (stat?.abbrev || stat?.label || statType) : (stat?.label || statType)

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${compact ? 'stat-btn-compact' : 'stat-btn'}
        ${categoryClasses[category]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${flash ? 'flash-green' : ''}
        ${isGoal ? 'font-bold' : ''}
        ${className}
      `}
    >
      {label}
    </button>
  )
}

export default StatButton
