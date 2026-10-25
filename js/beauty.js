/**
 * Asher phone - 美化 APP (Beauty Studio Controller)
 * 架构：卡片分组列�?+ 独立多级 Subpage 路由 + IndexedDB 异步高质感存�? */

// ==================== ȫ�ֱ屏幕调整壁纸ݿ� ====================
let fontDB = null;
let currentFontData = null;
let selectedCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {

  const beautyApp = document.querySelector('.beauty-app-container');
  const beautyBackBtn = document.getElementById('beauty-back-btn');
  const insToast = document.getElementById('ins-toast');

  const showToast = (msg) => {
    if (insToast) {
      insToast.textContent = msg;
      insToast.classList.add('show');
      setTimeout(() => insToast.classList.remove('show'), 2000);
    }
  };

  // ================= IndexedDB 异步高容量壁纸与图标缓存�?=================
  let db = null;
  const initDB = () => {
    return new Promise((resolve) => {
      const request = indexedDB.open('AsherPhoneBeautyDB', 1);
      request.onerror = () => resolve(null);
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains('wallpapers')) {
          database.createObjectStore('wallpapers', { keyPath: 'id', autoIncrement: true });
        }
        if (!database.objectStoreNames.contains('appIcons')) {
          database.createObjectStore('appIcons', { keyPath: 'appKey' });
        }
      };
    });
  };
  const dbReady = initDB();

  const saveWallpaperToIDB = async (dataUrl) => {
    await dbReady;
    if (!db) return;
    const tx = db.transaction('wallpapers', 'readwrite');
    const store = tx.objectStore('wallpapers');
    store.add({ dataUrl, time: Date.now() });
    tx.oncomplete = () => {
      renderWallpaperShelf();
      showToast("操作成功");
    };
  };

  function loadWallpaperLibrary() {
    if (!db) return;
    const tx = db.transaction('wallpapers', 'readonly');
    const store = tx.objectStore('wallpapers');
    const req = store.getAll();
    req.onsuccess = () => {
      const wallpapers = req.result || [];
      const grid = document.getElementById('wallpaper-library-grid');
      if (!grid) return;
      grid.innerHTML = '';
      wallpapers.forEach(wp => {
        const item = document.createElement('div');
        item.className = 'wallpaper-thumb-item';
        item.style.backgroundImage = `url("${wp.dataUrl}")`;
        item.addEventListener('click', () => {
          applyWallpaper(wp.dataUrl);
          document.querySelectorAll('.wallpaper-thumb-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          showToast('已应用壁纸库壁纸');
        });
        grid.appendChild(item);
      });
    };
  };

  // 1. ��/�ر屏幕调整���
  const openBeautyApp = () => {
    // console.log removed;
    // console.log removed;
    if (beautyApp) {
      beautyApp.classList.add('active');
      renderAppIconCustomList();
    }
  };
  const closeBeautyApp = () => {
    if (beautyApp) {
      beautyApp.classList.remove('active');
      document.querySelectorAll('.beauty-subpage').forEach(sub => sub.classList.remove('active'));
    }
  };

  const beautyAppIcons = document.querySelectorAll('.app-item[data-app="beauty"]');
  beautyAppIcons.forEach(item => {
    item.addEventListener('click', () => {
      // console.log removed;
      openBeautyApp();
      if (navigator.vibrate) navigator.vibrate(10);
    });
  });

  if (beautyBackBtn) {
    beautyBackBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeBeautyApp();
    });
  }

  // 2. 壁纸��ҳ��·��
  const beautyCells = document.querySelectorAll('.beauty-cell[data-beauty-target]');
  beautyCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const target = cell.dataset.beautyTarget;
      const subpage = document.getElementById(`bsub-${target}`);
      if (subpage) {
        subpage.classList.add('active');
        if (navigator.vibrate) navigator.vibrate(8);
      }
    });
  });

  const subBackBtns = document.querySelectorAll('.bsub-back-btn');
  subBackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentSub = btn.closest('.beauty-subpage');
      if (currentSub) currentSub.classList.remove('active');
    });
  });

  // ================= 3. 屏幕调整与滤镜核心管�?=================
  const screenContainer = document.getElementById('screen-container');
  const body = document.body;
  const sliderScale = document.getElementById('slider-b-scale');
  const valScale = document.getElementById('val-b-scale');
  const sliderOffsetY = document.getElementById('slider-b-offset-y');
  const valOffsetY = document.getElementById('val-b-offset-y');
  const sliderOffsetX = document.getElementById('slider-b-offset-x');
  const valOffsetX = document.getElementById('val-b-offset-x');
  const sliderRadius = document.getElementById('slider-b-radius');
  const valRadius = document.getElementById('val-b-radius');

  const btnScreenCenter = document.getElementById('btn-screen-center');
  const btnScreenReset = document.getElementById('btn-screen-reset');
  const btnSaveScreen = document.getElementById('btn-save-screen');

  const filterChips = document.querySelectorAll('.filter-chip');
  const sliderTemp = document.getElementById('slider-b-temp');
  const valTemp = document.getElementById('val-b-temp');
  const sliderBright = document.getElementById('slider-b-bright');
  const valBright = document.getElementById('val-b-bright');
  const sliderContrast = document.getElementById('slider-b-contrast');
  const valContrast = document.getElementById('val-b-contrast');
  const sliderSat = document.getElementById('slider-b-sat');
  const valSat = document.getElementById('val-b-sat');

  function applyViewportTransform() {
    if (!screenContainer) return;
    const scale = sliderScale ? sliderScale.value : 1.0;
    const x = sliderOffsetX ? sliderOffsetX.value : 0;
    const y = sliderOffsetY ? sliderOffsetY.value : 0;
    screenContainer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    screenContainer.style.transformOrigin = 'center center';
  };

  function applyScreenFilters() {
    const bright = sliderBright ? sliderBright.value : 100;
    const contrast = sliderContrast ? sliderContrast.value : 100;
    const sat = sliderSat ? sliderSat.value : 100;
    const temp = sliderTemp ? parseInt(sliderTemp.value, 10) : 0;

    let sepiaVal = 0;
    let hueVal = 0;
    if (temp > 0) {
      sepiaVal = (temp / 50) * 0.38;
      hueVal = -((temp / 50) * 12);
    } else if (temp < 0) {
      hueVal = -(temp / 50) * 22;
    }

    document.documentElement.style.filter = `brightness(${bright}%) contrast(${contrast}%) saturate(${sat}%) sepia(${sepiaVal}) hue-rotate(${hueVal}deg)`;
    if (screenContainer) screenContainer.style.filter = 'none';
  };

  if (sliderScale) sliderScale.addEventListener('input', () => { if (valScale) valScale.textContent = `${sliderScale.value}x`; applyViewportTransform(); });
  if (sliderOffsetY) sliderOffsetY.addEventListener('input', () => { if (valOffsetY) valOffsetY.textContent = `${sliderOffsetY.value}px`; applyViewportTransform(); });
  if (sliderOffsetX) sliderOffsetX.addEventListener('input', () => { if (valOffsetX) valOffsetX.textContent = `${sliderOffsetX.value}px`; applyViewportTransform(); });
  if (sliderRadius) sliderRadius.addEventListener('input', () => { if (valRadius) valRadius.textContent = `${sliderRadius.value}px`; document.documentElement.style.setProperty('--widget-radius', `${sliderRadius.value}px`); });

  if (sliderTemp) sliderTemp.addEventListener('input', () => { const v = parseInt(sliderTemp.value, 10); if (valTemp) valTemp.textContent = v > 0 ? `+${v} (�?` : v < 0 ? `${v} (�?` : '0'; applyScreenFilters(); });
  if (sliderBright) sliderBright.addEventListener('input', () => { if (valBright) valBright.textContent = `${sliderBright.value}%`; applyScreenFilters(); });
  if (sliderContrast) sliderContrast.addEventListener('input', () => { if (valContrast) valContrast.textContent = `${sliderContrast.value}%`; applyScreenFilters(); });
  if (sliderSat) sliderSat.addEventListener('input', () => { if (valSat) valSat.textContent = `${sliderSat.value}%`; applyScreenFilters(); });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const mode = chip.dataset.filter;
      if (mode === 'raw') { sliderTemp.value = 0; sliderBright.value = 100; sliderContrast.value = 100; sliderSat.value = 100; }
      else if (mode === 'cool') { sliderTemp.value = -32; sliderBright.value = 104; sliderContrast.value = 105; sliderSat.value = 92; }
      else if (mode === 'warm') { sliderTemp.value = 35; sliderBright.value = 102; sliderContrast.value = 98; sliderSat.value = 108; }
      else if (mode === 'mono') { sliderTemp.value = 0; sliderBright.value = 102; sliderContrast.value = 115; sliderSat.value = 0; }
      applyScreenFilters();
      showToast(`滤镜预设: ${chip.textContent}`);
    });
  });

  if (btnScreenCenter) btnScreenCenter.addEventListener('click', () => { if (sliderOffsetX) sliderOffsetX.value = 0; if (sliderOffsetY) sliderOffsetY.value = 0; applyViewportTransform(); showToast("操作成功"); });
  if (btnScreenReset) btnScreenReset.addEventListener('click', () => { if (sliderScale) sliderScale.value = 1.00; if (sliderOffsetX) sliderOffsetX.value = 0; if (sliderOffsetY) sliderOffsetY.value = 0; applyViewportTransform(); showToast("操作成功"); });
  if (btnSaveScreen) btnSaveScreen.addEventListener('click', () => { saveBeautyConfig(); showToast("操作成功"); });

  // ================= 4. 子页�?2: 桌面美化、壁纸与�?APP 图标自定�?=================
  const wallpaperCanvas = document.getElementById('pure-wallpaper-canvas');
  const canvasEmptyTip = document.getElementById('canvas-empty-tip');
  const sliderWpScale = document.getElementById('slider-wp-scale');
  const sliderWpX = document.getElementById('slider-wp-x');
  const sliderWpY = document.getElementById('slider-wp-y');
  const sliderWpBlur = document.getElementById('slider-wp-blur');
  const sliderWpOpacity = document.getElementById('slider-wp-opacity');
  const sliderBlur = document.getElementById('slider-b-blur');
  const valWpScale = document.getElementById('val-wp-scale');
  const valWpX = document.getElementById('val-wp-x');
  const valWpY = document.getElementById('val-wp-y');
  const valWpBlur = document.getElementById('val-wp-blur');
  const valWpOpacity = document.getElementById('val-wp-opacity');
  const valBlur = document.getElementById('val-b-blur');
  const btnUploadWallpaper = document.getElementById('btn-upload-wallpaper');
  const btnSaveToLibrary = document.getElementById('btn-save-to-library');
  const btnResetWallpaper = document.getElementById('btn-reset-wallpaper');
  const sliderIconSize = document.getElementById('slider-b-iconsize');
  const valIconSize = document.getElementById('val-b-iconsize');
  const sliderIconRadius = document.getElementById('slider-b-iconradius');
  const valIconRadius = document.getElementById('val-b-iconradius');
  const shapeBtns = document.querySelectorAll('.shape-chip');
  const btnSaveDesktop = document.getElementById('btn-save-desktop');

  let activeWallpaperData = '';

  function applyWallpaper(dataUrl) {
    activeWallpaperData = dataUrl;
    [screenContainer, wallpaperCanvas].forEach(target => {
      if (!target) return;
      target.style.backgroundImage = `url("${dataUrl}")`;
      target.style.backgroundRepeat = 'no-repeat';
      target.style.backgroundSize = 'cover';
      target.style.backgroundPosition = 'center';
    });
    if (canvasEmptyTip) canvasEmptyTip.style.display = 'none';
    if (btnResetWallpaper) btnResetWallpaper.style.display = 'inline-block';
    if (btnSaveToLibrary) btnSaveToLibrary.style.display = 'inline-block';
    applyWallpaperTweaks();
  };

  function applyWallpaperTweaks() {
    if (!wallpaperCanvas) return;
    const scale = sliderWpScale ? Number(sliderWpScale.value) : 100;
    const x = sliderWpX ? sliderWpX.value : 50;
    const y = sliderWpY ? sliderWpY.value : 50;
    const blur = sliderWpBlur ? sliderWpBlur.value : 0;
    const opacity = sliderWpOpacity ? Number(sliderWpOpacity.value) / 100 : 1;
    wallpaperCanvas.style.backgroundSize = `${scale}% auto`;
    wallpaperCanvas.style.backgroundPosition = `${x}% ${y}%`;
    wallpaperCanvas.style.filter = `blur(${blur}px)`;
    wallpaperCanvas.style.opacity = opacity;
    if (valWpScale) valWpScale.textContent = `${scale}%`;
    if (valWpX) valWpX.textContent = `${x}%`;
    if (valWpY) valWpY.textContent = `${y}%`;
    if (valWpBlur) valWpBlur.textContent = `${blur}px`;
    if (valWpOpacity) valWpOpacity.textContent = `${Math.round(opacity * 100)}%`;
    if (valBlur && sliderBlur) valBlur.textContent = `${sliderBlur.value}px`;
  };

  [sliderWpScale, sliderWpX, sliderWpY, sliderWpBlur, sliderWpOpacity, sliderBlur].forEach(slider => {
    if (slider) slider.addEventListener('input', applyWallpaperTweaks);
  });
  document.getElementById('btn-wp-center')?.addEventListener('click', () => {
    if (sliderWpX) sliderWpX.value = 50;
    if (sliderWpY) sliderWpY.value = 50;
    applyWallpaperTweaks();
  });
  document.getElementById('btn-wp-cover')?.addEventListener('click', () => {
    if (sliderWpScale) sliderWpScale.value = 100;
    if (sliderWpX) sliderWpX.value = 50;
    if (sliderWpY) sliderWpY.value = 50;
    applyWallpaperTweaks();
  });

  async function renderWallpaperShelf() {
    await dbReady;
    const shelf = document.getElementById('wallpaper-shelf-row');
    if (!shelf || !db) return;
    const req = db.transaction('wallpapers', 'readonly').objectStore('wallpapers').getAll();
    req.onsuccess = () => {
      shelf.innerHTML = '';
      const wallpapers = req.result || [];
      if (!wallpapers.length) {
        shelf.innerHTML = '<div class="shelf-empty">壁纸库空空如也，上传壁纸后点�?存入壁纸�?即可收藏</div>';
        return;
      }
      wallpapers.forEach(wp => {
        const item = document.createElement('div');
        item.className = 'shelf-thumb';
        item.style.backgroundImage = `url("${wp.dataUrl}")`;
        item.addEventListener('click', () => applyWallpaper(wp.dataUrl));
        shelf.appendChild(item);
      });
    };
  };

  // ====== iOS �߼� INS �ʸб�ֽѡ壁纸� (ActionSheet) ======
  const wpActionSheet = document.getElementById('wp-actionsheet-wrapper');
  const wpScrim = document.getElementById('wp-actionsheet-scrim');
  const wpPanel = document.getElementById('wp-actionsheet-panel');
  const btnAsAlbum = document.getElementById('as-btn-album');
  const btnAsFile = document.getElementById('as-btn-file');
  const btnAsUrl = document.getElementById('as-btn-url');
  const btnAsCancel = document.getElementById('as-btn-cancel');

  const inputWpAlbum = document.getElementById('input-wp-album');
  const inputWpFiles = document.getElementById('input-wp-files');

  const urlDialogCard = document.getElementById('ins-url-dialog-card');
  const inputUrlField = document.getElementById('ins-url-input-field');
  const btnUrlCancel = document.getElementById('ins-url-cancel-btn');
  const btnUrlConfirm = document.getElementById('ins-url-confirm-btn');

  // �� Action Sheet
  const openActionSheet = () => {
    // console.log removed;
    // console.log removed;
    if (wpActionSheet) {
      // console.log removed;
      wpActionSheet.classList.add('active');
      if (urlDialogCard) urlDialogCard.classList.remove('active');
      if (wpPanel) wpPanel.style.display = '';
      // ��ʱ屏幕调整壁纸�� overflow壁纸�� Action Sheet 壁纸
      if (beautyApp) beautyApp.style.overflow = 'visible';
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  // �ر屏幕调整�
  const closeActionSheet = () => {
    if (wpActionSheet) wpActionSheet.classList.remove('active');
    if (urlDialogCard) urlDialogCard.classList.remove('active');
    // �ָ屏幕调整��� overflow
    if (beautyApp) beautyApp.style.overflow = 'hidden';
  };

  if (btnUploadWallpaper) {
    btnUploadWallpaper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // console.log removed;
      openActionSheet();
    });
  }
  if (wpScrim) wpScrim.addEventListener('click', closeActionSheet);
  if (btnAsCancel) btnAsCancel.addEventListener('click', closeActionSheet);

  // ͳһ��ֽͼƬ���봦��
  const processWallpaperFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast("操作成功");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const bgData = event.target.result;
      applyWallpaper(bgData);
      activeWallpaperData = bgData;
      localStorage.setItem('asher_custom_wallpaper', bgData);
      showToast("操作成功");
    };
    reader.readAsDataURL(file);
    closeActionSheet();
  };

  // 1. ��Ƭ图标 (ϵͳ���)
  if (btnAsAlbum && inputWpAlbum) {
    btnAsAlbum.addEventListener('click', () => {
      inputWpAlbum.click();
    });
    inputWpAlbum.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) processWallpaperFile(file);
      inputWpAlbum.value = '';
    });
  }

  // 2. ѡȡ�ļ� (�ļ� App / ϵͳ�ļ�Ŀ¼)
  if (btnAsFile && inputWpFiles) {
    btnAsFile.addEventListener('click', () => {
      inputWpFiles.click();
    });
    inputWpFiles.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) processWallpaperFile(file);
      inputWpFiles.value = '';
    });
  }

  // 3. 屏幕调整 (屏幕调整΢质感 URL ���뿨Ƭ���޳�ªԭ壁纸��)
  if (btnAsUrl && urlDialogCard) {
    btnAsUrl.addEventListener('click', () => {
      if (wpPanel) wpPanel.style.display = 'none'; // ���ص壁纸�壬ͻ�Ծ屏幕调整
      urlDialogCard.classList.add('active');
      if (inputUrlField) {
        inputUrlField.value = '';
        setTimeout(() => inputUrlField.focus(), 150);
      }
    });
  }

  if (btnUrlCancel) {
    btnUrlCancel.addEventListener('click', closeActionSheet);
  }

  if (btnUrlConfirm) {
    btnUrlConfirm.addEventListener('click', () => {
      const url = inputUrlField ? inputUrlField.value.trim() : '';
      if (!url) {
        showToast("操作成功");
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
        showToast("操作成功");
        return;
      }

      showToast("操作成功");
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('壁纸��Ӧ�쳣');
          return res.blob();
        })
        .then(blob => {
          if (!blob.type.startsWith('image/')) {
            // 屏幕调整ϸ��ͼƬ MIME壁纸Ȼ壁纸�� Image ��ǩУ��
            console.warn('���ϸ�ͼƬ Blob壁纸��ֱ��Ӧ��');
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            const bgData = e.target.result;
            applyWallpaper(bgData);
            activeWallpaperData = bgData;
            localStorage.setItem('asher_custom_wallpaper', bgData);
            showToast("操作成功");
            closeActionSheet();
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error(err);
          // 屏幕调整�أ�ֱ�ӻ���Ϊ URL Ӧ��
          applyWallpaper(url);
          activeWallpaperData = url;
          localStorage.setItem('asher_custom_wallpaper', url);
          showToast("操作成功");
          closeActionSheet();
        });
    });
  }
  if (btnSaveToLibrary && btnResetWallpaper) {
    btnSaveToLibrary.addEventListener('click', () => {
      if (activeWallpaperData) {
        saveWallpaperToIDB(activeWallpaperData);
      }
    });

    btnResetWallpaper.addEventListener('click', () => {
      activeWallpaperData = '';
      if (screenContainer) screenContainer.style.backgroundImage = 'none';
      if (wallpaperCanvas) wallpaperCanvas.style.backgroundImage = 'none';
      if (canvasEmptyTip) canvasEmptyTip.style.display = '';
      btnResetWallpaper.style.display = 'none';
      btnSaveToLibrary.style.display = 'none';
      localStorage.removeItem('asher_custom_wallpaper');
      showToast("操作成功");
    });
  }

  // 图标ߴ壁纸�״
  if (sliderIconSize) {
    sliderIconSize.addEventListener('input', () => {
      const size = sliderIconSize.value;
      if (valIconSize) valIconSize.textContent = `${size}px`;
      // ʹ��CSS壁纸ȫ�ֿ���图标ߴ�
      document.documentElement.style.setProperty('--app-icon-size', size + 'px');
    });
  }
  shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shape = btn.dataset.shape;
      let radiusVal = '16px';
      if (shape === 'round') radiusVal = '12px';
      else if (shape === 'circle') radiusVal = '50%';
      else if (shape === 'square') radiusVal = '4px';

      document.documentElement.style.setProperty('--app-icon-radius', radiusVal);
      document.querySelectorAll('.app-icon-inner, .app-item').forEach(el => {
        el.style.borderRadius = radiusVal;
      });
      showToast(`图标形状: ${btn.textContent}`);
    });
  });

  // �?APP 图标自定义挂载与替换
  function renderAppIconCustomList() {
    const listContainer = document.getElementById('app-icon-manage-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const allApps = document.querySelectorAll('.app-item');
    allApps.forEach(appItem => {
      const appKey = appItem.dataset.app || appItem.querySelector('.app-name')?.textContent || 'app';
      const appName = appItem.querySelector('.app-name')?.textContent || appKey;

      const row = document.createElement('div');
      row.className = 'app-icon-row-item';
      row.innerHTML = `
        <div class="air-app-meta">
          <div class="air-app-preview-thumb" id="thumb-${appKey}">APP</div>
          <span class="air-app-name">${appName}</span>
        </div>
        <button type="button" class="air-app-upload-btn" data-key="${appKey}">更换图标</button>
      `;
      const thumb = row.querySelector(`#thumb-${appKey}`);
      // 壁纸ڴ��洢���Ƿ壁纸Զ���图标
      if (db) {
        const tx = db.transaction('appIcons', 'readonly');
        const store = tx.objectStore('appIcons');
        const req = store.get(appKey);
        req.onsuccess = () => {
          if (req.result && req.result.dataUrl) {
            thumb.style.backgroundImage = `url("${req.result.dataUrl}")`;
            thumb.textContent = '';
          }
        };
      }

      row.querySelector('.air-app-upload-btn').addEventListener('click', () => {
        const fInput = document.createElement('input');
        fInput.type = 'file';
        fInput.accept = 'image/*';
        fInput.style.display = 'none';
        document.body.appendChild(fInput);

        fInput.addEventListener('change', (ev) => {
          const file = ev.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const iconData = e.target.result;
              thumb.style.backgroundImage = `url("${iconData}")`;
              thumb.textContent = '';
              
              // 实时应用到桌面上对应�?APP 图标
              const iconDiv = appItem.querySelector('.app-icon');
              if (iconDiv) {
                iconDiv.style.backgroundImage = `url("${iconData}")`;
                iconDiv.style.backgroundSize = 'cover';
                iconDiv.style.backgroundPosition = 'center';
                iconDiv.style.backgroundRepeat = 'no-repeat';
                const currentRadius = getComputedStyle(document.documentElement).getPropertyValue('--app-icon-radius') || '22%';
                iconDiv.style.borderRadius = currentRadius;
                iconDiv.querySelectorAll('svg').forEach(svg => svg.style.display = 'none');
              }

              // 存入 IndexedDB
              if (db) {
                const tx = db.transaction('appIcons', 'readwrite');
                const store = tx.objectStore('appIcons');
                store.put({ appKey, dataUrl: iconData });
              }
              showToast("操作成功");
            };
            reader.readAsDataURL(file);
          }
          fInput.remove();
        });
        fInput.click();
      });

      listContainer.appendChild(row);
    });
  };

  if (btnSaveDesktop) {
    btnSaveDesktop.addEventListener('click', () => {
      saveBeautyConfig();
      showToast("操作成功");
    });
  }
  const btnResetAllIcons = document.getElementById('btn-reset-all-icons');
  if (btnResetAllIcons) {
    btnResetAllIcons.addEventListener('click', async () => {
      await dbReady;
      if (!db) {
        showToast("操作成功");
        return;
      }
      const tx = db.transaction('appIcons', 'readwrite');
      tx.objectStore('appIcons').clear();
      tx.oncomplete = () => {
        document.querySelectorAll('.app-icon').forEach(icon => {
          icon.style.backgroundImage = '';
          icon.querySelectorAll('svg').forEach(svg => svg.style.display = '');
        });
        showToast("操作成功");
        renderAppIconCustomList();
      };
      tx.onerror = () => showToast("操作成功");
    });
  }

  // ================= 5. 子页�?3 & 4: 字体与主题色�?=================
  const fontCards = document.querySelectorAll('.font-option-card');
