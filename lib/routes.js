if(Meteor.isClient){
    BlazeLayout.setRoot('body');
}

FlowRouter.route('/',{
    name : 'home',
    action : function(p, q){
        BlazeLayout.render('defaultLayout',{ top : 'nav', main : 'home'})
    }
});

var subs = new SubsManager();

FlowRouter.route('/jobs',{
    name : 'jobs',
    subscriptions : function(p, q){
        /*this.register('total_jobs_step1', subs.subscribe('total_jobs_step1'));
        this.register('total_jobs_step1_ready', subs.subscribe('total_jobs_step1_ready'));
        this.register('total_jobs_step1_running', subs.subscribe('total_jobs_step1_running'));
        this.register('total_jobs_step1_completed', subs.subscribe('total_jobs_step1_completed'));

        this.register('total_jobs_step2', subs.subscribe('total_jobs_step2'));
        this.register('total_jobs_step2_ready', subs.subscribe('total_jobs_step2_ready'));
        this.register('total_jobs_step2_running', subs.subscribe('total_jobs_step2_running'));
        this.register('total_jobs_step2_completed', subs.subscribe('total_jobs_step2_completed'));

        this.register('total_jobs_tags', subs.subscribe('total_jobs_tags'));
        this.register('total_jobs_tags_ready', subs.subscribe('total_jobs_tags_ready'));
        this.register('total_jobs_tags_running', subs.subscribe('total_jobs_tags_running'));
        this.register('total_jobs_tags_completed', subs.subscribe('total_jobs_tags_completed'));


        this.register('total_gifs', subs.subscribe('total_gifs'));
        this.register('total_gifs_completed', subs.subscribe('total_gifs_completed'));
        this.register('total_movies', subs.subscribe('total_movies'));
        this.register('total_movies_posted', subs.subscribe('total_movies_posted'));*/

    },
    action : function(p, q){
        BlazeLayout.render('defaultLayout',{ top : 'nav', main : 'jobs'})
    }
});