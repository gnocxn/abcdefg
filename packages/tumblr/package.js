Package.describe({
    name: 'me:tumblr',
    version: '0.0.2',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Npm.depends({"tumblr.js" : '0.0.5'});


Package.onUse(function (api) {
    api.versionsFrom('1.1.0.3');
    api.use('check',['server']);
    api.addFiles('tumblr.js', ['server']);
    api.export('TumblrClient',['server']);
});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('me:tumblr');
    api.addFiles('tumblr-tests.js');
});
