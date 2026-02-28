import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Search, Shield, X } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { LoginModal } from "./LoginModal";

export function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, clear, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  // Show admin button to any logged-in user (backend enforces actual admin check)
  const showAdmin = isAuthenticated;
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      void navigate({
        to: "/search",
        search: { q: searchQuery.trim(), genre: "" },
      });
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-14">
            {/* Logo */}
            <Link to="/" className="shrink-0 flex items-center gap-1 group">
              <span className="font-display text-2xl text-primary tracking-widest group-hover:text-primary/80 transition-colors">
                MANGA
              </span>
              <span className="font-display text-2xl text-foreground tracking-widest group-hover:text-foreground/80 transition-colors">
                KU
              </span>
            </Link>

            {/* Search bar — desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-md relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari komik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9"
              />
            </form>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2 ml-auto">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
              >
                Beranda
              </Link>
              <Link
                to="/search"
                search={{ q: "", genre: "" }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
              >
                Cari
              </Link>
              {showAdmin && (
                <Link to="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Button>
                </Link>
              )}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleLogout()}
                  className="h-8 text-xs border-border text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                  disabled={isLoggingIn}
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  {isLoggingIn ? "Loading..." : "Login"}
                </Button>
              )}
            </nav>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden ml-auto text-muted-foreground hover:text-foreground p-1"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari komik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </form>
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground py-1"
              >
                Beranda
              </Link>
              <Link
                to="/search"
                search={{ q: "", genre: "" }}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground py-1"
              >
                Cari Komik
              </Link>
              {showAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-primary hover:text-primary/80 py-1"
                >
                  Admin Panel
                </Link>
              )}
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-xs"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setLoginModalOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onLogin={() => {
          login();
          setLoginModalOpen(false);
        }}
        isLoggingIn={isLoggingIn}
      />
    </>
  );
}
