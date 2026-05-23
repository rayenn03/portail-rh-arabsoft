// ─── Client WebSocket Laravel Echo + Pusher-JS ─────────────────────────────
// Utilise Laravel Reverb (serveur WS officiel Laravel 12).
// Si Reverb n'est pas lancé, échoue silencieusement (pas de boucle de reconnexion).

let EchoCtor = null
let Pusher   = null
let loadingPromise = null

async function loadLibs() {
  if (EchoCtor && Pusher) return true
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      const echoMod   = await import('laravel-echo')
      const pusherMod = await import('pusher-js')
      EchoCtor = echoMod.default
      Pusher   = pusherMod.default
      window.Pusher = Pusher
      return true
    } catch {
      return false
    }
  })()
  return loadingPromise
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createEcho(token) {
  const state = { echo: null, pending: [], destroyed: false }

  loadLibs().then((ok) => {
    // Ne pas créer la connexion si disconnect() a déjà été appelé
    if (!ok || state.destroyed) return
    try {
      // Désactiver la reconnexion automatique pour éviter les boucles
      // quand Reverb n'est pas démarré
      state.echo = new EchoCtor({
        broadcaster:        'reverb',
        key:                 import.meta.env.VITE_REVERB_APP_KEY  || 'localkey',
        wsHost:              import.meta.env.VITE_REVERB_HOST     || '127.0.0.1',
        wsPort:     Number(  import.meta.env.VITE_REVERB_PORT     || 8080),
        wssPort:    Number(  import.meta.env.VITE_REVERB_PORT     || 8080),
        forceTLS:           (import.meta.env.VITE_REVERB_SCHEME   || 'http') === 'https',
        enabledTransports:  ['ws', 'wss'],
        // ↓ Limite les tentatives de reconnexion (évite le flood console)
        activityTimeout:     30000,
        pongTimeout:         10000,
        unavailableTimeout:  10000,
        authEndpoint:        import.meta.env.VITE_BROADCAST_AUTH
                             || ((import.meta.env.VITE_API_URL || 'http://localhost:8000/api') + '/broadcasting/auth'),
        auth: { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
      })

      // Ignorer silencieusement les erreurs de connexion (Reverb non démarré)
      state.echo.connector?.pusher?.connection?.bind('error', () => {})
      state.echo.connector?.pusher?.connection?.bind('failed', () => {})

      if (state.destroyed) {
        // Démonté entre temps → déconnecter immédiatement
        state.echo.disconnect()
        return
      }

      state.pending.forEach(fn => fn(state.echo))
      state.pending = []
    } catch {
      // Reverb non disponible — ignore silencieusement
    }
  })

  return {
    private(channelName) {
      const handlers = []
      let channel = null

      const applyOn = (echo) => {
        try {
          channel = echo.private(channelName)
          handlers.forEach(({ event, cb }) => channel.listen(event, cb))
        } catch {}
      }

      if (state.echo) applyOn(state.echo)
      else state.pending.push(applyOn)

      return {
        listen(event, cb) {
          handlers.push({ event, cb })
          if (channel) { try { channel.listen(event, cb) } catch {} }
          return this
        }
      }
    },

    leave(channelName) {
      try { state.echo?.leave(channelName) } catch {}
    },

    disconnect() {
      state.destroyed = true
      try { state.echo?.disconnect() } catch {}
      state.echo    = null
      state.pending = []
    }
  }
}
