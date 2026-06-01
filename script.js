// ==============================
// 定数
// ==============================
const TILE = 20;
const COLS = 21;
const ROWS = 21;

const WALL  = 1;
const DOT   = 0;
const POWER = 2;
const EMPTY = 3;
const DOOR  = 4;

// ゴーストモード
const HOUSE     = 0;
const EXIT      = 1;
const CHASE     = 2;
const FRIGHTENED = 3;
const EATEN     = 4;

// ゴーストの色
const GHOST_COLORS = ['#ff4444', '#ffb8ff', '#00ffff', '#ffb852'];

// ==============================
// 迷路定義
// ==============================
const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  [1,2,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,2,1],
  [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
  [1,0,0,0,0,1,1,0,1,1,3,1,1,0,1,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,0,1,1,4,1,1,0,1,1,0,1,1,1,1],
  [1,1,1,1,0,1,1,0,1,3,3,3,1,0,1,1,0,1,1,1,1],
  [3,3,3,3,0,3,3,3,1,3,3,3,1,3,3,3,0,3,3,3,3],
  [1,1,1,1,0,1,1,0,1,3,3,3,1,0,1,1,0,1,1,1,1],
  [1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  [1,2,1,1,0,0,0,0,0,1,3,1,0,0,0,0,0,1,1,2,1],
  [1,1,0,1,0,1,0,1,1,1,3,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,0,3,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,1],
  [1,0,0,0,0,1,1,0,1,1,1,1,1,0,1,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ==============================
// ゲーム状態
// ==============================
const canvas = document.getElementById('game-board');
const ctx    = canvas.getContext('2d');

let maze = [];
let totalDots = 0;
let dotsEaten = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('pacmanHighScore') || '0');
let lives = 3;
let level = 1;
let gameActive = false;
let isPaused = false;
let animationId = null;
let frightenedTimer = 0;
let ghostEatCombo = 0;
let invincibleTimer = 0;  // 死後の無敵フレーム数
let speechTimeout = null;

// ==============================
// BGM / キャラクターシステム（テトリスから流用）
// ==============================
const playlist = [
    {
        bgmId: 'bgm-1', charImage: 'char1.png', charName: 'ヴェル13世',
        speeches: {
            start:      "さあ、迷路を制覇するぜ！",
            eatGhost:   "ゴーストを喰った！！",
            eatPower:   "無敵タイム！来い！",
            levelUp:    "ステージクリア！\n次行くぞ！",
            gameOver:   "やられた…次こそ！",
            newRecord:  "新記録！お前マジか！？",
            die:        "くそ、やられた！",
            songChange: "俺の出番だぜ！"
        }
    },
    {
        bgmId: 'bgm-2', charImage: 'char2.png', charName: 'カーラ・マンソン',
        speeches: {
            start:      "ふふ…迷路を楽しんで",
            eatGhost:   "逃げ場はないわよ♥",
            eatPower:   "今よ…追い詰めなさい",
            levelUp:    "クリアね…\nもっとできる？",
            gameOver:   "終わり？つまらないわ",
            newRecord:  "新記録…\n少し認めてあげる",
            die:        "油断したのね…",
            songChange: "私の時間よ"
        }
    },
    {
        bgmId: 'bgm-3', charImage: 'char3.png', charName: 'アマモリ',
        speeches: {
            start:      "…始まるね。記録するよ",
            eatGhost:   "…食べちゃったんだ",
            eatPower:   "…無敵だよ、急いで",
            levelUp:    "クリア…\n次のページだね",
            gameOver:   "終わっちゃった…\nいい物語だった",
            newRecord:  "新記録…\n特別なページに書くね",
            die:        "…大丈夫？",
            songChange: "…僕の番だね"
        }
    },
    {
        bgmId: 'bgm-4', charImage: 'char4.png', charName: 'ヴェル13世',
        speeches: {
            start:      "覚悟しろ！本気の地獄だ！",
            eatGhost:   "ゴースト喰い！燃えるぜ！！",
            eatPower:   "全力で追い詰めろ！",
            levelUp:    "クリア！\n地獄は深くなるぞ！",
            gameOver:   "終わりだ…\nだがお前は戦った！",
            newRecord:  "新記録！\n伝説に刻んでやる！",
            die:        "くたばれ！次こそ！",
            songChange: "真の姿を見せてやる！"
        }
    },
    {
        bgmId: 'bgm-5', charImage: 'char5.png', charName: 'カーラ・マンソン',
        speeches: {
            start:      "さあ…跪きなさい",
            eatGhost:   "逃げても無駄よ…♥",
            eatPower:   "今こそ…捕まえなさい",
            levelUp:    "クリア…\n逃げられると思った？",
            gameOver:   "終わり？…つまらないわね",
            newRecord:  "新記録…\n少しだけ愛してあげる",
            die:        "また死んだの？弱いわね",
            songChange: "私のステージよ…"
        }
    }
];

let currentTrack = 0;
let isBgmEnabled = true;

function getCurrentSpeech(key) {
    return playlist[currentTrack].speeches[key] || '';
}

function switchCharacter(trackIndex) {
    const t = playlist[trackIndex];
    document.getElementById('game-character').src = t.charImage;
    document.querySelector('.char-name').innerText  = t.charName;
}

function startBGM() {
    if (!isBgmEnabled) return;
    const audio = document.getElementById(playlist[currentTrack].bgmId);
    if (audio) audio.volume = 0.3, audio.play().catch(() => {});
}

function stopBGM() {
    const audio = document.getElementById(playlist[currentTrack].bgmId);
    if (audio) audio.pause();
}

function nextTrack() {
    const cur = document.getElementById(playlist[currentTrack].bgmId);
    if (cur) { cur.pause(); cur.currentTime = 0; }
    currentTrack = (currentTrack + 1) % playlist.length;
    switchCharacter(currentTrack);
    if (gameActive && !isPaused && isBgmEnabled) {
        startBGM();
        showSpeech(getCurrentSpeech('songChange'), 2500);
    }
}

function setupPlaylistListeners() {
    playlist.forEach(track => {
        const audio = document.getElementById(track.bgmId);
        if (audio) audio.addEventListener('ended', () => {
            if (gameActive && !isPaused) nextTrack();
        });
    });
}
setupPlaylistListeners();

function showSpeech(text, duration = 2000) {
    const bubble = document.getElementById('speech-bubble');
    if (!bubble) return;
    bubble.innerText = text;
    bubble.classList.remove('hidden');
    if (speechTimeout) clearTimeout(speechTimeout);
    speechTimeout = setTimeout(() => bubble.classList.add('hidden'), duration);
}

// ==============================
// パックマン
// ==============================
const PM_SPEED_BASE = 0.12;

let pm = {};

function resetPacman() {
    pm = {
        tx: 10, ty: 15,
        px: 10 * TILE + TILE / 2,
        py: 15 * TILE + TILE / 2,
        dir:         { x: 0, y: 0 },
        nextDir:     { x: -1, y: 0 },
        lastMoveDir: { x: 0, y: 0 },  // 直前の移動方向（自動ナビ判定に使用）
        progress: 0,
        speed: PM_SPEED_BASE,
        mouth: 0.25,
        mouthDir: 1,
        alive: true
    };
}

// ==============================
// ゴースト
// ==============================
function makeGhost(id, tx, ty, releaseDelay) {
    return {
        id,
        tx, ty,
        px: tx * TILE + TILE / 2,
        py: ty * TILE + TILE / 2,
        dir: { x: 0, y: id % 2 === 0 ? -1 : 1 },
        progress: 0,
        speed: 0.06,
        mode: HOUSE,
        releaseTimer: releaseDelay,
        color: GHOST_COLORS[id]
    };
}

let ghosts = [];

function resetGhosts() {
    ghosts = [
        makeGhost(0, 10, 8, 120),   // 少し遅めに出現
        makeGhost(1,  9, 8, 300),
        makeGhost(2, 11, 8, 480),
        makeGhost(3, 10, 9, 660),   // 4体目はかなり後から
    ];
}

// ==============================
// 迷路ユーティリティ
// ==============================
function initMaze() {
    maze = MAZE_TEMPLATE.map(row => [...row]);
    totalDots = 0;
    dotsEaten = 0;
    maze.forEach(row => row.forEach(c => { if (c === DOT || c === POWER) totalDots++; }));
}

function tileAt(tx, ty) {
    if (ty < 0 || ty >= ROWS) return WALL;
    const x = ((tx % COLS) + COLS) % COLS;
    return maze[ty][x];
}

function isPassable(tx, ty, isGhost = false) {
    const t = tileAt(tx, ty);
    if (t === WALL) return false;
    if (t === DOOR) return isGhost;
    return true;
}

function wrapTile(tx) {
    return ((tx % COLS) + COLS) % COLS;
}

// ==============================
// 自動ナビゲート
// 「nextDirに曲がれる最も近い場所」まで自動で向かわせる
// ただし「同じ方向に押して壁にぶつかった」場合は発動しない
// ==============================
function autoNavigateToNextDir() {
    // nextDirが未設定なら何もしない
    if (pm.nextDir.x === 0 && pm.nextDir.y === 0) return;
    // 「押した方向 = 直前の移動方向」なら壁に向かって押し続けているだけ → 発動しない
    if (pm.nextDir.x === pm.lastMoveDir.x && pm.nextDir.y === pm.lastMoveDir.y) return;

    const allDirs = [
        { x:  1, y:  0 },
        { x: -1, y:  0 },
        { x:  0, y:  1 },
        { x:  0, y: -1 },
    ];

    let bestDir  = null;
    let bestDist = Infinity;

    for (const startDir of allDirs) {
        // その向きに1歩進める？
        if (!isPassable(wrapTile(pm.tx + startDir.x), pm.ty + startDir.y, false)) continue;

        // startDir方向に進みながら、nextDirに曲がれるタイルを探す
        let tx = pm.tx, ty = pm.ty;
        for (let dist = 1; dist <= 30; dist++) {
            tx = wrapTile(tx + startDir.x);
            ty = ty + startDir.y;
            if (!isPassable(tx, ty, false)) break;           // 壁にぶつかった
            const turnX = wrapTile(tx + pm.nextDir.x);
            const turnY = ty + pm.nextDir.y;
            if (isPassable(turnX, turnY, false)) {           // ここでnextDirに曲がれる！
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir  = startDir;
                }
                break;
            }
        }
    }

    if (bestDir) {
        pm.dir = { ...bestDir };  // 曲がり角へ向かって自動で歩き始める
    }
}

// ==============================
// パックマン更新
// ==============================
function updatePacman() {
    if (!pm.alive) return;
    if (invincibleTimer > 0) invincibleTimer--;

    // 口アニメ
    pm.mouth += 0.05 * pm.mouthDir;
    if (pm.mouth >= 0.35) pm.mouthDir = -1;
    if (pm.mouth <= 0.02) pm.mouthDir = 1;

    if (pm.dir.x === 0 && pm.dir.y === 0) {
        const nx = wrapTile(pm.tx + pm.nextDir.x);
        const ny = pm.ty + pm.nextDir.y;
        if (isPassable(nx, ny, false)) {
            pm.dir = { ...pm.nextDir };
        } else {
            // nextDirに行けない → 曲がれる場所まで自動で向かう
            autoNavigateToNextDir();
        }
        pm.px = pm.tx * TILE + TILE / 2;
        pm.py = pm.ty * TILE + TILE / 2;
        return;
    }

    pm.progress += pm.speed;

    // ターン許容ウィンドウ：出発タイルを少し過ぎても、nextDirに曲がれるなら即座に曲がる
    // （タイミングがシビアでなくなり、操作しやすくなる）
    const TURN_WINDOW = 0.38;
    if (pm.progress > 0 && pm.progress <= TURN_WINDOW) {
        const notReverse = !(pm.nextDir.x === -pm.dir.x && pm.nextDir.y === -pm.dir.y);
        const notSameDir  = pm.nextDir.x !== pm.dir.x || pm.nextDir.y !== pm.dir.y;
        if (notReverse && notSameDir) {
            const enx = wrapTile(pm.tx + pm.nextDir.x);
            const eny = pm.ty + pm.nextDir.y;
            if (isPassable(enx, eny, false)) {
                pm.dir     = { ...pm.nextDir };
                pm.progress = 0;
            }
        }
    }

    if (pm.progress >= 1) {
        pm.tx = wrapTile(pm.tx + pm.dir.x);
        pm.ty = pm.ty + pm.dir.y;
        pm.progress = 0;

        // ドットを食べる
        const cell = tileAt(pm.tx, pm.ty);
        if (cell === DOT) {
            maze[pm.ty][pm.tx] = EMPTY;
            score += 10;
            dotsEaten++;
            updateUI();
        } else if (cell === POWER) {
            maze[pm.ty][pm.tx] = EMPTY;
            score += 50;
            dotsEaten++;
            frightenedTimer = 300;
            ghostEatCombo = 0;
            ghosts.forEach(g => {
                if (g.mode === CHASE || g.mode === FRIGHTENED) g.mode = FRIGHTENED;
            });
            showSpeech(getCurrentSpeech('eatPower'), 2000);
            updateUI();
        }

        // 方向転換を試みる
        const nxt = pm.nextDir;
        const nnx = wrapTile(pm.tx + nxt.x);
        const nny = pm.ty + nxt.y;
        if (isPassable(nnx, nny, false)) {
            pm.dir = { ...nxt };
        }

        // 現在の方向に進めるか確認
        const cx = wrapTile(pm.tx + pm.dir.x);
        const cy = pm.ty + pm.dir.y;
        if (!isPassable(cx, cy, false)) {
            pm.lastMoveDir = { ...pm.dir };  // 止まる直前の向きを記録
            pm.dir = { x: 0, y: 0 };
        }
    }

    // ピクセル位置補間
    const ntx = wrapTile(pm.tx + pm.dir.x);
    const nty = pm.ty + pm.dir.y;
    const targetPx = ntx * TILE + TILE / 2;
    const targetPy = nty * TILE + TILE / 2;

    // トンネル折り返しの補間（左右端）
    let fromPx = pm.tx * TILE + TILE / 2;
    if (pm.dir.x === 1 && pm.tx === COLS - 1) {
        pm.px = lerp(fromPx, COLS * TILE + TILE / 2, pm.progress);
    } else if (pm.dir.x === -1 && pm.tx === 0) {
        pm.px = lerp(fromPx, -TILE / 2, pm.progress);
    } else {
        pm.px = lerp(fromPx, targetPx, pm.progress);
    }
    pm.py = lerp(pm.ty * TILE + TILE / 2, targetPy, pm.progress);
}

// ==============================
// ゴースト更新
// ==============================
function updateGhosts() {
    if (frightenedTimer > 0) {
        frightenedTimer--;
        if (frightenedTimer === 0) {
            ghosts.forEach(g => { if (g.mode === FRIGHTENED) g.mode = CHASE; });
        }
    }

    ghosts.forEach(g => {
        if (g.mode === HOUSE) {
            updateGhostHouse(g);
            return;
        }

        g.progress += g.speed;
        if (g.progress < 1) {
            interpolateGhost(g);
            return;
        }

        // 次のタイルへ
        g.tx = wrapTile(g.tx + g.dir.x);
        g.ty = g.ty + g.dir.y;
        g.progress = 0;

        if (g.mode === EXIT) {
            updateGhostExit(g);
        } else if (g.mode === EATEN) {
            updateGhostEaten(g);
        } else {
            // CHASE / FRIGHTENED
            chooseGhostDir(g);
        }

        interpolateGhost(g);
    });

    // パックマンとの衝突判定
    checkPacGhostCollision();
}

function updateGhostHouse(g) {
    g.releaseTimer--;

    // 家の中で上下に往復
    g.progress += 0.05;
    if (g.progress >= 1) {
        g.ty += g.dir.y;
        g.progress = 0;
        // 家の範囲内で折り返す（行7〜9、列9〜11）
        if (g.ty < 7) { g.ty = 7;  g.dir.y = 1; }
        if (g.ty > 9) { g.ty = 9;  g.dir.y = -1; }
        if (tileAt(g.tx, g.ty + g.dir.y) === WALL) g.dir.y *= -1;
    }

    g.px = g.tx * TILE + TILE / 2;
    const nty = g.ty + g.dir.y;
    g.py = lerp(g.ty * TILE + TILE / 2, nty * TILE + TILE / 2, g.progress);

    if (g.releaseTimer <= 0) {
        // 脱出開始：まず列10に向かう
        g.mode = EXIT;
        g.dir = { x: 0, y: 0 };
        g.progress = 0;
    }
}

function updateGhostExit(g) {
    // 列10に向かう → 次に行5まで上昇
    if (g.ty <= 5 && g.tx === 10) {
        g.mode = CHASE;
        g.speed = getGhostSpeed(g);
        return;
    }
    if (g.tx !== 10) {
        g.dir = { x: g.tx < 10 ? 1 : -1, y: 0 };
        g.speed = 0.08;
    } else {
        g.dir = { x: 0, y: -1 };
        g.speed = 0.08;
    }
}

function updateGhostEaten(g) {
    // ゴーストハウス入口(6, 10)を目指す
    if (g.tx === 10 && g.ty === 8) {
        // 家に戻った
        g.mode = HOUSE;
        g.releaseTimer = 180;
        g.dir = { x: 0, y: 1 };
        g.speed = getGhostSpeed(g);
        return;
    }
    // 最短方向を選ぶ
    const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    const valid = dirs.filter(d => {
        const nx = wrapTile(g.tx + d.x);
        const ny = g.ty + d.y;
        return isPassable(nx, ny, true) && !(d.x === -g.dir.x && d.y === -g.dir.y);
    });
    if (valid.length === 0) return;
    valid.sort((a, b) => {
        const da = Math.abs(g.tx + a.x - 10) + Math.abs(g.ty + a.y - 8);
        const db = Math.abs(g.tx + b.x - 10) + Math.abs(g.ty + b.y - 8);
        return da - db;
    });
    g.dir = valid[0];
}

function chooseGhostDir(g) {
    const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    const reverse = { x: -g.dir.x, y: -g.dir.y };

    const valid = dirs.filter(d => {
        if (d.x === reverse.x && d.y === reverse.y) return false;
        const nx = wrapTile(g.tx + d.x);
        const ny = g.ty + d.y;
        return isPassable(nx, ny, false);
    });

    if (valid.length === 0) {
        if (isPassable(wrapTile(g.tx + reverse.x), g.ty + reverse.y, false)) {
            g.dir = reverse;
        }
        return;
    }

    if (g.mode === FRIGHTENED) {
        // ランダム移動
        g.dir = valid[Math.floor(Math.random() * valid.length)];
        return;
    }

    // CHASE: id=0はパックマン直追い、他はランダム
    if (g.id === 0) {
        valid.sort((a, b) => {
            const da = Math.abs(g.tx + a.x - pm.tx) + Math.abs(g.ty + a.y - pm.ty);
            const db = Math.abs(g.tx + b.x - pm.tx) + Math.abs(g.ty + b.y - pm.ty);
            return da - db;
        });
        g.dir = valid[0];
    } else {
        g.dir = valid[Math.floor(Math.random() * valid.length)];
    }
}

function interpolateGhost(g) {
    const ntx = wrapTile(g.tx + g.dir.x);
    const nty = g.ty + g.dir.y;
    const fromPx = g.tx * TILE + TILE / 2;
    const targetPx = ntx * TILE + TILE / 2;
    const targetPy = nty * TILE + TILE / 2;

    if (g.dir.x === 1 && g.tx === COLS - 1) {
        g.px = lerp(fromPx, COLS * TILE + TILE / 2, g.progress);
    } else if (g.dir.x === -1 && g.tx === 0) {
        g.px = lerp(fromPx, -TILE / 2, g.progress);
    } else {
        g.px = lerp(fromPx, targetPx, g.progress);
    }
    g.py = lerp(g.ty * TILE + TILE / 2, targetPy, g.progress);
}

function getGhostSpeed(g) {
    return 0.07 + (level - 1) * 0.005;
}

function checkPacGhostCollision() {
    if (!pm.alive || invincibleTimer > 0) return;
    ghosts.forEach(g => {
        if (g.mode === EATEN) return;
        const dx = Math.abs(pm.px - g.px);
        const dy = Math.abs(pm.py - g.py);
        if (dx < TILE * 0.7 && dy < TILE * 0.7) {
            if (g.mode === FRIGHTENED) {
                // ゴーストを食べる
                g.mode = EATEN;
                g.speed = 0.18;
                ghostEatCombo++;
                const pts = 200 * Math.pow(2, ghostEatCombo - 1);
                score += pts;
                updateUI();
                showSpeech(getCurrentSpeech('eatGhost'), 1500);
            } else {
                // パックマンがやられる
                pacmanDie();
            }
        }
    });
}

function pacmanDie() {
    lives--;
    updateUI();

    if (lives <= 0) {
        gameOver();
    } else {
        showSpeech(getCurrentSpeech('die'), 2000);
        invincibleTimer = 120;
        resetPacman();
        resetGhosts();
    }
}

// ==============================
// 描画
// ==============================
function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = maze[row][col];
            const x = col * TILE;
            const y = row * TILE;
            const cx = x + TILE / 2;
            const cy = y + TILE / 2;

            if (cell === WALL) {
                ctx.fillStyle = '#1a1a4e';
                ctx.fillRect(x, y, TILE, TILE);
                // ネオンっぽい縁
                ctx.strokeStyle = 'rgba(80, 42, 180, 0.6)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
            } else if (cell === DOT) {
                ctx.fillStyle = 'rgba(255, 255, 220, 0.85)';
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(255,255,200,0.6)';
                ctx.beginPath();
                ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (cell === POWER) {
                const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 200);
                ctx.fillStyle = `rgba(255, 200, 0, ${pulse})`;
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ffcc00';
                ctx.beginPath();
                ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (cell === DOOR) {
                ctx.strokeStyle = 'rgba(255, 180, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 2, cy);
                ctx.lineTo(x + TILE - 2, cy);
                ctx.stroke();
            }
        }
    }
}

