// ==================== Chess Engine ====================
// Full rule implementation: castling, en passant, promotion,
// check/checkmate/stalemate, 50-move rule, threefold repetition,
// insufficient material draw.

const WHITE = 'w', BLACK = 'b';

function otherColor(c) { return c === WHITE ? BLACK : WHITE; }

function createInitialBoard() {
  const empty = () => Array(8).fill(null).map(() => Array(8).fill(null));
  const board = empty();
  const backRank = ['R','N','B','Q','K','B','N','R'];
  for (let f = 0; f < 8; f++) {
    board[0][f] = { type: backRank[f], color: WHITE };
    board[1][f] = { type: 'P', color: WHITE };
    board[6][f] = { type: 'P', color: BLACK };
    board[7][f] = { type: backRank[f], color: BLACK };
  }
  return board;
}

// square helpers: rank 0-7 (1-8), file 0-7 (a-h)
function sq(rank, file) { return { rank, file }; }
function inBounds(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }
function sqName(r, f) { return 'abcdefgh'[f] + (r + 1); }
function nameToSq(name) {
  const f = 'abcdefgh'.indexOf(name[0]);
  const r = parseInt(name[1], 10) - 1;
  return { rank: r, file: f };
}

class ChessGame {
  constructor() {
    this.board = createInitialBoard();
    this.turn = WHITE;
    this.castling = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassant = null; // {rank, file} target square behind the pawn that moved 2
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.history = []; // list of move objects (for undo + notation)
    this.positionCounts = {}; // for threefold repetition
    this._recordPosition();
    this.result = null; // null | 'checkmate' | 'stalemate' | 'draw-50' | 'draw-repetition' | 'draw-material' | 'resign' | 'timeout' | 'draw-agreement'
    this.winner = null; // 'w' | 'b' | null (draw)
  }

  clone() {
    const g = new ChessGame();
    g.board = this.board.map(row => row.map(c => c ? { ...c } : null));
    g.turn = this.turn;
    g.castling = { ...this.castling };
    g.enPassant = this.enPassant ? { ...this.enPassant } : null;
    g.halfmoveClock = this.halfmoveClock;
    g.fullmoveNumber = this.fullmoveNumber;
    g.history = this.history.slice();
    g.positionCounts = { ...this.positionCounts };
    g.result = this.result;
    g.winner = this.winner;
    return g;
  }

  pieceAt(r, f) { return this.board[r][f]; }

