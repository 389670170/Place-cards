
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logicCommon = require('./common.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const loginCommon = require('./common.js');
const { isModuleOpen_new } = require('../../common/global.js');

/** 探索任务 */
const act_name = "search_task";

function get_default_data() {
    return {
        /** 已经探索次数 */
        'already_num': 0,
        /** 是否是第一次进入 */
        'first_come': 1,
        /**  已经购买的次数 */
        'already_buy': 0,
        /**  已经升星的次数 */
        'already_star_num': 0,
        /** 马上完成任务次数 */
        //'speed_task_num' : 0,
        'task_list': {},
        // 'task_id':{
        /**  区分多个任务，刷新，完成任务，必传 */
        //     'task_id':0,
        /** 任务id */
        //     'type' : 0,
        /** 任务星数 */
        //     'star' : 0,
        /** 开始搜寻的时间 */
        //     'start_time' : 0,
        /** 派遣的武将 */
        //     'hid' : 0,
        /** 任务等级 */
        //     'task_level':1,
        // }
    }
}

/** 服务器启动时 创建用户数据 player.js中会自动调用 */
exports.init_user_data = function (user) {
    user[act_name] = get_default_data();
};

/** 某些属性变化时 检查活动状态 如等级、关卡变化 player.js中会自动调用 */
exports.check_activity_state = function (player, today) {
    if (isModuleOpen_new(player, 'exploreTask')) { return; }            // 黑森林任务
    var user = player.user;
    var search_task = user.search_task;
    var task_list = search_task.task_list;
    if (search_task.first_come) {// 首次进入 刷两个任务
        search_task.first_come = 0;
        var task1 = loginCommon.createTask(user.status.level);
        var task2 = loginCommon.createTask(user.status.level);        // 随机出来的任务
        task_list[task1[1]] = task1[0];
        task_list[task2[1]] = task2[0];

        search_task.task_list = task_list;
        player.markDirty('search_task.task_list');
        player.markDirty('search_task.first_come');
    } else {
        var index = 0;
        for (var i in task_list) {
            index += 1;
        }
        if (index < 2) {
            var task = loginCommon.createTask(user.status.level);
            task_list[task[1]] = task[0];
            player.markDirty('search_task.task_list');
        }
    }
};

// /** 玩家登录时进行重置信息 player.js中会自动调用 */
// exports.reset_by_login = function (player, today) {
// };

/** 每日的重置函数 player.js中会自动调用 */
exports.reset_by_day = function (player, today) {
    var user = player.user;
    var search_task = user.search_task;
    search_task.already_buy = 0;
    search_task.already_num = 0;
    search_task.already_star_num = 0;
    player.markDirty('search_task');
};

// /** 每周的重置函数 player.js中会自动调用 */
// exports.reset_by_week = function (player, today) {
// };

// /** 每月的重置函数 player.js中会自动调用 */
// exports.reset_by_month = function (player, today) {
// };

// /** 用户登录时更新用户数据 upgrade.js中会自动调用 */
// exports.upgrade = function (player) {
//     get_data(player);
// };

/**---------------------------------------------------------------------------------------------------------**/

/** 获取信息 */
exports.get = function (player, req, resp, onHandled) {
    var user = player.user;
    var search_task = search_task;
    do {
        if (!isModuleOpen_new(player, 'exploreTask')) { break; }            // 探索任务
        if (search_task.fix != 1) {
            search_task.fix = 1;
            var taskList = search_task.task_list;
            for (var taskid in taskList) {
                var task = taskList[taskid];
                var heroObj = player.getHero(task.hid);
                if (heroObj) {
                    task.hero_star = player.getHeroStar(task.hid);
                    task.rid = heroObj.rid;
                } else if (task.hid > 0) {
                    task.hero_star = 6;
                    task.rid = 6027;
                }
            }

            player.markDirty('search_task.task_list');
            player.markDirty('search_task.fix');
        }

        resp.data.task_msg = search_task;
        resp.data.searched_heroes = get_searched_heroes(player);
    } while (false);

    onHandled();
};

// /** 登陆时获取功能对应的数据 */
// exports.get_login_data = function (player) {
//     return { key: act_name, get_login_data: {} }
// };

/** 获取探索相关提示数据 */
exports.get_tips = function (player) {
    var search_task = player.user.search_task;
    var curTime = common.getTime();

    var hasTask = false;    // 是否有未完成探索任务
    var dailySearchCount = search_task.already_num;
    var remainCount = conf_mgr.gConfExploreBase.taskBasicTimes.value + search_task.already_buy - dailySearchCount;
    if (remainCount > 0) {
        for (var k in search_task.task_list) {
            if (search_task.task_list[k].hid != 0) { continue; }
            hasTask = true;
            break;
        }
    }

    var taskEndTime = {};
    for (var k in search_task.task_list) {
        var task = search_task.task_list[k];// 任务
        var limitTime = conf_mgr.gConfExploreTaskBasic[task.type].needTime[task.star - 1] * 60;//  所需时间
        if (!task || task.hid == 0) { continue; }
        var endTime = task.start_time + limitTime;
        if (curTime >= endTime) {            // 有已经完成的探索任务
            hasTask = true;
        } else {
            taskEndTime[k] = endTime;
        }
    }

    var tipsObj = {};
    tipsObj.hasTask = hasTask;
    tipsObj.endTime = taskEndTime;
    return { key: act_name, tips: tipsObj };
};

/**
 * 刷新任务
 * @task_id   task_id
 */
exports.refresh_task = function (player, req, resp, onHandled) {
    var user = player.user;
    var searchTask = user.search_task;
    do {
        var taskId = req.args.task_id;
        var task = searchTask.task_list[taskId];// 任务
        if (!task) {
            resp.code = 1; resp.desc = 'not task'; break;
        }
        if (task.start_time) {// 任务开始不能刷新
            resp.code = 1; resp.desc = 'not refresh'; break;
        }

        var cost = [];
        // 基础次数用完
        if (searchTask.already_star_num >= conf_mgr.gConfExploreBase.taskRefreshFreeTimes.value) {
            cost.push(['user', 'mixcash', -conf_mgr.gConfLevel[user.status.level].exploreTask])
        }
        if (!player.checkCosts(cost)) {
            resp.code = 1; resp.desc = 'lack of resources'; break;
        }
        searchTask.already_star_num += 1;
        player.markDirty('search_task.already_star_num');

        var newTask = logicCommon.createTask(user.status.level);
        delete searchTask.task_list[taskId];

        searchTask.task_list[newTask[1]] = newTask[0];
        player.markDirty('search_task.task_list');

        resp.data.task = searchTask.task_list[newTask[1]];
        resp.data.already_num = searchTask.already_star_num;
        resp.data.cost = player.addAwards(cost, req.mod, req.act);
    } while (false);

    onHandled();
};

/**
 * 派遣(更换)武将
 * @task_id
 * @hid         武将hid
 */
exports.send_hero = function (player, req, resp, onHandled) {
    var search_task = player.user.search_task;
    do {
        var taskId = req.args.task_id;
        var hid = req.args.hid;
        var task = search_task.task_list[taskId];
        if (!task) {
            resp.code = 1; resp.desc = 'not task'; break;
        }

        if (!hid) {
            resp.code = 1; resp.desc = 'not hid'; break;
        }

        task.hid = hid;
        search_task.task_list[taskId] = task;
        player.markDirty(util.format('search_task.task_list.%d', taskId));

        resp.data.task = search_task.task_list[taskId];
    } while (false);
    onHandled();
};

/**
 * 升星
 * @task_id
 */
exports.up_star = function (player, req, resp, onHandled) {
    var user = player.user;
    var search_task = user.search_task;
    do {
        var taskId = req.args.task_id;
        var task = search_task.task_list[taskId];
        if (!task) {
            resp.code = 1; resp.desc = 'not task'; break;
        }

        if (!task.start_time) {
            resp.code = 1; resp.desc = 'do not start'; break;
        }

        var max = conf_mgr.gConfExploreTaskBasic[task.type].starWeight.length;
        if (task.star >= max) {
            resp.code = 1; resp.desc = 'already max star'; break;
        }

        var limitTime = conf_mgr.gConfExploreTaskBasic[task.type].needTime[task.star - 1] * 60;//  所需时间
        if (common.getTime() - task.start_time >= limitTime) {
            resp.code = 1; resp.desc = 'not up'; break;
        }

        var cost = [];
        if (search_task.already_star_num >= conf_mgr.gConfExploreBase.taskRefreshFreeTimes.value) {
            cost = conf_mgr.gConfExploreTaskBasic[task.type].starAddCost;
        }

        search_task.already_star_num++;
        task.star += 1;
        search_task.task_list[taskId] = task;
        player.markDirty('search_task.task_list.' + taskId + '');
        player.markDirty('search_task.already_star_num');

        resp.data.task = search_task.task_list[taskId];
        resp.data.already_star_num = search_task.already_star_num;
        resp.data.cost = player.addAwards(cost, req.mod, req.act);
    } while (false);

    onHandled();
};

/** 购买次数 */
exports.buy = function (player, req, resp, onHandled) {
    do {
        var searchTask = player.user.search_task;
        var user = player.user;
        if (searchTask.already_buy >= conf_mgr.gConfVip[user.status.vip].exploreTaskExtra) {
            resp.desc = 'already_buy not'; resp.code = 1; break;
        }

        searchTask.already_buy++;
        var cost = conf_mgr.gConfBuy[searchTask.already_buy].exploreTask;
        if (!player.checkCosts(cost)) {
            resp.code = 1; resp.desc = 'lack of resources'; break;
        }

        player.markDirty('search_task.already_buy');
        resp.data.already_buy = searchTask.already_buy;
        resp.data.costs = player.addAwards(cost, req.mod, req.act);
    } while (false);

    onHandled();
};

function get_searched_heroes(player) {
    if (!player) { return {}; }
    var user = player.user;

    var passDay = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime)) + 1;
    if (user.last_search_day != passDay) {
        user.searched_heroes = {};
        user.last_search_day = passDay;
        player.markDirty('last_search_day');
        player.markDirty('searched_heroes');
    }
    user.searched_heroes = user.searched_heroes || {};
    return user.searched_heroes;
}

