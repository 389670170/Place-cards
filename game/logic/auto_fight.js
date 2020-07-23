
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logicCommon = require('./common.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { isModuleOpen_new, reformAwards } = require('../../common/global.js');

const act_name = "auto_fight";

function get_default_data() {
    return {
        /** 挂机背包 */
        'bag': {
            /** 材料 */
            'material': {},
            /** 宝石 */
            'gem': {},
            /** 碎片 */
            'fragment': {},
            /** 卡牌 */
            'card': {},
            /** 装备 */
            'equip': {},
            /** 组 */
            'group': {},
            /** 金币 */
            'gold': 0,
            /** 经验 */
            'xp': 0,
            'hero_exp': 0,
        },
        /** 已经加速的次数 */
        'speed_num': 0,
        /** 上一次结算时间 */
        'last_calc_time': 0,
        /** 上一次领取奖励的时间 */
        'last_get_time': 0,
        'last_calc_equip_time': 0,
        'last_get_equip_time': 0,
        /** 小怪等级 */
        'monster_level': 1,
        /** 存储的掉落次数 */
        'drop_count': 0,
        /** 加速挂机次数 */
        'speed_count': 0,
    };
}

/** 服务器启动时 创建用户数据 player.js中会自动调用 */
exports.init_user_data = function (user) {
    user[act_name] = get_default_data();
};

/** 某些属性变化时 检查活动状态 如等级、关卡变化 player.js中会自动调用 */
exports.check_activity_state = function (player, today) {
    if (!isModuleOpen_new(player, 'exploreMonster')) { return; }                // 判断挂机模块是否开启
    if (player.user.auto_fight.last_calc_time != 0) { return; }
    if (player.user.auto_fight.last_get_time != 0) { return; }

    player.user.auto_fight.last_calc_time = common.getTime();
    player.user.auto_fight.last_get_time = common.getTime();
    player.markDirty('auto_fight.last_calc_time');
    player.markDirty('auto_fight.last_get_equip_time');

    player.user.auto_fight.last_calc_equip_time = common.getTime();
    player.user.auto_fight.last_get_equip_time = common.getTime();
    player.markDirty('auto_fight.last_calc_equip_time');
    player.markDirty('auto_fight.last_get_equip_time');
};

// /** 玩家登录时进行重置信息 player.js中会自动调用 */
// exports.reset_by_login = function (player, today) {
// };

/** 每日的重置函数 player.js中会自动调用 */
exports.reset_by_day = function (player, today) {
    var user = player.user;
    var auto_fight = user.auto_fight;
    auto_fight.speed_num = 0;
    auto_fight.speed_time = 0;
    auto_fight.auto_fight = 0;
    player.markDirty('auto_fight');
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
    var auto_fight = player.user.auto_fight;
    do {
        if (!isModuleOpen_new(player, 'exploreMonster')) { break; }        // 挂机
        player.calcAutoFight();

        var awards = concatAutoFightAwards(player);
        resp.data.auto_fight = {
            bag: awards,
            speed_num: auto_fight.speed_num,
            monster_level: auto_fight.monster_level,
            last_calc_time: auto_fight.last_calc_time,
            last_get_time: auto_fight.last_get_time,
            last_calc_equip_time: auto_fight.last_calc_equip_time,
            last_get_equip_time: auto_fight.last_get_equip_time,
            first_get: auto_fight.first_get || 0,
        };

    } while (false);

    onHandled();
};

/** 登陆时获取功能对应的数据 */
exports.get_login_data = function (player) {
    var auto_fight = player.user.auto_fight;
    return {
        key: act_name,
        get_login_data: {
            monster_level: auto_fight.monster_level,
            auto_fight_last_get_time: auto_fight.last_get_time,
        }
    };
};

/** 获取挂机提示数据 */
exports.get_tips = function (player) {
    var autoFight = player.user.auto_fight;
    var curTime = common.getTime();
    var storageTime = curTime - autoFight.last_get_time;
    var storageMaxTime = conf_mgr.gConfExploreBase['StorageCubage'].value * 3600;// 存储最大时间
    var full = false;   // 是否已满
    if (autoFight.last_get_time > 0 && storageTime >= storageMaxTime) {
        full = true;
    }

    var tipsObj = {};
    tipsObj.full = full;
    return { key: act_name, tips: tipsObj };
};

/** 打开挂机背包 */
exports.open_bag = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        player.calcAutoFight();
        var awards = concatAutoFightAwards(player);
        resp.data.bag = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
};

