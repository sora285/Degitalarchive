import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, LogOut } from "lucide-react";

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
  const [sdgs, setSdgs] = useState("");
  const [classInfo, setClassInfo] = useState("");
  const [company, setCompany] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    alert("記事を投稿しました！");
    navigate('/home');
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
              <label htmlFor="sdgs" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                SDGs
              </label>
              <select
                id="sdgs"
                value={sdgs}
                onChange={(e) => setSdgs(e.target.value)}
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)] cursor-pointer"
                required
              >
                <option value="">選択してください</option>
                <option value="1">1. 貧困をなくそう</option>
                <option value="2">2. 飢餓をゼロに</option>
                <option value="3">3. すべての人に健康と福祉を</option>
                <option value="4">4. 質の高い教育をみんなに</option>
                <option value="5">5. ジェンダー平等を実現しよう</option>
                <option value="11">11. 住み続けられるまちづくりを</option>
                <option value="13">13. 気候変動に具体的な対策を</option>
              </select>
            </div>

            {/* カテゴリ */}
            <div className="flex flex-col gap-3">
              <label htmlFor="category" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                カテゴリ
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)] cursor-pointer"
                required
              >
                <option value="">選択してください</option>
                <option value="education">教育</option>
                <option value="environment">環境</option>
                <option value="community">地域活動</option>
                <option value="international">国際交流</option>
              </select>
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
              <label htmlFor="company" className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1">
                関連企業 <span className="text-[rgba(0,0,0,0.4)]">(任意)</span>
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                placeholder="関連企業を入力"
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
