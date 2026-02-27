# MangaKu

## Current State

ReaderPage.tsx menampilkan halaman komik dalam dua mode: vertikal (scroll) dan horizontal (flip). Mode vertikal merender semua gambar sekaligus dengan `loading="lazy"` bawaan HTML. Mode horizontal hanya menampilkan satu gambar per halaman namun tidak ada preload untuk halaman berikutnya. Tidak ada skeleton/placeholder per gambar saat loading.

## Requested Changes (Diff)

### Add
- Komponen `LazyImage` dengan IntersectionObserver untuk lazy loading berbasis viewport
- Skeleton placeholder per gambar di mode vertikal saat gambar belum masuk viewport atau belum selesai load
- Preload gambar berikutnya (+1, +2) di mode horizontal supaya transisi cepat
- Loading state per gambar di mode horizontal (spinner/skeleton overlay)

### Modify
- Mode vertikal: ganti `<img>` biasa dengan komponen `LazyImage` yang memakai IntersectionObserver (bukan hanya `loading="lazy"` HTML)
- Mode horizontal: tambah preloading gambar halaman berikutnya di background

### Remove
- Tidak ada yang dihapus

## Implementation Plan

1. Buat komponen `LazyImage` di `src/frontend/src/components/LazyImage.tsx`
   - Gunakan IntersectionObserver dengan rootMargin "200px" agar gambar dimuat sebelum masuk viewport
   - Tampilkan Skeleton selama gambar belum dimuat
   - Saat gambar selesai load (onLoad), hilangkan skeleton dengan fade-in
2. Update ReaderPage.tsx:
   - Mode vertikal: ganti `<img>` dengan `<LazyImage>`
   - Mode horizontal: tambah useEffect untuk preload gambar currentPage+1 dan currentPage+2

## UX Notes
- Skeleton harus memiliki aspect ratio yang mirip gambar komik (2/3 portrait)
- Fade-in saat gambar muncul agar terasa halus
- Di mode horizontal, preload dilakukan di background (Image object), bukan render di DOM
