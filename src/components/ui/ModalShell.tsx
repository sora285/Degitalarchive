import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalShellProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  zIndexClassName?: string;
  zIndex?: number;
  closeDisabled?: boolean;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

export default function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidthClassName = "max-w-2xl",
  zIndexClassName = "z-[100]",
  zIndex,
  closeDisabled = false,
  panelClassName = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
}: ModalShellProps) {
  if (!open) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4 backdrop-blur-[3px]`}
      style={zIndex != null ? { zIndex } : undefined}
      onClick={() => {
        if (!closeDisabled) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${maxWidthClassName} overflow-hidden rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)] ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`relative px-6 pb-5 pt-6 ${headerClassName}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="absolute right-4 top-4 rounded-full p-2 text-[rgba(0,0,0,0.42)] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[rgba(0,0,0,0.68)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
          <div className="pr-10">
            <h3 className="font-['Inter:Semi_Bold','Noto_Sans_JP:Bold',sans-serif] text-[22px] font-semibold text-[rgba(15,23,42,0.88)]">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-[13px] leading-6 text-[rgba(51,65,85,0.66)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className={`max-h-[calc(80vh-180px)] overflow-y-auto px-6 pb-6 ${bodyClassName}`}>{children}</div>
        {footer && <div className={`border-t border-[rgba(0,0,0,0.08)] bg-[rgba(248,250,252,0.72)] px-6 py-4 ${footerClassName}`}>{footer}</div>}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
