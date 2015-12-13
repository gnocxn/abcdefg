// Write your package code here!
if (Meteor.isServer) {
    Meteor.methods({
        imagefap_Search: function (term, limit, page) {
            try {
                check(term, String);
                var searchUrlTpl = _.template('http://www.imagefap.com/gallery.php?type=1&gen=0&search=<%=term%>&sort=quality&perpage=<%=limit%>&order=1'),
                    searchUrl = searchUrlTpl({term: encodeURI(term), limit : limit || 50});
                /*var r = request.getSync(searchUrl,{encoding : 'utf8'});
                console.log(r.body);*/
                var rs = Async.runSync(function (done) {
                    /*var x = Xray();
                    x(searchUrl, '.gallerylist',{
                        items : x('table tr',[{
                            id : 'table tr[id]@id',
                            title : 'table tr[id] a.gal_title b',
                            href : 'table tr[id] a.gal_title@href'
                        }])(function(error, data){
                            if(error) done(error, null);
                            if(data && data.items) done(null, data.items);
                        })
                    })*/
                    osmosis
                        .get(searchUrl)
                        .set({
                            items : [{}]
                        })
                });
                if(rs.error) throw new Meteor.Error(rs.error);
                if(rs.result) return rs.result;
            } catch (ex) {
                console.log('Error', ex);
                throw new Meteor.Error(ex);
            }
        }
    })
}