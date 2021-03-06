
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const PlayerManager = require('../logic/player_manager.js');

module.exports = {
    index: 0,
    /**
     *  判断骰子恢复时间
     * @param startTime
     * @returns {{addDiceNum: 增加的骰子数, newTime: 新的时间,如果newTime为0，不取newTime}}
     */
    judgeStartTime: function (startTime) {
        var addDiceNum = 0;// 增加的骰子数量
        var newTime = 0;// 新的时间
        if (startTime <= 0) {
            newTime = common.getTime();
            return {
                addDiceNum: addDiceNum,
                newTime: newTime
            }
        }
        var speedTime = conf_mgr.gConfGlobal.customCaveDiceInterval * 60;
        // var speedTime = 5 * 60;
        addDiceNum = Math.floor((common.getTime() - startTime) / speedTime);
        if (addDiceNum > 0) {
            var taskAway = (common.getTime() - startTime) % speedTime;// 领取骰子之后多余的时间
            newTime = common.getTime() - taskAway;
        }
        return {
            addDiceNum: addDiceNum,
            newTime: newTime
        }
    },

    findTaskLevel: function (type, level) {
        var conf = conf_mgr.gConfExploreTaskDetail[type];
        if (!conf) {
            return 0;
        }

        var preKey = 0;
        for (var k in conf) {
            var key = parseInt(k);
            if (level < key && level >= preKey) {
                return preKey;
            }

            preKey = key;
        }

        return preKey;
    },

    /**
     * 生成随机任务
     * @param level
     * @returns {[null,null]}   [任务信息，任务id]
     */
    createTask: function (level) {
        this.index++;
        var openTask = [];// 可以开启的任务
        var sumTaskWeight = 0;// 可开启任务随机权重总和
        var task = ''; // 随机出来的任务
        for (var i in conf_mgr.gConfExploreTaskBasic) {
            var data = conf_mgr.gConfExploreTaskBasic[i];
            if (data.openLevel <= level) {
                sumTaskWeight += data.taskWeight;
                openTask.push(data)
            }
        }
        var odds = common.randRange(1, sumTaskWeight);
        var num = 0;
        for (var i = 0, len = openTask.length; i < len; i++) {
            num += openTask[i].taskWeight;
            if (odds <= num) {
                task = openTask[i];
                break;
            }
        }
        var star = this.randomStar(task);// 随机星级

        var taskLevel = this.findTaskLevel(task.type, level);
        var taskId = common.getTime() + this.index.toString();

        return [{
            task_id: taskId,
            type: task.type,
            star: star,
            start_time: 0,
            hid: 0,
            reset_num: 0,
            task_level: taskLevel,
        }, taskId]
    },

    // 随机初始星级
    randomStar: function (task) {
        var starWeight = 0;
        var star = 0;
        for (var i = 0, len = task.starWeight.length; i < len; i++) {
            starWeight += task.starWeight[i];
        }

        var odds = common.randRange(1, starWeight);
        var num = 0;

        for (var i = 0, len = task.starWeight.length; i < len; i++) {
            num += task.starWeight[i];
            if (odds <= num) {
                star = i;
                break;
            }
        }

        return star + 1;
    },

    // 随机获取一个路点Id，要排除已经存在boss的路点
    getRandomPathId: function (existPathId) {
        var pathId = 0;

        // 先将已经存在的路点移除
        var pathIds = [];
        for (var k in conf_mgr.gConfExplorePath) {
            if (existPathId.indexOf(parseInt(k)) < 0 && conf_mgr.gConfExplorePath[k].isBoss > 0) {
                pathIds.push(parseInt(k));
            }
        }

        if (pathIds.length > 0) {
            var randIndex = common.randRange(0, pathIds.length - 1);
            pathId = pathIds[randIndex];
        }

        return pathId;
    },

};


/**
 * 强制将玩家数据更新到世界服，用于world和game必须同步的情况，
 * 比如军团踢人的时候，被踢的人结算佣兵奖励，如果在线玩家被踢，且未同步，则取不到时间的佣兵奖励
 * @param {*} uid 
 * @param {*} callback 
 */
exports.forceSyncToWorld = function (uid, callback) {
    var tOnGetPlayer = (player) => {
        if (player && Object.keys(player.memData.dirty).length > 0) {
            var req = {
                mod: 'user',
                act: 'update',
                uid: uid,
                args: {},
            };
            requestWorld(req, {}, function () {
                callback && callback();
            });
        } else {
            callback && callback();
        }
    };
    PlayerManager.get(uid, tOnGetPlayer, true);
};