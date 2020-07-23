
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { isModuleOpen_new, cloneHeroInitAttr } = require('../../common/global.js');

/** 探索任务 */
const act_name = "task";

function get_default_data() {
    return {
        'daily': {
            /**  id对应任务完成的进度 */
            // id: count,
        },
        'daily_reward': {
            /** id对应奖励是否已领取, 0/1 */
            // id: 0,
        },
        /** 每日活跃度上一次领奖的分数 */
        'daily_active': 0,

        /** 玩家总活跃度 */
        'active': 0,

        /** 爵位等级 */
        'nobility': [],

        /** 特权 */
        'privilege': {
            /** 特权id: 特权值 */
            // id: 0,
        },

        'main': {
            /** id对应任务的完成进度 */
            // id: 0,
        },
        'main_reward': {
            /** id对应任务的领奖进度 */
            // id: 0,
        },
        'world_reward': {
            /** id对应奖励是否领取, 0/1 */
            // id: 0,
        },
        /** 粮草领取id */
        'food_get': [],
    }
};

/** 服务器启动时 创建用户数据 player.js中会自动调用 */
exports.init_user_data = function (user) {
    user[act_name] = get_default_data();
};

/** 每日的重置函数 player.js中会自动调用 */
exports.reset_by_day = function (player, today) {
    var user = player.user;
    var search_task = user.search_task;
    search_task.already_buy = 0;
    search_task.already_num = 0;
    search_task.already_star_num = 0;
    player.markDirty('search_task');
};

exports.init = function () {
    logic_event_mgr.on(logic_event_mgr.EVENT.DO_TASK, doTask);
    logic_event_mgr.on(logic_event_mgr.EVENT.DO_DAILY_TASK, doDailyTask);
}

exports.getPrivilegeVal = function (player, typeStr) {
    var user = player.user;
    var vipPrivilegeId = conf_mgr.gConfNobiltyTitleKeyAndId[typeStr];

    var nobility = user.task.nobility;
    var nobilityId = nobility[0];
    var nobilityStars = nobility[1];
    var val = 0;
    for (var num = 1; num <= nobilityId; num++) {
        var maxNum = 3;
        if (num == nobilityId) {
            maxNum = nobilityStars;
        }
        for (var star = 1; star <= maxNum; star++) {
            var type = conf_mgr.gConfNobiltyBase[num]['pg' + star];
            if (vipPrivilegeId[type] && vipPrivilegeId[type].lock == 2) {
                val += conf_mgr.gConfNobiltyBase[num]['pgnum' + star];
            }
        }
    }

    return val;
};

/**
 * 
 * @param {*} player 
 * @param {*} type 
 * @param {*} count 
 */
function doDailyTask(player, type, count) {
    if (!isModuleOpen_new(player, 'task')) { return; }

    var user = player.user;
    var dailyTask = user.task.daily;
    var id = conf_mgr.gConfDailyTask[type];
    if (!id) return;

    var oldTarget = 0;
    count = count ? count : 1;
    if (!dailyTask[id]) {
        dailyTask[id] = +count;
    } else {
        oldTarget = dailyTask[id];
        dailyTask[id] += +count;
    }

    player.markDirty('task.daily.' + id);

    var target = conf_mgr.gConfDailyTask[id].target;
    if (dailyTask[id] >= target && oldTarget < target) {
        player.addTip('daily_task');
    }
};

/**
 * 
 * @param {*} player 
 * @param {*} type 
 * @param {*} count 
 * @param {*} condition 
 * @param {*} oldCondition 
 */
