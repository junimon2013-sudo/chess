// ==================== PGN parser ====================
// Parses a PGN string into headers + a list of SAN move tokens, then replays
// them through our own ChessGame engine so the resulting move records use the
// exact same shape as a live game's history (needed for the Review screen).

function parsePGNHeaders(pgnText) {
  const headers = {};
  const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let m;
  while ((m = headerRegex.exec(pgnText)) !== null) {
    headers[m[1]] = m[2];
  }
  return headers;
}

function parsePGNMoves(pgnText) {
  const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let body = pgnText.replace(headerRegex, '').trim();
  body = body.replace(/\{[^}]*\}/g, '');       // strip comments
  body = body.replace(/\([^)]*\)/g, '');       // strip variations
  body = body.replace(/\$\d+/g, '');           // strip NAG annotations like $1
  body = body.replace(/\d+\.(\.\.)?/g, ' ');   // strip move numbers
  body = body.replace(/1-0|0-1|1\/2-1\/2|\*/g, ' '); // strip result tokens
  return body.split(/\s+/).map(s => s.trim()).filter(Boolean);
}

// Replays a list of SAN tokens through a fresh ChessGame, matching each token
// (with any trailing +/# stripped, since our own SAN generator produces those
// suffixes itself) against the engine's legal moves. Returns either
// { ok: true, game, records } or { ok: false, failedAt, movesPlayed }.
function replayPGNMoves(sanMoves) {
  const g = new ChessGame();
  const records = [];
  for (const rawSan of sanMoves) {
    const cleanSan = rawSan.replace(/[+#]/g, '');
    const promoMatch = cleanSan.match(/=([QRBN])/);
    const promo = promoMatch ? promoMatch[1] : undefined;

    const legalMoves = g.allLegalMoves();
    const match = legalMoves.find(mv => {
      const trial = g.clone();
      const rec = trial.makeMove(mv.from.rank, mv.from.file, mv.to.rank, mv.to.file, promo || 'Q');
      return rec && rec.san.replace(/[+#]/g, '') === cleanSan;
    });

    if (!match) {
      return { ok: false, failedAt: rawSan, movesPlayed: records.length, game: g };
    }
    const rec = g.makeMove(match.from.rank, match.from.file, match.to.rank, match.to.file, promo || 'Q');
    records.push(rec);
  }
  return { ok: true, game: g, records };
}

// Full convenience entrypoint: string in, structured result out.
function parseAndReplayPGN(pgnText) {
  const headers = parsePGNHeaders(pgnText);
  const sanMoves = parsePGNMoves(pgnText);
  if (sanMoves.length === 0) {
    return { ok: false, error: 'PGN에서 수를 찾을 수 없어요.' };
  }
  const replay = replayPGNMoves(sanMoves);
  if (!replay.ok) {
    return { ok: false, error: `"${replay.failedAt}" 수를 해석할 수 없어요 (${replay.movesPlayed}수까지는 정상 재생됐어요).` };
  }
  return { ok: true, headers, game: replay.game, records: replay.records };
}

if (typeof module !== 'undefined') module.exports = { parsePGNHeaders, parsePGNMoves, replayPGNMoves, parseAndReplayPGN };
