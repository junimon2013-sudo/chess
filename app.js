// ==================== App state & screen management ====================

const state = {
  currentScreen: 'screen-login',
  screenHistory: [],
  mode: null, // 'offline' | 'online'
  boardFlipped: false,
  nickname: '',
  settings: {
    premove: false,
    autoQueen: false,
    annotations: true,
  },
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
  if (state.currentScreen === 'screen-create-room' || state.currentScreen === 'screen-join-room') {
    if (onlineSession) { onlineSession.close(); onlineSession = null; }
  }
  if (state.currentScreen === 'screen-review') {
    reviewData = null; // signals the in-flight analysis loop to stop
  }
  showScreen(prev, { pushHistory: false });
}

document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => goBack(btn.dataset.back));
});

// ==================== Settings popup ====================
const settingsOverlay = document.getElementById('settings-overlay');
document.getElementById('btn-settings').addEventListener('click', () => settingsOverlay.classList.add('active'));
document.getElementById('settings-close-btn').addEventListener('click', () => settingsOverlay.classList.remove('active'));
settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) settingsOverlay.classList.remove('active'); });

function wireSettingToggle(elId, stateKey) {
  const el = document.getElementById(elId);
  el.classList.toggle('on', state.settings[stateKey]);
  el.addEventListener('click', () => {
    state.settings[stateKey] = !state.settings[stateKey];
    el.classList.toggle('on', state.settings[stateKey]);
  });
}
wireSettingToggle('setting-premove', 'premove');
wireSettingToggle('setting-auto-queen', 'autoQueen');
wireSettingToggle('setting-annotations', 'annotations');

// ==================== Login screen ====================
function showToast(msg) {
  const toast = document.getElementById('toast-popup');
  toast.textContent = msg;
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 2000);
}

function enterAppWithNickname() {
  const input = document.getElementById('nickname-input');
  const statusEl = document.getElementById('nickname-status');
  const nickname = input.value.trim();
  if (!nickname) {
    statusEl.textContent = '닉네임을 입력해주세요.';
    statusEl.className = 'status-line error';
    return;
  }
  state.nickname = nickname;
  showScreen('screen-home', { pushHistory: false });
}
document.getElementById('btn-nickname-submit').addEventListener('click', enterAppWithNickname);
document.getElementById('nickname-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') enterAppWithNickname();
});

// ==================== PGN review (paste or upload) ====================
document.getElementById('btn-pgn-review').addEventListener('click', () => {
  showScreen('screen-pgn-input');
  document.getElementById('pgn-textarea').value = '';
  document.getElementById('pgn-input-status').textContent = '';
  document.getElementById('pgn-input-status').className = 'status-line';
});

document.getElementById('pgn-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('pgn-textarea').value = reader.result;
  };
  reader.onerror = () => {
    document.getElementById('pgn-input-status').textContent = '파일을 읽지 못했어요.';
    document.getElementById('pgn-input-status').className = 'status-line error';
  };
  reader.readAsText(file);
});

document.getElementById('btn-pgn-analyze').addEventListener('click', () => {
  const text = document.getElementById('pgn-textarea').value.trim();
  const statusEl = document.getElementById('pgn-input-status');
  if (!text) {
    statusEl.textContent = 'PGN을 입력하거나 파일을 업로드해주세요.';
    statusEl.className = 'status-line error';
    return;
  }
  const result = parseAndReplayPGN(text);
  if (!result.ok) {
    statusEl.textContent = result.error;
    statusEl.className = 'status-line error';
    return;
  }
  statusEl.textContent = '';
  startGameReview(result.records);
});

// ==================== Puzzles ====================
document.getElementById('btn-puzzles').addEventListener('click', () => {
  showScreen('screen-puzzles');
  document.getElementById('puzzle-difficulty-select').style.display = 'flex';
  document.getElementById('puzzle-play-area').style.display = 'none';
});

// ==================== Variant chess (placeholder) ====================
document.getElementById('menu-variant').addEventListener('click', () => showToast('준비중⌛'));

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
document.getElementById('card-join-room').addEventListener('click', () => showScreen('screen-join-room'));

