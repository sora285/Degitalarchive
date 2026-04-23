import { ReactNode } from "react";
import { List, Map } from "lucide-react";
import { useNavigate, useParams } from "react-router";

type MobileBottomNavProps = {
  active: "home" | "map" | "none";
  trailingSlot?: ReactNode;
};

function NavButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-3 py-3 text-[10px] font-semibold transition-all duration-200 ${
        active
          ? "scale-[1.02] text-[rgba(0,0,0,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          : "text-[rgba(0,0,0,0.68)]"
      }`}
      style={active ? { backgroundColor: "rgba(255,255,255,0.28)" } : undefined}
    >
      {children}
      <span className="whitespace-nowrap leading-tight text-center">{label}</span>
    </button>
  );
}

export default function MobileBottomNav({ active, trailingSlot }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();

  return (
    <div className="fixed bottom-0 left-1/2 z-50 flex w-[calc(100vw-24px)] max-w-[430px] -translate-x-1/2 items-end gap-4 px-3 pb-5">
      <div
        className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full border border-[rgba(154,52,18,0.16)] px-3 py-2 shadow-[0_18px_45px_rgba(194,65,12,0.24)] backdrop-blur-xl"
        style={{ background: "linear-gradient(90deg, rgba(255,209,131,0.93), rgba(255,220,150,0.93))" }}
      >
        <NavButton active={active === "home"} label="一覧から探す" onClick={() => navigate(`/mobile/schools/${schoolId}/home`)}>
          <List size={18} />
        </NavButton>
        <NavButton active={active === "map"} label="地図から探す" onClick={() => navigate(`/mobile/schools/${schoolId}/map`)}>
          <Map size={18} />
        </NavButton>
      </div>
      {trailingSlot && <div className="flex-none">{trailingSlot}</div>}
    </div>
  );
}