function doTask(player, type, count, condition, oldCondition) {
    var user = player.user;
    var task = user.task;
    var reward = task.main_reward;
    var id = conf_mgr.gConfTask[type];
    if (!id) {
        return;
    }

    if (!task.main[id]) {
        task.main[id] = 0;
        player.markDirty('task.main.' + id);
    }

    //ERROR('dotask===add ========='+type+' id:'+id);
    count = count ? count : 1;
    var curProgress = reward[id] ? reward[id] : 0;
    var curConf = conf_mgr.gConfTask[id][curProgress + 1];
    if (!curConf) return;

    if (type == 'level') {
        task.main[id] = user.status.level;
    } else if (type == 'arenaRank') {
        if (condition > conf_mgr.gConfTask[id][1].condition) return;
        task.main[id] = 1;
    } else if (type == 'battle') {
        task.main[id] = count;
    } else if (type == 'elite') {
        task.main[id] = count;
    } else if (type == 'hard') {
        task.main[id] = count;
    } else if (type == 'nightmare') {
        task.main[id] = count;
    } else if (type == 'hell') {
        if (count > 5150) {
            count = 5150;
        }
        task.main[id] = count;
    } else if (type == 'roleQuality') {            // 集齐指定品质武将（这个需要了解封将的是否计算在内）
        if (+condition >= +curConf.condition) {
            if (!task.main[id]) {
                task.main[id] = 0;
            }
            task.main[id] += count;
        }
        //ERROR('dotask===main count now========='+task.main[id]);
    } else if (type == 'roleReborn') {            // 武将突破到指定等级打到指定数量
        var curCnt = player.calcRoleReborn(curConf.condition);
        if (task.main[id] >= curCnt) return;
        task.main[id] = curCnt;
    } else if (type == 'soldierLevel') {            // 小兵升级到指定等级打到指定数量
        var curCnt = player.calcSoldierLevel(curConf.condition);
        if (task.main[id] >= curCnt) return;
        task.main[id] = curCnt;
    } else if (type == 'equipGod') {
        if (oldCondition && oldCondition >= curConf.condition) return;

        if (condition >= curConf.condition) {
            if (!task.main[id]) {
                task.main[id] = +count;
            } else {
                task.main[id] += count;
            }
        }
    } else if (type == 'legionLevel') {            // 军团达到指定等级
        if (player.memData.legion_level > task.main[id]) {
            task.main[id] = player.memData.legion_level;
        }
    } else if (type == 'teamLevel') {            // 战队达到指定等级
        if (player.memData.team_level > task.main[id]) {
            task.main[id] = player.memData.team_level;
        }
    } else if (type == 'fightPower') {            // 战斗力达到X
        if (player.memData.fight_force > task.main[id]) {
            task.main[id] = player.memData.fight_force;
        }
    } else if (type == 'legionFire') {            // 参与军团篝火达到指定次数
        task.main[id] += +count;
    } else if (!task.main[id]) {
        task.main[id] = +count;
    } else {
        task.main[id] += +count;
    }

    if (task.main[id]) {
        player.markDirty('task.main.' + id);

        if (type == 'fightPower') {
            if (task.main[id] >= curConf.target * 10000) {
                player.addTip('main_task');
            }
        } else {
            if (task.main[id] >= curConf.target) {
                player.addTip('main_task');
            }
        }
    }
};

function calcMainByType(player, type) {
    var user = player.user;
    var task = player.user.task;
    var id = conf_mgr.gConfTask[type];
    var old_value = task.main[id];
    task.main[id] = 0;

    var reward = task.main_reward;
    var old_condition = conf_mgr.gConfTask[id][(reward[id] ? reward[id] : 0)].condition;
    var curProgress = (reward[id] ? reward[id] : 0) + 1;

    var conf = conf_mgr.gConfTask[id][curProgress];
    if (!conf) return;
    var condition = conf.condition;

    switch (type) {
        case 'roleQuality':
            if (condition <= old_condition) {
                task.main[id] = old_value;
            }
            break;
        case 'roleReborn':
            task.main[id] = player.calcRoleReborn(condition);
            break;
        case 'soldierLevel':
            task.main[id] = player.calcSoldierLevel(condition);
            break;
        case 'equipGod':
            task.main[id] = player.calcEquipGod(condition);
            break;
    }
    player.markDirty('task.main.' + id);
}

