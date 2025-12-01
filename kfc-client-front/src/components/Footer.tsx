import { Instagram, Facebook, Youtube, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* Social Media Banner */}
      <div className="bg-primary py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4">
          <span className="text-white font-medium">
            Síguenos en nuestras redes sociales
          </span>
          <div className="flex gap-3">
            <a
              href="https://instagram.com/kfcperu"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://facebook.com/kfcperu"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://youtube.com/kfcperu"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Youtube className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com/kfcperu"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Contact */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">
              Contacto & Atención al Cliente
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white flex items-center gap-2 text-sm sm:text-base"
                >
                  📝 Encuesta de satisfacción
                </a>
              </li>
              <li>
                <a
                  href="tel:505-0505"
                  className="text-gray-300 hover:text-white flex items-center gap-2 text-sm sm:text-base"
                >
                  📞 Teléfono 505-0505
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/51940155788"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white flex items-center gap-2 text-sm sm:text-base"
                >
                  💬 WhatsApp +51 940155788
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">
              Sobre Nosotros
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Historia
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Trabaja con nosotros
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Ventas corporativas
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Comprobantes electrónicos
                </a>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">
              Políticas & Términos
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Términos y condiciones de la web
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Políticas de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Políticas de delivery y pick up
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Términos y condiciones de promociones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Línea Ética
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Política de cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white">
                  Contáctanos
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-xs">KFC</span>
            </div>
            <span className="text-gray-400 text-sm">
              2025 DELOSI S.A. Todos los derechos reservados.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
