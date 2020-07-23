const http = require('http');
const https = require('https');
const util = require('util');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const zlib = require('zlib');

const clone = require('clone');

const common = require('./common.js');
const conf_mgr = require('./conf_mgr.js');
const csv = require('./csv.js');
const logger = require('./logger.js');
const config = require(process.argv[2]);

const { ServerName } = require('./enum.js');
const { isExiting } = require('./common.js');
const { startHttpServer } = require('./net/http_server.js');
const { startWssServer, server_send_msg } = require('./net/ws_server.js');
const { startWSClient, client_send_msg } = require('./net/ws_client.js');

require('./global.js');

exports.loadGlobalServerConf = function (config, serverName, callback) {
    /** 从mysql数据库中获取各地址的服务器列表 */
    var tFromPHPServerList = [
        ServerName.GAME,
        ServerName.WORLD,
        ServerName.WSS,
        ServerName.GATE_WAY,
        ServerName.LOG
    ];
    // if (serverName.indexOf('game') != -1 || serverName == 'world' || serverName == 'wss' || serverName == 'gateway') {
    if (tFromPHPServerList.indexOf(serverName) != -1) {
        // 读取服务器信息
        var phpReq = {
            uid: 1,
            act: 'get_server_info',
            args: {
                uid: 1,
                sid: config.ServerId,
            },
        };

        for (var i in config.Games) {
            common.GLOBAL_SERVER_INFO_DICT[ServerName.GAME] = common.GLOBAL_SERVER_INFO_DICT[ServerName.GAME] || [null];
            common.GLOBAL_SERVER_INFO_DICT[ServerName.GAME].push(
                {
                    host: config.Games[i][0],
                    port: config.Games[i][1],
                }
            )
        }

        common.GLOBAL_SERVER_INFO_DICT[ServerName.WORLD] = { host: config.WorldHost, port: config.WorldListen };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.GATE_WAY] = { host: config.GatewayHost, port: config.GatewayListen };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.WSS] = { host: config.WorldHost, port: config.WssPort };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.LOG] = { host: config.LogServerHost, port: config.LogServerPort };

        var phpResp = {};
        phpResp.code = 0;
        phpResp.desc = '';

        var tOnPhpRequest = () => {
            if (phpResp.code == 0) {
                var tServerInfoDict = phpResp['desc'];

                var tServerStartTime = csv.parseDate(tServerInfoDict['ServerStartTime']);
                common.GLOBAL_SERVER_INFO_DICT.serverStartTime = tServerStartTime;
                common.GLOBAL_SERVER_INFO_DICT.serverStartDate = getGameDate(tServerStartTime);

                common.GLOBAL_SERVER_INFO_DICT[ServerName.GLOBAL] = {
                    host: tServerInfoDict['globalHost'],
                    port: tServerInfoDict['globalPort']
                }

                common.GLOBAL_SERVER_INFO_DICT[ServerName.WORLD_WAR] = {
                    host: tServerInfoDict['worldWarHost'],
                    port: tServerInfoDict['worldWarPort'],
                    open_time: csv.parseDate(tServerInfoDict['worldWarOpenTime']),
                }

                common.GLOBAL_SERVER_INFO_DICT[ServerName.LEGION_WAR] = {
                    host: tServerInfoDict['legionWarHost'],
                    port: tServerInfoDict['legionWarPort'],
                }

                common.GLOBAL_SERVER_INFO_DICT[ServerName.TERRITORY_WAR] = {
                    host: tServerInfoDict['territoryWarHost'],
                    port: tServerInfoDict['territoryWarPort'],
                }

                common.GLOBAL_SERVER_INFO_DICT[ServerName.COUNTRY_WAR] = {
                    host: tServerInfoDict['countryWarHost'],
                    port: tServerInfoDict['countryWarPort'],
                }

                common.GLOBAL_SERVER_INFO_DICT[ServerName.ARENA] = {
                    host: tServerInfoDict['arenaServerHost'],
                    port: tServerInfoDict['arenaServerPort'],
                }

                common.GLOBAL_SERVER_INFO_DICT[ServerName.LAND_GRABBER] = {
                    host: tServerInfoDict['landgrabberArrHost'],
                    port: tServerInfoDict['landgrabberArrPort'],
                }

                common.GLOBAL_SERVER_INFO_DICT[ServerName.TEAM_ZONE] = {
                    host: tServerInfoDict['teamZoneHost'],
                    port: tServerInfoDict['teamZonePort'],
                }

                callback && callback();
            }
        }
        requestPHP(phpReq, phpResp, tOnPhpRequest);
    }
    else {
        common.GLOBAL_SERVER_INFO_DICT[ServerName.TEAM_ZONE] = {
            host: config.TeamZoneHost,
            port: config.TeamZonePort,
        };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.TERRITORY_WAR] = {
            host: config.TerritoryWarHost,
            port: config.TerritoryWarPort,
        };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.WORLD_WAR] = {
            host: config.WorldWarHost,
            port: config.WorldWarPort,
        };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.LEGION_WAR] = {
            host: config.LegionWarServerHost,
            port: config.LegionWarServerPort,
        };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.COUNTRY_WAR] = {
            host: config.CountryWarHost,
            port: config.CountryWarPort,
        };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.ARENA] = {
            host: config.ArenaServerHost,
            port: config.ArenaServerPort,
        };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.LAND_GRABBER] = {
            host: config.LandGrabberHost,
            port: config.LandGrabberPort,
        };
        common.GLOBAL_SERVER_INFO_DICT[ServerName.GLOBAL] = {
            host: config.GlobalServerHost,
            port: config.GlobalServerPort
        };

        callback && callback();
    }
}

