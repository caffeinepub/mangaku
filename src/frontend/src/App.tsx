import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { ComicDetailPage } from "./pages/ComicDetailPage";
import { ReaderPage } from "./pages/ReaderPage";
import { AdminPage } from "./pages/AdminPage";

// ─── Root Layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <Toaster theme="dark" richColors />
    </div>
  );
}

function ReaderLayout() {
  return (
    <>
      <Outlet />
      <Toaster theme="dark" richColors />
    </>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute();

const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "main",
  component: RootLayout,
});

const readerLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "reader",
  component: ReaderLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/",
  component: HomePage,
});

const searchRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/search",
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    genre: typeof search.genre === "string" ? search.genre : "",
  }),
  component: SearchPage,
});

const comicDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/comic/$id",
  component: ComicDetailPage,
});

const readerRoute = createRoute({
  getParentRoute: () => readerLayoutRoute,
  path: "/comic/$id/chapter/$chapterId",
  component: ReaderPage,
});

const adminRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  mainLayoutRoute.addChildren([
    indexRoute,
    searchRoute,
    comicDetailRoute,
    adminRoute,
  ]),
  readerLayoutRoute.addChildren([readerRoute]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />;
}
