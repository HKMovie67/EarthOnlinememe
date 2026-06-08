// ==================== 地球Online 遊戲世界 ====================
// Canvas-based Hong Kong street scene with character + NPCs + Multiplayer

let gameWorldRunning = false;
let gwCanvas, gwCtx;
let gwAnimationId;

// ── Player state ──
let playerX = 400, playerY = 0;
let playerVX = 0, playerDir = 1;
let playerBob = 0;
let npcs = [];
let buildings = [];
let gwClouds = [];
let eventCooldown = 0;
let streetOffset = 0;

// ── Colors ──
const SKY_TOP = '#1a1a2e';
const SKY_BOT = '#16213e';
const ROAD_COLOR = '#2d2d2d';
const SIDEWALK_COLOR = '#c4b5a5';

function initGameWorld() {
  gwCanvas = document.getElementById('gw-canvas');
  if (!gwCanvas) return;
  
  gwCanvas.width = window.innerWidth;
  gwCanvas.height = window.innerHeight;
  gwCtx = gwCanvas.getContext('2d');
  
  buildings = [];
  for (let i = 0; i < 20; i++) {
    buildings.push({
      x: i * 180 + Math.random() * 40,
      w: 80 + Math.random() * 100,
      h: 120 + Math.random() * 280,
      color: randomHKColor(),
      windows: Math.floor(Math.random() * 4) + 2,
      sign: randomHKSign()
    });
  }
  
  gwClouds = [];
  for (let i = 0; i < 6; i++) {
    gwClouds.push({
      x: Math.random() * gwCanvas.width,
      y: 30 + Math.random() * 100,
      w: 80 + Math.random() * 120,
      speed: 0.2 + Math.random() * 0.4
    });
  }
  
  npcs = [];
  spawnRandomNPCs(5);
  
  playerX = gwCanvas.width * 0.3;
  playerY = 0;
  gameWorldRunning = true;
  eventCooldown = 300;
  
  gameWorldLoop();
}

