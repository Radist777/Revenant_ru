import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";

type PrivacyPolicyContextValue = {
  open: () => void;
  close: () => void;
};

const PrivacyPolicyContext = createContext<PrivacyPolicyContextValue | null>(
  null
);

export function PrivacyPolicyProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <PrivacyPolicyContext.Provider value={value}>
      {children}
      <PrivacyPolicyModal open={isOpen} onClose={close} />
    </PrivacyPolicyContext.Provider>
  );
}

export function usePrivacyPolicy() {
  const context = useContext(PrivacyPolicyContext);
  if (!context) {
    throw new Error(
      "usePrivacyPolicy должен использоваться внутри PrivacyPolicyProvider"
    );
  }
  return context;
}
