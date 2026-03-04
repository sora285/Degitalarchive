import { useNavigate, useParams } from "react-router";
import { LogOut, MapPin } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { articlesData, ArticleData } from "./Home";

function Header() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-md" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px] flex items-center px-8 justify-between" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">みなとみらいデジタルアーカイブ</p>
      <div className="absolute right-8 top-[23px] flex gap-8 items-center">
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

function MapView() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // みなとみらいエリアの中心座標
  const centerLat = 35.4560;
  const centerLng = 139.6345;

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
    // Google Maps APIのスクリプトを読み込む
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
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

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&language=ja&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      script.onerror = () => {
        setMapError('Google Maps APIの読み込みに失敗しました。フォールバック表示を使用します。');
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

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
          mapId: 'DEMO_MAP_ID', // Advanced Markers用
        });

        googleMapRef.current = map;

        // InfoWindowを作成
        const infoWindow = new google.maps.InfoWindow();
        infoWindowRef.current = infoWindow;

        // 記事マーカーを配置（AdvancedMarkerElement使用）
        articlesData.forEach((article) => {
          // カスタムピン要素を作成
          const pinElement = new google.maps.marker.PinElement({
            background: '#ff6464',
            borderColor: '#ff3333',
            glyphColor: '#ffffff',
            scale: 1.2,
          });

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: article.location.lat, lng: article.location.lng },
            map: map,
            title: article.title,
            content: pinElement.element,
          });

          // マーカークリックイベント
          marker.addListener('click', () => {
            setSelectedArticle(article);
            
            // InfoWindow の内容
            const content = `
              <div style="padding: 8px; max-width: 250px;">
                <h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: rgba(0,0,0,0.85);">
                  ${article.title}
                </h3>
                <p style="font-size: 13px; margin: 0 0 8px 0; color: rgba(0,0,0,0.6);">
                  📍 ${article.location.name}
                </p>
                <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
                  ${article.tags.slice(0, 3).map(tag => 
                    `<span style="font-size: 11px; padding: 2px 8px; background: rgba(255,209,131,0.3); border-radius: 12px; color: rgba(0,0,0,0.7);">#${tag}</span>`
                  ).join('')}
                </div>
                <p style="font-size: 12px; margin: 0; color: rgba(0,0,0,0.5);">
                  ${article.date}
                </p>
              </div>
            `;
            
            infoWindow.setContent(content);
            infoWindow.open({ map, anchor: marker });

            // 地図の中心を移動
            map.panTo({ lat: article.location.lat, lng: article.location.lng });
          });

          markersRef.current.push(marker);
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
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, []);

  // フォールバック：APIキーがない場合の簡易地図表示
  if (mapError) {
    return (
      <div className="flex-1 flex gap-4 p-8">
        {/* 簡易地図エリア */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden relative">
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
            <div className="absolute top-8 left-8 space-y-4">
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
              {articlesData.map((article) => {
                const { x, y } = latLngToPixel(article.location.lat, article.location.lng);
                return (
                  <div
                    key={article.id}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -100%)',
                    }}
                    onClick={() => setSelectedArticle(article)}
                    className="cursor-pointer"
                  >
                    <MapPin 
                      size={32} 
                      className="text-[rgba(255,100,100,0.9)] fill-[rgba(255,100,100,0.6)] hover:scale-110 transition-transform drop-shadow-lg" 
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
                onClick={() => setSelectedArticle(article)}
                onDoubleClick={() => navigate(`/schools/${schoolId}/article/${article.id}`)}
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
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[11px] text-[rgba(0,0,0,0.4)] mt-2 text-center">
                  ダブルクリックで記事を開く
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Google Maps表示
  return (
    <div className="flex-1 flex gap-4 p-8">
      {/* Google Maps エリア */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden relative">
        <div ref={mapRef} className="w-full h-full" />
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
              onClick={() => {
                setSelectedArticle(article);
                // 地図の中心を移動
                if (googleMapRef.current) {
                  googleMapRef.current.panTo({ lat: article.location.lat, lng: article.location.lng });
                  googleMapRef.current.setZoom(16);
                }
              }}
              onDoubleClick={() => navigate(`/schools/${schoolId}/article/${article.id}`)}
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
              <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[11px] text-[rgba(0,0,0,0.4)] mt-2 text-center">
                {selectedArticle?.id === article.id ? 'ダブルクリックで記事を開く' : 'クリックで地図に表示'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Map() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();

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
              onClick={() => navigate(`/schools/${schoolId}/post`)}
              className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)] cursor-pointer"
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