/**
 * 创建服务器侦听
 * @param {*} serverName                服务器名字
 * @param {*} else_id                   附加id
 * @param {*} port                      侦听端口
 * @param {*} ip                        侦听地址
 * @param {Array<string>} server_list   是他的服务端名字列表 如果没有则代表全部 如果为数组则每个元素代表一个服务器的名字
 * @param {*} checkOriginHandler        检测客户端是否可以建立连接 socket是否可以连接 (orgin ,call) => void
 * @param {*} onNetHandler              消息处理方式        socket消息处理方式 this指向的是对象{conn,request}
 * @param {*} onNetClose                连接关闭            
 * @param {*} onExit                    服务器关闭
 */
exports.startWebServer = function (serverName, else_id, server_list, checkOriginHandler, onNetHandler, onNetClose, onExit) {
    var tGlobalServerInfo = common.GLOBAL_SERVER_INFO_DICT[serverName];
    var tServerInfo = null;
    if (tGlobalServerInfo && Array.isArray(tGlobalServerInfo)) {
        tServerInfo = tGlobalServerInfo[else_id];
    }
    else {
        tServerInfo = tGlobalServerInfo;
    }

    if (!tServerInfo) {
        return;
    }

    var tHttpServre = startHttpServer(serverName, else_id, tServerInfo, checkOriginHandler, onNetHandler, onNetClose);

    startWssServer(serverName, else_id, tHttpServre, checkOriginHandler, onNetHandler, onNetClose);

    startServer(serverName, else_id, onExit);
    if (ServerName[serverName] == ServerName.ARENA) { return; }

    if (!server_list) {
        server_list = [];
        for (var tKey in ServerName) {
            server_list.push(ServerName[tKey]);
        }
    }
    startWSClient(serverName, else_id, server_list, checkOriginHandler, onNetHandler, onNetClose);
}

