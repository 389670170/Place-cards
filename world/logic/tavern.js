
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');

function Tavern() {
    // 热点招募相关
    this.nextUpdate = 0;                    // 下次更新时间
    this.day = 0;                           // 当前刷新日期
    this.limitHot = 0;                      // 当前热点武将
    this.dayHots = [0, 0, 0];               // 今日热点id

    // 名人招募相关
    this.luckList = [
        /*
        {
            uid: 0,                         // 玩家id
            card: 0,                        // 抽到橙卡次数
            time: 0,                        // 十连抽次数
        }
        */
    ];
}

Tavern.create = function (callback) {
    var tavern = {
        '_id': 'tavern',
        'next_update': 0,
        'day': 0,
        'limit_hot': 0,
        'day_hots': [0, 0, 0],
        'luck_list': [],
    };

    gDBWorld.insert(tavern, function (err, result) {
        callback && callback();
    });
};

Tavern.prototype = {
    init: function (callback) {
        gDBWorld.find({ _id: 'tavern' }).limit(1).next(function (err, doc) {
            if (doc) {
                this.nextUpdate = doc.next_update,
                    this.day = doc.day;
                this.limitHot = doc.limit_hot;
                this.dayHots = doc.day_hots;
                this.luckList = doc.luck_list ? doc.luck_list : this.luckList;

                callback && callback(true);
            } else {
                callback && callback(false);
            }
        }.bind(this));
    },

    save: function (callback) {
        var tavern = {
            _id: 'tavern',
            next_update: this.nextUpdate,
            day: this.day,
            limit_hot: this.limitHot,
            day_hots: this.dayHots,
            luck_list: this.luckList,
        };

        gDBWorld.save(tavern, function (err, result) {
            if (err) {
                ERROR(err);
                callback && callback(false);
            } else {
                callback && callback(true);
            }
        });
    },

    checkUpdate: function () {
        var updated = false;
        var today = getGameDate();
        if (this.day != today) {
            this.day = today;

            var weights = {};
            this.dayHots = [0, 0, 0];
            for (var id in conf_mgr.gConfTavernHot) {
                if (conf_mgr.gConfTavernHot[id].type != 2) {
                    continue;
                }

                weights[id] = conf_mgr.gConfTavernHot[id].hotWeight;
            }

            updated = true;
        }

        var now = common.getTime();
        if (now >= this.nextUpdate) {
            var timeOfToday = common.getTime(getGameDate());
            this.nextUpdate = timeOfToday + conf_mgr.gConfGlobal.resetHour * 3600 + conf_mgr.gConfGlobal.tavernLimitHotDay * 86400;

            var maxRound = 20;
            while (maxRound--) {
                this.limitHot++;

                if (conf_mgr.gConfTavernHot[this.limitHot].type != 1) {
                    this.limitHot = 1;
                }

                if (conf_mgr.gConfTavernHot[this.limitHot].hotRound == 1) {
                    break;
                }
            }

            updated = true;
        }

        if (updated) {
            this.save();
        }
    },

    getLuckInfo: function (uid) {
        // 查找uid对应的luck信息，供自我更新使用
        for (var i = 0, len = this.luckList.length; i < len; i++) {
            if (this.luckList[i].uid == uid) {
                return this.luckList[i];
            }
        }

        return null;
    },

    getHonorTopUid: function () {
        var top = this.luckList[0];
        if (top) {
            return top.uid;
        } else {
            return 0;
        }
    },

    getHonorTopUser: function () {
        var uid = this.getHonorTopUid();
        if (uid) {
            return gUserInfo.getHonorUser(uid);
        } else {
            return null;
        }
    },
};

exports.ten_tavern = function (req, res, resp, onReqHandled) {
    var uid = req.args.uid;
    var luckInfo = gTavern.getLuckInfo(uid);
    var newAddUid = 0;
    if (!luckInfo) {
        gTavern.luckList.push({
            uid: req.uid,
            card: req.args.count,
            time: 1,
        });
        newAddUid = uid;
    } else {
        luckInfo.card += req.args.count;
        luckInfo.time++;
    }

    gTavern.updateLuckList(newAddUid);

    onReqHandled(res, resp, 1);
};

exports.Tavern = Tavern;
