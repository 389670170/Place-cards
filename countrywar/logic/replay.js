
const util = require('util');
const { COMMAND_TYPE, redis_command } = require('../../common/db/redis_mgr.js');
const redis_mgr = require('../../common/db/redis_mgr.js');

function Replay() {
    this.id = 1;
    this.count = 0;
}

Replay.create = function (callback) {
    gDBCountryWar.save({ _id: '_replay_autoid', ai: 1 }, function (err, result) {
        if (err) {
            ERROR('_replay_autoid create error');
            process.exit(-1);
        }
        callback && callback();
    });
}

Replay.prototype = {
    init: function (callback) {
        gDBCountryWar.find({ _id: '_replay_autoid' }).limit(1).next(function (err, doc) {
            if (doc) {
                this.id = doc.ai;
                callback && callback(true);
            } else {
                callback && callback(false);
            }
        }.bind(this));
    },

    save: function (callback) {
        gDBCountryWar.update({ _id: '_replay_autoid' }, { $set: { ai: this.id } }, function (err, result) {
            if (err) {
                ERROR(err);
                callback && callback(false);
            } else {
                callback && callback(true);
            }
        });
    },

    addReplay: function (replay) {
        this.count += 1;
        this.id += 1;
        if (this.count > 100) {
            this.count = 0;
            gDBCountryWar.update({ _id: '_replay_autoid' }, { $set: { ai: this.id } }, function (err, doc) { });
        }

        var replayKey = util.format('replay_%s_%d', get_svr_dir(), this.id);
        redis_command(redis_mgr.REDIS_DEFAULT_INDEX, COMMAND_TYPE.SET, replayKey, JSON.stringify(replay));
        // gCache.set(replayKey, JSON.stringify(replay));

        return replayKey;
    },

    getReplay: function (replayKey, callback) {
        var tOnCallBack = (err, doc) => {
            callback && callback(err ? null : JSON.parse(doc));
        }
        redis_command(redis_mgr.REDIS_DEFAULT_INDEX, COMMAND_TYPE.GET, replayKey, null, tOnCallBack);
        // gCache.get(replayKey, function (err, doc) {
        //     callback && callback(err ? null : JSON.parse(doc));
        // });
    },

    deleteReplay: function (replayKey) {
        redis_command(redis_mgr.REDIS_DEFAULT_INDEX, COMMAND_TYPE.DEL, replayKey);
        // gCache.del(replayKey);
    },

    updateReplay: function (replayKey, replay) {
        redis_command(redis_mgr.REDIS_DEFAULT_INDEX, COMMAND_TYPE.SET, replayKey, JSON.stringify(replay));
        // gCache.set(replayKey, JSON.stringify(replay));
    },
}

exports.get = function (req, res, resp, onReqHandled) {
    gReplay.getReplay(req.args.id, function (replay) {
        if (replay) {
            resp.data = replay;
        } else {
            resp.code = 1; resp.desc = 'no such replay';
        }
        onReqHandled(res, resp, 1);
    });
}

exports.Replay = Replay;
