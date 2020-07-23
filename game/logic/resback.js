
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');

const task_mod = require('./task.js');

const { isModuleOpen_new, reformAwards } = require('../../common/global.js');

function setResBack(player, resback, mod, day, awards, remainnum) {
    if (!resback[mod]) {
        resback[mod] = {};
        resback[mod][day] = {};
        resback[mod][day]['awards'] = awards;
        resback[mod][day]['remainnum'] = remainnum || 1;
        player.markDirty('resback.' + mod);
    } else {
        resback[mod][day] = {};
        resback[mod][day]['awards'] = awards;
        resback[mod][day]['remainnum'] = remainnum || 1;

        player.markDirty(util.format('resback.%s.%d', mod, day));
    }
}

function setResBackGet(player, resback, mod, day) {
    delete resback[mod][day];
    player.markDirty(util.format('resback.%s', mod));
}

// 根据参与等级获取试炼配置
function getLegionTrialBaseConf(join_level) {
    var fit_level = 1;
    var pre_key = 1;
    for (var k in conf_mgr.gConfLegionTrialBaseConfig) {
        fit_level = pre_key;
        if (k > join_level) {
            break;
        } else if (k == join_level) {
            fit_level = parseInt(k);
        }

        pre_key = parseInt(k);
    }

    var conf = conf_mgr.gConfLegionTrialBaseConfig[fit_level];
    return conf;
}

var JADE_COLORS = {
    1: 'green',
    2: 'blue',
    3: 'purple',
    4: 'orange',
    5: 'red',
};

