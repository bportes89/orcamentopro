const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withRevenueCatAndroid(config) {
  return withAndroidManifest(config, (config) => {
    const activities = config.modResults.manifest.application?.[0]?.activity ?? [];

    for (const activity of activities) {
      const nome = activity.$?.["android:name"] ?? "";

      if (nome.includes("MainActivity")) {
        activity.$["android:launchMode"] = "singleTop";
      }
    }

    return config;
  });
};
