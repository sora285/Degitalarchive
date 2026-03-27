import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-sm" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px]" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">デジタルアーカイブ</p>
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const publicSchoolId = import.meta.env.VITE_PUBLIC_SCHOOL_ID || "";

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

        const schools = data.schools as SchoolItem[];
        if (schools.length === 0) {
          setError("公開表示できる学校が見つかりません。");
          return;
        }

        const preferredSchoolId = localStorage.getItem("currentSchoolId") || publicSchoolId;
        const selectedSchool =
          schools.find((school) => school.slug === preferredSchoolId) || schools[0];

        localStorage.setItem("currentSchoolId", selectedSchool.slug);
        localStorage.setItem("currentSchoolName", selectedSchool.name);
        setSchoolName(selectedSchool.name);
        navigate(`/schools/${selectedSchool.slug}/home`, { replace: true });
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

  return (
    <div className="bg-gradient-to-br from-[#fff5e0] to-white relative min-h-screen" data-name="school-select">
      <Header />
      
      <div className="flex flex-col items-center justify-center min-h-screen pt-16 px-4">
        <div className="max-w-xl w-full mt-8">
          <div className="text-center mb-12">
            <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[42px] text-[rgba(0,0,0,0.8)] mb-4">
              公開記事を表示しています
            </h1>
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.6)]">
              保護者の方は、お子さまの学校の記事だけをご覧いただけます
            </p>
          </div>

          <div className="rounded-3xl border border-[rgba(0,0,0,0.12)] bg-white/85 p-10 text-center shadow-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(255,209,131,0.3)] to-[rgba(255,220,150,0.3)]">
              <Building2 size={28} className="text-[rgba(0,0,0,0.6)]" />
            </div>
            <p className="text-[18px] font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[rgba(0,0,0,0.8)]">
              {isLoading ? "学校ページを準備しています..." : schoolName || "学校ページへ移動します"}
            </p>
            <p className="mt-3 text-[14px] text-[rgba(0,0,0,0.55)]">
              {error || "この端末では対象の学校だけを表示します"}
            </p>
          </div>
          
          <div className="mt-12 text-center">
            <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[14px] text-[rgba(0,0,0,0.5)]">
              {isLoading ? "学校情報を読み込み中です..." : error || "教員の方は公開ページ下部のログインリンクをご利用ください"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
