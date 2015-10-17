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
        concurrency: 3,
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
        concurrency: 3,
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

    myJobs.processJobs('upload_step_1', function (job, cb) {
        console.log('JOB : Upload step 1 started');
        var movie = Meteor.call('upload_step1');
        if (movie && movie.movieId) {
            var newJob = new Job(myJobs, 'upload_step_2', {movie: movie});
            var second = _.random(30, 70);
            newJob.delay(second * 1000).save();
            console.log('JOB : Upload step 1 finished', movie.movieId);
            job.done();
            cb()
        }
    });

    myJobs.processJobs('upload_step_2', function (job, cb) {
        var movie = job.data.movie;
        if(movie && movie.movieId){
            console.log('JOB : Upload step 2 started',movie.movieId);
            var movieId = Meteor.call('upload_step2', movie);
            if(movieId !== 'FAILED'){
                var newJob = new Job(myJobs, 'upload_step_3', {movieId : movieId});
                var second = _.random(120, 300);
                newJob.delay(second * 1000).save();
                console.log('JOB : Upload step 2 finished', movie.movieId);
                job.done();
                cb()
            }
        }
    });

    myJobs.processJobs('upload_step_3', function (job, cb) {
        var movieId = job.data.movieId;
        if(movieId){
            var result = Meteor.call('upload_step3', movieId);
            if(result === true){
                var newJob = new Job(myJobs, 'upload_step_1');
                var minute = (15 * 60 * 1000); // 15 minutes upload 1 movie to queue
                newJob.delay(minute).save();
                job.done();
                cb();
            }
        }
    });
}