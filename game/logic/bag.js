
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const auto_fight = require('./auto_fight.js');
const { isModuleOpen_new, reformAwards } = require('../../common/global.js');

/**
 * 使用背包里面的物品
 * @type  这个物品是什么类型    dress：小兵装备
 * @num   物品卖出的数量
 * @id    卖出物品的id
 */
exports.use = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var num = Math.floor(req.args.num);
        if (!num || num < 1) {
            resp.code = 1; resp.desc = 'no valid args'; break;
        }

        var id = +req.args.id;
        var itemConf = conf_mgr.gConfItem[id];
        if (!itemConf || itemConf.useable != 1) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var category = itemConf.category;
        DEBUG('category = ' + category);
        var item = user.bag[category];
        if (!item || item == undefined) {
            resp.code = 1; resp.desc = 'category error'; break;
        }

        if (category == 'material') {
            var itemUseType = itemConf.useType;
            var useEffect = itemConf.useEffect;
            if (itemUseType == 'box') {
                var segs = useEffect.split(':');
                if (segs.length != 2) {
                    resp.code = 1; resp.desc = 'item useEffect error'; break;
                }
                var getNum = +segs[1];
                segs = segs[0].split('.');
                var item = segs[0];
                if (item == 'drop') {
                    // 只有掉落类型的才限制数量，其他的不限制
                    var mergeNum = itemConf.mergeNum ? itemConf.mergeNum : 1;
                    if (num / mergeNum > conf_mgr.gConfGlobal.useBoxLimit) {
                        resp.code = 1; resp.desc = 'too many'; break;
                    }
                }
            }
        }

        var itemNum = item[id];
        if (itemNum - num < 0) {
            resp.code = 1; resp.desc = 'not enough'; break;
        }

        var awards = [];
        var costs = itemConf.cost.slice();
        if (category == 'fragment') {
            var mergeHeroId = +itemConf.useEffect;

            if (itemConf.mergeNum != num) {
                resp.code = 1; resp.desc = 'num error'; break;
            }

            costs.push([category, id, -num]);
            awards.push(['card', mergeHeroId, 1]);

            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = 'not enough'; break;
            }

            var quality = itemConf.quality;
            if (quality == 6) {
                var array = [];
                var userName = user.info.un;
                // var heroName = conf_mgr.gConfGeneralText[conf_mgr.gConfHero[mergeHeroId].heroName].text;
                array[0] = userName;
                array[1] = mergeHeroId;
                if (userName == null) {
                    array[0] = '';
                }

                pushSysMsg('mergeHero', array);
            }

            resp.data.costs = player.addAwards(costs, req.mod, req.act);
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
        } else if (category == 'material') {
            var itemUseType = itemConf.useType;
            var useEffect = itemConf.useEffect;

            if (itemUseType == 'box') {
                // 使用箱子
                var segs0 = useEffect.split(':');
                if (segs0.length != 2) {
                    resp.code = 1; resp.desc = 'item useEffect error'; break;
                }
                var getNum = +segs0[1];
                segs = segs0[0].split('.');
                var item = segs[0];
                if (item == 'gem') {
                    var level = +segs[1];
                    var gems = [];
                    for (var gid in conf_mgr.gConfGem) {
                        if (conf_mgr.gConfGem[gid].level == level) {
                            gems.push(gid);
                        }
                    }
                    for (var i = 0; i < getNum * num; i++) {
                        awards.push([item, common.randArray(gems), 1]);
                    }
                } else if (item == 'card') {
                    var quality = +segs[1];
                    var cards = [];
                    for (var hid in conf_mgr.gConfHero) {
                        var heroCombatConf = conf_mgr.getHeroCombatConf(hid);
                        if (heroCombatConf.quality == quality && conf_mgr.gConfHero[hid].camp != 5) {
                            cards.push(hid);
                        }
                    }
                    for (var i = 0; i < getNum * num; i++) {
                        awards.push([item, common.randArray(cards), 1]);
                    }
                } else if (item == 'fragment') {
                    var quality = +segs[1];
                    var fragments = [];
                    for (var iid in conf_mgr.gConfItem) {
                        if (conf_mgr.gConfItem[iid].category == item && conf_mgr.gConfItem[iid].quality == quality) {
                            fragments.push(iid);
                        }
                    }
                    for (var i = 0; i < getNum * num; i++) {
                        awards.push([item, common.randArray(fragments), 1]);
                    }
                    // } else if (item == 'material') {
                    //     var quality = +segs[1];
                    //     var materials = [];
                    //     for (var iid in conf_mgr.gConfItem) {
                    //         if (conf_mgr.gConfItem[iid].category == item && conf_mgr.gConfItem[iid].quality == quality) {
                    //             materials.push(iid);
                    //         }
                    //     }
                    //     for (var i = 0; i < getNum*num; i++) {
                    //         awards.push([item, common.randArray(materials), 1]);
                    //     }
                } else if (item == 'equip') {
                    var quality = +segs[1];
                    var level = this.user.status.level;
                    level = Math.floor(level / 10) * 10;
                    var nextLevel = level + 10;
                    if (level == 0) {
                        level = 1;
                    }
                } else if (item == 'dress') {
                    var dressLevel = segs[1];
                    var dresses = [];
                    for (var did in conf_mgr.gConfSoldierDress) {
                        if (+did[1] + 1 == dressLevel) {
                            dresses.push(did);
                        }
                    }
                    for (var i = 0; i < getNum * num; i++) {
                        awards.push([item, common.randArray(dresses), 1]);
                    }
                } else if (item == 'drop') {
                    var dropId = +segs[1];
                    //for (var i = 0; i < getNum*num; i++) {
                    //   awards.combine(generateDrop(dropId, user.status.level));
                    //}

                    awards = generateDropWithCount(dropId, getNum * num, user.status.level);
                } else if (item == 'material') {
                    var materialId = +segs[1];
                    awards = [['material', materialId, getNum * num]];
                }

                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1; resp.desc = 'not enough'; break;
                }

                awards = reformAwards(awards);

                resp.data.costs = player.addAwards(costs, req.mod, req.act);
                resp.data.awards = player.addAwards(awards, req.mod, req.act);
            } else if (itemUseType == 'xp') {
                resp.code = 1; resp.desc = 'not support'; break;
            } else if (itemUseType == 'god') {
                if (num % itemConf.mergeNum) {
                    resp.code = 1; resp.desc = 'num error'; break;
                }

                costs.push([category, id, -num]);

                var awardNum = num / itemConf.mergeNum;
                var level = user.status.level;
                level = Math.floor(level / 10) * 10;
                var nextLevel = level + 10;
                if (level == 0) {
                    level = 1;
                }

                if (!player.checkCosts(costs)) {
                    resp.code = 1; resp.desc = 'not enough'; break;
                }
                resp.data.costs = player.addAwards(costs, req.mod, req.act);
                resp.data.awards = player.addAwards(awards, req.mod, req.act);
            } else if (itemUseType == 'equip') {
                var equipNum = Math.floor(num / itemConf.mergeNum);
                var costs = [['material', id, -equipNum * itemConf.mergeNum]];
                if (!player.checkCosts(costs)) {
                    resp.code = 1; resp.desc = 'not enough'; break;
                }

                awards.push(['equip', +itemConf.useEffect, 0, equipNum]);
                resp.data.costs = player.addAwards(costs, req.mod, req.act);
                resp.data.awards = player.addAwards(awards, req.mod, req.act);
            } else if (itemUseType == 'none' || !itemUseType) {
                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1; resp.desc = 'not enough'; break;
                }
                resp.data.costs = player.addAwards(costs, req.mod, req.act);
            } else if (itemUseType == 'gold'
                || itemUseType == 'soul'
                || itemUseType == 'digging') {

                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1; resp.desc = 'not enough'; break;
                }
                awards.push(['user', itemUseType, +itemConf.useEffect * num]);
                resp.data.costs = player.addAwards(costs, req.mod, req.act);
                resp.data.awards = player.addAwards(awards, req.mod, req.act);
            } else if (itemUseType == 'ticket') {
                var segs = useEffect.split(':');
                if (segs.length != 2) {
                    resp.code = 1; resp.desc = 'item useEffect error'; break;
                }
                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1; resp.desc = 'not enough'; break;
                }
                var getNum = +segs[1];
                segs = segs[0].split('.');
                var item = segs[0];
                if (item == 'arena') {
                    user.arena.buy_count += getNum * num;
                    player.markDirty('arena.buy_count');
                }
                resp.data.costs = player.addAwards(costs, req.mod, req.act);
            } else if (itemUseType == 'herobox') {
                var conf = conf_mgr.gConfHeroBox[+useEffect];
                if (!conf) {
                    resp.code = 1; resp.desc = 'invalid conf'; break;
                }

                var idx = req.args.index;
                var award = conf.awards[idx - 1];
                if (!award) {
                    resp.code = 1; resp.desc = 'invalid index'; break;
                }

                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1; resp.desc = 'not enough'; break;
                }

                var awards = timeAwards([award], num).concat(conf.awards2);
                resp.data.awards = player.addAwards(awards, req.mod, req.act);

                resp.data.costs = player.addAwards(costs, req.mod, req.act);
            } else if (itemUseType == 'dragongem') {
                if (num % itemConf.mergeNum) {
                    resp.code = 1;
                    resp.desc = 'num error';
                    break;
                }

                if (player.memData.dragongem_num >= user.dragongem_valume) {
                    resp.code = 1;
                    resp.desc = 'dragongem full';
                    break;
                }

                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1;
                    resp.desc = 'not enough';
                    break;
                }

                var awardNum = num / itemConf.mergeNum;
                for (var i = 0; i < awardNum; i++) {
                    awards.combine(generateDrop(itemConf.useEffect));
                }
                resp.data.awards = player.addAwards(awards, req.mod, req.act);
                resp.data.costs = player.addAwards(costs, req.mod, req.act);
            } else if (itemUseType == 'guide1') {
                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1;
                    resp.desc = 'not enough';
                    break;
                }

                resp.data.costs = player.addAwards(costs, req.mod, req.act);
            } else if (itemUseType == 'explore') {
                if (!isModuleOpen_new(player, 'exploreMonster')) {
                    resp.code = 1;
                    resp.desc = 'exploreMonster not open';
                    break;
                }
                // 使用加速卡
                costs.push([category, id, -num]);
                if (!player.checkCosts(costs)) {
                    resp.code = 1;
                    resp.desc = 'not enough';
                    break;
                }

                DEBUG('itemConf.useEffect = ' + itemConf.useEffect);

                var awards = [];//
                for (var i = 0; i < num; i++) {
                    awards = awards.concat(auto_fight.calcAutoFight(player, parseInt(itemConf.useEffect)));
                }

                DEBUG(awards);
                resp.data.costs = player.addAwards(costs, req.mod, req.act);
                resp.data.awards = player.addAwards(awards, req.mod, req.act)
            } else {
                resp.code = 1; resp.desc = 'invalid id'; break;
            }
        }

    } while (false);

    onHandled();
}

