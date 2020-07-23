const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const server = require('../common/server.js');
const { loadDB } = require('../common/db/mongo_mgr.js');

const TeamZone = require('../teamzone/logic/teamzone').TeamZone;

function main() {
    loadDB(config, onLoadDB);
};

function onLoadDB(db) {

    var loader = new common.Loader(function () {
        process.exit(0);
    });

    db.createCollection('user', {}, function (err, result) {
    });

    db.createCollection('world', {}, function (err, result) {
        global.gDBWorld = db.collection('world');

        // 创建小队领地数据
        loader.addLoad('TeamZone');
        TeamZone.create(function () {
            loader.onLoad('TeamZone');
        });
    });

}

main();