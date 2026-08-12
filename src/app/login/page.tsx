import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sibol-green px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-bigas-cream p-6 shadow-xl sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={56} showWordmark={false} />
          <div>
            <h1 className="font-extrabold text-xl text-sibol-green">SAGANANI.PH</h1>
            <p className="font-tagline italic text-sm text-lupang-sunog">
              Sagana sa Bahay, Sagana sa Buhay
            </p>
          </div>
          <p className="text-sm font-bold text-sibol-green/70">Business Hub Login</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
