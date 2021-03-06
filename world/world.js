/*
    World服务器
*/

const util = require('util');
const clone = require('clone');
const common = require('../common/common.js');
const { ServerName, OneDayTime } = require('../common/enum.js')
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadDB } = require("../common/db/mongo_mgr.js");
const { loadCache } = require('../common/db/redis_mgr.js');
const conf_mgr = require('../common/conf_mgr.js');

var logic = require('./logic/');

global.config = require(process.argv[2]);;

global.gDBUser = null;
global.gDBWorld = null;
global.gDBMail = null;
// global.gCache = null;

global.gUserInfo = null;
global.gBattle = null;
global.gMine = null;
global.gMail = null;
global.gSysMail = null;
global.gArena = null;
global.gTower = null;
global.gLegion = null;
global.gShipper = null;
global.gGuard = null;
global.gCountry = null;
global.gActivity = null;
global.gTips = null;
global.gTavern = null;
global.gReplay = null;
global.gLegionWar = null;
global.gFriend = null;
global.gClan = null;
global.gNewLegion = null;
global.gTick = null;
global.gTickTimer = null;
global.gLandGrabber = null;
// global.gRegister = null;

global.registerToCountryWarInterval = null;
global.registerToArenaInterval = null;
global.registerToLegionWarInterval = null;
global.gGmSysMsg = null;
var tickInterval = 1 * 60;                      // 30分钟tick一次，执行保存与定时任务

var server_list = [
    // ServerName.ARENA,
    // ServerName.COUNTRY_WAR,
    // ServerName.GLOBAL,
    // ServerName.WORLD_WAR,
    // ServerName.LAND_GRABBER,
    // ServerName.LEGION_WAR,
    // ServerName.TEAM_ZONE,
    // ServerName.TERRITORY_WAR
]

function main() {
    require('../common/global.js');
    require('../common/logger.js');
    setupLog('world');

    conf_mgr.loadConf(config, ServerName.WORLD);
    conf_mgr.scheduleActivity();
    loadCache(config, [config.RedisId]);

    loadGlobalServerConf(config, ServerName.WORLD, () => {
        loadDB(config, onLoadDB);
    });
}

function onLoadDB(db) {
    global.gDBUser = db.collection('user');
    global.gDBWorld = db.collection('world');
    global.gDBMail = db.collection('mail');

    INFO('mongodb connected');
    var tOnLoaded = () => {
        startWebServer(ServerName.WORLD, 0, server_list, null, onNetHandler, null, onExit);
        gBattle.onWorldLoaded();

        _last_check_tick = 0;
    }
    loadWorld(tOnLoaded);

    setInterval(tick, 1000);
}

function tick() {
    var dt = Date.now();
    update_legion_war(dt);
    update_clan(dt);
    tickFunc(dt);
    checkGC(dt);
}

function update_legion_war(dt) {
    if (!gLegionWar) { return; }
    gLegionWar.update();
}

var _last_check_clan = 0;
/** 检查是否需要把玩家踢掉 */
function update_clan(dt) {
    if (!gClan) { return; }
    if (_last_check_clan >= dt) { return; }
    _last_check_clan = dt + 60 * 1000;        // 60 秒一次
    gClan.update();
}

var _last_check_gc = 0;
/** 检查是否需要gc */
function checkGC(dt) {
    if (_last_check_gc >= dt) { return; }
    _last_check_gc = dt + 1000 * 3600 * 3;        // 3小时一次
    if (config.Debug) { return; }
    global.gc && global.gc();
}

