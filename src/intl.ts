import * as i18next from 'i18next';
import { en, ja } from './stringResources';

const config = require('./config.json');

i18next.init({
  lng: config.language,
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

export default i18next;
