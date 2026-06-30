import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { setCurrentUser } from "../lib/session";
import { fetchSchoolBySlug } from "../lib/schools";

export default function Register() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("学校");
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (!schoolId) {
      setSchoolName("学校");
      return;
    }

    let mounted = true;

    fetchSchoolBySlug(schoolId)
      .then((school) => {
        if (!mounted) return;
        const nextSchoolName = school?.name || "学校";
        setSchoolName(nextSchoolName);
        localStorage.setItem("currentSchoolName", nextSchoolName);
        localStorage.setItem("currentSchoolId", schoolId);
      })
      .catch((fetchError) => {
        console.error("学校名の取得に失敗しました:", fetchError);
        if (!mounted) return;
        setSchoolName("学校");
      });

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!schoolId) {
      setError("学校IDが見つかりません。");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          schoolId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.message || "アカウント作成に失敗しました。");
        return;
      }

      if (data?.user) {
        setCurrentUser(data.user);
      }

      navigate(`/schools/${schoolId}/home`);
    } catch (err) {
      console.error("Register error:", err);
      setError("通信エラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#fff5e0] to-white min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px]" />
        <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold left-[93px] text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">
          デジタルアーカイブ - {schoolName}
        </p>
      </div>

      <div className="flex items-center justify-center min-h-screen pt-16 px-4">
        <div className="bg-white/80 backdrop-blur-sm border border-[rgba(0,0,0,0.1)] shadow-2xl rounded-3xl p-10 w-full max-w-[520px] mt-8">
          <button
            onClick={() => navigate(`/schools/${schoolId}`)}
            className="flex items-center gap-2 mb-6 text-[rgba(0,0,0,0.6)] hover:text-[rgba(0,0,0,0.9)] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px]">
              ログイン画面に戻る
            </span>
          </button>

          <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[32px] text-[rgba(0,0,0,0.8)] text-center mb-3">
            アカウント作成
          </h1>

          <p className="text-center text-[14px] text-[rgba(0,0,0,0.6)] mb-2">{schoolName}</p>
          <p className="text-center text-[13px] text-[rgba(0,0,0,0.5)] mb-8">この画面は一時公開中です。</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-[14px] text-[rgba(0,0,0,0.7)]">ユーザー名</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[rgba(255,209,131,0.93)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[14px] text-[rgba(0,0,0,0.7)]">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[rgba(255,209,131,0.93)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[14px] text-[rgba(0,0,0,0.7)]">パスワード（8文字以上）</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[rgba(255,209,131,0.93)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-[14px] text-[rgba(0,0,0,0.7)]">確認用パスワード</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[rgba(255,209,131,0.93)]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] rounded-xl py-3 mt-2 font-semibold text-[16px] text-[rgba(0,0,0,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "作成中..." : "アカウントを作成"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
