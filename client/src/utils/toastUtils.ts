import { toast } from "sonner";

export async function withToast<T>(fn: () => Promise<T>, messages: { success: string; error: string }): Promise<T | undefined> {
  try {
    const result = await fn();
    toast.success(messages.success);
    return result;
  } catch (e) {
    toast.error(messages.error);
    return undefined;
  }
}
