
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic = require('../logic');
const logic_event_mgr = require('./logic_event_mgr.js');
const auto_fight = require('./auto_fight.js');
const { parseAwardsConfig, isModuleOpen_new, reformAwards, cloneHeroInitAttr, calcFightForceNew } = require('../../common/global.js');
const { HeroPartCount } = require('../../common/enum.js');

exports.expand_hero_bag = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var buyCount = user.hero_bag.buy;
        //ERROR(user.hero_bag);
        var buyConf = conf_mgr.gConfBuy[buyCount + 1];
        if (!buyConf) {
            resp.code = 1; resp.desc = 'error hid'; break;
        }

        var costs = buyConf.heroNumBuyC;
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        user.hero_bag.buy += 1;

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        player.markDirty("hero_bag.buy");
    } while (false);

    onHandled();
};

/** 武将升级 */
exports.level_up = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.hid)) {
            resp.code = 1; resp.desc = 'error hid'; break;
        }

        var heroIndex = +req.args.hid;
        var heroObj = user.hero_bag.heros[heroIndex];
        if (!heroObj || !heroObj.rid) {                                                         // 没有卡槽或者卡槽上没有武将
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        var heroConf = conf_mgr.gConfHero[heroObj.rid];
        if (!heroConf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }

        var heroTemplateId = heroConf.heroTemplateId;                                           // hero模板id
        // if (heroObj.awake > 4) {
        //     heroTemplateId = heroConf.templatedIdUltimate;
        // }

        var rebornType = conf_mgr.gConfCombatHeroTemplate[heroTemplateId]['rebornType'];        // 模板類型
        var maxLevel = Math.max(conf_mgr.gConfReborn[rebornType][heroObj.tier+1]['roleLevelMax']);
        //, conf_mgr.gConfDestiny[heroObj.awake]['roleLevelMax']);

        var nextLevel = heroObj.level + 1;                                                      // 消耗材料
        if (nextLevel > maxLevel) {
            resp.code = 1; resp.desc = 'max'; break;
        }

        var costs = conf_mgr.gConfLevel[heroObj.level].roleUpGradeCost;
        if (!player.checkCosts(costs)) {                                                        // 材料不足
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        heroObj.level += 1;

        player.markDirty(util.format("hero_bag.heros.%d.level", heroIndex));

        player.markFightForceChanged(heroIndex);
       // player.doGuideTask('heroLvUp', 1);
    } while (false);

    onHandled();
};

exports.hero_wear = hero_wear;
/**
 * 英雄穿装备
 * @param {*} player        玩家信息
 * @param {*} hero          角色信息
 * @param {*} equip_list    穿戴的装备列表
 */
function hero_wear(player, hero, equip_list) {
    if (!hero || !equip_list || equip_list.length == 0) { return; }
    var tCostAwards = [];
    for (var i = 0; i < equip_list.length; i++) {
        var eid = equip_list[i];
        if (!eid) { continue; }
        if (!player.user.bag.equip[eid] || player.user.bag.equip[eid] <= 0) { continue; }       // 这种装备目前没有剩余的

        var type = conf_mgr.gConfEquip[eid].type;
        var oldEid = hero.equip[type];

        hero.equip[type] = eid;

        if (oldEid) {
            tCostAwards.push(["equip", oldEid, 0, +1]);                                             // 将英雄身上的旧装备放回去
        }
        else {
            player.memData.equip_num--
        }

        tCostAwards.push(["equip", eid, 0, -1]);                                                // 将背包中的装备放在英雄身上                  

        player.markDirty(`pos.${pos}.equip.${type}`);
    }
    player.addAwards(tCostAwards, "init_player", `lord_${i + 1}`);

    player.updateRoleEquipTalent(hero.bag_pos);
    player.markFightForceChanged(hero.bag_pos);
};

/** 穿装备 mod fish 1103 */
exports.wear = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var index = +req.args.hid;
        if (!user.hero_bag.heros[index] || !user.hero_bag.heros[index].rid) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        var eid = +req.args.eid;
        var equip = user.bag.equip[eid];
        if (!equip) {
            resp.code = 1; resp.desc = 'no equip'; break;
        }

        if (equip.hid) {
            resp.code = 1; resp.desc = 'has equip others'; break;
        }

        hero_wear(player, heroObj, [eid]);

        resp.data.talent = heroObj.talent;
    } while (false);

    onHandled();
};

/** 一键穿装备  -fish */
exports.wear_all = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var heroIndex = +req.args.hid;
        var heroObj = user.hero_bag.heros[heroIndex];
        if (!heroObj || !heroObj.rid) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        var eids = req.args.eids;
        if (!util.isArray(eids) || eids.length != 6) {
            resp.code = 1; resp.desc = 'invalid eids'; break;
        }

        var valid = true;
        for (var i = 0; i < HeroPartCount; i++) {
            if (eids[i] && !user.bag.equip[eids[i]]) {
                valid = false;
                break;
            }
        }

        if (!valid) {
            resp.code = 1; resp.desc = 'no equip'; break;
        }

        hero_wear(player, heroObj, eids);

        // for (var i = 0; i < HeroPartCount; i++) {
        //     var eid = +eids[i];
        //     if (!eid) {
        //         continue;
        //     }

        //     var equip = user.bag.equip[eid];
        //     var type = conf_mgr.gConfEquip[equip.id].type;
        //     var oldEid = heroObj.equip[type];

        //     // 脱掉老的，穿上新的
        //     if (oldEid) {
        //         var oldEquip = user.bag.equip[oldEid];
        //         if (oldEquip) {
        //             oldEquip.hid = 0;
        //         }

        //         player.markDirty(util.format('bag.equip.%d.hid', oldEid));
        //     } else {
        //         player.memData.equip_num--;
        //     }

        //     heroObj.equip[type] = eid;
        //     equip.hid = heroIndex;
        //     player.markDirty(util.format('hero_bag.heros.%d.equip.%d', heroIndex, type));
        //     player.markDirty(util.format('bag.equip.%d.hid', eid));

        // }

        // player.updateRoleEquipTalent(heroIndex)
        resp.data.talent = heroObj.talent;

        // player.doOpenSeven('equipNum');

        // player.doOpenHoliday('equipNum');
    } while (false);

    onHandled();
};

/** select equip talent  */
exports.select_talent = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var heroIndex = +req.args.hid;
        var level = +req.args.level; // 1-6
        var selectId = +req.args.id;    // 1-2

        var heroObj = user.hero_bag.heros[heroIndex];
        if (!heroObj || !heroObj.rid) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        if (isNaN(selectId) || (selectId != 2 && selectId != 1)) {
            resp.code = 1; resp.desc = 'no id'; break;
        }

        var heroType = conf_mgr.gConfHero[heroObj.rid]['soldierId'];
        var talentConf = conf_mgr.gConfEquipTalent[heroType][level];
        if (!talentConf) {
            resp.code = 1; resp.desc = 'no lv'; break;
        }

        var talent = heroObj.talent;
        if (talentConf.limit > talent.point) {
            resp.code = 1; resp.desc = 'no point'; break;
        }

        if (talent.tree[level - 1] != 0) {
            resp.code = 1; resp.desc = 'has light'; break;
        }

        talent.tree[level - 1] = +selectId;

        resp.data.talent = talent;
        player.markDirty(util.format('hero_bag.heros.%d.talent.tree', heroIndex));

    } while (false);

    onHandled();
};

exports.reset_talent = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var heroIndex = +req.args.hid;

        var heroObj = user.hero_bag.heros[heroIndex];
        if (!heroObj || !heroObj.rid) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        var costs = parseAwardsConfig(conf_mgr.gConfGlobal.equipTalantResetCost);        // 材料不足
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        var talent = heroObj.talent;

        talent.tree = [0, 0, 0, 0, 0, 0];

        resp.data.talent = talent;
        player.markDirty(util.format('hero_bag.heros.%d.talent.tree', heroIndex));

    } while (false);

    onHandled();
};

