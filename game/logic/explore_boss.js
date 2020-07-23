
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logicCommon = require('./common.js');
const loginCommon = require('./common.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const PlayerManager = require('./player_manager.js');
const { isModuleOpen_new } = require('../../common/global.js');

/** 大本营-boss */
const act_name = "explore_boss";

function get_default_data() {
    return {
        /** 已经刷新的次数 */
        'already_num': 0,
        'boss_birth': [
            // {
            //     /** boss type */
            //     type : 0,
            //     /** 路径点id */
            //     path_id : 0
            //     /**  点击次数 */
            //     click_count : 0,
            // }
        ],

        /** boss击杀数量 */
        'boss_kill_list': [],

        /** boss出生序列 */
        'boss_birth_sequence': [],
        /** 已创建boss数量 */
        'boss_create_count': 0,
        /** 已击杀boss数量 */
        'boss_kill_count': 0,
        /** 上次刷新boss的时间 */
        'boss_last_birth_time': 0,
        /** 特殊掉落索引 */
        'boss_special_award_index': [],
    }
}

/** 服务器启动时 创建用户数据 player.js中会自动调用 */
exports.init_user_data = function (user) {
    user[act_name] = get_default_data();
};

/** 某些属性变化时 检查活动状态 如等级、关卡变化 player.js中会自动调用 */
exports.check_activity_state = function (player, today) {
    if (!isModuleOpen_new(player, 'exploreBoss')) { return; }           // 黑森林boss
    var explore_boss = player.user.explore_boss;

    if (explore_boss.boss_birth_sequence.length == 0) {            // 如果还没初始化过，或者已经过了一轮了，需要重新随机

        explore_boss.boss_birth_sequence = [];
        explore_boss.boss_create_count = 0;

        var initSeq = conf_mgr.gConfGlobal.exploreBossInit.split('|');
        for (var i = 0; i < initSeq.length; i++) {
            explore_boss.boss_birth_sequence.push(parseInt(initSeq[i]));
        }

        player.markDirty('explore_boss.boss_birth_sequence');
        player.markDirty('explore_boss.boss_create_count');
    }

    if (explore_boss.boss_create_count >= explore_boss.boss_birth_sequence.length) {
        resetBossSequence(player);
    }

    if (explore_boss.boss_last_birth_time == 0) {
        generateBoss(player);
    }

    generateBossSpecialAward(player);
};

/** 玩家登录时进行重置信息 player.js中会自动调用 */
exports.reset_by_login = function (player, today) {
    if (isModuleOpen_new(player, 'exploreBoss')) { return; }            // 设置boss定时器
};

// /** 每日的重置函数 player.js中会自动调用 */
// exports.reset_by_day = function (player, today) {
// };

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

/** 每秒触发一次 */
exports.update = function (dt) {
    var tPlayerDict = PlayerManager.get_now_players()
    var tBossBirthInterval = getBossBirthInterval();
    for (var tKey in tPlayerDict) {
        var player = tPlayerDict[tKey];
        if (!player) { continue; }
        if (!player.user) { continue; }
        var explore_boss = player.user.explore_boss;
        if (!explore_boss) { continue; }
        if (explore_boss.boss_last_birth_time < dt - tBossBirthInterval) { continue; }
        generateBoss(player);
    }
}

/**---------------------------------------------------------------------------------------------------------**/

/** 获取信息 */
exports.get = function (player, req, resp, onHandled) {
    var user = player.user;
    var explore_boss = player.user.explore_boss;
    do {

        if (!isModuleOpen_new(player, 'exploreBoss')) { break; }        // boss
        resp.data.boss = {
            boss_birth: explore_boss.boss_birth,
            boss_kill_list: explore_boss.boss_kill_list
        };
    } while (false);

    onHandled();
};

/** 登陆时获取功能对应的数据 */
exports.get_login_data = function (player) {
    var explore_boss = player.user.explore_boss;
    return {
        key: act_name,
        get_login_data: {
            boss_birth: explore_boss.boss_birth
        }
    };
};

/** 获取挂机中boss相关提示数据 */
exports.get_tips = function (player) {
    var autoFight = player.user.auto_fight;
    var curTime = common.getTime();

    var hasBossAward = false;   // 是否有boss奖励可以兑换
    if (autoFight.boss.boss_kill_count) {
        for (var i = 1; i <= 3; i++) {
            if (autoFight.boss.boss_kill_count[i] >= conf_mgr.gConfExploreBoss[i].awardNeed) {
                hasBossAward = true;
                break;
            }
        }
    }

    var tipsObj = {};
    tipsObj.hasBossAward = hasBossAward;
    return { key: act_name, tips: tipsObj };
};

/**
 * 挑战boss
 * @type  boss的type
 * @positionId    boss坐标点id
 */
exports.fight_boss = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pathId = req.args.path_id;
        var clickCount = req.args.clickCount;
        if (!pathId || !clickCount) {
            resp.code = 1; resp.desc = 'args invalid'; break;
        }

        var explore_boss = user.explore_boss;
        var explore_boss = user.explore_boss;
        var boss_kill_list = explore_boss.boss_kill_list;
        var boss_birth = explore_boss.boss_birth;
        var is_first = 0;
        var fightBossIndex = null; // 需要被删除的boss
        for (var i = 0; i < boss_birth.length; i++) {
            if (boss_birth[i].path_id == pathId) {
                fightBossIndex = i;
                break;
            }
        }

        if (fightBossIndex == null) {
            DEBUG('can not find boss, client path id = ' + pathId);
            for (var i = 0; i < boss_birth.length; i++) {
                DEBUG('i = ' + i + ', pathid = ' + boss_birth[i].path_id);
            }

            resp.data.boss_birth = explore_boss.boss_birth;
            resp.code = 100; resp.desc = 'can not find boss'; break;
        }

        var type = +boss_birth[fightBossIndex].type;

        if (!boss_kill_list[type]) {
            boss_kill_list[type] = 0;
            player.markDirty('explore_boss.boss_kill_list');
        }

        var maxCountClick = conf_mgr.gConfExploreBoss[type].maxClickCount;// 总点击次数
        boss_birth[fightBossIndex].click = clickCount;
        player.markDirty('explore_boss.boss_birth');

        if (boss_birth[fightBossIndex].click >= maxCountClick) {// 是否可以获取奖励
            var bossConf = conf_mgr.gConfExploreBoss[type];
            var awards = generateDrop(bossConf.lootId); // 必掉奖励
            if (hasBossSpecialAward(player, type)) {
                awards = awards.concat(generateDrop(bossConf.specialLootId, player.user.status.level, 'true'))
            }
            if (explore_boss.boss_kill_list == 0) {
                // 这是第一只
                is_first = 1;
            }

            boss_kill_list[type] += 1;
            explore_boss.boss_kill_list += 1;

            player.markDirty('explore_boss.boss_kill_list');
            player.markDirty('explore_boss.boss_kill_count');

            // 移除被击杀的boss
            boss_birth.splice(fightBossIndex, 1);
            player.markDirty('explore_boss.boss_birth');

            // 周期到了，要重新生成特殊奖励
            if (explore_boss.boss_kill_count % bossConf.specialLootFrequency[1] == 0) {
                resetBossSpecialAwardByType(player, type);
                generateBossSpecialAwardByType(player, type);
            }

            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'exploreBoss', 1);
            player.doGuideTask('exploreBoss', 1);
        }

        resp.data.boss_birth = explore_boss.boss_birth;
        resp.data.boss_kill_count = boss_kill_count[type];
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
        resp.data.is_first = is_first;

        logic_event_mgr.emit(logic_event_mgr.EVENT.GET_GOBLIN, player);
    } while (false);
    onHandled();
};

