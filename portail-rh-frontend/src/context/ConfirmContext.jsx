import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null) // { title, message, confirmText, cancelText, danger }
  const resolverRef = useRef(null)

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({
        title: opts.title || 'Confirmation',
        message: opts.message || 'Êtes-vous sûr ?',
        confirmText: opts.confirmText || 'Confirmer',
        cancelText: opts.cancelText || 'Annuler',
        danger: !!opts.danger,
      })
    })
  }, [])

  const close = (result) => {
    setState(null)
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          onClick={(e) => e.target === e.currentTarget && close(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="modal-enter"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
              width: '100%',
              maxWidth: 440,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontFamily: '"Instrument Serif", serif',
                color: 'var(--text)',
                marginBottom: 8,
              }}
            >
              {state.title}
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--text2)',
                marginBottom: 24,
                lineHeight: 1.55,
              }}
            >
              {state.message}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => close(false)}
                className="btn-hover"
                style={{
                  padding: '10px 18px',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {state.cancelText}
              </button>
              <button
                onClick={() => close(true)}
                className="btn-hover"
                style={{
                  padding: '10px 18px',
                  background: state.danger ? 'var(--accent)' : 'var(--text)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    // Fallback : confirm natif si le provider n'est pas mounted
    return { confirm: async (opts) => window.confirm(opts.message || 'Confirmer ?') }
  }
  return ctx
}
