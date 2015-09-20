Package.describe({
    name: 'me:tumblr-bot',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.3');
    api.use(['http','me:simple-http-request','meteorhacks:async','underscore','momentjs:moment','check','me:tumblr'],['server']);
    api.addFiles('tumblr-bot.js',['server']);
    api.export('TumblrBot',['server']);
});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('me:tumblr-bot',['server']);
    api.addFiles('tumblr-bot-tests.js',['server']);
});