async function enterCreateRoom() {
  showScreen('screen-create-room');
  document.getElementById('room-code-text').textContent = '------';
  const statusEl = document.getElementById('create-room-status');
  statusEl.textContent = '방 생성 중...';
  statusEl.className = 'status-line';

  onlineSession = new OnlineSession();
  let opponentNickname = null;
  onlineSession.onNickname = (nick) => {
    opponentNickname = nick;
    if (gameConfig && gameConfig.mode === 'online') {
      gameConfig.opponentNickname = nick;
      document.getElementById('name-top').textContent = nick + (gameConfig.myColor === 'w' ? ' (흑)' : ' (백)');
    }
  };
  onlineSession.onConnected = () => {
    statusEl.textContent = '상대가 접속했어요! 대국을 시작합니다.';
    statusEl.className = 'status-line success';
    onlineSession.send({ type: 'nickname', nickname: state.nickname || '나' });
    setTimeout(() => {
      startGame({ mode: 'online', baseMinutes: 10, incSeconds: 10, session: onlineSession, myColor: 'w', opponentNickname });
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
  let opponentNickname = null;
  onlineSession.onNickname = (nick) => {
    opponentNickname = nick;
    if (gameConfig && gameConfig.mode === 'online') {
      gameConfig.opponentNickname = nick;
      document.getElementById('name-top').textContent = nick + (gameConfig.myColor === 'w' ? ' (흑)' : ' (백)');
    }
  };
  onlineSession.onDisconnected = () => {
    if (state.currentScreen === 'screen-game') handleOpponentDisconnect();
  };

  try {
    await onlineSession.joinRoom(code);
    statusEl.textContent = '연결되었습니다!';
    statusEl.className = 'status-line success';
    onlineSession.send({ type: 'nickname', nickname: state.nickname || '나' });
    setTimeout(() => {
      startGame({ mode: 'online', baseMinutes: 10, incSeconds: 10, session: onlineSession, myColor: 'b', opponentNickname });
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
  premoveQueue = [];
  annotationArrows = [];
  annotationSquares = [];
  state.boardFlipped = (config.myColor === 'b');

  const baseMs = config.baseMinutes > 0 ? config.baseMinutes * 60 * 1000 : Infinity;
  clocks = { w: baseMs, b: baseMs };

  const myName = state.nickname || '나';
  document.getElementById('name-top').textContent = config.mode === 'online'
    ? (config.opponentNickname || '상대') + (config.myColor === 'w' ? ' (흑)' : ' (백)')
    : '흑';
  document.getElementById('name-bottom').textContent = config.mode === 'online'
    ? myName + (config.myColor === 'w' ? ' (백)' : ' (흑)')
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
  premoveQueue = [];
  annotationArrows = [];
  annotationSquares = [];
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

// ==================== Sound effects (synthesized, no external audio files) ====================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  return audioCtx;
}
function playTone(freq, duration, type = 'sine', gainPeak = 0.14, delay = 0) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}
function playSoundMove() { playTone(520, 0.09, 'sine', 0.12); }
function playSoundCapture() { playTone(300, 0.1, 'triangle', 0.16); playTone(220, 0.12, 'triangle', 0.1, 0.02); }
function playSoundCheck() { playTone(880, 0.14, 'square', 0.08); playTone(660, 0.16, 'square', 0.08, 0.05); }
function playSoundGameEnd() { playTone(440, 0.16, 'sine', 0.1); playTone(330, 0.2, 'sine', 0.1, 0.12); playTone(220, 0.28, 'sine', 0.1, 0.24); }

function playMoveSound(record, resultJustSet) {
  if (resultJustSet) { playSoundGameEnd(); return; }
  if (record.san.includes('+') || record.san.includes('#')) { playSoundCheck(); return; }
  if (record.capture) { playSoundCapture(); return; }
  playSoundMove();
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
        pieceEl.draggable = interactive;
        if (interactive) {
          pieceEl.addEventListener('dragstart', (e) => onPieceDragStart(e, r, f));
          pieceEl.addEventListener('dragend', () => onPieceDragEnd());
        }
        sqEl.appendChild(pieceEl);
      }

      if (interactive) {
        sqEl.addEventListener('click', () => onSquareClick(r, f));
        sqEl.addEventListener('dragover', (e) => e.preventDefault());
        sqEl.addEventListener('drop', (e) => onSquareDrop(e, r, f));
        sqEl.addEventListener('contextmenu', (e) => e.preventDefault());
        sqEl.addEventListener('mousedown', (e) => onSquareRightMouseDown(e, r, f));
        sqEl.addEventListener('mouseup', (e) => onSquareRightMouseUp(e, r, f));
      }
      board.appendChild(sqEl);
    }
  }
  if (interactive) { applyBoardHighlights(); redrawAnnotations(); }
}

// ---- Drag and drop ----
let dragSource = null;
function onPieceDragStart(e, r, f) {
  if (!game || game.result) { e.preventDefault(); return; }
  if (viewingMoveIndex !== -1) { e.preventDefault(); return; }
  const piece = game.board[r][f];
  if (!piece) { e.preventDefault(); return; }
  const isMyPieceNow = piece.color === game.turn && myTurnAllowed();
  const isPremoveDrag = state.settings.premove && gameConfig.mode === 'online' && piece.color === gameConfig.myColor && game.turn !== gameConfig.myColor;
  if (!isMyPieceNow && !isPremoveDrag) { e.preventDefault(); return; }
  dragSource = { rank: r, file: f };
  clearAnnotations();
  if (isMyPieceNow) {
    selectedSquare = { rank: r, file: f };
    legalTargets = game.legalMovesFor(r, f);
    applyBoardHighlights();
  }
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}
function onPieceDragEnd() {
  document.querySelectorAll('.piece.dragging').forEach(el => el.classList.remove('dragging'));
  dragSource = null;
}
function onSquareDrop(e, r, f) {
  e.preventDefault();
  if (!dragSource) return;
  const { rank: fr, file: ff } = dragSource;
  dragSource = null;
  if (fr === r && ff === f) { selectedSquare = null; legalTargets = []; applyBoardHighlights(); return; }
  handleMoveAttemptOrPremove(fr, ff, r, f);
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
  clearAnnotations();

  const canPlayNow = myTurnAllowed();
  const canPremove = state.settings.premove && gameConfig.mode === 'online' && !canPlayNow && game.turn !== gameConfig.myColor;

  if (!canPlayNow && !canPremove) return;

  // While premoving, all move legality is computed against the *virtual*
  // board resulting from the already-queued premove chain, not the live game.
  const virtualGame = canPremove ? buildVirtualGameFromPremoveQueue() : game;
  const piece = virtualGame.board[r][f];

  if (!canPlayNow && !canPremove) return;

  if (selectedSquare) {
    if (canPlayNow) {
      const target = legalTargets.find(m => m.to.rank === r && m.to.file === f);
      if (target) {
        handleMoveAttemptOrPremove(selectedSquare.rank, selectedSquare.file, r, f);
        return;
      }
    } else if (canPremove) {
      const target = legalTargets.find(m => m.to.rank === r && m.to.file === f);
      if (target) {
        handleMoveAttemptOrPremove(selectedSquare.rank, selectedSquare.file, r, f);
        return;
      }
    }
    // reselect if clicking own piece
    const expectedColor = canPlayNow ? game.turn : gameConfig.myColor;
    if (piece && piece.color === expectedColor) {
      selectedSquare = { rank: r, file: f };
      legalTargets = canPlayNow ? game.legalMovesFor(r, f) : virtualGame.legalMovesFor(r, f);
      applyBoardHighlights();
      return;
    }
    selectedSquare = null; legalTargets = [];
    applyBoardHighlights();
    return;
  }

  if (canPlayNow && piece && piece.color === game.turn) {
    selectedSquare = { rank: r, file: f };
    legalTargets = game.legalMovesFor(r, f);
    applyBoardHighlights();
  } else if (canPremove && piece && piece.color === gameConfig.myColor) {
    selectedSquare = { rank: r, file: f };
    // Show legal moves for this piece on the virtual (post-queued-premoves)
    // board — this is what makes chaining several premoves feel natural,
    // since it always reflects "where this piece could go after the rest
    // of the queue plays out", same as chess.com.
    legalTargets = virtualGame.legalMovesFor(r, f);
    applyBoardHighlights();
  }
}

// Replays the current game plus every already-queued premove to produce a
// hypothetical board used only for showing legal-move dots while chaining
// premoves. This is a *guess* — the real legality is always re-checked move
// by move as each premove actually executes (see maybeExecutePremove).
function buildVirtualGameFromPremoveQueue() {
  const g = game.clone();
  for (const pm of premoveQueue) {
    const legal = g.legalMovesFor(pm.fr, pm.ff);
    const meta = legal.find(m => m.to.rank === pm.tr && m.to.file === pm.tf);
    if (!meta) break; // queue would be invalidated at this point anyway
    g.makeMove(pm.fr, pm.ff, pm.tr, pm.tf, meta.promotion ? 'Q' : undefined);
  }
  return g;
}

// Routes a from->to attempt either to an immediate move (if it's actually my
// turn right now) or appends it to the premove queue (online mode only).
function handleMoveAttemptOrPremove(fr, ff, tr, tf) {
  if (myTurnAllowed()) {
    const legal = game.legalMovesFor(fr, ff);
    const meta = legal.find(m => m.to.rank === tr && m.to.file === tf);
    selectedSquare = null; legalTargets = [];
    if (meta) attemptMove(fr, ff, tr, tf, meta);
    else applyBoardHighlights();
    return;
  }
  if (state.settings.premove && gameConfig.mode === 'online' && game.turn !== gameConfig.myColor) {
    // Validate against the virtual board (game + queue so far) so we only
    // ever queue moves that were legal in the hypothetical resulting position.
    const virtualGame = buildVirtualGameFromPremoveQueue();
    const legal = virtualGame.legalMovesFor(fr, ff);
    const meta = legal.find(m => m.to.rank === tr && m.to.file === tf);
    selectedSquare = null; legalTargets = [];
    if (meta) {
      premoveQueue.push({ fr, ff, tr, tf, promotion: !!meta.promotion });
      applyBoardHighlights();
      showPremoveIndicators();
    } else {
      applyBoardHighlights();
    }
  }
}

// ---- Premove (chain-capable) ----
// premoveQueue holds an ordered list of {fr,ff,tr,tf,promotion} entries. Each
// entry is executed in order as it becomes the player's real turn; if a queued
// move turns out illegal in the actual live position (opponent played
// differently than assumed), the ENTIRE remaining queue is discarded — this
// matches chess.com's behavior of clearing premoves on a mismatch.
let premoveQueue = [];

function showPremoveIndicators() {
  document.querySelectorAll('.square.highlight-premove').forEach(el => el.classList.remove('highlight-premove'));
  premoveQueue.forEach(pm => {
    const fromEl = document.getElementById(squareId(pm.fr, pm.ff));
    const toEl = document.getElementById(squareId(pm.tr, pm.tf));
    if (fromEl) fromEl.classList.add('highlight-premove');
    if (toEl) toEl.classList.add('highlight-premove');
  });
}
function clearPremove() {
  premoveQueue = [];
  document.querySelectorAll('.square.highlight-premove').forEach(el => el.classList.remove('highlight-premove'));
}
function maybeExecutePremove() {
  if (premoveQueue.length === 0 || !game || game.result) { clearPremove(); return; }
  if (!myTurnAllowed()) return;
  const pm = premoveQueue.shift();
  const piece = game.board[pm.fr][pm.ff];
  if (!piece || piece.color !== game.turn) { clearPremove(); return; }
  const legal = game.legalMovesFor(pm.fr, pm.ff);
  const meta = legal.find(m => m.to.rank === pm.tr && m.to.file === pm.tf);
  if (meta) {
    showPremoveIndicators(); // re-render remaining queue highlights before the move fires
    attemptMove(pm.fr, pm.ff, pm.tr, pm.tf, meta);
    // attemptMove -> finalizeMove will itself call maybeExecutePremove again
    // for the next queued entry once this move completes, continuing the chain.
  } else {
    // The queued premove no longer matches reality — the opponent's actual
    // move invalidated our assumption, so drop the whole remaining chain.
    clearPremove();
  }
}

// ---- Right-click arrows / square highlights ----
let rightDragStart = null;
const ANNOT_COLOR = 'rgba(184,86,74,0.75)'; // red, distinct from the gold auto-arrows used in Openings
let annotationArrows = []; // [{fr,ff,tr,tf}]
let annotationSquares = []; // [{r,f}]

function onSquareRightMouseDown(e, r, f) {
  if (e.button !== 2) return;
  if (!state.settings.annotations) return;
  e.preventDefault();
  rightDragStart = { r, f };
}
function onSquareRightMouseUp(e, r, f) {
  if (e.button !== 2) return;
  if (!state.settings.annotations || !rightDragStart) return;
  e.preventDefault();
  const start = rightDragStart;
  rightDragStart = null;
  if (start.r === r && start.f === f) {
    toggleAnnotationSquare(r, f);
  } else {
    addAnnotationArrow(start.r, start.f, r, f);
  }
}
function toggleAnnotationSquare(r, f) {
  const idx = annotationSquares.findIndex(s => s.r === r && s.f === f);
  if (idx >= 0) annotationSquares.splice(idx, 1);
  else annotationSquares.push({ r, f });
  redrawAnnotations();
}
function addAnnotationArrow(fr, ff, tr, tf) {
  const idx = annotationArrows.findIndex(a => a.fr === fr && a.ff === ff && a.tr === tr && a.tf === tf);
  if (idx >= 0) annotationArrows.splice(idx, 1);
  else annotationArrows.push({ fr, ff, tr, tf });
  redrawAnnotations();
}
function clearAnnotations() {
  annotationArrows = [];
  annotationSquares = [];
  redrawAnnotations();
}
function redrawAnnotations() {
  document.querySelectorAll('#board .square').forEach(el => el.classList.remove('annot-square'));
  annotationSquares.forEach(({ r, f }) => {
    const el = document.getElementById(squareId(r, f));
    if (el) el.classList.add('annot-square');
  });
  let layer = document.getElementById('board-annot-layer');
  if (layer) layer.remove();
  if (annotationArrows.length === 0) return;
  const boardEl = document.getElementById('board');
  layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.id = 'board-annot-layer';
  layer.setAttribute('viewBox', '0 0 400 400');
  layer.style.position = 'absolute';
  layer.style.top = '0'; layer.style.left = '0';
  layer.style.width = '100%'; layer.style.height = '100%';
  layer.style.pointerEvents = 'none';
  boardEl.style.position = 'relative';
  const markerId = 'annot-arrowhead';
  layer.innerHTML = `<defs><marker id="${markerId}" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="${ANNOT_COLOR}" /></marker></defs>`;
  const flipped = state.boardFlipped;
  const centerOf = (r, f) => {
    const displayRow = flipped ? r : 7 - r;
    const displayCol = flipped ? 7 - f : f;
    const cell = 400 / 8;
    return { x: displayCol * cell + cell / 2, y: displayRow * cell + cell / 2 };
  };
  annotationArrows.forEach(({ fr, ff, tr, tf }) => {
    const p1 = centerOf(fr, ff), p2 = centerOf(tr, tf);
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ex = p2.x - (dx / len) * 16, ey = p2.y - (dy / len) * 16;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
    line.setAttribute('x2', ex); line.setAttribute('y2', ey);
    line.setAttribute('stroke', ANNOT_COLOR);
    line.setAttribute('stroke-width', '7');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', `url(#${markerId})`);
    layer.appendChild(line);
  });
  boardEl.appendChild(layer);
}
// left click / making a move clears annotations, matching chess.com behavior
document.getElementById('board').addEventListener('click', () => { if (annotationArrows.length || annotationSquares.length) clearAnnotations(); });

function attemptMove(fr, ff, tr, tf, meta) {
  if (meta.promotion) {
    if (state.settings.autoQueen) {
      finalizeMove(fr, ff, tr, tf, 'Q');
      return;
    }
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
  clearAnnotations();
  renderBoard();
  appendMoveToNotation(record);
  updateCapturedRows();
  updateClockDisplay();
  playMoveSound(record, !!game.result);

  if (gameConfig.mode === 'online' && gameConfig.session) {
    gameConfig.session.send({ type: 'move', fr, ff, tr, tf, promoteTo, clocks });
  }

  checkGameEnd();
  maybeExecutePremove();
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
  document.getElementById('result-banner-slot').innerHTML =
    `<div class="result-banner">${msg}</div>
     <button class="btn-secondary" id="btn-review" style="width:100%; margin-top:10px;">게임 리뷰</button>
     <button class="btn-secondary" id="btn-rematch" style="width:100%; margin-top:8px;">다시 하기</button>`;
  const btn = document.getElementById('btn-rematch');
  if (btn) btn.addEventListener('click', () => rematchGame());
  const reviewBtn = document.getElementById('btn-review');
  if (reviewBtn) reviewBtn.addEventListener('click', () => startGameReview());
}

// Starts a fresh game with the same settings as the one just finished.
// Online rematches simply restart locally on both sides' same session/colors
// (no renegotiation message needed since both clients already agree on config).
function rematchGame() {
  if (!gameConfig) return;
  const cfg = { ...gameConfig };
  if (cfg.mode === 'online' && cfg.session) {
    cfg.session.send({ type: 'rematch' });
  }
  startGame(cfg);
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

// ---- PGN export ----
function buildPGN() {
  if (!game) return '';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const whiteName = gameConfig.mode === 'online' ? (gameConfig.myColor === 'w' ? '나' : '상대') : '백';
  const blackName = gameConfig.mode === 'online' ? (gameConfig.myColor === 'b' ? '나' : '상대') : '흑';
  const resultTag = !game.result ? '*'
    : game.winner === 'w' ? '1-0'
    : game.winner === 'b' ? '0-1'
    : '1/2-1/2';

  let header = `[Event "Nocturne Chess"]\n[Date "${dateStr}"]\n[White "${whiteName}"]\n[Black "${blackName}"]\n[Result "${resultTag}"]\n\n`;

  let body = '';
  for (let i = 0; i < game.history.length; i++) {
    if (i % 2 === 0) body += (Math.floor(i / 2) + 1) + '. ';
    body += game.history[i].san + ' ';
  }
  body += resultTag;
  return header + body.trim();
}

document.getElementById('btn-copy-pgn').addEventListener('click', () => {
  const pgn = buildPGN();
  navigator.clipboard.writeText(pgn).then(() => {
    const btn = document.getElementById('btn-copy-pgn');
    const orig = btn.textContent;
    btn.textContent = '복사됨!';
    setTimeout(() => btn.textContent = orig, 1200);
  }).catch(() => {
    alert(pgn);
  });
});

// ---- Online message handling ----
function handleOnlineMessage(msg) {
  if (msg.type === 'move') {
    const record = game.makeMove(msg.fr, msg.ff, msg.tr, msg.tf, msg.promoteTo);
    if (record) {
      if (msg.clocks) clocks = msg.clocks;
      clearAnnotations();
      renderBoard();
      appendMoveToNotation(record);
      updateCapturedRows();
      updateClockDisplay();
      playMoveSound(record, !!game.result);
      checkGameEnd();
      maybeExecutePremove();
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
  } else if (msg.type === 'rematch') {
    if (gameConfig) startGame({ ...gameConfig });
  }
}

// ==================== Openings viewer ====================
// openingPath: array of nodes from root to the currently viewed node (inclusive).
// Every step is a single real move now — no auto-skipping through unnamed nodes.
// The sidebar always lists the current node's direct children (each is one move).
let openingRootKey = 'e4';
let openingPath = []; // [rootNode, ...selectedChildren], one move per entry

document.getElementById('btn-openings').addEventListener('click', () => {
  showScreen('screen-openings');
  selectOpeningRoot('e4');
});

document.querySelectorAll('.opening-root-tab').forEach(tab => {
  tab.addEventListener('click', () => selectOpeningRoot(tab.dataset.root));
});

function selectOpeningRoot(rootKey) {
  openingRootKey = rootKey;
  openingPath = [OPENING_TREE[rootKey]];
  document.querySelectorAll('.opening-root-tab').forEach(t => t.classList.toggle('selected', t.dataset.root === rootKey));
  renderOpeningScreen();
}

document.getElementById('opening-back-btn').addEventListener('click', () => {
  if (openingPath.length <= 1) return;
  openingPath.pop(); // step back exactly one move
  renderOpeningScreen();
});

function buildGameForPath(path) {
  const g = new ChessGame();
  for (const node of path) {
    const sanTarget = node.san;
    const mv = g.allLegalMoves().find(m => {
      const trial = g.clone();
      const rec = trial.makeMove(m.from.rank, m.from.file, m.to.rank, m.to.file, 'Q');
      return rec && rec.san.replace('+','').replace('#','') === sanTarget.replace('+','').replace('#','');
    });
    if (!mv) break;
    g.makeMove(mv.from.rank, mv.from.file, mv.to.rank, mv.to.file, 'Q');
  }
  return g;
}

// Finds the nearest ancestor (including current node) that has a `name`, for
// the "board title above" display. Falls back to the root's own label if no
// named node has been reached yet.
function nearestNamedLabel(path) {
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].name) return path[i].name;
  }
  return path[0].name; // root always has a name (e.g. "1. e4")
}

function renderOpeningScreen() {
  const current = openingPath[openingPath.length - 1];
  const g = buildGameForPath(openingPath);

  // info panel: description of the move just made (every node has one now)
  document.getElementById('opening-info-name').textContent = current.name || '';
  document.getElementById('opening-info-desc').textContent = current.desc || '';
  document.getElementById('opening-back-btn').disabled = openingPath.length <= 1;

  // board title above: nearest named opening reached so far
  document.getElementById('opening-right-title').textContent = nearestNamedLabel(openingPath);

  // move sequence below the board, e.g. "1. e4 e5 2. Nf3 Nc6"
  let seq = '';
  for (let i = 0; i < openingPath.length; i++) {
    const n = openingPath[i];
    if (i % 2 === 0) seq += (Math.floor(i / 2) + 1) + '.' + n.san + ' ';
    else seq += n.san + ' ';
  }
  document.getElementById('opening-move-sequence').textContent = seq.trim();

  renderOpeningBoard(g);
  renderOpeningArrows(current.threats || []);

  // sidebar: direct children of current node, one real move each
  const listTitleEl = document.getElementById('opening-list-title');
  const listEl = document.getElementById('opening-node-list');
  listEl.innerHTML = '';
  const children = current.children || [];

  if (openingPath.length === 1) {
    listTitleEl.textContent = '다음 수를 선택하세요';
  } else {
    listTitleEl.textContent = '다음 수를 선택하세요';
  }

  if (children.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'opening-node-item';
    empty.style.cursor = 'default';
    empty.textContent = '더 이상의 분기가 없어요.';
    listEl.appendChild(empty);
  } else {
    // Root's own children ARE the first real moves (e.g. e5, c5, e6...) — show
    // those move labels. For deeper nodes, same logic: each child.san is a move.
    children.forEach(child => {
      const item = document.createElement('div');
      item.className = 'opening-node-item';

      const label = document.createElement('span');
      label.textContent = child.san + (child.name ? ` — ${child.name}` : '');
      item.appendChild(label);

      // Hover preview: only meaningful if this move leads to further named
      // branches deeper in the tree. Desktop-only (CSS also guards via
      // @media (hover:none), this skips building the DOM when nothing to show).
      const named = collectNamedDescendants(child);
      const ownName = child.name ? [child.name] : [];
      const allNamed = ownName.concat(named.filter(n => n !== child.name));
      if (allNamed.length > 0) {
        const preview = document.createElement('div');
        preview.className = 'opening-hover-preview';
        const top4 = allNamed.slice(0, 4);
        const restCount = allNamed.length - top4.length;
        let html = `<div class="hp-title">주요 오프닝</div>` + top4.map(n => `<div>${n}</div>`).join('');
        if (restCount > 0) html += `<div class="hp-more">외 ${restCount}개</div>`;
        preview.innerHTML = html;
        item.appendChild(preview);
      }

      item.addEventListener('click', () => {
        openingPath.push(child);
        renderOpeningScreen();
      });
      listEl.appendChild(item);
    });
  }
}

function renderOpeningBoard(g) {
  const board = document.getElementById('opening-board');
  board.innerHTML = '';
  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const r = 7 - displayRow, f = displayCol;
      const isLight = (r + f) % 2 === 1;
      const sqEl = document.createElement('div');
      sqEl.className = 'square ' + (isLight ? 'light' : 'dark');
      const piece = g.board[r][f];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.innerHTML = pieceSVG(piece.type, piece.color);
        sqEl.appendChild(pieceEl);
      }
      board.appendChild(sqEl);
    }
  }
}

