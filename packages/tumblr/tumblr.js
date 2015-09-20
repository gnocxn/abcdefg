if (Meteor.isServer) {
    var tumblr = Npm.require('tumblr.js');
    TumblrClient = null;
    if (Meteor.settings.private && Meteor.settings.private.Tumblr) {
        var _tumblr = Meteor.settings.private.Tumblr,
            isPass = Match.test(_tumblr, {
                consumer_key: String,
                consumer_secret: String,
                token: String,
                token_secret: String,
                blog: String
            });
        if (isPass) {
            TumblrClient = new tumblr.Client({
                consumer_key : _tumblr.consumer_key,
                consumer_secret : _tumblr.consumer_secret,
                token : _tumblr.token,
                token_secret : _tumblr.token_secret
            })
        }
    }
}