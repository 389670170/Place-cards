const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const server = require('../common/server.js');
const { loadDB } = require('../common/db/mongo_mgr.js');

const TerritoryWar = require('../territorywar/logic/territorywar').TerritoryWar;
const Replay = require('../territorywar/logic/replay.js').Replay;

function main() {
    loadDB(config, onLoadDB);
};

function onLoadDB(db) {

    var loader = new common.Loader(function () {
        process.exit(0);
    });

    db.createCollection('user', {}, function (err, result) {
    });

    db.createCollection('replay', {}, function (err, result) {
    });

    db.createCollection('territory', {}, function (err, result) {
    });

    db.createCollection('world', {}, function (err, result) {
        global.gDBWorld = db.collection('world');

        // 创建军团战数据
        loader.addLoad('TerritoryWar');
        TerritoryWar.create(function () {
            loader.onLoad('TerritoryWar');
        });

        loader.addLoad('replay');
        Replay.create(function () {
            loader.onLoad('replay');
        });
    });

}

main();