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
    action : function(p, q){
        BlazeLayout.render('defaultLayout',{ top : 'nav', main : 'jobs'})
    }
});