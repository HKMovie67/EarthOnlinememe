// ==================== 地球Online Chatbox + Threads 驗證 ====================

let chatOpen = false;
let chatVerified = false;
let chatUsername = '';
let chatMsgRef = null;
let chatListening = false;

// ── Init chat ──
function initChat() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Check if already verified
  const saved = localStorage.getItem('eo_threads_user');
  if (saved) {
    chatVerified = true;
    chatUsername = saved;
  }
  
  // Listen for messages
  chatMsgRef = rtdb.ref('chat/messages');
  listenForMessages();
  
  updateChatUI();
}

// ── UI update ──
function updateChatUI() {
  const panel = document.getElementById('chat-panel');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const verifyBtn = document.getElementById('chat-verify-btn');
  
  if (!panel) return;
  
  if (chatVerified) {
    panel.classList.add('verified');
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.style.display = 'inline-block';
    if (verifyBtn) verifyBtn.style.display = 'none';
    document.getElementById('chat-status').textContent = `💬 @${chatUsername}`;
  } else {
    panel.classList.remove('verified');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.style.display = 'none';
    if (verifyBtn) verifyBtn.style.display = 'inline-block';
    document.getElementById('chat-status').textContent = '🔒 請先驗證 Threads';
  }
}

// ── Toggle chat panel ──
function toggleChat() {
  chatOpen = !chatOpen;
  const body = document.getElementById('chat-body');
  const icon = document.getElementById('chat-toggle-icon');
  if (chatOpen) {
    body.style.display = 'flex';
    icon.textContent = '▼';
  } else {
    body.style.display = 'none';
    icon.textContent = '▲';
  }
}

// ── Threads verification ──
function startThreadsVerify() {
  // Show verification modal
  const modal = document.getElementById('threads-verify-modal');
  modal.style.display = 'flex';
}

function closeThreadsVerify() {
  document.getElementById('threads-verify-modal').style.display = 'none';
}

function openThreadsProfile() {
  window.open('https://www.threads.net/@hkmovie67', '_blank');
}

async function confirmThreadsVerify() {
  const username = document.getElementById('threads-username').value.trim();
  if (!username) {
    document.getElementById('threads-verify-error').textContent = '請輸入你嘅 Threads username';
    return;
  }
  
  // Store verification
  chatVerified = true;
  chatUsername = username;
  localStorage.setItem('eo_threads_user', username);
  
  closeThreadsVerify();
  updateChatUI();
  showToast('✅ 驗證成功', `歡迎 @${username}！而家可以傾計喇`, 'info');
}

// ── Send message ──
function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg || !chatVerified) return;
  
  const user = getCurrentUser();
  if (!user || !chatMsgRef) return;
  
  const traitIds = playerTraits.map(t => t.id);
  const msgData = {
    text: msg,
    user: chatUsername,
    uid: user.uid.substring(0, 8),
    gender: playerContext.gender,
    traits: traitIds,
    love: playerContext.love,
    years: playerContext.years,
    timestamp: Date.now()
  };
  
  chatMsgRef.push(msgData);
  input.value = '';
  
  // Keep only last 100 messages
  cleanupOldMessages();
}

// ── Listen for messages ──
function listenForMessages() {
  if (chatListening || !chatMsgRef) return;
  chatListening = true;
  
  chatMsgRef.limitToLast(50).on('child_added', (snapshot) => {
    const msg = snapshot.val();
    addMessageToUI(msg, snapshot.key);
  });
  
  // Also listen for initial load
  chatMsgRef.limitToLast(50).once('value', (snapshot) => {
    document.getElementById('chat-messages').innerHTML = '';
    const msgs = snapshot.val() || {};
    Object.entries(msgs).sort((a, b) => a[1].timestamp - b[1].timestamp).forEach(([key, msg]) => {
      addMessageToUI(msg, key);
    });
    scrollChatBottom();
  });
}

function addMessageToUI(msg, key) {
  const container = document.getElementById('chat-messages');
  const isMe = (getCurrentUser() && getCurrentUser().uid.substring(0, 8) === msg.uid);
  
  const div = document.createElement('div');
  div.className = 'chat-msg' + (isMe ? ' chat-msg-me' : '');
  div.id = 'msg-' + key;
  
  const time = new Date(msg.timestamp).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });
  const genderIcon = msg.gender === '男' ? '♂' : '♀';
  const traitIcons = (msg.traits || []).map(t => {
    if (t === 'asd') return '🎧';
    if (t === 'adhd') return '⚡';
    if (t === 'asian_parent') return '🐉';
    return '';
  }).join('');
  
  div.innerHTML = `
    <div class="chat-msg-header">
      <span class="chat-msg-user">${genderIcon} ${msg.user || '???'} ${traitIcons}</span>
      <span class="chat-msg-time">${time}</span>
    </div>
    <div class="chat-msg-text">${escapeHtml(msg.text)}</div>
  `;
  
  container.appendChild(div);
  
  // Auto-scroll if at bottom
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 80) {
    scrollChatBottom();
  }
}

function scrollChatBottom() {
  const container = document.getElementById('chat-messages');
  setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

function cleanupOldMessages() {
  chatMsgRef.limitToLast(100).once('value', (snapshot) => {
    const msgs = snapshot.val() || {};
    const keys = Object.keys(msgs);
    if (keys.length > 80) {
      const toRemove = keys.slice(0, keys.length - 50);
      toRemove.forEach(k => rtdb.ref('chat/messages/' + k).remove());
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Enter key to send
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement === document.getElementById('chat-input')) {
    sendChatMessage();
  }
});

// ── Init on game start ──
const _origStartGameWorld2 = startGameWorld;
startGameWorld = function() {
  _origStartGameWorld2();
  initChat();
};