/** 比较两个装备的好坏，先比较品质，品级，然后精炼等级，再强化等级 */
function compareEquip(equipA, equipB) {
    var confA = conf_mgr.gConfEquip[equipA.id];
    var confB = conf_mgr.gConfEquip[equipB.id];
    if (confA.quality > confB.quality) {
        return true;
    } else if (confA.quality == confB.quality) {
        if (equipA.grade > equipB.grade) {
            return true;
        } else if (equipA.grade == equipB.grade) {
            if (equipA.refine_exp > equipB.refine_exp) {
                return true;
            } else if (equipA.refine_exp == equipB.refine_exp) {
                if (equipA.intensify > equipB.intensify) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}

/** 根据部位查找最好的装备,找到返回eid，没有返回0 */
function findBestEquip(player, pos) {
    var user = player.user;
    var bag = user.bag;
    var bestEquip = null;
    var bestEid = null;
    for (var eid in bag.equip) {
        var equipObj = bag.equip[eid];
        if (equipObj) {
            if (equipObj.pos > 0) {
                continue;
            }

            var equipConf = conf_mgr.gConfEquip[equipObj.id];
            if (!equipConf) {
                continue;
            }

            if (equipConf.type != pos) {
                continue;
            }

            if (!bestEquip) {
                bestEquip = equipObj;
                bestEid = eid;
            } else {
                if (compareEquip(equipObj, bestEquip)) {
                    bestEquip = equipObj;
                    bestEid = eid;
                }
            }
        }
    }

    return +bestEid;
}

/** 一键给所有英雄换装 */
exports.equip_all = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var changeEquipArr = {};
        var heros = user.hero_bag.heros;
        var team1 = user.team[1];
        for (var hid in team1) {
            var posObj = heros[hid];
            if (posObj.rid > 0) {
                for (var i = 1; i <= 6; i++) {
                    var existEid = posObj.equip[i];
                    var existEquipObj = user.bag.equip[existEid];
                    var bestEid = findBestEquip(player, i);
                    var bestEquip = user.bag.equip[bestEid];
                    if (existEquipObj && bestEquip) {
                        if (compareEquip(bestEquip, existEquipObj)) {
                            // 有更好的，要替换
                            existEquipObj.hid = 0;
                            player.markDirty(util.format('bag.equip.%d', existEid));

                            posObj.equip[i] = bestEid;
                            player.markDirty(util.format('hero_bag.heros.%d.equip', hid));

                            bestEquip.hid = parseInt(hid);
                            player.markDirty(util.format('bag.equip.%d', bestEid));

                            player.markFightForceChanged(pos);

                            var changeObj = {};
                            changeObj.eid = existEid;
                            changeObj.op = 0;               // 0表示脱下，1表示装备上
                            changeObj.hid = hid;     // 英雄id
                            changeObj.pos = i;              // 部位
                            changeEquipArr[existEid] = changeObj;

                            var changeObj2 = {};
                            changeObj2.eid = bestEid;
                            changeObj2.op = 1;   // 0表示脱下，1表示装备上
                            changeObj2.hid = hid; // 英雄id
                            changeObj2.pos = i;  // 部位
                            changeEquipArr[bestEid] = changeObj2;
                        }
                    } else {
                        if (bestEquip) {
                            // 原来是空的，直接装上
                            posObj.equip[i] = bestEid;
                            player.markDirty(util.format('hero_bag.heros.%d.equip', hid));
                            bestEquip.hid = parseInt(hid);
                            player.markDirty(util.format('bag.equip.%d', bestEid));

                            player.markFightForceChanged(pos);

                            var changeObj = {};
                            changeObj.eid = bestEid;
                            changeObj.op = 1;    // 0表示脱下，1表示装备上
                            changeObj.hid = hid; // 英雄id
                            changeObj.pos = i;   // 部位
                            changeEquipArr[bestEid] = changeObj;
                        }
                    }
                }
            }
        }

        resp.data.change_list = changeEquipArr;
    } while (false);

    onHandled();
};

/** 一键卸下所有装备 */
exports.take_off_all = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.hid)) {
            resp.code = 1;
            resp.desc = 'no valeid args';
            break;
        }

        var heroIndex = +req.args.hid;
        var heroObj = user.hero_bag.heros[heroIndex];

        if (!heroObj) {
            resp.code = 1;
            resp.desc = 'no hero , hid = ' + heroIndex;
            break;
        }

        for (var i = 1; i <= 6; i++) {
            var eid = heroObj.equip[i];
            var equip = user.bag.equip[eid];

            if (equip) {
                equip.hid = 0;
                player.markDirty(util.format('bag.equip.%d.hid', eid));
                player.memData.equip_num++;
            }

            heroObj.equip[i] = 0;
            player.markDirty(util.format('hero_bag.heros.%d.equip.%d', heroIndex, i));
        }

        player.updateRoleEquipTalent(heroIndex);

        resp.data.talent = heroObj.talent;

    } while (false);

    onHandled();
};

/** 卸载装备 */
exports.take_off = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.hid) || isNaN(req.args.type)) {
            resp.code = 1; resp.desc = 'no valeid args'; break;
        }

        var heroIndex = +req.args.hid;
        var type = +req.args.type;

        var heroObj = user.hero_bag.heros[heroIndex];

        if (!heroObj || !heroObj.equip[type]) {
            resp.code = 1; resp.desc = 'no equip'; break;
        }

        if (player.memData.equip_num >= user.equip_valume) {
            resp.code = 1; resp.desc = 'bag equip is full'; break;
        }

        var eid = heroObj.equip[type];
        var equip = user.bag.equip[eid]
        if (equip) {
            equip.hid = 0;
            player.markDirty(util.format('bag.equip.%d.hid', eid));
        }

        heroObj.equip[type] = 0;
        player.markDirty(util.format('hero_bag.heros.%d.equip.%d', heroIndex, type));

        player.updateRoleEquipTalent(heroIndex)
        resp.data.talent = heroObj.talent;

        player.memData.equip_num++;
    } while (false);

    onHandled();
};

