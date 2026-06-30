import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Upload, LogOut, MapPin, Search, Check, Plus, X, ChevronDown, Trash2 } from "lucide-react";
import { fetchCurrentUser, getCurrentUser, logoutCurrentUser, type CurrentUser } from "../lib/session";
import { fetchClasses, type ClassOption } from "../lib/classes";
import { fetchSchools } from "../lib/schools";
import { createCategory, deleteCategory, fetchCategories, type CategoryOption } from "../lib/categories";
import { createCompany, deleteCompany, fetchCompanies, type CompanyOption } from "../lib/companies";
import { fetchImageLibrary, type ImageLibraryItem } from "../lib/imageLibrary";
import { ArticleData, createArticle, fetchArticleById, fetchArticles, updateArticle as updateArticleRequest } from "../lib/articles";
import ModalShell from "../components/ui/ModalShell";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const DEFAULT_LOCATION_CENTER = { lat: 35.4560, lng: 139.6345 };

function extractLocationLabel(source: any, fallback = "") {
  const directName = String(
    source?.name ||
    source?.namedetails?.name ||
    source?.namedetails?.["name:ja"] ||
    source?.namedetails?.official_name ||
    source?.namedetails?.["official_name:ja"] ||
    source?.namedetails?.short_name ||
    source?.namedetails?.["short_name:ja"] ||
    source?.namedetails?.loc_name ||
    source?.namedetails?.alt_name ||
    source?.extratags?.name ||
    source?.extratags?.official_name ||
    source?.extratags?.brand ||
    source?.extratags?.operator ||
    source?.address?.amenity ||
    source?.address?.building ||
    source?.address?.tourism ||
    source?.address?.attraction ||
    source?.address?.shop ||
    source?.address?.leisure ||
    source?.address?.office ||
    source?.address?.school ||
    source?.address?.university ||
    source?.address?.hospital ||
    source?.address?.railway ||
    source?.address?.station ||
    source?.address?.suburb ||
    source?.address?.neighbourhood ||
    source?.address?.quarter ||
    source?.address?.city ||
    source?.address?.town ||
    source?.address?.village ||
    ""
  ).trim();

  if (directName) {
    return directName;
  }

  const displayName = String(source?.display_name || "").trim();
  if (displayName) {
    const [firstSegment] = displayName.split(",");
    if (firstSegment?.trim()) {
      return firstSegment.trim();
    }
  }

  return fallback.trim();
}

async function reverseGeocodeLocation(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&namedetails=1&extratags=1&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("reverse geocode failed");
    }

    const data = await response.json();
    return extractLocationLabel(data);
  } catch (error) {
    console.error("逆ジオコーディングに失敗しました:", error);
    return "";
  }
}

async function searchLocationByQuery(query: string, limit = 5) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&namedetails=1&extratags=1&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("location search failed");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function LocationMap({
  latitude,
  longitude,
  locationName,
  onSelectLocation,
}: {
  latitude: string;
  longitude: string;
  locationName: string;
  onSelectLocation: (next: { latitude: string; longitude: string; locationName: string }) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const onSelectLocationRef = useRef(onSelectLocation);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps || typeof window.google.maps.Map !== "function") {
        setMapError("Google Mapsの初期化に必要なライブラリが読み込まれていません。");
        return;
      }

      try {
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

        const initialLat = Number(latitude);
        const initialLng = Number(longitude);
        const hasInitialPosition = Number.isFinite(initialLat) && Number.isFinite(initialLng);

        const map = new google.maps.Map(mapRef.current, {
          center: hasInitialPosition ? { lat: initialLat, lng: initialLng } : DEFAULT_LOCATION_CENTER,
          zoom: hasInitialPosition ? 16 : 14,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        });

        googleMapRef.current = map;

        if (hasInitialPosition) {
          markerRef.current = new google.maps.Marker({
            position: { lat: initialLat, lng: initialLng },
            map,
            title: locationName || "選択された場所",
          });
        }

        mapClickListenerRef.current = map.addListener("click", async (event) => {
          const clickedLatLng = event.latLng;
          if (!clickedLatLng) {
            return;
          }

          const nextLat = clickedLatLng.lat();
          const nextLng = clickedLatLng.lng();
          const fallbackLocationName = `緯度 ${nextLat.toFixed(6)}, 経度 ${nextLng.toFixed(6)}`;

          setIsResolvingLocation(true);
          const resolvedLocationName = await reverseGeocodeLocation(nextLat, nextLng);
          setIsResolvingLocation(false);

          onSelectLocationRef.current({
            latitude: String(nextLat),
            longitude: String(nextLng),
            locationName: resolvedLocationName || fallbackLocationName,
          });
        });

        setMapError(null);
      } catch (error) {
        console.error("Google Maps初期化エラー:", error);
        setMapError("Google Mapsの初期化に失敗しました。");
      }
    };

    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && typeof window.google.maps.Map === "function") {
        initMap();
        return;
      }

      let apiKey = "YOUR_API_KEY_HERE";
      try {
        if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
          apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        }
      } catch (error) {
        console.error("Google Mapsの環境変数取得に失敗しました:", error);
      }

      if (apiKey === "YOUR_API_KEY_HERE") {
        setMapError("Google Maps APIキーが設定されていません。");
        return;
      }

      window.gm_authFailure = () => {
        setMapError("Google Maps APIキーの認証に失敗しました。");
      };

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]');
      if (existingScript) {
        window.__initGoogleMap = () => {
          initMap();
        };
        return;
      }

      window.__initGoogleMap = () => {
        initMap();
      };

      const script = document.createElement("script");
      script.dataset.googleMapsLoader = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=ja&v=weekly&callback=__initGoogleMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setMapError("Google Maps APIの読み込みに失敗しました。");
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    return () => {
      mapClickListenerRef.current?.remove();
      mapClickListenerRef.current = null;
      delete window.__initGoogleMap;
    };
  }, []);

  useEffect(() => {
    const map = googleMapRef.current;
    if (!map) {
      return;
    }

    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);
    const hasPosition = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

    if (!hasPosition) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      map.panTo(DEFAULT_LOCATION_CENTER);
      map.setZoom(14);
      return;
    }

    const nextPosition = { lat: parsedLat, lng: parsedLng };
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position: nextPosition,
        map,
        title: locationName || "選択された場所",
      });
    } else {
      markerRef.current.setPosition(nextPosition);
    }

    map.panTo(nextPosition);
    map.setZoom(16);
  }, [latitude, longitude, locationName]);

  return (
    <div className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={16} className="text-[rgba(255,209,131,1)] flex-shrink-0" />
          <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.8)] truncate">
            {locationName || "地図をクリックして場所を選択"}
          </span>
        </div>
        <span className="text-[12px] text-[rgba(0,0,0,0.5)] whitespace-nowrap">
          検索または地図クリック
        </span>
      </div>

      {mapError ? (
        <div className="bg-gradient-to-br from-[#f9f9f9] to-white border border-[rgba(0,0,0,0.08)] rounded-xl p-8 text-center">
          <MapPin size={40} className="mx-auto text-[rgba(0,0,0,0.3)] mb-3" />
          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.6)]">
            {mapError}
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-[rgba(0,0,0,0.1)]">
          <div ref={mapRef} className="h-[400px] w-full bg-[linear-gradient(135deg,#eef6ff_0%,#fff8ea_100%)]" />
          {isResolvingLocation && (
            <div className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-[12px] font-medium text-[rgba(0,0,0,0.68)] shadow-md">
              位置情報を取得中...
            </div>
          )}
        </div>
      )}

      <p className="text-[12px] text-[rgba(0,0,0,0.5)] mt-3 text-center">
        {latitude && longitude
          ? `緯度: ${parseFloat(latitude).toFixed(6)}, 経度: ${parseFloat(longitude).toFixed(6)}`
          : "地図上をクリックするとピンが置かれ、緯度経度を取得できます"}
      </p>
    </div>
  );
}

