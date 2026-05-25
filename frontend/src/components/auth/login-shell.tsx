"use client";

import { AxiosError } from "axios";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { login } from "@/services/auth";

function normalizeError(error: unknown) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data;
    if (detail && typeof detail === "object" && "detail" in detail) {
      return typeof detail.detail === "string" ? detail.detail : "Login failed.";
    }

    if (detail && typeof detail === "object") {
      const first = Object.values(detail)[0];
      if (typeof first === "string") {
        return first;
      }
      if (Array.isArray(first) && typeof first[0] === "string") {
        return first[0];
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Login failed.";
}

export function LoginShell() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("Sign in to continue.");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("Signing in...");

    try {
      await login(username, password);
      router.replace("/scan");
      router.refresh();
    } catch (error) {
      setMessage(normalizeError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="dark min-h-screen bg-[#020617] text-white">
      <section className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] px-4 py-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_30px_120px_-40px_rgba(14,165,233,0.45)] backdrop-blur-md">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/75">
                Secure Access
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Inventory login
              </h1>
            </div>
            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
              <ShieldCheck className="size-6" />
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Username</span>
              <input
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-base text-white outline-none placeholder:text-slate-500"
                placeholder="worker"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-14 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-base text-white outline-none placeholder:text-slate-500"
                placeholder="Password"
                required
              />
            </label>

            <Button
              type="submit"
              className="h-14 w-full rounded-[22px] bg-cyan-400 text-base font-semibold text-slate-950 hover:bg-cyan-300"
              disabled={pending}
            >
              {pending ? <LoaderCircle className="size-5 animate-spin" /> : <KeyRound className="size-5" />}
              {pending ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-4 text-sm leading-6 text-slate-300">{message}</p>
        </div>
      </section>
    </main>
  );
}
