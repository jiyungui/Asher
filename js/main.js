/**
 * Asher phone - 核心桌面滑屏与系统控制器 (main.js)
 * 功能：左右滑屏翻页、指示器小圆点点击切换、小组件防误触保护
 */
document.addEventListener('DOMContentLoaded', () => {
  const pagesWrapper = document.getElementById('pages-wrapper');
  const indicatorDots = document.querySelectorAll('.indicator-dot');
  const screenContainer = document.getElementById('screen-container');

  let currentPage = 0;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;
  let hasMoved = false;

  // 1. 核心翻页函数 (严格对齐 100vw，兼容所有移动端与PC视口)
  const goToPage = (pageIndex) => {
    currentPage = Math.max(0, Math.min(1, pageIndex));
    if (pagesWrapper) {
      pagesWrapper.style.transform = `translateX(-${currentPage * 100}vw)`;
    }
    indicatorDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentPage);
    });
  };

  // 2. 底部指示器小圆点点击/触摸直接切换页面
  indicatorDots.forEach(dot => {
    const handleDotClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetPage = parseInt(dot.getAttribute('data-page'), 10);
      goToPage(targetPage);
      if (navigator.vibrate) navigator.vibrate(10);
    };

    dot.addEventListener('click', handleDotClick);
    dot.addEventListener('touchend', handleDotClick);
  });

  // 3. 屏幕触摸滑动事件处理 (支持手势，同时保护小组件点击不被吞)
  if (screenContainer) {
    screenContainer.addEventListener('touchstart', (e) => {
      // 若美化APP或设置APP处于打开状态，不响应桌面横滑
      const beautyApp = document.getElementById('beauty-app');
      const settingsApp = document.getElementById('settings-app');
      if (beautyApp?.classList.contains('active') || settingsApp?.classList.contains('active')) {
        return;
      }

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      currentX = startX;
      isSwiping = true;
      hasMoved = false;
    }, { passive: true });

    screenContainer.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      // 只有横向滑动幅度大于 10px 且大于纵向时，才判定为横滑
      if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
        hasMoved = true;
      }
    }, { passive: true });

    screenContainer.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;

      // 仅在真实发生横滑手势时才执行翻页判断
      if (hasMoved) {
        const diffX = currentX - startX;
        if (diffX < -40 && currentPage === 0) {
          goToPage(1); // 划向第二页
        } else if (diffX > 40 && currentPage === 1) {
          goToPage(0); // 划回第一页
        } else {
          goToPage(currentPage); // 弹性复位
        }
      }
    }, { passive: true });
  }

  // 4. 应用图标点击触感反馈 (如果正在滑屏则忽略误触)
  const appItems = document.querySelectorAll('.app-item');
  appItems.forEach(app => {
    app.addEventListener('click', () => {
      if (hasMoved) return;
      const appName = app.querySelector('.app-name')?.textContent || 'App';
      console.log(`[Asher phone] 打开应用: ${appName}`);
      if (navigator.vibrate) navigator.vibrate(10);
    });
  });
});