// ==================== 壁纸���ģ�飨ȫ�°汾�� ====================

// IndexedDB ��ʼ壁纸֧壁纸��ͷ��ࣩ
const initFontDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AsherFontDB', 2); // 壁纸���汾2
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('fonts')) {
        db.createObjectStore('fonts', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('categories')) {
        const catStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        // 壁纸Ĭ�Ϸ���
        catStore.transaction.oncomplete = () => {
          const transaction = db.transaction(['categories'], 'readwrite');
          const store = transaction.objectStore('categories');
          ['�޳���', '壁纸', '��д', 'װ��'].forEach(name => {
            store.add({ name, createdAt: Date.now() });
          });
        };
      }
    };
  });
};


// ��ʼ��
initFontDB().then(db => { 
  fontDB = db; 
  loadCategories();
  loadFontPresets();
  
  // 自动恢复上次保存的字体设置
  const savedFontId = localStorage.getItem('asher_active_font_id');
  const savedFontFamily = localStorage.getItem('asher_active_font_family');
  
  if (savedFontFamily) {
    // 快速应用已保存的字体（无需等待数据库查询）
    document.documentElement.style.setProperty('--font-family', savedFontFamily);
    document.body.style.fontFamily = savedFontFamily;
    console.log('已自动恢复字体设置:', savedFontFamily);
  }
  
  // 如果有保存的字体ID，重新加载该字体文件确保完整性
  if (savedFontId && db) {
    const tx = db.transaction(['fonts'], 'readonly');
    const store = tx.objectStore('fonts');
    const req = store.get(parseInt(savedFontId));
    req.onsuccess = () => {
      const font = req.result;
      if (font) {
        loadFontToDocument(font);
      }
    };
  }
});

