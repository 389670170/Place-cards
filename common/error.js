// 错误码
exports.TEAMZONE_ErrorCode = {
    ERROR_NO_TEAM: 201,      // 不是领主

};

// 错误描述
var TEAMZONE_ErrorSring = {

};

// 查找错误描述
exports.TEAMZONE_findErrorString = function (code) {
    return TEAMZONE_ErrorSring[code + ''] || code;
};




// 错误码
exports.TERRITORYWAR_ErrorCode = {
    ERROR_TRANSFER_COUNT_NOT_ENOUGH: 201,  // 传送次数不足
    ERROR_TARGET_CELL_HAS_ENEMY: 202,  // 目标关隘上有敌方玩家
    ERROR_YOU_ARE_IN_FIGHT_STATE: 203,  // 您处于战斗状态
    ERROR_CITY_NOT_VISIT: 204,  // 关隘未访问
    ERROR_USER_NOT_FOUND: 205,  // 未找到玩家信息
    ERROR_EMPTY_CELL: 206,  // 空格子
    ERROR_CAN_NOT_FIND_CELL_INFO: 207,  // 找不到格子信息
    ERROR_TRANSFER_TARGET_ERROR: 208,  // 传送目标错误，不在敌人列表里
    ERROR_TRANSFER_NOT_OPEN: 209,  // 传送还没开，访问的石碑还不足3个
    ERROR_TARGET_NOT_IN_NEIGHBOR_CELL: 210,  // 目标不在相邻格子里
    ERROR_NOT_CONTAIN_THIS_LID: 211,  // 敌人列表里面没有当前领地
    ERROR_CELL_HAS_GATHER: 212,  // 格子已经采集过
    ERROR_CAN_NOT_OCCUPY_ENEMY_MINE: 213,  // 不能占领地方领地的矿
    ERROR_TARGET_CELL_IS_NOT_MINE: 214,  // 目标格子不是矿
    ERROR_TARGET_MINE_HAS_OCCUPY: 215,  // 目标矿已经被占领
    ERROR_CAN_NOT_ROB_SELF_MINE: 216,  // 不能掠夺自己领地的矿
    ERROR_TARGET_MINE_HAS_ROB: 217,  // 已经掠夺过目标矿
    ERROR_TARGET_CELL_IS_NOT_CREATURE: 218,  // 目标格子不是怪
    ERROR_CAN_NOT_FIND_CREATURE_INFO: 219,  // 找不到怪物信息
    ERROR_SHARE_MONSTER_IS_DEAD: 220,  // 共享怪物已死亡
    ERROR_PRIVATE_MONSTER_IS_DEAD: 221,  // 个人怪物已死亡
    ERROR_CAN_NOT_FIND_TARGET_PLAYER: 222,  // 找不大目标玩家
    ERROR_CAN_NOT_ATTACK_LEGION_MEMBER: 223,  // 不能攻击本军团成员
    ERROR_TARGET_IS_IN_FIGHT_STATE: 224,  // 目标处于战斗状态
    ERROR_AWARD_HAS_GOT: 225,  // 奖励已领取
    ERROR_ACHIEVEMENT_NOT_FINISH: 226,  // 成就未达成
    ERROR_HAS_EXPLORE: 227,  // 已经有已经在探索了，只能同时探索一个
    ERROR_CELL_NOT_VISITED: 228,  // 格子未访问过
    ERROR_ACTION_POINT_NOT_ENOUGH: 229,  // 您的体力不足
    ERROR_STAYING_POWER_NOT_ENOUGH: 230,  // 您的耐力不足
    ERROR_MATERIAL_NOT_ENOUGH: 231,  // 无尽傀儡数量不足
    ERROR_CASH_NOT_ENOUGH: 232,  // 元宝不足
    ERROR_BUY_ACTION_COUNT_NOT_ENOUGH: 233,  // 购买体力次数不足
    ERROR_CAN_NOT_FIND_RELIC: 234,  // 未获得遗迹
    ERROR_RELIC_NUM_NOT_ENOUGH: 235,  // 遗迹数量不足
    ERROR_RELIC_IS_ALREADY_STARTED: 236,  // 遗迹正在探索中
    ERROR_TERRITORY_NOT_OPEN: 237,  // 领地战未开启
    ERROR_TRANSFER_FUNC_NOT_OPEN: 238,  // 传送功能未开启
    ERROR_PATH_HAS_ENEMY: 241,  // 路上有敌人
    ERROR_NOT_BOSS_CHALLENGE_TIME: 242,  // 不在活动时间段，无法挑战
    ERROR_NOT_SEC_KILL: 243,  // 不能碾压
    ERROR_USER_LEVEL_NOT_ENOUGH: 244,  // 等级不足
    ERROR_LEGION_LEVEL_NOT_ENOUGH: 245,  //

};

