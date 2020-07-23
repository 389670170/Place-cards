/**
 * 全局服务器（处理整个游戏的全局数据，如全服排行榜）.
 */

// global.Player = require('../game/logic/player.js').Player;
global.config = require(process.argv[2]);

const http = require('http');
const util = require('util');
const clone = require('clone');
const fs = require('fs');
const common = require('../common/common.js');
const { ServerName } = require('../common/enum.js');
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadDB } = require("../common/db/mongo_mgr.js");
const { loadCache } = require('../common/db/redis_mgr.js');
const { loadConf, scheduleActivity } = require('../common/conf_mgr.js');
const csv = require('../common/csv.js');
var logic = require('./logic/');

require('../common/global.js');

// global.gCache = null;
global.gDBWorld = null;

global.gServer = null;
global.gLegionWarTopList = null;
global.gActivity = null;
global.gFightRank = null;
global.gTick = null;

var tickInterval = 60 * 30;

require('../common/logger.js');
setupLog('global_server');

function main() {
    var onCacheLoaded = (cache) => {
        // global.gCache = cache;
        // INFO('redis connected');
    }

    loadConf(config, ServerName.GLOBAL);
    scheduleActivity();

    loadCache(config, [config.RedisId], onCacheLoaded);

    loadGlobalServerConf(config, ServerName.GLOBAL, () => {
        loadDB(config, onLoadDB);
    });
};

function onLoadDB(db) {
    global.gDBWorld = db.collection('world');

    INFO('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.GLOBAL, 0, [], null, onNetHandler, null, onExit);
    }
    loadGlobalServer(tOnLoaded);

    setInterval(tick, 1000);
};

function tick() {
    var dt = Date.now();
    tickFunc(dt);
}

function onNetHandler(net_type, query, res, resp, onReqHandled) {
    var logicHandler = null;
    var module = logic[query.mod];

    if (module) {
        logicHandler = module[query.act];
    }

    if (!logicHandler) {
        if (query.mod == 'gm' && query.act == 'settime') {
            _last_tick_check = 0;
        }
        else {
            resp.code = 1;
            resp.desc = 'act ' + query.act + ' not support in mod ' + query.mod;
        }

        onReqHandled(res, resp);
        return;

    }

    logicHandler(query.args, res, resp, onReqHandled);
};

function onExit(callback) {
    saveGlobalServer(callback);
};

main();

var _last_tick_check = 0;
function tickFunc(dt) {
    if (_last_tick_check >= dt) { return; }
    _last_tick_check = dt + 1000 * tickInterval;        // tickInterval分钟一次

    // 每周重置活动
    var now = common.getTime();
    var todayTime = getResetTime();
    var nextDayTime = todayTime + 86400;
    if (gActivity.time < todayTime || (gActivity.time < nextDayTime && now + tickInterval > nextDayTime)) {
        var resetWeek = false;
        var thisWeekTime = getWeekResetTime();
        var nextWeekTime = thisWeekTime + 86400 * 7;
        if (gActivity.weekTime < thisWeekTime || (gActivity.weekTime < nextWeekTime && now + tickInterval > nextWeekTime)) {
            resetWeek = true;
        }

        var timeout = gActivity.time < todayTime ? 0 : nextDayTime - now;
        setTimeout(function () {
            gActivity.resetByDay();

            if (resetWeek) {
                gActivity.resetByWeek();
            }
        }, timeout * 1000);
    }

    gActivity.fixLuckyWheelRank();
    gActivity.fixPromoteWheelRank();
}

/**
 * 加载全局服务器
 * @param callback
 */
function loadGlobalServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    // 加载全服列表
    loader.addLoad('Server');
    var Server = require('./logic/server.js').Server;
    gServer = new Server();
    gServer.init(function (succ) {
        if (!succ) {
            ERROR("can't load Server");
            process.exit(-1);
        }
        INFO('Server loaded');
        loader.onLoad('Server');
    });

    // 加载军团段位排行榜
    loader.addLoad('LegionWarTopList');
    var LegionWarTopList = require('./logic/legionwar_toplist').LegionWarTopList;
    gLegionWarTopList = new LegionWarTopList();
    gLegionWarTopList.init(config.RedisId, function (succ) {
        if (!succ) {
            ERROR("can't load LegionWarTopList");
            process.exit(-1);
        }
        INFO('LegionWarTopList loaded');
        loader.onLoad('LegionWarTopList');
    });

    // 加载全服活动
    loader.addLoad('Activity');
    var Activity = require('./logic/activity').Activity;
    gActivity = new Activity();
    gActivity.init(function (succ) {
        if (!succ) {
            ERROR("can't load Activity");
            process.exit(-1);
        }
        INFO('Activity loaded');
        loader.onLoad('Activity');
    });

    loader.onLoad('empty');

    // 加载全服战力最大数据
    loader.addLoad('FightRank');
    var FightRank = require('./logic/fight_rank.js').FightRank;
    var tFightRank = new FightRank();
    gFightRank = tFightRank;
    tFightRank.init(function (succ) {
        if (!succ) {
            ERROR("can't load FightRank");
            process.exit(-1);
        }
        INFO('FightRank loaded');
        loader.onLoad('FightRank');
    });

    loader.onLoad('empty');
}

/**
 * 保存全局服务器
 * @param callback
 */
function saveGlobalServer(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    // 保存军团段位排行榜数据
    loader.addLoad('Server');
    gServer.save(function (succ) {
        loader.onLoad('Server');
    });

    // 保存军团段位排行榜数据
    loader.addLoad('LegionWarTopList');
    gLegionWarTopList.save(function (succ) {
        loader.onLoad('LegionWarTopList');
    });

    // 保存全服活动数据
    loader.addLoad('Activity');
    gActivity.save(function (succ) {
        loader.onLoad('Activity');
    });

    // 保存全服战力最大数据
    loader.addLoad('FightRank');
    gFightRank.save(function (succ) {
        loader.onLoad('FightRank');
    });

    loader.onLoad('empty');
}

global.requestServer = function (sid, query, callback) {
    var resp = {};
    var options = {
        host: gServer.servers[sid][0],
        port: gServer.servers[sid][1],
        path: '/',
        method: 'POST'
    };

    var req = http.request(options, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks).toString();
            var worldResp = null;
            try {
                worldResp = JSON.parse(data);
            } catch (error) {
                ERROR('' + sid + ' world resp ' + data);
                delete gServer.servers[sid];
                worldResp = null;
            }

            if (!worldResp) {
                resp.code = 1;
                resp.desc = 'request ' + sid + ' world error';
            } else {
                resp.code = worldResp.code;
                resp.desc = worldResp.desc;
                resp.data = worldResp.data;
            }

            callback && callback(sid, resp);
        });
    });

    req.on('error', function (err) {
        resp.code = 1;
        resp.desc = 'request ' + sid + ' world error';
        console.log(err);
        callback && callback(sid);
    });

    req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    req.end();
}
