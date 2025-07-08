// src/app/(pages)/contacto/page.tsx
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-raven-bold text-center text-red-700 mb-8">Contacto</h1>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8 text-gray-950">
            <div>
              <h2 className="text-2xl font-bold mb-4">Información de Contacto</h2>
              <p className="mb-2">
                <strong>Email:</strong> alberto@fighterdistrict.com
              </p>
              <p className="mb-2">
                <strong>WhatsApp:</strong> 0000-0000
              </p>
              <p className="mb-2">
                <strong>Dirección:</strong> San José, Costa Rica
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Horario</h2>
              <p className="mb-2">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
              <p className="mb-2">Sábados: 9:00 AM - 2:00 PM</p>
              <p>Domingos: Cerrado</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}