/*
    Game服务器
    Debug模式: node game.js debugger,zzx,zzx1
    Game模式:  node game.js serverId
*/
require('../common/global.js');
require('../common/logger.js');

const util = require('util');
const clone = require('clone');
const fs = require('fs');
const common = require('../common/common.js');
const redis_mgr = require('../common/db/redis_mgr.js');
const PlayerManager = require('./logic/player_manager.js');
const { ServerName, NET_TYPE } = require('../common/enum.js');
const { ERROR, INFO, LOG } = require('../common/logger.js');
const { startWebServer, loadGlobalServerConf, requestPHP, LogError } = require('../common/server.js');
const { loadCache } = require('../common/db/redis_mgr.js');
const { loadDB } = require("../common/db/mongo_mgr.js");
const { loadConf, scheduleActivity } = require('../common/conf_mgr.js');
const { client_send_msg } = require('../common/net/ws_client.js');

global.config = require(process.argv[2]);
const logic = require('./logic');

global.gDBUser = null;
global.gDBAnalysis = null;

global.gTimezone = (new Date()).getTimezoneOffset() / -60;

// delete this
global.debugging = true;
global.gVerify = 0;
global.gCDKey = 1;

// 欧美，关闭CDKEY
if (config.platform == 'facebook') {
    global.gCDKey = 0;
}

global.gAuthTimes = {};

// 要统计的项目
var guide_items = {
    'guide_city': 1,    // 出主城
    'guide_dragon': 7,    // 开启火龙
    'guide_help': 13,   // 开启救公主
    'guide_arena': 25,   // 竞技场引导结束
}

const server_list = [
    // ServerName.ARENA,
    // ServerName.COUNTRY_WAR,
    // ServerName.GLOBAL,
    // ServerName.WORLD_WAR,
    // ServerName.LAND_GRABBER,
    // ServerName.LEGION_WAR,
    // ServerName.TEAM_ZONE,
    // ServerName.TERRITORY_WAR,

    ServerName.WORLD,
    // ServerName.GATE_WAY,
    ServerName.WSS,
]
var serverId;

main();

function main() {
    serverId = parseInt(process.argv[process.argv.length - 1]);
    setupLog('game' + serverId);
    CreateLoggerDB();
    if (isNaN(serverId) || serverId <= 0 || serverId > config.GameCount) {
        ERROR('invalid game serverid');
        process.exit(-1);
    }

    loadConf(config, ServerName.GAME);
    scheduleActivity();

    redis_mgr.REDIS_GLOBAL_CHAT_INDEX = config.RedisChatId;
    loadCache(config, [config.RedisId, config.RedisChatId]);

    loadGlobalServerConf(config, ServerName.GAME, () => {
        loadDB(config, onLoadDB);
    });
}

function onLoadDB(db) {
    // 启动Game服务器
    INFO('mongodb connected');
    global.gDBUser = db.collection('user');
    global.gDBAnalysis = db.collection('analysis');
    global.gDBPlat = db.collection('plat');

    startWebServer(ServerName.GAME, serverId, server_list, null, onNetHandler, null, onHttpExit);//, null, onNetHandler, onHttpExit);

    initLogicMod();

    setInterval(tick, 1000);
}

function onHttpExit(callback) {

    // 退出处理
    var loader = new common.Loader(callback);
    loader.addLoad('empty');    // 防止没有需要Load的时候不结束
    // delete this
    DEBUG('start stopping : ' + (new Date()) / 1000);

    ///////////////////

    var players = PlayerManager.get_now_players;
    for (var uid in players) {
        var player = players[uid];
        loader.addLoad(1);

        player.exit(() => {
            loader.onLoad(1);
        });
    }
    loader.onLoad('empty');
    SaveLog(function () {
        console.log("保存玩家日志..................完成");
    });
}

