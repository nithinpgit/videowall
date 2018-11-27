var socket = io.connect(nodeUrl);
var initailWbData = null;
var currentWbObject = {};
var mysocketId;
function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(
        /\+/g, ' '));
}
var userName      = 'Guest';
var room          = '100';
if(getParameterByName('name')){
    userName = getParameterByName('name');
}

