'use client';

import { useEffect, useRef, useState } from 'react';

export default function usePullToRefresh(onRefresh, threshold = 80) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let currentY = 0;

    const handleTouchStart = (e) => {
      // Solo activar si estamos en el top del scroll
      if (container.scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        startY.current = touchStartY;
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      // Solo procesar si estamos en el top y haciendo pull hacia abajo
      if (container.scrollTop === 0 && distance > 0) {
        e.preventDefault();
        const pullAmount = Math.min(distance, threshold * 1.5);
        setPullDistance(pullAmount);
        setIsPulling(pullAmount >= threshold);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setIsPulling(false);

        try {
          await onRefresh();
        } catch (error) {
          console.error('Error refreshing:', error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, isRefreshing, pullDistance]);

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
  };
}
