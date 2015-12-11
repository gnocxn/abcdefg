// Write your package code here!
if(Meteor.isServer){
    Meteor.methods({
        mylust_Search : function(term, page){
            try {
                var page = page || 0;
                check(term, String);
                var searchUrl = _.template('http://mylust.com/search/<%=page%>/?q=<%=term%>');
                var _term = s.words(term).join('+');
                var rs = Async.runSync(function (done) {
                    //var Xray = Meteor.npmRequire('x-ray'),
                    var x = Xray();
                    var url = searchUrl({page: page, term: _term});
                    x(url, '.list_videos', {
                        items: x('li', [
                            {
                                id: 'a@data-id',
                                thumbnail: 'img.thumb@src',
                                title: 'a@title',
                                href: 'a@href'
                            }
                        ])
                    })
                    (function (error, data) {
                        if (error) done(error, null);
                        if (data) done(null, _.map(data.items, function (i) {
                            return _.extend(i, {source: 'MYLUST'})
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
        mylust_detail : function(movieUrl){
            try {
                var rs = Async.runSync(function (done) {
                    var Xray = Meteor.npmRequire('x-ray'),
                        x = Xray();
                    x(movieUrl, {
                        title: 'h1[itemprop="name"]@text',
                        poster: 'meta[itemprop="thumbnailUrl"]@content',
                        tags: ['.row.categories > .body > a@text']
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