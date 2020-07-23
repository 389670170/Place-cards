
const logic_event_mgr = require('./logic_event_mgr.js');

/**
 * 第三方直充
 * @param {string} order_id                  // 订单号
 * @param {number} game_coin                 // 钻石数量
 * @param {number} bonus_game_coin           // 返利钻石数量，返利钻石需要用单独的邮件发放给玩家
 * @param {number} pay_time                  // 订单时间戳
 * @param {number} total_fee                 // 订单金额
 * @param {string} currency                  // 币种
 * @param {string} order_type                // 商品类型（也可理解为商品ID），没传或值为0的时候，根据game_coin参数发放对应数量的钻石/元宝；如为其它值，则发放特殊物品（如周卡/月卡/礼包）等，特殊物品的值可以跟开发人员商量定义
 * @param {number} is_sandbox                // 是否是测试订单
 */
exports.pay_direct_access = function (player, order_id, game_coin, bonus_game_coin, pay_time, total_fee, currency, order_type, is_sandbox) {
    total_fee = (total_fee - 0) || 0;
    game_coin = (game_coin - 0) || 0;
    bonus_game_coin = (bonus_game_coin - 0) || 0;
    var user = player.user;

    var gem_desc = "";
    var number = game_coin;
    player.memData.payAwards = player.memData.payAwards || [];
    if (game_coin) {
        gem_desc = "user.cash:" + game_coin;
        var specialAwardConf = parseAwardsConfig(gem_desc);
        var specialAward = player.addAwards(specialAwardConf, 'player', 'third_direct_pay');
        player.memData.payAwards = player.memData.payAwards.concat(specialAward.awards);
    }

    //user.payment.money += total_fee;
    //user.payment.day_money += total_fee;
    user.payment.day_paid = (user.payment.day_paid - 0) || 0;
    user.payment.paid = (user.payment.paid - 0) || 0;
    user.payment.day_paid += game_coin;
    user.payment.paid += game_coin;

    var gift_key = 0;
    var gift_id = 0;
    var t_order_type_list = [];
    if (order_type) {
        t_order_type_list = order_type.split("_");
    }
    if (t_order_type_list && t_order_type_list.length == 2) {
        gift_key = t_order_type_list[0];
        gift_id = t_order_type_list[1];
    }
    exports.pay(player, number, 0, 0, gift_key, gift_id, "third_pay", 0, total_fee);

    if (bonus_game_coin) {
        gem_desc = "user.bindcash:" + bonus_game_coin;
        var specialAwardConf = parseAwardsConfig(gem_desc);
        var now = common.getTime();
        var mail = {
            content: [1016, total_fee],
            awards: specialAwardConf,
            time: now,
            expire: now + conf_mgr.gConfMail[1016].time * OneDayTime,
        };

        requestWorldByModAndAct({ uid: user._id }, 'mail', 'add_mail', { mail: mail });
    }

    var phpReq = {                                                                          // 第三方订单，单独记录日志
        uid: player.uid,
        act: 'third_direct_pay' + (is_sandbox ? "_sandbox" : ""),
        args: {
            sid: config.DistId,
            openid: player.user.info.account,
            level: player.user.status.level,
            order: order_id || 0,
            amount: total_fee || 0,
            chargeId: 0,
            gift_key: gift_key,
            gift_id: gift_id,
            platform: player.user.info.platform,
            device_id: player.user.info.device_id,
        },
    };
    LogCollect(phpReq.uid, phpReq.act, phpReq.args);
};

