import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '../locales/en.json';
import es from '../locales/es.json';

export type Language = 'en' | 'es';

const LANGUAGE_KEY = '@encore/language';

const translations = { en, es };

export const i18n = new I18n(translations);

i18n.locale = getLocales()[0]?.languageCode ?? 'es';

i18n.enableFallback = true;

const languageListeners = new Set<() => void>();

export function subscribeToLanguage(listener: () => void): () => void {
    languageListeners.add(listener);
    return () => languageListeners.delete(listener);
}

export function setLanguage(language: Language): void {
    i18n.locale = language;
    void saveLanguage(language);
    languageListeners.forEach((listener) => listener());
}

export async function getStoredLanguage(): Promise<Language | null> {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    return storedLanguage === 'en' || storedLanguage === 'es'
        ? storedLanguage
        : null;
}

export function saveLanguage(language: Language): Promise<void> {
    return AsyncStorage.setItem(LANGUAGE_KEY, language);
}