function randomHKColor() {
  const colors = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6',
                  '#1abc9c','#e84393','#6c5ce7','#00b894','#fd79a8','#fab1a0'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function randomHKSign() {
  const signs = ['茶餐廳','八仔','惠傷','十佳','丑心','小家樂','大慢活',
                 '千寧','曲臣氏','KO','麥當奴','許溜山','太廢','翠花',
                 '地慘代理','藥方','找換片','補習社','禽行','跌打','機鋪'];
  return signs[Math.floor(Math.random() * signs.length)];
}

// ── NPC ──
function spawnNPC(type, x) {
  const types = {
    'pedestrian': { color: '#aaa', w: 14, h: 28, speed: 0.3 + Math.random() * 0.5 },
    'friend':     { color: '#00ff88', w: 16, h: 30, speed: 0.2, label: '👋' },
    'parent':     { color: '#ff6b6b', w: 18, h: 34, speed: 0.6, label: '😠' },
    'teacher':    { color: '#ffd93d', w: 16, h: 32, speed: 0.1, label: '📚' },
    'love':       { color: '#ff69b4', w: 15, h: 29, speed: 0.25, label: '💕' },
    'bus':        { color: '#ff3333', w: 80, h: 40, speed: 2.5, isVehicle: true }
  };
  const t = types[type] || types['pedestrian'];
  return {
    type, x: x || gwCanvas.width + Math.random() * 300,
    y: 0, ...t,
    bobOffset: Math.random() * Math.PI * 2
  };
}

function spawnRandomNPCs(count) {
  const types = ['pedestrian','pedestrian','pedestrian','friend','parent','teacher'];
  for (let i = 0; i < count; i++) {
    const t = types[Math.floor(Math.random() * types.length)];
    npcs.push(spawnNPC(t));
  }
}

// ── Draw ──
function drawSky() {
  const grad = gwCtx.createLinearGradient(0, 0, 0, gwCanvas.height * 0.6);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(0.6, '#3498db');
  grad.addColorStop(1, '#87CEEB');
  gwCtx.fillStyle = grad;
  gwCtx.fillRect(0, 0, gwCanvas.width, gwCanvas.height * 0.6);
}

function drawClouds() {
  gwClouds.forEach(c => {
    gwCtx.fillStyle = 'rgba(255,255,255,0.7)';
    gwCtx.beginPath();
    gwCtx.ellipse(c.x, c.y, c.w/2, c.w/4, 0, 0, Math.PI*2);
    gwCtx.fill();
    gwCtx.beginPath();
    gwCtx.ellipse(c.x - c.w*0.25, c.y + 5, c.w/3, c.w/4, 0, 0, Math.PI*2);
    gwCtx.fill();
  });
}

function drawBuildings() {
  const sidewalkY = gwCanvas.height * 0.72;
  const roadY = sidewalkY + 20;
  
  buildings.forEach(b => {
    const bx = b.x - streetOffset;
    if (bx + b.w < -50 || bx > gwCanvas.width + 50) return;
    
    gwCtx.fillStyle = b.color;
    gwCtx.fillRect(bx, sidewalkY - b.h, b.w, b.h);
    
    const winW = 12, winH = 16, gapX = 18, gapY = 24;
    for (let row = 0; row < b.windows; row++) {
      for (let col = 0; col < Math.floor(b.w / gapX) - 1; col++) {
        const wx = bx + 8 + col * gapX;
        const wy = sidewalkY - b.h + 15 + row * gapY;
        if (wy > sidewalkY - 10) continue;
        gwCtx.fillStyle = (Math.random() > 0.3) ? '#ffeaa7' : '#636e72';
        gwCtx.fillRect(wx, wy, winW, winH);
      }
    }
    
    gwCtx.fillStyle = '#fff';
    gwCtx.font = 'bold 11px "Microsoft JhengHei", sans-serif';
    gwCtx.textAlign = 'center';
    gwCtx.fillText(b.sign, bx + b.w/2, sidewalkY - b.h + 8);
    
    gwCtx.fillStyle = '#4a3728';
    gwCtx.fillRect(bx + b.w*0.35, sidewalkY - 30, b.w*0.3, 30);
  });
  
  gwCtx.fillStyle = SIDEWALK_COLOR;
  gwCtx.fillRect(0, sidewalkY, gwCanvas.width, 20);
  
  gwCtx.fillStyle = ROAD_COLOR;
  gwCtx.fillRect(0, roadY, gwCanvas.width, gwCanvas.height - roadY);
  
  gwCtx.strokeStyle = '#f1c40f';
  gwCtx.lineWidth = 2;
  gwCtx.setLineDash([30, 20]);
  gwCtx.beginPath();
  gwCtx.moveTo(0, roadY + 40);
  gwCtx.lineTo(gwCanvas.width, roadY + 40);
  gwCtx.stroke();
  gwCtx.setLineDash([]);
  
  gwCtx.fillStyle = '#e74c3c';
  gwCtx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
  gwCtx.fillText('🚌 巴士站', gwCanvas.width * 0.6 - streetOffset, sidewalkY - 5);
}

function drawPlayer() {
  const sidewalkY = gwCanvas.height * 0.72;
  const bobY = Math.sin(playerBob * 0.1) * 3;
  const px = playerX;
  const py = sidewalkY - 38 + bobY;
  
  gwCtx.fillStyle = 'rgba(0,0,0,0.3)';
  gwCtx.beginPath();
  gwCtx.ellipse(px, sidewalkY - 2, 10, 3, 0, 0, Math.PI*2);
  gwCtx.fill();
  
  const isMale = playerContext.gender === '男';
  const wealthLevel = playerContext.wealth / 100000;
  
  gwCtx.strokeStyle = isMale ? '#2c3e50' : '#c0392b';
  gwCtx.lineWidth = 3;
  gwCtx.beginPath();
  gwCtx.moveTo(px - 4, py + 20);
  gwCtx.lineTo(px - 5, py + 32);
  gwCtx.moveTo(px + 4, py + 20);
  gwCtx.lineTo(px + 5, py + 32);
  gwCtx.stroke();
  
  const shirtColor = wealthLevel > 0.7 ? '#8e44ad' : wealthLevel > 0.3 ? '#2980b9' : '#7f8c8d';
  gwCtx.fillStyle = shirtColor;
  gwCtx.fillRect(px - 8, py + 6, 16, 16);
  
  gwCtx.fillStyle = '#f5d6a0';
  gwCtx.beginPath();
  gwCtx.arc(px, py + 2, 9, 0, Math.PI*2);
  gwCtx.fill();
  
  gwCtx.fillStyle = '#2c1810';
  if (isMale) {
    gwCtx.beginPath();
    gwCtx.arc(px, py - 1, 9, Math.PI, Math.PI*2);
    gwCtx.fill();
  } else {
    gwCtx.beginPath();
    gwCtx.arc(px, py - 2, 10, Math.PI, Math.PI*2);
    gwCtx.fill();
    gwCtx.fillRect(px - 2, py - 10, 4, 8);
  }
  
  const hasASD = playerTraits.some(t => t.id === 'asd');
  const hasADHD = playerTraits.some(t => t.id === 'adhd');
  
  if (hasASD) {
    gwCtx.strokeStyle = '#ff4757';
    gwCtx.lineWidth = 2;
    gwCtx.beginPath();
    gwCtx.arc(px, py + 3, 13, Math.PI*0.8, Math.PI*2.2);
    gwCtx.stroke();
    gwCtx.fillStyle = '#ff4757';
    gwCtx.fillRect(px - 14, py, 6, 8);
    gwCtx.fillRect(px + 8, py, 6, 8);
  }
  
  if (hasADHD && Math.random() > 0.5) {
    gwCtx.strokeStyle = '#f1c40f';
    gwCtx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const lx = px + playerDir * (15 + i*8);
      gwCtx.beginPath();
      gwCtx.moveTo(px, py + i*4 - 4);
      gwCtx.lineTo(lx, py + i*4 - 4);
      gwCtx.stroke();
    }
  }
  
  // "YOU" indicator
  gwCtx.fillStyle = '#00a8ff';
  gwCtx.font = 'bold 9px "Microsoft JhengHei", sans-serif';
  gwCtx.textAlign = 'center';
  gwCtx.fillText('YOU', px, py - 16);
}

