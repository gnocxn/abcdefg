Package.describe({
    name: 'me:tumblr-client',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Npm.depends({
    "request" : "2.64.0",
    "querystring" : "0.2.0"
})

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.3');
    api.addFiles(['tumblr.js','tumblr-client.js'],['server']);
    api.export('_TumblrClient',['server']);
});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('me:tumblr-client');
    api.addFiles('tumblr-client-tests.js');
});
