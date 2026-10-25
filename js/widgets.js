/**
 * Asher phone - Widgets Controller
 * 小组件时钟走动、自适应 IndexedDB 无损存储、支持 P5 双头像与全组件图文编辑
 */

// ================= 1. 自适应 IndexedDB 大容量无损存储模块 =================
const DB_NAME = 'AsherPhoneDB';
const STORE_NAME = 'widgets_data';

const getDB = () => {
  return new Promise((resolve, reject) => {
    const initialReq = indexedDB.open(DB_NAME);

    initialReq.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    initialReq.onsuccess = (e) => {
      const db = e.target.result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        resolve(db);
      } else {
        const currentVersion = db.version || 1;
        db.close();
        const upgradeReq = indexedDB.open(DB_NAME, currentVersion + 1);
        upgradeReq.onupgradeneeded = (ev) => {
          const upDb = ev.target.result;
          if (!upDb.objectStoreNames.contains(STORE_NAME)) {
            upDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        upgradeReq.onsuccess = (ev) => resolve(ev.target.result);
        upgradeReq.onerror = (ev) => reject(ev.target.error);
      }
    };

    initialReq.onerror = (e) => reject(e.target.error);
  });
};

const idbGet = async (id) => {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('idbGet fallback:', err);
    return null;
  }
};

const idbSet = async (id, data) => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, data });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSet fallback:', err);
  }
};

// ================= 2. 小组件字段与配置定义 =================
const WIDGET_CONFIGS = {
  p1: {
    title: 'P1 · Night Jasmine',
    imageType: 'single',
    imgContainerSelector: '.p1-avatar-circle',
    fields: [
      { key: 'title', label: '主标题', selector: '.p1-title' },
      { key: 'subtitle', label: '副标题文案', selector: '.p1-subtitle' },
      { key: 'quote', label: '底部语录', selector: '.p1-quote-text' }
    ]
  },
  p2: {
    title: 'P2 · Memory Archive',
    imageType: 'single',
    imgContainerSelector: '.p2-main-card',
    fields: [
      { key: 'countText', label: '收集状态', selector: '.p2-memories-sub span' },
      { key: 'stat1', label: 'TOTAL 数量', selector: '.p2-stat-col:nth-child(1) strong' },
      { key: 'stat2', label: 'PINNED 数量', selector: '.p2-stat-col:nth-child(2) strong' }
    ]
  },
  p3: {
    title: 'P3 · Coffee Plog',
    imageType: 'single',
    imgContainerSelector: '.p3-coffee-photo',
    fields: [
      { key: 'italic', label: '风味文案', selector: '.p3-sub-italic' },
      { key: 'playLine', label: '播放文案', selector: '.p3-play-line' },
      { key: 'caption', label: '随笔落款', selector: '.p3-foot-caption' }
    ]
  },
  p4: {
    title: 'P4 · Meeting You',
    imageType: 'single',
    imgContainerSelector: '.p4-cover-photo',
    fields: [
      { key: 'archerTitle', label: '专栏标题', selector: '.p4-archer-title' },
      { key: 'quoteEnglish', label: '杂志语录', selector: '.p4-quote-english' },
      { key: 'bottomTag', label: '底部寄语', selector: '.p4-bottom-tag span:nth-child(2)' }
    ]
  },
  p5: {
    title: 'P5 · Duo Music',
    imageType: 'duo',
    fields: [
      { key: 'bubbleLeft', label: '左侧气泡文案', selector: '.p5-person:nth-child(1) .p5-bubble' },
      { key: 'bubbleRight', label: '右侧气泡文案', selector: '.p5-person:nth-child(2) .p5-bubble' },
      { key: 'songTitle', label: '歌曲名称', selector: '.p5-song-title' },
      { key: 'artist', label: '音乐作者', selector: '.p5-artist-tag' },
      { key: 'lyrics', label: '歌词滚动', selector: '.p5-lyrics-scroll' }
    ]
  },
  p6: {
    title: 'P6 · Search Bar',
    imageType: 'none',
    fields: [
      { key: 'placeholder', label: '搜索占位提示', selector: '.p6-input', isAttr: 'placeholder' },
      { key: 'kbd', label: '右侧胶囊标', selector: '.p6-kbd-shortcut' }
    ]
  }
};

// ================= 3. 辅助渲染图片节点 =================
const fillImageContainer = (container, imgSrc) => {
  if (!container || !imgSrc) return;
  let imgEl = container.querySelector('.custom-widget-img');
  if (!imgEl) {
    container.innerHTML = '';
    imgEl = document.createElement('img');
    imgEl.className = 'custom-widget-img';
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'cover';
    imgEl.style.borderRadius = 'inherit';
    imgEl.style.display = 'block';
    container.appendChild(imgEl);
  }
  imgEl.src = imgSrc;
};

