import { Link } from "react-router-dom";

export function AppFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CopyEngine. Todos os direitos reservados.
        </span>
        <div className="flex items-center gap-4">
          <Link
            to="/terms"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Termos de Serviço
          </Link>
          <Link
            to="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
