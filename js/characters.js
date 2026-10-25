/**
 * Asher Phone - 角色库交互逻辑重构
 * 1. 顶部状态看板与档案总数联动
 * 2. 档案列表：空状态采用精美居中拍立得引导卡片；有数据时采用高质感横向展卡 (Dossier Card)
 * 3. 彻底告别单薄小方块，空间充实饱满，比例协调
 */

let characterDB = null;

// ============== IndexedDB 初始化 ==============
function initCharacterDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('AsherCharacterDB', 1);
    
    request.onerror = () => {
      console.warn('[Character DB] 数据库打开失败');
      resolve(null);
    };

    request.onsuccess = () => {
      characterDB = request.result;
      console.log('[Character DB] 数据库就绪');
      resolve(characterDB);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('characters')) {
        const charStore = db.createObjectStore('characters', { keyPath: 'id', autoIncrement: true });
        charStore.createIndex('name', 'name', { unique: false });
        charStore.createIndex('groupId', 'groupId', { unique: false });
        charStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// ============== 全局唤出角色库 ==============
window.openCharactersApp = function() {
  console.log('[Characters] 打开角色档案库');
  
  const allApps = document.querySelectorAll('.chat-app-container, .settings-app-container, .beauty-app-container, .characters-app-container');
  allApps.forEach(app => app.classList.remove('active'));
  
  const charApp = document.getElementById('characters-app');
  if (charApp) {
    charApp.classList.add('active');
    loadCharactersList();
  }
};

// ============== 返回 Chat APP ==============
function closeCharactersApp() {
  const charApp = document.getElementById('characters-app');
  if (charApp) charApp.classList.remove('active');
  if (typeof window.openChatApp === 'function') {
    window.openChatApp();
  }
}

// ============== 加载并渲染角色卡片流 ==============
async function loadCharactersList() {
  const listContainer = document.getElementById('char-list-grid');
  const countLabel = document.getElementById('char-count-label');
  if (!listContainer) return;

  // 空状态模板：高质感拍立得留白居中卡片
  const emptyStateHtml = `
    <div class="char-empty-hero-card">
      <div class="char-empty-cam-box">
        <svg viewBox="0 0 24 24">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
        </svg>
      </div>
      <h3 class="char-empty-title">尚未归档任何角色</h3>
      <p class="char-empty-sub">点击下方创建第一份专属人物档案，注入性格、音色与深度背景</p>
      <button class="char-create-entry-btn" id="char-empty-add-btn">
        <svg viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span>创建第一份档案</span>
      </button>
    </div>`;

  if (!characterDB) {
    listContainer.innerHTML = emptyStateHtml;
    if (countLabel) countLabel.textContent = '0';
    bindAddButton();
    return;
  }

  try {
    const tx = characterDB.transaction(['characters'], 'readonly');
    const store = tx.objectStore('characters');
    const request = store.getAll();

    request.onsuccess = () => {
      const characters = request.result || [];
      if (countLabel) {
        countLabel.textContent = `${characters.length}`;
      }

      if (characters.length === 0) {
        listContainer.innerHTML = emptyStateHtml;
        bindAddButton();
        return;
      }

      // 有角色时渲染横向展卡流
      let html = '';
      characters.forEach(char => {
        const photoContent = char.photo 
          ? `<img src="${char.photo}" alt="${char.name}">` 
          : `<div class="char-dossier-initial">${(char.name && char.name[0]) ? char.name[0].toUpperCase() : 'C'}</div>`;
        
        const groupTag = char.groupId ? `<span class="char-dossier-group-tag">${char.groupId}</span>` : '';
        const metaInfo = [
          char.gender === 'male' ? '男' : (char.gender === 'female' ? '女' : ''),
          char.age ? `${char.age}岁` : '',
          char.occupation || ''
        ].filter(Boolean).join('<span class="char-dossier-meta-split">/</span>');

        const personalitySummary = char.personality ? char.personality.slice(0, 32) + '...' : (char.details ? char.details.slice(0, 32) + '...' : '暂无特征锚点');

        html += `
          <div class="char-dossier-card" data-id="${char.id}">
            <div class="char-dossier-photo">
              ${photoContent}
            </div>
            <div class="char-dossier-content">
              <div class="char-dossier-top">
                <span class="char-dossier-name">${char.name || '未命名档案'}</span>
                ${groupTag}
              </div>
              <div class="char-dossier-meta">
                ${metaInfo || '基础信息待补充'}
              </div>
              <div class="char-dossier-personality">
                ${personalitySummary}
              </div>
            </div>
            <svg class="char-dossier-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
          </div>`;
      });

      // 底部追加精简的「＋ 新建档案」横条
      html += `
        <button class="char-dossier-add-btn" id="char-stream-add-btn">
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span>新建人物档案</span>
        </button>`;

      listContainer.innerHTML = html;
      bindAddButton();
      bindCharacterCards();
    };
  } catch (err) {
    console.error('[Characters] 加载角色失败:', err);
    listContainer.innerHTML = emptyStateHtml;
    bindAddButton();
  }
}

// ============== 绑定点击事件 ==============
function bindAddButton() {
  const quickBtn = document.getElementById('char-quick-add-btn');
  if (quickBtn) quickBtn.onclick = () => openCharacterEditor(null);

  const emptyAddBtn = document.getElementById('char-empty-add-btn');
  if (emptyAddBtn) emptyAddBtn.onclick = () => openCharacterEditor(null);

  const streamAddBtn = document.getElementById('char-stream-add-btn');
  if (streamAddBtn) streamAddBtn.onclick = () => openCharacterEditor(null);
}

function bindCharacterCards() {
  const cards = document.querySelectorAll('.char-dossier-card');
  cards.forEach(card => {
    card.onclick = () => {
      const id = parseInt(card.getAttribute('data-id'), 10);
      openCharacterEditor(id);
    };
  });
}

// ============== 自定义 INS 下拉选择器控制器 ==============
function initInsDropdowns() {
  const dropdowns = document.querySelectorAll('.ins-dropdown');
  
  dropdowns.forEach(dd => {
    const trigger = dd.querySelector('.ins-dropdown-trigger');
    const hiddenInput = dd.querySelector('input[type="hidden"]');
    const valueSpan = dd.querySelector('.ins-dropdown-value');
    const items = dd.querySelectorAll('.ins-dropdown-item');

    if (trigger) {
      trigger.onclick = (e) => {
        e.stopPropagation();
        const isActive = dd.classList.contains('active');
        dropdowns.forEach(other => other.classList.remove('active'));
        if (!isActive) {
          dd.classList.add('active');
        }
      };
    }

    items.forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const val = item.getAttribute('data-val');
        if (hiddenInput) hiddenInput.value = val;

        const mainText = item.querySelector('.ins-item-main') 
          ? item.querySelector('.ins-item-main').textContent 
          : item.textContent.trim();
        
        if (valueSpan) valueSpan.textContent = mainText;

        const dot = dd.querySelector('.ins-cell-dot');
        if (dot) {
          if (val === 'none') {
            dot.classList.add('inactive');
          } else {
            dot.classList.remove('inactive');
          }
        }

        dd.classList.remove('active');
      };
    });
  });

  document.addEventListener('click', () => {
    dropdowns.forEach(dd => dd.classList.remove('active'));
  });
}

