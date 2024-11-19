import { createContext, useContext, useEffect } from "react";

export const MousePositionContext = createContext<{ x: number; y: number } | null>(null);
export const ClickListenersContext = createContext<React.MutableRefObject<(() => void)[]>>({ current: [] });

export function useOutsideClickListener(listener: () => void) {
    const clickListeners = useContext(ClickListenersContext);
    useEffect(() => {
        clickListeners.current.push(listener);
        return () => {
            clickListeners.current = clickListeners.current.filter(l => l !== listener);
        };
    }, [listener]);
}