function startServer(serverName, else_id, onExit) {
    var pidFile;
    serverName = serverName.replace(/\//g, "");
    if (!else_id && else_id != 0) {
        pidFile = `pid_${serverName}_${config.ServerId}.pid`;
    }
    else {
        pidFile = `pid_${serverName}_${config.ServerId}_${else_id}.pid`;
    }

    var tOnUncaughtException = (err) => {
        ERROR(err.stack);
        LogError(err.stack);

        if (err.code == 'EADDRINUSE') {
            beforExit();
        }
    }

    var beforExit = () => {
        INFO(serverName + ' begin shutdown');
        isExiting = true;

        if (onExit) {
            onExit(endExit);
        } else {
            endExit();
        }
    }

    var sigusr2 = () => {

    }

    var endExit = () => {
        fs.existsSync(pidFile) && fs.unlinkSync(pidFile);
        INFO(serverName + ' end shutdown');

        // delete this
        DEBUG('end stopping : ' + (new Date()) / 1000);
        shutdownLog(function () {
            process.exit();
        });
    }

    process.on('SIGINT', beforExit);
    process.on('SIGTERM', beforExit);
    process.on('SIGQUIT', beforExit);
    process.on('SIGABRT', beforExit);
    process.on('SIGHUP', beforExit);
    process.on('SIGUSR2', sigusr2);

    process.on('uncaughtException', tOnUncaughtException);

    INFO(serverName + ' start');
    fs.writeFileSync(pidFile, process.pid, 'utf8');
}















exports.requestWorld = global.requestWorld = function (query, resp, callback) {
    client_send_msg(ServerName.WORLD, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: config.WorldHost,
    //     port: config.WorldListen,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var gateResp = null;
    //         try {
    //             gateResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('world resp ' + data);
    //             gateResp = null;
    //         }

    //         if (!gateResp) {
    //             resp.code = 1;
    //             resp.desc = 'request world error';
    //         } else {
    //             resp.code = gateResp.code;
    //             resp.desc = gateResp.desc;
    //             resp.data = gateResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function () {
    //     resp.code = 1;
    //     resp.desc = 'request world error';
    //     callback && callback(null);
    // });

    // // 更新世界服
    // var update = {};
    // if (query.uid) {

    //     var player = PlayerManager.players[query.uid];
    //     if (player) {
    //         // 重新计算战斗属性
    //         player.getFightForce(true);
    //         //update['allUser'] = clone(player.user);

    //         //ERROR('=========SERVER-REQUIST WORLD:UPDATE DIRTY:');
    //         //ERROR(player.memData.dirty);
    //         var arrangedDirty = player.arrangeDirty(player.memData.dirty);
    //         for (var item in arrangedDirty) {
    //             var obj = player.user;
    //             var mirrorObj = gInitWorldUser;
    //             var args = item.split(".");
    //             var ok = true;
    //             for (var i = 0; i < args.length; i++) {
    //                 if (typeof (obj) != 'object') {
    //                     // 未找到
    //                     ok = false;
    //                     break;
    //                 }
    //                 obj = obj[args[i]];
    //                 if (typeof (mirrorObj) == 'object' && mirrorObj[args[i]]) {
    //                     mirrorObj = mirrorObj[args[i]];
    //                 } else {
    //                     mirrorObj = 0;
    //                     item = args[0];
    //                     for (var j = 1; j <= i; j++) {
    //                         item += '.' + args[j];
    //                     }
    //                     break;
    //                 }
    //             }

    //             if (ok && obj != undefined && obj != NaN && obj != null) {
    //                 var result = obj;
    //                 if (typeof (mirrorObj) == 'object' && !(util.isArray(mirrorObj))) {
    //                     result = mapObject(obj, mirrorObj);
    //                 }
    //                 update[item] = result;
    //             } else {
    //                 ERROR('invalid world update: ' + item);
    //             }
    //         }
    //         player.memData.dirty = {};

    //         for (var pos in player.memData.pos) {
    //             // 更新装备
    //             for (var type in player.memData.pos[pos].equip_changed) {
    //                 var eid = player.user.pos[pos].equip[type];
    //                 if (eid) {
    //                     var equip = player.user.bag.equip[eid];
    //                     if (equip) {
    //                         update['pos.' + pos + '.equip.' + type] = {
    //                             id: equip.id,
    //                             grade: equip.grade,
    //                             //intensify : equip.intensify,
    //                             //refine_exp : equip.refine_exp,
    //                         };
    //                     }
    //                 } else {
    //                     update['pos.' + pos + '.equip.' + type] = null;
    //                 }
    //             }
    //             player.memData.pos[pos].equip_changed = {};
    //         }
    //     }
    // }

    // req.end(`mod=${query.mod}&act=${query.act}&uid=${query.uid}&args=${JSON.stringify(query.args)}&update=${JSON.stringify(update)}`);
    // req.end();
};


global.requestWorldSimple = function (query, resp, callback) {
    client_send_msg(ServerName.WORLD, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: config.WorldHost,
    //     port: config.WorldListen,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var gateResp = null;
    //         try {
    //             gateResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('world resp ' + data);
    //             gateResp = null;
    //         }

    //         if (!gateResp) {
    //             resp.code = 1;
    //             resp.desc = 'request world error';
    //         } else {
    //             resp.code = gateResp.code;
    //             resp.desc = gateResp.desc;
    //             resp.data = gateResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function () {
    //     resp.code = 1;
    //     resp.desc = 'request world error';
    //     callback && callback(null);
    // });

    // req.end(`mod=${query.mod}&act=${query.act}&uid=${query.uid}&args=${JSON.stringify(query.args)}`);
    // req.end();
};

global.requestWorldByModAndAct = function (req, mod, act, args, callback) {
    var reqWorld = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respWorld = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestWorld(reqWorld, respWorld, function () {
        callback && callback(respWorld);
    });
};

global.httpGet = function (host, port, path, callback, json, useSSL) {
    var options = {
        host: host,
        port: port,
        path: path,
        rejectUnauthorized: false,
    };

    var request = http.get;
    if (false && useSSL) {
        request = https.get;
    }
    request(options, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks).toString();
            if (json) {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = null;
                }
            }
            callback && callback(data);
        });
    }).on('error', function (e) {
        if (json) {
            callback && callback(null);
        } else {
            callback && callback('error');
        }
    });
};

