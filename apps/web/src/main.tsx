import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Layout from "./Layout";
import Landing from "./pages/Landing";
import Fridge from "./pages/Fridge";
import MealKit from "./pages/MealKit";
import Shop from "./pages/Shop";
import Dessert from "./pages/Dessert";
import Recipe from "./pages/Recipe";
import Watch from "./pages/Watch";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      children: [
        { path: "/", element: <Landing /> },
        { path: "/fridge", element: <Fridge /> },
        { path: "/mealkit", element: <MealKit /> },
        { path: "/shop", element: <Shop /> },
        { path: "/dessert", element: <Dessert /> },
        { path: "/recipe/:id", element: <Recipe /> },
        { path: "/yt/:id", element: <Watch /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
