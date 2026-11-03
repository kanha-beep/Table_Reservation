"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScreenLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => { setLoading(false); }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest("a");
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank") return;
      const destination = new URL(href, window.location.href);
      if (destination.origin === window.location.origin && destination.pathname !== window.location.pathname) setLoading(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!loading) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-cream/90 backdrop-blur-sm" role="status" aria-live="polite" aria-label="Loading next screen">
    <div className="flex flex-col items-center gap-4"><span className="h-11 w-11 animate-spin rounded-full border-4 border-sage/30 border-t-terracotta" /><span className="text-[10px] font-bold tracking-[.24em] text-ink">LOADING</span></div>
  </div>;
}
