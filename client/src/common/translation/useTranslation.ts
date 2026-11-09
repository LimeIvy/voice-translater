import { useMutation } from "@tanstack/react-query";
import { translateText } from "./translationApi";
export function useTranslation() {
  return useMutation({ mutationFn: translateText, retry: false });
}
