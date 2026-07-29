// SVG piece definitions, Chess.com-style (Neo-ish) silhouettes.
// Each is a function(color) => svg string, color: 'w' | 'b'

function pieceColors(color) {
  return color === 'w'
    ? { fill: '#f5f2ea', stroke: '#3a3630', accent: '#b8b2a0' }
    : { fill: '#2b2b2b', stroke: '#000000', accent: '#000000' };
}

const PIECE_SVG = {
  P: (color) => {
    const c = pieceColors(color);
    return `<svg viewBox="0 0 45 45"><g fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.02-2.49 1.14-6.41 4.6-6.41 9.98h20c0-5.38-3.92-8.84-6.41-9.98C27.06 24.84 28 23.03 28 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/>
    </g></svg>`;
  },
  R: (color) => {
    const c = pieceColors(color);
    return `<svg viewBox="0 0 45 45"><g fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"/>
      <path d="M34 14l-3 3H14l-3-3"/>
      <path d="M31 17v12H14V17"/>
      <path d="M31 29l1.5 2.5h-18L16 29"/>
      <path d="M11 14h23"/>
    </g></svg>`;
  },
  N: (color) => {
    const c = pieceColors(color);
    return `<svg viewBox="0 0 45 45"><g fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
      <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/>
      <circle cx="9.5" cy="25.5" r="0.5" fill="${c.stroke}"/>
      <circle cx="15" cy="15.5" r="0.5" fill="${c.stroke}"/>
    </g></svg>`;
  },
  B: (color) => {
    const c = pieceColors(color);
    return `<svg viewBox="0 0 45 45"><g fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M22.5 8a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
      <path d="M17.5 26h10M15 30h15" stroke-linecap="round"/>
    </g></svg>`;
  },
  Q: (color) => {
    const c = pieceColors(color);
    return `<svg viewBox="0 0 45 45"><g fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round">
      <circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/>
      <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5-7 11-.3-13.5-5.5 12-3.7-14.5-3.7 14.5-5.5-12-.3 13.5-7-11L9 26z"/>
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-19.5-1.5-27 0z"/>
      <path d="M11 38.5a35 35 0 0023 0" stroke-linecap="round"/>
    </g></svg>`;
  },
  K: (color) => {
    const c = pieceColors(color);
    return `<svg viewBox="0 0 45 45"><g fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M22.5 11.63V6M20 8h5" stroke-linecap="round"/>
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>
      <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z"/>
      <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/>
    </g></svg>`;
  }
};

function pieceSVG(type, color) {
  return PIECE_SVG[type] ? PIECE_SVG[type](color) : '';
}

if (typeof module !== 'undefined') module.exports = { pieceSVG };
