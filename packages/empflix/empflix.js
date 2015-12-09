// Write your package code here!
if (Meteor.isServer) {
    Meteor.methods({
        empflix_Search: function (term, page) {
            try {
                var page = page || 0;
                check(term, String);
                var searchUrl = _.template('http://www.empflix.com/search.php?what=<%=term%>&page=<%=page%>');
                var _term = s.words(term).join('+');
                var rs = Async.runSync(function (done) {
                    //var Xray = Meteor.npmRequire('x-ray'),
                    var x = Xray();
                    var url = searchUrl({page: page, term: _term});
                    x(url, 'div.featuredVideos', {
                        items: x('div.video.vmod_2', [
                            {
                                id: '@id',
                                thumbnail: 'a.videoThumb img@src',
                                title: 'a.videoThumb img@alt',
                                href: 'a.videoThumb@href'
                            }
                        ])
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
        },
        empflix_detail: function (movieUrl) {
            try {
                var rs = Async.runSync(function (done) {
                    var Xray = Meteor.npmRequire('x-ray'),
                        x = Xray();

                    x(movieUrl, {
                        id: 'input#VID@value',
                        title: 'input#title@value',
                        description: 'input#description@value',
                        poster: 'meta[itemprop="thumbnailUrl"]@content',
                        tags: ['span.listView > a@text']
                    })
                    (function (error, data) {
                        if (error) done(error, null);
                        if (data) {
                            var videoId = 'video' + data.id;
                            done(null, _.extend(data, {id: videoId}));
                        }
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