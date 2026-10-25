/**
 * Asher phone - Core System & Touch Slider
 * 左右横滑页面切换、指示器联动与 APP 启动触感
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[app.js] DOMContentLoaded 已触发');
  
  const pagesWrapper = document.getElementById('pages-wrapper');
  const indicatorDots = document.querySelectorAll('.indicator-dot');
  let currentPage = 0;
  let startX = 0;
  let isDragging = false;

  // 切换页面函数
  const goToPage = (pageIndex) => {
    currentPage = Math.max(0, Math.min(1, pageIndex));
    if (pagesWrapper) {
      pagesWrapper.style.transform = `translateX(-${currentPage * 100}vw)`;
    }
    indicatorDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentPage);
    });
  };

  // 点击指示器直接切换
  indicatorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetPage = parseInt(dot.getAttribute('data-page'), 10);
      goToPage(targetPage);
    });
  });

  // 触摸滑动事件处理 (支持 iOS 丝滑阻尼感)
  const container = document.getElementById('screen-container');

  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (Math.abs(diff) > 40) {
      if (diff < 0 && currentPage === 0) {
        goToPage(1);
      } else if (diff > 0 && currentPage === 1) {
        goToPage(0);
      }
    }
  });

  // 模拟 APP 点击触感反馈 + 路由分发
  const appItems = document.querySelectorAll('.app-item');
  console.log(`[app.js] 找到 ${appItems.length} 个 APP 图标`);
  
  appItems.forEach((app, index) => {
    const appType = app.getAttribute('data-app');
    const appName = app.querySelector('.app-name')?.textContent || 'App';
    console.log(`[app.js] 绑定 APP #${index}: ${appName} (data-app="${appType}")`);
    
    app.addEventListener('click', () => {
      console.log(`[app.js] 点击了 APP: ${appName} (${appType})`);
      if (navigator.vibrate) navigator.vibrate(10);

      // 路由分发到具体 APP
      switch(appType) {
        case 'chat':
          console.log('[app.js] 准备打开 Chat APP');
          if (typeof window.openChatApp === 'function') {
            console.log('[app.js] 调用 window.openChatApp()');
            window.openChatApp();
          } else {
            console.error('[app.js] window.openChatApp 不存在！');
          }
          break;
        case 'settings':
          if (typeof window.openSettingsApp === 'function') {
            window.openSettingsApp();
          }
          break;
        case 'beauty':
          if (typeof window.openBeautyApp === 'function') {
            window.openBeautyApp();
          }
          break;
        // 未来添加其他 APP 路由
        default:
          console.log(`[app.js] ${appType} APP 尚未实现`);
      }
    });
  });
  
  console.log('[app.js] 初始化完成');
});
