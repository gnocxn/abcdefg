if (Meteor.isClient) {
    BlazeLayout.setRoot('body');
}

FlowRouter.route('/', {
    name: 'home',
    action: function (p, q) {
        BlazeLayout.render('defaultLayout', {top: 'nav', main: 'home'})
    }
});

FlowRouter.route('/jobs', {
    name: 'jobs',
    action: function (p, q) {
        BlazeLayout.render('defaultLayout', {top: 'nav', main: 'jobs'})
    }
});

var subs = new SubsManager();

FlowRouter.route('/xtube', {
    name: 'xtube',
    subscriptions: function (p, q) {
        this.register('gayporn-movies', subs.subscribe('get_gayPorns'));
    },
    action: function (p, q) {
        BlazeLayout.render('defaultLayout', {top: 'nav', main: 'listGayPorns'})
    }
});

FlowRouter.route('/', {
    name: 'local',
    action: function (p, q) {
        BlazeLayout.render('defaultLayout',{top : 'nav', main : ''})
    }
})