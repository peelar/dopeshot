"use client";

import { useEffect, useState } from "react";

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check window width (mobile typically < 768px)
      const isMobileWidth = window.innerWidth < 768;

      // Check user agent for mobile devices
      const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || "";
      const isMobileUA =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase(),
        );

      setIsMobile(isMobileWidth || isMobileUA);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}