/** 武将换将 */
exports.exchange = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pos = Math.floor(req.args.pos);
        var hid = Math.floor(req.args.hid);
        if (isNaN(pos) || isNaN(hid)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        if (pos == 1) {
            resp.code = 1; resp.desc = 'main role cannot change'; break;
        }

        if (!user.pos[pos] || !user.bag.card[hid]) {
            resp.code = 1; resp.desc = 'no the card'; break;
        }
        var repeat = false;
        var num = 0;
        for (var p in user.pos) {
            if (user.pos[p].hid) {
                if (user.pos[p].hid == hid) {
                    repeat = true; break;
                }
                num++;
            }
        }
        if (repeat) {
            resp.code = 1; resp.desc = 'repeat hid'; break;
        }

        var heroConf = conf_mgr.gConfHero[hid];        // 互斥检测
        if (!heroConf) {
            resp.code = 1; resp.desc = 'invalid hid'; break;
        }

        var mutexId = heroConf.mutexId;
        if (mutexId) {
            var mutex = false;
            for (var p in user.pos) {
                if (p == pos) {
                    continue;
                }
                var phid = user.pos[p].hid;
                if (phid) {
                    if (phid) {
                        var pConf = conf_mgr.gConfHero[phid];
                        if (pConf.mutexId && pConf.mutexId == mutexId) {
                            mutex = true; break;
                        }
                    }
                }
            }
            if (mutex) {
                resp.code = 1; resp.desc = 'mutex hid'; break;
            }
        }

        var oriHid = user.pos[pos].hid;
        var level = user.status.level;

        if (!oriHid && num >= conf_mgr.gConfLevel[level].heroNum) {
            resp.code = 1; resp.desc = 'full hero'; break;
        }

        if (!oriHid) {                                  // 如果是上阵新武将，那找到第一个空格子，不允许跳着上
            var firstEmpty = MaxPos;
            for (var i = 1; i <= MaxPos; i++) {
                if (user.pos[i].hid == 0 && i < firstEmpty) {
                    firstEmpty = i;
                }
            }

            pos = firstEmpty;
        }

        auto_fight.calcAutoFight(player);

        var awards = [];
        var costs = [];
        var promote = user.pos[pos].promote;
        if (oriHid) {
            if (conf_mgr.gConfHero[oriHid].camp == 5) {
                resp.code = 1; resp.desc = 'protagonist'; break;
            }

            var soldierId = conf_mgr.gConfHero[oriHid].soldierId;            // 小兵不同，返回小兵装备
            if (soldierId != conf_mgr.gConfHero[hid].soldierId) {
                var soldierLevel = user.pos[pos].soldier.level;
                var soldierStar = user.pos[pos].soldier.star;
                var confSoldierLevel = conf_mgr.gConfSoldierLevel[soldierId][soldierLevel][soldierStar];
                for (var slot in user.pos[pos].soldier.dress) {
                    if (user.pos[pos].soldier.dress[slot]) {
                        var dressId = confSoldierLevel["equipId" + slot];
                        var dressNum = confSoldierLevel["equipNum" + slot];
                        awards.push(['dress', dressId, dressNum]);
                        user.pos[pos].soldier.dress[slot] = 0;
                        player.markDirty(util.format('pos.%d.soldier.dress.%d', pos, slot));
                    }
                }
            }

            awards.push(["card", oriHid, 1]);

            for (var fateId in user.pos[pos].assist) {                // 助阵卡牌返还
                for (var i = 0, len = user.pos[pos].assist[fateId].length; i < len; i++) {
                    awards.push(['card', user.pos[pos].assist[fateId][i], 1]);
                }
                delete user.pos[pos].assist[fateId];
            }
            player.markDirty(util.format('pos.%d.assist', pos));

            var quality = user.pos[pos].quality;            // 武将品阶材料返还
            var costSum = 0;
            for (var i = 1; i < quality; i++) {
                costSum += conf_mgr.gConfHeroQuality[i].itemNum;
            }
            awards.push(['material', +conf_mgr.gConfGlobal.heroQualityCostItem, costSum]);
            user.pos[pos].quality = 1;
            player.markDirty(util.format('pos.%d.quality', pos));

            var returnCosts = [];            // 武将升阶材料返回
            if (promote.length) {
                var heroCombatConf = conf_mgr.getHeroCombatConf(oriHid);
                var professionType = heroCombatConf.professionType;
                var oriQuality = heroCombatConf.quality;
                var oriPromoteType = conf_mgr.gConfHeroChangeQuality[oriQuality].id;
                var minId = conf_mgr.gConfPromoteType[oriPromoteType][professionType * 100].id;
                var promoteType = promote[0];
                var promoteProgress = promote[1];
                var progress = promoteProgress + professionType * 100;
                if (conf_mgr.gConfPromoteType[promoteType] && conf_mgr.gConfPromoteType[promoteType][progress]) {
                    var maxId = conf_mgr.gConfPromoteType[promoteType][progress].id;
                    var returnCost = [];
                    if (maxId > minId) {
                        var costsId = minId + 1;
                        for (costsId; costsId <= maxId; costsId++) {
                            var promoteCosts = conf_mgr.gConfPromote[costsId].cost;
                            for (var i = 0; i < promoteCosts.length; i++) {
                                returnCosts.push(promoteCosts[i].slice());
                            }
                        }
                    }

                    for (var i = 0; i < returnCosts.length; i++) {
                        var cost = returnCosts[i];
                        cost[cost.length - 1] = -cost[cost.length - 1];
                    }
                    awards = awards.concat(returnCosts);
                }
            }

            var heroCombatConf = conf_mgr.getHeroCombatConf(hid);            //升阶信息初始化
            user.pos[pos].promote = [];
            player.markDirty(util.format('pos.%d.promote', pos));
        } else {            // 新武将的阵容位置
            var slots = SlotArray.slice();
            for (var i = 1; i <= MaxPos; i++) {
                if (user.pos[i].hid) {
                    slots.remove(user.pos[i].slot);
                }
            }
            user.pos[pos].slot = slots[0];
            player.markDirty(util.format("pos.%d.slot", pos));

            slots = SlotArray.slice();
            for (var i = 1; i <= MaxPos; i++) {
                var slot = user.def_info.team[i];
                if (slot) {
                    slots.remove(+slot);
                }
            }
            user.def_info.team[pos] = slots[0];
            player.markDirty('def_info.team.' + pos);

            player.memData.pos_count++;
        }

        costs.push(["card", hid, -1]);
        user.pos[pos].hid = hid;
        player.markDirty(util.format("pos.%d.hid", pos));

        var talent = user.pos[pos].talent;        // 突破武将需要返回突破材料
        if (talent) {
            var heroCombatConf = conf_mgr.getHeroCombatConf(oriHid);
            var type = heroCombatConf.rebornType;
            var rcosts = [];
            while (talent > 0) {
                var rebornCosts = conf_mgr.gConfReborn[type][talent].cost;
                for (var i = 0; i < rebornCosts.length; i++) {
                    rcosts.push(rebornCosts[i].slice());
                }
                var cardCost = conf_mgr.gConfReborn[type][talent].cardCost;
                if (cardCost) {
                    rcosts.push(['card', oriHid, -cardCost]);
                }

                var fragmentCost = conf_mgr.gConfReborn[type][talent].fragmentCost;
                if (fragmentCost) {
                    rcosts.push(['fragment', oriHid, -fragmentCost]);
                }
                talent--;
            }

            for (var i = 0; i < rcosts.length; i++) {
                var cost = rcosts[i];
                cost[cost.length - 1] = -cost[cost.length - 1];
            }
            awards = awards.concat(rcosts);

            user.pos[pos].talent = 0;
            player.markDirty(util.format("pos.%d.talent", pos));

        }
        awards = reformAwards(awards);
        resp.data.pos = pos;
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);

        for (var pos in user.pos) {
            if (user.pos[pos].hid) {
                player.markFightForceChanged(pos);
            }
        }
    } while (false);

    if (onHandled) {
        onHandled();
    }
};

/** 觉醒 */
exports.upgrade_awake = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'destiny')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var heroIndex = Math.floor(req.args.hid);
        if (isNaN(heroIndex)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        var myHeros = user.hero_bag.heros;
        var heroObj = myHeros[heroIndex];
        if (!heroObj || !heroObj.rid) {
            resp.code = 1; resp.desc = 'error pos'; break;
        }

        var awakeLevel = heroObj.awake;
        if (heroObj.tier != 10) {
            resp.code = 1; resp.desc = 'not max tier'; break;
        }

        if (!conf_mgr.gConfDestiny[awakeLevel + 1]) {
            resp.code = 1; resp.desc = 'max level'; break;
        }

        ERROR('heroIndex = ' + heroIndex);

        var confDestiny = conf_mgr.gConfDestiny[awakeLevel];
        var errorType = 0;

        var heroCosts = req.args.cost_heros;
        if (typeof (heroCosts) != 'object') {
            resp.code = 1; resp.desc = 'cost args error'; break;
        }

        var errorType = 0;
        var trueCostHeros = [];
        for (var type in heroCosts) {
            var selectHeros = heroCosts[type];
            if (!util.isArray(selectHeros)) {
                errorType = 1;
                break;
            }

            var cosArry = confDestiny['costHero' + type];
            if (heroIndex == 1) {
                cosArry = confDestiny['nanCostHero' + type];
            }

            if (!util.isArray(cosArry) || cosArry.length != 3) {
                continue;
            }

            var conType = cosArry[0];
            var starOrId = cosArry[1];
            var num = cosArry[2];
            var ownNum = 0;
            for (var i = selectHeros.length - 1; i >= 0; i--) {
                var shid = selectHeros[i];
                var theHero = myHeros[shid];
                if (trueCostHeros.indexOf(shid) >= 0) {
                    errorType = 2000;
                    break;
                }

                trueCostHeros.push(shid);

                if (!theHero || !theHero.rid || player.getRoleTeamPos(shid)) {
                    errorType = 2;
                    break;
                }

                if (shid == heroIndex) {
                    errorType = 4;
                    break;
                }

                if (conType == 1) {
                    if (theHero.rid == starOrId) {
                        ownNum += 1;
                    }
                } else if (conType == 2) {
                    var heroConf = conf_mgr.gConfHero[theHero.rid];
                    if (!heroConf) {
                        errorType = 3;
                        break;
                    }

                    var heroTemplateId = heroConf.heroTemplateId;     // hero模板id
                    if (theHero.awake > 4) {
                        heroTemplateId = heroConf.templatedIdUltimate;
                    }
                    var starBase = conf_mgr.gConfCombatHeroTemplate[heroTemplateId]['starBase'];                    // 模板類型
                    if (starBase + theHero.awake - 1 == starOrId) {
                        ownNum += 1;
                    }
                } else if (conType == 3) {
                    var selfCostId = conf_mgr.gConfHero[heroObj.rid]['selfCostId'];
                    if (selfCostId == theHero.rid) {
                        ownNum += 1;
                    }
                }
            }

            if (ownNum != num) {
                errorType = 1000;
                break;
            }
        }

        if (errorType != 0) {
            resp.code = 1; resp.desc = 'eror ' + errorType; break;
        }

        if (!player.checkCosts(confDestiny.cost)) {            // costs make
            resp.code = 1; resp.desc = 'something not enough'; break;
        }

        var heroBack = player.deleteHeros(trueCostHeros);

        heroObj.awake = awakeLevel + 1;
        player.markDirty(util.format("hero_bag.heros.%d.awake", heroIndex));

        var star = conf_mgr.getHeroStar(heroObj);
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, player, 'roleQuality', 1, star);
        player.doOpenSeven('roleQuality', 1, star);
        player.doOpenHoliday('roleQuality', 1, star);

        resp.data.awake = heroObj.awake;
        resp.data.costs = player.addAwards(confDestiny.cost, req.mod, req.act);
        resp.data.awards = player.addAwards(heroBack, req.mod, req.act);
    } while (false);

    onHandled();
};

