// Write your package code here!
if (Meteor.isServer) {
    Meteor.methods({
        madthumbs_Search: function (term, page) {
            try {
                var page = page || 0;
                check(term, String);
                var searchUrl = _.template('http://www.madthumbs.com/search?q=<%=term%>&f=video&p=<%page%>');
                var _term = s.words(term).join('+');
                var rs = Async.runSync(function (done) {
                    //var Xray = Meteor.npmRequire('x-ray'),
                    var x = Xray();
                    var url = searchUrl({page: page, term: _term});
                    x(url, '#video_content', {
                        items: x('ul.vids li.thumbbox', [
                            {
                                id: 'a.thumb_click img@id',
                                thumbnail: 'a.thumb_click img@src',
                                title: 'h1.mtitle@title',
                                href: 'a.thumb_click@href'
                            }
                        ])
                    })
                    (function (error, data) {
                        if (error) done(error, null);
                        if (data) done(null, _.map(data.items, function (i) {
                            return _.extend(i, {source: 'MADTHUMBS'})
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
        madthumbs_detail: function (movieUrl) {
            try {
                var rs = Async.runSync(function (done) {
                    var Xray = Meteor.npmRequire('x-ray'),
                        x = Xray();

                    x(movieUrl, {
                        id: '',
                        title: 'meta[property="og:title"]@content',
                        description: 'meta[property="og:description"]@content',
                        poster: '#thePlayer img.splash@src',
                        tags: ['div.s.categories a@text']
                    })
                    (function (error, data) {
                        if (error) done(error, null);
                        if (data) {
                            var videoId = 'vid_' + s.strRightBack(movieUrl, '/');
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