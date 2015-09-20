Package.describe({
    name: 'me:simple-http-request',
    version: '2.62.0',
    // Brief, one-line summary of the package.
    summary: 'Simple HTTP Request',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Npm.depends({
    "fibers":"1.0.4",
    "request":"2.62.0"
});

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.3');
    api.use('underscore',['server']);
    api.addFiles('http-request.js',['server']);
    api.export('SimpleRequest',['server']);
});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('me:http-request');
    api.addFiles('http-request-tests.js');
});