/** 突破 1109 mod by fish */
exports.upgrade_tier = function (player, req, resp, onHandled) {
    var user = player.user;
    do {

        var heroIndex = Math.floor(req.args.hid);
        if (!user.hero_bag.heros[heroIndex] || !user.hero_bag.heros[heroIndex].rid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var heroObj = user.hero_bag.heros[heroIndex];
        var heroConf = conf_mgr.gConfHero[heroObj.rid];
        if (!heroConf) {
            resp.code = 1; resp.desc = 'no conf'; break;
        }
        var heroTemplateId = heroConf.heroTemplateId;     // hero模板id
        if (heroObj.awake > 4) {
            heroTemplateId = heroConf.templatedIdUltimate;
        }

        var rebornType = conf_mgr.gConfCombatHeroTemplate[heroTemplateId]['rebornType'];        // 模板類型

        var minLevel = +conf_mgr.gConfReborn[rebornType][heroObj.tier]['roleLevelMax'];
        if (minLevel != heroObj.level) {
            resp.code = 1; resp.desc = 'level is not reach'; break;
        }

        var mxTier = +conf_mgr.gConfReborn[rebornType][heroObj.tier]['tierMax'];
        if (heroObj.tier + 1 > mxTier) {
            resp.code = 1; resp.desc = 'tier is max'; break;
        }

        var costs = conf_mgr.gConfReborn[rebornType][heroObj.tier + 1]['cost'];        // 消耗材料
        if (!costs) {
            resp.code = 1; resp.desc = 'cost error'; break;
        }

        if (!player.checkCosts(costs)) {            // 材料不足
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        heroObj.tier += 1;

        player.markDirty(util.format("hero_bag.heros.%d.tier", heroIndex));
        resp.data.tier = heroObj.tier;

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, player, 'roleReborn', 1, heroObj.tier, heroObj.tier - 1);
        player.doOpenSeven('roleReborn', 1, heroObj.tier, heroObj.tier - 1);
        player.doOpenHoliday('roleReborn', 1, heroObj.tier, heroObj.tier - 1);

        player.memData.ffchanged = 1;
        player.markFightForceChanged(heroIndex);
        player.doGuideTask('reborn', 1);        // 引导任务
    } while (false);

    onHandled();
};

/** 小兵穿装备 */
exports.dress_wear = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pos = req.args.pos;
        var posObj = user.pos[pos];
        if (!posObj || !posObj.hid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var slot = req.args.slot;
        var soldierLevel = posObj.soldier.level;
        var soldierStar = posObj.soldier.star;
        var soldierId = conf_mgr.gConfHero[posObj.hid].soldierId;

        var confSoldierLevel = conf_mgr.gConfSoldierLevel[soldierId][soldierLevel][soldierStar];
        var equipId = confSoldierLevel['equipId' + slot];
        if (!equipId) {
            resp.code = 1; resp.desc = 'slot error'; break;
        }

        var posLevel = confSoldierLevel['poslevel' + slot];
        if (conf_mgr.gConfHero[posObj.hid].camp == 5) {
            if (user.status.level < posLevel) {
                resp.code = 1; resp.desc = 'low level'; break;
            }
        } else if (posObj.level < posLevel) {
            resp.code = 1; resp.desc = 'low level'; break;
        }

        if (posObj.soldier.dress[slot]) {
            resp.code = 1; resp.desc = 'has dressed'; break;
        }

        var costs = [['dress', equipId, -confSoldierLevel['equipNum' + slot]]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'dress not enough'; break;
        }

        posObj.soldier.dress[slot] = 1;
        player.markDirty(util.format('pos.%d.soldier.dress.%d', pos, slot));

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        player.markFightForceChanged(pos);
    } while (false);

    onHandled();
};

/** 小兵一键穿装备 */
exports.dress_wear_all = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pos = req.args.pos;
        var posObj = user.pos[pos];
        if (!posObj || !posObj.hid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var full = true;
        for (var slot = 1; slot <= SoldierEquipCount; slot++) {
            if (!posObj.soldier.dress[slot]) {
                full = false; break;
            }
        }
        if (full) {
            resp.code = 1; resp.desc = 'dress full'; break;
        }

        var costs = [];
        var confSoldierLevel = conf_mgr.gConfSoldierLevel[conf_mgr.gConfHero[posObj.hid].soldierId][posObj.soldier.level][posObj.soldier.star];
        for (var slot = 1; slot <= SoldierEquipCount; slot++) {
            if (posObj.soldier.dress[slot]) {
                continue;
            }
            var equipId = confSoldierLevel['equipId' + slot];
            if (!equipId) {
                continue;
            }

            var posLevel = confSoldierLevel['poslevel' + slot];
            if (conf_mgr.gConfHero[posObj.hid].camp == 5) {
                if (user.status.level < posLevel) {
                    continue;
                }
            } else if (posObj.level < posLevel) {
                continue;
            }

            var cost = [['dress', equipId, -confSoldierLevel['equipNum' + slot]]];
            if (!player.checkCosts(cost)) {
                continue;
            }

            costs = costs.concat(cost);

            posObj.soldier.dress[slot] = 1;
            player.markDirty(util.format('pos.%d.soldier.dress.%d', pos, slot));
        }

        if (costs.length > 0) {
            player.markFightForceChanged(pos);
            resp.data.costs = player.addAwards(costs, req.mod, req.act);
        }
    } while (false);

    onHandled();
};

/** 小兵升阶 */
exports.upgrade_soldier = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pos = Math.floor(+req.args.pos);
        if (!user.pos[pos] || !user.pos[pos].hid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var posObj = user.pos[pos];
        var soldierLevel = posObj.soldier.level;
        var soldierStar = posObj.soldier.star;
        var soldierId = conf_mgr.gConfHero[posObj.hid].soldierId;
        var confSoldierLevel = conf_mgr.gConfSoldierLevel[soldierId][soldierLevel][soldierStar];

        if (!conf_mgr.gConfSoldierLevel[soldierId][soldierLevel + 1]) {
            resp.code = 1; resp.desc = 'max level'; break;
        }

        if (posObj.soldier.star < SoldierStarCount) {            // 判断是否5星了
            resp.code = 1; resp.desc = 'star not enough'; break;
        }

        var costs = confSoldierLevel.cost;
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cost not enough'; break;
        }

        posObj.soldier.level = soldierLevel + 1;
        posObj.soldier.star = 0;

        if (soldierLevel + 1 >= 6) {            // 广播小兵升阶信息
            var array = [];
            var userName = user.info.un;
            var heroHid = posObj.hid;
            array[0] = userName;
            array[1] = heroHid;
            array[2] = soldierLevel + 1;
            if (userName == null) {
                array[0] = '';
            }

            pushSysMsg('updateSoldier', array);
        }

        player.markDirty(util.format('pos.%d.soldier', pos));
        player.markFightForceChanged(pos);
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, player, 'soldierLevel', 1, soldierLevel + 1, soldierLevel);
        player.doOpenSeven('soldierLevel', 1, soldierLevel + 1, soldierLevel);
        player.doOpenHoliday('soldierLevel', 1, soldierLevel + 1, soldierLevel);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

