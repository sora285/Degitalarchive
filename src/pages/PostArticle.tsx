import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Upload, LogOut, MapPin, Search, Check, Plus, X, ChevronDown, Trash2 } from "lucide-react";
import { clearSession, getCurrentUser } from "../lib/session";
import { createCategory, fetchCategories, type CategoryOption } from "../lib/categories";
import { createCompany, deleteCompany, fetchCompanies, type CompanyOption } from "../lib/companies";
import { fetchImageLibrary, type ImageLibraryItem } from "../lib/imageLibrary";
import { ArticleData, createArticle, fetchArticleById, fetchArticles, updateArticle as updateArticleRequest } from "../lib/articles";

// 地図コンポーネント
function LocationMap({ 
  latitude, 
  longitude, 
  locationName 
}: { 
  latitude: string; 
  longitude: string; 
  locationName: string;
}) {
  if (!latitude || !longitude) {
    return (
      <div className="bg-gradient-to-br from-[#f9f9f9] to-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl p-8 text-center">
        <MapPin size={40} className="mx-auto text-[rgba(0,0,0,0.3)] mb-3" />
        <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.5)]">
          場所を検索すると地図が表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[rgba(255,209,131,1)]" />
          <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.8)]">
            {locationName || '選択された場所'}
          </span>
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border border-[rgba(0,0,0,0.1)]">
        <iframe
          src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Google Map"
        />
      </div>
      <p className="text-[12px] text-[rgba(0,0,0,0.5)] mt-2 text-center">
        緯度: {parseFloat(latitude).toFixed(6)}, 経度: {parseFloat(longitude).toFixed(6)}
      </p>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser();

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
              onClick={() => {
                clearSession();
                navigate('/');
              }}
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
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const canEditPublishedArticle = isAdmin;
  const canUsePostEditor = Boolean(currentUser);
  const editingArticleId = Number(searchParams.get("articleId") || 0);
  const isEditMode = Number.isFinite(editingArticleId) && editingArticleId > 0;
  const [title, setTitle] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoryCustom, setCategoryCustom] = useState("");
  const [sdgs, setSdgs] = useState<string[]>([]);
  const [isSDGsOpen, setIsSDGsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [classInfo, setClassInfo] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyOption | null>(null);
  const [companyCustom, setCompanyCustom] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageMode, setImageMode] = useState<"upload" | "select">("upload");
  const [imageLibrary, setImageLibrary] = useState<ImageLibraryItem[]>([]);
  const [selectedLibraryImages, setSelectedLibraryImages] = useState<string[]>([]);
  const [isImageLibraryModalOpen, setIsImageLibraryModalOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"draft" | "published" | null>(null);
  const [pageError, setPageError] = useState("");
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [draftArticles, setDraftArticles] = useState<ArticleData[]>([]);
  const [isDraftListOpen, setIsDraftListOpen] = useState(false);
  const [activityArticles, setActivityArticles] = useState<ArticleData[]>([]);

  // 親子活動関連のstate
  const [activityType, setActivityType] = useState<"parent" | "child" | "none">("none");
  const [parentActivityId, setParentActivityId] = useState<number | null>(null);
  const [childActivityIds, setChildActivityIds] = useState<number[]>([]);
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

  // 学年・クラスの選択肢
  const classOptions = [
    { id: "5-1", label: "5年1組" },
    { id: "5-2", label: "5年2組" },
    { id: "6-1", label: "6年1組" },
    { id: "6-2", label: "6年2組" },
  ];

  const primarySubmitStatus: "draft" | "published" = isAdmin ? "published" : "draft";

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
              item.status === "draft" &&
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
  }, [schoolId, isAdmin, editingArticleId, currentUser?.id]);

  useEffect(() => {
    if (!schoolId || !isEditMode || !canUsePostEditor) {
      return;
    }

    let mounted = true;
    setIsLoadingArticle(true);
    setPageError("");

    fetchArticleById(schoolId, editingArticleId)
      .then((article) => {
        if (!mounted) return;
        if (!canEditPublishedArticle && article.status !== "draft") {
          setPageError("一般教員は非公開の記事のみ編集できます。");
          return;
        }
        setTitle(article.title || "");
        setContent(article.content || "");
        setClassInfo(article.grade || "");
        setLocationName(article.location?.name || "");
        setLatitude(article.location?.lat ? String(article.location.lat) : "");
        setLongitude(article.location?.lng ? String(article.location.lng) : "");
        setSdgs((article.sdgIds || []).map((id) => String(id)));
        setCategories((article.categoryIds || []).map((id) => String(id)));
        setCompanies((article.companyIds || []).map((id) => String(id)));
        setSelectedLibraryImages(article.imageUrls || []);
        setParentActivityId(article.parentActivityId ?? null);
        setChildActivityIds(article.childActivityIds || []);
        setActivityType(
          article.parentActivityId
            ? "child"
            : (article.childActivityIds || []).length > 0
              ? "parent"
              : "none"
        );
      })
      .catch((error) => {
        if (!mounted) return;
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
  }, [schoolId, editingArticleId, isEditMode, canUsePostEditor, canEditPublishedArticle]);

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

  // 小活動をトグル
  const toggleChildActivity = (id: number) => {
    setChildActivityIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const availableActivityArticles = activityArticles.filter((article) => article.id !== editingArticleId);
  const selectedParentArticle =
    parentActivityId == null
      ? null
      : availableActivityArticles.find((article) => article.id === parentActivityId) || null;
  const selectedChildArticles = availableActivityArticles.filter((article) =>
    childActivityIds.includes(article.id)
  );

  const handleSaveArticle = async (status: "draft" | "published") => {
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

    if (!isAdmin) {
      status = "draft";
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
        childActivityIds: activityType === "parent" ? childActivityIds : [],
      };

      if (isEditMode) {
        await updateArticleRequest(editingArticleId, payload);
        alert(status === "draft" ? "下書きを保存しました。" : "記事を更新しました。");
      } else {
        await createArticle(payload);
        alert(status === "draft" ? "下書きを保存しました。" : "記事を投稿しました。");
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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("検索エラー:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: typeof searchResults[0]) => {
    setLocationName(result.display_name);
    setLatitude(result.lat);
    setLongitude(result.lon);
    setShowResults(false);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-[#fffaf0] min-h-screen pt-20" data-name="post-article">
        <Header />
        
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
                          {selectedLibraryImages.map((url) => {
                            const selectedImage = imageLibrary.find((img) => img.url === url);
                            if (!selectedImage) {
                              return null;
                            }

                            return (
                              <div key={url} className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.8)] mb-1">
                                    {selectedImage.name}
                                  </p>
                                  <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.5)] mb-1">
                                    {selectedImage.className || "クラス未設定"}
                                  </p>
                                  <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] text-[rgba(0,0,0,0.6)] leading-relaxed">
                                    {selectedImage.comment}
                                  </p>
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
                    学年・クラス {classInfo && <span className="ml-2 text-[rgba(0,0,0,0.5)]">({classOptions.find(opt => opt.id === classInfo)?.label})</span>}
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
                      : activityType === "child"
                        ? "子活動として設定中"
                        : "親子活動の設定なし"}
                  </p>
                  {activityType === "parent" && (
                    <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-relaxed text-[rgba(0,0,0,0.56)]">
                      {selectedChildArticles.length > 0
                        ? `${selectedChildArticles.length}件の子活動を紐付けています`
                        : "まだ子活動は選択されていません"}
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

              {/* 地図表示 */}
              <div className="flex flex-col gap-3">
                <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                  地図表示
                </label>
                <LocationMap
                  latitude={latitude}
                  longitude={longitude}
                  locationName={locationName}
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
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSaveArticle("draft")}
                  className="rounded-xl border-2 border-[rgba(0,0,0,0.12)] bg-white py-4 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.72)] shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting && submitMode === "draft" ? "保存中..." : "下書きを保存"}
                </button>
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
                      : isEditMode
                        ? "非公開記事を更新"
                        : "非公開記事を登録"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SDGs モーダル */}
      {isDraftListOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsDraftListOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                下書きから編集
              </h3>
              <button
                type="button"
                onClick={() => setIsDraftListOpen(false)}
                className="hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
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
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)]">
              <button
                type="button"
                onClick={() => setIsDraftListOpen(false)}
                className="w-full bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setActivityType("none");
                    setParentActivityId(null);
                    setChildActivityIds([]);
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 ${
                    activityType === "none"
                      ? "border-[rgba(255,209,131,0.93)] bg-[rgba(255,248,230,0.9)] shadow-md"
                      : "border-[rgba(0,0,0,0.08)] bg-white hover:border-[rgba(255,209,131,0.5)]"
                  }`}
                >
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.78)]">
                    設定しない
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
                    親活動・子活動の紐付けを使わない
                  </p>
                </button>
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
                    この記事に子活動を複数紐付ける
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivityType("child");
                    setChildActivityIds([]);
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all duration-200 ${
                    activityType === "child"
                      ? "border-[rgba(255,209,131,0.93)] bg-[rgba(255,248,230,0.9)] shadow-md"
                      : "border-[rgba(0,0,0,0.08)] bg-white hover:border-[rgba(255,209,131,0.5)]"
                  }`}
                >
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.78)]">
                    子活動
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
                    この記事を親活動に紐付ける
                  </p>
                </button>
              </div>

              {activityType === "parent" && (
                <div className="space-y-3">
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.74)]">
                    子活動として紐付ける記事
                  </p>
                  {availableActivityArticles.length === 0 && (
                    <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-8 text-center text-[14px] text-[rgba(0,0,0,0.5)]">
                      紐付けできる記事がありません
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    {availableActivityArticles.map((activityArticle) => {
                      const isSelected = childActivityIds.includes(activityArticle.id);
                      return (
                        <button
                          key={activityArticle.id}
                          type="button"
                          onClick={() => toggleChildActivity(activityArticle.id)}
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

              {activityType === "child" && (
                <div className="space-y-3">
                  <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.74)]">
                    親活動として紐付ける記事
                  </p>
                  {availableActivityArticles.length === 0 && (
                    <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-8 text-center text-[14px] text-[rgba(0,0,0,0.5)]">
                      紐付けできる記事がありません
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
                    <button
                      type="button"
                      onClick={() => toggleCategory(option.id)}
                      className="flex items-start gap-2 text-left w-full"
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
              <div className="grid grid-cols-2 gap-3">
                {classOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setClassInfo(option.id);
                      setIsClassOpen(false);
                    }}
                    className={`border-2 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:shadow-md ${
                      classInfo === option.id 
                        ? 'bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]' 
                        : 'bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        classInfo === option.id 
                          ? 'border-[rgba(0,0,0,0.3)]' 
                          : 'border-[rgba(0,0,0,0.3)]'
                      }`}>
                        {classInfo === option.id && <div className="w-2 h-2 rounded-full bg-[rgba(0,0,0,0.7)]" />}
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

      {companyToDelete && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 200 }}
          onClick={() => {
            if (!deletingCompanyId) {
              setCompanyToDelete(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] px-6 py-5 flex items-center justify-between">
              <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.8)]">
                企業を削除
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!deletingCompanyId) {
                    setCompanyToDelete(null);
                  }
                }}
                className="hover:bg-white/30 rounded-full p-2 transition-colors disabled:opacity-50"
                disabled={Boolean(deletingCompanyId)}
              >
                <X size={24} className="text-[rgba(0,0,0,0.7)]" />
              </button>
            </div>
            <div className="p-6">
              <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[15px] leading-[1.8] text-[rgba(0,0,0,0.72)]">
                「{companyToDelete.label}」を企業一覧から削除します。
              </p>
              <p className="mt-2 font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] leading-[1.7] text-[rgba(0,0,0,0.5)]">
                この操作は取り消せません。関連企業として選択済みの項目からも外れます。
              </p>
            </div>
            <div className="px-6 py-4 bg-gradient-to-br from-[#f9f9f9] to-white border-t border-[rgba(0,0,0,0.1)] flex gap-3">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                disabled={Boolean(deletingCompanyId)}
                className="flex-1 bg-white border border-[rgba(0,0,0,0.12)] hover:bg-[rgba(0,0,0,0.03)] rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.65)] transition-all duration-200 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={Boolean(deletingCompanyId)}
                className="flex-1 rounded-xl py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                style={{
                  background: "linear-gradient(90deg, #cf3f37 0%, #b92e2e 100%)",
                  border: "1px solid #a52828",
                  color: "#ffffff",
                }}
              >
                {deletingCompanyId ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
