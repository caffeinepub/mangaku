import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Download,
  Search,
  ArrowDownToLine,
  BookOpen,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useListComics,
  useIsAdmin,
  useCreateComic,
  useUpdateComic,
  useDeleteComic,
  useImportFromMangaDex,
  useFetchMangaDexChapters,
  useGrabChapterPages,
  useListChapters,
  useCreateChapter,
} from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { Comic } from "../backend.d";

const GENRES_LIST = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller", "Isekai", "Martial Arts",
];

// ─── ComicForm Component ──────────────────────────────────────────────────────

interface ComicFormData {
  title: string;
  genres: string[];
  status: string;
  synopsis: string;
  isExplicit: boolean;
  coverBlobId: string | null;
  sourceType: string;
}

const EMPTY_FORM: ComicFormData = {
  title: "",
  genres: [],
  status: "Ongoing",
  synopsis: "",
  isExplicit: false,
  coverBlobId: null,
  sourceType: "manual",
};

function comicToForm(c: Comic): ComicFormData {
  return {
    title: c.title,
    genres: c.genres,
    status: c.status,
    synopsis: c.synopsis,
    isExplicit: c.isExplicit,
    coverBlobId: c.coverBlobId ?? null,
    sourceType: c.sourceType,
  };
}

interface ComicFormProps {
  initial?: ComicFormData;
  onSubmit: (data: ComicFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
}

function ComicForm({ initial = EMPTY_FORM, onSubmit, isSubmitting, submitLabel }: ComicFormProps) {
  const [form, setForm] = useState<ComicFormData>(initial);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleGenreToggle = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      // Create a data URL for preview/storage
      // The actual blob storage integration happens when the comic is saved via the actor
      // We store the file as a local object URL placeholder; in production use StorageClient
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setUploadProgress(100);
      // Store as data URL - the backend's createComic will use this as coverBlobId
      setForm((prev) => ({ ...prev, coverBlobId: dataUrl }));
      setUploadProgress(null);
      toast.success("Cover berhasil dipilih");
    } catch {
      setUploadProgress(null);
      toast.error("Gagal memproses cover");
    }
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
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Hiatus">Hiatus</SelectItem>
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
        <Label className="text-foreground">Cover Image</Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => void handleCoverUpload(e)}
          className="text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-secondary file:text-foreground hover:file:bg-accent"
        />
        {uploadProgress !== null && (
          <Progress value={uploadProgress} className="h-1.5" />
        )}
        {form.coverBlobId && (
          <p className="text-xs text-muted-foreground truncate">
            ✓ Cover tersimpan
          </p>
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
  const { data: comics = [], isLoading } = useListComics(BigInt(0), BigInt(100), "latest");
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
        ...data,
        genres: data.genres,
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
        {["t1","t2","t3"].map((id) => <Skeleton key={id} className="h-12 w-full" />)}
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
              <TableHead className="text-muted-foreground hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Genre</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Views</TableHead>
              <TableHead className="text-muted-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Belum ada komik
                </TableCell>
              </TableRow>
            ) : (
              comics.map((comic) => (
                <TableRow key={comic.id.toString()} className="border-border hover:bg-secondary/50">
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
                        comic.status === "Ongoing"
                          ? "border-primary text-primary"
                          : "border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      {comic.status}
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

// ─── Import MangaDex Tab ──────────────────────────────────────────────────────

function ImportMangaDexTab() {
  const [mangadexInput, setMangadexInput] = useState("");
  const [importedComicId, setImportedComicId] = useState<bigint | null>(null);
  const [importedMangadexId, setImportedMangadexId] = useState<string>("");

  const importMutation = useImportFromMangaDex();
  const fetchChaptersMutation = useFetchMangaDexChapters();

  const extractMangaDexId = (input: string): string => {
    // Try to extract ID from URL like https://mangadex.org/title/UUID or just UUID
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
      toast.success(`Komik berhasil diimport! ID: ${comicId.toString()}`);
    } catch (err) {
      toast.error(`Gagal import: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFetchChapters = async () => {
    if (!importedComicId || !importedMangadexId) return;
    try {
      await fetchChaptersMutation.mutateAsync({
        mangadexId: importedMangadexId,
        comicId: importedComicId,
      });
      toast.success("Chapter berhasil diambil dari MangaDex");
    } catch (err) {
      toast.error(`Gagal ambil chapter: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-secondary border border-border">
        <p className="text-sm text-muted-foreground mb-4">
          Import komik dari MangaDex menggunakan ID atau URL. Metadata, cover, dan daftar chapter akan disimpan otomatis.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-foreground">ID / URL MangaDex</Label>
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
          </div>

          {importedComicId && (
            <div className="p-3 rounded-lg bg-background border border-primary/30">
              <p className="text-sm text-foreground font-semibold">
                ✓ Komik berhasil diimport
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Comic ID: {importedComicId.toString()}
              </p>
              <Button
                onClick={() => void handleFetchChapters()}
                disabled={fetchChaptersMutation.isPending}
                variant="outline"
                size="sm"
                className="mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {fetchChaptersMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                )}
                Ambil Chapter dari MangaDex
              </Button>
            </div>
          )}
        </div>
      </div>
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
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
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

    const from = parseInt(chapterFrom, 10);
    const to = parseInt(chapterTo, 10);
    const pFrom = parseInt(pageFrom, 10);
    const pTo = parseInt(pageTo, 10);

    if (isNaN(from) || isNaN(to) || from > to) {
      toast.error("Range chapter tidak valid");
      return;
    }
    if (isNaN(pFrom) || isNaN(pTo) || pFrom > pTo) {
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
          setProgress((p) => p ? { ...p, current: p.current + 1 } : null);
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
        addLog(`  ✗ Gagal grab chapter ${ch}: ${err instanceof Error ? err.message : String(err)}`);
      }

      setProgress((p) => p ? { ...p, current: p.current + 1 } : null);
    }

    setProgress((p) => (p ? { ...p, current: p.total } : null));
    toast.success("Proses grabbing selesai!");
  };

  const grabPct = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-secondary border border-border">
        <p className="text-sm text-muted-foreground mb-4">
          Ambil halaman komik dari situs lain. Masukkan URL template dengan{" "}
          <code className="bg-background px-1 py-0.5 rounded text-xs text-primary font-mono">
            {"{ch}"}
          </code>{" "}
          sebagai placeholder chapter.
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
              placeholder="https://example.com/manga/chapter-{ch}/page.jpg"
              className="bg-background border-border text-foreground font-mono text-sm placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Gunakan <code className="text-primary">{"{ch}"}</code> sebagai placeholder nomor chapter
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
                <p key={entry.id} className="text-xs font-mono text-muted-foreground">
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
          <span className="text-foreground font-semibold">{selectedComic.title}</span> —{" "}
          {existingChapters.length} chapter tersedia
        </div>
      )}
    </div>
  );
}

// ─── Tambah Manual Tab ────────────────────────────────────────────────────────

function TambahManualTab() {
  const createComic = useCreateComic();
  const navigate = useNavigate();

  const handleCreate = async (data: ComicFormData) => {
    try {
      const id = await createComic.mutateAsync({
        title: data.title,
        coverBlobId: data.coverBlobId,
        genres: data.genres,
        status: data.status,
        synopsis: data.synopsis,
        sourceType: data.sourceType,
        isExplicit: data.isExplicit,
      });
      toast.success(`Komik "${data.title}" berhasil ditambahkan!`);
      void navigate({ to: "/comic/$id", params: { id: id.toString() } });
    } catch (err) {
      toast.error(`Gagal membuat komik: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

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

// ─── AdminPage ────────────────────────────────────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  // Redirect non-admins
  if (!adminLoading && (!identity || !isAdmin)) {
    void navigate({ to: "/" });
    return null;
  }

  if (adminLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
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
            value="manual"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Tambah Manual
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
        <TabsContent value="manual">
          <TambahManualTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
