/**
 * 跨服竞技场服务器
 */

// global.Player = require('../game/logic/player.js').Player;

const util = require('util');
const clone = require('clone');
const fs = require('fs');
const common = require('../common/common.js');
const { ServerName } = require('../common/enum.js');
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadDB } = require("../common/db/mongo_mgr.js");
const { loadCache } = require('../common/db/redis_mgr.js');
const { loadConf, scheduleActivity } = require('../common/conf_mgr');
const { ARENA_ErrorCode, ARENA_findErrorString } = require('../common/error.js');

global.config = require(process.argv[2]);

var logic = require('./logic/');

require('../common/global.js');

global.gDBUser = null;
global.gDBWorld = null;
// global.gCache = null;

global.gUserInfo = null;
global.gArena = null;
global.gReplay = null;

// 跨服活动数据
global.gActLuckyRotation = null;


var tickInterval = 60 * 30;
var tickCount = 0;

require('../common/logger.js');
setupLog('arena');
function main() {
    var onCacheLoaded = (cache) => {
        // global.gCache = cache;
        // DEBUG('redis connected');
    }

    loadConf(config, ServerName.ARENA);
    scheduleActivity();

    loadCache(config, config.RedisId, onCacheLoaded);

    loadGlobalServerConf(config, ServerName.ARENA, () => {
        loadDB(config, onLoadDB);
    });
}

function onLoadDB(db) {
    gDBUser = db.collection('user');
    gDBWorld = db.collection('world');
    DEBUG('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.ARENA, 0, [], null, onNetHandler, null, onExit);
    };
    loadArenaServer(tOnLoaded);
}

function onNetHandler(net_type, query, res, resp, onReqHandled) {
    if (net_type != NET_TYPE.WEB_SOCKET_SERVER) {
        resp.code = 1;
        resp.desc = "error from";

        onReqHandled(res, resp);
        return;
    }

    var logicHandler = null;
    var module = logic[query.mod];

    if (module) {
        logicHandler = module[query.act];
    }

    if (!logicHandler) {
        resp.code = 1;
        resp.desc = 'act ' + query.act + ' not support in mod ' + query.mod;
        onReqHandled(res, resp);
        return;
    }

    logicHandler(query.args, res, resp, onReqHandled);
}

function onExit(callback) {
    saveArenaServer(
        function () {
            DEBUG('arena saved');
            callback && callback();
        }
    );
}

main();

// 加载跨服竞技场服务器
function loadArenaServer(callback) {
    var counter = 4;
    function onLoad() {
        counter -= 1;
        if (counter <= 0) {
            callback && callback();
            timer();
        }
    }

    // 加载跨服玩家数据
    var UserInfo = require('./logic/user.js').UserInfo;
    global.gUserInfo = new UserInfo();
    gUserInfo.init(function (succ) {
        if (!succ) {
            ERROR('cannot load user');
            process.exit(-1);
        }

        DEBUG('user loaded');
        onLoad();

        // 加载跨服竞技场数据
        var Arena = require('./logic/arena.js').Arena;
        global.gArena = new Arena();
        gArena.init(function (succ) {
            if (!succ) {
                ERROR("can't load Arena");
                process.exit(-1);
            }
            DEBUG('Arena loaded');
            onLoad();
        });

        // 加载活动数据
        var ActLuckyRotation = require('./logic/act_lucky_rotate.js').ActLuckyRotation;
        global.gActLuckyRotation = new ActLuckyRotation();
        gActLuckyRotation.init(function (succ) {
            if (!succ) {
                ERROR("can't load ActLuckyRotation");
                // process.exit(-1);
            }

            DEBUG('ActLuckyRotation loaded');
            onLoad();
        });

        // 战报
        var Replay = require('./logic/replay').Replay;
        global.gReplay = new Replay();
        gReplay.init(function (succ) {
            if (!succ) {
                ERROR('cannot load replay');
                process.exit(-1)
            }

            DEBUG('replay loaded');
            onLoad();
        })
    });
}

// 保存快富竞技场
function saveArenaServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    loader.addLoad('user');
    gUserInfo.save(function () {
        loader.onLoad('user');
    });

    // 保存军团战模块
    loader.addLoad('arena');
    gArena.save(function (succ) {
        loader.onLoad('arena');
    });

    loader.addLoad('replay');
    gReplay.save(function () {
        loader.onLoad('replay');
    });

    loader.addLoad('act_lucky_rotate');
    gActLuckyRotation.save(function () {
        loader.onLoad('act_lucky_rotate');
    });

    loader.onLoad('empty');
}

// 时间推进
function timer() {
    // 每秒1次
    setInterval(function () {
        tickCount++;

        if (tickCount >= tickInterval) {
            gUserInfo.save();
            gArena.save();
            tickCount = 0;
        }
    }, 1000);

    // 30分钟1次
    gArena.tickFunc();
    setInterval(function () {
        gArena.tickFunc();
    }, tickInterval * 1000);
}
