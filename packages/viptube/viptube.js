// Write your package code here!
if (Meteor.isServer) {
    Meteor.methods({
        viptube_Search: function (term, page) {
            try {
                var page = page || 0;
                check(term, String);
                var searchUrl = _.template('http://www.viptube.com/search/videos/<%=term%>/<%=page%>');
                var _term = s.words(term).join('-');
                var rs = Async.runSync(function (done) {
                    //var Xray = Meteor.npmRequire('x-ray'),
                    var x = Xray();
                    var url = searchUrl({page: page, term: _term});
                    x(url, '.main', {
                        items: x('.primary a', [
                            {
                                id: '@href',
                                thumbnail: '.container_image > img@src',
                                title: '@title',
                                href: '@href'
                            }
                        ])
                    })
                    (function (error, data) {
                        if (error) done(error, null);
                        if (data) done(null, _.map(data.items, function (i) {
                            return _.extend(i, {source: '4TUBE'})
                        }));
                    })
                });
                if (rs.error) {
                    console.log('Error', rs.error);
                    throw new Meteor.Error(rs.error);
                }

                if (rs.result) {
                    return rs.result;
                }
            } catch (ex) {
                throw new Meteor.Error(ex);
            }
        },
        viptube_detail: function (movieUrl) {
            try {
                var rs = Async.runSync(function (done) {
                    var x = Xray();
                    x(movieUrl,'.main', {
                        id: '.video_rate.like_btn@_video_id',
                        title: '.watch .headline > h2',
                        poster: 'video@poster',
                        tags: ['.data_categories .list a@title']
                    })
                    (function (error, data) {
                        if (error) done(error, null);
                        if (data) done(null, data);
                    })
                });

                if (rs.error) {
                    console.log('Error', rs.error);
                    throw new Meteor.Error(rs.error);
                }

                if (rs.result) {
                    return rs.result;
                }
            } catch (ex) {
                throw new Meteor.Error(ex);
            }
        }
    })
}