Template.home.onCreated(function(){
    var self = this;
    self.disabledButton = new ReactiveVar();
    self.disabledButton.set(false);
});

Template.home.helpers({
    disabledButton : function(){
        var t = Template.instance();
        return (t.disabledButton && t.disabledButton.get()) ? 'disabled' : ''
    }
})

Template.home.events({
    'click #btnUpdateAll' : function(e,t){
        e.preventDefault();
        t.disabledButton.set(true);
        Meteor.call('tblr_updateAllInformation', function(err, rs){
            if(err) FlashMessages.sendError(err, { hideDelay: 2000 });
            FlashMessages.sendSuccess(rs, { hideDelay: 5000 });
            t.disabledButton.set(false);
        })
    },
    'click #btnFollowFromFollowers' : function(e,t){
        e.preventDefault();
        t.disabledButton.set(true);
        Meteor.call('tblr_autoFollowingFromFollowers', function(err, rs){
            if(err) FlashMessages.sendError(err, { hideDelay: 2000 });
            FlashMessages.sendSuccess(rs, { hideDelay: 10000 });
            t.disabledButton.set(false);
        })
    }
})