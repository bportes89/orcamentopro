const { withMainActivity } = require("@expo/config-plugins");

const PACKAGE_IMPORT =
  "import com.margelo.nitro.nitrohtmlpdf.NitroHtmlPdf";
const INITIALIZATION = "NitroHtmlPdf.appContext = applicationContext";
const DELEGATE_IMPORT = "import expo.modules.ReactActivityDelegateWrapper";

module.exports = function withNitroHtmlPdf(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language !== "kt") {
      throw new Error("withNitroHtmlPdf exige MainActivity em Kotlin.");
    }

    let contents = config.modResults.contents;

    if (!contents.includes(PACKAGE_IMPORT)) {
      if (!contents.includes(DELEGATE_IMPORT)) {
        throw new Error(
          "MainActivity exige import expo.modules.ReactActivityDelegateWrapper.",
        );
      }

      contents = contents.replace(
        DELEGATE_IMPORT,
        `${PACKAGE_IMPORT}\n${DELEGATE_IMPORT}`,
      );
    }

    if (!contents.includes(INITIALIZATION)) {
      const anchor = /super\.onCreate\([^)]*\)/;

      if (!anchor.test(contents)) {
        throw new Error("MainActivity exige chamada super.onCreate.");
      }

      contents = contents.replace(
        anchor,
        (match) => `${match}\n    ${INITIALIZATION}`,
      );
    }

    config.modResults.contents = contents;

    return config;
  });
};
