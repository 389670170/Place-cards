const mongodb = require('mongodb');
const config = require(process.argv[2]);
const common = require('../common/common.js');
const server = require('../common/server.js');
const { loadDB } = require('../common/db/mongo_mgr.js');

const LegionWarTopList = require('../global_server/logic/legionwar_toplist').LegionWarTopList;
const Activtiy = require('../global_server/logic/activity').Activity;
const FightRank = require('../global_server/logic/fight_rank.js').FightRank;

function main() {
    loadDB(config, onLoadDB);
};

function onLoadDB(db) {
    var loader = new common.Loader(function () {
        process.exit(0);
    });

    db.createCollection('world', {}, function (err, result) {
        global.gDBWorld = db.collection('world');

        // 创建军团段位排行榜数据
        loader.addLoad('LegionWarTopList');
        LegionWarTopList.create(function () {
            loader.onLoad('LegionWarTopList');
        });

        // 创建全服活动数据
        loader.addLoad('Activity');
        Activtiy.create(function () {
            loader.onLoad('Activity');
        });

        // 创建全服活动数据
        loader.addLoad('FightRank');
        FightRank.create(function () {
            loader.onLoad('FightRank');
        });
    });
}

main();
