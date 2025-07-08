// src/app/(pages)/sobre-nosotros/page.tsx
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-raven-bold text-center text-red-700 mb-8">Sobre Nosotros</h1>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-lg text-gray-700 mb-4">
            Somos el mejor equipo de combate en Costa Rica.
          </p>
          <p className="text-gray-600">
            En Fighter District, nos dedicamos a proporcionar el mejor equipamiento 
            para atletas de combate y artes marciales.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}