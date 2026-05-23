import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ─────────────────────────────────────────────────────────
// Cache mémoire GET (TTL court) — accélère les re-navigations
// ─────────────────────────────────────────────────────────
const CACHE_TTL_MS = 30_000 // 30 s
const cache = new Map() // key -> { data, expires }

const keyOf = (cfg) => {
  const url = (cfg.baseURL || '') + (cfg.url || '')
  const params = cfg.params ? JSON.stringify(cfg.params) : ''
  return url + '|' + params
}

const invalidateBy = (urlPath) => {
  // Invalide toutes les entrées de cache dont la clé contient l'URL touchée
  // ou son préfixe de ressource (ex: PUT /demandes/3 → invalide /demandes)
  const base = (urlPath || '').split('?')[0]
  const segments = base.split('/').filter(Boolean)
  const root = segments[0] ? '/' + segments[0] : ''
  for (const k of Array.from(cache.keys())) {
    if (root && k.includes(root)) cache.delete(k)
  }
}

export const clearApiCache = () => cache.clear()

// ✅ Ajoute automatiquement le token JWT à chaque requête + cache GET
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Cache uniquement pour les GET, sauf si l'appelant demande explicitement "fresh"
  const method = (config.method || 'get').toLowerCase()
  if (method === 'get' && !config.params?.fresh && !config.headers['x-no-cache']) {
    const key = keyOf(config)
    const hit = cache.get(key)
    if (hit && hit.expires > Date.now()) {
      // Court-circuite la requête réseau via adapter
      config.adapter = () =>
        Promise.resolve({
          data: hit.data,
          status: 200,
          statusText: 'OK (cache)',
          headers: {},
          config,
          request: null,
        })
    }
  }
  return config
})

// ✅ Gère 401 + remplit le cache + invalide sur mutations
api.interceptors.response.use(
  (response) => {
    const cfg = response.config || {}
    const method = (cfg.method || 'get').toLowerCase()
    if (method === 'get' && response.statusText !== 'OK (cache)') {
      cache.set(keyOf(cfg), {
        data: response.data,
        expires: Date.now() + CACHE_TTL_MS,
      })
    } else if (['post', 'put', 'patch', 'delete'].includes(method)) {
      invalidateBy(cfg.url || '')
    }
    return response
  },
  (error) => {
    const url = error.config?.url || ''
    // Un 401 sur /login = mauvais credentials → laisser Login.jsx afficher l'erreur
    // Un 401 sur tout autre endpoint = session JWT expirée → déconnexion forcée
    if (error.response?.status === 401 && !url.endsWith('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api