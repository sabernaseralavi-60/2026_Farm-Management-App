/** Minimal imperative toast API — call `toast.error("...")` etc. from
 * anywhere (no hook/context needed at the call site). <Toaster/> (mounted
 * once in the root layout) subscribes and renders the stack. Replaces the
 * native `alert()` popups that used to interrupt every form validation. */

export type ToastKind = "info" | "success" | "error";

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

type Listener = (msg: ToastMessage) => void;

let seq = 0;
const listeners = new Set<Listener>();

function emit(kind: ToastKind, text: string) {
  const msg: ToastMessage = { id: ++seq, kind, text };
  listeners.forEach((l) => l(msg));
}

export const toast = {
  info: (text: string) => emit("info", text),
  success: (text: string) => emit("success", text),
  error: (text: string) => emit("error", text),
};

/** Used only by <Toaster/>. */
export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
