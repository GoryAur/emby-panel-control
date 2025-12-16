'use client';

import { useEffect, useRef, useState } from 'react';

export default function useSwipeToClose(onClose, threshold = 150) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const startY = useRef(0);
  const startX = useRef(0);
  const modalRef = useRef(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    let touchStartY = 0;
    let touchStartX = 0;
    let currentY = 0;
    let isVerticalSwipe = false;

    const handleTouchStart = (e) => {
      // Solo activar en el header o cerca del top
      const target = e.target;
      const rect = modal.getBoundingClientRect();
      const touchY = e.touches[0].clientY;

      // Verificar si el touch está en el área del header (primeros 80px)
      if (touchY - rect.top < 80) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        startY.current = touchStartY;
        startX.current = touchStartX;
        setIsSwiping(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isSwiping) return;

      currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startY.current;
      const deltaX = currentX - startX.current;

      // Determinar si es un swipe vertical
      if (!isVerticalSwipe && Math.abs(deltaY) > 10) {
        isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
      }

      // Solo procesar swipes hacia abajo
      if (isVerticalSwipe && deltaY > 0) {
        e.preventDefault();
        setSwipeDistance(deltaY);
      }
    };

    const handleTouchEnd = () => {
      if (swipeDistance >= threshold) {
        // Cerrar modal con animación
        modal.style.transform = `translateY(${window.innerHeight}px)`;
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        // Reset
        setSwipeDistance(0);
      }

      setIsSwiping(false);
      isVerticalSwipe = false;
    };

    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchmove', handleTouchMove, { passive: false });
    modal.addEventListener('touchend', handleTouchEnd);

    return () => {
      modal.removeEventListener('touchstart', handleTouchStart);
      modal.removeEventListener('touchmove', handleTouchMove);
      modal.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose, threshold, isSwiping, swipeDistance]);

  return {
    modalRef,
    isSwiping,
    swipeDistance,
  };
}
