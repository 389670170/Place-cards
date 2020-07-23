
const util = require('util');
const conf_mgr = require('../../common/conf_mgr.js');
const { cloneHeroInitAttr } = require('../../common/global.js');

// 部位养成模块
// by gjx

// 普通觉醒
exports.normal_awake = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.pos) || isNaN(req.args.part_pos)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        var heroIndex = req.args.pos;
        // 武将索引
        var heroObj = user.hero_bag.heros[heroIndex];
        if (!heroObj) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        // 部位索引
        var part_pos = req.args.part_pos;

        if (!heroObj.part[part_pos].max_awake) {
            resp.code = 1; resp.desc = 'no max awake'; break;
        }

        var cur_level = heroObj.part[part_pos].awake_level;
        var next_level = cur_level + 1;
        if (!conf_mgr.gConfPartAwake[part_pos][next_level]) {
            resp.code = 1; resp.desc = 'already max level'; break;
        }

        // 检查金钱、材料是否满足
        var costs = [];
        costs = costs.concat(conf_mgr.gConfPartAwake[part_pos][next_level].costNormalAwake);

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        // 扣除材料
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        // 修改觉醒等级
        heroObj.part[part_pos].awake_level += 1;
        player.markDirty(util.format("hero_bag.heros.%d.part.%d.awake_level", heroIndex, part_pos));
        //player.markDirty(util.format("pos.%d.part.%d.awake_level", req.args.pos, part_pos));

        // 刷新角色属性
        //player.markFightForceChanged(req.args.pos);

        player.doGuideTask('part', 1);
        player.doOpenSeven('partAwake', 1);
        player.doOpenHoliday('partAwake', 1);
    } while (false);

    onHandled();
};

// 极限觉醒
exports.max_awake = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.pos) || isNaN(req.args.part_pos)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        // 武将索引
        var heroIndex = req.args.pos;
        var heroObj = user.hero_bag.heros[heroIndex];
        if (!heroObj) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        // 部位索引
        var part_pos = req.args.part_pos;
        if (heroObj.part[part_pos].max_awake) {
            resp.code = 1; resp.desc = 'already max awake'; break;
        }

        // 检查金钱、材料是否满足
        var costs = [];
        costs = costs.concat(conf_mgr.gConfPartBase[part_pos].costMaxAwake);

        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'material not enough'; break;
        }

        // 扣除材料
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        // 修改觉醒等级
        heroObj.part[part_pos].max_awake = true;
        player.markDirty(util.format("hero_bag.heros.%d.part.%d.max_awake", req.args.pos, part_pos));

        // 刷新角色属性 to do by fish
        // player.markFightForceChanged(req.args.pos);
    } while (false);

    onHandled();
};

// 镶嵌宝石
exports.embed_gem = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        // 需要的参数：武将索引、部位索引、宝石索引、宝石id
        if (isNaN(req.args.pos) || isNaN(req.args.part_pos) ||
            isNaN(req.args.gem_pos) || isNaN(req.args.gem_id)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        // 武将索引
        var posObj = user.hero_bag.heros[req.args.pos];
        if (!posObj) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        // 部位索引
        var part_pos = req.args.part_pos;
        if (!posObj.part[part_pos]) {
            resp.code = 1; resp.desc = 'part error'; break;
        }

        // 宝石索引
        var gem_index = req.args.gem_pos;

        // 检查宝石槽位是否已开启
        var awakeLevel = posObj.part[part_pos].awake_level;
        var needLevel = conf_mgr.gConfGlobal['partEmbedLimit' + gem_index];
        if (awakeLevel < needLevel) {
            resp.code = 1; resp.desc = 'slot not open'; break;
        }

        // 检查原有位置上是否已经有宝石
        var costs = [];
        if (posObj.part[part_pos].gems[gem_index] != 0) {
            // 先卸下原来的宝石
            costs.push(['gem', posObj.part[part_pos].gems[gem_index], 1]);
            posObj.part[part_pos].gems[gem_index] = 0;
        }

        // 装上新宝石
        var gem_id = req.args.gem_id;
        posObj.part[part_pos].gems[gem_index] = gem_id;

        costs.push(['gem', gem_id, -1]);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        player.markDirty(util.format("hero_bag.heros.%d.part.%d.gems.%d", req.args.pos, part_pos, gem_index));

        player.doGuideTask('partgem', 1);
        player.doOpenSeven('gemLevel', 1);
        player.doOpenHoliday('gemLevel', 1);
        // 刷新属性
        //player.markFightForceChanged(req.args.pos);
    } while (false);

    onHandled();
};

// 一键镶嵌
exports.embed_all_gem = function (player, req, resp, onHandled) {

};

// 卸下宝石
exports.takeoff_gem = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        // 需要的参数：武将索引、部位索引、宝石索引
        if (isNaN(req.args.pos) || isNaN(req.args.part_pos) || isNaN(req.args.gem_pos)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        // 武将索引
        var posObj = user.hero_bag.heros[req.args.pos];
        if (!posObj) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        // 部位索引
        var part_pos = req.args.part_pos;
        if (!posObj.part[part_pos]) {
            resp.code = 1; resp.desc = 'part error'; break;
        }

        // 宝石索引
        var gem_index = req.args.gem_pos;
        if (!posObj.part[part_pos].gems[gem_index]) {
            resp.code = 1; resp.desc = 'gem index error'; break;
        }

        // 检查指定位置上是否有宝石
        if (posObj.part[part_pos].gems[gem_index] == 0) {
            resp.code = 1; resp.desc = 'no gem at index'; break;
        }

        // 卸下
        var costs = [];
        costs.push(['gem', posObj.part[part_pos].gems[gem_index], 1]);
        posObj.part[part_pos].gems[gem_index] = 0;

        player.markDirty(util.format("hero_bag.heros.%d.part.%d.gems.%d", req.args.pos, part_pos, gem_index));
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        // 刷新属性
        player.markFightForceChanged(req.args.pos);
    } while (false);

    onHandled();
};

