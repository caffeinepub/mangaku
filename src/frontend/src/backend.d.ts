import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_header {
    value: string;
    name: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Page {
    id: bigint;
    pageNumber: bigint;
    chapterId: bigint;
    blobId: string;
}
export interface Comment {
    id: bigint;
    username: string;
    userId: Principal;
    createdAt: bigint;
    text: string;
    comicId: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Comic {
    id: bigint;
    status: string;
    title: string;
    createdAt: bigint;
    coverBlobId?: string;
    sourceType: string;
    updatedAt: bigint;
    synopsis: string;
    viewCount: bigint;
    genres: Array<string>;
    isExplicit: boolean;
}
export interface Chapter {
    id: bigint;
    title: string;
    chapterNumber: number;
    createdAt: bigint;
    comicId: bigint;
    mangadexChapterId?: string;
}
export interface UserProfile {
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(comicId: bigint, username: string, text: string): Promise<void>;
    addPage(chapterId: bigint, pageNumber: bigint, blobId: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChapter(comicId: bigint, chapterNumber: number, title: string): Promise<bigint>;
    createComic(title: string, coverBlobId: string | null, genresInput: Array<string>, status: string, synopsis: string, sourceType: string, isExplicit: boolean): Promise<bigint>;
    deleteChapter(id: bigint): Promise<void>;
    deleteComic(id: bigint): Promise<void>;
    deleteComment(id: bigint): Promise<void>;
    fetchMangaDexChapterPages(chapterId: bigint): Promise<void>;
    fetchMangaDexChapters(mangadexId: string, comicId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComic(id: bigint): Promise<Comic>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    grabChapterPages(comicId: bigint, chapterId: bigint, urlTemplate: string, pageStart: bigint, pageEnd: bigint): Promise<void>;
    importFromMangaDex(mangadexId: string): Promise<bigint>;
    incrementViewCount(comicId: bigint): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listAllGenres(): Promise<Array<string>>;
    listChaptersByComic(comicId: bigint): Promise<Array<Chapter>>;
    listComics(page: bigint, pageSize: bigint, sortBy: string): Promise<Array<Comic>>;
    listCommentsByComic(comicId: bigint): Promise<Array<Comment>>;
    listPagesByChapter(chapterId: bigint): Promise<Array<Page>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchComics(queryText: string, genre: string | null, status: string | null): Promise<Array<Comic>>;
    transform(raw: TransformationInput): Promise<TransformationOutput>;
    updateComic(id: bigint, title: string, coverBlobId: string | null, genresInput: Array<string>, status: string, synopsis: string, sourceType: string, isExplicit: boolean): Promise<void>;
}