/**
 * 卖背包里面的物品
 * @type  这个物品是什么类型    dress：小兵装备
 * @num   物品卖出的数量
 * @id    卖出物品的id
 */
exports.sell = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var type = req.args.type;
        var id = +req.args.id;
        var num = Math.floor(+req.args.num);
        if (!type || isNaN(id) || isNaN(num)) {
            resp.code = 1; resp.desc = 'no valid args'; break;
        }

        if (!user.bag[type]) {
            resp.code = 1; resp.desc = 'no this type'; break;
        }

        if (type == 'card') {
            resp.code = 1; resp.desc = 'cannot sell'; break;
        }

        if (!user.bag[type][id] || user.bag[type][id] <= 0) {
            resp.code = 1; resp.desc = 'no this item'; break;
        }
        if (num <= 0 || (type != 'equip' && num > user.bag[type][id])) {
            resp.code = 1; resp.desc = 'num error'; break;
        }

        var price = 0;
        var awards = [];
        var costs = [];
        if (type == 'equip') {
            var equip = user.bag['equip'][id];
            if (equip.pos) {
                resp.code = 1; resp.desc = 'cannot sell'; break;
            }
            price = conf_mgr.gConfEquip[equip.id].sellPrice;
            costs.push([type, id, -1]);
            for (var slot in equip.gems) {
                if (equip.gems[slot]) {
                    awards.push(['gem', equip.gems[slot], 1]);
                }
            }
        } else {
            if (type == 'gem') {
                price = conf_mgr.gConfGem[id].sell;
            } else if (type == 'dress') {
                price = conf_mgr.gConfSoldierDress[id].sell;
            } else {
                price = conf_mgr.gConfItem[id].sell;
            }

            if (!price) {
                resp.code = 1; resp.desc = 'cannot sell'; break;
            }

            costs.push([type, id, -num]);
        }

        awards.push(['user', 'gold', price * num]);//卖出的价格
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
}

