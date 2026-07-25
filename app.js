// ==================== App state & screen management ====================

const state = {
  currentScreen: 'screen-home',
  screenHistory: [],
  soundOn: false,
  mode: null, // 'offline' | 'online'
  boardFlipped: false,
};

function showScreen(id, opts = {}) {
  const { pushHistory = true } = opts;
  if (pushHistory && state.currentScreen !== id) {
    state.screenHistory.push(state.currentScreen);
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  state.currentScreen = id;
}

function goBack(fallback = 'screen-home') {
  const prev = state.screenHistory.pop() || fallback;
  // cleanup when leaving game screen
  if (state.currentScreen === 'screen-game') cleanupGame();
  if (state.currentScreen === 'screen-create-room' || state.currentScreen === 'screen-join-room' || state.currentScreen === 'screen-quick-match') {
    if (onlineSession) { onlineSession.close(); onlineSession = null; }
  }
  showScreen(prev, { pushHistory: false });
}

document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => goBack(btn.dataset.back));
});

// ==================== Sound toggle ====================
const soundSwitch = document.getElementById('sound-switch');
const bgm = document.getElementById('bgm');
soundSwitch.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundSwitch.classList.toggle('on', state.soundOn);
  if (state.soundOn) {
    // No licensed audio file is bundled (copyright); this hooks up a user-supplied track if present.
    if (bgm.src) { bgm.volume = 0.35; bgm.play().catch(() => {}); }
  } else {
    bgm.pause();
  }
});

// ==================== Home menu wiring ====================
document.getElementById('menu-offline').addEventListener('click', () => showScreen('screen-offline-setup'));
document.getElementById('menu-online').addEventListener('click', () => showScreen('screen-online-menu'));

// ---- Offline setup ----
let offlineBase = 10, offlineInc = 0;
document.querySelectorAll('#offline-time-base .time-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#offline-time-base .time-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    offlineBase = parseInt(chip.dataset.v, 10);
  });
});
document.querySelectorAll('#offline-time-inc .time-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#offline-time-inc .time-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    offlineInc = parseInt(chip.dataset.v, 10);
  });
});
document.getElementById('btn-offline-start').addEventListener('click', () => {
  startGame({ mode: 'offline', baseMinutes: offlineBase, incSeconds: offlineInc });
});

// ---- Online menu ----
let onlineSession = null;

document.getElementById('card-create-room').addEventListener('click', () => enterCreateRoom());
document.getElementById('card-quick-online').addEventListener('click', () => enterQuickMatch());
document.getElementById('card-join-room').addEventListener('click', () => showScreen('screen-join-room'));

async function enterQuickMatch() {
  showScreen('screen-quick-match');
  const statusEl = document.getElementById('quick-match-status');
  statusEl.innerHTML = '상대를 찾는 중<span class="waiting-dots"></span>';
  statusEl.className = 'status-line';

  onlineSession = new OnlineSession();
  onlineSession.onDisconnected = () => {
    if (state.currentScreen === 'screen-game') handleOpponentDisconnect();
  };

  try {
    const result = await onlineSession.quickMatch(() => {
      statusEl.innerHTML = '대기방을 새로 만들었어요. 다른 플레이어를 기다리는 중<span class="waiting-dots"></span>';
    });
    statusEl.textContent = '상대를 찾았어요! 대국을 시작합니다.';
    statusEl.className = 'status-line success';
    const myColor = onlineSession.myColor;
    setTimeout(() => {
      startGame({ mode: 'online', baseMinutes: 10, incSeconds: 10, session: onlineSession, myColor });
    }, 500);
  } catch (e) {
    statusEl.textContent = e.message || '매칭에 실패했어요. 다시 시도해주세요.';
    statusEl.className = 'status-line error';
  }
}

async function enterCreateRoom() {
  showScreen('screen-create-room');
  document.getElementById('room-code-text').textContent = '------';
  const statusEl = document.getElementById('create-room-status');
  statusEl.textContent = '방 생성 중...';
  statusEl.className = 'status-line';

  onlineSession = new OnlineSession();
  onlineSession.onConnected = () => {
    statusEl.textContent = '상대가 접속했어요! 대국을 시작합니다.';
    statusEl.className = 'status-line success';
    setTimeout(() => {
      startGame({ mode: 'online', baseMinutes: 10, incSeconds: 10, session: onlineSession, myColor: 'w' });
    }, 600);
  };
  onlineSession.onDisconnected = () => {
    if (state.currentScreen === 'screen-game') handleOpponentDisconnect();
  };

  try {
    const code = await onlineSession.hostRoom();
    document.getElementById('room-code-text').textContent = code;
    statusEl.innerHTML = '상대를 기다리는 중<span class="waiting-dots"></span>';
  } catch (e) {
    if (e.message === 'COLLISION_RETRY') { enterCreateRoom(); return; }
    statusEl.textContent = e.message || '방 생성에 실패했어요.';
    statusEl.className = 'status-line error';
  }
}

