import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Globe,
  HardDrive,
  ImageOff,
  Images,
  Loader2,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Chapter, Comic } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateChapter,
  useCreateComic,
  useDeleteAllChapterPages,
  useDeleteComic,
  useDeleteComicCover,
  useDeletePage,
  useFetchMangaDexChapterPages,
  useFetchMangaDexChapters,
  useGrabChapterPages,
  useGrabChapterPagesViaSupadata,
  useImportFromMangaDex,
  useIsAdmin,
  useListChapters,
  useListComics,
  useListPages,
  useUpdateComic,
} from "../hooks/useQueries";
import { PLACEHOLDER_COVER } from "../utils/blobUrl";

const GENRES_LIST = [
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

// ─── ComicForm Component ──────────────────────────────────────────────────────

interface ComicFormData {
  title: string;
  genres: string[];
  status: string;
  synopsis: string;
  isExplicit: boolean;
  coverUrl: string;
  sourceType: string;
}

const EMPTY_FORM: ComicFormData = {
  title: "",
  genres: [],
  status: "ongoing",
  synopsis: "",
  isExplicit: false,
  coverUrl: "",
  sourceType: "manual",
};

function comicToForm(c: Comic): ComicFormData {
  return {
    title: c.title,
    genres: c.genres,
    status: c.status,
    synopsis: c.synopsis,
    isExplicit: c.isExplicit,
    coverUrl: c.coverBlobId ?? "",
    sourceType: c.sourceType,
  };
}

interface ComicFormProps {
  initial?: ComicFormData;
  onSubmit: (data: ComicFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
}

function ComicForm({
  initial = EMPTY_FORM,
  onSubmit,
  isSubmitting,
  submitLabel,
}: ComicFormProps) {
  const [form, setForm] = useState<ComicFormData>(initial);

  const handleGenreToggle = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Judul tidak boleh kosong");
      return;
    }
    await onSubmit(form);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Judul *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Judul komik"
            className="bg-secondary border-border text-foreground"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
          >
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="hiatus">Hiatus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Sinopsis</Label>
        <Textarea
          value={form.synopsis}
          onChange={(e) => setForm((p) => ({ ...p, synopsis: e.target.value }))}
          placeholder="Deskripsi singkat komik..."
          className="bg-secondary border-border text-foreground resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Genre</Label>
        <div className="flex flex-wrap gap-2">
          {GENRES_LIST.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => handleGenreToggle(g)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                form.genres.includes(g)
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">URL Cover Image</Label>
        <Input
          value={form.coverUrl}
          onChange={(e) => setForm((p) => ({ ...p, coverUrl: e.target.value }))}
          placeholder="https://example.com/cover.jpg"
          className="bg-secondary border-border text-foreground"
        />
        {form.coverUrl && (
          <div className="flex items-center gap-2 mt-1">
            <img
              src={form.coverUrl}
              alt="Preview cover"
              className="h-16 w-12 object-cover rounded border border-border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <p className="text-xs text-muted-foreground">Preview cover</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.isExplicit}
          onCheckedChange={(checked) =>
            setForm((p) => ({ ...p, isExplicit: checked }))
          }
          id="explicit"
        />
        <Label htmlFor="explicit" className="text-foreground cursor-pointer">
          Konten 18+ (eksplisit)
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        {submitLabel}
      </Button>
    </form>
  );
}

// ─── Daftar Komik Tab ─────────────────────────────────────────────────────────

function DaftarKomikTab() {
  const { data: comics = [], isLoading } = useListComics(
    BigInt(0),
    BigInt(100),
    "latest",
  );
  const deleteComic = useDeleteComic();
  const updateComic = useUpdateComic();

  const [editComic, setEditComic] = useState<Comic | null>(null);

  const handleDelete = async (id: bigint, title: string) => {
    if (!confirm(`Hapus komik "${title}"?`)) return;
    try {
      await deleteComic.mutateAsync(id);
      toast.success("Komik berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus komik");
    }
  };

  const handleUpdate = async (data: ComicFormData) => {
    if (!editComic) return;
    try {
      await updateComic.mutateAsync({
        id: editComic.id,
        title: data.title,
        coverBlobId: data.coverUrl || null,
        genres: data.genres,
        status: data.status.toLowerCase(),
        synopsis: data.synopsis,
        sourceType: data.sourceType,
        isExplicit: data.isExplicit,
      });
      toast.success("Komik berhasil diperbarui");
      setEditComic(null);
    } catch {
      toast.error("Gagal memperbarui komik");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {["t1", "t2", "t3"].map((id) => (
          <Skeleton key={id} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Judul</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">
                Genre
              </TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">
                Views
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comics.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Belum ada komik
                </TableCell>
              </TableRow>
            ) : (
              comics.map((comic) => (
                <TableRow
                  key={comic.id.toString()}
                  className="border-border hover:bg-secondary/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate max-w-[160px]">
                        {comic.title}
                      </span>
                      {comic.isExplicit && (
                        <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1 py-0">
                          18+
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        comic.status.toLowerCase() === "ongoing"
                          ? "border-primary text-primary"
                          : "border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      {comic.status.charAt(0).toUpperCase() +
                        comic.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                    {comic.genres.slice(0, 2).join(", ")}
                    {comic.genres.length > 2 ? "..." : ""}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                    {comic.viewCount.toString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditComic(comic)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => void handleDelete(comic.id, comic.title)}
                        disabled={deleteComic.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editComic} onOpenChange={(o) => !o && setEditComic(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground tracking-widest">
              EDIT KOMIK
            </DialogTitle>
          </DialogHeader>
          {editComic && (
            <ComicForm
              initial={comicToForm(editComic)}
              onSubmit={handleUpdate}
              isSubmitting={updateComic.isPending}
              submitLabel="Simpan Perubahan"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Chapter Pages Grab List ──────────────────────────────────────────────────

interface ChapterGrabRowProps {
  chapter: Chapter;
  onGrab: (chapterId: bigint) => Promise<void>;
  isGrabbing: boolean;
  grabbed: boolean;
  failed: boolean;
}

function ChapterGrabRow({
  chapter,
  onGrab,
  isGrabbing,
  grabbed,
  failed,
}: ChapterGrabRowProps) {
  const hasMangaDexId = !!chapter.mangadexChapterId;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-secondary/60 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
          Ch.{chapter.chapterNumber}
        </span>
        {chapter.title ? (
          <span className="text-sm text-foreground truncate">
            {chapter.title}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/60 italic">
            Tanpa judul
          </span>
        )}
        {hasMangaDexId && (
          <Badge className="bg-primary/20 text-primary border border-primary/30 text-[9px] px-1 py-0 shrink-0">
            MDX
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {grabbed && !isGrabbing && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {failed && !isGrabbing && (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => void onGrab(chapter.id)}
          disabled={!hasMangaDexId || isGrabbing}
          className={`h-7 text-xs ${
            hasMangaDexId
              ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              : "border-border text-muted-foreground cursor-not-allowed opacity-50"
          }`}
        >
          {isGrabbing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Images className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Import MangaDex Tab ──────────────────────────────────────────────────────

function ImportMangaDexTab() {
  const [mangadexInput, setMangadexInput] = useState("");
  const [importedComicId, setImportedComicId] = useState<bigint | null>(null);
  const [importedMangadexId, setImportedMangadexId] = useState<string>("");
  const [chaptersFetched, setChaptersFetched] = useState(false);
  const [grabbingChapterId, setGrabbingChapterId] = useState<bigint | null>(
    null,
  );
  const [grabbedIds, setGrabbedIds] = useState<Set<string>>(new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const importMutation = useImportFromMangaDex();
  const fetchChaptersMutation = useFetchMangaDexChapters();
  const fetchPagesMutation = useFetchMangaDexChapterPages();

  const { data: chapters = [], refetch: refetchChapters } = useListChapters(
    chaptersFetched ? importedComicId : null,
  );

  const extractMangaDexId = (input: string): string => {
    const match = input.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    return match ? match[1] : input.trim();
  };

  const handleImport = async () => {
    const mangadexId = extractMangaDexId(mangadexInput);
    if (!mangadexId) {
      toast.error("Masukkan ID atau URL MangaDex");
      return;
    }
    try {
      const comicId = await importMutation.mutateAsync(mangadexId);
      setImportedComicId(comicId);
      setImportedMangadexId(mangadexId);
      setChaptersFetched(false);
      setGrabbedIds(new Set());
      setFailedIds(new Set());
      toast.success(`Komik berhasil diimport! ID: ${comicId.toString()}`);
    } catch (err) {
      toast.error(
        `Gagal import: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleFetchChapters = async () => {
    if (!importedComicId || !importedMangadexId) return;
    try {
      await fetchChaptersMutation.mutateAsync({
        mangadexId: importedMangadexId,
        comicId: importedComicId,
      });
      setChaptersFetched(true);
      await refetchChapters();
      toast.success("Chapter berhasil diambil dari MangaDex");
    } catch (err) {
      toast.error(
        `Gagal ambil chapter: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleGrabChapterPages = async (chapterId: bigint) => {
    const idStr = chapterId.toString();
    setGrabbingChapterId(chapterId);
    setFailedIds((prev) => {
      const next = new Set(prev);
      next.delete(idStr);
      return next;
    });
    try {
      await fetchPagesMutation.mutateAsync(chapterId);
      setGrabbedIds((prev) => new Set(prev).add(idStr));
      toast.success("Halaman berhasil diambil");
    } catch (err) {
      setFailedIds((prev) => new Set(prev).add(idStr));
      toast.error(
        `Gagal grab halaman: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setGrabbingChapterId(null);
    }
  };

  const handleGrabAll = async () => {
    const eligible = chapters.filter((c) => !!c.mangadexChapterId);
    if (eligible.length === 0) {
      toast.error("Tidak ada chapter dengan MangaDex ID");
      return;
    }
    setBatchProgress({ current: 0, total: eligible.length });
    let done = 0;
    for (const chapter of eligible) {
      const idStr = chapter.id.toString();
      setGrabbingChapterId(chapter.id);
      setFailedIds((prev) => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
      try {
        await fetchPagesMutation.mutateAsync(chapter.id);
        setGrabbedIds((prev) => new Set(prev).add(idStr));
      } catch {
        setFailedIds((prev) => new Set(prev).add(idStr));
      } finally {
        done++;
        setBatchProgress({ current: done, total: eligible.length });
        setGrabbingChapterId(null);
      }
    }
    toast.success(`Selesai! ${eligible.length} chapter diproses`);
    setBatchProgress(null);
  };

  const sortedChapters = [...chapters].sort(
    (a, b) => a.chapterNumber - b.chapterNumber,
  );
  const eligibleCount = chapters.filter((c) => !!c.mangadexChapterId).length;
  const batchPct = batchProgress
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Step 1: Import */}
      <div className="p-4 rounded-lg bg-secondary border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
            1
          </span>
          <p className="text-sm font-semibold text-foreground">Import Komik</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Import metadata, cover, dan informasi komik dari MangaDex.
        </p>
        <div className="flex gap-2">
          <Input
            value={mangadexInput}
            onChange={(e) => setMangadexInput(e.target.value)}
            placeholder="https://mangadex.org/title/... atau UUID"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground flex-1"
          />
          <Button
            onClick={() => void handleImport()}
            disabled={importMutation.isPending || !mangadexInput.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-1.5" />
                Import
              </>
            )}
          </Button>
        </div>
        {importedComicId && (
          <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Komik diimport — Comic ID: {importedComicId.toString()}
          </p>
        )}
      </div>

      {/* Step 2: Fetch Chapters */}
      {importedComicId && (
        <div className="p-4 rounded-lg bg-secondary border border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              2
            </span>
            <p className="text-sm font-semibold text-foreground">
              Ambil Daftar Chapter
            </p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Ambil semua chapter dari MangaDex dan simpan ke database.
          </p>
          <Button
            onClick={() => void handleFetchChapters()}
            disabled={fetchChaptersMutation.isPending}
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {fetchChaptersMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            )}
            Ambil Chapter dari MangaDex
          </Button>
          {chaptersFetched && chapters.length > 0 && (
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {chapters.length} chapter tersedia
            </p>
          )}
        </div>
      )}

      {/* Step 3: Grab Pages */}
      {chaptersFetched && sortedChapters.length > 0 && (
        <div className="p-4 rounded-lg bg-secondary border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                3
              </span>
              <p className="text-sm font-semibold text-foreground">
                Grab Halaman
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {eligibleCount} chapter siap di-grab
              </span>
              <Button
                size="sm"
                onClick={() => void handleGrabAll()}
                disabled={
                  eligibleCount === 0 ||
                  batchProgress !== null ||
                  grabbingChapterId !== null
                }
                className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {batchProgress !== null ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    {batchProgress.current}/{batchProgress.total}
                  </>
                ) : (
                  <>
                    <Images className="h-3 w-3 mr-1" />
                    Grab Semua Halaman
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Batch progress bar */}
          {batchProgress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Memproses {batchProgress.current} / {batchProgress.total}{" "}
                  chapter
                </span>
                <span>{batchPct}%</span>
              </div>
              <Progress value={batchPct} className="h-1.5" />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Klik tombol <Images className="h-3 w-3 inline" /> untuk grab halaman
            per chapter, atau "Grab Semua Halaman" untuk sekaligus. Chapter
            tanpa badge{" "}
            <span className="text-primary font-bold text-[10px]">MDX</span>{" "}
            tidak dapat di-grab.
          </p>

          {/* Chapter list */}
          <div className="bg-background rounded-md border border-border overflow-hidden">
            <div className="max-h-80 overflow-y-auto custom-scroll divide-y divide-border">
              {sortedChapters.map((chapter) => (
                <ChapterGrabRow
                  key={chapter.id.toString()}
                  chapter={chapter}
                  onGrab={handleGrabChapterPages}
                  isGrabbing={grabbingChapterId === chapter.id}
                  grabbed={grabbedIds.has(chapter.id.toString())}
                  failed={failedIds.has(chapter.id.toString())}
                />
              ))}
            </div>
          </div>

          {/* Summary */}
          {(grabbedIds.size > 0 || failedIds.size > 0) && (
            <div className="flex gap-4 text-xs">
              {grabbedIds.size > 0 && (
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  {grabbedIds.size} berhasil
                </span>
              )}
              {failedIds.size > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-3 w-3" />
                  {failedIds.size} gagal
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grabber Tab ──────────────────────────────────────────────────────────────

function GrabberTab() {
  const { data: comics = [] } = useListComics(BigInt(0), BigInt(100), "latest");
  const [selectedComicId, setSelectedComicId] = useState<string>("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [chapterFrom, setChapterFrom] = useState("1");
  const [chapterTo, setChapterTo] = useState("1");
  const [pageFrom, setPageFrom] = useState("1");
  const [pageTo, setPageTo] = useState("20");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [grabLog, setGrabLog] = useState<{ id: number; text: string }[]>([]);

  const grabMutation = useGrabChapterPages();
  const createChapterMutation = useCreateChapter();

  const selectedComic = comics.find((c) => c.id.toString() === selectedComicId);
  const { data: existingChapters = [] } = useListChapters(
    selectedComicId ? BigInt(selectedComicId) : null,
  );

  const handleGrab = async () => {
    if (!selectedComicId) {
      toast.error("Pilih komik terlebih dahulu");
      return;
    }
    if (!urlTemplate.includes("{ch}")) {
      toast.error("URL template harus mengandung {ch}");
      return;
    }
    if (!urlTemplate.includes("{page}")) {
      toast.error(
        "URL template harus mengandung {page} sebagai placeholder nomor halaman",
      );
      return;
    }

    const from = Number.parseInt(chapterFrom, 10);
    const to = Number.parseInt(chapterTo, 10);
    const pFrom = Number.parseInt(pageFrom, 10);
    const pTo = Number.parseInt(pageTo, 10);

    if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
      toast.error("Range chapter tidak valid");
      return;
    }
    if (Number.isNaN(pFrom) || Number.isNaN(pTo) || pFrom > pTo) {
      toast.error("Range halaman tidak valid");
      return;
    }

    const comicId = BigInt(selectedComicId);
    const total = to - from + 1;
    setProgress({ current: 0, total });
    setGrabLog([]);
    let logId = 0;
    const addLog = (text: string) => {
      const id = logId++;
      setGrabLog((prev) => [...prev, { id, text }]);
    };

    for (let ch = from; ch <= to; ch++) {
      const resolvedUrl = urlTemplate.replace("{ch}", ch.toString());
      addLog(`Memproses Chapter ${ch}...`);

      // Check if chapter already exists
      const existing = existingChapters.find((ec) => ec.chapterNumber === ch);
      let chapterId: bigint;

      if (existing) {
        chapterId = existing.id;
        addLog(`  → Chapter ${ch} sudah ada (ID: ${chapterId.toString()})`);
      } else {
        try {
          chapterId = await createChapterMutation.mutateAsync({
            comicId,
            chapterNumber: ch,
            title: "",
          });
          addLog(`  → Chapter ${ch} dibuat (ID: ${chapterId.toString()})`);
        } catch (err) {
          addLog(`  ✗ Gagal membuat chapter ${ch}: ${String(err)}`);
          setProgress((p) => (p ? { ...p, current: p.current + 1 } : null));
          continue;
        }
      }

      try {
        await grabMutation.mutateAsync({
          comicId,
          chapterId,
          urlTemplate: resolvedUrl,
          pageStart: BigInt(pFrom),
          pageEnd: BigInt(pTo),
        });
        addLog(`  ✓ Chapter ${ch} selesai di-grab`);
      } catch (err) {
        addLog(
          `  ✗ Gagal grab chapter ${ch}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      setProgress((p) => (p ? { ...p, current: p.current + 1 } : null));
    }

    setProgress((p) => (p ? { ...p, current: p.total } : null));
    toast.success("Proses grabbing selesai!");
  };

  const grabPct = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-secondary border border-border">
        <p className="text-sm text-muted-foreground mb-4">
          Ambil halaman komik dari situs lain. Masukkan URL template dengan{" "}
          <code className="bg-background px-1 py-0.5 rounded text-xs text-primary font-mono">
            {"{ch}"}
          </code>{" "}
          untuk chapter dan{" "}
          <code className="bg-background px-1 py-0.5 rounded text-xs text-primary font-mono">
            {"{page}"}
          </code>{" "}
          untuk nomor halaman. Contoh:{" "}
          <code className="bg-background px-1 py-0.5 rounded text-xs text-muted-foreground font-mono">
            https://example.com/chapter-{"{ch}"}/{"{page}"}.jpg
          </code>
        </p>

        <div className="space-y-4">
          {/* Comic select */}
          <div className="space-y-1.5">
            <Label className="text-foreground">Pilih Komik</Label>
            <Select value={selectedComicId} onValueChange={setSelectedComicId}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Pilih komik..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {comics.map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL template */}
          <div className="space-y-1.5">
            <Label className="text-foreground">URL Template</Label>
            <Input
              value={urlTemplate}
              onChange={(e) => setUrlTemplate(e.target.value)}
              placeholder="https://example.com/manga/chapter-{ch}/{page}.jpg"
              className="bg-background border-border text-foreground font-mono text-sm placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Gunakan <code className="text-primary">{"{ch}"}</code> untuk nomor
              chapter dan <code className="text-primary">{"{page}"}</code> untuk
              nomor halaman. Contoh:{" "}
              <code className="text-primary/70">
                https://example.com/chapter-{"{ch}"}/{"{page}"}.jpg
              </code>
            </p>
          </div>

          {/* Chapter range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">Dari Chapter</Label>
              <Input
                type="number"
                min="1"
                value={chapterFrom}
                onChange={(e) => setChapterFrom(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Sampai Chapter</Label>
              <Input
                type="number"
                min="1"
                value={chapterTo}
                onChange={(e) => setChapterTo(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          {/* Page range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">Dari Halaman</Label>
              <Input
                type="number"
                min="1"
                value={pageFrom}
                onChange={(e) => setPageFrom(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Sampai Halaman</Label>
              <Input
                type="number"
                min="1"
                value={pageTo}
                onChange={(e) => setPageTo(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Chapter {progress.current} / {progress.total}
                </span>
                <span>{grabPct}%</span>
              </div>
              <Progress value={grabPct} className="h-2" />
            </div>
          )}

          {/* Log */}
          {grabLog.length > 0 && (
            <div className="bg-background rounded-md p-3 max-h-40 overflow-y-auto custom-scroll">
              {grabLog.map((entry) => (
                <p
                  key={entry.id}
                  className="text-xs font-mono text-muted-foreground"
                >
                  {entry.text}
                </p>
              ))}
            </div>
          )}

          <Button
            onClick={() => void handleGrab()}
            disabled={
              grabMutation.isPending ||
              createChapterMutation.isPending ||
              !selectedComicId ||
              !urlTemplate
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            {grabMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Mulai Grab
          </Button>
        </div>
      </div>

      {selectedComic && (
        <div className="text-xs text-muted-foreground">
          Komik dipilih:{" "}
          <span className="text-foreground font-semibold">
            {selectedComic.title}
          </span>{" "}
          — {existingChapters.length} chapter tersedia
        </div>
      )}
    </div>
  );
}

// ─── Tambah Manual Tab ────────────────────────────────────────────────────────

function TambahManualTab() {
  const createComic = useCreateComic();
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();

  const handleCreate = async (data: ComicFormData) => {
    if (!actor) {
      toast.error("Backend belum siap, coba lagi sebentar");
      return;
    }
    try {
      const id = await createComic.mutateAsync({
        title: data.title,
        coverBlobId: data.coverUrl || null,
        genres: data.genres,
        status: data.status.toLowerCase(),
        synopsis: data.synopsis,
        sourceType: data.sourceType,
        isExplicit: data.isExplicit,
      });
      toast.success(`Komik "${data.title}" berhasil ditambahkan!`);
      void navigate({ to: "/comic/$id", params: { id: id.toString() } });
    } catch (err) {
      toast.error(
        `Gagal membuat komik: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  if (actorFetching) {
    return (
      <div className="p-4 rounded-lg bg-secondary border border-border flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">
          Menghubungkan ke backend...
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-secondary border border-border">
      <ComicForm
        onSubmit={handleCreate}
        isSubmitting={createComic.isPending}
        submitLabel="Tambah Komik"
      />
    </div>
  );
}

// ─── Supadata Scraper Tab ─────────────────────────────────────────────────────

function SupadataScraperTab() {
  const { data: comics = [] } = useListComics(BigInt(0), BigInt(100), "latest");
  const [selectedComicId, setSelectedComicId] = useState<string>("");
  const [urlTemplate, setUrlTemplate] = useState("");
  const [chapterFrom, setChapterFrom] = useState("1");
  const [chapterTo, setChapterTo] = useState("1");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [scrapeLog, setScrapeLog] = useState<{ id: number; text: string }[]>(
    [],
  );

  const scrapeMutation = useGrabChapterPagesViaSupadata();
  const createChapterMutation = useCreateChapter();

  const selectedComic = comics.find((c) => c.id.toString() === selectedComicId);
  const { data: existingChapters = [] } = useListChapters(
    selectedComicId ? BigInt(selectedComicId) : null,
  );

  const handleScrape = async () => {
    if (!selectedComicId) {
      toast.error("Pilih komik terlebih dahulu");
      return;
    }
    if (!urlTemplate.includes("{ch}")) {
      toast.error("URL template harus mengandung {ch}");
      return;
    }

    const from = Number.parseInt(chapterFrom, 10);
    const to = Number.parseInt(chapterTo, 10);

    if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
      toast.error("Range chapter tidak valid");
      return;
    }

    const comicId = BigInt(selectedComicId);
    const total = to - from + 1;
    setProgress({ current: 0, total });
    setScrapeLog([]);
    let logId = 0;
    const addLog = (text: string) => {
      const id = logId++;
      setScrapeLog((prev) => [...prev, { id, text }]);
    };

    for (let ch = from; ch <= to; ch++) {
      const resolvedUrl = urlTemplate.replace("{ch}", ch.toString());
      addLog(`Memproses Chapter ${ch}...`);

      // Check if chapter already exists
      const existing = existingChapters.find((ec) => ec.chapterNumber === ch);
      let chapterId: bigint;

      if (existing) {
        chapterId = existing.id;
        addLog(`  → Chapter ${ch} sudah ada (ID: ${chapterId.toString()})`);
      } else {
        try {
          chapterId = await createChapterMutation.mutateAsync({
            comicId,
            chapterNumber: ch,
            title: "",
          });
          addLog(`  → Chapter ${ch} dibuat (ID: ${chapterId.toString()})`);
        } catch (err) {
          addLog(`  ✗ Gagal membuat chapter ${ch}: ${String(err)}`);
          setProgress((p) => (p ? { ...p, current: p.current + 1 } : null));
          continue;
        }
      }

      try {
        await scrapeMutation.mutateAsync({
          comicId,
          chapterId,
          chapterUrl: resolvedUrl,
        });
        addLog(`  ✓ Chapter ${ch} berhasil di-scrape via Supadata`);
      } catch (err) {
        addLog(
          `  ✗ Gagal scrape chapter ${ch}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      setProgress((p) => (p ? { ...p, current: p.current + 1 } : null));
    }

    setProgress((p) => (p ? { ...p, current: p.total } : null));
    toast.success("Proses scraping selesai!");
  };

  const scrapePct = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;
  const isScraping =
    scrapeMutation.isPending || createChapterMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-secondary border border-border">
        <p className="text-sm text-muted-foreground mb-4">
          Ambil halaman komik menggunakan{" "}
          <span className="text-primary font-semibold">
            Supadata Web Scraper
          </span>
          . Masukkan URL template dengan{" "}
          <code className="bg-background px-1 py-0.5 rounded text-xs text-primary font-mono">
            {"{ch}"}
          </code>{" "}
          untuk nomor chapter. Supadata akan otomatis mendeteksi dan mengekstrak
          gambar dari halaman. Contoh:{" "}
          <code className="bg-background px-1 py-0.5 rounded text-xs text-muted-foreground font-mono">
            https://example.com/manga/chapter-{"{ch}"}/
          </code>
        </p>

        <div className="space-y-4">
          {/* Comic select */}
          <div className="space-y-1.5">
            <Label className="text-foreground">Pilih Komik</Label>
            <Select value={selectedComicId} onValueChange={setSelectedComicId}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Pilih komik..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {comics.map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL template */}
          <div className="space-y-1.5">
            <Label className="text-foreground">URL Template Chapter</Label>
            <Input
              value={urlTemplate}
              onChange={(e) => setUrlTemplate(e.target.value)}
              placeholder="https://example.com/manga/chapter-{ch}/"
              className="bg-background border-border text-foreground font-mono text-sm placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Gunakan <code className="text-primary">{"{ch}"}</code> untuk nomor
              chapter. Supadata akan otomatis menemukan semua gambar di halaman
              tersebut.
            </p>
          </div>

          {/* Chapter range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">Dari Chapter</Label>
              <Input
                type="number"
                min="1"
                value={chapterFrom}
                onChange={(e) => setChapterFrom(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Sampai Chapter</Label>
              <Input
                type="number"
                min="1"
                value={chapterTo}
                onChange={(e) => setChapterTo(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Chapter {progress.current} / {progress.total}
                </span>
                <span>{scrapePct}%</span>
              </div>
              <Progress value={scrapePct} className="h-2" />
            </div>
          )}

          {/* Log */}
          {scrapeLog.length > 0 && (
            <div className="bg-background rounded-md p-3 max-h-40 overflow-y-auto custom-scroll">
              {scrapeLog.map((entry) => (
                <p
                  key={entry.id}
                  className="text-xs font-mono text-muted-foreground"
                >
                  {entry.text}
                </p>
              ))}
            </div>
          )}

          <Button
            onClick={() => void handleScrape()}
            disabled={isScraping || !selectedComicId || !urlTemplate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            {isScraping ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            Mulai Scrape
          </Button>
        </div>
      </div>

      {selectedComic && (
        <div className="text-xs text-muted-foreground">
          Komik dipilih:{" "}
          <span className="text-foreground font-semibold">
            {selectedComic.title}
          </span>{" "}
          — {existingChapters.length} chapter tersedia
        </div>
      )}
    </div>
  );
}

// ─── Blob Storage Tab ─────────────────────────────────────────────────────────

function getBlobDirectUrl(blobId: string): string {
  try {
    return ExternalBlob.fromURL(blobId).getDirectURL();
  } catch {
    return "";
  }
}

function truncateBlobId(blobId: string, maxLen = 28): string {
  if (blobId.length <= maxLen) return blobId;
  return `${blobId.slice(0, 12)}…${blobId.slice(-10)}`;
}

interface BlobCardProps {
  blobId: string;
  label: string;
  sublabel?: string;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
}

function BlobCard({
  blobId,
  label,
  sublabel,
  onDelete,
  isDeleting,
}: BlobCardProps) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const directUrl = getBlobDirectUrl(blobId);

  const handleCopy = () => {
    void navigator.clipboard.writeText(blobId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    setConfirmDelete(false);
    if (onDelete) await onDelete();
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(false);
  };

  return (
    <div className="group relative flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors">
      {/* Thumbnail */}
      <div className="aspect-[2/3] relative bg-secondary overflow-hidden">
        {directUrl && !imgError ? (
          <img
            src={directUrl}
            alt={label}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
            <ImageOff className="h-8 w-8" />
            <span className="text-[10px] font-mono px-2 text-center">
              No preview
            </span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4 text-white" />
          </a>
        </div>
        {/* Delete loading overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-1.5 flex-1">
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground font-mono">
            {sublabel}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <code className="text-[9px] font-mono text-muted-foreground/70 truncate flex-1 bg-secondary rounded px-1 py-0.5">
            {truncateBlobId(blobId)}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            title="Salin Blob ID"
            className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            Buka
          </a>
          {onDelete && !confirmDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Hapus blob"
              className="flex items-center gap-0.5 text-[10px] text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Trash2 className="h-2.5 w-2.5" />
              )}
              Hapus
            </button>
          )}
          {onDelete && confirmDelete && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                className="text-[10px] text-destructive hover:text-destructive/80 font-semibold transition-colors"
              >
                Ya
              </button>
              <span className="text-[10px] text-muted-foreground">/</span>
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Chapter pages blob viewer – loads pages lazily when expanded
interface ChapterPagesBlobsProps {
  chapter: Chapter;
  comicTitle: string;
}

function ChapterPagesBlobs({ chapter, comicTitle }: ChapterPagesBlobsProps) {
  const [expanded, setExpanded] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<bigint | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const {
    data: pages = [],
    isLoading,
    refetch,
  } = useListPages(expanded ? chapter.id : null);

  const deletePageMutation = useDeletePage();
  const deleteAllPagesMutation = useDeleteAllChapterPages();

  const pagesWithBlobs = pages.filter((p) => !!p.blobId);

  const handleDeletePage = async (pageId: bigint) => {
    setDeletingPageId(pageId);
    try {
      await deletePageMutation.mutateAsync({ pageId, chapterId: chapter.id });
      toast.success("Halaman berhasil dihapus");
      void refetch();
    } catch {
      toast.error("Gagal menghapus halaman");
    } finally {
      setDeletingPageId(null);
    }
  };

  const handleDeleteAllPages = async () => {
    setConfirmDeleteAll(false);
    try {
      await deleteAllPagesMutation.mutateAsync(chapter.id);
      toast.success(`Semua halaman Chapter ${chapter.chapterNumber} dihapus`);
      void refetch();
    } catch {
      toast.error("Gagal menghapus semua halaman");
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary hover:bg-secondary/80 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            Ch.{chapter.chapterNumber}
          </span>
          <span className="text-sm text-foreground truncate">
            {chapter.title || `Chapter ${chapter.chapterNumber}`}
          </span>
          {!expanded && (
            <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">
              — {comicTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {expanded && !isLoading && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {pagesWithBlobs.length} blob
            </span>
          )}
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
          ) : expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-3 bg-background space-y-3">
          {/* Delete all chapter pages button */}
          {!isLoading && pagesWithBlobs.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {pagesWithBlobs.length} halaman tersimpan
              </span>
              {!confirmDeleteAll ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setConfirmDeleteAll(true)}
                  disabled={deleteAllPagesMutation.isPending}
                >
                  {deleteAllPagesMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Hapus Semua Halaman
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive font-medium">
                    Yakin hapus semua?
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 text-xs px-2"
                    onClick={() => void handleDeleteAllPages()}
                    disabled={deleteAllPagesMutation.isPending}
                  >
                    Ya, Hapus
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2 border-border"
                    onClick={() => setConfirmDeleteAll(false)}
                  >
                    Batal
                  </Button>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
                <div
                  key={k}
                  className="aspect-[2/3] rounded-md overflow-hidden"
                >
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          ) : pagesWithBlobs.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground/50">
              <HardDrive className="h-8 w-8" />
              <p className="text-xs">Tidak ada halaman dengan blob ID</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {pagesWithBlobs
                .sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber))
                .map((page) => (
                  <BlobCard
                    key={page.id.toString()}
                    blobId={page.blobId}
                    label={`Hal. ${page.pageNumber.toString()}`}
                    sublabel={`Ch.${chapter.chapterNumber} • ${truncateBlobId(page.blobId, 12)}`}
                    onDelete={() => handleDeletePage(page.id)}
                    isDeleting={deletingPageId === page.id}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Comic chapters blob viewer
interface ComicChaptersBlobsProps {
  comic: Comic;
}

function ComicChaptersBlobs({ comic }: ComicChaptersBlobsProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: chapters = [], isLoading } = useListChapters(
    expanded ? comic.id : null,
  );

  const deleteComicCoverMutation = useDeleteComicCover();

  const sortedChapters = [...chapters].sort(
    (a, b) => a.chapterNumber - b.chapterNumber,
  );

  const handleDeleteCover = async () => {
    if (!confirm(`Hapus cover blob komik "${comic.title}"?`)) return;
    try {
      await deleteComicCoverMutation.mutateAsync(comic.id);
      toast.success("Cover berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus cover");
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-secondary">
        <button
          type="button"
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {comic.coverBlobId ? (
              <img
                src={getBlobDirectUrl(comic.coverBlobId)}
                alt={comic.title}
                className="h-8 w-6 object-cover rounded shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_COVER;
                }}
              />
            ) : (
              <div className="h-8 w-6 bg-background rounded shrink-0 flex items-center justify-center">
                <ImageOff className="h-3 w-3 text-muted-foreground/40" />
              </div>
            )}
            <span className="text-sm font-medium text-foreground truncate">
              {comic.title}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {expanded && !isLoading && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {chapters.length} chapter
            </span>
          )}
          {/* Hapus Cover button */}
          {comic.coverBlobId && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              onClick={() => void handleDeleteCover()}
              disabled={deleteComicCoverMutation.isPending}
              title="Hapus cover blob"
            >
              {deleteComicCoverMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span className="ml-1 hidden sm:inline">Hapus Cover</span>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 bg-background space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {["c1", "c2", "c3"].map((k) => (
                <Skeleton key={k} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : sortedChapters.length === 0 ? (
            <div className="py-4 flex flex-col items-center gap-2 text-muted-foreground/50">
              <p className="text-xs">Belum ada chapter</p>
            </div>
          ) : (
            sortedChapters.map((chapter) => (
              <ChapterPagesBlobs
                key={chapter.id.toString()}
                chapter={chapter}
                comicTitle={comic.title}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BlobStorageTab() {
  const { data: comics = [], isLoading: comicsLoading } = useListComics(
    BigInt(0),
    BigInt(100),
    "latest",
  );

  const deleteComicCoverMutation = useDeleteComicCover();

  const comicsWithCover = comics.filter((c) => !!c.coverBlobId);

  const handleDeleteCoverFromGrid = async (comicId: bigint, title: string) => {
    try {
      await deleteComicCoverMutation.mutateAsync(comicId);
      toast.success(`Cover "${title}" berhasil dihapus`);
    } catch {
      toast.error("Gagal menghapus cover");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header info */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary border border-border">
        <HardDrive className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Blob Storage Browser
          </p>
          <p className="text-xs text-muted-foreground">
            Lihat semua gambar yang tersimpan di blob storage Caffeine. Cover
            komik ditampilkan langsung. Klik komik untuk melihat blob halaman
            chapter-nya, lengkap dengan tombol hapus per-halaman.
          </p>
        </div>
      </div>

      {/* Section 1: Cover Komik */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Cover Komik
          </h2>
          {!comicsLoading && (
            <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
              {comicsWithCover.length}
            </span>
          )}
        </div>

        {comicsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"].map((k) => (
              <div key={k} className="aspect-[2/3] rounded-lg overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        ) : comicsWithCover.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground/50 border border-dashed border-border rounded-lg">
            <ImageOff className="h-10 w-10" />
            <p className="text-sm">
              Belum ada cover komik yang tersimpan di blob
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {comicsWithCover.map((comic) => (
              <BlobCard
                key={comic.id.toString()}
                blobId={comic.coverBlobId!}
                label={comic.title}
                sublabel="Cover"
                onDelete={() =>
                  handleDeleteCoverFromGrid(comic.id, comic.title)
                }
                isDeleting={deleteComicCoverMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Halaman Chapter */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            Halaman Chapter
          </h2>
          {!comicsLoading && (
            <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
              {comics.length} komik
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Klik komik untuk melihat chapter-nya, lalu klik chapter untuk melihat
          blob halaman.
        </p>

        {comicsLoading ? (
          <div className="space-y-2">
            {["r1", "r2", "r3", "r4"].map((k) => (
              <Skeleton key={k} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : comics.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground/50 border border-dashed border-border rounded-lg">
            <HardDrive className="h-10 w-10" />
            <p className="text-sm">Belum ada komik</p>
          </div>
        ) : (
          <div className="space-y-2">
            {comics.map((comic) => (
              <ComicChaptersBlobs key={comic.id.toString()} comic={comic} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── AdminPage ────────────────────────────────────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { isLoading: adminLoading } = useIsAdmin();
  const { actor, isFetching: actorFetching } = useActor();

  // Redirect if not logged in
  if (!identity) {
    void navigate({ to: "/" });
    return null;
  }

  if (adminLoading || actorFetching) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            {actorFetching
              ? "Menghubungkan ke backend..."
              : "Memuat data admin..."}
          </p>
        </div>
      </main>
    );
  }

  if (!actor) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-sm text-destructive">
            Gagal terhubung ke backend. Coba refresh halaman.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-widest text-foreground">
          ADMIN <span className="text-primary">PANEL</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola konten MangaKu
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-secondary border border-border h-auto flex flex-wrap gap-0.5 p-1">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Daftar Komik
          </TabsTrigger>
          <TabsTrigger
            value="mangadex"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Import MangaDex
          </TabsTrigger>
          <TabsTrigger
            value="grabber"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
            Grabber
          </TabsTrigger>
          <TabsTrigger
            value="supadata"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs"
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Supadata Scraper
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Tambah Manual
          </TabsTrigger>
          <TabsTrigger
            value="blob"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs"
          >
            <HardDrive className="h-3.5 w-3.5 mr-1.5" />
            Blob Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <DaftarKomikTab />
        </TabsContent>
        <TabsContent value="mangadex">
          <ImportMangaDexTab />
        </TabsContent>
        <TabsContent value="grabber">
          <GrabberTab />
        </TabsContent>
        <TabsContent value="supadata">
          <SupadataScraperTab />
        </TabsContent>
        <TabsContent value="manual">
          <TambahManualTab />
        </TabsContent>
        <TabsContent value="blob">
          <BlobStorageTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