/**
 * 批量合成宝石
 * @gem_level   升级之后的等级
 * @gem_type    宝石的类型    eg:  3:生命宝石
 * @gem_num     合成多少个
 */
exports.gemCompose = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var gem_type = req.args.gem_type;
        var gem_level = req.args.gem_level;
        var gem_num = req.args.gem_num;
        if (isNaN(gem_type) || isNaN(gem_level) || isNaN(gem_num)) {
            resp.code = 1; resp.desc = 'args invalid'; break;
        }

        if (gem_num < 1) {
            resp.code = 1; resp.desc = 'gem_num invalid'; break;
        }

        // 检查升级材料够不够
        var curLevel = gem_level - 1;

        var needNum = 3 * gem_num;
        var factor = 3;

        var costs = [];
        var canUpgrade = false;
        for (var i = curLevel; i >= 1; i--) {
            var hasNum = player.getGemNumByTypeAndLevel(gem_type, i);
            var consumeId = gem_type * 100 + i;

            if (hasNum >= needNum) {
                costs.push(["gem", consumeId, -needNum]);
                canUpgrade = true;
                break;
            } else {
                if (hasNum > 0) {
                    costs.push(["gem", consumeId, -hasNum]);
                }

                needNum = (needNum - hasNum) * factor
            }
        }

        if (!canUpgrade) {
            resp.code = 1; resp.desc = 'gem not enough'; break;
        }

        var newGemId = gem_type * 100 + gem_level;
        var awards = [['gem', newGemId, gem_num]];

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
};

