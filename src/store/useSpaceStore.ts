import { create } from "zustand";

interface SpaceStore {
  entered: boolean;
  code: string | null;
  checking: boolean;
  setSession: (entered: boolean, code: string | null) => void;
  setChecking: (checking: boolean) => void;
  reset: () => void;
}

export const useSpaceStore = create<SpaceStore>((set) => ({
  entered: false,
  code: null,
  checking: true,
  setSession: (entered, code) => set({ entered, code, checking: false }),
  setChecking: (checking) => set({ checking }),
  reset: () => set({ entered: false, code: null, checking: false }),
}));

export function maskSpaceCode(code: string | null): string {
  if (!code) return "";
  if (code.length <= 4) return "*".repeat(code.length);
  return `${code.slice(0, 2)}${"*".repeat(Math.min(code.length - 4, 8))}${code.slice(-2)}`;
}
