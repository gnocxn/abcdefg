/*var subs = new SubsManager();*/
Template.jobs.onCreated(function(){
    var self = this;
    self.autorun(function(c){
        self.subscribe('total_jobs_step1');
        self.subscribe('total_jobs_step1_ready');
        self.subscribe('total_jobs_step1_running');
        self.subscribe('total_jobs_step1_completed');

        self.subscribe('total_jobs_step2');
        self.subscribe('total_jobs_step2_ready');
        self.subscribe('total_jobs_step2_running');
        self.subscribe('total_jobs_step2_completed');

        self.subscribe('total_jobs_tags');
        self.subscribe('total_jobs_tags_ready');
        self.subscribe('total_jobs_tags_running');
        self.subscribe('total_jobs_tags_completed');


        self.subscribe('total_gifs');
        self.subscribe('total_gifs_completed');
        self.subscribe('total_movies');
        self.subscribe('total_movies_posted');
    })
})