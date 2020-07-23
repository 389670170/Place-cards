
const clone = require('clone');
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');

function Arena() {
    this.lastRanks = {};                        // 昨日排名 uid : rank
    this.ranks = {};                            // 排名 rank : uid

    this.users = {};                            // 排名 uid : rank
    this.ai = 0;                                // 排名自增值
    this.playerCount = {};                      // 记录每个榜的人数，包括机器人

    this.robotNameIds = {};
    this.robots = {                            // 机器人具体信息
        /*
        id : {
            un : '',
            headpic : '',
            level : 0,
            pos : {
                1 : {
                    hid : 0,
                    slot : 0,
                    attr : {}
                    fight_force : 0,
                    soldier_level : 1,
                }
            },
        }
        */
    };

    this.reports = {                            // 战报
        /*
        uid : [
            [time, type, enemyid, rankdiff, replay]     // type: 0未开始, 1逃跑, 2打赢, 3打输, 4被打赢, 5被打输
        ]
        */
    };

    this.updates = { '$set': {}, '$unset': {} };
    this.balance = 0;                           // 上次结算时间

    this.servers = {                    // 链接到此服World服
        // sid: [ip, port],             // 服务器ID: [地址, 端口]
    };

    this.dirty = {};
}

Arena.create = function (callback) {
    var arenaData = {
        '_id': 'arena',
        'last_ranks': {},
        'ranks': {},
        'robots': {
            // uid : nameid,
        },
        'reports': {},
        'ai': 0,
        'balance': 0,
        'playerCount': {},
        'servers': {},
    };

    //  初始化6个榜
    for (var i = 1; i <= ArenaTypeMax; i++) {
        arenaData.last_ranks[i] = {};
        arenaData.ranks[i] = {};
        arenaData.playerCount[i] = 0;
    }

    var maxId = Object.keys(conf_mgr.gConfName).max();
    for (var i = 1; i <= ArenaTypeMax; i++) {
        if (!isCrossArena(i))
            continue;   // 跨服不创建本服竞技场机器人

        for (var j = 1; j <= 10000; j++) {
            var firstId = common.randRange(1, maxId);
            var secondId = common.randRange(1, maxId);
            var male = common.randArray([0, 1]);
            arenaData.ai++;
            arenaData.robots[arenaData.ai] = firstId * 100000 + secondId * 10 + male;
            arenaData.ranks[i][j] = arenaData.ai;
            arenaData.playerCount[i]++;
        }
    }

    gDBWorld.insert(arenaData, function (err, result) {
        callback && callback();
    });
};