exports.get = function (player, req, resp, onHandled) {
    // 刷新每日粮饷
    var user = player.user;
    var task = user.task;
    var noon = conf_mgr.gConfGlobal.dailyFoodNoon.split('-');
    var evening = conf_mgr.gConfGlobal.dailyFoodEvening.split('-');
    var hour = new Date().getHours();
    var today = common.getDate();
    //var foodType = conf_mgr.gConfDailyTask['food'];

    var newMark = 0;
    if (hour >= noon[0] && hour < noon[1]) {
        newMark = today * 10 + 1;
    } else if (hour >= evening[0] && hour < evening[1]) {
        newMark = today * 10 + 2;
    }

    /*
    if (task.daily[foodType] != newMark) {
        task.daily[foodType] = newMark;
        task.daily_reward[foodType] = 0;
        player.markDirty('task.daily.' + foodType);
        player.markDirty('task.daily_reward.' + foodType);
    }*/

    var alreadyLockAwards = updateNobility(player);
    if (alreadyLockAwards) {
        resp.data.already_lock_awards = player.addAwards(alreadyLockAwards, req.mod, req.act);
    }

    player.rmTip('daily_task');
    player.rmTip('main_task');

    resp.data.task = user.task;

    onHandled();
};

// 单项每日任务奖励
exports.daily_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var ids = req.args.ids;
        if (!util.isArray(ids) || ids.length == 0) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var valid = true;
        var dailyTask = user.task.daily;
        for (var i = 0, len = ids.length; i < len; i++) {
            var id = ids[i];
            if (!conf_mgr.gConfDailyTask[id]) {
                LOG(1);
                valid = false;
                break;
            }

            if (!dailyTask[id] || dailyTask[id] < conf_mgr.gConfDailyTask[id].target) {
                LOG(2);
                valid = false;
                break;
            }

            if (player.user.task.daily_reward[id]) {
                LOG(3);
                valid = false;
                break;
            }
        }

        if (!valid) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var awards = [];
        for (var i = 0, len = ids.length; i < len; i++) {
            var id = ids[i];
            player.user.task.daily_reward[id] = 1;
            player.markDirty('task.daily_reward.' + id);

            user.task.active += conf_mgr.gConfDailyTask[id].active;
            player.markDirty('task.active');
            var event = conf_mgr.gConfDailyTask[id].event;
            if (event == 'weekCard' || event == 'monthCard' || event == 'longCard') {
                var award = conf_mgr.gConfDailyTask[id].award;  // 基础奖励

                var giftCash = award[0][2];
                user.payment.gift_cash += giftCash;
                player.markDirty('payment.gift_cash');

                var logConf = conf_mgr.gConfPlayLog['activity'][event];
                if (logConf) {
                    player.recordPlay(logConf.logName, logConf.logType);
                }

                if (event == 'monthCard') {
                    // vip额外奖励
                    var vipExtraAward = conf_mgr.gConfVip[user.status.vip].monthCard;
                    if (vipExtraAward.length > 0) {
                        award = award.concat(vipExtraAward);
                    }
                }
                awards = awards.concat(award);
            } else {
                var award = clone(conf_mgr.gConfDailyTask[id].award);

                awards = awards.concat(award);
                player.doGuideTask('task', 1);
            }
        }

        //requestWorldByModAndAct({uid: req.uid}, 'new_legion', 'update_active', {'ids': ids});

        resp.data.awards = player.addAwards(awards, req.mod, req.act);
        resp.data.active = user.task.active;

        var alreadyLockAwards = updateNobility(player);
        if (alreadyLockAwards) {
            resp.data.already_lock_awards = player.addAwards(alreadyLockAwards, req.mod, req.act);
        }

        // user.online_stat.daily_task_count++;
        // player.markDirty('online_stat.daily_task_count');

        // if (user.online_stat.daily_task_count == 5) {
        //     var args = {
        //         openid: player.user.info.account,
        //         sid: config.DistId,
        //         device_id: player.user.info.device_id,
        //         platform: player.user.info.platform,
        //     }
        //     LogCollect(player.uid, 'daily_task_count', args);
        // }

    } while (false);

    onHandled();
};

