if(Meteor.isServer){
    Meteor.publish('total_jobs_step1',function(){
        Counts.publish(this, 'total_jobs_step1',myJobs.find({type : 'fetch_gifs_pornhub_step1'}));
    });

    Meteor.publish('total_jobs_step1_ready',function(){
        Counts.publish(this, 'total_jobs_step1_ready',myJobs.find({type : 'fetch_gifs_pornhub_step1', status : 'ready'}));
    });

    Meteor.publish('total_jobs_step1_running',function(){
        Counts.publish(this, 'total_jobs_step1_running',myJobs.find({type : 'fetch_gifs_pornhub_step1', status : 'running'}));
    });

    Meteor.publish('total_jobs_step1_completed',function(){
        Counts.publish(this, 'total_jobs_step1_completed',myJobs.find({type : 'fetch_gifs_pornhub_step1', status : 'completed'}));
    });

    Meteor.publish('total_jobs_step2',function(){
        Counts.publish(this, 'total_jobs_step2',myJobs.find({type : 'fetch_gifs_pornhub_step2'}));
    });

    Meteor.publish('total_jobs_step2_ready',function(){
        Counts.publish(this, 'total_jobs_step2_ready',myJobs.find({type : 'fetch_gifs_pornhub_step2', status : 'ready'}));
    });

    Meteor.publish('total_jobs_step2_running',function(){
        Counts.publish(this, 'total_jobs_step2_running',myJobs.find({type : 'fetch_gifs_pornhub_step2',status : 'running'}));
    });

    Meteor.publish('total_jobs_step2_completed',function(){
        Counts.publish(this, 'total_jobs_step2_completed',myJobs.find({type : 'fetch_gifs_pornhub_step2', status : 'completed'}));
    });

    Meteor.publish('total_jobs_tags',function(){
        Counts.publish(this, 'total_jobs_tags',myJobs.find({type : 'fetch_gifs_pornhub_updateTags'}));
    });

    Meteor.publish('total_jobs_tags_ready',function(){
        Counts.publish(this, 'total_jobs_tags_ready',myJobs.find({type : 'fetch_gifs_pornhub_updateTags', status : 'ready'}));
    });

    Meteor.publish('total_jobs_tags_running',function(){
        Counts.publish(this, 'total_jobs_tags_running',myJobs.find({type : 'fetch_gifs_pornhub_updateTags',status : 'running'}));
    });

    Meteor.publish('total_jobs_tags_completed',function(){
        Counts.publish(this, 'total_jobs_tags_completed',myJobs.find({type : 'fetch_gifs_pornhub_updateTags', status : 'completed'}));
    });

    Meteor.publish('total_gifs',function(){
        Counts.publish(this, 'total_gifs',PORNHUBGIFS.find());
    });

    Meteor.publish('total_gifs_completed',function(){
        Counts.publish(this, 'total_gifs_completed',PORNHUBGIFS.find({isFetchDone : true}));
    });

    Meteor.publish('total_movies',function(){
        Counts.publish(this, 'total_movies',PORNHUBMOVIES.find());
    });

    Meteor.publish('total_movies_posted',function(){
        Counts.publish(this, 'total_movies_posted',PORNHUBMOVIES.find({isAlreadyPost2Tumblr : true}));
    });
}