import Navbar from '@/components/Navbar';
import HeroSection from '@/components/Homepage/HeroSection';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';
const Welcome = dynamic(() => import('@/components/Homepage/Welcome'), { ssr: true });
const Brands = dynamic(() => import('@/components/Homepage/Brands'), { ssr: true });
const ProductSection = dynamic(() => import('@/components/Homepage/ProductSection'), { ssr: true });
const CategorySection1 = dynamic(() => import('@/components/Homepage/CategorySection1'), { ssr: true });
const BoxProductsCTA = dynamic(() => import('@/components/Homepage/BoxProductsCTA'), { ssr: true });
const CategorySection2 = dynamic(() => import('@/components/Homepage/CategorySection2'), { ssr: true });


export default function Home() {
  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      <HeroSection />
      <div className="space-y-20 mt-20 mb-20">
        <Welcome />
        <Brands />
        <ProductSection />
        <CategorySection1 />
        <BoxProductsCTA />
        <CategorySection2 />
      </div>
      <Footer />
    </div>
  );
}