/** 加速挂机 */
exports.speed_up_hook = function (player, req, resp, onHandled) {
    var user = player.user;
    do {        // 判断加速挂机次数
        var speedNum = user.auto_fight.speed_num;// 已经加速的次数
        if (speedNum >= conf_mgr.gConfVip[user.status.vip].exploreAccelerateTimes) {
            resp.code = 1; resp.desc = 'speed up num is not'; break;
        }

        if (!conf_mgr.gConfBuy[speedNum + 1]) {
            resp.code = 1; resp.desc = 'config error'; break;
        }

        var cost = conf_mgr.gConfBuy[speedNum + 1].exploreAccelerate;// 需要消耗的元宝
        if (!player.checkCosts(cost)) {
            resp.code = 1; resp.desc = 'lack of resources'; break;
        }
        var awards = player.calcAutoFight(conf_mgr.gConfExploreBase['exploreAccelerateTime'].value);

        user.auto_fight.speed_num += 1;
        player.markDirty('auto_fight.speed_num');

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'exploreSpeedUp', 1)
        logic_event_mgr.emit(logic_event_mgr.EVENT.SPEED_UP, player);

        resp.data.cost = player.addAwards(cost, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act)
    } while (false);
    onHandled();
};

/** 领取奖励 */
exports.get_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        player.calcAutoFight();
        var awards = concatAutoFightAwards(player);
        if (!user.auto_fight.first_get) {            // 首次挂机
            user.auto_fight.first_get = 1;
            player.markDirty('auto_fight.first_get');
            awards = awards.concat(conf_mgr.gConfSpecialReward['first_explore_speed'].reward);
        }


        resp.data.last_calc_time = user.auto_fight.last_calc_time;
        resp.data.last_calc_equip_time = user.auto_fight.last_calc_equip_time;

        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        clearAutoFightBag(player);
        resp.data.last_get_time = user.auto_fight.last_get_time;
    } while (false);

    onHandled();
};

/** 掉落次数 */
function getAutoFightDropCount(player, speed) {
    var user = player.user;
    var retCount = {
        'equipCount': 0,
        'dropCount': 0,
    };

    var dropTime = player.getAutoFightDropInterval();
    var equipTime = player.getAutoFightEquipDropInterval()

    var diffTime = 0;
    if (speed) {            // 加速挂机
        diffTime = speed * 3600;
        retCount.dropCount = Math.floor(diffTime / dropTime);
        retCount.equipCount = Math.floor(diffTime / equipTime);
    } else {
        var curTime = common.getTime();
        var storageMaxTime = conf_mgr.gConfExploreBase['StorageCubage'].value * 3600;// 存储最大时间

        var storageExistTime = user.auto_fight.last_calc_time - user.auto_fight.last_get_time;// 已经存储的时间
        if (storageExistTime >= storageMaxTime) { //full
            storageExistTime = storageMaxTime;
        }

        var needCalcTime = curTime - user.auto_fight.last_calc_time;
        if (needCalcTime < 0) {
            needCalcTime = 0;
        }

        diffTime = Math.min(storageMaxTime - storageExistTime, needCalcTime);
        retCount.dropCount = Math.floor(diffTime / dropTime);

        if (diffTime == needCalcTime) { // a little time last
            user.auto_fight.last_calc_time = user.auto_fight.last_calc_time + (retCount.dropCount) * dropTime;
        } else {// full
            user.auto_fight.last_calc_time = curTime;
        }

        player.markDirty('auto_fight.last_calc_time');

        var storageEquipExistTime = user.auto_fight.last_calc_equip_time - user.auto_fight.last_get_equip_time;// equip
        if (storageEquipExistTime >= storageMaxTime) {
            storageEquipExistTime = storageMaxTime;
        }
        var equippassTime = curTime - user.auto_fight.last_calc_equip_time;
        if (equippassTime < 0) {
            equippassTime = 0;
        }

        diffTime = Math.min(storageMaxTime - storageEquipExistTime, equippassTime);
        retCount.equipCount = Math.floor(diffTime / equipTime);

        if (diffTime == equippassTime) { // a little time last
            user.auto_fight.last_calc_equip_time = user.auto_fight.last_calc_equip_time + retCount.equipCount * equipTime;
        } else {// full
            user.auto_fight.last_calc_equip_time = curTime;
        }

        player.markDirty('auto_fight.last_calc_equip_time');
    }

    return retCount;
};

