import { useNavigate, useParams } from "react-router";
import svgPaths from "../imports/svg-ujzd2bzv6q";
import { ArrowLeft, LogOut } from "lucide-react";

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

export default function ArticleDetail() {
  const { id, schoolId } = useParams<{ id: string; schoolId: string }>();
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-white to-[#fffaf0] relative size-full min-h-screen pt-20" data-name="MacBook Pro 14' - 1">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <button
          onClick={() => navigate(`/schools/${schoolId}/home`)}
          className="mb-8 flex items-center gap-2 bg-gradient-to-r from-[rgba(255,209,131,0.93)] to-[rgba(255,220,150,0.93)] hover:from-[rgba(255,209,131,1)] hover:to-[rgba(255,220,150,1)] active:scale-[0.98] shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.7)]"
        >
          <ArrowLeft size={18} />
          一覧に戻る
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 記事カード */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl h-fit">
            <div className="bg-gradient-to-br from-[#e9e9e9] to-[#d9d9d9] h-[400px] flex items-center justify-center">
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[48px] text-[rgba(0,0,0,0.4)]">img</p>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-r from-[rgba(255,209,131,0.5)] to-[rgba(255,220,150,0.5)] rounded-xl px-4 py-2 inline-block mb-4">
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] text-[rgba(0,0,0,0.8)]">SDGs</p>
              </div>
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.7)] mb-2">カテゴリ</p>
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.7)] mb-2">6年1組</p>
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.7)] mb-2">2024/01/15</p>
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[18px] text-[rgba(0,0,0,0.7)]">関連企業</p>
            </div>
          </div>

          {/* 右側: 記事内容 */}
          <div className="bg-white/80 backdrop-blur-sm border-2 border-[rgba(0,0,0,0.1)] rounded-3xl shadow-2xl p-8">
            <h1 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[32px] text-[rgba(0,0,0,0.85)] mb-4">記事の名前</h1>
            <h2 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] font-semibold text-[24px] text-[rgba(0,0,0,0.85)] mb-6">SDGｓを広げよう！いや深めよう！</h2>
            <div className="overflow-y-auto max-h-[600px] pr-2">
              <p className="font-['Inter:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[185%] text-[16px] text-[rgba(0,0,0,0.75)]">
                「ＳＤＧｓをもっと広めたい。ＳＤＧｓを達成するために、日本だけでは達成できない。世界に広めるためには、みんなを笑顔にするような歌を作り発信しよう。」そんな思いをもち、５年生の頃よりＣＹＯ（シティネット横浜プロジェクトオフィス）による支援のもと、モンゴルの小学校と交流を進めてきました。
                <br /><br />
                　２年目となる今年度は、互いの学校で行っている身近なＳＤＧｓ達成のための取組を情報交換したり、出来上がった歌を披露したりして感想をもらいました。３回の交流を進めていく中で、日本の課題とモンゴルの課題は違うことに気付いたり、課題やそれぞれの文化は違っていても、目的は同じであることに気付いたりすることができました。そんな中、もう一度自分たちの足元を見つめ直し、これから自分が意識していきたいことを互いに話し合うことができました。
                <br /><br />
                　また、新しい校歌となった歌を、アジアスマートシティ会議で世界に発信することもできました。世界に目を向けることで、多面的に物事を捉えたり、多様性の価値を感じたりすることができました。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}