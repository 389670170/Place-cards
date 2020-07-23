
const util = require('util');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const PlayerManager = require('../logic/player_manager.js');
const task_mod = require('./task.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const player_team = require('./player_team.js');

const { TEAM_NAME } = require('../../common/enum.js');
const { ServerName } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');
const { isModuleOpen_new } = require('../../common/global.js');

exports.get = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'arena')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var type = req.args.type;
        if (!type) {
            type = ArenaType.BRONZE;
        }

        if (!isArenaOpen(type, player)) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var user = player.user;
        var tmpData = mapObject(user, gInitWorldUser);

        var updateData = mapObject(tmpData, gArenaServerUser);

        req.args.user = updateData;
        req.args.serverId = config.ServerId;

        function callback(player, resp) {
            var user = player.user;
            if (resp.code == 0) {
                var enemy = resp.data.enemy;
                player.memData.arena_enemy = {};
                for (var uid in enemy) {
                    player.memData.arena_enemy[uid] = 1;
                }

                player.memData.area_top_ten = {};
                for (var uid in resp.data.top_ten) {
                    player.memData.area_top_ten[uid] = 1;
                }

                var arena = user.arena;
                if (!arena.max_type) {
                    arena.max_type = resp.data.type;
                    player.markDirty('arena.max_type');
                }
                if (!arena.max_rank) {
                    arena.max_rank = resp.data.rank;
                    player.markDirty('arena.max_rank');
                }

                if (!arena.max_rank_tab) {
                    arena.max_rank_tab = [0, 0, 0, 0, 0, 0];
                }

                if (arena.max_rank_tab[resp.data.type - 1] == 0 || arena.max_rank_tab[resp.data.type - 1] > resp.data.rank) {
                    arena.max_rank_tab[resp.data.type - 1] = resp.data.rank;
                    player.markDirty('arena.max_rank_tab');
                }

                if (resp.data.type > arena.max_type) {
                    arena.max_type = resp.data.type;
                    arena.max_rank = resp.data.rank;
                    player.markDirty('arena.max_type');
                    player.markDirty('arena.max_rank');
                } else if (resp.data.type == arena.max_type && resp.data.rank < arena.max_rank) {
                    arena.max_rank = resp.data.rank;
                    player.markDirty('arena.max_rank');
                }

                player.memData.status = 'idle';

                resp.data.max_rank = arena.max_rank;
                resp.data.max_rank_tab = arena.max_rank_tab;
                resp.data.max_type = arena.max_type;
                resp.data.award_got = arena.award_got;
                resp.data.count = arena.count;
                resp.data.level = user.status.arena_level;
                // 已废弃，驯龙2竞技场没有xp
                // resp.data.xp = user.status.arena_xp;
                resp.data.xp = 0;
                resp.data.challenge_cd = user.arena.challenge_cd;
            }

            onHandled();
        }

        if (isCrossArena(type)) {
            // 跨服竞技场
            req.args.legionName = player.memData.legion_name;

            // 先向world请求一下玩家当前所在的竞技场类型和排名
            var worldReq = {
                uid: req.uid,
                mod: 'arena',
                act: 'get_rank_type',
                args: {},
            }
            var worldResp = {};

            requestWorld(worldReq, worldResp, function () {
                // client_send_msg(ServerName.WORLD, worldReq.act, worldReq.mod, worldReq.args, worldResp, null, function () {
                req.args.cur_type = worldResp.data.type;
                req.args.cur_rank = worldResp.data.rank;
                requestArenaServer(req, resp, function () {

                    // resp.data.my_type = worldResp.data.type;
                    // resp.data.my_rank = worldResp.data.rank;


                    resp.data.my_type = resp.data.type;
                    resp.data.my_rank = resp.data.rank;

                    if (resp.data.type > 0 && resp.data.type != worldResp.data.type && resp.data.rank >= 0 && resp.data.rank != worldResp.data.rank) {
                        // 跨服上有玩家竞技场数据，且跟本服不一样，以跨服为准
                        worldReq.act = 'rank_change_notify';
                        worldReq.args = {
                            type: resp.data.type,
                            rank: resp.data.rank,
                            remove: 1,
                        }

                        requestWorld(worldReq, worldResp, function () {
                            // client_send_msg(ServerName.WORLD, worldReq.act, worldReq.mod, worldReq.args, worldResp, null, function () {
                            callback(player, resp);
                        });
                    } else {
                        callback(player, resp);
                    }
                });
            });
        } else {
            // 本服竞技场
            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                callback(player, resp);
            });
        }
        return;
    } while (false);

    onHandled();
};