// 错误描述
var TERRITORYWAR_ErrorSring = {
    '101': 'DB error',
    '102': 'Stage not fit',
    '103': 'First round not yet start',
    '104': 'Upgrade city buffer to max',
    '105': 'Player garrion time used up',
    '106': 'Player already garrion this city',
    '107': 'Arm alreay garrion',
    '108': 'Player not garrion this arm',
    '109': 'Player not in own legion',
    '110': 'Arm is dead',
    '111': 'Arm is underattack',
    '112': 'Battle timeout',
    '113': 'Not the attacker',
    '114': 'City can not attack',
    '115': 'Invalid args',
    '116': 'Target is not dark',
    '117': 'Target city already can attack',
    '118': 'City is alive',
    '119': 'Legion do not have user',
    '120': 'Stage not equal',
};

// 查找错误描述
exports.TERRITORYWAR_findErrorString = function (code) {
    return TERRITORYWAR_ErrorSring[code + ''] || code;
};

// 事件类型
exports.TERRITORYWAR_EventType = {
    EVENT_VISIT_OUR_STELE: 1,    // 访问自己领地石碑
    EVENT_VISIT_OTHER_STELE: 2,    // 访问其他领地石碑
    EVENT_MINE_WAS_ROBED: 3,    // 矿点被掠夺
    EVENT_TRANSFER_OPEN: 4,    // 传送门开启
    EVENT_MATCH_ENEMY: 5,    // 匹配到敌人T
    EVENT_ACTIVE_WATCH_TOWER: 6,    // 激活哨塔
    EVENT_OCCUPY_MINE: 7,    // 占领矿
    EVENT_DEFEAT_ENEMY_IN_OUR_CITY: 8,    // 在己方领地击败敌人
    EVENT_WAS_DEFEAT_BY_IN_OTHER_CITY: 9,    // 在敌方领地被敌人击败
    EVENT_WAS_DEFEAT_BY_IN_OUR_CITY: 10,   // 在我方领地被击败
    EVENT_ROB_MINE: 11,   // 掠夺矿
};

