const redis = require('redis');

/** redis 操作命令 */
exports.COMMAND_TYPE = {
    /** 
     * 判断key是否存在 
     * 【`EXISTS key`】
     * */
    EXISTS: "EXISTS",
    /** 
     * 设定key的有效时长 单位为秒 
     * 【`EXPIRE key seconds`】
     * */
    EXPIRE: "EXPIRE",
    /** 
     * 删除 key 
     * 【`DEL key [key ...]`】
     * */
    DEL: "DEL",

    /** 
     * 获取 key的value 
     * 【`GET key`】
     * */
    GET: "GET",
    /** 
     * 清除有效时长并设定 key的value 字符串，数字 类型 
     * 【`SET key value [EX seconds] [PX milliseconds] [NX|XX]`】
     * EX second ：设置键的过期时间为 second 秒。 SET key value EX second 效果等同于 SETEX key second value 。
     * PX millisecond ：设置键的过期时间为 millisecond 毫秒。 SET key value PX millisecond 效果等同于 PSETEX key millisecond value
     * */
    SET: "SET",
    /** 
     * 将值 value 关联到 key ，并将 key 的生存时间设为 seconds (以秒为单位)。
     * 【`SETEX key seconds value`】
     * */
    SETEX: "SETEX",
    /** 
     * 将给定 key 的值设为 value ，并返回 key 的旧值(old value)。
     * 【`GETSET key value`】
     */
    GETSET: "GETSET",
    /** 
     * 将 key 中储存的数字值增一 并作为返回。
     * 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 INCR 操作。
     * 如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。
     * 本操作的值限制在 64 位(bit)有符号数字表示之内。
     * 【`INCR key`】
     * */
    INCR: "INCR",

    /** 
     * 查看哈希表 key 中，给定域 field 是否存在。 
     * 【`HEXISTS key field`】
     *  */
    HEXISTS: "HEXISTS",
    /** 
     * 删除哈希表 key 中的一个或多个指定域，不存在的域将被忽略。 
     * 【`HDEL key field [field ...]`】
     *  */
    HDEL: "HDEL",
    HGET: "HGET",
    /** 
     * 将哈希表 key 中的域 field 的值设为 value 。
     * 如果 key 不存在，一个新的哈希表被创建并进行 HSET 操作。
     * 如果域 field 已经存在于哈希表中，旧值将被覆盖。
     * 【`HSET key field value`】
     *  */
    HSET: "HSET",

    /** 
     * 返回列表 key 的长度 
     * 【`LLEN key`】
     * */
    LLEN: "LLEN",
    /** 
     * 将一个或多个值 value 插入到列表 key 的表头
     * 如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表头： 比如说，对空列表 mylist 执行命令 LPUSH mylist a b c ，列表的值将是 c b a ，这等同于原子性地执行 LPUSH mylist a 、 LPUSH mylist b 和 LPUSH mylist c 三个命令。
     * 如果 key 不存在，一个空列表会被创建并执行 LPUSH 操作。
     * 【`LPUSH key value [value ...]`】
     *  */
    LPUSH: "LPUSH",
    /** 
     * 移除并返回列表 key 的头元素 
     * 【`LPOP key`】
     * */
    LPOP: "LPOP",
    /** 
     * 将一个或多个值 value 插入到列表 key 的表尾(最右边)。
     * 如果有多个 value 值，那么各个 value 值按从左到右的顺序依次插入到表尾：比如对一个空列表 mylist 执行 RPUSH mylist a b c ，得出的结果列表为 a b c ，等同于执行命令 RPUSH mylist a 、 RPUSH mylist b 、 RPUSH mylist c 。
     * 如果 key 不存在，一个空列表会被创建并执行 RPUSH 操作。
     * 【`RPUSH key value [value ...]`】
     *  */
    RPUSH: "RPUSH",
    /** 
     * 移除并返回列表 key 的尾元素。 
     * 【`RPOP key`】
     * */
    RPOP: "RPOP",
    /** 
     * 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。
     * 举个例子，执行命令 LTRIM list 0 2 ，表示只保留列表 list 的前三个元素，其余元素全部删除。
     * 下标(index)参数 start 和 stop 都以 0 为底，也就是说，以 0 表示列表的第一个元素，以 1 表示列表的第二个元素，以此类推。
     * 你也可以使用负数下标，以 -1 表示列表的最后一个元素， -2 表示列表的倒数第二个元素，以此类推。
     * 当 key 不是列表类型时，返回一个错误。
     * 【`LTRIM key start stop`】
     *  */
    LTRIM: "LTRIM",

    /** 
     * 将一个或多个 member 元素及其 score 值加入到有序集 key 当中。
     * 【`ZADD key score member [[score member] [score member] ...]`】
     *  */
    ZADD: "ZADD",
    /** 
     * 移除有序集 key 中的一个或多个成员，不存在的成员将被忽略。
     * 【`ZREM key member [member ...]`】
     *  */
    ZREM: "ZREM",
    /** 
     * 返回有序集 key 中，成员 member 的 score 值。 
     * 【`ZSCORE key member`】
     *  */
    ZSCORE: "ZSCORE",
    /** 
     * 返回有序集 key 的成员数。 
     * 【`ZCARD key`】
     *  */
    ZCARD: "ZCARD",
    /** 
     * 返回有序集 key 中， score 值在 min 和 max 之间(默认包括 score 值等于 min 或 max )的成员的数量。 
     * 【`ZCOUNT key min max`】
     *  */
    ZCOUNT: "ZCOUNT",
    /**
     * 返回有序集 key 中成员 member 的排名。其中有序集成员按 score 值递减(从大到小)排序。
     * 排名以 0 为底，也就是说， score 值最大的成员排名为 0 。
     * 使用 ZRANK 命令可以获得成员按 score 值递增(从小到大)排列的排名。
     * 【`ZREVRANK key member`】
     */
    ZREVRANK: "ZREVRANK",
    /** 
     * 返回有序集 key 中成员 member 的排名。其中有序集成员按 score 值递增(从小到大)顺序排列。 
     * 【`ZRANK key member`】
     *  */
    ZRANK: "ZRANK",
    /**
     * 返回有序集 key 中，指定区间内的成员。
     * 其中成员的位置按 score 值递增(从小到大)来排序。
     * 具有相同 score 值的成员按字典序(lexicographical order )来排列。
     * 如果你需要成员按 score 值递减(从大到小)来排列，请使用 ZREVRANGE 命令。
     * 下标参数 start 和 stop 都以 0 为底，也就是说，以 0 表示有序集第一个成员，以 1 表示有序集第二个成员，以此类推。你也可以使用负数下标，以 -1 表示最后一个成员， -2 表示倒数第二个成员，以此类推。
     * 超出范围的下标并不会引起错误。比如说，当 start 的值比有序集的最大下标还要大，或是 start > stop 时， ZRANGE 命令只是简单地返回一个空列表。另一方面，假如 stop 参数的值比有序集的最大下标还要大，那么 Redis 将 stop 当作最大下标来处理。可以通过使用 WITHSCORES 选项，来让成员和它的 score 值一并返回，返回列表以 value1,score1, ..., valueN,scoreN 的格式表示。客户端库可能会返回一些更复杂的数据类型，比如数组、元组等。
     * 【`ZRANGE key start stop [WITHSCORES]`】
     */
    ZRANGE: "ZRANGE",
    /**
     * 返回有序集 key 中，指定区间内的成员。
     * 其中成员的位置按 score 值递减(从大到小)来排列。
     * 具有相同 score 值的成员按字典序的逆序(reverse lexicographical order)排列。
     * 除了成员按 score 值递减的次序排列这一点外， ZREVRANGE 命令的其他方面和 ZRANGE 命令一样。
     * 【`ZREVRANGE key start stop [WITHSCORES]`】
     */
    ZREVRANGE: "ZREVRANGE",
    /** 
     * 移除有序集 key 中，指定排名(rank)区间内的所有成员。
     * 区间分别以下标参数 start 和 stop 指出，包含 start 和 stop 在内。
     * 下标参数 start 和 stop 都以 0 为底，也就是说，以 0 表示有序集第一个成员，以 1 表示有序集第二个成员，以此类推。 你也可以使用负数下标，以 -1 表示最后一个成员， -2 表示倒数第二个成员，以此类推。
     * 【`ZREMRANGEBYRANK key start stop`】
     *  */
    ZREMRANGEBYRANK: "ZREMRANGEBYRANK",
    /** 
     * 移除有序集 key 中，所有 score 值介于 min 和 max 之间(包括等于 min 或 max )的成员。
     * 自版本2.1.6开始， score 值等于 min 或 max 的成员也可以不包括在内，详情请参见 ZRANGEBYSCORE 命令。
     * 【`ZREMRANGEBYSCORE key min max`】
     *  */
    ZREMRANGEBYSCORE: "ZREMRANGEBYSCORE",
}

