/**
 * Asher Phone - Chat 控制器
 * 1. 抽屉式侧边栏（Chat、角色库、身份库、动态、表情包库、钱包、游戏）
 * 2. 顶部微小组件实时走动
 * 3. 移除旧的全部/最近/收藏默认分组，直接载入对话列表
 */

let chatDB = null;

// ============== 初始化 IndexedDB ==============
function initChatDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('AsherChatDB', 1);
    
    request.onerror = () => {
      console.warn('[Chat DB] 打开数据库失败，降级运行');
      resolve(null);
    };

    request.onsuccess = () => {
      chatDB = request.result;
      console.log('[Chat DB] 数据库就绪');
      resolve(chatDB);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('conversations')) {
        const convStore = db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true });
        convStore.createIndex('characterId', 'characterId', { unique: false });
        convStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('messages')) {
        const msgStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
        msgStore.createIndex('conversationId', 'conversationId', { unique: false });
      }
      if (!db.objectStoreNames.contains('characters')) {
        db.createObjectStore('characters', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// ============== 侧边栏交互 ==============
function initSidebar() {
  const hamburgerBtn = document.getElementById('chat-hamburger-btn');
  const sidebar = document.getElementById('chat-sidebar');
  const overlay = document.getElementById('chat-sidebar-overlay');
  
  if (!hamburgerBtn || !sidebar || !overlay) return;
  
  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
  };
  
  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  };
  
  hamburgerBtn.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);
  
  // 菜单切换
  const menuItems = document.querySelectorAll('.chat-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const menu = item.getAttribute('data-menu');
      console.log(`[Chat] 切换侧栏菜单: ${menu}`);
      
      // 根据菜单项跳转到对应 APP
      if (menu === 'characters' && typeof window.openCharactersApp === 'function') {
        closeSidebar();
        setTimeout(() => {
          window.openCharactersApp();
        }, 200);
      } else if (menu === 'chat') {
        menuItems.forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        closeSidebar();
      } else {
        menuItems.forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        closeSidebar();
        showChatToast(`${menu} 功能开发中...`);
      }
    });
  });
}

// ============== 顶栏返回桌面 ==============
function initCloseChat() {
  const closeBtn = document.getElementById('chat-close-btn');
  const chatApp = document.getElementById('chat-app');
  if (closeBtn && chatApp) {
    closeBtn.addEventListener('click', () => {
      chatApp.classList.remove('active');
    });
  }
}

// ============== 顶部小组件时间实时走动 ==============
function updateTrainTime() {
  const timeEl = document.querySelector('.train-time-badge');
  if (!timeEl) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  timeEl.textContent = `${h} : ${m} : ${s}`;
}

// ============== 搜索监听 ==============
function initSearch() {
  const searchInput = document.getElementById('chat-search-input');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    const kw = e.target.value.trim().toLowerCase();
    console.log(`[Chat] 搜索关键词: ${kw}`);
  });
}

// ============== 新建角色对话 ==============
function initNewConversation() {
  const newBtn = document.getElementById('chat-new-btn');
  if (!newBtn) return;
  newBtn.addEventListener('click', () => {
    console.log('[Chat] 点击新建角色对话');
    if (typeof showChatToast === 'function') {
      showChatToast('角色库正在载入...');
    }
  });
}

// ============== 对话列表渲染 ==============
async function loadConversations() {
  const listContainer = document.getElementById('chat-list');
  if (!listContainer) return;
  
  if (!chatDB) {
    listContainer.innerHTML = `
      <div class="chat-empty-state">
        <div class="chat-empty-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 3"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </div>
        <span class="chat-empty-text">还没有对话，点击上方新建</span>
      </div>`;
    return;
  }
  
  try {
    const tx = chatDB.transaction(['conversations'], 'readonly');
    const store = tx.objectStore('conversations');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const conversations = request.result || [];
      if (conversations.length === 0) {
        listContainer.innerHTML = `
          <div class="chat-empty-state">
            <div class="chat-empty-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 3"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            </div>
            <span class="chat-empty-text">还没有对话，点击上方新建</span>
          </div>`;
        return;
      }
      
      listContainer.innerHTML = conversations.map(conv => `
        <div class="chat-conversation-card" data-id="${conv.id}">
          <div class="chat-conv-avatar">
            ${conv.avatar ? `<img src="${conv.avatar}">` : ''}
          </div>
          <div class="chat-conv-info">
            <div class="chat-conv-top">
              <div class="chat-conv-name">${conv.title || '角色'}</div>
              <div class="chat-conv-time">${formatTime(conv.timestamp)}</div>
            </div>
            <div class="chat-conv-message">${conv.lastMessage || '暂无消息'}</div>
          </div>
        </div>
      `).join('');
    };
  } catch (e) {
    listContainer.innerHTML = `
      <div class="chat-empty-state">
        <div class="chat-empty-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 3"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </div>
        <span class="chat-empty-text">还没有对话，点击上方新建</span>
      </div>`;
  }
}

// ============== 格式化时间 ==============
function formatTime(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// ============== 轻量 Toast ==============
function showChatToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(30, 28, 32, 0.88);
    color: #ffffff;
    padding: 10px 22px;
    border-radius: 20px;
    font-size: 0.84rem;
    font-weight: 500;
    z-index: 99999;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    letter-spacing: 0.02em;
    pointer-events: none;
    transition: opacity 0.25s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 1600);
}

// ============== 全局唤出函数 ==============
window.openChatApp = function() {
  console.log('[Chat] openChatApp 触发');
  const chatApp = document.getElementById('chat-app');
  const allApps = document.querySelectorAll('.chat-app-container, .settings-app-container, .beauty-app-container');
  allApps.forEach(app => app.classList.remove('active'));
  
  if (chatApp) {
    chatApp.classList.add('active');
    loadConversations();
  }
};

// ============== 页面加载初始化 ==============
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initChatDB();
    initSidebar();
    initCloseChat();
    initSearch();
    initNewConversation();
    
    updateTrainTime();
    setInterval(updateTrainTime, 1000);
  } catch (err) {
    console.error('[Chat] 初始化出现问题:', err);
  }
});
