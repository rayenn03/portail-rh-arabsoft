// ─── constants/demandes.js ──────────────────────────────────────────────────
// Labels et classes CSS partagés entre Demandes.jsx et AllDemandes.jsx

export const TYPE_LABEL = {
  conge:        'Congé',
  pret:         'Prêt',
  situation:    'Situation',
  autorisation: 'Autorisation',
  document:     'Document',
}

export const STATUT_LABEL = {
  en_attente:     'En attente',
  approuvee:      'Approuvée',
  approuvee_direct: 'Approuvée',
  refusee:        'Rejetée',
  valide_chef:    'Validée chef',
}

// Correspond aux classes CSS dans shared.module.css
export const TYPE_CSS = {
  conge:        'badgeConge',
  pret:         'badgePret',
  situation:    'badgeSituation',
  autorisation: 'badgeAutorisation',
  document:     'badgeDocument',
}

export const STATUT_CSS = {
  en_attente:       'statusEnAttente',
  approuvee:        'statusApprouvee',
  approuvee_direct: 'statusApprouveeDir',
  refusee:          'statusRefusee',
  valide_chef:      'statusValideChef',
}
