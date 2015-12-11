Videos = new Mongo.Collection(null);

Template.grabTube.viewmodel({
    Term : '',
    Page : 1,
    TubeSites : function(){
        return Meteor.settings.public.TubeSites || [];
    },
    selectedTubes : [],
    readyForSearch : function(){
        return this.Term() && this.selectedTubes().length > 0;
    },
    isSearching : false,
    doSearch : function(e){
        e.preventDefault();
        Videos.remove({});
        var self = this;
        var term = self.Term();
        var page = self.Page();
        var selectedTubes = _.map(self.selectedTubes(),function(i){ return i});
        self.isSearching(true);
        Meteor.call('doSearchTubeSites', selectedTubes, term, page, function(error,data){
            self.isSearching(false);
            if(error) console.error(error);
            if(data){
                _.each(data, function(movie){
                    Videos.insert(movie);
                });
                /*self.Term('');
                self.selectedTubes([]);*/
            }
        })
    },
    ClearAll : function(e){
        e.preventDefault();
        this.Term('');
        this.Page(1);
        this.selectedTubes([]);
        Videos.remove({});
    },
    videos : function(){
        return Videos.find();
    }
});

Template.grabTube_item.viewmodel({

})