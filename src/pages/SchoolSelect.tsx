import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Building2, ChevronRight } from "lucide-react";

function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-sm" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px]" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">みなとみらいデジタルアーカイブ</p>
    </div>
  );
}

type SchoolItem = {
  id: number;
  slug: string;
  name: string;
};

export default function SchoolSelect() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSchools() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/schools`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setError("学校一覧の取得に失敗しました。");
          return;
        }

        const data = await response.json();
        if (!Array.isArray(data?.schools)) {
          setError("学校一覧レスポンス形式が不正です。");
          return;
        }

        setSchools(data.schools);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Failed to fetch schools:", error);
          setError("学校一覧の取得中に通信エラーが発生しました。");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchools();
    return () => controller.abort();
  }, [apiBaseUrl]);

  const handleSchoolSelect = (schoolId: string, schoolName: string) => {
    // 選択した学校情報をローカルストレージに保存
    localStorage.setItem('currentSchoolId', schoolId);
    localStorage.setItem('currentSchoolName', schoolName);
    
    // 学校のログインページへ遷移
    navigate(`/schools/${schoolId}`);
  };

  return (
    <div className="bg-gradient-to-br from-[#fff5e0] to-white relative min-h-screen" data-name="school-select">
      <Header />
      
      <div className="flex flex-col items-center justify-center min-h-screen pt-16 px-4">
        <div className="max-w-3xl w-full mt-8">
          <div className="text-center mb-12">
            <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[42px] text-[rgba(0,0,0,0.8)] mb-4">
              学校を選択してください
            </h1>
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.6)]">
              ご利用の学校を選択してログインしてください
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isLoading && !error && schools.length === 0 && (
              <div className="col-span-full rounded-xl border border-[rgba(0,0,0,0.12)] bg-white/80 px-4 py-6 text-center text-[14px] text-[rgba(0,0,0,0.65)]">
                DBに学校データがありません。`schools` テーブルにデータを登録してください。
              </div>
            )}
            {schools.map((school) => (
              <div
                key={school.slug}
                onClick={() => handleSchoolSelect(school.slug, school.name)}
                className="bg-white/80 backdrop-blur-sm border-2 border-[rgba(0,0,0,0.1)] hover:border-[rgba(255,209,131,0.93)] rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-[rgba(255,209,131,0.3)] to-[rgba(255,220,150,0.3)] rounded-xl p-3 group-hover:from-[rgba(255,209,131,0.5)] group-hover:to-[rgba(255,220,150,0.5)] transition-all">
                      <Building2 size={28} className="text-[rgba(0,0,0,0.6)]" />
                    </div>
                    <div>
                      <h2 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[20px] text-[rgba(0,0,0,0.85)] mb-1 group-hover:text-[rgba(0,0,0,0.95)] transition-colors">
                        {school.name}
                      </h2>
                      <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[14px] text-[rgba(0,0,0,0.5)]">
                        ID: {school.slug}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-[rgba(0,0,0,0.3)] group-hover:text-[rgba(0,0,0,0.6)] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[14px] text-[rgba(0,0,0,0.5)]">
              {isLoading
                ? "学校情報を読み込み中です..."
                : error || "学校が見つからない場合は、管理者にお問い合わせください"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
