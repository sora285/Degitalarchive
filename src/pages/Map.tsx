import { useNavigate, useParams } from "react-router";
import { LogOut, MapPin } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { clearSession, getCurrentUser } from "../lib/session";
import { ArticleData, fetchArticles } from "../lib/articles";
import fixedArticleImage from "../assets/article_fixed.svg";

const FIXED_ARTICLE_IMAGE = fixedArticleImage;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function buildDisplayMarkers(articles: ArticleData[]) {
  const articleGroups = new globalThis.Map<string, ArticleData[]>();

  articles.forEach((article) => {
    const key = `${article.location.lat.toFixed(4)}:${article.location.lng.toFixed(4)}`;
    const group = articleGroups.get(key) || [];
    group.push(article);
    articleGroups.set(key, group);
  });

  return articles.map((article) => {
    const key = `${article.location.lat.toFixed(4)}:${article.location.lng.toFixed(4)}`;
    const group = articleGroups.get(key) || [article];
    const index = group.findIndex((item) => item.id === article.id);

    if (group.length <= 1 || index < 0) {
      return {
        article,
        displayLat: article.location.lat,
        displayLng: article.location.lng,
        groupSize: group.length,
      };
    }

    const radiusMeters = Math.min(10 + group.length * 4, 42);
    const angle = (Math.PI * 2 * index) / group.length;
    const latOffset = (radiusMeters * Math.sin(angle)) / 111320;
    const lngOffset =
      (radiusMeters * Math.cos(angle)) /
      (111320 * Math.cos((article.location.lat * Math.PI) / 180));

    return {
      article,
      displayLat: article.location.lat + latOffset,
      displayLng: article.location.lng + lngOffset,
      groupSize: group.length,
    };
  });
}

function buildMarkerTitle(title: string) {
  return title.length > 8 ? `${title.slice(0, 8)}…` : title;
}

function buildMarkerIcon(title: string, showLabel: boolean) {
  const label = buildMarkerTitle(title);
  const width = showLabel ? 124 : 28;
  const height = showLabel ? 52 : 28;
  const pinX = width / 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${showLabel ? `<rect x="6" y="4" width="${width - 12}" height="22" rx="11" fill="rgba(255,255,255,0.98)" stroke="rgba(0,0,0,0.08)" />` : ""}
      ${showLabel ? `<text x="${width / 2}" y="19" text-anchor="middle" font-size="10.5" font-weight="700" fill="rgba(31,41,55,0.92)" font-family="Inter, 'Noto Sans JP', sans-serif">${label}</text>` : ""}
      <line x1="${pinX}" y1="${showLabel ? 26 : 6}" x2="${pinX}" y2="${showLabel ? 38 : 15}" stroke="rgba(255,100,100,0.58)" stroke-width="2"/>
      <circle cx="${pinX}" cy="${showLabel ? 42 : 18}" r="${showLabel ? 8 : 8}" fill="rgba(255,100,100,0.96)" stroke="white" stroke-width="3"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(pinX, showLabel ? 42 : 18),
  };
}

function Header() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-md" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px] flex items-center px-8 justify-between" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">デジタルアーカイブ</p>
      <div className="absolute right-8 top-[23px] flex gap-8 items-center">
        {currentUser && (
          <p className="text-[14px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[rgba(0,0,0,0.62)] whitespace-nowrap">
            {currentUser.name}さんこんにちは
          </p>
        )}
        <div className="relative">
          <p 
            onClick={() => navigate(`/schools/${schoolId}/map`)}
            className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]"
          >
            地図から探す
          </p>
          <div className="absolute -bottom-[23px] left-0 right-0 h-[3px] bg-[rgba(0,0,0,0.7)] rounded-t-full" />
        </div>
        <div className="relative">
          <p 
            onClick={() => navigate(`/schools/${schoolId}/home`)}
            className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]"
          >
            一覧から探す
          </p>
        </div>
        {currentUser && (
          <button
            onClick={() => {
              clearSession();
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <LogOut size={16} className="text-[rgba(0,0,0,0.6)]" />
            <span className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.7)]">ログアウト</span>
          </button>
        )}
      </div>
    </div>
  );
}

