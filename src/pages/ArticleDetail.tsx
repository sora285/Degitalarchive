import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { getCurrentUser, logoutCurrentUser } from "../lib/session";
import { ArticleData, deleteArticle, fetchArticleById, updateArticle } from "../lib/articles";
import fixedArticleImage from "../assets/article_fixed.svg";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const FIXED_ARTICLE_IMAGE = fixedArticleImage;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function getArticleStatusLabel(status?: string) {
  if (status === "private_draft") return "下書き";
  if (status === "pending") return "未承認";
  return "承認済み";
}

function getSdgNumber(sdgText: string) {
  const match = sdgText.match(/^(\d+)\./);
  return match ? match[1] : "";
}

function getSdgIconUrl(sdgText: string) {
  const num = getSdgNumber(sdgText);
  return num ? `/images/sdg_icon_${num.padStart(2, "0")}_ja_2.png` : "";
}

function getSdgColor(sdgText: string) {
  const num = getSdgNumber(sdgText);
  const colors: Record<string, string> = {
    "1": "#E5243B",
    "2": "#DDA63A",
    "3": "#4C9F38",
    "4": "#C5192D",
    "5": "#FF3A21",
    "6": "#26BDE2",
    "7": "#FCC30B",
    "8": "#A21942",
    "9": "#FD6925",
    "10": "#DD1367",
    "11": "#FD9D24",
    "12": "#BF8B2E",
    "13": "#3F7E44",
    "14": "#0A97D9",
    "15": "#56C02B",
    "16": "#00689D",
    "17": "#19486A",
  };
  return colors[num] || "#4C9F38";
}

function buildMapEmbedUrl(article: ArticleData) {
  const hasCoordinates =
    Number.isFinite(article.location?.lat) &&
    Number.isFinite(article.location?.lng) &&
    article.location.lat !== 0 &&
    article.location.lng !== 0;

  if (hasCoordinates) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${article.location.lat},${article.location.lng}`)}&z=16&output=embed`;
  }

  if (article.location?.name) {
    return `https://www.google.com/maps?q=${encodeURIComponent(article.location.name)}&z=16&output=embed`;
  }

  return "";
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

