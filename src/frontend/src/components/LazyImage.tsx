import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export function LazyImage({
  src,
  alt,
  className = "",
  aspectRatio = "2/3",
}: LazyImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset visibility + state whenever src changes, then re-observe
  // biome-ignore lint/correctness/useExhaustiveDependencies: src is an intentional dependency to reset state when image changes
  useEffect(() => {
    setInView(false);
    setLoaded(false);
    setError(false);

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio }}>
      {/* Skeleton shown until image is loaded */}
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2">
          <ImageOff className="h-8 w-8 opacity-50" />
          <span className="text-xs opacity-70">Gagal memuat gambar</span>
        </div>
      )}

      {/* Actual image — src only set once element is near viewport */}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(false);
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