exports.thirdPay = function (player, type, number, amt, order) {
    amt = (amt - 0) || 0;
    number = (number - 0) || 0;
    var user = player.user;
    user.payment.money = (user.payment.money - 0) || 0;
    user.payment.day_money = (user.payment.day_money - 0) || 0;
    user.payment.money += amt;
    user.payment.day_money += amt;
    if (type == 'cash') {
        user.payment.day_paid = (user.payment.day_paid - 0) || 0;
        user.payment.paid = (user.payment.paid) || 0;
        user.payment.day_paid += number;
        user.payment.paid += number;
        // user.status.vip_xp += number;
        // player.markDirty('status.vip_xp');
        // player.updateVip();
    }
    player.markDirty('payment');

    player.memData.chargeId = 0;
    player.addResource(type, number, 'player', 'third_pay');
    if (!player.memData.payAwards) {
        player.memData.payAwards = [['user', type, number]];
    } else {
        player.memData.payAwards.push(['user', type, number]);
    }

    if (type == 'cash') {
        exports.pay(player, number, 0, 0, 0, 0, "third_pay", 0, amt)

        // 第三方订单，单独记录日志
        var phpReq = {
            uid: player.uid,
            act: 'user_pay',
            args: {
                sid: config.DistId,
                openid: player.user.info.account,
                level: player.user.status.level,
                order: order || 0,
                amount: amt || 0,
                chargeId: 0,
                gift_key: 0,
                gift_id: 0,
                platform: player.user.info.platform,
                device_id: player.user.info.device_id,
            },
        };
        LogCollect(phpReq.uid, phpReq.act, phpReq.args);
    }

    pushToUser(player.uid, 'self', {
        mod: 'user',
        act: 'get_pay',
        args: {},
    });
    player.payNotify = true;
};

exports.pay = function (player, cash, chargeId, order, gift_key, gift_id, third_pay, fake, totle_fee) {
    var user = player.user;
    var extraCash = 0;
    var rechargeConf = conf_mgr.gConfRecharge[chargeId];
    var amount = totle_fee || 0;
    if (rechargeConf) {
        amount = rechargeConf.amount || amount;

        var payList = user.payment.pay_list;
        var payRecords = user.payment.pay_records;
        var payCount = payList[chargeId] || 0;
        var payFrequency = payRecords[chargeId] || 0; // first pay
        payCount += 1;
        payFrequency += 1;

        if (rechargeConf && (rechargeConf.type == 'weekCard' || rechargeConf.type == 'monthCard')) {

        } else {
            if (payCount == 1 || payFrequency == 1) {
                extraCash = rechargeConf.firstExtraAward
            } else {
                extraCash = rechargeConf.extraAward
            }
        }

        payRecords[chargeId] = payFrequency;
        payList[chargeId] = payCount;
        user.payment.day_paid += cash;
        user.payment.paid += cash;
        user.payment.last_pay_time = common.getTime();
        player.markDirty('payment');
    }

    amount = (amount - 0) || 0;
    if (amount) {
        user.payment.money += amount;
        user.payment.day_money += amount;
        //user.payment.paid += amount * 10;
        user.payment.last_pay_money = amount;
        player.markDirty('payment');
    }

    if (!player.memData.payAwards) {
        player.memData.payAwards = [];
    }

    if (cash != 0 && !third_pay) {
        player.addResource('cash', cash, 'player', 'pay');
        player.memData.payAwards.push(['user', 'cash', cash]);
    }

    // 记录一下本次充值获得的奖励
    player.memData.chargeId = chargeId;

    if (extraCash.length && extraCash[0][2] > 0) {
        player.addResource(extraCash[0][1], extraCash[0][2], 'player', 'pay');// 新加的
        player.memData.payAwards = player.memData.payAwards.concat(extraCash);
    }

    updateFirstPayProgress(player);

    if (rechargeConf && rechargeConf.type == 'month') {
        user.payment.gift_cash += extraCash[0][2];
        player.markDirty('payment.gift_cash');
    }

    if (rechargeConf && rechargeConf.type == 'weekCard') {
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'weekCard', 1);
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'doubleCard', 1);

        var specialAwardConf = parseAwardsConfig(conf_mgr.gConfGlobal.weekCardSpecialAward);
        var specialAward = player.addAwards(specialAwardConf, 'player', 'pay');
        player.memData.payAwards = player.memData.payAwards.concat(specialAward.awards);
    }

    if (rechargeConf && rechargeConf.type == 'monthCard') {
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'monthCard', 1);
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'doubleCard', 1);

        var specialAwardConf = parseAwardsConfig(conf_mgr.gConfGlobal.monthCardSpecialAward);
        var specialAward = player.addAwards(specialAwardConf, 'player', 'pay');
        player.memData.payAwards = player.memData.payAwards.concat(specialAward.awards);
    }

    if (rechargeConf && rechargeConf.type == 'longCard') {
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'longCard', 1);
        // logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'doubleCard', 1);
    }

    onPay(player, cash, chargeId, order, amount, gift_key, gift_id, third_pay, fake);
};

