// src/lib/CartContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Tipos para el carrito
export interface CartItem {
  id: number;
  name: string;
  price: string | number;
  quantity: number;
  image: string;
  slug: string;
  selectedSize?: string;
  selectedColor?: string;
  maxQuantity?: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface CartContextType {
  cart: Cart;
  isCartOpen: boolean;
  justAdded: number | null;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: number, size?: string, color?: string) => void;
  updateQuantity: (id: number, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

// Contexto con valor por defecto
export const CartContext = createContext<CartContextType>({
  cart: { items: [], totalItems: 0, totalPrice: 0 },
  isCartOpen: false,
  justAdded: null,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
});

// Provider del contexto
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    const savedCart = localStorage.getItem('fighterdistrict_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (cart.items.length > 0) {
      localStorage.setItem('fighterdistrict_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('fighterdistrict_cart');
    }
  }, [cart]);

  // Calcular totales
  useEffect(() => {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return sum + (price * item.quantity);
    }, 0);

    setCart(prev => ({
      ...prev,
      totalItems,
      totalPrice
    }));
  }, [cart.items]);

  // Funciones del carrito
  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(cartItem => 
        cartItem.id === item.id && 
        cartItem.selectedSize === item.selectedSize && 
        cartItem.selectedColor === item.selectedColor
      );

      if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        const newItems = [...prev.items];
        newItems[existingItemIndex].quantity += quantity;
        return { ...prev, items: newItems };
      } else {
        // Agregar nuevo item
        const newItem: CartItem = {
          ...item,
          quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
        };
        return { ...prev, items: [...prev.items, newItem] };
      }
    });

    // Mostrar feedback visual
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 2000);
    
    // Abrir carrito
    setIsCartOpen(true);
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
        (item.id === id && 
         item.selectedSize === size && 
         item.selectedColor === color)
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
    setIsCartOpen(false);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      justAdded,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personalizado para usar el carrito
export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}