Videos = new Mongo.Collection(null);

Template.grabTube.viewmodel({
    Term : '',
    doSearch : function(e){
        e.preventDefault();
        Videos.remove({});
        var self = this;
        var term = self.Term();
        Meteor.call('doSearchTubeSites', term, function(error, data){
            if(error) console.error(error);
            if(data){
                _.each(data, function(movie){
                    Videos.insert(movie);
                });
                self.Term('');
            }
        })
    },
    videos : function(){
        return Videos.find();
    }
})