
const util = require('util');
const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const zlib = require('zlib');
const clone = require('clone');

const { ERROR, INFO, LOG } = require('../logger.js');
const { NET_TYPE } = require('../enum.js');
const { getClientIp, defaultHeaders, defaultCrossDomain, htmlHeaders, getTime, isExiting, isBase64, decodeBase64 } = require("../common.js");

var checkOriginHandler = function (query) {
    return true;
}
/** 创建http服务器 */
exports.startHttpServer = function (serverName, else_id, server_info, $checkOriginHandler, handler) {
    if (!server_info) {
        ERROR(` [${serverName}] error server info `);
        process.exit(-1);
        return;
    }
    checkOriginHandler = $checkOriginHandler || checkOriginHandler;
    var ip = server_info.host;
    var port = server_info.port;
    DEBUG(`###### start ${serverName}_${else_id}  on  ${ip}:${port} ######`);
    var listener = function (req, res) {

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Credentials", "true");

        if (isExiting) {
            req.connection.destroy();
            return;
        }

        var body = '';
        req.on('data', function (chunk) {
            body += chunk;
            // POST请求不能超过100M
            if (body.length > 102400000) {
                ERROR('REQUEST BODY TOO LARGE');
                req.connection.destroy();
                return;
            }
        });

        req.on('end', function () {
            if (req.url.endWith('/crossdomain.xml')) {
                res.writeHead(200, defaultHeaders);
                res.end(defaultCrossDomain);
                return;
            } else if (req.url.beginWith('/log/')) {
                handleStaticFile(req.url.substr(1), res);
                return;
            } else if (req.url.endWith('.dat')) {
                var segs = req.url.split('/');
                handleStaticFile((config.ConfDir ? config.ConfDir : 'conf') + '/' + segs[segs.length - 1], res);
                return;
            }
            var rawData = '';
            if (req.method == 'POST') {
                if (isBase64(body)) {
                    rawData = decodeBase64(body);
                }
                else {
                    rawData = body;
                }
            } else {
                req.url = req.url || "/?";
                var tTempUrl = req.url.replace("/?", "");
                if (isBase64(tTempUrl)) {
                    tTempUrl = (new Buffer(tTempUrl, 'base64')).toString('utf8');
                    rawData = url.parse("/?" + tTempUrl, true).query;
                }
                else {
                    rawData = url.parse(req.url).query;
                }
            }
            query = qs.parse(rawData);

            if (!checkOriginHandler(query)) {                           // 来源异常
                handleStaticFile(req.url.substr(1), res);
                return;
            }

            res._rawdata = rawData;
            res._query = query;
            res._args = query.args;
            res._time = +(new Date());
            res._ip = getClientIp(req);
            res._compress = req.headers['accept-encoding'] || '';

            if (config.Debug && query.mod == 'dump_obj') {
                var strData = "";
                try {
                    strData = JSON.stringify(dumpObj(query.path));
                } catch (e) {
                    strData = util.format('%j', e);
                }

                if (strData.length > 1024) {
                    var tCallFunc = (err, out) => {
                        res.setHeader('Content-Encoding', 'deflate');
                        res.end(out);
                    };
                    zlib.deflate(strData, tCallFunc);
                } else {
                    res.end(strData);
                }
                return;
            }

            httpHandleReq(query, res, handler);
        });
    };

    var server = null;
    if (true || serverName.indexOf('game') == -1) {
        server = http.createServer(listener);
    } else {
        server = https.createServer({
            key: fs.readFileSync('./key/server.key'),
            cert: fs.readFileSync('./key/server.crt'),
            ca: fs.readFileSync('./key/server.csr'),
        }, listener);
    }

    server.listen(port, ip);
    console.log(` web server listen on ${ip}:${port} `);

    return server;
}