Arena.prototype = {
    init: function (callback) {
        gDBWorld.find({ _id: 'arena' }).limit(1).next(function (err, doc) {
            if (doc) {
                this.ranks = doc.ranks;
                this.last_ranks = doc.last_ranks;

                this.ai = doc.ai;
                this.balance = doc.balance;
                this.playerCount = doc.playerCount;
                this.reports = doc.reports;

                if (!this.playerCount) {
                    this.playerCount = {};
                    for (var i = 1; i <= ArenaTypeMax; i++) {
                        this.playerCount[i] = 0;
                    }

                    this.markDirty('playerCount');
                }

                this.servers = doc.servers;
                if (!this.servers) {
                    this.servers = {};
                    this.markDirty('servers');
                }

                this.robotNameIds = doc.robots;

                var _me = this;
                setTimeout(function () {
                    _me.buildUserRankList();
                }, 5000);

                callback && callback(true);
            } else {
                callback && callback(false);
            }
        }.bind(this));
    },

    // 初始化玩家排名表
    buildUserRankList: function () {
        DEBUG('buildUserRankList begin');
        for (var i = 1; i <= ArenaTypeMax; i++) {
            if (this.ranks[i]) {
                for (var rank in this.ranks[i]) {
                    var uid = this.ranks[i][rank];
                    if (uid > 0) {
                        this.users[uid] = {};
                        this.users[uid].type = i;
                        this.users[uid].rank = +rank;
                    }
                }
            }
        }
        DEBUG('buildUserRankList end');
    },

    getRobotFightForce: function (type, rank) {
        if (type > ArenaType.KING || type < ArenaType.PLATINUM) {
            type = ArenaType.PLATINUM;
        }

        return Math.floor(conf_mgr.gConfArenaBase[type].powerMin + (conf_mgr.gConfArenaBase[type].powerMax - conf_mgr.gConfArenaBase[type].powerMin) * Math.pow(((10000 - rank) / (10000 - 1)), conf_mgr.gConfArenaBase[type].powerCoefficient));
    },

    getRobotLevel: function (type, rank) {
        if (type > ArenaType.KING || type < ArenaType.PLATINUM) {
            type = ArenaType.PLATINUM;
        }

        return Math.floor(conf_mgr.gConfArenaBase[type].lvMin + (conf_mgr.gConfArenaBase[type].lvMax - conf_mgr.gConfArenaBase[type].lvMin) * Math.pow(((10000 - rank) / (10000 - 1)), conf_mgr.gConfArenaBase[type].lvCoefficient));
    },

    // 根据id获取机器人
    getRobot: function (id, rank) {
        if (this.robots[id]) {
            return this.robots[id];
        } else {
            var arenaType = Math.ceil(id / 10000) + 3;

            var calcRank = id % 10000;
            if (rank) {
                calcRank = rank;
            }
            var robotFightForce = this.getRobotFightForce(arenaType, calcRank);

            // 生成机器人
            var level = this.getRobotLevel(arenaType, id % 10000);
            var posObj = generateRobot(1, level, robotFightForce);

            var realFightForce = 0;
            var maxHeroFF = 0;
            var maxHero = 0;
            for (var pos in posObj) {
                var ff = posObj[pos].fight_force;
                realFightForce += ff;
                if (ff > maxHeroFF) {
                    maxHeroFF = ff;
                    maxHero = +posObj[pos].rid;
                }
            }

            var nameId = this.robotNameIds[id];
            if (!nameId) {
                var maxId = Object.keys(conf_mgr.gConfName).max();
                var firstId = common.randRange(1, maxId);
                var secondId = common.randRange(1, maxId);
                var male = common.randArray([0, 1]);
                nameId = firstId * 100000 + secondId * 10 + male;

                this.robotNameIds[id] = nameId;
                this.markDirty(util.format('robotNameIds.%d', id));
            }

            var firstId = Math.floor(nameId / 100000);
            var secondId = Math.floor((nameId % 100000) / 10);
            var male = nameId % 10 ? 'female' : 'male';
            var name = conf_mgr.gConfName[firstId].first + conf_mgr.gConfName[secondId][male];
            var level = Math.ceil(realFightForce / 5000 + 15);
            level = level > conf_mgr.gMaxUserLevel ? conf_mgr.gMaxUserLevel : level;
            this.robots[id] = {
                un: name,
                headpic: common.randArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
                headframe: 30002,
                level: level,
                pos: posObj,
                max_hero: maxHero,
                fight_force: realFightForce,
            };

            return this.robots[id];
        }
    },

    markDirty: function (name, force, callback) {
        this.dirty[name] = 0;

        if (force) {
            this.save(callback);
        } else {
            callback && callback(true);
        }
    },

    markDelete: function (name) {
        this.dirty[name] = 1;
    },

    arrangeDirty: function () {
        var arrangedDirty = {};
        for (var item in this.dirty) {
            var needRemove = [];
            var addNew = true;
            var levels = item.split('.');
            for (var eitem in arrangedDirty) {
                var elevels = eitem.split('.');
                if (elevels.length == levels.length) continue;
                var minLen = Math.min(elevels.length, levels.length);

                var isTree = true;
                for (var i = 0; i < minLen; i++) {
                    if (elevels[i] != levels[i]) {
                        isTree = false;
                        break;
                    }
                }

                if (!isTree) continue;

                if (elevels.length < levels.length) {
                    addNew = false;
                    break;
                } else {
                    needRemove.push(eitem);
                }
            }

            needRemove.forEach(function (removeItem) {
                delete arrangedDirty[removeItem];
            });

            if (addNew) {
                arrangedDirty[item] = this.dirty[item];
            }
        }

        this.dirty = arrangedDirty;
    },

    tickFunc: function () {

    },

    save: function (callback) {
        if (Object.keys(this.dirty).length == 0) {
            callback && callback(true);
            return;
        }

        this.arrangeDirty();
        var updates = { $set: {}, $unset: {} };
        for (var item in this.dirty) {
            var remove = this.dirty[item];
            if (remove) {
                updates['$unset'][item] = 1;
            } else {
                var obj = this;
                var args = item.split(".");
                var ok = true;
                for (var i = 0; i < args.length; i++) {
                    if (typeof (obj) != 'object') {
                        ok = false;
                        break;
                    }
                    obj = obj[args[i]];
                }

                if (ok && obj != undefined && obj != NaN && obj != null) {
                    updates['$set'][item] = obj;
                } else {
                    ERROR('INVALID SAVE CROSS ARENA: ' + item);
                }
            }
        }

        var toUpdate = 2;

        if (Object.keys(updates['$unset']).length == 0) {
            delete updates['$unset'];
            toUpdate--;
        }

        if (Object.keys(updates['$set']).length == 0) {
            delete updates['$set'];
            toUpdate--;
        }

        if (toUpdate) {
            var _me = this;
            this.dirty = {};
            gDBWorld.update({ _id: 'arena' }, updates, function (err, result) {
                if (err) {
                    ERROR({ updates: updates, err: err });
                    callback && callback(false);
                } else {
                    callback && callback(true);
                }
            });
        }
    },

    getPlayerInfo: function (id) {
        var info = {};
        info.uid = id;

        var fightForce = 0;
        if (isDroid(id)) {
            var robot = this.getRobot(id);
            info.level = robot.level;
            info.name = robot.un;
            info.headpic = robot.headpic;
            info.headframe = robot.headframe;
            info.model = robot.max_hero;
            info.quality = 1;
            info.promote = [];
            info.weapon_illusion = 0;
            info.wing_illusion = 0;
            info.mount_illusion = 0;
            for (var p in robot.pos) {
                fightForce += robot.pos[p].fight_force;
            }
            info.sid = 1;
        } else {
            var user = gUserInfo.getUser(id);
            info.level = user.status.level;
            info.name = user.info.un;
            fightForce = gUserInfo.getUserFightForce(id);
            info.headpic = user.info.headpic;
            info.headframe = user.info.headframe;
            info.model = user.info.model;
            info.promote = user.info.promote;
            info.weapon_illusion = user.sky_suit.weapon_illusion;
            info.wing_illusion = user.sky_suit.wing_illusion;
            info.mount_illusion = user.sky_suit.mount_illusion;
            info.custom_king = user.custom_king;
            info.sid = user.info.sid;
        }

        info.fight_force = fightForce;
        return info;
    },

    // 获取前10名信息
    getTopTen: function (type) {
        var topList = {};
        for (var i = 1; i <= 10; i++) {
            var id = this.ranks[type][i];
            var info = this.getPlayerInfo(id);

            // 重复了
            {
                var user = this.users[id];
                if (user && user.type == type && user.rank != i) {
                    var robotId = i + 10000 * (type - 1);
                    this.ranks[type][i] = robotId;
                    this.markDirty(util.format('ranks.%d.%d', type, i));
                    this.users[robotId] = {};
                    this.users[robotId].type = type;
                    this.users[robotId].rank = i;
                    id = robotId;
                }
            }

            if (!user && isDroid(id)) {
                this.users[id] = {};
                this.users[id].type = type;
                this.users[id].rank = i;
            }

            info.rank = i;
            topList[id] = info;
        }

        return topList;
    },

    getRankConf: function (rank) {
        var retConf = conf_mgr.gConfArenaRefresh[0];
        for (var i = 0; i < Object.keys(conf_mgr.gConfArenaRefresh).length; i++) {
            if (conf_mgr.gConfArenaRefresh[i].rank > rank) {
                break;
            }

            retConf = conf_mgr.gConfArenaRefresh[i];
        }

        return retConf;
    },

    refreshEnemy: function (uid, type, rank, not_in_rank) {
        var ranks = [];

        var conf = this.getRankConf(rank);
        if (rank < 15) {
            for (i = 11; i < 15; i++) {
                ranks.push(i);
            }
        } else {
            for (var i = 0; i < 5; i++) {
                var range = conf['range' + (i + 1)];
                if (range.length == 1) {
                    if (range[0] == 0) {
                        // 不显示
                    } else if (range[0] == 1) {
                        // 显示自己
                        ranks.push(rank);
                    }
                } else {
                    var min = Math.floor(rank * (1 - range[0]));
                    var max = Math.floor(rank * (1 - range[1]) - 1);
                    ranks.push(common.randRange(min, max));
                }

                DEBUG('rank[' + i + '] = ' + ranks[i]);
            }
        }

        var sweepRank = 0;
        if (conf.sweep > 0) {
            // 开启扫荡位
            sweepRank = common.randRange(conf.sweepRange[0], conf.sweepRange[1]);
            ranks.push(sweepRank);
        }

        var enemies = {};
        for (var i = 0; i < ranks.length; i++) {
            DEBUG('ranks[' + i + '] = ' + ranks[i]);
            var rankId = ranks[i];
            var id = this.ranks[type][rankId];
            var noRank = null;
            if (rankId == rank) {
                id = uid;

                if (not_in_rank) {
                    noRank = 1;
                }
            }

            if (id) {
                var info = this.getPlayerInfo(id);
                info.rank = ranks[i];

                if (sweepRank > 0 && info.rank == sweepRank) {
                    info.sweep = 1;
                }

                if (noRank) {
                    info.no_rank = 1;
                }

                enemies[id] = info;
            } else {
                DEBUG('id undefined, rank = ' + ranks[i]);
            }
        }

        return enemies;
    },

    // 获取当日结算时间
    getBalanceTime: function () {
        var dateStr = common.getDateString();
        var hour = Math.floor(conf_mgr.gConfGlobal.arenaBalanceTime);
        var mins = Math.floor((conf_mgr.gConfGlobal.arenaBalanceTime % 1) * 60);

        return Date.parse(dateStr + " " + hour + ":" + mins + ":00") / 1000;
    },

    addReport: function (uid1, uid2, replay, win, diff, type, rank) {
        var reports1 = this.reports[uid1];
        if (!reports1) {
            reports1 = this.reports[uid1] = [];
        }

        var replayKey = gReplay.addReplay(replay);
        var report1 = [common.getTime(), win, uid2, diff, type, rank, replayKey];
        reports1.push(report1);

        var report2 = report1.slice();
        report2[1] = win ? 0 : 1;
        report2[2] = uid1;
        report2[3] = -diff;
        report2[4] = type;
        report2[5] = rank + diff;

        var reports2 = this.reports[uid2];
        if (!reports2) {
            reports2 = this.reports[uid2] = [];
        }

        reports2.push(report2);

        this.markDirty(util.format('reports.%d', uid1));
        this.markDirty(util.format('reports.%d', uid2));
    },

    updateLastRanks: function () {
        this.lastRanks = clone(this.users);
        this.updates['$set']['last_ranks'] = this.lastRanks;
    },

    getTopUser: function (type, uid) {
        if (type < 1 || type > ArenaTypeMax) {
            return null;
        }

        if (!uid) {
            uid = this.ranks[type][1];
        }

        if (isDroid(uid)) {
            var robot = gArena.getRobot(uid);
            if (robot) {
                return {
                    uid: uid,
                    un: robot.un,
                    vip: 0,
                    model: robot.max_hero,
                    headframe: robot.headframe,
                    promote: [],
                    weapon_illusion: 0,
                    wing_illusion: 0,
                    mount_illusion: 0,
                    fight_force: robot.fight_force,
                };
            } else {
                return null;
            }
        } else {
            return gUserInfo.getTopUser(uid);
        }
    },

    getHonorTopUser: function (type) {
        if (type < 1 || type > ArenaTypeMax) {
            return null;
        }

        var uid = this.ranks[type][1];
        if (isDroid(uid)) {
            var robot = gArena.getRobot(uid);
            if (robot) {
                return {
                    uid: uid,
                    un: robot.un,
                    headpic: robot.headpic,
                    headframe: robot.headframe,
                    promote: [],
                    weapon_illusion: 0,
                    wing_illusion: 0,
                    mount_illusion: 0,
                };
            } else {
                return null;
            }
        } else {
            return gUserInfo.getHonorUser(uid);
        }
    },

    getHonorTopUid: function (type) {
        if (!type || type < 1 || type > ArenaTypeMax) {
            return 0;
        }

        return this.ranks[type][1];
    },

    getHonorTopUser: function (type) {
        if (!type || type < 1 || type > ArenaTypeMax) {
            return null;
        }

        var uid = this.ranks[type][1];
        if (isDroid(uid)) {
            var robot = gArena.getRobot(uid);
            if (robot) {
                return {
                    uid: uid,
                    un: robot.un,
                    headpic: robot.headpic,
                    headframe: robot.headframe,
                    promote: [],
                };
            } else {
                return null;
            }
        } else {
            return gUserInfo.getHonorUser(uid);
        }
    },

    getServerInfo: function (sid) {
        if (this.servers[sid]) {
            return this.servers[sid];
        }

        return null;
    },

    getServers: function () {
        return this.servers;
    },

    // 通知到指定世界服
    broadcastToAllWorld: function (req, resp, callback) {
        for (var i = 1; i <= 3; i++) {
            for (var j = 0; j < this.serverList[i].length; j++) {
                var sid = this.serverList[i][j];
                this.broadcastToWorld(sid, req, resp, callback);
            }
        }
    },

    broadcastToWorld: function (serverId, req, resp, callback) {
        var serverInfo = this.getServerInfo(serverId);
        if (serverInfo) {
            requestClientWorldByIpAndPort(serverId, serverInfo[0], serverInfo[1], req, resp, callback);
        }
    },

    notifyRankChangeToWorld: function (uid) {
        var userInfo = gUserInfo.getUser(uid);
        if (userInfo) {
            var rankInfo = this.users[uid];

            var worldReq = {
                mod: 'arena',
                act: 'rank_change_notify',
                uid: uid,
                args: {
                    type: rankInfo.type,
                    rank: rankInfo.rank,
                }
            };

            var serverId = userInfo.info.sid;
            DEBUG('notifyRankChangeToWorld serverId = ' + serverId);
            this.broadcastToWorld(serverId, worldReq, {}, function () {

            });
        }
    },

    // 用机器人替换指定位置的玩家
    replaceOldPlayerWithRobot: function (uid, old_type, old_rank, new_type, new_rank) {
        if (!isCrossArena(old_type) && isCrossArena(new_type)) {
            // 之前在本服竞技场，现在进入了跨服竞技场
            var worldReq = {
                uid: uid,
                mod: 'arena',
                act: 'replace_player_with_robot',
                args: {
                    type: old_type,
                    rank: old_rank,
                    new_type: new_type,
                    new_rank: new_rank,
                },
            }

            // 通知跨服竞技场
            var userInfo = gUserInfo.getUser(uid);
            if (userInfo) {
                var serverId = userInfo.info.sid;
                this.broadcastToWorld(serverId, worldReq, {}, function () {

                });
            }
        } else if (isCrossArena(old_type) && isCrossArena(new_type)) {
            // 从一个跨服竞技场到另一个跨服竞技场

            if (this.users[uid]) {
                let user_rank = this.users[uid].rank;
                let user_type = this.users[uid].type;

                DEBUG(`what ? ${user_rank} : ${user_type}     ${old_type} : ${old_rank}`);

                if (user_rank != old_rank) {
                    DEBUG(`what ? ${user_rank} ${old_rank}`);
                }
                // old_rank = user_rank;
            }

            var robotId = parseInt(old_rank) + 10000 * (old_type - 1);
            this.ranks[old_type][old_rank] = robotId;
            this.markDirty(util.format('ranks.%d.%d', old_type, old_rank));

            this.users[robotId] = {};
            this.users[robotId].type = old_type;
            this.users[robotId].rank = old_rank;

            // 从非跨服到跨服两个type一样的值
            if (old_type == new_type) {
                DEBUG(`delete uid ${uid}`)
                delete this.users[uid];
                this.markDelete(util.format('users.%d', uid));
            }
        }
    },
};

