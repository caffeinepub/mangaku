import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type {
  Comic,
  Chapter,
  Comment,
  Page,
  UserProfile,
  UserRole,
} from "../backend.d";

// ─── Comic Queries ───────────────────────────────────────────────────────────

export function useListComics(
  page: bigint,
  pageSize: bigint,
  sortBy: string,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Comic[]>({
    queryKey: ["comics", page.toString(), pageSize.toString(), sortBy],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listComics(page, pageSize, sortBy);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchComics(
  query: string,
  genre: string | null,
  status: string | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Comic[]>({
    queryKey: ["searchComics", query, genre, status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchComics(query, genre, status);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetComic(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comic | null>({
    queryKey: ["comic", id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getComic(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

// ─── Chapter Queries ─────────────────────────────────────────────────────────

export function useListChapters(comicId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Chapter[]>({
    queryKey: ["chapters", comicId?.toString()],
    queryFn: async () => {
      if (!actor || !comicId) return [];
      return actor.listChaptersByComic(comicId);
    },
    enabled: !!actor && !isFetching && comicId !== null,
  });
}

export function useListPages(chapterId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Page[]>({
    queryKey: ["pages", chapterId?.toString()],
    queryFn: async () => {
      if (!actor || !chapterId) return [];
      return actor.listPagesByChapter(chapterId);
    },
    enabled: !!actor && !isFetching && chapterId !== null,
  });
}

// ─── Comment Queries ─────────────────────────────────────────────────────────

export function useListComments(comicId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", comicId?.toString()],
    queryFn: async () => {
      if (!actor || !comicId) return [];
      return actor.listCommentsByComic(comicId);
    },
    enabled: !!actor && !isFetching && comicId !== null,
  });
}

// ─── User Queries ─────────────────────────────────────────────────────────────

export function useCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!identity && query.isFetched,
  };
}

export function useCallerUserRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserRole>({
    queryKey: ["userRole", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return "guest" as UserRole;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<boolean>({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      comicId,
      username,
      text,
    }: {
      comicId: bigint;
      username: string;
      text: string;
    }) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.addComment(comicId, username, text);
    },
    onSuccess: (_data, { comicId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["comments", comicId.toString()],
      });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.deleteComment(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

export function useCreateComic() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      coverBlobId: string | null;
      genres: string[];
      status: string;
      synopsis: string;
      sourceType: string;
      isExplicit: boolean;
    }) => {
      if (!actor || isFetching) throw new Error("Backend belum siap, coba lagi");
      return actor.createComic(
        params.title,
        params.coverBlobId,
        params.genres,
        params.status,
        params.synopsis,
        params.sourceType,
        params.isExplicit,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}

export function useUpdateComic() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      title: string;
      coverBlobId: string | null;
      genres: string[];
      status: string;
      synopsis: string;
      sourceType: string;
      isExplicit: boolean;
    }) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.updateComic(
        params.id,
        params.title,
        params.coverBlobId,
        params.genres,
        params.status,
        params.synopsis,
        params.sourceType,
        params.isExplicit,
      );
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["comics"] });
      void queryClient.invalidateQueries({ queryKey: ["comic", id.toString()] });
    },
  });
}

export function useDeleteComic() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.deleteComic(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}

export function useCreateChapter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      comicId: bigint;
      chapterNumber: number;
      title: string;
    }) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.createChapter(
        params.comicId,
        params.chapterNumber,
        params.title,
      );
    },
    onSuccess: (_data, { comicId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["chapters", comicId.toString()],
      });
    },
  });
}

export function useDeleteChapter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chapterId,
      comicId,
    }: {
      chapterId: bigint;
      comicId: bigint;
    }) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.deleteChapter(chapterId);
    },
    onSuccess: (_data, { comicId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["chapters", comicId.toString()],
      });
    },
  });
}

export function useImportFromMangaDex() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mangadexId: string) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.importFromMangaDex(mangadexId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}

export function useFetchMangaDexChapters() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mangadexId,
      comicId,
    }: {
      mangadexId: string;
      comicId: bigint;
    }) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.fetchMangaDexChapters(mangadexId, comicId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chapters"] });
    },
  });
}

export function useGrabChapterPages() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      comicId: bigint;
      chapterId: bigint;
      urlTemplate: string;
      pageStart: bigint;
      pageEnd: bigint;
    }) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.grabChapterPages(
        params.comicId,
        params.chapterId,
        params.urlTemplate,
        params.pageStart,
        params.pageEnd,
      );
    },
    onSuccess: (_data, { chapterId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["pages", chapterId.toString()],
      });
    },
  });
}

export function useFetchMangaDexChapterPages() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapterId: bigint) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.fetchMangaDexChapterPages(chapterId);
    },
    onSuccess: (_data, chapterId) => {
      void queryClient.invalidateQueries({ queryKey: ["pages", chapterId.toString()] });
    },
  });
}

export function useGrabChapterPagesViaSupadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      comicId: bigint;
      chapterId: bigint;
      chapterUrl: string;
    }) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.grabChapterPagesViaSupadata(
        params.comicId,
        params.chapterId,
        params.chapterUrl,
      );
    },
    onSuccess: (_data, { chapterId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["pages", chapterId.toString()],
      });
    },
  });
}

export function useIncrementViewCount() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (comicId: bigint) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.incrementViewCount(comicId);
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Backend belum siap, coba lagi");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}