// Draw chess.com-style arrows on the opening board's SVG overlay for the given
// list of [fromSquare, toSquare] name pairs (e.g. ["d1","h5"]). Board is always
// shown from White's perspective here (a1 bottom-left), matching renderOpeningBoard.
function openingSquareCenter(squareName) {
  const f = 'abcdefgh'.indexOf(squareName[0]);
  const r = parseInt(squareName[1], 10) - 1;
  const cellSize = 400 / 8;
  const displayCol = f;
  const displayRow = 7 - r;
  return { x: displayCol * cellSize + cellSize / 2, y: displayRow * cellSize + cellSize / 2 };
}

function renderOpeningArrows(threats) {
  const svg = document.getElementById('opening-arrow-layer');
  svg.innerHTML = `
    <defs>
      <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="rgba(201,162,75,0.85)" />
      </marker>
    </defs>
  `;
  threats.forEach(([from, to]) => {
    const p1 = openingSquareCenter(from);
    const p2 = openingSquareCenter(to);
    // shorten the line a bit so the arrowhead doesn't overlap the piece too much
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const shorten = 16;
    const ex = p2.x - (dx / len) * shorten;
    const ey = p2.y - (dy / len) * shorten;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('x2', ex);
    line.setAttribute('y2', ey);
    line.setAttribute('stroke', 'rgba(201,162,75,0.85)');
    line.setAttribute('stroke-width', '7');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(line);
  });
}

