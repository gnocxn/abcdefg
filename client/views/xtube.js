Template.listGayPorns.events({
    'click .btn-xtube': function (e, t) {
        e.preventDefault();
        var videoUrl = t.$('#txtVideoUrl').val();
        var source = 'xtube_grabInfo';
        fetchVideo(videoUrl, source);
    },
    'click .btn-redtube': function (e, t) {
        e.preventDefault();
        var videoUrl = t.$('#txtVideoUrl').val();
        var source = 'redtube_grabInfo';
        fetchVideo(videoUrl, source);
    },
    'click .btn-porncom': function (e, t) {
        e.preventDefault();
        var videoUrl = t.$('#txtVideoUrl').val();
        var source = 'porncom_grabInfo';
        fetchVideo(videoUrl, source);
    }
});

Template.listGayPorns.helpers({
    settings: function () {
        var gayCollection = FULLPORNS.find();
        return {
            collection: gayCollection,
            rowsPerPage: 10,
            showFilter: true,
            fields: [
                {key: 'title', label: 'Title', sortOrder: 1, sortDirection: 'ascending'},
                {key: 'duration', label: 'Duration', sortOrder: 2, sortDirection: 'descending'},
                {
                    key: 'savedPath', label: 'Downloaded', fn: function (value) {
                    var i = (value && value.length > 0) ? '<i class="fa fa-check"></i>' : ''
                    return new Spacebars.SafeString(i);
                }
                },
                {
                    key: 'watermarkedPath', label: 'Watermarked', fn: function (value) {
                    var i = (value && value.length > 0) ? '<i class="fa fa-check"></i>' : ''
                    return new Spacebars.SafeString(i);
                }
                },
                {key: 'updatedAt', label: 'Updated At', sortOrder: 0, sortDirection: 'descending'},
                {key: '_id', label: '', tmpl: Template.gay_controls},
            ]
        }
    }
})

Template.gay_controls.events({
    'click .btn-download': function (e, t) {
        e.preventDefault();
        var video = t.data;
        Meteor.call('download_clip', video.download, video.videoId, function (err, rs) {
            if (err) {
                console.error(err);
            }
            if (rs) {
                console.info(rs);
            }
        });
    },
    'click .btn-reGetInfo' : function(e,t){
        e.preventDefault();
        var videoUrl = t.data.url;
        var source = null;
        switch(t.data.source){
            case 'REDTUBE' :
                source = 'redtube_grabInfo';
                break;
            case 'XTUBE':
                source = 'xtube_grabInfo';
                break;
        }
        if(source && videoUrl){
            fetchVideo(videoUrl, source);
        }
    },
    'click .btn-detail': function (e, t) {
        e.preventDefault();
        var video = t.data;
        var portToUpload = Meteor.settings.public.PortToUpload || 8080;
        var hostToDownLoad = Meteor.absoluteUrl(),
            hostToDownLoad = hostToDownLoad.substr(0,hostToDownLoad.lastIndexOf('/')) + ':' + portToUpload;
        var savedPath = hostToDownLoad + video.savedPath.substr(video.savedPath.lastIndexOf('/')),
            watermarkedPath = hostToDownLoad + video.watermarkedPath.substr(video.watermarkedPath.lastIndexOf('/'));
        var tags = _.map(video.tags, function(t){return s.slugify(t.toLowerCase())});
        Modal.show('modal_detail', _.extend(video,{tags : tags.join(' '), savedPath : savedPath, watermarkedPath : watermarkedPath}));
    },
    'click .btn-watermark-1': function (e, t) {
        e.preventDefault();
        var video = t.data;
        var watermark = 'malecamsclub.png';
        addWatermark(video, watermark);
    },
    'click .btn-watermark-2': function (e, t) {
        e.preventDefault();
        var video = t.data;
        var watermark = 'tubechat.xyz.png';
        addWatermark(video, watermark);
    },
    'click .btn-watermark-3': function (e, t) {
        e.preventDefault();
        var video = t.data;
        var watermark = 'desixxx.xyz.png';
        addWatermark(video, watermark);
    }
})

function addWatermark(video, watermark) {
    Meteor.call('addWatermark', video.videoId, watermark, function (err, rs) {
        if (err) {
            console.error(err);
        }
        if (rs) {
            console.info(rs);
        }
    });
}

function fetchVideo(videoUrl, method) {
    if (videoUrl) {
        Meteor.call(method, videoUrl, function (err, rs) {
            if (err) {
                console.error(err);
            }
            if (rs) {
                console.info(rs);
                $('#txtVideoUrl').val('');
            }
        })
    }
}