/** 全服聊天所用 大于等于10 默认情况下 redis的索引最高为15 */
exports.REDIS_GLOBAL_CHAT_INDEX = 15;
/** 默认使用的redis数据库index */
exports.REDIS_DEFAULT_INDEX;

/** redis客户端 */
var redis_cli_dict = {};
/** redis订阅器 */
var redis_subscribe_dict = {};

var _old_command_list = [];

exports.loadCache = function (config, index_list, callback) {
    index_list = index_list || [];
    for (var i = 0; i < index_list.length; i++) {
        var index = index_list[i];
        if (i == 0) {
            exports.REDIS_DEFAULT_INDEX = index;
        }
        var redis_cli = init_redis_cli(config, index, callback);
        redis_cli_dict[index] = redis_cli;

        init_redis_subscribe(config, index);
    }

    setInterval(tick, 1 * 1000);
}

function tick() {
    execute_command_again();
}

function init_redis_cli(config, index, callback) {
    var tRedisCli = null;

    var tOnReady = () => {
        tRedisCli.is_ready = true;

        re_add_subscribe(index, tRedisCli);
        callback && callback(tRedisCli);
    }

    tRedisCli = redis.createClient(config.RedisPort, config.RedisHost);
    tRedisCli.auth(config.RedisAuth || '');
    tRedisCli.select(index, onRedisSelect);

    tRedisCli.on('ready', tOnReady);
    tRedisCli.on('error', onRedisError);

    return tRedisCli;
}

