
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { parseAwardsConfig } = require('../../common/global.js');
const { ServerName } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');

exports.get_openholiday = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'open_holiday')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        if (!user.activity.open_holiday || user.activity.open_holiday.open_day != conf_mgr.gConfActivities['open_holiday'].startTime) {
            player.openOpenHoliday();
        }
        player.rmTip('open_holiday');
        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            if (resp.code == 0) {
                resp.data.open_holiday = user.activity.open_holiday;
            }

            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_openholiday_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var avState = isActivityStart(player, 'open_holiday')
        if (avState == ActivityProcess.CLOSE) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var openHoliday = user.activity.open_holiday;
        var progress = openHoliday.progress;
        var conf = conf_mgr.gConfOpenHolidayReward[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }



        if (progress[id] && progress[id][1]) {
            resp.code = 1; resp.desc = 'already reward'; break;
        }

        if (conf.type == 'cashBuy') {
            // 延时和关闭阶段无法购买
            if (avState != ActivityProcess.NORMAL) {
                resp.code = 1; resp.desc = 'not open'; break;
            }

            if (progress[id] && progress[id][1] == 1) {
                resp.code = 1; resp.desc = 'max number'; break;
            }

            var cashType = 'cash';

            if (conf_mgr.gConfOpenHolidayReward[id].costtype && conf_mgr.gConfOpenHolidayReward[id].costtype == 1) {
                cashType = 'mixcash';
            }

            var costs = [['user', cashType, -conf_mgr.gConfOpenHolidayReward[id].sell]];
            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = 'cash not enough'; break;
            }
            if (!progress[id]) {
                progress[id] = [0, 0];
            }
            progress[id][0]++;

            if (progress[id][0] == conf.target) {
                progress[id][1] = 1;
            }
            player.markDirty('activity.open_holiday.progress.' + id);

            resp.data.costs = player.addAwards(costs, 'activity', 'get_openholiday_reward');
            resp.data.awards = player.addAwards(conf_mgr.gConfOpenHolidayReward[id].award, 'activity', 'get_openholiday_reward');
        } else if (conf.type != 'sale') {
            if (!progress[id] || progress[id][0] < conf.target) {
                resp.code = 1; resp.desc = 'not achieved'; break;
            }

            progress[id][1] = 1;
            player.markDirty('activity.open_holiday.progress.' + id);

            resp.data.awards = player.addAwards(conf_mgr.gConfOpenHolidayReward[id].award, 'activity', 'get_openholiday_reward');
        } else {
            // 延时和关闭阶段无法购买
            if (avState != ActivityProcess.NORMAL) {
                resp.code = 1; resp.desc = 'not open'; break;
            }

            var cashType = 'cash';

            if (conf_mgr.gConfOpenHolidayReward[id].costtype && conf_mgr.gConfOpenHolidayReward[id].costtype == 1) {
                cashType = 'mixcash';
            }

            var costs = [['user', cashType, -conf_mgr.gConfOpenHolidayReward[id].sell]];
            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = 'cash not enough'; break;
            }

            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                if (resp.code == 0) {
                    progress[id] = [0, 1];
                    player.markDirty('activity.open_holiday.progress.' + id);

                    resp.data.costs = player.addAwards(costs, 'activity', 'get_openholiday_reward');
                    resp.data.awards = player.addAwards(conf_mgr.gConfOpenHolidayReward[id].award, 'activity', 'get_openholiday_reward');
                }

                onHandled();
            });
            return;
        }
    } while (false);

    onHandled();
};

exports.get_openholiday_box_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'open_holiday')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfOpenHolidayBox[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var rewardedBox = user.activity.open_holiday.rewarded_box;
        if (rewardedBox.indexOf(id) >= 0) {
            resp.code = 1; resp.desc = 'already reward'; break;
        }

        var cmpCount = getCompleteOpenHolidayTaskCount(player);
        if (cmpCount < conf.limit) {
            resp.code = 1; resp.desc = 'not achieved'; break;
        }

        rewardedBox.push(id);
        player.markDirty('activity.open_holiday.rewarded_box');

        resp.data.awards = player.addAwards(conf.award, 'activity', 'get_openholiday_box_reward')
    } while (false);

    onHandled();
};

function getCompleteOpenHolidayTaskCount(player) {
    var openHoliday = player.user.activity.open_holiday;
    var completeCount = 0;
    var day = 7;
    var progresses = openHoliday.progress;
    for (var d = 1; d <= day; d++) {
        var dayConf = conf_mgr.gConfOpenHoliday[d];
        if (!dayConf) {
            continue;
        }
        for (var id in dayConf) {
            for (var i = 0, len = dayConf[id].task.length; i < len; i++) {
                var taskId = dayConf[id].task[i];
                var progress = progresses[taskId];
                if (progress) {
                    if (progress[1] > 0) {
                        // 完成且已经领过奖
                        completeCount++;
                    } else {
                        var taskConf = conf_mgr.gConfOpenHolidayReward[taskId];
                        if (taskConf && progress[0] >= taskConf.target) {
                            completeCount++;
                        }
                    }
                }
            }
        }
    }
    return completeCount;
};

// 购买七天乐礼包
exports.buy_holiday_day_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        var conf = conf_mgr.gConfOpenHolidayReward[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        // 检查礼包是否已经购买过
        if (user.activity.open_holiday.progress && user.activity.open_holiday.progress[id]) {
            var times = user.activity.open_holiday.progress[id][1]
            if (times && times >= conf.target) {
                resp.code = 1; resp.desc = 'has buy'; break;
            }
        }

        var rechargeParam = formatGiftParam('openholiday', id);
        resp.data.recharge_param = rechargeParam;
    } while (false);

    onHandled();
};

exports.get_openseven = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'open_seven')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        player.rmTip('open_seven');
        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            if (resp.code == 0) {
                resp.data.open_seven = user.activity.open_seven;
            }

            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_openseven_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var avState = isActivityStart(player, 'open_seven')
        if (avState == ActivityProcess.CLOSE) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var openSeven = user.activity.open_seven;
        var progress = openSeven.progress;
        var conf = conf_mgr.gConfOpenSevenReward[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var day = common.getDateDiff(common.getDate(common.getTime() - conf_mgr.gConfGlobal.resetHour * 3600), openSeven.open_day) + 1;
        var targetDay = 0;
        for (var d in conf_mgr.gConfOpenSeven) {
            var dayConf = conf_mgr.gConfOpenSeven[d];
            for (var dayType in dayConf) {
                if (dayConf[dayType].task.indexOf(id) != -1) {
                    targetDay = d;
                    break;
                }
                if (targetDay) {
                    break;
                }
            }
        }

        if (!targetDay || targetDay > day) {
            resp.code = 1; resp.desc = 'not valid day'; break;
        }

        if (progress[id] && progress[id][1]) {
            resp.code = 1; resp.desc = 'already reward'; break;
        }

        if (conf.type != 'sale') {
            if (!progress[id] || progress[id][0] < conf.target) {
                resp.code = 1; resp.desc = 'not achieved'; break;
            }

            progress[id][1] = 1;
            player.markDirty('activity.open_seven.progress.' + id);

            resp.data.awards = player.addAwards(conf_mgr.gConfOpenSevenReward[id].award, 'activity', 'get_openseven_reward');
        } else {
            // 延时和关闭阶段无法购买
            if (avState != ActivityProcess.NORMAL) {
                resp.code = 1; resp.desc = 'not open'; break;
            }


            var cashType = 'cash';

            if (conf_mgr.gConfOpenSevenReward[id].costtype && conf_mgr.gConfOpenSevenReward[id].costtype == 1) {
                cashType = 'mixcash';
            }

            var costs = [['user', cashType, -conf_mgr.gConfOpenSevenReward[id].sell]];
            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = 'cash not enough'; break;
            }

            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                if (resp.code == 0) {
                    progress[id] = [0, 1];
                    player.markDirty('activity.open_seven.progress.' + id);

                    resp.data.costs = player.addAwards(costs, 'activity', 'get_openseven_reward');
                    resp.data.awards = player.addAwards(conf_mgr.gConfOpenSevenReward[id].award, 'activity', 'get_openseven_reward');
                }

                onHandled();
            });
            return;
        }
    } while (false);

    onHandled();
};

exports.get_openseven_box_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'open_seven')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfOpenSevenBox[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var rewardedBox = user.activity.open_seven.rewarded_box;
        if (rewardedBox.indexOf(id) >= 0) {
            resp.code = 1; resp.desc = 'already reward'; break;
        }

        var cmpCount = getCompleteOpenSevenTaskCount(player);
        if (cmpCount < conf.limit) {
            resp.code = 1; resp.desc = 'not achieved'; break;
        }

        rewardedBox.push(id);
        player.markDirty('activity.open_seven.rewarded_box');

        resp.data.awards = player.addAwards(conf.award, 'activity', 'get_openseven_box_reward')
    } while (false);

    onHandled();
};

