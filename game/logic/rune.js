
const util = require('util');
const clone = require('clone');
const CostLog = require('./cost_log.js');
const ResBack = require('./resback.js');
const Upgrade = require('./upgrade.js');
const loginCommon = require('./common.js');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const logic = require('../logic');
const hero = require('./hero.js');
const server = require('../../common/server.js');
const { user_snapshot_data } = require('../../common/common.js');
const { ServerName, LogType, OneDayTime, TEAM_NAME, SKY_TYPE_CONFIG, HeroPartCount } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');
const { forceSyncToWorld } = require('./common.js');
const { parseAwardsConfig, isModuleOpen_new, reformAwards, cloneHeroInitAttr } = require('../../common/global.js');


/** 探索任务 */
const act_name = "search_task";

/** 符文 */
function get_default_data() {
    return {
        /** 符文唯一id */
        // rid : {
        /** 符文id */
        //     id : 0,
        /** 符文等级 */
        //     level : 0,
        /** 基础属性id */
        //     base_attr : 0,
        /** 特殊属性数组 */
        //     attrs : [
        /** id,值,随机序号 */
        //         [id, value, seq],
        //     ],
        // }
    }
}

/** 服务器启动时 创建用户数据 player.js中会自动调用 */
exports.init_user_data = function (user) {
    user['bag'][act_name] = get_default_data();
};


function addRune(player, id, mod, act) {
    var rune = {
        'id': +id,
        'level': 0,
        'hid': 0,
    };

    var baseAttrId = common.randRange(1, 4);    // 随机基础属性
    rune.base_attr = baseAttrId;

    var runeConf = conf_mgr.gConfRuneConf[id];
    if (!runeConf) {
        ERROR('rune not found, id = ' + id);
        return 0;
    }

    rune.attrs = [];    // 随机特殊属性

    var numWeights = {};
    for (var i = 0; i < runeConf.attNumWeight.length; i++) {
        numWeights[i] = runeConf.attNumWeight[i];
    }

    var execpts = [];
    var specialAttNum = runeConf.attNum[common.wRand(numWeights)];
    for (var i = 0; i < specialAttNum; i++) {
        var attr = randRuneSpecialAtt(runeConf.attMode, execpts);
        rune.attrs.push(attr);
        execpts.push(attr[2])
    }

    var rid = player.nextId();
    player.user.bag.rune[rid] = rune;
    player.markDirty('bag.rune.' + rid);

    var args = {
        uid: player.uid,
        rid: rid,
        id: id,
        mod: mod,
        act: act,
    }

    server.addGameLog(LogType.LOG_RUNE_PRODUCE, args, null);

    return rid;
};

exports.changeRune = function (player, rid, hid) {
    var rune = player.user.bag.rune[rid];

    if (!rune) { return false; }

    if (hid < 0) { return false; }

    rune.hid = hid;
    player.markDirty('bag.rune.' + rid);
    return true;
};

/** 添加一个奖励 */
exports.addAward = function (player, addedAwards, awardType, awardId, awardNum, award, mod, act, notShow) {
    if (!player) { return addedAwards; }
    if (awardType != 'rune') { return addedAwards; }
    if (awardNum < 0) {
        var runeObj = player.user.bag.rune[awardId];
        if (runeObj) {
            var args = {
                uid: player.uid,
                rid: awardId,
                id: runeObj.id,
                level: runeObj.level,
                mod: mod,
                act: act,
            }

            server.addGameLog(LogType.LOG_RUNE_CONSUME, args, null);
        }

        delete player.user.bag.rune[awardId];
        player.markDelete("bag.rune." + awardId);
        award[1] = +award[1];
        addedAwards.push(award);
    } else {
        if (!conf_mgr.gConfRuneConf[awardId])
            return;

        for (var j = 0; j < awardNum; j++) {
            var rid = addRune(player, award[1], mod, act);
            if (rid > 0) {
                var rune = player.user.bag.rune[rid];
                addedAwards.push(['rune', rid, rune]);
            }
        }

        onRuneGetCallback(player, awardId, awardNum);
    }
    return addedAwards;
};

/** 符文获取回调 */
function onRuneGetCallback(player, id, num) {
    if (!player.user.runeGetRecord) {
        player.user.runeGetRecord = {};
        player.markDirty("runeGetRecord");
    }

    if (player.user.runeGetRecord[id] == null) {
        player.user.runeGetRecord[id] = 0;
    }

    player.user.runeGetRecord[id] += num;
    player.markDirty(util.format("runeGetRecord.%d", id));
};

/**
 * 该功能中对英雄的附加属性
 * @param {*} player    玩家信息
 * @param {*} hero      英雄信息
 * @param {*} team      所在队伍信息
 */
exports.hero_additional_attribute = function (player, hero, team) {
    if (!player) { return {} }
    var user = player.user;
    var attrArr = cloneHeroInitAttr();
    for (var i = 1; i <= 4; i++) {
        var runeSid = hero.rune_use[i - 1];
        if (runeSid > 0) {
            var runeObj = user.bag.rune[runeSid];
            var attrType = runeObj.base_attr;

            var conf = conf_mgr.gConfRuneBaseAttConf[runeObj.level];
            var runeConf = conf_mgr.gConfRuneConf[runeObj.id];
            var runeQuality = runeConf.quality;

            var attrMap = ['atk', 'def', 'magdef', 'hp'];
            var key1 = attrMap[attrType - 1] + runeQuality;
            var key2 = attrMap[attrType - 1] + '_p' + runeQuality;

            var baseValue = conf[key1];
            var basePer = conf[key2];

            attrArr[attrType] = attrArr[attrType] + baseValue;                // 符文固定加成
            attrArr[attrType] = attrArr[attrType] + Math.floor(baseAttrArr[attrType] * basePer / 10000);                // 符文万分比加成 
            for (j = 0; j <= 3; j++) {                    // 符文特殊属性加成
                if (!runeObj.attrs[j]) { continue; }

                var sType = runeObj.attrs[j][0];
                var sValue = runeObj.attrs[j][1];

                attrArr[sType] = attrArr[sType] + sValue;
            }
        }
    }

    return attrArr;
}