function MapView({ articles }: { articles: ArticleData[] }) {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser();
  const canViewStatus = Boolean(currentUser);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  // みなとみらいエリアの中心座標
  const centerLat = 35.4560;
  const centerLng = 139.6345;
  const displayMarkers = buildDisplayMarkers(articles);

  const getArticleImageSrc = (article: ArticleData) => {
    if (schoolId) {
      return `${API_BASE_URL}/api/articles/${article.id}/image?schoolId=${encodeURIComponent(schoolId)}`;
    }

    return article.imageUrl || FIXED_ARTICLE_IMAGE;
  };

  const getStatusLabel = (article: ArticleData) => (article.status === "draft" ? "未承認" : "承認済み");
  const getActivityRelationLabel = (article: ArticleData) =>
    article.isChildActivity ? "子活動" : article.isParentActivity ? "親活動" : "単独活動";

  // 簡易地図のフォールバック表示用
  const latLngToPixel = (lat: number, lng: number) => {
    const mapWidth = 1000;
    const mapHeight = 700;
    
    const minLat = 35.445;
    const maxLat = 35.465;
    const minLng = 139.620;
    const maxLng = 139.650;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    
    return { x, y };
  };

  useEffect(() => {
    const clearInfoWindowCloseTimer = () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };

    const scheduleInfoWindowClose = () => {
      clearInfoWindowCloseTimer();
      closeTimerRef.current = window.setTimeout(() => {
        infoWindowRef.current?.close();
        closeTimerRef.current = null;
      }, 180);
    };

    // Google Maps APIのスクリプトを読み込む
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && typeof window.google.maps.Map === "function") {
        initMap();
        return;
      }

      // APIキーの設定（環境変数または直接指定）
      // import.meta.envが利用できない環境への対応
      let apiKey = 'YOUR_API_KEY_HERE';
      try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
          apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        }
      } catch (e) {
        // import.meta が使えない環境
        console.log('環境変数が利用できません。フォールバック表示を使用します。');
      }
      
      // APIキーが設定されていない場合はフォールバックを使用
      if (apiKey === 'YOUR_API_KEY_HERE') {
        setMapError('Google Maps APIキーが設定されていません。フォールバック表示を使用します。');
        return;
      }

      window.gm_authFailure = () => {
        setMapError('Google Maps APIキーの認証に失敗しました。フォールバック表示を使用します。');
      };

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]');
      if (existingScript) {
        return;
      }

      window.__initGoogleMap = () => {
        initMap();
      };

      const script = document.createElement('script');
      script.dataset.googleMapsLoader = 'true';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ja&v=weekly&callback=__initGoogleMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setMapError('Google Maps APIの読み込みに失敗しました。フォールバック表示を使用します。');
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps || typeof window.google.maps.Map !== "function") {
        setMapError('Google Mapsの初期化に必要なライブラリが読み込まれていません。フォールバック表示を使用します。');
        return;
      }

      try {
        // カスタムマップスタイル（黄色系テーマ）
        const mapStyles: google.maps.MapTypeStyle[] = [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9e2f6" }]
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#fffbf0" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#e8f5e9" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          }
        ];

        // Google Mapを初期化
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 14,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        });

        googleMapRef.current = map;
        const infoWindow = new google.maps.InfoWindow();
        infoWindowRef.current = infoWindow;

        displayMarkers.forEach(({ article, displayLat, displayLng, groupSize }) => {
          const marker = new google.maps.Marker({
            position: { lat: displayLat, lng: displayLng },
            map,
            title: article.title,
            icon: buildMarkerIcon(article.title, groupSize <= 1),
          });

          const popupHtml = `
            <a href="/schools/${schoolId}/article/${article.id}?from=map" style="display:block;width:280px;text-decoration:none;font-family:Inter,'Noto Sans JP',sans-serif;" data-article-popup="true">
              <div style="padding:4px 2px 2px;">
                <div style="width:100%;height:96px;border-radius:14px;overflow:hidden;background:rgba(0,0,0,0.05);margin-bottom:10px;">
                  <img src="${getArticleImageSrc(article)}" alt="${article.title}" style="width:100%;height:100%;object-fit:cover;display:block;" />
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
                  <span style="display:inline-flex;align-items:center;border:1px solid rgba(0,0,0,0.08);border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;color:rgba(0,0,0,0.68);background:rgba(255,255,255,0.95);">
                    ${getActivityRelationLabel(article)}
                  </span>
                  ${canViewStatus ? `<span style="display:inline-flex;align-items:center;border:1px solid rgba(0,0,0,0.08);border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;color:rgba(0,0,0,0.68);background:rgba(255,255,255,0.95);">${getStatusLabel(article)}</span>` : ""}
                </div>
                <h3 style="margin:0 0 8px;font-size:18px;font-weight:700;line-height:1.4;color:rgba(0,0,0,0.84);">
                  ${article.title}
                </h3>
                <p style="margin:0 0 8px;font-size:13px;color:rgba(0,0,0,0.56);">
                  ${article.location?.name || "場所未設定"}
                </p>
                <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:rgba(0,0,0,0.68);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
                  ${article.content || "本文は未登録です。"}
                </p>
                <div style="font-size:12px;font-weight:700;color:rgba(0,0,0,0.72);">
                  記事詳細を見る
                </div>
              </div>
            </a>
          `;

          marker.addListener("mouseover", () => {
            clearInfoWindowCloseTimer();
            infoWindow.setContent(popupHtml);
            infoWindow.open({ map, anchor: marker });
          });

          marker.addListener("mouseout", () => {
            scheduleInfoWindowClose();
          });

          marker.addListener("click", () => {
            navigate(`/schools/${schoolId}/article/${article.id}?from=map`, {
              state: { from: "map" },
            });
          });

          markersRef.current.push(marker);
        });

        infoWindow.addListener("domready", () => {
          const popup = document.querySelector<HTMLElement>('[data-article-popup="true"]');
          if (!popup) {
            return;
          }

          popup.addEventListener("mouseenter", clearInfoWindowCloseTimer);
          popup.addEventListener("mouseleave", scheduleInfoWindowClose);
        });

        setMapError(null);
      } catch (error) {
        console.error('Google Maps初期化エラー:', error);
        setMapError('Google Mapsの初期化に失敗しました。フォールバック表示を使用します。');
      }
    };

    loadGoogleMapsScript();

    // クリーンアップ
    return () => {
      clearInfoWindowCloseTimer();
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      delete window.__initGoogleMap;
    };
  }, [articles]);

  // フォールバック：APIキーがない場合の簡易地図表示
  if (mapError) {
    return (
      <div className="relative flex-1 overflow-hidden px-8 pb-8">
        <div className="h-full w-full bg-white rounded-3xl shadow-xl overflow-hidden relative">
          <div className="w-full h-full bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] relative">
            {/* グリッド線 */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            
            {/* 海エリア表示 */}
            <div className="absolute top-0 right-0 w-[40%] h-full bg-[rgba(100,150,255,0.15)]" />
            
            {/* エリア名と通知 */}
            <div className="absolute top-8 left-8 space-y-4 z-10">
              <div className="bg-white/90 rounded-lg px-4 py-2 shadow-md">
                <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.8)]">
                  みなとみらいエリア
                </p>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg px-4 py-3 shadow-md max-w-md">
                <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-yellow-800 mb-1">
                  ⚠️ フォールバック表示中
                </p>
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-yellow-700">
                  {mapError}
                </p>
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[11px] text-yellow-600 mt-2">
                  環境変数 VITE_GOOGLE_MAPS_API_KEY に有効なAPIキーを設定してください
                </p>
              </div>
            </div>

            {/* 記事マーカー（簡易版） */}
            <div className="absolute inset-0">
              {displayMarkers.map(({ article, displayLat, displayLng, groupSize }) => {
                const { x, y } = latLngToPixel(displayLat, displayLng);
                return (
                  <div
                    key={article.id}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -100%)',
                    }}
                    onClick={() =>
                      navigate(`/schools/${schoolId}/article/${article.id}?from=map`, {
                        state: { from: "map" },
                      })
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {groupSize <= 1 && (
                        <div className="max-w-[148px] truncate rounded-full border border-[rgba(0,0,0,0.08)] bg-white/96 px-3 py-1 text-[11px] font-semibold text-[rgba(0,0,0,0.78)] shadow-lg">
                          {buildMarkerTitle(article.title)}
                        </div>
                      )}
                      <MapPin
                        size={30}
                        className="text-[rgba(255,100,100,0.9)] fill-[rgba(255,100,100,0.6)] hover:scale-110 transition-transform drop-shadow-lg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Google Maps表示
  return (
    <div className="relative flex-1 overflow-hidden px-8 pb-8">
      <div className="h-full w-full bg-white rounded-3xl shadow-xl overflow-hidden relative">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute left-8 top-8 z-10 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white/92 px-5 py-4 shadow-xl backdrop-blur-sm">
          <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.8)]">
            地図上のピンをクリック
          </p>
          <p className="mt-1 text-[13px] text-[rgba(0,0,0,0.55)]">
            記事タイトル付きのピンから詳細を表示できます
          </p>
          <p className="mt-2 text-[12px] text-[rgba(0,0,0,0.45)]">
            全{articles.length}件
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Map() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser();
  const canPostArticle = Boolean(currentUser);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!schoolId) {
      setError("学校IDが見つかりません。");
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError("");

    fetchArticles(schoolId)
      .then((list) => {
        if (!mounted) return;
        setArticles(list);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "記事の取得に失敗しました。");
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  return (
    <div className="bg-gradient-to-br from-white to-[#fffaf0] h-screen flex flex-col" data-name="map">
      <Header />
      <div className="relative flex-1 pt-[67px] flex flex-col">
        {canPostArticle && (
          <div className="pointer-events-none absolute right-8 top-[91px] z-30">
            <button
              onClick={() => navigate(`/schools/${schoolId}/post`)}
              className="pointer-events-auto bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] cursor-pointer"
            >
              + 記事を投稿
            </button>
          </div>
        )}
        {isLoading && (
          <div className="mx-8 mb-3 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-[14px] text-[rgba(0,0,0,0.7)]">
            記事を読み込み中です...
          </div>
        )}
        {error && (
          <div className="mx-8 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-600">
            {error}
          </div>
        )}
        {!isLoading && <MapView articles={articles} />}
      </div>
    </div>
  );
}
