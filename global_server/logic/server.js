
const util = require('util');
const { COMMAND_TYPE, redis_command } = require('../../common/db/redis_mgr.js');
const redis_mgr = require('../../common/db/redis_mgr.js');

function Server() {
    this.servers = {                    // 全部World服
        // sid: [ip, port],             // 服务器ID: [地址, 端口]
    };
}

Server.prototype = {
    init: function (callback) {
        setTimeout(function () {
            var onCallBack = function (err, result) {
                if (result) {
                    this.servers = JSON.parse(result);
                }
                DEBUG('servers: ')
                DEBUG(this.servers);
                callback && callback(true);
            }
            redis_command(redis_mgr.REDIS_DEFAULT_INDEX, COMMAND_TYPE.GET, 'global_servers', null, onCallBack.bind(this));
            // gCache.get('global_servers', function(err, result) {
            //     if (result) {
            //         this.servers = JSON.parse(result);
            //     }
            //     DEBUG('servers: ')
            //     DEBUG(this.servers);
            //     callback && callback(true);
            // }.bind(this));

        }.bind(this), 1000);
    },

    save: function (callback) {
        redis_command(redis_mgr.REDIS_DEFAULT_INDEX, COMMAND_TYPE.SET, 'global_servers', util.format('%j', this.servers));
        // gCache.set('global_servers', util.format('%j', this.servers));
        callback(true);
    },
};

exports.register_server = function (req, res, resp, onReqHandled) {
    var args = req.args;
    gServer.servers[args.sid] = [args.ip, args.port];
    onReqHandled(res, resp, 1);
};

exports.Server = Server;