var mods = {
    'tower': function (player, endDay, days) {
        if (!isModuleOpen_new(player, 'tower')) {
            return;
        }

        var tower = player.user.tower;
        for (var i = 0; i < days; i++) {
            var awards = [];
            /*for (var floor in tower.floor) {
                if (i!=days-1 || (floor >= tower.cur_floor && !tower.failed)) {
                    for (var room in tower.floor[floor]) {
                        if (room == 'attr' || ( i==days-1 && floor == tower.cur_floor && room < tower.cur_room)) {
                            continue;
                        }

                        if (tower.floor[floor][room]) {
                            var star = tower.floor[floor][room];
                            if(star<=0)
                                continue;
                            var level = (floor - 1) * 3 + (+room);
                            var starAwardConf = conf_mgr.gConfTowerCoinReward[level];
                            towerCoin = starAwardConf['normal3'];
                            awards.push(['user', 'tower', towerCoin]);
                        }
                    }
                }
            }*/

            awards = reformAwards(awards);
            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'tower', day, awards);
            }
        }
    },

    'dragon': function (player, endDay, days) {
        if (!isModuleOpen_new(player, 'digging')) {
            return;
        }

        for (var i = 0; i < days; i++) {
            var awards = [];
            var canGet = i != days - 1 ? 1 : player.user.digging.isdigging ? 0 : 1;
            if (canGet) {
                var awardDragon = ['material', conf_mgr.gConfResback['dragon'].para[0], conf_mgr.gConfResback['dragon'].para[1]];
                awards.push(awardDragon);
                var awardBox = ['material', conf_mgr.gConfResback['dragon'].para[2], conf_mgr.gConfResback['dragon'].para[3]];
                awards.push(awardBox);
            }

            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'dragon', day, awards);
            }
        }
    },

    'task': function (player, endDay, days) {
        if (!isModuleOpen_new(player, 'task')) {
            return;
        }

        var daily_reward = player.user.task.daily_reward;
        for (var i = 0; i < days; i++) {
            var awards = [];
            var skip = i ? 1 : 0;
            var xpAdd = 0;
            for (var id in conf_mgr.gConfDailyTask) {
                if (!isModuleOpen_new(player, conf_mgr.gConfDailyTask[id].key)) {
                    continue;
                }

                if (!skip && daily_reward[id]) {
                    continue;
                }

                var confAwards = conf_mgr.gConfDailyTask[id].award;
                if (!confAwards) {
                    continue;
                }

                for (var k = 0; k < confAwards.length; k++) {
                    var award = confAwards[k];
                    if (award[1] == 'xp') {
                        xpAdd += award[2];
                    }
                }
            }

            if (xpAdd != 0) {
                var award = ['user', 'xp', xpAdd];
                awards.push(award);
            }

            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'task', day, awards);
            }
        }
    },

    'food': function (player, endDay, days) {
        //第一天不找回
        var foodget = player.user.task.food_get;
        var id = conf_mgr.gConfResback['food'].para[0];
        var privilege = player.user.task.privilege;

        for (var i = 0; i < days; i++) {
            var awards = [];

            var noonAwards = clone(conf_mgr.gConfDailyTask[id].award);
            var noonFoodPrivilegeId = conf_mgr.gConfNobiltyTitleKey['lunch'].id;
            if (privilege[noonFoodPrivilegeId]) {
                // noonAwards[0][2] += privilege[noonFoodPrivilegeId]
                noonAwards[0][2] += task_mod.getPrivilegeVal(player, 'lunch');
            }

            if (i != days - 1 || foodget.indexOf(noonFoodPrivilegeId) < 0)
                awards.combine(noonAwards);

            var eveningAwards = clone(conf_mgr.gConfDailyTask[id].award);
            var eveningFoodPrivilegeId = conf_mgr.gConfNobiltyTitleKey['dinner'].id;
            if (privilege[eveningFoodPrivilegeId]) {
                // eveningAwards[0][2] += privilege[eveningFoodPrivilegeId];
                eveningAwards[0][2] += task_mod.getPrivilegeVal(player, 'dinner');
            }

            if (i != days - 1 || foodget.indexOf(eveningFoodPrivilegeId) < 0)
                awards.combine(eveningAwards);

            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'food', day, awards, awards.length);
            }
        }
    },

    'explore': function (player, endDay, days) {
        if (!isModuleOpen_new(player, 'legion')) {
            return;
        }

        if (!player.user.legion.explore_play) {
            return;
        }

        var trialData = player.user.trial;
        for (var i = 0; i < days; i++) {
            var awards = [];
            var checkGet = i != days - 1 ? 0 : 1;
            var remainnum = 3;
            var coinAdd = 0;
            for (var k = 1; k < 4; k++) {
                if (checkGet && trialData.round[k].award_got) {
                    remainnum--;
                    continue;
                }

                var baseConf = getLegionTrialBaseConf(trialData.join_level);
                coinAdd += baseConf.coinBaseAward;
            }

            if (coinAdd != 0) {
                var award = ['user', 'trial_coin', coinAdd];
                awards.push(award);
            }


            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'explore', day, awards, remainnum);
            }
        }
    },

    'copy': function (player, endDay, days) {
        if (!isModuleOpen_new(player, 'legion')) {
            return;
        }

        var legion = player.user.legion;
        if (!legion.copy_play) {
            return;
        }

        for (var i = 0; i < days; i++) {
            var awards = [];
            var daynum = conf_mgr.gConfLegion.legionCopyFightLimit + legion.copy_buy - legion.copy_count;
            var remainnum = i != days - 1 ? conf_mgr.gConfLegion.legionCopyFightLimit : daynum;

            for (var k = 0; k < remainnum; k++) {
                var award = ['user', 'legion', conf_mgr.gConfLegion.legionCopyFightReward];
                awards.push(award);
            }

            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'copy', day, awards, remainnum);
            }
        }
    },

    'trial': function (player, endDay, days) {
        if (!isModuleOpen_new(player, 'legion')) {
            return;
        }

        var legion = player.user.legion;
        if (!legion.trial_play) {
            return;
        }

        for (var i = 0; i < days; i++) {
            var awards = [];

            awards = reformAwards(awards);
            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'trial', day, awards, remainnum);
            }
        }
    },

    'mine': function (player, endDay, days) {
        var mine = player.user.mine;
        if (!isModuleOpen_new(player, 'goldmine')) {
            return;
        }

        for (var i = 0; i < days; i++) {
            var awards = [];
            var getAward = i != days - 1 ? 1 : mine.occupy_count ? 0 : 1;
            if (getAward) {
                var level = Math.floor(player.user.status.level / 10);
                var gold = 10;
                var award = ['user', 'gold', gold];
                awards.push(award);
            }

            if (awards.length) {
                var day = common.getDate(common.getTime(endDay) - i * 86400 - 86400);
                setResBack(player, player.user.resback, 'mine', day, awards);
            }
        }
    },
};