function onRedisSelect(err) {
    if (err) {
        ERROR(err);
        process.exit(-1);
    }
}

function onRedisError(err) {
    ERROR(err);
}

/** 检测是否有旧的命令没有执行 ，尝试执行 */
function execute_command_again() {
    var tCommandCount = _old_command_list.length;
    while (tCommandCount >= 0) {
        var tCommandInfo = _old_command_list.pop;
        exports.redis_command(tCommandInfo[0], tCommandInfo[1], tCommandInfo[2], tCommandInfo[3], tCommandInfo[4], tCommandInfo[5], tCommandInfo[6]);
        tCommandCount--;
    }
}
/**
 * 执行redis命令
 * @param {*} index             
 * @param {*} command_type          命令类型 使用方法参考 COMMAND_TYPE 
 * @param {*} key                   操作的key
 * @param {*} value_list            附加参数
 * @param {*} call_back             执行后回调，如果有广播信息值修改成功则为广播后回调 修改失败直接回调
 * @param {*} publish_channel       广播频道
 * @param {*} publish_msg           广播信息
 */
// function redis_command(index, command_type, key, value_list, call_back, publish_channel, publish_msg) {
exports.redis_command = function (index, command_type, key, value_list, call_back, publish_channel, publish_msg) {
    if (!exports.COMMAND_TYPE[command_type]) {
        return false;
    }
    var redis_cli = redis_cli_dict[index];
    if (!redis_cli || !redis_cli.is_ready) {
        _old_command_list.push([index, command_type, key, value_list, call_back, publish_channel, publish_msg]);
        return true;
    }

    var tCallBack = (err, reply) => {
        var tOnPublishCall = () => {
            call_back && call_back(err, reply);
        }

        console.log(" redis command call ", reply, " -- ", err);
        if (err) {
            tOnPublishCall();
        }
        else if (!publish_channel) {
            tOnPublishCall();
        }
        else {
            exports.redis_publish(index, publish_channel, publish_msg, tOnPublishCall);
        }
    }

    var tApplyParms = [];
    if (key) {
        tApplyParms = tApplyParms.concat(key);
    }
    if (value_list) {
        tApplyParms = tApplyParms.concat(value_list);
    }
    if (tCallBack) {
        tApplyParms = tApplyParms.concat(tCallBack);
    }
    redis_cli.send_command(command_type, tApplyParms);
    return true;
    // tRedisCli = redis.createClient(config.RedisPort, config.RedisHost);
    // tRedisCli.send_command()
}

