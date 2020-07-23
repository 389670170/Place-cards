/*
    WorldWar 跨服服务器
*/

// global.Player = require('../game/logic/player.js').Player;

const util = require('util');
const clone = require('clone');
const fs = require('fs');
const common = require('../common/common.js');
const { ServerName } = require('../common/enum.js');
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadDB } = require("../common/db/mongo_mgr.js");
const conf_mgr = require('../common/conf_mgr.js');
var logic = require('./logic/');

global.config = require(process.argv[2]);

require('../common/global.js');

global.gDBUser = null;
global.gDBReplay = null;
global.gDBWorld = null;

global.gWorldWar = null;
global.gUserInfo = null;

var tickInterval = 60 * 30;
var tickCount = 0;

function main() {
    require('../common/logger.js');
    setupLog('worldwar');

    conf_mgr.loadConf(config, ServerName.WORLD_WAR);
    conf_mgr.scheduleActivity();

    loadGlobalServerConf(config, ServerName.WORLD_WAR, () => {
        loadDB(config, onLoadDB);
    });
};

function onLoadDB(db) {
    global.gDBUser = db.collection('user');
    global.gDBReplay = db.collection('replay');
    global.gDBWorld = db.collection('world');

    INFO('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.WORLD_WAR, 0, [], null, onNetHandler, null, onExit);
    }
    loadWorldWar(tOnLoaded);

    // 全局数据
    // 跨服战各阶段表
    global.gWorldWarProgressStages = [];

    var stages = Object.keys(conf_mgr.gConfWorldWarSchedule);
    stages.sort(function (a, b) { return (+b) - (+a); });

    var rankProgressConf = conf_mgr.gConfWorldWarSchedule[32];
    gWorldWarProgressStages.push({
        time: rankProgressConf.startWeek * 100 + conf_mgr.gConfGlobal.resetHour,
        realopentime: rankProgressConf.startWeek * 100 + rankProgressConf.startHour,
        progress: 'rank',
        round: 0,
    });

    var endTime = rankProgressConf.endWeek * 100 + rankProgressConf.startHour;

    for (var i = 1, len = stages.length; i < len; i++) {
        var progress = stages[i];

        gWorldWarProgressStages.push({
            time: endTime,
            progress: 'sup_' + progress,
            round: 0,
        });

        var progressConf = conf_mgr.gConfWorldWarSchedule[progress];
        endTime = progressConf.startWeek * 100 + progressConf.startHour;
        var oriEndTime = endTime;
        for (var j = 1; j <= 2; j++) {
            gWorldWarProgressStages.push({
                time: endTime,
                progress: progress,
                round: j,
            });
            endTime = oriEndTime + j * progressConf.interval / 60;
        }
    }

    gWorldWarProgressStages.push({
        time: endTime,
        progress: 'close',
    });
}

function onExit(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    loader.addLoad('user');
    gUserInfo.save(function () { loader.onLoad('user'); });
    loader.addLoad('worldwar');
    gWorldWar.saveWorldwar(function () { loader.onLoad('worldwar'); });

    loader.onLoad('empty');
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

    try {
        logicHandler(query.args, res, resp, onReqHandled);
    } catch (error) {
        ERROR('cause by ' + query.uid);
        ERROR('query : ' + JSON.stringify(query));
        ERROR(error.stack);
        LogError(error.stack);
    }
}

main();

function loadWorldWar(callback) {
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
    gUserInfo = new UserInfo();
    gUserInfo.init(function (succ) {
        if (!succ) {
            ERROR('cannot load user');
            process.exit(-1);
        }

        INFO('user loaded');
        onLoad();

        // 加载跨服战数据
        var WorldWar = require('./logic/worldwar.js').WorldWar;
        global.gWorldWar = new WorldWar();
        gWorldWar.init(function (succ) {
            if (!succ) {
                ERROR("can't load worldwar");
                process.exit(-1);
            }
            INFO('worldwar loaded');
            onLoad();
        });
    });
}

function timer() {
    setInterval(function () {
        gWorldWar.tick();
        tickCount++;
        if (tickCount >= tickInterval) {
            gUserInfo.save();
            gWorldWar.save();
            tickCount = 0;
        }
    }, 1000);
}
