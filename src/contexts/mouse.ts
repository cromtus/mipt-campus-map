import { createContext } from "react";

export const MousePositionContext = createContext<{ x: number; y: number } | null>(null);
export const ClickListenersContext = createContext<React.MutableRefObject<(() => void)[]>>({ current: [] });