'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Cart, CartContextType } from '@/types/cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  // Cargar carrito del localStorage al inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem('fighterDistrict_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Asegurar que los valores numéricos estén definidos
        setCart({
          items: parsedCart.items || [],
          totalItems: parsedCart.totalItems || 0,
          totalPrice: parsedCart.totalPrice || 0
        });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        // Si hay error, usar valores por defecto
        setCart({
          items: [],
          totalItems: 0,
          totalPrice: 0
        });
      }
    }
  }, []);

  // Sincronización entre pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Solo procesar cambios del carrito desde otras ventanas
      if (e.key === 'fighterDistrict_cart' && e.newValue && e.storageArea === localStorage) {
        try {
          const newCart = JSON.parse(e.newValue);
          // Actualizar el carrito con los datos de la otra ventana
          setCart({
            items: newCart.items || [],
            totalItems: newCart.totalItems || 0,
            totalPrice: newCart.totalPrice || 0
          });
        } catch (error) {
          console.error('Error syncing cart from other window:', error);
        }
      }
    };

    // Escuchar cambios en localStorage desde otras ventanas
    window.addEventListener('storage', handleStorageChange);

         return () => {
       window.removeEventListener('storage', handleStorageChange);
     };
   }, []);

  // Verificación adicional cuando la ventana vuelve a estar activa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // La ventana volvió a estar activa, verificar si hay cambios en localStorage
        const savedCart = localStorage.getItem('fighterDistrict_cart');
        if (savedCart) {
          try {
            const storedCart = JSON.parse(savedCart);
            // Solo actualizar si los datos son diferentes
            if (JSON.stringify(cart) !== savedCart) {
              setCart({
                items: storedCart.items || [],
                totalItems: storedCart.totalItems || 0,
                totalPrice: storedCart.totalPrice || 0
              });
            }
          } catch (error) {
            console.error('Error checking cart on visibility change:', error);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cart]);

  const getCartItemKey = (id: number, size?: string, color?: string) => {
    return `${id}-${size || 'no-size'}-${color || 'no-color'}`;
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(cartItem => 
        cartItem.id === item.id && 
        cartItem.selectedSize === item.selectedSize && 
        cartItem.selectedColor === item.selectedColor
      );

      let newItems;
      if (existingItemIndex >= 0) {
        // Si el item ya existe, aumentar la cantidad
        newItems = [...prev.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
          price: Number(newItems[existingItemIndex].price) || 0
        };
      } else {
        // Si es un item nuevo, agregarlo
        const newItem: CartItem = {
          ...item,
          quantity,
          price: Number(item.price) || 0
        };
        newItems = [...prev.items, newItem];
      }

      // Calcular totales aquí mismo para evitar el efecto adicional
      const totalItems = newItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalPrice = newItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      // Guardar en localStorage aquí mismo
      const newCart = {
        items: newItems,
        totalItems,
        totalPrice
      };
      localStorage.setItem('fighterDistrict_cart', JSON.stringify(newCart));

      return newCart;
    });

    // Marcar el item como recién agregado
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 2000);
  };

  const removeFromCart = (id: number, size?: string, color?: string) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => 
        !(item.id === id && 
          item.selectedSize === size && 
          item.selectedColor === color)
      );

      // Calcular totales
      const totalItems = newItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalPrice = newItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      // Guardar en localStorage
      const newCart = {
        items: newItems,
        totalItems,
        totalPrice
      };
      localStorage.setItem('fighterDistrict_cart', JSON.stringify(newCart));

      return newCart;
    });
  };

  const updateQuantity = (id: number, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }

    setCart(prev => {
      const newItems = prev.items.map(item =>
        item.id === id && 
        item.selectedSize === size && 
        item.selectedColor === color
          ? { ...item, quantity }
          : item
      );

      // Calcular totales
      const totalItems = newItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalPrice = newItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

      // Guardar en localStorage
      const newCart = {
        items: newItems,
        totalItems,
        totalPrice
      };
      localStorage.setItem('fighterDistrict_cart', JSON.stringify(newCart));

      return newCart;
    });
  };

  const clearCart = () => {
    const emptyCart = {
      items: [],
      totalItems: 0,
      totalPrice: 0
    };
    localStorage.setItem('fighterDistrict_cart', JSON.stringify(emptyCart));
    setCart(emptyCart);
  };

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      justAdded,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartItemKey
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 