// 获取玩家当前所在段位和排名
exports.get_rank_type = function (player, req, resp, onHandled) {
    requestWorld(req, resp, function () {
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
        var worldArenaType = resp.data.type;
        var worldArenaRank = resp.data.rank;

        var crossResp = {};
        requestArenaServer(req, crossResp, function () {
            if (!crossResp.data) {
                onHandled();
                return;
            }

            var arenaType = crossResp.data.type;
            var arenaRank = crossResp.data.rank;

            DEBUG('worldArenaType = ' + worldArenaType + ', worldArenaRank = ' + worldArenaRank);
            DEBUG('arenaType = ' + arenaType + ', arenaRank = ' + arenaRank);

            if (arenaType <= 3 && worldArenaType <= 3) {
                onHandled();
                return;
            }

            if (arenaType > 0 && arenaType != worldArenaType && arenaRank >= 0 && arenaRank != worldArenaRank) {
                // 跨服上有玩家竞技场数据，且跟本服不一样，以跨服为准
                resp.data.type = arenaType;
                resp.data.rank = arenaRank;
                DEBUG('notify to world server rank change uid = ' + req.uid + ', type = ' + arenaType + ', rank = ' + arenaRank);

                var worldReq = {
                    uid: req.uid,
                    mod: 'arena',
                    act: 'rank_change_notify',
                    args: {
                        type: arenaType,
                        rank: arenaRank,
                        remove: 1,
                    },
                }
                var worldResp = {};
                requestWorld(worldReq, worldResp, function () {
                    // client_send_msg(ServerName.WORLD, worldReq.act, worldReq.mod, worldReq.args, worldResp, null, function () {
                    onHandled();
                });
            } else {
                onHandled();
            }
        });
    });
};

exports.refresh = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'arena')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        if (player.memData.status == 'fight_arena') {
            resp.code = 1; resp.desc = 'status error'; break;
        }

        var type = req.args.type;
        if (!type) {
            type = ArenaType.BRONZE;
        }

        function callback(player, resp) {
            var enemy = resp.data.enemy;
            player.memData.arena_enemy = {};
            for (var uid in enemy) {
                player.memData.arena_enemy[uid] = 1;
            }
            onHandled();
        }

        if (isCrossArena(type)) {
            // 跨服竞技场
            requestArenaServer(req, resp, function () {
                callback(player, resp);
            });
        } else {
            // 本服竞技场
            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                callback(player, resp);
            });
        }

        return;
    } while (false);

    onHandled();
};

exports.challenge = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'arena')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var type = +req.args.type;
        if (!type) {
            resp.code = 1; resp.desc = 'area type need'; break;
        }

        if (!isModuleOpen_new(player, 'arena' + type)) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        if (player.memData.status == 'fight_arena') {
            resp.code = 1; resp.desc = 'status error'; break;
        }

        if (!req.args.enemy || isNaN(req.args.enemy)) {
            resp.code = 1; resp.desc = 'no enemy'; break;
        }

        /*
            if (!(req.args.enemy in player.memData.arena_enemy) && !(req.args.enemy in player.memData.area_top_ten)) {
                resp.code = 1; resp.desc = 'enemy error'; break;
            }
        */

        var cost = [['user', 'atoken', -1]];
        if (user.arena.count >= conf_mgr.gConfGlobal.arenaMaxCount) {
            if (!player.checkCosts(cost)) {
                resp.code = 1; resp.desc = 'has no count'; break;
            }
        }

        if (user.status.level > conf_mgr.gConfArenaBase[type].levelLimit) {
            resp.code = 1; resp.desc = 'level too high'; break;
        }

        function callback(player, rep, resp) {
            if (resp.code == 0) {
                player.memData.status = 'prepare_arena';
                player.memData.enemy_id = +req.args.enemy;

                player.memData.rand1 = resp.data.rand1;
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
        }

        if (isCrossArena(type)) {
            // 跨服竞技场
            requestArenaServer(req, resp, function () {
                callback(player, req, resp);
            });
        } else {
            // 本服竞技场
            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                callback(player, req, resp);
            });
        }

        return;
    } while (false);

    onHandled();
};