function getCompleteOpenSevenTaskCount() {
    var openSeven = player.user.activity.open_seven;
    var today = common.getDate(common.getTime() - conf_mgr.gConfGlobal.resetHour * 3600);
    var day = common.getDateDiff(today, openSeven.open_day) + 1;
    if (!conf_mgr.gConfOpenSeven[day]) {
        // 活动已经结束
        return 0;
    }
    var completeCount = 0;
    var progresses = openSeven.progress;
    for (var d = 1; d <= day; d++) {
        var dayConf = conf_mgr.gConfOpenSeven[d];
        for (var id in dayConf) {
            for (var i = 0, len = dayConf[id].task.length; i < len; i++) {
                var taskId = dayConf[id].task[i];
                var progress = progresses[taskId];
                if (progress) {
                    if (progress[1] > 0) {
                        // 完成且已经领过奖
                        completeCount++;
                    } else {
                        var taskConf = conf_mgr.gConfOpenSevenReward[taskId];
                        if (taskConf && progress[0] >= taskConf.target) {
                            completeCount++;
                        }
                    }
                }
            }
        }
    }
    return completeCount;
};

exports.get_overvalued_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'value_package')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var today = common.getDate(common.getTime() - conf_mgr.gConfGlobal.resetHour * 3600);
        var overvaluedGift = user.activity.overvalued_gift;
        if (overvaluedGift.day != today) {
            overvaluedGift.day = today;
            overvaluedGift.rewards = {};
            player.markDirty('activity.overvalued_gift');
        }

        resp.data.overvalued_gift = overvaluedGift;
        resp.data.money = user.payment.day_money;
    } while (false);

    onHandled();
};

exports.get_investment = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'investment')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        player.rmTip('investment');
        resp.data.investment = user.activity.investment;
    } while (false);

    onHandled();
};

//购买一本万利活动
exports.buy_investment = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'investment')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var investmentPurchaseRequiresVipLevel = Math.floor(conf_mgr.gConfGlobal.investmentPurchaseRequiresVipLevel);
        if (user.status.vip < investmentPurchaseRequiresVipLevel) {
            resp.code = 1; resp.desc = 'vip not reached'; break;
        }
        var costs = parseAwardsConfig(conf_mgr.gConfGlobal.investmentDiamondPurchaseCost);

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cash not enough'; break;
        }
        var investment = user.activity.investment;
        if (investment.isBuy == 1) {
            resp.code = 1; resp.desc = 'cash not enough'; break;
        }
        investment.isBuy = 1;
        investment.lastLoginTime = getGameDate();
        investment.loginDayCount = 1;
        player.markDirty('activity.investment');
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};
//领取一本万利的奖励
exports.get_investment_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'investment')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var id = req.args.id;
        var conf = conf_mgr.gConfAvinvestmentReward[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }
        var investment = user.activity.investment;
        var rewards = investment.rewards;
        if (rewards[id] || rewards[id] == 1) {//判断是否领取过奖励
            resp.code = 1; resp.desc = 'The award has already been received'; break;
        }
        //判断是否满足领奖条件
        if (conf.login > investment.loginDayCount) {
            resp.code = 1; resp.desc = 'The number of days is insufficient'; break;
        }
        rewards[id] = 1;
        player.markDirty('activity.investment.rewards.' + id);
        resp.data.awards = player.addAwards(conf.award1, 'activity', 'get_investment_reward');
        var rewards_count = count(rewards);
        var gConfAvinvestmentReward_count = count(conf_mgr.gConfAvinvestmentReward);
        if (rewards_count == gConfAvinvestmentReward_count) {
            investment.notShow = 1;//客户端不再展示界面
        }
        player.markDirty('activity.investment.notShow');
    } while (false);

    onHandled();
};


function count(o) {
    var t = typeof o;

    if (t == 'string') {
        return o.length;

    } else if (t == 'object') {

        var n = 0;

        for (var i in o) {
            n++;
        }

        return n;
    }
    return false;

}

exports.get_privilege_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'sale')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        resp.data.privilege_gift = user.activity.privilege_gift;
    } while (false);

    onHandled();
};

exports.buy_privilege_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'sale')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        if (!req.args.id || !conf_mgr.gConfAvPrivilegeGift[req.args.id]) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        var privilegeGift = user.activity.privilege_gift;
        var id = +req.args.id;
        if (privilegeGift[id]) {
            resp.code = 1; resp.desc = 'has bought'; break;
        }
        var vip = user.status.vip;
        if (vip < conf_mgr.gConfAvPrivilegeGift[id].vipLimit) {
            resp.code = 1; resp.desc = 'vip not enough'; break;
        }

        var costs = [['user', 'cash', -conf_mgr.gConfAvPrivilegeGift[id].curPrice]]
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cash not enough'; break;
        }

        privilegeGift[id] = 1;
        player.markDirty('activity.privilege_gift.' + id);

        resp.data.costs = player.addAwards(costs, 'activity', 'buy_privilege_gift');
        resp.data.awards = player.addAwards(conf_mgr.gConfAvPrivilegeGift[id].award, 'activity', 'buy_privilege_gift');
    } while (false);

    onHandled();
};

exports.get_level_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'level')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        resp.data.level_gift = user.activity.level_gift;
    } while (false);

    onHandled();
};

exports.get_level_gift_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'level')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvLevelGift[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        if (user.status.level < conf.level) {
            resp.code = 1; resp.desc = 'not get level gift award'; break;
        }

        var levelGift = user.activity.level_gift;
        if (levelGift[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        levelGift[id] = 1;
        player.markDirty('activity.level_gift.' + id);

        var awards = conf.awards.slice();

        resp.data.awards = player.addAwards(awards, 'activity', 'get_level_gift_award');
    } while (false);

    onHandled();
};

// 刷新祈祷的选项
function getPrayOptions(exists) {
    var ret = [];
    var existIds = [];
    for (var id in conf_mgr.gConfAvPray) {
        if (exists && exists.indexOf(+id) >= 0) {
            continue;
        }

        existIds.push(+id);
    }

    // 随机出6个
    for (var i = 0; i < 6; i++) {
        var index = common.randRange(0, existIds.length - 1);
        if (index >= 0) {
            ret.push(existIds[index]);
            existIds.splice(index, 1);
        }
    }

    return ret;
}

exports.get_pray = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var activityConf = conf_mgr.gConfActivities['pray'];
        if (!isActivityStart(player, 'pray')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var pray = user.activity.pray;
        if (!pray || pray.open_day == 0) {
            player.openPray();
            pray = user.activity.pray;
        }

        var hasAward = 0;
        var today = getGameDate();
        if (pray.got != today) {
            if (pray.reward.length > 0) {
                hasAward = 1;
            }
        }

        if (pray.options.length == 0) {
            var exists = [];
            for (var i = 0; i < pray.reward.length; i++) {
                exists.push(pray.reward[i][0]);
            }
            var options = getPrayOptions(exists);
            for (var i = 0; i < 6; i++) {
                pray.options[i] = [options[i], 0];
            }

            player.markDirty('activity.pray.options');
        }

        var payRecoverCD = conf_mgr.gConfGlobal.avAlasdPrayOnlineTime * 60;
        var onlineTime = player.getOnlineTime();
        pray = doPrayRecover(player);

        resp.data.cd = payRecoverCD - (onlineTime - pray.time);
        resp.data.pray = pray;
        resp.data.award = hasAward;// 是否要自动领奖
    } while (false);

    onHandled();
};

exports.do_pray = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isActivityStart(player, 'pray') != ActivityProcess.NORMAL) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvPray[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var pray = user.activity.pray;
        var toady = getGameDate();
        if (pray.day != toady) {
            resp.code = 1; resp.desc = 'not reset'; break;
        }

        if (pray.reward.length > 0 && pray.got != toady) {
            resp.code = 1; resp.desc = 'reward first'; break;
        }

        var repeat = false;
        for (var i = 0, len = pray.reward.length; i < len; i++) {
            if (pray.reward[i][0] == id) {
                repeat = true;
                break;
            }
        }
        if (repeat) {
            resp.code = 1; resp.desc = 'repeat'; break;
        }

        pray = doPrayRecover(player);

        if (pray.point <= 0) {
            resp.code = 1; resp.desc = 'not enough point'; break;
        }

        // 扣除祈祷点
        pray.point -= 1;
        player.markDirty('activity.pray.point');

        // 随机暴击次数
        var times = 1;
        var sumProb = 0;
        var rand = Math.random() * 100;
        for (var i = 2; i <= 4; i++) {
            sumProb += conf['prob' + i];
            if (rand < sumProb) {
                times = i;
                break;
            }
        }

        // 检查是否都选完了
        var allChoose = true;
        for (var i = 0; i < 6; i++) {
            if (pray.options[i][0] == id) {
                pray.options[i][1] = 1;
                player.markDirty('activity.pray.options');
            }

            if (pray.options[i][1] == 0) {
                allChoose = false;
            }
        }

        if (allChoose) {
            var exists = [];
            for (var i = 0; i < pray.reward.length; i++) {
                exists.push(pray.reward[i][0]);
            }

            var options = getPrayOptions(exists);
            for (var i = 0; i < 6; i++) {
                pray.options[i] = [options[i], 0];
            }

            player.markDirty('activity.pray.options');

            resp.data.options = pray.options;
        }

        pray.reward.push([+id, times]);
        player.markDirty('activity.pray.reward');
        resp.data.times = times;
    } while (false);

    onHandled();
};