// 屏幕调整删除�¼�
document.addEventListener('fontDeleted', () => {
  loadFontPresets();
});

// DOM Ԫ��
const btnUploadFont = document.getElementById('btn-upload-font');
const btnUseUrl = document.getElementById('btn-use-url');
const inputFontFile = document.getElementById('input-font-file');
const inputFontUrl = document.getElementById('input-font-url');
const inputFontName = document.getElementById('input-font-name');
const btnSaveFont = document.getElementById('btn-save-font');
const btnAddCategory = document.getElementById('btn-add-category');
const fontPreviewDisplay = document.getElementById('font-preview-display');
const fontPresetList = document.getElementById('font-preset-list');
const categoryTagsContainer = document.getElementById('category-tags-container');
const urlInputPanel = document.getElementById('url-input-panel');
const fontCountDisplay = document.getElementById('font-count');

// ========== �Զ屏幕调整� ==========

async function loadCategories() {
  if (!fontDB) return;
  
  const transaction = fontDB.transaction(['categories'], 'readonly');
  const store = transaction.objectStore('categories');
  const request = store.getAll();
  
  request.onsuccess = () => {
    const categories = request.result;
    renderCategories(categories);
    
    // Ĭ��ѡ�е�һ��
    if (categories.length > 0 && !selectedCategoryId) {
      selectedCategoryId = categories[0].id;
    }
  };
}

