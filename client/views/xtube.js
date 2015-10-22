Template.listGayPorns.events({
    'click #btnGetVideo' : function(e,t){
        e.preventDefault();
        var videoUrl = t.$('#txtVideoUrl').val();
        if(videoUrl){
            Meteor.call('xtube_grabInfo', videoUrl, function(err, rs){
                if(err){
                    console.error(err);
                }
                if(rs){
                    console.info(rs);
                    t.$('#txtVideoUrl').val('');
                }
            })
        }
    }
});

Template.listGayPorns.helpers({
    settings : function(){
        var gayCollection = GAYPORNS.find();
        return {
            collection : gayCollection,
            rowsPerPage: 10,
            showFilter: true,
            fields: [
                {key : 'title', label : 'Title', sortOrder : 1, sortDirection: 'ascending'},
                {key : 'duration', label : 'Duration', sortOrder : 2, sortDirection: 'descending'},
                {key : 'updatedAt', label : 'Updated At', sortOrder : 0, sortDirection: 'descending'},
                {key : '_id', label : '', tmpl:  Template.gay_controls},
            ]
        }
    }
})