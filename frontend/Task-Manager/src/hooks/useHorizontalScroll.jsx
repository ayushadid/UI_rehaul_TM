import { useRef, useEffect } from 'react';

export const useHorizontalScroll = () => {
  const elRef = useRef();
  useEffect(() => {
    const el = elRef.current;
    if (el) {
      const onWheel = (e) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        el.scrollTo({
          left: el.scrollLeft + e.deltaY,
          behavior: 'smooth'
        });
      };
      
      let isDown = false;
      let startX;
      let scrollLeft;

      const onMouseDown = (e) => {
        // Only trigger for middle mouse button (1) or primary button (0)
        if (e.button !== 1 && e.button !== 0) return;
        isDown = true;
        el.classList.add('active-scroll');
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
      };
      
      const onMouseLeaveUp = () => {
        isDown = false;
        el.classList.remove('active-scroll');
      };
      
      const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast factor
        el.scrollLeft = scrollLeft - walk;
      };

      // The 'passive: false' is important to allow preventDefault
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mouseleave', onMouseLeaveUp);
      el.addEventListener('mouseup', onMouseLeaveUp);
      el.addEventListener('mousemove', onMouseMove);

      return () => {
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mouseleave', onMouseLeaveUp);
        el.removeEventListener('mouseup', onMouseLeaveUp);
        el.removeEventListener('mousemove', onMouseMove);
      };
    }
  }, []);
  return elRef;
};