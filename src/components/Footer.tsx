import Link from 'next/link';
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa6";


export default function Footer() {
    return (
        <footer className="bg-black text-white relative overflow-hidden">
            {/* Background SVG - Desktop only */}
            <div 
                className="absolute inset-0 hidden lg:block bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('/assets/FondoDesktopFooter.svg')"
                }}
            />
            
            {/* Content */}
            <div className="mx-auto px-8 pt-12 pb-4 relative z-10">
                <div className="flex flex-col md:flex-row justify-between max-w-7xl mx-auto items-center md:items-start">
                    <div className="md:col-span-1 text-center md:text-left mb-8 md:mb-0">
                        <div className="mb-4 flex justify-center md:justify-start">
                            <img src="/assets/LogoFooter.svg" alt="Fighter District" width={160} height={160} />
                        </div>
                        <p className="text-[#575757] font-urbanist text-md tracking-widest">
                            Somos el mejor equipo de<br />
                            combate en Costa Rica
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full md:w-auto text-center md:text-left">

                        {/* Tienda */}
                        <div className="mb-8 md:mb-0">
                            <h4 className="text-lg font-raven-bold text-white mb-4 tracking-wider">
                                TIENDA
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/equipamiento" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        Equipamiento
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/hoodies" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        Hoodies
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/crewnecks" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        Crewnecks
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/judo" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        Judo
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/bjj" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        BJJ
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/boxing" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        Boxing
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Redes Sociales */}
                        <div className="mb-8 md:mb-0">
                            <h4 className="text-lg font-raven-bold text-white mb-4 tracking-wider">
                                REDES SOCIALES
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        Instagram
                                    </a>
                                </li>
                                <li>
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        Facebook
                                    </a>
                                </li>
                                <li>
                                    <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-[#DFDFDF]/80 hover:text-white font-urbanist transition-colors">
                                        TikTok
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Contacto */}
                        <div>
                            <h4 className="text-lg font-raven-bold text-white mb-4 tracking-wider">
                                CONTACTO
                            </h4>
                            <div className="space-y-2">
                                <p className="text-[#DFDFDF]/80 font-urbanist">
                                    <span className="text-white">Correo:</span> example@gmail.com
                                </p>
                                <p className="text-[#DFDFDF]/80 font-urbanist">
                                    <span className="text-white">WhatsApp:</span> 0000-0000
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Línea separadora */}
                <div className="border-t border-[#C0C0C0]/25 mt-14 pt-4">
                    <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
                        {/* Copyright */}
                        <p className="text-[#C0C0C0] font-urbanist text-sm">
                            © 2025 Fighter District. Todos los derechos reservados.
                        </p>

                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white rounded-full grid place-items-center text-white hover:bg-white hover:text-black transition-all duration-300">
                                <FaFacebook size={26} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-white rounded-full grid place-items-center text-white hover:bg-white hover:text-black transition-all duration-300">
                                <FaInstagram size={28} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
} 