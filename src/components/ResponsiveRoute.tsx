import { ComponentType, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

const MOBILE_BREAKPOINT = 768;

type RouteParams = Record<string, string | undefined>;

type ResponsiveRouteProps = {
  Component: ComponentType;
  target: "mobile" | "desktop";
  buildPath: (params: RouteParams) => string;
};

function shouldRedirect(target: "mobile" | "desktop") {
  const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
  return target === "mobile" ? isMobileWidth : !isMobileWidth;
}

export default function ResponsiveRoute({
  Component,
  target,
  buildPath,
}: ResponsiveRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!shouldRedirect(target)) {
      return;
    }

    const nextPath = buildPath(params);
    const nextUrl = `${nextPath}${location.search}`;
    const currentUrl = `${location.pathname}${location.search}`;

    if (nextUrl !== currentUrl) {
      navigate(nextUrl, { replace: true, state: location.state });
    }
  }, [buildPath, location.pathname, location.search, location.state, navigate, params, target, viewportWidth]);

  return <Component />;
}
