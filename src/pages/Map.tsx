import { useNavigate } from "react-router";
import { LogOut, MapPin } from "lucide-react";
import { useState } from "react";
import { articlesData, ArticleData } from "./Home";

function Header() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-md" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px] flex items-center px-8 justify-between" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">みなとみらいデジタルアーカイブ</p>
      <div className="absolute right-8 top-[23px] flex gap-8 items-center">
        <p 
          onClick={() => navigate('/map')}
          className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold cursor-pointer hover:text-[rgba(0,0,0,0.9)] transition-colors text-[16px] text-[rgba(0,0,0,0.7)] border-b-2 border-[rgba(0,0,0,0.7)]"
        >
          地図から探す
        </p>
        <p 
          onClick={() => navigate('/home')}
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

function MapMarker({ article, onClick }: { article: ArticleData; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -100%)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="cursor-pointer"
    >
      <MapPin 
        size={32} 
        className="text-[rgba(255,100,100,0.9)] fill-[rgba(255,100,100,0.6)] hover:scale-110 transition-transform drop-shadow-lg" 
      />
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[200px] bg-white rounded-lg shadow-xl p-3 pointer-events-none">
          <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.85)] mb-1 line-clamp-2">
            {article.title}
          </p>
          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.6)]">
            {article.location.name}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {article.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 bg-gradient-to-r from-[rgba(255,209,131,0.2)] to-[rgba(255,220,150,0.2)] border border-[rgba(255,209,131,0.4)] rounded-full text-[10px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[rgba(0,0,0,0.7)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MapView() {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);

  // みなとみらいエリアの中心座標
  const centerLat = 35.4560;
  const centerLng = 139.6345;

  // 緯度経度をピクセル座標に変換（簡易版）
  const latLngToPixel = (lat: number, lng: number) => {
    const mapWidth = 1000;
    const mapHeight = 700;
    
    // みなとみらいエリアの範囲
    const minLat = 35.445;
    const maxLat = 35.465;
    const minLng = 139.620;
    const maxLng = 139.650;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    
    return { x, y };
  };

  return (
    <div className="flex-1 flex gap-4 p-8">
      {/* 地図エリア */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden relative">
        {/* 背景地図（簡易版） */}
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
          
          {/* エリア名 */}
          <div className="absolute top-8 left-8 bg-white/90 rounded-lg px-4 py-2 shadow-md">
            <p className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.8)]">
              みなとみらいエリア
            </p>
          </div>

          {/* 記事マーカー */}
          <div className="absolute inset-0">
            {articlesData.map((article) => {
              const { x, y } = latLngToPixel(article.location.lat, article.location.lng);
              return (
                <div
                  key={article.id}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                  }}
                >
                  <MapMarker 
                    article={article} 
                    onClick={() => setSelectedArticle(article)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* サイドパネル */}
      <div className="w-[350px] bg-white rounded-3xl shadow-xl p-6 overflow-y-auto">
        <h2 className="font-['Inter:Bold','Noto_Sans_JP:Bold',sans-serif] font-bold text-[24px] text-[rgba(0,0,0,0.8)] mb-4">
          記事一覧
        </h2>
        <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[14px] text-[rgba(0,0,0,0.6)] mb-6">
          {articlesData.length}件の記事
        </p>
        
        <div className="space-y-3">
          {articlesData.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/article/${article.id}`)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedArticle?.id === article.id
                  ? 'border-[rgba(255,209,131,0.93)] bg-[rgba(255,209,131,0.1)] shadow-md'
                  : 'border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.5)] hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <MapPin size={16} className="text-[rgba(255,100,100,0.9)] mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[15px] text-[rgba(0,0,0,0.85)] line-clamp-2 mb-1">
                    {article.title}
                  </h3>
                  <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[12px] text-[rgba(0,0,0,0.6)] mb-2">
                    {article.location.name}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-0.5 bg-gradient-to-r from-[rgba(255,209,131,0.2)] to-[rgba(255,220,150,0.2)] border border-[rgba(255,209,131,0.4)] rounded-full text-[10px] font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[rgba(0,0,0,0.7)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Map() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-white to-[#fffaf0] h-screen flex flex-col" data-name="map">
      <Header />
      <div className="flex-1 pt-[67px] flex flex-col">
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)]">
              地図から探す
            </h1>
            <button
              onClick={() => navigate('/post')}
              className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)]"
            >
              + 記事を投稿
            </button>
          </div>
        </div>
        <MapView />
      </div>
    </div>
  );
}
