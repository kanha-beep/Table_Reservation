"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function HeroAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let context: gsap.Context | undefined;
    const frame = requestAnimationFrame(() => {
      context = gsap.context(() => {
        gsap.from("[data-reveal]", {
          y: 28,
          opacity: 0,
          duration: 0.9,
          stagger: 0.13,
          ease: "power3.out",
        });
      }, root);
    });
    return () => { cancelAnimationFrame(frame); context?.revert(); };
  }, []);
  return <div ref={root}>{children}</div>;
}
