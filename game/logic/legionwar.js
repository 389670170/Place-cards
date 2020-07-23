
const util = require('util');
const clone = require('clone');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const { LEGIONWAR_ErrorCode } = require('../../common/error.js');
const { ServerName } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');

// 获取主界面信息
exports.get_main_page_info = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'Call this method after legion.get';
        onHandled();
        return;
    }
    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'legion', 1);
        }
        onHandled();
    });
};

// 获取战斗界面信息
exports.get_battle_page_info = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'Call this method after legion.get';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            resp.data.own_cards = player.user.legionwar.cards;
        }
        onHandled();
    });

};

// 获取城池数据
exports.get_city_info = function (player, req, resp, onHandled) {
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }
    if (isNaN(player.memData.legion_id)) {
        resp.code = 1; resp.desc = 'Call this method after legion.get';
        onHandled();
        return;
    }

    if (!req.args.city) {
        resp.code = 1; resp.desc = 'city MUST be exist';
        onHandled();
        return;
    }

    if (!(req.args.city instanceof Array)) {
        resp.code = 1; resp.desc = 'city MUST be Number or Array';
        onHandled();
        return;
    }

    req.args.hidd_dark = (req.args.lid != player.memData.legion_id);
    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {

            let reqL = {
                uid: req.uid,
                act: 'get_city_buf_speed',
                mod: 'api',
                args: {
                    lid: player.memData.legion_id,
                }
            }

            let respL = {
                code: 0,
                desc: "",
            }

            requestLegionWar(reqL, respL, function () {
                if (respL.code == 0) {
                    resp.data.speed = respL.data.speed;
                } else {
                    resp.data.speed = 0;
                    resp.code = respL.code;
                    resp.desc = respL.desc + ' get_city_buf_speed failed';
                }

                onHandled();
            });
        } else {
            onHandled();
        }
    });
};

// 城池增驻
exports.upgrade_citybuf = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid) || isNaN(req.args.city)) {
        resp.code = 1; resp.desc = 'invalid args';
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

exports.cancel_citybuf = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid) || isNaN(req.args.city)) {
        resp.code = 1; resp.desc = 'invalid args';
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

// 把玩家驻守到城池
exports.add_city_force = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid) || isNaN(req.args.city)
        || isNaN(req.args.arm) || isNaN(req.args.arm_uid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        onHandled();
    });
};

// 把玩家从城池移除
exports.remove_city_force = function (player, req, resp, onHandled) {
    if (isNaN(req.args.lid) || isNaN(req.args.city) || isNaN(req.args.arm_uid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        onHandled();
    });
};

// 购买魔法卡
exports.buy_card = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.card) || !req.args.type) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }
        var cardId = req.args.card;
        var cardConf = conf_mgr.gConfLegionWarCityCard[cardId];
        if (!cardConf) {
            resp.code = 1; resp.desc = 'No such card'; break;
        }

        var num = req.args.num; // 购买数量
        if (!num || num < 1) {
            resp.code = 1; resp.desc = 'invalid num'; break;
        }
        var costType = req.args.type;
        var costs = [];
        if (costType == 'legionwar') {
            costs = clone(cardConf['legionUserCost']);
        } else if (costType == 'mixcash') {
            costs = clone(cardConf['mixCashCost']);
        } else {
            resp.code = 1; resp.desc = 'unknow cost type'; break;
        }

        if (costs.length > 0) {
            for (var i = 0; i < costs.length; i++) {
                costs[i][2] *= num;
            }
        }

        if (costs.length > 0) {
            if (!player.checkCosts(costs)) {
                resp.code = 1; resp.desc = 'cost not enough'; break;
            }
        } else {
            resp.code = 1; resp.desc = 'cost type err'; break;
        }

        user.legionwar.cards[cardId] = isNaN(user.legionwar.cards[cardId]) ? num : user.legionwar.cards[cardId] + num;
        player.markDirty('legionwar.cards');
        resp.data.costs = player.addAwards(costs, req.mod, req.act);

    } while (false);

    onHandled();
};

// 使用魔法卡
exports.use_card = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (isNaN(req.args.card) || !req.args.hasOwnProperty('target')) {
            resp.code = 1; resp.desc = 'invalid args'; break;
        }

        req.args.lid = player.memData.legion_id;
        if (isNaN(req.args.lid)) {
            resp.code = 1; resp.desc = 'has not legion'; break;
        }

        var cardId = req.args.card;
        var cardConf = conf_mgr.gConfLegionWarCityCard[cardId];
        if (!cardConf) {
            resp.code = LEGIONWAR_ErrorCode.ERROR_NO_SUCH_CARD; resp.desc = 'No such card'; break;
        }

        var cardCount = user.legionwar.cards[cardId] || 0;
        if (cardCount <= 0) {
            resp.code = LEGIONWAR_ErrorCode.ERROR_CARD_NOT_ENOUGH; resp.desc = 'Card not enough'; break;
        }

        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            if (resp.code == 0) {
                user.legionwar.cards[cardId]--;
                player.markDirty('legionwar.cards');
            }
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

