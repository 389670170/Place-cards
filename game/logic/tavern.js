
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { ServerName } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');
const { parseAwardsConfig } = require('../../common/global.js');

exports.get = function (player, req, resp, onHandled) {
    //requestWorld(req, resp, onHandled);
    var user = player.user;
    do {
        var cardObj = player.getTavernCardObj();
        if (cardObj) {
            resp.data.id = cardObj.id;
            resp.data.hid = parseInt(cardObj.awards[0][1]);
            resp.data.refresh_time = user.tavern.hero_refresh_time;

            if (user.tavern.exchange_hid != resp.data.hid) {
                user.tavern.exchange_hid = resp.data.hid;
                player.markDirty('tavern.exchange_hid');
            }
        }
    } while (false);

    onHandled();
};

exports.get_luck_list = function (player, req, resp, onHandled) {
    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

// 单次招募
exports.single_tavern = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var type = req.args.type;   // 1普通招募，2高级招募
        if (!type) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        var clientGold = req.args.gold;
        var clientCash = req.args.cash;
        var clientToken = req.args.token;
        var clientLove = req.args.love;

        var now = common.getTime();
        var tavern = user.tavern;

        var free = false;   // 是否免费
        var token = false;  // 是否使用招募令
        var love = false;   // 是否使用爱心
        var gold = false;   // 是否使用金币

        if (now >= tavern.htime) {
            free = true;
        }

        var now = common.getTime();
        var costs = [];
        if (!free) {
            if (type == 1) {
                if (clientGold) {
                    costs = conf_mgr.gConfTavern[type].cost2;
                    gold = true;
                } else if (clientToken) {
                    costs = conf_mgr.gConfTavern[type].cost1;
                    token = true;
                } else {
                    if (user.status.ntoken > 0) {
                        costs = conf_mgr.gConfTavern[type].cost1;
                        token = true;
                    } else if (user.status.gold >= conf_mgr.gConfTavern[type].cost2[0][2]) {
                        costs = conf_mgr.gConfTavern[type].cost2;
                        gold = true;
                    }
                }
            } else if (type == 2) {
                if (clientCash) {
                    costs = conf_mgr.gConfTavern[type].cost2;
                } else if (clientToken) {
                    costs = conf_mgr.gConfTavern[type].cost1;
                    token = true;
                } else if (clientLove) {
                    costs = parseAwardsConfig(conf_mgr.gConfGlobal.tavernAdvancedCost);
                    love = true;
                } else {
                    if (req.args.love && user.status.love > 0) {
                        costs = parseAwardsConfig(conf_mgr.gConfGlobal.tavernAdvancedCost);
                        love = true;
                    } else {
                        if (user.status.htoken > 0) {
                            costs = conf_mgr.gConfTavern[type].cost1;
                            token = true;
                        } else if (user.status.cash >= conf_mgr.gConfTavern[type].cost2[0][2]) {
                            costs = conf_mgr.gConfTavern[type].cost2;
                            cash = true;
                        }
                    }
                }
            }
        }

        // 检查客户端参数是否与服务器结果一致
        if (req.args.free && !free) {
            resp.code = 1; resp.desc = 'free error'; break;
        }

        if (req.args.token && !token) {
            resp.code = 1; resp.desc = 'token error'; break;
        }

        if (gold) {
            // 用金币抽要限次数
            var curCount = tavern.gold_count;
            var maxCount = conf_mgr.gConfVip[user.status.vip].tavernNormalLimit;
            if (curCount >= maxCount) {
                resp.code = 1; resp.desc = 'gold max count'; break;
            }
        }

        // 检查消耗是否满足
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough cash or token'; break;
        }

        // 获取奖励
        var awards = conf_mgr.gConfTavern[type].fixedAward;
        awards = awards.concat(player.getTavernAwards(type));
        tavern.call_count[type]++;
        if (gold) {
            tavern.gold_count++;
            player.markDirty('tavern.gold_count');

            resp.data.gold_count = tavern.gold_count;
        }

        player.markDirty(util.format('tavern.call_count.%d', type));

        if (free) {
            if (type == 1) {
                tavern.nfree++;
                if (tavern.nfree < conf_mgr.gConfGlobal.tavernNormalFreeTimes) {
                    tavern.ntime = now + conf_mgr.gConfGlobal.tavernNormalFreeInterval * 60;
                } else {
                    tavern.ntime = common.getTime(getGameDate()) + 86400;
                }

                player.markDirty('tavern.nfree');
                player.markDirty('tavern.ntime');

                resp.data.nfree = tavern.nfree;
                resp.data.ntime = tavern.ntime;
            } else if (type == 2) {
                tavern.htime = now + conf_mgr.gConfGlobal.tavernAdvancedFreeInterval * 3600;
                player.markDirty('tavern.htime');
                resp.data.htime = tavern.htime;
            }
        }

        if (type == 1) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'tavern', 1);
            player.doOpenHoliday('tavern', 1);
            player.doOpenHoliday('RecruitNum', 1);
            if (isActivityStart(player, 'tavern_normal')) {
                if (user.activity.tavern_normal) {
                    user.activity.tavern_normal.open_day = user.activity.tavern_normal.open_day || conf_mgr.gConfActivities["tavern_normal"].startTime
                    if (user.activity.tavern_normal.open_day != conf_mgr.gConfActivities["tavern_normal"].startTime) {
                        user.activity.tavern_normal = null;
                    }
                }

                // 平凡招募活动
                if (!user.activity.tavern_normal) {
                    user.activity.tavern_normal = {};
                    user.activity.tavern_normal.count = 0;
                    user.activity.tavern_normal.award_got = [];
                }

                user.activity.tavern_normal.count += 1;
                player.markDirty('activity.tavern_normal');
            }
        } else if (type == 2) {
            if (!tavern.hcash && token) {
                // 首次使用token的高级招募
                tavern.hcash = 1;
                player.markDirty('tavern.hcash');
            }
            if (isActivityStart(player, 'tavern_high')) {
                if (user.activity.tavern_high) {
                    user.activity.tavern_high.open_day = user.activity.tavern_high.open_day || conf_mgr.gConfActivities["tavern_high"].startTime
                    if (user.activity.tavern_high.open_day != conf_mgr.gConfActivities["tavern_high"].startTime) {
                        user.activity.tavern_high = null;
                    }
                }

                // 奢华招募活动
                if (!user.activity.tavern_high) {
                    user.activity.tavern_high = {};
                    user.activity.tavern_high.count = 0;
                    user.activity.tavern_high.award_got = [];
                }


                user.activity.tavern_high.count += 1;
                player.markDirty('activity.tavern_high');
            }

            // 酒馆招募招募次数
            if (type == 2 && !love && isActivityStart(player, 'tavern_recruit')) {
                var tavernRecruit = user.activity.tavern_recruit;
                if (tavernRecruit.time != conf_mgr.gConfActivities['tavern_recruit'].startTime) {
                    tavernRecruit.time = conf_mgr.gConfActivities['tavern_recruit'].startTime;
                    tavernRecruit.frequency = 0;
                    tavernRecruit.num = 0;
                    tavernRecruit.rewards = {};
                    player.markDirty('activity.tavern_recruit');
                }

                // 额外奖励
                var exAward = parseAwardsConfig(conf_mgr.gConfGlobal.seniorRrecruitExtraRum);
                awards = awards.concat(exAward);

                tavernRecruit.frequency += 1;
                player.markDirty('activity.tavern_recruit.frequency');
            }

            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'tavernHigh', 1);
            player.doOpenSeven('fancyRecruitNum', 1);
            player.doOpenHoliday('fancyRecruitNum', 1);
            player.doOpenHoliday('RecruitNum', 1);
        }

        logic_event_mgr.emit(logic_event_mgr.EVENT.PLAYER_RECRUIT, player, type, 1);

        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        resp.data.awards = player.addAwards(awards, req.mod, req.act);

    } while (false);

    onHandled();
};

