import Navbar from '@/components/Navbar';
import HeroSection from '@/components/Homepage/HeroSection';
import Footer from '@/components/Footer';
import ProductSection from '@/components/Homepage/ProductSection';
import BoxProductsCTA from '@/components/Homepage/BoxProductsCTA';
import CategorySection2 from '@/components/Homepage/CategorySection2';
import CategorySection1 from '@/components/Homepage/CategorySection1';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#E9E9E9]">
      <Navbar />
      <HeroSection />
      <div className="space-y-16 mt-16 mb-16">
        <ProductSection />
        <CategorySection1 />
        <BoxProductsCTA />
        <CategorySection2 />
      </div>
      <Footer />
    </div>
  );
}