/**
 * 开始搜寻
 * @task_id     
 */
exports.start_search = function (player, req, resp, onHandled) {
    var user = player.user;
    var search_task = user.search_task;
    var searched_heroes = get_searched_heroes(player);

    do {
        var taskId = req.args.task_id;
        var task = search_task.task_list[taskId];
        if (!task) {
            resp.code = 1; resp.desc = 'not task'; break;
        }

        var hid = req.args.hid;
        if (!hid) {
            resp.code = 1; resp.desc = 'not hid'; break;
        }

        if (searched_heroes[hid]) {
            resp.code = 1; resp.desc = 'has searched'; break;
        }

        searched_heroes[hid] = true;
        player.markDirty('searched_heroes');

        task.hid = hid; // only mark to get herostar
        task.start_time = common.getTime();

        var maxNum = conf_mgr.gConfExploreBase.taskBasicTimes.value + search_task.already_buy;
        if (search_task.already_num >= maxNum) {
            resp.code = 1; resp.desc = 'num is not'; break;
        }

        var heroMsg = player.getHero(hid);// 武将

        var heroConf = conf_mgr.getHeroCombatConf(heroMsg.rid);
        if (heroConf) {
            task.quality = heroConf.quality;
        }

        task.rid = heroMsg.rid;
        task.hero_star = player.getHeroStar(hid);

        search_task.already_num += 1;
        player.markDirty('search_task.already_num');

        search_task.task_list[taskId] = task;

        player.markDirty('search_task.task_list.' + taskId + '');
        resp.data.searched_heroes = searched_heroes;
        resp.data.task = search_task.task_list[taskId];
        resp.data.already_num = search_task.already_num;
    } while (false);

    onHandled();
};