function renderCategories(categories) {
  categoryTagsContainer.innerHTML = '';
  
  categories.forEach(cat => {
    const tag = document.createElement('div');
    tag.className = 'category-tag';
    if (cat.id === selectedCategoryId) tag.classList.add('active');
    tag.dataset.categoryId = cat.id;
    
    tag.innerHTML = `
      <span>${cat.name}</span>
      <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    `;
    
    // ���ѡ��
    tag.querySelector('span').addEventListener('click', () => {
      document.querySelectorAll('.category-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      selectedCategoryId = cat.id;
    });
    
    // ɾ壁纸��
    tag.querySelector('.delete-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCategory(cat.id);
    });
    
    categoryTagsContainer.appendChild(tag);
  });
}

// �½壁纸�
if (btnAddCategory) {
  btnAddCategory.addEventListener('click', async () => {
    const name = prompt('壁纸�·壁纸��ƣ�');
    if (!name || !name.trim()) return;
    
    const transaction = fontDB.transaction(['categories'], 'readwrite');
    const store = transaction.objectStore('categories');
    store.add({ name: name.trim(), createdAt: Date.now() });
    
    transaction.oncomplete = () => {
      loadCategories();
      alert(`���ࡸ${name}���Ѵ���`);
    };
  });
}

// ɾ壁纸��
async function deleteCategory(id) {
  if (!confirm('ȷ��删除�÷��ࣿ壁纸�µ壁纸彫壁纸Ӱ�졣')) return;
  
  const transaction = fontDB.transaction(['categories'], 'readwrite');
  const store = transaction.objectStore('categories');
  store.delete(id);
  
  transaction.oncomplete = () => {
    if (selectedCategoryId === id) selectedCategoryId = null;
    loadCategories();
  };
}