// 领取奖励
exports.reward_pray = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'pray')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var pray = user.activity.pray;
        if (pray.got == getGameDate()) {
            resp.code = 1; resp.desc = 'has got'; break;
        }

        var today = getGameDate();
        pray.got = today;
        player.markDirty('activity.pray.got');

        var awards = [];
        for (var i = 0, len = pray.reward.length; i < len; i++) {
            var item = pray.reward[i];
            awards.combine(timeAwards(conf_mgr.gConfAvPray[item[0]].awards1, item[1]));
        }

        pray.reward = [];
        player.markDirty('activity.pray.reward');

        var options = getPrayOptions();
        for (var i = 0; i < 6; i++) {
            pray.options[i] = [options[i], 0];
        }

        player.markDirty('activity.pray.options');

        resp.data.awards = player.addAwards(awards, req.mod, req.act);
        resp.data.options = pray.options;
    } while (false);

    onHandled();
};

// 刷新可选奖励
exports.pray_refresh_option = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'pray')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        // 检查刷新消耗够不够
        var pray = user.activity.pray;
        var cost_index = pray.refresh_num + 1;
        if (cost_index > 100) {
            cost_index = 100;
        }
        var cost = conf_mgr.gConfBuy[cost_index].avAlasdPrayRefreshCostItem;
        if (!player.checkCosts(cost)) {
            resp.code = 1; resp.desc = 'cost not enough'; break;
        }

        var exists = [];
        for (var i = 0; i < pray.reward.length; i++) {
            exists.push(pray.reward[i][0]);
        }

        var options = getPrayOptions(exists);
        for (var i = 0; i < 6; i++) {
            pray.options[i] = [options[i], 0];
        }

        player.markDirty('activity.pray.options');

        pray.refresh_num++;
        player.markDirty('activity.pray.refresh_num');

        resp.data.options = pray.options;
        resp.data.costs = player.addAwards(cost, req.mod, req.act);
    } while (false);

    onHandled();
};



/**
 * 获取砖石狂欢内容
 */
exports.get_day_recharge = function (player, req, resp, onHandled) {

    var user = player.user;
    do {
        if (!isActivityStart(player, 'day_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var day_recharge = user.activity.day_recharge;
        var passedDay = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime)) + 1;
        if (common.GLOBAL_SERVER_INFO_DICT.serverStartDate > common.getTime(20190424) || passedDay > 7) {//这样写,是因为这个活动之前 是没有重置数据
            if (!day_recharge || !day_recharge.open_day || day_recharge.open_day != conf_mgr.gConfActivities['day_recharge'].startTime) {
                user.activity.day_recharge = {
                    'open_day': conf_mgr.gConfActivities['day_recharge'].startTime,                      // 活动开启时间
                    'dayCount': 0,                      // 累计充值次数
                    'today_status': 0,                   //今天任务是否完成
                    'day_paid': 0,                       //今天已经充值数
                    'reward': {                         // 领奖状态
                        // day: 1,                      // 已领取天数: 1
                    },
                };
                player.markDirty('activity.day_recharge');
            }
        }
        player.rmTip('day_recharge');
        resp.data.day_recharge = user.activity.day_recharge;
        resp.data.day_paid = user.activity.day_recharge.day_paid;
    } while (false);


    onHandled();
};

/**
 * 砖石狂欢，领取奖励
 */
exports.get_day_recharge_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'day_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var id = req.args.id;
        var day_recharge = user.activity.day_recharge;
        var config = conf_mgr.gConfDayRecharge[id];
        if (day_recharge.reward[id] || day_recharge.reward[id] == 1) {
            resp.code = 1; resp.desc = 'The award has been claimed'; break;
        }

        if (config.numday > day_recharge.dayCount) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var awards = config.awards1;
        day_recharge.reward[id] = 1;
        player.markDirty('activity.day_recharge');
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.get_login_goodgift = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'login_goodgift')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var day = req.args.day;
        var conf = conf_mgr.gConfAvLoginGift[day];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid day'; break;
        }

        var loginGift = user.activity.login_goodgift;
        if (loginGift.time != conf_mgr.gConfActivities['login_goodgift'].startTime) {
            loginGift.time = conf_mgr.gConfActivities['login_goodgift'].startTime;
            loginGift.login = 1;
            loginGift.reward = {};
            player.markDirty('activity.login_goodgift');
        }

        if (day > loginGift.login) {
            resp.code = 1; resp.desc = 'not achieved'; break;
        }

        if (loginGift.reward[day]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        loginGift.reward[day] = 1;
        player.markDirty('activity.login_goodgift.reward.' + day);

        resp.data.awards = player.addAwards(conf.award, 'activity', 'get_login_goodgift');
    } while (false);

    onHandled();
};

exports.get_pay_only = function (player, req, resp, onHandled) {
    do {
        if (!isActivityStart(player, 'pay_only')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var payOnly = player.user.activity.pay_only;
        var today = getGameDate(conf_mgr.gConfActivities['pay_only'].startTime);
        if (payOnly.day != today) {
            payOnly.day = today;
            payOnly.paid = 0;
            payOnly.award = [];
            payOnly.buy = {};
            player.markDirty('activity.pay_only');
        }

        resp.data.pay_only = payOnly;
    } while (false);

    onHandled();
};

exports.get_pay_only_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'pay_only')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = +req.args.id;
        var conf = conf_mgr.gConfAvPayOnly[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var payOnly = user.activity.pay_only;
        if (payOnly.paid < conf.require) {
            resp.code = 1; resp.desc = 'not enough pay'; break;
        }

        if (payOnly.award.indexOf(id) != -1) {
            resp.code = 1; resp.desc = 'already'; break;
        }

        payOnly.award.push(id);
        player.markDirty('activity.pay_only.award');

        resp.data.awards = player.addAwards(conf.payAward, 'activity', 'get_pay_only_award');
    } while (false);

    onHandled();
};

exports.buy_pay_only = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'pay_only')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = +req.args.id;
        var index = +req.args.index;
        var conf = conf_mgr.gConfAvPayOnly[id];
        if (!conf || !conf['award' + index]) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var payOnly = user.activity.pay_only;
        if (payOnly.paid < conf.require) {
            resp.code = 1; resp.desc = 'not enough pay'; break;
        }

        if (payOnly.buy[id] && payOnly.buy[id][index] >= conf['buy' + index]) {
            resp.code = 1; resp.desc = 'buy limit'; break;
        }

        var num = +req.args.num;
        if (isNaN(num) || num < 1) {
            resp.code = 1; resp.desc = 'invalid num'; break;
        }
        var costs = [['user', 'cash', -conf['cutPrice' + index] * num]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough cash'; break;
        }

        if (!payOnly.buy[id]) {
            payOnly.buy[id] = {};
        }
        player.markDirty('activity.pay_only.buy.' + id);

        if (!payOnly.buy[id][index]) {
            payOnly.buy[id][index] = num;
        } else {
            payOnly.buy[id][index] += num;
        }
        player.markDirty(util.format('activity.pay_only.buy.%d.%d', id, index));

        resp.data.awards = player.addAwards(timeAwards(conf['award' + index], num), 'activity', 'buy_pay_only');
        resp.data.costs = player.addAwards(costs, 'activity', 'buy_pay_only');
    } while (false);

    onHandled();
};

