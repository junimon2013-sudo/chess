// ==================== Stockfish analysis wrapper ====================
// Loads Stockfish 10 (WASM/asm.js hybrid build) as a Web Worker and provides
// a simple promise-based API for evaluating positions. Used by the post-game
// Review feature to grade each move and suggest better alternatives.
//
// Stockfish 10 is used (rather than the newest version) because it runs as a
// single plain script (no CORS/COEP headers required, no SharedArrayBuffer),
// which is the safest choice for an arbitrary static-file deployment.

const STOCKFISH_CDN_URL = 'https://unpkg.com/stockfish@10.0.2/src/stockfish.js';

class StockfishAnalyzer {
  constructor() {
    this.worker = null;
    this.ready = false;
    this._readyResolvers = [];
  }

  async _ensureLoaded() {
    if (this.worker) return;
    this.worker = new Worker(STOCKFISH_CDN_URL);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('분석 엔진을 불러오는 데 시간이 너무 오래 걸려요.')), 15000);
      const onMessage = (e) => {
        const line = e.data;
        if (typeof line === 'string' && line.includes('uciok')) {
          clearTimeout(timeout);
          this.worker.removeEventListener('message', onMessage);
          this.ready = true;
          resolve();
        }
      };
      this.worker.addEventListener('message', onMessage);
      this.worker.addEventListener('error', (e) => {
        clearTimeout(timeout);
        reject(new Error('분석 엔진 로드에 실패했어요.'));
      });
      this.worker.postMessage('uci');
    });
  }

  // Analyzes a FEN position to a fixed depth, resolving with:
  // { scoreCp: number|null, mateIn: number|null, bestMoveUci: string }
  // scoreCp is in centipawns from the perspective of the side to move.
  // If the engine reports mate, mateIn is set instead (positive = side to move mates).
  async analyzeFEN(fen, depth = 12) {
    await this._ensureLoaded();
    return new Promise((resolve) => {
      let lastScoreCp = null;
      let lastMateIn = null;
      let bestMoveUci = null;

      const onMessage = (e) => {
        const line = e.data;
        if (typeof line !== 'string') return;
        if (line.startsWith('info') && line.includes('score')) {
          const cpMatch = line.match(/score cp (-?\d+)/);
          const mateMatch = line.match(/score mate (-?\d+)/);
          if (cpMatch) { lastScoreCp = parseInt(cpMatch[1], 10); lastMateIn = null; }
          if (mateMatch) { lastMateIn = parseInt(mateMatch[1], 10); lastScoreCp = null; }
        }
        if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          bestMoveUci = parts[1] || null;
          this.worker.removeEventListener('message', onMessage);
          resolve({ scoreCp: lastScoreCp, mateIn: lastMateIn, bestMoveUci });
        }
      };
      this.worker.addEventListener('message', onMessage);
      this.worker.postMessage('position fen ' + fen);
      this.worker.postMessage('go depth ' + depth);
    });
  }

  terminate() {
    if (this.worker) { this.worker.terminate(); this.worker = null; this.ready = false; }
  }
}

// ---- Move classification ----
// Compares the position's evaluation before and after a move (both from the
// mover's perspective) and classifies the move quality.
// `beforeCp`/`afterCp`: centipawn eval from the perspective of the player who
// is about to move / just moved, respectively (both normalized to "mover's POV").
// Returns one of: 'best', 'good', 'inaccuracy', 'mistake', 'blunder'.
function classifyMove(evalBeforeCp, evalAfterCp, wasMateBefore, wasMateAfterForOpponent) {
  // If the position was winning by mate for the mover and still is, it's fine.
  if (wasMateBefore && wasMateBefore > 0 && (!wasMateAfterForOpponent || wasMateAfterForOpponent < 0)) {
    // had a forced mate and let it slip is handled by caller via cp fallback
  }
  const delta = evalAfterCp - evalBeforeCp; // negative = position got worse for the mover
  if (delta >= -20) return 'best';
  if (delta >= -50) return 'good';
  if (delta >= -120) return 'inaccuracy';
  if (delta >= -300) return 'mistake';
  return 'blunder';
}

if (typeof module !== 'undefined') module.exports = { StockfishAnalyzer, classifyMove };
