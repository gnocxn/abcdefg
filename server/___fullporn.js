if (Meteor.isServer) {

/*    Picker.route('/download/:videoId',function(params, req, res, next){
        var video = FULLPORNS.findOne({videoId : params.videoId});
        if(video){
            var fs = Npm.require('fs');
            if(!video.watermarkedPath || !fs.existsSync(video.watermarkedPath)){
                res.end('not found!');
            }

            var stat = fs.statSync(video.watermarkedPath);
            var total = stat.size;
            if (req.headers['range']) {
                var range = req.headers.range;
                var parts = range.replace(/bytes=/, "").split("-");
                var partialstart = parts[0];
                var partialend = parts[1];

                var start = parseInt(partialstart, 10);
                var end = partialend ? parseInt(partialend, 10) : total-1;
                var chunksize = (end-start)+1;
                console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

                var file = fs.createReadStream(video.watermarkedPath, {start: start, end: end});
                res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
                file.pipe(res);
            } else {
                console.log('ALL: ' + total);
                res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
                var stream = fs.createReadStream(video.watermarkedPath);
                stream.pipe(res);
                stream.on('error', function(err){
                    console.log('ERROR', err);
                })

                stream.on('close', function(){
                    console.log('SUCCESS STREAM');
                });
            }
        }else{
            res.end('not found!');
        }
    })*/

    Meteor.publish('get_gayPorns', function(){
        return FULLPORNS.find();
    })

    Meteor.methods({
        xtube_grabInfo: function (link) {
            try {
                this.unblock();
                var rs = Async.runSync(function (done) {
                    var x = Xray();
                    x(link, '#watchPageLeft',{
                        script : 'script:contains("flashvars.video_url")@text'
                    })
                    (function(err, data){
                        if(err) done(err, null);
                        if(data) done(null, data);
                    })
                });
                if(rs.result && rs.result.script){
                    var script = rs.result.script;
                    var video_url_test = script.match("flashvars.video_url \= \"(.*)\"\;");
                    var videoId = getQueryString('v', link);
                    var urlTpl = _.template('http://www.xtube.com/webmaster/api.php?action=getVideoById&video_id=<%=videoId%>'),
                        url = urlTpl({videoId : videoId});
                    var r = request.getSync(url, {encoding : 'utf8'});
                    var movie = JSON.parse(r.body.toString());
                    var tags = [];
                    if(movie && movie.video_id){
                        tags = _.values(movie.tags);
                        var updatedAt = new Date();
                        FULLPORNS.upsert({videoId : movie.video_id, source : 'XTUBE'},{
                            $set : {
                                videoId : movie.video_id,
                                title : movie.title || '',
                                description : movie.description || '',
                                tags : tags,
                                duration : movie.duration,
                                url : movie.url,
                                thumb : movie.default_thumb || movie.thumb,
                                download : decodeURIComponent(video_url_test[1]),
                                source : 'XTUBE',
                                savePath : '',
                                downloadState : 'ready',
                                watermarkState : 'wait...',
                                watermarkedPath : '',
                                uploadState : 'wait...',
                                updatedAt : updatedAt
                            }
                        });
                        return true;
                    }
                }
                return false;
            } catch (ex) {
                console.log(ex);
            }
        },
        pornhub_grabInfo : function(link){

        },
        redtube_grabInfo : function(link){
            try{
                this.unblock();
                var rs = Async.runSync(function(done){
                    var x = Xray();
                    x(link, {item : 'source[type="video/mp4"]@src'})
                    (function(err, data){
                        if(err){
                            done(err, null);
                        }
                        if(data){
                            done(null, data);
                        }
                    });
                })
                if(rs.result && rs.result.item){
                    var videoId = link.substr(link.lastIndexOf('/')+1);
                    var urlTpl = _.template('http://api.redtube.com/?data=redtube.Videos.getVideoById&video_id=<%=videoId%>&output=json'),
                        url = urlTpl({videoId : videoId});
                    var r = request.getSync(url, {encoding : 'utf8'});
                    var body = (JSON.parse(r.body.toString()));
                    if(body && body.video && body.video.video_id){
                        var video = body.video;
                        var updatedAt = new Date();
                        FULLPORNS.upsert({videoId : videoId, source : 'REDTUBE'},{
                            $set : {
                                videoId : videoId,
                                title : video.title,
                                duration : video.duration,
                                url : link,
                                download : rs.result.item,
                                thumb : video.default_thumb || video.thumb,
                                tags : _.values(video.tags),
                                savedPath : '',
                                downloadState : 'ready',
                                watermarkState : 'wait...',
                                watermarkedPath : '',
                                uploadState : 'wait...',
                                updatedAt : updatedAt
                            }
                        })
                        return true;
                    }
                }
                return false;
            }catch(ex){
                console.log(ex);
            }
        },
        porncom_grabInfo : function(link){
            try{
                this.unblock();
                var rs = Async.runSync(function(done){
                    var x = Xray();
                    x(link,{title : 'title',description : 'meta[name="description"]@content', script : 'head',tags : ['p.categories > a@text']})
                    (function(err,data){
                        if(err){
                            done(err, null);
                        }
                        if(data){
                            done(null, data);
                        }
                    })
                })
                if(rs.error)console.log(rs.error);
                if(rs.result && rs.result.script){
                    var a = rs.result.script.toString().indexOf('streams:'),
                        z = rs.result.script.toString().indexOf(',length:'),
                        test = rs.result.script.toString().substr(a + 'streams:'.length, z - a - ",length:".length);
                    if(test){
                        var streams = eval(test);
                        var quality = ['1080p','720p','480p','360p', '240p', '144p'];
                        var mp4 = {};
                        streams = _.filter(streams, function(s){
                            return s.url;
                        });
                        _.some(quality, function(q){
                            mp4 = _.findWhere(streams, {id : q});
                            return (mp4);
                        })
                        var videoId = link.substring(link.lastIndexOf('-')+1);
                        var video = {
                            videoId : videoId,
                            url : link,
                            title : rs.result.title,
                            description : rs.result.description,
                            download : mp4.url,
                            tags : rs.result.tags || [],
                            source : 'PORN.COM',
                            savedPath : '',
                            downloadState : 'ready',
                            watermarkState : 'wait...',
                            watermarkedPath : '',
                            uploadState : 'wait...',
                            updatedAt : new Date()
                        };
                        FULLPORNS.upsert({videoId : video.videoId, source : video.source},{
                            $set : video
                        });

                        return true;
                    }
                }
                return false;
            }catch(ex){
                console.log(ex)
            }
        },
        download_clip : function(downloadUrl,videoId){
            try{
                this.unblock();
                FULLPORNS.update({videoId : videoId},{
                    $unset : {savePath : ''},
                    $set : {
                        downloadState : 'download...'
                    }
                });
                var fs = Npm.require('fs'),
                    path = Npm.require('path');
                var filename = path.join(path.resolve('/tmp/'), videoId + '.mp4');
                var rs = Async.runSync(function (done) {
                    var writeStream = fs.createWriteStream(filename);
                    writeStream.on('close', function () {
                        console.log('++ SAVED FILE : ', filename);
                        done(null, true);
                    });
                    _request(downloadUrl, {encoding: null})
                        .pipe(writeStream);
                });
                if(rs.result && rs.result === true){
                    FULLPORNS.update({videoId : videoId},{
                        $set : {
                            savedPath : filename,
                            downloadState : 'completed',
                            watermarkState : 'ready'
                        }
                    });
                    return true;
                }
                return false;
            }catch(ex){
                console.log(ex);
            }
        },
        addWatermark : function(videoId, waterMarkImg){
            try {
                this.unblock();
                var video = FULLPORNS.findOne({videoId : videoId});
                if(video && video.savedPath){
                    FULLPORNS.update({videoId : videoId},{
                        $unset : {watermarkedPath : ''},
                        $set : {
                            watermarkState : 'process...'
                        }
                    });
                    var fs = Npm.require('fs'),
                        path = Npm.require('path');
                    var watermark = path.join('/tmp/',waterMarkImg);

                    if(!fs.existsSync(watermark)){
                        var r = request.getSync(Meteor.absoluteUrl(waterMarkImg),{encoding : null});
                        fs.writeFileSync(watermark, r.body);
                    }
                    var rs = Async.runSync(function(done){
                        var process = new ffmpeg(video.savedPath);
                        var newFilePath = path.join('/tmp/', video.videoId+'.'+Random.hexString(7).toUpperCase()+'.mp4');
                        process.then(function (video) {
                            console.log('The video is ready to be processed');
                            var watermarkPath = watermark,
                                newFilepath = newFilePath,
                                settings = {
                                    position        : "SW"      // Position: NE NC NW SE SC SW C CE CW
                                    , margin_nord     : 1      // Margin nord
                                    , margin_sud      : 5      // Margin sud
                                    , margin_east     : null      // Margin east
                                    , margin_west     : 5      // Margin west
                                };
                            var callback = function (error, files) {
                                if(error){
                                    console.log('ERROR: ', error);
                                    done(error, null);
                                }
                                else{
                                    console.log('TERMINOU', files);
                                    done(null ,files);
                                }
                            }
                            //add watermark
                            video.fnAddWatermark(watermarkPath, newFilepath, settings, callback)

                        }, function (err) {
                            console.log('Error: ' + err);
                            done(err, null);
                        });
                    });

                    if(rs.result){
                        var updatedAt = new Date();
                        FULLPORNS.update({_id : video._id},{
                            $set : {
                                watermarkedPath : rs.result,
                                watermarkState : 'completed',
                                uploadState : 'ready',
                                updatedAt : updatedAt
                            }
                        });
                        return true;
                    }
                }
                return false;
            } catch (e) {
                console.log(e);
            }
        },
        updateUploadState : function(vId){
            try{
                this.unblock();
                FULLPORNS.update({_id : vId},{
                    $set : {
                        uploadState : 'completed'
                    }
                });
                return true;
            }catch(ex){
                console.log(ex);
                return false;
            }
        }
    })
}