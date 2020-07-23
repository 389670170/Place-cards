/**
 * 小队领地服务器
 */

// global.Player = require('../game/logic/player.js').Player;
global.config = require(process.argv[2]);

const util = require('util');
const clone = require('clone');
const fs = require('fs');
const common = require('../common/common.js');
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadDB } = require("../common/db/mongo_mgr.js");
const { loadCache } = require('../common/db/redis_mgr.js');
const { loadConf, scheduleActivity } = require('../common/conf_mgr.js');
const { TEAMZONE_ErrorCode, TEAMZONE_findErrorString } = require('../common/error.js');
var logic = require('./logic/');

require('../common/global.js');

// global.gCache = null;
global.gDBUser = null;
global.gDBWorld = null;

global.gUserInfo = null;
global.gTeamZone = null;

var tickInterval = 60 * 30;
var tickCount = 0;

require('../common/logger.js');
setupLog('teamzone');

const { ServerName } = require('../common/enum.js');

function main() {
    var onCacheLoaded = (cache) => {
        // global.gCache = cache;
        // INFO('redis connected');
    }

    loadConf(config, ServerName.TEAM_ZONE);
    scheduleActivity();

    loadCache(config, [config.RedisId], onCacheLoaded);

    loadGlobalServerConf(config, ServerName.TEAM_ZONE, () => {
        loadDB(config, onLoadDB);
    });
};

function onLoadDB(db) {
    global.gDBUser = db.collection('user');
    global.gDBWorld = db.collection('world');

    INFO('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.TEAM_ZONE, 0, [], null, onNetHandler, null, onExit);
    }
    loadTeamZoneServer(tOnLoaded);
}

function onExit(callback) {
    saveTeamZoneServer(function () {
        LOG('team zone saved');
        callback();
    });
}

function onNetHandler(net_type, query, res, resp, onReqHandled) {
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

main();
// 加载小队领地服务器
function loadTeamZoneServer(callback) {
    var counter = 2;
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

        INFO('user loaded');
        onLoad();

        // 加载跨服战数据
        var TeamZone = require('./logic/teamzone.js').TeamZone;
        global.gTeamZone = new TeamZone();
        gTeamZone.init(function (succ) {
            if (!succ) {
                ERROR("can't load team zone");
                process.exit(-1);
            }
            INFO('team zone loaded');
            onLoad();
        });
    });
}

// 保存小队领地服务器
function saveTeamZoneServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    loader.addLoad('user');
    gUserInfo.save(function () {
        loader.onLoad('user');
    });

    // 保存军团战模块
    loader.addLoad('TeamZone');
    gTeamZone.save(function (succ) {
        loader.onLoad('TeamZone');
    });

    loader.onLoad('empty');
}

// 时间推进
function timer() {
    // 每秒1次
    setInterval(function () {
        gTeamZone.tickFunc();
        tickCount++;

        if (tickCount >= tickInterval) {
            gUserInfo.save();
            gTeamZone.save();
            tickCount = 0;
        }
    }, 1000);

    // 30分钟1次
    gTeamZone.tickFunc();
    setInterval(function () {
        gTeamZone.tickFunc();
    }, tickInterval * 1000);
}