  _posKey() {
    let s = '';
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const p = this.board[r][f];
        s += p ? p.color + p.type : '.';
      }
    s += '|' + this.turn + '|' + JSON.stringify(this.castling) + '|' + (this.enPassant ? sqName(this.enPassant.rank, this.enPassant.file) : '-');
    return s;
  }

  _recordPosition() {
    const k = this._posKey();
    this.positionCounts[k] = (this.positionCounts[k] || 0) + 1;
    return this.positionCounts[k];
  }

  // Find king square for a color
  findKing(color) {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const p = this.board[r][f];
        if (p && p.type === 'K' && p.color === color) return { rank: r, file: f };
      }
    return null;
  }

  // Is square (r,f) attacked by `byColor`?
  isSquareAttacked(r, f, byColor) {
    // Pawn attacks
    const dir = byColor === WHITE ? -1 : 1; // pawn of byColor attacks from rank r+dir... actually attacker at r+dir? Let's compute squares that attack (r,f)
    const pawnRank = r + (byColor === WHITE ? -1 : 1);
    for (const df of [-1, 1]) {
      const pf = f + df;
      if (inBounds(pawnRank, pf)) {
        const p = this.board[pawnRank][pf];
        if (p && p.color === byColor && p.type === 'P') return true;
      }
    }
    // Knight attacks
    const knightMoves = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
    for (const [dr, df] of knightMoves) {
      const nr = r + dr, nf = f + df;
      if (inBounds(nr, nf)) {
        const p = this.board[nr][nf];
        if (p && p.color === byColor && p.type === 'N') return true;
      }
    }
    // King attacks (adjacent)
    for (let dr = -1; dr <= 1; dr++)
      for (let df = -1; df <= 1; df++) {
        if (dr === 0 && df === 0) continue;
        const nr = r + dr, nf = f + df;
        if (inBounds(nr, nf)) {
          const p = this.board[nr][nf];
          if (p && p.color === byColor && p.type === 'K') return true;
        }
      }
    // Sliding: rook/queen (horiz/vert)
    const rookDirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, df] of rookDirs) {
      let nr = r + dr, nf = f + df;
      while (inBounds(nr, nf)) {
        const p = this.board[nr][nf];
        if (p) {
          if (p.color === byColor && (p.type === 'R' || p.type === 'Q')) return true;
          break;
        }
        nr += dr; nf += df;
      }
    }
    // Sliding: bishop/queen (diag)
    const bishopDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, df] of bishopDirs) {
      let nr = r + dr, nf = f + df;
      while (inBounds(nr, nf)) {
        const p = this.board[nr][nf];
        if (p) {
          if (p.color === byColor && (p.type === 'B' || p.type === 'Q')) return true;
          break;
        }
        nr += dr; nf += df;
      }
    }
    return false;
  }

  inCheck(color) {
    const k = this.findKing(color);
    if (!k) return false;
    return this.isSquareAttacked(k.rank, k.file, otherColor(color));
  }

  // Generate pseudo-legal moves for the piece at (r,f), not checking for self-check
  _pseudoMovesFor(r, f) {
    const p = this.board[r][f];
    if (!p) return [];
    const moves = [];
    const color = p.color;

    if (p.type === 'P') {
      const dir = color === WHITE ? 1 : -1;
      const startRank = color === WHITE ? 1 : 6;
      const promoRank = color === WHITE ? 7 : 0;
      // forward 1
      if (inBounds(r + dir, f) && !this.board[r + dir][f]) {
        moves.push({ to: sq(r + dir, f), promotion: (r + dir === promoRank) });
        // forward 2
        if (r === startRank && !this.board[r + 2 * dir][f]) {
          moves.push({ to: sq(r + 2 * dir, f), doubleStep: true });
        }
      }
      // captures
      for (const df of [-1, 1]) {
        const nr = r + dir, nf = f + df;
        if (inBounds(nr, nf)) {
          const target = this.board[nr][nf];
          if (target && target.color !== color) {
            moves.push({ to: sq(nr, nf), capture: true, promotion: (nr === promoRank) });
          } else if (!target && this.enPassant && this.enPassant.rank === nr && this.enPassant.file === nf) {
            moves.push({ to: sq(nr, nf), capture: true, enPassant: true });
          }
        }
      }
    } else if (p.type === 'N') {
      const knightMoves = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
      for (const [dr, df] of knightMoves) {
        const nr = r + dr, nf = f + df;
        if (inBounds(nr, nf)) {
          const target = this.board[nr][nf];
          if (!target || target.color !== color) moves.push({ to: sq(nr, nf), capture: !!target });
        }
      }
    } else if (p.type === 'B' || p.type === 'R' || p.type === 'Q') {
      let dirs = [];
      if (p.type === 'B') dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
      else if (p.type === 'R') dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      else dirs = [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dr, df] of dirs) {
        let nr = r + dr, nf = f + df;
        while (inBounds(nr, nf)) {
          const target = this.board[nr][nf];
          if (!target) {
            moves.push({ to: sq(nr, nf) });
          } else {
            if (target.color !== color) moves.push({ to: sq(nr, nf), capture: true });
            break;
          }
          nr += dr; nf += df;
        }
      }
    } else if (p.type === 'K') {
      for (let dr = -1; dr <= 1; dr++)
        for (let df = -1; df <= 1; df++) {
          if (dr === 0 && df === 0) continue;
          const nr = r + dr, nf = f + df;
          if (inBounds(nr, nf)) {
            const target = this.board[nr][nf];
            if (!target || target.color !== color) moves.push({ to: sq(nr, nf), capture: !!target });
          }
        }
      // Castling
      const rank = color === WHITE ? 0 : 7;
      if (r === rank && f === 4 && !this.inCheck(color)) {
        // king side
        const kFlag = color === WHITE ? 'wK' : 'bK';
        const qFlag = color === WHITE ? 'wQ' : 'bQ';
        if (this.castling[kFlag] &&
            !this.board[rank][5] && !this.board[rank][6] &&
            this.board[rank][7] && this.board[rank][7].type === 'R' && this.board[rank][7].color === color &&
            !this.isSquareAttacked(rank, 5, otherColor(color)) &&
            !this.isSquareAttacked(rank, 6, otherColor(color))) {
          moves.push({ to: sq(rank, 6), castle: 'K' });
        }
        if (this.castling[qFlag] &&
            !this.board[rank][3] && !this.board[rank][2] && !this.board[rank][1] &&
            this.board[rank][0] && this.board[rank][0].type === 'R' && this.board[rank][0].color === color &&
            !this.isSquareAttacked(rank, 3, otherColor(color)) &&
            !this.isSquareAttacked(rank, 2, otherColor(color))) {
          moves.push({ to: sq(rank, 2), castle: 'Q' });
        }
      }
    }
    return moves;
  }

  // Legal moves for piece at r,f (filters out moves leaving own king in check)
  legalMovesFor(r, f) {
    const p = this.board[r][f];
    if (!p) return [];
    const pseudo = this._pseudoMovesFor(r, f);
    const legal = [];
    for (const m of pseudo) {
      const g2 = this.clone();
      g2._applyMoveRaw(r, f, m.to.rank, m.to.file, m);
      if (!g2.inCheck(p.color)) legal.push(m);
    }
    return legal;
  }

  // All legal moves for current turn, as {from:{rank,file}, to:{rank,file}, ...meta}
  allLegalMoves(color = this.turn) {
    const all = [];
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const p = this.board[r][f];
        if (p && p.color === color) {
          const moves = this.legalMovesFor(r, f);
          for (const m of moves) {
            all.push({ from: sq(r, f), to: m.to, meta: m });
          }
        }
      }
    return all;
  }

  hasAnyLegalMove(color) {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const p = this.board[r][f];
        if (p && p.color === color && this.legalMovesFor(r, f).length > 0) return true;
      }
    return false;
  }

  // Apply move without legality re-check (internal, used by clone-test and real apply)
  _applyMoveRaw(fr, ff, tr, tf, meta) {
    const piece = this.board[fr][ff];
    const captured = this.board[tr][tf];
    this.board[tr][tf] = piece;
    this.board[fr][ff] = null;

    if (meta.enPassant) {
      // captured pawn is behind the destination square
      const capRank = piece.color === WHITE ? tr - 1 : tr + 1;
      this.board[capRank][tf] = null;
    }
    if (meta.castle === 'K') {
      const rank = piece.color === WHITE ? 0 : 7;
      this.board[rank][5] = this.board[rank][7];
      this.board[rank][7] = null;
    }
    if (meta.castle === 'Q') {
      const rank = piece.color === WHITE ? 0 : 7;
      this.board[rank][3] = this.board[rank][0];
      this.board[rank][0] = null;
    }
    if (meta.promotion) {
      piece.type = meta.promoteTo || 'Q';
    }
    return captured;
  }

  // Public: make a move (from UI). promoteTo like 'Q','R','B','N'
  makeMove(fr, ff, tr, tf, promoteTo) {
    const piece = this.board[fr][ff];
    if (!piece || piece.color !== this.turn) return null;
    const pseudo = this.legalMovesFor(fr, ff);
    const meta = pseudo.find(m => m.to.rank === tr && m.to.file === tf);
    if (!meta) return null;
    if (meta.promotion) meta.promoteTo = promoteTo || 'Q';

    const isCapture = !!meta.capture;
    const isPawn = piece.type === 'P';

    // notation before mutating (need pre-state for disambiguation & check for other pieces)
    const san = this._toSAN(fr, ff, tr, tf, meta);

    const captured = this._applyMoveRaw(fr, ff, tr, tf, meta);

    // update castling rights
    if (piece.type === 'K') {
      if (piece.color === WHITE) { this.castling.wK = false; this.castling.wQ = false; }
      else { this.castling.bK = false; this.castling.bQ = false; }
    }
    if (piece.type === 'R') {
      if (fr === 0 && ff === 0) this.castling.wQ = false;
      if (fr === 0 && ff === 7) this.castling.wK = false;
      if (fr === 7 && ff === 0) this.castling.bQ = false;
      if (fr === 7 && ff === 7) this.castling.bK = false;
    }
    // rook captured on original square
    if (tr === 0 && tf === 0) this.castling.wQ = false;
    if (tr === 0 && tf === 7) this.castling.wK = false;
    if (tr === 7 && tf === 0) this.castling.bQ = false;
    if (tr === 7 && tf === 7) this.castling.bK = false;

    // en passant target
    this.enPassant = meta.doubleStep ? { rank: (fr + tr) / 2, file: ff } : null;

    // halfmove clock
    if (isPawn || isCapture) this.halfmoveClock = 0; else this.halfmoveClock++;

    if (this.turn === BLACK) this.fullmoveNumber++;
    this.turn = otherColor(this.turn);

    const moveRecord = {
      from: sqName(fr, ff), to: sqName(tr, tf),
      piece: piece.type, color: piece.color,
      capture: isCapture, captured: captured ? captured.type : (meta.enPassant ? 'P' : null),
      promotion: meta.promotion ? meta.promoteTo : null,
      castle: meta.castle || null,
      enPassant: !!meta.enPassant,
      san, // filled properly below with check/mate suffix
      fenBefore: null,
    };

    // check/checkmate detection for the side to move now
    const repCount = this._recordPosition();
    const oppInCheck = this.inCheck(this.turn);
    const oppHasMove = this.hasAnyLegalMove(this.turn);

    let suffix = '';
    if (oppInCheck && !oppHasMove) { suffix = '#'; this.result = 'checkmate'; this.winner = piece.color; }
    else if (oppInCheck) { suffix = '+'; }
    else if (!oppHasMove) { this.result = 'stalemate'; this.winner = null; }

    if (!this.result && this.halfmoveClock >= 100) { this.result = 'draw-50'; this.winner = null; }
    if (!this.result && repCount >= 3) { this.result = 'draw-repetition'; this.winner = null; }
    if (!this.result && this._insufficientMaterial()) { this.result = 'draw-material'; this.winner = null; }

    moveRecord.san += suffix;
    this.history.push(moveRecord);
    return moveRecord;
  }

  _insufficientMaterial() {
    const pieces = [];
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const p = this.board[r][f];
        if (p && p.type !== 'K') pieces.push(p);
      }
    if (pieces.length === 0) return true;
    if (pieces.length === 1 && (pieces[0].type === 'B' || pieces[0].type === 'N')) return true;
    if (pieces.length === 2 && pieces.every(p => p.type === 'B')) {
      // same colored bishops (rough check skipped for simplicity, still commonly treated as draw only if same square color)
      return false; // conservative: don't auto-draw two bishops
    }
    return false;
  }

  // Basic SAN (algebraic notation) generator
  _toSAN(fr, ff, tr, tf, meta) {
    const piece = this.board[fr][ff];
    if (meta.castle === 'K') return 'O-O';
    if (meta.castle === 'Q') return 'O-O-O';

    const files = 'abcdefgh';
    let s = '';
    if (piece.type === 'P') {
      if (meta.capture) s += files[ff] + 'x';
      s += sqName(tr, tf);
      if (meta.promotion) s += '=' + (meta.promoteTo || 'Q');
    } else {
      s += piece.type;
      // disambiguation: check other same-type pieces of same color that can also move to target
      const others = [];
      for (let r = 0; r < 8; r++)
        for (let f = 0; f < 8; f++) {
          if (r === fr && f === ff) continue;
          const p2 = this.board[r][f];
          if (p2 && p2.type === piece.type && p2.color === piece.color) {
            const moves = this.legalMovesFor(r, f);
            if (moves.some(m => m.to.rank === tr && m.to.file === tf)) others.push({ r, f });
          }
        }
      if (others.length > 0) {
        const sameFile = others.some(o => o.f === ff);
        const sameRank = others.some(o => o.r === fr);
        if (!sameFile) s += files[ff];
        else if (!sameRank) s += (fr + 1);
        else s += files[ff] + (fr + 1);
      }
      if (meta.capture) s += 'x';
      s += sqName(tr, tf);
    }
    return s;
  }

  toFEN() {
    let fen = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.board[r][f];
        if (!p) { empty++; continue; }
        if (empty > 0) { fen += empty; empty = 0; }
        const ch = p.type;
        fen += p.color === WHITE ? ch : ch.toLowerCase();
      }
      if (empty > 0) fen += empty;
      if (r > 0) fen += '/';
    }
    fen += ' ' + this.turn;
    let cast = '';
    if (this.castling.wK) cast += 'K';
    if (this.castling.wQ) cast += 'Q';
    if (this.castling.bK) cast += 'k';
    if (this.castling.bQ) cast += 'q';
    fen += ' ' + (cast || '-');
    fen += ' ' + (this.enPassant ? sqName(this.enPassant.rank, this.enPassant.file) : '-');
    fen += ' ' + this.halfmoveClock + ' ' + this.fullmoveNumber;
    return fen;
  }
}

// Export for both module and non-module (browser script tag) use
if (typeof module !== 'undefined') module.exports = { ChessGame, WHITE, BLACK, sqName, nameToSq };