// 错误码
exports.LEGION_ErrorCode = {
    ERROR_NAME_INVALID: 100,            // 军团名字不合法
    ERROR_COST_NOT_ENOUGH: 101,         // 消耗不足
    ERROR_INVALID_ARGS: 102,            // 参数有误
    ERROR_FLAG_SET_CONDITION: 103,      // 使用旗面条件不满足
    ERROR_TEXTURE_SET_CONDITION: 104,   // 使用花纹条件不满足
    ERROR_LEGION_NOT_EXIST: 105,        // 军团不存在
    ERROR_LEGION_ALREADY_EXIST: 106,    // 军团已经存在
    ERROR_NO_PRIORITY: 107,             // 没有权限
    ERROR_NOTICE_INVALID: 108,          // 公告不合法
    ERROR_CAN_NOT_JOIN: 109,            // 玩家等级不足，无法加入
    ERROR_APPLY_COUNT_MAX: 110,         // 申请数已经最大
    ERROR_ALREADY_HAS_LEGION: 111,      // 已经加入了军团
    ERROR_ALREADY_APPLY: 112,           // 已经申请
    ERROR_DUTY_COUNT_MAX: 113,          // 该职位成员数量达到上限
    ERROR_JOB_NOT_LEGAL: 114,           // 职位不合法
    ERROR_CAN_NOT_IMPEACH: 115,         // 不满足弹劾条件
    ERROR_ALREADY_IMPEACH: 116,         // 已经发起弹劾
    ERROR_CAN_NOT_GET_AWARD: 117,       // 不满足领取奖励的条件
    ERROR_BUILD_AWARD_HAS_GOT: 118,     // 军团建设宝箱已领取
    ERROR_NOT_JOIN_BONFIRE: 119,        // 没有加入篝火
    ERROR_MEMBER_NOT_EXIST: 120,        // 成员不存在
    ERROR_LEGION_NAME_EXIST: 121,       // 军团名已被占用
    ERROR_LEGION_JOIN_CD: 122,          // 加入军团时间冷却中
    ERROR_GRAB_RED_GIT_MAX: 123,        // 此类型红包数已经达到上限
    ERROR_RED_GIFT_IS_GONE: 124,        // 红包已经被别人抢走
    ERROR_BUILD_COUNT_MAX: 125,         // 今日建设次数已达上限
    ERROR_ADD_WOOD_COUNT_MAX: 126,      // 添柴次数已达上限
    ERROR_ADD_FIRE_COUNT_MAX: 127,      // 加火次数已达上限
    ERROR_ADD_WOOD_CD_TIME: 128,        // 添柴冷却中
    ERROR_ADD_FIRE_CD_TIME: 129,        // 加火冷却中
    ERROR_MEMBER_COUNT_MAX: 130,        // 军团成员数量达到上限
    ERROR_ALREADY_JOIN_BONFIRE: 131,    // 已经加入篝火了
    ERROR_BONFIRE_NOT_OPEN: 132,        // 篝火尚未开启
    ERROR_BONFIRE_HAS_FINISH: 133,      // 篝火已经结束
    ERROR_CAN_NOT_KICK_SELF: 134,       // 不能踢出自己
    ERROR_CAN_NOT_KICK_MEMBER: 135,     // 不能踢出成员，军团经验不够扣
    ERROR_NOT_INSPIRE_TIME: 136,        // 不在鼓舞时间内
    ERROR_INSPIRE_COUNT_MAX: 137,       // 今日鼓舞次数已达上限
    ERROR_BOSS_ID_NOT_MATCH: 138,       // bossId不正确
    ERROR_BOSS_FIGHT_COUNT_MAX: 139,    // 今日boss挑战次数已达上限
    ERROR_BOSS_NOT_FIGHT_TIME: 140,     // 不在boss挑战时间内
    ERROR_LEAVE_TIME_LIMIT: 141,        // 退出保护时间内
    ERROR_CAN_NOT_DISSOLVE: 142,        // 军团战期间不能解散
    ERROR_OTHER_ALREADY_HAS_LEGION: 143,     // 其它玩家已加入军团
};