// ==================== Game review (Stockfish) ====================
let reviewAnalyzer = null;
let reviewData = null; // { positions: [fen,...], moves: [record,...], grades: [{tag, evalBeforeCp, evalAfterCp, bestMoveSan}] }
let reviewIndex = 0; // 0 = starting position, 1..N = after move N

async function startGameReview(movesOverride) {
  const movesCopy = movesOverride || (game ? game.history.slice() : []);
  if (movesCopy.length === 0) {
    showToast('분석할 수가 없어요');
    return;
  }
  showScreen('screen-review');
  reviewIndex = 0;
  document.getElementById('review-status').innerHTML = '분석 중<span class="waiting-dots"></span>';
  document.getElementById('review-moves-scroll').innerHTML = '';
  document.getElementById('review-summary').textContent = '';

  const replay = new ChessGame();
  const positions = [replay.toFEN()];
  for (const h of movesCopy) {
    const from = nameToSq(h.from), to = nameToSq(h.to);
    replay.makeMove(from.rank, from.file, to.rank, to.file, h.promotion || undefined);
    positions.push(replay.toFEN());
  }

  reviewData = { positions, moves: movesCopy, grades: new Array(movesCopy.length).fill(null) };
  renderReviewPosition();
  renderReviewMovesList();

  if (!reviewAnalyzer) reviewAnalyzer = new StockfishAnalyzer();
  try {
    await reviewAnalyzer._ensureLoaded();
  } catch (e) {
    document.getElementById('review-status').textContent = '분석 엔진을 불러오지 못했어요. 네트워크 연결을 확인해주세요.';
    return;
  }

  for (let i = 0; i < movesCopy.length; i++) {
    if (!reviewData) return;
    const beforeFEN = positions[i];
    const afterFEN = positions[i + 1];

    const beforeResult = await reviewAnalyzer.analyzeFEN(beforeFEN, 12);
    const afterResult = await reviewAnalyzer.analyzeFEN(afterFEN, 12);
    if (!reviewData) return;

    const beforeCp = beforeResult.mateIn != null ? (beforeResult.mateIn > 0 ? 10000 : -10000) : (beforeResult.scoreCp || 0);
    const afterCpOpponentPOV = afterResult.mateIn != null ? (afterResult.mateIn > 0 ? 10000 : -10000) : (afterResult.scoreCp || 0);
    const afterCpMoverPOV = -afterCpOpponentPOV;

    const tag = classifyMove(beforeCp, afterCpMoverPOV);
    const bestMoveSan = uciToSan(beforeFEN, beforeResult.bestMoveUci);

    reviewData.grades[i] = { tag, evalBeforeCp: beforeCp, evalAfterCp: afterCpMoverPOV, bestMoveSan, bestMoveUci: beforeResult.bestMoveUci };
    renderReviewMovesList();
    document.getElementById('review-status').textContent = `분석 중... (${i + 1}/${movesCopy.length})`;
  }
  if (reviewData) {
    document.getElementById('review-status').textContent = '분석 완료';
  }
}