/** 小兵升星 */
exports.upgrade_soldier_star = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pos = Math.floor(+req.args.pos);
        if (!user.pos[pos] || !user.pos[pos].hid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var posObj = user.pos[pos];        // 检测是否已经到最大星级
        if (posObj.soldier.star >= SoldierStarCount) {
            resp.code = 1; resp.desc = 'max star'; break;
        }

        var soldierId = conf_mgr.gConfHero[posObj.hid].soldierId;        // 检查装备是否穿满
        var soldierLevel = posObj.soldier.level;
        var soldierStar = posObj.soldier.star;
        var confSoldierLevel = conf_mgr.gConfSoldierLevel[soldierId][soldierLevel][soldierStar];
        var full = true;
        for (var slot = 1; slot <= SoldierEquipCount; slot++) {
            if (!posObj.soldier.dress[slot] && confSoldierLevel['equipId' + slot] > 0) {
                full = false; break;
            }
        }
        if (!full) {
            resp.code = 1; resp.desc = 'dress not full'; break;
        }

        posObj.soldier.star++;
        posObj.soldier.dress = {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
        };

        player.markDirty(util.format('pos.%d.soldier', pos));
        player.markFightForceChanged(pos);
    } while (false);

    onHandled();
};

/** 武将进阶 */
exports.promote = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'promote')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var pos = Math.floor(+req.args.pos);
        if (isNaN(pos)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        var hid = user.pos[pos].hid;
        var heroConf = conf_mgr.gConfHero[hid];
        var professionType = heroConf.professionType;
        if (pos == 1 || !user.pos[pos] || !hid || !heroConf || !professionType) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var heroPromote = user.pos[pos].promote;
        if (heroPromote.length == 0) {
            resp.code = 1; resp.desc = 'can not promote'; break;
        }

        var promoteType = heroPromote[0];
        var promoteNum = heroPromote[1];
        var progress = promoteNum + professionType * 100;
        var progressConf = conf_mgr.gConfPromoteProgress;
        var progressId = conf_mgr.gConfPromoteType[promoteType][progress].id;
        if (!conf_mgr.gConfPromote[progressId + 1]) {
            resp.code = 1; resp.desc = 'reached the highest promote'; break;
        }

        if (!progressConf[progress + 1]) {
            var costsProgress = professionType * 100;
            var costs = conf_mgr.gConfPromoteType[promoteType + 1][costsProgress].cost;
        } else {
            var costsProgress = progress + 1;
            var costs = conf_mgr.gConfPromoteType[promoteType][costsProgress].cost;
        }

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        if (!progressConf[progress + 1]) {
            heroPromote[0] = parseInt(promoteType) + 1;
            heroPromote[1] = 0;
            player.markDirty(util.format('pos.%d.promote', pos));

            if (heroPromote[0] == conf_mgr.gConfHeroChangeKey['red'].id || heroPromote[0] == conf_mgr.gConfHeroChangeKey['gold'].id) {                // 封将广播
                var array = [];
                var userName = user.info.un;
                var heroHid = user.pos[pos].hid;
                array[0] = userName;
                array[1] = heroHid;
                if (userName == null) {
                    array[0] = '';
                }

                if (heroPromote[0] == conf_mgr.gConfHeroChangeKey['red'].id) {
                    pushSysMsg('updatePromoteRed', array);
                } else {
                    pushSysMsg('updatePromoteGold', array);
                }
            }
        } else {
            var promotedProgress = heroPromote[1] + 1;
            heroPromote[1] = promotedProgress;
            player.markDirty(util.format('pos.%d.promote', pos));
        }


        player.markFightForceChanged(pos);
        resp.data.promote = heroPromote;
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

/** 卡牌分解  --现在还需要嘛 */
exports.resolve_hero = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var selectHeros = req.args.hids;
        var trueCostHeros = [];
        if (!util.isArray(selectHeros) || selectHeros.indexOf(1) >= 0) {
            resp.code = 1; resp.desc = 'args error'; break;
        }
        var myHeros = user.hero_bag.heros;
        var errorType = 0;
        for (var i = selectHeros.length - 1; i >= 0; i--) {
            var shid = selectHeros[i];
            var theHero = myHeros[shid];
            if (trueCostHeros.indexOf(shid) >= 0) {
                errorType = 10;
                break;
            }

            if (!theHero || !theHero.rid || player.getRoleTeamPos(shid)) {
                errorType = 2;
                break;
            }
            trueCostHeros.push(shid);
        }
        if (errorType > 0) {
            resp.code = 1; resp.desc = 'args error' + errorType; break;
        }

        var heroBack = player.deleteHeros(trueCostHeros, true);
        resp.data.awards = player.addAwards(heroBack, req.mod, req.act);
        resp.data.clear_equips = [];
        resp.data.hids = trueCostHeros;

    } while (false);

    onHandled();
};

/** 根据品质获取卡牌id和数量 */
function getCardByQuality(user, quality) {
    var ret = {};
    for (var cid in user.bag.card) {
        var heroCombatConf = conf_mgr.getHeroCombatConf(cid);
        var result = (quality & (1 << (heroCombatConf.quality - 1)));
        if (result == 0) {
            continue;
        }
        if (cid == 10000) {
            continue;
        }
        var num = user.bag.card[cid];
        ret[cid] = num;
    }

    return ret;
}

exports.get_train = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'train')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        resp.data.train = user.train;
    } while (false);

    onHandled();
};

exports.train = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'train')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var pos = +req.args.pos;
        var slot = +req.args.slot;
        if (!user.pos[pos] || !user.train[slot]) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var openLevel = conf_mgr.gConfTraining[slot].level;
        var openVip = conf_mgr.gConfTraining[slot].vip;

        if (!user.train[slot][2]) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        if (user.status.level < openLevel && user.status.vip < openVip) {
            resp.code = 1; resp.desc = 'user level or vip not reach'; break;
        }

        var repeat = false;
        var now = common.getTime();
        for (var trainId in user.train) {
            if (pos == user.train[trainId][0] && user.train[trainId][1] > now) {
                repeat = true; break;
            }
        }
        if (repeat) {
            resp.code = 1; resp.desc = 'repeat'; break;
        }

        var posObj = user.pos[pos];
        if (!posObj.hid) {
            resp.code = 1; resp.desc = 'no hero at pos'; break;
        }

        if (user.train[slot][1] > now) {
            resp.code = 1; resp.desc = 'slot is colding'; break;
        }

        var gainXp = conf_mgr.gConfLevel[user.status.level].trainExp;

        user.train[slot][0] = pos;
        user.train[slot][1] = now + (+conf_mgr.gConfTraining[slot].cd * 60);
        player.markDirty('train.' + slot);

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'trainRole', 1);

        resp.data.cold_time = user.train[slot][1];
        resp.data.xp = posObj.xp;
        resp.data.level = posObj.level;

    } while (false);

    onHandled();
};

exports.train_accelerate = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'train')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        if (!conf_mgr.gConfTraining[req.args.slot]) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        var slot = +req.args.slot;
        var endTime = user.train[slot][1];
        var now = common.getTime();
        if (endTime <= now) {
            resp.code = 1; resp.desc = 'has cold'; break;
        }

        var hours = Math.ceil((endTime - now) / 3600);
        var cashCost = conf_mgr.gConfTraining[slot].need * hours;
        var costs = [['user', 'cash', -cashCost]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough cash'; break;
        }

        user.train[slot][0] = 0;
        user.train[slot][1] = 0;
        player.markDirty('train.' + slot);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.train_accelerate_all = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'train')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var now = common.getTime();
        var cashCost = 0;
        for (var slot in user.train) {
            var endTime = user.train[slot][1];
            if (endTime > now) {
                var hours = Math.ceil((endTime - now) / 3600);
                cashCost += conf_mgr.gConfTraining[slot].need * hours;
            }
        }

        if (!cashCost) {
            resp.code = 1; resp.desc = 'no need accelerate'; break;
        }

        var costs = [['user', 'cash', -cashCost]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough cash'; break;
        }

        for (var slot in user.train) {
            if (user.train[slot][1] > now) {
                user.train[slot][0] = 0;
                user.train[slot][1] = 0;
                player.markDirty('train.' + slot);
            }
        }
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.assist = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pos = req.args.pos;
        var posObj = user.pos[pos];
        if (!posObj || !posObj.hid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var cid = +req.args.cid;
        var costs = [['card', cid, -1]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'no the card'; break;
        }

        var inSlot = false;
        for (var p in user.pos) {
            if (user.pos[p].hid == cid) {
                inSlot = true;
                break;
            }
        }
        if (inSlot) {
            resp.code = 1; resp.desc = 'is on'; break;
        }

        var fid = +req.args.fid;
        var heroCombatConf = conf_mgr.getHeroCombatConf(posObj.hid);
        if (heroCombatConf.fateGroup.indexOf(fid) == -1) {
            resp.code = 1; resp.desc = 'no the fate'; break;
        }

        var confFate = conf_mgr.gConfFate[fid];
        var valid = false;
        for (var i = 1; i <= 5; i++) {
            if (confFate['hid' + i] == cid) {
                valid = true;
                break;
            }
        }
        if (!valid) {
            resp.code = 1; resp.desc = 'cid not in fate'; break;
        }

        if (!posObj.assist[fid]) {
            posObj.assist[fid] = [];
        }
        if (posObj.assist[fid].indexOf(cid) >= 0) {
            resp.code = 1; resp.desc = 'has assisted'; break;
        }

        posObj.assist[fid].push(cid);
        player.markDirty(util.format('pos.%d.assist.%d', pos, fid));

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.unassist = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!user.pos[req.args.pos] || !req.args.cid || !req.args.fid) {
            resp.code = 1; resp.desc = 'args error'; break;
        }
        var pos = req.args.pos;
        var cid = +req.args.cid;
        var fid = +req.args.fid;
        var posObj = user.pos[pos];
        if (!posObj.hid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        if (!posObj.assist[fid] || !posObj.assist[fid].indexOf(cid) < 0) {
            resp.code = 1; resp.desc = 'no such assist'; break;
        }

        posObj.assist[fid].remove(cid);
        if (posObj.assist[fid].length > 0) {
            player.markDirty(util.format('pos.%d.assist.%d', pos, fid));
        } else {
            player.markDelete(util.format('pos.%d.assist.%d', pos, fid));
        }

        player.markFightForceChanged(pos);
        resp.data.awards = player.addAwards([['card', cid, 1]], req.mod, req.act);
    } while (false);

    onHandled();
};