exports.check_resback = function (player) {
    if (!isActivityStart(player, 'res_back')) {
        return 0;
    }

    var resback = player.user.resback;
    for (var mod in resback) {
        var modBack = resback[mod];
        for (var date in modBack) {
            return 1;
        }
    }

    return 0;
}

exports.calc_resback = function (player, endDay, days) {
    if (!player.user.hasOwnProperty('resback')) {
        player.user.resback = {};
        player.markDirty('resback');
    }

    var resback = player.user.resback;
    for (var mod in resback) {
        var modBack = resback[mod];
        for (var date in modBack) {
            if (common.getDateDiff(endDay, date) > 7) {
                delete modBack[date];
                player.markDelete(util.format('resback.%s.%d', mod, date));
            }
        }

        if (Object.isEmpty(modBack)) {
            delete resback[mod];
            player.markDelete('resback.' + mod);
        }
    }

    for (var mod in mods) {
        mods[mod](player, endDay, days);
    }
};

exports.get = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'res_back')) {
            resp.code = 1; resp.desc = 'not open'; onHandled(); return;
        }

        resp.data.shipper = user.resback;
    } while (false);

    onHandled();
};

/**
 * 资源找回
 * @day 日期  20171107
 * @mod 找回资源的类型
 * @isCash  1(元宝找回)/0(免费找回)
 */