exports.get_limit_group = function (player, req, resp, onHandled) {
    do {
        if (!isActivityStart(player, 'limit_group')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var today = getGameDate();
        var limitGroup = player.user.activity.limit_group;
        if (limitGroup.day != today) {
            limitGroup.day = today;
            limitGroup.buy = {};
            player.markDirty('activity.limit_group');
        }

        req.args.end_time = conf_mgr.gConfActivities['limit_group'].endTime;
        requestGlobal(req, resp, function () {
            if (resp.code == 0) {
                resp.data.limit_group = limitGroup;
            }
            onHandled();
        })
        return;
    } while (false);

    onHandled();
};

exports.buy_limit_group = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'limit_group')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = +req.args.id;
        var num = Math.floor(req.args.num);
        var conf = conf_mgr.gConfAvLimitGroup[id];
        if (!conf || isNaN(num) || num < 1) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var limitGroup = user.activity.limit_group;
        if (limitGroup.day != getGameDate()) {
            resp.code = 1; resp.desc = 'not refresh'; break;
        }

        var bought = limitGroup.buy[id];
        if (!bought) {
            bought = 0;
        }

        if (!conf.sell) {
            resp.code = 1; resp.desc = 'not sell'; break;
        }

        if (conf.buy < bought + num) {
            resp.code = 1; resp.desc = 'too many to buy'; break;
        }

        var costs = [['user', 'cash', -conf.oriPrice * num]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough cash'; break;
        }

        req.args.num = num;
        requestGlobal(req, resp, function () {
            if (resp.code == 0) {
                if (limitGroup.buy[id]) {
                    limitGroup.buy[id] += num;
                } else {
                    limitGroup.buy[id] = num;
                }
                player.markDirty('activity.limit_group.buy.' + id);

                resp.data.costs = player.addAwards(costs, 'activity', 'buy_limit_group');
                resp.data.awards = player.addAwards(timeAwards(conf.goods, num), 'activity', 'buy_limit_group');
            }

            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_lucky_wheel = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'lucky_wheel')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var luckyWheel = user.activity.lucky_wheel;
        if (luckyWheel.time != conf_mgr.gConfActivities['lucky_wheel'].startTime) {
            luckyWheel.time = conf_mgr.gConfActivities['lucky_wheel'].startTime;
            luckyWheel.score = 0;
            luckyWheel.reward = {};
            player.markDirty('activity.lucky_wheel');
        }

        req.args.end_time = conf_mgr.gConfActivities['lucky_wheel'].endTime;
        requestGlobal(req, resp, function () {
            if (resp.code == 0) {
                resp.data.lucky_wheel = luckyWheel;
            }
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.turn_lucky_wheel = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'lucky_wheel')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var time = Math.floor(req.args.time);
        if (isNaN(time) || time < 1) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var luckyWheel = user.activity.lucky_wheel;
        if (luckyWheel.time != conf_mgr.gConfActivities['lucky_wheel'].startTime) {
            resp.code = 1; resp.desc = 'not refresh'; break;
        }

        req.args.un = user.info.un;
        req.args.vip = user.status.vip;
        req.args.time = time;
        req.args.score = luckyWheel.score;
        requestGlobal(req, resp, function () {
            if (resp.code == 0) {
                luckyWheel.score = resp.data.score;
                player.markDirty('activity.lucky_wheel.score');

                var ids = resp.data.ids;
                var awards = [['user', 'cash', resp.data.cash]];
                for (var i = 0, len = ids.length; i < len; i++) {
                    var id = ids[i];
                    if (conf_mgr.gConfAvLuckyWheel[id].type != 2) {
                        awards.combine(conf_mgr.gConfAvLuckyWheel[id].award);
                    }
                }

                resp.data.awards = player.addAwards(awards, 'activity', 'turn_lucky_wheel');
                resp.data.costs = player.addAwards(costs, 'activity', 'turn_lucky_wheel');
            }

            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_lucky_wheel_score_reward = function (player, req, resp, onHandled) {
    do {
        if (!isActivityStart(player, 'lucky_wheel')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var score = Math.floor(req.args.score);
        var conf = conf_mgr.gConfAvLuckyWheelScore[score];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var luckyWheel = player.user.activity.lucky_wheel;
        if (luckyWheel.time != conf_mgr.gConfActivities['lucky_wheel'].startTime) {
            resp.code = 1; resp.desc = 'not refresh'; break;
        }

        if (luckyWheel.score < score) {
            resp.code = 1; resp.desc = 'not enough score'; break;
        }

        if (luckyWheel.reward[score]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        luckyWheel.reward[score] = 1;
        player.markDirty('activity.lucky_wheel.reward.' + score);

        resp.data.awards = player.addAwards(conf.award, 'activity', 'get_lucky_wheel_score_reward');
    } while (false);

    onHandled();
};

exports.get_lucky_wheel_rank = function (player, req, resp, onHandled) {
    requestGlobal(req, resp, onHandled);
};

exports.get_lucky_dragon = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'lucky_dragon')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            resp.data.lucky_dragon = user.activity.lucky_dragon;
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_lucky_wheel_rank = function (player, req, resp, onHandled) {
    requestGlobal(req, resp, onHandled);
};

exports.click_lucky_dragon = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'lucky_dragon')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var luckyDragon = user.activity.lucky_dragon;
        var vip = user.status.vip;

        if (luckyDragon.use >= conf_mgr.gConfVip[vip].luckyDragon) {
            resp.code = 1; resp.desc = 'no use'; break;
        }

        if (luckyDragon.use >= Object.keys(conf_mgr.gConfAvLuckyDragon).max()) {
            resp.code = 1; resp.desc = 'not use'; break;
        }

        var conf = conf_mgr.gConfAvLuckyDragon[luckyDragon.use + 1];
        var costs = [['user', 'mixcash', -conf.spend]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cash not enough'; break;
        }

        var addCash = common.randRange(conf.lowest, conf.highest);
        req.args.add_cash = addCash;
        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            if (resp.code == 0) {
                luckyDragon.use++;
                player.markDirty('activity.lucky_dragon.use');
                luckyDragon.last = addCash;
                player.markDirty('activity.lucky_dragon.last');

                var awards = [['user', 'bindcash', addCash]];
                resp.data.costs = player.addAwards(costs, 'activity', 'click_lucky_dragon');
                resp.data.awards = player.addAwards(awards, 'activity', 'click_lucky_dragon');

                player.rmTip('lucky_dragon');
                player.checkLuckyDragon();
            }

            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_grow_fund = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'grow_fund')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var gf = user.activity.grow_fund;

        if (!gf.reset) {
            gf.reset = 1;
            for (var i in gf.rewards) {
                gf.rewards[i] = 0;
            }
            player.markDirty('activity.grow_fund');
        }

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            resp.data.grow_fund = user.activity.grow_fund;
            onHandled();
        })
        return;
    } while (false);

    onHandled();
};

exports.get_grow_fund_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'grow_fund')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvGrowFund[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var growFund = user.activity.grow_fund;
        if (growFund.rewards[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        if (conf.type == 0) {
            if (!growFund.bought_type) {
                resp.code = 1; resp.desc = 'no buy'; break;
            }

            if (user.status.level < conf.condition) {
                resp.code = 1; resp.desc = 'level not reached'; break;
            }

            growFund.rewards[id] = 1;
            player.markDirty('activity.grow_fund.rewards.' + id);

            // resp.data.awards = player.addAwards(conf['awards' + growFund.bought_type], 'activity', 'get_grow_fund_award');
            resp.data.awards = player.addAwards(conf['awards1'], 'activity', 'get_grow_fund_award');
        } else {

            if (user.status.vip < conf.vip) {
                resp.code = 1; resp.desc = 'vip not reached'; break;
            }

            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                if (resp.data.count < conf.condition) {
                    resp.code = 1; resp.desc = 'not enough count';
                } else {
                    growFund.rewards[id] = 1;
                    player.markDirty('activity.grow_fund.rewards.' + id);

                    // resp.data.awards = player.addAwards(conf['awards' + 2], 'activity', 'get_grow_fund_award');
                    resp.data.awards = player.addAwards(conf['awards1'], 'activity', 'get_grow_fund_award');
                }

                onHandled();
            });
            return;
        }
    } while (false);

    onHandled();
};

exports.get_accumulate_recharge = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'accumulate_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        resp.data.accumulate_recharge = user.activity.accumulate_recharge;;
    } while (false);

    onHandled();
};

exports.get_accumulate_recharge_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'accumulate_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvAccumulateRecharge[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var accumulateRecharge = user.activity.accumulate_recharge;
        // if (accumulateRecharge.time != conf_mgr.gConfActivities['accumulate_recharge'].startTime) {
        //     resp.code = 1; resp.desc = 'not refresh'; break;
        // }

        if (accumulateRecharge.rewards[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        var gold = conf.needRechargeGoldNumber;
        var paid = accumulateRecharge.paid;
        if (paid < gold) {
            resp.code = 1; resp.desc = 'paid is not enough'; break;
        }

        accumulateRecharge.rewards[id] = 1;
        player.markDirty('activity.accumulate_recharge.rewards.' + id);

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_accumulate_recharge_award');
    } while (false);

    onHandled();

};

exports.get_daily_recharge = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'daily_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var today = getGameDate();
        var dailyRecharge = user.activity.daily_recharge;
        if (dailyRecharge.day != today) {
            dailyRecharge.day = today;
            dailyRecharge.rewards = {};
            player.markDirty('activity.daily_recharge');
        }

        resp.data.money = user.payment.day_money;
        resp.data.daily_recharge = dailyRecharge;
    } while (false);

    onHandled();

};

exports.get_daily_recharge_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'daily_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = +req.args.id;
        var conf = conf_mgr.gConfAvDailyRecharge[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var dailyRecharge = user.activity.daily_recharge;
        if (dailyRecharge.day != getGameDate()) {
            resp.code = 1; resp.desc = 'not refresh'; break;
        }

        if (dailyRecharge.rewards[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        var money = user.payment.day_money;
        if (money < conf.money) {
            resp.code = 1; resp.desc = 'money is not enough'; break;
        }

        dailyRecharge.rewards[id] = 1;
        player.markDirty('activity.daily_recharge.rewards.' + id);

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_daily_recharge_award');
    } while (false);

    onHandled();
};

exports.get_single_recharge = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'single_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var singleRecharge = user.activity.single_recharge;
        if (singleRecharge.time != conf_mgr.gConfActivities['single_recharge'].startTime) {
            singleRecharge.time = conf_mgr.gConfActivities['single_recharge'].startTime;
            singleRecharge.rewards = {};
            singleRecharge.money = {};
            singleRecharge.progress = {};
            player.markDirty('activity.single_recharge');
        }

        resp.data.single_recharge = singleRecharge;
    } while (false);

    onHandled();
};

exports.get_single_recharge_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'single_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvSingleRecharge[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var singleRecharge = user.activity.single_recharge;
        if (singleRecharge.time != conf_mgr.gConfActivities['single_recharge'].startTime) {
            resp.code = 1; resp.desc = 'not refresh'; break;
        }

        if (!singleRecharge.rewards[id]) {
            singleRecharge.rewards[id] = 0;
            player.markDirty('activity.single_recharge.rewards.' + id);
        }

        if (singleRecharge.rewards[id] >= conf.limitCount) {
            resp.code = 1; resp.desc = 'no rewarded'; break;
        }

        if (singleRecharge.progress[id] <= singleRecharge.rewards[id]) {
            resp.code = 1; resp.desc = 'pay count not enough'; break;
        }

        singleRecharge.rewards[id]++;
        player.markDirty('activity.single_recharge.rewards.' + id);

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_single_recharge_award');
    } while (false);

    onHandled();

};