// 错误码
exports.LEGIONWAR_ErrorCode = {
    ERROR_DB_ERROR: 101,        // 数据库出错
    ERROR_STAGE_NOT_FIT: 102,        // 服务器不在合适的阶段
    ERROR_FIRST_ROUND_NOT_YET_START: 103,        // 第一轮还没开始
    ERROR_UPGRADE_CITYBUF_MAX: 104,        // 已经增筑到最大等级
    ERROR_PLAYER_GARRION_TIME_USE_UP: 105,        // 驻守次数用光
    ERROR_PLAYER_ALREADY_GARRION_THIS_CITY: 106,        // 该玩家已经在该城市驻守
    ERROR_CITY_ARM_ALREADY_GASSION: 107,        // 该位置已经有人了
    ERROR_PLAYER_NOT_GARRION_THIS_CITY: 108,        // 玩家没有驻守在这个位置
    ERROR_PLAYER_NOT_IN_OWN_LEGION: 109,        // 玩家不属于本军团
    ERROR_ARM_IS_DEAD: 110,        // 敌方已经阵亡
    ERROR_ARM_IS_UNDERATTACK: 111,        // 敌方正在被攻击
    ERROR_BATTLE_TIMEOUT: 112,        // 战斗超时
    ERROR_NOT_THE_ATTACKER: 113,        // 不是攻击者
    ERROR_CITY_CAN_NOT_ATTACK: 114,        // 城池不能攻击
    ERROR_INVALID_ARGS: 115,        // 参数错误
    ERROR_ARM_IS_NOT_DARK: 116,        // 目标不是一个暗格
    ERROR_CITY_ALREADY_CAN_ATTACK: 117,        // 目标城池已经可以攻击
    ERROR_CITY_IS_ALIVE: 118,        // 城池还活着
    ERROR_LEGION_DONT_HAVE_USER: 119,        // 该军团没有这个玩家
    ERROR_STAGE_NOT_EQUAL: 120,        // 服务器间状态不一致
    ERROR_PLAYER_ALREADY_UPGRADE_THIS_CITY: 121,        // 该玩家已经在该城市增筑
    ERROR_PLAYER_ALREADY_GOT_LEGIONWAR_SCORE: 122,        // 该玩家已经领取完个人贡献
    ERROR_PLAYER_NO_BUFF_CITY: 123,        // 该玩家没有正在增筑的城池
    ERROR_CARD_USE_MAX: 124,        // 卡牌使用达到上限
    ERROR_NO_SUCH_CARD: 125,        // 找不到此卡
    ERROR_CARD_NOT_ENOUGH: 126,        // 卡牌不足
    ERROR_NEW_MEMBER_CAN_NOT_USE: 127,        // 新加入的成员不能使用卡牌
    ERROR_NO_SUCH_LEGION: 128,        // 找不到指定军团
    ERROR_IDLE_CANNOT_ENTER_BATTLE: 129,        // 休战阶段不能进入战场
    ERROR_ATTACK_NUM_LIMIT: 130,        // 攻击次数不足
};

// 错误描述
var LEGIONWAR_ErrorSring = {
    '101': 'DB error',
    '102': 'Stage not fit',
    '103': 'First round not yet start',
    '104': 'Upgrade city buffer to max',
    '105': 'Player garrion time used up',
    '106': 'Player already garrion this city',
    '107': 'Arm alreay garrion',
    '108': 'Player not garrion this arm',
    '109': 'Player not in own legion',
    '110': 'Arm is dead',
    '111': 'Arm is underattack',
    '112': 'Battle timeout',
    '113': 'Not the attacker',
    '114': 'City can not attack',
    '115': 'Invalid args',
    '116': 'Target is not dark',
    '117': 'Target city already can attack',
    '118': 'City is alive',
    '119': 'Legion do not have user',
    '120': 'Stage not equal',
    '121': 'Player already upgrade this city',
    '122': 'Player already got legionwar score',
    '123': 'can not find player',
    '124': 'card use count reach max',
    '125': 'no such card',
    '126': 'card not enough',
    '127': 'new member can not use card',
    '128': 'no such legion',
    '129': 'idle cannot enter battle',
    '130': 'No attack num',
};

// 查找错误描述
exports.LEGIONWAR_findErrorString = function (code) {
    return LEGIONWAR_ErrorSring[code + ''] || code;
};

exports.LEGIONWAR_StageType = {
    INVALID: 0,    // 无效
    PREPARE: 1,    // 准备阶段
    FIGHT: 2,      // 战斗阶段
    IDLE: 3,       // 休战阶段
    NOT_JOIN: 4,   // 未参与，军团等级不足
};





// 错误码
exports.LANDGRABBER_ErrorCode = {
    ERROR_NOT_VILLAGE_OWNER: 201,      // 不是领主
    ERROR_IN_PROTECT_TIME: 202,        // 在保护时间内
    ERROR_HAS_OCCUPY_LAND: 203,        // 已经占了一块地了
    ERROR_LAND_REMAIN_TIME_ZERO: 204,       // 地块剩余时间为0
    ERROR_NO_TEAM: 205,                // 没有队伍
    ERROR_HAS_OCCUPY_VILLAGE: 206,     // 已经占领了一个村庄了
    ERROR_OCCUPY_VILLAGE_COST_NOT_ENOUGH: 207, //  占领村庄资源不足
    ERROR_VILLAGE_NOT_RELEASE: 208,    // 村庄还未解救
    ERROR_OCCUPY_LAND_COST_NOT_ENOUGH: 209,    // 占地凭证不足
    ERROR_OCCUPY_CONFLICT: 210,    // 当前占领操作冲突
};

