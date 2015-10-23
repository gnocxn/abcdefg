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
                            videoId : movie.video_id,
                            title : movie.title || '',
                            description : movie.description || '',
                            tags : tags,
                            duration : movie.duration,
                            url : movie.url,
                            thumb : movie.default_thumb || movie.thumb,
                            download : decodeURIComponent(video_url_test[1]),
                            source : 'XTUBE',
                            updatedAt : updatedAt
                        });
                        return true;
                    }
                }
                return false;
            } catch (ex) {
                console.log(ex);
            }
        },
        download_clip : function(downloadUrl,videoId){
            try{
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
                            savedPath : filename
                        }
                    });
                    return true;
                }
                return false;
            }catch(ex){
                console.log(ex);
            }
        },
        addWatermark : function(videoId){
            try {
                var video = FULLPORNS.findOne({videoId : videoId});
                if(video){
                    var fs = Npm.require('fs'),
                        path = Npm.require('path');
                    var watermark = '/tmp/watermark2.png';

                    if(!fs.existsSync(watermark)){
                        var r = request.getSync(Meteor.absoluteUrl('watermark2.png'),{encoding : null});
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
                                    , margin_nord     : null      // Margin nord
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
        }
    })
}