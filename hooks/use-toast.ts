"use client";

import { toast as toastManager } from "@/components/ui/toast";

export function useToast() {
  return {
    toast: toastManager.add,
  };
}