function drawNPCs() {
  const sidewalkY = gwCanvas.height * 0.72;
  
  npcs.forEach(npc => {
    const nx = npc.x - streetOffset;
    if (nx < -80 || nx > gwCanvas.width + 80) return;
    
    const bob = Math.sin(Date.now() * 0.003 + npc.bobOffset) * 2;
    const ny = sidewalkY - npc.h + bob;
    
    if (npc.isVehicle) {
      gwCtx.fillStyle = npc.color;
      gwCtx.fillRect(nx - npc.w/2, sidewalkY + 30, npc.w, npc.h);
      gwCtx.fillStyle = '#fff';
      gwCtx.fillRect(nx - npc.w/2 + 5, sidewalkY + 35, 12, 10);
      gwCtx.fillRect(nx + npc.w/2 - 17, sidewalkY + 35, 12, 10);
    } else {
      gwCtx.fillStyle = 'rgba(0,0,0,0.2)';
      gwCtx.beginPath();
      gwCtx.ellipse(nx, sidewalkY - 2, npc.w/2, 2, 0, 0, Math.PI*2);
      gwCtx.fill();
      
      gwCtx.fillStyle = npc.color;
      gwCtx.fillRect(nx - npc.w/2, ny, npc.w, npc.h);
      
      gwCtx.fillStyle = '#f5d6a0';
      gwCtx.beginPath();
      gwCtx.arc(nx, ny - 4, 6, 0, Math.PI*2);
      gwCtx.fill();
      
      if (npc.label) {
        gwCtx.font = '12px sans-serif';
        gwCtx.textAlign = 'center';
        gwCtx.fillText(npc.label, nx, ny - 12);
      }
    }
  });
}