function RelatedArticleCard({
  article,
  schoolId,
  canViewStatus,
  onClick,
}: {
  article: ArticleData;
  schoolId?: string;
  canViewStatus: boolean;
  onClick: () => void;
}) {
  const statusLabel = getArticleStatusLabel(article.status);
  const statusClasses =
    article.status === "private_draft"
      ? "bg-[rgba(71,85,105,0.12)] text-[rgba(51,65,85,0.92)] border-[rgba(71,85,105,0.22)]"
      : article.status === "pending"
      ? "bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.58)] border-[rgba(0,0,0,0.08)]"
      : "bg-[rgba(34,197,94,0.12)] text-[rgba(22,101,52,0.92)] border-[rgba(34,197,94,0.22)]";
  const activityRelationLabel = article.isChildActivity
    ? "子活動"
    : article.isParentActivity
      ? "親活動"
      : "親活動";
  const activityRelationClasses = article.isChildActivity
    ? "bg-[rgba(59,130,246,0.12)] text-[rgba(29,78,216,0.92)] border-[rgba(59,130,246,0.22)]"
    : article.isParentActivity
      ? "bg-[rgba(245,158,11,0.14)] text-[rgba(146,64,14,0.92)] border-[rgba(245,158,11,0.26)]"
      : "bg-[rgba(245,158,11,0.14)] text-[rgba(146,64,14,0.92)] border-[rgba(245,158,11,0.26)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:z-10 transition-all duration-300 group relative w-full rounded-3xl h-[560px] text-left"
    >
      <div className="relative h-full w-full bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col">
        <div
          className="relative bg-gradient-to-br from-[#e9e9e9] to-[#d9d9d9] flex items-center justify-center group-hover:from-[#f0f0f0] group-hover:to-[#e0e0e0] transition-all rounded-t-3xl shrink-0 overflow-hidden"
          style={{ height: 300 }}
        >
          <img
            src={
              schoolId
                ? `${API_BASE_URL}/api/articles/${article.id}/image?schoolId=${encodeURIComponent(schoolId)}`
                : (article.imageUrl || FIXED_ARTICLE_IMAGE)
            }
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src.endsWith(FIXED_ARTICLE_IMAGE)) return;
              e.currentTarget.src = FIXED_ARTICLE_IMAGE;
            }}
          />
        </div>
        <div className="p-6 flex flex-col overflow-hidden flex-1 items-start text-left h-[260px]">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold ${activityRelationClasses}`}>
              {activityRelationLabel}
            </span>
            {canViewStatus && (
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold ${statusClasses}`}>
                {statusLabel}
              </span>
            )}
          </div>
          <h3 className="font-['Inter:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.85)] leading-tight line-clamp-2 mb-2 min-h-[44px] w-full text-left">
            {article.title}
          </h3>
          <div className="w-full mb-3 space-y-2">
            <p className="w-full min-h-[20px] font-['Inter:Regular',sans-serif] font-normal text-[13px] leading-[20px] text-[rgba(0,0,0,0.62)] text-left overflow-hidden">
              {article.category || "未設定"}
            </p>
            <p className="w-full min-h-[20px] font-['Inter:Regular',sans-serif] font-normal text-[13px] leading-[20px] text-[rgba(0,0,0,0.62)] text-left overflow-hidden">
              {article.grade || "未設定"}
            </p>
            <p className="w-full min-h-[20px] font-['Inter:Regular',sans-serif] font-normal text-[13px] leading-[20px] text-[rgba(0,0,0,0.62)] line-clamp-2 text-left overflow-hidden">
              {article.company || "未設定"}
            </p>
          </div>
          <p className="line-clamp-3 text-[14px] leading-relaxed text-[rgba(0,0,0,0.64)] w-full">
            {article.content || "本文は未登録です。"}
          </p>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[18px] text-[rgba(0,0,0,0.5)] mt-auto pt-2 w-full text-left h-[26px]">
            {article.date || "日付未設定"}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function ArticleDetail() {
  const { id, schoolId } = useParams<{ id: string; schoolId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser(schoolId);
  const isAdmin = currentUser?.role === "admin";
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const isOwner = Boolean(article && currentUser?.id === article.authorUserId);
  const canCreateChildActivity = Boolean(currentUser) && Boolean(article) && !article?.parentActivityId;
  const canEditArticle =
    Boolean(article) &&
    (
      isAdmin ||
      (currentUser?.role === "user" &&
        article?.status !== "published" &&
        article?.authorUserId === currentUser?.id)
    );
  const canMoveToDraft = Boolean(article) && (isAdmin || canEditArticle) && article?.status !== "private_draft";
  const canDeleteArticle = Boolean(article) && (isAdmin || (isOwner && article?.status === "private_draft"));
  const statusLabel = getArticleStatusLabel(article?.status);
  const statusClasses =
    article?.status === "private_draft"
      ? "bg-[rgba(71,85,105,0.12)] text-[rgba(51,65,85,0.92)] border-[rgba(71,85,105,0.22)]"
      : article?.status === "pending"
      ? "bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.58)] border-[rgba(0,0,0,0.08)]"
      : "bg-[rgba(34,197,94,0.12)] text-[rgba(22,101,52,0.92)] border-[rgba(34,197,94,0.22)]";

  const from = searchParams.get("from") || location.state?.from;
  const articleImageSrc =
    schoolId && id
      ? `${API_BASE_URL}/api/articles/${id}/image?schoolId=${encodeURIComponent(schoolId)}`
      : (article?.imageUrl || FIXED_ARTICLE_IMAGE);
  const backDestination =
    from === "map"
      ? `/schools/${schoolId}/map`
      : `/schools/${schoolId}/home`;
  const backLabel = from === "map" ? "地図に戻る" : "一覧に戻る";
  const mapEmbedUrl = article ? buildMapEmbedUrl(article) : "";

  useEffect(() => {
    if (!schoolId || !id) {
      setError("記事情報が不足しています。");
      setIsLoading(false);
      return;
    }

    const articleId = Number(id);
    if (!Number.isFinite(articleId) || articleId <= 0) {
      setError("記事IDが不正です。");
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError("");

    fetchArticleById(schoolId, articleId)
      .then((data) => {
        if (!mounted) return;
        setArticle(data);
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
  }, [id, schoolId]);

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    if (schoolId) {
      localStorage.setItem("currentSchoolId", schoolId);
    }
    await logoutCurrentUser();
    navigate(`/schools/${schoolId}/home`);
  };

  const handleStatusUpdate = async (nextStatus: "private_draft" | "pending" | "published") => {
    if (!schoolId || !article || !currentUser) {
      return;
    }

    setIsTogglingStatus(true);
    try {
      const updated = await updateArticle(article.id, {
        schoolId,
        userId: currentUser.id,
        status: nextStatus,
        title: article.title,
        content: article.content,
        grade: article.grade || "",
        locationName: article.location?.name || "",
        latitude: article.location?.lat ? String(article.location.lat) : "",
        longitude: article.location?.lng ? String(article.location.lng) : "",
        sdgIds: (article.sdgIds || []).map((value) => String(value)),
        categoryIds: (article.categoryIds || []).map((value) => String(value)),
        companyIds: (article.companyIds || []).map((value) => String(value)),
        libraryImageUrls: article.imageUrls || [],
        uploadedImages: [],
        parentActivityId: article.parentActivityId ?? null,
        childActivityIds: article.childActivityIds || [],
      });
      setArticle(updated);
    } catch (statusError) {
      alert(statusError instanceof Error ? statusError.message : "公開状態の更新に失敗しました。");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-[#fffaf0] relative size-full min-h-screen pt-20" data-name="article-detail">
      <Header onLogoutClick={() => setIsLogoutDialogOpen(true)} />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(backDestination)}
            className="flex items-center gap-2 bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)]"
          >
            <ArrowLeft size={18} />
            {backLabel}
          </button>
          {canCreateChildActivity && article && !isLoading && !error && (
            <button
              onClick={() => navigate(`/schools/${schoolId}/post?parentActivityId=${article.id}`)}
              className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] cursor-pointer"
            >
              + 小活動を作成
            </button>
          )}
        </div>

        {article && !isLoading && !error && (canEditArticle || isAdmin || canDeleteArticle) && (
          <div className="mb-6 flex items-center gap-3">
            {canEditArticle && (
              <button
                onClick={() => navigate(`/schools/${schoolId}/post?articleId=${article.id}`)}
                className="rounded-xl border border-[rgba(0,0,0,0.12)] bg-white px-5 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.7)] shadow-sm transition-all duration-200 hover:shadow-md"
              >
                編集する
              </button>
            )}
            {(isAdmin || canMoveToDraft || canDeleteArticle) && (
              <>
                {isAdmin && article.status !== "published" && (
                  <button
                    disabled={isTogglingStatus}
                    onClick={() => {
                      void handleStatusUpdate("published");
                    }}
                    className="rounded-xl border border-[rgba(0,0,0,0.12)] bg-white px-5 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.7)] shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-60"
                  >
                    {isTogglingStatus ? "更新中..." : "公開する"}
                  </button>
                )}
                {isAdmin && article.status !== "pending" && (
                  <button
                    disabled={isTogglingStatus}
                    onClick={() => {
                      void handleStatusUpdate("pending");
                    }}
                    className="rounded-xl border border-[rgba(0,0,0,0.12)] bg-white px-5 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.7)] shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-60"
                  >
                    {isTogglingStatus ? "更新中..." : "未承認に戻す"}
                  </button>
                )}
                {canMoveToDraft && (
                  <button
                    disabled={isTogglingStatus}
                    onClick={() => {
                      void handleStatusUpdate("private_draft");
                    }}
                    className="rounded-xl border border-[rgba(71,85,105,0.24)] bg-[rgba(71,85,105,0.08)] px-5 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(51,65,85,0.9)] shadow-sm transition-all duration-200 hover:bg-[rgba(71,85,105,0.12)] disabled:opacity-60"
                  >
                    {isTogglingStatus ? "更新中..." : "下書きに戻す"}
                  </button>
                )}
                {canDeleteArticle && (
                  <button
                    disabled={isDeleting}
                    onClick={async () => {
                      if (!schoolId || !article) return;
                      if (!window.confirm(`「${article.title}」を削除しますか？`)) {
                        return;
                      }

                      setIsDeleting(true);
                      try {
                        await deleteArticle(schoolId, article.id);
                        navigate(`/schools/${schoolId}/home`);
                      } catch (deleteError) {
                        alert(deleteError instanceof Error ? deleteError.message : "記事の削除に失敗しました。");
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className="rounded-xl border border-[rgba(185,28,28,0.28)] bg-[rgba(220,38,38,0.08)] px-5 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(185,28,28,0.9)] shadow-sm transition-all duration-200 hover:bg-[rgba(220,38,38,0.12)] disabled:opacity-60"
                  >
                    {isDeleting ? "削除中..." : "削除する"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {isLoading && (
          <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-[14px] text-[rgba(0,0,0,0.7)]">
            記事を読み込み中です...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && article && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl h-fit">
                <div className="bg-gradient-to-br from-[#e9e9e9] to-[#d9d9d9] h-[260px] flex items-center justify-center overflow-hidden">
                  <img
                    src={articleImageSrc}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.currentTarget.src.endsWith(FIXED_ARTICLE_IMAGE)) return;
                      e.currentTarget.src = FIXED_ARTICLE_IMAGE;
                    }}
                  />
                </div>
                <div className="p-6 space-y-2">
                  {Boolean(currentUser) && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold ${statusClasses}`}>
                        {statusLabel}
                      </span>
                    </div>
                  )}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {((article.sdgItems?.length || article.sdgs.length) === 0) && (
                      <div
                        className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded shadow-sm bg-[rgba(0,0,0,0.12)]"
                        title="SDGs未設定"
                      >
                        <img
                          src="/images/sdg_unset.svg"
                          alt="SDGs未設定"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {(article.sdgItems?.length
                      ? article.sdgItems.map((item) => ({ label: item.label, imageUrl: item.imageUrl || "" }))
                      : article.sdgs.map((label) => ({ label, imageUrl: "" }))
                    ).map((sdg, index) => {
                      const sdgNum = getSdgNumber(sdg.label);

                      return (
                        <div
                          key={`${sdg.label}-${index}`}
                          className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center overflow-hidden rounded shadow-sm"
                          style={{ backgroundColor: getSdgColor(sdg.label) }}
                          title={sdg.label}
                        >
                          <img
                            src={sdg.imageUrl || getSdgIconUrl(sdg.label)}
                            alt={sdg.label}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const parent = e.currentTarget.parentElement;
                              if (parent && !parent.querySelector("span")) {
                                const span = document.createElement("span");
                                span.className = "font-['Inter:Bold',sans-serif] font-bold text-[16px] text-white";
                                span.textContent = sdgNum || "?";
                                parent.appendChild(span);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[16px] text-[rgba(0,0,0,0.7)]">カテゴリ: {article.category || "未設定"}</p>
                  <p className="text-[16px] text-[rgba(0,0,0,0.7)]">年度: {article.fiscalYear || "未設定"}</p>
                  <p className="text-[16px] text-[rgba(0,0,0,0.7)]">学年・クラス: {article.grade || "未設定"}</p>
                  <p className="text-[16px] text-[rgba(0,0,0,0.7)]">日付: {article.date || "未設定"}</p>
                  <p className="text-[16px] text-[rgba(0,0,0,0.7)]">関連企業様：{article.company || "未設定"}</p>
                  <p className="text-[16px] text-[rgba(0,0,0,0.7)]">場所: {article.location?.name || "未設定"}</p>
                  {mapEmbedUrl && (
                    <div className="pt-3">
                      <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm">
                        <iframe
                          title="活動場所の地図"
                          src={mapEmbedUrl}
                          className="h-[280px] w-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {article.tags.map((tag, index) => (
                      <span key={index} className="inline-block px-2.5 py-1 bg-gradient-to-r from-[rgba(255,209,131,0.2)] to-[rgba(255,220,150,0.2)] border border-[rgba(255,209,131,0.4)] rounded-full text-[12px] text-[rgba(0,0,0,0.7)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border-2 border-[rgba(0,0,0,0.1)] rounded-3xl shadow-2xl p-8">
                <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[32px] text-[rgba(0,0,0,0.85)] mb-4">{article.title}</h1>
                <div className="overflow-y-auto max-h-[600px] pr-2">
                  <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[185%] text-[16px] text-[rgba(0,0,0,0.75)] whitespace-pre-wrap">
                    {article.content || "本文は未登録です。"}
                  </p>
                </div>
              </div>
            </div>

            {article.childArticles && article.childArticles.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm border-2 border-[rgba(0,0,0,0.1)] rounded-3xl shadow-2xl p-8">
                <h2 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[28px] text-[rgba(0,0,0,0.84)]">
                  関連する子活動
                </h2>
                <p className="mt-2 text-[14px] text-[rgba(0,0,0,0.52)]">
                  この親活動に紐付いている記事です
                </p>
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  {article.childArticles.map((childArticle) => (
                    <RelatedArticleCard
                      key={childArticle.id}
                      article={childArticle}
                      schoolId={schoolId}
                      canViewStatus={Boolean(currentUser)}
                      onClick={() =>
                        navigate(
                          `/schools/${schoolId}/article/${childArticle.id}${from ? `?from=${encodeURIComponent(from)}` : ""}`,
                          {
                            state: location.state,
                          }
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {article.parentArticle && (
              <div className="bg-white/80 backdrop-blur-sm border-2 border-[rgba(0,0,0,0.1)] rounded-3xl shadow-2xl p-8">
                <h2 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[28px] text-[rgba(0,0,0,0.84)]">
                  紐付いている親活動
                </h2>
                <p className="mt-2 text-[14px] text-[rgba(0,0,0,0.52)]">
                  この子活動が属している親活動です
                </p>
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  <RelatedArticleCard
                    article={article.parentArticle}
                    schoolId={schoolId}
                    canViewStatus={Boolean(currentUser)}
                    onClick={() =>
                      navigate(
                        `/schools/${schoolId}/article/${article.parentArticle?.id}${from ? `?from=${encodeURIComponent(from)}` : ""}`,
                        {
                          state: location.state,
                        }
                      )
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
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
    </div>
  );
}
