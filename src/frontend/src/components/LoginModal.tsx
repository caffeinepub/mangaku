import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, LogIn } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  isLoggingIn: boolean;
}

export function LoginModal({
  open,
  onOpenChange,
  onLogin,
  isLoggingIn,
}: LoginModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-widest text-foreground">
            MASUK KE <span className="text-primary">MANGAKU</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            Login diperlukan untuk berkomentar dan membaca konten 18+. Gunakan
            Internet Identity untuk autentikasi yang aman dan terdesentralisasi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Keuntungan login:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Beri komentar pada komik favorit</li>
              <li>Akses konten 18+ (jika tersedia)</li>
            </ul>
          </div>

          <Button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghubungkan...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login dengan Internet Identity
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
