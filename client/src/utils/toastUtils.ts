import { toast } from "sonner";

export async function withToast<T>(
  fn: () => Promise<T>,
  messages: {
    success: string;
    error: string | ((err: any) => string);
  }
): Promise<T | undefined> {
  try {
    const result = await fn();
    toast.success(messages.success);
    return result;
  } catch (e) {
    const errorMsg = typeof messages.error === 'function' ? messages.error(e) : messages.error;
    toast.error(errorMsg);
    return undefined;
  }
}