exports.get_expend_gift = function (player, req, resp, onHandled) {
    do {
        if (!isActivityStart(player, 'expend_gift')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var expendGift = player.user.activity.expend_gift;
        if (expendGift.time != conf_mgr.gConfActivities['expend_gift'].startTime) {
            expendGift.time = conf_mgr.gConfActivities['expend_gift'].startTime;
            expendGift.paid = 0;
            expendGift.rewards = {};
            player.markDirty('activity.expend_gift');
        }

        resp.data.expend_gift = expendGift;
    } while (false);

    onHandled();
};

exports.get_expend_gift_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'expend_gift')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvExpendGift[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var expendGift = user.activity.expend_gift;
        if (expendGift.time != conf_mgr.gConfActivities['expend_gift'].startTime) {
            expendGift.time = conf_mgr.gConfActivities['expend_gift'].startTime;
            expendGift.paid = 0;
            expendGift.rewards = {};
            player.markDirty('activity.expend_gift');
        }

        if (expendGift.rewards[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        if (expendGift.paid < conf.paid) {
            resp.code = 1; resp.desc = 'not reached'; break;
        }

        expendGift.rewards[id] = 1;
        player.markDirty('activity.expend_gift.rewards.' + id);

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_expend_gift_award');
    } while (false);

    onHandled();

};

exports.get_drops_dragon = function (player, req, resp, onHandled) {
    resp.desc = 'not support';
    onHandled();
};

exports.get_drops_dragon_award = function (player, req, resp, onHandled) {
    resp.desc = 'not support';
    onHandled();
};

exports.get_tavern_recruit = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'tavern_recruit')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var tavernRecruit = user.activity.tavern_recruit;
        if (tavernRecruit.time != conf_mgr.gConfActivities['tavern_recruit'].startTime) {
            tavernRecruit.time = conf_mgr.gConfActivities['tavern_recruit'].startTime;
            tavernRecruit.frequency = 0;
            tavernRecruit.num = 0;
            tavernRecruit.rewards = {};
            player.markDirty('activity.tavern_recruit');
        }

        resp.data.tavern_recruit = tavernRecruit;
    } while (false);

    onHandled();
};
/*
 * 没有箱子奖励了
exports.get_tavern_recruit_award = function(player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'tavern_recruit')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvTavernRecruit[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var tavernRecruit = user.activity.tavern_recruit;
        if (tavernRecruit.rewards[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        if (tavernRecruit.frequency < conf.num) {
            resp.code = 1; resp.desc = 'num is not achieve'; break;
        }

        tavernRecruit.rewards[id] = 1;
        player.markDirty('activity.tavern_recruit.rewards.' + id);

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_tavern_recruit_award');
    } while (false);

    onHandled();
};
*/

exports.get_tavern_recruit_generals = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'tavern_recruit')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var num = req.args.num || 1;
        var tavernRecruit = user.activity.tavern_recruit;

        if (num + tavernRecruit.num > Object.keys(conf_mgr.gConfAvTavernRecruitFrequency).length) {
            resp.code = 1; resp.desc = 'invalid num'; break;
        }

        var timeId = tavernRecruit.num + num;
        var conf = conf_mgr.gConfAvTavernRecruitFrequency[timeId];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid num'; break;
        }

        if (tavernRecruit.frequency < conf.num) {
            resp.code = 1; resp.desc = 'num is not achieve'; break;
        }

        var timeId = tavernRecruit.num + 1;
        var conf = conf_mgr.gConfAvTavernRecruitFrequency[timeId];
        var awards = clone(conf.awards[id]);
        if (!awards) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }
        awards[2] = awards[2] * num;
        tavernRecruit.num += num;
        player.markDirty('activity.tavern_recruit.num');

        resp.data.awards = player.addAwards([awards], 'activity', 'get_tavern_recruit_generals');
    } while (false);

    onHandled();
};

exports.get_exchange_points = function (player, req, resp, onHandled) {
    do {
        if (!isActivityStart(player, 'exchange_points')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var exchangePoints = player.user.activity.exchange_points;
        if (exchangePoints.time < conf_mgr.gConfAvExchangePointsTime[1].startTime) {
            exchangePoints.time = conf_mgr.gConfAvExchangePointsTime[1].startTime;
            exchangePoints.interval = 0;
            exchangePoints.progress = {};
            exchangePoints.rewards = {};
            player.markDirty('activity.exchange_points');
        }

        var tips = player.user.tips;
        if (player.user.tips.exchange_points) {
            player.user.tips.exchange_points = 0;
            player.markDirty('tips.exchange_points');
        }
        resp.data.exchange_points = exchangePoints;
    } while (false);

    onHandled();
};

exports.get_exchange_points_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'exchange_points')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvExchangePointsId[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var exchangePoints = user.activity.exchange_points;
        if (exchangePoints.rewards[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        var key = conf_mgr.gConfAvExchangePointsId[id].key;
        if (exchangePoints.progress[key] < conf_mgr.gConfAvExchangePointsId[id].target) {
            resp.code = 1; resp.desc = 'not reach'; break;
        }

        exchangePoints.rewards[id] = 1;
        player.markDirty('activity.exchange_points.rewards.' + id);

        resp.data.points = conf.points;
        exchangePoints.integral += conf.points;
        player.markDirty('activity.exchange_points.integral');
    } while (false);

    onHandled();
};

exports.get_exchange_points_buy = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'exchange_points')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvExchangePointsAward[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var exchangePoints = user.activity.exchange_points;
        if (exchangePoints.integral < conf.points) {
            resp.code = 1; resp.desc = 'points not reach'; break;
        }

        exchangePoints.integral -= conf.points
        player.markDirty('activity.exchange_points.integral');

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_exchange_points_buy');
    } while (false);

    onHandled();
};

exports.get_daily_cost = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'daily_cost')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var today = getGameDate();
        var dailyCost = user.activity.daily_cost;
        if (dailyCost.day != today) {
            dailyCost.day = today;
            dailyCost.day_cost = 0;
            dailyCost.rewards = {};
            player.markDirty('activity.daily_cost');
        }

        resp.data.daily_cost = dailyCost;
    } while (false);

    onHandled();
};

exports.get_daily_cost_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'daily_cost')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        var conf = conf_mgr.gConfAvDailyCost[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var today = getGameDate();
        var dailyCost = user.activity.daily_cost;
        if (dailyCost.day != today) {
            resp.code = 1; resp.desc = 'invaild id'; break;
        }

        if (dailyCost.rewards[id]) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        var paid = dailyCost.day_cost;
        if (paid < conf.cost) {
            resp.code = 1; resp.desc = 'paid is not enough'; break;
        }

        dailyCost.rewards[id] = 1;
        player.markDirty('activity.daily_cost.rewards.' + id);

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_daily_cost_award');
    } while (false);

    onHandled();
};

exports.get_day_vouchsafe = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'day_vouchsafe')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var vouchsafe = user.activity.day_vouchsafe;
        if (vouchsafe.time != conf_mgr.gConfActivities['day_vouchsafe'].startTime) {
            vouchsafe = user.activity.day_vouchsafe = {
                time: conf_mgr.gConfActivities['day_vouchsafe'].startTime,
                day_pay: getGameDate(),
                day_money: 0,
                rewards: [],
            };
        }

        resp.data.day_vouchsafe = vouchsafe;
    } while (false);

    onHandled();
};

exports.get_day_vouchsafe_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'day_vouchsafe')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var day = req.args.day;
        var vouchsafe = user.activity.day_vouchsafe;
        var conf = conf_mgr.gConfAvDayVouchsafe[day];
        if (day < 0 || !conf) {
            resp.code = 1; resp.desc = 'day error'; break;
        }

        var payday = vouchsafe.rewards.length;
        if (day > payday) {
            resp.code = 1; resp.desc = 'nopay that day'; break;
        }

        if (vouchsafe.rewards[day - 1] == 1) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_day_vouchsafe_award');
        vouchsafe.rewards[day - 1] = 1;
        player.markDirty('activity.day_vouchsafe');
    } while (false);

    onHandled();
};

exports.get_promote_exchange = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'promote_exchange')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var promote_exchange = user.activity.promote_exchange;
        if (!promote_exchange || promote_exchange.time != conf_mgr.gConfActivities['promote_exchange'].startTime) {
            promote_exchange = user.activity.promote_exchange = {};
            promote_exchange.time = conf_mgr.gConfActivities['promote_exchange'].startTime;
            player.markDirty('activity.promote_exchange');
        }

        resp.data.promote_exchange = promote_exchange;
    } while (false);

    onHandled();
};

