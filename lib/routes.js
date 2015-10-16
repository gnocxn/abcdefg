if(Meteor.isClient){
    BlazeLayout.setRoot('body');
}

FlowRouter.route('/',{
    name : 'home',
    action : function(p, q){
        BlazeLayout.render('defaultLayout',{ top : 'nav', main : 'home'})
    }
});

FlowRouter.route('/jobs',{
    name : 'jobs',
    subscriptions : function(p, q){
        this.register('total_jobs_step1', Meteor.subscribe('total_jobs_step1'));
        this.register('total_jobs_step1_ready', Meteor.subscribe('total_jobs_step1_ready'));
        this.register('total_jobs_step1_running', Meteor.subscribe('total_jobs_step1_running'));
        this.register('total_jobs_step1_completed', Meteor.subscribe('total_jobs_step1_completed'));

        this.register('total_jobs_step2', Meteor.subscribe('total_jobs_step2'));
        this.register('total_jobs_step2_ready', Meteor.subscribe('total_jobs_step2_ready'));
        this.register('total_jobs_step2_running', Meteor.subscribe('total_jobs_step2_running'));
        this.register('total_jobs_step2_completed', Meteor.subscribe('total_jobs_step2_completed'));

        this.register('total_jobs_tags', Meteor.subscribe('total_jobs_tags'));
        this.register('total_jobs_tags_ready', Meteor.subscribe('total_jobs_tags_ready'));
        this.register('total_jobs_tags_running', Meteor.subscribe('total_jobs_tags_running'));
        this.register('total_jobs_tags_completed', Meteor.subscribe('total_jobs_tags_completed'));


        this.register('total_gifs', Meteor.subscribe('total_gifs'));
        this.register('total_gifs_completed', Meteor.subscribe('total_gifs_completed'));
        this.register('total_movies', Meteor.subscribe('total_movies'));

    },
    action : function(p, q){
        BlazeLayout.render('defaultLayout',{ top : 'nav', main : 'jobs'})
    }
});