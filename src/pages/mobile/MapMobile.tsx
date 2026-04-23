import { LogOut } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import Map from "../Map";
import MobileBottomNav from "./MobileBottomNav";
import { getCurrentUser, logoutCurrentUser } from "../../lib/session";

export default function MapMobile() {
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const currentUser = getCurrentUser(schoolId);

  const handleLogout = async () => {
    if (schoolId) {
      localStorage.setItem("currentSchoolId", schoolId);
    }
    await logoutCurrentUser();
    navigate(`/mobile/schools/${schoolId}/home`, { replace: true });
  };

  return (
    <>
      <Map />
      <div
        className="fixed inset-x-0 top-0 z-[60] border-b border-[rgba(180,83,9,0.14)] px-4 py-4 shadow-[0_8px_24px_rgba(180,83,9,0.18)]"
        style={{ background: "linear-gradient(90deg, rgba(255,209,131,0.93), rgba(255,220,150,0.93))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[18px] font-semibold text-[rgba(0,0,0,0.82)]">デジタルアーカイブ</p>
            <p className="text-[12px] text-[rgba(0,0,0,0.58)]">地図から探す</p>
          </div>
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className="rounded-full border border-[rgba(90,39,0,0.12)] bg-white/86 px-3 py-2 text-[12px] font-semibold text-[rgba(0,0,0,0.76)]"
            >
              <LogOut size={14} className="inline-block" /> ログアウト
            </button>
          )}
        </div>
      </div>
      <MobileBottomNav active="map" />
    </>
  );
}
