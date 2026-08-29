import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const cache = new Map<string, string>();

export function useSignedUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(path ? (cache.get(path) ?? null) : null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const cached = cache.get(path);
    if (cached) {
      setUrl(cached);
      return;
    }
    let cancelled = false;
    supabase.storage
      .from("cards")
      .createSignedUrl(path, 60 * 60 * 6)
      .then(({ data }) => {
        if (cancelled || !data?.signedUrl) return;
        cache.set(path, data.signedUrl);
        setUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}

export function SignedImage({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const url = useSignedUrl(path);

  if (!url) {
    return <div className={cn("animate-pulse bg-muted", className)} aria-hidden />;
  }

  return <img src={url} alt={alt} loading="lazy" className={cn("object-contain", className)} />;
}
