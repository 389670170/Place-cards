
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');

exports.get = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var shop = user.shop[ShopType.MARKET];
        var today = common.getDate(common.getTime() - conf_mgr.gConfGlobal.resetHour * 3600);
        if (shop.day != today) {
            shop.day = today;
            shop.goods = {};
            player.markDirty('shop.' + ShopType.MARKET);
        }

        resp.data.shop = shop.goods;
    } while (false);

    onHandled();
};

exports.buy = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var id = req.args.id;
        var itemConf = conf_mgr.gConfMarket[id];
        if (!itemConf) {
            resp.code = 1; resp.desc = "invalid id"; break;
        }

        var num = Math.floor(req.args.num);
        if (isNaN(num) || num < 1) {
            resp.code = 1; resp.desc = "invalid num"; break;
        }

        var shop = user.shop[ShopType.MARKET];
        var today = common.getDate(common.getTime() - conf_mgr.gConfGlobal.resetHour * 3600);
        if (shop.day != today) {
            resp.code = 1; resp.desc = "not refresh"; break;
        }

        var userLevel = user.status.level;
        if (userLevel < itemConf.lowLevel || userLevel > itemConf.highLevel) {
            resp.code = 1; resp.desc = "not match level"; break;
        }

        var buyLimit = itemConf['vip' + user.status.vip];
        var buyCount = shop.goods[id] ? shop.goods[id] : 0;
        if (buyLimit && buyCount >= buyLimit) {
            resp.code = 1; resp.desc = "buy limit"; break;
        }

        var cashCost = 0;
        cashCost = itemConf.originPrice * num;

        var costs = [['user', 'cash', -cashCost]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = "not enough cash"; break;
        }

        shop.goods[id] = buyCount + num;
        player.markDirty(util.format('shop.%d.goods.%d', ShopType.MARKET, id));

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'shopBuy', num);
        resp.data.costs = player.addAwards(costs, req.mod, req.act);
        resp.data.awards = player.addAwards(timeAwards(itemConf.award, num), req.mod, req.act);
    } while (false);

    onHandled();
};
