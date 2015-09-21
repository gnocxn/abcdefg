if (Meteor.isServer) {
    Meteor.methods({
        getAdultsGif: function (startUrl, pages) {
            var startUrl = startUrl || 'http://www.pornhub.com/gifs',
                pages = pages || 1;
            console.log(startUrl, pages);
            var rs = Async.runSync(function (done) {
                var x = Xray();
                async.waterfall([
                    function (cb) {
                        x.delay(1000, 2000);
                        x(startUrl, ['ul.gifs li > a@href'])
                            .paginate('li.page_next > a@href')
                            .limit(pages)
                        (function (err, data) {
                            cb(null, data)
                        });
                    },
                    function (links, cb) {
                        async.map(links, function (link, cb1) {
                            x(link, {
                                title: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@text',
                                fullMovie: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@href',
                                shortMovie: '#js-gifToWebm@data-mp4'
                            })(function (err, data) {
                                cb1(null, data);
                            })
                        }, function (err, result) {
                            cb(null, result);
                        });
                    }
                ], function (err, rs) {
                    done(null, rs);
                })
            })
            var movies = rs.result;
            var ab = [];
            _.each(movies, function (m) {
                if (m) {
                    var fullId = getQueryString('viewkey', m.fullMovie),
                        shortId = m.shortMovie.substr(m.shortMovie.lastIndexOf('/') + 1);
                    var isExists = PH_shortVideos.findOne({fullId: fullId});
                    if (!isExists) {
                        var newDate = new Date,
                            tags = ph_getVideoTags(fullId);
                        m = _.extend(m, {fullId: fullId, shortId: shortId, tags: tags, updatedAt: newDate});
                        var i = PH_shortVideos.insert(m);
                        console.log(i);
                        ab.push(i);
                    }
                }
            })
            return 'import success : ' + ab.length + ' links';
        },
        tblr_postVideoFromPH : function(vId, state){
            var clip = PH_shortVideos.findOne({_id : vId});
            if(clip){
                var fs = Npm.require('fs');
                var ab = SimpleRequest.getSync(clip.shortMovie,{encoding : null});
                var tmp = TMP.fileSync({ mode: 0644, prefix: 'ph_', postfix: '.mp4' });
                console.log('created and writing : ',tmp.name);
                fs.writeFileSync(tmp.name, ab.body);
                var caption = _.template('<p>Hey,see more <a target="_blank" href="http://p0rnhunt.tumblr.com/full?viewkey=<%=fullId%>"><%=title%></a><br/>(via <a target="_blank" href="http://pornhunt.xyz">pornhunt.xyz</a>)</p>');
                var tags = _.union(clip.tags,['pornhunt.xyz']);
                var options = {
                    state : state || 'published',
                    tags : tags.join(','),
                    format : 'html',
                    data : tmp.name,
                    caption : caption({title : clip.title,fullId : clip.fullId})
                }
                var blogName = 'p0rnhunt.tumblr.com';
                var rs = Async.runSync(function(done){
                    TumblrClient.video(blogName, options, function(err, data){
                        done(err, data);
                    })
                })
                tmp.removeCallback();
                var newDate = new Date;
                var aff = Posts.upsert({fullId : clip.fullId, type : 'ph_shortVideo'},{
                    fullId : clip.fullId,
                    tumblr_pId : rs.result.id.toString(),
                    blogName : blogName,
                    type : 'ph_shortVideo',
                    updatedAt : newDate
                });
                return aff;
            }
            return false;
        },
        tblr_userInfo : function(){
            var rs = Async.runSync(function(done){
                TumblrClient.userInfo(function(err, data){
                    done(err, data);
                })
            });
            return rs.result;
        },
        tblr_followers : function(blogName){
            var rs = Async.runSync(function(done){
                TumblrClient.followers(blogName, function(err, data){
                    if(err) console.log(err)
                    done(null, data);
                })
            })
            return rs.result;
        },
        tblr_following : function(limit, offset){
            var options = {
                limit : limit || 20,
                offset : offset || 0
            }
            var rs = Async.runSync(function(done){
                TumblrClient.following(options,function(err, data){
                    if(err) console.log(err);
                    done(null, data);
                })
            });
            return rs.result;
        },
        tblr_getPosts : function(blogName){

        }
    });

    var getQueryString = function (field, url) {
        var href = url || window.location.href;
        var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
        var string = reg.exec(href);
        return string ? string[1] : null;
    };

    var ph_getVideoTags = function (vId) {
        var url = 'http://www.pornhub.com/webmasters/video_by_id?id=' + vId + '&thumbsize=medium';
        var ab = SimpleRequest.getSync(url);
        var rs = EJSON.parse(ab.body).video;
        var tags = _.map(rs.tags, function (t) {
            return t.tag_name.toLowerCase();
        });

        var stars = _.map(rs.pornstars, function (p) {
            return p.pornstar_name;
        });

        return _.union(tags, stars);
    }
}