exports.promote_exchange = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'promote_exchange')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var promote_exchange = user.activity.promote_exchange;
        var id = req.args.id;
        var conf = conf_mgr.gConfAvpromoteexchange[id];

        if (!conf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }

        if (!promote_exchange) {
            resp.code = 1; resp.desc = 'data error'; break;
        }

        var num = +req.args.num;
        if (num < 0) {
            resp.code = 1; resp.desc = 'num error'; break;
        }

        var costsNum = -num * conf['scales'][0];
        var costs = [['material', conf['lostId'], costsNum]];
        var cashCosts = -conf['cash'];
        var costsCash = [['user', 'cash', cashCosts]];

        costs.combine(costsCash);
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough costs'; break;
        }

        if (!promote_exchange[id]) {
            promote_exchange[id] = 0;
        }

        if (promote_exchange[id] + num > conf['num']) {
            resp.code = 1; resp.desc = 'num limite'; break;
        }

        promote_exchange[id] += num;
        var getNum = +conf['scales'][1] * num;

        var award = [['material', conf['getId'], getNum]];
        player.markDirty('activity.promote_exchange.' + id);

        resp.data.costs = player.addAwards(costs, 'activity', 'promote_exchange');
        resp.data.awards = player.addAwards(award, 'activity', 'promote_exchange');
    } while (false);

    onHandled();
};

exports.get_human_wing = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'human_wing')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var human_wing = user.activity.human_wing;
        if (!human_wing || human_wing.time != conf_mgr.gConfActivities['human_wing'].startTime) {
            human_wing = user.activity.human_wing = {};
            human_wing.time = conf_mgr.gConfActivities['human_wing'].startTime;
            human_wing.level = user.sky_suit.wing_level;
            human_wing.achieve = {};
            player.markDirty('activity.human_wing');
        }

        resp.data.human_wing = human_wing;
    } while (false);

    onHandled();
};

exports.get_human_arms = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'human_arms')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var human_arms = user.activity.human_arms;
        if (!human_arms || human_arms.time != conf_mgr.gConfActivities['human_arms'].startTime) {
            human_arms = user.activity.human_arms = {};
            human_arms.time = conf_mgr.gConfActivities['human_arms'].startTime;
            human_arms.level = user.sky_suit.weapon_level;
            human_arms.achieve = {};
            player.markDirty('activity.human_arms');
        }

        resp.data.human_arms = human_arms;
    } while (false);

    onHandled();
};

exports.get_human_mount = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'human_mount')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var human_mount = user.activity.human_mount;
        if (!human_mount || human_mount.time != conf_mgr.gConfActivities['human_mount'].startTime) {
            human_mount = user.activity.human_mount = {};
            human_mount.time = conf_mgr.gConfActivities['human_mount'].startTime;
            human_mount.level = user.sky_suit.mount_level;
            human_mount.achieve = {};
            player.markDirty('activity.human_mount');
        }

        resp.data.human_mount = human_mount;
    } while (false);

    onHandled();
};

exports.get_human_wing_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'human_wing')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var human_wing = user.activity.human_wing;
        var level = req.args.level;
        var conf = conf_mgr.gConfAvhuman_wing[level];

        if (!conf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }

        if (human_wing.achieve[level]) {
            resp.code = 1; resp.desc = 'already get'; break;
        }

        var award1 = [];
        if (human_wing.level <= level) {
            award1 = conf['awards1'];
        }

        human_wing.achieve[level] = 1;
        player.markDirty('activity.human_wing.achieve');

        if (award1.length) {
            resp.data.awards1 = player.addAwards(award1, 'activity', 'get_human_wing_award');
        }

        var award2 = conf['awards2'];
        resp.data.awards2 = player.addAwards(award2, 'activity', 'get_human_wing_award');
    } while (false);

    onHandled();
};

exports.get_human_arms_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'human_arms')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var human_arms = user.activity.human_arms;
        var level = req.args.level;
        var conf = conf_mgr.gConfAvhuman_arms[level];

        if (!conf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }

        var award1 = [];
        if (human_arms.level <= level) {
            award1 = conf['awards1'];
        }

        if (human_arms.achieve[level]) {
            resp.code = 1; resp.desc = 'already get'; break;
        }

        human_arms.achieve[level] = 1;
        player.markDirty('activity.human_arms.achieve');

        if (award1.length) {
            resp.data.awards1 = player.addAwards(award1, 'activity', 'get_human_arms_award');
        }

        var award2 = conf['awards2'];
        resp.data.awards2 = player.addAwards(award2, 'activity', 'get_human_arms_award');
    } while (false);

    onHandled();
};

exports.get_human_mount_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'human_mount')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var human_mount = user.activity.human_mount;
        var level = req.args.level;
        var conf = conf_mgr.gConfAvhuman_mount[level];

        if (!conf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }

        var award1 = [];
        if (human_mount.level <= level) {
            award1 = conf['awards1'];
        }

        if (human_mount.achieve[level]) {
            resp.code = 1; resp.desc = 'already get'; break;
        }

        human_mount.achieve[level] = 1;
        player.markDirty('activity.human_mount.achieve');

        if (award1.length) {
            resp.data.awards1 = player.addAwards(award1, 'activity', 'get_human_mount_award');
        }

        var award2 = conf['awards2'];
        resp.data.awards2 = player.addAwards(award2, 'activity', 'get_human_mount_award');
    } while (false);

    onHandled();
};

// exports.get_open_rank = function(player, req, resp, onHandled) {
//     var user = player.user;
//     do {
//         if (!isActivityStart(player, 'open_rank')) {
//             resp.code = 1; resp.desc = 'not open'; break;
//         }
//
//         requestWorld(req, resp, function() {
//             if (resp.code == 0) {
//                 resp.data.fight_force = player.getFightForce();
//                 resp.data.level = user.status.level;
//                 resp.data.xp = user.status.xp;
//             }
//
//             onHandled();
//         });
//         return;
//     } while (false);
//
//     onHandled();
// };