function drawPacman() {
    if (!pm.alive) return;

    // 無敵時は点滅
    if (invincibleTimer > 0 && Math.floor(invincibleTimer / 8) % 2 === 0) return;

    const dx = pm.dir.x, dy = pm.dir.y;
    const angle = dx === 1 ? 0 : dx === -1 ? Math.PI : dy === 1 ? Math.PI / 2 : dy === -1 ? -Math.PI / 2 : 0;
    const mouth = pm.mouth;

    ctx.save();
    ctx.translate(pm.px, pm.py);
    ctx.rotate(angle);
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffcc00';
    ctx.fillStyle = '#ffe000';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, TILE / 2 - 1, mouth * Math.PI, (2 - mouth) * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawGhosts() {
    ghosts.forEach(g => {
        ctx.save();
        ctx.translate(g.px, g.py);

        const r = TILE / 2 - 1;

        let bodyColor;
        if (g.mode === FRIGHTENED) {
            const flash = frightenedTimer < 80 && Math.floor(frightenedTimer / 10) % 2 === 0;
            bodyColor = flash ? '#ffffff' : '#2020ff';
        } else if (g.mode === EATEN) {
            // 目だけ描画
            drawGhostEyes(ctx, r);
            ctx.restore();
            return;
        } else {
            bodyColor = g.color;
        }

        // ゴースト本体
        ctx.fillStyle = bodyColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = bodyColor;
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r, Math.PI, 0, false);
        ctx.lineTo(r, r * 0.7);
        // 波型底辺
        const waveCount = 3;
        const waveW = (2 * r) / waveCount;
        for (let i = waveCount - 1; i >= 0; i--) {
            const wx = -r + waveW * i + waveW / 2;
            const wy = i % 2 === 0 ? r * 0.4 : r * 0.7;
            ctx.lineTo(wx, wy);
        }
        ctx.lineTo(-r, r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        if (g.mode !== FRIGHTENED) {
            drawGhostEyes(ctx, r);
        } else {
            // びっくり顔
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(-r * 0.35, -r * 0.1, r * 0.15, 0, Math.PI * 2);
            ctx.arc( r * 0.35, -r * 0.1, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

function drawGhostEyes(ctx, r) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.3, r * 0.22, r * 0.28, 0, 0, Math.PI * 2);
    ctx.ellipse( r * 0.35, -r * 0.3, r * 0.22, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0044ff';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.25, r * 0.12, 0, Math.PI * 2);
    ctx.arc( r * 0.35, -r * 0.25, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    drawMaze();
    drawGhosts();
    drawPacman();
}

// ==============================
// ゲームループ
// ==============================
function gameLoop() {
    if (!gameActive || isPaused) return;

    updatePacman();
    updateGhosts();

    // 全ドット食べたらステージクリア
    if (dotsEaten >= totalDots) {
        stageClear();
        return;
    }

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// ==============================
// ゲーム制御
// ==============================
function startGame() {
    initMaze();
    score = 0;
    lives = 3;
    level = 1;
    isPaused = false;
    invincibleTimer = 0;
    frightenedTimer = 0;
    ghostEatCombo = 0;

    // BGMをリセット
    playlist.forEach(t => {
        const a = document.getElementById(t.bgmId);
        if (a) { a.pause(); a.currentTime = 0; }
    });
    currentTrack = 0;
    switchCharacter(0);

    resetPacman();
    resetGhosts();
    updateUI();
    hideAllOverlays();

    gameActive = true;
    startBGM();
    showSpeech(getCurrentSpeech('start'), 2000);
    animationId = requestAnimationFrame(gameLoop);
}

function nextStage() {
    level++;
    initMaze();
    isPaused = false;
    invincibleTimer = 0;
    frightenedTimer = 0;
    ghostEatCombo = 0;
    resetPacman();
    resetGhosts();
    // ゴーストの速度を少し上げる
    updateUI();
    hideAllOverlays();
    gameActive = true;
    showSpeech(getCurrentSpeech('start'), 2000);
    animationId = requestAnimationFrame(gameLoop);
}

function stageClear() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    stopBGM();
    document.getElementById('clear-score').innerText = score;
    document.getElementById('clear-screen').classList.remove('hidden');
    showSpeech(getCurrentSpeech('levelUp'), 3000);
    updateHighScore();
}

function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    stopBGM();
    document.getElementById('final-score').innerText = score;
    document.getElementById('game-over-screen').classList.remove('hidden');

    if (score > highScore && score > 0) {
        highScore = score;
        localStorage.setItem('pacmanHighScore', highScore);
        document.getElementById('high-score').innerText = highScore;
        showSpeech(getCurrentSpeech('newRecord'), 4000);
    } else {
        showSpeech(getCurrentSpeech('gameOver'), 3000);
    }
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacmanHighScore', highScore);
    }
    document.getElementById('high-score').innerText = highScore;
}

function togglePause() {
    if (!gameActive) return;
    isPaused = !isPaused;
    if (isPaused) {
        stopBGM();
        cancelAnimationFrame(animationId);
        document.getElementById('pause-screen').classList.remove('hidden');
    } else {
        document.getElementById('pause-screen').classList.add('hidden');
        startBGM();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function hideAllOverlays() {
    ['start-screen','game-over-screen','clear-screen','pause-screen'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('high-score').innerText = highScore;
    document.getElementById('level').innerText = level;
    const heartsArr = [];
    for (let i = 0; i < lives; i++) heartsArr.push('♥');
    document.getElementById('lives').innerText = heartsArr.join('') || '×';
}

// ==============================
// ユーティリティ
// ==============================
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ==============================
// キーボード入力
// ==============================
const DIR_MAP = {
    37: { x: -1, y: 0 },
    39: { x: 1,  y: 0 },
    38: { x: 0,  y: -1 },
    40: { x: 0,  y: 1 },
    65: { x: -1, y: 0 },
    68: { x: 1,  y: 0 },
    87: { x: 0,  y: -1 },
    83: { x: 0,  y: 1 },
};

document.addEventListener('keydown', e => {
    if (e.keyCode === 80) { togglePause(); return; }
    if (!gameActive || isPaused) return;
    const d = DIR_MAP[e.keyCode];
    if (d) { pm.nextDir = d; e.preventDefault(); }
});

// ==============================
// モバイルボタン
// ==============================
function setupMobileControls() {
    const btnMap = [
        ['btn-up',    { x: 0,  y: -1 }],
        ['btn-down',  { x: 0,  y: 1  }],
        ['btn-left',  { x: -1, y: 0  }],
        ['btn-right', { x: 1,  y: 0  }],
    ];
    btnMap.forEach(([id, dir]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const setDir = (e) => {
            e.preventDefault();
            if (gameActive && !isPaused) pm.nextDir = dir;
        };
        btn.addEventListener('touchstart', setDir, { passive: false });
        btn.addEventListener('mousedown', setDir);
    });
    document.getElementById('btn-pause').addEventListener('click', togglePause);
}
setupMobileControls();

// ==============================
// UIボタン
// ==============================
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('next-btn').addEventListener('click', nextStage);
document.getElementById('resume-btn').addEventListener('click', togglePause);
document.getElementById('btn-bgm').addEventListener('click', e => {
    isBgmEnabled = !isBgmEnabled;
    e.currentTarget.innerText = isBgmEnabled ? '🔊' : '🔈';
    if (gameActive && !isPaused) {
        if (isBgmEnabled) startBGM(); else stopBGM();
    }
    e.currentTarget.blur();
});

// スワイプ操作
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });
canvas.addEventListener('touchend', e => {
    if (!gameActive || isPaused) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
        pm.nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
        pm.nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
}, { passive: true });

// ==============================
// 初期描画
// ==============================
initMaze();
draw();
updateUI();
