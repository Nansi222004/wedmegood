import { useEffect, useRef } from 'react';

/**
 * Hook to enable smooth mouse cursor drag-to-scroll on any scrollable container.
 * Preserves native interactions on inputs, textareas, buttons, labels, and links.
 */
export const useDragToScroll = (enabled = true) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startY = 0;
    let startScrollTop = 0;

    const onMouseDown = (e) => {
      // Only respond to main/left mouse button
      if (e.button !== 0) return;

      // Ignore drag on form controls or interactive elements
      const target = e.target;
      if (target.closest('input, textarea, select, button, a, [role="button"], label, summary')) {
        return;
      }

      isDown = true;
      startY = e.clientY;
      startScrollTop = el.scrollTop;
      el.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      const walkY = e.clientY - startY;
      el.scrollTop = startScrollTop - walkY;
      el.style.cursor = 'grabbing';
    };

    const onMouseUp = () => {
      if (isDown) {
        isDown = false;
        el.style.cursor = '';
        el.style.userSelect = '';
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (el) {
        el.style.cursor = '';
        el.style.userSelect = '';
      }
    };
  }, [enabled]);

  return scrollRef;
};

export default useDragToScroll;