function uciToSan(fen, uciMove) {
  if (!uciMove || uciMove.length < 4) return null;
  try {
    const g = ChessGame.fromFEN(fen);
    const from = nameToSq(uciMove.slice(0, 2));
    const to = nameToSq(uciMove.slice(2, 4));
    const promo = uciMove.length > 4 ? uciMove[4].toUpperCase() : undefined;
    const rec = g.makeMove(from.rank, from.file, to.rank, to.file, promo);
    return rec ? rec.san : null;
  } catch (e) {
    return null;
  }
}

function renderReviewPosition() {
  const fen = reviewData.positions[reviewIndex];
  const g = ChessGame.fromFEN(fen);
  renderReviewBoard(g);
  const counterEl = document.getElementById('review-counter');
  counterEl.textContent = reviewIndex === 0 ? '시작 위치' : `${reviewIndex}수: ${reviewData.moves[reviewIndex - 1].san}`;
  document.getElementById('review-prev').disabled = reviewIndex === 0;
  document.getElementById('review-next').disabled = reviewIndex === reviewData.moves.length;

  const summaryEl = document.getElementById('review-summary');
  if (reviewIndex === 0) {
    summaryEl.textContent = '';
  } else {
    const grade = reviewData.grades[reviewIndex - 1];
    if (!grade) {
      summaryEl.textContent = '아직 분석되지 않았어요.';
    } else {
      const tagLabel = { best: '최선의 수', good: '좋은 수', inaccuracy: '부정확한 수', mistake: '실수', blunder: '블런더' }[grade.tag];
      let text = tagLabel;
      if (grade.tag !== 'best' && grade.bestMoveSan) {
        text += ` — 더 나은 수: ${grade.bestMoveSan}`;
      }
      summaryEl.textContent = text;
    }
  }

  document.querySelectorAll('.review-move-row').forEach(el => el.classList.remove('current'));
  const row = document.querySelector(`.review-move-row[data-idx="${reviewIndex - 1}"]`);
  if (row) row.classList.add('current');
}