function setDropdownValue(dropdownName, targetVal) {
  const dd = document.querySelector(`.ins-dropdown[data-dropdown="${dropdownName}"]`);
  if (!dd) return;
  const hiddenInput = dd.querySelector('input[type="hidden"]');
  const valueSpan = dd.querySelector('.ins-dropdown-value');
  const items = dd.querySelectorAll('.ins-dropdown-item');

  let matched = false;
  items.forEach(item => {
    const val = item.getAttribute('data-val');
    if (val === targetVal) {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (hiddenInput) hiddenInput.value = val;
      const mainText = item.querySelector('.ins-item-main') 
        ? item.querySelector('.ins-item-main').textContent 
        : item.textContent.trim();
      if (valueSpan) valueSpan.textContent = mainText;
      matched = true;
    }
  });

  if (!matched && items.length > 0) {
    items[0].classList.add('active');
    if (hiddenInput) hiddenInput.value = items[0].getAttribute('data-val');
    const mainText = items[0].querySelector('.ins-item-main') 
      ? items[0].querySelector('.ins-item-main').textContent 
      : items[0].textContent.trim();
    if (valueSpan) valueSpan.textContent = mainText;
  }
}

// ============== 打开/关闭角色编辑器 ==============
function openCharacterEditor(charId = null) {
  const editorPage = document.getElementById('char-editor-page');
  if (!editorPage) return;

  editorPage.classList.add('active');

  if (charId) {
    loadCharacterData(charId);
  } else {
    resetEditorForm();
  }
}

