# MangaKu

## Current State

MangaKu adalah platform webkomik dengan fitur:
- Tampilan publik: grid komik, pencarian, reader vertikal/horizontal
- Admin Panel dengan tab: Daftar Komik, Import MangaDex, Grabber (HTTP outcall manual), Tambah Manual
- Backend Motoko dengan HTTP outcall ke MangaDex API
- Grabber manual: menggunakan URL template `{ch}` dan `{page}`, backend `grabChapterPages` menyimpan URL halaman

## Requested Changes (Diff)

### Add
- Backend: fungsi `grabChapterPagesViaSupadata(comicId, chapterId, chapterUrl)` -- melakukan HTTP outcall ke Supadata REST API (`https://api.supadata.ai/v1/web/scrape`) dengan API key `sd_ebc3b947dbf2c889f118481a5d38e284`, scrape halaman HTML chapter, parse URL gambar dari response, simpan ke pages
- Frontend: Tab baru "Supadata Scraper" di Admin Panel dengan:
  - Pilih komik
  - Input URL chapter (satu URL per baris, dengan placeholder `{ch}` opsional)
  - Input range chapter (Dari - Sampai)
  - Tombol "Mulai Scrape"
  - Progress bar dan log per chapter
  - Sistem auto-create chapter jika belum ada

### Modify
- Backend `main.mo`: Tambah fungsi `grabChapterPagesViaSupadata` yang memanggil Supadata API via HTTP outcall
- Frontend `AdminPage.tsx`: Tambah tab "Supadata Scraper" di antara Grabber dan Tambah Manual
- Frontend `useQueries.ts`: Tambah hook `useGrabChapterPagesViaSupadata`

### Remove
- Tidak ada yang dihapus

## Implementation Plan

1. Tambah fungsi Motoko `grabChapterPagesViaSupadata(comicId, chapterId, chapterUrl)`:
   - HTTP POST ke `https://api.supadata.ai/v1/web/scrape` dengan body `{"url": chapterUrl}` dan header `x-api-key: sd_ebc3b947dbf2c889f118481a5d38e284`
   - Parse JSON response untuk mendapatkan HTML content
   - Extract URL gambar dari HTML (cari tag `<img>` dengan ekstensi gambar umum)
   - Simpan setiap URL gambar sebagai page entry
2. Generate ulang backend (generate_motoko_code)
3. Update frontend AdminPage: tambah tab "Supadata Scraper" dengan UI mirip GrabberTab
4. Tambah hook `useGrabChapterPagesViaSupadata` di useQueries.ts

## UX Notes

- Tab Supadata Scraper diposisikan setelah "Grabber" dan sebelum "Tambah Manual"
- Input URL bisa single URL dengan `{ch}` placeholder, atau langsung URL satu per satu
- Log real-time per chapter untuk tracking progress
- Badge "SDP" di chapter row untuk membedakan dengan grabber biasa