function onExit(callback) {
    // 退出处理
    var forceSave = true;
    var loader = new common.Loader(callback);
    loader.addLoad('empty');    // 防止没有需要Load的时候不结束

    // 保存用户信息
    loader.addLoad('user');
    gUserInfo.save(function (succ) {
        loader.onLoad('user');
    });

    // 保存战场信息
    loader.addLoad('battle');
    gBattle.save(function (succ) {
        loader.onLoad('battle');
    });

    // 保存金矿信息
    loader.addLoad('mine');
    gMine.save(function (succ) {
        loader.onLoad('mine');
    });

    // 保存邮件
    loader.addLoad('mail');
    gMail.save(true, function (succ) {
        loader.onLoad('mail');
    });

    // 保存全服邮件
    loader.addLoad('sys_mail');
    gSysMail.save(function (succ) {
        loader.onLoad('sys_mail');
    });

    // 保存竞技场信息
    loader.addLoad('arena');
    gArena.save(function (succ) {
        loader.onLoad('arena');
    });

    // 保存千重楼信息
    loader.addLoad('tower');
    gTower.save(function (succ) {
        loader.onLoad('tower');
    });

    // 保存军团信息
    loader.addLoad('legion');
    gNewLegion.save(function (succ) {
        loader.onLoad('legion');
    });

    // 保存押镖信息
    loader.addLoad('shipper');
    gShipper.save(function (succ) {
        loader.onLoad('shipper');
    });

    // 保存领地信息
    loader.addLoad('guard');
    gGuard.save(function (succ) {
        loader.onLoad('guard');
    });

    // //保存系统消息
    // loader.addLoad('sysMsgData');
    // gGmSysMsg.save(function(succ) {
    //     loader.onLoad('sysMsgData');
    // });

    // 保存国家信息
    loader.addLoad('country');
    gCountry.save(function (succ) {
        loader.onLoad('country');
    });

    // 保存活动信息
    loader.addLoad('activity');
    gActivity.save(function (succ) {
        loader.onLoad('activity');
    });

    // 保存提醒信息
    loader.addLoad('tips');
    gTips.save(function (succ) {
        loader.onLoad('tips');
    });

    // 保存酒馆信息
    loader.addLoad('tavern');
    gTavern.save(function (succ) {
        loader.onLoad('tavern');
    });

    // 保存战报信息
    loader.addLoad('replay');
    gReplay.save(function (succ) {
        loader.onLoad('replay');
    });

    // 保存军团战
    loader.addLoad('legionwar');
    gLegionWar.save(function (succ) {
        loader.onLoad('legionwar');
    });

    // 保存好友信息
    loader.addLoad('friend');
    gFriend.save(true, function (succ) {
        loader.onLoad('friend');
    });

    // 保存村庄争夺
    loader.addLoad('landgrabber');
    gLandGrabber.save(function (succ) {
        loader.onLoad('landgrabber');
    });

    // 保存战队数据
    loader.addLoad('clan');
    gClan.save(function (succ) {
        loader.onLoad('clan');
    });

    loader.onLoad('empty');
}

function onNetHandler(net_type, query, res, resp, onReqHandled) {
    var logicHandler = null;
    var module = logic[query.mod];

    if (module) {
        logicHandler = module[query.act];
    }

    if (!logicHandler) {
        if (query.mod == 'gm' && query.act == 'reload') {
            for (var mod in logic) {
                var path = require.resolve('./logic/' + mod);
                delete require.cache[path];
                logic[mod] = require('./logic/' + mod);
                loadGlobalServerConf(config, ServerName.WORLD);
                conf_mgr.loadConf(config, ServerName.WORLD);
                conf_mgr.scheduleActivity();
                global.gc();
            }
        } if (query.mod == 'gm' && query.act == 'settime') {
            _last_check_tick = 0;
        }
        else {
            resp.code = 1;
            resp.desc = 'act ' + query.act + ' not support in mod ' + query.mod;
        }
        onReqHandled(res, resp);
        return;
    }

    // 更新数据
    if (query.uid && query.update) {
        query.update = JSON.parse(query.update);
        if (typeof (query.update) == 'object') {
            gUserInfo.update(query.uid, query.update);
        }
    }
    try {
        logicHandler(query.args, res, resp, onReqHandled);
    } catch (error) {
        ERROR('cause by ' + query.uid);
        ERROR('query : ' + JSON.stringify(query));
        ERROR(error.stack);
        requestPHP({ uid: query.uid, act: 'mark_error', args: { sid: config.ServerId, server: 'world' } }, {});
        LogError(error.stack);
    }
}

main();

