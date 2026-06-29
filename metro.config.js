/**
 * Metro configuration for React Native
 * Ensures .cjs support and uses expo's default metro config.
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// add cjs to sourceExts (helps some packages like Firebase)
config.resolver = config.resolver || {};
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

module.exports = config;
