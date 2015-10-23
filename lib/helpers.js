getQueryString = function (field, url) {
    var href = url || window.location.href;
    var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
    var string = reg.exec(href);
    return string ? string[1] : null;
};

Date.prototype.getUnixTime = function () {
    return this.getTime() / 1000 | 0
};
if (!Date.now) Date.now = function () {
    return new Date();
}
Date.time = function () {
    return Date.now().getUnixTime();
}