var _last_check_tick = Number.MAX_VALUE;                // 初始不启动更新
function tickFunc(dt) {
    if (_last_check_tick >= dt) { return; }
    _last_check_tick = dt + tickInterval * 1000;        // tickInterval 秒一次


    // 每三十分钟保存一次邮件, 军团, 竞技场, 活动, 军团战 ,好友系统
    gMail.save(true);
    gSysMail.save();
    gNewLegion.save();
    gArena.save();
    gActivity.save();
    gLegionWar.save();
    gCountry.save();
    gFriend.save(true);
    // gMine.save();
    gLandGrabber.save();
    gClan.save();

    // // 每日早4点定时重新注册跨服
    // var now = common.getTime();
    // var regBalanceTime = gRegister.getBalanceTime();
    // if (now < regBalanceTime && now + tickInterval >= regBalanceTime) {
    //     setTimeout(function () {
    //         gRegister.registerAllServer(true);
    //     }, (regBalanceTime - now) * 1000);
    // }

    // 每日晚9点定时发竞技场奖励邮件
    var now = common.getTime();
    var arenaBalanceTime = gArena.getBalanceTime();
    if (gArena.balance < arenaBalanceTime && now + tickInterval > arenaBalanceTime) {
        setTimeout(function () {
            gSysMail.addArenaAwardMail();
            gArena.updateLastRanks();
        }, (arenaBalanceTime - now) * 1000);
    }

    // 每日8点定时发皇城争霸奖励邮件
    var countryBalanceTime = gCountry.getBalanceTime();
    if (gCountry.balance < countryBalanceTime && now + tickInterval > countryBalanceTime) {
        setTimeout(function () {
            gSysMail.addCountryAwardMail();
        }, (countryBalanceTime - now) * 1000);
    }

    // 每日8点定时发太守占领人数奖励邮件
    /*var lordBalanceTime = gBattle.getBalanceTime();
    if (gBattle.balance < lordBalanceTime && now + tickInterval > lordBalanceTime) {
        setTimeout(function() {
            gSysMail.addLordAwardMail();
        }, (lordBalanceTime - now) * 1000)
    }*/

    if (config.platform == 'winner_1') {
        // 每日10点定时发放taptap奖励
        // var taptapDailyAwardTime_morning = gUserInfo.getTapTapDailyTime_morning();
        // if (gUserInfo.taptapDailyAwardTime_am < taptapDailyAwardTime_morning && now + tickInterval > taptapDailyAwardTime_morning) {
        //     setTimeout(function() {
        //         gSysMail.addTaptapDailyAward(true);
        //     }, (taptapDailyAwardTime_morning - now) * 1000)
        // }

        // 每日18点定时发放taptap奖励
        // var taptapDailyAwardTime = gUserInfo.getTapTapDailyTime();
        // if (gUserInfo.taptapDailyAwardTime < taptapDailyAwardTime && now + tickInterval > taptapDailyAwardTime) {
        //     setTimeout(function() {
        //         gSysMail.addTaptapDailyAward();
        //     }, (taptapDailyAwardTime - now) * 1000)
        // }
    }

    // 军团boss提示
    var legionBossTime = getLegionBossTime();
    var legionBossBeginTime = legionBossTime[0] + 10;
    var legionBossEndTime = legionBossTime[1];

    if (gUserInfo.legionBossNoticeTime < legionBossBeginTime && now + tickInterval > legionBossBeginTime) {
        var timeout = legionBossBeginTime - now;
        if (timeout < 0) {
            timeout = 0;
        }
        DEBUG('sendLegionBossNotice  timeout = ' + timeout);
        setTimeout(function () {
            gUserInfo.sendLegionBossNotice(now, legionBossEndTime);
        }, timeout * 1000)
    }

    // 领地boss提示
    var territoryBossBeginTime = getTerritoryWarBossTime() + 10;
    if (gUserInfo.territoryBossNoticeTime < territoryBossBeginTime && now + tickInterval > territoryBossBeginTime) {
        var timeout = territoryBossBeginTime - now;
        if (timeout < 0) {
            timeout = 0;
        }

        DEBUG('sendTerritoryBossNotice  timeout = ' + timeout);
        setTimeout(function () {
            gUserInfo.sendTerritoryBossNotice(now);
        }, timeout * 1000)
    }

    // 提升到此处统计
    gUserInfo.updatePassDayTime(now);

    // 每天24点跨天，通知一下运营后天，统计一些数据，比如当前的活跃人数
    var realResetTime = getRealResetTime() + OneDayTime;
    if (gUserInfo.passDayTime < realResetTime && now + tickInterval > realResetTime) {
        var timeout = realResetTime - now;
        if (timeout < 0) {
            timeout = 0;
        }

        setTimeout(function () {
            gUserInfo.updatePassDayTime(now);
        }, timeout * 1000)
    }

    // 每日5点刷新及每周5点刷新
    // 每日: 金矿, 组队挂机, 军团城池
    // 每周: 周礼包
    var todayTime = getResetTime();
    var nextDayTime = todayTime + 86400;
    // ERROR('-----------------------1-----------'+gUserInfo.time+'===='+todayTime);
    if (gUserInfo.time < todayTime || (gUserInfo.time < nextDayTime && now + tickInterval > nextDayTime)) {
        // ERROR('--------------------2--------------');
        var resetWeek = false;
        var thisWeekTime = getWeekResetTime();
        var nextWeekTime = thisWeekTime + 86400 * 7;
        if (gUserInfo.weekTime < thisWeekTime || (gUserInfo.weekTime < nextWeekTime && now + tickInterval > nextWeekTime)) {
            resetWeek = true;
        }

        var timeout = 0;
        if (gUserInfo.time >= todayTime) {
            timeout = (nextDayTime - now) * 1000;
        }

        // ERROR('--------------------3--------------'+timeout);
        setTimeout(function () {
            // 每日重置
            gUserInfo.resetByDay();
            // gMine.resetByDay();
            gNewLegion.resetByDay();
            // gActivity.resetByDay();
            gFriend.resetByDay();
            gClan.resetByDay();
            gLandGrabber.resetByDay();

            // 每周重置
            if (resetWeek) {
                gUserInfo.resetByWeek();
                gActivity.resetByWeek();
                gTips.resetByWeek();
                gFriend.resetByWeek();
                gNewLegion.resetByWeek();
            }
        }, timeout);

        setTimeout(function () {
            gActivity.resetByDay();             // 活动中的排行榜统计需要时间
        }, timeout + (60 * 1000));
    }
}