// 挑战结束
exports.fight = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (player.memData.status != 'prepare_arena') {
            resp.code = 1; resp.desc = 'status error'; break;
        }

        if (!req.args.enemy || isNaN(req.args.enemy)) {
            resp.code = 1; resp.desc = 'no enemy'; break;
        }

        if (req.args.enemy != player.memData.enemy_id) {
            resp.code = 1; resp.desc = 'enemy error'; break;
        }

        var cost = [['user', 'atoken', -1]];
        if (user.arena.count >= conf_mgr.gConfGlobal.arenaMaxCount) {
            if (!player.checkCosts(cost)) {
                resp.code = 1; resp.desc = 'has no count'; break;
            }
        }

        var star = Math.floor(req.args.star);
        if (isNaN(star)) {
            resp.code = 1; resp.desc = "star error"; break;
        }

        var time = req.args.time;
        var clientSign = req.args.sign;
        var enemyuid = req.args.enemy;

        // TODO 验证战斗
        var serverSign = getArenaBattleFightSign('arena', req.uid, time, star, enemyuid);
        //if (serverSign != clientSign) {
        //    resp.code = 999; resp.desc = "sign not match"; break;
        //}

        var type = req.args.type;
        if (!type) {
            type = ArenaType.BRONZE;
        }

        // TODO 验证战斗
        //var report = parseFightReport(report, this.memData.rand);
        //if(!report) {
        //    resp.code = 1; resp.desc = "report error"; break;
        //}
        //if(!player.checkBattleReport(report, BattleType.PVE)) {
        //    resp.code = 1; resp.desc = "check report error"; break;
        //}

        var team = req.args.team;
        if (team) {
            var valid = true;
            if (!player_team.syncTeam(player, TEAM_NAME.DEFAULT, 1, team)) {
                resp.code = 1; resp.data = 'invalid team'; break;
            }

            // 更新队伍信息
            let fi = player.memData.fight_info;
            for (var p in team) {
                fi.pos[p].slot = Math.floor(team[p]);
            }
        }

        req.args.replay = {
            rand1: player.memData.rand1,
            rand2: player.memData.rand2,
            info: player.memData.fight_info,
            enemy: player.memData.fight_enemy,
        };

        function callback(player, resp) {
            var user = player.user;
            if (resp.code == 0) {
                if (user.arena.count < conf_mgr.gConfGlobal.arenaMaxCount) {
                    user.arena.count++;
                    player.markDirty('arena.count');
                } else {
                    resp.data.costs = player.addAwards(cost, req.mod, req.act);
                }

                user.arena.challenge_cd = common.getTime() + conf_mgr.gConfGlobal.arenaChallengeCD * 60;
                player.markDirty('arena.challenge_cd');
                resp.data.challenge_cd = user.arena.challenge_cd;
                logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'arena', 1);
                player.doOpenHoliday('arena', 1);
                var addPer = 0;

                var xpAdd = 0;
                var awards = [];
                if (star > 0) {
                    // 更新竞技场获胜次数
                    user.arena.win_times += 1;
                    player.markDirty('arena.win_times');
                    player.updateHeadFrameStatus('arena_win_times', user.arena.win_times);

                    var diff = resp.data.diff;
                    var type = resp.data.type;
                    var rank = resp.data.rank;

                    if (diff > 0) {
                        if (type == user.arena.max_type) {
                            user.arena.max_rank = rank;
                            player.markDirty('arena.max_rank');
                        } else if (type > user.arena.max_type) {
                            user.arena.max_type = type;
                            user.arena.max_rank = rank;
                            player.markDirty('arena.max_type');
                            player.markDirty('arena.max_rank');
                        }

                        if (user.arena.max_rank_tab[type - 1] == 0 || user.arena.max_rank_tab[type - 1] > rank) {
                            user.arena.max_rank_tab[type - 1] = rank;
                            player.markDirty('arena.max_rank_tab');
                        }
                    }

                    // 更新竞技第一名头像框
                    if (rank && rank == 1) {
                        player.updateHeadFrameStatus('arena_rank', rank);
                        resp.data.headframe = user.info.headframe;

                        var enemyRank = resp.data.enemy_rank;
                        PlayerManager.get(player.memData.enemy_id, function (enemyPlayer) {
                            enemyPlayer.updateHeadFrameStatus('arena_rank', enemyRank);
                            pushToUser(player.memData.enemy_id, 'self', {
                                'mod': 'user',
                                'act': 'headframe_change',
                                'headframe': enemyPlayer.user.info.headframe,
                            });
                        });
                    }

                    var logConf = conf_mgr.gConfPlayLog['pvp']['arena'];
                    player.recordPlay(logConf.logType, logConf.logName);

                    logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, player, 'arenaVictory', 1);
                    player.doOpenSeven('arenaVictory');
                    player.doOpenHoliday('arenaVictory');

                } else {

                }

                player.memData.status = 'idle';
                player.memData.enemy_id = 0;

                var atype = resp.data.type;

                // 竞技场单次挑战奖励
                resp.data.awards = player.addAwards(conf_mgr.gConfArenaBase[atype].award, req.mod, req.act);

                player.getExchangePointsProgress('arena', 1);

                player.doOpenSeven('arenaRank', 1);
                player.doOpenHoliday('arenaRank', 1);
            }

            onHandled();
        }

        if (isCrossArena(type)) {
            requestArenaServer(req, resp, function () {
                callback(player, resp);
            });
        } else {
            requestWorld(req, resp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, function () {
                callback(player, resp);
            });
        }

        return;
    } while (false);

    onHandled();
};