function renderReviewBoard(g) {
  const board = document.getElementById('review-board');
  board.innerHTML = '';
  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const r = 7 - displayRow, f = displayCol;
      const isLight = (r + f) % 2 === 1;
      const sqEl = document.createElement('div');
      sqEl.className = 'square ' + (isLight ? 'light' : 'dark');
      const piece = g.board[r][f];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.innerHTML = pieceSVG(piece.type, piece.color);
        sqEl.appendChild(pieceEl);
      }
      board.appendChild(sqEl);
    }
  }
}

function renderReviewMovesList() {
  const scroll = document.getElementById('review-moves-scroll');
  const scrollPos = scroll.scrollTop;
  scroll.innerHTML = '';
  const tagLabel = { best: '최선', good: '좋음', inaccuracy: '부정확', mistake: '실수', blunder: '블런더' };
  reviewData.moves.forEach((m, i) => {
    const row = document.createElement('div');
    row.className = 'review-move-row';
    row.dataset.idx = i;
    const moveNum = Math.floor(i / 2) + 1;
    const prefix = i % 2 === 0 ? `${moveNum}.` : '';
    const grade = reviewData.grades[i];
    row.innerHTML = `<span style="min-width:44px;">${prefix}${m.san}</span>` +
      (grade ? `<span class="review-move-tag ${grade.tag}">${tagLabel[grade.tag]}</span>` : '<span style="font-size:11px; color: var(--text-dim);">분석 중</span>');
    row.addEventListener('click', () => { reviewIndex = i + 1; renderReviewPosition(); });
    scroll.appendChild(row);
  });
  scroll.scrollTop = scrollPos;
}