document.getElementById('btn-copy-code').addEventListener('click', () => {
  const code = document.getElementById('room-code-text').textContent;
  if (code && code !== '------') {
    navigator.clipboard.writeText(code).catch(() => {});
    const btn = document.getElementById('btn-copy-code');
    const orig = btn.textContent;
    btn.textContent = '복사됨!';
    setTimeout(() => btn.textContent = orig, 1200);
  }
});

const joinInput = document.getElementById('join-code-input');
joinInput.addEventListener('input', () => {
  joinInput.value = joinInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});
joinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitJoin(); });
document.getElementById('btn-join-submit').addEventListener('click', submitJoin);

async function submitJoin() {
  const code = joinInput.value.trim();
  const statusEl = document.getElementById('join-room-status');
  if (!code) { statusEl.textContent = '코드를 입력해주세요.'; statusEl.className = 'status-line error'; return; }
  statusEl.textContent = '접속하는 중...';
  statusEl.className = 'status-line';

  onlineSession = new OnlineSession();
  onlineSession.onDisconnected = () => {
    if (state.currentScreen === 'screen-game') handleOpponentDisconnect();
  };

  try {
    await onlineSession.joinRoom(code);
    statusEl.textContent = '연결되었습니다!';
    statusEl.className = 'status-line success';
    setTimeout(() => {
      startGame({ mode: 'online', baseMinutes: 10, incSeconds: 10, session: onlineSession, myColor: 'b' });
    }, 400);
  } catch (e) {
    statusEl.textContent = e.message || '접속에 실패했어요.';
    statusEl.className = 'status-line error';
  }
}

function handleOpponentDisconnect() {
  if (!game || game.result) return;
  game.result = 'opponent-left';
  renderResultBanner('상대가 연결을 끊었어요.');
  stopClock();
}

// ==================== Game state ====================
let game = null;
let gameConfig = null; // { mode, baseMinutes, incSeconds, session, myColor }
let selectedSquare = null;
let legalTargets = [];
let clocks = { w: 0, b: 0 };
let clockInterval = null;
let lastTickTime = null;
let viewingMoveIndex = -1; // -1 means "live" (latest position); else browsing history
let pendingPromotion = null;

function startGame(config) {
  gameConfig = config;
  game = new ChessGame();
  selectedSquare = null;
  legalTargets = [];
  viewingMoveIndex = -1;
  state.boardFlipped = (config.myColor === 'b');

  const baseMs = config.baseMinutes > 0 ? config.baseMinutes * 60 * 1000 : Infinity;
  clocks = { w: baseMs, b: baseMs };

  document.getElementById('name-top').textContent = config.mode === 'online'
    ? (config.myColor === 'w' ? '상대 (흑)' : '상대 (백)')
    : '흑';
  document.getElementById('name-bottom').textContent = config.mode === 'online'
    ? (config.myColor === 'w' ? '나 (백)' : '나 (흑)')
    : '백';

  document.getElementById('result-banner-slot').innerHTML = '';
  document.getElementById('moves-scroll').innerHTML = '';
  document.getElementById('captured-top').textContent = '';
  document.getElementById('captured-bottom').textContent = '';

  if (config.mode === 'online' && config.session) {
    config.session.onMessage = handleOnlineMessage;
  }

  renderBoard();
  updateClockDisplay();
  if (config.baseMinutes > 0) startClockTicking();

  showScreen('screen-game');
}

document.getElementById('game-back-btn').addEventListener('click', () => {
  if (game && !game.result) {
    if (!confirm('대국을 나가면 기권 처리됩니다. 나가시겠어요?')) return;
    if (gameConfig.mode === 'online' && gameConfig.session) {
      gameConfig.session.send({ type: 'resign' });
    }
  }
  goBack('screen-home');
});

function cleanupGame() {
  stopClock();
  game = null;
  gameConfig = null;
}