function onHttpHandler(query, res, resp) {
    do {
        var now = common.getTime();

        if (config.develop && !query.auth_time && !query.auth_key && !query.stime) {
            query.auth_time = gAuthTimes[query.uid] || now - 1;
            query.auth_key = common.sha1(query.uid + '-' + query.auth_time).substring(0, 10);
            query.stime = common.getTime();
            query.sig = common.genHack(+query.seq, +query.stime, JSON.parse(res._args));
        }

        if (query.mod != 'gm' || query.act == 'refresh_pay') {
            if (!query.auth_key || !query.auth_time || isNaN(query.auth_time)) {
                resp.code = 1; resp.desc = 'no auth_key, auth_time'; break;
            }

            var authTime = +query.auth_time;
            var uid = +query.uid;
            var key = query.auth_key;

            var curTime = common.getTime();
            var transTime = Math.abs(curTime - query.stime);
            if (transTime >= 2) {
                var clientSendTimeString = common.getDateTimeString(query.stime);
                var curTimeString = common.getDateTimeString(curTime);
                ERROR(util.format('[%s]-[%s], delay time = %d %s %s %s', clientSendTimeString, curTimeString, transTime, query.uid, query.mod, query.act));
            }

            if (!config.NoHack) {
                // 服务器重启，以及更改时间, 踢掉所有人
                if (authTime < common.SERVER_START_TIME || now < authTime) {
                    resp.code = 2; resp.desc = 'restart or change time'; break;
                }

                if (isNaN(query.stime) || !query.sig || (Math.abs(common.getTime() - query.stime) > 60) || !common.verifyHack(+query.seq, +query.stime, query.sig, res._args)) {
                    if (PlayerManager.is_player_now_exist(uid)) {
                        PlayerManager.kick(uid)
                        DEBUG(`kick:   ${common.getTime()}`)
                        DEBUG(query)
                    }
                    resp.data = query;
                    resp.code = 4; resp.desc = 'hack'; break;
                }

                if (!query.seq && (query.act != 'login' && query.act != 'refresh_pay' && query.act != 'handshake')) {
                    resp.code = 1; resp.desc = 'no sequence'; break;
                }
            }

            // 每天到点踢掉所有人
            if (authTime < getResetTime()) {
                resp.code = 5; resp.desc = 'reset all'; break;
            }

            if (query.mod == 'user' && query.act == 'login') {
                query.args.ip = res._ip;
                gAuthTimes[uid] = authTime;
            } else {
                // 玩家数据必须已经加载，否则视为长时间未操作
                if (!config.NoHack && !config.develop) {
                    if (!PlayerManager.is_player_now_exist(uid)) {
                        DEBUG(`zcg long no opration:   ${common.getTime()}`)
                        DEBUG(query)
                        resp.code = 4; resp.desc = 'long no opration'; break;
                    }
                    if (authTime != gAuthTimes[uid]) {
                        resp.code = 3; resp.desc = 'logined on another device'; break;
                    }
                }
            }

            // 你的账号在别的设备登录了
            if (!config.NoHack && !common.verifyAuth(uid, key, authTime)) {
                resp.code = 2; resp.desc = 'verify fail'; break;
            }
        } else if (query.act == 'reload') {
            initLogicMod();

            loadConf(config, ServerName.GAME);
            scheduleActivity();
            // requestWorld(query, {});
            client_send_msg(ServerName.WORLD, query.act, query.mod, query.args, {});
            global.gc();
            resp.code = 0; resp.desc = 'reload success';
            break;
        } else {
            query.ip = res._ip;
        }
    } while (false);
    return resp;
}

function onSocketUserHandler(query, res, resp) {
    resp.code = 1;
    if (!query.uid) {
        resp.desc = 'no uid';
        return;
    }

    if (!query.mod) {
        resp.desc = 'no mod';
        return;
    }

    if (!query.act) {
        resp.desc = 'no act';
        return;
    }

    if (!query.args) {
        resp.desc = 'no args';
        return;
    }

    if (typeof query.args != 'object') {
        resp.desc = 'args not in json format';
        return;
    }

    // if (query.mod != 'user' && query.act != 'handshake' && (!gUsers[query.uid] || gUsers[query.uid].conn != query.conn)) {
    //     resp.desc = 'not handshake';
    //     return;
    // }

    resp.code = 0;
    return resp;
}

function onSocketServerHandler(query, res, resp) {
    resp.code = 1;

    if (!query.mod) {
        resp.desc = 'no mod';
        return;
    }

    if (!query.act) {
        resp.desc = 'no act';
        return;
    }

    if (!query.args) {
        resp.desc = 'no args';
        return;
    }

    if (typeof query.args != 'object') {
        resp.desc = 'args not in json format';
        return;
    }

    // if (query.mod != 'user' && query.act != 'handshake' && (!gUsers[query.uid] || gUsers[query.uid].conn != query.conn)) {
    //     resp.desc = 'not handshake';
    //     return;
    // }

    resp.code = 0;
    return resp;
}

function onNetHandler(net_type, query, res, resp, onReqHandled) {
    switch (net_type) {
        case NET_TYPE.WEB_SOCKET_SERVER:
            resp = onSocketServerHandler(query, res, resp);
            break;
        case NET_TYPE.WEB_SOCKET_USER:
            resp = onSocketUserHandler(query, res, resp);
            break;
        case NET_TYPE.HTTP_USER:
            resp = onHttpHandler(query, res, resp);
            break;
    }

    var logicHandler = null;
    var module = logic[query.mod];

    if (module) {
        logicHandler = module[query.act];
    } else {
        DEBUG('module ' + query.mod + ' not exist');
    }

    if (!logicHandler) {
        resp.code = 1;
        resp.desc = 'act ' + query.act + ' not support in mod ' + query.mod;
    }

    if (resp.code != 0) {
        onReqHandled(res, resp);
        return;
    }

    var tOnGetPlayer = function (player) {
        try {
            if (query.mod == 'user' && query.act == 'login') {
                player.seq = query.seq - 1;
            }
            handleGameReq(player, query, res, resp, onReqHandled);
        } catch (error) {
            ERROR('cause by ' + query.uid);
            ERROR('query : ' + JSON.stringify(query));
            ERROR(error.stack);
            requestPHP({ uid: query.uid, act: 'mark_error', args: { sid: config.ServerId, server: 'game' } }, {});
            LogError(error.stack);

            // TODO : world报错能反向踢掉game, 踢掉后能先主动断开长连接, 再踢出数据
            //PlayerManager.kick(query.uid);
        }
    }
    PlayerManager.get(query.uid, tOnGetPlayer);
}

