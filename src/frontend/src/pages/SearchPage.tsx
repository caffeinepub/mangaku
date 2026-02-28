import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearch } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Comic } from "../backend.d";
import { ComicCard, ComicCardSkeleton } from "../components/ComicCard";
import { useListComics, useSearchComics } from "../hooks/useQueries";

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Isekai",
  "Martial Arts",
];

const STATUSES = ["Ongoing", "Completed", "Hiatus"];

const SKELETON_IDS = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "s12",
];

function sortResults(comics: Comic[], sortBy: string): Comic[] {
  const arr = [...comics];
  if (sortBy === "popular") {
    return arr.sort((a, b) => Number(b.viewCount - a.viewCount));
  }
  if (sortBy === "alphabetical") {
    return arr.sort((a, b) => a.title.localeCompare(b.title));
  }
  // latest: by updatedAt
  return arr.sort((a, b) => Number(b.updatedAt - a.updatedAt));
}

export function SearchPage() {
  const searchParams = useSearch({ from: "/main/search" });
  const initialQ = searchParams.q ?? "";

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("latest");

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const isFiltered = debouncedQuery || selectedGenre || selectedStatus;

  const searchResult = useSearchComics(
    debouncedQuery,
    selectedGenre,
    selectedStatus,
  );

  const allComicsResult = useListComics(BigInt(0), BigInt(100), "latest");

  const rawComics = isFiltered
    ? (searchResult.data ?? [])
    : (allComicsResult.data ?? []);

  const isLoading = isFiltered
    ? searchResult.isLoading
    : allComicsResult.isLoading;
  const comics = sortResults(rawComics, sortBy);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-widest text-foreground mb-4">
          CARI <span className="text-primary">KOMIK</span>
        </h1>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ketik judul komik..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] bg-secondary border-border text-foreground text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="latest">Terbaru Diupdate</SelectItem>
              <SelectItem value="popular">Terpopuler</SelectItem>
              <SelectItem value="alphabetical">A–Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={selectedStatus ?? "all"}
            onValueChange={(v) => setSelectedStatus(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground text-sm h-9">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genre chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {GENRES.map((genre) => (
            <button
              type="button"
              key={genre}
              onClick={() =>
                setSelectedGenre((prev) => (prev === genre ? null : genre))
              }
              className={`transition-all text-xs px-3 py-1 rounded-full border ${
                selectedGenre === genre
                  ? "bg-primary border-primary text-primary-foreground font-semibold"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Active filters summary */}
        {(selectedGenre || selectedStatus) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedGenre && (
              <Badge
                className="bg-secondary text-foreground cursor-pointer hover:bg-destructive/20"
                onClick={() => setSelectedGenre(null)}
              >
                {selectedGenre} ×
              </Badge>
            )}
            {selectedStatus && (
              <Badge
                className="bg-secondary text-foreground cursor-pointer hover:bg-destructive/20"
                onClick={() => setSelectedStatus(null)}
              >
                {selectedStatus} ×
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-muted-foreground text-sm mb-4">
          {comics.length} komik ditemukan
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {isLoading
          ? SKELETON_IDS.map((id) => <ComicCardSkeleton key={id} />)
          : comics.map((comic) => (
              <ComicCard key={comic.id.toString()} comic={comic} />
            ))}
      </div>

      {!isLoading && comics.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Tidak ada komik yang sesuai dengan pencarianmu.
          </p>
        </div>
      )}
    </main>
  );
}
