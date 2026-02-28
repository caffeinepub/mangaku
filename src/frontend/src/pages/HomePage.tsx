import { Link } from "@tanstack/react-router";
import { ChevronRight, Flame, Grid } from "lucide-react";
import { useState } from "react";
import type { Comic } from "../backend.d";
import { ComicCard, ComicCardSkeleton } from "../components/ComicCard";
import { useListComics } from "../hooks/useQueries";

const SKELETON_ROW_IDS = [
  "sk-r1",
  "sk-r2",
  "sk-r3",
  "sk-r4",
  "sk-r5",
  "sk-r6",
  "sk-r7",
  "sk-r8",
];
const SKELETON_GRID_IDS = [
  "sk-g1",
  "sk-g2",
  "sk-g3",
  "sk-g4",
  "sk-g5",
  "sk-g6",
  "sk-g7",
  "sk-g8",
  "sk-g9",
  "sk-g10",
  "sk-g11",
  "sk-g12",
  "sk-g13",
  "sk-g14",
  "sk-g15",
  "sk-g16",
  "sk-g17",
  "sk-g18",
];

const SORT_OPTIONS = [
  { value: "latest", label: "Terbaru" },
  { value: "popular", label: "Terpopuler" },
  { value: "alphabetical", label: "A–Z" },
];

function sortComics(comics: Comic[], sortBy: string): Comic[] {
  const sorted = [...comics];
  if (sortBy === "latest") {
    return sorted.sort((a, b) => Number(b.updatedAt - a.updatedAt));
  }
  if (sortBy === "popular") {
    return sorted.sort((a, b) => Number(b.viewCount - a.viewCount));
  }
  return sorted.sort((a, b) => a.title.localeCompare(b.title));
}

export function HomePage() {
  const [sortBy, setSortBy] = useState("latest");
  const { data: comics, isLoading } = useListComics(
    BigInt(0),
    BigInt(50),
    sortBy,
  );

  const sortedComics = comics ? sortComics(comics, sortBy) : [];
  const latestComics = sortedComics.slice(0, 12);

  return (
    <main className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-b from-card to-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {/* Subtle grid pattern */}
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, oklch(0.64 0.24 30) 0px, oklch(0.64 0.24 30) 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(90deg, oklch(0.64 0.24 30) 0px, oklch(0.64 0.24 30) 1px, transparent 1px, transparent 40px)`,
            }}
          />
        </div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="max-w-xl">
            <h1 className="font-display text-5xl md:text-6xl text-foreground leading-none tracking-widest fade-in-up">
              MANGA<span className="text-primary">KU</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm fade-in-up delay-1">
              Baca ribuan komik & manga favoritmu secara gratis.
            </p>
            <Link
              to="/search"
              search={{ q: "", genre: "" }}
              className="inline-flex items-center gap-1.5 mt-4 text-primary text-sm hover:text-primary/80 transition-colors fade-in-up delay-2"
            >
              Jelajahi semua komik <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Latest Updated Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl tracking-widest text-foreground">
                KOMIK TERBARU
              </h2>
            </div>
            <Link
              to="/search"
              search={{ q: "", genre: "" }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Lihat semua <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Horizontal scroll row */}
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-3 custom-scroll snap-x snap-mandatory">
              {isLoading
                ? SKELETON_ROW_IDS.map((id) => (
                    <div key={id} className="shrink-0 w-[120px] snap-start">
                      <ComicCardSkeleton />
                    </div>
                  ))
                : latestComics.map((comic, i) => (
                    <div
                      key={comic.id.toString()}
                      className={`shrink-0 w-[120px] snap-start fade-in-up delay-${Math.min(i + 1, 5)}`}
                    >
                      <ComicCard comic={comic} />
                    </div>
                  ))}
              {!isLoading && latestComics.length === 0 && (
                <p className="text-muted-foreground text-sm py-8 px-4">
                  Belum ada komik. Admin dapat menambahkan lewat panel admin.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* All Comics Grid */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Grid className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl tracking-widest text-foreground">
                SEMUA KOMIK
              </h2>
            </div>

            {/* Sort tabs */}
            <div className="flex gap-1 bg-secondary rounded-md p-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {isLoading
              ? SKELETON_GRID_IDS.map((id) => <ComicCardSkeleton key={id} />)
              : sortedComics.map((comic) => (
                  <ComicCard key={comic.id.toString()} comic={comic} />
                ))}
          </div>

          {!isLoading && sortedComics.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">
                Belum ada komik yang tersedia.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
