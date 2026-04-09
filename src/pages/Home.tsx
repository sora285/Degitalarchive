import { useNavigate, useParams } from "react-router";
import { LogOut, ChevronDown, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { clearSession, getCurrentUser } from "../lib/session";
import { ArticleData, fallbackArticles, fetchArticles } from "../lib/articles";
import fixedArticleImage from "../assets/article_fixed.svg";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const FIXED_ARTICLE_IMAGE = fixedArticleImage;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface FilterState {
  fiscalYear: string;
  sdgs: string[];
  category: string[];
  grade: string;
  tag: string;
  company: string;
  keyword: string;
  parentActivities: boolean;
  childActivities: boolean;
}

export type { FilterState };

const CURRENT_FISCAL_YEAR_OVERRIDE = 2025;
const CURRENT_FISCAL_YEAR_OVERRIDE_START = new Date("2026-04-01T00:00:00+09:00");

function getFiscalYearFromDate(date: Date) {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

function getCurrentOperationalFiscalYearLabel(now = new Date()) {
  const fiscalYear = now >= CURRENT_FISCAL_YEAR_OVERRIDE_START
    ? CURRENT_FISCAL_YEAR_OVERRIDE
    : getFiscalYearFromDate(now);
  return `${fiscalYear}年度`;
}

const DEFAULT_FILTERS: FilterState = {
  fiscalYear: getCurrentOperationalFiscalYearLabel(),
  sdgs: [],
  category: [],
  grade: "",
  tag: "",
  company: "",
  keyword: "",
  parentActivities: false,
  childActivities: false,
};

function getSdgNumber(sdgText: string) {
  const match = sdgText.match(/^(\d+)\./);
  return match ? match[1] : "";
}

function getSdgIconUrl(sdgText: string) {
  const num = getSdgNumber(sdgText);
  return num ? `/images/sdg_icon_${num.padStart(2, "0")}_ja_2.png` : "";
}

const SDG_NAME_MAP: Record<string, string> = {
  "1": "1. 貧困をなくそう",
  "2": "2. 飢餓をゼロに",
  "3": "3. すべての人に健康と福祉を",
  "4": "4. 質の高い教育をみんなに",
  "5": "5. ジェンダー平等を実現しよう",
  "6": "6. 安全な水とトイレを世界中に",
  "7": "7. エネルギーをみんなに そしてクリーンに",
  "8": "8. 働きがいも経済成長も",
  "9": "9. 産業と技術革新の基盤をつくろう",
  "10": "10. 人や国の不平等をなくそう",
  "11": "11. 住み続けられるまちづくりを",
  "12": "12. つくる責任 つかう責任",
  "13": "13. 気候変動に具体的な対策を",
  "14": "14. 海の豊かさを守ろう",
  "15": "15. 陸の豊かさも守ろう",
  "16": "16. 平和と公正をすべての人に",
  "17": "17. パートナーシップで目標を達成しよう",
};

function normalizeSdgLabel(sdgText: string) {
  const num = getSdgNumber(sdgText);
  return SDG_NAME_MAP[num] || sdgText;
}

function Header({ onLogoutClick }: { onLogoutClick: () => void }) {
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
        </div>
        <div className="relative">
          <p 
            onClick={() => navigate(`/schools/${schoolId}/home`)}
            className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]"
          >
            一覧から探す
          </p>
          <div className="absolute -bottom-[23px] left-0 right-0 h-[3px] bg-[rgba(0,0,0,0.7)] rounded-t-full" />
        </div>
        {currentUser && (
          <button
            onClick={onLogoutClick}
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

function FilterSelect({ label, options, value, onChange }: { 
  label: string; 
  options: string[]; 
  value: string; 
  onChange: (value: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };
  
  const handleClear = () => {
    onChange("");
  };
  
  return (
    <div className="mb-6 relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white h-[45px] rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-[rgba(0,0,0,0.15)] px-3 pr-8 text-[14px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[rgba(0,0,0,0.6)] text-left focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg flex items-center justify-between"
      >
        <span className={value ? "text-[rgba(0,0,0,0.8)]" : "text-[rgba(0,0,0,0.5)]"}>
          {value || label}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-[rgba(0,0,0,0.5)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[rgba(0,0,0,0.15)] rounded-lg shadow-xl z-20 max-h-[200px] overflow-y-auto">
            {value && (
              <div
                onClick={handleClear}
                className="px-3 py-2.5 cursor-pointer text-[14px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium transition-colors text-[rgba(0,0,0,0.5)] hover:bg-[rgba(255,100,100,0.1)] border-b border-[rgba(0,0,0,0.1)] rounded-t-lg"
              >
                ✕ クリア
              </div>
            )}
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2.5 cursor-pointer text-[14px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium transition-colors ${
                  value === option 
                    ? 'bg-[rgba(255,209,131,0.3)] text-[rgba(0,0,0,0.9)]' 
                    : 'text-[rgba(0,0,0,0.7)] hover:bg-[rgba(255,209,131,0.1)]'
                } ${!value && index === 0 ? 'rounded-t-lg' : ''} ${index === options.length - 1 ? 'rounded-b-lg' : ''}`}
              >
                {option}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MultiSelectFilter({ label, options, values, onChange }: { 
  label: string; 
  options: string[]; 
  values: string[]; 
  onChange: (values: string[]) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isSdgFilter = label === "SDGs";
  
  const toggleOption = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter(v => v !== option));
    } else {
      onChange([...values, option]);
    }
  };
  
  const handleClearAll = () => {
    onChange([]);
  };
  
  return (
    <div className="mb-4 relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white h-[45px] rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-[rgba(0,0,0,0.15)] px-3 pr-8 text-[14px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[rgba(0,0,0,0.6)] text-left focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg flex items-center justify-between"
      >
        <span className={values.length > 0 ? "text-[rgba(0,0,0,0.8)]" : "text-[rgba(0,0,0,0.5)]"}>
          {values.length > 0 ? `${label} (${values.length}件選択中)` : label}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-[rgba(0,0,0,0.5)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[rgba(0,0,0,0.15)] rounded-lg shadow-xl z-20 max-h-[280px] overflow-y-auto">
            {values.length > 0 && (
              <div
                onClick={handleClearAll}
                className="px-3 py-2.5 cursor-pointer text-[14px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium transition-colors text-[rgba(0,0,0,0.5)] hover:bg-[rgba(255,100,100,0.1)] border-b border-[rgba(0,0,0,0.1)] sticky top-0 bg-white z-10"
              >
                ✕ すべてクリア
              </div>
            )}
            {options.map((option, index) => (
              <div
                key={index}
                onClick={() => toggleOption(option)}
                className={`px-3 py-2 cursor-pointer text-[13px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium transition-colors flex items-center gap-2 ${
                  values.includes(option) 
                    ? 'bg-[rgba(255,209,131,0.2)] text-[rgba(0,0,0,0.9)]' 
                    : 'text-[rgba(0,0,0,0.7)] hover:bg-[rgba(255,209,131,0.1)]'
                } ${index === options.length - 1 ? 'rounded-b-lg' : ''}`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  values.includes(option) 
                    ? 'bg-[rgba(255,209,131,0.8)] border-[rgba(255,209,131,1)]' 
                    : 'border-[rgba(0,0,0,0.3)]'
                }`}>
                  {values.includes(option) && <Check size={12} className="text-[rgba(0,0,0,0.8)]" />}
                </div>
                {isSdgFilter ? (
                  <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <div
                      className="flex-shrink-0 overflow-hidden rounded-sm border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.04)]"
                      style={{ width: 18, height: 18 }}
                    >
                      <img
                        src={getSdgIconUrl(option)}
                        alt={option}
                        className="block"
                        style={{ width: 18, height: 18, objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <span className="flex-1 leading-tight">{normalizeSdgLabel(option)}</span>
                  </div>
                ) : (
                  <span className="flex-1 leading-tight">{option}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SideMenu({ filters, setFilters, onSearch, onReset, options, showTeacherLogin, onTeacherLogin }: {
  filters: FilterState; 
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onSearch: () => void;
  onReset: () => void;
  options: {
    fiscalYears: string[];
    sdgs: string[];
    categories: string[];
    grades: string[];
    tags: string[];
    companies: string[];
  };
  showTeacherLogin: boolean;
  onTeacherLogin: () => void;
}) {
  return (
    <div className="fixed content-stretch flex gap-[10px] h-screen items-center left-0 top-[67px] w-[230px] shadow-lg z-40" data-name="side-menu">
      <div className="bg-gradient-to-b from-[#fff5e0] to-[#fffaf0] h-full shrink-0 w-[230px]" data-name="background" />
      
      <div className="absolute w-full px-6 top-8 overflow-y-auto h-[calc(100vh-120px)]">
        <p className="font-['Inter:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold text-[18px] text-[rgba(0,0,0,0.8)] mb-6">フィルター</p>
        
        <MultiSelectFilter 
          label="SDGs" 
          values={filters.sdgs}
          onChange={(value) => setFilters(prev => ({ ...prev, sdgs: value }))}
          options={options.sdgs}
        />

        <FilterSelect
          label="年度で検索"
          value={filters.fiscalYear}
          onChange={(value) => setFilters(prev => ({ ...prev, fiscalYear: value }))}
          options={options.fiscalYears}
        />
        
        <MultiSelectFilter 
          label="カテゴリから検索"
          values={filters.category}
          onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
          options={options.categories}
        />
        
        <FilterSelect 
          label="学年・クラス"
          value={filters.grade}
          onChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}
          options={options.grades}
        />
        
        <FilterSelect 
          label="タグで検索"
          value={filters.tag}
          onChange={(value) => setFilters(prev => ({ ...prev, tag: value }))}
          options={options.tags}
        />
        
        <FilterSelect 
          label="関連企業で検索"
          value={filters.company}
          onChange={(value) => setFilters(prev => ({ ...prev, company: value }))}
          options={options.companies}
        />
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="言葉で検索"
            value={filters.keyword}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            className="w-full bg-white h-[45px] rounded-lg shadow-sm hover:shadow-md transition-all border border-[rgba(0,0,0,0.15)] px-3 text-[14px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[rgba(0,0,0,0.6)] focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg"
          />
        </div>
        
        <div className="flex items-center gap-2 mt-6 mb-4 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, parentActivities: !prev.parentActivities }))}>
          <div className={`bg-white border-2 border-[rgba(0,0,0,0.2)] rounded-[4px] size-[18px] flex items-center justify-center hover:border-[rgba(255,209,131,0.93)] transition-colors ${filters.parentActivities ? 'bg-[rgba(255,209,131,0.5)]' : ''}`}>
            {filters.parentActivities && <div className="w-2 h-2 bg-[rgba(0,0,0,0.7)] rounded-sm" />}
          </div>
          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">親活動から検索</p>
        </div>

        <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, childActivities: !prev.childActivities }))}>
          <div className={`bg-white border-2 border-[rgba(0,0,0,0.2)] rounded-[4px] size-[18px] flex items-center justify-center hover:border-[rgba(255,209,131,0.93)] transition-colors ${filters.childActivities ? 'bg-[rgba(255,209,131,0.5)]' : ''}`}>
            {filters.childActivities && <div className="w-2 h-2 bg-[rgba(0,0,0,0.7)] rounded-sm" />}
          </div>
          <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">子活動から検索</p>
        </div>
        
        <button
          onClick={onSearch}
          className="w-full bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-[48px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)]"
        >
          この条件で検索
        </button>

        <button
          type="button"
          onClick={onReset}
          className="mt-2 w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white py-2.5 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[13px] text-[rgba(0,0,0,0.56)] shadow-sm transition-all duration-200 hover:bg-[rgba(0,0,0,0.03)] hover:shadow-md"
        >
          フィルターをリセット
        </button>

        {showTeacherLogin && (
          <button
            type="button"
            onClick={onTeacherLogin}
            className="mt-6 block w-full cursor-pointer text-left text-[12px] text-[rgba(0,0,0,0.48)] underline decoration-[rgba(0,0,0,0.2)] underline-offset-4 transition-colors hover:text-[rgba(0,0,0,0.72)]"
          >
            教員の方はこちらからログイン
          </button>
        )}
      </div>
    </div>
  );
}

function Article({
  article,
  onClick,
  schoolId,
  canViewStatus,
}: {
  article: ArticleData;
  onClick: () => void;
  schoolId?: string;
  canViewStatus: boolean;
}) {
  const statusLabel = article.status === "draft" ? "未承認" : "承認済み";
  const statusClasses =
    article.status === "draft"
      ? "bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.58)] border-[rgba(0,0,0,0.08)]"
      : "bg-[rgba(34,197,94,0.12)] text-[rgba(22,101,52,0.92)] border-[rgba(34,197,94,0.22)]";
  const activityRelationLabel = article.isChildActivity
    ? "子活動"
    : article.isParentActivity
      ? "親活動"
      : "単独活動";
  const activityRelationClasses = article.isChildActivity
    ? "bg-[rgba(59,130,246,0.12)] text-[rgba(29,78,216,0.92)] border-[rgba(59,130,246,0.22)]"
    : article.isParentActivity
      ? "bg-[rgba(245,158,11,0.14)] text-[rgba(146,64,14,0.92)] border-[rgba(245,158,11,0.26)]"
      : "bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.52)] border-[rgba(0,0,0,0.08)]";

  // SDGs号に応じた背景色を返す（フォールバック用）
  const getSdgColor = (sdgText: string) => {
    const num = getSdgNumber(sdgText);
    const colors: { [key: string]: string } = {
      '1': '#E5243B',
      '2': '#DDA63A',
      '3': '#4C9F38',
      '4': '#C5192D',
      '5': '#FF3A21',
      '6': '#26BDE2',
      '7': '#FCC30B',
      '8': '#A21942',
      '9': '#FD6925',
      '10': '#DD1367',
      '11': '#FD9D24',
      '12': '#BF8B2E',
      '13': '#3F7E44',
      '14': '#0A97D9',
      '15': '#56C02B',
      '16': '#00689D',
      '17': '#19486A',
    };
    return colors[num] || '#4C9F38';
  };

  return (
    <div 
      className="cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:z-10 transition-all duration-300 group relative w-full rounded-3xl h-[560px]" 
      onClick={onClick}
    >
      <div className="relative h-full w-full bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col">
        {/* 画像エリア - 固定高さ */}
        <div
          className="relative bg-gradient-to-br from-[#e9e9e9] to-[#d9d9d9] flex items-center justify-center group-hover:from-[#f0f0f0] group-hover:to-[#e0e0e0] transition-all rounded-t-3xl shrink-0 overflow-hidden"
          style={{ height: 300 }}
        >
          {/** 一覧はAPI経由URLを優先し、失敗時のみ固定画像へフォールバック */}
          <img
            src={
              schoolId
                ? `${API_BASE_URL}/api/articles/${article.id}/image?schoolId=${encodeURIComponent(schoolId)}`
                : (article.imageUrl || FIXED_ARTICLE_IMAGE)
            }
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="eager"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src.endsWith(FIXED_ARTICLE_IMAGE)) return;
              e.currentTarget.src = FIXED_ARTICLE_IMAGE;
            }}
          />
        </div>
        
        {/* コンテンツエリア */}
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

          {/* SDGsアイコン - 固定高さ */}
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
                      // フォールバック: 画像読み込みエラー時は番号を表示
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (!parent || parent.querySelector('span')) return;
                      const span = document.createElement('span');
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
          
          {/* タイトル */}
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
            <p className="w-full min-h-[20px] font-['Inter:Regular',sans-serif] font-normal text-[13px] leading-[20px] text-[rgba(0,0,0,0.62)] text-left overflow-hidden">
              {article.fiscalYear || "年度未設定"}
            </p>
          </div>
          
          {/* タグ表示エリア */}
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
          
          {/* 日付 */}
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[18px] text-[rgba(0,0,0,0.5)] mt-auto pt-2 w-full text-left h-[26px]">
            {article.date}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const canPostArticle = Boolean(currentUser);
  const canViewStatus = Boolean(currentUser);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [isPendingListOpen, setIsPendingListOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const splitValues = (value?: string) =>
    String(value || "")
      .split(" / ")
      .map((item) => item.trim())
      .filter(Boolean);

  const filterOptions = {
    fiscalYears: [...new Set(articles.map((article) => article.fiscalYear).filter(Boolean))].sort().reverse(),
    sdgs: [...new Set(articles.flatMap((article) => (article.sdgItems?.length ? article.sdgItems.map((item) => normalizeSdgLabel(item.label)) : article.sdgs.map((label) => normalizeSdgLabel(label)))).filter(Boolean))].sort(),
    categories: [...new Set(articles.flatMap((article) => splitValues(article.category)))].sort(),
    grades: [...new Set(articles.map((article) => article.grade).filter(Boolean))].sort(),
    tags: [...new Set(articles.flatMap((article) => article.tags).filter(Boolean))].sort(),
    companies: [...new Set(articles.flatMap((article) => splitValues(article.company)))].sort(),
  };

  // フィルタリング処理
  const filterArticles = (articles: ArticleData[], filters: FilterState) => {
    return articles.filter(article => {
      const articleSdgs = article.sdgItems?.length
        ? article.sdgItems.map((item) => normalizeSdgLabel(item.label))
        : article.sdgs.map((label) => normalizeSdgLabel(label));
      const articleCategories = splitValues(article.category);
      const articleCompanies = splitValues(article.company);

      if (filters.fiscalYear && article.fiscalYear !== filters.fiscalYear) return false;
      if (filters.sdgs.length > 0 && !filters.sdgs.some((sdg) => articleSdgs.includes(sdg))) return false;
      if (filters.category.length > 0 && !filters.category.some((category) => articleCategories.includes(category))) return false;
      if (filters.grade && article.grade !== filters.grade) return false;
      if (filters.tag && !article.tags.includes(filters.tag)) return false;
      if (filters.company && !articleCompanies.includes(filters.company)) return false;
      if (
        filters.keyword &&
        !`${article.title} ${article.content} ${article.location?.name || ""}`
          .toLowerCase()
          .includes(filters.keyword.toLowerCase())
      ) return false;
      return (
        (!filters.parentActivities || article.isParentActivity) &&
        (!filters.childActivities || article.isChildActivity)
      );
    });
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  useEffect(() => {
    if (!schoolId) {
      setNotice("学校IDが見つからないため、サンプル記事を表示しています。");
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
          setNotice("DBに記事がないため、サンプル記事を表示しています。");
        }
      })
      .catch(() => {
        if (!mounted) return;
        setArticles(fallbackArticles);
        setNotice("記事取得に失敗したため、サンプル記事を表示しています。");
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

  const filteredArticles = filterArticles(articles, appliedFilters);
  const pendingArticles = articles.filter((article) => article.status === "draft");
  
  return (
    <div className="bg-gradient-to-br from-white to-[#fffaf0] relative size-full min-h-screen pt-20" data-name="home">
      <Header onLogoutClick={() => setIsLogoutDialogOpen(true)} />
      <SideMenu
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        options={filterOptions}
        showTeacherLogin={!currentUser}
        onTeacherLogin={() => navigate(`/schools/${schoolId}`)}
      />
      <div className="ml-[250px] px-8 pt-4 flex items-center justify-between">
        <div>
          <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)]">記事の一覧</p>
          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.6)] mt-1">
            {filteredArticles.length}件の記事が見つかりました
          </p>
        </div>
        {canPostArticle && (
          <button
            onClick={() => navigate(`/schools/${schoolId}/post`)}
            className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] cursor-pointer"
          >
            + 記事を投稿
          </button>
        )}
      </div>
      
      <div className="ml-[250px] mt-[80px] mb-16 max-w-[calc(100vw-280px)] px-8" data-name="articles">
        {isLoading && (
          <div className="mb-6 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-[14px] text-[rgba(0,0,0,0.7)]">
            記事を読み込み中です...
          </div>
        )}
        {notice && (
          <div className="mb-6 rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-[14px] text-[rgba(0,0,0,0.65)]">
            {notice}
          </div>
        )}
        {isAdmin && !isLoading && (
          <div className="mb-8 rounded-3xl border border-[rgba(185,28,28,0.14)] bg-white/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[24px] text-[rgba(0,0,0,0.82)]">
                  未承認一覧
                </p>
                <p className="mt-1 text-[14px] text-[rgba(0,0,0,0.52)]">
                  承認待ちの記事をここから確認できます
                </p>
              </div>
              <span className="rounded-full bg-[rgba(220,38,38,0.1)] px-4 py-2 text-[13px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[rgba(185,28,28,0.9)]">
                {pendingArticles.length}件
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPendingListOpen((prev) => !prev)}
              className="mt-5 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,250,240,0.8)] px-4 py-3 text-[14px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[rgba(0,0,0,0.72)] transition-all duration-200 hover:border-[rgba(255,209,131,0.6)] hover:bg-[rgba(255,247,234,1)]"
            >
              {isPendingListOpen ? "未承認一覧を閉じる" : "未承認一覧を表示"}
            </button>

            {isPendingListOpen && (
              pendingArticles.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-[rgba(0,0,0,0.03)] px-4 py-5 text-[14px] text-[rgba(0,0,0,0.52)]">
                  現在、未承認の記事はありません。
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pendingArticles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() =>
                        navigate(`/schools/${schoolId}/article/${article.id}`, {
                          state: { from: "home" },
                        })
                      }
                      className="rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,250,240,0.8)] px-4 py-4 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-[rgba(255,209,131,0.6)] hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-1 text-[11px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[rgba(185,28,28,0.9)]">
                          未承認
                        </span>
                        <span className="text-[11px] text-[rgba(0,0,0,0.45)]">
                          {article.fiscalYear || "年度未設定"}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-[15px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[rgba(0,0,0,0.8)]">
                        {article.title || "無題の記事"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[rgba(0,0,0,0.56)]">
                        {article.content || "本文は未入力です"}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[12px] text-[rgba(0,0,0,0.45)]">
                        <span>{article.grade || "学年未設定"}</span>
                        <span>{article.date || "日付未設定"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}
        {!isLoading && filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map(article => (
              <Article
                key={article.id}
                article={article}
                schoolId={schoolId}
                canViewStatus={canViewStatus}
                onClick={() =>
                  navigate(`/schools/${schoolId}/article/${article.id}`, {
                    state: { from: "home" },
                  })
                }
              />
            ))}
          </div>
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[24px] text-[rgba(0,0,0,0.5)] mb-4">
              該当する記事が見つかりませんでした
            </p>
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.4)]">
              フィルター条件を変更してみてください
            </p>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={isLogoutDialogOpen}
        title="ログアウトしますか？"
        description="ログアウトすると、教員向けの操作メニューは閉じられます。"
        confirmLabel="ログアウト"
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={() => {
          setIsLogoutDialogOpen(false);
          if (schoolId) {
            localStorage.setItem("currentSchoolId", schoolId);
          }
          clearSession();
          navigate(`/schools/${schoolId}/home`);
        }}
      />
    </div>
  );
}