exports.get = function (req, res, resp, onReqHandled) {
    var uid = +req.uid;
    do {
        var type = +req.args.type;   // 竞技场类型
        if (!type || isNaN(type)) {
            resp.code = 1; resp.desc = 'no type'; break;
        }

        // 更新玩家信息
        var user = req.args.user;
        var serverId = req.args.serverId;
        var legionName = req.args.legionName;

        gUserInfo.update(uid, user, serverId, legionName);

        var now = common.getTime();
        var curRank = +req.args.cur_rank || 0;
        var curType = +req.args.cur_type || 0;  // 玩家所在竞技场段位

        if (uid in gArena.users) {
            curRank = +gArena.users[uid].rank;
            curType = +gArena.users[uid].type;
        } else {
            gArena.users[uid] = {};
            gArena.users[uid].type = curType;
            gArena.users[uid].rank = curRank;
        }

        var refreshRank = 0; // 刷新列表用到的排名
        var notInRank = false;  // 是否未上榜
        if (curType != type) {
            refreshRank = gArena.playerCount[type];
            notInRank = true;
        } else {
            refreshRank = curRank;
        }

        resp.data.top_ten = gArena.getTopTen(type);
        resp.data.enemy = gArena.refreshEnemy(uid, type, refreshRank, notInRank);

        resp.data.rank = curRank;
        resp.data.type = curType;

    } while (false);

    onReqHandled(res, resp, 1);
};

