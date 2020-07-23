
const common = require('../../common/common.js');
const { forceSyncToWorld } = require('./common.js');
const { Player } = require('./player.js');

var players = {};
/**
 * 获取玩家信息
 * @param {*} uid 
 * @param {*} callback 
 * @param {*} is_now                    参数为true时 如果当前没有数据将会通过load获取
 */
exports.get = function (uid, callback, is_now) {
    var player = players[+uid];
    if (player) {
        callback && callback(player);
    } else if (!is_now) {
        exports.load(+uid, callback);
    }
};

exports.load = function (uid, callback) {
    if (uid != 10000 && isDroid(uid)) {
        DEBUG('can not load a robot player, uid = ' + uid);
        return;
    }

    var player = new Player(+uid);
    player.init({}, (succ) => {
        if (succ) {
            players[player.uid] = player;
            callback && callback(player);
        } else {
            callback && callback(null);
        }
    });
    player.save(true);
};

exports.kick_all = function () {
    for (var uid in players) {
        kick(+uid);
    }
}

/** 玩家数据是否在内存中 */
exports.is_player_now_exist = function (uid) {
    return !!players[uid];
}

/** 获取当前内存中的玩家数据 */
exports.get_now_players = function () {
    return players;
}

/**
 * 踢人下线
 */
function kick(kickedUid) {
    if (!players[kickedUid]) {
        return false;
    }

    var offlines = [];
    var now = common.getTime();

    if (kickedUid && players[kickedUid]) {
        var player = players[kickedUid];
        offlines.push(kickedUid);
    } else {
        for (var uid in players) {
            var player = players[uid];
            if ((now - player.lastActive) > 1800) {
                offlines.push(uid);
            }
            else {
                forceSyncToWorld(uid);
            }
        }
    }

    for (var i = 0, max = offlines.length; i < max; i++) {

        var player = players[offlines[i]];                      // 踢下线前强制保存

        forceSyncToWorld(offlines[i]);                      // 踢下线前更新世界服数据
        player.save(true);

        delete players[offlines[i]];
        delete gAuthTimes[offlines[i]];
    }

    if (offlines.length > 0) {                              // 关闭长连接
        var wssReq = {
            uid: offlines[0],
            mod: 'user',
            act: 'close',
            type: '',
            flag: '',
            args: {
                uids: offlines,
            },
        };
        requestWss(wssReq, {});
    }
    return true;
}
exports.kick = kick;

var old_reset_time = 0;
exports.update = function (now) {
    var tResetTime = getResetTime();
    if (old_reset_time >= tResetTime) { return; }
    old_reset_time = tResetTime;
    kick();
}

exports.init = function () {
    old_reset_time = getResetTime();
}

exports.tick = function (dt) {
    checkAndKickPlayer(dt);
}

var _last_check_kick_time = 0;
/** 检查是否需要把玩家踢掉 */
function checkAndKickPlayer(dt) {
    if (_last_check_kick_time >= dt) { return; }
    _last_check_kick_time = dt + 1000 * 60 * 30;        // 30分钟一次
    kick();
}