/** 武将升品质 */
exports.upgrade_heroquality = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var pos = req.args.pos;
        var posObj = user.pos[pos];
        if (!posObj || !posObj.hid) {
            resp.code = 1; resp.desc = 'pos error'; break;
        }

        var upgrade = Math.floor(req.args.upgrade);
        if (!upgrade || upgrade < 1) {
            resp.code = 1; resp.desc = 'upgrade error'; break;
        }

        if (upgrade > 1 && !isModuleOpen_new(player, 'autoupgrade')) {
            resp.code = 1; resp.desc = 'autoupgrade is not open'; break;
        }

        var qualityLevel = posObj.quality || 1; // 品质等级
        if (!conf_mgr.gConfHeroQuality[qualityLevel + upgrade]) {
            resp.code = 1; resp.desc = 'over max upgrade'; break;
        }

        var qualityConf = conf_mgr.gConfHeroQuality[qualityLevel + upgrade - 1];        // 武将等级不满足
        if (pos == 1) {
            if (user.status.level < qualityConf.conditionHeroLevel) {
                resp.code = 1; resp.desc = 'hero level not fit'; break;
            }
        } else {
            if (posObj.level < qualityConf.conditionHeroLevel) {
                resp.code = 1; resp.desc = 'hero level not fit'; break;
            }
        }
        if (posObj.talent < qualityConf.conditionHeroTalent) {            // 突破等级不满足
            resp.code = 1; resp.desc = 'hero talent not fit'; break;
        }
        if (posObj.soldier.level < qualityConf.conditionHeroSoldier) {            // 小兵等级不满足
            resp.code = 1; resp.desc = 'hero soldier not fit'; break;
        }

        var matId = +conf_mgr.gConfGlobal.heroQualityCostItem;        // 检查资源是否足够
        var matNum = 0;
        var materialConf = conf_mgr.gConfItem[matId];
        if (!materialConf) {
            resp.code = 1; resp.desc = 'mid type error'; break;
        }

        for (var i = 0; i < upgrade; i++) {
            matNum += conf_mgr.gConfHeroQuality[qualityLevel + i].itemNum;
        }
        var costs = [['material', matId, -matNum]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        posObj.quality = qualityLevel + upgrade;        // 提升武将品质
        player.markDirty(util.format('pos.%d.quality', pos));
        player.markFightForceChanged(pos);

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.quality = posObj.quality;

        outline_sync_to_client(player);        // 在线奖励通知

    } while (false);

    onHandled();
};

/** 兑换英雄卡片 */
exports.exchange_card = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var heroIndex = req.args.hid;   // 源卡牌id
        var myHeros = user.hero_bag.heros;         // 兑换的数量
        var destCardId = req.args.dest; // 目标卡牌id

        var theHero = myHeros[heroIndex];
        if (!theHero || player.getRoleTeamPos(heroIndex)) {
            resp.code = 1; resp.desc = 'in team'; break;
        }

        var heroConf = conf_mgr.gConfHero[theHero.rid];
        if (!heroConf) {
            resp.code = 1; resp.desc = 'in team'; break;
        }

        var heroTemplateId = heroConf.heroTemplateId;     // hero模板id
        if (theHero.awake > 4) {
            heroTemplateId = heroConf.templatedIdUltimate;
        }
        var starBase = conf_mgr.gConfCombatHeroTemplate[heroTemplateId]['starBase'];        // 模板類型
        var star = starBase + theHero.awake - 1;
        if (star != 4 && star != 5) {
            resp.code = 1; resp.desc = 'star error'; break;
        }

        var randomSets = conf_mgr.gConfHeroPermute[star];
        var weights = {};
        for (var id in randomSets) {
            if (randomSets[id].weight && theHero.rid != randomSets[id].Award[0][1]) {
                var limit = randomSets[id].limit.split('.');
                if (limit[0] == 'gameday') {                    // 开服天数检测
                    var days = +limit[1];
                    var open = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime));
                    if (open + 1 >= days) {
                        weights[id] = randomSets[id].weight;
                    }
                }
            }
        }

        //ERROR(weights);
        var getCid = +common.wRand(weights);
        //ERROR('============'+getCid);

        var getRid = randomSets[getCid].Award[0][1];
        var destConf = conf_mgr.gConfHero[getRid];
        if (!destConf) {
            resp.code = 1; resp.desc = 'hero conf not found'; break;
        }

        var remainMixCash = user.status.bindcash + user.status.cash;
        var remainWand = user.status.wand;

        var needMixCash = 0;
        var needWand = 0;

        var otherCosts = parseAwardsConfig(conf_mgr.gConfGlobal['permuteHeroExpend' + star]);
        for (var i = 0; i < otherCosts.length; i++) {
            if (otherCosts[i][1] == 'wand') {
                needWand = Math.abs(parseInt(otherCosts[i][2]));
            } else if (otherCosts[i][1] == 'mixcash') {
                needMixCash = Math.abs(parseInt(otherCosts[i][2]));
            }
        }

        var costEnough = true;
        var resCosts = [];
        if (needWand > 0 && remainWand >= needWand) {
            resCosts.push(['user', 'wand', -needWand]);
        } else if (needMixCash > 0 && remainMixCash >= needMixCash) {
            resCosts.push(['user', 'mixcash', -needMixCash]);
        }

        // 检查其他货币资源消耗
        if (!player.checkCosts(resCosts)) {
            resp.code = 1; resp.desc = 'cost not enough'; break;
        }

        theHero.rid = +getRid;
        player.markDirty(util.format("hero_bag.heros.%d.rid", heroIndex));

        resp.data.costs = player.addAwards(resCosts, req.mod, req.act);
        resp.data.new_rid = +getRid;
    } while (false);

    onHandled();
};