// 获取玩家当前所在段位和排名
exports.get_rank_type = function (req, res, resp, onReqHandled) {
    var uid = req.uid;
    resp.data = resp.data || {};

    var rank = 0;
    var type = 0;
    var tUserArenaInfo = gArena.users[uid] || {};
    var user = gUserInfo.getUser(uid);
    if (user) {
        var tPlayerInfo = gArena.getPlayerInfo(uid);
    }

    if (
        req.args.isfromarena
        &&
        (tUserArenaInfo.type && tUserArenaInfo.rank)
        &&
        tPlayerInfo && (tPlayerInfo.level > conf_mgr.gConfArenaBase[tUserArenaInfo.type || 1].levelLimit)
    ) {
        var oldType = tUserArenaInfo.type;
        var oldRank = tUserArenaInfo.rank;
        if (oldType != 0 && oldRank != 0 && parseInt(oldType) != parseInt(type)) {
            var robotId = parseInt(oldRank) + 10000 * (oldType - 1);
            gArena.ranks[oldType][oldRank] = robotId;
            gArena.markDirty(util.format('ranks.%d.%d', oldType, oldRank));
        }

        resp.data.challenge = true;
        resp.data.old_rank = tUserArenaInfo.rank || 0;
        resp.data.old_type = tUserArenaInfo.type || 0;

        challenge_rank(uid, 0, (tUserArenaInfo.type || 0), (tUserArenaInfo.rank || 0), true);
    }

    rank = tUserArenaInfo.rank || 0;
    type = tUserArenaInfo.type || 0;


    resp.data.type = type;
    resp.data.rank = rank;

    onReqHandled(res, resp, 1);
};

