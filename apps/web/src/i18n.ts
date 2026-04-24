import { getRequestConfig } from 'next-intl/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@tennisillo/shared-types';
import type { LocaleCode } from '@tennisillo/shared-types';

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = (
    SUPPORTED_LOCALES.includes(locale as LocaleCode) ? locale : DEFAULT_LOCALE
  ) as LocaleCode;

  return {
    locale: resolvedLocale,
    messages: (
      (await import(`../messages/${resolvedLocale}.json`)) as { default: Record<string, unknown> }
    ).default,
  };
});
