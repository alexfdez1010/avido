import Constants from 'expo-constants';

// Missing or unknown build metadata must not enable the external catalogue.
export const DISCOVER_ENABLED = Constants.expoConfig?.extra?.distribution === 'direct';
