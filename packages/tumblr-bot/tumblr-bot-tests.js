// Write your tests here!
// Here is an example.
Tinytest.add('test Tumblr client', function(t){
    var bot = new TumblrBot();

    var data = bot.userInfo();
    t.equal('p0rnhunt', data.user.name);
    t.equal('Porn Hunter', data.user.blogs[0].title);

    /*var image = 'http://www.tapchidanong.org/product_images/uploaded_images/hot-girl-3287387287-4-.jpg'
    data = bot.photo(image);
    console.log(data);*/
    var video = 'http://cdn1a.limg.pornhub.phncdn.com/pics/gifs/003/033/481/3033481a.mp4';
    data = bot.video(video);
    console.log(data);
});