// 错误描述
var LANDGRABBER_ErrorSring = {

};

// 查找错误描述
exports.LANDGRABBER_findErrorString = function (code) {
    return LANDGRABBER_ErrorSring[code + ''] || code;
};





// 错误码
exports.ARENA_ErrorCode = {


};

// 错误描述
var ARENA_ErrorSring = {

};

// 查找错误描述
exports.ARENA_findErrorString = function (code) {
    return ARENA_ErrorSring[code + ''] || code;
};






// 错误码
exports.COUNTRYWAR_ErrorCode = {
    ERROR_CAN_NOT_REACH: 201,          // 不能到达指定城池
    ERROR_CAN_NOT_ENTER: 202,          // 不能进入指定城池
    ERROR_IN_PROTECT_TIME: 203,          // 城池在保护时间
    ERROR_CAN_NOT_SPECIAL_MOVE: 204,          // 不满足突进条件
    ERROR_NO_MATCH_PLAYER: 205,          // 没有匹配到玩家
    ERROR_NO_SELF_SIDE_PLAYER: 206,          // 没有己方玩家
    ERROR_CAN_NOT_FIND_USER: 207,          // 找不到玩家
    ERROR_ALREADY_REPLY_CALL: 208,          // 已经响应过的集结令
    ERROR_CALL_NOT_EXIST: 209,          // 集结令不存在
    ERROR_CITY_NOT_EXIST: 210,          // 目标城池不存在
    ERROR_CALL_OUT_OF_TIME: 211,          // 集结令过时
    ERROR_YOU_ARE_DEAD: 212,          // 您的角色已死亡
    ERROR_TARGET_CITY_EXIST_CALL: 213,          // 目标城池已经有集结令了
    ERROR_TARGET_CITY_IS_NOT_NEIGHBOR: 214,          // 目标城池与所在城池不相邻
    ERROR_CAN_NOT_FIND_PATH: 215,          // 找不到到达路径
    ERROR_MOVE_TIME_NOT_ENOUGH: 216,          // 此轮国战结束之前到达不了目标城池，时间不够
    ERROR_HAS_GOT_TASK_AWARD: 217,          // 已经领取过任务奖励
    ERROR_TASK_NOT_FINISH: 218,          // 任务还没完成
    ERROR_TASK_CONFIG_ERROR: 219,          // 任务配置出错，找不到任务数据
    ERROR_IS_IN_COOL_TIME: 220,          // 正在冷却中
    ERROR_GOODS_NOT_ENOUGH: 221,          // 物资不足
    ERROR_CALL_ITEM_NOT_ENOUGH: 222,          // 集结令不足
    ERROR_COUNTRY_WAR_NOT_OPEN: 223,          // 国战未开启
    ERROR_NOT_COUNTRY_WAR_TIME: 224,          // 不是国战时间
    ERROR_COUNTRY_POSITION_NOT_ENOUGH: 225,          // 官职不满足要求
    ERROR_CASH_NOT_ENOUGH: 226,          // 元宝不足，无法发布召集令
    ERROR_CITY_IN_FIGHT: 227,          // 当前城池处于战斗状态
    ERROR_CALL_COUNT_MAX: 228,          // 集结令数量已达上限
    ERROR_CITY_IS_IN_FIGHT: 229,          // 城池处于战斗状态
    ERROR_SERVER_OPEN_DAYS_NOT_ENOUGH: 230,          // 服务器开服天数不满足
    ERROR_ROOM_NOT_OPEN: 231,          // 房间还没开启
    ERROR_USER_LEVEL_NOT_ENOUGH: 232,          // 玩家等级不足
    ERROR_READY_TIME: 233,          // 准备阶段
};

