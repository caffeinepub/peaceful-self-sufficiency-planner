import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { AboutPage } from "./pages/AboutPage";
import { ComparePage } from "./pages/ComparePage";
import { LocationDetailPage } from "./pages/LocationDetailPage";
import { LocationsPage } from "./pages/LocationsPage";
import { QuietWeekPage } from "./pages/QuietWeekPage";
import { ResilienceTimelinePage } from "./pages/ResilienceTimelinePage";
import { ScenarioSimulatorPage } from "./pages/ScenarioSimulatorPage";
import { WinterLockdownPage } from "./pages/WinterLockdownPage";

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Layout>
        <Outlet />
      </Layout>
      <Toaster position="bottom-right" richColors />
    </>
  ),
});

// Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LocationsPage,
});

const locationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/location/$id",
  component: LocationDetailPage,
});

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  component: ComparePage,
});

const quietWeekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/quiet-week",
  component: QuietWeekPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const winterLockdownRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/winter-lockdown",
  component: WinterLockdownPage,
});

const resilienceTimelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resilience-timeline",
  component: ResilienceTimelinePage,
});

const scenarioSimulatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scenario-simulator",
  component: ScenarioSimulatorPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  locationDetailRoute,
  compareRoute,
  quietWeekRoute,
  aboutRoute,
  winterLockdownRoute,
  resilienceTimelineRoute,
  scenarioSimulatorRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
