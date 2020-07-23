const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const server = require('../common/server.js');
const { loadDB } = require('../common/db/mongo_mgr.js');

const CountryWar = require('../countrywar/logic/countrywar.js').CountryWar;
const Replay = require('../countrywar/logic/replay.js').Replay;

function main() {
    loadDB(config, onLoadDB);
}

function onLoadDB(db) {
    var loader = new common.Loader(function () {
        process.exit(0);
    });

    db.createCollection('user', {}, function (err, result) { });

    db.createCollection('replay', {}, function (err, result) { });

    db.createCollection('rooms', {}, function (err, result) { });

    db.createCollection('countrywar', {}, function (err, result) {
        global.gDBCountryWar = db.collection('countrywar');

        loader.addLoad('countrywar');
        CountryWar.create(function () {
            loader.onLoad('countrywar');
        });

        loader.addLoad('replay');
        Replay.create(function () {
            loader.onLoad('replay');
        });
    });
};

main();