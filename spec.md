# MangaKu

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Public-facing webcomic site with MangaRead-style theme
- Comic grid listing (homepage + latest updates)
- Comic search page with genre/status filters and sorting (Latest Updated, Most Popular, A-Z)
- Comic detail page (cover, title, synopsis, genre, status, chapter list)
- Comic reader with vertical (scroll) and horizontal (flip) modes
- Explicit comics locked behind user login
- User comment system on comic detail pages (requires login)
- Admin panel with:
  - MangaDex API importer: search by title/ID, import metadata + cover + chapters + pages to blob storage
  - Manual chapter grabber: input URL template with `{ch}` placeholder + chapter range, system fetches all pages via HTTP outcalls, saves to blob
  - Comic management (edit, delete, set explicit flag)
- Authorization system (admin role, user role)
- Blob storage for cover images and comic pages

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
1. **Data models**: Comic (id, title, cover_blob_id, genre[], status, synopsis, source, is_explicit, created_at, updated_at, view_count), Chapter (id, comic_id, number, title, page_count), Page (id, chapter_id, page_number, blob_id), Comment (id, comic_id, user_id, text, created_at)
2. **Comic CRUD**: createComic, updateComic, deleteComic, getComic, listComics (paginated, sortable), searchComics (by title, genre, status)
3. **Chapter/Page CRUD**: createChapter, deleteChapter, addPage, listChapters, getChapterPages
4. **MangaDex import**: importFromMangaDex(mangadex_id) -- fetch metadata + chapters from MangaDex API via HTTP outcall, store cover in blob
5. **Chapter grabber**: grabChapter(url_template, chapter_start, chapter_end) -- iterate over chapter range, HTTP outcall to each URL, parse image URLs, save to blob
6. **Comments**: addComment, listComments(comic_id), deleteComment (admin)
7. **View count**: incrementViewCount(comic_id)
8. **Authorization**: admin and user roles

### Frontend
1. Layout with navbar (logo, search, login button)
2. Homepage: latest updated comics grid + all comics grid
3. Search page: text search + genre/status filter chips + sort dropdown
4. Comic detail page: cover, metadata, synopsis, chapter list, comments section
5. Reader page: toggle between vertical scroll and horizontal flip mode
6. Admin panel: comic list management, MangaDex importer form, grabber form
7. Auth: login/signup modal (user), admin login
8. Explicit content gate (blur/lock unless logged in)

## UX Notes
- MangaRead-inspired dark theme (dark navy/black background, white text, accent orange/red)
- Comic covers displayed in portrait grid cards
- Reader: horizontal mode uses left/right arrow keys + swipe; vertical mode is continuous scroll
- Admin grabber: URL template input + range input (e.g. 1-50), progress feedback while fetching
- Sorting options: Terbaru Diupdate, Terpopuler, A-Z
- Mobile-friendly responsive layout