// ── Draw OTHER REAL PLAYERS ──
function drawOtherPlayers() {
  const sidewalkY = gwCanvas.height * 0.72;
  
  Object.values(otherPlayers).forEach(p => {
    const px = p.x - streetOffset;
    if (px < -50 || px > gwCanvas.width + 50) return;
    
    const bob = Math.sin(Date.now() * 0.003 + (p.x || 0) * 0.01) * 2;
    const py = sidewalkY - 38 + bob;
    const isMale = p.gender === '男';
    const hasASD = (p.traits || []).includes('asd');
    const hasADHD = (p.traits || []).includes('adhd');
    const wealthLevel = (p.wealth || 50000) / 100000;
    
    // Glow indicator for real players
    gwCtx.strokeStyle = 'rgba(0,255,136,0.5)';
    gwCtx.lineWidth = 2;
    gwCtx.beginPath();
    gwCtx.ellipse(px, py, 18, 30, 0, 0, Math.PI*2);
    gwCtx.stroke();
    
    // Shadow
    gwCtx.fillStyle = 'rgba(0,0,0,0.3)';
    gwCtx.beginPath();
    gwCtx.ellipse(px, sidewalkY - 2, 10, 3, 0, 0, Math.PI*2);
    gwCtx.fill();
    
    // Legs
    gwCtx.strokeStyle = isMale ? '#2c3e50' : '#c0392b';
    gwCtx.lineWidth = 3;
    gwCtx.beginPath();
    gwCtx.moveTo(px - 4, py + 20);
    gwCtx.lineTo(px - 5, py + 32);
    gwCtx.moveTo(px + 4, py + 20);
    gwCtx.lineTo(px + 5, py + 32);
    gwCtx.stroke();
    
    // Body
    const shirtColor = wealthLevel > 0.7 ? '#8e44ad' : wealthLevel > 0.3 ? '#2980b9' : '#7f8c8d';
    gwCtx.fillStyle = shirtColor;
    gwCtx.fillRect(px - 8, py + 6, 16, 16);
    
    // Head
    gwCtx.fillStyle = '#f5d6a0';
    gwCtx.beginPath();
    gwCtx.arc(px, py + 2, 9, 0, Math.PI*2);
    gwCtx.fill();
    
    // Hair
    gwCtx.fillStyle = '#2c1810';
    if (isMale) {
      gwCtx.beginPath();
      gwCtx.arc(px, py - 1, 9, Math.PI, Math.PI*2);
      gwCtx.fill();
    } else {
      gwCtx.beginPath();
      gwCtx.arc(px, py - 2, 10, Math.PI, Math.PI*2);
      gwCtx.fill();
      gwCtx.fillRect(px - 2, py - 10, 4, 8);
    }
    
    // ASD headphones
    if (hasASD) {
      gwCtx.strokeStyle = '#ff4757';
      gwCtx.lineWidth = 2;
      gwCtx.beginPath();
      gwCtx.arc(px, py + 3, 13, Math.PI*0.8, Math.PI*2.2);
      gwCtx.stroke();
      gwCtx.fillStyle = '#ff4757';
      gwCtx.fillRect(px - 14, py, 6, 8);
      gwCtx.fillRect(px + 8, py, 6, 8);
    }
    
    // ADHD motion
    if (hasADHD && Math.random() > 0.5) {
      gwCtx.strokeStyle = '#f1c40f';
      gwCtx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        gwCtx.beginPath();
        gwCtx.moveTo(px, py + i*4 - 4);
        gwCtx.lineTo(px + p.dir * (15 + i*8), py + i*4 - 4);
        gwCtx.stroke();
      }
    }
    
    // Player tag
    gwCtx.fillStyle = '#00ff88';
    gwCtx.font = 'bold 9px "Microsoft JhengHei", sans-serif';
    gwCtx.textAlign = 'center';
    const tag = (isMale ? '♂' : '♀') + (hasASD ? '🎧' : '') + (hasADHD ? '⚡' : '') + ' Lv.' + (p.years || '?');
    gwCtx.fillText(tag, px, py - 16);
  });
}

