
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { isModuleOpen_new } = require('../../common/global.js');

exports.get_hero = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'jadeSeal')) {
            resp.code = 1; resp.desc = 'progress not reached'; break;
        }

        var star = +req.args.star;
        var index = +req.args.index;
        if (!conf_mgr.gConfJadeSealHero[star] || star > player.memData.all_star) {
            resp.code = 1; resp.desc = 'star error'; break;
        }

        var jadeSealHero = user.jade_seal_hero;
        if (jadeSealHero[star]) {
            resp.code = 1; resp.desc = 'has got'; break;
        }

        if (!conf_mgr.gConfJadeSealHero[star].awards[index - 1]) {
            resp.code = 1; resp.desc = 'index error'; break;
        }

        resp.data.awards = player.addAwards([conf_mgr.gConfJadeSealHero[star].awards[index - 1]], req.mod, req.act);
        jadeSealHero[star] = 1;
        player.markDirty('jade_seal_hero.' + star);

    } while (false);
    onHandled();
};

exports.get_awards = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'jadeSeal')) {
            resp.code = 1; resp.desc = 'progress not reached'; break;
        }

        var jadeId = +req.args.jadeId;
        if (!conf_mgr.gConfJadeSeal[jadeId]) {
            resp.code = 1; resp.desc = 'jadeId error'; break;
        }

        if (player.memData.all_star < conf_mgr.gConfJadeSeal[jadeId].star) {
            resp.code = 1; resp.desc = 'star not enough'; break;
        }

        var jadeSeal = user.jade_seal;
        if (jadeSeal[jadeId]) {
            resp.code = 1; resp.desc = 'has unlocked'; break;
        }

        var unlock = conf_mgr.gConfJadeSeal[jadeId].unlock;
        if (!isNaN(unlock)) {
            var newHid = +user.hero_bag.heros[1].rid + 1000;
            if (conf_mgr.gConfHero[newHid]) {
                user.hero_bag.heros[1].rid = newHid;
                player.markDirty('hero_bag.heros.1.rid');
                player.markFightForceChangedAll();

                var star = player.getHeroStar(1);
                logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, player, 'roleQuality', 1, star);
                player.doOpenSeven('roleQuality', 1, star);
                player.doOpenHoliday('roleQuality', 1, star);
            }
        }

        jadeSeal[jadeId] = 1;
        player.markDirty('jade_seal.' + jadeId);
        resp.data.awards = player.addAwards(conf_mgr.gConfJadeSeal[jadeId].awards, req.mod, req.act);
    } while (false);

    onHandled();
};
