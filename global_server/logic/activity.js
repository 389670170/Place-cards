
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');

function Activity() {
    this.time = 0;                                  // 上次每日更新时间
    this.weekTime = 0;                              // 上次每周更新时间

    this.limitGroup = {
        end_time: 0,                              // 活动开启时间
        goods: {
            // id: 0,                               // 商品id: 已参团数量
        },
        buyer: {
            /*
                uid: {                                  // 玩家uid
                    id: 0,                              // 商品id: 参团数量
                },
             */
        },
    };

    this.luckyWheel = {
        end_time: 0,                                // 活动结束时间, 用于排行结算
        ranks: [/*uid, score, name, vip*/],   // 积分排行, 相同积分按照时间先后
    };

    this.promoteWheel = {
        end_time: 0,                                // 活动结束时间, 用于排行结算
        ranks: [/*uid, score, name, vip, time*/],   // 积分排行, 相同积分按照时间先后
    };

    // 内存数据
    this.updates = {};
    this.luckyWheelRanks = new RankTree(
        // 存储对象 [uid, score, time, name, vip]
        function (c1, c2) {
            // 同一个人作为相等, 用于删除
            if (c1[0] == c2[0]) return 0;

            // 不同人积分排先后
            if (c1[1] > c2[1]) return -1;
            if (c1[1] < c2[1]) return 1;
            return c1[0] < c2[0] ? -1 : 1;
        }
    );

    this.promoteWheelRanks = new RankTree(
        // 存储对象 [uid, score, time, name, vip]
        function (c1, c2) {
            // 同一个人作为相等, 用于删除
            if (c1[0] == c2[0]) return 0;

            // 不同人积分排先后
            if (c1[1] > c2[1]) return -1;
            if (c1[1] < c2[1]) return 1;
            return c1[4] < c2[4] ? -1 : 1;
        }
    );

}

Activity.create = function (callback) {
    var activityData = {
        '_id': 'activity',
        'time': 0,
        'week_time': 0,
        'limit_group': {
            'end_time': 0,
            'goods': {},
            'buyer': {},
        },
        'lucky_wheel': {
            'end_time': 0,
            'ranks': [],
        },
        'promote_wheel': {
            'end_time': 0,
            'ranks': [],
        },
    };

    gDBWorld.insert(activityData, function (err, result) {
        callback && callback();
    });
};

