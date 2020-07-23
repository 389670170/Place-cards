/**
 * 军团战服务器
 */

// global.Player = require('../game/logic/player.js').Player;
global.config = require(process.argv[2]);

const util = require('util');
const clone = require('clone');
const common = require('../common/common.js');
const fs = require('fs');
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadDB } = require("../common/db/mongo_mgr.js");
const { loadCache } = require('../common/db/redis_mgr.js');
const { loadConf, scheduleActivity } = require('../common/conf_mgr.js');
const { LEGIONWAR_ErrorCode, LEGIONWAR_findErrorString } = require('../common/error.js');
var logic = require('./logic/');

require('../common/global.js');

// global.gCache = null;
global.gDBRegister = null;
global.gDBWorld = null;
global.gDBLegion = null;
global.gDBRobot = null;
global.gDBHistory = null;
global.gDBRankList = null;

global.gLegionWar = null;

var tickInterval = 60 * 30;
var tickCount = 0;

require('../common/logger.js');
const { ServerName } = require('../common/enum.js');
setupLog('legionwar');
function main() {
    var onCacheLoaded = (cache) => {
        // global.gCache = cache;
        // INFO('redis connected');
    }
    loadConf(config, ServerName.LEGION_WAR);
    scheduleActivity();

    loadCache(config, [config.RedisId], onCacheLoaded);

    loadGlobalServerConf(config, ServerName.LEGION_WAR, () => {
        loadDB(config, onLoadDB);
    });
}

function onLoadDB(db) {
    gDBRegister = db.collection('register');
    gDBWorld = db.collection('world');
    gDBLegion = db.collection('legion');
    gDBRobot = db.collection('robot');
    gDBHistory = db.collection('history');
    gDBRankList = db.collection('ranklist');
    INFO('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.LEGION_WAR, 0, [], null, onNetHandler, null, onExit);
    }
    loadLegionwarServer(tOnLoaded);

    setInterval(tick, 1000);
}

function tick() {
    var dt = Date.now();
    update_legion_war(dt);
    save_legion_war(dt);
}

var _last_check_update_legion_war = 0;
function update_legion_war(dt) {
    if (_last_check_update_legion_war >= dt) { return; }
    _last_check_update_legion_war = dt + 10 * 1000;        // 10 秒一次

    gLegionWar.update();
    gLegionWar.updateBattle();
}

var _last_check_save_legion = 0;
function save_legion_war(dt) {
    if (_last_check_save_legion >= dt) { return; }
    _last_check_save_legion = dt + 30 * 60 * 1000;        // 3 小时 一次
    gLegionWar.save();
}

function onExit(callback) {
    saveLegionwarServer(
        function () {
            LOG('LegionWar saved');
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

    /*if (query.args.stage != gLegionWar.stage) {
     if ((query.args.stage != 2 && query.args.stage != 0) || gLegionWar.stage != 3) {
     resp.code = ErrorCode.ERROR_STAGE_NOT_EQUAL;
     resp.desc = LEGIONWAR_findErrorString(ErrorCode.ERROR_STAGE_NOT_EQUAL);
     onReqHandled(res, resp);
     return;
     }
     }*/

    logicHandler(query.args, res, resp, onReqHandled);
}

main();

// 加载军团战服务器
function loadLegionwarServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    // 加载军团战模块
    loader.addLoad('LegionWar');
    var LegionWar = require('./logic/legionwar').LegionWar;
    global.gLegionWar = new LegionWar();
    gLegionWar.init(function (succ) {
        if (!succ) {
            ERROR("can't load LegionWar");
            process.exit(-1);
        }

        INFO('LegionWar loaded');
        loader.onLoad('LegionWar');
    });

    loader.onLoad('empty');
}

// 保存军团战服务器
function saveLegionwarServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    // 保存军团战模块
    loader.addLoad('LegionWar');
    gLegionWar.save(function (succ) {
        loader.onLoad('LegionWar');
    });

    loader.onLoad('empty');
}
