if (Meteor.isServer) {

    myJobs.allow({
        // Grant full permission to any authenticated user
        admin: function (userId, method, params) {
            return true;
        }
    });

    Meteor.startup(function () {
        PH_shortVideos._ensureIndex({"fullId": 1});
        PH_shortVideos._ensureIndex({"rnd": 1});
        LP_shortVideos._ensureIndex({"rnd": 1});
        Ali_Products._ensureIndex({"rnd": 1});

        PORNHUBGIFS._ensureIndex({"rnd" : 1});
        PORNHUBMOVIES._ensureIndex({"rnd" : 1});
        SyncedCron.start();

        return myJobs.startJobServer();
    });

    Meteor.methods({
        jobs_updateComments: function () {

        },
        ph_testVideoError: function (vId, state) {
            var clip = PH_shortVideos.findOne({_id: vId});
            if (clip) {
                var fs = Npm.require('fs');
                var path = Npm.require('path');
                var filename = path.join(path.resolve('.'), Random.id(5) + '.mp4');
                var rs = Async.runSync(function (done) {
                    var writeStream = fs.createWriteStream(filename);
                    writeStream.on('close', function () {
                        console.log('++ SAVED FILE : ', filename);
                        done(null, true);
                    });
                    _request(clip.shortMovie, {encoding: null})
                        .on('response', function (response) {
                            console.log(response.statusCode) // 200
                            console.log(response.headers) // 'image/png'
                        })
                        .pipe(writeStream);
                });
                if (rs.result && rs.result === true) {
                    var title = s.capitalize(clip.title),
                        slug = s.slugify(title);
                    var caption = _.template('<%=title%>');
                    var iframe_Tlp = _.template('<iframe src="http://www.pornhub.com/embed/<%=fullId%>" frameborder="0" width="608" height="468" scrolling="no"></iframe>'),
                        iframe = iframe_Tlp({fullId: clip.fullId});
                    var tags = _.shuffle(_.union(clip.tags, ['p0rnhunt', 'hentaipdf']));
                    /*var _landingPage = '';
                    if (Meteor.settings.public && Meteor.settings.public.LandingPages) {
                        var landingPages = Meteor.settings.public.LandingPages;
                        var lp = landingPages[Math.floor(Math.random() * landingPages.length)];
                        var lp_tpl = _.template('<p><a class="landing-link" href="<%=value%>" target="<%=target%>"><%=name%></a></p>');
                        var targets = ['_blank','_top','_parent','_self'],
                            target = targets[Math.floor(Math.random() * targets.length)];
                        if (Match.test(lp, {name: String, value: String})) {
                            _landingPage = lp_tpl({
                                name: lp.name,
                                target : target,
                                value: lp.value
                            });
                        }
                    }*/
                    var options = {
                        state: state || 'published',
                        tags: tags.join(','),
                        format: 'html',
                        title: title,
                        slug: slug,
                        data: filename,
                        caption: caption({
                            title: (title.length > 10) ? '<p>' + title + '</p>' : ''
                            //landingPage: _landingPage
                           // movieDetail: iframe
                        })
                    }
                    var blogName = 'p0rnhunt.tumblr.com';
                    rs = Async.runSync(function (done) {
                        console.log('Upload Options : ', options);
                        TumblrClient.video(blogName, options, function (err, data) {
                            if (err) {
                                console.log(clip.shortMovie, 'ERROR POST VIDEO : ' + err.toString());
                                done(err, null);
                            }
                            ;
                            if (data) {
                                console.log('SUCCESS POST VIDEO : ', data);
                                done(err, data);
                            }
                        })
                    })
                    fs.unlinkSync(filename);
                    if (rs.error) {
                        PH_shortVideos.update({_id: clip._id}, {
                            $set: {
                                hasError: true
                            }
                        });
                        return 'Clip not contain any data...check shortMovie.mp4'
                    }
                    if (rs.result && rs.result.id) {
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
                } else {
                    fs.unlinkSync(filename);
                    return [false, clip.shortMovie]
                }

                //return [rs.result.id, clip.shortMovie, filename];
                /*var result = request.getSync(video.shortMovie, {
                 encoding: null
                 });
                 var fs = Npm.require('fs');
                 var path = Npm.require('path');
                 var filename = path.join(path.resolve('.'),Random.id(5)+'.mp4');
                 console.log('created and writing : ', filename);
                 var rs = Async.runSync(function(done){
                 fs.writeFile(filename, result.body, function (err) {
                 if (err) throw err;
                 console.log('It\'s saved!');
                 done(null,true);
                 });
                 });

                 return rs.result;*/
            }
        },
        ph_getComments: function (vId) {
            var video = PH_shortVideos.findOne({_id: vId});
            if (video) {
                var rs = Async.runSync(function (DONE) {
                    var x = Xray();
                    x(video.fullMovie, ['div.commentMessage@text'])
                    (function (err, data) {
                        if (err) {
                            console.log('ph_getComments : ', err);
                            DONE(err, []);
                        } else {
                            DONE(null, data);
                        }
                    })
                });
                if (rs.result && rs.result.length > 0) {
                    var data = _.without(rs.result, rs.result.splice(-1, 1));
                    var comments = []
                    _.each(data, function (c) {
                        c = s.strLeftBack(c, ' ');
                        c = s.humanize(c);
                        if (c.length > 10) comments.push(c + '...');
                    });
                    var updatedAt = new Date;
                    return PH_shortVideos.update({_id: video._id}, {
                        $set: {
                            comments: comments,
                            updatedAt: updatedAt
                        }
                    })
                }
            } else {
                return []
            }
        },
        ph_updateOriginalLinks: function (a, z) {
            try {
                var videos = PH_shortVideos.find({original_link: {$exists: false}}).fetch();
                var ab = _.map(videos.slice(a, z), function (v) {
                    var gId = v.shortMovie.substr(v.shortMovie.lastIndexOf('/') + 1).replace('a.mp4', ''),
                        updatedAt = new Date;
                    return PH_shortVideos.update({
                        _id: v._id
                    }, {
                        $set: {
                            original_link: 'http://www.pornhub.com/gif/' + gId,
                            updatedAt: updatedAt
                        }
                    });
                });
                return ab.length + '/' + videos.length;
            } catch (ex) {
                console.error(ex);
            }
        },
        ph_importRndIndex: function (a, z) {
            check(a, Number);
            check(z, Number);
            var videos = PH_shortVideos.find().fetch();
            var ab = _.map(videos.slice(a, z), function (v) {
                var updatedAt = new Date,
                    rnd = Math.random();
                return PH_shortVideos.update({_id: v._id}, {
                    $set: {
                        rnd: rnd,
                        updatedAt: updatedAt
                    }
                });
            });
            return ab.length + '/' + videos.length;
        },
        ph_videoUpdateTags: function (a, z) {
            try {
                var videos = PH_shortVideos.find({$or: [{tags: {$size: 1}}, {tags: {$size: 0}}]}).fetch();
                console.log(videos.length);
                //return ph_getVideoTags('ph55c6c55c97db0');
                var ab = _.map(videos.slice(a, z), function (v) {
                    //Meteor.sleep(500);
                    var res = ph_getVideoTags2(v.fullId),
                        updatedAt = new Date;
                    //console.log(res);
                    return PH_shortVideos.update({
                        _id: v._id
                    }, {
                        $set: {
                            tags: _.union(res.tags, res.stars),
                            stars: res.stars,
                            updatedAt: updatedAt
                        }
                    })
                })
                return ab.length + '/' + videos.length;
            } catch (ex) {
                console.log(ex);
            }
        },
        importFromClient: function (movies) {
            var cd = 0;
            if (movies.length > 0) {
                _.each(movies, function (m) {
                    var isPass = Match.test(m, {
                        title: String,
                        fullMovie: String,
                        shortMovie: String,
                        gif: String,
                        original_link: String
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
                        } else {
                            var updatedAt = new Date;
                            var i = PH_shortVideos.update({_id: isExists._id}, {
                                $set: {
                                    original_link: m.original_link,
                                    shortMovie: m.shortMovie,
                                    gif: m.gif,
                                    updatedAt: updatedAt,
                                }
                            });
                            cd++;
                        }
                    }
                    //console.log('.');
                })
            }
            console.log('FINISHED CRAWLER...');
            return 'import success : ' + cd + '/' + movies.length + ' links';
        },
        ph_getAdultsGif3: function(a,z){

        },
        ph_getAdultsGif2: function (a, z) {
            try {
                check(a, Number);
                check(z, Number);
                var url_tpl = _.template('http://www.pornhub.com/gifs?page=<%=p%>');
                var urls = _.map(_.range(a, z), function (v) {
                    return url_tpl({p: v + 1})
                });
                var rs = Async.runSync(function (DONE) {
                    var x = Xray();
                    async.concat(urls,
                        function (url, cbMovies) {
                            async.waterfall([
                                function (cb1) {
                                    //x.delay(500, 700);
                                    x(url, ['ul.gifs li > a@href'])
                                    (function (err, data) {
                                        cb1(null, data)
                                    });
                                },
                                function (links, cb2) {
                                    if (links || links.length > 0) {
                                        async.map(links, function (link, cb2_1) {
                                            x(link, {
                                                original_link: 'link[rel="canonical"]@href',
                                                title: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@text',
                                                fullMovie: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@href',
                                                shortMovie: '#js-gifToWebm@data-mp4',
                                                gif: '#js-gifToWebm@data-gif'
                                            })(function (err, data) {
                                                cb2_1(null, data);
                                            })
                                        }, function (err, movies) {
                                            if (err) console.log(err);
                                            cb2(null, movies);
                                        })
                                    } else {
                                        cb2(null, []);
                                    }
                                }
                            ], function (err, movies) {
                                if (err) console.log(err);
                                console.log('crawler page : ' + url + ' - get ' + movies.length + ' links');
                                cbMovies(null, movies);
                            })
                        },
                        function (err, movies) {
                            if (err) console.log(err);
                            DONE(null, movies);
                        }
                    )
                });
                //return rs.result;
                var movies = rs.result;
                var cd = 0;
                if (movies.length > 0) {
                    _.each(movies, function (m) {
                        var isPass = Match.test(m, {
                            title: String,
                            fullMovie: String,
                            shortMovie: String,
                            gif: String,
                            original_link: String
                        })
                        if (isPass) {
                            var fullId = getQueryString('viewkey', m.fullMovie);
                            var isExists = PH_shortVideos.findOne({fullId: fullId});
                            var res = ph_getVideoTags2(fullId);
                            if (!isExists) {
                                var newDate = new Date;
                                //console.log(fullId,tags);
                                m = _.extend(m, {
                                    fullId: fullId,
                                    tags: _.union(res.tags, res.stars),
                                    stars: res.stars,
                                    updatedAt: newDate
                                });
                                var i = PH_shortVideos.insert(m);
                                cd++;
                            } else {
                                var updatedAt = new Date;
                                var i = PH_shortVideos.update({_id: isExists._id}, {
                                    $set: {
                                        original_link: m.original_link,
                                        shortMovie: m.shortMovie,
                                        gif: m.gif,
                                        stars: res.stars,
                                        updatedAt: updatedAt,
                                    }
                                });
                                cd++;
                            }
                        }
                        //console.log('.');
                    })
                }
                console.log('FINISHED CRAWLER...');
                return 'import success : ' + cd + '/' + movies.length + ' links';
            } catch (ex) {
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
                        console.log('GET TOTAL LINK GIF:', links.length);
                        if (links.length > 0) {
                            async.map(links, function (link, cb1) {
                                //console.log('parse : ', link)
                                x(link, {
                                    original_link: 'link[rel="canonical"]@href',
                                    title: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@text',
                                    fullMovie: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@href',
                                    shortMovie: '#js-gifToWebm@data-mp4',
                                    gif: '#js-gifToWebm@data-gif'
                                })(function (err, data) {
                                    //console.log(data);
                                    cb1(null, data);
                                })
                            }, function (err, result) {
                                cb(null, result);
                            });
                        } else {
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
            if (movies.length > 0) {
                _.each(movies, function (m) {
                    var isPass = Match.test(m, {
                        title: String,
                        fullMovie: String,
                        shortMovie: String,
                        gif: String,
                        original_link: String
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
                        } else {
                            var updatedAt = new Date;
                            var i = PH_shortVideos.update({_id: isExists._id}, {
                                $set: {
                                    original_link: m.original_link,
                                    shortMovie: m.shortMovie,
                                    gif: m.gif,
                                    updatedAt: updatedAt,
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
            return TumblrPostVideo(vId, state);
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
            //this.unlock();
            console.log('======== Update Alll Information ========')
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
                                var step1 = {
                                    username: user.name,
                                    following: user.following,
                                    blogsInfor: blogsInfor,
                                    msg1: 'Updated UserInfo:' + user.name + ' (following : ' + user.following + ', ' + blogsInfor.length + ' blog (s) has ' + total_Followers + ' followers), '
                                }
                                console.log('+++ STEP 1 : ', step1.msg1);
                                cbFollowing(null, step1);
                            } else {
                                throw new Meteor.Error('No User Info')
                            }
                        }),
                        Meteor.bindEnvironment(function (userInfo, cbFollowers) {
                            if (userInfo && userInfo.following) {
                                var current_totalFollowing = Followings.find({username: userInfo.username}).count(),
                                    total_new = Math.abs(userInfo.following - current_totalFollowing);
                                var offsets = getOffsets(total_new, 20);
                                console.log('REQUEST FOLLOWING : ', offsets.length);
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
                                    var step2  = {
                                        msg: userInfo.msg1 + 'Inserted ' + updatedCount + ' Followings, ',
                                        blogsInfor: userInfo.blogsInfor,
                                        username: userInfo.username
                                    }
                                    console.log('+++ STEP 2 : ', step2.msg);
                                    cbFollowers(null, step2);
                                })
                            } else {
                                throw new Meteor.Error('No following')
                            }
                        }),
                        Meteor.bindEnvironment(function (followers, cbDone) {
                            if (followers && followers.blogsInfor) {
                                //console.log('getFollowers', followers);
                                //Followers.remove({name : {$exists : false}});
                                async.concat(followers.blogsInfor, function (blog, cbBlog) {
                                    var current_totalFollowers = Followers.find({blogName: blog.blogName}).count();
                                    var total_new = Math.abs(blog.followers - current_totalFollowers);
                                    var offsets = getOffsets(total_new, 20);
                                    console.log('REQUEST FOLLOWERS : ', offsets.length);
                                    var counter = offsets.length;
                                    var updatedCount = 0;
                                    async.concat(offsets, function (offset, cbBlogFollowers) {
                                        var result = Meteor.call('tblr_followers', blog.blogName, 20, offset);
                                        console.log('REMAINING REQUEST : ', --counter);
                                        var users = (result && result.users) ? result.users : [];
                                        if(users && users.length > 0){

                                            _.each(users, function (u) {
                                                var updatedAt = new Date();
                                                u = _.extend(u, {
                                                    username: followers.username,
                                                    blogName: blog.blogName,
                                                    updatedAt: updatedAt
                                                });

                                                Followers.upsert({blogName: blog.blogName, name: u.name},{
                                                    $set : u
                                                });
                                                /*var isExists = Followers.findOne({blogName: blog.blogName, name: u.name});
                                                if (!isExists) {
                                                    var insertedAt = new Date();
                                                    u = _.extend(u, {
                                                        username: followers.username,
                                                        blogName: blog.blogName,
                                                        insertedAt: insertedAt
                                                    });
                                                    Followers.insert(u);
                                                    //console.log('inserted follower', updatedCount);
                                                } else {
                                                    var updatedAt = new Date();
                                                    Followers.update({_id: isExists._id}, {
                                                        $set : {
                                                            following: u.following,
                                                            updatedAt: updatedAt
                                                        }
                                                    });
                                                }*/
                                            });
                                            ++updatedCount;
                                        }
                                        cbBlogFollowers(null, updatedCount);
                                    }, function (err, updatedCount) {
                                        if (err) throw new Meteor.Error(err);
                                        //console.log('total followers : ', users.length);
                                        cbBlog(null, 'Blog ' + blog.blogName + ' inserted new ' + updatedCount + ' followers ;');
                                    })
                                }, function (err, msgs) {
                                    if (err) throw new Meteor.Error(err);
                                    var step3 = followers.msg + msgs.join(',')
                                    console.log('+++ STEP 3 : ', step3);
                                    cbDone(null, step3);
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
                            if (res) {
                                var updatedAt = new Date();
                                Followers.update({_id: f._id}, {
                                    $set: {
                                        following: true,
                                        updatedAt: updatedAt
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
                            console.log('tblr_autoFollowingFromFollowers:', msg);
                            done(null, msg);
                        }))
                });
                return rs.result;
            } else {
                return 'No un-following from followers!'
            }
        },
        tblr_edit_video_post : function(postId){

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
        getVideosRemaining: function () {
            var posts = Posts.find().fetch();
            var vIds = _.map(posts, function (p) {
                return p.fullId
            });
            var count = PH_shortVideos.find({$and: [{fullId: {$nin: vIds}}, {hasError: false}]}).count(),
                error = PH_shortVideos.find({$and: [{fullId: {$nin: vIds}}, {hasError: true}]}).count()
            return {
                remaining : count,
                error : error,
                uploaded : vIds.length
            };
        },
        cron_40minutesUploadAShortVideo: function (blogName, type, state) {
            var blogName = blogName || 'p0rnhunt.tumblr.com';
            var type = type || 'ph_shortVideo';
            var state = state || 'published';
            var tblr_posts = Posts.find({blogName: blogName, type: type}).fetch(),
                alreadyUploadedVideoIds = _.map(tblr_posts, function (p) {
                    return p.fullId;
                });
            //console.log(alreadyUploadedVideoIds);
            var nextVideo = PH_shortVideos.findOne({$and: [{fullId: {$nin: alreadyUploadedVideoIds}}, {hasError: false}, {rnd: {$gte: Math.random()}}]});
            console.log('NEXT VIDEO : ', nextVideo);
            var aff = false;
            if (nextVideo) {
                aff = Meteor.call('ph_testVideoError', nextVideo._id, state);
            }
            return aff;
        },
        //Porn Download
        fetch_getVideoDownloadUrl : function(vId){
            try{
                var video = PH_shortVideos.findOne({_id : vId});
                if(!video){
                    return {
                        status : 404,
                        msg : 'Sorry, video not found...'
                    }
                }else{
                    var rs = Async.runSync(function(done){
                        var x = Xray();
                        x(video.fullMovie,'#player',{
                            script : 'script'
                        })(function(err, data){
                            done(err,data);
                        })
                    });

                    if(rs.error){
                        return {
                            status : 501,
                            msg : 'Sorry, server error...'
                        }
                    }
                    if(rs.result && rs.result.script){
                        var script = rs.result.script,
                            //script = script.replace(/(\r\n|\n|\r|\t)/gm,""),
                            test720 = script.match("var player_quality_720p \= \'(.*)\'\;"),
                            test480 = script.match("var player_quality_480p \= \'(.*)\'\;"),
                            test240 = script.match("var player_quality_240p \= \'(.*)\'\;");

                        var test = {
                            v720p : (test720) ? test720[0].split(';').filter(function(s){return s.length > 0}) : [],
                            v480p : (test480) ? test480[0]:'',
                            v240p : (test240) ? test240[0].split(';').filter(function(s){return s.length > 0}) : []
                        }
                        var videoDownload = '';
                        //console.log(test)
                        if(test.v720p.length === 3){
                            var test720 = test.v720p[0].match("var player_quality_720p \= \'(.*)\'");
                            //console.log(test.v720p);
                            videoDownload = (test720) ? test720[1] : '';
                        }

                        if(videoDownload.length === 0 && test.v240p.length ==1){
                            var test240 = test.v240p[0].match("var player_quality_240p \= \'(.*)\'");
                            videoDownload = (test240) ? test240[1] : ''
                        }

                        if(videoDownload.length === 0 && test.v240p.length >= 2){
                            var test480 = test.v480p.match("var player_quality_480p \= \'(.*)\'");
                            videoDownload = (test480) ? test480[1] : ''
                        }
                        if(videoDownload.length !== 0){
                            return {
                                status : 200,
                                msg : videoDownload
                            }
                        }else{
                            return {
                                status : 404,
                                msg : 'Sorry, video deleted from server...'
                            }
                        }
                    }
                }
            }catch(ex){
                console.log('Fetch Download Error : ', ex);
                return {
                    status : 501,
                    msg : 'Sorry, server error...'
                }
            }
        }
    });

    var ph_getVideoTags = function (vId) {
        try {
            var url = 'http://www.pornhub.com/webmasters/video_by_id?id=' + vId + '&thumbsize=medium';
            var ab = request.getSync(url, {
                headers: {'Content-Type': 'application/json'},
                encoding: 'utf8'
            });

            if (ab.body) {
                var rs = JSON.parse(ab.body);
                //console.log(rs);
                //throw new Meteor.Error('111')
                if (rs && rs.video) {
                    rs = rs.video;
                    var tags = _.map(rs.tags, function (t) {
                        return t.tag_name.toLowerCase();
                    });

                    var stars = _.map(rs.pornstars, function (p) {
                        return p.pornstar_name;
                    });

                    return {
                        tags: tags,
                        stars: stars
                    }
                }
            }
            return [];
        } catch (ex) {
            console.log(vId, ex);
            console.log(ab.body);
        }
    }

    var ph_getVideoTags2 = function (vId) {
        try{
            var url = 'http://www.pornhub.com/webmasters/video_by_id?id=' + vId + '&thumbsize=medium';
            var rs = Async.runSync(function (done) {
                HTTP.get(url, function (err, data) {
                    if (err) console.log(vId, err);
                    if (data) done(null, data);
                })
            });

            if (rs && rs.result && rs.result.content) {
                rs = JSON.parse(rs.result.content).video;
                //console.log(rs);
                var tags = _.map(rs.tags, function (t) {
                    return t.tag_name.toLowerCase();
                });

                var stars = _.map(rs.pornstars, function (p) {
                    return p.pornstar_name;
                });

                return {
                    tags: tags,
                    stars: stars
                }
            }

            return []
        }catch(ex){
            console.log('ERROR PARSE TAGS : ' + vId, ex);
            console.log(rs)
            return []
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

    var TumblrPostVideo = function (vId, state) {
        var tblr_keys = Meteor.settings.private.Tumblr,
            isValid = Match.test(tblr_keys, {
                consumer_key: String,
                consumer_secret: String,
                token: String,
                token_secret: String,
                blog: String,
            });
        //console.log(tblr_keys);
        if (isValid) {
            var clip = PH_shortVideos.findOne({_id: vId});
            if (clip) {
                var fs = Npm.require('fs');
                var path = Npm.require('path');
                var filename = path.join(path.resolve('.'), Random.id(5) + '.mp4');
                var rs = Async.runSync(function (done) {
                    var writeStream = fs.createWriteStream(filename);
                    writeStream.on('close', function () {
                        console.log('++ SAVED FILE : ', filename);
                        done(null, true);
                    });
                    _request(clip.shortMovie, {encoding: null})
                        .on('response', function (response) {
                            console.log(response.statusCode) // 200
                            console.log(response.headers) // 'image/png'
                        })
                        .pipe(writeStream);
                });
                if (rs.result && rs.result === true) {
                    var title = s.capitalize(clip.title),
                        slug = s.slugify(title);
                    var caption = _.template('<%=title%><%=landingPage%><p>[[MORE]]</p><p><%=movieDetail%></p>');
                    var iframe_Tlp = _.template('<iframe src="http://www.pornhub.com/embed/<%=fullId%>" frameborder="0" width="608" height="468" scrolling="no"></iframe>'),
                        iframe = iframe_Tlp({fullId: clip.fullId});
                    var tags = _.shuffle(_.union(clip.tags, ['p0rnhunt', 'toys-adult']));
                    var _landingPage = '';
                    if (Meteor.settings.public && Meteor.settings.public.LandingPages) {
                        var landingPages = Meteor.settings.public.LandingPages;
                        var lp = landingPages[Math.floor(Math.random() * landingPages.length)];
                        var lp_tpl = _.template('<p><a class="landing-link" href="<%=value%>" target="_blank"><%=name%></a></p>');
                        if (Match.test(lp, {name: String, value: String})) {
                            _landingPage = lp_tpl({
                                name: lp.name,
                                value: lp.value
                            });
                        }
                    }
                    rs = Async.runSync(function (done) {
                        var readStream = fs.createReadStream(filename);
                        readStream.on('close', function () {
                            console.log('==> UPLOADED FILE : ', filename);
                        });

                        var form = {
                            type: 'video',
                            state: state || 'published',
                            tags: tags.join(','),
                            format: 'html',
                            slug: slug,
                            data: readStream,
                            caption: caption({
                                title: (title.length > 10) ? '<p>' + title + '</p>' : '',
                                landingPage: _landingPage,
                                movieDetail: iframe
                            })
                        }
                        var url = 'http://api.tumblr.com/v2/blog/' + tblr_keys.blog + '/post';
                        var myoauth = {
                                consumer_key: tblr_keys.consumer_key,
                                consumer_secret: tblr_keys.consumer_secret,
                                token: tblr_keys.token,
                                token_secret: tblr_keys.token_secret
                            },
                            options = {
                                url: url,
                                method: 'POST',
                                followRedirect: false,
                                json: false,
                                oauth: myoauth,
                                timeout:20000,
                                form: form
                            }
                        console.log('============BEGIN POST VIDEO=============');
                        console.log('OAUTH : ', myoauth);
                        console.log('FORM DATA : ', form);
                        var r = _request(options, function (err, response, body) {
                            try {
                                body = JSON.parse(body);
                            } catch (e) {
                                body = {error: 'Malformed Response: ' + body};
                            }
                            if (err) return done(err, null);
                            if (response.statusCode >= 400) {
                                var errString = body.meta ? body.meta.msg : body.error;
                                return done(new Error('API error: ' + response.statusCode + ' ' + errString), null);
                            }
                            if (body && body.response) {
                                return done(null, body.response);
                            } else {
                                return done(new Error('API error (malformed API response): ' + body));
                            }
                        });
                        console.log(r);
                    });
                    //

                    fs.unlinkSync(filename);
                    if (rs.error) {
                        console.log('POST VIDEO ERROR : ', rs.error);
                        PH_shortVideos.update({_id: clip._id}, {
                            $set: {
                                hasError: true
                            }
                        });
                        return 'Clip not contain any data...check shortMovie.mp4'
                    }
                    if (rs.result && rs.result.id) {
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
                } else {
                    fs.unlinkSync(filename);
                    return [false, clip]
                }
            }
        }
        return [false, vId]
    }

    SyncedCron.add({
        name: 'Every 59 minutes upload a short video to Tumblr',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('every 59 mins');
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