global.requestWorldWar = function (query, resp, callback) {
    client_send_msg(ServerName.WORLD_WAR, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT.worldWarHost,
    //     port: common.GLOBAL_SERVER_INFO_DICT.worldWarPort,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var worldWarResp = null;
    //         try {
    //             worldWarResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('worldwar resp ' + data);
    //             worldWarResp = null;
    //         }

    //         if (!worldWarResp) {
    //             resp.code = 1;
    //             resp.desc = 'request worldwar error';
    //         } else {
    //             resp.code = worldWarResp.code;
    //             resp.desc = worldWarResp.desc;
    //             resp.data = worldWarResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request worldwar error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};

global.requestTerritoryWar = function (query, resp, callback) {
    client_send_msg(ServerName.TERRITORY_WAR, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT.territoryWarHost,
    //     port: common.GLOBAL_SERVER_INFO_DICT.territoryWarPort,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var territoryWarResp = null;
    //         try {
    //             territoryWarResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('territorywar resp ' + data);
    //             territoryWarResp = null;
    //         }

    //         if (!territoryWarResp) {
    //             resp.code = 1;
    //             resp.desc = 'request territorywar error';
    //         } else {
    //             resp.code = territoryWarResp.code;
    //             resp.desc = territoryWarResp.desc;
    //             resp.data = territoryWarResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request territorywar error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};

global.requestTeamZone = function (query, resp, callback) {
    client_send_msg(ServerName.TEAM_ZONE, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT.teamzoneHost,
    //     port: common.GLOBAL_SERVER_INFO_DICT.teamzonePort,
    //     path: '/',
    //     method: 'POST'
    // };

    // // DEBUG(common.GLOBAL_SERVER_INFO_DICT.teamzoneHost);
    // // DEBUG(common.GLOBAL_SERVER_INFO_DICT.teamzonePort);
    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var teamZoneResp = null;
    //         try {
    //             teamZoneResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('team zone resp ' + data);
    //             teamZoneResp = null;
    //         }

    //         if (!teamZoneResp) {
    //             resp.code = 1;
    //             resp.desc = 'request team zone error';
    //         } else {
    //             resp.code = teamZoneResp.code;
    //             resp.desc = teamZoneResp.desc;
    //             resp.data = teamZoneResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request team zone error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};
global.requestTeamZoneByModAndAct = function (req, mod, act, args, callback) {
    var reqTeamZone = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respTeamZone = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestTeamZone(reqTeamZone, respTeamZone, function () {
        callback && callback(respTeamZone);
    });
}
global.requestTerritoryWarByModAndAct = function (req, mod, act, args, callback) {
    client_send_msg(ServerName.TERRITORY_WAR, query.act, query.mod, query, resp, null, callback);
    // var reqTerritoryWar = {
    //     mod: mod,
    //     act: act,
    //     uid: req.uid,
    //     seq: req.seq ? req.seq : 0,
    //     args: args || {},
    // };

    // var respTerritoryWar = {
    //     'code': 0,
    //     'desc': '',
    //     'data': {},
    // };

    // requestTerritoryWar(reqTerritoryWar, respTerritoryWar, function () {
    //     callback && callback(respTerritoryWar);
    // });
}
global.requestGlobal = function (query, resp, callback) {
    client_send_msg(ServerName.GLOBAL, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT.globalHost,
    //     port: common.GLOBAL_SERVER_INFO_DICT.globalPort,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var globalResp = null;
    //         try {
    //             globalResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('global resp ' + data);
    //             globalResp = null;
    //         }

    //         if (!globalResp) {
    //             resp.code = 1;
    //             resp.desc = 'request global error';
    //         } else {
    //             resp.code = globalResp.code;
    //             resp.desc = globalResp.desc;
    //             resp.data = globalResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request global error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};

global.requestGlobalByModAndAct = function (req, mod, act, args, callback) {
    var reqGlobal = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respGlobal = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestGlobal(reqGlobal, respGlobal, function () {
        callback && callback(respGlobal);
    });
}

global.requestWorldWarByModAndAct = function (req, mod, act, args, callback) {
    var reqWorldWar = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respWorldWar = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestWorldWar(reqWorldWar, respWorldWar, function () {
        callback && callback(respWorldWar);
    });
};

global.requestWss = function (query, resp, callback) {
    client_send_msg(ServerName.WSS, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: "127.0.0.1",
    //     port: config.WssPort,
    //     localAddress: "127.0.0.1",
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var WssResp = null;
    //         try {
    //             WssResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('worldwar resp ' + data);
    //             WssResp = null;
    //         }

    //         if (!WssResp) {
    //             resp.code = 1;
    //             resp.desc = 'request wss error';
    //         } else {
    //             resp.code = WssResp.code;
    //             resp.desc = WssResp.desc;
    //             resp.data = WssResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request wss error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j&type=%s&flag=%s', query.mod, query.act, query.uid, query.args, query.type, query.flag));
    // req.end();
}

global.requestClientWorld = function (sid, query, resp, callback) {
    server_send_msg(ServerName.WORLD, query.act, query.mod, query, resp, null, callback);
    // if (!config.ClientWorldServers[sid]) {
    //     resp.code = 1; resp.desc = "no this server: " + sid;
    //     callback && callback(sid); return;
    // }

    // requestClientWorldByIpAndPort(sid, config.ClientWorldServers[sid].host, config.ClientWorldServers[sid].port, query, resp, callback);
};

global.requestClientWorldByIpAndPort = function (sid, host, port, query, resp, callback) {
    server_send_msg(ServerName.WORLD, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: host,
    //     port: port,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var worldResp = null;
    //         try {
    //             worldResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('' + sid + ' world resp ' + data);
    //             worldResp = null;
    //         }

    //         if (!worldResp) {
    //             resp.code = 1;
    //             resp.desc = 'request ' + sid + ' world error';
    //         } else {
    //             resp.code = worldResp.code;
    //             resp.desc = worldResp.desc;
    //             resp.data = worldResp.data;
    //         }

    //         callback && callback(sid);
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request ' + sid + ' world error';
    //     console.log(err);
    //     callback && callback(sid);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};

// global.requestFightServer = function (query, resp, callback) {
//     var options = {
//         host: config.FightHost,
//         port: config.FightPort,
//         path: config.FightPath,
//         method: 'POST',
//     };

//     var req = http.request(options, function (res) {
//         var chunks = [];
//         res.on('data', function (chunk) {
//             chunks.push(chunk);
//         });

//         res.on('end', function () {
//             var data = Buffer.concat(chunks).toString();
//             var fightResp = null;
//             try {
//                 fightResp = JSON.parse(data);
//             } catch (error) {
//                 ERROR('fight resp ' + data + " query:" + JSON.stringify(query));
//                 fightResp = null;
//             }

//             if (!fightResp) {
//                 resp.code = 1; resp.desc = 'request fight error';
//             } else {
//                 resp.code = fightResp.code;
//                 resp.desc = fightResp.desc;
//                 resp.data = fightResp.data;
//             }

//             callback && callback();
//         });
//     });

//     req.on('error', function (err) {
//         resp.code = 1;
//         resp.desc = 'request fight error';
//         callback && callback(null);
//     });

//     req.end(util.format('attacker=%s&enemy=%s&attackerInfo=%j&enemyInfo=%j', query.attacker, query.enemy, query.attackerInfo, query.enemyInfo));
//     req.end();
// }

// global.requestLogServer = function (query, resp, callback) {
//     var options = {
//         host: config.LogServerHost,
//         port: config.LogServerPort,
//         path: '/',
//         method: 'POST'
//     };

//     var req = http.request(options, function (res) {
//         var chunks = [];
//         res.on('data', function (chunk) {
//             chunks.push(chunk);
//         });

//         res.on('end', function () {
//             var data = Buffer.concat(chunks).toString();
//             var legionWarResp = null;
//             try {
//                 legionWarResp = JSON.parse(data);
//             } catch (error) {
//                 ERROR('log server resp ' + data);
//                 legionWarResp = null;
//             }

//             if (!legionWarResp) {
//                 resp.code = 1;
//                 resp.desc = 'request log server error';
//             } else {
//                 resp.code = legionWarResp.code;
//                 resp.desc = legionWarResp.desc;
//                 resp.data = legionWarResp.data;
//             }

//             callback && callback();
//         });
//     });

//     req.on('error', function (err) {
//         resp.code = 1;
//         resp.desc = 'request log server error';
//         callback && callback(null);
//     });

//     req.end(util.format('mod=%s&act=%s&uid=%s&type=%d&args=%j', query.mod, query.act, query.uid, query.type, query.args));
//     req.end();
// };

exports.addGameLog = function (type, args, callback) {
    return;
    // var reqLog = {
    //     mod: 'logmanager',
    //     act: 'log',
    //     uid: 1,
    //     type: type,
    //     args: args || {},
    // };

    // var respLog = {
    //     'code': 0,
    //     'desc': '',
    //     'data': {},
    // };

    // requestLogServer(reqLog, respLog, function () {
    //     callback && callback(respLog);
    // });
};

global.requestLegionWar = function (query, resp, callback) {
    client_send_msg(ServerName.LEGION_WAR, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT.legionWarHost,
    //     port: common.GLOBAL_SERVER_INFO_DICT.legionWarPort,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var legionWarResp = null;
    //         try {
    //             legionWarResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('global resp ' + data);
    //             legionWarResp = null;
    //         }

    //         if (!legionWarResp) {
    //             resp.code = 1;
    //             resp.desc = 'request legionwar error';
    //         } else {
    //             resp.code = legionWarResp.code;
    //             resp.desc = legionWarResp.desc;
    //             resp.data = legionWarResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request legionwar error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};

global.requestLegionWarByModAndAct = function (req, mod, act, args, callback) {
    var reqLegionWar = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respLegionWar = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestLegionWar(reqLegionWar, respLegionWar, function () {
        callback && callback(respLegionWar);
    });
};


global.requestCountryWar = function (query, resp, callback) {
    client_send_msg(ServerName.COUNTRY_WAR, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT.countryWarHost,
    //     port: common.GLOBAL_SERVER_INFO_DICT.countryWarPort,
    //     path: '/',
    //     method: 'POST'
    // };

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var countryWarResp = null;
    //         try {
    //             countryWarResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('server war resp ' + data);
    //             countryWarResp = null;
    //         }

    //         if (!countryWarResp) {
    //             resp.code = 1;
    //             resp.desc = 'request countrywar error';
    //         } else {
    //             resp.code = countryWarResp.code;
    //             resp.desc = countryWarResp.desc;
    //             resp.data = countryWarResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request countrywar error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};

global.requestCountryWarByModAndAct = function (req, mod, act, args, callback) {
    var reqCountryWar = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respCountryWar = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestCountryWar(reqCountryWar, respCountryWar, function () {
        callback && callback(respCountryWar);
    });
}

global.requestArenaServer = function (query, resp, callback) {
    client_send_msg(ServerName.ARENA, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT[ServerName.ARENA].host,
    //     port: common.GLOBAL_SERVER_INFO_DICT[ServerName.ARENA].port,
    //     path: '/',
    //     method: 'POST'
    // };

    // DEBUG('requestArenaServer host : ' + options.host + ', port : ' + options.port);

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var arenaServerResp = null;
    //         try {
    //             arenaServerResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('arena server resp ' + data);
    //             arenaServerResp = null;
    //         }

    //         if (!arenaServerResp) {
    //             resp.code = 1;
    //             resp.desc = 'request arena server error';
    //         } else {
    //             resp.code = arenaServerResp.code;
    //             resp.desc = arenaServerResp.desc;
    //             resp.data = arenaServerResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request arena server error';
    //     callback && callback(null);
    // });

    // req.end(util.format('mod=%s&act=%s&uid=%s&args=%j', query.mod, query.act, query.uid, query.args));
    // req.end();
};

global.requestArenaServerByModAndAct = function (req, mod, act, args, callback) {
    var reqCountryWar = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respArenaWar = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestArenaServer(reqCountryWar, respArenaWar, function () {
        callback && callback(respArenaWar);
    });
}

// 请求村庄争夺服务器
global.requestLandGrabber = function (query, resp, callback) {
    client_send_msg(ServerName.LAND_GRABBER, query.act, query.mod, query, resp, null, callback);
    // var options = {
    //     host: common.GLOBAL_SERVER_INFO_DICT.landGrabberHost,
    //     port: common.GLOBAL_SERVER_INFO_DICT.landGrabberPort,
    //     path: '/',
    //     method: 'POST'
    // };

    // DEBUG('requestLandGrabber host : ' + options.host + ', port : ' + options.port);

    // var req = http.request(options, function (res) {
    //     var chunks = [];
    //     res.on('data', function (chunk) {
    //         chunks.push(chunk);
    //     });

    //     res.on('end', function () {
    //         var data = Buffer.concat(chunks).toString();
    //         var landGrabberResp = null;
    //         try {
    //             landGrabberResp = JSON.parse(data);
    //         } catch (error) {
    //             ERROR('land grabber server resp ' + data);
    //             landGrabberResp = null;
    //         }

    //         if (!landGrabberResp) {
    //             resp.code = 1;
    //             resp.desc = 'request arena server error';
    //         } else {
    //             resp.code = landGrabberResp.code;
    //             resp.desc = landGrabberResp.desc;
    //             resp.data = landGrabberResp.data;
    //         }

    //         callback && callback();
    //     });
    // });

    // req.on('error', function (err) {
    //     resp.code = 1;
    //     resp.desc = 'request land grabber server error';
    //     callback && callback(null);
    // });

    // req.end(`mod=${query.mod}&act=${query.act}&uid=${query.uid}&args=${JSON.stringify(query.args)}`);
    // req.end();
};

global.requestLandGrabberByModAndAct = function (req, mod, act, args, callback) {
    var reqLandGrabber = {
        mod: mod,
        act: act,
        uid: req.uid,
        seq: req.seq ? req.seq : 0,
        args: args || {},
    };

    var respLandGrabber = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    requestLandGrabber(reqLandGrabber, respLandGrabber, function () {
        callback && callback(respLandGrabber);
    });
}

global.getMailsAndBulletins = function (uid, options, res, onHandled) {
    var worldReq = {
        mod: 'mail',
        act: 'get',
        uid: uid,
        args: {
            options: options,
        },
    };

    var worldResp = {};
    requestWorld(worldReq, worldResp, function () {
        if (worldResp.code == 0) {
            var selfMails = worldResp.data.mail;
            var sysMails = worldResp.data.sys_mail;
            var mails = [];
            var bulletins = [];
            for (var id in selfMails) {
                selfMails[id].id = +id;
                selfMails[id].sys = 0;
                mails.push(selfMails[id]);
            }
            for (var id in sysMails) {
                var mail = sysMails[id];
                mail.id = +id;
                mail.sys = 1;
                if (mail.type == 0) {
                    mail.from = 0;
                    mails.push(mail);
                } else {
                    bulletins.push(mail);
                }
            }
            res.mails = mails;
            res.bulletins = bulletins;
        }

        onHandled();
    });
}

global.pushToUser = function (uid, type, args, flag) {
    var reqWss = {
        uid: uid,
        mod: 'push',
        act: 'push',
        type: type,    // 'self', 'all', null
        flag: flag,
        args: args,
    }
    requestWss(reqWss, {});
}

global.pushToGroupUser = function (uids, type, args, flag) {
    for (var i = 0, max = uids.length; i < max; i++) {
        var reqWss = {
            uid: uids[i],
            mod: 'push',
            act: 'push',
            type: type,    // 'self', 'all', null
            flag: flag,
            args: args,
        }
        requestWss(reqWss, {});
    }
}

// 根据触发类型触发系统提示
global.pushSysMsg = function (type, array) {
    if (!type || !array) {
        return;
    }

    var conf = conf_mgr.gConfChatNotice[type];
    if (!conf) {
        return;
    }

    var typeId = conf.id;
    var wssReq = {
        uid: 10000,
        mod: 'chat',
        act: 'push_sys_msg',
        args: {},
    };

    var wssResp = {};
    wssReq.args.type_id = typeId;
    wssReq.args.type = type;
    wssReq.args.array = array;
    requestWss(wssReq, wssResp);
};


// 根据触发类型触发系统提示
global.gmPushSysMsg = function (array) {
    if (!array) {
        return;
    }
    var wssReq = {
        uid: 10000,
        mod: 'chat',
        act: 'push_sys_msg',
        args: {},
    };

    var wssResp = {};
    wssReq.args.type_id = 13;
    wssReq.args.type = "gmPushSysMsg";
    wssReq.args.array = array;
    requestWss(wssReq, wssResp);
};

global.addUserChatMsg = function (uid, type, content, info) {
    var reqWss = {
        uid: uid,
        mod: 'chat',
        act: 'chat',
        args: {
            type: type,        // 类型，'world' 世界聊天, 'friend' 好友聊天', 'legion' 军团聊天
            content: content,  // 聊天文本
            info: info,        // 其他附加信息, 用于系统发红包等
        },
    };
    requestWss(reqWss, {});
}

global.delUserChatMsg = function (uid, type, content, info) {
    var reqWss = {
        uid: uid,
        mod: 'chat',
        act: 'del_msg',
        args: {
            type: type,
            content: content,
            info: info,
        },
    };

    requestWss(reqWss, {});
}

global.markChatMsg = function (uid, type, info) {
    var reqWss = {
        uid: uid,
        mod: 'chat',
        act: 'mark_msg',
        args: {
            type: type,
            info: info,
        },
    };

    requestWss(reqWss, {});
}

global.updateWssData = function (uid, args) {
    var reqWss = {
        uid: uid,
        mod: 'user',
        act: 'update',
        type: 'self',
        args: args
    };

    requestWss(reqWss, {});
}









global.getDistId = exports.getDistId = function (game) {
    if (config.DistConfig[game]) {
        return config.DistConfig[game];
    } else {
        return config.DistConfig[config.DefaultGame];
    }
};

global.requestPHP = exports.requestPHP = function (query, resp, callback) {
    var options = {
        host: config.PHPHost,
        port: config.PHPPort,
        path: config.PHPPath,
        method: 'POST',
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
        }
    };

    var req = http.request(options, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks).toString();
            var phpResp = null;
            try {
                phpResp = JSON.parse(data);
            } catch (error) {
                ERROR('php resp ' + data + " query:" + JSON.stringify(query));
                phpResp = null;
            }

            if (!phpResp) {
                resp.code = 1; resp.desc = 'request php error';
            } else {
                resp.code = phpResp.code;
                resp.desc = phpResp.desc;
                resp.data = phpResp.data;
            }

            callback && callback();
        });
    });

    req.on('error', function (err) {
        resp.code = 1;
        resp.desc = 'request php error';
        callback && callback(null);
    });

    req.end(util.format('uid=%s&act=%s&args=%s&client_ip=%s', query.uid, query.act, encodeURIComponent(JSON.stringify(query.args)), query.client_ip || ''));
    req.end();
};

// global.requestFootprintServer = function (query, resp, callback) {
//     var footprintHost = config.footprintHost;
//     if (!footprintHost) {
//         footprintHost = '120.92.3.203';
//     }
//     var footprintPort = config.footprintPort;
//     if (!footprintPort) {
//         footprintPort = 80;
//     }
//     var footprintPath = config.footprintPath;
//     if (!footprintPath) {
//         footprintPath = '/msanguo/footprint.php';
//     }

//     var options = {
//         host: footprintHost,
//         port: footprintPort,
//         path: footprintPath,
//         method: 'POST',
//         headers: {
//             "Content-Type": 'application/x-www-form-urlencoded',
//         }
//     };

//     var req = http.request(options, function (res) {
//         var chunks = [];
//         res.on('data', function (chunk) {
//             chunks.push(chunk);
//         });

//         res.on('end', function () {
//             callback && callback();
//         });
//     });

//     req.on('error', function (err) {
//         resp.code = 1;
//         resp.desc = 'request php error';
//         callback && callback(null);
//     });

//     req.end(util.format('openid=%d&uid=%s&platform=%s&device_mac=%s&device_imei=%s&device_system=%s&device_name=%s&type=%s&dist_id=%d',
//         query.openid, query.uid, query.platform, query.device_mac,
//         query.device_imei, query.device_system, query.device_name, query.type, query.dist_id));
//     req.end();
// };

// global.footprint = exports.footprint = function (openid, uid, platform, type) {
//     if (config.NoHack) {
//         return;
//     }

//     var phpReq = {
//         openid: openid,
//         uid: uid,
//         platform: platform,
//         device_mac: 0,
//         device_imei: 0,
//         device_system: 0,
//         device_name: 0,
//         type: type,
//         dist_id: config.DistId,
//     };

//     var phpResp = {
//         code: 0,
//         desc: '',
//     };
//     requestFootprintServer(phpReq, phpResp);
// };

global.requestPHPLogServer = function (query, resp, callback) {
    var logHost = config.LogHost;
    if (!logHost) {
        logHost = '120.92.3.203';
    }
    var logPort = config.LogPort;
    if (!logPort) {
        logPort = 80;
    }
    var logPath = config.LogPath;
    if (!logPath) {
        logPath = '/msanguo/exceptionHandler.php';
    }

    var options = {
        host: logHost,
        port: logPort,
        path: logPath,
        method: 'POST',
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
        }
    };

    var req = http.request(options, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            callback && callback();
        });
    });

    req.on('error', function (err) {
        resp.code = 1;
        resp.desc = 'request php error';
        callback && callback(null);
    });

    req.end(util.format('server=%d&subject=%s&content=%s',
        query.server, query.subject, query.content));
    req.end();
};

global.LogError = exports.LogError = function (msg) {
    if (config.NoHack) {
        return;
    }

    var serverId = config.DistId;
    var phpReq = {
        server: serverId,
        subject: 'server_' + serverId + '_crash',
        content: msg,
    };

    var phpResp = {
        code: 0,
        desc: '',
    };
    requestPHPLogServer(phpReq, phpResp);
};