// 十连抽
exports.ten_tavern = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var type = req.args.type;
        if (!type) {
            resp.code = 1; resp.desc = 'type needed'; break;
        }

        var clientGold = req.args.gold;
        var clientCash = req.args.cash;
        var clientToken = req.args.token;
        var clientLove = req.args.love;

        var love = false;   // 是否使用爱心
        var gold = false;   // 是否使用金币招募
        var tavern = user.tavern;

        var discount = conf_mgr.gConfTavern[type].tenDiscount;
        var costs = [];

        if (type == 1) {
            if (clientToken) {
                costs = clone(conf_mgr.gConfTavern[type].cost1);
                costs[0][2] *= 10;
            } else if (clientGold) {
                costs = clone(conf_mgr.gConfTavern[type].cost2);
                costs[0][2] *= discount;
                gold = true
            } else {
                if (user.status.ntoken >= 10) {
                    costs = clone(conf_mgr.gConfTavern[type].cost1);
                    costs[0][2] *= 10;
                } else if (user.status.cash >= Math.ceil(conf_mgr.gConfTavern[type].cost2[0][2] * discount)) {
                    costs = clone(conf_mgr.gConfTavern[type].cost2);
                    costs[0][2] *= discount;
                    gold = true
                }
            }
        } else if (type == 2) {
            if (clientToken) {
                costs = clone(conf_mgr.gConfTavern[type].cost1);
                costs[0][2] *= 10;
            } else if (clientLove) {
                costs = parseAwardsConfig(conf_mgr.gConfGlobal.tavernAdvancedCost);
                costs[0][2] *= 10;
                love = true;
            } else if (clientCash) {
                costs = clone(conf_mgr.gConfTavern[type].cost2);
                costs[0][2] *= discount;
            } else {
                if (req.args.love) {
                    costs = parseAwardsConfig(conf_mgr.gConfGlobal.tavernAdvancedCost);
                    costs[0][2] *= 10;
                    love = true;
                } else {
                    if (user.status.htoken >= 10) {
                        costs = clone(conf_mgr.gConfTavern[type].cost1);
                        costs[0][2] *= 10;
                    } else if (user.status.cash >= Math.ceil(conf_mgr.gConfTavern[type].cost2[0][2] * discount)) {
                        costs = clone(conf_mgr.gConfTavern[type].cost2);
                        costs[0][2] *= discount;
                    }
                }
            }
        }

        if (gold) {
            // 用金币抽要限次数
            var curCount = tavern.gold_count;
            var maxCount = conf_mgr.gConfVip[user.status.vip].tavernNormalLimit;
            if (curCount + 10 > maxCount) {
                resp.code = 1; resp.desc = 'gold max count'; break;
            }
        }

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        var awards = [];
        for (var i = 0; i < 10; i++) {
            tavern.call_count[type]++;    // 增加高级招募次数
            if (gold) {
                tavern.gold_count++;
                player.markDirty('tavern.gold_count');
            }
            awards = awards.concat(conf_mgr.gConfTavern[type].fixedAward);
            var award = getTavernAwards(player, type);
            awards = awards.concat(award);
        }

        if (gold) {
            resp.data.gold_count = tavern.gold_count;
        }

        player.markDirty('tavern.call_count');

        // 酒馆招募招募次数
        if (type == 2 && !love && isActivityStart(player, 'tavern_recruit')) {
            var tavernRecruit = user.activity.tavern_recruit;
            if (tavernRecruit.time != conf_mgr.gConfActivities['tavern_recruit'].startTime) {
                tavernRecruit.time = conf_mgr.gConfActivities['tavern_recruit'].startTime;
                tavernRecruit.frequency = 0;
                tavernRecruit.num = 0;
                tavernRecruit.rewards = {};
                player.markDirty('activity.tavern_recruit');
            }

            // 额外奖励
            var exAward = parseAwardsConfig(conf_mgr.gConfGlobal.seniorRrecruitExtraRum);
            for (var i = 0; i < exAward.length; i++) {
                exAward[i][2] = exAward[i][2] * 10;
            }
            awards = awards.concat(exAward);

            tavernRecruit.frequency += 10;
            player.markDirty('activity.tavern_recruit.frequency');
        }

        if (type == 1) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'tavern', 10);
            player.doOpenHoliday('tavern', 10);
            player.doOpenHoliday('RecruitNum', 10);

            if (isActivityStart(player, 'tavern_normal')) {
                if (user.activity.tavern_normal) {
                    user.activity.tavern_normal.open_day = user.activity.tavern_normal.open_day || conf_mgr.gConfActivities["tavern_normal"].startTime
                    if (user.activity.tavern_normal.open_day != conf_mgr.gConfActivities["tavern_normal"].startTime) {
                        user.activity.tavern_normal = null;
                    }
                }

                // 平凡招募活动
                if (!user.activity.tavern_normal) {
                    user.activity.tavern_normal = {};
                    user.activity.tavern_normal.count = 0;
                    user.activity.tavern_normal.award_got = [];
                    player.markDirty('activity.tavern_normal');
                }

                user.activity.tavern_normal.count += 10;
                player.markDirty('activity.tavern_normal.count');
            }
        } else if (type == 2) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'tavernHigh', 10);
            player.doOpenSeven('fancyRecruitNum', 10);
            player.doOpenHoliday('fancyRecruitNum', 10);
            player.doOpenHoliday('RecruitNum', 10);

            if (isActivityStart(player, 'tavern_high')) {
                if (user.activity.tavern_high) {
                    user.activity.tavern_high.open_day = user.activity.tavern_high.open_day || conf_mgr.gConfActivities["tavern_high"].startTime
                    if (user.activity.tavern_high.open_day != conf_mgr.gConfActivities["tavern_high"].startTime) {
                        user.activity.tavern_high = null;
                    }
                }

                // 奢华招募活动
                if (!user.activity.tavern_high) {
                    user.activity.tavern_high = {};
                    user.activity.tavern_high.count = 0;
                    user.activity.tavern_high.award_got = [];
                    player.markDirty('activity.tavern_high');
                }

                user.activity.tavern_high.count += 10;
                player.markDirty('activity.tavern_high.count');
            }
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        // 统计橙色卡牌数量
        var orange = 0;
        for (var i = 0; i < resp.data.awards.length; i++) {
            var award = resp.data.awards[i];
            if (award[0] == 'card') {
                var hid = award[1];
                var heroCombatConf = conf_mgr.getHeroCombatConf(hid);
                if (heroCombatConf.quality >= Quality.ORANGE) {
                    orange++;
                }
            }
        }

        if (req.args.uid) {
            req.args.count = orange;
            requestWorld(req, resp);
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp);
        } else if (user.status.vip >= Object.keys(conf_mgr.gConfTavernLuck).min()) {
            req.args.uid = req.uid;
            req.args.count = orange;
            requestWorld(req, resp);
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp);
        }

        logic_event_mgr.emit(logic_event_mgr.EVENT.PLAYER_RECRUIT, player, type, 10);
    } while (false);

    onHandled();
};


