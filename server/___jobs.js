if (Meteor.isServer) {
    myJobs.processJobs('fetch_gifs_pornhub_step1',{
        concurrency: 2,
        payload: 1,
        pollInterval: 5000,
        prefetch: 1
    }, function (job, cb) {
        var page = job.data.page;
        console.log('JOB : Fetch Step 1 started', page);
        var ids = Meteor.call('fetch_gifs_pornhub_step1', page);
        if (ids.length > 0) {
            _.each(ids, function (id) {
                var newJob = new Job(myJobs, 'fetch_gifs_pornhub_step2', {_gId: id});
                var second = _.random(40, 70);
                newJob.delay(second * 1000).save();
            });
        }
        console.log('JOB : Fetch Step 1 finished', page);
        job.done();
        cb();
    });

    myJobs.processJobs('fetch_gifs_pornhub_step2',{
        concurrency: 7,
        payload: 1,
        pollInterval: 5000,
        prefetch: 1
    }, function (job, cb) {
        var id = job.data._gId;
        console.log('JOB : Fetch Step 2 started', id);
        var gId = Meteor.call('fetch_gifs_pornhub_step2', id);
        if (gId !== 'FAILED') {
            var newJob = new Job(myJobs, 'fetch_gifs_pornhub_updateTags', {_gId: gId});
            var second = _.random(30, 70);
            newJob.delay(second * 1000).save();
            console.log('JOB : Fetch Step 2 finished', gId);
            job.done();
            cb();
        }
    });

    myJobs.processJobs('fetch_gifs_pornhub_updateTags',{
        concurrency: 5,
        payload: 1,
        pollInterval: 5000,
        prefetch: 1
    }, function (job, cb) {
        var id = job.data._gId;
        console.log('JOB : Fetch tags started', id);
        var result = Meteor.call('fetch_gifs_pornhub_updateTags', id);
        if (result) {
            console.log('JOB : Fetch tags finished', id);
            job.done();
            cb()
        }
    });
}