/** 重置指定boss特殊掉落 */
function resetBossSpecialAwardByType(player, type) {
    var explore_boss = player.user.explore_boss;
    explore_boss.boss_special_award_index[type - 1] = 0;
    generateBossSpecialAwardByType(player, type);
};

/** 是否要特殊掉落 */
function hasBossSpecialAward(player, bossType) {
    var explore_boss = player.user.explore_boss;
    var bossConf = conf_mgr.gConfExploreBoss[bossType];
    var cycle = bossConf.specialLootFrequency[1];
    var curIndex = explore_boss.boss_kill_list[bossType] % cycle;
    return (curIndex == explore_boss.boss_special_award_index[bossType - 1]);
};

/**
 * 兑换奖励
 * @type 需要兑换boss奖励的type值
 */
exports.convert_awards = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var type = +req.args.type;// 兑换奖励的类型
        if (!conf_mgr.gConfExploreBoss[type]) {
            resp.code = 1; resp.desc = 'type error'; break;
        }

        var need = conf_mgr.gConfExploreBoss[type].awardNeed;

        var killCount = user.explore_boss.boss_kill_list[type];
        if (killCount == undefined) {
            resp.code = 1; resp.desc = 'type error'; break;
        }

        if (killCount < need) {
            resp.code = 1; resp.desc = 'kill_boss num not enough'; break;
        }

        user.explore_boss.boss_kill_list[type] -= need;
        player.markDirty(util.format('explore_boss.boss_kill_list.%d', type));

        var awards = generateDrop(conf_mgr.gConfExploreBoss[type].awardId, user.status.level);

        resp.data.awards = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
};