// ================= 4. 主程序入口与初始化 =================
document.addEventListener('DOMContentLoaded', async () => {
  // 4.1 顶部时间自动走动
  const updateClocks = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const statusTimeEl = document.getElementById('status-time');
    if (statusTimeEl) statusTimeEl.textContent = `${hours}:${minutes}`;

    const p1DayEl = document.getElementById('p1-day');
    if (p1DayEl) p1DayEl.textContent = day;

    const p1DateText = document.getElementById('p1-date-text');
    if (p1DateText) p1DateText.textContent = `${daysOfWeek[now.getDay()]} ${months[now.getMonth()]}`;
  };

  updateClocks();
  setInterval(updateClocks, 1000 * 30);

  // 4.2 音乐播放状态模拟
  const playBtn = document.getElementById('music-play-btn');
  const progressBar = document.getElementById('music-progress');
  let isPlaying = true;
  let progress = 44;

  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '❚❚' : '▶';
    });
  }

  setInterval(() => {
    if (isPlaying && progressBar) {
      progress = (progress + 0.4) % 100;
      progressBar.style.width = `${progress}%`;
    }
  }, 1000);

  // 4.3 数据渲染
  const applyWidgetData = (id, data) => {
    const conf = WIDGET_CONFIGS[id];
    if (!conf || !data) return;

    // 渲染单头像
    if (conf.imageType === 'single' && data.image) {
      const container = document.querySelector(conf.imgContainerSelector);
      fillImageContainer(container, data.image);
    }

    // 渲染 P5 双头像
    if (conf.imageType === 'duo') {
      if (data.leftImage) {
        fillImageContainer(document.querySelector('.p5-avatar.bunny-left'), data.leftImage);
      }
      if (data.rightImage) {
        fillImageContainer(document.querySelector('.p5-avatar.bunny-right'), data.rightImage);
      }
    }

    // 渲染文字
    if (data.texts) {
      conf.fields.forEach(field => {
        const val = data.texts[field.key];
        if (val !== undefined && val !== '') {
          const el = document.querySelector(field.selector);
          if (el) {
            if (field.isAttr) {
              el.setAttribute(field.isAttr, val);
            } else {
              el.textContent = val;
            }
          }
        }
      });
    }
  };

  for (const id of Object.keys(WIDGET_CONFIGS)) {
    try {
      const saved = await idbGet(id);
      if (saved) applyWidgetData(id, saved);
    } catch (err) {
      console.warn('加载数据跳过:', id, err);
    }
  }

  // ================= 5. 编辑弹窗交互驱动 =================
  const modalOverlay = document.getElementById('widget-modal-overlay');
  const modalTitle = document.getElementById('modal-widget-title');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImageSection = document.getElementById('modal-image-section');
  
  // 单头像节点
  const modalSingleWrap = document.getElementById('modal-single-wrap');
  const modalAvatarPreview = document.getElementById('modal-avatar-preview');
  const modalPreviewImg = document.getElementById('modal-preview-img');
  const modalPreviewPlaceholder = document.getElementById('modal-preview-placeholder');

  // 双头像节点 (P5)
  const modalDuoWrap = document.getElementById('modal-duo-wrap');
  const duoAvatarLeft = document.getElementById('duo-avatar-left');
  const duoImgLeft = document.getElementById('duo-img-left');
  const duoPhLeft = document.getElementById('duo-ph-left');

  const duoAvatarRight = document.getElementById('duo-avatar-right');
  const duoImgRight = document.getElementById('duo-img-right');
  const duoPhRight = document.getElementById('duo-ph-right');

  const modalFileInput = document.getElementById('modal-file-input');
  const modalInputsForm = document.getElementById('modal-inputs-form');
  const modalSubmitBtn = document.getElementById('modal-submit-btn');
  const insToast = document.getElementById('ins-toast');

  let currentEditingId = null;
  let tempSingleImage = null;
  let tempLeftImage = null;
  let tempRightImage = null;
  let activePickTarget = 'single';

  const showToast = (text) => {
    if (!insToast) return;
    insToast.textContent = text;
    insToast.classList.add('show');
    setTimeout(() => insToast.classList.remove('show'), 2000);
  };

  const closeModal = () => {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    currentEditingId = null;
  };

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // 唤起编辑弹窗核心函数
  const openWidgetModal = async (id) => {
    currentEditingId = id;
    const conf = WIDGET_CONFIGS[id];
    if (!conf || !modalOverlay) return;

    if (modalTitle) modalTitle.textContent = conf.title;

    let saved = {};
    try {
      saved = (await idbGet(id)) || {};
    } catch (e) {
      saved = {};
    }

    // 保留已存图片状态，防止被覆盖为空
    tempSingleImage = saved.image || null;
    tempLeftImage = saved.leftImage || null;
    tempRightImage = saved.rightImage || null;

    // 智能调度单/双头像与无头像显隐
    if (modalImageSection) {
      if (conf.imageType === 'single') {
        modalImageSection.style.display = 'flex';
        if (modalSingleWrap) modalSingleWrap.style.display = 'flex';
        if (modalDuoWrap) modalDuoWrap.style.display = 'none';

        if (tempSingleImage && modalPreviewImg && modalPreviewPlaceholder) {
          modalPreviewImg.src = tempSingleImage;
          modalPreviewImg.style.display = 'block';
          modalPreviewPlaceholder.style.display = 'none';
        } else if (modalPreviewImg && modalPreviewPlaceholder) {
          modalPreviewImg.style.display = 'none';
          modalPreviewPlaceholder.style.display = 'block';
        }
      } else if (conf.imageType === 'duo') {
        modalImageSection.style.display = 'flex';
        if (modalSingleWrap) modalSingleWrap.style.display = 'none';
        if (modalDuoWrap) modalDuoWrap.style.display = 'flex';

        // 左耳
        if (tempLeftImage && duoImgLeft && duoPhLeft) {
          duoImgLeft.src = tempLeftImage;
          duoImgLeft.style.display = 'block';
          duoPhLeft.style.display = 'none';
        } else if (duoImgLeft && duoPhLeft) {
          duoImgLeft.style.display = 'none';
          duoPhLeft.style.display = 'block';
        }

        // 右耳
        if (tempRightImage && duoImgRight && duoPhRight) {
          duoImgRight.src = tempRightImage;
          duoImgRight.style.display = 'block';
          duoPhRight.style.display = 'none';
        } else if (duoImgRight && duoPhRight) {
          duoImgRight.style.display = 'none';
          duoPhRight.style.display = 'block';
        }
      } else {
        // 无图片 (P6)
        modalImageSection.style.display = 'none';
      }
    }

    // 动态渲染文字胶囊
    if (modalInputsForm) {
      modalInputsForm.innerHTML = '';
      conf.fields.forEach(field => {
        let currentVal = '';
        if (saved.texts && saved.texts[field.key] !== undefined) {
          currentVal = saved.texts[field.key];
        } else {
          const domEl = document.querySelector(field.selector);
          if (domEl) {
            currentVal = field.isAttr ? domEl.getAttribute(field.isAttr) : domEl.textContent.trim();
          }
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'modal-input-pill';
        input.placeholder = field.label;
        input.value = currentVal;
        input.dataset.key = field.key;
        modalInputsForm.appendChild(input);
      });
    }

    modalOverlay.classList.add('active');
  };

  // 绑定相框点击唤起文件选择
  if (modalAvatarPreview && modalFileInput) {
    modalAvatarPreview.addEventListener('click', () => {
      activePickTarget = 'single';
      modalFileInput.click();
    });
  }

  if (duoAvatarLeft && modalFileInput) {
    duoAvatarLeft.addEventListener('click', () => {
      activePickTarget = 'left';
      modalFileInput.click();
    });
  }

  if (duoAvatarRight && modalFileInput) {
    duoAvatarRight.addEventListener('click', () => {
      activePickTarget = 'right';
      modalFileInput.click();
    });
  }

  // 文件选取回调 (无损 Base64/DataURL)
  if (modalFileInput) {
    modalFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        if (activePickTarget === 'single') {
          tempSingleImage = base64;
          if (modalPreviewImg && modalPreviewPlaceholder) {
            modalPreviewImg.src = base64;
            modalPreviewImg.style.display = 'block';
            modalPreviewPlaceholder.style.display = 'none';
          }
        } else if (activePickTarget === 'left') {
          tempLeftImage = base64;
          if (duoImgLeft && duoPhLeft) {
            duoImgLeft.src = base64;
            duoImgLeft.style.display = 'block';
            duoPhLeft.style.display = 'none';
          }
        } else if (activePickTarget === 'right') {
          tempRightImage = base64;
          if (duoImgRight && duoPhRight) {
            duoImgRight.src = base64;
            duoImgRight.style.display = 'block';
            duoPhRight.style.display = 'none';
          }
        }
      };
      reader.readAsDataURL(file);
      modalFileInput.value = '';
    });
  }

  // 提交保存按键
  if (modalSubmitBtn) {
    modalSubmitBtn.addEventListener('click', async () => {
      if (!currentEditingId) return;

      const conf = WIDGET_CONFIGS[currentEditingId];
      const textsData = {};

      if (modalInputsForm) {
        const inputs = modalInputsForm.querySelectorAll('.modal-input-pill');
        inputs.forEach(input => {
          textsData[input.dataset.key] = input.value.trim();
        });
      }

      const payload = {
        texts: textsData,
        image: tempSingleImage,
        leftImage: tempLeftImage,
        rightImage: tempRightImage
      };

      try {
        await idbSet(currentEditingId, payload);
        applyWidgetData(currentEditingId, payload);
        closeModal();
        showToast('✦ 已保存至本地');
      } catch (err) {
        console.error('保存失败:', err);
        showToast('保存失败，请重试');
      }
    });
  }

  // 绑定小组件点击
  const bindWidgetClick = (selector, id) => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return; // 避免音乐暂停播放按钮被误触
        openWidgetModal(id);
      });
    }
  };

  bindWidgetClick('.widget-p1-jasmine', 'p1');
  bindWidgetClick('.widget-p2-memory', 'p2');
  bindWidgetClick('.widget-p3-coffee', 'p3');
  bindWidgetClick('.widget-p4-meeting', 'p4');
  bindWidgetClick('.widget-p5-duo-music', 'p5');
  bindWidgetClick('.widget-p6-search-bar', 'p6');
});
