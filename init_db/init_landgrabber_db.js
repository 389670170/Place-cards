const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const { ServerName } = require('../common/enum.js');
const server = require('../common/server.js');
const { loadDB } = require('../common/db/mongo_mgr.js');
const conf_mgr = require('../common/conf_mgr.js');

const LandGrabber = require('../landgrabber/logic/landgrabber.js').LandGrabber;
const Replay = require('../landgrabber/logic/replay.js').Replay;

conf_mgr.loadConf(config, ServerName.LAND_GRABBER, true);

function main() {
    loadDB(config, onLoadDB);
};

function onLoadDB(db) {
    var loader = new common.Loader(function () {
        process.exit(0);
    });

    db.createCollection('user', {}, function (err, result) { });

    db.createCollection('world', {}, function (err, result) {
        global.gDBWorld = db.collection('world');

        loader.addLoad('landgrabber');
        LandGrabber.create(function () {
            loader.onLoad('landgrabber');
        });

        loader.addLoad('replay');
        Replay.create(function () {
            loader.onLoad('replay');
        });
    });
}

main();