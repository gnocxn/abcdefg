Package.describe({
    name: 'gnocxn:osmosis',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: 'HTML/XML parser and web scraper for NodeJS.',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Npm.depends({"osmosis" : "0.1.0"});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use('ecmascript');
    api.addFiles('osmosis.js','server');
});

Package.onTest(function (api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.use('gnocxn:osmosis');
    api.addFiles('osmosis-tests.js');
    api.export('osmosis','server');
});