// 时间推进
function timer() {
    // 每秒1次
    clearInterval(global.gTickTimer);
    global.gTickTimer = setInterval(function () {
        gLandGrabber.tickFunc();
    }, 1000);

    // setInterval(function () {
    //     var array = [];
    //     pushSysMsg('version_notice', array);
    // }, 300 * 1000);

    // 微蓝加群跑马灯
    if (config.platform && (config.platform == 'winner_1' || config.platform == 'winner_3')) {
        setInterval(function () {
            var array = [];
            pushSysMsg('weilan_notice', array);
        }, 600 * 1000);
    }
}

function loadWorld(callback) {
    var counter = 18;
    function onLoad() {
        counter -= 1;
        if (counter <= 0) {
            callback && callback();
            timer();
        }
    }

    // var Register = require('./logic/register.js').Register;
    // gRegister = new Register();
    // gRegister.init(function (succ) {
    //     if (!succ) {
    //         ERROR('cannot load register');
    //         process.exit(-1);
    //     }

    //     INFO('register loaded');
    //     onLoad();
    // });
    onLoad();

    var UserInfo = require('./logic/user.js').UserInfo;
    gUserInfo = new UserInfo();
    gUserInfo.init(function (succ) {
        if (!succ) {
            ERROR('cannot load user');
            process.exit(-1);
        }

        INFO('user loaded');
        onLoad();

        // 下面的加载依赖User数据
        // 千重楼
        var Tower = require('./logic/tower.js').Tower;
        gTower = new Tower();
        gTower.init(function (succ) {
            if (!succ) {
                ERROR('cannot load tower');
                process.exit(-1);
            }
            INFO('tower loaded');
            onLoad();
        });

        // 国家
        var Country = require('./logic/country.js').Country;
        gCountry = new Country();
        gCountry.init(function (succ) {
            if (!succ) {
                ERROR('cannot load country');
                process.exit(-1);
            }

            INFO('country loaded');
            onLoad();
        });

        // 好友系统
        var Friend = require('./logic/friend.js').Friend;
        gFriend = new Friend();
        gFriend.init(function (succ) {
            if (!succ) {
                ERROR('cannot load friend');
                process.exit(-1);
            }

            INFO('friend loaded');
            onLoad();
        });

        // 军团
        var NewLegion = require('./logic/new_legion.js').NewLegion;
        gNewLegion = new NewLegion();
        gNewLegion.init(function (succ) {
            if (!succ) {
                ERROR('cannot load new_legion');
                process.exit(-1);
            }

            INFO('new_legion loaded');
            onLoad();
        });

        var Clan = require('./logic/clan.js').Clan;
        gClan = new Clan();
        gClan.init(function (succ) {
            if (!succ) {
                ERROR('cannot load clan');
                process.exit(-1);
            }

            var LandGrabber = require('./logic/landgrabber.js').LandGrabber;
            gLandGrabber = new LandGrabber(config);
            gLandGrabber.init(function (succ) {
                if (!succ) {
                    ERROR('cannot load landGrabber');
                    process.exit(-1);
                }

                INFO('landGrabber loaded');
                onLoad();
            });

            INFO('clan loaded');
            onLoad();
        });

        // 战场
        var Battle = require('./logic/battle.js').Battle;
        gBattle = new Battle();
        gBattle.init(function (succ) {
            if (!succ) {
                ERROR('cannot load battle');
                process.exit(-1);
            }

            INFO('battle loaded');
            onLoad();
        });

        // // 金矿
        // var Mine = require('./logic/mine.js').Mine;
        // gMine = new Mine();
        // gMine.init(function (succ) {
        //     if (!succ) {
        //         ERROR('cannot load mine');
        //         process.exit(-1);
        //     }

        //     INFO('mine loaded');
        //     onLoad();
        // });

        // 竞技场
        var Arena = require('./logic/arena.js').Arena;
        gArena = new Arena();
        gArena.init(function (succ) {
            if (!succ) {
                ERROR('cannot load arena');
                process.exit(-1);
            }

            INFO('arena loaded');
            onLoad();
        });

        // 邮件
        var Mail = require('./logic/mail.js').Mail;
        gMail = new Mail();
        gMail.init(function (succ) {
            if (!succ) {
                ERROR('cannot load mail');
                process.exit(-1);
            }

            INFO('mail loaded');
            onLoad();
        });

        // 全服邮件
        var SysMail = require('./logic/mail.js').SysMail;
        gSysMail = new SysMail();
        gSysMail.init(function (succ) {
            if (!succ) {
                ERROR('cannot load sys_mail');
                process.exit(-1);
            }

            INFO('sysmail loaded');
            onLoad();
        });

        // // 押镖
        // var Shipper = require('./logic/shipper.js').Shipper;
        // gShipper = new Shipper();
        // gShipper.init(function (succ) {
        //     if (!succ) {
        //         ERROR('cannot load shipper');
        //         process.exit(-1);
        //     }

        //     INFO('shipper loaded');
        //     onLoad();
        // });

        // 领地
        var Guard = require('./logic/guard.js').Guard;
        gGuard = new Guard();
        gGuard.init(function (succ) {
            if (!succ) {
                ERROR('cannot load guard');
                process.exit(-1);
            }

            INFO('guard loaded');
            onLoad();
        });

        // // 系统通知消息
        // var SysMsg = require('./logic/gmPushSysMsg.js').SysMsg;
        // gGmSysMsg = new SysMsg();
        // gGmSysMsg.init(function (succ) {
        //     if (!succ) {
        //         ERROR('cannot load gmSysMsg');
        //         process.exit(-1);
        //     }

        //     INFO('SysMsg loaded');
        //     onLoad();
        // });

        // 活动
        var Activity = require('./logic/activity.js').Activity;
        gActivity = new Activity();
        gActivity.init(function (succ) {
            if (!succ) {
                ERROR('cannot load activity');
                process.exit(-1);
            }

            INFO('activity loaded');
            onLoad();
        });

        // 提醒
        var Tips = require('./logic/tips.js').Tips;
        gTips = new Tips();
        gTips.init(function (succ) {
            if (!succ) {
                ERROR('cannot load tips');
                process.exit(-1);
            }

            INFO('tips loaded');
            onLoad();
        });

        // 酒馆
        var Tavern = require('./logic/tavern.js').Tavern;
        gTavern = new Tavern();
        gTavern.init(function (succ) {
            if (!succ) {
                ERROR('cannot load tavern');
                process.exit(-1);
            }

            INFO('tavern loaded');
            onLoad();
        });

        // 战报
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

        // 军团战
        var LegionWar = require('./logic/legionwar.js').LegionWar;
        gLegionWar = new LegionWar();
        gLegionWar.init(function (succ) {
            if (!succ) {
                ERROR('cannot load legionwar');
                process.exit(-1);
            }

            INFO('legionwar loaded');
            onLoad();
        });
    });
}

