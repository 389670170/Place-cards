
const { ServerName } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');

exports.get = function (player, req, resp, onHandled) {
    requestWorld(req, resp, function(){
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        onHandled();
    });
}