// ---- Clock ----
function startClockTicking() {
  stopClock();
  lastTickTime = Date.now();
  clockInterval = setInterval(() => {
    const now = Date.now();
    const delta = now - lastTickTime;
    lastTickTime = now;
    if (!game || game.result) { stopClock(); return; }
    clocks[game.turn] -= delta;
    if (clocks[game.turn] <= 0) {
      clocks[game.turn] = 0;
      game.result = 'timeout';
      game.winner = game.turn === 'w' ? 'b' : 'w';
      renderResultBanner((game.winner === 'w' ? '백' : '흑') + ' 승리 (시간 초과)');
      stopClock();
    }
    updateClockDisplay();
  }, 200);
}
function stopClock() {
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
}
function updateClockDisplay() {
  const fmt = (ms) => {
    if (ms === Infinity) return '∞';
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + String(sec).padStart(2, '0');
  };
  const topColor = state.boardFlipped ? 'w' : 'b';
  const bottomColor = state.boardFlipped ? 'b' : 'w';
  const topEl = document.getElementById('clock-top');
  const bottomEl = document.getElementById('clock-bottom');
  topEl.textContent = fmt(clocks[topColor]);
  bottomEl.textContent = fmt(clocks[bottomColor]);
  topEl.classList.toggle('active', game && game.turn === topColor && !game.result);
  bottomEl.classList.toggle('active', game && game.turn === bottomColor && !game.result);
  topEl.classList.toggle('low', clocks[topColor] < 20000 && clocks[topColor] !== Infinity);
  bottomEl.classList.toggle('low', clocks[bottomColor] < 20000 && clocks[bottomColor] !== Infinity);
}

// ==================== Board rendering ====================
const FILES = ['a','b','c','d','e','f','g','h'];

function squareId(r, f) { return `sq-${r}-${f}`; }

function renderBoard(targetGame = game, mountId = 'board', flipped = state.boardFlipped, interactive = true) {
  const board = document.getElementById(mountId);
  board.innerHTML = '';
  const g = targetGame;

  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const r = flipped ? displayRow : 7 - displayRow;
      const f = flipped ? 7 - displayCol : displayCol;
      const isLight = (r + f) % 2 === 1;
      const sqEl = document.createElement('div');
      sqEl.className = 'square ' + (isLight ? 'light' : 'dark');
      sqEl.id = mountId === 'board' ? squareId(r, f) : `${mountId}-${squareId(r, f)}`;
      sqEl.dataset.rank = r;
      sqEl.dataset.file = f;

      if (displayCol === 0) {
        const rankLabel = document.createElement('span');
        rankLabel.className = 'coord-rank';
        rankLabel.textContent = r + 1;
        sqEl.appendChild(rankLabel);
      }
      if (displayRow === 7) {
        const fileLabel = document.createElement('span');
        fileLabel.className = 'coord-file';
        fileLabel.textContent = FILES[f];
        sqEl.appendChild(fileLabel);
      }

      const piece = g.board[r][f];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.innerHTML = pieceSVG(piece.type, piece.color);
        pieceEl.draggable = false;
        sqEl.appendChild(pieceEl);
      }

      if (interactive) {
        sqEl.addEventListener('click', () => onSquareClick(r, f));
      }
      board.appendChild(sqEl);
    }
  }
  if (interactive) applyBoardHighlights();
}

function applyBoardHighlights() {
  document.querySelectorAll('#board .square').forEach(el => {
    el.classList.remove('highlight-select', 'highlight-lastmove', 'highlight-check');
    const dot = el.querySelector('.move-dot'); if (dot) dot.remove();
    const ring = el.querySelector('.capture-ring'); if (ring) ring.remove();
  });

  // last move highlight
  if (game.history.length > 0) {
    const last = game.history[game.history.length - 1];
    const from = nameToSq(last.from), to = nameToSq(last.to);
    const fromEl = document.getElementById(squareId(from.rank, from.file));
    const toEl = document.getElementById(squareId(to.rank, to.file));
    if (fromEl) fromEl.classList.add('highlight-lastmove');
    if (toEl) toEl.classList.add('highlight-lastmove');
  }

  // check highlight
  if (game.inCheck(game.turn) && !game.result) {
    const k = game.findKing(game.turn);
    if (k) document.getElementById(squareId(k.rank, k.file)).classList.add('highlight-check');
  } else if (game.result === 'checkmate') {
    const k = game.findKing(game.turn);
    if (k) document.getElementById(squareId(k.rank, k.file)).classList.add('highlight-check');
  }

  if (selectedSquare) {
    const el = document.getElementById(squareId(selectedSquare.rank, selectedSquare.file));
    if (el) el.classList.add('highlight-select');
    legalTargets.forEach(m => {
      const el2 = document.getElementById(squareId(m.to.rank, m.to.file));
      if (!el2) return;
      const marker = document.createElement('div');
      marker.className = m.capture ? 'capture-ring' : 'move-dot';
      el2.appendChild(marker);
    });
  }
}

