'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { IoIosArrowForward } from "react-icons/io";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/marcas', label: 'Marcas' },
    { href: '/tienda', label: 'Tienda' },
    { href: '/sobre-nosotros', label: 'Sobre Nosotros' },
    { href: '/contacto', label: 'Contacto' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 lg:px-8 py-5 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-raven-bold text-black">
              <img src="/assets/Logo.svg" alt="Fighter District" width={100} height={100} />
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`group flex items-center gap-1 transition-colors font-urbanist font-medium ${
                    isActive 
                      ? 'text-black font-bold' 
                      : 'text-gray-700 hover:text-black'
                  }`}
                >
                  <IoIosArrowForward 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm" 
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Search and Cart - Desktop & Mobile */}
          <div className="flex items-center space-x-1">
            {/* Cart Button */}
            <button className="">
              <svg className="w-8 h-8 text-black lg:text-[#969696] lg:p-1 lg:border lg:border-[#969696] lg:rounded-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5h11.5" />
              </svg>
            </button>

            {/* Search Bar - Desktop only */}
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Buscar..."
                className="border h-8 border-[#969696] rounded px-3 py-1 text-sm focus:outline-none font-urbanist pr-8 placeholder:text-[#6E6E6E] placeholder:font-semibold text-black"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-[#969696]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMenu}
                className="p-2 relative z-50"
                aria-label="Toggle menu"
              >
                {/* Hamburger to X Animation */}
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span 
                    className={`block h-0.5 w-6 bg-black transform transition-all duration-300 ease-in-out ${
                      isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                    }`}
                  />
                  <span 
                    className={`block h-0.5 w-6 bg-black transform transition-all duration-300 ease-in-out mt-1 ${
                      isMenuOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span 
                    className={`block h-0.5 w-6 bg-black transform transition-all duration-300 ease-in-out mt-1 ${
                      isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <img src="/assets/Logo.svg" alt="Fighter District" width={80} height={80} />
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full border border-[#969696] rounded px-3 py-2 text-sm focus:outline-none font-urbanist pr-8 placeholder:text-[#6E6E6E] placeholder:font-semibold text-black"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-[#969696]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Links - Mobile */}
          <div className="flex-1 py-6">
            <nav className="space-y-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center px-6 py-3 text-lg font-urbanist font-medium transition-colors ${
                      isActive
                        ? 'text-black font-bold bg-gray-50 border-r-4 border-black'
                        : 'text-gray-700 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                    {isActive && <IoIosArrowForward className="ml-2" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
} 