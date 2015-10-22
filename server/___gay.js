if (Meteor.isServer) {

    Meteor.publish('get_gayPorns', function(){
        return GAYPORNS.find();
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
                        GAYPORNS.upsert({videoId : movie.video_id},{
                            videoId : movie.video_id,
                            title : movie.title || '',
                            description : movie.description || '',
                            tags : tags,
                            duration : movie.duration,
                            url : movie.url,
                            thumb : movie.default_thumb || movie.thumb,
                            download : decodeURIComponent(video_url_test[1]),
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
        addWatermark : function(video){
            try {
                var rs = Async.runSync(function(done){

                })
                var process = new ffmpeg('480_800_ekrti-S106-.mp4');
                process.then(function (video) {
                    console.log('The video is ready to be processed');
                    var watermarkPath = 'watermark3.png',
                        newFilepath = '/tmp/video-com-watermark.mp4',
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
                        }
                        else{
                            console.log('TERMINOU', files);
                        }
                    }
                    //add watermark
                    video.fnAddWatermark(watermarkPath, newFilepath, settings, callback)

                }, function (err) {
                    console.log('Error: ' + err);
                });
            } catch (e) {
                console.log(e.code);
                console.log(e.msg);
            }
        }
    })
}