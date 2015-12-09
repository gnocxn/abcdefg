if (Meteor.isServer) {
    Meteor.methods({
        xvideos_getProfiles: function (url) {
            try {
                var rs = Async.runSync(function (done) {
                    var x = Xray();
                    //x.throttle(5,1000);
                    x(url, ['p.profileName a@href'])
                        //    .paginate('a.nP@href')
                    (function (err, data) {
                        if (err) {
                            done(err, null);
                        }
                        if (data) {
                            done(null, data);
                        }
                    })
                });
                if (rs.result) {
                    var profiles = rs.result;
                    _.each(profiles, function (p) {
                        var request_url = p + '/friend_request/'
                        var newJob = new Job(myJobs, 'xvideos_requestFriend', {requestUrl: request_url});
                        var minute = (_.random(30, 240) * 1000); // 15 minutes upload 1 movie to queue
                        newJob.priority(-10).delay(minute).save();
                    });
                    return true;
                }
            } catch (ex) {
                console.log(ex);
            }
        },
        xvideos_requestFriend: function (url) {
            try {
                var options = {
                    headers: {
                        "Cookie": "HEXAVID_LOGIN=f6b3d9eb5e4421e8Bvb4LM1kkSI_Gu207np0sOBeZVoqSx5vbW41ULUy-45Ed0A-4SB3SSS9lo6nOre7SupSB9waJQpFvHSCXeRG1ZrMgavEyd3ANuTsJOCG_U-NHTV-2w_-72zjv9CqCfNTtAesCYBYk6xsah4XcwHwdcIlNjWmNuF3YeyJyVeNUDUlb0F2OMAcu1Pr5mwA8NU_JKvaL__GthrOOs7IUW1OeIgb81t0vhOhpKEWPXgSucssWlF8nhzSU7y2iWMRu-YZ;",
                        "X-Requested-With": "XMLHttpRequest"
                    }
                }
                var r = request.getSync(url, options);
                console.log(url, r.body);
                return r.body && r.body === 'OK';
            } catch (ex) {
                console.log(ex);
            }
        }
    })
}