/** 计算挂机产出（结算奖励 to bag） */
exports.calcAutoFight = function (player, speed) {
    if (isModuleOpen_new(player, 'exploreMonster') == false) {
        ERROR("--------calcAutoFight----NO OPEN-------");
        return;
    }

    var user = player.user;
    var cycle = getAutoFightDropCount(player, speed);
    var dropCount = cycle.dropCount;// * heroCount; // 掉落次数

    var monsterLevel = user.auto_fight.monster_level;
    if (!monsterLevel)
        monsterLevel = 1;

    var monsterConf = conf_mgr.gConfExploreMonster[monsterLevel];
    if (!monsterConf) { return; }

    var awards = [];
    var battleType = 1;
    var battleProgress = 1;
    // if (user.battle.progress == 1) {
    //     if (user.battle.type == 1) {
    //         battleProgress = user.battle.progress;
    //         battleType = user.battle.type
    //     } else {
    //         battleType = user.battle.type - 1;
    //         battleProgress = 150;
    //     }
    // } else {
    //     battleType = user.battle.type
    //     battleProgress = user.battle.progress - 1;
    // }

    var customConf = conf_mgr.gConfCustomSet[battleProgress];
    if (dropCount > 0) {
        awards.push(['user', 'xp', customConf.singleExp * dropCount]);
        awards.push(['user', 'gold', customConf.singleGold * dropCount]);
        awards.push(['user', 'hero_exp', customConf.singleHeroExp * dropCount]);

        awards = reformAwards(awards);                                                  // 合并同类型的奖励

        if (speed) {                                                                    // 加速挂机
            if (!user.auto_fight.speed_count) {
                user.auto_fight.speed_count = 1;
                player.markDirty('auto_fight.speed_count');

            }

            return awards;
        } else {
            user.auto_fight.drop_count += cycle.dropCount;;

            if (user.auto_fight.last_calc_time > common.getTime()) {
                Error('last_calc_time error');
            }

            player.markDirty('auto_fight.drop_count');
            addAutoFightAwards(player, awards);
        }
    }
};

/** 添加挂机背包 */
function addAutoFightAwards(player, awards) {
    if (!awards) { return false; }
    var user = player.user;
    for (var i = 0, max = awards.length; i < max; i++) {
        var award = awards[i];
        if (!award) continue;
        var awardType = award[0];
        var awardId = award[1];

        var awardNum = 0;
        if (awardType == 'equip') {
            if (award.length == 5) {
                awardNum = Math.floor(+award[award.length - 2]);
            } else {
                awardNum = Math.floor(+award[award.length - 1]);
            }
        } else {
            awardNum = Math.floor(+award[2]);
        }
        if (isNaN(awardNum) || !awardNum) continue;

        if (awardType == 'user' && awardId != 'gold' && awardId != 'xp' && awardId != 'hero_exp') { continue; }            // 目前只处理gold

        if (awardType == 'user') {
            if (awardId == 'gold') {
                user.auto_fight.bag.gold += awardNum;
            } else if (awardId == 'xp') {
                user.auto_fight.bag.xp += awardNum;
            } else if (awardId == 'hero_exp') {
                if (!user.auto_fight.bag.hero_exp) {
                    user.auto_fight.bag.hero_exp = 0;
                }
                user.auto_fight.bag.hero_exp += awardNum;
            }
        } else if (awardType == 'group') {
            awardNum = award[3];
            if (!user.auto_fight.bag[awardType]) {
                user.auto_fight.bag[awardType][awardId] = awardNum;
            } else {
                user.auto_fight.bag[awardType][awardId] += awardNum;
            }
        } else if (awardType == 'equip') {// by fish
            var grade = award[2];
            if (!user.auto_fight.bag[awardType] || !util.isArray(user.auto_fight.bag[awardType])) {
                user.auto_fight.bag[awardType] = [];
            } else {
                user.auto_fight.bag[awardType].push([awardId, grade, awardNum]);
            }
        } else {
            if (!user.auto_fight.bag[awardType][awardId]) {
                user.auto_fight.bag[awardType][awardId] = awardNum;
            } else {
                user.auto_fight.bag[awardType][awardId] += awardNum;
            }
        }
    }

    player.markDirty('auto_fight.bag');
};

