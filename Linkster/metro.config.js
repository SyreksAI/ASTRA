// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const resolveFrom = require("resolve-from");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith("event-target-shim") &&
    context.originModulePath.includes("react-native-webrtc")
  ) {
    const eventTargetShimPath = resolveFrom(
      context.originModulePath,
      moduleName
    );
    return {
      filePath: eventTargetShimPath,
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;