Activity.prototype = {
    init: function (callback) {
        gDBWorld.find({ _id: 'activity' }).limit(1).next(function (err, doc) {
            if (doc) {
                this.time = doc.time ? doc.time : 0;
                this.weekTime = doc.week_time ? doc.week_time : 0;
                this.limitGroup = doc.limit_group ? doc.limit_group : this.limitGroup;
                this.luckyWheel = doc.lucky_wheel ? doc.lucky_wheel : this.luckyWheel;
                this.promoteWheel = doc.promote_wheel ? doc.promote_wheel : this.promoteWheel;
                if (util.isArray(this.limitGroup.goods)) {
                    var oldGoods = this.limitGroup.goods;
                    this.limitGroup.goods = {};
                    for (var i = 0, len = oldGoods.length; i < len; i++) {
                        if (oldGoods[i]) {
                            this.limitGroup.goods[i] = oldGoods[i];
                        }
                    }
                }

                for (var i = 0, len = this.luckyWheel.ranks.length; i < len; i++) {
                    this.luckyWheelRanks.insert(this.luckyWheel.ranks[i]);
                }

                for (var i = 0, len = this.promoteWheel.ranks.length; i < len; i++) {
                    this.promoteWheelRanks.insert(this.promoteWheel.ranks[i]);
                }

                callback && callback(true);
            } else {
                callback && callback(false);
            }
        }.bind(this));
    },

    addUpdate: function (item, obj) {
        this.updates[item] = obj;
    },

    save: function (callback) {
        if (!this.updates || Object.keys(this.updates).length == 0) {
            callback && callback(true); return;
        }

        gDBWorld.update({ _id: 'activity' }, { $set: this.updates }, function (err, result) {
            if (err) {
                ERROR({ updates: this.updates, err: err });
                callback && callback(false);
            } else {
                callback && callback(true);
            }
            this.updates = {};
        }.bind(this));
    },

    resetByDay: function () {
        this.time = common.getTime();
        this.addUpdate('time', this.time);

        if (this.limitGroup.end_time && this.time >= this.limitGroup.end_time) {
            var goods = this.limitGroup.goods;
            var buyer = this.limitGroup.buyer;
            this.limitGroup.end_time = 0;
            this.limitGroup.goods = {};
            this.limitGroup.buyer = {};
            this.addUpdate('limit_group', this.limitGroup);

            // 请求各个服务器, 发放邮件
            var limitGroupReq = {
                mod: 'mail',
                act: 'add_limit_group_mails',
                uid: 1,
                seq: 0,
                args: {
                    goods: goods,
                    buyer: buyer,
                },
            };
            for (var sid in gServer.servers) {
                requestServer(sid, limitGroupReq, function (sid, resp) {
                    if (resp && resp.code == 0) {
                        LOG(sid + 'ADD LIMIT GROUP MAILS');
                    } else {
                        LOG(sid + 'ADD LIMIT GROUP MAILS FAIL');
                    }
                });
            }
        }

        var ranks = this.luckyWheel.ranks;
        if (this.luckyWheel.end_time && this.time >= this.luckyWheel.end_time) {
            var luckyWheelRanks = this.luckyWheel.ranks;
            this.luckyWheelRanks.erase();
            this.luckyWheel.end_time = 0;
            this.luckyWheel.ranks = [],
                this.addUpdate('lucky_wheel', this.luckyWheel);

            // 请求各个服务器, 发放邮件
            var luckyWheelReq = {
                mod: 'mail',
                act: 'add_lucky_wheel_mails',
                uid: 1,
                seq: 0,
                args: {
                    ranks: ranks,
                },
            };
            for (var sid in gServer.servers) {
                requestServer(sid, luckyWheelReq, function (sid, resp) {
                    if (resp && resp.code == 0) {
                        LOG(sid + 'ADD LIMIT GROUP MAILS');
                    } else {
                        LOG(sid + 'ADD LIMIT GROUP MAILS FAIL');
                    }
                });
            }
        }

        // 封将转盘结束
        var promoteRanks = this.promoteWheel.ranks;
        if (this.promoteWheel.end_time && this.time >= this.promoteWheel.end_time) {
            var promoteWheelRanks = this.promoteWheel.ranks;
            this.promoteWheelRanks.erase();
            this.promoteWheel.end_time = 0;
            this.promoteWheel.ranks = [],
                this.addUpdate('promote_wheel', this.promoteWheel);

            // 请求各个服务器, 发放邮件
            var promoteWheelReq = {
                mod: 'mail',
                act: 'add_promote_wheel_mails',
                uid: 1,
                seq: 0,
                args: {
                    ranks: promoteRanks,
                },
            };

            for (var sid in gServer.servers) {
                requestServer(sid, promoteWheelReq, function (sid, resp) {
                    if (resp && resp.code == 0) {
                        LOG(sid + 'ADD PROMOTE WHEEL MAILS');
                    } else {
                        LOG(sid + 'ADD PROMOTE WHEEL MAILS FAIL');
                    }
                });
            }
        }
    },

    resetByWeek: function () {
        this.weekTime = common.getTime();
        this.addUpdate('week_time', this.weekTime);
    },

    fixLuckyWheelRank: function () {
        var scores = {};
        var valid = true;
        var item = null;
        var iter = this.luckyWheelRanks.iterator();

        while ((item = iter.next()) != null) {
            if (scores[item[0]]) {
                if (valid) {
                    ERROR('ERROR LUCKY RANKS: ');
                    ERROR(this.luckyWheel.ranks);
                    valid = false;
                }
                scores[item[0]] = scores[item[0]][1] > item[1] ? scores[item[0]] : item;
            } else {
                scores[item[0]] = item;
            }
        }

        if (!valid) {
            this.luckyWheelRanks.erase();
            for (var uid in scores) {
                this.luckyWheelRanks.insert(scores[uid]);
            }
        }
    },

    fixPromoteWheelRank: function () {
        var scores = {};
        var valid = true;
        var item = null;
        var iter = this.promoteWheelRanks.iterator();

        while ((item = iter.next()) != null) {
            if (scores[item[0]]) {
                if (valid) {
                    ERROR('ERROR PROMOTE RANKS: ');
                    ERROR(this.promoteWheelRanks.ranks);
                    valid = false;
                }
                scores[item[0]] = scores[item[0]][1] > item[1] ? scores[item[0]] : item;
            } else {
                scores[item[0]] = item;
            }
        }

        if (!valid) {
            this.promoteWheelRanks.erase();
            for (var uid in scores) {
                this.promoteWheelRanks.insert(scores[uid]);
            }
        }
    },
};

