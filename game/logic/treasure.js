
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');

// 宝物
exports.active = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var treasure = user.treasure;
        var conf = conf_mgr.gConfTreasure[treasure.id];
        if (!conf) {
            resp.code = 1; resp.desc = 'max level'; break;
        }

        if (user.status.level < conf.open) {
            resp.code = 1; resp.desc = 'level not reached'; break;
        }

        if (!conf_mgr.gConfTreasure[treasure.id][treasure.active + 1]) {
            resp.code = 1; resp.desc = 'max active'; break;
        }

        treasure.active++;

        if (!conf_mgr.gConfTreasure[treasure.id][treasure.active + 1]) {
            user.dragon[treasure.id] = {
                level: 1,
                slot: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0,
                },
            };

            if (treasure.id == 2) {
                user.dragon[treasure.id].slot = {
                    1: player.addDragonGem(101, 'treasure', 'active'),
                    2: player.addDragonGem(101, 'treasure', 'active'),
                    3: player.addDragonGem(101, 'treasure', 'active'),
                    4: player.addDragonGem(101, 'treasure', 'active'),
                    5: 0,
                };
                resp.data.dragon = user.dragon[treasure.id];

                var awards = [];
                for (var i = 1; i <= 4; i++) {
                    var gid = user.dragon[treasure.id].slot[i];
                    var gem = user.bag.dragon[gid];
                    awards.push(['dragon', gid, gem]);

                    gem.dragon = treasure.id * 100 + i;
                    player.markDirty(util.format('dragon.%d.slot.%d', treasure.id, i));
                }
                resp.data.awards = awards;
            }

            player.markDirty('dragon.' + treasure.id);
        }

        player.markDirty('treasure');

        for (var pos in user.pos) {
            player.markFightForceChanged(pos);
        }
    } while (false);

    onHandled();
};

// 换坐骑 龙
exports.change_dragon = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = Math.floor(req.args.id);
        if (isNaN(id)) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        if (id > user.treasure.id) {
            resp.code = 1; resp.desc = 'not unlock yet'; break;
        }

        user.info.dragon = id;
        player.markDirty('info.dragon');
        var hid = user.pos[1].hid;
        user.pos[1].hid = Math.floor(hid / 100) * 100 + id;
        player.markDirty('pos.1.hid');
        resp.data.main_role = user.pos[1].hid;
    } while (false);

    onHandled();
};

// 升级龙
exports.upgrade_dragon = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = +req.args.id;
        var dragon = user.dragon[id];
        if (!dragon) {
            resp.code = 1; resp.desc = 'invalid id'; break;
        }

        var conf = conf_mgr.gConfDragonLevel[dragon.level];
        if (!conf.require) {
            resp.code = 1; resp.desc = 'max level'; break;
        }

        var accumulateLevel = 0;
        for (var slot in dragon.slot) {
            var gid = dragon.slot[slot];
            if (gid) {
                accumulateLevel += conf_mgr.gConfDragonGem[user.bag.dragon[gid].id].level;
            }
        }

        if (accumulateLevel < conf.require) {
            resp.code = 1; resp.desc = 'not enough level'; break;
        }

        if (!player.checkCosts(conf.cost)) {
            resp.code = 1; resp.desc = 'not enough gold'; break;
        }

        dragon.level++;
        player.markDirty(util.format('dragon.%d.level', id));

        player.doOpenSeven('dragon');
        player.doOpenHoliday('dragon');
        for (var i = 1; i <= 5; i++) {
            if (user.skills[i].id == id) {
                user.skills[i].level = dragon.level;
                player.markDirty(util.format('skills.%d.level', i));
                break;
            }
        }

        player.doGuideTask('king_dragon', 1);
        player.markFightForceChangedAll();

        resp.data.costs = player.addAwards(conf.cost, req.mod, req.act);

        // 在线奖励通知
        outline_sync_to_client(player);

    } while (false);

    onHandled();
};

// 换宝石
exports.exchange_gem = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = +req.args.id;
        var dragon = user.dragon[id];
        if (!dragon) {
            resp.code = 1; resp.desc = 'invalid dragon'; break;
        }

        var slot = req.args.slot;
        if (dragon.slot[slot] == null) {
            resp.code = 1; resp.desc = 'invalid slot'; break;
        }

        var gid = Math.floor(req.args.gid);
        var gem = user.bag.dragon[gid];
        if (!gem) {
            resp.code = 1; resp.desc = 'not such dragongem'; break;
        }

        var oldGid = dragon.slot[slot];
        var oldGem = user.bag.dragon[oldGid];
        if (oldGem) {
            if (conf_mgr.gConfDragonGem[oldGem.id].level > conf_mgr.gConfDragonGem[gem.id].level) {
                resp.code = 1; resp.desc = 'not better'; break;
            } else {
                oldGem.dragon = 0;
                player.markDirty(util.format('bag.dragon.%d.dragon', oldGid));
            }
        } else {
            player.memData.dragongem_num--;
        }

        gem.dragon = id * 100 + slot;
        dragon.slot[slot] = gid;
        player.markDirty(util.format('bag.dragon.%d.dragon', gid));
        player.markDirty(util.format('dragon.%d.slot.%d', id, slot));

        player.markFightForceChangedAll();
        // player.doOpenSeven('skillSlot');
    } while (false);

    onHandled();
};

// 转移宝石
exports.transfer_gem = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var gids = req.args.gids;
        var numRequire = req.args.upgrade ? conf_mgr.gConfGlobal.dragonGemMergeNum : conf_mgr.gConfGlobal.dragonGemSwapNum;
        if (!util.isArray(gids) || gids.length != numRequire) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        var costs = [];
        var level = 0;
        var advancedGemCount = 0;   // 极品龙晶的数量
        for (var i = 0, len = gids.length; i < len; i++) {
            var gem = user.bag.dragon[gids[i]];
            if (!gem || gem.dragon) {
                level = -1;
                break;
            }

            if (gem && !level) {
                level = conf_mgr.gConfDragonGem[gem.id].level;
            } else if (level != conf_mgr.gConfDragonGem[gem.id].level) {
                level = -1;
                break;
            }

            if (conf_mgr.gConfDragonGem[gem.id].isAdvanced > 0) {
                advancedGemCount++;
            }

            costs.push(['dragon', gids[i], -1]);
        }
        if (level == -1) {
            resp.code = 1; resp.desc = 'invalid gids'; break;
        }

        if (req.args.upgrade) {
            // 龙晶合成，检查是否已经到顶级了
            if (level >= 10) {
                resp.code = 1; resp.desc = 'already max level'; break;
            }
        }

        // 不能转换极品龙晶
        if (!req.args.upgrade && advancedGemCount > 0) {
            resp.code = 1; resp.desc = 'can transfer Advanced gem'; break;
        }

        var odds = 0;
        var awardArr = [];
        if (req.args.upgrade) {
            // 龙晶合成
            odds = conf_mgr.gConfDragonGemConvert[level]['prob' + advancedGemCount];
            awardArr = conf_mgr.gConfDragonGemConvert[level]['award'];
        } else {
            // 龙晶转换
            odds = conf_mgr.gConfDragonGemConvert[level]['convertProb'];
            awardArr = conf_mgr.gConfDragonGemConvert[level]['convertAward'];
        }

        var newGemId = awardArr[0];
        var randRet = common.randRange(0, 10000);
        if (randRet < odds) {
            newGemId = awardArr[1];
        }

        var awards = [['dragon', newGemId, 1]];

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
    } while (false);

    onHandled();
};