// ========== 壁纸�ϴ� ==========

// 壁纸�ļ��ϴ�
if (btnUploadFont && inputFontFile) {
  btnUploadFont.addEventListener('click', () => {
    urlInputPanel.style.display = 'none';
    inputFontFile.click();
  });
  
  inputFontFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      currentFontData = {
        type: 'file',
        data: event.target.result,
        fileName: file.name
      };
      previewFont(event.target.result);
    };
    reader.readAsDataURL(file);
  });
}

// URL �ϴ�
if (btnUseUrl) {
  btnUseUrl.addEventListener('click', () => {
    const isVisible = urlInputPanel.style.display === 'block';
    urlInputPanel.style.display = isVisible ? 'none' : 'block';
  });
}

if (inputFontUrl) {
  inputFontUrl.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      currentFontData = {
        type: 'url',
        url: url
      };
      previewFont(url);
    }
  });
}

// Ԥ壁纸��
async function previewFont(fontSrc) {
  if (!fontPreviewDisplay) return;
  
  try {
    const fontFamily = 'PreviewFont_' + Date.now();
    const fontFace = new FontFace(fontFamily, `url(${fontSrc})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    fontPreviewDisplay.style.fontFamily = fontFamily;
  } catch (err) {
    console.error('字体加载失败:', err);
    alert('壁纸Ԥ��ʧ�ܣ壁纸��ļ���URL');
  }
}

// ========== 屏幕调整 ==========

if (btnSaveFont) {
  btnSaveFont.addEventListener('click', async () => {
    const name = inputFontName.value.trim();
    
    if (!name) {
      alert('屏幕调整壁纸��');
      return;
    }
    
    if (!currentFontData) {
      alert('壁纸�ϴ壁纸��ļ壁纸���URL');
      return;
    }
    
    if (!selectedCategoryId) {
      alert('��ѡ屏幕调整�');
      return;
    }
    
    // ��ȡ屏幕调整
    const transaction = fontDB.transaction(['categories'], 'readonly');
    const store = transaction.objectStore('categories');
    const catRequest = store.get(selectedCategoryId);
    
    catRequest.onsuccess = () => {
      const category = catRequest.result;
      
      const fontRecord = {
        name: name,
        categoryId: selectedCategoryId,
        categoryName: category ? category.name : 'δ壁纸',
        type: currentFontData.type,
        url: currentFontData.type === 'url' ? currentFontData.url : currentFontData.data,
        createdAt: Date.now()
      };
      
      const saveTransaction = fontDB.transaction(['fonts'], 'readwrite');
      const fontStore = saveTransaction.objectStore('fonts');
      fontStore.add(fontRecord);
      
      saveTransaction.oncomplete = () => {
        alert(`���塸${name}壁纸��ɹ�`);
        inputFontName.value = '';
        currentFontData = null;
        loadFontPresets();
      };
    };
  });
}

// ========== 屏幕调整� ==========

async function loadFontPresets() {
  if (!fontDB || !fontPresetList) return;
  
  const transaction = fontDB.transaction(['fonts'], 'readonly');
  const store = transaction.objectStore('fonts');
  const request = store.getAll();
  
  request.onsuccess = () => {
    const fonts = request.result;
    renderFontPresets(fonts);
    
    // ���¼���
    if (fontCountDisplay) {
      fontCountDisplay.textContent = fonts.length;
    }
  };
}

function renderFontPresets(fonts) {
  fontPresetList.innerHTML = '';
  
  fonts.forEach(font => {
    const card = document.createElement('div');
    card.className = 'font-preset-card';
    
    card.innerHTML = `
      <div class="font-card-header">
        <span class="font-card-name">${font.name}</span>
        <div class="font-card-actions">
          <button class="font-action-btn apply" onclick="applyFont(${font.id})">应用</button>
          <button class="font-action-btn delete" onclick="deleteFont(${font.id})">删除</button>
        </div>
      </div>
      <div class="font-card-preview" style="font-family: 'AsherFont_${font.id}';">Aa Bb 优雅克制纯粹</div>
      <div class="font-card-category">${font.categoryName || '未分类'}</div>
    `;
    
    fontPresetList.appendChild(card);
    
    // 加载字体到文档
    loadFontToDocument(font);
  });
}

// 加载字体到文档
async function loadFontToDocument(font) {
  try {
    const fontFamily = 'AsherFont_' + font.id;
    const fontFace = new FontFace(fontFamily, `url(${font.url})`);
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch (err) {
    console.error('字体加载失败:', font.name, err);
  }
}

  // 主题色调
  const mistBtns = document.querySelectorAll('.mist-btn');
  const paletteCards = document.querySelectorAll('.palette-card');
  const pickerBg = document.getElementById('picker-color-bg');
  const valColorBg = document.getElementById('val-color-bg');
  const pickerAccent = document.getElementById('picker-color-accent');
  const valColorAccent = document.getElementById('val-color-accent');
  const btnSaveTheme = document.getElementById('btn-save-theme');
  let currentBgTheme = '#efe4e9';
  let currentAccentTheme = '#bdbbbf';

  function applyColors(bg, accent) {
    currentBgTheme = bg;
    currentAccentTheme = accent;
    document.documentElement.style.setProperty('--bg-phone', bg);
    document.documentElement.style.setProperty('--accent-color', accent);
    document.body.style.backgroundColor = bg;
    if (valColorBg) valColorBg.textContent = bg;
    if (pickerBg) pickerBg.value = bg;
    if (valColorAccent) valColorAccent.textContent = accent;
    if (pickerAccent) pickerAccent.value = accent;
  };

  mistBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mistBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mist;
      if (mode === 'night') applyColors('#1e1e20', '#3a3a3c');
      else applyColors('#efe4e9', '#bdbbbf');
    });
  });

  paletteCards.forEach(pCard => {
    pCard.addEventListener('click', () => {
      paletteCards.forEach(c => c.classList.remove('active'));
      pCard.classList.add('active');
      applyColors(pCard.dataset.bg, pCard.dataset.accent);
    });
  });

  if (pickerBg) pickerBg.addEventListener('input', (e) => applyColors(e.target.value, currentAccentTheme));
  if (pickerAccent) pickerAccent.addEventListener('input', (e) => applyColors(currentBgTheme, e.target.value));
  if (btnSaveTheme) btnSaveTheme.addEventListener('click', () => { saveBeautyConfig(); showToast("操作成功"); });

  // ================= 6. 持久化存储总线 =================
  const saveBeautyConfig = () => {
    const config = {
      scale: sliderScale ? sliderScale.value : '1.00',
      offsetX: sliderOffsetX ? sliderOffsetX.value : '0',
      offsetY: sliderOffsetY ? sliderOffsetY.value : '0',
      radius: sliderRadius ? sliderRadius.value : '24',
      temp: sliderTemp ? sliderTemp.value : '0',
      bright: sliderBright ? sliderBright.value : '100',
      contrast: sliderContrast ? sliderContrast.value : '100',
      sat: sliderSat ? sliderSat.value : '100',
      blur: sliderBlur ? sliderBlur.value : '16',
      iconSize: sliderIconSize ? sliderIconSize.value : '48',
      themeBg: currentBgTheme,
      themeAccent: currentAccentTheme
    };
    localStorage.setItem('asher_beauty_config', JSON.stringify(config));
  };

   const loadSavedConfig = () => {
    const wp = localStorage.getItem('asher_custom_wallpaper');
    if (wp) applyWallpaper(wp);

    renderAppIconCustomList();
    renderWallpaperShelf();

    const saved = localStorage.getItem('asher_beauty_config');
    if (saved) {
      try {
        const c = JSON.parse(saved);
        if (c.themeBg) applyColors(c.themeBg, c.themeAccent || '#bdbbbf');
        applyViewportTransform();
        applyScreenFilters();
        applyTypography();
        applyWallpaperTweaks();
      } catch (e) {}
    }
  };


  // ==================== 壁纸ɫ���л��¼壁纸� ====================
  // ʹ���¼�ί�У壁纸� bsub-theme 壁纸�ĵ���¼�
  document.addEventListener('click', (e) => {
    const themeCard = e.target.closest('.theme-card');
    if (themeCard && themeCard.closest('#bsub-theme')) {
      const themeKey = themeCard.dataset.theme;
      if (themeKey) {
        applyTheme(themeKey);
      }
    }
  });

  // ��ʼ壁纸�⣨��localStorage��ȡ��ʹ��Ĭ�ϣ�
  const initTheme = () => {
    const savedTheme = localStorage.getItem('asher_active_theme') || 'cherry';
    applyTheme(savedTheme);
  };
  loadSavedConfig();
  initTheme();
});

window.applyFont = async function(fontId) {
  const transaction = fontDB.transaction(['fonts'], 'readonly');
  const store = transaction.objectStore('fonts');
  const request = store.get(fontId);
  
  request.onsuccess = () => {
    const font = request.result;
    if (!font) return;
    
    // 全局应用字体 - 通过CSS变量注入到根元素
    const fontFamily = `'AsherFont_${font.id}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    
    // 1. 设置CSS变量（所有使用var(--font-family)的地方都会自动应用）
    document.documentElement.style.setProperty('--font-family', fontFamily);
    document.documentElement.style.setProperty('--font-custom', `'AsherFont_${font.id}'`);
    
    // 2. 直接应用到body（覆盖所有未明确指定字体的元素）
    document.body.style.fontFamily = fontFamily;
    
    // 3. 强制应用到所有主要APP容器（确保Chat、角色库等独立APP也生效）
    const appContainers = [
      '.chat-app-container',
      '.character-app-container', 
      '.beauty-app-container',
      '.settings-app-container',
      '.app-item',
      '.widget-container',
      '.page-content',
      'body *'
    ];
    
    appContainers.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // 只对未设置特殊字体的元素应用（避免覆盖图标字体等）
        const currentFont = window.getComputedStyle(el).fontFamily;
        if (!currentFont.includes('Material') && !currentFont.includes('Icon')) {
          el.style.fontFamily = fontFamily;
        }
      });
    });
    
    // 4. 保存到localStorage，页面刷新后自动恢复
    localStorage.setItem('asher_active_font_id', fontId);
    localStorage.setItem('asher_active_font_family', fontFamily);
    
    alert(`字体「${font.name}」已应用到全局`);
  };
};
window.deleteFont = async function(fontId) {
  if (!confirm('ȷ��ɾ壁纸���壿')) return;
  
  const transaction = fontDB.transaction(['fonts'], 'readwrite');
  const store = transaction.objectStore('fonts');
  store.delete(fontId);
  
  transaction.oncomplete = () => {
    // 壁纸�Զ壁纸¼�֪ͨ�ڲ壁纸¼���
    document.dispatchEvent(new CustomEvent('fontDeleted'));
    alert('壁纸��删除');
  };
};


