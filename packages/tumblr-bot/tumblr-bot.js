// Write your package code here!
if (Meteor.isServer) {
    TumblrBot = function () {
        this.settings = null;
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
                this.settings = _tumblr;
            }
        }
    }

    TumblrBot.prototype.userInfo = function () {
        if (TumblrClient === null) return;
        try {
            var url = 'https://api.tumblr.com/v2/blog/' + this.settings.blog + '/info?api_key=' + this.settings.consumer_key;
            var rs = Async.runSync(function (done) {
                /*HTTP.get(url,function(err, res){
                 if(err) throw new Meteor.Error(err);
                 done(null, res.data.response);
                 })*/
                TumblrClient.userInfo(function (err, data) {
                    done(null, data);
                })
            });
            return rs.result;
        } catch (ex) {
            console.log(ex);
        }
    }

    TumblrBot.prototype.photo = function (photoUrl) {
        var blogName = this.settings.blog,
            oauth = _.omit(this.settings, 'blog'),
            myurl = "http://api.tumblr.com/v2/blog/" + blogName + "/post",
            myForm = {
                type: 'photo',
                caption: 'Test Image Post',
                source: photoUrl
            },
            options = {
                followRedirect: false,
                json: false,
                oauth: oauth,
                timeout: 20000,
                form: myForm
            }
        try {
            var ab = SimpleRequest.postSync(myurl, options);
            return ab.response.body;
        } catch (ex) {
            console.log(ex);
        }
    }

    TumblrBot.prototype.video = function (url) {
/*        var ab = SimpleRequest.getSync(url, {encoding: 'binary'});
        var fs = Npm.require('fs');
        fs.writeFile('aaa.mp4', ab.body, 'binary', function (err) {
            if (err) console.log(err);
        })*/
        var fs = Npm.require('fs');
        var path = Npm.require('path');
        var data = fs.createReadStream(path.join(path.resolve('.'), 'aaa.mp4'));
        var blogName = this.settings.blog,
            oauth = _.omit(this.settings, 'blog'),
            myurl = "http://api.tumblr.com/v2/blog/" + blogName + "/post",
            myForm = {
                type: 'video',
                caption: 'Test Video Post',
                data: data
            },
            options = {
                followRedirect: false,
                json: false,
                oauth: oauth,
                timeout: 20000,
                form: myForm,
                "Content-Type" : 'multipart/form-data',
                "" : ''
            }
        console.log(myurl)
        try {
            var ab = SimpleRequest.postSync(myurl, options);
            return ab.body;
        } catch (ex) {
            console.log(ex);
        }
        /*var ab = SimpleRequest.getSync(url, {encoding : 'binary'});
         var fs = Npm.require('fs');
         fs.writeFile('aaa.mp4', ab.body, 'binary', function(err){
         if(err) console.log(err);
         })*/
    }
}

