import { useNavigate } from "react-router";
import { LogOut, ChevronDown, Check } from "lucide-react";
import { useState } from "react";

// 記事データの型定義
interface ArticleData {
  id: number;
  title: string;
  sdgs: string[];
  category: string;
  grade: string;
  tags: string[];
  company?: string;
  date: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
}

interface FilterState {
  sdgs: string[];
  category: string[];
  grade: string;
  tag: string;
  company: string;
  keyword: string;
  childActivities: boolean;
}

// 記事データ
const articlesData: ArticleData[] = [
  {
    id: 1,
    title: "みなとみらいの環境保護活動",
    sdgs: ["13. 気候変動に具体的な対策を", "11. 住み続けられるまちづくりを"],
    category: "環境",
    grade: "6年1組",
    tags: ["みなとみらい", "環境保護"],
    company: "企業A",
    date: "2024/01/15",
    location: {
      lat: 35.4593,
      lng: 139.6317,
      name: "横浜ランドマークタワー"
    }
  },
  {
    id: 2,
    title: "SDGsを学ぶ地域貢献プロジェクト",
    sdgs: ["11. 住み続けられるまちづくりを", "4. 質の高い教育をみんなに"],
    category: "地域活動",
    grade: "6年2組",
    tags: ["SDGs", "地域貢献"],
    company: "企業B",
    date: "2024/01/18",
    location: {
      lat: 35.4537,
      lng: 139.6380,
      name: "パシフィコ横浜"
    }
  },
  {
    id: 3,
    title: "リサイクル活動で環境を守る",
    sdgs: ["13. 気候変動に具体的な対策を", "11. 住み続けられるまちづくりを"],
    category: "環境",
    grade: "5年1組",
    tags: ["リサイクル", "環境保護", "みなとみらい"],
    company: "企業A",
    date: "2024/01/20",
    location: {
      lat: 35.4623,
      lng: 139.6290,
      name: "横浜赤レンガ倉庫"
    }
  },
  {
    id: 4,
    title: "国際理解と文化交流",
    sdgs: ["4. 質の高い教育をみんなに"],
    category: "国際交流",
    grade: "6年1組",
    tags: ["国際理解", "文化交流"],
    company: "企業C",
    date: "2024/01/22",
    location: {
      lat: 35.4550,
      lng: 139.6366,
      name: "カップヌードルミュージアム"
    }
  },
  {
    id: 5,
    title: "ボランティア活動で地域に貢献",
    sdgs: ["11. 住み続けられるまちづくりを", "1. 貧困をなくそう"],
    category: "地域活動",
    grade: "5年2組",
    tags: ["ボランティア", "地域貢献"],
    company: "企業B",
    date: "2024/01/25",
    location: {
      lat: 35.4490,
      lng: 139.6425,
      name: "山下公園"
    }
  },
  {
    id: 6,
    title: "SDGsと国際協力",
    sdgs: ["1. 貧困をなくそう", "4. 質の高い教育をみんなに"],
    category: "国際交流",
    grade: "6年2組",
    tags: ["SDGs", "環境保護", "国際理解"],
    company: "企業C",
    date: "2024/01/28",
    location: {
      lat: 35.4580,
      lng: 139.6345,
      name: "横浜美術館"
    }
  }
];

// 記事データをエクスポート
export { articlesData };
export type { ArticleData, FilterState };