// 装备分解
exports.equipDecompose = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var equipId = req.args.equip_id;
        if (isNaN(equipId)) {
            resp.code = 1; resp.desc = 'args invalid'; break;
        }

        if (!user.bag.equip[equipId] || user.bag.equip[equipId] <= 0) {
            resp.code = 1; resp.desc = 'no this equip'; break;
        }

        var id = user.bag.equip[equipId].id;
        var equipConf = conf_mgr.gConfEquip[id];
        if (!equipConf) {
            resp.code = 1; resp.desc = 'no this equip conf'; break;
        }

        if (!equipConf.canDecompose) {
            resp.code = 1; resp.desc = 'can not decompose'; break;
        }

        var awards = equipConf.decomposeAward;
        var costs = [['equip', equipId, -1]];

        resp.data.awards = player.addAwards(awards, req.mod, req.act);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

    } while (false);

    onHandled();
};


exports.use_day_box = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.id) || isNaN(req.args.num)) {
            resp.code = 1; resp.desc = 'no valid args'; break;
        }

        var id = +req.args.id;
        var num = Math.floor(req.args.num);

        var itemConf = conf_mgr.gConfItem[id];
        if (!itemConf || !itemConf.useable) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var category = conf_mgr.gConfItem[id].category;
        var item = user.bag[category];
        var itemNum = item[id];

        if (itemNum - num < 0) {
            resp.code = 1; resp.desc = 'not enough'; break;
        }

        var awards = [];
        var costs = itemConf.cost.slice();
        var useEffect = itemConf.useEffect;

        var segs = useEffect.split(':');
        if (segs.length != 2) {
            resp.code = 1; resp.desc = 'item useEffect error'; break;
        }
        var getNum = +segs[1];
        segs = segs[0].split('.');

        var dropId = +segs[1];
        for (var i = 0; i < num; i++) {
            awards.combine(generateDrop(dropId), user.status.level);
        }

        costs.push([category, id, -num]);
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough'; break;
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
};

