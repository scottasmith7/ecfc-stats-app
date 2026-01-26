import { useCallback } from 'react'

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  haptic = true,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-ecfc-blue hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-700 text-white',
    outline: 'bg-transparent border-2 border-slate-600 hover:border-slate-500 text-white'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]'
  }

  const handleClick = useCallback((e) => {
    if (disabled) return

    // Trigger haptic feedback if supported
    if (haptic && navigator.vibrate) {
      navigator.vibrate(10)
    }

    onClick?.(e)
  }, [disabled, haptic, onClick])

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
