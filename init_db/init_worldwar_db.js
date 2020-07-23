const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const server = require('../common/server.js');
const { loadDB } = require('../common/db/mongo_mgr.js');

const { WorldWar } = require('../worldwar/logic/worldwar.js');

var worldItems = {};

function main() {
    loadDB(config, onLoadDB);
};

function onLoadDB(db) {
    db.createCollection('user', {}, function (err, result) { });

    db.createCollection('replay', {}, function (err, result) { });

    db.createCollection('world', {}, function (err, result) {
        global.gDBWorld = db.collection('world');

        WorldWar.create();
        worldItems['worldwar'] = 1;
    });

    setTimeout(function () {
        var cursor = db.collection('world').find({}, { _id: 1 });
        cursor.each(function (err, item) {
            if (cursor.isClosed()) {
                if (Object.keys(worldItems).length > 0) {
                    console.log('error');
                    process.exit(-1);
                } else {
                    process.exit(0);
                }
            } else {
                if (!item) return;
                delete worldItems[item._id];
            }
        });
    }, 1000);
}

main();