/** 获取哥布林击杀数 */
function getExploreBossKillCount(player, type) {
    var user = player.user;
    var count = 0;
    if (type) {
        return user.explore_boss.boss_kill_list[type] || 0;
    } else {
        for (var i = 1; i <= 3; i++) {
            if (user.explore_boss.boss_kill_list[i]) {
                count += parseInt(user.explore_boss.boss_kill_list[i]);
            }
        }
    }

    return count;
};

/** 补齐boss */
function generateBoss(player) {
    var explore_boss = player.user.explore_boss;

    var addCount = 0;
    var birthCount = 1;
    if (explore_boss.boss_birth_sequence.length <= conf_mgr.gConfExploreBase.bossSysAmountLmint.value) {            // 首次要生成3只
        birthCount = explore_boss.boss_birth_sequence.length;
    }

    var bossCount = 0;
    var curTime = common.getTime();
    if (explore_boss.boss_last_birth_time > 0) {            // 计算一下当前时间减去上次boss刷新时间够刷几只
        var passTime = curTime - explore_boss.boss_last_birth_time;
        bossCount = Math.floor(passTime / getBossBirthInterval());
        if (bossCount > birthCount) {
            birthCount = bossCount;
        }
    }

    if (birthCount > conf_mgr.gConfExploreBase.bossSysAmountLmint.value) {
        birthCount = conf_mgr.gConfExploreBase.bossSysAmountLmint.value;
        DEBUG('in player generateBoss birthCount is too big, please careful!');
    }

    for (var i = 0; i < birthCount; i++) {
        var newBoss = getNewBoss(player);
        if (newBoss) {
            var bossObj = {};
            bossObj.type = newBoss[0];
            bossObj.path_id = newBoss[1];
            bossObj.click = 0;

            if (explore_boss.boss_kill_count == 0 && explore_boss.boss_birth.length == 0) {                    // 这是第一只
                bossObj.is_first = 1;
            }
            explore_boss.boss_birth.push(bossObj);
            player.markDirty('explore_boss.boss_birth');

            addCount++;
        }
    }

    if (addCount > 0) {
        if (explore_boss.boss_last_birth_time == 0) {
            explore_boss.boss_last_birth_time = curTime;
        } else {
            explore_boss.boss_last_birth_time = explore_boss.boss_last_birth_time + addCount * getBossBirthInterval();
            if (curTime > explore_boss.boss_last_birth_time + getBossBirthInterval()) {
                explore_boss.boss_last_birth_time = curTime;
            }
        }

        player.markDirty('explore_boss.boss_last_birth_time');
    } else {            // 已经满了，不需要再生成，那把上次刷新时间更新下
        if (explore_boss.boss_last_birth_time == 0) {
            explore_boss.boss_last_birth_time = curTime;
        } else {
            if (explore_boss.boss_last_birth_time == NaN || !explore_boss.boss_last_birth_time) {
                explore_boss.boss_last_birth_time = curTime;
            } else {
                explore_boss.boss_last_birth_time = explore_boss.boss_last_birth_time + bossCount * getBossBirthInterval();
                if (curTime > explore_boss.boss_last_birth_time + getBossBirthInterval()) {
                    explore_boss.boss_last_birth_time = curTime;
                }
            }
        }

        player.markDirty('explore_boss.boss_last_birth_time');
    }

    if (addCount > 0) {
        pushToUser(player.uid, 'self', {
            mod: 'auto_fight',
            act: 'boss_birth',
            boss_birth: explore_boss.boss_birth,
        });
    }

    return addCount;
};