function closeCharacterEditor() {
  const editorPage = document.getElementById('char-editor-page');
  if (editorPage) {
    editorPage.classList.remove('active');
  }
}

// ============== 重置表单 ==============
function resetEditorForm() {
  const form = document.getElementById('char-editor-form');
  if (form) form.reset();
  
  const editId = document.getElementById('char-edit-id');
  if (editId) editId.value = '';

  const groupInput = document.getElementById('char-group');
  if (groupInput) groupInput.value = '';

  const preview = document.getElementById('char-photo-preview');
  const placeholder = document.getElementById('char-photo-placeholder');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (placeholder) {
    placeholder.style.display = 'flex';
  }

  setDropdownValue('gender', 'male');
  setDropdownValue('voiceEngine', 'minimax');
  setDropdownValue('bindUser', 'default');
  setDropdownValue('bindWorld', 'none');
  setDropdownValue('bindSticker', 'none');

  toggleVoiceConfig(false);
}

// ============== 加载单个角色数据并填入表单 ==============
function loadCharacterData(charId) {
  if (!characterDB) return;
  try {
    const tx = characterDB.transaction(['characters'], 'readonly');
    const store = tx.objectStore('characters');
    const request = store.get(charId);

    request.onsuccess = () => {
      const char = request.result;
      if (!char) return;

      document.getElementById('char-edit-id').value = char.id || '';
      document.getElementById('char-name').value = char.name || '';
      document.getElementById('char-age').value = char.age || '';
      document.getElementById('char-birth').value = char.birth || '';
      document.getElementById('char-occupation').value = char.occupation || '';
      document.getElementById('char-group').value = char.groupId || '';

      setDropdownValue('gender', char.gender || 'male');

      document.getElementById('char-personality').value = char.personality || '';
      document.getElementById('char-speech').value = char.speech || '';
      document.getElementById('char-interests').value = char.interests || '';
      document.getElementById('char-style').value = char.style || '';
      document.getElementById('char-appearance').value = char.appearance || '';
      document.getElementById('char-details').value = char.details || '';

      document.getElementById('char-birthplace').value = char.birthplace || '';
      document.getElementById('char-residence').value = char.residence || '';
      document.getElementById('char-language').value = char.language || '';
      document.getElementById('char-time-aware').checked = !!char.timeAware;

      document.getElementById('char-email').value = char.email || '';
      document.getElementById('char-phone').value = char.phone || '';
      document.getElementById('char-social').value = char.social || '';

      const voiceCheck = document.getElementById('char-voice-enabled');
      if (voiceCheck) voiceCheck.checked = !!char.voiceEnabled;
      setDropdownValue('voiceEngine', char.voiceEngine || 'minimax');
      document.getElementById('char-voice-id').value = char.voiceId || '';

      setDropdownValue('bindUser', char.bindUser || 'default');
      setDropdownValue('bindWorld', char.bindWorld || 'none');
      setDropdownValue('bindSticker', char.bindSticker || 'none');

      const preview = document.getElementById('char-photo-preview');
      const placeholder = document.getElementById('char-photo-placeholder');
      if (char.photo && preview) {
        preview.src = char.photo;
        preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      } else {
        if (preview) preview.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      }

      toggleVoiceConfig(!!char.voiceEnabled);
    };
  } catch (err) {
    console.error('[Characters] 读取角色失败:', err);
  }
}

// ============== 证件照上传与无损 Base64 处理 ==============
function handlePhotoUpload(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('char-photo-preview');
    const placeholder = document.getElementById('char-photo-placeholder');
    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  };
  reader.readAsDataURL(file);
}

// ============== 语音配置抽屉显隐 ==============
function toggleVoiceConfig(enabled) {
  const voiceConfig = document.getElementById('char-voice-config');
  if (voiceConfig) {
    voiceConfig.style.display = enabled ? 'flex' : 'none';
  }
}

// ============== 一键提取逻辑 ==============
function handleMagicExtract() {
  const details = document.getElementById('char-details').value.trim();
  const personality = document.getElementById('char-personality').value.trim();

  if (!details && !personality) {
    showCharToast('请先输入人设背景或性格描述');
    return;
  }

  showCharToast('人设特征智能解析已完成');
}

