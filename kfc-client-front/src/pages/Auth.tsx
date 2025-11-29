import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Apple, Smartphone } from "lucide-react";

const Auth = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-foreground">KFC</span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Crea una cuenta o inicia sesión</h1>
            <p className="text-muted-foreground">
              Ingresa o crea tu cuenta en simples pasos.
            </p>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-14 text-base font-medium flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 text-base font-medium flex items-center justify-center gap-3"
            >
              <Smartphone className="h-6 w-6" />
              Continuar con celular
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 text-base font-medium flex items-center justify-center gap-3"
            >
              <Apple className="h-6 w-6" />
              Continuar con Apple
            </Button>
          </div>

          {/* Footer Link */}
          <button className="text-primary hover:underline font-medium">
            Recuperar contraseña
          </button>
        </div>
      </main>
    </div>
  );
};

export default Auth;