exports.reset_time = function (req, res, resp, onReqHandled) {
    gActivity.time = 0;
    gActivity.weekTime = 0;
    gActivity.addUpdate('time', gActivity.time);
    gActivity.addUpdate('week_time', gActivity.weekTime);
};

exports.get_limit_group = function (req, res, resp, onReqHandled) {
    if (gActivity.limitGroup.end_time != req.args.end_time) {
        gActivity.limitGroup.end_time = req.args.end_time;
        gActivity.addUpdate('limit_group', gActivity.limitGroup);
    }
    resp.data.all_buy = gActivity.limitGroup.goods;
    resp.data.self_buy = gActivity.limitGroup.buyer[req.uid] || {};
    onReqHandled(res, resp, 1);
};

exports.buy_limit_group = function (req, res, resp, onReqHandled) {
    var id = req.args.id;
    var num = req.args.num;
    var limitGroup = gActivity.limitGroup;
    if (!limitGroup.goods[id]) {
        limitGroup.goods[id] = num;
    } else {
        limitGroup.goods[id] += num;
    }

    if (!limitGroup.buyer[req.uid]) {
        limitGroup.buyer[req.uid] = {};
    }
    if (!limitGroup.buyer[req.uid][id]) {
        limitGroup.buyer[req.uid][id] = num;
    } else {
        limitGroup.buyer[req.uid][id] += num;
    }

    gActivity.addUpdate('limit_group', limitGroup);
    onReqHandled(res, resp, 1);
};

exports.get_lucky_wheel = function (req, res, resp, onReqHandled) {
    if (gActivity.luckyWheel.end_time != req.args.end_time) {
        gActivity.luckyWheel.end_time = req.args.end_time;
        gActivity.addUpdate('lucky_wheel', gActivity.luckyWheel);
    }

    onReqHandled(res, resp, 1);
};

exports.get_lucky_wheel_rank = function (req, res, resp, onReqHandled) {
    var rankList = [];
    var iter = gActivity.luckyWheelRanks.iterator();
    var item = null;

    while ((item = iter.next()) != null) {
        var rank = {
            'uid': item[0],
            'score': item[1],
            'name': item[2],
            'vip': item[3],
        };
        rankList.push(rank);
    }

    resp.data.rank_list = rankList;
    onReqHandled(res, resp, 1);
};

exports.fix_lucky_wheel_rank = function () {
    gActivity.fixLuckyWheelRank();
    onReqHandled(res, resp, 1);
};

exports.get_promote_wheel = function (req, res, resp, onReqHandled) {
    if (gActivity.promoteWheel.end_time != req.args.end_time) {
        gActivity.promoteWheel.end_time = req.args.end_time;
        gActivity.addUpdate('promote_wheel', gActivity.promoteWheel);
    }

    onReqHandled(res, resp, 1);
};


exports.Activity = Activity;
