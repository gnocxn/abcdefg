if (Meteor.isServer) {
    Meteor.startup(function () {
        PH_shortVideos._ensureIndex({"fullId": 1});
        Ali_Products._ensureIndex({"rnd": 1});
        SyncedCron.start();
    })

    Meteor.methods({
        ph_getAdultsGif2 : function(a,z){
            try{
                check(a, Number);
                check(z, Number);
                var url_tpl = _.template('http://www.pornhub.com/gifs?page=<%=p%>');
                var urls = _.map(_.range(a,z),function(v){return url_tpl({p : v+1})});
                var rs = Async.runSync(function(DONE){
                    var x = Xray();
                    async.concat(urls,
                        function(url, cbMovies){
                            async.waterfall([
                                function(cb1){
                                    //x.delay(500, 700);
                                    x(url,['ul.gifs li > a@href'])
                                    (function (err, data) {
                                        cb1(null, data)
                                    });
                                },
                                function(links, cb2){
                                    if(links || links.length > 0){
                                        async.map(links, function(link, cb2_1){
                                            x(link, {
                                                original_link : 'link[rel="canonical"]@href',
                                                title: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@text',
                                                fullMovie: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@href',
                                                shortMovie: '#js-gifToWebm@data-mp4',
                                                gif : '#js-gifToWebm@data-gif'
                                            })(function (err, data) {
                                                cb2_1(null, data);
                                            })
                                        },function(err, movies){
                                            if(err) console.log(err);
                                            cb2(null, movies);
                                        })
                                    }else{
                                        cb2(null, []);
                                    }
                                }
                            ],function(err, movies){
                                if(err) console.log(err);
                                console.log('crawler page : ' + url + ' - get ' + movies.length + ' links');
                                cbMovies(null, movies);
                            })
                        },
                        function(err, movies){
                            if(err) console.log(err);
                            DONE(null, movies);
                        }
                    )
                });
                //return rs.result;
                var movies = rs.result;
                var cd = 0;
                if(movies.length > 0){
                    _.each(movies, function (m) {
                        var isPass = Match.test(m,{
                            title : String,
                            fullMovie : String,
                            shortMovie : String,
                            gif : String,
                            original_link : String
                        })
                        if (isPass) {
                            var fullId = getQueryString('viewkey', m.fullMovie);
                            var isExists = PH_shortVideos.findOne({fullId: fullId});
                            if (!isExists) {
                                var newDate = new Date,
                                    tags = ph_getVideoTags(fullId);
                                //console.log(fullId,tags);
                                m = _.extend(m, {fullId: fullId, tags: tags, updatedAt: newDate});
                                var i = PH_shortVideos.insert(m);
                                cd++;
                            }else{
                                var updatedAt = new Date;
                                var i = PH_shortVideos.update({_id : isExists._id},{
                                    $set : {
                                        original_link : m.original_link,
                                        shortMovie : m.shortMovie,
                                        gif : m.gif,
                                        updatedAt : updatedAt,
                                    }
                                });
                                cd++;
                            }
                        }
                        //console.log('.');
                    })
                }
                console.log('FINISHED CRAWLER...');
                return 'import success : ' + cd +'/' + movies.length + ' links';
            }catch(ex){
                console.log('ph_getAdultsGif2 : ', ex);
            }
        },
        getAdultsGif: function (startUrl, pages) {
            var startUrl = startUrl || 'http://www.pornhub.com/gifs',
                pages = pages || 1;
            console.log(startUrl, pages);
            var rs = Async.runSync(function (done) {
                var x = Xray();
                async.waterfall([
                    function (cb) {
                        x.delay(1000, 1500);
                        x(startUrl, ['ul.gifs li > a@href'])
                            .paginate('li.page_next > a@href')
                            .limit(pages)
                        (function (err, data) {
                            cb(null, data)
                        });
                    },
                    function (links, cb) {
                        console.log('GET TOTAL LINK GIF:',links.length);
                        if(links.length> 0){
                            async.map(links, function (link, cb1) {
                                //console.log('parse : ', link)
                                x(link, {
                                    original_link : 'link[rel="canonical"]@href',
                                    title: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@text',
                                    fullMovie: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@href',
                                    shortMovie: '#js-gifToWebm@data-mp4',
                                    gif : '#js-gifToWebm@data-gif'
                                })(function (err, data) {
                                    //console.log(data);
                                    cb1(null, data);
                                })
                            }, function (err, result) {
                                cb(null, result);
                            });
                        }else{
                            cb(null, [])
                        }
                    }
                ], function (err, rs) {
                    done(null, rs);
                })
            })
            var movies = rs.result;
            //throw new Meteor.Error('stop here...')
            var ab = [];
            if(movies.length > 0){
                _.each(movies, function (m) {
                    var isPass = Match.test(m,{
                        title : String,
                        fullMovie : String,
                        shortMovie : String,
                        gif : String,
                        original_link : String
                    })
                    if (isPass) {
                        var fullId = getQueryString('viewkey', m.fullMovie);
                        var isExists = PH_shortVideos.findOne({fullId: fullId});
                        if (!isExists) {
                            var newDate = new Date,
                                tags = ph_getVideoTags(fullId);
                            m = _.extend(m, {fullId: fullId, tags: tags, updatedAt: newDate});
                            var i = PH_shortVideos.insert(m);
                            ab.push(i);
                        }else{
                            var updatedAt = new Date;
                            var i = PH_shortVideos.update({_id : isExists._id},{
                                $set : {
                                    original_link : m.original_link,
                                    shortMovie : m.shortMovie,
                                    gif : m.gif,
                                    updatedAt : updatedAt,
                                }
                            });
                            ab.push(i);
                        }
                    }
                    //console.log('.');
                })
            }
            return 'import success : ' + ab.length + ' links';
        },
        tblr_postVideoFromPH: function (vId, state) {
            var clip = PH_shortVideos.findOne({_id: vId});
            if (clip) {
                //console.log(clip.fullMovie);
                var fs = Npm.require('fs');
                var ab = SimpleRequest.getSync(clip.shortMovie, {encoding: null});
                var tmp = TMP.fileSync({mode: 0644, prefix: 'ph_', postfix: '.mp4'});
                console.log('created and writing : ', tmp.name);
                fs.writeFileSync(tmp.name, ab.body);
                var title = s.capitalize(clip.title),
                    slug = s.slugify(title);
                var caption = _.template('<p>[[MORE]]</p><p><%=movieDetail%></p>');
                var iframe_Tlp = _.template('<iframe src="http://www.pornhub.com/embed/<%=fullId%>" frameborder="0" width="608" height="468" scrolling="no"></iframe>'),
                    iframe = iframe_Tlp({fullId : clip.fullId});
                var tags = _.shuffle(_.union(clip.tags, ['p0rnhunt','toys-adult']));
                var options = {
                    state: state || 'published',
                    tags: tags.join(','),
                    format: 'html',
                    title: title,
                    slug : slug,
                    data: tmp.name,
                    caption: caption({movieDetail : iframe})
                }
                var blogName = 'p0rnhunt.tumblr.com';
                var rs = Async.runSync(function (done) {
                    //console.log(options);
                    TumblrClient.video(blogName, options, function (err, data) {
                        if(err)console.log('ERROR POST VIDEO : ', err.toString());
                        console.log('SUCCESS POST VIDEO :',data);
                        done(err, data);
                    })
                })
                tmp.removeCallback();
                if(rs.result && rs.result.id){
                    var newDate = new Date;
                    var aff = Posts.upsert({fullId: clip.fullId, type: 'ph_shortVideo'}, {
                        fullId: clip.fullId,
                        tumblr_pId: rs.result.id.toString(),
                        blogName: blogName,
                        type: 'ph_shortVideo',
                        updatedAt: newDate
                    });
                    return aff;
                }

            }
            return false;
        },
        tblr_userInfo: function () {
            var rs = Async.runSync(function (done) {
                TumblrClient.userInfo(function (err, data) {
                    done(err, data);
                })
            });
            return rs.result;
        },
        tblr_followers: function (blogName, limit, offset) {
            check(blogName, String);
            var options = {
                limit: limit || 20,
                offset: offset || 0
            }
            var rs = Async.runSync(function (done) {
                TumblrClient.followers(blogName, options, function (err, data) {
                    if (err) console.log(err)
                    done(null, data);
                })
            })
            return rs.result;
        },
        tblr_following: function (limit, offset) {
            var options = {
                limit: limit || 20,
                offset: offset || 0
            }
            var rs = Async.runSync(function (done) {
                TumblrClient.following(options, function (err, data) {
                    if (err) console.log(err);
                    done(null, data);
                })
            });
            return rs.result;
        },
        tblr_findByTag: function (tag) {
            check(tag, String);
            var rs = Async.runSync(function (done) {
                TumblrClient.tagged(tag, {limit: 40}, function (err, data) {
                    if (err) console.log(err);
                    done(null, data);
                })
            });
            return rs.result;
        },
        tblr_getPosts: function (blogName) {

        },
        tblr_doFollow: function (url) {
            try {
                Meteor.sleep(2000);
                var rs = Async.runSync(function (DONE) {
                    TumblrClient.follow(url, function (err, data) {
                        //console.log(err,data);
                        if (err) {
                            console.log(err);
                            DONE(null, err);
                        } else {
                            DONE(null, data);
                        }
                    });
                });
                return rs.result;
            } catch (ex) {
                console.log(ex)
            }
        },
        tblr_updateAllInformation: function () {
            var rs = Async.runSync(function (DONE) {
                try {
                    async.waterfall([
                        Meteor.bindEnvironment(function (cbFollowing) {
                            var result = Meteor.call('tblr_userInfo');
                            if (result && result.user) {
                                var user = result.user;
                                var updatedAt = new Date();
                                UsersInfo.upsert({username: user.name}, {
                                    username: user.name,
                                    likes: user.likes,
                                    following: user.following,
                                    updatedAt: updatedAt
                                });
                                var blogsInfor = [];
                                _.each(user.blogs, function (b) {
                                    updatedAt = new Date();
                                    Blogs.upsert({username: user.name, blogName: b.name}, {
                                        username: user.name,
                                        blogName: b.name,
                                        title: b.title,
                                        url: b.url,
                                        tweet: b.tweet,
                                        followers: b.followers,
                                        primary: b.primary,
                                        updatedAt: updatedAt
                                    });

                                    blogsInfor.push({
                                        blogName: b.name + '.tumblr.com',
                                        followers: b.followers
                                    });
                                });

                                var total_Followers = (blogsInfor.length == 1) ? blogsInfor[0].followers : _.reduce(blogsInfor, function (a, b) {
                                    return a.followers + b.followers
                                });
                                cbFollowing(null, {
                                    username: user.name,
                                    following: user.following,
                                    blogsInfor: blogsInfor,
                                    msg1: 'Updated UserInfo:' + user.name + ' (following : ' + user.following + ', ' + blogsInfor.length + ' blog (s) has ' + total_Followers + ' followers), '
                                });
                            } else {
                                throw new Meteor.Error('No User Info')
                            }
                        }),
                        Meteor.bindEnvironment(function (userInfo, cbFollowers) {
                            if (userInfo && userInfo.following) {
                                var current_totalFollowing = Followings.find({username: userInfo.username}).count(),
                                    total_new = Math.abs(userInfo.following - current_totalFollowing);
                                var offsets = getOffsets(total_new, 20);
                                async.concat(offsets, function (offset, cbFollowing) {
                                    var result = Meteor.call('tblr_following', 20, offset);
                                    var blogs = (result.blogs) ? result.blogs : [];
                                    cbFollowing(null, blogs);
                                }, function (err, following) {
                                    var updatedCount = 0;
                                    _.each(following, function (f) {
                                        var isExists = Followings.findOne({name: f.name});
                                        if (!isExists) {
                                            var insertedAt = new Date();
                                            f = _.extend(f, {username: userInfo.username, insertedAt: insertedAt});
                                            Followings.insert(f);
                                            updatedCount++;
                                        }
                                    });
                                    cbFollowers(null, {
                                        msg: userInfo.msg1 + 'Inserted ' + updatedCount + ' Followings, ',
                                        blogsInfor: userInfo.blogsInfor,
                                        username: userInfo.username
                                    });
                                })
                            } else {
                                throw new Meteor.Error('No following')
                            }
                        }),
                        Meteor.bindEnvironment(function (followers, cbDone) {
                            if (followers && followers.blogsInfor) {
                                //console.log('getFollowers', followers);
                                async.concat(followers.blogsInfor, function (blog, cbBlog) {
                                    var current_totalFollowers = Followers.find({blogName: blog.blogName}).count();
                                    var total_new = Math.abs(blog.followers - current_totalFollowers);
                                    var offsets = getOffsets(total_new, 20);
                                    async.concat(offsets, function (offset, cbBlogFollowers) {
                                        var result = Meteor.call('tblr_followers', blog.blogName, 20, offset);
                                        cbBlogFollowers(null, result.users);
                                    }, function (err, users) {
                                        if (err) throw new Meteor.Error(err);
                                        var updatedCount = 0;
                                        //console.log('total followers : ', users.length);
                                        _.each(users, function (u) {
                                            var isExists = Followers.findOne({blogName: blog.blogName, name: u.name});
                                            if (!isExists) {
                                                var insertedAt = new Date();
                                                u = _.extend(u, {
                                                    username: followers.username,
                                                    blogName: blog.blogName,
                                                    insertedAt: insertedAt
                                                });
                                                Followers.insert(u);
                                                updatedCount++;
                                                //console.log('inserted follower', updatedCount);
                                            }else{
                                                var updatedAt = new Date();
                                                Followers.update({_id : isExists._id},{
                                                    following : u.following,
                                                    updatedAt : updatedAt
                                                });
                                            }
                                        });
                                        cbBlog(null, 'Blog ' + blog.blogName + ' inserted new ' + updatedCount + ' followers ;');
                                    })
                                }, function (err, msgs) {
                                    if (err) throw new Meteor.Error(err);
                                    cbDone(null, followers.msg + msgs.join(','));
                                })
                            } else {
                                throw new Meteor.Error('No followers')
                            }
                        })
                    ], Meteor.bindEnvironment(function (err, finished) {
                        if (err) throw new Meteor.Error(err);
                        console.log('tblr_updateAllInformation:', finished)
                        DONE(null, finished);
                    }))
                } catch (ex) {
                    console.log(ex)
                }

            });
            return rs.result;
        },
        tblr_autoFollowingFromFollowers: function (blogName) {
            var blogName = blogName || 'p0rnhunt.tumblr.com';
            var unFollowing = Followers.find({$and: [{blogName: blogName}, {following: false}]}, {limit: 50}).fetch();
            if (unFollowing.length > 0) {
                var rs = Async.runSync(function (done) {
                    async.concat(unFollowing,
                        Meteor.bindEnvironment(function (f, cbSuccess) {
                            var res = Meteor.call('tblr_doFollow', f.url);
                            //console.log(res);
                            if(res){
                                var updatedAt = new Date();
                                Followers.update({_id : f._id},{
                                    $set : {
                                        following : true,
                                        updatedAt : updatedAt
                                    }
                                });
                                cbSuccess(null, 1);
                            }
                        }), Meteor.bindEnvironment(function (err, result) {
                            if (err) console.log(err);
                            var totalUpdated = _.reduce(result, function (a, b) {
                                    return a + b
                                }) || 0;
                            var msg = 'Now following ' + totalUpdated + ' from followers.';
                            console.log('tblr_autoFollowingFromFollowers:',msg);
                            done(null, msg);
                        }))
                });
                return rs.result;
            } else {
                return 'No un-following from followers!'
            }
        },
        ali_importBestSellingProducts: function (spreadsheetId, gridId, isDeleteOlder) {
            var isDeleteOlder = isDeleteOlder || false;
            if (isDeleteOlder) {
                Ali_Products.remove({source: 'feed_bestselling'});
            }
            var url = _.template('https://spreadsheets.google.com/feeds/list/<%=spreadsheetId%>/<%=gridId%>/public/values?alt=json');
            var options = {
                headers: {
                    "Content-Type": "application/json"
                }
            }
            var ab = SimpleRequest.getSync(url({spreadsheetId: spreadsheetId, gridId: gridId}), options);
            var data = JSON.parse(ab.body);
            var importedCount = 0;
            _.each(data.feed.entry, function (e) {
                var product = {
                    name: e.gsx$productname.$t,
                    price: e.gsx$price.$t,
                    category: e.gsx$categoryname.$t,
                    productImage: e.gsx$productimageurl.$t,
                    productUrl: e.gsx$producturl.$t,
                    qualitySoldInThePast30Days: parseInt(e.gsx$quantitysoldinthepast30days.$t),
                    commissionRate: e.gsx$commissionrate.$t,
                    outOfStockDate: new Date(e.gsx$outofstockdate.$t),
                    discount: e.gsx$discount.$t,
                    clickUrl: e.gsx$clickurl.$t,
                    rnd: Math.random(),
                    source: 'feed_bestselling',
                    spreadsheetId: spreadsheetId,
                    gridId: gridId,
                    updatedAt: new Date()
                }
                Ali_Products.insert(product);
                importedCount++;
            });
            return 'Imported Success : ' + importedCount;
        },
        ali_getRandomBestSellingProducts: function (limit) {
            var limit = limit || 20;
            check(limit, Number);
            var query = {
                source: 'feed_bestselling',
                rnd: {
                    $gte: Math.random()
                }
            }
            var products = Ali_Products.find(query, {limit: limit}).fetch();
            return products;
        },
        cron_40minutesUploadAShortVideo: function (blogName, type) {
            var blogName = blogName || 'p0rnhunt.tumblr.com';
            var type = type || 'ph_shortVideo';
            var tblr_posts = Posts.find({blogName: blogName, type: type}).fetch(),
                alreadyUploadedVideoIds = _.map(tblr_posts, function (p) {
                    return p.fullId;
                });
            //console.log(alreadyUploadedVideoIds);
            var nextVideo = PH_shortVideos.findOne({fullId: {$nin: alreadyUploadedVideoIds}});
            var aff = false;
            if (nextVideo) {
                aff = Meteor.call('tblr_postVideoFromPH', nextVideo._id);
            }
            return aff;
        }
    });

    var getQueryString = function (field, url) {
        var href = url || window.location.href;
        var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
        var string = reg.exec(href);
        return string ? string[1] : null;
    };

    var ph_getVideoTags = function (vId) {
        try{
            var url = 'http://www.pornhub.com/webmasters/video_by_id?id=' + vId + '&thumbsize=medium';
            var ab = SimpleRequest.getSync(url);

            if(ab.body){
                var rs = JSON.parse(ab.body).video;
                //console.log(rs);
                //throw new Meteor.Error('111')
                var tags = _.map(rs.tags, function (t) {
                    return t.tag_name.toLowerCase();
                });

                var stars = _.map(rs.pornstars, function (p) {
                    return p.pornstar_name;
                });

                return _.union(tags, stars);
            }
            return [];
        }catch(ex){
            console.log(vId, ex);
        }
    }

    var getOffsets = function (total, limit) {
        var oo = [];
        var count = Math.floor(total / limit);
        for (var i = 0; i <= count; i++) {
            oo.push(i * limit)
        }
        return oo;
    }

    SyncedCron.add({
        name: 'Every 15 minutes upload a short video to Tumblr',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('every 15 mins');
        },
        job: function () {
            var aff = Meteor.call('cron_40minutesUploadAShortVideo');
            return aff;
        }
    });

    SyncedCron.add({
        name: 'Every 2 hours update all information',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('every 2 hours');
        },
        job: function () {
            var aff = Meteor.call('tblr_updateAllInformation');
            return aff;
        }
    });
}