// 攻击敌方玩家
exports.attack_arm = function (player, req, resp, onHandled) {
    var user = player.user;
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.city) || isNaN(req.args.arm)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    var cardId = req.args.card;
    if (cardId && cardId > 0) {
        var cardConf = conf_mgr.gConfLegionWarCityCard[cardId];
        if (!cardConf) {
            resp.code = 1; resp.desc = 'No such card';
            onHandled();
            return;
        }

        var cardCount = user.legionwar.cards[cardId] || 0;
        if (cardCount <= 0) {
            resp.code = 1; resp.desc = 'Card not enough';
            onHandled();
            return;
        }
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            player.memData.status = 'prepare_legionwar';
            player.memData.rand1 = resp.data.rand1;
            player.memData.rand2 = resp.data.rand2;
            player.memData.fight_info = resp.data.info;
            player.memData.fight_enemy = resp.data.enemy;

            player.memData.legionwar_enemy_city = req.args.city;
            player.memData.legionwar_enemy_arm = req.args.arm;

            var randPos = common.randRange(1, player.memData.pos_count);
            var randAttrs = common.randArrayWithNum(AttributeIds, 3);
            resp.data.fight_time = player.memData.fight_time = common.getTime();
            resp.data.rand_pos = player.memData.rand_pos = randPos;
            resp.data.rank_attrs = player.memData.rand_attrs = randAttrs;

            if (cardId && cardId > 0) {
                user.legionwar.cards[cardId]--;
                player.markDirty('legionwar.cards');
            }
        }
        onHandled();
    });
};

// 战斗结束
exports.fight = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        // 状态检查
        if (player.memData.status != 'prepare_legionwar') {
            resp.code = 1; resp.desc = 'status error'; break;
        }

        var power = Math.floor(req.args.power);
        if (isNaN(power)) {
            resp.code = 1; resp.desc = 'in valid power'; break;
        }

        // 参数检查
        req.args.lid = player.memData.legion_id;
        if (req.args.city != player.memData.legionwar_enemy_city) {
            resp.code = 1; resp.desc = 'error enemy city'; break;
        }
        if (req.args.arm != player.memData.legionwar_enemy_arm) {
            resp.code = 1; resp.desc = 'error enemy arm'; break;
        }

        // 请求数据
        req.args.power = power;
        requestWorld(req, resp, function () {
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
            if (resp.code == 0) {
                var atkAward = [];
                if (+req.args.star > 0) {
                    atkAward = conf_mgr.gConfLegionWarCity[+req.args.city].award1;
                } else {
                    atkAward = conf_mgr.gConfLegionWarCity[+req.args.city].award2;
                }
                resp.data.awards = player.addAwards(atkAward, req.mod, req.act);
            }
            onHandled();
        });
        return;
    } while (false);
    onHandled();
};

// 获取玩家参战奖励数据
exports.get_user_fightnum_info = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

// 领取玩家参战奖励
exports.get_user_fightnum_award = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid) || isNaN(req.args.attackCount)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    var awardConf = conf_mgr.gConfLegionWarAttackAward[req.args.attackCount];
    if (!awardConf) {
        resp.code = 1; resp.desc = 'no such conf';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            // 发奖
            resp.data.awards = player.addAwards(awardConf.award, req.mod, req.act);
        }
        onHandled();
    });
};

// 领取城池奖励
exports.get_city_award = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.city)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        if (resp.code == 0) {
            var cityConf = conf_mgr.gConfLegionWarCity[+req.args.city];

            // 城池奖励
            resp.data.awards = player.addAwards(cityConf.award, req.mod, req.act);
        }
        onHandled();
    });
};

// 获取历史战绩
exports.get_history = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

// 获取本服排行榜
exports.get_server_ranklist = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

// 获取全服排行榜
exports.get_world_ranklist = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

// 获取段位数据
exports.get_rank_info = function (player, req, resp, onHandled) {
    req.args.lid = player.memData.legion_id;
    if (isNaN(req.args.lid)) {
        resp.code = 1; resp.desc = 'invalid args';
        onHandled();
        return;
    }

    requestWorld(req, resp, onHandled);
    // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
};

exports.shop_buy = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!req.args.id || isNaN(req.args.id)) {
            resp.code = 1; resp.desc = 'no id'; break;
        }

        var id = Math.floor(+req.args.id);
        var type = req.args.type;

        var shopType = ShopType.LEGIONWAR;
        var legionWarShop = user.shop[shopType];

        if (!legionWarShop.goods[id]) {
            resp.code = 1; resp.desc = 'id error'; break;
        }
        var good = legionWarShop.goods[id];
        if (good[1]) {
            resp.code = 1; resp.desc = 'has bought'; break;
        }

        var costId = good[0];
        var costs = conf_mgr.gConfShop[id]['cost' + costId];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'something not enough'; break;
        }

        var awards = conf_mgr.gConfShop[id].get;
        if (awards[0][0] == 'equip') {
            awards = [['equip', good[2], good[3], 1]];
        }

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(awards, req.mod, req.act);
        good[1] = 1;
        player.markDirty(util.format('shop.%d.goods.%d', shopType, id));

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'shopBuy', 1);
    } while (false);

    onHandled();
};

exports.get_accumulate_legion_war = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        req.mod = 'api';

        requestLegionWar(req, resp, function () {
            if (resp.code == 0) {
                // TODO: 统一字段名
                player.addAwards(resp.data.award);
            }
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

// 获取自身当前增筑速度
exports.get_city_buf_speed = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        req.mod = 'api';
        req.args.lid = player.memData.legion_id;

        requestLegionWar(req, resp, function () {
            if (resp.code == 0) {

            }
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};

// 立即计算城池的增筑值
exports.update_city_buf = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        req.mod = 'api';
        req.args.lid = player.memData.legion_id;

        requestLegionWar(req, resp, function () {
            if (resp.code == 0) {

            }
            onHandled();
        });
        return;
    } while (false);

    onHandled();
};
