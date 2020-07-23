const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const server = require('../common/server.js');
const { loadDB } = require('../common/db/mongo_mgr.js');

const LegionWar = require('../legionwar/logic/legionwar').LegionWar;

function main() {
    loadDB(config, onLoadDB);
};

function onLoadDB(db) {

    var loader = new common.Loader(function () {
        process.exit(0);
    });

    // 军团数据表
    db.createCollection('legion', {}, function (err, result) { });

    // 机器人数据
    db.createCollection('robot', {}, function (err, result) { });

    // 军团战历史数据
    db.createCollection('history', {}, function (err, result) { });

    // 军团排行榜
    db.createCollection('ranklist', {}, function (err, result) { });

    db.createCollection('world', {}, function (err, result) {
        global.gDBWorld = db.collection('world');

        // 创建军团战数据
        loader.addLoad('LegionWar');
        LegionWar.create(function () {
            loader.onLoad('LegionWar');
        });
    }
    );
};


main();