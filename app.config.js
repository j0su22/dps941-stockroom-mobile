require('@expo/env').load(process.cwd());
module.exports = ({ config }) => ({
  ...config,
  android: { ...config.android, ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}) },
  ios: { ...config.ios, ...(process.env.GOOGLE_SERVICE_INFO_PLIST ? { googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST } : {}) },
  plugins: [...config.plugins, ...(process.env.GOOGLE_IOS_URL_SCHEME ? [['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME }]] : ['@react-native-google-signin/google-signin'])],
});
