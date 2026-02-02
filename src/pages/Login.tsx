import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown } from "lucide-react";

function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 shadow-sm" data-name="header">
      <div className="bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] h-[67px]" />
      <p className="absolute font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold leading-[normal] left-[93px] not-italic text-[20px] text-[rgba(0,0,0,0.7)] top-[23px] whitespace-nowrap">みなとみらいデジタルアーカイブ</p>
    </div>
  );
}

// 学校リスト
const schools = [
  "みなとみらい小学校",
  "横浜港小学校",
  "赤レンガ小学校",
  "ランドマーク小学校",
  "パシフィコ小学校"
];

function SchoolSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (school: string) => {
    onChange(school);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl px-5 py-4 text-[16px] transition-all duration-200 focus:outline-none focus:border-[rgba(255,209,131,0.93)] focus:shadow-lg focus:shadow-[rgba(255,209,131,0.2)] flex items-center justify-between text-left"
      >
        <span className={value ? "text-[rgba(0,0,0,0.8)]" : "text-[rgba(0,0,0,0.4)]"}>
          {value || "学校を選択してください"}
        </span>
        <ChevronDown 
          size={20} 
          className={`text-[rgba(0,0,0,0.5)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[rgba(0,0,0,0.1)] rounded-xl shadow-2xl z-20 max-h-[240px] overflow-y-auto">
            {schools.map((school, index) => (
              <div
                key={index}
                onClick={() => handleSelect(school)}
                className={`px-5 py-4 cursor-pointer text-[16px] transition-colors ${
                  value === school 
                    ? 'bg-[rgba(255,209,131,0.3)] text-[rgba(0,0,0,0.9)]' 
                    : 'text-[rgba(0,0,0,0.7)] hover:bg-[rgba(255,209,131,0.1)]'
                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === schools.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                {school}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [school, setSchool] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    if (school && username && password) {
      // 学校名をローカルストレージに保存（オプション）
      localStorage.setItem('currentSchool', school);
      navigate("/home");
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#fff5e0] to-white relative min-h-screen" data-name="login">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="bg-white/80 backdrop-blur-sm border border-[rgba(0,0,0,0.1)] shadow-2xl rounded-3xl p-12 w-[480px] mt-8">
          <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[36px] text-[rgba(0,0,0,0.8)] text-center mb-12">
            ログイン
          </h1>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <label 
                className="font-['Inter:Medium','Noto_Sans_JP:Medium',sans-serif] font-medium text-[15px] text-[rgba(0,0,0,0.7)] ml-1"
              >
                学校名
              </label>
              <SchoolSelect value={school} onChange={setSchool} />
            </div>

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