/**
 * Космические тона карточек — приглушённые, единый источник правды.
 * Используются через CSS-переменную --tint вместе с классом .card-cosmic:
 *   <article className="card-cosmic rounded-card border" style={{ "--tint": TINT.nebula }}>
 */
export const TINT = {
  nebula: "#5B8CFF", // сине-фиолетовый
  violet: "#9B7DFF", // фиолетовый
  ion: "#4FD1E0", // бирюзовый
  solar: "#E8B368", // янтарный
  aurora: "#58D6A0", // изумрудный
  mars: "#E87D9B", // розовый
} as const;

export type Tint = (typeof TINT)[keyof typeof TINT];