function tick() {
    var dt = Date.now();
    update(dt);
    PlayerManager.tick(dt);
    checkGC(dt);
}

var _last_check_gc = 0;
/** 检查是否需要gc */
function checkGC(dt) {
    if (_last_check_gc >= dt) { return; }
    _last_check_gc = dt + 1000 * 3600 * 3;        // 3小时一次
    if (config.Debug) { return; }
    global.gc && global.gc();
}

function update(dt) {
    var now = dt;
    var proiority_list = [];
    for (var mod in logic) {
        if (!logic[mod] || !logic[mod].update) { continue; }
        var update_priority = logic[mod].update_priority || logic[mod].init_priority || logic[mod].priority || Number.MAX_SAFE_INTEGER;
        proiority_list.push({ priority: update_priority, logic: logic[mod] });
    }

    proiority_list = proiority_list.sort((a, b) => { return a.priority - b.priority });
    for (var i = 0; i < proiority_list.length; i++) {
        if (!proiority_list[i] || !proiority_list[i].logic) { continue; }
        if (!proiority_list[i].logic.update) { continue; }
        proiority_list[i].logic.update(now);
    }
}

function initLogicMod() {
    var proiority_list = [];
    for (var mod in logic) {
        if (!logic[mod] || !logic[mod].init) { continue; }
        var init_priority = logic[mod].init_priority || logic[mod].priority || Number.MAX_SAFE_INTEGER;
        proiority_list.push({ priority: init_priority, logic: logic[mod] });
    }

    proiority_list = proiority_list.sort((a, b) => { return a.priority - b.priority });
    for (var i = 0; i < proiority_list.length; i++) {
        if (!proiority_list[i] || !proiority_list[i].logic) { continue; }
        if (!proiority_list[i].logic.init) { continue; }
        proiority_list[i].logic.init();
    }
}

function handleGameReq(player, query, res, resp, onReqHandled) {
    var logicHandler = logic[query.mod][query.act];

    if (config.develop) {
        query.seq = player.seq + 1;
        player.lock = false;
    }

    if (!logicHandler) {
        if (query.mod != 'gm' && query.act != 'reload') {
            resp.code = 1;
            resp.desc = '';
        }
        onReqHandled(res, resp);
    } else if (player.saveError) {
        resp.code = 1;
        resp.desc = 'last save error';
        onReqHandled(res, resp);
    } else if (player.lock && query.seq && query.act != 'handshake') {
        resp.code = 6;
        resp.desc = 'lock in ' + player.action.getEvent();
        onReqHandled(res, resp);
    } else if (+query.seq && query.seq != player.seq + 1) {
        if (query.seq == player.seq && query.mod == player.action.mod && query.act == player.action.act) {
            // 网络异常下的重复收到同一个请求
            resp.code = 7;
            resp.desc = 'repeat request';
            resp = player.action.resp;
            onReqHandled(res, resp);
        } else {
            resp.code = 6;
            resp.desc = 'invalid sequence';
            onReqHandled(res, resp);
        }
    } else {
        if (query.mod != 'user' || query.act != 'handshake') {
            player.lastActive = common.getTime();
            player.user.mark.active_time = player.lastActive;
            player.markDirty('mark.active_time');
        }

        player.lock = true;
        player.seq = +query.seq ? +query.seq : (query.act == 'login' ? +query.seq : player.seq);
        player.action.mod = query.mod;
        player.action.act = query.act;
        player.action.args = query.args;

        // 加打印
        var occur_time = (new Date()).getTime()

        logicHandler(player, query, resp, function () {
            player.lock = false;

            if (resp.code == 0) {
                // 更新新手引导步骤
                if ('guide' in query && player.user.mark.guide != query.guide) {
                    player.user.mark.guide = query.guide;
                    player.markDirty('mark.guide');

                    // 处理运营统计
                    var curTime = common.getTime();
                    var progress = player.user.battle.progress;
                    // var online_stat = player.user.online_stat;

                    // for (var k in guide_items) {
                    //     if (!online_stat[k]) {
                    //         if (progress > guide_items[k]) {
                    //             online_stat[k] = curTime;
                    //             player.markDirty(util.format('online_stat.%s', k));
                    //             DeviceLogCollect(player, k, {}, false);
                    //         }
                    //     }
                    // }
                }

                if (player.hasTip) {
                    resp.data.tips = player.user.tips;
                    player.user.tips = {};
                    player.markDirty('tips');
                }

                // 保存更改数据
                player.save();
            }

            player.action.resp = resp;
            onReqHandled(res, resp);
        });
    }
};


if (process.argv.indexOf('debugger') > 0) {    // Debug 模式
    debugging = true;
    require('../debug.js').Debug();
    return;
}