/**
 * 日志服务器
 */

global.config = require(process.argv[2]);

const util = require('util');
const clone = require('clone');
const fs = require('fs');
const common = require('../common/common.js');
const { LogType } = require('../common/enum.js');
const { ServerName } = require('../common/enum.js');
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadLogDB } = require('../common/db/mongo_mgr.js');
const { loadCache } = require('../common/db/redis_mgr.js');
const { loadConf, scheduleActivity } = require('../common/conf_mgr.js');
var logic = require('./logic');

require('../common/global.js');

global.gCache = null;

global.gDBWorld = null;
global.gLogManager = null;

var tickInterval = 60 * 30;
var tickCount = 0;

require('../common/logger.js');
setupLog('logserver');
function main() {
    var onCacheLoaded = (cache) => {
        // global.gCache = cache;
        // INFO('redis connected');
    }

    loadConf(config, ServerName.LOG);
    scheduleActivity();

    loadCache(config, [config.RedisId], onCacheLoaded);

    loadGlobalServerConf(config, ServerName.LOG, () => {
        loadLogDB(config, onLoadDB);
    });
};

function onLoadDB(db) {
    global.gDBWorld = db.collection('world');
    initDB(db);

    INFO('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.LOG, 0, [], null, onNetHandler, null, onExit);
    }
    loadLogServer(tOnLoaded);

    setInterval(tick, 1000);
}

function tick() {
    var dt = Date.now();
    update_log_manager(dt);
}

var _last_check_update_log_manager = 0;
function update_log_manager(dt) {
    if (_last_check_update_log_manager >= dt) { return; }
    _last_check_update_log_manager = dt + 10 * 1000;        // 10 秒一次
    gLogManager.update();
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

function onExit(callback) {
    saveLogServer(
        function () {
            LOG('logserver saved');
            callback();
        }
    );
}

main();

function initDB(db) {
    global.gDBArray = [];
    // 各种货币
    global.gDBArray[LogType.LOG_CURRENCY_PRODUCE] = db.collection('currency_produce');
    global.gDBArray[LogType.LOG_CURRENCY_CONSUME] = db.collection('currency_consume');
    // 道具材料
    global.gDBArray[LogType.LOG_MATERIAL_PRODUCE] = db.collection('material_produce');
    global.gDBArray[LogType.LOG_MATERIAL_CONSUME] = db.collection('material_consume');
    // 装备
    global.gDBArray[LogType.LOG_EQUIP_PRODUCE] = db.collection('equip_produce');
    global.gDBArray[LogType.LOG_EQUIP_CONSUME] = db.collection('equip_consume');
    // 卡牌
    global.gDBArray[LogType.LOG_CARD_PRODUCE] = db.collection('card_produce');
    global.gDBArray[LogType.LOG_CARD_CONSUME] = db.collection('card_consume');
    // 龙晶
    global.gDBArray[LogType.LOG_DRAGON_PRODUCE] = db.collection('dragon_produce');
    global.gDBArray[LogType.LOG_DRAGON_CONSUME] = db.collection('dragon_consume');
    // 卡牌碎片
    global.gDBArray[LogType.LOG_CARD_FRAGMENT_PRODUCE] = db.collection('card_fragment_produce');
    global.gDBArray[LogType.LOG_CARD_FRAGMENT_CONSUME] = db.collection('card_fragment_consume');
    // 装备碎片
    global.gDBArray[LogType.LOG_EQUIP_FRAGMENT_PRODUCE] = db.collection('equip_fragment_produce');
    global.gDBArray[LogType.LOG_EQUIP_FRAGMENT_CONSUME] = db.collection('equip_fragment_consume');
    // 宝石
    global.gDBArray[LogType.LOG_GEM_PRODUCE] = db.collection('gem_produce');
    global.gDBArray[LogType.LOG_GEM_CONSUME] = db.collection('gem_consume');
    // 小兵装备
    global.gDBArray[LogType.LOG_SOLDIER_EQUIP_PRODUCE] = db.collection('soldier_equip_produce');
    global.gDBArray[LogType.LOG_SOLDIER_EQUIP_CONSUME] = db.collection('soldier_equip_consume');
    // 符文
    global.gDBArray[LogType.LOG_RUNE_PRODUCE] = db.collection('rune_produce');
    global.gDBArray[LogType.LOG_RUNE_CONSUME] = db.collection('rune_consume');
}

// 加载日志服务器
function loadLogServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    // 加载日志模块
    loader.addLoad('logserver');
    var LogManager = require('./logic/logmanager').LogManager;
    global.gLogManager = new LogManager();
    gLogManager.init(function (succ) {
        if (!succ) {
            ERROR("can't load LogManager");
            process.exit(-1);
        }

        INFO('LogManager loaded');
        loader.onLoad('logserver');
    });

    loader.onLoad('empty');
}

// 保存日志服务器
function saveLogServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    // 保存日志模块
    loader.addLoad('logserver');
    gLogManager.save(function (succ) {
        loader.onLoad('logserver');
    });

    loader.onLoad('empty');
}
