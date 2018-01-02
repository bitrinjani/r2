import * as i18next from 'i18next';
import { en, ja } from './stringResources';
import { getConfigRoot } from './configUtil';

i18next.init({
  lng: getConfigRoot().language,
  fallbackLng: 'en',
  resources: {
    en: {
      translation: en
    },
    ja: {
      translation: ja
    }
  }
});

export default function translateTaggedTemplate(strings: TemplateStringsArray, ...keys: string[]): string {
  return i18next.t(strings.raw[0]);
}
