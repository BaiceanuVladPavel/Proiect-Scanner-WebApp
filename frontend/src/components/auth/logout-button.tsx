"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="h-11 rounded-2xl border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10"
      disabled={pending}
      onClick={() => void handleLogout()}
    >
      <LogOut className="size-4" />
      {pending ? "Leaving..." : "Logout"}
    </Button>
  );
}