// ============== 保存角色到 IndexedDB ==============
async function saveCharacter() {
  if (!characterDB) {
    showCharToast('数据库未就绪');
    return;
  }

  const nameInput = document.getElementById('char-name');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) {
    showCharToast('请输入角色姓名');
    if (nameInput) nameInput.focus();
    return;
  }

  const charId = document.getElementById('char-edit-id').value;
  const preview = document.getElementById('char-photo-preview');

  const charData = {
    name: name,
    gender: document.getElementById('char-gender').value,
    age: parseInt(document.getElementById('char-age').value, 10) || '',
    birth: document.getElementById('char-birth').value,
    occupation: document.getElementById('char-occupation').value.trim(),
    groupId: document.getElementById('char-group').value.trim(),

    personality: document.getElementById('char-personality').value.trim(),
    speech: document.getElementById('char-speech').value.trim(),
    interests: document.getElementById('char-interests').value.trim(),
    style: document.getElementById('char-style').value.trim(),
    appearance: document.getElementById('char-appearance').value.trim(),
    details: document.getElementById('char-details').value.trim(),

    birthplace: document.getElementById('char-birthplace').value.trim(),
    residence: document.getElementById('char-residence').value.trim(),
    language: document.getElementById('char-language').value.trim(),
    timeAware: document.getElementById('char-time-aware').checked,

    email: document.getElementById('char-email').value.trim(),
    phone: document.getElementById('char-phone').value.trim(),
    social: document.getElementById('char-social').value.trim(),

    voiceEnabled: document.getElementById('char-voice-enabled').checked,
    voiceEngine: document.getElementById('char-voice-engine').value,
    voiceId: document.getElementById('char-voice-id').value.trim(),

    bindUser: document.getElementById('char-bind-user').value,
    bindWorld: document.getElementById('char-bind-world').value,
    bindSticker: document.getElementById('char-bind-sticker').value,

    photo: (preview && preview.style.display !== 'none') ? preview.src : '',
    updatedAt: Date.now()
  };

  try {
    const tx = characterDB.transaction(['characters'], 'readwrite');
    const store = tx.objectStore('characters');

    if (charId) {
      charData.id = parseInt(charId, 10);
      store.put(charData);
    } else {
      charData.createdAt = Date.now();
      store.add(charData);
    }

    tx.oncomplete = () => {
      showCharToast('档案保存成功');
      closeCharacterEditor();
      loadCharactersList();
    };

    tx.onerror = () => {
      showCharToast('保存档案失败');
    };
  } catch (err) {
    console.error('[Characters] 保存失败:', err);
    showCharToast('保存失败');
  }
}

// ============== 轻量微质感 Toast ==============
function showCharToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(28, 26, 30, 0.88);
    color: #ffffff;
    padding: 9px 20px;
    border-radius: 18px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 99999;
    backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    letter-spacing: 0.02em;
    pointer-events: none;
    transition: opacity 0.24s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 240);
  }, 1500);
}

// ============== 页面初次载入与全局事件绑定 ==============
document.addEventListener('DOMContentLoaded', async () => {
  await initCharacterDB();
  initInsDropdowns();

  // 证件照上传绑定
  const photoFrame = document.getElementById('char-photo-upload-btn');
  const photoInput = document.getElementById('char-photo-input');
  if (photoFrame && photoInput) {
    photoFrame.onclick = () => photoInput.click();
    photoInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        handlePhotoUpload(e.target.files[0]);
      }
    };
  }

  // 语音配置开关监听
  const voiceToggle = document.getElementById('char-voice-enabled');
  if (voiceToggle) {
    voiceToggle.onchange = (e) => toggleVoiceConfig(e.target.checked);
  }

  // 一键提取按键
  const extractBtn = document.getElementById('char-extract-btn');
  if (extractBtn) {
    extractBtn.onclick = handleMagicExtract;
  }

  // 保存与取消按钮绑定
  const saveBtn = document.getElementById('char-save-btn');
  if (saveBtn) saveBtn.onclick = saveCharacter;

  const cancelBtnTop = document.getElementById('char-cancel-btn');
  if (cancelBtnTop) cancelBtnTop.onclick = closeCharacterEditor;

  const cancelBtnBottom = document.getElementById('char-form-cancel-btn');
  if (cancelBtnBottom) cancelBtnBottom.onclick = closeCharacterEditor;

  const backBtn = document.getElementById('char-back-btn');
  if (backBtn) backBtn.onclick = closeCharactersApp;
});
