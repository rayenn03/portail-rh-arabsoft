import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FloatingChatbot from './FloatingChatbot'

export default function Layout({ children, title }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{globalCSS}</style>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-w, 240px)', flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.25s ease' }}>
        <Topbar title={title} />
        <div className="page-enter" style={{ flex: 1, padding: '32px' }}>
          {children}
        </div>
      </div>
      <FloatingChatbot />
    </div>
  )
}

const globalCSS = `
  /* ── Keyframes ─────────────────────────────────── */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(12px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position:  200% 0; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(60px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.05); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Page transition ────────────────────────────── */
  .page-enter { animation: fadeIn 0.25s ease-out; }

  /* ── Cards ──────────────────────────────────────── */
  .card-hover {
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
    cursor: default;
  }
  .card-hover:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5) !important;
    border-color: var(--border2) !important;
  }

  /* ── Navigation sidebar ─────────────────────────── */
  .nav-item {
    transition: background 0.15s, color 0.15s !important;
    border-radius: 8px !important;
    margin: 0 8px !important;
    padding: 10px 12px !important;
  }
  .nav-item:hover {
    background: var(--border) !important;
    color: var(--text) !important;
  }

  /* ── Buttons ────────────────────────────────────── */
  .btn-hover {
    transition: transform 0.15s ease, opacity 0.15s ease !important;
  }
  .btn-hover:hover {
    transform: translateY(-1px) !important;
    opacity: 0.88 !important;
  }
  .btn-hover:active {
    transform: translateY(1px) !important;
    opacity: 1 !important;
  }

  /* ── Table rows ─────────────────────────────────── */
  .table-row {
    transition: background 0.12s ease !important;
  }
  .table-row:hover {
    background: var(--surface) !important;
  }

  /* ── Inputs ─────────────────────────────────────── */
  .input-glass {
    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
  }
  .input-glass:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px rgba(255,45,32,0.15) !important;
    outline: none !important;
  }

  /* ── Modals ─────────────────────────────────────── */
  .modal-enter { animation: modalIn 0.2s ease-out; }

  /* ── Toasts ─────────────────────────────────────── */
  .toast-enter { animation: toastIn 0.3s ease-out; }

  /* ── Skeleton shimmer ───────────────────────────── */
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--surface) 25%,
      var(--border) 50%,
      var(--surface) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 10px;
  }

  /* ── Chatbot quick-reply ────────────────────────── */
  .qr-btn {
    transition: background 0.15s, border-color 0.15s !important;
  }
  .qr-btn:hover {
    background: var(--border2) !important;
    border-color: var(--border2) !important;
  }

  /* ── FAB ────────────────────────────────────────── */
  .fab-hover {
    transition: transform 0.2s ease !important;
  }
  .fab-hover:hover {
    transform: scale(1.10) !important;
  }

  /* ── Notif items ────────────────────────────────── */
  .notif-item {
    transition: background 0.12s ease !important;
  }
  .notif-item:hover {
    background: var(--surface) !important;
  }

  /* ── Scrollbar dark ─────────────────────────────── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border2); }

  /* ── Text selection ─────────────────────────────── */
  ::selection { background: rgba(255,45,32,0.20); color: white; }

  /* ── Select option dark ─────────────────────────── */
  select option { background: #0F0F1A; color: var(--text); }
`
