// Write your package code here!
if (Meteor.isServer) {
    Meteor.methods({
        tnaflix_Search: function (term, page) {
            try {
                var page = page || 0;
                check(term, String);
                var searchUrl = _.template('https://www.tnaflix.com/search.php?what=<%=term%>&page=<%=page%>');
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
                        if (data) done(null, _.map(data.items, function (i) {
                            return _.extend(i, {source: 'TNAFLIX'})
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
        tnaflix_detail: function (movieUrl) {
            try {
                var rs = Async.runSync(function (done) {
                    var Xray = Meteor.npmRequire('x-ray'),
                        x = Xray();

                    x(movieUrl, {
                        title: 'div.sectionTitle h3@text',
                        description: 'div.videoDescription h3@text',
                        poster: 'meta[itemprop="thumbnailUrl"]@content',
                        tags: ['span.listView > a@text']
                    })
                    (function (error, data) {
                        if (error) done(error, null);
                        if (data) {
                            var videoId = s.strRightBack(movieUrl, '/');
                            done(null, _.extend(data, {id: videoId}));
                        }
                        ;
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