/** 生成间隔 */
function getBossBirthInterval() {
    return conf_mgr.gConfExploreBase.bossBornInterval.value * 3600;
};

/** 生成特殊掉落 */
function generateBossSpecialAward(player) {
    for (var type in conf_mgr.gConfExploreBoss) {
        generateBossSpecialAwardByType(player, type);
    }
};

function generateBossSpecialAwardByType(player, type) {
    var explore_boss = player.user.explore_boss;
    if (!explore_boss.boss_special_award_index[type - 1]) {
        var conf = conf_mgr.gConfExploreBoss[type];
        var startIndex = conf.specialLootFrequency[0] - 1;
        var endIndex = conf.specialLootFrequency[1] - 1;
        var randIndex = common.randRange(startIndex, endIndex);
        explore_boss.boss_special_award_index[type - 1] = randIndex;
        player.markDirty('explore_boss.boss_special_award_index');
    }
};

/** 随机一个boss */
function getNewBoss(player) {
    var explore_boss = player.user.explore_boss;

    if (explore_boss.boss_create_count >= explore_boss.boss_birth_sequence.length) {            // 判断是否要重置boss序列
        resetBossSequence(player);
    }

    var index = explore_boss.boss_create_count;
    var bossType = explore_boss.boss_birth_sequence[index];

    var existPathIds = [];
    for (var i = 0; i < explore_boss.boss_birth.length; i++) {            // 获取已经存在的路点
        existPathIds.push(explore_boss.boss_birth[i].path_id);
    }

    var newPathId = loginCommon.getRandomPathId(existPathIds);
    if (newPathId == 0) {
        return null;
    }

    explore_boss.boss_create_count++;
    player.markDirty('explore_boss.boss_create_count');

    return [bossType, newPathId];
};

/** 生成boss序列 */
function resetBossSequence(player) {
    var explore_boss = player.user.explore_boss;

    explore_boss.boss_birth_sequence = [];
    explore_boss.boss_create_count = 0;

    var totalCount = 0
    var indexArr = [];
    for (var k in conf_mgr.gConfExploreBoss) {
        var bossConf = conf_mgr.gConfExploreBoss[k];
        totalCount += bossConf.bossFrequency;
    }

    for (var i = 0; i < totalCount; i++) {
        indexArr[i] = i;
        explore_boss.boss_birth_sequence[i] = 0;
    }

    for (var k in conf_mgr.gConfExploreBoss) {
        var bossConf = conf_mgr.gConfExploreBoss[k];
        for (var i = 0; i < bossConf.bossFrequency; i++) {
            if (indexArr.length > 0) {
                var rand = common.randRange(0, indexArr.length - 1);
                var index = indexArr[rand];

                explore_boss.boss_birth_sequence[index] = k;
                indexArr.splice(rand, 1);
            }
        }
    }

    player.markDirty('explore_boss.boss_birth_sequence');
    player.markDirty('explore_boss.boss_create_count');
};