/** 英雄卡片合成 fish */
exports.hero_evolution = function (player, req, resp, onHandled) {
    var user = player.user;
    var id = +req.args.id;          // 合成的序号
    var mHid = +req.args.main_hid;    // zhu

    // 额外所需要的卡片
    // 獲取主英雄，消耗英雄
    do {
        if (!isModuleOpen_new(player, 'evolution')) {            // 模塊是否開啓
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var conf = conf_mgr.gConfHeroEvolution[id];
        if (!conf) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var myHeros = user.hero_bag.heros;
        if (!myHeros[mHid] || myHeros[mHid].rid != conf['mainHero']) {
            resp.code = 1; resp.desc = 'main id'; break;
        }

        var heroCosts = req.args.cost_heros;
        if (typeof (heroCosts) != 'object') {
            resp.code = 1; resp.desc = 'cost args error'; break;
        }

        var errorType = 0;
        var trueCostHeros = [];
        for (var type in heroCosts) {
            var selectHeros = heroCosts[type];
            if (!util.isArray(selectHeros)) {
                errorType = 1;
                break;
            }

            var cosArry = conf['cost' + type];
            if (!util.isArray(cosArry) || cosArry.length != 3) {
                continue;
            }

            var conType = cosArry[0];
            var starOrId = cosArry[1];
            var num = cosArry[2];
            var ownNum = 0;
            for (var i = selectHeros.length - 1; i >= 0; i--) {
                var shid = selectHeros[i];
                var theHero = myHeros[shid];
                if (trueCostHeros.indexOf(shid) >= 0) {
                    errorType = 2000;
                    break;
                }

                trueCostHeros.push(shid);

                if (!theHero || !theHero.rid || player.getRoleTeamPos(shid)) {
                    errorType = 2;
                    break;
                }

                if (conType == 1) {
                    if (theHero.rid == starOrId) {
                        ownNum += 1;
                    }
                } else if (conType == 2) {
                    var heroConf = conf_mgr.gConfHero[theHero.rid];
                    if (!heroConf) {
                        errorType = 3;
                        break;
                    }

                    var heroTemplateId = heroConf.heroTemplateId;     // hero模板id
                    if (theHero.awake > 4) {
                        heroTemplateId = heroConf.templatedIdUltimate;
                    }
                    var starBase = conf_mgr.gConfCombatHeroTemplate[heroTemplateId]['starBase'];                    // 模板類型
                    if (starBase + theHero.awake - 1 == starOrId) {
                        ownNum += 1;
                    }
                } else if (conType == 3) {
                    var mainRid = myHeros[mHid].rid;
                    var selfCostId = conf_mgr.gConfHero[mainRid]['selfCostId'];

                    if (selfCostId == theHero.rid) {
                        ownNum += 1;
                    }
                }
            }

            if (ownNum != num) {
                errorType = 1000;
                break;
            }
        }

        if (errorType != 0) {
            resp.code = 1; resp.desc = 'eror ' + errorType; break;
        }

        var limit = conf.Limit.split('.');        // 条件检测
        if (limit[0] == 'gameday') {            // 开服天数检测
            var days = +limit[1];
            var open = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime));
            if (open + 1 < days) {
                resp.code = 105; resp.desc = 'invalid open day'; break;
            }
        } else {
            resp.code = 106; resp.desc = 'invalid limit condition'; break;
        }

        var mergeRid = +conf['goal'][0][1];        // 检查所需消耗的数量
        if (!conf_mgr.gConfHero[mergeRid]) {
            resp.code = 1; resp.desc = 'goal error'; break;
        }

        var heroBack = player.deleteHeros(trueCostHeros);
        myHeros[mHid].rid = mergeRid;
        player.markDirty(util.format("hero_bag.heros.%d.rid", mHid));

        var star = player.getHeroStar(mHid);
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, player, 'roleQuality', 1, star);
        player.doOpenSeven('roleQuality', 1, star);
        player.doOpenHoliday('roleQuality', 1, star);

        resp.data.awards = player.addAwards(heroBack, req.mod, req.act);
        resp.data.heros = myHeros[mHid];

        logic_event_mgr.emit(logic_event_mgr.EVENT.MAKE_HERO_UP, player, star);
    } while (false);

    onHandled();
};


/**
 * 增加英雄 ，能否加英雄的逻辑放在调用此函数之前判断
 * @param {*} player 
 * @param {*} rid       英雄的模板id
 * @param {*} num       增加数量
 */
exports.addHero = function (player, rid, num) {
    var hBagObj = player.user.hero_bag;
    var max = player.getHeroBagMax();
    if (Object.keys(hBagObj.heros).length >= max) { return []; }

    var initRole = {
        'rid': 0,      // 主公的武將id
        'awake': 1,    // 老天命，初始1級，武将觉醒等级，决定技能等级 配置星級+awake = 顯示星級
        'tier': 0,     // 品阶（6星以上10阶才能觉醒）
        'level': 1,
        'equip': {                          // 装备
            '1': 0,                        // 头盔
            '2': 0,                        // 武器
            '3': 0,                        // 腰带
            '4': 0,                        // 盔甲
            '5': 0,                        // 鞋子
            '6': 0,                        // 项链
        },
        'rune_use': [0, 0, 0, 0],
        'talent': {
            'point': 0,
            'tree': [0, 0, 0, 0, 0, 0],    // 0-1-2
        },
        'attr': {},
    };

    for (var attr in Attribute) {
        initRole['attr'][Attribute[attr]] = 0;
    }

    var hBagObj = player.user.hero_bag;
    var heros = hBagObj.heros;
    var getArr = [];
    for (var i = 1; i <= num; i++) {
        var newIndex = hBagObj.index;
        var newRole = clone(initRole);
        newRole.rid = +rid;
        newRole.bag_pos = newIndex;
        heros[newIndex] = newRole;

        getArr.push(newIndex);
        hBagObj.index = hBagObj.index + 1;
        player.markDirty('hero_bag.heros.' + newIndex);

        player.onCardGetOneCallback(+rid, newIndex);
    }

    // player.markFightForceChanged(1);
    player.markDirty('hero_bag.index');
    return getArr;
};

/**
 * 该功能中对英雄的附加属性
 * @param {*} player    玩家信息
 * @param {*} hero      英雄信息
 * @param {*} team      所在队伍信息
 */
exports.hero_additional_attribute = function (player, hero, team) {
    var tBaseAttr = getHeroBaseAttr(player, hero, team);
    var tEquipAttr = getHeroEquipAttr(player, hero, team);
    var tTalentAttr = getTalentAttr(player, hero, team);

    var attrArr = cloneHeroInitAttr();
    for (var tKey in attrArr) {
        var tBaseAttrValue = tBaseAttr[tKey] || 0;
        var tEquipAttrValue = tEquipAttr[tKey] || 0;
        var tTalentAttrValue = tTalentAttr[tKey] || 0;
        attrArr[tKey] = tBaseAttrValue + tEquipAttrValue + tTalentAttrValue;
    }
    return attrArr;
};

/** 英雄基本属性 */
function getHeroBaseAttr(player, hero, team) {
    var attrArr = cloneHeroInitAttr();
    var baseConf = conf_mgr.gConfHero[hero.rid];
    var combatConf = conf_mgr.getHeroCombatConf(hero.rid, hero.awake);

    var destinyConf = conf_mgr.gConfDestiny[hero.awake];
    var rebornType = combatConf['rebornType'];
    var rebornconf = conf_mgr.gConfReborn[rebornType][hero.tier];

    var curLv = hero.level;

    attrArr[1] = rebornconf['baseAtk'] + (curLv - 1) * rebornconf['atkGrowth'];
    attrArr[2] = rebornconf['baseDef'] + (curLv - 1) * rebornconf['defGrowth'];
    attrArr[3] = rebornconf['baseMagDef'] + (curLv - 1) * rebornconf['magDefGrowth'];
    attrArr[4] = rebornconf['baseHp'] + (curLv - 1) * rebornconf['hpGrowth'];

    // other base attr
    attrArr[9] = +combatConf.baseSpeed;
    attrArr[10] = +combatConf.attackSpeed;

    // 英雄觉醒加成 
    attrArr[1] = Math.floor(attrArr[1] * (1 + destinyConf['atk'] / 100));
    attrArr[2] = Math.floor(attrArr[2] * (1 + destinyConf['def'] / 100));
    attrArr[3] = Math.floor(attrArr[3] * (1 + destinyConf['mdef'] / 100));
    attrArr[4] = Math.floor(attrArr[4] * (1 + destinyConf['hp'] / 100));

    return attrArr;
};

