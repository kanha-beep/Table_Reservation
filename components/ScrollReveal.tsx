"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    let context: gsap.Context | undefined;
    const frame = requestAnimationFrame(() => {
      context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".bottomup").forEach((element) => {
          gsap.from(element, {
            y: 52,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 88%", once: true }
          });
        });
      });
    });
    return () => { cancelAnimationFrame(frame); context?.revert(); };
  }, [pathname]);
  return null;
}
