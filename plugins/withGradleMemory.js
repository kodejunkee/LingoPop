const { AndroidConfig, withGradleProperties } = require('expo/config-plugins');

/**
 * Limits Gradle & CMake parallelism on cloud build workers so multiple C++ NDK
 * builds (Skia, Worklets, Nitro, SQLite) do not trigger Linux OOM daemon kills.
 */
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      modConfig.modResults,
      'org.gradle.jvmargs',
      '-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8'
    );
    modConfig.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      modConfig.modResults,
      'org.gradle.parallel',
      'false'
    );
    modConfig.modResults = AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      modConfig.modResults,
      'org.gradle.workers.max',
      '2'
    );
    return modConfig;
  });
};
