import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import PostArticle from "./pages/PostArticle";
import Map from "./pages/Map";
import SchoolSelect from "./pages/SchoolSelect";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SchoolSelect,
  },
  {
    path: "/schools/:schoolId",
    Component: Login,
  },
  {
    path: "/schools/:schoolId/home",
    Component: Home,
  },
  {
    path: "/schools/:schoolId/map",
    Component: Map,
  },
  {
    path: "/schools/:schoolId/article/:id",
    Component: ArticleDetail,
  },
  {
    path: "/schools/:schoolId/post",
    Component: PostArticle,
  },
  // 古いルートへのアクセスを学校選択画面にリダイレクト
  {
    path: "/home",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/map",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/article/:id",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/post",
    element: <Navigate to="/" replace />,
  },
]);