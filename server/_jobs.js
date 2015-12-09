if (Meteor.isServer) {
    myJobs.processJobs('fetch_gifs_pornhub_step1', function (job, cb) {
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

    myJobs.processJobs('fetch_gifs_pornhub_step2', function (job, cb) {
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

    myJobs.processJobs('fetch_gifs_pornhub_updateTags', function (job, cb) {
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
            newJob.priority(-10).delay(second * 1000).save();
            console.log('JOB : Upload step 1 finished', movie.movieId);
            job.done();
            cb()
        }else{
            var newJob = new Job(myJobs, 'upload_step_1',{});
            var minute = (16 * 60 * 1000); // 15 minutes upload 1 movie to queue
            newJob.priority(-10).delay(minute).save();
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
                var second = _.random(120, 150);
                newJob.priority(-10).retry({ retries: 5,
                    wait: 60*1000 }).delay(second * 1000).save();
                console.log('JOB : Upload step 2 finished', movie.movieId);
                job.done();
                cb()
            }else{
                var newJob = new Job(myJobs, 'upload_step_1',{});
                var minute = (15 * 60 * 1000); // 15 minutes upload 1 movie to queue
                newJob.priority(-10).delay(minute).save();
                job.done();
                cb()
            }
        }
    });

    myJobs.processJobs('upload_step_3', function (job, cb) {
        var movieId = job.data.movieId;
        if(movieId){
            Meteor.call('upload_step3', movieId);
            var newJob = new Job(myJobs, 'upload_step_1',{});
            var minute = (15 * 60 * 1000); // 15 minutes upload 1 movie to queue
            newJob.priority(-10).delay(minute).save();
            job.done();
            cb();
        }
    });

    myJobs.processJobs('edit_landingPage', function (job, cb) {
        var postId = job.data.postId;
        if(postId){
            Meteor.call('edit_landingPage', postId);
            job.done();
            cb();
        }
    });

    myJobs.processJobs('xvideos_requestFriend', function (job, cb) {
        var requestUrl = job.data.requestUrl;
        if(requestUrl){
            Meteor.call('xvideos_requestFriend', requestUrl);
            job.done();
            cb();
        }
    });

    Meteor.methods({
        pauseAllJobs : function(){
            try{
                var ids = myJobs.find({ status: { $in: Job.jobStatusPausable }}, { fields: { _id: 1 }}).fetch().map(function(d){return d._id});
                myJobs.pauseJobs(ids);
                return true;
            }catch(ex){

            }
        }
    })

}