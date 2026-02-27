import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Comic } from "../backend.d";
import { PLACEHOLDER_COVER } from "../utils/blobUrl";
import { ExternalBlob } from "../backend";

interface ComicCardProps {
  comic: Comic;
}

function getCoverUrl(blobId: string | undefined): string {
  if (!blobId) return PLACEHOLDER_COVER;
  try {
    return ExternalBlob.fromURL(blobId).getDirectURL();
  } catch {
    return PLACEHOLDER_COVER;
  }
}

export function ComicCard({ comic }: ComicCardProps) {
  return (
    <Link
      to="/comic/$id"
      params={{ id: comic.id.toString() }}
      className="group block"
    >
      <div className="manga-card bg-card overflow-hidden relative cursor-pointer">
        {/* Cover Image */}
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={getCoverUrl(comic.coverBlobId)}
            alt={comic.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_COVER;
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {comic.isExplicit && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 font-display tracking-wider">
                18+
              </Badge>
            )}
            {comic.status === "Ongoing" && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 font-mono">
                ONGOING
              </Badge>
            )}
            {comic.status === "Completed" && (
              <Badge className="bg-secondary text-muted-foreground text-[10px] px-1.5 py-0.5 font-mono">
                DONE
              </Badge>
            )}
          </div>

          {/* View count */}
          <div className="absolute bottom-2 right-2 text-[10px] text-white/60 font-mono">
            {comic.viewCount.toString()} views
          </div>
        </div>

        {/* Title */}
        <div className="p-2">
          <h3 className="text-foreground text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {comic.title}
          </h3>
          {comic.genres.length > 0 && (
            <p className="text-muted-foreground text-[11px] mt-1 truncate">
              {comic.genres.slice(0, 3).join(", ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ComicCardSkeleton() {
  return (
    <div className="manga-card bg-card overflow-hidden">
      <div className="aspect-[2/3]">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-2 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
