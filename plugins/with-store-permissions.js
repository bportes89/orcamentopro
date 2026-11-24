const { AndroidConfig } = require("@expo/config-plugins");

module.exports = function withStorePermissions(config) {
  return AndroidConfig.Permissions.withBlockedPermissions(config, [
    "android.permission.RECORD_AUDIO",
    "android.permission.VIBRATE",
  ]);
};
