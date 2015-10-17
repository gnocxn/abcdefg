if (Meteor.isServer) {
    Meteor.methods({
        fetch_gifs_pornhub_step1: function (page) {
            var urlTpl = _.template('http://www.pornhub.com/gifs?page=<%=page%>');
            try {
                check(page, Number);
                var url = urlTpl({page: page});
                var rs = Async.runSync(function (done) {
                    var x = Xray();
                    x(url, {
                        items: x('ul.gifs li', [{
                            gifId: '@id',
                            gifUrl: 'a@href'
                        }])
                    })
                    (function (err, data) {
                        if (err) {
                            console.log('Step 1 Error:', page);
                            throw new Meteor.Error(err);
                        }
                        if (data) {
                            done(null, data.items);
                        }
                    });
                });
                if (rs.result) {
                    var ids = [];
                    _.each(rs.result, function (i) {
                        var isExists = PORNHUBGIFS.findOne({gifId: i.gifId});
                        if (!isExists) {
                            var updatedAt = new Date();
                            i = _.extend(i, {updatedAt: updatedAt});
                            var id = PORNHUBGIFS.insert(i);
                            ids.push(id);
                        }
                    });
                    console.log('Finish step 1, crawler page : ' + page + ', got : ' + ids.length + ' gif.');
                    return ids;
                }
                return [];
            } catch (ex) {
                console.log('Fetch PornHub Gifs Step 1 - error', ex);
            }
        },
        fetch_gifs_pornhub_step2: function (_gId) {
            try {
                check(_gId, String);
                var gif = PORNHUBGIFS.findOne({_id: _gId});
                if (gif) {
                    var rs = Async.runSync(function (done) {
                        var x = Xray();
                        x(gif.gifUrl, {
                            full_title: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@text',
                            full_movie: '#gifInfoSection > div.sourceTagDiv > div.bottomMargin > a@href',
                            title: '#js-gifToWebm@data-gif-title',
                            mp4: '#js-gifToWebm@data-mp4',
                            webm: '#js-gifToWebm@data-webm',
                            gif: '#js-gifToWebm@data-gif'
                        })
                        (function (err, data) {
                            if (err) {
                                console.log('Fetch Step 2 Error ', gif.gifUrl);
                                throw new Meteor.Error(err);
                            }
                            if (data) {
                                done(null, data);
                            }
                        })
                    });

                    if (rs.result) {
                        var updatedAt = new Date();
                        var rnd = Math.random();
                        var fullId = getQueryString('viewkey', rs.result.full_movie);
                        var newUpdate = _.extend(rs.result, {
                            updatedAt: updatedAt,
                            full_movie_id: fullId,
                            tags: [],
                            stars: [],
                            rnd: rnd,
                            isFetchDone: true
                        });
                        PORNHUBGIFS.update({_id: gif._id}, {
                            $set: newUpdate
                        });

                        var movie = PORNHUBMOVIES.findOne({movieId: fullId});
                        var post = Posts.findOne({fullId: fullId});
                        var isAlreadyPost2Tumblr = false;
                        if (post) {
                            isAlreadyPost2Tumblr = true;
                        }
                        if (!movie) {
                            rnd = Math.random();
                            updatedAt = new Date();
                            PORNHUBMOVIES.insert({
                                movieId: fullId,
                                title: newUpdate.full_title,
                                rnd: rnd,
                                count: 1,
                                gifs: [gif.gifId],
                                isAlreadyPost2Tumblr: isAlreadyPost2Tumblr,
                                updatedAt: updatedAt
                            });
                        } else {
                            updatedAt = new Date();
                            PORNHUBMOVIES.update({_id: movie._id}, {
                                $inc: {count: 1},
                                $push: {gifs: gif.gifId},
                                $set: {
                                    updatedAt: updatedAt,
                                    isAlreadyPost2Tumblr: isAlreadyPost2Tumblr
                                }
                            });
                        }

                        console.log('Finish step 2,', gif.gifUrl);
                        return gif._id;
                    }

                }
                return 'FAILED';
            } catch (ex) {
                console.log('Fetch PornHub Gifs Step 2 - error', ex);
            }
        },
        fetch_gifs_pornhub_updateTags: function (_gId) {
            try {
                check(_gId, String);
                if (_gId !== 'FAILED') {
                    var gif = PORNHUBGIFS.findOne({_id: _gId});
                    if (gif && gif.full_movie_id) {
                        var urlTpl = _.template('http://www.pornhub.com/webmasters/video_by_id?id=<%=id%>&thumbsize=large_hd');
                        var url = urlTpl({id: gif.full_movie_id});
                        var res = request.getSync(url);
                        var obj = JSON.parse(res.body.toString());
                        if (obj && obj.video) {
                            var video = obj.video;
                            var tags = _.map(video.tags, function (t) {
                                return t.tag_name.toLowerCase();
                            });

                            var stars = _.map(video.pornstars, function (p) {
                                return p.pornstar_name;
                            });

                            var updatedAt = new Date();
                            PORNHUBGIFS.update({_id: gif._id}, {
                                $set: {
                                    tags: tags,
                                    stars: stars,
                                    updatedAt: updatedAt
                                }
                            });

                            PORNHUBMOVIES.update({movieId: video.video_id}, {
                                $set: {
                                    tags: tags,
                                    stars: stars,
                                    updatedAt: updatedAt
                                }
                            });

                            console.log('Finish update tags', gif.full_movie_id);

                            return true;
                        }
                    }
                }
            } catch (ex) {
                console.log('Fetch PornHub Gifs Step 3 - error', ex);
                return false;
            }
            return false;
        },
        upload_step1: function () {
            try {
                var rnd = Math.random();
                return PORNHUBMOVIES.findOne({
                    isUploadError: {$exists: false},
                    isAlreadyPost2Tumblr: false,
                    rnd: {$gte: rnd}
                });
            } catch (ex) {
                console.log('ERROR UPLOAD STEP1', ex);
            }
        },
        upload_step2: function (movie) {
            var result = 'FAILED';
            try {
                if (movie && movie.gifs) {
                    var gifId = movie.gifs[Math.floor(Math.random() * movie.gifs.length)];
                    if (gifId) {
                        var gif = PORNHUBGIFS.findOne({gifId: gifId});
                        if (gif) {
                            var fs = Npm.require('fs');
                            var path = Npm.require('path');
                            var filename = path.join(path.resolve('.'), Random.id(5) + '.mp4');
                            var rs = Async.runSync(function (done) {
                                var writeStream = fs.createWriteStream(filename);
                                writeStream.on('close', function () {
                                    console.log('++ SAVED FILE : ', filename);
                                    done(null, true);
                                });
                                _request(gif.mp4, {encoding: null})
                                    .pipe(writeStream);
                            });

                            if (rs.result && rs.result === true) {
                                var title = s.capitalize(movie.title);
                                var slug = movie.movieId;
                                var tags = _.shuffle(_.union(movie.tags, movie.stars, ['p0rnhunt', 'pornhunt.xyz']));
                                var options = {
                                    state: 'queue',
                                    tags: tags.join(','),
                                    format: 'html',
                                    slug: slug,
                                    caption: (title.length > 10) ? '<p>' + title + '</p>' : '',
                                    data : filename
                                }
                                var blogName = 'p0rnhunt.tumblr.com';
                                rs = Async.runSync(function (done) {
                                    console.log('Upload Options : ', options);
                                    TumblrClient.video(blogName, options, function (err, data) {
                                        if (err) {
                                            console.log(gif.gifId, 'ERROR POST VIDEO : ' + err.toString());
                                            done(err, null);
                                        }
                                        ;
                                        if (data) {
                                            console.log('SUCCESS POST VIDEO : ', data);
                                            done(err, true);
                                        }
                                    })
                                })
                                fs.unlinkSync(filename);
                                if (rs.error) {
                                    if(movie.gifs.length <= 1){
                                        var updatedAt = new Date();
                                        PORNHUBMOVIES.update({_id : movie._id},{
                                            $set : {
                                                isUploadError : true,
                                                updatedAt : updatedAt
                                            }
                                        })
                                    }
                                }

                                if(rs.result && rs.result == true){
                                    var updatedAt = new Date();

                                    TURMBLRPOSTS.upsert({movieId : movie.movieId},{
                                        $set : {
                                            movieId : movieId,
                                            isConfirm : false,
                                            source : 'PORNHUBGIF',
                                            updatedAt : updatedAt
                                        }
                                    });

                                    PORNHUBMOVIES.update({movieId : movie.movieId},{
                                        $set : {
                                            isAlreadyPost2Tumblr : true,
                                            updatedAt : updatedAt
                                        }
                                    });

                                    result = movie.movieId;
                                }
                            }
                        }
                    }
                }
                return result;
            } catch (ex) {
                console.log('ERROR UPLOAD STEP2', ex);
            }
        },
        upload_step3: function (movieId) {
            var result = false;
            try {
                var blogName = 'p0rnhunt.tumblr.com';
                var options = {
                    type : 'video',
                    limit : 1
                }
                var rs = Async.runSync(function (done) {
                    TumblrClient.posts(blogName, options, function(err, data){
                        if(err){
                            console.log('ERROR UPLOAD STEP 3', err);
                            done(err, null)
                        }
                        if(data){
                            done(null, data)
                        }
                    })
                });

                if(rs.result && rs.result.posts){
                    var posts = rs.result.posts;
                    _.each(posts, function(p){
                        if(p.slug === movieId){
                            var updatedAt = updatedAt;
                            TURMBLRPOSTS.update({movieId : movieId},{
                                $set : {
                                    isConfirm : true,
                                    updatedAt : updatedAt
                                }
                            });
                            result = true;
                        }
                    })
                }
                return result;
            } catch (ex) {
                console.log('ERROR UPLOAD STEP3', ex);
            }
        },
    });
}