// ==================== 壁纸ɫ��全局�л�ϵͳ ====================
// 6壁纸��ɫϵ壁纸
const THEME_PRESETS = {
  mono: {
    name: '壁纸ڰ�',
    bg: '#ffffff',
    accent: '#1a1a1a',
    text: '#1a1a1a',
    textSecondary: '#666666',
    border: '#e0e0e0',
    iconFill: '#ffffff'  // SVG图标�ɫ
  },
  silver: {
    name: '屏幕调整',
    bg: '#f5f5f5',
    accent: '#8a8a8a',
    text: '#2a2a2a',
    textSecondary: '#6a6a6a',
    border: '#d0d0d0',
    iconFill: '#ffffff'  // SVG图标�ɫ
  },
  cherry: {
    name: 'ӣ壁纸',
    bg: '#efe4e9',
    accent: '#bdbbbf',
    text: '#1a1a1a',
    textSecondary: '#706c74',
    border: '#d9d7db',
    iconFill: '#3a383b'  // SVGͼ壁纸ɫ
  },
  earth: {
    name: '���ů��',
    bg: '#e7dcd9',
    accent: '#ccd6e6',
    text: '#2a282d',
    textSecondary: '#6a676d',
    border: '#d7ccc9',
    iconFill: '#3a383b'  // SVGͼ壁纸ɫ
  },
  pearl: {
    name: '壁纸�',
    bg: '#f6f6f4',
    accent: '#d4d4d2',
    text: '#1a1a1a',
    textSecondary: '#5a5a5a',
    border: '#e6e6e4',
    iconFill: '#3a383b'  // SVGͼ壁纸ɫ
  },
  lavender: {
    name: '޹�²�',
    bg: '#e6e1ec',
    accent: '#b8b0c5',
    text: '#2a282d',
    textSecondary: '#6a676d',
    border: '#d6d1dc',
    iconFill: '#3a383b'  // SVGͼ壁纸ɫ
  }
};