function drawHUD() {
  gwCtx.fillStyle = 'rgba(0,0,0,0.7)';
  gwCtx.fillRect(0, gwCanvas.height - 45, gwCanvas.width, 45);
  
  gwCtx.fillStyle = '#fff';
  gwCtx.font = '12px "Microsoft JhengHei", sans-serif';
  gwCtx.textAlign = 'left';
  gwCtx.fillText(`體質:${playerContext.constitution}`, 15, gwCanvas.height - 25);
  gwCtx.fillText(`家境:$${(playerContext.wealth/1000).toFixed(0)}k`, 110, gwCanvas.height - 25);
  gwCtx.fillText(`年齡:${playerContext.years}歲`, 240, gwCanvas.height - 25);
  gwCtx.fillText(`愛情:${playerContext.love}`, 330, gwCanvas.height - 25);
  
  // Online player count
  const onlineCount = Object.keys(otherPlayers).length;
  gwCtx.fillStyle = '#00ff88';
  gwCtx.fillText(`🟢 ${onlineCount}人在線`, gwCanvas.width - 130, gwCanvas.height - 25);
  
  let tx = 420;
  playerTraits.forEach(t => {
    const w = gwCtx.measureText(t.title).width + 10;
    gwCtx.fillStyle = t.type === 'good' ? '#2ecc71' : t.type === 'neutral' ? '#f1c40f' : '#e74c3c';
    gwCtx.fillRect(tx, gwCanvas.height - 40, w, 18);
    gwCtx.fillStyle = '#000';
    gwCtx.font = '9px "Microsoft JhengHei", sans-serif';
    gwCtx.fillText(t.title, tx + 5, gwCanvas.height - 26);
    tx += w + 4;
  });
}

function checkRandomEvents() {
  if (eventCooldown > 0) { eventCooldown--; return; }
  if (Math.random() > 0.003) return;
  
  const events = [];
  if (playerContext.years >= 6 && playerContext.years <= 12) {
    events.push({ title: '學校', desc: '上堂鐘聲響起...又要返學喇', icon: '🏫' });
  }
  if (playerContext.years >= 12) {
    events.push({ title: '學會活動', desc: '有同學邀請你參加學會！', icon: '🎭' });
  }
  if (playerTraits.some(t => t.id === 'asian_parent')) {
    events.push({ title: '家長來電', desc: '亞洲家長打嚟問你溫咗書未...', icon: '📞' });
  }
  if (playerTraits.some(t => t.id === 'adhd')) {
    events.push({ title: 'ADHD發作', desc: '突然想走去第二度...', icon: '⚡' });
  }
  if (playerContext.love === 'A0') {
    events.push({ title: '偶遇', desc: '前面有個異性角色行過...', icon: '💫' });
  }
  
  if (events.length > 0) {
    const ev = events[Math.floor(Math.random() * events.length)];
    showToast(ev.icon + ' ' + ev.title, ev.desc, 'info');
    eventCooldown = 300 + Math.floor(Math.random() * 400);
  }
}

function drawLocationLabel() {
  gwCtx.fillStyle = 'rgba(0,0,0,0.6)';
  gwCtx.fillRect(gwCanvas.width/2 - 80, 10, 160, 28);
  gwCtx.fillStyle = '#00a8ff';
  gwCtx.font = 'bold 14px "Microsoft JhengHei", sans-serif';
  gwCtx.textAlign = 'center';
  gwCtx.fillText('📍 香港 · 街頭', gwCanvas.width/2, 30);
}

