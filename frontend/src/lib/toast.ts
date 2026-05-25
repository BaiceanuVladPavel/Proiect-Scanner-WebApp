export type ToastTone = "default" | "success" | "error";

export type ToastDetail = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

const TOAST_EVENT = "inventory:toast";

export function emitToast(detail: ToastDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail }));
}

export function subscribeToToasts(listener: (detail: ToastDetail) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<ToastDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(TOAST_EVENT, handleEvent);
  return () => window.removeEventListener(TOAST_EVENT, handleEvent);
}