document.getElementById('review-prev').addEventListener('click', () => {
  if (reviewIndex > 0) { reviewIndex--; renderReviewPosition(); }
});
document.getElementById('review-next').addEventListener('click', () => {
  if (reviewData && reviewIndex < reviewData.moves.length) { reviewIndex++; renderReviewPosition(); }
});

// ==================== Puzzle play logic ====================
let puzzleQueue = [];
let puzzleIndex = 0;
let puzzleGame = null;
let puzzleSolutionStep = 0; // how many moves of the solution have been played correctly
let puzzleWrongCount = 0;
let puzzleSelected = null;
let puzzleSolved = 0;

document.querySelectorAll('.puzzle-diff-card').forEach(card => {
  card.addEventListener('click', () => startPuzzleSet(card.dataset.diff));
});

function startPuzzleSet(difficulty) {
  puzzleQueue = PUZZLES.filter(p => p.difficulty === difficulty);
  if (puzzleQueue.length === 0) {
    showToast('아직 이 난이도의 퍼즐이 없어요');
    return;
  }
  puzzleIndex = 0;
  puzzleSolved = 0;
  document.getElementById('puzzle-difficulty-select').style.display = 'none';
  document.getElementById('puzzle-play-area').style.display = 'flex';
  loadPuzzle(puzzleIndex);
}

function loadPuzzle(idx) {
  const p = puzzleQueue[idx];
  puzzleGame = ChessGame.fromFEN(p.fen);
  puzzleSolutionStep = 0;
  puzzleWrongCount = 0;
  puzzleSelected = null;
  document.getElementById('puzzle-progress').textContent = `${idx + 1} / ${puzzleQueue.length}`;
  const statusEl = document.getElementById('puzzle-status');
  statusEl.textContent = p.desc;
  statusEl.className = 'puzzle-status';
  renderPuzzleBoard();
}

function renderPuzzleBoard() {
  const board = document.getElementById('puzzle-board');
  board.innerHTML = '';
  const g = puzzleGame;
  for (let displayRow = 0; displayRow < 8; displayRow++) {
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const r = 7 - displayRow, f = displayCol;
      const isLight = (r + f) % 2 === 1;
      const sqEl = document.createElement('div');
      sqEl.className = 'square ' + (isLight ? 'light' : 'dark');
      sqEl.dataset.rank = r;
      sqEl.dataset.file = f;
      const piece = g.board[r][f];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece';
        pieceEl.innerHTML = pieceSVG(piece.type, piece.color);
        sqEl.appendChild(pieceEl);
      }
      sqEl.addEventListener('click', () => onPuzzleSquareClick(r, f));
      board.appendChild(sqEl);
    }
  }
  applyPuzzleHighlights();
}

function applyPuzzleHighlights() {
  document.querySelectorAll('#puzzle-board .square').forEach(el => {
    el.classList.remove('highlight-select', 'hint-highlight');
    const dot = el.querySelector('.move-dot'); if (dot) dot.remove();
    const ring = el.querySelector('.capture-ring'); if (ring) ring.remove();
  });
  if (puzzleSelected) {
    const r = puzzleSelected.rank, f = puzzleSelected.file;
    const el = document.querySelector(`#puzzle-board .square[data-rank="${r}"][data-file="${f}"]`);
    if (el) el.classList.add('highlight-select');
    const legal = puzzleGame.legalMovesFor(r, f);
    legal.forEach(m => {
      const el2 = document.querySelector(`#puzzle-board .square[data-rank="${m.to.rank}"][data-file="${m.to.file}"]`);
      if (!el2) return;
      const marker = document.createElement('div');
      marker.className = m.capture ? 'capture-ring' : 'move-dot';
      el2.appendChild(marker);
    });
  }
}

