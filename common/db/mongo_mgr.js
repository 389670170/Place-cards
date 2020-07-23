
const { Server, Db } = require('mongodb');

exports.loadDB = function (config, callback) {
    var tOnOpen = (err, db) => {
        if (err) {
            ERROR(err);
            process.exit(-1);
        }

        callback && callback(db);
    }

    var mongoServer = new Server(config.MongodbHost, config.MongodbPort, { auto_reconnect: true, poolSize: 4 });
    var db = new Db(config.MongodbName, mongoServer, { 'native_parser': false, 'w': 1, 'wtimeout': 10, 'fsync': true });

    db.open(tOnOpen);
}

exports.loadLogDB = function (config, callback) {
    var tOnOpen = (err, db) => {
        if (err) {
            ERROR(err);
            process.exit(-1);
        }

        callback && callback(db);
    };

    var mongoServer = new Server(config.LogMongodbHost, config.LogMongodbPort, { auto_reconnect: true, poolSize: 4 });
    var db = new Db(config.LogMongodbName, mongoServer, { 'native_parser': false, 'w': 1, 'wtimeout': 10, 'fsync': true });

    db.open(tOnOpen);
}