/**———————————————————————————————————————发布—————————————————————————————————————**/
/**
 * 发布消息
 * @param {*} channel       发布频道
 * @param {*} value         发布的消息内容
 * @param {*} call_back     发布情况
 */
exports.redis_publish = function (index, channel, value, call_back) {
    var redis_cli = redis_cli_dict[index];
    if (!redis_clit || !redis_cli._is_ready) { return false }
    let tCallFunc = (err, reply) => {
        call_back && call_back(err, reply);
    }
    redis_cli.publish(channel, value, tCallFunc)

    return tResult;


    tRedisCli = redis.createClient(config.RedisPort, config.RedisHost);
}

/**——————————————————————————————————————订阅——————————————————————————————————————**/
/** 订阅的处理列表 {[index:number] : {[channel:number]:{[call_back:Function]:boolean}} */
var _subscribe_dict = {};

function init_redis_subscribe(config, index, callback) {
    /** 触发订阅消息 */
    var on_sub_message = (channel, msg) => {
        console.log(` redis get msg : ${channel} | ${msg} | ${JSON.parse(msg)}`);
        _subscribe_dict[index] = _subscribe_dict[index] || {};
        var tDict = _subscribe_dict[index][channel];
        if (!tDict) { return; }
        for (var tKey in tDict) {
            tKey(msg);
        }
    }

    var redis_subscribe = init_redis_cli(config, index, callback);
    redis_subscribe_dict[index] = redis_subscribe;
    redis_subscribe.on("subscribe", on_sub_subscribe);
    redis_subscribe.on('message', on_sub_message)
}

/** 监听订阅成功事件 */
function on_sub_subscribe(channel, count) {
    console.log(` redis subscribed to [${channel}] <=> ${count} total subscriptions`);
}

/** 重新添加订阅 */
function re_add_subscribe(index, new_redis_cli) {
    if (redis_subscribe_dict[index] == new_redis_cli) {                              // 这个是订阅器
        for (var channel in _subscribe_dict[index]) {
            if (!channel) { continue; }
            redis_subscribe_dict[index].subscribe(channel);
        }
    }
}

/** 添加订阅 */
exports.add_subscribe = function (index, channel, call_back) {
    var redis_subscribe = redis_subscribe_dict[index]
    if (!channel) { return false; }

    _subscribe_dict[index] = _subscribe_dict[index] || {};
    if (!_subscribe_dict[index][channel]) {
        if (redis_subscribe && redis_subscribe.is_ready) {
            redis_subscribe.subscribe(channel);
        }
        _subscribe_dict[index][channel] = {};
    }
    _subscribe_dict[index][channel][call_back] = true;
    return true;
}

/** 移除订阅 */
exports.remove_subscribe_call = function (index, channel, call_back) {
    if (!_subscribe_dict[index]) { return true; }
    if (!_subscribe_dict[index][channel]) { return true; }
    if (!_subscribe_dict[index][channel][call_back]) { return true; }
    delete _subscribe_dict[index][channel][call_back]
    return true;
}

/** 移除某个频道的订阅 */
exports.remove_subscribe_channel = function (index, channel) {
    var redis_subscribe = redis_subscribe_dict[index]
    _subscribe_dict[index] = _subscribe_dict[index] || {};
    delete _subscribe_dict[index][channel];
    if (!channel || !redis_subscribe) { return true; }
    redis_subscribe.unsubscribe(channel);
    return true;
}