function updateNobility(player) {
    if (!isModuleOpen_new(player, 'task')) {
        return;
    }

    var user = player.user;
    var active = user.task.active || 0;
    var nobility = user.task.nobility;
    var nobilityId = nobility[0];
    var nobilityStars = nobility[1];
    var baseKey = conf_mgr.gConfNobiltyBase[nobilityId].key;
    var nobilityLevel = conf_mgr.gConfNobiltyLevelKey[baseKey].level + nobilityStars;
    var upgradNobilityLevel = nobilityLevel + 1;
    if (nobilityLevel == conf_mgr.gConfNobiltyLevel.max) {
        return;
    }

    var allCosts = 0;
    for (var id = 2; id <= upgradNobilityLevel; id++) {
        var upgradCosts = conf_mgr.gConfNobiltyLevel[id - 1].active;
        allCosts += upgradCosts;
    }

    if (active < allCosts) {
        return;
    }

    if (!conf_mgr.gConfNobiltyLevel[upgradNobilityLevel].key) {
        nobility[1]++;
        player.markDirty('task.nobility');
    } else {
        var levelKey = conf_mgr.gConfNobiltyLevel[upgradNobilityLevel].key;
        nobility[0] = conf_mgr.gConfNobiltyBaseKey[levelKey].id;
        nobility[1] = 0;
        player.markDirty('task.nobility');

        // 爵位升级，标记属性改变
        player.markFightForceChangedAll();
    }

    var alreadyLockAwards = updateNobilityPrivilege(player);
    return alreadyLockAwards;
};

function updateNobilityPrivilege(player) {
    if (!isModuleOpen_new(player, 'task')) {
        return;
    }

    var user = player.user;
    var active = user.task.active || 0;
    var privilege = user.task.privilege;
    var vip = user.status.vip;
    var nobility = user.task.nobility;
    var nobilityId = nobility[0];
    var nobilityStars = nobility[1];
    var privilegeId = conf_mgr.gConfNobiltyBase[nobilityId]['pg' + nobilityStars];
    if (!privilegeId) {
        return;
    }

    var privilegeCount = conf_mgr.gConfNobiltyBase[nobilityId]['pgnum' + nobilityStars];
    var privilegeType = conf_mgr.gConfNobiltyTitle[privilegeId].key;
    var privilegeLock = conf_mgr.gConfNobiltyTitle[privilegeId].lock;
    var awards = 0;
    if (privilegeLock == 1) {
        // 特权解锁
        if (privilegeType == 'tavernLimit') {
        } else if (privilegeType == 'redDial') {
        } else if (privilegeType == 'lifeCard') {
            if (user.payment.long_card) {
                awards = conf_mgr.gConfNobiltyTitle[privilegeId].award;
            } else {
                // 解锁终身卡
                user.payment.long_card = 1;
                player.markDirty('payment.long_card');
                doDailyTask(player, 'longCard', 1);
                doDailyTask(player, 'doubleCard', 1);
            }
        }

        privilege[privilegeId] = privilegeCount;
        player.markDirty('task.privilege.' + privilegeId);
        player.updateVip();
    } else if (privilegeLock == 2) {
        // 特权累计不包括训练馆
        if (!privilege[privilegeId]) {
            privilege[privilegeId] = privilegeCount;
        } else {
            privilege[privilegeId] += privilegeCount;
        }
        player.markDirty('task.privilege.' + privilegeId);
        var nowPrivilegeCount = privilege[privilegeId];
        if (privilegeType == 'godShopRefresh') {
            user.status.free_gtoken = nowPrivilegeCount;
            player.markDirty('status.free_gtoken');
        } else if (privilegeType == 'equipShopRefresh') {
            user.status.free_mtoken = nowPrivilegeCount;
            player.markDirty('status.free_mtoken');
        } else if (privilegeType == 'vipExp') {
            player.updateVip();
        }
    }

    return awards;
};

