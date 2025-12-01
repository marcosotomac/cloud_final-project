import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: "para-compartir", name: "Para compartir", icon: "🍗" },
  { id: "para-2", name: "Para 2", icon: "👫" },
  { id: "para-ti", name: "Para ti", icon: "🍔" },
  { id: "sandwiches", name: "Sandwich y Twister XL", icon: "🌯" },
];

const CategoryNav = () => {
  const navigate = useNavigate();

  return (
    <section className="py-6 sm:py-8 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Ahorrar nunca fue tan rico</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/menu?category=${category.id}`)}
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:border-primary hover:shadow-md transition-all duration-200"
            >
              <span className="text-2xl sm:text-3xl">{category.icon}</span>
              <span className="font-medium text-xs sm:text-base text-gray-800">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryNav;
