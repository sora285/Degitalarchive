import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, LogOut, MapPin, Search, Check, Plus, X, ChevronDown } from "lucide-react";

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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-md" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px] flex items-center px-8 justify-between" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors whitespace-nowrap" onClick={() => navigate('/home')}>みなとみらいデジタルアーカイブ</p>
      <div className="absolute right-8 top-[23px] flex gap-8 items-center">
        <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]">地図から探す</p>
        <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)]" onClick={() => navigate('/home')}>一覧から探す</p>
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

export default function PostArticle() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categoryCustom, setCategoryCustom] = useState("");
  const [sdgs, setSdgs] = useState<string[]>([]);
  const [isSDGsOpen, setIsSDGsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [classInfo, setClassInfo] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyCustom, setCompanyCustom] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
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

  // カテゴリの選択肢
  const categoryOptions = [
    { id: "education", label: "教育" },
    { id: "environment", label: "環境" },
    { id: "community", label: "地域活動" },
    { id: "international", label: "国際交流" },
    { id: "other", label: "その他（新規入力）" },
  ];

  // 関連企業の選択肢
  const companyOptions = [
    { id: "yokohama-city", label: "横浜市" },
    { id: "mitsubishi", label: "三菱重工業" },
    { id: "nissan", label: "日産自動車" },
    { id: "kirin", label: "キリンホールディングス" },
    { id: "yokohama-bank", label: "横浜銀行" },
  ];

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
  const addCustomCompany = () => {
    if (companyCustom.trim() && !companies.includes(companyCustom.trim())) {
      setCompanies(prev => [...prev, companyCustom.trim()]);
      setCompanyCustom("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    alert("記事を投稿しました！");
    navigate('/home');
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
    <div className="bg-gradient-to-br from-white to-[#fffaf0] relative min-h-screen pt-20" data-name="post-article">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 py-12">
        <button
          onClick={() => navigate('/home')}
          className="mb-6 flex items-center gap-2 text-[rgba(0,0,0,0.6)] hover:text-[rgba(0,0,0,0.9)] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px]">一覧に戻る</span>
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-[rgba(0,0,0,0.1)]">
          <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)] mb-8">記事を投稿</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            {/* 画像アップロード */}
            <div className="flex flex-col gap-3">
              <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                画像
              </label>
              <div className="border-2 border-dashed border-[rgba(0,0,0,0.2)] rounded-xl p-8 hover:border-[rgba(255,209,131,0.93)] transition-all duration-200 cursor-pointer bg-gradient-to-br from-[#f9f9f9] to-white">
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload size={40} className="text-[rgba(0,0,0,0.4)] mb-3" />
                  <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[16px] text-[rgba(0,0,0,0.6)]">
                    {image ? image.name : "クリックして画像をアップロード"}
                  </span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              </div>
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
                required
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
                  className={`text-[rgba(0,0,0,0.5)] transition-transform duration-200 ${isSDGsOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isSDGsOpen && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {sdgOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleSDG(option.id)}
                      className={`border-2 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:shadow-md relative ${
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
              )}
            </div>

            {/* カテゴリ */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="flex items-center justify-between bg-gradient-to-br from-white to-[#fffdf7] border-2 border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)] rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-md"
              >
                <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)]">
                  カテゴリ {category && <span className="ml-2 text-[rgba(0,0,0,0.5)]">({category})</span>}
                </span>
                <ChevronDown 
                  size={20} 
                  className={`text-[rgba(0,0,0,0.5)] transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isCategoryOpen && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {categoryOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setCategory(option.id)}
                      className={`border-2 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:shadow-md ${
                        category === option.id 
                          ? 'bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]' 
                          : 'bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          category === option.id 
                            ? 'border-[rgba(0,0,0,0.3)]' 
                            : 'border-[rgba(0,0,0,0.3)]'
                        }`}>
                          {category === option.id && <div className="w-2 h-2 rounded-full bg-[rgba(0,0,0,0.7)]" />}
                        </div>
                        <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {category === "other" && (
                <input
                  type="text"
                  value={categoryCustom}
                  onChange={(e) => setCategoryCustom(e.target.value)}
                  className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                  placeholder="新規カテゴリを入力"
                />
              )}
            </div>

            {/* 学年・クラス */}
            <div className="flex flex-col gap-3">
              <label htmlFor="class" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                学年・クラス
              </label>
              <select
                id="class"
                value={classInfo}
                onChange={(e) => setClassInfo(e.target.value)}
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)] cursor-pointer"
                required
              >
                <option value="">選択してください</option>
                <option value="5-1">5年1組</option>
                <option value="5-2">5年2組</option>
                <option value="6-1">6年1組</option>
                <option value="6-2">6年2組</option>
              </select>
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
                  className={`text-[rgba(0,0,0,0.5)] transition-transform duration-200 ${isCompanyOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {isCompanyOpen && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {companyOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleCompany(option.id)}
                      className={`border-2 rounded-xl px-4 py-3 text-left transition-all duration-200 hover:shadow-md ${
                        companies.includes(option.id) 
                          ? 'bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-[rgba(255,209,131,1)]' 
                          : 'bg-gradient-to-br from-white to-[#fffdf7] border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          companies.includes(option.id) 
                            ? 'bg-white border-[rgba(0,0,0,0.3)]' 
                            : 'border-[rgba(0,0,0,0.3)]'
                        }`}>
                          {companies.includes(option.id) && <Check size={12} className="text-[rgba(0,0,0,0.7)]" />}
                        </div>
                        <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* 追加された企業を表示 */}
              {companies.filter(c => !companyOptions.some(opt => opt.id === c)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {companies.filter(c => !companyOptions.some(opt => opt.id === c)).map((company, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 bg-gradient-to-br from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] border-2 border-[rgba(255,209,131,1)] rounded-lg px-3 py-2"
                    >
                      <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[13px] text-[rgba(0,0,0,0.7)]">
                        {company}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCompanies(prev => prev.filter(c => c !== company))}
                        className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
                      >
                        <X size={14} className="text-[rgba(0,0,0,0.6)]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={companyCustom}
                  onChange={(e) => setCompanyCustom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCompany())}
                  className="flex-1 bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-3 text-[14px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                  placeholder="新規企業を入力"
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
                required
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
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
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
            <button
              type="submit"
              className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-4 mt-6 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.7)]"
            >
              投稿する
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