// 活跃度奖励
exports.active_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var active = req.args.active;
        var conf = conf_mgr.gConfDailyTaskReward[active];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var task = user.task;
        if (active <= task.daily_active) {
            resp.code = 1; resp.desc = 'already got'; break;
        }

        var userActive = 0;
        var dailyTask = task.daily;
        for (var id in dailyTask) {
            var taskConf = conf_mgr.gConfDailyTask[id];
            if (dailyTask[id] >= taskConf.target) {
                userActive += taskConf.active;
            }
        }

        if (userActive < active) {
            resp.code = 1; resp.desc = 'not achieved'; break;
        }

        task.daily_active = +active;
        player.markDirty('task.daily_active');
        resp.data.awards = player.addAwards(conf.award, req.mod, req.act);
    } while (false);

    onHandled();
};

// 主线任务奖励
exports.mainline_reward = function (player, req, resp, onHandled) {
    var user = player.user;

    do {
        var id = req.args.id;
        var conf = conf_mgr.gConfTask[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var task = user.task;
        var mainTask = task.main;
        var reward = task.main_reward;
        var curProgress = (reward[id] ? reward[id] : 0) + 1;

        if (!conf[curProgress]) {
            resp.code = 1; resp.desc = 'not Achieved1'; break;
        }

        if (conf[curProgress].event == 'fightPower') {
            if (!mainTask[id] || mainTask[id] < conf[curProgress].target * 10000) {
                resp.code = 1; resp.desc = 'not Achieved2'; break;
            }
        } else if (conf[curProgress].event == 'battle' || conf[curProgress].event == 'elite' || conf[curProgress].event == 'hard' || conf[curProgress].event == 'nightmare' || conf[curProgress].event == 'hell') {
            var typeArr = { 'battle': 1, 'elite': 2, 'hard': 3, 'nightmare': 4, 'hell': 5 };
            var tarType = typeArr[conf[curProgress].event];
            var battleType = user.battle.type;
            var battleProgress = user.battle.progress - 1;

            if (battleType < tarType) {
                resp.code = 1; resp.desc = 'battleType not Achieved'; break;
            }
            else if (battleType == tarType) {
                var taskBattleProgress = tarType * 1000 + battleProgress;

                // DEBUG("taskBattleProgress = " + taskBattleProgress);

                if (taskBattleProgress < conf[curProgress].target) {
                    resp.code = 1; resp.desc = 'battleProgress not Achieved'; break;
                }
            }
            else {

            }

        } else {
            if (!mainTask[id] || mainTask[id] < conf[curProgress].target) {
                resp.code = 1; resp.desc = 'not Achieved3'; break;
            }
        }

        if (reward[id]) {
            reward[id]++;
        } else {
            reward[id] = 1;
        }
        player.markDirty('task.main_reward.' + id);
        resp.data.awards = player.addAwards(conf[curProgress].award, req.mod, req.act);

        var type = conf[curProgress].event;
        if (type == 'roleReborn' || type == 'equipGod' || type == 'soldierLevel') {
            calcMainByType(player, type);
            resp.data.progress = mainTask[id];
        }
        else if (type == 'roleQuality') {
            calcMainByType(player, type);
            resp.data.progress = mainTask[id];
        }

        // 刷新成就属性
        for (var pos in user.pos) {
            player.markFightForceChanged(pos);
        }
    } while (false);

    onHandled();
};

// 地图成就任务奖励
exports.world_situation_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        //console.log(util.format("%j", conf_mgr.gConfWorldSituation));
        var id = req.args.id;
        var conf = conf_mgr.gConfWorldSituation[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        if (user.battle.progress < conf.target || !user.battle.progress) {
            resp.code = 1; resp.desc = 'not arrive'; break;
        }

        var task = user.task;
        var reward = task.world_reward;
        if (reward[id]) {
            resp.code = 1; resp.desc = 'has got'; break;
        }

        reward[id] = 1;
        player.markDirty('task.world_reward.' + id);

        resp.data.awards = player.addAwards(conf.award, req.mod, req.act);
    } while (false);

    onHandled();
};