// 处理礼包购买
function handleGiftBuy(player, gift_key, gift_id) {
    var user = player.user;
    if (gift_key == 'avgiftbag') {
        var conf = conf_mgr.gConfGiftBag[gift_id];
        if (conf) {
            var awards = player.addAwards(conf.rewards);
            if (player.memData.payAwards) {
                player.memData.payAwards = player.memData.payAwards.concat(awards.awards);
            } else {
                player.memData.payAwards = awards.awards;
            }
            var giftBagData = user.activity.gift_bag[gift_id];
            if (giftBagData) {
                giftBagData.buy_count++;
                if (giftBagData.buy_count >= conf.count) {
                    giftBagData.sell_out_time = common.getTime();
                }
                player.markDirty(util.format('activity.gift_bag.%d', gift_id));
            }
        }
    } else if (gift_key == 'openseven') {
        var conf = conf_mgr.gConfOpenSevenReward[gift_id];
        if (conf) {
            // 检测是否在当天
            if (getCreateDaysFix(player) + 1 < conf.needday) {
                ERROR('===============' + player.getCreateDays());
                DEBUG(`${player.uid} ${gift_key} ${gift_id}, 充了值但是没有发奖励，因为他冲的不是当天的`);
                return;
            }
            var awards = player.addAwards(conf.award);
            if (player.memData.payAwards) {
                player.memData.payAwards = player.memData.payAwards.concat(awards.awards);
            } else {
                player.memData.payAwards = awards.awards;
            }

            user.activity.open_seven.progress[gift_id] = [1, 1];
            player.markDirty(util.format('activity.open_seven.progress.%d', gift_id));
        }
    } else if (gift_key == 'openholiday') {
        var conf = conf_mgr.gConfOpenHolidayReward[gift_id];
        if (conf) {
            var awards = player.addAwards(conf.award);
            if (player.memData.payAwards) {
                player.memData.payAwards = player.memData.payAwards.concat(awards.awards);
            } else {
                player.memData.payAwards = awards.awards;
            }

            if (!user.activity.open_holiday.progress[gift_id]) {
                user.activity.open_holiday.progress[gift_id] = [1, 1];
            } else {
                user.activity.open_holiday.progress[gift_id][1]++;
            }

            player.markDirty(util.format('activity.open_holiday.progress.%d', gift_id));
        }
    }
    else if (gift_key == "dragonmanual") {
        awards = player.addAwards(parseAwardsConfig(conf_mgr.gConfGlobal.avmanuallyVipExp));
        if (player.memData.payAwards) {
            player.memData.payAwards = player.memData.payAwards.concat(awards.awards);
        } else {
            player.memData.payAwards = awards.awards;
        }
    }
    else {
        switch (gift_key + "_" + gift_id) {
            case conf_mgr.gConfGlobal["avZerogiftGmRechargeid"]:
                awards = player.addAwards(parseAwardsConfig(conf_mgr.gConfGlobal["avZerogiftBuyAward"]));
                if (player.memData.payAwards) {
                    player.memData.payAwards = player.memData.payAwards.concat(awards.awards);
                } else {
                    player.memData.payAwards = awards.awards;
                }
                break;
            default:
                break;
        }
    }
};

