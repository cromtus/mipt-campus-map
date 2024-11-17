import { useEffect } from "react";

export default function useWindowSize(handler: () => void) {
  useEffect(() => {
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
}