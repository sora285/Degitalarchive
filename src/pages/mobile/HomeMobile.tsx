import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { LogOut, Plus, SlidersHorizontal, X } from "lucide-react";
import { ArticleData, fallbackArticles, fetchArticles } from "../../lib/articles";
import { getCurrentUser, logoutCurrentUser } from "../../lib/session";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import fixedArticleImage from "../../assets/article_fixed.svg";
import MobileBottomNav from "./MobileBottomNav";
import ArticleImageCarousel from "../../components/ArticleImageCarousel";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const FIXED_ARTICLE_IMAGE = fixedArticleImage;

type FilterState = {
  fiscalYear: string;
  category: string;
  grade: string;
  keyword: string;
  childActivities: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  fiscalYear: "",
  category: "",
  grade: "",
  keyword: "",
  childActivities: false,
};

function getStatusLabel(status?: string) {
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

function splitValues(value?: string) {
  return String(value || "")
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);
}

function MobileArticleCard({
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
  const imageUrls =
    article.imageUrls && article.imageUrls.length > 0
      ? article.imageUrls
      : [
          schoolId
            ? `${API_BASE_URL}/api/articles/${article.id}/image?schoolId=${encodeURIComponent(schoolId)}`
            : (article.imageUrl || FIXED_ARTICLE_IMAGE),
        ];
  const statusLabel = getStatusLabel(article.status);
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
    <div
      className="cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group relative w-full rounded-3xl h-[560px]"
      onClick={onClick}
    >
      <div className="relative h-full w-full bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col">
        <div
          className="relative bg-gradient-to-br from-[#e9e9e9] to-[#d9d9d9] flex items-center justify-center group-hover:from-[#f0f0f0] group-hover:to-[#e0e0e0] transition-all rounded-t-3xl shrink-0 overflow-hidden"
          style={{ height: 300 }}
        >
          <ArticleImageCarousel
            imageUrls={imageUrls}
            title={article.title}
            fallbackImage={FIXED_ARTICLE_IMAGE}
            heightClassName="h-full"
            indicatorPlacement="inside"
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

          <div className="flex flex-wrap gap-2 mb-3 h-[40px] items-start self-stretch">
            {((article.sdgItems?.length || article.sdgs.length) === 0) && (
              <div
                className="rounded shadow-sm overflow-hidden w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center bg-[rgba(0,0,0,0.15)]"
                title="SDGs未設定"
              >
                <img
                  src="/images/sdg_unset.svg"
                  alt="SDGs未設定"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {(article.sdgItems?.length
              ? article.sdgItems.map((item) => ({ label: item.label, imageUrl: item.imageUrl || "" }))
              : article.sdgs.map((label) => ({ label, imageUrl: "" }))
            )
              .slice(0, 6)
              .map((sdg, index) => {
                const sdgNum = getSdgNumber(sdg.label);
                const bgColor = getSdgColor(sdg.label);

                return (
                  <div
                    key={index}
                    className="rounded shadow-sm overflow-hidden w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: bgColor }}
                    title={sdg.label}
                  >
                    <img
                      src={sdg.imageUrl || getSdgIconUrl(sdg.label)}
                      alt={`SDG ${sdgNum}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (!parent || parent.querySelector("span")) return;
                        const span = document.createElement("span");
                        span.className = "font-['Inter:Bold',sans-serif] font-bold text-[16px] text-white";
                        span.textContent = sdgNum;
                        parent.appendChild(span);
                      }}
                    />
                  </div>
                );
              })}
            {(article.sdgItems?.length || article.sdgs.length) > 6 && (
              <div className="bg-[rgba(0,0,0,0.1)] rounded w-[40px] h-[40px] flex items-center justify-center flex-shrink-0">
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] text-[rgba(0,0,0,0.6)]">
                  +{(article.sdgItems?.length || article.sdgs.length) - 6}
                </span>
              </div>
            )}
          </div>

          <h3 className="font-['Inter:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.85)] leading-tight line-clamp-2 mb-2 min-h-[44px] w-full text-left">
            {article.title || "無題の記事"}
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
            <p className="w-full min-h-[20px] font-['Inter:Regular',sans-serif] font-normal text-[13px] leading-[20px] text-[rgba(0,0,0,0.62)] text-left overflow-hidden">
              {article.fiscalYear || "年度未設定"}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4 h-[56px] content-start overflow-hidden w-full justify-start">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2.5 py-1 bg-gradient-to-r from-[rgba(255,209,131,0.2)] to-[rgba(255,220,150,0.2)] border border-[rgba(255,209,131,0.4)] rounded-full text-[11px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[rgba(0,0,0,0.7)] hover:from-[rgba(255,209,131,0.35)] hover:to-[rgba(255,220,150,0.35)] transition-colors whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                #{tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="inline-block px-2.5 py-1 text-[11px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[rgba(0,0,0,0.5)]">
                +{article.tags.length - 3}
              </span>
            )}
          </div>

          <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[18px] text-[rgba(0,0,0,0.5)] mt-auto pt-2 w-full text-left h-[26px]">
            {article.date || "日付未設定"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomeMobile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser(schoolId);
  const canPostArticle = Boolean(currentUser);
  const canViewStatus = Boolean(currentUser);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (!schoolId) {
      setArticles(fallbackArticles);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setNotice("");

    fetchArticles(schoolId)
      .then((list) => {
        if (!mounted) return;
        setArticles(list.length > 0 ? list : fallbackArticles);
        if (list.length === 0) {
          setNotice("記事がないためサンプルを表示しています。");
        }
      })
      .catch(() => {
        if (!mounted) return;
        setArticles(fallbackArticles);
        setNotice("記事取得に失敗したためサンプルを表示しています。");
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

  useEffect(() => {
    if ((location.state as { openFilter?: boolean } | null)?.openFilter) {
      setIsFilterOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const filterOptions = useMemo(() => ({
    fiscalYears: [...new Set(articles.map((article) => article.fiscalYear).filter(Boolean))].sort().reverse(),
    categories: [...new Set(articles.flatMap((article) => splitValues(article.category)))].sort(),
    grades: [...new Set(articles.map((article) => article.grade).filter(Boolean))].sort(),
  }), [articles]);

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => {
        if (filters.fiscalYear && article.fiscalYear !== filters.fiscalYear) return false;
        if (filters.category && !splitValues(article.category).includes(filters.category)) return false;
        if (filters.grade && article.grade !== filters.grade) return false;
        if (filters.keyword) {
          const haystack = `${article.title} ${article.content} ${article.location?.name || ""}`.toLowerCase();
          if (!haystack.includes(filters.keyword.toLowerCase())) return false;
        }
        if (filters.childActivities) {
          return Boolean(article.isChildActivity);
        }
        return !article.isChildActivity;
      }),
    [articles, filters]
  );

  const closeFilters = () => {
    setIsFilterOpen(false);
  };

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    if (schoolId) {
      localStorage.setItem("currentSchoolId", schoolId);
    }
    await logoutCurrentUser();
    navigate(`/mobile/schools/${schoolId}/home`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ec_0%,#fffefe_28%,#fff9f1_100%)] pb-28">
      <header
        className="fixed top-0 left-0 right-0 z-50 h-[76px] border-b border-[rgba(154,52,18,0.24)] px-4 py-4 shadow-[0_8px_22px_rgba(194,65,12,0.18)]"
        style={{ background: "linear-gradient(90deg, rgba(255,209,131,0.98), rgba(255,220,150,0.98))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[18px] font-semibold text-[rgba(0,0,0,0.82)]">デジタルアーカイブ</p>
            <p className="text-[12px] text-[rgba(0,0,0,0.58)]">{filteredArticles.length}件の記事</p>
          </div>
          {currentUser && (
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="rounded-full border border-[rgba(255,255,255,0.28)] px-3 py-2 text-[12px] font-semibold text-[rgba(0,0,0,0.76)]"
              style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
            >
              <LogOut size={14} className="inline-block" /> ログアウト
            </button>
          )}
        </div>
      </header>

      <main
        className="space-y-4 px-4 pb-4"
        style={{ paddingTop: "92px" }}
      >
        {canPostArticle && (
          <button
            type="button"
            onClick={() => navigate(`/mobile/schools/${schoolId}/post`)}
            className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-[rgba(255,209,131,0.96)] to-[rgba(255,220,150,0.96)] px-4 py-4 text-[15px] font-semibold text-[rgba(0,0,0,0.74)] shadow-[0_14px_30px_rgba(245,158,11,0.18)]"
          >
            <Plus size={18} />
            親活動を作成
          </button>
        )}

        {isLoading && <div className="rounded-3xl bg-white px-4 py-5 text-[14px] text-[rgba(0,0,0,0.62)] shadow-sm">記事を読み込み中です...</div>}
        {notice && <div className="rounded-3xl bg-white px-4 py-5 text-[14px] text-[rgba(0,0,0,0.56)] shadow-sm">{notice}</div>}

        {!isLoading && filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <MobileArticleCard
                key={article.id}
                article={article}
                schoolId={schoolId}
                canViewStatus={canViewStatus}
                onClick={() => navigate(`/mobile/schools/${schoolId}/article/${article.id}`, { state: { from: "home" } })}
              />
            ))}
          </div>
        ) : !isLoading ? (
          <div className="rounded-[28px] bg-white px-5 py-10 text-center shadow-sm">
            <p className="text-[18px] font-semibold text-[rgba(0,0,0,0.58)]">該当する記事がありません</p>
          </div>
        ) : null}
      </main>

      {isFilterOpen && (
        <div className="fixed inset-0 z-[90] bg-[rgba(15,23,42,0.24)]" onClick={closeFilters}>
          <div
            className="absolute inset-x-3 bottom-[106px] mx-auto w-[calc(100vw-24px)] max-w-[430px] overflow-hidden rounded-[24px] border border-[rgba(154,52,18,0.18)] shadow-[0_18px_40px_rgba(194,65,12,0.22)]"
            style={{ background: "linear-gradient(90deg, rgba(255,209,131,0.93), rgba(255,220,150,0.93))" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[rgba(154,52,18,0.14)] px-3 py-3">
              <div>
                <p className="text-[15px] font-semibold text-[rgba(0,0,0,0.82)]">フィルター</p>
                <p className="text-[10px] text-[rgba(0,0,0,0.54)]">条件を絞り込めます</p>
              </div>
              <button
                type="button"
                onClick={closeFilters}
                className="rounded-full border border-[rgba(90,39,0,0.12)] bg-white/70 p-1.5 text-[rgba(0,0,0,0.62)]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 px-3 py-3">
              <label className="block rounded-2xl border border-[rgba(90,39,0,0.10)] bg-white/72 p-3 text-[11px] font-semibold text-[rgba(0,0,0,0.68)] shadow-[0_8px_20px_rgba(255,255,255,0.24)]">
                <span className="block">年度</span>
                <select
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters((prev) => ({ ...prev, fiscalYear: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-xl border border-[rgba(90,39,0,0.12)] bg-white/88 px-2.5 text-[12px] text-[rgba(0,0,0,0.76)]"
                >
                  <option value="">すべて</option>
                  {filterOptions.fiscalYears.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>

              <label className="block rounded-2xl border border-[rgba(90,39,0,0.10)] bg-white/72 p-3 text-[11px] font-semibold text-[rgba(0,0,0,0.68)] shadow-[0_8px_20px_rgba(255,255,255,0.24)]">
                <span className="block">カテゴリ</span>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-xl border border-[rgba(90,39,0,0.12)] bg-white/88 px-2.5 text-[12px] text-[rgba(0,0,0,0.76)]"
                >
                  <option value="">すべて</option>
                  {filterOptions.categories.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>

              <label className="block rounded-2xl border border-[rgba(90,39,0,0.10)] bg-white/72 p-3 text-[11px] font-semibold text-[rgba(0,0,0,0.68)] shadow-[0_8px_20px_rgba(255,255,255,0.24)]">
                <span className="block">学年・クラス</span>
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-xl border border-[rgba(90,39,0,0.12)] bg-white/88 px-2.5 text-[12px] text-[rgba(0,0,0,0.76)]"
                >
                  <option value="">すべて</option>
                  {filterOptions.grades.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>

              <label className="flex rounded-2xl border border-[rgba(90,39,0,0.10)] bg-white/72 p-3 shadow-[0_8px_20px_rgba(255,255,255,0.24)]">
                <span className="flex h-9 w-full items-center gap-2 rounded-xl border border-[rgba(90,39,0,0.12)] bg-white/88 px-2.5 text-[11px] font-semibold text-[rgba(0,0,0,0.7)]">
                  <input
                    type="checkbox"
                    checked={filters.childActivities}
                    onChange={(e) => setFilters((prev) => ({ ...prev, childActivities: e.target.checked }))}
                    className="h-3.5 w-3.5"
                  />
                  子活動のみ
                </span>
              </label>

              <label className="col-span-2 block rounded-2xl border border-[rgba(90,39,0,0.10)] bg-white/72 p-3 text-[11px] font-semibold text-[rgba(0,0,0,0.68)] shadow-[0_8px_20px_rgba(255,255,255,0.24)]">
                <span className="block">キーワード</span>
                <input
                  value={filters.keyword}
                  onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-xl border border-[rgba(90,39,0,0.12)] bg-white/88 px-2.5 text-[12px] text-[rgba(0,0,0,0.76)]"
                  placeholder="タイトルや本文で検索"
                />
              </label>

              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="col-span-2 h-11 rounded-2xl border border-[rgba(90,39,0,0.10)] bg-white/78 px-3 text-[12px] font-semibold text-[rgba(0,0,0,0.66)] shadow-[0_8px_20px_rgba(255,255,255,0.24)]"
              >
                フィルターをリセット
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav
        active="home"
        trailingSlot={
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex h-16 w-16 min-w-16 shrink-0 items-center justify-center rounded-full border border-[rgba(154,52,18,0.16)] shadow-[0_18px_45px_rgba(194,65,12,0.24)] backdrop-blur-xl transition-transform duration-200 active:scale-95"
            style={{ background: "linear-gradient(90deg, rgba(255,209,131,0.96), rgba(255,220,150,0.96))" }}
            aria-label="フィルターを開く"
          >
            <SlidersHorizontal size={22} className="text-[rgba(0,0,0,0.76)]" />
          </button>
        }
      />

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