function normalizeDateInputValue(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const parts = raw.split("/");
  if (parts.length !== 3) {
    return raw;
  }

  const [year, month, day] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function Header({ onLogoutClick }: { onLogoutClick: () => void }) {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser(schoolId);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-md" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px] flex items-center px-8 justify-between" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors whitespace-nowrap" onClick={() => navigate(`/schools/${schoolId}/home`)}>デジタルアーカイブ</p>
      <div className="absolute right-8 top-[23px] flex gap-8 items-center">
        {currentUser && (
          <p className="text-[14px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[rgba(0,0,0,0.62)] whitespace-nowrap">
            {currentUser.name}さんこんにちは
          </p>
        )}
        <p 
          onClick={() => navigate(`/schools/${schoolId}/map`)}
          className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]"
        >
          地図から探す
        </p>
        <p 
          onClick={() => navigate(`/schools/${schoolId}/home`)}
          className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]"
        >
          一覧から探す
        </p>
        {currentUser && (
          <>
            <button
              onClick={onLogoutClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut size={16} className="text-[rgba(0,0,0,0.6)]" />
              <span className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.7)]">ログアウト</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PostArticle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [sessionUser, setSessionUser] = useState<CurrentUser | null>(() => getCurrentUser(schoolId));
  const currentUser = sessionUser;
  const isAdmin = currentUser?.role === "admin";
  const canUsePostEditor = Boolean(currentUser);
  const editingArticleId = Number(searchParams.get("articleId") || 0);
  const preselectedParentActivityId = Number(searchParams.get("parentActivityId") || 0);
  const isEditMode = Number.isFinite(editingArticleId) && editingArticleId > 0;
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryOption | null>(null);
  const [categoryCustom, setCategoryCustom] = useState("");
  const [sdgs, setSdgs] = useState<string[]>([]);
  const [isSDGsOpen, setIsSDGsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [classInfo, setClassInfo] = useState("");
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyOption | null>(null);
  const [companyCustom, setCompanyCustom] = useState("");
  const [content, setContent] = useState("");
  const [articleDate, setArticleDate] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageMode, setImageMode] = useState<"upload" | "select">("upload");
  const [imageLibrary, setImageLibrary] = useState<ImageLibraryItem[]>([]);
  const [selectedLibraryImages, setSelectedLibraryImages] = useState<string[]>([]);
  const [isImageLibraryModalOpen, setIsImageLibraryModalOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"private_draft" | "pending" | "published" | null>(null);
  const [pageError, setPageError] = useState("");
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [editingArticleStatus, setEditingArticleStatus] = useState<ArticleData["status"] | null>(null);
  const [draftArticles, setDraftArticles] = useState<ArticleData[]>([]);
  const [isDraftListOpen, setIsDraftListOpen] = useState(false);
  const [activityArticles, setActivityArticles] = useState<ArticleData[]>([]);
  const [linkedChildActivityIds, setLinkedChildActivityIds] = useState<number[]>([]);

  // 親子活動関連のstate
  const [activityType, setActivityType] = useState<"parent" | "child">(
    Number.isFinite(preselectedParentActivityId) && preselectedParentActivityId > 0 ? "child" : "parent"
  );
  const [parentActivityId, setParentActivityId] = useState<number | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // SDGsの選択肢
  const sdgOptions = [
    { id: "1", label: "1. 貧困をなくそう" },
    { id: "2", label: "2. 飢餓をゼロに" },
    { id: "3", label: "3. すべての人に健康と福祉を" },
    { id: "4", label: "4. 質の高い教育をみんなに" },
    { id: "5", label: "5. ジェンダー平等を実現しよう" },
    { id: "6", label: "6. 安全な水とトイレを世界中に" },
    { id: "7", label: "7. エネルギーをみんなに そしてクリーンに" },
    { id: "8", label: "8. 働きがいも経済成長も" },
    { id: "9", label: "9. 産業と技術革新の基盤をつくろう" },
    { id: "10", label: "10. 人や国の不平等をなくそう" },
    { id: "11", label: "11. 住み続けられるまちづくりを" },
    { id: "12", label: "12. つくる責任 つかう責任" },
    { id: "13", label: "13. 気候変動に具体的な対策を" },
    { id: "14", label: "14. 海の豊かさを守ろう" },
    { id: "15", label: "15. 陸の豊かさも守ろう" },
    { id: "16", label: "16. 平和と公正をすべての人に" },
    { id: "17", label: "17. パートナーシップで目標を達成しよう" },
  ];

  const primarySubmitStatus: "pending" | "published" = isAdmin ? "published" : "pending";
  const canReturnPendingToDraft =
    currentUser?.role === "user" &&
    isEditMode &&
    editingArticleStatus === "pending";

  useEffect(() => {
    setSessionUser(getCurrentUser(schoolId));
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || sessionUser) {
      return;
    }

    let mounted = true;
    fetchCurrentUser(schoolId)
      .then((user) => {
        if (mounted && user) {
          setSessionUser(user);
        }
      })
      .catch((error) => {
        console.error("ログインユーザー情報の取得に失敗しました:", error);
      });

    return () => {
      mounted = false;
    };
  }, [schoolId, sessionUser]);

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    let mounted = true;

    fetchCategories(schoolId)
      .then((items) => {
        if (!mounted) return;
        setCategoryOptions(items);
      })
      .catch((error) => {
        console.error("カテゴリ一覧の取得に失敗しました:", error);
      });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    let mounted = true;

    fetchSchools()
      .then((schools) => {
        if (!mounted) return;
        const currentSchool = schools.find((school) => school.slug === schoolId);
        setSchoolName(currentSchool?.name || "");
      })
      .catch((error) => {
        console.error("学校一覧の取得に失敗しました:", error);
      });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  useEffect(() => {
    if (!schoolName) {
      return;
    }

    if (latitude && longitude) {
      return;
    }

    let mounted = true;

    searchLocationByQuery(schoolName, 1)
      .then((results) => {
        if (!mounted || results.length === 0) {
          return;
        }

        const firstResult = results[0];
        const resolvedName = extractLocationLabel(firstResult, schoolName);
        setLocationName((prev) => prev || resolvedName);
        setLatitude((prev) => prev || String(firstResult.lat || ""));
        setLongitude((prev) => prev || String(firstResult.lon || ""));
        setSearchQuery((prev) => prev || schoolName);
      })
      .catch((error) => {
        console.error("学校位置の初期取得に失敗しました:", error);
      });

    return () => {
      mounted = false;
    };
  }, [schoolName, latitude, longitude]);

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    let mounted = true;

    fetchClasses(schoolId)
      .then((items) => {
        if (!mounted) return;
        setClassOptions(items);
      })
      .catch((error) => {
        console.error("クラス一覧の取得に失敗しました:", error);
        if (!mounted) return;
        setClassOptions([]);
      });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !canUsePostEditor) {
      return;
    }

    let mounted = true;

    fetchArticles(schoolId)
      .then((items) => {
        if (!mounted) return;
        setActivityArticles(items);
        setDraftArticles(
          items.filter(
            (item) =>
              item.status === "private_draft" &&
              item.id !== editingArticleId &&
              item.authorUserId === currentUser?.id
          )
        );
      })
      .catch((error) => {
        console.error("下書き一覧の取得に失敗しました:", error);
      });

    return () => {
      mounted = false;
    };
  }, [schoolId, editingArticleId, currentUser?.id, canUsePostEditor]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (Number.isFinite(preselectedParentActivityId) && preselectedParentActivityId > 0) {
      setActivityType("child");
      setParentActivityId(preselectedParentActivityId);
      return;
    }

    setActivityType("parent");
    setParentActivityId(null);
  }, [preselectedParentActivityId, isEditMode]);

  useEffect(() => {
    if (!schoolId || !isEditMode) {
      return;
    }

    let mounted = true;
    setIsLoadingArticle(true);
    setPageError("");

    fetchArticleById(schoolId, editingArticleId)
      .then((article) => {
        if (!mounted) return;
        const isParentActivity = !article.parentActivityId;
        const canEditPublishedArticle = isAdmin || (currentUser?.role === "user" && article.authorUserId === currentUser.id && isParentActivity);
        if (!canEditPublishedArticle && article.status === "published") {
          setPageError("一般教員は公開済みの小活動を編集できません。");
          return;
        }
        setEditingArticleStatus(article.status || null);
        setTitle(article.title || "");
        setContent(article.content || "");
        setArticleDate(normalizeDateInputValue(article.date));
        setClassInfo(article.grade || "");
        setLocationName(article.location?.name || "");
        setLatitude(article.location?.lat ? String(article.location.lat) : "");
        setLongitude(article.location?.lng ? String(article.location.lng) : "");
        setSdgs((article.sdgIds || []).map((id) => String(id)));
        setCategories((article.categoryIds || []).map((id) => String(id)));
        setCompanies((article.companyIds || []).map((id) => String(id)));
        setSelectedLibraryImages(article.imageUrls || []);
        setParentActivityId(article.parentActivityId ?? null);
        setLinkedChildActivityIds(article.childActivityIds || []);
        setActivityType(
          article.parentActivityId
            ? "child"
            : "parent"
        );
      })
      .catch((error) => {
        if (!mounted) return;
        setEditingArticleStatus(null);
        setPageError(error instanceof Error ? error.message : "記事の取得に失敗しました。");
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingArticle(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [schoolId, editingArticleId, isEditMode, isAdmin, currentUser]);

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    let mounted = true;

    fetchImageLibrary(schoolId)
      .then((items) => {
        if (!mounted) return;
        setImageLibrary(items);
      })
      .catch((error) => {
        console.error("画像ライブラリの取得に失敗しました:", error);
      });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    let mounted = true;

    fetchCompanies(schoolId)
      .then((items) => {
        if (!mounted) return;
        setCompanyOptions(items);
      })
      .catch((error) => {
        console.error("企業一覧の取得に失敗しました:", error);
      });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  // SDGsのトグル
  const toggleSDG = (id: string) => {
    setSdgs(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // 関連企業のトグル
  const toggleCompany = (id: string) => {
    setCompanies(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // 新規企業を追加
  const addCustomCompany = async () => {
    if (!schoolId) {
      return;
    }

    const label = companyCustom.trim();
    if (!label) {
      return;
    }

    const existingOption = companyOptions.find((option) => option.label === label);
    if (existingOption) {
      setCompanies((prev) => (prev.includes(existingOption.id) ? prev : [...prev, existingOption.id]));
      setCompanyCustom("");
      return;
    }

    try {
      const newOption = await createCompany(schoolId, label);
      setCompanyOptions((prev) =>
        prev.some((option) => option.id === newOption.id) ? prev : [...prev, newOption]
      );
      setCompanies((prev) => (prev.includes(newOption.id) ? prev : [...prev, newOption.id]));
      setCompanyCustom("");
    } catch (error) {
      console.error("企業の追加に失敗しました:", error);
      alert("企業の追加に失敗しました。");
    }
  };

  const addCustomCategory = async () => {
    if (!schoolId) {
      return;
    }

    const label = categoryCustom.trim();
    if (!label) {
      return;
    }

    const existingOption = categoryOptions.find((option) => option.label === label);
    if (existingOption) {
      setCategories((prev) => (prev.includes(existingOption.id) ? prev : [...prev, existingOption.id]));
      setCategoryCustom("");
      return;
    }

    try {
      const newOption = await createCategory(schoolId, label);
      setCategoryOptions((prev) =>
        prev.some((option) => option.id === newOption.id) ? prev : [...prev, newOption]
      );
      setCategories((prev) => (prev.includes(newOption.id) ? prev : [...prev, newOption.id]));
      setCategoryCustom("");
    } catch (error) {
      console.error("カテゴリの追加に失敗しました:", error);
      alert("カテゴリの追加に失敗しました。");
    }
  };

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleLibraryImage = (url: string) => {
    setSelectedLibraryImages((prev) =>
      prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]
    );
  };

  const getSelectedImageMeta = (url: string, index: number) => {
    const selectedImage = imageLibrary.find((img) => img.url === url);
    return {
      name: selectedImage?.name || `保存済み画像 ${index + 1}`,
      className: selectedImage?.className || "",
      comment: selectedImage?.comment || "",
    };
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDeleteCompany = async () => {
    if (!schoolId) {
      return;
    }

    if (!companyToDelete) {
      return;
    }

    setDeletingCompanyId(companyToDelete.id);
    try {
      await deleteCompany(schoolId, companyToDelete.id);
      setCompanyOptions((prev) => prev.filter((item) => item.id !== companyToDelete.id));
      setCompanies((prev) => prev.filter((item) => item !== companyToDelete.id));
      setCompanyToDelete(null);
    } catch (error) {
      console.error("企業の削除に失敗しました:", error);
      alert("企業の削除に失敗しました。");
    } finally {
      setDeletingCompanyId(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!schoolId) {
      return;
    }

    if (!categoryToDelete) {
      return;
    }

    setDeletingCategoryId(categoryToDelete.id);
    try {
      await deleteCategory(schoolId, categoryToDelete.id);
      setCategoryOptions((prev) => prev.filter((item) => item.id !== categoryToDelete.id));
      setCategories((prev) => prev.filter((item) => item !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (error) {
      console.error("カテゴリの削除に失敗しました:", error);
      alert("カテゴリの削除に失敗しました。");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const availableActivityArticles = activityArticles.filter(
    (article) => article.id !== editingArticleId && !article.parentActivityId
  );
  const selectedParentArticle =
    parentActivityId == null
      ? null
      : availableActivityArticles.find((article) => article.id === parentActivityId) || null;

  const handleSaveArticle = async (status: "private_draft" | "pending" | "published") => {
    if (!schoolId) {
      alert("学校情報が見つかりません。");
      return;
    }

    if (!currentUser) {
      alert("ログイン情報が見つかりません。もう一度ログインしてください。");
      navigate(`/schools/${schoolId}`);
      return;
    }

    if (status === "published" && !title.trim()) {
      alert("公開するには記事タイトルが必要です。");
      return;
    }

    if (activityType === "child" && !parentActivityId) {
      alert("小活動として保存するには、親活動を選択してください。");
      return;
    }

    if (!isAdmin) {
      status = status === "private_draft" ? "private_draft" : "pending";
    }

    setSubmitMode(status);
    setIsSubmitting(true);
    try {
      const payload = {
        schoolId,
        userId: currentUser.id,
        status,
        title,
        content,
        date: articleDate,
        grade: classInfo,
        locationName,
        latitude,
        longitude,
        sdgIds: sdgs,
        categoryIds: categories,
        companyIds: companies,
        libraryImageUrls: selectedLibraryImages,
        uploadedImages: imagePreviews,
        parentActivityId: activityType === "child" ? parentActivityId : null,
        childActivityIds: activityType === "parent" ? linkedChildActivityIds : [],
      };

      if (isEditMode) {
        await updateArticleRequest(editingArticleId, payload);
        alert(status === "private_draft" ? "下書きを保存しました。" : "記事を更新しました。");
      } else {
        await createArticle(payload);
        alert(status === "private_draft" ? "下書きを保存しました。" : "記事を投稿しました。");
      }
      navigate(`/schools/${schoolId}/home`);
    } catch (error) {
      console.error("記事の投稿に失敗しました:", error);
      alert(error instanceof Error ? error.message : "記事の投稿に失敗しました。");
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;
    setIsSearching(true);
    setShowResults(true);
    try {
      const data = await searchLocationByQuery(searchQuery, 5);
      setSearchResults(data);
    } catch (error) {
      console.error("検索エラー:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: typeof searchResults[0]) => {
    setLatitude(result.lat);
    setLongitude(result.lon);
    setLocationName((prev) => prev || extractLocationLabel(result));
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    if (schoolId) {
      localStorage.setItem("currentSchoolId", schoolId);
    }
    await logoutCurrentUser();
    navigate(`/schools/${schoolId}/home`);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-[#fffaf0] min-h-screen pt-20" data-name="post-article">
        <Header onLogoutClick={() => setIsLogoutDialogOpen(true)} />
        
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              onClick={() => navigate(`/schools/${schoolId}/home`)}
              className="flex items-center gap-2 text-[rgba(0,0,0,0.6)] hover:text-[rgba(0,0,0,0.9)] transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px]">一覧に戻る</span>
            </button>
            {canUsePostEditor && (
              <button
                type="button"
                onClick={() => setIsDraftListOpen(true)}
                className="rounded-xl border border-[rgba(0,0,0,0.12)] bg-white px-5 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.72)] shadow-sm transition-all duration-200 hover:shadow-md"
              >
                下書きから編集
              </button>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-[rgba(0,0,0,0.1)]">
            <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)] mb-8">
              {isEditMode ? "記事を編集" : "記事を作成"}
            </h1>

            {pageError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-600">
                {pageError}
              </div>
            )}

            {isLoadingArticle && (
              <div className="mb-6 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-[14px] text-[rgba(0,0,0,0.7)]">
                記事情報を読み込み中です...
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSaveArticle(primarySubmitStatus);
              }}
              className="flex flex-col gap-7"
            >
              {/* 画像選択（アップロード or ライブラリから選択） */}
              <div className="flex flex-col gap-3">
                <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                  画像
                </label>

                {/* モード選択タブ */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode("upload");
                      setIsImageLibraryModalOpen(false);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] transition-all duration-200 ${
                      imageMode === "upload"
                        ? 'bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] text-[rgba(0,0,0,0.7)] shadow-md'
                        : 'bg-white border-2 border-[rgba(0,0,0,0.1)] text-[rgba(0,0,0,0.5)] hover:border-[rgba(255,209,131,0.5)]'
                    }`}
                  >
                    📤 画像をアップロード
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageMode("select");
                      setIsImageLibraryModalOpen(true);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] transition-all duration-200 ${
                      imageMode === "select"
                        ? 'bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] text-[rgba(0,0,0,0.7)] shadow-md'
                        : 'bg-white border-2 border-[rgba(0,0,0,0.1)] text-[rgba(0,0,0,0.5)] hover:border-[rgba(255,209,131,0.5)]'
                    }`}
                  >
                    🖼️ ライブラリから選択
                  </button>
                </div>

                <div className="flex items-center gap-4 px-1">
                  <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.52)]">
                    アップロード: {images.length}枚
                  </p>
                  <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.52)]">
                    ライブラリ: {selectedLibraryImages.length}枚
                  </p>
                </div>

                {(imagePreviews.length > 0 || selectedLibraryImages.length > 0) && (
                  <div className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,250,240,0.7)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.76)]">
                        選択中の写真
                      </p>
                      <p className="text-[12px] text-[rgba(0,0,0,0.52)]">
                        編集時はここから写真を外せます
                      </p>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-3 text-[12px] font-medium text-[rgba(0,0,0,0.52)]">アップロード済み</p>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={`${preview}-${index}`} className="relative overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white">
                              <img
                                src={preview}
                                alt={images[index]?.name || `upload-${index + 1}`}
                                className="h-32 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(index)}
                                className="absolute right-2 top-2 rounded-full bg-white/92 p-2 shadow-md transition-colors hover:bg-white"
                              >
                                <X size={16} className="text-[rgba(0,0,0,0.72)]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedLibraryImages.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-3 text-[12px] font-medium text-[rgba(0,0,0,0.52)]">保存済みの写真</p>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          {selectedLibraryImages.map((url, index) => {
                            const selectedImage = getSelectedImageMeta(url, index);
                            return (
                              <div key={`${url}-${index}`} className="relative overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] bg-white">
                                <img
                                  src={url}
                                  alt={selectedImage.name}
                                  className="h-32 w-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleLibraryImage(url)}
                                  className="absolute right-2 top-2 rounded-full bg-white/92 p-2 shadow-md transition-colors hover:bg-white"
                                >
                                  <X size={16} className="text-[rgba(0,0,0,0.72)]" />
                                </button>
                                {selectedImage.name && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                                    <p className="truncate text-[12px] font-medium text-white">{selectedImage.name}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 画像アップロード */}
                {imageMode === "upload" && (
                  <div className="border-2 border-dashed border-[rgba(0,0,0,0.2)] rounded-xl overflow-hidden hover:border-[rgba(255,209,131,0.93)] transition-all duration-200 bg-gradient-to-br from-[#f9f9f9] to-white">
                    {imagePreviews.length === 0 ? (
                      <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer p-8">
                        <Upload size={40} className="text-[rgba(0,0,0,0.4)] mb-3" />
                        <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[16px] text-[rgba(0,0,0,0.6)] mb-2">
                          クリックして画像をアップロード
                        </span>
                        <span className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] text-[rgba(0,0,0,0.5)]">
                          複数の写真をまとめて選択できます
                        </span>
                      </label>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.65)]">
                            {images.length}枚の画像を選択中
                          </p>
                          <label
                            htmlFor="image-upload"
                            className="bg-white/90 hover:bg-white rounded-lg px-4 py-2 shadow-lg cursor-pointer transition-all duration-200 flex items-center gap-2"
                          >
                            <Upload size={16} className="text-[rgba(0,0,0,0.7)]" />
                            <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                              画像を追加
                            </span>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={`${preview}-${index}`} className="relative rounded-xl overflow-hidden bg-white border border-[rgba(0,0,0,0.08)]">
                              <img
                                src={preview}
                                alt={images[index]?.name || `upload-${index + 1}`}
                                className="w-full h-40 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(index)}
                                className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
                              >
                                <X size={18} className="text-[rgba(0,0,0,0.7)]" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                                <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[12px] text-white truncate">
                                  {images[index]?.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const selectedFiles = Array.from(e.target.files || []);
                        if (selectedFiles.length === 0) {
                          return;
                        }

                        const nextPreviews = await Promise.all(
                          selectedFiles.map(
                            (file) =>
                              new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(String(reader.result || ""));
                                reader.readAsDataURL(file);
                              })
                          )
                        );

                        setImages((prev) => [...prev, ...selectedFiles]);
                        setImagePreviews((prev) => [...prev, ...nextPreviews]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}

                {/* 画像ライブラリから選択 */}
                {imageMode === "select" && (
                  <div className="border-2 border-[rgba(0,0,0,0.2)] rounded-xl p-4 bg-gradient-to-br from-[#f9f9f9] to-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.65)]">
                          ライブラリから写真を選択
                        </p>
                        <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.5)] mt-1">
                          {selectedLibraryImages.length > 0 ? `${selectedLibraryImages.length}枚を選択中` : "未選択"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsImageLibraryModalOpen(true)}
                        className="rounded-lg border border-[rgba(0,0,0,0.12)] bg-white px-4 py-2 font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[13px] text-[rgba(0,0,0,0.7)] transition-colors hover:bg-[rgba(255,209,131,0.16)]"
                      >
                        ライブラリを開く
                      </button>
                    </div>
                    {selectedLibraryImages.length > 0 && (
                      <div className="mt-4 p-4 bg-white rounded-xl border-2 border-[rgba(255,209,131,0.5)] shadow-md">
                        <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.8)] mb-3">
                          ✓ {selectedLibraryImages.length}枚を選択中
                        </p>
                        <div className="flex flex-col gap-3">
                          {selectedLibraryImages.map((url, index) => {
                            const selectedImage = getSelectedImageMeta(url, index);
                            return (
                              <div key={url} className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.8)] mb-1">
                                    {selectedImage.name}
                                  </p>
                                  {selectedImage.className && (
                                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.5)] mb-1">
                                      {selectedImage.className}
                                    </p>
                                  )}
                                  {selectedImage.comment && (
                                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] text-[rgba(0,0,0,0.6)] leading-relaxed">
                                      {selectedImage.comment}
                                    </p>
                                  )}
                                  {!selectedImage.className && !selectedImage.comment && (
                                    <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.5)]">
                                      下書きに保存されている画像です
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleLibraryImage(url)}
                                  className="text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.8)] hover:bg-[rgba(0,0,0,0.05)] rounded-full p-1 transition-colors"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedLibraryImages.length === 0 && (
                      <p className="mt-4 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] text-[rgba(0,0,0,0.5)]">
                        ライブラリを開いて写真を選択してください
                      </p>
                    )}
                  </div>
                )}
              </div>


              {/* タイトル */}
              <div className="flex flex-col gap-3">
                <label htmlFor="title" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                  記事タイトル
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                  placeholder="記事のタイトルを入力"
                />
              </div>

              {/* SDGs */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsSDGsOpen(!isSDGsOpen)}
                  className="flex items-center justify-between bg-gradient-to-br from-white to-[#fffdf7] border-2 border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)] rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-md"
                >
                  <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">
                    SDGs {sdgs.length > 0 && <span className="ml-2 text-[rgba(0,0,0,0.5)]">({sdgs.length}件選択中)</span>}
                  </span>
                  <ChevronDown 
                    size={20} 
                    className="text-[rgba(0,0,0,0.5)]" 
                  />
                </button>
              </div>

              {/* カテゴリ */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="flex items-center justify-between bg-gradient-to-br from-white to-[#fffdf7] border-2 border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)] rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-md"
                >
                  <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">
                    カテゴリ {categories.length > 0 && <span className="ml-2 text-[rgba(0,0,0,0.5)]">({categories.length}件選択中)</span>}
                  </span>
                  <ChevronDown 
                    size={20} 
                    className="text-[rgba(0,0,0,0.5)]" 
                  />
                </button>
              </div>

              {/* 学年・クラス */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsClassOpen(!isClassOpen)}
                  className="flex items-center justify-between bg-gradient-to-br from-white to-[#fffdf7] border-2 border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)] rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-md"
                >
                  <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">
                    学年・クラス {classInfo && <span className="ml-2 text-[rgba(0,0,0,0.5)]">({classInfo})</span>}
                  </span>
                  <ChevronDown 
                    size={20} 
                    className="text-[rgba(0,0,0,0.5)]" 
                  />
                </button>
              </div>

              {/* 関連企業 */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                  className="flex items-center justify-between bg-gradient-to-br from-white to-[#fffdf7] border-2 border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)] rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-md"
                >
                  <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">
                    関連企業 {companies.length > 0 && <span className="ml-2 text-[rgba(0,0,0,0.5)]">({companies.length}件選択中)</span>}
                  </span>
                  <ChevronDown 
                    size={20} 
                    className="text-[rgba(0,0,0,0.5)]" 
                  />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(true)}
                  className="flex items-center justify-between bg-gradient-to-br from-white to-[#fffdf7] border-2 border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)] rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-md"
                >
                  <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">
                    親活動・子活動の紐付け
                  </span>
                  <ChevronDown size={20} className="text-[rgba(0,0,0,0.5)]" />
                </button>
                <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,250,240,0.65)] px-4 py-4">
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.75)]">
                    {activityType === "parent"
                      ? "親活動として設定中"
                      : "小活動として設定中"}
                  </p>
                  {activityType === "parent" && (
                    <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-relaxed text-[rgba(0,0,0,0.56)]">
                      親活動を先に作成し、この詳細ページから小活動を追加してください。
                    </p>
                  )}
                  {activityType === "child" && (
                    <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-relaxed text-[rgba(0,0,0,0.56)]">
                      {selectedParentArticle
                        ? `親活動: ${selectedParentArticle.title || "無題の記事"}`
                        : "まだ親活動は選択されていません"}
                    </p>
                  )}
                </div>
              </div>

              {/* 場所の入力 */}
              <div className="flex flex-col gap-3">
                <label htmlFor="location-name" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                  場所の名前
                </label>
                <input
                  id="location-name"
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                  placeholder="例: 横浜ランドマークタワー"
                />
              </div>

              {/* 場所を検索 */}
              <div className="flex flex-col gap-3">
                <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1 flex items-center gap-2">
                  <Search size={16} />
                  場所を検索して緯度経度を取得
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      handleSearch();
                    }}
                    className="flex-1 bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-3 text-[14px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                    placeholder="場所の名前を入力（例: 横浜駅）"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-3 px-5 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.7)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[rgba(0,0,0,0.3)] border-t-transparent rounded-full animate-spin" />
                        検索中...
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        検索
                      </>
                    )}
                  </button>
                </div>

                {/* 検索結果 */}
                {showResults && searchResults.length > 0 && (
                  <div className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl p-3 shadow-lg max-h-64 overflow-y-auto">
                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[13px] text-[rgba(0,0,0,0.5)] mb-2 px-2">
                      {searchResults.length}件の結果が見つかりました
                    </p>
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left px-3 py-2 hover:bg-gradient-to-br hover:from-[rgba(255,209,131,0.2)] hover:to-[rgba(255,220,150,0.2)] rounded-lg transition-all duration-200 border-b border-[rgba(0,0,0,0.05)] last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-[rgba(0,0,0,0.4)] mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.8)]">
                              {result.display_name}
                            </p>
                            <p className="text-[12px] text-[rgba(0,0,0,0.5)] mt-1">
                              緯度: {parseFloat(result.lat).toFixed(6)}, 経度: {parseFloat(result.lon).toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchResults.length === 0 && !isSearching && (
                  <div className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl p-6 text-center">
                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.5)]">
                      検索結果が見つかりませんでした
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <label htmlFor="article-date" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                  記事の日付
                </label>
                <input
                  id="article-date"
                  type="date"
                  value={articleDate}
                  onChange={(e) => setArticleDate(e.target.value)}
                  min="1000-01-01"
                  max="9999-12-31"
                  className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                />
              </div>

              {/* 地図表示 */}
              <div className="flex flex-col gap-3">
                <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                  地図表示
                </label>
                <LocationMap
                  latitude={latitude}
                  longitude={longitude}
                  locationName={locationName}
                  onSelectLocation={({ latitude: nextLatitude, longitude: nextLongitude, locationName: nextLocationName }) => {
                    setLatitude(nextLatitude);
                    setLongitude(nextLongitude);
                    setLocationName(nextLocationName);
                  }}
                />
              </div>

              {/* 本文 */}
              <div className="flex flex-col gap-3">
                <label htmlFor="content" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                  本文
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)] resize-y"
                  placeholder="記事の内容を入力"
                  required
                />
              </div>

              {/* 投稿ボタン */}
              <div className={`mt-6 grid grid-cols-1 gap-3 ${isAdmin ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSaveArticle("private_draft")}
                  className="rounded-xl border-2 border-[rgba(0,0,0,0.12)] bg-white py-4 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.72)] shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting && submitMode === "private_draft"
                    ? "保存中..."
                    : canReturnPendingToDraft
                      ? "下書きに戻す"
                      : "下書きを保存"}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleSaveArticle("pending")}
                    className="rounded-xl border-2 border-[rgba(0,0,0,0.12)] bg-[rgba(255,250,240,0.9)] py-4 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.72)] shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting && submitMode === "pending" ? "保存中..." : "この内容で公開承認を依頼"}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-4 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.7)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting && submitMode === primarySubmitStatus
                    ? isEditMode
                      ? "更新中..."
                      : "登録中..."
                    : isAdmin
                      ? isEditMode
                        ? "公開内容を更新"
                        : "公開して登録"
                      : "この内容で公開承認を依頼"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isLogoutDialogOpen}
        title="ログアウトしますか？"
        description="ログアウトすると、教員向けの操作メニューは閉じられます。"
        confirmLabel="ログアウト"
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => {
          void handleLogout();
        }}
      />

      {/* SDGs モーダル */}
      <ModalShell
        open={isDraftListOpen}
        title="下書きから編集"
        onClose={() => setIsDraftListOpen(false)}
        maxWidthClassName="max-w-2xl"
        footer={
          <button
            type="button"
            onClick={() => setIsDraftListOpen(false)}
            className="w-full rounded-[20px] bg-gradient-to-r from-[rgba(245,158,11,0.96)] to-[rgba(251,191,36,0.96)] py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] text-[16px] font-semibold text-white shadow-md transition-all duration-200 hover:opacity-95"
          >
            閉じる
          </button>
        }
      >
              {draftArticles.length === 0 && (
                <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-8 text-center">
                  <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.5)]">
                    編集できる下書きはありません
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {draftArticles.map((draft) => (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => {
                      setIsDraftListOpen(false);
                      navigate(`/schools/${schoolId}/post?articleId=${draft.id}`);
                    }}
                    className="rounded-xl border-2 border-[rgba(0,0,0,0.08)] bg-gradient-to-br from-white to-[#fffdf7] px-4 py-4 text-left transition-all duration-200 hover:border-[rgba(255,209,131,0.93)] hover:shadow-md"
                  >
                    <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.82)]">
                      {draft.title || "無題の下書き"}
                    </p>
                    <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-relaxed text-[rgba(0,0,0,0.58)] line-clamp-2">
                      {draft.content || "本文は未入力です"}
                    </p>
                    <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.45)]">
                      {draft.date || "日付未設定"}
                    </p>
                  </button>
                ))}
              </div>
      </ModalShell>

      {isActivityModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setIsActivityModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                親活動・子活動を設定
              </h3>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)] space-y-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivityType("parent");
                    setParentActivityId(null);
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 ${
                    activityType === "parent"
                      ? "border-[rgba(255,209,131,0.93)] bg-[rgba(255,248,230,0.9)] shadow-md"
                      : "border-[rgba(0,0,0,0.08)] bg-white hover:border-[rgba(255,209,131,0.5)]"
                  }`}
                >
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.78)]">
                    親活動
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
                    まず親活動を作成し、詳細画面から小活動を追加します
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivityType("child");
                    if (Number.isFinite(preselectedParentActivityId) && preselectedParentActivityId > 0) {
                      setParentActivityId(preselectedParentActivityId);
                    }
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 ${
                    activityType === "child"
                      ? "border-[rgba(255,209,131,0.93)] bg-[rgba(255,248,230,0.9)] shadow-md"
                      : "border-[rgba(0,0,0,0.08)] bg-white hover:border-[rgba(255,209,131,0.5)]"
                  }`}
                >
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.78)]">
                    小活動
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
                    親活動の詳細画面から作成する想定です
                  </p>
                </button>
              </div>

              {activityType === "parent" && (
                <div className="space-y-3">
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.74)]">
                    親活動の作成について
                  </p>
                  <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-5 text-[14px] leading-relaxed text-[rgba(0,0,0,0.6)]">
                    親活動を保存したあと、記事詳細画面に表示される「小活動を作成」ボタンから、この親活動に紐付く小活動を追加できます。
                  </div>
                </div>
              )}

              {activityType === "child" && (
                <div className="space-y-3">
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.74)]">
                    紐付ける親活動を選択
                  </p>
                  {availableActivityArticles.length === 0 && (
                    <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-8 text-center text-[14px] text-[rgba(0,0,0,0.5)]">
                      紐付けできる親活動がありません
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    {availableActivityArticles.map((activityArticle) => {
                      const isSelected = parentActivityId === activityArticle.id;
                      return (
                        <button
                          key={activityArticle.id}
                          type="button"
                          onClick={() => setParentActivityId((prev) => (prev === activityArticle.id ? null : activityArticle.id))}
                          className={`rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-[rgba(255,209,131,0.93)] bg-[rgba(255,248,230,0.9)] shadow-md"
                              : "border-[rgba(0,0,0,0.08)] bg-white hover:border-[rgba(255,209,131,0.5)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.8)]">
                                {activityArticle.title || "無題の記事"}
                              </p>
                              <p className="mt-2 text-[13px] text-[rgba(0,0,0,0.55)]">
                                {activityArticle.grade || "学年未設定"} / {activityArticle.date || "日付未設定"}
                              </p>
                            </div>
                            {isSelected && <Check size={18} className="text-[rgba(0,0,0,0.72)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)]">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="w-full bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                設定を閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {isSDGsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsSDGsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                SDGsを選択
              </h3>
              <button
                type="button"
                onClick={() => setIsSDGsOpen(false)}
                className="hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="grid grid-cols-2 gap-3">
                {sdgOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleSDG(option.id)}
                    className={`border-2 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:shadow-md ${
                      sdgs.includes(option.id) 
                        ? 'bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]' 
                        : 'bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        sdgs.includes(option.id) 
                          ? 'bg-white border-[rgba(0,0,0,0.3)]' 
                          : 'border-[rgba(0,0,0,0.3)]'
                      }`}>
                        {sdgs.includes(option.id) && <Check size={12} className="text-[rgba(0,0,0,0.7)]" />}
                      </div>
                      <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)]">
              <button
                type="button"
                onClick={() => setIsSDGsOpen(false)}
                className="w-full bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カテゴリ モーダル */}
      {isCategoryOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsCategoryOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                カテゴリを選択
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryOpen(false)}
                className="hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {categoryOptions.map(option => (
                  <div
                    key={option.id}
                    className={`border-2 rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-md ${
                      categories.includes(option.id)
                        ? 'bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]'
                        : 'bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCategory(option.id)}
                        className="flex items-start gap-2 text-left flex-1 min-w-0"
                      >
                        <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          categories.includes(option.id)
                            ? 'bg-white border-[rgba(0,0,0,0.3)]'
                            : 'border-[rgba(0,0,0,0.3)]'
                        }`}>
                          {categories.includes(option.id) && <Check size={12} className="text-[rgba(0,0,0,0.7)]" />}
                        </div>
                        <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)] break-words">
                          {option.label}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(option)}
                        disabled={deletingCategoryId === option.id}
                        className="shrink-0 rounded-lg p-2 text-[rgba(0,0,0,0.45)] hover:bg-white/60 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`${option.label} を削除`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                  新規カテゴリを追加
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={categoryCustom}
                    onChange={(e) => setCategoryCustom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      addCustomCategory();
                    }}
                    className="flex-1 bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-3 text-[14px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                    placeholder="カテゴリ名を入力"
                  />
                  <button
                    type="button"
                    onClick={addCustomCategory}
                    className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-3 px-5 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.7)] flex items-center gap-2"
                  >
                    <Plus size={16} />
                    追加
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)]">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(false)}
                className="w-full bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      {isImageLibraryModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setIsImageLibraryModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                  ライブラリから選択
                </h3>
                <p className="mt-1 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] text-[rgba(0,0,0,0.6)]">
                  写真、名前、クラス、コメントを確認して選択できます
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImageLibraryModalOpen(false)}
                className="hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {imageLibrary.length === 0 && (
                <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] px-4 py-10 text-center">
                  <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.5)]">
                    ライブラリに表示できる画像がありません
                  </p>
                </div>
              )}
              {imageLibrary.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {imageLibrary.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => toggleLibraryImage(img.url)}
                      className={`flex items-stretch gap-4 rounded-xl border-2 p-3 text-left transition-all duration-200 hover:shadow-md ${
                        selectedLibraryImages.includes(img.url)
                          ? "bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]"
                          : "bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]"
                      }`}
                    >
                      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="h-full w-full object-cover"
                        />
                        {selectedLibraryImages.includes(img.url) && (
                          <div className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-lg">
                            <Check size={14} className="text-[rgba(0,0,0,0.7)]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.8)]">
                          {img.name}
                        </p>
                        <p className="mt-1 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.5)]">
                          {img.className || "クラス未設定"}
                        </p>
                        <p className="mt-3 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-relaxed text-[rgba(0,0,0,0.62)]">
                          {img.comment || "コメントなし"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.5)]">
                  {selectedLibraryImages.length}枚を選択中
                </p>
                <button
                  type="button"
                  onClick={() => setIsImageLibraryModalOpen(false)}
                  className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 px-6 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  完了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学年・クラス モーダル */}
      {isClassOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsClassOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                学年・クラスを選択
              </h3>
              <button
                type="button"
                onClick={() => setIsClassOpen(false)}
                className="hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {classOptions.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {classOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setClassInfo(option.label);
                        setIsClassOpen(false);
                      }}
                      className={`border-2 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:shadow-md ${
                        classInfo === option.label
                          ? 'bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]'
                          : 'bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-4 h-4 rounded-full border-2 border-[rgba(0,0,0,0.3)] flex items-center justify-center">
                          {classInfo === option.label && <div className="w-2 h-2 rounded-full bg-[rgba(0,0,0,0.7)]" />}
                        </div>
                        <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.03)] px-4 py-5 text-[14px] text-[rgba(0,0,0,0.55)]">
                  この学校に表示できるクラスがまだ登録されていません。
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)]">
              <button
                type="button"
                onClick={() => setIsClassOpen(false)}
                className="w-full bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 関連企業 モーダル */}
      {isCompanyOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 100 }}
          onClick={() => setIsCompanyOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                関連企業を選択
              </h3>
              <button
                type="button"
                onClick={() => setIsCompanyOpen(false)}
                className="hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {companyOptions.map(option => (
                  <div
                    key={option.id}
                    className={`border-2 rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-md ${
                      companies.includes(option.id)
                        ? 'bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]'
                        : 'bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCompany(option.id)}
                        className="flex items-start gap-2 text-left flex-1 min-w-0"
                      >
                        <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          companies.includes(option.id)
                            ? 'bg-white border-[rgba(0,0,0,0.3)]'
                            : 'border-[rgba(0,0,0,0.3)]'
                        }`}>
                          {companies.includes(option.id) && <Check size={12} className="text-[rgba(0,0,0,0.7)]" />}
                        </div>
                        <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)] break-words">
                          {option.label}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompanyToDelete(option)}
                        disabled={deletingCompanyId === option.id}
                        className="shrink-0 rounded-lg p-2 text-[rgba(0,0,0,0.45)] hover:bg-white/60 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`${option.label} を削除`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                  新規企業を追加
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={companyCustom}
                    onChange={(e) => setCompanyCustom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      addCustomCompany();
                    }}
                    className="flex-1 bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-3 text-[14px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                    placeholder="企業名を入力"
                  />
                  <button
                    type="button"
                    onClick={addCustomCompany}
                    className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-3 px-5 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.7)] flex items-center gap-2"
                  >
                    <Plus size={16} />
                    追加
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)]">
              <button
                type="button"
                onClick={() => setIsCompanyOpen(false)}
                className="w-full bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalShell
        open={Boolean(categoryToDelete)}
        title="カテゴリを削除"
        onClose={() => {
          if (!deletingCategoryId) {
            setCategoryToDelete(null);
          }
        }}
        maxWidthClassName="max-w-md"
        zIndexClassName="z-[400]"
        zIndex={1000}
        panelClassName="rounded-2xl shadow-2xl"
        headerClassName="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] pb-8"
        bodyClassName="pt-12"
        footerClassName="bg-gradient-to-br from-[#f9f9f9] to-white"
        closeDisabled={Boolean(deletingCategoryId)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCategoryToDelete(null)}
              disabled={Boolean(deletingCategoryId)}
              className="flex-1 rounded-xl border border-[rgba(0,0,0,0.12)] bg-white py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] text-[15px] font-semibold text-[rgba(0,0,0,0.65)] transition-all duration-200 hover:bg-[rgba(0,0,0,0.03)] disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDeleteCategory}
              disabled={Boolean(deletingCategoryId)}
              className="flex-1 rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] text-[15px] font-semibold shadow-md transition-all duration-200 hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: "#e06a63", border: "1px solid #c85b55", color: "#ffffff" }}
            >
              {deletingCategoryId ? "削除中..." : "削除する"}
            </button>
          </div>
        }
      >
        {categoryToDelete && (
          <div className="rounded-xl bg-gradient-to-br from-white to-[#fffdf7] px-4 py-4">
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[15px] leading-[1.8] text-[rgba(0,0,0,0.72)]">
              「{categoryToDelete.label}」をカテゴリ一覧から削除します。
            </p>
            <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-[1.7] text-[rgba(0,0,0,0.5)]">
              この操作は取り消せません。選択済みの記事カテゴリからも外れます。
            </p>
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={Boolean(companyToDelete)}
        title="企業を削除"
        onClose={() => {
          if (!deletingCompanyId) {
            setCompanyToDelete(null);
          }
        }}
        maxWidthClassName="max-w-md"
        zIndexClassName="z-[400]"
        zIndex={1000}
        panelClassName="rounded-2xl shadow-2xl"
        headerClassName="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] pb-8"
        bodyClassName="pt-12"
        footerClassName="bg-gradient-to-br from-[#f9f9f9] to-white"
        closeDisabled={Boolean(deletingCompanyId)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCompanyToDelete(null)}
              disabled={Boolean(deletingCompanyId)}
              className="flex-1 rounded-xl border border-[rgba(0,0,0,0.12)] bg-white py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] text-[15px] font-semibold text-[rgba(0,0,0,0.65)] transition-all duration-200 hover:bg-[rgba(0,0,0,0.03)] disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDeleteCompany}
              disabled={Boolean(deletingCompanyId)}
              className="flex-1 rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] text-[15px] font-semibold shadow-md transition-all duration-200 hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: "#e06a63", border: "1px solid #c85b55", color: "#ffffff" }}
            >
              {deletingCompanyId ? "削除中..." : "削除する"}
            </button>
          </div>
        }
      >
        {companyToDelete && (
          <div className="rounded-xl bg-gradient-to-br from-white to-[#fffdf7] px-4 py-4">
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[15px] leading-[1.8] text-[rgba(0,0,0,0.72)]">
              「{companyToDelete.label}」を企業一覧から削除します。
            </p>
            <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-[1.7] text-[rgba(0,0,0,0.5)]">
              この操作は取り消せません。関連企業として選択済みの項目からも外れます。
            </p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