function onPay(player, cash, chargeId, order, amount, gift_key, gift_id, third_pay, fake) {
    handleGiftBuy(player, gift_key, gift_id);

    logic_event_mgr.emit(logic_event_mgr.EVENT.ON_PAY, player, (cash - 0), chargeId, gift_key, gift_id, (amount - 0));

    var user = player.user;
    pushToUser(player.uid, 'self', {
        mod: 'user',
        act: 'get_pay',
        args: {},
    });
    player.payNotify = true;

    // 记录首次充值时间
    if (!user.mark.first_pay_time) {
        user.mark.first_pay_time = common.getTime();
        player.markDirty('mark.first_pay_time');
        user.mark.first_pay_cash = cash;
        player.markDirty('mark.first_pay_cash');

        //设备登陆日志
        DeviceLogCollect(player, 'first_pay', { first_pay: amount || 0, }, false);
    }


    user.status.vip_xp += cash;
    player.markDirty('status.vip_xp');

    player.updateVip();

    var phpReq = {
        uid: player.uid,
        act: 'user_pay',
        args: {
            sid: config.DistId,
            openid: player.user.info.account,
            level: player.user.status.level,
            order: order || 0,
            amount: amount || 0,
            chargeId: chargeId,
            gift_key: gift_key || 0,
            gift_id: gift_id || 0,
            platform: player.user.info.platform,
            device_id: player.user.info.device_id,
        },
    };

    if (!third_pay && !fake) {
        LogCollect(phpReq.uid, phpReq.act, phpReq.args);
    }

    player.doOpenSeven('pay', cash);
    player.doOpenSeven('payOnce', amount);

    player.doOpenHoliday('pay', cash);
    player.doOpenHoliday('payOnce', amount);

    // 超值礼包
    var now = common.getTime();
    var today = getGameDate();
    if (isActivityStart(player, 'value_package')) {
        var overvalued = player.user.activity.overvalued_gift;
        if (overvalued.day != today) {
            overvalued.day = today;
            overvalued.rewards = {};
            player.markDirty('activity.overvalued_gift');
        }

        for (var id in conf_mgr.gConfAvOvervaluedGiftId[getActivityOpenDay('value_package')]) {
            var conf = conf_mgr.gConfAvOvervaluedGiftId[getActivityOpenDay('value_package')][id];
            if (conf && !overvalued.rewards[id] && user.payment.day_money >= conf.money) {
                var mail = {
                    content: [1002, conf.money],
                    awards: conf.award,
                    time: now,
                    expire: now + conf_mgr.gConfMail[1002].time * OneDayTime,
                };

                requestWorldByModAndAct({ uid: user._id }, 'mail', 'add_mail', { mail: mail });

                overvalued.rewards[id] = 1;
                player.markDirty('activity.overvalued_gift.rewards.' + id);
            }
        }
    }

    // 单冲有礼
    if (isActivityStart(player, 'single_recharge')) {
        var singleRecharge = player.user.activity.single_recharge;
        if (singleRecharge.time != conf_mgr.gConfActivities['single_recharge'].startTime) {
            singleRecharge.time = conf_mgr.gConfActivities['single_recharge'].startTime;
            singleRecharge.rewards = {};
            singleRecharge.money = {};
            singleRecharge.progress = {};
            player.markDirty('activity.single_recharge');
        }

        for (var id in conf_mgr.gConfAvSingleRecharge) {
            var rechargeConf = conf_mgr.gConfRecharge[chargeId];
            var conf = conf_mgr.gConfAvSingleRecharge[id];
            if (rechargeConf.amount == conf.money) {
                if (!singleRecharge.progress[id]) {
                    singleRecharge.progress[id] = 1;
                } else {
                    singleRecharge.progress[id]++;
                }
                player.markDirty('activity.single_recharge.progress.' + id);
                //singleRecharge.money[id] = rechargeConf.amount;
                //player.markDirty('activity.single_recharge.money.' + id);
            }
        }
    }

    if (isActivityStart(player, 'day_recharge')) {
        var day_recharge = user.activity.day_recharge;
        var passedDay = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime)) + 1;
        if (common.GLOBAL_SERVER_INFO_DICT.serverStartDate > common.getTime(20190424) || passedDay > 7) {//这样写,是因为这个活动之前 是没有重置数据
            if (!day_recharge || !day_recharge.open_day || day_recharge.open_day != conf_mgr.gConfActivities['day_recharge'].startTime) {
                user.activity.day_recharge = {
                    'open_day': conf_mgr.gConfActivities['day_recharge'].startTime,                      // 活动开启时间
                    'dayCount': 0,                      // 累计充值次数
                    'today_status': 0,                   //今天任务是否完成
                    'day_paid': 0,                       //今天已经充值数
                    'reward': {                         // 领奖状态
                        // day: 1,                      // 已领取天数: 1
                    },
                };
                day_recharge = user.activity.day_recharge;
                player.markDirty('activity.day_recharge');
            }
        }
        day_recharge.day_paid += cash;
        if (day_recharge.day_paid >= conf_mgr.gConfGlobal.day_rechargeDailyBuyGoldenDiamond) {
            if (day_recharge.today_status == 0) {
                day_recharge.today_status = 1;
                day_recharge.dayCount++;
            }
        }
        player.markDirty('activity.day_recharge');
    }

    // 累冲豪礼
    if (isActivityStart(player, 'accumulate_recharge')) {
        var accumulateRecharge = player.user.activity.accumulate_recharge;
        // var rechargeConf = conf_mgr.gConfRecharge[chargeId];
        accumulateRecharge.paid += cash;
        player.markDirty('activity.accumulate_recharge.paid');
        for (var id in conf_mgr.gConfAvAccumulateRecharge) {
            var conf = conf_mgr.gConfAvAccumulateRecharge[id];
            if (accumulateRecharge.paid > conf.needRechargeGoldNumber
                && !accumulateRecharge.rewards[id]) {
                player.addTip('accumulate_recharge');
                break;
            }
        }
    }

    player.doOpenHoliday('paid', cash);
    // 充值专享
    if (isActivityStart(player, 'pay_only')) {
        var payOnly = player.user.activity.pay_only;
        var openDay = getGameDate(conf_mgr.gConfActivities['pay_only'].startTime);
        if (payOnly.day != openDay) {
            payOnly.day = openDay;
            payOnly.paid = 0;
            payOnly.award = [];
            payOnly.buy = {};
            player.markDirty('activity.pay_only');
        }

        payOnly.paid += cash;
        player.markDirty('activity.pay_only.paid');
    }

    // 积分兑换充值获取积分
    if (isActivityStart(player, 'exchange_points')) {
        var exchangePoints = player.user.activity.exchange_points;
        if (exchangePoints.time < conf_mgr.gConfAvExchangePointsTime[1].startTime) {
            exchangePoints.time = conf_mgr.gConfAvExchangePointsTime[1].startTime;
            exchangePoints.interval = 0;
            exchangePoints.progress = {};
            exchangePoints.rewards = {};
            player.markDirty('activity.exchange_points');
        }

        var payCash = 'payCash';
        for (var id in conf_mgr.gConfAvExchangePointsKey[payCash]) {
            if (cash >= conf_mgr.gConfAvExchangePointsId[id].target && !exchangePoints.progress[payCash]) {
                player.getExchangePointsProgress('payCash', cash);
            }
        }
    }

    //每日特惠
    if (isActivityStart(player, 'day_vouchsafe')) {
        var vouchsafe = player.user.activity.day_vouchsafe;
        if (!vouchsafe || vouchsafe.time != conf_mgr.gConfActivities['day_vouchsafe'].startTime) {
            vouchsafe = player.user.activity.day_vouchsafe = {
                time: conf_mgr.gConfActivities['day_vouchsafe'].startTime,
                day_pay: today,
                day_money: 0,
                rewards: [],
            };
        }

        if (vouchsafe.day_pay != today) {
            vouchsafe.day_money = 0;
            vouchsafe.day_pay = today;
        }

        var voupayold = vouchsafe.day_money;
        vouchsafe.day_money += amount;
        player.markDirty('activity.day_vouchsafe');
    }

    if (isActivityStart(player, 'sign_high')) {
        sign_high.on_pay(player, cash)
    }

    if (cash > 0) {
        act_month_rebate.on_pay(player, cash);
    }
};

function updateFirstPayProgress(player) {
    var user = player.user;
    var rewardedFistPay = user.activity.rewarded_first_pay;
    for (var avFirstPay in conf_mgr.gConfAvFirstPay) {        // 判断首冲活动红点
        if (rewardedFistPay.indexOf(avFirstPay['id']) < 0) {
            if (avFirstPay['pay'] <= user.payment.paid) {
                player.addTip('first_pay');
                break;
            }
        }
    }
};

function getCreateDaysFix(player) {
    var createDate = getGameDate(player.user.info.create)
    var today = common.getDate();
    return common.getDateDiff(createDate, today);
};