import en from "@/shared/messages/en";
import km from "@/shared/messages/km";
import { useLocaleStore } from "@/client/store/locale-store";
import type { SupportedLocale } from "@/shared/types";

export type Translations = typeof en;

const dictionaries: Record<SupportedLocale, Translations> = {
  en,
  km,
};

/**
 * A dictionary for a fixed locale, regardless of the UI's. For text that belongs to a
 * document rather than to the viewer - a shared CV's section headings follow the
 * language the owner wrote it in.
 */
export const getDictionary = (locale: SupportedLocale): Translations =>
  dictionaries[locale] || dictionaries.en;

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