/** 获取当前酒馆奖励 */
function getTavernAwards(type) {
    var user = player.user;
    if (!user.tavern_server.award_tab[type]) {
        return null;
    }

    var realCount = user.tavern.call_count[type];
    if (realCount == 0) {
        var awards = user.tavern_server.award_tab[type][0];
        return awards;
    } else {
        var awards = [];
        var count = realCount % user.tavern_server.max_cycle[type];
        var lootType = user.tavern_server.award_tab[type][count];
        //DEBUG('count = ' + count + ', lootType = ' + String(lootType));
        if (!lootType) {
            if (lootType == 0) {                    // 特殊掉落
                awards = conf_mgr.gConfTavern[type].specialAward;
            } else {                    // 默认掉落
                awards = conf_mgr.gConfTavern[type].cycleBasicAward1;
            }
        } else {
            awards = conf_mgr.gConfTavern[type]['cycleAward' + lootType]; //user.tavern_server.award_tab[type][count];
        }


        if (type == 2 && realCount < 10) {                // 前十次高级招募不能出现法老
            if (awards[0][0] == 'group' && parseInt(awards[0][1]) == 10000012) {
                var replaceAwards = clone(awards);
                replaceAwards[0][1] = 10000016;
                awards = replaceAwards;
                DEBUG('#### release group 10000012 with 10000016 #####');
            }
        }
        return awards;
    }
};

