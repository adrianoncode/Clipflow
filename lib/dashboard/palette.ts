/**
 * Crextio cream/yellow/charcoal palette for the analytics dashboard.
 * The Dashboard intentionally departs from the rest of Clipflow's
 * violet identity — these tokens stay in one place so a single edit
 * re-tones every chart card together.
 */
export const DASHBOARD_PALETTE = {
  pageBg: 'linear-gradient(125deg, #B5B8C2 0%, #D4D1BE 32%, #EDDB8B 100%)',
  cardCream: '#F9F4DC',
  cardWhite: '#FFFFFF',
  yellow: '#F4D93D',
  yellowSoft: '#F9E97A',
  yellowDeep: '#DCB91F',
  yellowGold: '#F0CC2A',
  charcoal: '#0F0F0F',
  ink: '#0F0F0F',
  inkSoft: '#2A2A2A',
  muted: '#7A7468',
  border: 'rgba(15, 15, 15, 0.06)',
  borderStrong: 'rgba(15, 15, 15, 0.14)',
  trackBg: 'rgba(15, 15, 15, 0.06)',
  cardInset: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
  cardHoverShadow: '0 12px 32px rgba(15, 15, 15, 0.06)',
} as const
