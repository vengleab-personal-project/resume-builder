import en from "@/messages/en";

type Translations = typeof en;

export const useTranslations = <N extends keyof Translations | undefined = undefined>(
  namespace?: N,
) => {
  const t = (namespace ? en[namespace] : en) as N extends keyof Translations ? Translations[N] : Translations;
  return { t };
};
