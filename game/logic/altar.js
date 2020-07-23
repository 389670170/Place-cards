
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { isModuleOpen_new } = require('../../common/global.js');

function getGemAwards(level) {
    var levels = Object.keys(conf_mgr.gConfAltarGem).sort(function (a, b) { return a - b; });
    var target = levels[levels.length - 1];
    for (var i = 0, len = levels.length; i < len; i++) {
        if (level < levels[i]) {
            target = levels[i - 1];
            break;
        }
    }

    var conf = conf_mgr.gConfAltarGem[target];
    var range = conf.range;
    var weights = {};
    for (var i = 0; i < range; i++) {
        weights[i] = conf['weight' + (i + 1)];
    }

    var gemLevel = +common.wRand(weights) + conf.min;
    var gemType = Math.floor(Math.random() * 4 + 1);
    return [['gem', gemType * 100 + gemLevel, +conf.count]];
}

// 战前检测
exports.up_altar_before = function (player, req, resp, onHandled) {
    var alterLv = player.user.altar_lv;
    do {

        var type = +req.args.type;

        if (isNaN(type)) {
            resp.code = 1; resp.desc = 'invalid type'; break;
        }

        if (!alterLv[type]) {
            alterLv[type] = 0;
        }

        var lv = alterLv[type];
        if (!conf_mgr.gConfExploreMagicAwardUp[type]) {
            resp.code = 1; resp.desc = 'invalid type 2'; break;
        }

        var conf = conf_mgr.gConfExploreMagicAwardUp[type][lv + 1];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid lv'; break;
        }

        // 战斗力是否足够
        if (player.user.status.level < conf.lvLimit) {
            resp.code = 1; resp.desc = 'invalid firght force'; break;
        }

    } while (false);

    onHandled();
}


// 战斗
exports.up_altar_lv = function (player, req, resp, onHandled) {
    var altarLv = player.user.altar_lv;
    do {
        var type = +req.args.type;
        var pass = +req.args.pass;

        if (isNaN(type)) {
            resp.code = 1; resp.desc = 'invalid type'; break;
        }

        if (!altarLv[type]) {
            altarLv[type] = 0;
        }

        var lv = altarLv[type];

        if (!conf_mgr.gConfExploreMagicAwardUp[type]) {
            resp.code = 1; resp.desc = 'invalid type 2'; break;
        }

        var conf = conf_mgr.gConfExploreMagicAwardUp[type][lv + 1];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid lv'; break;
        }

        // 战斗力是否足够
        if (player.user.status.level < conf.lvLimit) {
            resp.code = 1; resp.desc = 'invalid lv2'; break;
        }

        if (pass > 0) {
            altarLv[type]++;
        }

        player.markDirty('altar_lv.' + type);

    } while (false);

    resp.data.level = altarLv[type];
    onHandled();
}



