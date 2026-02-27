import { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Eye,
  Lock,
  ChevronRight,
  MessageSquare,
  Loader2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useGetComic,
  useListChapters,
  useListComments,
  useAddComment,
  useDeleteComment,
  useIncrementViewCount,
  useCallerUserProfile,
  useIsAdmin,
} from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { ExternalBlob } from "../backend";
import { PLACEHOLDER_COVER } from "../utils/blobUrl";
import { LoginModal } from "../components/LoginModal";

function getCoverUrl(blobId: string | undefined): string {
  if (!blobId) return PLACEHOLDER_COVER;
  try {
    return ExternalBlob.fromURL(blobId).getDirectURL();
  } catch {
    return PLACEHOLDER_COVER;
  }
}

export function ComicDetailPage() {
  const { id } = useParams({ from: "/main/comic/$id" });
  const comicId = BigInt(id);

  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: comic, isLoading: comicLoading } = useGetComic(comicId);
  const { data: chapters = [], isLoading: chaptersLoading } = useListChapters(comicId);
  const { data: comments = [], isLoading: commentsLoading } = useListComments(comicId);
  const { data: userProfile } = useCallerUserProfile();
  const { data: isAdmin } = useIsAdmin();

  const incrementView = useIncrementViewCount();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const [commentText, setCommentText] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Sort chapters by number descending
  const sortedChapters = [...chapters].sort(
    (a, b) => b.chapterNumber - a.chapterNumber,
  );

  // Increment view count once on mount
  const incrementViewMutate = incrementView.mutateAsync;
  useEffect(() => {
    if (comicId) {
      void incrementViewMutate(comicId).catch(() => {
        // Ignore view count errors
      });
    }
  }, [comicId, incrementViewMutate]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    if (!commentText.trim()) return;

    const username =
      userProfile?.name ?? identity?.getPrincipal().toString().slice(0, 8) ?? "User";

    try {
      await addComment.mutateAsync({ comicId, username, text: commentText });
      setCommentText("");
      toast.success("Komentar berhasil ditambahkan");
    } catch (err) {
      toast.error("Gagal menambahkan komentar");
    }
  };

  const handleDeleteComment = async (commentId: bigint) => {
    try {
      await deleteComment.mutateAsync(commentId);
      toast.success("Komentar dihapus");
    } catch {
      toast.error("Gagal menghapus komentar");
    }
  };

  const isExplicitAndLocked = comic?.isExplicit && !isAuthenticated;

  if (comicLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-6 flex-wrap">
          <Skeleton className="w-48 h-72 shrink-0" />
          <div className="flex-1 space-y-3 min-w-0">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (!comic) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Komik tidak ditemukan.</p>
      </main>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        {/* Comic Info */}
        <div className="flex gap-6 flex-wrap md:flex-nowrap mb-8">
          {/* Cover */}
          <div className="shrink-0 w-44 md:w-52">
            <div className="manga-card overflow-hidden">
              <img
                src={getCoverUrl(comic.coverBlobId)}
                alt={comic.title}
                className="w-full aspect-[2/3] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_COVER;
                }}
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-wider leading-tight">
                {comic.title}
              </h1>

              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  className={
                    comic.status === "Ongoing"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }
                >
                  {comic.status}
                </Badge>
                {comic.isExplicit && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    18+
                  </Badge>
                )}
                <Badge variant="outline" className="text-muted-foreground border-border">
                  {comic.sourceType}
                </Badge>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5">
              {comic.genres.map((genre) => (
                <Link
                  key={genre}
                  to="/search"
                  search={{ q: "", genre }}
                  className="text-xs px-2.5 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {comic.viewCount.toString()} views
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {chapters.length} chapter
              </span>
            </div>

            {/* Synopsis */}
            <p className="text-muted-foreground text-sm leading-relaxed max-w-prose">
              {comic.synopsis || "Tidak ada sinopsis."}
            </p>

            {/* Read button */}
            {sortedChapters.length > 0 && !isExplicitAndLocked && (
              <Link
                to="/comic/$id/chapter/$chapterId"
                params={{
                  id: comic.id.toString(),
                  chapterId: sortedChapters[sortedChapters.length - 1].id.toString(),
                }}
              >
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Mulai Baca
                </Button>
              </Link>
            )}
            {isExplicitAndLocked && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary border border-border">
                <Lock className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Konten 18+
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Login untuk mengakses konten dewasa ini.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                  className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Login
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-border mb-6" />

        {/* Chapter List */}
        <section className="mb-8">
          <h2 className="font-display text-2xl tracking-widest text-foreground mb-4">
            DAFTAR <span className="text-primary">CHAPTER</span>
          </h2>

          {chaptersLoading ? (
            <div className="space-y-2">
              {["c1","c2","c3","c4"].map((id) => (
                <Skeleton key={id} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedChapters.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Belum ada chapter yang tersedia.
            </p>
          ) : (
            <div className="space-y-1">
              {sortedChapters.map((chapter) => (
                <Link
                  key={chapter.id.toString()}
                  to="/comic/$id/chapter/$chapterId"
                  params={{
                    id: comic.id.toString(),
                    chapterId: chapter.id.toString(),
                  }}
                  className={`flex items-center justify-between p-3 rounded-md bg-secondary hover:bg-accent transition-colors group ${
                    isExplicitAndLocked ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      Chapter {chapter.chapterNumber}
                    </span>
                    {chapter.title && (
                      <span className="text-xs text-muted-foreground ml-2">
                        — {chapter.title}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <Separator className="bg-border mb-6" />

        {/* Comments Section */}
        <section>
          <h2 className="font-display text-2xl tracking-widest text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            KOMENTAR
            {comments.length > 0 && (
              <span className="text-muted-foreground text-base font-body font-normal">
                ({comments.length})
              </span>
            )}
          </h2>

          {/* Comment form */}
          <form onSubmit={(e) => void handleSubmitComment(e)} className="mb-6">
            <Textarea
              placeholder={
                isAuthenticated
                  ? "Tulis komentarmu di sini..."
                  : "Login untuk berkomentar"
              }
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!isAuthenticated}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none mb-2"
              rows={3}
            />
            <div className="flex justify-between items-center">
              {!isAuthenticated && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Login untuk berkomentar
                </Button>
              )}
              {isAuthenticated && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || addComment.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
                >
                  {addComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Kirim"
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Comments list */}
          {commentsLoading ? (
            <div className="space-y-3">
              {["cm1","cm2","cm3"].map((id) => (
                <Skeleton key={id} className="h-16 w-full" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Belum ada komentar. Jadilah yang pertama!
            </p>
          ) : (
            <div className="space-y-3">
              {[...comments]
                .sort((a, b) => Number(b.createdAt - a.createdAt))
                .map((comment) => (
                  <div
                    key={comment.id.toString()}
                    className="p-3 rounded-lg bg-secondary border border-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-primary">
                            {comment.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              Number(comment.createdAt / BigInt(1_000_000)),
                            ).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90">
                          {comment.text}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleDeleteComment(comment.id)
                          }
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          title="Hapus komentar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onLogin={login}
        isLoggingIn={isLoggingIn}
      />
    </>
  );
}