// 刷新兑换的英雄
exports.refresh_hero = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var free = req.args.free;

        var tavern = user.tavern;
        var tavernServer = user.tavern_server;

        var costs = [];
        if (free && free > 0) {
            // 自动刷新
            var awardsObj = player.getTavernCardObj();
            resp.data.hid = parseInt(awardsObj.awards[0][1]);
            resp.data.id = awardsObj.id;
            resp.data.refresh_time = tavern.hero_refresh_time;
        } else {
            costs = parseAwardsConfig(conf_mgr.gConfGlobal.tavernRefreshCost);
            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = 'wine not enough'; break;
            }

            tavernServer.hero_fresh_count++;

            var length = player.getTavernCardLength();
            if (tavernServer.hero_fresh_count >= length) {
                // 需要重新生成兑换数据了
                player.resetTavernCards();

                // 刷新次数清0
                tavernServer.hero_fresh_count = 0;
            }

            player.markDirty('tavern_server.hero_fresh_count');
            var awardsObj = player.getTavernCardObj();

            tavern.exchange_hid = parseInt(awardsObj.awards[0][1]);
            player.markDirty('tavern.exchange_hid');

            //tavern.hero_refresh_time = common.getTime();
            //player.markDirty('tavern.hero_refresh_time');

            resp.data.costs = player.addAwards(costs, req.mod, req.act);
            resp.data.hid = parseInt(awardsObj.awards[0][1]);
            resp.data.id = awardsObj.id;
            resp.data.refresh_time = tavern.hero_refresh_time;
        }
    } while (false);

    onHandled();
};