function onPuzzleSquareClick(r, f) {
  const p = puzzleQueue[puzzleIndex];
  const piece = puzzleGame.board[r][f];

  if (puzzleSelected) {
    const legal = puzzleGame.legalMovesFor(puzzleSelected.rank, puzzleSelected.file);
    const meta = legal.find(m => m.to.rank === r && m.to.file === f);
    if (meta) {
      attemptPuzzleMove(puzzleSelected.rank, puzzleSelected.file, r, f, meta);
      return;
    }
    if (piece && piece.color === puzzleGame.turn) {
      puzzleSelected = { rank: r, file: f };
      applyPuzzleHighlights();
      return;
    }
    puzzleSelected = null;
    applyPuzzleHighlights();
    return;
  }
  if (piece && piece.color === puzzleGame.turn) {
    puzzleSelected = { rank: r, file: f };
    applyPuzzleHighlights();
  }
}

function attemptPuzzleMove(fr, ff, tr, tf, meta) {
  const p = puzzleQueue[puzzleIndex];
  const expected = p.solution[puzzleSolutionStep];
  const expectedFrom = nameToSq(expected[0]);
  const expectedTo = nameToSq(expected[1]);
  const isCorrect = (fr === expectedFrom.rank && ff === expectedFrom.file && tr === expectedTo.rank && tf === expectedTo.file);

  const statusEl = document.getElementById('puzzle-status');

  if (!isCorrect) {
    puzzleWrongCount++;
    puzzleSelected = null;
    applyPuzzleHighlights();
    statusEl.textContent = '틀렸어요. 다시 시도해보세요.';
    statusEl.className = 'puzzle-status wrong';
    if (puzzleWrongCount >= 3) showPuzzleHint();
    return;
  }

  // Correct move — play it, then keep auto-playing any consecutive solution
  // steps that belong to the OTHER side (the puzzle's forced opponent replies),
  // stopping as soon as it's the puzzle-solver's turn again or the line ends.
  const promo = expected[2] || undefined;
  puzzleGame.makeMove(fr, ff, tr, tf, promo);
  puzzleSolutionStep++;
  puzzleSelected = null;
  renderPuzzleBoard();
  playAnyForcedRepliesThenCheck();
}

// After the solver's move, automatically plays through any further solution
// steps whose "from" square holds a piece of the color NOT equal to the
// puzzle's original mover (i.e. the opponent's forced reply), one at a time
// with a short delay so it reads as a response rather than instant.
function playAnyForcedRepliesThenCheck() {
  const p = puzzleQueue[puzzleIndex];
  if (puzzleSolutionStep >= p.solution.length) { checkPuzzleCompletion(); return; }

  const nextMove = p.solution[puzzleSolutionStep];
  const nf = nameToSq(nextMove[0]);
  const pieceAtFrom = puzzleGame.board[nf.rank][nf.file];
  const solverColor = getPuzzleMoverColor(p);

  if (pieceAtFrom && pieceAtFrom.color !== solverColor) {
    // it's the opponent's scripted reply — auto-play it
    const nt = nameToSq(nextMove[1]);
    setTimeout(() => {
      puzzleGame.makeMove(nf.rank, nf.file, nt.rank, nt.file, nextMove[2] || undefined);
      puzzleSolutionStep++;
      renderPuzzleBoard();
      playAnyForcedRepliesThenCheck(); // continue in case of further forced replies
    }, 500);
  } else {
    checkPuzzleCompletion();
  }
}

function getPuzzleMoverColor(p) {
  return ChessGame.fromFEN(p.fen).turn;
}

function isPuzzleComplete() {
  const p = puzzleQueue[puzzleIndex];
  return puzzleSolutionStep >= p.solution.length;
}

function checkPuzzleCompletion() {
  const p = puzzleQueue[puzzleIndex];
  const statusEl = document.getElementById('puzzle-status');
  if (puzzleSolutionStep >= p.solution.length) {
    if (!p.expectMate || puzzleGame.result === 'checkmate') {
      statusEl.textContent = '정답이에요! 다음 문제로 넘어갑니다.';
      statusEl.className = 'puzzle-status correct';
      puzzleSolved++;
      setTimeout(() => {
        if (puzzleIndex + 1 < puzzleQueue.length) {
          puzzleIndex++;
          loadPuzzle(puzzleIndex);
        } else {
          statusEl.textContent = `이 난이도의 퍼즐을 모두 풀었어요! (${puzzleSolved}/${puzzleQueue.length})`;
          statusEl.className = 'puzzle-status correct';
        }
      }, 1200);
    }
  } else {
    statusEl.textContent = '좋아요! 계속 진행하세요.';
    statusEl.className = 'puzzle-status correct';
  }
}

function showPuzzleHint() {
  const p = puzzleQueue[puzzleIndex];
  const expected = p.solution[puzzleSolutionStep];
  const from = nameToSq(expected[0]);
  const el = document.querySelector(`#puzzle-board .square[data-rank="${from.rank}"][data-file="${from.file}"]`);
  if (el) el.classList.add('hint-highlight');
  const statusEl = document.getElementById('puzzle-status');
  statusEl.textContent = '힌트: 강조된 기물을 움직여보세요.';
  statusEl.className = 'puzzle-status';
}

document.getElementById('btn-puzzle-hint').addEventListener('click', showPuzzleHint);
document.getElementById('btn-puzzle-retry').addEventListener('click', () => loadPuzzle(puzzleIndex));