var staticFilePool = {};
function handleStaticFile(file, res) {
    if (file in staticFilePool) {
        sendStaticFile(file, staticFilePool[file], res);
    } else {
        fs.exists(file, function (exists) {
            if (exists) {
                fs.readFile(file, function (err, data) {
                    //staticFilePool[file] = data;
                    sendStaticFile(file, data, res);
                    delete staticFilePool[file];
                });
            } else {
                res.writeHead(404, defaultHeaders);
                res.end();
            }
        });
    }
}

function httpHandleReq(query, res, handler) {
    var code = 1;
    var desc = '';

    query.uid = +query.uid;
    if (!query.mod) {
        desc = 'no mod';
    } else if (!query.act) {
        desc = 'no act';
    } else if (!query.uid) {
        desc = 'no uid';
    } else if (!query.args) {
        desc = 'no args';
    } else {
        try {
            query.args = JSON.parse(query.args);
            if (typeof (query.args) != 'object') {
                desc = 'args error';
            } else {
                if (!query.args) {
                    ERROR(query);
                    query.args = {};
                }
                code = 0;
            }
        } catch (error) {
            desc = 'args not in json format';
        }
    }

    var resp = {
        'code': code,
        'desc': desc,
        'data': {}
    };

    if (resp.code != 0) {
        onReqHandled(res, resp);
        return;
    }
    handler(NET_TYPE.HTTP_USER, query, res, resp, onReqHandled);
}

function sendStaticFile(file, content, res) {
    if (file.endWith('html') || file.endWith('htm')) {
        res.writeHead(200, htmlHeaders);
    }
    res.end(content);
}

function onReqHandled(res, data, noCompress) {
    if (!data.hasOwnProperty('code')) {
        data.code = 1;
        data.desc = 'no code';
    }

    if (!data.hasOwnProperty('desc')) {
        data.desc = '';
    }

    data.serverTime = getTime();
    var strData = JSON.stringify(data);
    var query = res._query;

    // jsonp
    if (query.args && query.args.callback && query.mod == 'gm') {
        strData = query.args.callback + "(" + strData + ");";
    }

    if (res._compress && strData.length > 1024) {
        zlib.deflate(strData, function (err, out) {
            if (err) {
                DEBUG(`zlib.deflate ERROR:  ${err} : ${strData}`);
            }
            ERROR(`zlib result req handled time = ${Date.now()} ,{uid:${query.uid} ,mod:${query.mod} ,act:${query.act}}`)
            res.setHeader('Content-Encoding', 'deflate');
            res.end(out);
        });
    } else {
        ERROR(`def result req handled time = ${Date.now()} ,{uid:${query.uid} ,mod:${query.mod} ,act:${query.act}}`)
        res.end(strData);
    }

    var timeCost = +(new Date()) - res._time;
    // TODO : 删除此处注释
    //if (data.code = 8 && query.mod == 'push' && query.act == 'push') {
    //    return;
    //}

    var costs = [];
    var awards = [];
    if (data.data) {
        if (data.data.costs) {
            costs = data.data.costs;
        }
        if (data.data.awards) {
            awards = data.data.awards;
        }
    }

    var addr = ``
    if (res.socket) {
        addr = `${res.socket.remoteAddress}:${res.socket.remotePort}`;
    }

    console.log(`onReqHandled addr:${addr} ,time cost:${timeCost}, query:{uid:${query.uid}, mod:${query.mod}, act:${query.act}, seq:${(query.seq || 0)}, resp:{code:${data.code}, desc:${data.desc}}`)
    // LOG(`onReqHandled addr:${addr} ,time cost:${timeCost}, query:{uid:${query.uid}, mod:${query.mod}, act:${query.act}, seq:${(query.seq || 0)}, args:${query.args}}, resp:{data:${data.data}, code:${data.code}, desc:${data.desc}}`)

    // if (timeCost > 1000) {
    //     ERROR(`onReqHandled query:{uid:${query.uid}, mod:${query.mod}, act:${query.act}} cost time:${timeCost}`);
    // }
}