exports.get_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'res_back')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var day = req.args.day;
        var mod = req.args.mod;
        var resback = user.resback;
        var conf = conf_mgr.gConfResback[mod];

        if (!conf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }

        if (!resback[mod] || !resback[mod][day]) {
            resp.code = 1; resp.desc = 'no award'; break;
        }

        var isCash = req.args.isCash;
        var costs = [];
        if (isCash) {
            var costnum = resback[mod][day]['remainnum'] * conf.perCash;
            costs = [['user', 'cash', -costnum]];
        }

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = "cash not enough"; break;
        }

        var awards = [];
        for (var i = 0; i < resback[mod][day]['awards'].length; i++) {
            var award = resback[mod][day]['awards'][i];
            var radio = 1;
            if (isCash) {
                radio = conf.cashRadio;
            } else {
                if (mod == 'dragon' && award[1] == conf['para'][2]) {
                    continue;
                }
                radio = conf.freeRadio;
            }

            award[2] = Math.floor(radio * award[2]);
            awards.push(award);
        }

        if (mod == 'arena') {
            var oldArenaLevel = user.status.arena_level;
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
            if (oldArenaLevel != user.status.arena_level) {
                var arenaCount = 0;
                for (var l = oldArenaLevel + 1; l <= user.status.arena_level; l++) {
                    arenaCount += conf_mgr.gConfArenaLevel[l].arena;
                }
                resp.data.ext_awards = player.addAwards([['user', 'arena', arenaCount]], req.mod, req.act);
            }
        } else {
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
        }

        setResBackGet(player, resback, mod, day);
        // resp.data.awards = player.addAwards(awards);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.get_all_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'res_back')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var mod = req.args.mod;
        var resback = user.resback;
        var conf = conf_mgr.gConfResback[mod];

        if (!conf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }

        if (!resback[mod]) {
            resp.code = 1; resp.desc = 'no award'; break;
        }

        var isCash = req.args.isCash;
        var costs = [];
        var awards = [];
        var dayGet = [];
        var modBack = resback[mod];

        for (var day in modBack) {
            if (isCash) {
                var costnum = resback[mod][day]['remainnum'] * conf.perCash;
                var cost = ['user', 'cash', -costnum];
                costs.push(cost);
            }

            for (var i = 0; i < resback[mod][day]['awards'].length; i++) {
                var award = resback[mod][day]['awards'][i];
                var radio = 1;
                if (isCash) {
                    radio = conf.cashRadio;
                } else {
                    if (mod == 'dragon' && award[1] == conf['para'][2]) {
                        continue;
                    }
                    radio = conf.freeRadio;
                }
                award[2] = Math.floor(radio * award[2]);
                awards.push(award);
            }
            dayGet.push(day);
        }

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = "cash not enough"; break;
        }

        if (!awards.length) {
            resp.code = 1; resp.desc = 'already get'; break;
        }

        for (var k = 0; k < dayGet.length; k++) {
            setResBackGet(player, resback, mod, dayGet[k]);
        }

        if (mod == 'arena') {
            var oldArenaLevel = user.status.arena_level;
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
            if (oldArenaLevel != user.status.arena_level) {
                var arenaCount = 0;
                for (var l = oldArenaLevel + 1; l <= user.status.arena_level; l++) {
                    arenaCount += conf_mgr.gConfArenaLevel[l].arena;
                }
                resp.data.ext_awards = player.addAwards([['user', 'arena', arenaCount]], req.mod, req.act);
            }
        } else {
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.get_oneKey_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'res_back')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        //var mod = req.args.mod;
        var resback = user.resback;
        //  var conf = conf_mgr.gConfResback[mod];


        var isCash = req.args.isCash;
        var costs = [];
        var awards = [];
        var dayGet = [];
        var modBack = resback[mod];
        var costs = [];
        var awards = [];
        var ext_award = [];

        for (var mod in resback) {
            var modBack = resback[mod];
            var conf = conf_mgr.gConfResback[mod];
            for (var day in modBack) {
                if (isCash) {
                    var costnum = resback[mod][day]['remainnum'] * conf.perCash;
                    costs.push(['user', 'cash', -costnum]);
                }

                for (var i = 0; i < resback[mod][day]['awards'].length; i++) {
                    var award = resback[mod][day]['awards'][i];
                    var radio = 1;
                    if (isCash) {
                        radio = conf.cashRadio;
                    } else {
                        if (mod == 'dragon' && award[1] == conf['para'][2]) {
                            continue;
                        }
                        radio = conf.freeRadio;
                    }
                    award[2] = Math.floor(radio * award[2]);
                    awards.push(award);
                }
                dayGet.push(day);
            }

            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = "cash not enough"; break;
            }

            if (!awards.length) {
                resp.code = 1; resp.desc = 'already get'; break;
            }

            for (var k = 0; k < dayGet.length; k++) {
                setResBackGet(player, resback, mod, dayGet[k]);
            }

        }


        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = "cash not enough"; break;
        }

        if (!awards.length) {
            resp.code = 1; resp.desc = 'already get'; break;
        }


        var oldArenaLevel = user.status.arena_level;
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        var ext_awards = [];
        if (oldArenaLevel != user.status.arena_level) {
            var arenaCount = 0;
            for (var l = oldArenaLevel + 1; l <= user.status.arena_level; l++) {
                arenaCount += conf_mgr.gConfArenaLevel[l].arena;
            }
            ext_awards.push(['user', 'arena', arenaCount]);
        }

        if (ext_awards.length)
            resp.data.ext_awards = player.addAwards(ext_awards, req.mod, req.act);



    } while (false);

    onHandled();
};
