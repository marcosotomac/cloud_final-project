import Header from "@/components/Header";
import SubNav from "@/components/SubNav";
import HeroCarousel from "@/components/HeroCarousel";
import PromosSection from "@/components/PromosSection";
import CategoryNav from "@/components/CategoryNav";
import TopProductsSection from "@/components/TopProductsSection";
import MenuCategorySection from "@/components/MenuCategorySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SubNav />

      <main>
        {/* Hero Banner */}
        <div className="container mx-auto px-4 py-3 sm:py-6">
          <HeroCarousel />
        </div>

        {/* Promos Section */}
        <PromosSection />

        {/* Category Navigation */}
        <CategoryNav />

        {/* Top Products */}
        <TopProductsSection />

        {/* Megas Section */}
        <MenuCategorySection title="Megas" category="Megas" />

        {/* Para 2 Section */}
        <div className="bg-gray-50">
          <MenuCategorySection title="Para 2" category="Para 2" emoji="👫" />
        </div>

        {/* Combos Section */}
        <MenuCategorySection title="Combos" category="Combos" emoji="🍗" />

        {/* Complementos Section */}
        <div className="bg-gray-50">
          <MenuCategorySection title="Complementos" category="Complementos" />
        </div>

        {/* App Download Banner */}
        <section className="bg-primary py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center gap-4 sm:gap-8 text-white text-center">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
                  ¡Descarga el APP!
                </h2>
                <p className="text-white/80 text-sm sm:text-base">
                  Promociones exclusivas solo en nuestra app
                </p>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <a
                  href="#"
                  className="bg-black rounded-lg px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 hover:bg-gray-900 transition-colors"
                >
                  <span className="text-xl sm:text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-[10px] sm:text-xs">Descarga en</div>
                    <div className="font-semibold text-sm sm:text-base">
                      App Store
                    </div>
                  </div>
                </a>
                <a
                  href="#"
                  className="bg-black rounded-lg px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 hover:bg-gray-900 transition-colors"
                >
                  <span className="text-xl sm:text-2xl">▶️</span>
                  <div className="text-left">
                    <div className="text-[10px] sm:text-xs">Disponible en</div>
                    <div className="font-semibold text-sm sm:text-base">
                      Google Play
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
