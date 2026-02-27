import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/50 py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1.5">
          © 2026 MangaKu. Dibuat dengan{" "}
          <Heart className="h-3.5 w-3.5 text-primary fill-primary" />{" "}
          menggunakan{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
