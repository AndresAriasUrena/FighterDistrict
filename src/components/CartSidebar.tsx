'use client';

import { useCart } from '@/lib/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { IoClose, IoTrash } from 'react-icons/io5';
import { BsCart3 } from 'react-icons/bs';

export default function CartSidebar() {
  const { 
    cart, 
    isCartOpen, 
    justAdded,
    closeCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart 
  } = useCart();

  // Función para formatear precios en colones
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount);
  };

  return (
    <>
      {/* Overlay con animación de fade */}
      <div 
        className={`fixed inset-0 z-40 blur-lg transition-opacity duration-300 ease-in-out ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      {/* Sidebar con animación de deslizamiento */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out ${
        isCartOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header con animación */}
          <div className={`p-6 border-b border-gray-200 transition-all duration-500 delay-100 ${
            isCartOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BsCart3 className="w-6 h-6 text-black" />
                <h2 className="font-raven-bold text-xl text-black">
                  Tu Carrito
                </h2>
                {cart.totalItems > 0 && (
                  <span className="bg-[#EC1D25] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-urbanist font-bold animate-pulse">
                    {cart.totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-md transition-all duration-200 hover:rotate-90"
              >
                <IoClose className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Cart Content con animación */}
          <div className={`flex-1 overflow-y-auto transition-all duration-500 delay-200 ${
            isCartOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            {cart.items.length === 0 ? (
              // Empty Cart con animaciones
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="animate-bounce mb-4">
                  <BsCart3 className="w-16 h-16 text-gray-300" />
                </div>
                <h3 className="font-raven-medium text-lg text-gray-600 mb-2 animate-fade-in">
                  Tu carrito está vacío
                </h3>
                <p className="font-urbanist text-gray-500 mb-6 animate-fade-in animation-delay-200">
                  Agrega algunos productos para empezar
                </p>
                <Link
                  href="/store"
                  onClick={closeCart}
                  className="bg-black text-white px-6 py-3 rounded-md font-urbanist font-semibold hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105 animate-fade-in animation-delay-400"
                >
                  Ir a la tienda
                </Link>
              </div>
            ) : (
              // Cart Items con animaciones escalonadas
              <div className="p-4 space-y-4">
                {cart.items.map((item, index) => (
                  <div 
                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                    className={`flex gap-4 p-4 rounded-lg transition-all duration-500 transform hover:scale-[1.02] hover:shadow-md ${
                      isCartOpen 
                        ? 'translate-x-0 opacity-100' 
                        : 'translate-x-8 opacity-0'
                    } ${
                      justAdded === item.id 
                        ? 'bg-green-50 border-2 border-green-200 animate-pulse' 
                        : 'bg-gray-50'
                    }`}
                    style={{
                      transitionDelay: `${300 + index * 100}ms`
                    }}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain bg-white rounded-md transition-transform duration-200 hover:scale-110"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="font-urbanist font-semibold text-sm text-black hover:text-[#EC1D25] transition-colors duration-200 line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      
                      {/* Variants */}
                      {(item.selectedSize || item.selectedColor) && (
                        <div className="mt-1 text-xs text-gray-600 font-urbanist">
                          {item.selectedSize && (
                            <span>Talla: {item.selectedSize}</span>
                          )}
                          {item.selectedSize && item.selectedColor && ' • '}
                          {item.selectedColor && (
                            <span>Color: {item.selectedColor}</span>
                          )}
                        </div>
                      )}

                      {/* Price con animación */}
                      <div className="mt-2 font-urbanist font-bold text-black transition-all duration-300">
                        {formatPrice((item.price || 0) * (item.quantity || 0))}
                      </div>

                      {/* Quantity Controls con animaciones */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                          <button
                            onClick={() => updateQuantity(
                              item.id, 
                              item.quantity - 1, 
                              item.selectedSize, 
                              item.selectedColor
                            )}
                            className="px-2 py-1 bg-black text-white hover:bg-[#EC1D25] transition-all duration-200 text-sm hover:scale-110 active:scale-95"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-sm font-urbanist font-semibold transition-all duration-300 text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(
                              item.id, 
                              item.quantity + 1, 
                              item.selectedSize, 
                              item.selectedColor
                            )}
                            className="px-2 py-1 bg-black text-white hover:bg-[#EC1D25] transition-all duration-200 text-sm hover:scale-110 active:scale-95"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button con animación */}
                        <button
                          onClick={() => removeFromCart(
                            item.id, 
                            item.selectedSize, 
                            item.selectedColor
                          )}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 hover:rotate-12"
                        >
                          <IoTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button con animación */}
                {cart.items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className={`w-full mt-4 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-50 transition-all duration-300 font-urbanist font-semibold text-sm transform hover:scale-105 active:scale-95 ${
                      isCartOpen 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-4 opacity-0'
                    }`}
                    style={{
                      transitionDelay: `${300 + cart.items.length * 100 + 200}ms`
                    }}
                  >
                    Vaciar carrito
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer / Checkout con animación */}
          {cart.items.length > 0 && (
            <div className={`border-t border-gray-200 p-6 bg-white transition-all duration-500 delay-300 ${
              isCartOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              {/* Subtotal con animación */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-urbanist font-semibold text-lg text-black">
                  Subtotal:
                </span>
                <span className="font-raven-bold text-xl text-black transition-all duration-300 animate-pulse">
                  {formatPrice(cart.totalPrice || 0)}
                </span>
              </div>

              {/* Checkout Buttons con animaciones */}
              <div className="space-y-3">
                <Link
                  href="/checkout"
                  onClick={() => {
                    // Hacer backup del carrito antes del checkout
                    localStorage.setItem('fighterDistrict_cart_backup', JSON.stringify(cart));
                    closeCart();
                  }}
                  className="block w-full bg-black text-white py-3 rounded-md font-raven-medium text-lg hover:bg-[#EC1D25] transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-lg text-center"
                >
                  Proceder al pago
                </Link>
                <Link
                  href="/store"
                  onClick={closeCart}
                  className="block w-full text-center py-3 border border-gray-300 rounded-md font-urbanist font-semibold text-black hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Seguir comprando
                </Link>
              </div>

              {/* Shipping Info */}
              <p className="text-xs text-gray-500 text-center mt-3 font-urbanist opacity-70 hover:opacity-100 transition-opacity duration-300">
                Envío y impuestos calculados al finalizar la compra
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 