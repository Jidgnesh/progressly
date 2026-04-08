import { useRef, useState } from 'react';

interface SwipeHandlers {
  ref: React.RefObject<HTMLDivElement | null>;
  offset: number;
  releasing: boolean;
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: (e: React.PointerEvent) => void;
}

export const useSwipe = (
  onSwipeRight?: () => void,
  onSwipeLeft?: () => void,
  onLongPress?: () => void,
  threshold: number = 0.4
): SwipeHandlers => {
  const ref = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isDragging = useRef(false);
  const direction = useRef<'horizontal' | 'vertical' | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offset, setOffset] = useState(0);
  const [releasing, setReleasing] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDragging.current) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = Date.now();
    direction.current = null;
    isDragging.current = false;
    setReleasing(false);

    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current && direction.current !== 'horizontal') {
        if (navigator.vibrate) navigator.vibrate(10);
        onLongPress?.();
      }
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!direction.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      direction.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (direction.current === 'horizontal') {
        const target = e.target as Element;
        if ('setPointerCapture' in target) {
          target.setPointerCapture(e.pointerId);
        }
        isDragging.current = true;
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      } else {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }
    }

    if (direction.current !== 'horizontal') return;
    e.preventDefault();
    setOffset(dx);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    if (!isDragging.current) return;
    isDragging.current = false;

    const dx = e.clientX - startX.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = Math.abs(dx) / elapsed;
    const cardWidth = ref.current?.offsetWidth || 300;
    const percent = Math.abs(dx) / cardWidth;

    if ((velocity > 0.11 || percent > threshold) && dx > 0) {
      onSwipeRight?.();
    } else if ((velocity > 0.11 || percent > threshold) && dx < 0) {
      onSwipeLeft?.();
    }

    setReleasing(true);
    setOffset(0);
    setTimeout(() => setReleasing(false), 200);
  };

  return { ref, offset, releasing, handlePointerDown, handlePointerMove, handlePointerUp };
};
