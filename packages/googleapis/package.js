Package.describe({
    name: 'gnocxn:googleapis',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: 'Google\'s officially supported Node.js client library for accessing Google APIs, it comes with OAuth 2.0 support. - 2.1.6',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Npm.depends({'googleapis' : '2.1.6'});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use('ecmascript');
    api.addFiles('googleapis.js',['server']);
    api.export('google');
});

Package.onTest(function (api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.use('gnocxn:googleapis');
    api.addFiles('googleapis-tests.js');
});
