import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((msg, type = 'success', duration = 3500) => {
    const id = ++idRef.current
    setToasts((list) => {
      const next = [...list, { id, msg, type }]
      // Garde max 3 toasts à l'écran
      return next.slice(-3)
    })
    setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const colors = {
    error:   { bg:'rgba(255,45,32,0.15)',  border:'rgba(255,45,32,0.45)',  text:'#FF6B63', icon:'⚠️' },
    success: { bg:'rgba(34,197,94,0.15)',  border:'rgba(34,197,94,0.45)',  text:'#22C55E', icon:'✅' },
    info:    { bg:'rgba(59,130,246,0.15)', border:'rgba(59,130,246,0.45)', text:'#60A5FA', icon:'ℹ️' },
  }

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const c = colors[t.type] || colors.success
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              className="toast-enter"
              style={{
                pointerEvents: 'auto',
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
                padding: '12px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                minWidth: 240,
                maxWidth: 420,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ flex: 1 }}>{t.msg}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback silencieux : permet aux pages d'appeler useToast()
    // même si le provider n'est pas mounted (dev / tests)
    return { showToast: () => {}, dismiss: () => {} }
  }
  return ctx
}
