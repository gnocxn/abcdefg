Package.describe({
    name: 'me:node-request',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Npm.depends({'request' : '2.64.0'})

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.3');
    api.addFiles('node-request.js',['server']);
    api.export('_request',['server']);
});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('me:node-request');
    api.addFiles('node-request-tests.js');
});