// 获取引导任务数据
exports.get_guide_task = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        resp.data.guide_task = user.guide_task;
    } while (false);

    onHandled();
};

// 领取引导任务奖励
exports.get_guide_task_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = +req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var taskConf = conf_mgr.gConfGuideTask[id];
        if (!taskConf) {
            resp.code = 1; resp.desc = 'can not find task'; break;
        }

        var guide_task = user.guide_task;
        if (!guide_task[id]) {
            resp.code = 1; resp.desc = 'not finish'; break;
        }

        if (taskConf.event == 'villageOpen' || taskConf.event == 'king_treasure') {
            if (guide_task[id][0] != taskConf.condition[0]) {
                resp.code = 1; resp.desc = 'task not finish'; break;
            }
        } else {
            if (guide_task[id][0] < taskConf.condition[0]) {
                resp.code = 1; resp.desc = 'task not finish'; break;
            }
        }

        // 奖励是否已领取
        if (guide_task[id] && guide_task[id][1] > 0) {
            resp.code = 1; resp.desc = 'has got award'; break;
        }

        resp.data.awards = player.addAwards(taskConf.award, req.mod, req.act);
        guide_task[id][1] = 1;
        player.markDirty(util.format('guide_task.%d', id));
    } while (false);

    onHandled();
};

// 更新引导任务变量
exports.update_guide_task_progress = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var event = req.args.event;
        if (!event) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        player.doGuideTask(event, 1);
        resp.data.guide_task = user.guide_task;
    } while (false);

    onHandled();
};

/**
 * 该功能中对英雄的附加属性
 * @param {*} player    玩家信息
 * @param {*} hero      英雄信息
 * @param {*} team      所在队伍信息
 */
exports.hero_additional_attribute = function (player, hero, team) {
    var tAchievementAttr = getAchievementAddAttr(player, hero, team);
    var tNobilityAttr = getNobilityAddAttr(player, hero, team)
    var attrArr = cloneHeroInitAttr();
    for (var tKey in attrArr) {
        var tAchievementValue = tAchievementAttr[tKey] || 0;
        var tNobilityValue = tNobilityAttr[tKey] || 0;
        attrArr[tKey] = tAchievementValue + tNobilityValue;
    }
    return attrArr
}

/** 获取 成就 对应的属性加成 */
function getAchievementAddAttr(player, hero, team) {
    var egg = player.user.status.egg;
    var attrArr = cloneHeroInitAttr();
    var conf = conf_mgr.gConfAchievement;
    var min = 0
    var currProgress = 0
    for (var id in conf) {
        var oneConf = conf[id];
        if (egg < oneConf.egg) { continue; }

        attrArr[1] = attrArr[1] + oneConf['attr1'];
        attrArr[2] = attrArr[2] + oneConf['attr2'];
        attrArr[3] = attrArr[3] + oneConf['attr3'];
        attrArr[4] = attrArr[4] + oneConf['attr4'];
    }
    return attrArr;
}

/** 获取 爵位等级 属性加成 */
function getNobilityAddAttr(player, hero, team) {
    var nobilityArr = player.user.task.nobility;
    var attrArr = cloneHeroInitAttr();

    if (!nobilityArr) { return attrArr; }

    var nobilityId = nobilityArr[0];

    for (i = 1; i <= 4; i++) {
        if (!conf_mgr.gConfNobiltyBase[nobilityId]) { continue; }
        var attrValue = conf_mgr.gConfNobiltyBase[nobilityId]['attr' + i];
        attrArr[i] = attrArr[i] + attrValue;
    }

    return attrArr;
}