// 兑换英雄
exports.exchange_hero = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var cardObj = player.getTavernCardObj();
        var cardId = cardObj.id;
        var cardAwards = cardObj.awards;
        var costs = conf_mgr.gConfTavernLimitHero[cardId].exchangeCost;
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'wine not enough'; break;
        }

        // 给以奖励
        resp.data.awards = player.addAwards(cardAwards, req.mod, req.act);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        // 增加刷新次数
        var tavern = user.tavern;
        var tavernServer = user.tavern_server;
        tavernServer.hero_fresh_count++;

        var length = player.getTavernCardLength();
        if (tavernServer.hero_fresh_count >= length) {
            // 需要重新生成兑换数据了
            player.resetTavernCards();

            // 刷新次数清0
            tavernServer.hero_fresh_count = 0;
        }

        player.markDirty('tavern_server.hero_fresh_count');
        var awardsObj = player.getTavernCardObj();

        tavern.exchange_hid = parseInt(awardsObj.awards[0][1]);
        tavern.hero_refresh_time = common.getTime();

        player.markDirty('tavern.exchange_hid');
        player.markDirty('tavern.hero_refresh_time');

        resp.data.hid = parseInt(awardsObj.awards[0][1]);
        resp.data.id = awardsObj.id;
        resp.data.refresh_time = tavern.hero_refresh_time;
    } while (false);

    onHandled();
};
