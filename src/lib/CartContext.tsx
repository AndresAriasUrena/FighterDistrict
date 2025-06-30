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

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('fighterDistrict_cart', JSON.stringify(cart));
  }, [cart]);

  // Recalcular totales cuando cambien los items
  useEffect(() => {
    const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    
    if (cart.totalItems !== totalItems || cart.totalPrice !== totalPrice) {
      setCart(prev => ({
        ...prev,
        totalItems,
        totalPrice
      }));
    }
  }, [cart.items, cart.totalItems, cart.totalPrice]);

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

      if (existingItemIndex >= 0) {
        // Si el item ya existe, aumentar la cantidad
        const newItems = [...prev.items];
        newItems[existingItemIndex].quantity += quantity;
        // Asegurar que el price sea un número válido
        newItems[existingItemIndex].price = Number(newItems[existingItemIndex].price) || 0;
        return {
          ...prev,
          items: newItems
        };
      } else {
        // Si es un item nuevo, agregarlo
        const newItem: CartItem = {
          ...item,
          quantity,
          price: Number(item.price) || 0 // Asegurar que price sea un número
        };
        return {
          ...prev,
          items: [...prev.items, newItem]
        };
      }
    });

    // Marcar el item como recién agregado
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 2000);
  };

  const removeFromCart = (id: number, size?: string, color?: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => 
        !(item.id === id && 
          item.selectedSize === size && 
          item.selectedColor === color)
      )
    }));
  };

  const updateQuantity = (id: number, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id && 
        item.selectedSize === size && 
        item.selectedColor === color
          ? { ...item, quantity }
          : item
      )
    }));
  };

  const clearCart = () => {
    setCart({
      items: [],
      totalItems: 0,
      totalPrice: 0
    });
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