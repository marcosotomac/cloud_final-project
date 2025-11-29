import { Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const SubNav = () => {
  return (
    <nav className="bg-secondary border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Button variant="ghost" className="gap-2 font-semibold hover:bg-muted">
            <Flame className="h-5 w-5 text-accent" />
            <span>Menú</span>
          </Button>

          <Button variant="ghost" className="gap-2 hover:bg-muted">
            <Gift className="h-5 w-5" />
            <span>Ventas Corporativas</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default SubNav;