/** 拼接挂机背包奖励串 */
function concatAutoFightAwards(player) {
    var user = player.user;
    var bag = user.auto_fight.bag;
    var awards = [];
    if (bag.gold > 0) {
        awards.push(['user', 'gold', bag.gold]);
    }
    if (bag.xp > 0) {
        awards.push(['user', 'xp', bag.xp]);
    }

    if (bag.hero_exp > 0) {
        awards.push(['user', 'hero_exp', bag.hero_exp]);
    }

    for (var materialId in bag.material) {
        awards.push(['material', parseInt(materialId), parseInt(bag.material[materialId])]);
    }

    for (var gemId in bag.gem) {
        awards.push(['gem', parseInt(gemId), parseInt(bag.gem[gemId])]);
    }

    for (var fragmentId in bag.fragment) {
        awards.push(['fragment', parseInt(fragmentId), parseInt(bag.fragment[fragmentId])]);
    }

    for (var cardId in bag.card) {
        awards.push(['card', parseInt(cardId), parseInt(bag.card[cardId])]);
    }

    var equipcont = bag.equip.length;
    for (var eci = 0; eci < equipcont; eci++) {
        var equipArr = bag.equip[eci];
        var equipId = equipArr[0];
        var equipGrade = equipArr[1];
        var equipNum = equipArr[2];

        awards.push(['equip', parseInt(equipId), parseInt(equipGrade), equipNum]);
    }

    for (var groupId in bag.group) {
        for (var i = 0; i < bag.group[groupId]; i++) {
            var itemGroupConf = conf_mgr.gConfItemGroupConfig[groupId];
            if (!itemGroupConf) continue;

            var totalOdds = 0;
            for (var j in itemGroupConf) {
                totalOdds += itemGroupConf[j].weight;
            }

            // 随机出一个奖励
            var awardIndex = 0;
            var rangeOdd = 0;
            var flag = 1; // 随机出一个奖励，json不能break
            var randOdd = common.randRange(0, totalOdds);
            for (var j in itemGroupConf) {
                if (flag) {
                    rangeOdd += itemGroupConf[j].weight;
                    if (randOdd < rangeOdd) {
                        awardIndex = j;
                        flag = 0;
                        break;
                    }
                }
            }

            var award = '';
            try {
                award = itemGroupConf[awardIndex].award[0];
            } catch (e) {
                award = ''
            }
            if (award) {
                var awardType = award[0];
                var awardId = award[1];
                var awardNum = parseInt(award[2]);

                awards.push([awardType, awardId, awardNum]);
            }
        }
    }

    awards = reformAwards(awards);        // 合并奖励

    return awards;
};

/** 清理挂机背包 */
function clearAutoFightBag(player) {
    var bag = player.user.auto_fight.bag;
    var user = player.user;

    bag.gold = 0;
    bag.xp = 0;
    bag.hero_exp = 0;

    bag.material = {};
    bag.gem = {};
    bag.fragment = {};
    bag.card = {};
    bag.equip = {};
    bag.group = {};


    user.auto_fight.drop_count = 0;
    user.auto_fight.speed_time = 0;             // 领取奖励，加速卡清0

    user.auto_fight.last_get_time = user.auto_fight.last_calc_time;
    user.auto_fight.last_get_equip_time = user.auto_fight.last_calc_equip_time;

    player.markDirty('auto_fight.bag');
    player.markDirty('auto_fight.last_get_equip_time');
    player.markDirty('auto_fight.last_get_time');
    player.markDirty('auto_fight.drop_count');
};