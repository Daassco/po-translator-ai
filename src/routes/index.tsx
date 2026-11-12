import { createBrowserRouter } from "react-router";
import { AppLayout } from "@/components/templates/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { TranslatorPage } from "@/pages/TranslatorPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { GlossaryPage } from "@/pages/GlossaryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "translator",
        element: <TranslatorPage />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
      {
        path: "glossary",
        element: <GlossaryPage />,
      },
    ],
  },
]);
