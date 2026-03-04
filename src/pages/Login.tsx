import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";

function Header({ schoolName }: { schoolName: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-sm" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px]" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">
        みなとみらいデジタルアーカイブ - {schoolName}
      </p>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // ローカルストレージから学校名を取得
  const schoolName = localStorage.getItem('currentSchoolName') || '学校';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    if (username && password && schoolId) {
      navigate(`/schools/${schoolId}/home`);
    }
  };
  
  const handleBackToSchoolSelect = () => {
    navigate('/');
  };

  return (
    <div className="bg-gradient-to-br from-[#fff5e0] to-white relative min-h-screen" data-name="login">
      <Header schoolName={schoolName} />
      
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="bg-white/80 backdrop-blur-sm border border-[rgba(0,0,0,0.1)] shadow-2xl rounded-3xl p-12 w-[480px] mt-8">
          <button
            onClick={handleBackToSchoolSelect}
            className="flex items-center gap-2 mb-6 text-[rgba(0,0,0,0.6)] hover:text-[rgba(0,0,0,0.9)] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[14px]">
              学校選択に戻る
            </span>
          </button>
          
          <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)] text-center mb-4">
            ログイン
          </h1>
          
          <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.6)] text-center mb-10">
            {schoolName}
          </p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <label 
                htmlFor="username"
                className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1"
              >
                ユーザー名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                placeholder="ユーザー名を入力"
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <label 
                htmlFor="password"
                className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)]"
                placeholder="パスワードを入力"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-4 mt-6 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[18px] text-[rgba(0,0,0,0.7)]"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}