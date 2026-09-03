import en from "@/shared/messages/en";
import km from "@/shared/messages/km";
import { useLocaleStore } from "@/client/store/locale-store";
import type { SupportedLocale } from "@/shared/types";

export type Translations = typeof en;

const dictionaries: Record<SupportedLocale, Translations> = {
  en,
  km,
};

export const useTranslations = <N extends keyof Translations | undefined = undefined>(
  namespace?: N,
) => {
  const { locale, setLocale } = useLocaleStore();
  const dict = dictionaries[locale] || dictionaries.en;
  const t = (namespace ? dict[namespace] : dict) as N extends keyof Translations ? Translations[N] : Translations;

  return { 
    t,
    locale,
    setLocale,
  };
};
