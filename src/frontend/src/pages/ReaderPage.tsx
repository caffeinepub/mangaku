import { LazyImage } from "@/components/LazyImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlignJustify,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import { useListChapters, useListPages } from "../hooks/useQueries";

function getPageUrl(blobId: string): string {
  if (!blobId) return "";
  // If it's already an external URL, use it directly
  if (blobId.startsWith("http://") || blobId.startsWith("https://")) {
    return blobId;
  }
  // Otherwise treat as Caffeine blob ID
  try {
    return ExternalBlob.fromURL(blobId).getDirectURL();
  } catch {
    return blobId;
  }
}

type ReadMode = "vertical" | "horizontal";

export function ReaderPage() {
  const { id, chapterId } = useParams({
    from: "/reader/comic/$id/chapter/$chapterId",
  });
  const comicId = BigInt(id);
  const chapterIdBig = BigInt(chapterId);

  const [mode, setMode] = useState<ReadMode>("vertical");
  const [currentPage, setCurrentPage] = useState(0);
  const [imgLoading, setImgLoading] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const prevChapterId = useRef<string>(chapterId);

  const { data: pages = [], isLoading: pagesLoading } =
    useListPages(chapterIdBig);
  const { data: chapters = [] } = useListChapters(comicId);

  const sortedPages = [...pages].sort((a, b) =>
    Number(a.pageNumber - b.pageNumber),
  );
  const sortedChapters = [...chapters].sort(
    (a, b) => a.chapterNumber - b.chapterNumber,
  );

  const currentChapterIdx = sortedChapters.findIndex(
    (c) => c.id === chapterIdBig,
  );
  const prevChapter =
    currentChapterIdx > 0 ? sortedChapters[currentChapterIdx - 1] : null;
  const nextChapter =
    currentChapterIdx < sortedChapters.length - 1
      ? sortedChapters[currentChapterIdx + 1]
      : null;

  const totalPages = sortedPages.length;

  const goToPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  // Keyboard navigation
  useEffect(() => {
    if (mode !== "horizontal") return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, goToPrev, goToNext]);

  // Preload next 2 pages in horizontal mode
  useEffect(() => {
    if (mode !== "horizontal" || sortedPages.length === 0) return;
    for (const idx of [currentPage + 1, currentPage + 2]) {
      const page = sortedPages[idx];
      if (!page) continue;
      const url = getPageUrl(page.blobId);
      if (!url) continue;
      const img = new Image();
      img.src = url;
    }
  }, [mode, currentPage, sortedPages]);

  // Show skeleton overlay when switching pages in horizontal mode
  useEffect(() => {
    if (mode !== "horizontal") return;
    setImgLoading(true);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    touchStartX.current = null;
  };

  // Reset page when chapter changes
  if (prevChapterId.current !== chapterId) {
    prevChapterId.current = chapterId;
    setCurrentPage(0);
  }

  const currentChapter = sortedChapters[currentChapterIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reader Toolbar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-12 flex items-center gap-3">
          <Link
            to="/comic/$id"
            params={{ id }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {currentChapter
                ? `Chapter ${currentChapter.chapterNumber}${currentChapter.title ? ` – ${currentChapter.title}` : ""}`
                : "Loading..."}
            </p>
            {mode === "horizontal" && totalPages > 0 && (
              <p className="text-xs text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </p>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-secondary rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setMode("vertical")}
              className={`p-1.5 rounded transition-all ${mode === "vertical" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Mode Vertikal"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMode("horizontal")}
              className={`p-1.5 rounded transition-all ${mode === "horizontal" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Mode Horizontal"
            >
              <LayoutTemplate className="h-4 w-4" />
            </button>
          </div>

          {/* Chapter navigation */}
          <div className="flex gap-1">
            {prevChapter && (
              <Link
                to="/comic/$id/chapter/$chapterId"
                params={{
                  id,
                  chapterId: prevChapter.id.toString(),
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 border-border text-muted-foreground hover:text-foreground text-xs"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
              </Link>
            )}
            {nextChapter && (
              <Link
                to="/comic/$id/chapter/$chapterId"
                params={{
                  id,
                  chapterId: nextChapter.id.toString(),
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 border-border text-muted-foreground hover:text-foreground text-xs"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        {pagesLoading ? (
          <div className="container mx-auto px-4 py-8 space-y-2 max-w-2xl">
            {["p1", "p2", "p3"].map((id) => (
              <Skeleton key={id} className="w-full aspect-[2/3]" />
            ))}
          </div>
        ) : sortedPages.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Halaman sedang diproses atau belum tersedia.
              </p>
            </div>
          </div>
        ) : mode === "vertical" ? (
          // ─── Vertical Mode ────────────────────────────────────────
          <div className="max-w-3xl mx-auto">
            {sortedPages.map((page) => (
              <LazyImage
                key={page.id.toString()}
                src={getPageUrl(page.blobId)}
                alt={`Halaman ${page.pageNumber}`}
                className="reader-page"
                aspectRatio="2/3"
              />
            ))}
            {/* End navigation */}
            <div className="p-6 flex justify-between items-center border-t border-border">
              {prevChapter ? (
                <Link
                  to="/comic/$id/chapter/$chapterId"
                  params={{ id, chapterId: prevChapter.id.toString() }}
                >
                  <Button
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Chapter {prevChapter.chapterNumber}
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              {nextChapter ? (
                <Link
                  to="/comic/$id/chapter/$chapterId"
                  params={{ id, chapterId: nextChapter.id.toString() }}
                >
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Chapter {nextChapter.chapterNumber}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Link to="/comic/$id" params={{ id }}>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Selesai — Kembali ke Detail
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          // ─── Horizontal Mode ──────────────────────────────────────
          <div
            className="relative select-none h-[calc(100vh-100px)] flex items-center justify-center bg-black"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Skeleton overlay while page is loading */}
            {imgLoading && (
              <Skeleton className="absolute inset-0 w-full h-full rounded-none bg-neutral-800/60" />
            )}

            {/* Page image — key forces remount on page change */}
            <img
              key={currentPage}
              src={getPageUrl(sortedPages[currentPage]?.blobId ?? "")}
              alt={`Halaman ${currentPage + 1}`}
              className="reader-page max-h-full max-w-full object-contain"
              draggable={false}
              onLoad={() => setImgLoading(false)}
              onError={() => setImgLoading(false)}
            />

            {/* Left click zone */}
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage === 0}
              className="absolute left-0 top-0 h-full w-1/3 opacity-0 cursor-pointer disabled:cursor-default"
              aria-label="Halaman sebelumnya"
            />

            {/* Right click zone */}
            <button
              type="button"
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="absolute right-0 top-0 h-full w-1/3 opacity-0 cursor-pointer disabled:cursor-default"
              aria-label="Halaman berikutnya"
            />

            {/* Arrow buttons */}
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 disabled:opacity-30 transition-all z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 disabled:opacity-30 transition-all z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Page counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-mono px-3 py-1 rounded-full">
              {currentPage + 1} / {totalPages}
            </div>

            {/* Chapter navigation at last page */}
            {currentPage === totalPages - 1 && nextChapter && (
              <Link
                to="/comic/$id/chapter/$chapterId"
                params={{ id, chapterId: nextChapter.id.toString() }}
                className="absolute bottom-14 left-1/2 -translate-x-1/2"
              >
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
                  Chapter {nextChapter.chapterNumber} →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