exports.get_av_rank_level = function (player, req, resp, onHandled) {
    //var user = player.user;
    do {
        if (!isActivityStart(player, 'open_rank_level')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_av_rank_fight_force = function (player, req, resp, onHandled) {
    //var user = player.user;
    do {
        if (!isActivityStart(player, 'open_rank_ff')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};


exports.get_av_rank_fight_force_10 = function (player, req, resp, onHandled) {
    //var user = player.user;
    do {
        if (!isActivityStart(player, 'open_rank_ff_10')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_av_rank_fight_force_15 = function (player, req, resp, onHandled) {
    //var user = player.user;
    do {
        if (!isActivityStart(player, 'open_rank_ff_15')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_av_rank_recharge_ranks = function (player, req, resp, onHandled) {
    //var user = player.user;
    do {
        if (!isActivityStart(player, 'open_rank_recharge')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        req.args.rank_recharge = (player.user.activity && player.user.activity.rank && player.user.activity.rank.recharge) ? player.user.activity.rank.recharge : {};
        req.args.rank_recharge.time = (req.args.rank_recharge.time == Number.MAX_VALUE) ? 99999999999 : req.args.rank_recharge.time;
        if (req.args.rank_recharge.stage && req.args.rank_recharge.stage != conf_mgr.gConfActivities["open_rank_recharge"].startTime) {
            req.args.rank_recharge = null
        }
        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

exports.get_av_rank_expense_ranks = function (player, req, resp, onHandled) {
    //var user = player.user;
    do {
        if (!isActivityStart(player, 'open_rank_expense')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        req.args.rank_expense = (player.user.activity && player.user.activity.rank) && player.user.activity.rank.expense ? player.user.activity.rank.expense : {};
        req.args.rank_expense.time = (req.args.rank_expense.time == Number.MAX_VALUE) ? 99999999999 : req.args.rank_expense.time;
        if (req.args.rank_expense.stage && req.args.rank_expense.stage != conf_mgr.gConfActivities["open_rank_expense"].startTime) {
            req.args.rank_expense = null
        }
        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};


exports.get_first_pay = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        resp.data.first_pay = {
            paid: user.payment.paid,
            reward: user.activity.rewarded_first_pay,
            old_paid: user.payment.old_paid,
        }

        if (!player.user.misc.city_failed_times) {
            player.user.misc.city_failed_times = 0;
        }

        if (player.user.misc.city_failed_times == 0) {
            player.user.misc.city_failed_times++;
            player.markDirty('misc.city_failed_times');
        }

    } while (false);

    onHandled();
};

exports.get_first_pay_reward = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = req.args.id;
        var conf = conf_mgr.gConfAvFirstPay[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        //var firstPay = user.activity.first_pay;
        //if (firstPay.rewards[id]) {
        var rewardedFirstPay = user.activity.rewarded_first_pay;
        if (rewardedFirstPay.indexOf(id) >= 0) {
            resp.code = 1; resp.desc = 'already rewarded'; break;
        }
        /*
        if (user.mark.first_pay != 2) {
            resp.code = 1; resp.desc = "can not rewarded"; break;
        }

        var target1 = 1;
        var target2 = 2;
        var idProgress = firstPay.progress[id];
        if (!idProgress[target1] && !idProgress[target2]) {
            resp.code = 1; resp.desc = 'not reach target'; break;
        } else if (idProgress[target1] && !idProgress[target2]) {
            if (idProgress[target1] < conf.target1) {
                resp.code = 1; resp.desc = 'not reach target'; break;
            }
        } else if (!idProgress[target1] && idProgress[target2]) {
            if (idProgress[target2] < conf.target2) {
                resp.code = 1; resp.desc = 'not reach target'; break;
            }
        } else if (idProgress[target1] && idProgress[target2]) {
            if (idProgress[target1] < conf.target1 && idProgress[target2] < conf.target2) {
                resp.code = 1; resp.desc = 'not reach target'; break;
            }
        }

        firstPay.rewards[id] = 1;
        player.markDirty('activity.first_pay.rewards.' + id);

        resp.data.awards = player.addAwards(conf.awards, 'activity', 'get_first_pay_reward');
        */

        if (conf['pay'] > (user.payment.paid + user.payment.old_paid)) {
            resp.code = 1; resp.desc = 'not reach target'; break;
        }
        rewardedFirstPay.push(id);
        player.markDirty('activity.rewarded_first_pay');

        resp.data.awards = player.addAwards(conf.rewards, 'activity', 'get_first_pay_reward');
    } while (false);

    onHandled();
};

// 获取平凡招募活动奖励
exports.get_tavern_normal_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        if (!conf_mgr.gConfAvTavernNormal[id]) {
            resp.code = 1; resp.desc = 'conf error, id = ' + id; break;
        }

        // 检查是否已领奖
        if (user.activity.tavern_normal.award_got.indexOf(id) >= 0) {
            resp.code = 101; resp.desc = 'has got'; break;
        }

        // 检查条件是否已达成
        if (user.activity.tavern_normal.count < conf_mgr.gConfAvTavernNormal[id].number) {
            resp.code = 102; resp.desc = 'not finish'; break;
        }

        var awards = conf_mgr.gConfAvTavernNormal[id].awards;
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        user.activity.tavern_normal.award_got.push(id);
        player.markDirty('activity.tavern_normal.award_got');
    } while (false);

    onHandled();
};

exports.get_tavern_high_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        if (!conf_mgr.gConfAvTavernHigh[id]) {
            resp.code = 1; resp.desc = 'conf error, id = ' + id; break;
        }

        // 检查是否已领奖
        if (user.activity.tavern_high.award_got.indexOf(id) >= 0) {
            resp.code = 101; resp.desc = 'has got'; break;
        }

        // 检查条件是否已达成
        if (user.activity.tavern_high.count < conf_mgr.gConfAvTavernHigh[id].number) {
            resp.code = 102; resp.desc = 'not finish'; break;
        }

        var awards = conf_mgr.gConfAvTavernHigh[id].awards;
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        user.activity.tavern_high.award_got.push(id);
        player.markDirty('activity.tavern_high.award_got');
    } while (false);

    onHandled();
};

exports.get_gift_bag = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'gift_bag')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        resp.data.gift_bag = user.activity.gift_bag;
    } while (false);

    onHandled();
};

exports.buy_gift_bag = function (player, req, resp, onHandled) {
    var user = player.user;
    do {

        if (!isActivityStart(player, 'gift_bag')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        var conf = conf_mgr.gConfGiftBag[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        if (conf.onoff <= 0) {
            resp.code = 1; resp.desc = 'gift bag has closed'; break;
        }
        var limitValArr = String(conf.triggerLimit).split('.');
        if (limitValArr.length > 0) {
            if (limitValArr[0] == 'level') {
                var limitLv = parseInt(limitValArr[1]) || 0;
                if (limitLv > user.status.level) {
                    resp.code = 101; resp.desc = 'gift trigger limit'; break;
                }
            } else if (limitValArr[0] == 'vip') {
                var limitVip = parseInt(limitValArr[1]) || 0;
                if (limitVip > user.status.vip) {
                    resp.code = 101; resp.desc = 'gift trigger limit'; break;
                }
            } else if (limitValArr[0] == 'gameday') {
                var limitDay = parseInt(limitValArr[1]) || 0;
                var today = getGameDate();
                var passDay = common.getDateDiff(today, common.GLOBAL_SERVER_INFO_DICT.serverStartDate);
                if ((limitDay - 1) > passDay) {
                    resp.code = 101; resp.desc = 'gift trigger limit'; break;
                }
            }
        }

        var gift_bag = user.activity.gift_bag;
        var giftBagData = gift_bag[id];
        if (!giftBagData) {
            resp.code = 1; resp.desc = 'not trigger'; break;
        }

        if (conf.lifeTime != 0) {
            var today = getGameDate();
            var triggerDate = getGameDate(giftBagData.time);
            var passDay = common.getDateDiff(today, triggerDate);
            if (passDay >= conf.lifeTime) {
                resp.code = 1; resp.desc = 'gift bag time out'; break;
            }
        }

        if (giftBagData.buy_count >= conf.count) {
            resp.code = 102; resp.desc = 'buy count limit'; break;
        }

        if (conf.costtype == 1) {
            // 人民币购买，走充值(发送充值参数给客户度，最终由充值模块发货)
            var rechargeParam = formatGiftParam('avgiftbag', id);
            resp.data.recharge_param = rechargeParam;
        } else if (conf.costtype == 2) {
            var costs = conf.item;
            if (!player.checkCosts(costs)) {
                resp.code = 103; resp.desc = 'cost not enough'; break;
            }
            // 游戏货币购买
            giftBagData.buy_count++;
            if (giftBagData.buy_count >= conf.count) {
                giftBagData.sell_out_time = common.getTime();
            }
            player.markDirty(util.format('activity.gift_bag.%d', id));

            var awards = conf.rewards;
            resp.data.costs = player.addAwards(costs, req.mod, req.act);
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
        } else {
            resp.code = 1; resp.desc = 'invalid cost type'; break;
        }
    } while (false);

    onHandled();
};

// 打开活动界面
exports.open_ui = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var key = req.args.key;
        if (!key) {
            resp.code = 1; resp.desc = 'key need'; break;
        }

        if (!isActivityStart(player, key)) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var activity = user.activity[key];
        if (!activity) {
            //resp.code = 1; resp.desc ='not find activity'; break;
            user.activity[key] = {};
            player.markDirty(util.format('activity.%s', key));
            activity = user.activity[key];
        }

        activity.ui = 1;
        player.markDirty(util.format('activity.%s.ui', key));

    } while (false);

    onHandled();
};

// 访问礼包
exports.visit_gift_bag = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var giftIds = req.args.ids;
        if (!giftIds || !util.isArray(giftIds)) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        if (!user.mark.visit_gift_bag) {
            user.mark.visit_gift_bag = [];
            player.markDirty('mark.visit_gift_bag');
        }

        var needSave = false;
        for (var i = 0; i < giftIds.length; i++) {
            var id = giftIds[i];
            if (id && user.mark.visit_gift_bag.indexOf(id) < 0) {
                user.mark.visit_gift_bag.push(id);
                needSave = true;
            }
        }

        if (needSave) {
            player.markDirty('mark.visit_gift_bag');
        }

        resp.data.visit_list = user.mark.visit_gift_bag;
    } while (false);

    onHandled();
};

// 购买七天乐礼包
exports.buy_seven_day_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        var conf = conf_mgr.gConfOpenSevenReward[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        // 检查礼包是否已经购买过
        if (user.activity.open_seven.progress && user.activity.open_seven.progress[id] && user.activity.open_seven.progress[id][1]) {
            resp.code = 1; resp.desc = 'has buy'; break;
        }

        var rechargeParam = formatGiftParam('openseven', id);
        resp.data.recharge_param = rechargeParam;
    } while (false);

    onHandled();
};

// 限时兑换
exports.limit_exchange = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'limit_exchange')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        var conf = conf_mgr.gConfAvLimitExchange[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        // 检查兑换次数
        if (user.activity.limit_exchange[id] && user.activity.limit_exchange[id] >= conf.count) {
            resp.code = 1; resp.desc = 'exchange count reach max'; break;
        }

        var costs = conf.awards1;
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cost not enough'; break;
        }

        var awards = conf.awards2;
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        if (!user.activity.limit_exchange[id]) {
            user.activity.limit_exchange[id] = 0;
        }

        user.activity.limit_exchange[id] += 1;
        player.markDirty(util.format('activity.limit_exchange.%d', id));
    } while (false);

    onHandled();
};

// 打开限时兑换活动界面
exports.get_limit_exchange = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'limit_exchange')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var activity = user.activity.limit_exchange;

        var passedDay = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime)) + 1;
        if (common.GLOBAL_SERVER_INFO_DICT.serverStartDate > common.getTime(20190424) || passedDay > 7) {//这样写,是因为这个活动之前 是没有重置数据
            if (!activity || !activity.time || activity.time != conf_mgr.gConfActivities['limit_exchange'].startTime) {
                user.activity.limit_exchange = {};
                user.activity.limit_exchange.time = conf_mgr.gConfActivities['limit_exchange'].startTime,
                    player.markDirty('activity.limit_exchange');
                activity = user.activity.limit_exchange;
            }
        }


        activity.ui = 1;
        player.markDirty('activity.limit_exchange');
        resp.data = user.activity.limit_exchange;
    } while (false);

    onHandled();
};


// 打开限时兑换活动界面
exports.get_day_exchange = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'day_exchange')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var activity = user.activity.day_exchange;
        if (!activity || activity.time != conf_mgr.gConfActivities['day_exchange'].startTime) {
            user.activity.day_exchange = {};
            user.activity.day_exchange.time = conf_mgr.gConfActivities['day_exchange'].startTime,
                player.markDirty('activity.day_exchange');
            activity = user.activity.day_exchange;
        }
        activity.ui = 1;
        player.markDirty('activity.day_exchange');
        resp.data = user.activity.day_exchange;
    } while (false);

    onHandled();
};


