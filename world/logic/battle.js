
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const { reformAwards } = require('../../common/global.js');

function Battle() {
    this.city = {
        /*
            city_id: {
                owner: 0,                   // 太守的UID, 0代表没有太守
                double: 0,                  // 今日双倍活动标识
                time: 0,                    // 占领时的时间
                lock : 0,                   // 城池被打的时间
                last_uid : 0,               // 最近一次打过此城池的uid，用于判断是否战斗超时
                visit: 0,                   // 城池被访问时最近生成奖励的时间
                awards : [],                // 太守已经获得的奖励
            }
        */
    };
    this.lastLord = [0, 0, 0];         // 昨日太守结算数量

    this.selfLord = {
        /*
            uid: {
                owner: 0,                   // 太守的UID, 0代表没有太守
                double: 0,                  // 今日双倍活动标识
                time: 0,                    // 占领时的时间
                lock : 0,                   // 城池被打的时间
                last_uid : 0,               // 最近一次打过此城池的uid，用于判断是否战斗超时
                visit: 0,                   // 城池被访问时最近生成奖励的时间
                awards : [],                // 太守已经获得的奖励
            },
        */
    };

    this.balance = 0;                   // 上次结算时间

    // 内存数据
    this.updates = {};                  // 待更新数据
    this.deletes = {};                  // 待删除的单人太守
    this.userCity = {
        // uid: cid                     // 玩家id: 城池id
    };

    this.lord_count = [0, 0, 0];        // 记录三个国家的太守数
}

Battle.create = function (callback) {
    var battleData = {
        '_id': 'battle',
        'city': {},
        'last_lord': [0, 0, 0],
        'self_lord': {},
        'balance': 0,
    };

    var city = battleData.city;
    for (var id in conf_mgr.gConfCity) {
        city[id] = {
            'owner': 0,
            'time': 0,
            'lock': 0,
            'last_uid': 0,
            'visit': 0,
            'awards': [],
        };
    }

    gDBWorld.insert(battleData, function (err, result) {
        callback && callback();
    });

}

Battle.prototype = {
    init: function (callback) {
        // 读取地图信息
        gDBWorld.find({ _id: 'battle' }).limit(1).next(function (err, doc) {
            if (doc) {
                this.city = doc.city;
                this.lastLord = doc.last_lord || this.lastLord;
                if (!doc.self_lord) {
                    gDBWorld.update({ _id: 'battle' }, { $set: { 'self_lord': {} } }, function (err, result) {
                        if (err) {
                            ERROR(util.format('SAVE SELF_LORD: %j', err));
                            callback && callback(false);
                        } else {
                            this.selfLord = {};
                            this.balance = doc.balance || 0;
                            callback && callback(true);
                        }
                    });
                } else {
                    this.selfLord = doc.self_lord;
                    this.balance = doc.balance || 0;
                    callback && callback(true);
                }
            } else {
                callback && callback(false);
            }
        }.bind(this));
    },

    onWorldLoaded: function () {
        for (var id in this.city) {
            var country = gUserInfo.getUser(this.city[id].owner).info.country;
            if (country) {
                this.lord_count[country - 1]++;
            }
        }

        for (var id in this.city) {
            this.updateOwner(id);
            var owner = this.city[id].owner;
            if (owner) {
                this.userCity[owner] = +id;
            }
        }

        for (var uid in this.selfLord) {
            var country = gUserInfo.getUser(this.selfLord[uid].owner).info.country;
            if (country) {
                this.lord_count[country - 1]++;
            }
        }

        for (var uid in this.selfLord) {
            this.updateOwner(0, uid);
            if (this.selfLord[uid]) {
                this.userCity[uid] = 0;
            }
        }
    },

    initSelfLord: function (uid) {
        this.selfLord[uid] = {
            'owner': 0,
            'time': 0,
            'lock': 0,
            'last_uid': 0,
            'visit': 0,
            'awards': [],
        };

        return this.selfLord[uid];
    },

    markDirty: function (cid, uid) {
        if (cid == 0) {
            delete this.deletes['self_lord.' + uid];
            this.updates['self_lord.' + uid] = this.selfLord[uid];
        }

        this.updates['city.' + cid] = this.city[cid];
    },

    markDelete: function (uid) {
        this.deletes['self_lord.' + uid] = 1;
        delete this.updates['self_lord.' + uid];
    },

    save: function (callback) {
        var updates = this.updates;
        this.updates = {};
        var deletes = this.deletes;
        this.deletes = {};

        var modifiers = {};
        if (!Object.isEmpty(updates)) {
            modifiers['$set'] = updates;
        }
        if (!Object.isEmpty(deletes)) {
            modifiers['$unset'] = deletes;
        }

        if (Object.isEmpty(modifiers)) {
            callback && callback(true);
            return;
        }

        gDBWorld.update({ _id: 'battle' }, modifiers, function (err, result) {
            if (err) {
                ERROR(util.format('SAVE INVITE: %j %j %j', modifiers, err));
                callback && callback(false);
            } else {
                LOG(util.format('SAVE INVITE: %j', modifiers));
                callback && callback(true);
            }
        });
    },

    getCityTime: function (uid) {

        if (!this.userCity.hasOwnProperty(uid))
            return 0;
        var cid = this.userCity[uid];

        if (cid == 0)
            return this.selfLord[uid].time;
        if (this.city[cid])
            return this.city[cid].time;

        return 0;
    },

    updateOwner: function (id, uid) {
        var city = null;
        if (id == 0) {
            city = this.selfLord[uid];
        } else {
            city = this.city[id];
        }

        if (!city || !city.owner) {
            return;
        }

        var time = city.time;
        var now = common.getTime();
        // 到时间发奖励
        if (now - time > gConfGlobal.lordMaxHour * 3600) {
            var user = gUserInfo.getUser(city.owner);
            var awards = this.getOutput(id, user.status.level, uid);
            if (city.double) {
                awards = timeAwards(awards, 2, true);
            }

            var mail = {
                from: 3,
                title: 9,
                content: [11],
                awards: awards,
                time: now,
                expire: now + gConfGlobal.awardMailExpireDay * 3600 * 24,
            };

            gMail.add(city.owner, mail);

            delete this.userCity[city.owner];

            if (id) {
                city.owner = 0;
                city.time = 0;
                city.visit = 0;
                city.awards = [];
                this.markDirty(id, uid);
            } else {
                delete this.selfLord[uid];
                this.markDelete(uid);
            }

            if (user.info.country && id) {
                this.lord_count[user.info.country - 1]--;
            }
        }

        if (city.lock && now - city.lock >= gConfGlobal.lordFightMaxTime * 60) {
            city.lock = 0;
            this.markDirty(id, uid);
        }
    },
};