/** 英雄装备属性 */
function getHeroEquipAttr(player, hero, team) {
    var attrArr = cloneHeroInitAttr();
    var equipBag = player.user.bag.equip;

    var partAwakeConf = conf_mgr.gConfPartAwake;
    var partEmbedConf = conf_mgr.gConfPartEmbed;

    var suitId = -1;
    var isSuitActive = true;

    for (i = 1; i <= 6; i++) {
        var eid = hero.equip[i];
        if (eid <= 0) {
            isSuitActive = false;
            continue;
        }

        var eObj = equipBag[eid];
        var eConf = conf_mgr.gConfEquip[eObj.id];
        var ebaseConf = conf_mgr.gConfEquipBase[eConf.type][eConf.quality];
        if (!ebaseConf) {
            continue;
        }

        if (eObj) {
            if (suitId == -1) {
                suitId = eConf.suitId;
            }

            if (suitId != eConf.suitId) {
                isSuitActive = false
            }

            var equipMainAttr = { 1: 0, 2: 0, 3: 0, 4: 0 };                         //装备基础属性
            for (var mi = 1; mi <= 4; mi++) {
                var mainAttrValue = ebaseConf['attributeValue' + eObj.grade];
                equipMainAttr[mi] += mainAttrValue[mi - 1];
            }

            var partObj = hero.part;                //部位装备基础百分比加成
            var addPercent = 0

            if (partObj && partObj.max_awake && partObj.awake_level > 0) {
                var partGemEmbedLv = getEmbedLevel(hero, i);
                addPercent = partAwakeConf[i][partObj.awake_level]['addEquipMainAtt'];

                if (partGemEmbedLv > 0) {
                    addPercent = addPercent + partEmbedConf[partGemEmbedLv]['addEquipMainAtt'];
                }
            }

            for (var j = 1; j <= 4; j++) {
                var normalAttrId = j;
                var normalValue = Math.floor(equipMainAttr[j] * (100 + addPercent) / 100);
                attrArr[normalAttrId] = attrArr[normalAttrId] + normalValue;
            }

            var specialAType = ebaseConf.specialAttType;                //装备特殊属性 todo  specialAttValue0
            var specialAValue = ebaseConf['specialAttValue' + eObj.grade];
            attrArr[specialAType] = attrArr[specialAType] + specialAValue;
        } else {
            isSuitActive = false;
        }

    }

    if (suitId > 0 && isSuitActive) {        //套装加成
        var suitCfg = conf_mgr.gConfEquipSuit[suitId];
        var suitAttr = suitCfg['attribute6'];

        var len = suitAttr.length;
        for (var i = 0; i < len; i++) {
            var attrStr = suitAttr[i];
            var arr1 = attrStr.split(':');
            var attrType = Number(arr1[0]);
            var attrValue = Number(arr1[1]);

            attrArr[attrType] = attrArr[attrType] + attrValue;
        }
    }

    return attrArr;
}

/** 才能附加属性 */
function getTalentAttr(player, hero, team) {
    var attrArr = cloneHeroInitAttr();

    var allPoints = hero.talent.point;
    var treeObj = hero.talent.tree;

    var ability = conf_mgr.gConfCombatHeroTemplate[hero.rid]['ability'];
    var talnetDict = conf_mgr.gConfEquipTalent[ability];

    for (var i in talnetDict) {
        var talentConf = talnetDict[i];

        var isActive = allPoints >= talentConf['limit'];

        if (!isActive) { continue; }

        if (treeObj[i - 1] == 1) {                // 选的左边
            var normalAttrId = talentConf['talentValue1'][0];
            var normalValue = talentConf['talentValue1'][1];

            attrArr[normalAttrId] += normalValue;
        }
        else if (treeObj[i - 1] == 2) {                // 选的右边
            var normalAttrId = talentConf['talentValue2'][0];
            var normalValue = talentConf['talentValue2'][1];

            attrArr[normalAttrId] += normalValue;
        }
    }

    return attrArr;
}

exports.getHeroAttr = getHeroAttr;
/**
 * 获取角色在队伍中时的属性信息
 * @param {*} player    玩家信息
 * @param {*} hero      角色信息
 * @param {*} team      队伍信息
 */
function getHeroAttr(player, hero, team) {
    var tHeroAttrDict = {};
    for (var tKey in logic) {
        var tLigic = logic[tKey];
        if (!tLigic) { continue; }
        if (!tLigic.hero_additional_attribute) { continue; }
        tHeroAttrDict[tKey] = tLigic.hero_additional_attribute(player, hero, team) || {};
    }

    var attrs = cloneHeroInitAttr();
    for (var attrid in attrs) {                          // 遍历所有存在的属性id
        var finalValue = 0;
        for (var tKey in tHeroAttrDict) {
            var tAttrDict = tHeroAttrDict[tKey];
            if (!tAttrDict) { continue; }
            var tAttrNum = tAttrDict[attrid] || 0;          // 获取每个功能中这个属性对应的值
            finalValue = finalValue + tAttrNum;
        }
        attrs[attrid] = ~~finalValue;
    }
    return attrs;
}

/** 获取制定英雄的战力 */
exports.getHeroFightForce = function (player, hero, team) {
    if (!hero) { return 0; }

    var attrs = getHeroAttr(player, hero, team);

    hero.attr = clone(attrs);
    hero.fight_force = ~~calcFightForceNew(hero, attrs);
    player.markDirty(`hero_bag.heros.${heroIndex}.fight_force`);
    player.markDirty(`hero_bag.heros.${heroIndex}.attr`);

    return fightForce;


    var baseAttrArr = funcCalcBaseAttr(hero);
    var innateAttrArr = funcCalcInnateAttr(user.hero_bag.heros, heroIndex, user.team[TEAM_NAME.DEFAULT][1]);
    var runeAttrArr = funcCalcRuneAttrArr(hero);
    var partAttrArr = funcCalcPartAttr(hero);
    var equipAttrArr = funcCalcEquipAttr(hero, user.bag.equip);
    var equipTalentAttrArr = funcCalcEquipTalentAttr(hero, user.bag.equip);
    var achieveAttrArr = funcGetAchievementAttr(user.status.egg);
    var nobilityAttrArr = funcCalcNobilityAttrArr(user.task.nobility);

    // var getDragonAttr = function (dragons, dragonGemBag) {
    //     var attrArr = cloneHeroInitAttr();

    //     for (var did in dragons) {
    //         var rateAdd = 0;
    //         var dragonData = dragons[did];
    //         var gemSlot = dragonData.slot;
    //         for (var gslot in gemSlot) {

    //             var gemid = gemSlot[gslot];
    //             if (!gemid) { continue; }

    //             var gemObj = dragonGemBag[gemid];
    //             if (!gemObj) { continue; }
    //             rateAdd += gemObj.attr;
    //         }

    //         var oneDraConf = conf_mgr.gConfCustomDragon[did];
    //         var dragonAttr = {};
    //         dragonAttr[1] = Math.floor(oneDraConf.attack * (1 + rateAdd / 100));
    //         dragonAttr[2] = Math.floor(oneDraConf.defence * (1 + rateAdd / 100));
    //         dragonAttr[3] = Math.floor(oneDraConf.mdefence * (1 + rateAdd / 100));
    //         dragonAttr[4] = Math.floor(oneDraConf.hp * (1 + rateAdd / 100));

    //         for (var aid in dragonAttr) {
    //             attrArr[aid] += dragonAttr[aid];
    //         }
    //     }

    //     return attrArr;
    // }

    var dragonAttrArr = getDragonAttr(user.dragon, user.bag.dragon);

    var attrs = cloneHeroInitAttr();
    for (var attrid in attrs) {
        var value1 = baseAttrArr[attrid] || 0;
        var value2 = innateAttrArr[attrid] || 0;
        var value3 = runeAttrArr[attrid] || 0;
        var value4 = partAttrArr[attrid] || 0;
        var value5 = equipAttrArr[attrid] || 0;
        var value6 = equipTalentAttrArr[attrid] || 0;

        var value7 = peopleKingAttrArr[attrid] || 0;
        var value8 = achieveAttrArr[attrid] || 0;
        var value9 = nobilityAttrArr[attrid] || 0;
        var value10 = teamBadgeAttrArr[attrid] || 0;
        var value11 = dragonAttrArr[attrid] || 0;

        var finalValue = value1 + value2 + value3 + value4 + value5 + value6 + value7 + value8 + value9 + value10 + value11;

        attrs[attrid] = Math.floor(finalValue);
    }

    hero.attr = clone(attrs);

    var combatConf = conf_mgr.getHeroCombatConf(hero.rid, hero.awake);
    var starLv = player.getHeroStar(heroIndex);
    var fightForce = calcFightForceNew(hero, starLv, combatConf);
    hero.fight_force = Math.floor(fightForce);
    player.markDirty(util.format('hero_bag.heros.%d.fight_force', heroIndex));

    player.markDirty(util.format('hero_bag.heros.%d.attr', heroIndex));

    return fightForce;
};