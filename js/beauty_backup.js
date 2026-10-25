/**
 * Asher phone - 缇庡寲 APP (Beauty Studio Controller)
 * 鏋舵瀯锛氬崱鐗囧垎缁勫垪琛?+ 鐙珛澶氱骇 Subpage 璺敱 + IndexedDB 寮傛楂樿川鎰熷瓨鍌? */
document.addEventListener('DOMContentLoaded', () => {
  const beautyApp = document.getElementById('beauty-app');
  const beautyBackBtn = document.getElementById('beauty-back-btn');
  const insToast = document.getElementById('ins-toast');

  const showToast = (msg) => {
    if (insToast) {
      insToast.textContent = msg;
      insToast.classList.add('show');
      setTimeout(() => insToast.classList.remove('show'), 2000);
    }
  };

  // ================= IndexedDB 寮傛楂樺閲忓绾镐笌鍥炬爣缂撳瓨搴?=================
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
      showToast('鉁?宸叉垚鍔熷瓨鍏ュ绾稿簱');
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
          showToast('宸插簲鐢ㄥ绾稿簱澹佺焊');
        });
        grid.appendChild(item);
      });
    };
  };

  // 1. 打开/关闭美化主容器
  const openBeautyApp = () => {
    console.log('openBeautyApp 被调用');
    console.log('beautyApp 元素:', beautyApp);
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
      console.log('美化图标被点击');
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

  // 2. 二级子页面路由
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

  // ================= 3. 灞忓箷璋冩暣涓庢护闀滄牳蹇冪绾?=================
  const screenContainer = document.getElementById('screen-container');
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

  if (sliderTemp) sliderTemp.addEventListener('input', () => { const v = parseInt(sliderTemp.value, 10); if (valTemp) valTemp.textContent = v > 0 ? `+${v} (鏆?` : v < 0 ? `${v} (鍐?` : '0'; applyScreenFilters(); });
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
      showToast(`婊ら暅棰勮: ${chip.textContent}`);
    });
  });

  if (btnScreenCenter) btnScreenCenter.addEventListener('click', () => { if (sliderOffsetX) sliderOffsetX.value = 0; if (sliderOffsetY) sliderOffsetY.value = 0; applyViewportTransform(); showToast('✓ 画面已居中'); });
  if (btnScreenReset) btnScreenReset.addEventListener('click', () => { if (sliderScale) sliderScale.value = 1.00; if (sliderOffsetX) sliderOffsetX.value = 0; if (sliderOffsetY) sliderOffsetY.value = 0; applyViewportTransform(); showToast('✓ 画面已复位'); });
  if (btnSaveScreen) btnSaveScreen.addEventListener('click', () => { saveBeautyConfig(); showToast('✓ 屏幕参数已保存'); });

  // ================= 4. 瀛愰〉闈?2: 妗岄潰缇庡寲銆佸绾镐笌鍏?APP 鍥炬爣鑷畾涔?=================
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
        shelf.innerHTML = '<div class="shelf-empty">澹佺焊搴撶┖绌哄涔燂紝涓婁紶澹佺焊鍚庣偣鍑?瀛樺叆澹佺焊搴?鍗冲彲鏀惰棌</div>';
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

  // ====== iOS 高级 INS 质感壁纸选择底栏 (ActionSheet) ======
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

  // 打开 Action Sheet
  const openActionSheet = () => {
    console.log('openActionSheet 被调用');
    console.log('wpActionSheet 元素:', wpActionSheet);
    if (wpActionSheet) {
      console.log('添加 active 类');
      wpActionSheet.classList.add('active');
      if (urlDialogCard) urlDialogCard.classList.remove('active');
      if (wpPanel) wpPanel.style.display = '';
      // 临时禁用美化容器的 overflow，允许 Action Sheet 滑出
      if (beautyApp) beautyApp.style.overflow = 'visible';
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  // 关闭整个浮层
  const closeActionSheet = () => {
    if (wpActionSheet) wpActionSheet.classList.remove('active');
    if (urlDialogCard) urlDialogCard.classList.remove('active');
    // 恢复美化容器的 overflow
    if (beautyApp) beautyApp.style.overflow = 'hidden';
  };

  if (btnUploadWallpaper) {
    btnUploadWallpaper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('点击了更换壁纸按钮');
      openActionSheet();
    });
  }
  if (wpScrim) wpScrim.addEventListener('click', closeActionSheet);
  if (btnAsCancel) btnAsCancel.addEventListener('click', closeActionSheet);

  // 统一壁纸图片载入处理
  const processWallpaperFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('请选择有效的图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const bgData = event.target.result;
      applyWallpaper(bgData);
      activeWallpaperData = bgData;
      localStorage.setItem('asher_custom_wallpaper', bgData);
      showToast('壁纸已实时应用预览');
    };
    reader.readAsDataURL(file);
    closeActionSheet();
  };

  // 1. 照片图库 (系统相册)
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

  // 2. 选取文件 (文件 App / 系统文件目录)
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

  // 3. 网络链接 (唤出自制微质感 URL 导入卡片，无丑陋原生弹窗)
  if (btnAsUrl && urlDialogCard) {
    btnAsUrl.addEventListener('click', () => {
      if (wpPanel) wpPanel.style.display = 'none'; // 隐藏底栏面板，突显居中输入框
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
        showToast('请输入有效的图片链接');
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
        showToast('链接必须以 http 或 https 开头');
        return;
      }

      showToast('正在载入网络壁纸...');
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('网络响应异常');
          return res.blob();
        })
        .then(blob => {
          if (!blob.type.startsWith('image/')) {
            // 如果不是严格的图片 MIME，依然尝试用 Image 标签校验
            console.warn('非严格图片 Blob，尝试直接应用');
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            const bgData = e.target.result;
            applyWallpaper(bgData);
            activeWallpaperData = bgData;
            localStorage.setItem('asher_custom_wallpaper', bgData);
            showToast('网络壁纸已成功导入');
            closeActionSheet();
          };
          reader.readAsDataURL(blob);
        })
        .catch(err => {
          console.error(err);
          // 若跨域拦截，直接回退为 URL 应用
          applyWallpaper(url);
          activeWallpaperData = url;
          localStorage.setItem('asher_custom_wallpaper', url);
          showToast('已直接应用图片链接');
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
      showToast('壁纸已恢复默认');
    });
  }

  // 图标尺寸与形状
  if (sliderIconSize) {
    sliderIconSize.addEventListener('input', () => {
      const size = sliderIconSize.value;
      if (valIconSize) valIconSize.textContent = `${size}px`;
      // 使用CSS变量全局控制图标尺寸
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
      showToast(`鍥炬爣褰㈢姸: ${btn.textContent}`);
    });
  });

  // 鍏?APP 鍥炬爣鑷畾涔夋寕杞戒笌鏇挎崲
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
      // 检查内存或存储中是否有自定义图标
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
              
              // 瀹炴椂搴旂敤鍒版闈笂瀵瑰簲鐨?APP 鍥炬爣
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

              // 瀛樺叆 IndexedDB
              if (db) {
                const tx = db.transaction('appIcons', 'readwrite');
                const store = tx.objectStore('appIcons');
                store.put({ appKey, dataUrl: iconData });
              }
              showToast(`APP [${appName}] 图标已更新`);
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
      showToast('✓ 桌面图标与壁纸设定已保存');
    });
  }
  const btnResetAllIcons = document.getElementById('btn-reset-all-icons');
  if (btnResetAllIcons) {
    btnResetAllIcons.addEventListener('click', async () => {
      await dbReady;
      if (!db) {
        showToast('数据库未就绪，请稍后重试');
        return;
      }
      const tx = db.transaction('appIcons', 'readwrite');
      tx.objectStore('appIcons').clear();
      tx.oncomplete = () => {
        document.querySelectorAll('.app-icon').forEach(icon => {
          icon.style.backgroundImage = '';
          icon.querySelectorAll('svg').forEach(svg => svg.style.display = '');
        });
        showToast('已恢复所有默认图标');
        renderAppIconCustomList();
      };
      tx.onerror = () => showToast('恢复失败，请重试');
    });
  }

  // ================= 5. 瀛愰〉闈?3 & 4: 瀛椾綋涓庝富棰樿壊璋?=================
  const fontCards = document.querySelectorAll('.font-option-card');
  const sliderFWeight = document.getElementById('slider-b-fweight');
  const sliderSpacing = document.getElementById('slider-b-spacing');
  const valSpacing = document.getElementById('val-b-spacing');
  const sliderLHeight = document.getElementById('slider-b-lheight');
  const valLHeight = document.getElementById('val-b-lheight');
  const btnSaveFont = document.getElementById('btn-save-font');
  let currentFontType = 'sans';

  const fontMap = {
    sans: "-apple-system, BlinkMacSystemFont, sans-serif",
    serif: "'Playfair Display', Georgia, serif",
    mono: "'Courier New', monospace",
    cursive: "'Caveat', cursive, sans-serif"
  };

  function applyTypography() {
    const family = fontMap[currentFontType] || fontMap.sans;
    const weight = sliderFWeight ? sliderFWeight.value : '400';
    const spacing = sliderSpacing ? `${sliderSpacing.value}px` : '0px';
    const height = sliderLHeight ? sliderLHeight.value : '1.4';

    document.documentElement.style.setProperty('--app-font-family', family);
    document.body.style.fontFamily = family;
    document.body.style.letterSpacing = spacing;
  };

  fontCards.forEach(card => {
    card.addEventListener('click', () => {
      fontCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentFontType = card.dataset.font;
      applyTypography();
    });
  });

  if (sliderFWeight) sliderFWeight.addEventListener('input', () => { if (valFWeight) valFWeight.textContent = sliderFWeight.value; applyTypography(); });
  if (sliderSpacing) sliderSpacing.addEventListener('input', () => { if (valSpacing) valSpacing.textContent = `${sliderSpacing.value}px`; applyTypography(); });
  if (sliderLHeight) sliderLHeight.addEventListener('input', () => { if (valLHeight) valLHeight.textContent = sliderLHeight.value; applyTypography(); });
  if (btnSaveFont) btnSaveFont.addEventListener('click', () => { saveBeautyConfig(); showToast('✓ 字体排版已保存'); });

  // 涓婚鑹茶皟
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
  if (btnSaveTheme) btnSaveTheme.addEventListener('click', () => { saveBeautyConfig(); showToast('✓ 主题色调已保存'); });

  // ================= 6. 鎸佷箙鍖栧瓨鍌ㄦ€荤嚎 =================
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
      fontType: currentFontType,
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

  loadSavedConfig();
});









// ================= 字体排版管理系统 =================