// 排行榜
exports.rank_list = function (player, req, resp, onHandled) {
    var rankType = req.args.type;
    if (rankType == 7) {
        // 本服总榜
        req.act = 'total_rank_list';
        requestWorld(req, resp, onHandled);
        // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
    } else {
        if (isCrossArena(rankType)) {
            requestArenaServer(req, resp, onHandled);
        } else {
            requestWorld(req, resp, onHandled);
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
        }
    }
};

// 获取战报
exports.get_report = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'arena')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        if (player.memData.status == 'fight_arena') {
            resp.code = 1; resp.desc = 'status error'; break;
        }

        if (!req.args.uid || isNaN(req.args.uid)) {
            resp.code = 1; resp.desc = 'no uid'; break;
        }

        requestArenaServer(req, resp, function () {
            var worldResp = {};
            worldResp.code = 0;
            worldResp.data = {};
            requestWorld(req, worldResp, function () {
                // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, worldResp, null, function () {
                if (worldResp.data.report && worldResp.data.report.length > 0) {
                    if (resp.data.report) {
                        resp.data.report = resp.data.report.concat(worldResp.data.report);
                    } else {
                        resp.data.report = worldResp.data.report;
                    }
                }

                var report = [];
                for (var i = 0; i < resp.data.report.length; i++) {
                    var v = resp.data.report[i];
                    if (!v[6].includes("NaN")) {
                        report.push(v);
                    }
                }

                resp.data.report = report;

                onHandled();
            });
            return;
        });

        return;
    } while (false);

    onHandled();
};