// 限时兑换
exports.day_exchange = function (player, req, resp, onHandled) {
    var user = player.user;
    do {

        if (!isActivityStart(player, 'day_exchange')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        var conf = conf_mgr.gConfDayExchange[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        // 检查兑换次数
        if (user.activity.day_exchange[id] && user.activity.day_exchange[id] >= conf.count) {
            resp.code = 1; resp.desc = 'exchange count reach max'; break;
        }

        var costs = conf.awards1;
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cost not enough'; break;
        }

        var awards = conf.awards2;
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        if (!user.activity.day_exchange[id]) {
            user.activity.day_exchange[id] = 0;
        }

        user.activity.day_exchange[id] += 1;
        player.markDirty(util.format('activity.day_exchange.%d', id));
    } while (false);

    onHandled();
};




// 打开限时购物界面
exports.get_buy_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isActivityStart(player, 'buy_award')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }
        var activity = user.activity.buy_award;
        if (!activity || activity.time != conf_mgr.gConfActivities['buy_award'].startTime) {
            user.activity.buy_award = {};
            user.activity.buy_award.time = conf_mgr.gConfActivities['buy_award'].startTime,
                player.markDirty('activity.buy_award');
            activity = user.activity.buy_award;
        }

        var curWeekIdx = getWeekIndex();
        if (!activity.curWeekIdx || activity.curWeekIdx != curWeekIdx) {
            user.activity.buy_award = {};
            user.activity.buy_award.time = conf_mgr.gConfActivities['buy_award'].startTime;
            user.activity.buy_award.curWeekIdx = curWeekIdx;
            player.markDirty('activity.buy_award');
            activity = user.activity.buy_award;
        }

        activity.ui = 1;
        player.markDirty('activity.buy_award');

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            resp.data.buy_award = user.activity.buy_award;
            resp.data.left = resp.data.left;
            onHandled();
        });
    } while (false);


};


// 限时购物购买
exports.buy_award = function (player, req, resp, onHandled) {
    var user = player.user;
    do {

        if (!isActivityStart(player, 'buy_award')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var id = req.args.id;
        if (!id) {
            resp.code = 1; resp.desc = 'id need'; break;
        }

        var curWeekDay = getGameWeekDay();
        if (!conf_mgr.gConfBuyAward[curWeekDay] || !conf_mgr.gConfBuyAward[curWeekDay][id]) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }
        var conf = conf_mgr.gConfBuyAward[curWeekDay][id];
        var costs = conf.sell;
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cost not enough'; break;
        }

        if (conf.buytype == 1) {
            var curHours = new Date().getHours;
            if (curHours >= 5 && curHours < 12) {
                resp.code = 1; resp.desc = 'not buy'; break;
            }
        }

        function calBack(player, resp) {
            if (!user.activity.buy_award[curWeekDay]) {
                user.activity.buy_award[curWeekDay] = {};
                player.markDirty('activity.buy_award');
            }

            if (user.activity.buy_award[curWeekDay][id]) {
                user.activity.buy_award[curWeekDay][id] += 1;
            } else {
                user.activity.buy_award[curWeekDay][id] = 1;
            }
            player.markDirty('activity.buy_award');

            var awards = conf.awards1;
            resp.data.costs = player.addAwards(costs, req.mod, req.act);
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
            onHandled();
        }
        if (conf.buytype == 1) {
            req.args.curWeekDay = curWeekDay;
            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                if (!req.code) {
                    calBack(player, resp);
                } else {
                    onHandled();
                }
            });
        } else {
            if (user.activity.buy_award[curWeekDay] && user.activity.buy_award[curWeekDay][id] && user.activity.buy_award[curWeekDay][id] >= conf.num) {
                resp.code = 101; resp.desc = 'buy over'; break;
            }
            calBack(player, resp);
        }
        return;
    } while (false);
    onHandled();

};

// ----------------------------------------------------------------------------
// 评价活动

// 更改评价状态
exports.appraise = function (player, req, resp, onHandled) {
    var user = player.user;
    var index = req.args.index;

    do {

        // 检测是否开启
        if (isActivityStart(player, 'doappraise') != ActivityProcess.NORMAL) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        // 是否已完成
        if (user.activity.doappraise.doappraise == 2) {
            resp.code = 1; resp.desc = 'This has been done'; break;
        }

        if (index == 1 && user.activity.doappraise.doappraise == 0) {
            user.activity.doappraise.doappraise = 1;
            player.markDirty('activity.doappraise');
            break
        }

        if (index == 2 && user.activity.doappraise.doappraise == 1) {
            user.activity.doappraise.doappraise = 2;
            player.markDirty('activity.doappraise');
            var awards = parseAwardsConfig(conf_mgr.gConfGlobal.doAppraiseAward);
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
            break
        }

        resp.code = 1; resp.desc = 'invalid index or doappraise'; break;

    } while (false);

    resp.data.doappraise = user.activity.doappraise.doappraise;

    onHandled();
};


// 获取评价状态
exports.get_appraise = function (player, req, resp, onHandled) {
    var user = player.user;

    var doappraise = 0;

    do {

        // 检测是否开启
        if (isActivityStart(player, 'doappraise') != ActivityProcess.NORMAL) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        doappraise = user.activity.doappraise.doappraise

    } while (false);

    resp.data.doappraise = doappraise

    onHandled();
};


// 不知道干啥
exports.open_perks = function (player, req, resp, onHandled) {
    let user = player.user;

    if (user.misc.perks_opened) {
        return;
    }

    user.misc.perks_opened = 1;
    player.markDirty('misc');

    user.tips['perks'] = 0;
    player.markDirty('tips.perks');

    onHandled();
}

function on_pay(player, cash, chargeId, gift_key, gift_id, total_fee) {
    if (!isActivityStart(player, 'open_rank_recharge')) { return; }
    if (!total_fee) { return; }

    var user = player.user;

    var value = total_fee - 0;

    user.activity = user.activity || {};
    user.activity.rank = user.activity.rank || {};
    user.activity.rank.recharge = user.activity.rank.recharge || {};
    if (user.activity.rank.recharge.stage == conf_mgr.gConfActivities["open_rank_recharge"].startTime) {
        user.activity.rank.recharge.value = (user.activity.rank.recharge.value || 0) + value;
    }
    else {
        user.activity.rank.recharge.value = value;
    }
    user.activity.rank.recharge.time = Date.now();
    user.activity.rank.recharge.stage = conf_mgr.gConfActivities["open_rank_recharge"].startTime;
    player.markDirty('activity.rank.recharge');

    var req = {
        uid: user._id,
        mod: 'user',
        act: 'update_user_rank_recharge',
        args: {
            data: {
                value: user.activity.rank.recharge.value,
                time: user.activity.rank.recharge.time
            }
        },
    }
    var resp = {};
    requestWorld(req, resp, function () { });
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () { });
}

function on_cost_mix_cash(player, cost_num) {
    if (!isActivityStart(player, 'open_rank_expense')) { return; }

    var user = player.user;

    var value = cost_num;
    user.activity = user.activity || {};
    user.activity.rank = user.activity.rank || {};
    user.activity.rank.expense = user.activity.rank.expense || {};
    if (user.activity.rank.expense.stage == conf_mgr.gConfActivities["open_rank_expense"].startTime) {
        user.activity.rank.expense.value = (user.activity.rank.expense.value || 0) + value;
    }
    else {
        user.activity.rank.expense.value = value;
    }
    user.activity.rank.expense.time = Date.now();
    user.activity.rank.expense.stage = conf_mgr.gConfActivities["open_rank_expense"].startTime;
    player.markDirty('activity.rank.expense');

    var req = {
        uid: user._id,
        mod: 'user',
        act: 'update_user_rank_expense',
        args: {
            data: {
                value: user.activity.rank.expense.value,
                time: user.activity.rank.expense.time,
            }
        },
    }
    var resp = {};
    requestWorld(req, resp, function () { });
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () { });
}

exports.init = function () {
    logic_event_mgr.on(logic_event_mgr.EVENT.ON_PAY, on_pay);
    logic_event_mgr.on(logic_event_mgr.EVENT.COST_MIX_CASH, on_cost_mix_cash);
}

function doPrayRecover(player) {
    var pray = player.user.activity.pray;
    var payRecoverCD = conf_mgr.gConfGlobal.avAlasdPrayOnlineTime * 60;
    var onlineTime = player.getOnlineTime();
    var recover = Math.floor((onlineTime - pray.time) / payRecoverCD);
    if (recover > 0 && pray.recover < conf_mgr.gConfGlobal.avAlasdPrayPrayNum) {
        var leftRecover = conf_mgr.gConfGlobal.avAlasdPrayPrayNum - pray.recover;
        if (recover > leftRecover) {
            recover = leftRecover;
        }

        pray.point += recover;
        pray.recover += recover;
        pray.time += recover * payRecoverCD;
        player.markDirty('activity.pray.point');
        player.markDirty('activity.pray.recover');
        player.markDirty('activity.pray.time');
    }
    return pray;
};