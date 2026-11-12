import { useOutletContext } from "react-router";
import { GlossaryManager } from "@/components/organisms/GlossaryManager";

interface ContextType {
  onOpenAuthModal: () => void;
}

export function GlossaryPage() {
  const { onOpenAuthModal } = useOutletContext<ContextType>();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <GlossaryManager onOpenAuthModal={onOpenAuthModal} />
    </div>
  );
}