function myTurnAllowed() {
  if (!game || game.result) return false;
  if (gameConfig.mode === 'offline') return true;
  return game.turn === gameConfig.myColor;
}

function onSquareClick(r, f) {
  if (!game || game.result) return;
  if (viewingMoveIndex !== -1) return; // browsing history, ignore clicks
  if (!myTurnAllowed()) return;

  const piece = game.board[r][f];

  if (selectedSquare) {
    const target = legalTargets.find(m => m.to.rank === r && m.to.file === f);
    if (target) {
      attemptMove(selectedSquare.rank, selectedSquare.file, r, f, target);
      return;
    }
    // reselect if clicking own piece
    if (piece && piece.color === game.turn) {
      selectedSquare = { rank: r, file: f };
      legalTargets = game.legalMovesFor(r, f);
      applyBoardHighlights();
      return;
    }
    selectedSquare = null; legalTargets = [];
    applyBoardHighlights();
    return;
  }

  if (piece && piece.color === game.turn) {
    selectedSquare = { rank: r, file: f };
    legalTargets = game.legalMovesFor(r, f);
    applyBoardHighlights();
  }
}

function attemptMove(fr, ff, tr, tf, meta) {
  if (meta.promotion) {
    pendingPromotion = { fr, ff, tr, tf };
    showPromotionPicker(game.board[fr][ff].color);
    return;
  }
  finalizeMove(fr, ff, tr, tf, null);
}

function finalizeMove(fr, ff, tr, tf, promoteTo) {
  const beforeTurn = game.turn;
  const record = game.makeMove(fr, ff, tr, tf, promoteTo);
  if (!record) return;

  // apply increment
  if (gameConfig.incSeconds > 0 && clocks[beforeTurn] !== Infinity) {
    clocks[beforeTurn] += gameConfig.incSeconds * 1000;
  }

  selectedSquare = null; legalTargets = [];
  renderBoard();
  appendMoveToNotation(record);
  updateCapturedRows();
  updateClockDisplay();

  if (gameConfig.mode === 'online' && gameConfig.session) {
    gameConfig.session.send({ type: 'move', fr, ff, tr, tf, promoteTo, clocks });
  }

  checkGameEnd();
}

function checkGameEnd() {
  if (!game.result) return;
  stopClock();
  let msg = '';
  if (game.result === 'checkmate') msg = (game.winner === 'w' ? '백' : '흑') + ' 승리 (체크메이트)';
  else if (game.result === 'stalemate') msg = '무승부 (스테일메이트)';
  else if (game.result === 'draw-50') msg = '무승부 (50수 규칙)';
  else if (game.result === 'draw-repetition') msg = '무승부 (3회 동형 반복)';
  else if (game.result === 'draw-material') msg = '무승부 (기물 부족)';
  renderResultBanner(msg);
}

function renderResultBanner(msg) {
  document.getElementById('result-banner-slot').innerHTML = `<div class="result-banner">${msg}</div>`;
}

// ---- Promotion picker ----
function showPromotionPicker(color) {
  const boardEl = document.getElementById('board');
  const overlay = document.createElement('div');
  overlay.className = 'promo-overlay';
  const box = document.createElement('div');
  box.className = 'promo-box';
  ['Q','R','B','N'].forEach(type => {
    const choice = document.createElement('div');
    choice.className = 'promo-choice';
    choice.innerHTML = pieceSVG(type, color);
    choice.addEventListener('click', () => {
      const { fr, ff, tr, tf } = pendingPromotion;
      overlay.remove();
      finalizeMove(fr, ff, tr, tf, type);
    });
    box.appendChild(choice);
  });
  overlay.appendChild(box);
  boardEl.appendChild(overlay);
}

// ---- Notation panel ----
function appendMoveToNotation(record) {
  const scroll = document.getElementById('moves-scroll');
  const moveNum = Math.ceil(game.history.length / 2);
  if (record.color === 'w') {
    const row = document.createElement('div');
    row.className = 'move-row';
    row.dataset.moveIndex = game.history.length - 1;
    row.innerHTML = `<span class="num">${moveNum}.</span><span class="san" data-idx="${game.history.length - 1}">${record.san}</span><span class="san-black"></span>`;
    scroll.appendChild(row);
  } else {
    const rows = scroll.querySelectorAll('.move-row');
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const blackSlot = lastRow.querySelector('.san-black');
      blackSlot.textContent = record.san;
      blackSlot.classList.add('san');
      blackSlot.dataset.idx = game.history.length - 1;
    }
  }
  scroll.scrollTop = scroll.scrollHeight;
  scroll.querySelectorAll('.san').forEach(el => el.classList.remove('current'));
  const currentEl = scroll.querySelector(`[data-idx="${game.history.length - 1}"]`);
  if (currentEl) currentEl.classList.add('current');

  // click-to-review binding
  scroll.querySelectorAll('.san').forEach(el => {
    el.onclick = () => reviewMoveIndex(parseInt(el.dataset.idx, 10));
  });
}

