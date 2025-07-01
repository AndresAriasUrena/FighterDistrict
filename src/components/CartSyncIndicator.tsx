'use client';

import { useCart } from '@/lib/CartContext';
import { useEffect, useState } from 'react';
import { BsArrowRepeat } from 'react-icons/bs';

export default function CartSyncIndicator() {
  const { cart } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Solo mostrar el indicador si el cambio viene de otra ventana
      if (e.key === 'fighterDistrict_cart' && e.newValue) {
        setIsVisible(true);
        setLastSyncTime(Date.now());
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-4 z-50 animate-slide-in-left">
      <div className="bg-blue-500 text-white rounded-lg shadow-lg p-3 flex items-center gap-2 max-w-sm">
        <BsArrowRepeat className="w-4 h-4 animate-spin" />
        <div className="text-sm font-urbanist">
          <p className="font-semibold">Carrito sincronizado</p>
          <p className="text-xs opacity-90">Actualizado desde otra ventana</p>
        </div>
      </div>
    </div>
  );
} 