/**
 * 开宝箱
 * @type    宝箱类型
 * @num
 * @id      宝箱的id
 */
exports.use_rare_box = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.id) || isNaN(req.args.num)) {
            resp.code = 1; resp.desc = 'no valid args'; break;
        }

        var id = +req.args.id;
        var num = Math.floor(req.args.num);

        var itemConf = conf_mgr.gConfItem[id];
        if (!itemConf || !itemConf.useable) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var category = conf_mgr.gConfItem[id].category;
        var item = user.bag[category];
        var itemNum = item[id];

        if (itemNum < 1) {
            resp.code = 1; resp.desc = 'not enough'; break;
        }

        var useEffect = itemConf.useEffect;
        var segs = useEffect.split(':');
        if (segs.length != 2) {
            resp.code = 1; resp.desc = 'item useEffect error'; break;
        }
        var getNum = +segs[1];
        segs = segs[0].split('.');

        var dropId = +segs[1];
        //var awards = generateDrop(dropId);
        var dropConf = conf_mgr.gConfDrop[dropId];
        if (!dropConf) {
            resp.code = 1; resp.desc = 'dropId error'; break;
        }

        var awards = [];
        if (dropConf.fixed) {
            awards = awards.concat(dropConf.fixed);
        }

        var type = dropConf.type;
        var randNum = dropConf.randNum;

        var maxIndex = 20;
        for (var i = 1; i <= maxIndex; i++) {
            if (!dropConf['weight' + i]) {
                maxIndex = i - 1; break;
            }
        }

        var weights = {};
        for (var i = 1; i <= maxIndex; i++) {
            if (dropConf['award' + i]) {
                weights[i] = dropConf['weight' + i];
            } else {
                break;
            }
        }

        var randIndex = common.wRand(weights);
        if (!randIndex) {
            break; // 配置错误导致奖励个数比配置少
        }
        weights[randIndex] = 0;
        awards.push(dropConf['award' + randIndex][0]);

        var awardId = randIndex;
        var costOne = itemConf.cost.slice();
        var costTwo = itemConf.cost1.slice();
        if (player.checkCosts(costOne)) {
            var costs = costOne;
            costs.push([category, id, -1]);
        } else if (player.checkCosts(costTwo)) {
            var costs = costTwo;
            costs.push([category, id, -1]);
        } else {
            resp.code = 1; resp.desc = 'not enough'; break;
        }

        resp.data.awardId = awardId;
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.merge = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var num = Math.floor(req.args.num);
        if (!num || num < 1) {
            resp.code = 1; resp.desc = 'no valid args'; break;
        }

        var id = +req.args.id;
        var itemConf = conf_mgr.gConfItem[id];
        if (!itemConf || itemConf.useable != 2 || !itemConf.mergeNum) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var category = itemConf.category;
        var item = user.bag[category];
        var itemNum = item[id];

        if (num % itemConf.mergeNum) {
            resp.code = 1; resp.desc = 'num error'; break;
        }

        if (user.status.level < itemConf.mergeLvLimit) {
            resp.code = 1; resp.desc = 'level limit'; break;
        }

        var awardNum = Math.floor(num / itemConf.mergeNum);
        var costs = [[category, id, -num]];

        DEBUG(costs);
        if (itemConf.cost != 0) {
            costs.combine(itemConf.cost);
        }

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'not enough'; break;
        }

        var awards = [];
        var heros = {};
        var singleAward = clone(itemConf.mergeItem);
        for (var i = 0; i < awardNum; i++) {
            var oneRewards = player.addAwards(singleAward, req.mod, req.act)
            awards = awards.concat(oneRewards.awards);
            if (Object.keys(oneRewards.heros).length > 0) {
                for (var hid in oneRewards.heros) {
                    heros[hid] = oneRewards.heros[hid];
                }
            }
        }

        awards = reformAwards(awards);

        var returnAwards = {};
        returnAwards.awards = awards;
        returnAwards.heros = heros;

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = returnAwards;
    } while (false);

    onHandled();
};
