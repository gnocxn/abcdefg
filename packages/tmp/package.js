Package.describe({
    name: 'me:tmp',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: 'Temporary file and directory creator - v0.0.27',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/raszi/node-tmp',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Npm.depends({"tmp" : "0.0.27"});

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.3');
    api.addFiles('tmp.js',['server']);
    api.export('TMP',['server']);
});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('me:tmp');
    api.addFiles('tmp-tests.js');
});
