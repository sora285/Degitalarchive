import ArticleDetail from "../ArticleDetail";
import MobileBottomNav from "./MobileBottomNav";

export default function ArticleDetailMobile() {
  return (
    <>
      <div className="pb-28">
        <ArticleDetail mobile />
      </div>
      <MobileBottomNav active="none" />
    </>
  );
}