// 一键卸下
exports.takeoff_all_gems = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        // 需要的参数：武将索引、部位索引
        if (isNaN(req.args.pos) || isNaN(req.args.part_pos)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        // 武将索引
        var posObj = user.hero_bag.heros[req.args.pos];
        if (!posObj) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        // 部位索引
        var part_pos = req.args.part_pos;
        if (!posObj.part[part_pos]) {
            resp.code = 1; resp.desc = 'part error'; break;
        }

        var costs = [];
        for (var i = 1; i <= 4; i++) {
            if (posObj.part[part_pos].gems[i] != 0) {
                costs.push(['gem', posObj.part[part_pos].gems[i], 1]);
                posObj.part[part_pos].gems[i] = 0;
                player.markDirty(util.format("hero_bag.heros.%d.part.%d.gems.%d", req.args.pos, part_pos, i));
            }
        }

        if (costs.length > 0) {
            resp.data.costs = player.addAwards(costs, req.mod, req.act);

            // 刷新属性
            player.markFightForceChanged(req.args.pos);
        }
    } while (false);

    onHandled();
};

// 宝石升级
exports.upgrade_gem = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        // 需要的参数：武将索引、部位索引、宝石索引
        if (isNaN(req.args.pos) || isNaN(req.args.part_pos) || isNaN(req.args.gem_pos)) {
            resp.code = 1; resp.desc = 'args error'; break;
        }

        // 武将索引
        var posObj = user.hero_bag.heros[req.args.pos];
        if (!posObj) {
            resp.code = 1; resp.desc = 'no hero'; break;
        }

        // 部位索引
        var part_pos = req.args.part_pos;
        if (!posObj.part[part_pos]) {
            resp.code = 1; resp.desc = 'part error'; break;
        }

        // 检查指定位置是否有宝石
        var gem_pos = req.args.gem_pos;
        if (posObj.part[part_pos].gems[gem_pos] == 0) {
            resp.code = 1; resp.desc = 'no gem'; break;
        }

        // 检查宝石是否已经到顶级
        var gem_id = posObj.part[part_pos].gems[gem_pos];
        var nextGemId = gem_id + 1;
        var confGem = conf_mgr.gConfGem[gem_id];
        var nextGemConf = conf_mgr.gConfGem[nextGemId];
        if (!nextGemConf) {
            resp.code = 1; resp.desc = 'max level'; break;
        }

        var costs = [];
        // 检查金币够不够
        //costs = costs.concat(conf_mgr.gConfGem[gem_id].cost);
        //if (!player.checkCosts(costs)) {
        //    resp.code = 1; resp.desc = 'gold not enough'; break;
        //}

        // 检查升级材料够不够
        var curLevel = gem_id % 100;
        var gemType = parseInt(gem_id / 100);

        var needNum = 3;
        var factor = 3;

        var canUpgrade = false;
        for (var i = curLevel; i >= 1; i--) {
            var hasNum = player.getGemNumByTypeAndLevel(gemType, i);
            var consumeId = gemType * 100 + i;

            if (i == curLevel) {
                needNum -= 1;   // 除去部位上面本身这一颗
            }

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

        // 满足升级条件，可以升级了
        posObj.part[part_pos].gems[gem_pos] = nextGemId;
        player.markDirty(util.format("hero_bag.heros.%d.part.%d.gems.%d", req.args.pos, part_pos, gem_pos));
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

        // 刷新属性
        //player.markFightForceChanged(req.args.pos);

        player.doGuideTask('partgem', 1);
        player.doOpenSeven('gemLevel', 1);
        player.doOpenHoliday('gemLevel', 1);
    } while (false);

    onHandled();
};

/**
 * 该功能中对英雄的附加属性
 * @param {*} player    玩家信息
 * @param {*} hero      英雄信息
 * @param {*} team      所在队伍信息
 */
exports.hero_additional_attribute = function (player, hero, team) {
    var attrArr = cloneHeroInitAttr();
    for (var i in hero.part) {
        var partObj = hero.part[i];
        if (!partObj) { continue; }
        if (!partObj.max_awake) { continue; }
        if (partObj.awake_level <= 0) { continue; }
        var attrType = conf_mgr.gConfPartBase[i]['maxAtt'];                //部位特殊属性加成
        var attrValue = conf_mgr.gConfPartAwake[i][partObj.awake_level]['maxVal'];
        attrArr[attrType] = attrArr[attrType] + attrValue;

        var pGems = partObj.gems;                //宝石加成
        for (var gem_pos = 1; gem_pos <= 4; ++gem_pos) {
            var embedId = pGems[gem_pos];                    // 宝石id
            var confGem = conf_mgr.gConfGem[embedId];
            if (!confGem) { continue; }
            attrArr[confGem.type] += confGem.value;
        }
    }

    return attrArr;
}