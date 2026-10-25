/**
 * Asher phone - Settings Controller
 * 独立设置 APP、顶部极简兔子头像、半屏 INS 模型选择器、自定义分类标签与持久化预设库
 */
document.addEventListener('DOMContentLoaded', () => {
  const settingsApp = document.getElementById('settings-app');
  const backBtn = document.getElementById('settings-back-btn');
  const profileCard = document.getElementById('settings-profile-card');
  const avatarImg = document.getElementById('settings-avatar-img');
  const defaultSvg = document.getElementById('profile-default-svg');
  const nameText = document.getElementById('settings-name-display');
  const bioText = document.getElementById('settings-bio-display');
  const insToast = document.getElementById('ins-toast');

  // API 二级子页面节点
  const apiSubpage = document.getElementById('api-subpage');
  const apiBackBtn = document.getElementById('api-back-btn');
  const apiNameInput = document.getElementById('api-name-input');
  const apiUrlInput = document.getElementById('api-url-input');
  const apiKeyInput = document.getElementById('api-key-input');
  const apiFetchModelsBtn = document.getElementById('api-fetch-models-btn');
  const apiModelTriggerBtn = document.getElementById('api-model-trigger-btn');
  const apiModelTriggerText = document.getElementById('api-model-trigger-text');
  const apiModelCustomInput = document.getElementById('api-model-custom-input');
  const apiTagInput = document.getElementById('api-tag-input');
  const apiTagQuickWrap = document.getElementById('api-tag-quick-wrap');
  const presetFilterBar = document.getElementById('preset-filter-bar');
  const apiTestBtn = document.getElementById('api-test-btn');
  const apiTestResult = document.getElementById('api-test-result');
  const apiTempSlider = document.getElementById('api-temp-slider');
  const apiTempDisplay = document.getElementById('api-temp-display');
  const apiSaveBtn = document.getElementById('api-save-btn');
  const apiPresetsContainer = document.getElementById('api-presets-container');

  // 半屏模型选择弹窗节点
  const modelSheetBackdrop = document.getElementById('model-sheet-backdrop');
  const sheetCloseBtn = document.getElementById('sheet-close-btn');
  const sheetSearchInput = document.getElementById('sheet-search-input');
  const sheetCatTabs = document.getElementById('sheet-cat-tabs');
  const sheetModelList = document.getElementById('sheet-model-list');
  const sheetModelCount = document.getElementById('sheet-model-count');

  let cachedFetchedModels = []; // 缓存从接口拉取的模型列表
  let currentSheetCat = 'ALL';
  let currentFilterPresetCat = 'ALL';

  const showToast = (msg) => {
    if (insToast) {
      insToast.textContent = msg;
      insToast.classList.add('show');
      setTimeout(() => insToast.classList.remove('show'), 2200);
    }
  };

  // ================= 1. 设置主页滑动与头像 =================
  const openSettings = () => settingsApp.classList.add('active');
  const closeSettings = () => settingsApp.classList.remove('active');

  if (backBtn) backBtn.addEventListener('click', closeSettings);

  const settingsAppItems = document.querySelectorAll('.app-item[data-app="settings"]');
  settingsAppItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      openSettings();
      if (navigator.vibrate) navigator.vibrate(10);
    });
  });

  // 读取已保存账号资料
  const loadProfile = async () => {
    if (typeof idbGet === 'function') {
      try {
        const saved = await idbGet('settings_profile');
        if (saved) {
          if (saved.avatar && avatarImg && defaultSvg) {
            avatarImg.src = saved.avatar;
            avatarImg.style.display = 'block';
            defaultSvg.style.display = 'none';
          }
          if (saved.name && nameText) nameText.textContent = saved.name;
          if (saved.bio && bioText) bioText.textContent = saved.bio;
        }
      } catch (e) {
        console.warn('读取设置资料失败:', e);
      }
    }
  };
  loadProfile();

  // 更换账号头像
  if (profileCard) {
    profileCard.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
          fileInput.remove();
          return;
        }
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target.result;
          avatarImg.src = base64;
          avatarImg.style.display = 'block';
          defaultSvg.style.display = 'none';

          if (typeof idbSet === 'function') {
            await idbSet('settings_profile', {
              avatar: base64,
              name: nameText ? nameText.textContent : 'Asher User',
              bio: bioText ? bioText.textContent : ''
            });
            showToast('✦ 账号头像已更新');
          }
          fileInput.remove();
        };
        reader.readAsDataURL(file);
      });
      fileInput.click();
    });
  }

  // ================= 2. API 设置二级页面管理 =================
  const openApiSubpage = () => {
    apiSubpage.classList.add('active');
    loadApiSettings();
  };
  const closeApiSubpage = () => apiSubpage.classList.remove('active');

   if (apiBackBtn) apiBackBtn.addEventListener('click', closeApiSubpage);

  // 绑定二级页面入口 (使用函数表达式提前安全调用)
  const settingCells = document.querySelectorAll('.settings-cell');
  settingCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const section = cell.getAttribute('data-section');
      if (section === 'api') {
        openApiSubpage();
      } else if (section === 'voice') {
        const vSub = document.getElementById('voice-subpage');
        if (vSub) {
          vSub.classList.add('active');
          if (typeof loadVoiceSettings === 'function') {
            loadVoiceSettings();
          }
        }
      } else {
        const title = cell.querySelector('.cell-title')?.textContent || section;
        showToast(`进入: ${title}`);
      }
      if (navigator.vibrate) navigator.vibrate(10);
    });
  });

  // 温度滑块数值联动
  if (apiTempSlider && apiTempDisplay) {
    apiTempSlider.addEventListener('input', (e) => {
      apiTempDisplay.textContent = parseFloat(e.target.value).toFixed(2);
    });
  }

  // 模型分类判断辅助
  const detectCategory = (modelId) => {
    const id = (modelId || '').toLowerCase();
    if (id.includes('claude')) return 'Claude';
    if (id.includes('gemini')) return 'Gemini';
    if (id.includes('grok')) return 'Grok';
    if (id.includes('deepseek')) return 'DeepSeek';
    if (id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('dall-e')) return 'OpenAI';
    if (id.includes('qwen')) return 'Qwen';
    return 'Others';
  };

  // ================= 3. 半屏 INS 模型选择 Sheet =================
  const openModelSheet = () => {
    if (modelSheetBackdrop) {
      modelSheetBackdrop.classList.add('active');
      renderSheetModelList();
    }
  };
  const closeModelSheet = () => {
    if (modelSheetBackdrop) modelSheetBackdrop.classList.remove('active');
  };

  if (apiModelTriggerBtn) apiModelTriggerBtn.addEventListener('click', openModelSheet);
  if (sheetCloseBtn) sheetCloseBtn.addEventListener('click', closeModelSheet);
  if (modelSheetBackdrop) {
    modelSheetBackdrop.addEventListener('click', (e) => {
      if (e.target === modelSheetBackdrop) closeModelSheet();
    });
  }

  // 渲染 Sheet 模型列表
  const renderSheetModelList = () => {
    if (!sheetModelList) return;
    sheetModelList.innerHTML = '';

    if (!cachedFetchedModels.length) {
      sheetModelList.innerHTML = '<div class="sheet-empty-hint">请先在上方点击“拉取模型”获取接口列表</div>';
      if (sheetModelCount) sheetModelCount.textContent = '0 MODELS AVAILABLE';
      return;
    }

    const keyword = (sheetSearchInput?.value || '').trim().toLowerCase();
    const filtered = cachedFetchedModels.filter(item => {
      const catMatch = (currentSheetCat === 'ALL') || (item.cat === currentSheetCat);
      const kwMatch = !keyword || item.id.toLowerCase().includes(keyword);
      return catMatch && kwMatch;
    });

    if (sheetModelCount) {
      sheetModelCount.textContent = `${filtered.length} MODELS (${currentSheetCat})`;
    }

    if (!filtered.length) {
      sheetModelList.innerHTML = '<div class="sheet-empty-hint">未找到匹配的模型</div>';
      return;
    }

    const currentSelected = apiModelCustomInput.value.trim();

    filtered.forEach(m => {
      const itemEl = document.createElement('div');
      const isSel = (m.id === currentSelected);
      itemEl.className = `sheet-model-item ${isSel ? 'selected' : ''}`;
      itemEl.innerHTML = `
        <span class="sheet-item-name">${m.id}</span>
        <span class="sheet-item-tag">${m.cat}</span>
      `;

      itemEl.addEventListener('click', () => {
        apiModelCustomInput.value = m.id;
        if (apiModelTriggerText) apiModelTriggerText.textContent = m.id;
        // 如果自定义分类为空，自动填入
        if (apiTagInput && !apiTagInput.value.trim()) {
          apiTagInput.value = m.cat;
        }
        closeModelSheet();
        showToast(`已选: ${m.id}`);
      });

      sheetModelList.appendChild(itemEl);
    });
  };

  // 搜索与分类切换
  if (sheetSearchInput) {
    sheetSearchInput.addEventListener('input', renderSheetModelList);
  }
  if (sheetCatTabs) {
    sheetCatTabs.querySelectorAll('.sheet-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        sheetCatTabs.querySelectorAll('.sheet-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentSheetCat = pill.getAttribute('data-cat');
        renderSheetModelList();
      });
    });
  }

  // 3.1 拉取模型接口 (/v1/models)
  if (apiFetchModelsBtn) {
    apiFetchModelsBtn.addEventListener('click', async () => {
      const url = apiUrlInput.value.trim().replace(/\/+$/, '');
      const key = apiKeyInput.value.trim();

      if (!url) {
        showToast('请先输入 API 接口地址');
        return;
      }

      apiFetchModelsBtn.disabled = true;
      apiFetchModelsBtn.style.opacity = '0.6';
      showToast('正在从接口拉取模型...');

      try {
        const endpoint = `${url}/models`;
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${key}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const rawList = (data.data || data).map(m => m.id || m.name || m).filter(Boolean);

        if (!rawList.length) throw new Error('未获取到模型列表');

        cachedFetchedModels = rawList.map(id => ({
          id: id,
          cat: detectCategory(id)
        }));

        showToast(`✦ 成功拉取 ${cachedFetchedModels.length} 个模型`);
        if (apiModelTriggerText) {
          apiModelTriggerText.textContent = `已获取 ${cachedFetchedModels.length} 个模型 (点击选择)`;
        }
        openModelSheet();
      } catch (err) {
        console.error('拉取模型失败:', err);
        showToast(`拉取失败: ${err.message}`);
      } finally {
        apiFetchModelsBtn.disabled = false;
        apiFetchModelsBtn.style.opacity = '1';
      }
    });
  }

    // 3.2 联通性测试 (智能修复路径重复、放宽超时阈值至 30 秒)
  if (apiTestBtn) {
    apiTestBtn.addEventListener('click', async () => {
      let rawUrl = apiUrlInput.value.trim().replace(/\/+$/, '');
      const key = apiKeyInput.value.trim();
      const model = (apiModelCustomInput ? apiModelCustomInput.value.trim() : '');

      if (!rawUrl || !model) {
        showToast('请完整填写 URL 与模型名称');
        return;
      }

      // 智能纠错：防止路径多写或漏写 /v1
      let endpoint = rawUrl;
      if (endpoint.endsWith('/chat/completions')) {
        // 用户已经填到了最后路径
      } else if (endpoint.endsWith('/v1')) {
        endpoint = `${endpoint}/chat/completions`;
      } else {
        endpoint = `${endpoint}/v1/chat/completions`;
      }

      apiTestResult.textContent = '测试中...';
      apiTestResult.className = 'api-test-badge';
      apiTestBtn.disabled = true;

      try {
        const controller = new AbortController();
        // 关键改动：很多转发站冷启动或首字回复较慢，由原先短命的 12 秒提升至 30 秒
        const timer = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 16,
            stream: false
          }),
          signal: controller.signal
        });

        clearTimeout(timer);

        if (res.ok) {
          apiTestResult.textContent = '联通正常 (200 OK)';
          apiTestResult.className = 'api-test-badge success';
          showToast('✦ 接口与模型联通测试通过！');
        } else {
          let errDetail = `${res.status} 错误`;
          try {
            const errJson = await res.json();
            if (errJson && errJson.error && errJson.error.message) {
              errDetail = `${res.status}: ${errJson.error.message.substring(0, 20)}...`;
            }
          } catch (e) {
            if (res.status === 401) errDetail = '401 Key无效/未授权';
            if (res.status === 404) errDetail = '404 模型未找到或路径错误';
            if (res.status === 403) errDetail = '403 权限拒绝或被拦截';
            if (res.status === 429) errDetail = '429 额度不足/超频';
            if (res.status === 504) errDetail = '504 上游网关超时';
          }
          apiTestResult.textContent = errDetail;
          apiTestResult.className = 'api-test-badge error';
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          apiTestResult.textContent = '响应超时 (30s+ 请检查网络)';
        } else {
          apiTestResult.textContent = '跨域拦截/网络异常';
        }
        apiTestResult.className = 'api-test-badge error';
      } finally {
        apiTestBtn.disabled = false;
      }
    });
  }

  // ================= 4. 分类标签与预设管理 =================
  // 刷新历史标签胶囊
  const refreshTagQuickWrap = (presets) => {
    if (!apiTagQuickWrap) return;
    apiTagQuickWrap.innerHTML = '';

    const tagSet = new Set(['Claude', 'Gemini', 'OpenAI', 'Grok', 'DeepSeek']);
    presets.forEach(p => {
      if (p.category) tagSet.add(p.category);
    });

    tagSet.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = `api-tag-quick-item ${apiTagInput && apiTagInput.value.trim().toLowerCase() === tag.toLowerCase() ? 'active' : ''}`;
      chip.textContent = tag;
      chip.addEventListener('click', () => {
        if (apiTagInput) apiTagInput.value = tag;
        apiTagQuickWrap.querySelectorAll('.api-tag-quick-item').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
      apiTagQuickWrap.appendChild(chip);
    });
  };

  // 渲染预设分类过滤栏
  const refreshPresetFilterBar = (presets) => {
    if (!presetFilterBar) return;
    presetFilterBar.innerHTML = '';

    const categories = new Set();
    presets.forEach(p => {
      if (p.category) categories.add(p.category);
    });

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `filter-tab ${currentFilterPresetCat === 'ALL' ? 'active' : ''}`;
    allBtn.textContent = `全部 (${presets.length})`;
    allBtn.addEventListener('click', () => {
      currentFilterPresetCat = 'ALL';
      renderPresets();
    });
    presetFilterBar.appendChild(allBtn);

    categories.forEach(cat => {
      const count = presets.filter(p => p.category === cat).length;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `filter-tab ${currentFilterPresetCat === cat ? 'active' : ''}`;
      tab.textContent = `${cat} (${count})`;
      tab.addEventListener('click', () => {
        currentFilterPresetCat = cat;
        renderPresets();
      });
      presetFilterBar.appendChild(tab);
    });
  };

  // 渲染所有预设列表
  const renderPresets = async () => {
    if (!apiPresetsContainer || typeof idbGet !== 'function') return;
    const presets = (await idbGet('api_presets')) || [];
    const activeId = await idbGet('active_api_preset_id');

    refreshTagQuickWrap(presets);
    refreshPresetFilterBar(presets);

    apiPresetsContainer.innerHTML = '';
    const displayList = (currentFilterPresetCat === 'ALL')
      ? presets
      : presets.filter(p => p.category === currentFilterPresetCat);

    if (!displayList.length) {
      apiPresetsContainer.innerHTML = '<div style="text-align:center;font-size:11px;color:#999;padding:16px;">该分类下暂无保存的预设</div>';
      return;
    }

    displayList.forEach(item => {
      const card = document.createElement('div');
      const isActive = item.id === activeId;
      card.className = `preset-card-item ${isActive ? 'active-preset' : ''}`;

      card.innerHTML = `
        <div class="preset-main-info">
          <div class="preset-name-row">
            <span class="preset-name">${item.name}</span>
            <span class="sheet-item-tag" style="margin-left:6px;">${item.category || 'General'}</span>
            ${isActive ? '<span class="preset-active-tag">生效中</span>' : ''}
          </div>
          <div class="preset-details">${item.model} · Temp ${parseFloat(item.temperature).toFixed(2)}</div>
        </div>
        <div class="preset-actions">
          <button class="preset-del-btn" title="删除预设">✕</button>
        </div>
      `;

      // 点击载入此预设
      card.querySelector('.preset-main-info').addEventListener('click', async () => {
        apiNameInput.value = item.name;
        apiUrlInput.value = item.url;
        apiKeyInput.value = item.key;
        apiModelCustomInput.value = item.model;
        if (apiModelTriggerText) apiModelTriggerText.textContent = item.model;
        if (apiTagInput) apiTagInput.value = item.category || '';
        apiTempSlider.value = item.temperature;
        apiTempDisplay.textContent = parseFloat(item.temperature).toFixed(2);
        apiTestResult.textContent = '已载入配置';
        apiTestResult.className = 'api-test-badge';

        await idbSet('active_api_preset_id', item.id);
        renderPresets();
        showToast(`已切换至: ${item.name}`);
      });

      // 删除预设
      card.querySelector('.preset-del-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const nextPresets = presets.filter(p => p.id !== item.id);
        await idbSet('api_presets', nextPresets);
        if (activeId === item.id) {
          await idbSet('active_api_preset_id', nextPresets.length ? nextPresets[0].id : null);
        }
        renderPresets();
        showToast('预设已删除');
      });

      apiPresetsContainer.appendChild(card);
    });
  };

  // 读取与载入已激活的预设
  const loadApiSettings = async () => {
    if (typeof idbGet !== 'function') return;
    try {
      const presets = (await idbGet('api_presets')) || [];
      const activeId = await idbGet('active_api_preset_id');

      if (activeId && presets.length) {
        const cur = presets.find(p => p.id === activeId) || presets[0];
        apiNameInput.value = cur.name || '';
        apiUrlInput.value = cur.url || '';
        apiKeyInput.value = cur.key || '';
        apiModelCustomInput.value = cur.model || '';
        if (apiModelTriggerText) apiModelTriggerText.textContent = cur.model || '点击选择分类模型';
        if (apiTagInput) apiTagInput.value = cur.category || '';
        apiTempSlider.value = cur.temperature !== undefined ? cur.temperature : 0.7;
        apiTempDisplay.textContent = parseFloat(apiTempSlider.value).toFixed(2);
      }
      renderPresets();
    } catch (e) {
      console.warn('加载 API 预设失败:', e);
    }
  };

  // 4.1 保存并另存为新预设
  if (apiSaveBtn) {
    apiSaveBtn.addEventListener('click', async () => {
      const name = apiNameInput.value.trim() || '未命名预设';
      const url = apiUrlInput.value.trim();
      const key = apiKeyInput.value.trim();
      const model = apiModelCustomInput.value.trim();
      const temperature = parseFloat(apiTempSlider.value);
      const customCat = (apiTagInput ? apiTagInput.value.trim() : '') || detectCategory(model);

      if (!url || !model) {
        showToast('请至少填写 API 地址和模型名称');
        return;
      }

      const newPreset = {
        id: 'preset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name,
        url: url,
        key: key,
        model: model,
        temperature: temperature,
        category: customCat,
        createTime: Date.now()
      };

      try {
        const presets = (await idbGet('api_presets')) || [];
        presets.unshift(newPreset);
        await idbSet('api_presets', presets);
        await idbSet('active_api_preset_id', newPreset.id);

        currentFilterPresetCat = 'ALL';
        renderPresets();
        showToast(`✦ 已存入 [${customCat}] 分类预设`);
      } catch (err) {
        console.error('保存失败:', err);
        showToast('保存失败，请检查数据库');
      }
    });
  }

    // ==========================================================================
  // 3. 语音设置 (Voice Settings) 控制器 & Web Audio DSP 调音台
  // ==========================================================================
  const voiceSubpage = document.getElementById('voice-subpage');
  const voiceBackBtn = document.getElementById('voice-back-btn');

  const openVoiceSubpage = () => {
    if (voiceSubpage) {
      voiceSubpage.classList.add('active');
      loadVoiceSettings();
    }
  };
  const closeVoiceSubpage = () => {
    stopAudioPlayback();
    if (voiceSubpage) voiceSubpage.classList.remove('active');
  };

  if (voiceBackBtn) voiceBackBtn.addEventListener('click', closeVoiceSubpage);

  const engineTabs = document.querySelectorAll('.voice-engine-tab');
  const panelMinimax = document.getElementById('panel-minimax');
  const panelElevenlabs = document.getElementById('panel-elevenlabs');

  // MiniMax 字段
  const mmGroupId = document.getElementById('mm-group-id');
  const mmApiKey = document.getElementById('mm-api-key');
  const mmModel = document.getElementById('mm-model');
  const mmCustomVoice = document.getElementById('mm-custom-voice');
  const mmChips = document.querySelectorAll('#mm-preset-chips .preset-chip');

  // ElevenLabs 字段
  const elApiKey = document.getElementById('el-api-key');
  const elModel = document.getElementById('el-model');
  const elCustomVoice = document.getElementById('el-custom-voice');
  const elChips = document.querySelectorAll('#el-preset-chips .preset-chip');

  // 调音台控件
  const voicePreviewText = document.getElementById('voice-preview-text');
  const btnRandomPhrase = document.getElementById('btn-random-phrase');
  const voiceAudioStatus = document.getElementById('voice-audio-status');
  const btnVoicePreview = document.getElementById('btn-voice-preview');
  const previewBtnText = document.getElementById('preview-btn-text');
  const btnTunerReset = document.getElementById('btn-tuner-reset');
  const voiceSaveBtn = document.getElementById('voice-save-btn');

  const sliderSpeed = document.getElementById('slider-speed');
  const valSpeed = document.getElementById('val-speed');
  const sliderPitch = document.getElementById('slider-pitch');
  const valPitch = document.getElementById('val-pitch');
  const sliderAir = document.getElementById('slider-air');
  const valAir = document.getElementById('val-air');
  const sliderReverb = document.getElementById('slider-reverb');
  const valReverb = document.getElementById('val-reverb');

  let currentEngine = 'minimax';
  let audioCtx = null;
  let currentSourceNode = null;
  let currentGainNode = null;
  let currentAirFilter = null;
  let currentReverbNode = null;
  let cachedRawAudioBuffer = null;

  const samplePhrases = [
    '碎月沉入静海，长耳倾听星云。',
    '你好 Asher，今天也是充满灵感与温柔的一天。',
    '所有等待，都将在此刻化为轻柔的音符。',
    '星轨交错之间，我始终在这里聆听你的声音。'
  ];

  // 引擎 Tab 切换
  engineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      engineTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentEngine = tab.dataset.engine;

      if (currentEngine === 'minimax') {
        if (panelMinimax) panelMinimax.classList.add('active');
        if (panelElevenlabs) panelElevenlabs.classList.remove('active');
      } else {
        if (panelMinimax) panelMinimax.classList.remove('active');
        if (panelElevenlabs) panelElevenlabs.classList.add('active');
      }
    });
  });

  // 音色预设胶囊快捷填充
  const bindChips = (chips, targetInput) => {
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (targetInput) targetInput.value = chip.dataset.voice;
      });
    });
  };
  bindChips(mmChips, mmCustomVoice);
  bindChips(elChips, elCustomVoice);

  if (btnRandomPhrase && voicePreviewText) {
    btnRandomPhrase.addEventListener('click', () => {
      const nextPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      voicePreviewText.value = nextPhrase;
    });
  }

  // 调音台滑块实时响应 (支持在播放时无缝实时变音变质感)
  if (sliderSpeed && valSpeed) {
    sliderSpeed.addEventListener('input', () => {
      valSpeed.textContent = `${Number(sliderSpeed.value).toFixed(2)}x`;
      if (currentSourceNode) currentSourceNode.playbackRate.value = parseFloat(sliderSpeed.value);
    });
  }

  if (sliderPitch && valPitch) {
    sliderPitch.addEventListener('input', () => {
      const val = parseFloat(sliderPitch.value);
      valPitch.textContent = `${val >= 0 ? '+' : ''}${val} st`;
      if (currentSourceNode && currentSourceNode.detune) {
        currentSourceNode.detune.value = val * 100;
      }
    });
  }

  if (sliderAir && valAir) {
    sliderAir.addEventListener('input', () => {
      const val = parseFloat(sliderAir.value);
      valAir.textContent = `${val >= 0 ? '+' : ''}${val} dB`;
      if (currentAirFilter) currentAirFilter.gain.value = val;
    });
  }

  if (sliderReverb && valReverb) {
    sliderReverb.addEventListener('input', () => {
      valReverb.textContent = `${sliderReverb.value}%`;
      if (currentReverbNode) currentReverbNode.gain.value = parseFloat(sliderReverb.value) / 100;
    });
  }

  if (btnTunerReset) {
    btnTunerReset.addEventListener('click', () => {
      if (sliderSpeed) sliderSpeed.value = 1.0;
      if (valSpeed) valSpeed.textContent = '1.0x';
      if (sliderPitch) sliderPitch.value = 0;
      if (valPitch) valPitch.textContent = '0 st';
      if (sliderAir) sliderAir.value = 2;
      if (valAir) valAir.textContent = '+2 dB';
      if (sliderReverb) sliderReverb.value = 15;
      if (valReverb) valReverb.textContent = '15%';

      if (currentSourceNode) {
        currentSourceNode.playbackRate.value = 1.0;
        if (currentSourceNode.detune) currentSourceNode.detune.value = 0;
      }
      if (currentAirFilter) currentAirFilter.gain.value = 2;
      if (currentReverbNode) currentReverbNode.gain.value = 0.15;
    });
  }

  // Web Audio 实时 DSP 音效管线
  const initAudioCtx = () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };

  const createReverbBuffer = (ctx) => {
    const rate = ctx.sampleRate;
    const length = rate * 1.5;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-i / (rate * 0.4));
        channel[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    return impulse;
  };

  const stopAudioPlayback = () => {
    if (currentSourceNode) {
      try { currentSourceNode.stop(); } catch (e) {}
      currentSourceNode.disconnect();
      currentSourceNode = null;
    }
    if (voiceAudioStatus) {
      voiceAudioStatus.textContent = 'STANDBY';
      voiceAudioStatus.className = 'tuner-status-badge';
    }
    if (previewBtnText) previewBtnText.textContent = '试听渲染声音';
  };

  const playTunedAudio = (audioBuffer) => {
    initAudioCtx();
    stopAudioPlayback();

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;

    source.playbackRate.value = sliderSpeed ? parseFloat(sliderSpeed.value) : 1.0;
    if (source.detune && sliderPitch) {
      source.detune.value = parseFloat(sliderPitch.value) * 100;
    }

    const airFilter = audioCtx.createBiquadFilter();
    airFilter.type = 'highshelf';
    airFilter.frequency.value = 7500;
    airFilter.gain.value = sliderAir ? parseFloat(sliderAir.value) : 2;
    currentAirFilter = airFilter;

    const convolver = audioCtx.createConvolver();
    convolver.buffer = createReverbBuffer(audioCtx);
    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = sliderReverb ? parseFloat(sliderReverb.value) / 100 : 0.15;
    currentReverbNode = reverbGain;

    const mainGain = audioCtx.createGain();
    mainGain.gain.value = 0.9;
    currentGainNode = mainGain;

    // 连接管线
    source.connect(airFilter);
    airFilter.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    airFilter.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(audioCtx.destination);

    currentSourceNode = source;

    if (voiceAudioStatus) {
      voiceAudioStatus.textContent = 'PLAYING';
      voiceAudioStatus.className = 'tuner-status-badge playing';
    }
    if (previewBtnText) previewBtnText.textContent = '停止播放';

    source.onended = () => stopAudioPlayback();
    source.start(0);
  };

  // 本地仿真人声发音器（保证无网络或 Key 没填时也能秒级试听调音）
  const generateMockAcousticBuffer = async () => {
    initAudioCtx();
    const rate = audioCtx.sampleRate;
    const duration = 2.4;
    const buffer = audioCtx.createBuffer(1, rate * duration, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < rate * duration; i++) {
      const t = i / rate;
      const baseFreq = 260;
      const envelope = Math.sin((t / duration) * Math.PI);
      const fundamental = Math.sin(2 * Math.PI * baseFreq * t);
      const harmonic1 = 0.35 * Math.sin(2 * Math.PI * (baseFreq * 2) * t);
      const harmonic2 = 0.15 * Math.sin(2 * Math.PI * (baseFreq * 3) * t);
      data[i] = (fundamental + harmonic1 + harmonic2) * envelope * 0.3;
    }
    return buffer;
  };

  if (btnVoicePreview) {
    btnVoicePreview.addEventListener('click', async () => {
      if (currentSourceNode) {
        stopAudioPlayback();
        return;
      }

      const text = voicePreviewText ? voicePreviewText.value.trim() : '你好 Asher';
      if (voiceAudioStatus) {
        voiceAudioStatus.textContent = 'RENDERING';
        voiceAudioStatus.className = 'tuner-status-badge';
      }
      if (previewBtnText) previewBtnText.textContent = '生成中...';

      initAudioCtx();

      try {
        let arrayBuffer = null;

        if (currentEngine === 'elevenlabs') {
          const apiKey = elApiKey ? elApiKey.value.trim() : '';
          const voiceId = (elCustomVoice && elCustomVoice.value.trim()) || '21m00Tcm4TlvDq8ikWAM';
          const modelId = (elModel && elModel.value.trim()) || 'eleven_multilingual_v2';

          if (apiKey) {
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
              },
              body: JSON.stringify({
                text: text,
                model_id: modelId,
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
              })
            });
            if (!res.ok) throw new Error(`ElevenLabs 错误: ${res.status}`);
            arrayBuffer = await res.arrayBuffer();
          }
        } else if (currentEngine === 'minimax') {
          const groupId = mmGroupId ? mmGroupId.value.trim() : '';
          const apiKey = mmApiKey ? mmApiKey.value.trim() : '';
          const model = (mmModel && mmModel.value.trim()) || 'speech-01-turbo';
          const voiceId = (mmCustomVoice && mmCustomVoice.value.trim()) || 'female-shaonv';

          if (groupId && apiKey) {
            const res = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: model,
                text: text,
                stream: false,
                voice_setting: {
                  voice_id: voiceId,
                  speed: 1.0,
                  vol: 1.0,
                  pitch: 0
                }
              })
            });
            if (!res.ok) throw new Error(`MiniMax 错误: ${res.status}`);
            const json = await res.json();
            if (json.data && json.data.audio) {
              const hex = json.data.audio;
              const typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
              arrayBuffer = typedArray.buffer;
            }
          }
        }

        if (arrayBuffer) {
          cachedRawAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } else {
          cachedRawAudioBuffer = await generateMockAcousticBuffer();
        }

        playTunedAudio(cachedRawAudioBuffer);
      } catch (err) {
        console.warn('API 调用遇到问题，进入本地调音测试模式:', err);
        cachedRawAudioBuffer = await generateMockAcousticBuffer();
        playTunedAudio(cachedRawAudioBuffer);
      }
    });
  }

  // 保存与读取语音参数
  const saveVoiceSettings = async () => {
    const config = {
      engine: currentEngine,
      minimax: {
        groupId: mmGroupId ? mmGroupId.value.trim() : '',
        apiKey: mmApiKey ? mmApiKey.value.trim() : '',
        model: mmModel ? mmModel.value.trim() : '',
        voiceId: mmCustomVoice ? mmCustomVoice.value.trim() : ''
      },
      elevenlabs: {
        apiKey: elApiKey ? elApiKey.value.trim() : '',
        model: elModel ? elModel.value.trim() : '',
        voiceId: elCustomVoice ? elCustomVoice.value.trim() : ''
      },
      tuner: {
        speed: sliderSpeed ? parseFloat(sliderSpeed.value) : 1.0,
        pitch: sliderPitch ? parseFloat(sliderPitch.value) : 0,
        air: sliderAir ? parseFloat(sliderAir.value) : 2,
        reverb: sliderReverb ? parseFloat(sliderReverb.value) : 15
      },
      updatedAt: Date.now()
    };

    if (typeof idbSet === 'function') {
      await idbSet('voice_config', config);
    } else {
      localStorage.setItem('asher_voice_config', JSON.stringify(config));
    }
    showToast('✦ 音色与调音参数已保存');
  };

  const loadVoiceSettings = async () => {
    let saved = null;
    if (typeof idbGet === 'function') {
      saved = await idbGet('voice_config');
    }
    if (!saved) {
      const local = localStorage.getItem('asher_voice_config');
      if (local) {
        try { saved = JSON.parse(local); } catch(e) {}
      }
    }

    if (saved) {
      if (saved.engine) {
        currentEngine = saved.engine;
        const targetTab = document.querySelector(`.voice-engine-tab[data-engine="${currentEngine}"]`);
        if (targetTab) targetTab.click();
      }
      if (saved.minimax) {
        if (mmGroupId) mmGroupId.value = saved.minimax.groupId || '';
        if (mmApiKey) mmApiKey.value = saved.minimax.apiKey || '';
        if (mmModel && saved.minimax.model) mmModel.value = saved.minimax.model;
        if (mmCustomVoice && saved.minimax.voiceId) mmCustomVoice.value = saved.minimax.voiceId;
      }
      if (saved.elevenlabs) {
        if (elApiKey) elApiKey.value = saved.elevenlabs.apiKey || '';
        if (elModel && saved.elevenlabs.model) elModel.value = saved.elevenlabs.model;
        if (elCustomVoice && saved.elevenlabs.voiceId) elCustomVoice.value = saved.elevenlabs.voiceId;
      }
      if (saved.tuner) {
        if (sliderSpeed) {
          sliderSpeed.value = saved.tuner.speed || 1.0;
          if (valSpeed) valSpeed.textContent = `${sliderSpeed.value}x`;
        }
        if (sliderPitch) {
          sliderPitch.value = saved.tuner.pitch || 0;
          if (valPitch) valPitch.textContent = `${sliderPitch.value >= 0 ? '+' : ''}${sliderPitch.value} st`;
        }
        if (sliderAir) {
          sliderAir.value = saved.tuner.air !== undefined ? saved.tuner.air : 2;
          if (valAir) valAir.textContent = `+${sliderAir.value} dB`;
        }
        if (sliderReverb) {
          sliderReverb.value = saved.tuner.reverb !== undefined ? saved.tuner.reverb : 15;
          if (valReverb) valReverb.textContent = `${sliderReverb.value}%`;
        }
      }
    }
  };

  if (voiceSaveBtn) voiceSaveBtn.addEventListener('click', saveVoiceSettings);
});
