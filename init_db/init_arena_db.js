const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const { ServerName } = require('../common/enum.js');
const { loadDB } = require('../common/db/mongo_mgr.js');
const server = require('../common/server.js');
const conf_mgr = require('../common/conf_mgr.js');

const Arena = require('../arena/logic/arena.js').Arena;
const Replay = require('../arena/logic/replay.js').Replay;

// 跨服活动：幸运转盘
const ActLuckyRotation = require('../arena/logic/act_lucky_rotate.js').ActLuckyRotation;

conf_mgr.loadConf(config, ServerName.ARENA);
function main() {
    loadDB(config, onLoadDB);
};

function onLoadDB(db) {
    var loader = new common.Loader(function () {
        process.exit(0);
    });

    db.createCollection('user', {}, function (err, result) { });

    db.createCollection('replay', {}, function (err, result) { });

    db.createCollection('world', {}, function (err, result) {
        global.gDBWorld = db.collection('world');

        loader.addLoad('arena');
        Arena.create(function () {
            loader.onLoad('arena');
        });

        loader.addLoad('lucky_rotation');
        ActLuckyRotation.create(function () {
            loader.onLoad('lucky_rotation');
        })

        loader.addLoad('replay');
        Replay.create(function () {
            loader.onLoad('replay');
        });
    });
};

main();