exports.get_awards = function (player, req, resp, onHandled) {
    var user = player.user;
    var search_task = user.search_task;
    do {
        var taskId = req.args.task_id;
        var task = search_task.task_list[taskId];
        if (!task) {
            resp.code = 1; resp.desc = 'not get task'; break;
        }

        var hid = task.hid;

        var taskConf = conf_mgr.gConfExploreTaskBasic[task.type];
        if (!taskConf) {
            resp.code = 1; resp.desc = 'type error'; break;
        }

        var awards = [];        // 普通奖励

        var detailConf = conf_mgr.gConfExploreTaskDetail[task.type][task.task_level];
        if (!detailConf) {
            ERROR('EROR TASK LEVEL = ' + task.task_level + ' TYPE:' + task.type);
            detailConf = conf_mgr.gConfExploreTaskDetail[task.type][1];
        }

        awards = awards.concat(detailConf['award' + task.star]);

        var spAwards = [];
        var heroStar = task.hero_star;
        if (heroStar >= 6) {
            spAwards = clone(taskConf['award3']);
        } else if (heroStar >= 4) {
            spAwards = clone(taskConf['award2']);
        } else {
            spAwards = clone(taskConf['award1']);
        }

        var taskStar = task.star;
        var num = +(taskConf['normalAward'][taskStar - 1]);
        if (!num || num < 0) {
            resp.code = 1; resp.desc = 'star error'; break;
        }

        spAwards[0][2] = num;
        awards = awards.concat(spAwards);

        var cost = [['user', 'mixcash', -conf_mgr.gConfExploreBase.taskQuickAchieve.value]];

        if (!player.checkCosts(cost)) {
            resp.code = 1; resp.desc = 'lack of resources'; break;
        }

        var newTask = logicCommon.createTask(user.status.level);
        delete search_task.task_list[taskId];

        search_task.task_list[newTask[1]] = newTask[0];
        player.markDirty('search_task.task_list');

        resp.data.task = search_task.task_list[newTask[1]];
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
        resp.data.cost = player.addAwards(cost, req.mod, req.act);

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'exploreTask', 1);
    } while (false);

    onHandled();
};