// ── Game loop ──
function gameWorldLoop() {
  if (!gameWorldRunning) return;
  
  gwCtx.clearRect(0, 0, gwCanvas.width, gwCanvas.height);
  
  drawSky();
  drawClouds();
  drawBuildings();
  drawNPCs();
  drawPlayer();
  drawOtherPlayers();
  drawHUD();
  drawLocationLabel();
  checkRandomEvents();
  
  if (Math.abs(playerVX) > 0.01) {
    playerX += playerVX;
    streetOffset += playerVX;
    playerVX *= 0.95;
  }
  playerBob++;
  
  gwClouds.forEach(c => { c.x += c.speed; if (c.x > gwCanvas.width + 200) c.x = -200; });
  
  npcs.forEach(npc => {
    npc.x -= npc.speed;
    if (npc.x - streetOffset < -150) {
      npc.x = gwCanvas.width + streetOffset + Math.random() * 300;
    }
  });
  
  if (Math.random() < 0.005 && npcs.length < 12) {
    const types = ['pedestrian','pedestrian','pedestrian','pedestrian','friend','parent','teacher','love'];
    npcs.push(spawnNPC(types[Math.floor(Math.random() * types.length)]));
  }
  
  npcs = npcs.filter(n => n.x - streetOffset > -300);
  
  gwAnimationId = requestAnimationFrame(gameWorldLoop);
}

function startGameWorld() {
  document.getElementById('game-world-screen').classList.add('active');
  initGameWorld();
  startMultiplayer();
}

function stopGameWorld() {
  gameWorldRunning = false;
  if (gwAnimationId) cancelAnimationFrame(gwAnimationId);
  document.getElementById('game-world-screen').classList.remove('active');
  stopMultiplayer();
}

// ── Controls ──
document.addEventListener('keydown', (e) => {
  if (!gameWorldRunning) return;
  if (e.key === 'ArrowRight' || e.key === 'd') { playerVX = 3; playerDir = 1; }
  if (e.key === 'ArrowLeft' || e.key === 'a')  { playerVX = -3; playerDir = -1; }
});

let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
  if (!gameWorldRunning) return;
  touchStartX = e.touches[0].clientX;
});
document.addEventListener('touchmove', (e) => {
  if (!gameWorldRunning) return;
  const dx = e.touches[0].clientX - touchStartX;
  playerVX = dx * 0.05;
  playerDir = dx > 0 ? 1 : -1;
});

// ==================== MULTIPLAYER ====================
let otherPlayers = {};
let mpSyncInterval = null;
let mpPlayerRef = null;
let mpPlayersRef = null;
const MAX_PLAYERS = 200;

// ── Server capacity check ──
let presenceRef = null;
let queueRef = null;
let myQueueRef = null;
let queueListener = null;
let inQueue = false;
let queuePosition = 0;

function startMultiplayer() {
  const user = getCurrentUser();
  if (!user || typeof rtdb === 'undefined') return;
  
  const uid = user.uid;
  
  // Check server capacity first
  checkServerCapacity(uid);
}

function checkServerCapacity(uid) {
  presenceRef = rtdb.ref('presence');
  
  // Count current online players
  presenceRef.once('value', (snapshot) => {
    const online = snapshot.val() || {};
    const count = Object.keys(online).length;
    
    if (count >= MAX_PLAYERS) {
      // Server full → join queue
      joinQueue(uid, count);
    } else {
      // OK to join
      enterServer(uid);
    }
  });
}

function joinQueue(uid, onlineCount) {
  inQueue = true;
  queueRef = rtdb.ref('queue');
  
  // Add self to queue
  myQueueRef = queueRef.push({
    uid: uid,
    joinedAt: Date.now()
  });
  
  // Calculate position
  queueRef.once('value', (snapshot) => {
    const queue = snapshot.val() || {};
    const keys = Object.keys(queue).sort();
    queuePosition = keys.indexOf(myQueueRef.key) + 1;
    
    // Show queue UI
    showQueueScreen(onlineCount, queuePosition);
  });
  
  // Listen for position changes
  queueListener = queueRef.on('value', (snapshot) => {
    if (!inQueue) return;
    const queue = snapshot.val() || {};
    const keys = Object.keys(queue).sort();
    const pos = keys.indexOf(myQueueRef.key) + 1;
    
    if (pos <= 0) {
      // We've been removed from queue → can enter!
      inQueue = false;
      hideQueueScreen();
      enterServer(uid);
      return;
    }
    
    queuePosition = pos;
    updateQueueUI(onlineCount, pos);
  });
  
  // On disconnect, remove from queue
  if (myQueueRef) {
    myQueueRef.onDisconnect().remove();
  }
}

