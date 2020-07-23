
const { TEAMZONE_ErrorCode } = require('../../common/error.js');
const conf_mgr = require('../../common/conf_mgr.js');

// 获取整体信息
exports.get_info = function (player, req, resp, onHandled) {
    resp.data.info = getCustomWealData(player);
    onHandled();
};

// 领取奖励
exports.get_award = function (player, req, resp, onHandled) {
    var user = player.user;
    var vipSelect = req.args.vip;

    do {
        if (isNaN(vipSelect) || (vipSelect != 1 && vipSelect != 2)) {
            resp.code = 1; resp.desc = 'arges error'; break;
        }

        var customWeal = player.user.custom_weal;
        var cash = 0;
        if (vipSelect == 1) {
            if (user.status.vip < conf_mgr.gConfGlobal.customWealLimitVipFirst) {
                resp.code = 2; resp.desc = 'vip limited too'; break;
            }
        } else {
            if (user.status.vip < conf_mgr.gConfGlobal.customWealLimitVip) {
                resp.code = 1; resp.desc = 'vip limited'; break;
            }
            cash = customWeal.vip2;
        }

        cash = customWeal['vip' + vipSelect];

        var rewards = [['user', 'bindcash', cash]];
        customWeal['vip' + vipSelect] = 0;
        customWeal.total += cash;
        resp.data.awards = player.addAwards(rewards, req.mod, req.act);
        resp.data.info = player.user.custom_weal;

        player.markDirty('custom_weal');

    } while (false);

    onHandled();
};



// 冒险赢钻石
function getCustomWealData(player) {
    var custom_weal = player.user.custom_weal;
    if (!custom_weal || !custom_weal.hasOwnProperty('vip1')) {
        custom_weal = {
            'total': 0, // yjinglingqu le
            'vip1': 0,  // leiji yuanbao
            'vip2': 0,
        };
        player.user.custom_weal = custom_weal;
        player.markDirty('custom_weal');
    }
    return custom_weal;
};