if (Meteor.isServer) {
    Meteor.methods({
        doSearchTubeSites: function (term) {
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
        }
    })
}