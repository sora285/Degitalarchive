import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Upload, LogOut, MapPin, Search, Check, Plus, X, ChevronDown, Tag } from "lucide-react";
import { articlesData, ArticleData } from "./Home";

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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-md" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px] flex items-center px-8 justify-between" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors whitespace-nowrap" onClick={() => navigate(`/schools/${schoolId}/home`)}>みなとみらいデジタルアーカイブ</p>
      <div className="absolute right-8 top-[23px] flex gap-8 items-center">
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
  const { schoolId } = useParams<{ schoolId: string }>();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categoryCustom, setCategoryCustom] = useState("");
  const [sdgs, setSdgs] = useState<string[]>([]);
  const [isSDGsOpen, setIsSDGsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [classInfo, setClassInfo] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyCustom, setCompanyCustom] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageMode, setImageMode] = useState<"upload" | "select">("upload");
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<string>("");
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

  // タグ関連のstate
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // 親子活動関連のstate
  const [activityType, setActivityType] = useState<"parent" | "child" | "none">("none");
  const [parentActivityId, setParentActivityId] = useState<number | null>(null);
  const [childActivityIds, setChildActivityIds] = useState<number[]>([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // 画像ライブラリ（共有されている画像のサンプル）
  const imageLibrary = [
    { 
      id: "1", 
      name: "横浜港の風景", 
      url: "https://images.unsplash.com/photo-1589452271712-64c8f701e0e5?w=400",
      comment: "横浜港から見た美しい海の景色。天気が良く、多くの船が停泊していました。"
    },
    { 
      id: "2", 
      name: "みなとみらい夜景", 
      url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400",
      comment: "夜のみなとみらいエリア。ランドマークタワーやコスモワールドの観覧車が美しく輝いています。"
    },
    { 
      id: "3", 
      name: "赤レンガ倉庫", 
      url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400",
      comment: "歴史ある赤レンガ倉庫。今はショッピングやイベントで多くの人が訪れる人気スポットです。"
    },
    { 
      id: "4", 
      name: "横浜ランドマークタワー", 
      url: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400",
      comment: "横浜のシンボル、ランドマークタワー。展望台からの眺めは最高です！"
    },
    { 
      id: "5", 
      name: "山下公園", 
      url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400",
      comment: "海沿いの山下公園。春には花が咲き、散歩やジョギングに最適な場所です。"
    },
    { 
      id: "6", 
      name: "横浜中華街", 
      url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
      comment: "日本最大の中華街。美味しい中華料理と活気ある雰囲気が魅力です。"
    },
  ];

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

  // 学年・クラスの選択肢
  const classOptions = [
    { id: "5-1", label: "5年1組" },
    { id: "5-2", label: "5年2組" },
    { id: "6-1", label: "6年1組" },
    { id: "6-2", label: "6年2組" },
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

  // タグを追加
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  // タグを削除
  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // 小活動をトグル
  const toggleChildActivity = (id: number) => {
    setChildActivityIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    alert("記事を投稿しました！");
    navigate(`/schools/${schoolId}/home`);
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
          <button
            onClick={() => navigate(`/schools/${schoolId}/home`)}
            className="mb-6 flex items-center gap-2 text-[rgba(0,0,0,0.6)] hover:text-[rgba(0,0,0,0.9)] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px]">一覧に戻る</span>
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-[rgba(0,0,0,0.1)]">
            <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)] mb-8">記事を投稿</h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
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
                      setSelectedLibraryImage("");
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
                      setImage(null);
                      setImagePreview("");
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

                {/* 画像アップロード */}
                {imageMode === "upload" && (
                  <div className="border-2 border-dashed border-[rgba(0,0,0,0.2)] rounded-xl overflow-hidden hover:border-[rgba(255,209,131,0.93)] transition-all duration-200 bg-gradient-to-br from-[#f9f9f9] to-white">
                    {!imagePreview ? (
                      <label htmlFor="image-upload" className="flex flex-col items-center justify-center cursor-pointer p-8">
                        <Upload size={40} className="text-[rgba(0,0,0,0.4)] mb-3" />
                        <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[16px] text-[rgba(0,0,0,0.6)] mb-2">
                          {image ? image.name : "クリックして画像をアップロード"}
                        </span>
                        <span className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] text-[rgba(0,0,0,0.5)]">
                          別端末で撮影した写真も選択可能です
                        </span>
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto max-h-[400px] object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setImagePreview("");
                          }}
                          className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
                        >
                          <X size={20} className="text-[rgba(0,0,0,0.7)]" />
                        </button>
                        <label
                          htmlFor="image-upload"
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white rounded-lg px-4 py-2 shadow-lg cursor-pointer transition-all duration-200 flex items-center gap-2"
                        >
                          <Upload size={16} className="text-[rgba(0,0,0,0.7)]" />
                          <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                            別の画像を選択
                          </span>
                        </label>
                      </div>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setImage(file || null);
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setImagePreview("");
                        }
                      }}
                    />
                  </div>
                )}

                {/* 画像ライブラリから選択 */}
                {imageMode === "select" && (
                  <div className="border-2 border-[rgba(0,0,0,0.2)] rounded-xl p-4 bg-gradient-to-br from-[#f9f9f9] to-white">
                    <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.6)] mb-4">
                      共有画像ライブラリから選択してください
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                      {imageLibrary.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setSelectedLibraryImage(img.url)}
                          className={`relative rounded-xl overflow-hidden border-4 transition-all duration-200 hover:scale-[1.02] ${
                            selectedLibraryImage === img.url
                              ? 'border-[rgba(255,209,131,1)] shadow-xl'
                              : 'border-transparent hover:border-[rgba(255,209,131,0.5)]'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-40 object-cover"
                          />
                          {selectedLibraryImage === img.url && (
                            <div className="absolute top-2 right-2 bg-[rgba(255,209,131,1)] rounded-full p-1.5 shadow-lg">
                              <Check size={18} className="text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
                            <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[13px] text-white mb-1">
                              {img.name}
                            </p>
                            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[11px] text-white/90 leading-tight line-clamp-2">
                              {img.comment}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedLibraryImage && (
                      <div className="mt-4 p-4 bg-white rounded-xl border-2 border-[rgba(255,209,131,0.5)] shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.8)] mb-1">
                              ✓ {imageLibrary.find(img => img.url === selectedLibraryImage)?.name}
                            </p>
                            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[13px] text-[rgba(0,0,0,0.6)] leading-relaxed">
                              {imageLibrary.find(img => img.url === selectedLibraryImage)?.comment}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedLibraryImage("")}
                            className="text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.8)] hover:bg-[rgba(0,0,0,0.05)] rounded-full p-1 transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
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
                    カテゴリ {category && <span className="ml-2 text-[rgba(0,0,0,0.5)]">({categoryOptions.find(opt => opt.id === category)?.label || categoryCustom})</span>}
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
                className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-4 mt-6 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.7)] cursor-pointer"
              >
                投稿する
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SDGs モーダル */}
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
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setCategory(option.id);
                      if (option.id !== "other") {
                        setIsCategoryOpen(false);
                      }
                    }}
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
              {category === "other" && (
                <div className="flex flex-col gap-3">
                  <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                    新規カテゴリ名
                  </label>
                  <input
                    type="text"
                    value={categoryCustom}
                    onChange={(e) => setCategoryCustom(e.target.value)}
                    className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-3 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                    placeholder="新規カテゴリを入力"
                  />
                </div>
              )}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsCompanyOpen(false)}>
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
              
              {/* 追加された企業を表示 */}
              {companies.filter(c => !companyOptions.some(opt => opt.id === c)).length > 0 && (
                <div className="mb-4">
                  <p className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)] mb-3">
                    追加された企業
                  </p>
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
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <label className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px] text-[rgba(0,0,0,0.7)]">
                  新規企業を追加
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={companyCustom}
                    onChange={(e) => setCompanyCustom(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCompany())}
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
    </>
  );
}