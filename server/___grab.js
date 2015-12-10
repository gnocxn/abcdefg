if (Meteor.isServer) {
    Meteor.methods({
/*        doSearchTubeSites: function (term) {
            var rs = Async.runSync(function (done) {
                async.parallel([
                    function (cb) {
                        var result = Meteor.call('porntube_Search', term);
                        cb(null, result.items || []);
                    },
                    function (cb) {
                        var result = Meteor.call('_4tube_Search', term);
                        cb(null, result.items || []);
                    },
                    function (cb) {
                        var result = Meteor.call('madthumbs_Search', term);
                        cb(null, result.items || []);
                    },
                    function (cb) {
                        var result = Meteor.call('tnaflix_Search', term);
                        cb(null, result.items || []);
                    },
                    function (cb) {
                        var result = Meteor.call('empflix_Search', term);
                        cb(null, result.items || []);
                    }
                ], function (err, results) {
                    if (err) done(err, null);
                    if (results) {
                        var _results = [];
                        _.each(results, function (r) {
                            _results = _.union(_results, r);
                        });
                        done(null, _results);
                    }
                });
            });
            return rs.result;
        },*/
        doSearchTubeSites: function (methods, term, page) {
            try {
                check(methods, [String]);
                check(term, String);
                //check(page, String);
                var rs = Async.runSync(function (done) {
                    async.concat(methods,
                        function (method, cb) {
                            var result = Meteor.call(method, term, page);
                            cb(null, result || []);
                        },
                        function (error, result) {
                            if(error) done(error, null);
                            if(result){
                                done(null, result)
                            }
                        })
                });
                return rs.result;
            } catch (ex) {
                throw new Meteor.Error(ex);
            }
        }
    })
}