// 错误描述
var COUNTRYWAR_ErrorSring = {
    '201': 'can not reach target city',
    '202': 'can not enter target city',
    '203': 'city in protect time',
};

// 查找错误描述
exports.COUNTRYWAR_findErrorString = function (code) {
    return COUNTRYWAR_ErrorSring[code + ''] || code;
};

// 事件类型
exports.COUNTRYWAR_EventType = {
    EVENT_KILL_PLAYER_1: 1,    // **击败了**
    EVENT_KILL_PLAYER_2: 2,    // **击败了**
    EVENT_KILL_PLAYER_3: 3,    // **击败了**
    EVENT_BACK_TO_CITY: 4,    // 撤军
    EVENT_BROADCAST_CALL: 5,    // 发布号令
    EVENT_OCCUPY_CITY: 6,    // 占领城池
    EVENT_BEAT_BACK_ENEMY: 7,    // 击退敌方阵营
};





// 错误码
exports.Team_ErrorCode = {
    ERROR_ARGS_INVALID: 1,          // 参数错误
    ERROR_TEAM_NAME_EMPTY: 302,          // 队伍名称为空
    ERROR_TEAM_NAME_EXIST: 303,          // 队伍名称已经存在
    ERROR_ALREADY_HAS_TEAM: 304,          // 玩家已经有队伍了
    ERROR_NOT_TEAM_LEADER: 305,          // 不是队长
    ERROR_TEAM_NOT_EXIST: 306,          // 队伍不存在
    ERROR_APPLY_LIST_FULL: 307,          // 申请列表已满
    ERROR_NOT_APPLY_YET: 308,          // 还未申请
    ERROR_LEADER_CAN_NOT_LEAVE: 309,          // 队长不能离开队伍
    ERROR_NOT_TEAM_MEMBER: 310,          // 不是该队伍成员
    ERROR_BADGE_CAN_NOT_USE: 311,         // 徽章未激活
    ERROR_ALREADY_TEAM_LEADER: 312,         // 已经是队长了
    ERROR_CAN_NOT_KICK_SELF: 313,         // 不能踢出自己
    ERROR_CAN_NOT_IMPEACH_SELF: 314,         // 不能弹劾自己
    ERROR_IMPEACH_CONDITION_NOT_ENOUGH: 315,         // 弹劾条件不满足
    ERROR_MEMBER_LIST_FULL: 316,         // 成员列表已满
    ERROR_DAILY_TASK_FULL: 317,         // 今日任务数已满
    ERROR_TEAM_NOT_OPEN: 318,         // 小队系统未开启
    ERROR_TEAM_NAME_TOO_LONE: 319,         // 队伍名字太长
    ERROR_CREATE_COSTS_NOT_ENOUGH: 320,         // 创建队伍所需资源不足
    ERROR_NICKNAME_IS_EMPTY: 321,         // 昵称不能为空
    ERROR_BULLETIN_IS_EMPTY: 322,         // 公告内容不能为空
    ERROR_BULLETIN_TOO_LONE: 323,         // 公告内容太长
    ERROR_MODIFY_NAME_COSTS_NOT_ENOUGH: 324,         // 修改队伍名称所需资源不足
    ERROR_ALREADY_GOT_AWARD: 325,         // 已经领取奖励
    ERROR_LAST_JOIN_TIME_TOO_NEAR: 326,         // 距离上次加入队伍时间不足12小时
    ERROR_DAILY_TASK_REACH_MAX: 327,         // 今日任务已达上限
    ERROR_TASK_ALREADY_ACTIVE: 328,         // 该任务已激活
    ERROR_NO_TASK_NEED_RESET: 329,         // 没有需要刷新的任务
    ERROR_TASK_RESET_COST_NOT_ENOUGH: 330,         // 刷新任务所需不足
    ERROR_DAILY_AWARD_COUNT_MAX: 331,         // 今日领取的宝箱数已达上限
    ERROR_NO_AWARD_CAN_GET: 332,         // 没有可领取的宝箱
    ERROR_HAS_JOIN_OTHER_TEAM: 333,         // 已经加入其它队伍
};