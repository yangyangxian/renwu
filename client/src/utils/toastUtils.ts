import { toast } from "sonner";

export async function withToast<T>(
  fn: () => Promise<T>,
  messages: {
    success: string;
    error: string | ((err: Error) => string);
  }
): Promise<T | undefined> {
  try {
    const result = await fn();
    toast.success(messages.success);
    return result;
  } catch (e: unknown) {
    const errorMsg = typeof messages.error === 'function' ? messages.error(e as Error) : messages.error;
    toast.error(errorMsg);
    return undefined;
  }
}
