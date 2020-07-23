/*
 CountryWar 服战
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

global.config = require(process.argv[2]);

var logic = require('./logic/');

require('../common/global.js');

global.gDBUser = null;
global.gDBCountryWar = null;
global.gDBRooms = null;

global.gCountryWar = null;
global.gUserInfo = null;
global.gReplay = null;
// global.gCache = null;

var tickInterval = 60 * 30;
var tickCount = 0;

// 初始化日志
require('../common/logger.js');
setupLog('countrywar');
function main() {
    // 加载服务器配置
    var onCacheLoaded = (cache) => {
        // global.gCache = cache;
        // INFO('redis connected');
    };

    loadConf(config, ServerName.COUNTRY_WAR);
    scheduleActivity();
    loadCache(config, [config.RedisId], onCacheLoaded);

    loadGlobalServerConf(config, ServerName.COUNTRY_WAR, () => {
        loadDB(config, onLoadDB);                   // 加载数据库数据
    });
}

function onLoadDB(db) {
    global.gDBUser = db.collection('user');
    global.gDBCountryWar = db.collection('countrywar');
    global.gDBRooms = db.collection('rooms');

    INFO('mongodb connected');

    var tOnLoaded = () => {
        startWebServer(ServerName.COUNTRY_WAR, 0, [], null, onNetHandler, null, onExit);
    }
    loadCountryWar(tOnLoaded);
}

function onNetHandler(net_type, query, res, resp, onReqHandled) {
    // 服务器消息处理
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
    // 服务器退出处理
    saveCountryWar(
        function () {
            LOG('countrywar saved');
            callback();
        }
    );
}

main();

// 加载服战数据
function loadCountryWar(callback) {
    var counter = 3;
    function onLoad() {
        counter -= 1;
        if (counter <= 0) {
            callback && callback();
            timer();

            // 读取服务器列表
            var phpReq = {
                uid: 1,
                act: 'get_server_list',
                args: {
                    uid: 1,
                },
            };
            var phpResp = {};
            phpResp.code = 0;
            phpResp.desc = '';
            requestPHP(phpReq, phpResp, function () {
                if (phpResp.code == 0) {
                    gCountryWar.initWebServerList(phpResp['desc']);
                }
            });
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

        // 加载服战数据
        var CountryWar = require('./logic/countrywar.js').CountryWar;
        global.gCountryWar = new CountryWar();
        gCountryWar.init(function (succ) {
            if (!succ) {
                ERROR("can't load countrywar");
                process.exit(-1);
            }
            INFO('countrywar loaded');
            onLoad();
        });

        var Replay = require('./logic/replay.js').Replay;
        gReplay = new Replay();
        gReplay.init(function (succ) {
            if (!succ) {
                ERROR('cannot load replay');
                process.exit(-1);
            }

            INFO('replay loaded');
            onLoad();
        });
    });
}

// 保存服战数据
function saveCountryWar(callback) {
    var loader = new common.Loader(callback);
    loader.addLoad('empty');

    loader.addLoad('user');
    gUserInfo.save(function () { loader.onLoad('user'); });

    loader.addLoad('countrywar');
    gCountryWar.save(function () { loader.onLoad('countrywar'); });

    loader.addLoad('replay');
    gReplay.save(function (succ) { loader.onLoad('replay'); });

    loader.onLoad('empty');
}

// 定时保存
function timer() {
    setInterval(function () {
        gCountryWar.tick();
        tickCount++;
        if (tickCount >= tickInterval) {
            gUserInfo.save();
            gCountryWar.save();

            tickCount = 0;
        }
    }, 1000);
}
