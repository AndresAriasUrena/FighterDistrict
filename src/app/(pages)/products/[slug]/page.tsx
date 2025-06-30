'use client';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetail from '@/components/ProductView/ProductDetail';
import dynamic from 'next/dynamic';
const ProductSection = dynamic(() => import('@/components/Homepage/ProductSection'), { ssr: true });


export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      <div className="space-y-20 mt-6 mb-6">
        <ProductDetail slug={slug} />
      </div>
      <Footer />
    </div>
  );
} 