function Header() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-md" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px] flex items-center px-8 justify-between" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">みなとみらいデジタルアーカイブ</p>
      <div className="absolute right-8 top-[23px] flex gap-8 items-center">
        <p 
          onClick={() => navigate('/map')}
          className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]"
        >
          地図から探す
        </p>
        <p 
          onClick={() => navigate('/home')}
          className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)] border-b-2 border-[rgba(0,0,0,0.7)]"
        >
          一覧から探す
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <LogOut size={16} className="text-[rgba(0,0,0,0.6)]" />
          <span className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.7)]">ログアウト</span>
        </button>
      </div>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };
  
  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };
  
  return (
    <div className="mb-4 relative">
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
                className={`px-3 py-2.5 cursor-pointer text-[13px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium transition-colors flex items-center gap-2 ${
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
                <span className="flex-1 leading-tight">{option}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SideMenu({ filters, setFilters, onSearch }: { 
  filters: FilterState; 
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onSearch: () => void;
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
          options={[
            "1. 貧困をなくそう",
            "2. 飢餓をゼロに",
            "3. すべての人に健康と福祉を",
            "4. 質の高い教育をみんなに",
            "11. 住み続けられるまちづくりを",
            "13. 気候変動に具体的な対策を"
          ]} 
        />
        
        <MultiSelectFilter 
          label="カテゴリから検索"
          values={filters.category}
          onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
          options={["教育", "環境", "地域活動", "国際交流"]} 
        />
        
        <FilterSelect 
          label="学年・クラス"
          value={filters.grade}
          onChange={(value) => setFilters(prev => ({ ...prev, grade: value }))}
          options={["5年1組", "5年2組", "6年1組", "6年2組"]} 
        />
        
        <FilterSelect 
          label="タグで検索"
          value={filters.tag}
          onChange={(value) => setFilters(prev => ({ ...prev, tag: value }))}
          options={["みなとみらい", "環境保護", "SDGs", "地域貢献", "リサイクル", "国際理解", "文化交流", "ボランティア"]} 
        />
        
        <FilterSelect 
          label="関連企業で検索"
          value={filters.company}
          onChange={(value) => setFilters(prev => ({ ...prev, company: value }))}
          options={["企業A", "企業B", "企業C"]} 
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
        
        <div className="flex items-center gap-2 mt-6 mb-6 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, childActivities: !prev.childActivities }))}>
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
      </div>
    </div>
  );
}

function Article({ article, onClick }: { article: ArticleData; onClick: () => void }) {
  // SDGs番号を抽出
  const getSdgNumber = (sdgText: string) => {
    const match = sdgText.match(/^(\d+)\./);
    return match ? match[1] : '';
  };

  // SDGsアイコンのURL取得
  const getSdgIconUrl = (sdgText: string) => {
    const num = getSdgNumber(sdgText);
    // Global Goals公式のSDGsアイコンURL（より安定したソース）
    return `https://www.globalgoals.org/wp-content/uploads/2023/08/SDG-${num}.svg`;
  };

  // SDGs���号に応じた背景色を返す（フォールバック用）
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
      className="cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group" 
      onClick={onClick}
    >
      <div className="relative h-[400px] w-[300px] bg-white rounded-3xl overflow-hidden shadow-lg flex flex-col">
        {/* 画像エリア - 固定高さ */}
        <div className="h-[200px] bg-gradient-to-br from-[#e9e9e9] to-[#d9d9d9] flex items-center justify-center group-hover:from-[#f0f0f0] group-hover:to-[#e0e0e0] transition-all rounded-t-3xl flex-shrink-0">
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.4)]">img</p>
        </div>
        
        {/* コンテンツエリア */}
        <div className="flex-1 p-4 flex flex-col">
          {/* SDGsアイコン - 固定高さ */}
          <div className="flex flex-wrap gap-2 mb-3 h-[40px] items-start">
            {article.sdgs.slice(0, 6).map((sdg, index) => {
              const sdgNum = getSdgNumber(sdg);
              const bgColor = getSdgColor(sdg);
              
              return (
                <div 
                  key={index} 
                  className="rounded shadow-sm overflow-hidden w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: bgColor }}
                  title={sdg}
                >
                  <img 
                    src={getSdgIconUrl(sdg)}
                    alt={`SDG ${sdgNum}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // フォールバック: 画像読み込みエラー時は番号を表示
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent && !parent.querySelector('span')) {
                        const span = document.createElement('span');
                        span.className = "font-['Inter:Bold',sans-serif] font-bold text-[16px] text-white";
                        span.textContent = sdgNum;
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>
              );
            })}
            {article.sdgs.length > 6 && (
              <div className="bg-[rgba(0,0,0,0.1)] rounded w-[40px] h-[40px] flex items-center justify-center flex-shrink-0">
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] text-[rgba(0,0,0,0.6)]">
                  +{article.sdgs.length - 6}
                </span>
              </div>
            )}
          </div>
          
          {/* タイトル */}
          <h3 className="font-['Inter:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.85)] leading-tight line-clamp-2 mb-2 min-h-[44px]">
            {article.title}
          </h3>
          
          {/* カテゴリ */}
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[rgba(0,0,0,0.6)] truncate mb-1">
            {article.category}
          </p>
          
          {/* 学年 */}
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[13px] text-[rgba(0,0,0,0.6)] mb-3">
            {article.grade}
          </p>
          
          {/* タグ表示エリア */}
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
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
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] text-[rgba(0,0,0,0.5)] mt-auto">
            {article.date}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    sdgs: [],
    category: [],
    grade: "",
    tag: "",
    company: "",
    keyword: "",
    childActivities: false
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    sdgs: [],
    category: [],
    grade: "",
    tag: "",
    company: "",
    keyword: "",
    childActivities: false
  });

  // フィルタリング処理
  const filterArticles = (articles: ArticleData[], filters: FilterState) => {
    return articles.filter(article => {
      if (filters.sdgs.length > 0 && !filters.sdgs.some(sdg => article.sdgs.includes(sdg))) return false;
      if (filters.category.length > 0 && !filters.category.includes(article.category)) return false;
      if (filters.grade && article.grade !== filters.grade) return false;
      if (filters.tag && !article.tags.includes(filters.tag)) return false;
      if (filters.company && article.company !== filters.company) return false;
      if (filters.keyword && !article.title.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
      return true;
    });
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const filteredArticles = filterArticles(articlesData, appliedFilters);
  
  return (
    <div className="bg-gradient-to-br from-white to-[#fffaf0] relative size-full min-h-screen pt-20" data-name="home">
      <Header />
      <SideMenu filters={filters} setFilters={setFilters} onSearch={handleSearch} />
      <div className="ml-[250px] px-8 pt-4 flex items-center justify-between">
        <div>
          <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)]">記事の一覧</p>
          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.6)] mt-1">
            {filteredArticles.length}件の記事が見つかりました
          </p>
        </div>
        <button
          onClick={() => navigate('/post')}
          className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)]"
        >
          + 記事を投稿
        </button>
      </div>
      
      <div className="ml-[250px] mt-[80px] mb-16 max-w-[calc(100vw-280px)] px-8" data-name="articles">
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map(article => (
              <Article key={article.id} article={article} onClick={() => navigate(`/article/${article.id}`)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[24px] text-[rgba(0,0,0,0.5)] mb-4">
              該当する記事が見つかりませんでした
            </p>
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.4)]">
              フィルター条件を変更してみてください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}