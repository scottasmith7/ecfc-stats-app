import { useEffect, useState } from 'react'

const Toast = ({ message, duration = 2000, onClose }) => {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true)
    }, duration - 300)

    const closeTimer = setTimeout(() => {
      onClose()
    }, duration)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  return (
    <div
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-50
        bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg
        ${exiting ? 'toast-exit' : 'toast-enter'}
      `}
    >
      {message}
    </div>
  )
}

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  )
}

// Hook to manage toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, duration = 2000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, duration }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, removeToast }
}

export default Toast
