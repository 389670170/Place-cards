
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { ServerName } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');
const { parseAwardsConfig, isModuleOpen_new } = require('../../common/global.js');

exports.get = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {

        }
        onHandled();
    });
};

exports.apply = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

// 一键申请
exports.apply_all = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.handle_apply = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.agree_all_apply = function (player, req, resp, onHandled) {
    var user = player.user;

    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.remove_apply = function (player, req, resp, onHandled) {
    var user = player.user;

    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.applyByName = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.get_user = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.recommend = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.remove = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.give_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'friendGive', 1);
        }
        onHandled();
    });
};

exports.giveall_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        onHandled();
    });
};

exports.get_gift = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            var awards = parseAwardsConfig(conf_mgr.gConfGlobal['friendGift']);
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
        }
        onHandled();
    });
};

exports.getall_gift = function (player, req, resp, onHandled) {
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            var awards = parseAwardsConfig(conf_mgr.gConfGlobal['friendGift']);
            awards[0][2] *= resp.data.getNum;
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
        }
        onHandled();
    });
};

exports.deal_gift = function (player, req, resp, onHandled) {
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            var awards = parseAwardsConfig(conf_mgr.gConfGlobal['friendGift']);
            awards[0][2] *= resp.data.getNum;
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'friendGive', 1);
            resp.data.awards = player.addAwards(awards, req.mod, req.act);
        }
        onHandled();
    });
};

exports.challenge = function (player, req, resp, onHandled) {
    if (req.uid == req.args.enemy) {
        resp.code = 1; resp.desc = 'fight self';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            player.memData.rand1 = resp.data.rand1;
            player.memData.enemy_id = +req.args.enemy;
            player.memData.rand2 = resp.data.rand2;
            player.memData.fight_info = resp.data.info;
            player.memData.fight_enemy = resp.data.enemy;

            var randPos = common.randRange(1, player.memData.pos_count);
            var randAttrs = common.randArrayWithNum(AttributeIds, 3);
            resp.data.fight_time = player.memData.fight_time = common.getTime();
            resp.data.rand_pos = player.memData.rand_pos = randPos;
            resp.data.rank_attrs = player.memData.rand_attrs = randAttrs;
        }
        onHandled();
    });
};

exports.get_enemy = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            player.memData.status = 'prepare_friendboss';
        }
        onHandled();
    });
};

exports.get_boss = function (player, req, resp, onHandled) {
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.before_fight = function (player, req, resp, onHandled) {
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    if (player.memData.status != 'prepare_friendboss') {
        resp.code = 1; resp.desc = 'status error';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            player.memData.status = 'fight_friendboss';
            var rand = Math.floor(common.randRange(100000, 999999));
            player.memData.rand = rand;
            resp.data.rand = rand;
        }
        onHandled();
    });
};

exports.fight = function (player, req, resp, onHandled) {
    var user = player.user;
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    if (player.memData.status != 'fight_friendboss') {
        resp.code = 1; resp.desc = 'status error';
        onHandled();
        return;
    }

    // TODO 战斗校验
    var damage = req.args.damage;
    if (!util.isArray(damage)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    var validDamage = true;
    for (var i = 0, len = damage.length; i < len; i++) {
        if (isNaN(damage[i])) {
            validDamage = false;
            break;
        }
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            player.memData.status = 'idle';
            var dropId = resp.data.dropId;
            var dropAwards = generateDrop(dropId);
            resp.data.awards = player.addAwards(dropAwards, req.mod, req.act);
        }
        onHandled();
    });
};

exports.rank_list = function (player, req, resp, onHandled) {
    if (!isModuleOpen_new(player, 'friend')) {
        resp.code = 1; resp.desc = 'not open';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};
