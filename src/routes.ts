import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import PostArticle from "./pages/PostArticle";
import Map from "./pages/Map";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/home",
    Component: Home,
  },
  {
    path: "/map",
    Component: Map,
  },
  {
    path: "/article/:id",
    Component: ArticleDetail,
  },
  {
    path: "/post",
    Component: PostArticle,
  },
]);