const mongodb = require('mongodb');
const UserInfo = require('../world/logic/user.js').UserInfo;
const Battle = require('../world/logic/battle.js').Battle;
const Mine = require('../world/logic/mine.js').Mine;
const SysMail = require('../world/logic/mail.js').SysMail;
const Arena = require('../world/logic/arena.js').Arena;
const Tower = require('../world/logic/tower.js').Tower;
const Legion = require('../world/logic/legion.js').Legion;
const Shipper = require('../world/logic/shipper.js').Shipper;
const Guard = require('../world/logic/guard.js').Guard;
const SysMsg = require('../world/logic/gmPushSysMsg.js').SysMsg;
const Country = require('../world/logic/country.js').Country;
const Activity = require('../world/logic/activity.js').Activity;
const Tips = require('../world/logic/tips.js').Tips;
const Tavern = require('../world/logic/tavern.js').Tavern;
const Replay = require('../world/logic/replay.js').Replay;
const LegionWar = require('../world/logic/legionwar.js').LegionWar;
const Friend = require('../world/logic/friend.js').Friend;
const Clan = require('../world/logic/clan.js').Clan;
const NewLegion = require('../world/logic/new_legion').NewLegion;
const LandGrabber = require('../landgrabber/logic/landgrabber').LandGrabber;
const { loadGlobalServerConf } = require('../common/server.js');
const { ServerName } = require('../common/enum.js');
const conf_mgr = require('../common/conf_mgr.js');

const config = require(process.argv[2]);

require('../common/logger.js');
setupLog('initdb');
global.common = require('../common/common.js');
conf_mgr.loadConf(config, ServerName.GAME);
loadGlobalServerConf(config, ServerName.GAME);

(function main() {
    var mongoServer = new mongodb.Server(config.MongodbHost, config.MongodbPort, { auto_reconnect: true, poolSize: 4 });
    var db = new mongodb.Db(config.MongodbName, mongoServer, { 'native_parser': false, 'w': 1, 'wtimeout': 2, 'fsync': true });

    db.open(function (err, db) {
        if (err) {
            ERROR('db open err!');
            process.exit(-1);
        }

        var loader = new common.Loader(function () {
            process.exit(0);
        });

        loader.addLoad(1);
        db.createCollection('plat', {}, function (err, result) {
            loader.onLoad(1);

            var serverId = config.ServerId || 1;
            var gDBPlat = db.collection('plat');
            loader.addLoad(1);
            gDBPlat.insertOne({ _id: '_userid', 'ai': serverId * 1000000 }, function (err, result) {
                loader.onLoad(1);
            });
        });

        loader.addLoad(1);
        db.createCollection('user', {}, function (err, result) {
            loader.onLoad(1);
        });

        loader.addLoad(1);
        db.createCollection('world', {}, function (err, result) {
            loader.onLoad(1);
            global.gDBWorld = db.collection('world');

            // 玩家信息
            loader.addLoad('userinfo');
            UserInfo.create(function () {
                loader.onLoad('userinfo');
            });

            //  战场
            loader.addLoad('battle')
            Battle.create(function () {
                loader.onLoad('battle');
            });

            //  金矿
            loader.addLoad('mine')
            Mine.create(function () {
                loader.onLoad('mine');
            });

            //  系统邮件和公告
            loader.addLoad('sys_mail')
            SysMail.create(function () {
                loader.onLoad('sys_mail');
            });

            //  竞技场
            loader.addLoad('arena')
            Arena.create(function () {
                loader.onLoad('arena');
            });

            //  千重楼
            loader.addLoad('tower')
            Tower.create(function () {
                loader.onLoad('tower');
            });

            //   军团
            loader.addLoad('legion')
            Legion.create(function () {
                loader.onLoad('legion');
            });

            // 新的军团
            loader.addLoad('new_legion')
            NewLegion.create(config, function () {
                loader.onLoad('new_legion');
            });

            //   押镖
            loader.addLoad('shipper')
            Shipper.create(function () {
                loader.onLoad('shipper');
            });

            //   领地
            loader.addLoad('guard')
            Guard.create(function () {
                loader.onLoad('guard');
            });

            //  //   领地
            // loader.addLoad('sysMsgData')
            // SysMsg.create(function() {
            //     loader.onLoad('SysMsg');
            // });

            //   国家
            loader.addLoad('country')
            Country.create(function () {
                loader.onLoad('country');
            });

            //   活动
            loader.addLoad('activity')
            Activity.create(function () {
                loader.onLoad('activity');
            });

            //   提醒
            loader.addLoad('tips')
            Tips.create(function () {
                loader.onLoad('tips');
            });

            //   酒馆
            loader.addLoad('tavern')
            Tavern.create(function () {
                loader.onLoad('tavern');
            });

            //   酒馆
            loader.addLoad('replay')
            Replay.create(function () {
                loader.onLoad('replay');
            });

            //   军团战
            loader.addLoad('legionwar')
            LegionWar.create(function () {
                loader.onLoad('legionwar');
            });

            //   好友系统
            loader.addLoad('friend')
            Friend.create(function () {
                loader.onLoad('friend');
            });

            // 战队系统
            loader.addLoad('clan');
            Clan.create(config, function () {
                loader.onLoad('clan');
            });

            // 村庄争夺
            loader.addLoad('landgrabber');
            LandGrabber.create(function () {
                loader.onLoad('landgrabber');
            });
        });

        loader.addLoad(1);
        db.createCollection('pay', {}, function (err, result) {
            loader.onLoad(1);
        });

        loader.addLoad(1);
        db.createCollection('analysis', {}, function (err, result) {
            loader.onLoad(1);
        });

        loader.addLoad(1);
        db.createCollection('mail', {}, function (err, result) {
            loader.onLoad(1);
        });
    });
})();
