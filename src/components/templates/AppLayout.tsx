import * as React from "react";
import { Outlet } from "react-router";
import { Sidebar } from "@/components/organisms/Sidebar";
import { Header } from "@/components/organisms/Header";
import { CryptoVaultModal } from "@/components/molecules/CryptoVaultModal";
import { AuthModal } from "@/components/organisms/AuthModal";
import { useAuthStore } from "@/store/useAuthStore";

export function AppLayout() {
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const initAuth = useAuthStore((state) => state.initAuth);

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="h-screen w-full bg-[#0D131F] text-[#F8FAFC] flex font-sans overflow-hidden">
      {/* 240px Left Navigation Sidebar (Static/Fixed) */}
      <Sidebar
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 56px Top Header */}
        <Header
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Fluid Centered Content Area with 1040px max-width container from design.md */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-[1040px] mx-auto w-full">
            <Outlet
              context={{
                onOpenApiKeyModal: () => setIsApiKeyModalOpen(true),
                onOpenAuthModal: () => setIsAuthModalOpen(true),
              }}
            />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CryptoVaultModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
