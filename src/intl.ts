import * as i18next from 'i18next';
import { en, ja } from './stringResources';

let lng = 'en';
try { 
  lng = require('./config.json').language; 
} catch (err) { /* For unit tests */}

i18next.init({
  lng,
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