exports.finish = function (player, req, resp, onHandled) {
    var user = player.user;
    var searchTask = user.search_task;
    do {
        var taskId = req.args.task_id;
        var task = searchTask.task_list[taskId];// 任务
        if (!taskId || !task) {
            resp.code = 1; resp.desc = 'not task'; break;
        }

        var hid = task.hid;
        if (!hid) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var taskConf = conf_mgr.gConfExploreTaskBasic[task.type];
        if (!taskConf) {
            resp.code = 1; resp.desc = 'type error'; break;
        }

        var limitTime = conf_mgr.gConfExploreTaskBasic[task.type].needTime[task.star - 1] * 60;//  所需时间
        if (common.getTime() - task.start_time < limitTime) {
            resp.code = 1; resp.desc = 'not finish'; break;
        }

        var detailConf = conf_mgr.gConfExploreTaskDetail[task.type][task.task_level];
        if (!detailConf) {
            detailConf = conf_mgr.gConfExploreTaskDetail[task.type][1];
        }

        var awards = clone(detailConf['award' + task.star]);        // 普通奖励

        var spAwards = [];
        var heroStar = task.hero_star
        if (heroStar >= 6) {
            spAwards = clone(taskConf['award3']);
        } else if (heroStar >= 4) {
            spAwards = clone(taskConf['award2']);
        } else {
            spAwards = clone(taskConf['award1']);
        }

        var taskStar = task.star;
        var num = +(taskConf['normalAward'][taskStar - 1]);
        if (!num || num < 0) {
            resp.code = 1; resp.desc = 'star error'; break;
        }

        spAwards[0][2] = num;
        awards = awards.concat(spAwards);

        var newTask = logicCommon.createTask(user.status.level);
        delete searchTask.task_list[taskId];
        searchTask.task_list[newTask[1]] = newTask[0];
        player.markDirty('search_task.task_list');

        resp.data.task = searchTask.task_list[newTask[1]];
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'exploreTask', 1);
    } while (false);

    onHandled();
};