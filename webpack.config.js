var Encore = require('@symfony/webpack-encore');

Encore
    .setOutputPath('public/app')
    .setPublicPath('/app')
    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())
    .enableVueLoader()
    .enableVersioning(Encore.isProduction())
    .addEntry('app', './web/main.js')
    .enableSassLoader()
    .disableSingleRuntimeChunk()

module.exports = Encore.getWebpackConfig();