// Ӧ壁纸�⵽全局
function applyTheme(themeKey) {
  const theme = THEME_PRESETS[themeKey];
  if (!theme) return;
  
  const root = document.documentElement;
  
  // ע�� CSS 壁纸�� :root
  root.style.setProperty('--color-bg-primary', theme.bg);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-text-primary', theme.text);
  root.style.setProperty('--color-text-secondary', theme.textSecondary);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-icon-fill', theme.iconFill);  // SVGͼ壁纸ɫ
  
  // ǿ壁纸��Ӧ��CSS屏幕调整屏幕调整ػ棩
  document.documentElement.style.cssText += '';
  
  // 屏幕调整Ļ壁纸
  const screenContainer = document.getElementById('screen-container');
  const body = document.body;
  if (screenContainer) {
    screenContainer.style.background = theme.bg;
  }
  
  // 壁纸 body 壁纸
  if (body) {
    body.style.background = theme.bg;
  }
  
  // ǿ��ˢ壁纸��ʹ��CSS壁纸��Ԫ��
  const allApps = document.querySelectorAll('.beauty-app-container, #settings-app, .app-container');
  allApps.forEach(app => {
    if (app) {
      app.style.background = theme.bg;
    }
  });
  
  // ǿ�Ƹ壁纸��ж壁纸�ҳ�汳壁纸API���á���Ļ壁纸�ȣ�
  const allSubpages = document.querySelectorAll('.settings-subpage, .beauty-subpage, #api-subpage, #voice-subpage, #reading-subpage, #bsub-screen, #bsub-desktop, #bsub-font, #bsub-theme');
  allSubpages.forEach(subpage => {
    if (subpage) {
      subpage.style.background = theme.bg;
    }
  });
  
  // ǿ屏幕调整Ⱦ���ж���
  const allNavBars = document.querySelectorAll('.beauty-nav-bar, .settings-nav-bar, .subpage-nav-bar');
  allNavBars.forEach(nav => {
    if (nav) {
      // 壁纸�ػ�
      nav.style.display = 'none';
      nav.offsetHeight; // ǿ屏幕调整��¼���
      nav.style.display = '';
    }
  });
  
  // ǿ��ˢ壁纸�а�ť��图标׿屏幕调整��¶�ȡCSS壁纸��
  const allButtons = document.querySelectorAll('.api-btn-pill, .subpage-primary-btn, button');
  allButtons.forEach(btn => {
    if (btn) {
      btn.style.display = 'none';
      btn.offsetHeight;
      btn.style.display = '';
    }
  });
  
  const allIconBoxes = document.querySelectorAll('.cell-icon-box');
  allIconBoxes.forEach(box => {
    if (box) {
      box.style.display = 'none';
      box.offsetHeight;
      box.style.display = '';
      // ǿ��ˢ���ڲ�SVG图标
      const svg = box.querySelector('svg');
      if (svg) {
        svg.style.display = 'none';
        svg.offsetHeight;
        svg.style.display = '';
      }
    }
  });
  
  // ���µ�ǰԤ壁纸
  const bgSwatch = document.getElementById('current-bg-swatch');
  const bgHex = document.getElementById('current-bg-hex');
  const accentSwatch = document.getElementById('current-accent-swatch');
  const accentHex = document.getElementById('current-accent-hex');
  
  if (bgSwatch) bgSwatch.style.background = theme.bg;
  if (bgHex) bgHex.textContent = theme.bg;
  if (accentSwatch) accentSwatch.style.background = theme.accent;
  if (accentHex) accentHex.textContent = theme.accent;
  
  // �־û��� localStorage
  localStorage.setItem('asher_active_theme', themeKey);
  
  // ���¼���״̬
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.remove('active');
    if (card.dataset.theme === themeKey) {
      card.classList.add('active');
    }
  });
  
  // console.log removed;
}
