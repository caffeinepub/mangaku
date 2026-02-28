# MangaKu

## Current State
MangaKu adalah platform webkomik dengan backend Motoko dan frontend React. Admin panel sudah memiliki tab "Blob Storage" yang menampilkan cover komik dan halaman chapter. Backend saat ini memiliki fungsi `deleteComic`, `deleteChapter`, dan `deleteComment`, tetapi belum ada fungsi untuk menghapus halaman (Page) individual, menghapus semua halaman dalam satu chapter, atau menghapus cover komik.

## Requested Changes (Diff)

### Add
- Backend: `deletePage(pageId: Nat)` -- hapus satu halaman berdasarkan page ID (admin only)
- Backend: `deleteAllChapterPages(chapterId: Nat)` -- hapus semua halaman dalam satu chapter (admin only)
- Backend: `deleteComicCover(comicId: Nat)` -- hapus cover komik (set coverBlobId ke null) (admin only)
- Frontend: Tombol hapus per halaman di tab Blob Storage
- Frontend: Tombol "Hapus Semua Halaman" per chapter di tab Blob Storage
- Frontend: Tombol "Hapus Cover" per komik di tab Blob Storage

### Modify
- Frontend: BlobStorageTab diupdate untuk menampilkan tombol hapus dengan konfirmasi sebelum menghapus

### Remove
- Tidak ada

## Implementation Plan
1. Regenerate backend Motoko dengan menambahkan tiga fungsi hapus baru: `deletePage`, `deleteAllChapterPages`, `deleteComicCover`
2. Update frontend BlobStorageTab untuk:
   - Tambah tombol hapus cover di setiap item komik
   - Tambah tombol "Hapus Semua Halaman" di setiap chapter
   - Tambah tombol hapus per halaman individual
   - Konfirmasi sebelum menghapus
   - Refresh data setelah hapus berhasil