function enterServer(uid) {
  inQueue = false;
  hideQueueScreen();
  
  // Remove from queue if present
  if (myQueueRef) { myQueueRef.remove(); myQueueRef = null; }
  if (queueListener && queueRef) { queueRef.off('value', queueListener); queueListener = null; }
  
  // Register presence
  if (presenceRef) {
    const myPresence = presenceRef.child(uid);
    myPresence.set({ joinedAt: Date.now() });
    myPresence.onDisconnect().remove();
  }
  
  // Listen for presence changes → pop next from queue
  presenceRef.on('child_removed', () => {
    popNextFromQueue();
  });
  
  // Continue normal init
  mpPlayerRef = rtdb.ref('players/' + uid);
  mpPlayersRef = rtdb.ref('players');
  
  syncMyPosition();
  mpSyncInterval = setInterval(syncMyPosition, 200);
  
  mpPlayersRef.on('value', (snapshot) => {
    const all = snapshot.val() || {};
    otherPlayers = {};
    Object.keys(all).forEach(id => {
      if (id === uid) return;
      const p = all[id];
      if (Date.now() - p.lastSeen > 10000) return;
      otherPlayers[id] = p;
    });
  });
  
  window.addEventListener('beforeunload', stopMultiplayer);
}

function syncMyPosition() {
  const user = getCurrentUser();
  if (!user || !mpPlayerRef) return;
  
  const traitIds = playerTraits.map(t => t.id);
  mpPlayerRef.set({
    x: playerX + streetOffset,
    dir: playerDir,
    gender: playerContext.gender,
    traits: traitIds,
    wealth: playerContext.wealth,
    love: playerContext.love,
    years: playerContext.years,
    lastSeen: Date.now()
  });
}

function showQueueScreen(online, position) {
  const el = document.getElementById('queue-overlay');
  if (el) {
    el.style.display = 'flex';
    document.getElementById('queue-online').textContent = online;
    document.getElementById('queue-position').textContent = position;
    // Estimated wait: ~30s per player
    const estMin = Math.ceil(position * 0.3);
    document.getElementById('queue-estimate').textContent = estMin;
  }
}

function updateQueueUI(online, position) {
  const el = document.getElementById('queue-overlay');
  if (el && el.style.display === 'flex') {
    document.getElementById('queue-online').textContent = online;
    document.getElementById('queue-position').textContent = position;
    const estMin = Math.ceil(position * 0.3);
    document.getElementById('queue-estimate').textContent = estMin;
  }
}

function hideQueueScreen() {
  const el = document.getElementById('queue-overlay');
  if (el) el.style.display = 'none';
}

function popNextFromQueue() {
  if (!queueRef) { queueRef = rtdb.ref('queue'); }
  
  presenceRef.once('value', (snapshot) => {
    const online = snapshot.val() || {};
    const count = Object.keys(online).length;
    
    if (count < MAX_PLAYERS) {
      // There's space → remove first person from queue
      queueRef.once('value', (qSnap) => {
        const q = qSnap.val() || {};
        const keys = Object.keys(q).sort();
        if (keys.length > 0) {
          // First person auto-enters (their listener will detect removal)
          queueRef.child(keys[0]).remove();
        }
      });
    }
  });
}

function stopMultiplayer() {
  if (mpSyncInterval) clearInterval(mpSyncInterval);
  if (mpPlayerRef) { mpPlayerRef.remove(); mpPlayerRef = null; }
  if (mpPlayersRef) { mpPlayersRef.off(); mpPlayersRef = null; }
  if (presenceRef && getCurrentUser()) {
    presenceRef.child(getCurrentUser().uid).remove();
  }
  if (myQueueRef) { myQueueRef.remove(); myQueueRef = null; }
  if (queueListener && queueRef) { queueRef.off('value', queueListener); queueListener = null; }
  otherPlayers = {};
  inQueue = false;
}
