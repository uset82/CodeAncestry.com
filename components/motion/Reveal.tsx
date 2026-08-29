'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * One entrance per view: opacity and translate only. Reduced motion skips it.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !root.current) return;
      gsap.fromTo(
        root.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 88%',
            once: true,
          },
        },
      );
    },
    { scope: root, dependencies: [reducedMotion] },
  );

  return <div ref={root}>{children}</div>;
}