exports.get = function (req, res, resp, onReqHandled) {
    var cid = gBattle.userCity[req.uid];
    gBattle.updateOwner(cid, req.uid);
    resp.data.self = cid;
    resp.data.tips = gTips.getTips(req.uid);
    onReqHandled(res, resp, 1);
};

exports.get_lord_count = function (req, res, resp, onReqHandled) {
    resp.data.lord_count = gBattle.lord_count;
    onReqHandled(res, resp, 1);
};

exports.get_lord_list = function (req, res, resp, onReqHandled) {
    var city = gBattle.city;
    var cityInfos = {};
    for (var id in city) {
        gBattle.updateOwner(id);
        var city = gBattle.city[id];
        if (city.owner) {
            var user = gUserInfo.getUser(city.owner);
            cityInfos[id] = {
                'name': user.info.un,
                'country': user.info.country,
                'fight_force': user.fight_force,
                'time': city.time,
            };

            if (city.owner == req.uid) {
                resp.data.self = +id;
            }
        }
    }

    if (gBattle.selfLord[req.uid]) {
        var city = gBattle.selfLord[req.uid];
        var user = gUserInfo.getUser(city.owner);
        gBattle.updateOwner(0, req.uid);
        cityInfos[0] = {
            'name': user.info.un,
            'country': user.info.country,
            'fight_force': user.fight_force,
            'time': city.time,
        };

        if (city.owner == req.uid) {
            resp.data.self = 0;
        }
    }

    resp.data.lord = cityInfos;
    gBattle.save();
    onReqHandled(res, resp, 1);
};

exports.lord_get = function (req, res, resp, onReqHandled) {
    do {
        var cid = Math.floor(+req.args.id);
        gBattle.updateOwner(cid, req.uid);
        resp.data.self = gBattle.userCity[req.uid];

        var city = null;
        if (cid == 0) {
            city = gBattle.selfLord[req.uid];
        } else {
            city = gBattle.city[cid];
        }

        if (!city || !city.owner) {
            resp.data.owner = {}; break;
        }

        var owner = gUserInfo.getUser(city.owner);
        resp.data.owner = {
            'name': owner.info.un,
            'level': owner.status.level,
            'hid': owner.info.model,
            'fight_force': owner.fight_force,
            'time': city.time,
            'got': gBattle.getOutput(cid, null, req.uid),
            'promote': owner.info.promote,
            'weapon_illusion': owner.sky_suit.weapon_illusion,
            'wing_illusion': owner.sky_suit.wing_illusion,
        };
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.before_fight = function (req, res, resp, onReqHandled) {
    do {
        var cid = Math.floor(+req.args.id);
        var checked = 0;
        if (checked = gBattle.checkLord(cid, req.uid)) {
            resp.code = checked; resp.desc = 'locked or occupied'; break;
        }

        gBattle.city[cid].lock = common.getTime();
        gBattle.city[cid].last_uid = req.uid;
        gBattle.markDirty(cid, req.uid);
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.leave = function (req, res, resp, onReqHandled) {
    do {
        var cid = Math.floor(+req.args.id);
        gBattle.updateOwner(cid, req.uid);

        var city = null;
        if (cid == 0) {
            city = gBattle.selfLord[req.uid];
        } else {
            city = gBattle.city[cid];
        }

        if (city.owner != req.uid) {
            resp.code = 1; resp.desc = 'not lord'; break;
        }

        var now = common.getTime();
        var awards = gBattle.getOutput(cid, null, req.uid);
        if (city.double) {
            awards = timeAwards(awards, 2, true);
        }
        if (awards.length) {
            var mail = {
                from: 3,
                title: 9,
                content: [26],
                awards: awards,
                time: now,
                expire: now + conf_mgr.gConfGlobal.awardMailExpireDay * 3600 * 24,
            };
            gMail.add(req.uid, mail);
        }

        // 清空太守数据
        if (cid) {
            gBattle.lord_count[gUserInfo.getUser(req.uid).info.country - 1]--;
            city.owner = 0;
            city.time = 0;
            city.visit = 0;
            city.awards = [];
            gBattle.markDirty(cid, req.uid);
        } else {
            gBattle.markDelete(req.uid);
            delete gBattle.selfLord[req.uid];
        }

        delete gBattle.userCity[req.uid];
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.Battle = Battle;
