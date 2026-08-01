// ==================== Online connection layer (PeerJS) ====================
// Uses PeerJS's free public broker server only for signaling (finding the peer).
// Actual game data (moves, clock, chat) flows peer-to-peer via WebRTC data channel.
// No account/signup needed. Room "code" = a short random string appended to a
// namespaced Peer ID so codes don't collide with other apps using the same broker.

const ONLINE_NS = 'nocturne-chess-v1-';

function generateRoomCode(len = 6) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const all = letters + digits;
  let code = '';
  for (let i = 0; i < len; i++) code += all[Math.floor(Math.random() * all.length)];
  return code;
}

class OnlineSession {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.roomCode = null;
    this.isHost = false;
    this.myColor = null; // 'w' or 'b'
    this.onMessage = null; // callback(msg) — game messages (move, resign, etc.)
    this.onNickname = null; // callback(nickname) — handled separately so it
    // can be wired up immediately on connect, before the game screen (and its
    // onMessage handler) exists.
    this.onConnected = null; // callback()
    this.onDisconnected = null; // callback()
    this.onError = null; // callback(err)
    this._scriptLoaded = false;
  }

  async _ensurePeerJSLoaded() {
    if (window.Peer) { this._scriptLoaded = true; return; }
    if (this._scriptLoaded) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('PeerJS 라이브러리를 불러오지 못했어요. 네트워크 연결을 확인해주세요.'));
      document.head.appendChild(script);
    });
    this._scriptLoaded = true;
  }

  async hostRoom() {
    await this._ensurePeerJSLoaded();
    this.roomCode = generateRoomCode(6);
    this.isHost = true;
    this.myColor = 'w'; // host plays white by default

    return new Promise((resolve, reject) => {
      const peerId = ONLINE_NS + this.roomCode;
      this.peer = new Peer(peerId, { debug: 0 });

      this.peer.on('open', () => {
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        this.conn = conn;
        this._wireConnection();
      });

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // extremely rare collision — retry with a new code
          this.roomCode = generateRoomCode(6);
          reject(new Error('COLLISION_RETRY'));
        } else {
          if (this.onError) this.onError(err);
          reject(err);
        }
      });
    });
  }

  async joinRoom(code) {
    await this._ensurePeerJSLoaded();
    this.isHost = false;
    this.myColor = 'b'; // joiner plays black
    this.roomCode = code;

    return new Promise((resolve, reject) => {
      this.peer = new Peer({ debug: 0 });

      this.peer.on('open', () => {
        const targetId = ONLINE_NS + code;
        const conn = this.peer.connect(targetId, { reliable: true });
        this.conn = conn;

        const timeout = setTimeout(() => {
          reject(new Error('방을 찾을 수 없어요. 코드를 확인해주세요.'));
        }, 12000);

        conn.on('open', () => {
          clearTimeout(timeout);
          this._wireConnection();
          resolve(true);
        });
        conn.on('error', (err) => {
          clearTimeout(timeout);
          reject(new Error('연결에 실패했어요. 코드를 확인하거나 다시 시도해주세요.'));
        });
      });

      this.peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          reject(new Error('방을 찾을 수 없어요. 코드를 확인해주세요.'));
        } else {
          if (this.onError) this.onError(err);
          reject(err);
        }
      });
    });
  }

  _wireConnection() {
    this.conn.on('data', (data) => {
      if (data && data.type === 'nickname') {
        if (this.onNickname) this.onNickname(data.nickname);
        return;
      }
      if (this.onMessage) this.onMessage(data);
    });
    this.conn.on('open', () => {
      if (this.onConnected) this.onConnected();
    });
    this.conn.on('close', () => {
      if (this.onDisconnected) this.onDisconnected();
    });
    // In case 'open' already fired before we attached (host side after 'connection' event)
    if (this.conn.open) {
      if (this.onConnected) this.onConnected();
    }
  }

  send(msg) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
      return true;
    }
    return false;
  }

  close() {
    if (this.conn) { try { this.conn.close(); } catch (e) {} }
    if (this.peer) { try { this.peer.destroy(); } catch (e) {} }
    this.conn = null;
    this.peer = null;
  }
}
