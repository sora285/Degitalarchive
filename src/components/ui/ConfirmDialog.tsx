type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "実行する",
  cancelLabel = "キャンセル",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClasses =
    tone === "danger"
      ? "border border-red-200 bg-red-500 text-white hover:bg-red-600"
      : "text-white hover:opacity-95";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm"
      onClick={() => {
        if (!loading) {
          onCancel();
        }
      }}
    >
      <div
        className="relative w-full rounded-3xl border border-black/10 bg-white px-8 py-9 shadow-2xl"
        style={{
          width: "min(420px, calc(100vw - 32px))",
          minHeight: "300px",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/60 disabled:opacity-50"
        >
          ×
        </button>
        <div className="pt-2 text-center">
          <p className="text-[30px] font-semibold leading-[1.2] text-black/80">{title}</p>
          <p className="mt-5 px-2 text-sm leading-[1.8] text-black/55">{description}</p>
        </div>
        <div className="mt-12 flex flex-col gap-4 px-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`block w-full rounded-full px-4 py-3 text-center text-sm font-semibold shadow-sm transition-all ${confirmClasses}`}
            style={
              tone === "danger"
                ? undefined
                : {
                    background: "linear-gradient(90deg, rgba(255,209,131,0.93) 0%, rgba(255,220,150,0.93) 100%)",
                    border: "1px solid rgba(255,209,131,0.38)",
                    color: "rgba(0,0,0,0.72)",
                  }
            }
          >
            {loading ? "処理中..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="block w-full rounded-full border border-amber-300 bg-white px-4 py-3 text-center text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
