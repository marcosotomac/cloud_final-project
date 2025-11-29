import Header from "@/components/Header";
import SubNav from "@/components/SubNav";
import HeroCarousel from "@/components/HeroCarousel";
import PromosSection from "@/components/PromosSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubNav />
      
      <main>
        <div className="container mx-auto px-4 py-6">
          <HeroCarousel />
        </div>
        
        <PromosSection />
        
        {/* Additional sections can be added here */}
        <div className="container mx-auto px-4 py-12">
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ahorra con nuestras ofertas</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre las mejores promociones en pollo frito, combos familiares y más. 
              Entrega a domicilio disponible en todo Perú.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-muted py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 KFC Perú. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
