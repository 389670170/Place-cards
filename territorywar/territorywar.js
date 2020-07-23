/**
 * 领地战服务器
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
const { TERRITORYWAR_ErrorCode, TERRITORYWAR_findErrorString } = require('../common/error.js');
var logic = require('./logic/');

require('../common/global.js');

global.gReplay = null;
// global.gCache = null;
global.gDBWorld = null;
global.gDBLegion = null;
global.gDBRobot = null;
global.gDBHistory = null;
global.gDBRankList = null;
global.gDBTerritory = null;

global.gTerritoryWar = null;
global.gTickFuncInterval = null;

var tickInterval = 60 * 30;
var tickCount = 0;

require('../common/logger.js');
setupLog('territorywar');

const { ServerName } = require('../common/enum.js');

function main() {
    var onCacheLoaded = (cache) => {
        // global.gCache = cache;
        // INFO('redis connected');
    }

    loadConf(config, ServerName.TERRITORY_WAR);
    scheduleActivity();

    loadCache(config, [config.RedisId], onCacheLoaded);

    loadGlobalServerConf(config, ServerName.TERRITORY_WAR, () => {
        loadDB(config, onLoadDB);
    });
}

function onLoadDB(db) {
    gDBUser = db.collection('user');
    gDBWorld = db.collection('world');
    gDBTerritory = db.collection('territory');
    INFO('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.TERRITORY_WAR, 0, [], null, onNetHandler, null, onExit);
    }
    loadTerritorywarServer(tOnLoaded);
}

function onExit(callback) {
    saveTerritoryWarServer(
        function () {
            LOG('TerritoryWar saved');
            callback();
        }
    );
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
// 加载领地战服务器
function loadTerritorywarServer(callback) {
    var counter = 3;
    function onLoad() {
        counter -= 1;
        if (counter <= 0) {
            callback && callback();
            timer();
        }
    }

    // 加载跨服玩家数据
    var UserInfo = require('./logic/user.js').UserInfo;
    gUserInfo = new UserInfo();
    gUserInfo.init(function (succ) {
        if (!succ) {
            ERROR('cannot load user');
            process.exit(-1);
        }

        INFO('user loaded');
        onLoad();

        // 加载跨服战数据
        var TerritoryWar = require('./logic/territorywar.js').TerritoryWar;
        global.gTerritoryWar = new TerritoryWar();
        gTerritoryWar.init(function (succ) {
            if (!succ) {
                ERROR("can't load TerritoryWar");
                process.exit(-1);
            }
            INFO('TerritoryWar loaded');
            onLoad();
        });

        // 战报
        var Replay = require('./logic/replay').Replay;
        gReplay = new Replay();
        gReplay.init(function (succ) {
            if (!succ) {
                ERROR('cannot load replay');
                process.exit(-1)
            }

            INFO('replay loaded');
            onLoad();
        })
    });
}

// 保存领地战战服务器
function saveTerritoryWarServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    loader.addLoad('user');
    gUserInfo.save(function () {
        loader.onLoad('user');
    });

    // 保存军团战模块
    loader.addLoad('TerritoryWar');
    gTerritoryWar.save(function (succ) {
        loader.onLoad('TerritoryWar');
    });

    loader.addLoad('replay');
    gReplay.save(function () {
        loader.onLoad('replay');
    });

    loader.onLoad('empty');
}

// 时间推进
function timer() {
    // 每秒1次
    setInterval(function () {
        gTerritoryWar.tick();
        tickCount++;

        if (tickCount >= tickInterval) {
            gUserInfo.save();
            gTerritoryWar.save();
            tickCount = 0;
        }
    }, 1000);

    gTerritoryWar.tickFunc();
    clearInterval(global.gTickFuncInterval);

    // 一天1次
    global.gTickFuncInterval = setInterval(function () {
        gTerritoryWar.tickFunc();
    }, tickInterval * 1000);
}