exports.clear_challenge_cd = function (player, req, resp, onHandled) {
    do {
        var arena = player.user.arena;
        var cashCost = Math.ceil((arena.challenge_cd - common.getTime()) / conf_mgr.gConfGlobal.arenaChanllengeUnitTime * conf_mgr.gConfGlobal.arenaChanllengeUnitCost);
        if (cashCost <= 0) {
            resp.code = 1; resp.desc = 'no need to clear'; break;
        }

        if (player.user.status.vip < conf_mgr.gConfGlobal.arenaColdSpeedVipLimit) {
            resp.code = 1; resp.desc = 'vip limit'; break;
        }

        var costs = [['user', 'cash', -cashCost]];
        if (!player.checkCosts(costs)) {
            resp.code = 1; resp.desc = 'cash not enough'; break;
        }

        arena.challenge_cd = 0;
        player.markDirty('arena.challenge_cd');

        resp.data.costs = player.addAwards(costs, req.mod, req.act);
    } while (false);

    onHandled();
};

exports.get_replay = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        var type = req.args.type;
        if (!type) {
            resp.code = 1; resp.desc = 'no type'; break;
        }

        if (isCrossArena(type)) {
            requestArenaServer(req, resp, onHandled);
        } else {
            requestWorld(req, resp, onHandled);
            // client_send_msg(ServerName.WORLD, req.act, req.mod, req.args, resp, null, onHandled);
        }
        return;
    } while (false);

    onHandled();
};

// 领取竞技场成就奖励
exports.get_achievement_awards = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!req.args.type || !req.args.level) {
            resp.code = 1; resp.desc = 'no type or level'; break;
        }

        var type = req.args.type;
        var level = req.args.level;

        var conf = conf_mgr.gConfArenaAchievement[type][level];
        if (!conf) {
            resp.code = 1; resp.desc = 'conf not found'; break;
        }

        var arena = user.arena;

        // 检查奖励是否已领取
        if (!arena.award_got[type]) {
            arena.award_got[type] = [];
            player.markDirty(util.format('arena.award_got.%d', type));
        }

        if (arena.award_got[type].indexOf(level) >= 0) {
            resp.code = 1; resp.desc = 'has got'; break;
        }

        // 检查成就是否达成
        var bFinish = false;
        for (var i = type - 1; i < arena.max_rank_tab.length; i++) {
            var rank = arena.max_rank_tab[i];
            if (rank != 0 && rank <= conf.count) {
                bFinish = true;
                break
            }
        }
        if (!bFinish) {
            resp.code = 1; resp.desc = 'not finish'; break;
        }

        // // 检查成就是否达成
        // if (arena.max_rank_tab[type - 1] == 0 || conf.count < arena.max_rank_tab[type - 1]) {
        //     resp.code = 1; resp.desc = 'not finish'; break;
        // }

        resp.data.awards = player.addAwards(conf.award, req.mod, req.act);

        arena.award_got[type].push(level);
        player.markDirty(util.format('arena.award_got.%d', type));

        player.doGuideTask('arenaAchievement', 1);
    } while (false);

    onHandled();
};

exports.sweep = function (player, req, resp, onHandled) {
    var user = player.user;
    do {
        if (!isModuleOpen_new(player, 'arena')) {
            resp.code = 1; resp.desc = 'not open'; break;
        }

        var type = req.args.type;
        if (!type) {
            type = ArenaType.BRONZE;
        }

        if (user.arena.count < conf_mgr.gConfGlobal.arenaMaxCount) {
            user.arena.count++;
            player.markDirty('arena.count');
        } else {
            var cost = [['user', 'atoken', -1]];
            if (!player.checkCosts(cost)) {
                resp.code = 1; resp.desc = 'material not enough'; break;
            }

            resp.data.costs = player.addAwards(cost, req.mod, req.act);
        }

        resp.data.awards = player.addAwards(conf_mgr.gConfArenaBase[type].award, req.mod, req.act);

        user.arena.challenge_cd = common.getTime() + conf_mgr.gConfGlobal.arenaChallengeCD * 60;
        player.markDirty('arena.challenge_cd');
        resp.data.challenge_cd = user.arena.challenge_cd;
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, player, 'arena', 1);
        player.doOpenHoliday('arena', 1);
        user.arena.win_times += 1;
        player.markDirty('arena.win_times');
    } while (false);

    onHandled();
};
