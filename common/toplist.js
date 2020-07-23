
const util = require('util');
const { COMMAND_TYPE, redis_command } = require('../common/db/redis_mgr.js');

/**
 * 排行榜
 */

/**
 * 排行榜
 * @param redis_index   Redis客户端
 * @param name          排行榜名字
 * @param direction     排行方向（默认从大到小）
 * @constructor
 */
function TopList(redis_index, name, direction) {
    this.redis_index = redis_index;
    this.name = name;
    this.direction = direction || 'DEC';
}

TopList.prototype = {

    /**
     * 向排行榜添加数据或更新数据
     * @param weight        排名依据（如战斗力）
     * @param dat           该排名保存的数据
     * @param callback
     */
    add: function (weight, dat, callback) {
        var tOnCallBack = (err, resp) => {
            callback && callback(err);
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZADD, null, [this.name, weight, util.format('%j', dat)], tOnCallBack);
        // this.redisClient.zadd(
        //     [this.name, weight, util.format('%j', dat)], function (err, resp) {
        //         callback && callback(err);
        //     });
    },

    /**
     * 向排行榜添加数据或更新数据
     * @param dat           数据[weight1, data1, weight2, data2
     * ]
     * @param callback
     */
    adds: function (dat, callback) {
        var args = [this.name];

        for (var idx = 0; idx < dat.length; ++idx) {
            if (idx % 0 == 0) {
                args.push(dat[idx]);
            } else {
                args.push(util.format('%j', dat[idx]));
            }
        }

        var tOnCallBack = (err, resp) => {
            callback && callback(err);
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZADD, null, args, tOnCallBack);
        // this.redisClient.zadd(args, function (err, resp) {
        //     callback && callback(err);
        // });
    },

    /**
     * 取排行榜长度
     * @param callback
     */
    getLength: function (callback) {
        var tOnCallBack = (err, resp) => {
            callback && callback(err, +resp);
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZCARD, this.name, null, tOnCallBack);
        // this.redisClient.zcard(this.name, function (err, resp) {
        //     callback && callback(err, +resp);
        // });
    },

    /**
     * 取排名
     * @param dat
     * @param callback
     */
    getRank: function (dat, callback) {
        if (this.direction == 'DEC') {
            this._getRevRank(dat, callback);
        } else {
            this._getRank(dat, callback);
        }
    },

    /**
     * 取排名区间内的数据
     * @param start         排名(0表示第一名)
     * @param end           排名(-1表示最后一名)
     * @param callback
     */
    getRange: function (start, end, callback) {
        if (this.direction == 'DEC') {
            this._getRevRange(start, end, callback);
        } else {
            this._getRange(start, end, callback);
        }
    },

    /**
     * 清空排行榜
     * @param callback
     */
    clear: function (callback) {
        var tOnCallBack = (err) => {
            callback && callback(err);
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZREMRANGEBYRANK, null, [this.name, 0, -1], tOnCallBack);
        // this.redisClient.zremrangebyrank([this.name, 0, -1], function (err) {
        //     callback && callback(err);
        // });
    },

    _getRank: function (dat, callback) {
        var tOnCallBack = (err, resp) => {
            callback && callback(err, resp == null ? -1 : +resp);
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZRANK, null, [this.name, util.format('%j', dat)], tOnCallBack);
        // this.redisClient.zrank(
        // [this.name, util.format('%j', dat)], function (err, resp) {
        //     callback && callback(err, resp == null ? -1 : +resp);
        // });
    },
    _getRevRank: function (dat, callback) {
        var tOnCallBack = (err, resp) => {
            callback && callback(err, resp == null ? -1 : +resp);
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZREVRANK, null, [this.name, util.format('%j', dat)], tOnCallBack);
        // this.redisClient.zrevrank(
        //     [this.name, util.format('%j', dat)], function (err, resp) {
        //         callback && callback(err, resp == null ? -1 : +resp);
        //     });
    },

    _getRange: function (start, end, callback) {
        var tOnCallBack = (err, resp) => {
            if (callback) {
                if (!err) {
                    for (var key in resp) {
                        if (!resp.hasOwnProperty(key)) {
                            continue;
                        }
                        try {
                            resp[key] = JSON.parse(resp[key]);
                        } catch (e) { }
                    }
                    callback(null, resp);
                } else {
                    callback(err);
                }
            }
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZRANGE, null, [this.name, start, end], tOnCallBack);
        // this.redisClient.zrange([this.name, start, end], function (err, resp) {
        //     if (callback) {
        //         if (!err) {
        //             for (var key in resp) {
        //                 if (!resp.hasOwnProperty(key)) {
        //                     continue;
        //                 }
        //                 try {
        //                     resp[key] = JSON.parse(resp[key]);
        //                 } catch (e) { }
        //             }
        //             callback(null, resp);
        //         } else {
        //             callback(err);
        //         }
        //     }
        // });
    },
    _getRevRange: function (start, end, callback) {
        var tOnCallBack = (err, resp) => {
            if (callback) {
                if (!err) {
                    for (var key in resp) {
                        if (!resp.hasOwnProperty(key)) {
                            continue;
                        }
                        try {
                            resp[key] = JSON.parse(resp[key]);
                        } catch (e) { }
                    }
                    callback(null, resp);
                } else {
                    callback(err);
                }
            }
        }
        redis_command(this.redis_index, COMMAND_TYPE.ZREVRANGE, null, [this.name, start, end], tOnCallBack);
        // this.redisClient.zrevrange([this.name, start, end], function (err, resp) {
        //     if (callback) {
        //         if (!err) {
        //             for (var key in resp) {
        //                 if (!resp.hasOwnProperty(key)) {
        //                     continue;
        //                 }
        //                 try {
        //                     resp[key] = JSON.parse(resp[key]);
        //                 } catch (e) { }
        //             }
        //             callback(null, resp);
        //         } else {
        //             callback(err);
        //         }
        //     }
        // });
    }
};
exports.TopList = TopList;