// 注册服务器
exports.register_server = function (req, res, resp, onReqHandled) {
    do {
        var serverId = req.args.sid;
        if ((!serverId || isNaN(serverId)) && serverId != 0) {
            resp.code = 1; resp.desc = 'server id needed'; break;
        }

        gArena.servers[serverId] = [req.args.ip, req.args.port, req.args.openTime];
        gArena.markDirty(util.format('servers.%d', serverId));
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.refresh = function (req, res, resp, onReqHandled) {
    var uid = req.uid;
    do {
        if (!gArena.users[uid]) {
            resp.code = 1; resp.desc = 'no rank'; break;
        }

        var arenaType = req.args.type;
        var refreshRank = gArena.playerCount[arenaType];;
        if (gArena.users[uid].type == arenaType && gArena.users[uid].rank > 0) {
            refreshRank = gArena.users[uid].rank;
        }

        resp.data.enemy = gArena.refreshEnemy(uid, arenaType, refreshRank);
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.challenge = function (req, res, resp, onReqHandled) {
    var uid = req.uid;
    do {
        var enemyId = +req.args.enemy;

        var rank = 0;
        if (req.args.rank) {
            rank = +req.args.rank;
        }

        var enemyData = gArena.users[enemyId];
        if (!enemyData) {
            resp.code = 1; resp.desc = 'not found enemy'; break;
            break
        }

        if (!rank || enemyData.rank != rank) {
            resp.code = 104; resp.desc = 'err rank'; break;
            break;
        }

        var enemy = {};
        if (isDroid(enemyId)) {
            var robot = gArena.getRobot(enemyId);
            enemy.name = robot.un;
            enemy.pos = robot.pos;
            enemy.headpic = robot.headpic;
            enemy.headframe = robot.headframe || 30002;
            enemy.level = robot.level;
            enemy.max_hero = robot.max_hero;
            enemy.fight_force = robot.fight_force;
        } else {
            enemy = gUserInfo.getUserFightInfo(enemyId);
        }

        var replay = {
            info: gUserInfo.getUserFightInfo(uid, true),
            enemy: enemy,
            rand1: common.randRange(0, 99999),
            rand2: common.randRange(0, 99999),
        }

        ERROR("==================challenge");
        ERROR(replay);

        var type = +req.args.type;
        if (uid in gArena.users) {
            var oldRank = gArena.users[uid].rank;
            var oldType = gArena.users[uid].type;

            DEBUG('cross arena challenge oldType = ' + oldType + ', oldRank = ' + oldRank);

            if (isValidArenaType(type) && parseInt(oldType) != parseInt(type)) {
                challenge_rank(uid, type, oldType, oldRank);

                replay.type = type;
                replay.rank = gArena.users[uid].rank;
            }
        } else {
            DEBUG('user not found, uid = ' + uid);
        }

        resp.data = replay;
    } while (false);

    onReqHandled(res, resp, 1);
};

function challenge_rank(uid, type, oldType, oldRank, is_challenge) {// 要切换竞技场
    gArena.users[uid] = gArena.users[uid] || {};
    gArena.users[uid].type = type;
    gArena.users[uid].rank = is_challenge ? 0 : ++gArena.playerCount[type];
    gArena.markDirty(util.format('playerCount.%d', type));

    if (isCrossArena(oldType) && parseInt(oldType) != parseInt(type)) {
        var robotId = parseInt(oldRank) + 10000 * (oldType - 1);
        gArena.ranks[oldType][oldRank] = robotId;
        gArena.markDirty(util.format('ranks.%d.%d', oldType, oldRank));

        gArena.users[robotId] = {};
        gArena.users[robotId].type = oldType;
        gArena.users[robotId].rank = oldRank;
    }

    // 原来的位置由机器人填充
    if (isValidArenaType(oldType)) {
        gArena.replaceOldPlayerWithRobot(uid, oldType, oldRank, type, gArena.users[uid].rank);
    }

    if (!is_challenge) {
        gArena.ranks[type][gArena.users[uid].rank] = uid;
        gArena.markDirty(util.format('ranks.%d.%d', type, gArena.users[uid].rank));
    }

    // 通知玩家所在服务器排名改变
    gArena.notifyRankChangeToWorld(uid);
};

exports.fight = function (req, res, resp, onReqHandled) {
    var uid = req.uid;
    var enemyId = +req.args.enemy;

    var pass = false;

    do {
        var rank = 0;
        if (req.args.rank) {
            rank = +req.args.rank;
        }

        if (!gArena.users[uid] || !gArena.users[enemyId]) {
            resp.code = 1; resp.desc = 'invalid uid or enemyid'; break;
        }

        var enemyData = gArena.users[enemyId];

        if (!rank || enemyData.rank != rank) {
            resp.code = 104; resp.desc = 'err rank'; break;
        }

        pass = true;

    } while (false);

    if (!pass) {
        onReqHandled(res, resp, 1);
        return;
    }

    var win = 0;
    var rankDiff = 0;
    var rankAfterFight = gArena.users[uid].rank;
    var type = gArena.users[uid].type;
    if (req.args.star > 0) {
        var rank1 = gArena.users[uid].rank;
        var rank2 = gArena.users[enemyId].rank;
        if (rank2 < rank1) {
            rankAfterFight = rank2;
            gArena.users[uid].rank = rank2;

            if (gArena.users[enemyId]) {
                gArena.users[enemyId].rank = rank1;
            } else {
                gArena.users[enemyId] = {};
                gArena.users[enemyId].type = type;
                gArena.users[enemyId].rank = rank1;
            }

            gArena.ranks[type][rank2] = uid;

            if (isDroid(enemyId)) {
                if (rank1 < 10000) {
                    var robotId = parseInt(rank1) + 10000 * (type - 1);
                    gArena.ranks[type][rank1] = robotId;  // 还原为指定排名的机器人

                    if (!gArena.users[robotId]) {
                        gArena.users[robotId] = {};
                    }

                    gArena.users[robotId].type = type;
                    gArena.users[robotId].rank = rank1;
                } else {
                    gArena.ranks[type][rank1] = 0;  // 10000万之后清空
                }
            } else {
                gArena.ranks[type][rank1] = enemyId;
            }

            gArena.markDirty(util.format('ranks.%d.%d', type, rank1));
            gArena.markDirty(util.format('ranks.%d.%d', type, rank2));

            rankDiff = rank1 - rank2;

            if (rank2 == 1 || rank2 == 2 || rank2 == 3) {
                var array = [];
                var userName = gUserInfo.getUser(uid).info.un;
                if (isDroid(enemyId)) {
                    var robot = gArena.getRobot(enemyId);
                    var enemyName = robot.un;
                } else {
                    var enemyName = gUserInfo.getUser(enemyId).info.un;
                }

                array[0] = userName;
                array[1] = enemyName;
                if (userName == null) {
                    array[0] = '';
                }

                if (enemyName == null) {
                    array[0] = '';
                }

                if (rank2 == 1) {
                    pushSysMsg('updateFirstRank', array);
                }

                if (rank2 == 2 || rank2 == 3) {
                    array[2] = rank2;
                    pushSysMsg('updateRank', array);
                }
            }
        }
        win = 1;

        // 通知到玩家自己所在的服务器
        gArena.notifyRankChangeToWorld(uid);
        if (!isDroid(enemyId)) {
            gArena.notifyRankChangeToWorld(enemyId);
        }
    }

    if (!isDroid(enemyId)) {
        //gTips.addTip(enemyId, 'arena_report');
    }
    gArena.addReport(uid, enemyId, req.args.replay, win, rankDiff, type, rankAfterFight);

    resp.data.diff = rankDiff;
    resp.data.type = gArena.users[uid].type;
    resp.data.rank = gArena.users[uid].rank;
    resp.data.enemy_rank = gArena.users[enemyId].rank;
    resp.data.enemy_type = gArena.users[enemyId].type;

    onReqHandled(res, resp, 1);
};

exports.rank_list = function (req, res, resp, onReqHandled) {
    var uid = req.uid;
    do {
        var type = req.args.type;
        if (!type || isNaN(type)) {
            resp.code = 1; resp.desc = 'no type'; break;
        }

        var rankList = [];
        for (var rank = 1; rank <= conf_mgr.gConfGlobal.rankListLimit_arena; rank++) {
            var userId = gArena.ranks[type][rank];
            var info = {};
            var fightForce = 0;
            var maxFightForce = 0;
            var maxFightForceHid = 0;
            var maxHidPromote = [0, 0];

            // 机器人
            if (isDroid(userId)) {
                var robot = gArena.getRobot(userId);
                info.un = robot.un;
                info.level = robot.level;
                info.headpic = robot.headpic;
                info.headframe = robot.headframe;

                for (var p in robot.pos) {
                    fightForce += robot.pos[p].fight_force;

                    if (robot.pos[p].fight_force > maxFightForce) {
                        maxFightForce = robot.pos[p].fight_force;
                        maxFightForceHid = robot.pos[p].hid;
                    }
                }
            } else {
                var user = gUserInfo.getUser(userId);
                if (!user) {
                    DEBUG('user id = ' + userId + ' not find!');
                    continue;
                }

                info.un = user.info.un;
                info.level = user.status.level;
                info.headpic = user.info.headpic;
                info.headframe = gUserInfo.getRankHeadFrame(userId);
                info.main_role = user.pos[1].hid;
                info.vip = user.status.vip;

                for (var p in user.pos) {
                    fightForce += user.pos[p].fight_force;

                    if (user.pos[p].fight_force > maxFightForce) {
                        maxFightForce = user.pos[p].fight_force;
                        maxFightForceHid = user.pos[p].hid;
                        maxHidPromote = user.pos[p].promote;
                    }
                }
            }
            info.fight_force = fightForce;
            info.uid = userId;

            if (rankList.length == 0) {
                info.max_force_hid = maxFightForceHid;
                info.promote = maxHidPromote;
                info.weapon_illusion = 0;
                info.wing_illusion = 0;
                info.mount_illusion = 0;
                info.custom_king = {};

                if (!isDroid(userId)) {
                    var user = gUserInfo.getUser(userId);
                    if (user && user.pos[1].hid == maxFightForceHid) {
                        info.weapon_illusion = user.sky_suit.weapon_illusion;
                        info.wing_illusion = user.sky_suit.wing_illusion;
                        info.mount_illusion = user.sky_suit.mount_illusion;
                        info.custom_king = user.custom_king;
                    }

                    if (user) {
                        // 第一名需要显示军团名
                        info.legionName = user.info.legionName;
                    }
                }
            }

            rankList.push(info);
        }

        var selfUser = gUserInfo.getUser(req.uid);
        var selfInfo = {};
        selfInfo.uid = req.uid;
        selfInfo.un = selfUser.info.un;
        selfInfo.headpic = selfUser.info.headpic;
        selfInfo.headframe = gUserInfo.getRankHeadFrame(req.uid);
        selfInfo.level = selfUser.status.level;
        selfInfo.fight_force = selfUser.fight_force;
        selfInfo.vip = selfUser.status.vip;
        selfInfo.main_role = selfUser.pos[1].hid;
        selfInfo.custom_king = selfUser.custom_king;
        selfInfo.last_rank = gArena.last_ranks[uid] ? gArena.last_ranks[uid].rank : 0;
        selfInfo.rank = 0;
        if (gArena.users[uid]) {
            if (gArena.users[uid].type == type) {
                selfInfo.rank = gArena.users[uid].rank;
            }
            selfInfo.rank_type = gArena.users[uid].type;
            selfInfo.rank_index = gArena.users[uid].rank;
        }
        resp.data.self = selfInfo;

        // resp.data.last_rank = gArena.last_ranks[uid] ? gArena.last_ranks[uid].rank : 0;
        // resp.data.rank = gArena.users[uid] ? gArena.users[uid].rank : 0;
        resp.data.rank_list = rankList;
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.get_rank = function (req, res, resp, onReqHandled) {
    do {
        if (!gArena.users[req.uid]) {
            resp.code = 1; resp.desc = 'user not found!'; break;
        }

        resp.data.type = gArena.users[req.uid].type;
        resp.data.rank = gArena.users[req.uid].rank;
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.get_report = function (req, res, resp, onReqHandled) {
    do {
        var uid = +req.args.uid;
        if (!gArena.reports[uid]) {
            resp.data.report = [];
        } else {
            var reports = gArena.reports[uid];
            var result = [];
            for (var i = 0, len = reports.length; i < len; i++) {
                var report = reports[i].slice();
                var enemyId = report[2];
                var name = "";
                var headpic = "";
                var headframe = 0;
                var level = 0;
                var vip = 0;
                var ff = 0;
                var quality = 1;

                if (isDroid(enemyId)) {
                    var user = gArena.getRobot(enemyId);
                    name = user.un;
                    headpic = user.headpic;
                    headframe = user.headframe || 30002;
                    quality = 2;
                    level = user.level;
                    ff = user.fight_force;
                } else {
                    var user = gUserInfo.getUser(enemyId);
                    name = user.info.un;
                    headpic = user.info.headpic;
                    headframe = gUserInfo.getRankHeadFrame(enemyId);
                    quality = getQuality(user.custom_king);
                    level = user.status.level;
                    vip = user.status.vip;
                    ff = user.fight_force;
                }
                report.push(name, headpic, level, quality, vip, ff, headframe);
                result.push(report);
            }
            resp.data.report = result;
        }
    } while (false);

    onReqHandled(res, resp, 1);
};

exports.get_replay = function (req, res, resp, onReqHandled) {
    var uid = +req.uid;
    do {
        gReplay.getReplay(req.args.id, function (replay) {
            if (replay) {
                resp.data = replay;
            } else {
                resp.code = 1; resp.desc = 'no such replay';
            }
            onReqHandled(res, resp, 1);
        });
        return;
    } while (false);

    onReqHandled(res, resp, 1);
};

// 用机器人替换指定位置的玩家
exports.replace_player_with_robot = function (req, res, resp, onReqHandled) {
    var uid = req.uid;
    var type = req.args.type;
    var rank = req.args.rank;

    DEBUG('cross arena replace_player_with_robot type = ' + type + ', rank = ' + rank);
    if (isValidArenaType(type)) {
        gArena.replaceOldPlayerWithRobot(uid, type, rank, type);
    }

    onReqHandled(res, resp, 1);
};

exports.Arena = Arena;
