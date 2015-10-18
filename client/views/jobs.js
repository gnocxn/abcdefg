/*var subs = new SubsManager();*/
Template.jobs.onCreated(function () {
    var self = this;
    self.autorun(function (c) {
        var a = self.subscribe('total_jobs_step1');
        var b = self.subscribe('total_jobs_step1_ready');
        var c = self.subscribe('total_jobs_step1_running');
        var d = self.subscribe('total_jobs_step1_completed');

        var e = self.subscribe('total_jobs_step2');
        var f = self.subscribe('total_jobs_step2_ready');
        var g = self.subscribe('total_jobs_step2_running');
        var h = self.subscribe('total_jobs_step2_completed');

        var j = self.subscribe('total_jobs_tags');
        var k = self.subscribe('total_jobs_tags_ready');
        var l = self.subscribe('total_jobs_tags_running');
        var z = self.subscribe('total_jobs_tags_completed');


        var x = self.subscribe('total_gifs');
        var v = self.subscribe('total_gifs_completed');
        var y = self.subscribe('total_movies');
        var z = self.subscribe('total_movies_posted');

        /*if(a.ready() && b.ready() && c.ready() && d.ready() && e.ready() && f.ready() && g.ready() && h.ready() && j.ready() )*/
    })
})