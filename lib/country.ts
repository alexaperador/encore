import AsyncStorage from "@react-native-async-storage/async-storage";

export type CountryCode =
    | "ES"
    | "US"
    | "GB"
    | "MX"
    | "AR"
    | "CO"
    | "CL"
    | "FR"
    | "DE"
    | "IT"
    | "PT";

export const COUNTRIES: Array<{ code: CountryCode; nameKey: string }> = [
    { code: "ES", nameKey: "settings.spain" },
    { code: "US", nameKey: "settings.unitedStates" },
    { code: "GB", nameKey: "settings.unitedKingdom" },
    { code: "MX", nameKey: "settings.mexico" },
    { code: "AR", nameKey: "settings.argentina" },
    { code: "CO", nameKey: "settings.colombia" },
    { code: "CL", nameKey: "settings.chile" },
    { code: "FR", nameKey: "settings.france" },
    { code: "DE", nameKey: "settings.germany" },
    { code: "IT", nameKey: "settings.italy" },
    { code: "PT", nameKey: "settings.portugal" },
];

const COUNTRY_KEY = "@encore/country";
const countryCodes = new Set<CountryCode>(COUNTRIES.map(({ code }) => code));
const countryListeners = new Set<() => void>();

export function subscribeToCountry(listener: () => void): () => void {
    countryListeners.add(listener);
    return () => countryListeners.delete(listener);
}

export function setCountry(country: CountryCode): void {
    void AsyncStorage.setItem(COUNTRY_KEY, country);
    countryListeners.forEach((listener) => listener());
}

export async function getStoredCountry(): Promise<CountryCode> {
    const storedCountry = await AsyncStorage.getItem(COUNTRY_KEY);

    return storedCountry && countryCodes.has(storedCountry as CountryCode)
        ? (storedCountry as CountryCode)
        : "ES";
}
