import { useEffect, useState } from "react";

type SmartImageProps = {
  src?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  timeoutMs?: number;
};

export default function SmartImage({
  src,
  fallbackSrc,
  alt,
  className,
  loading = "lazy",
  timeoutMs = 8000,
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setResolved(false);
  }, [src, fallbackSrc]);

  useEffect(() => {
    if (!src) return;
    if (resolved) return;

    const timer = window.setTimeout(() => {
      setCurrentSrc(fallbackSrc);
      setResolved(true);
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [src, fallbackSrc, timeoutMs, resolved]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onLoad={() => setResolved(true)}
      onError={() => {
        setCurrentSrc(fallbackSrc);
        setResolved(true);
      }}
    />
  );
}