function reviewMoveIndex(idx) {
  // Reconstruct position up to idx by replaying from scratch (simplicity over perf; games are short enough)
  const replay = new ChessGame();
  for (let i = 0; i <= idx; i++) {
    const h = game.history[i];
    const from = nameToSq(h.from), to = nameToSq(h.to);
    replay.makeMove(from.rank, from.file, to.rank, to.file, h.promotion || undefined);
  }
  viewingMoveIndex = idx;
  renderBoard(replay, 'board', state.boardFlipped, false);
  document.querySelectorAll('#moves-scroll .san').forEach(el => el.classList.remove('current'));
  const el = document.querySelector(`#moves-scroll [data-idx="${idx}"]`);
  if (el) el.classList.add('current');

  if (idx === game.history.length - 1) {
    viewingMoveIndex = -1;
    renderBoard(); // back to live/interactive
  }
}

function updateCapturedRows() {
  const captured = { w: [], b: [] };
  game.history.forEach(h => {
    if (h.captured) captured[h.color === 'w' ? 'w' : 'b'].push(h.captured);
  });
  const symbols = { P:'♟', N:'♞', B:'♝', R:'♜', Q:'♛' };
  const topColor = state.boardFlipped ? 'w' : 'b';
  const bottomColor = state.boardFlipped ? 'b' : 'w';
  document.getElementById('captured-top').textContent = captured[topColor === 'w' ? 'b' : 'w'].map(t => symbols[t]).join('');
  document.getElementById('captured-bottom').textContent = captured[bottomColor === 'w' ? 'b' : 'w'].map(t => symbols[t]).join('');
}

// ---- Resign / draw / flip ----
document.getElementById('btn-resign').addEventListener('click', () => {
  if (!game || game.result) return;
  if (!confirm('정말 기권하시겠어요?')) return;
  game.result = 'resign';
  game.winner = game.turn === 'w' ? 'b' : 'w';
  renderResultBanner((game.winner === 'w' ? '백' : '흑') + ' 승리 (기권)');
  stopClock();
  if (gameConfig.mode === 'online' && gameConfig.session) gameConfig.session.send({ type: 'resign' });
});
document.getElementById('btn-draw-offer').addEventListener('click', () => {
  if (!game || game.result) return;
  if (gameConfig.mode === 'offline') {
    if (confirm('상대측이 무승부에 동의합니까?')) {
      game.result = 'draw-agreement'; game.winner = null;
      renderResultBanner('무승부 (합의)');
      stopClock();
    }
  } else if (gameConfig.session) {
    gameConfig.session.send({ type: 'draw-offer' });
    alert('무승부를 제안했어요. 상대의 응답을 기다립니다.');
  }
});
document.getElementById('btn-flip').addEventListener('click', () => {
  state.boardFlipped = !state.boardFlipped;
  renderBoard();
  updateClockDisplay();
});

// ---- Online message handling ----
function handleOnlineMessage(msg) {
  if (msg.type === 'move') {
    const record = game.makeMove(msg.fr, msg.ff, msg.tr, msg.tf, msg.promoteTo);
    if (record) {
      if (msg.clocks) clocks = msg.clocks;
      renderBoard();
      appendMoveToNotation(record);
      updateCapturedRows();
      updateClockDisplay();
      checkGameEnd();
    }
  } else if (msg.type === 'resign') {
    if (!game.result) {
      game.result = 'resign';
      game.winner = gameConfig.myColor; // opponent resigned, I win
      renderResultBanner((game.winner === 'w' ? '백' : '흑') + ' 승리 (상대 기권)');
      stopClock();
    }
  } else if (msg.type === 'draw-offer') {
    if (confirm('상대가 무승부를 제안했어요. 수락하시겠어요?')) {
      game.result = 'draw-agreement'; game.winner = null;
      renderResultBanner('무승부 (합의)');
      stopClock();
      gameConfig.session.send({ type: 'draw-accept' });
    }
  } else if (msg.type === 'draw-accept') {
    game.result = 'draw-agreement'; game.winner = null;
    renderResultBanner('무승부 (합의)');
    stopClock();
  }
}


