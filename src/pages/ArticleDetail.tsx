import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { clearSession } from "../lib/session";
import { ArticleData, fetchArticleById } from "../lib/articles";
import fixedArticleImage from "../assets/article_fixed.svg";

const FIXED_ARTICLE_IMAGE = fixedArticleImage;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
          onClick={() => {
            clearSession();
            navigate('/');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <LogOut size={16} className="text-[rgba(0,0,0,0.6)]" />
          <span className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[14px] text-[rgba(0,0,0,0.7)]">ログアウト</span>
        </button>
      </div>
    </div>
  );
}

export default function ArticleDetail() {
  const { id, schoolId } = useParams<{ id: string; schoolId: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const articleImageSrc =
    schoolId && id
      ? `${API_BASE_URL}/api/articles/${id}/image?schoolId=${encodeURIComponent(schoolId)}`
      : (article?.imageUrl || FIXED_ARTICLE_IMAGE);

  useEffect(() => {
    if (!schoolId || !id) {
      setError("記事情報が不足しています。");
      setIsLoading(false);
      return;
    }

    const articleId = Number(id);
    if (!Number.isFinite(articleId) || articleId <= 0) {
      setError("記事IDが不正です。");
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError("");

    fetchArticleById(schoolId, articleId)
      .then((data) => {
        if (!mounted) return;
        setArticle(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "記事の取得に失敗しました。");
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id, schoolId]);

  return (
    <div className="bg-gradient-to-br from-white to-[#fffaf0] relative size-full min-h-screen pt-20" data-name="article-detail">
      <Header />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <button
          onClick={() => navigate(`/schools/${schoolId}/home`)}
          className="mb-8 flex items-center gap-2 bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)]"
        >
          <ArrowLeft size={18} />
          一覧に戻る
        </button>

        {isLoading && (
          <div className="rounded-xl border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-[14px] text-[rgba(0,0,0,0.7)]">
            記事を読み込み中です...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && article && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl h-fit">
              <div className="bg-gradient-to-br from-[#e9e9e9] to-[#d9d9d9] h-[260px] flex items-center justify-center overflow-hidden">
                <img
                  src={articleImageSrc}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith(FIXED_ARTICLE_IMAGE)) return;
                    e.currentTarget.src = FIXED_ARTICLE_IMAGE;
                  }}
                />
              </div>
              <div className="p-6 space-y-2">
                <div className="bg-gradient-to-r from-[rgba(255,209,131,0.5)] to-[rgba(255,220,150,0.5)] rounded-xl px-4 py-2 inline-block mb-2">
                  <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.8)]">{article.sdgs.join(" / ") || "SDGs未設定"}</p>
                </div>
                <p className="text-[16px] text-[rgba(0,0,0,0.7)]">カテゴリ: {article.category || "未設定"}</p>
                <p className="text-[16px] text-[rgba(0,0,0,0.7)]">学年・クラス: {article.grade || "未設定"}</p>
                <p className="text-[16px] text-[rgba(0,0,0,0.7)]">日付: {article.date || "未設定"}</p>
                <p className="text-[16px] text-[rgba(0,0,0,0.7)]">関連企業様：{article.company || "未設定"}</p>
                <p className="text-[16px] text-[rgba(0,0,0,0.7)]">場所: {article.location?.name || "未設定"}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {article.tags.map((tag, index) => (
                    <span key={index} className="inline-block px-2.5 py-1 bg-gradient-to-r from-[rgba(255,209,131,0.2)] to-[rgba(255,220,150,0.2)] border border-[rgba(255,209,131,0.4)] rounded-full text-[12px] text-[rgba(0,0,0,0.7)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border-2 border-[rgba(0,0,0,0.1)] rounded-3xl shadow-2xl p-8">
              <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[32px] text-[rgba(0,0,0,0.85)] mb-4">{article.title}</h1>
              <div className="overflow-y-auto max-h-[600px] pr-2">
                <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[185%] text-[16px] text-[rgba(0,0,0,0.75)] whitespace-pre-wrap">
                  {article.content || "本文は未登録です。"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
