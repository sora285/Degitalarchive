import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import PostArticle from "./pages/PostArticle";
import Map from "./pages/Map";
import SchoolSelect from "./pages/SchoolSelect";
import ResponsiveRoute from "./components/ResponsiveRoute";
import SchoolSelectMobile from "./pages/mobile/SchoolSelectMobile";
import LoginMobile from "./pages/mobile/LoginMobile";
import RegisterMobile from "./pages/mobile/RegisterMobile";
import HomeMobile from "./pages/mobile/HomeMobile";
import MapMobile from "./pages/mobile/MapMobile";
import ArticleDetailMobile from "./pages/mobile/ArticleDetailMobile";
import PostArticleMobile from "./pages/mobile/PostArticleMobile";

const buildSchoolPath = (params: Record<string, string | undefined>) => `/schools/${params.schoolId}`;
const buildRegisterPath = (params: Record<string, string | undefined>) => `/schools/${params.schoolId}/register`;
const buildHomePath = (params: Record<string, string | undefined>) => `/schools/${params.schoolId}/home`;
const buildMapPath = (params: Record<string, string | undefined>) => `/schools/${params.schoolId}/map`;
const buildArticlePath = (params: Record<string, string | undefined>) => `/schools/${params.schoolId}/article/${params.id}`;
const buildPostPath = (params: Record<string, string | undefined>) => `/schools/${params.schoolId}/post`;

const buildMobileSchoolPath = (params: Record<string, string | undefined>) => `/mobile/schools/${params.schoolId}`;
const buildMobileRegisterPath = (params: Record<string, string | undefined>) => `/mobile/schools/${params.schoolId}/register`;
const buildMobileHomePath = (params: Record<string, string | undefined>) => `/mobile/schools/${params.schoolId}/home`;
const buildMobileMapPath = (params: Record<string, string | undefined>) => `/mobile/schools/${params.schoolId}/map`;
const buildMobileArticlePath = (params: Record<string, string | undefined>) => `/mobile/schools/${params.schoolId}/article/${params.id}`;
const buildMobilePostPath = (params: Record<string, string | undefined>) => `/mobile/schools/${params.schoolId}/post`;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ResponsiveRoute Component={SchoolSelect} target="mobile" buildPath={() => "/mobile"} />,
  },
  {
    path: "/schools/:schoolId",
    element: <ResponsiveRoute Component={Login} target="mobile" buildPath={buildMobileSchoolPath} />,
  },
  {
    path: "/schools/:schoolId/register",
    element: <ResponsiveRoute Component={Register} target="mobile" buildPath={buildMobileRegisterPath} />,
  },
  {
    path: "/schools/:schoolId/home",
    element: <ResponsiveRoute Component={Home} target="mobile" buildPath={buildMobileHomePath} />,
  },
  {
    path: "/schools/:schoolId/map",
    element: <ResponsiveRoute Component={Map} target="mobile" buildPath={buildMobileMapPath} />,
  },
  {
    path: "/schools/:schoolId/article/:id",
    element: <ResponsiveRoute Component={ArticleDetail} target="mobile" buildPath={buildMobileArticlePath} />,
  },
  {
    path: "/schools/:schoolId/post",
    element: <ResponsiveRoute Component={PostArticle} target="mobile" buildPath={buildMobilePostPath} />,
  },
  {
    path: "/mobile",
    element: <ResponsiveRoute Component={SchoolSelectMobile} target="desktop" buildPath={() => "/"} />,
  },
  {
    path: "/mobile/schools/:schoolId",
    element: <ResponsiveRoute Component={LoginMobile} target="desktop" buildPath={buildSchoolPath} />,
  },
  {
    path: "/mobile/schools/:schoolId/register",
    element: <ResponsiveRoute Component={RegisterMobile} target="desktop" buildPath={buildRegisterPath} />,
  },
  {
    path: "/mobile/schools/:schoolId/home",
    element: <ResponsiveRoute Component={HomeMobile} target="desktop" buildPath={buildHomePath} />,
  },
  {
    path: "/mobile/schools/:schoolId/map",
    element: <ResponsiveRoute Component={MapMobile} target="desktop" buildPath={buildMapPath} />,
  },
  {
    path: "/mobile/schools/:schoolId/article/:id",
    element: <ResponsiveRoute Component={ArticleDetailMobile} target="desktop" buildPath={buildArticlePath} />,
  },
  {
    path: "/mobile/schools/:schoolId/post",
    element: <ResponsiveRoute Component={PostArticleMobile} target="desktop" buildPath={buildPostPath} />,
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