exports.pray = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'altar')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var type = Math.floor(req.args.type);
        var conf = conf_mgr.gConfAltar[type];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid type'; break;
        }

        if (user.status.level < conf.limit) {
            resp.code = 1; resp.desc = 'level not reached'; break;
        }

        var altar = user.altar;
        if (!altar[type]) {
            altar[type] = 0;
            player.markDirty('altar.' + type);
        }

        var curCount = altar[type];
        if (curCount >= conf_mgr.gConfVip[user.status.vip]['altar' + type]) {
            resp.code = 1; resp.desc = 'pay time limit'; break;
        }
        curCount++;

        var costs = [];
        if (curCount > conf.free) {
            var cashCost = conf['cost' + Math.ceil(curCount / conf_mgr.gConfGlobal.altarRewardPrayCount)];
            if (!cashCost) {
                resp.code = 1; resp.desc = 'conf error'; break;
            }

            costs.push(['user', 'mixcash', -cashCost]);
            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = 'cost not enough'; break;
            }
        }

        // 等级倍率
        var award = null;

        if (!conf_mgr.gConfExploreMagicAwardUp[type]) {
            resp.code = 1; resp.desc = 'invalid type 2'; break;
        }


        var lv = 0;
        if (user.altar_lv[type]) {
            lv = user.altar_lv[type];
        }
        var awardConf = conf_mgr.gConfExploreMagicAwardUp[type][lv];
        if (!awardConf) {
            resp.code = 1; resp.desc = 'invalid lv'; break;
        }

        award = timeAwards(awardConf.award, conf_mgr.gConfLevel[user.status.level]['altar' + type] / 100);

        // 每达到一定次数后, 奖励翻N倍
        var awards = [];

        if (curCount % conf_mgr.gConfGlobal.altarRewardPrayCount == 0) {
            for (var i = 0; i < conf_mgr.gConfGlobal.altarRewardTime; i++) {
                awards.combine(award);
            }
        } else {
            awards = award;
        }

        altar[type] = curCount;
        player.markDirty('altar.' + type);

        if (type == 1) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'goldFete', 1);
        } else if (type == 2) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'foodFete', 1);
        } else if (type == 3) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'destinyFete', 1);
        } else if (type == 4) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'gemFete', 1);
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        var logConf = null;
        switch (type) {
            case 1: logConf = conf_mgr.gConfPlayLog['altar']['gold']; break;
            case 2: logConf = conf_mgr.gConfPlayLog['altar']['food']; break;
            case 3: logConf = conf_mgr.gConfPlayLog['altar']['destiny']; break;
            case 4: logConf = conf_mgr.gConfPlayLog['altar']['gem']; break;
            default: break;
        }

        if (logConf) {
            player.recordPlay(logConf.logType, logConf.logName);
        }
    } while (false);

    onHandled();
};

/*
exports.one_key = function(player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'altar')) {
            resp.code = 1; resp.desc = 'not open' ; break;
        }

        var type = req.args.type;
        var conf = conf_mgr.gConfAltar[type];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid type'; break;
        }

        if (user.status.level < conf.level) {
            resp.code = 1; resp.desc = 'level not reached'; break;
        }

        var altar = user.altar;
        if (!altar[type]) {
            altar[type] = 0;
            player.markDirty('altar.' + type);
        }

        var curCount = altar[type];
        var maxCount = conf_mgr.gConfVip[user.status.vip]['altar' + type];
        if (curCount >= maxCount) {
            resp.code = 1; resp.desc = 'pay time linit'; break;
        }

        var cashCost = 0;
        var awards = [];
        var remainCount = maxCount - curCount;
        for (var i = 0; i < remainCount && i < conf_mgr.gConfGlobal.altarRewardPrayCount; i++ ) {
            // 祈祷一次
            curCount++;
            if (curCount > conf.free) {
                cashCost += conf['cost' + Math.ceil(curCount /conf_mgr.gConfGlobal.altarRewardPrayCount)];
            }

            var award = [];
            if (conf.type == 'gem') {
                award = getGemAwards(user.status.level);
            } else {
                award = timeAwards(conf.award, conf_mgr.gConfLevel[user.status.level]['altar' + type] / 100);
            }

            if (curCount % conf_mgr.gConfGlobal.altarRewardPrayCount == 0) {
                for (var i = 0; i <conf_mgr.gConfGlobal.altarRewardTime; i++) {
                    awards.combine(award);
                }
            } else {
                awards.combine(award);
            }
        }

        if (!cashCost) {
            resp.code = 1; resp.desc = 'conf error' ; break;
        }

        var costs = [['user', 'mixcash', -cashCost]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cost not enough' ; break;
        }

        if (type == 1) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'goldFete', curCount - altar[type]);
        } else if (type == 2) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'foodFete', curCount - altar[type]);
        } else if (type == 3) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'destinyFete', curCount - altar[type]);
        } else if (type == 4) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'gemFete', curCount - altar[type]);
        }

        altar[type] = curCount;
        player.markDirty('altar.' + type);

        resp.data.awards = player.addAwards(awards,req.mod,req.act);
        resp.data.costs = player.addAwards(costs,req.mod,req.act);
    } while (false);

    onHandled();
};
*/