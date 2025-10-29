import '@testing-library/jest-dom'; // add this import to make toBeInTheDocument work
import { vi } from 'vitest';

// tests/test-i18n-setup.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal resources; keys render as-is if not found.
await i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  lng: 'en',
  react: {
    // Prevent adding tReady/t to DOM by internal HOCs
    useSuspense: false,
  },
  resources: {
    en: { translation: {} },
  },
});

export { i18n };
