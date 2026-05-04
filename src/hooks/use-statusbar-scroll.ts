// src/hooks/use-statusbar-scroll.ts

import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export const useStatusBarScroll = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleScroll = async () => {
      const y = window.scrollY;

      if (y < 10) {
        // 🔥 Transparent initial
        await StatusBar.setBackgroundColor({ color: "#00000000" });
        await StatusBar.setStyle({ style: Style.Dark }); // white icons
      } else {
        // 🔥 Solid when scrolled
        await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
        await StatusBar.setStyle({ style: Style.Light }); // black icons
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
};