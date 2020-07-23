
const clone = require('clone');
const common = require('./common.js');
const csv = require('./csv.js');
const logger = require('./logger.js');
const fs = require('fs');
const { ServerName } = require('./enum.js');
const { Fight } = require('./fight/fight.js');

exports.loadConf = function (config, serverName) {
    if (!config.language) {
        // 如果没配，默认简体中文
        config.language = 'simplifiedchinese';
    }

    var tFileName;
    tFileName = './conf/language/' + config.language + '/generaltext.dat';
    if (fs.existsSync(tFileName)) {
        exports.gConfGeneralText = new csv.CommonCSV(tFileName, ['key']);
    }
    tFileName = 'conf/language/' + config.language + '/name.dat';
    if (fs.existsSync(tFileName)) {
        exports.gConfName = new csv.CommonCSV(tFileName, ['id']);
    }

    exports.gConfGlobal = new csv.GlobalCSV('./conf/global.dat');

    // 加载配置文件
    exports.gConfLevel = new csv.CommonCSV('conf/level.dat', ['level']);
    exports.gConfVip = new csv.CommonCSV('conf/vip.dat', ['level']);
    exports.gConfHero = new csv.CommonCSV('conf/hero.dat', ['id']);
    exports.gConfHeroEvolution = new csv.CommonCSV('conf/heroevolution.dat', ['id']);
    exports.gConfHeroPermute = new csv.CommonCSV('conf/heropermute.dat', ['star', 'id']);

    //ERROR(gConfHeroPermute);

    exports.gConfCombatHeroTemplate = new csv.CommonCSV('conf/combatherotemplate.dat', ['id']);
    exports.gConfHeroQuality = new csv.CommonCSV('conf/heroquality.dat', ['level']);
    exports.gConfHeroQualityAttr = new csv.CommonCSV('conf/heroqualityattr.dat', ['level', 'ability']);
    exports.gConfCity = new csv.CommonCSV('conf/city.dat', ['id']);
    exports.gConfAttribute = new csv.CommonCSV('conf/attribute.dat', ['id']);
    exports.gConfDailyTask = new csv.CommonCSV('conf/dailytask.dat', ['id']);
    exports.gConfLegion = new csv.GlobalCSV('conf/legion.dat');
    // exports.gConfLegionLevel = new csv.CommonCSV('conf/legionlevel.dat', ['level']);
    exports.gConfDrop = new csv.CommonCSV('conf/drop.dat', ['id']);
    exports.gConfGuard = new csv.CommonCSV('conf/guard.dat', ['city', 'event']);

    exports.gConfActivitiesRaw = new csv.CommonCSV('conf/activities.dat', ['key']);
    exports.gConfAvCondition = new csv.CommonCSV('conf/activities_condition.dat', ['key', 'confId']);
    exports.gConfAvSchedule = new csv.CommonCSV('conf/activities_schedule.dat', ['key', 'round']);
    exports.gConfAvNewStage = new csv.CommonCSV('conf/activities_newstage.dat', ['key', 'round']);

    exports.gConfFormation = new csv.CommonCSV('conf/formation.dat', ['id']);
    exports.gConfMonster = new csv.CommonCSV('conf/monster.dat', ['id']);
    exports.gConfPosition = new csv.CommonCSV('conf/position.dat', ['id']);
    exports.gConfTavernHot = new csv.CommonCSV('conf/tavernhot.dat', ['id']);
    exports.gConfAvLimitGroup = new csv.CommonCSV('conf/avlimitgroup.dat', ['id']);
    exports.gConfAvLuckyWheel = new csv.CommonCSV('conf/avluckywheel.dat', ['id']);

    exports.gConfPromoteLucklyOrange = new csv.CommonCSV('conf/promotelucklyorange.dat', ['id']);
    exports.gConfPromoteLucklyRed = new csv.CommonCSV('conf/promotelucklyred.dat', ['id']);
    exports.gConfAttPrCoEff = new csv.CommonCSV('conf/attprcoeff.dat', ['level']);
    exports.gConfLegionIcon = new csv.CommonCSV('conf/legionicon.dat', ['id']);
    exports.gConfVersion = new csv.CommonCSV('conf/version.dat', ['key']);

    // 战队系统配置
    exports.gConfTeamBase = new csv.CommonCSV('conf/teambase.dat', ['level']);
    exports.gConfTeamEmblem = new csv.CommonCSV('conf/teamemblem.dat', ['id']);
    exports.gConfTeamhInt = new csv.CommonCSV('conf/teamhint.dat', ['key']);
    exports.gConfTeamSkill = new csv.CommonCSV('conf/teamskill.dat', ['id']);

    // 新军团
    exports.gConfLegionLevel = new csv.CommonCSV('conf/legionlevel.dat', ['level']);
    exports.gConfLegionJurisDiction = new csv.CommonCSV('conf/legionjurisdiction.dat', ['member']);
    exports.gConfLegionFlag = new csv.CommonCSV('conf/legionflag.dat', ['type', 'id']);
    exports.gConfLegionBuild = new csv.CommonCSV('conf/legionbuild.dat', ['id']);
    exports.gConfLegioBonfirerRedpaper = new csv.CommonCSV('conf/legionbonfireredpaper.dat', ['key']);
    exports.gConfLegioBonfire = new csv.CommonCSV('conf/legionbonfire.dat', ['level']);

    // 军团战
    exports.gConfLegionWarCityCard = new csv.CommonCSV('conf/legionwarcard.dat', ['id']);

    // 邮件配置
    exports.gConfMail = new csv.CommonCSV('conf/language/' + config.language + '/mail.dat', ['id']);

    exports.gConfGeneralText = new csv.CommonCSV('conf/language/' + config.language + '/generaltext.dat', ['key']);

    if (!serverName || serverName == ServerName.GAME) {//'game'
        exports.gConfInitSlots = new csv.CommonCSV('conf/initslots.dat', ['Index']);
        //exports.gConfPlayerSkill = new csv.CommonCSV('conf/playerskill.dat',['id']);
        exports.gConfReborn = new csv.CommonCSV('conf/reborn.dat', ['type', 'level']);
        exports.gConfSkill = new csv.CommonCSV('conf/skill.dat', ['skillId']);
        exports.gConfSkillGroup = new csv.CommonCSV('conf/skillgroup.dat', ['id']);
        exports.gConfBuff = new csv.CommonCSV('conf/buff.dat', ['id']);

        new Fight(exports.gConfSkill, exports.gConfSkillGroup, exports.gConfBuff, exports.gConfCombatHeroTemplate);

        exports.gConfSoldier = new csv.CommonCSV('conf/soldier.dat', ['id']);
        exports.gConfSoldierLevel = new csv.CommonCSV('conf/soldierlevel.dat', ['id', 'level', 'star']);
        exports.gConfSoldierDress = new csv.CommonCSV('conf/dress.dat', ['id']);
        exports.gConfSummon = new csv.CommonCSV('conf/summon.dat', ['id']);
        exports.gConfEquipClassified = new csv.CommonCSV('conf/equip.dat', ['level', 'quality', 'id']);
        exports.gConfGodEquip = new csv.CommonCSV('conf/godequip.dat', ['type', 'level']);
        exports.gConfItem = new csv.CommonCSV('conf/item.dat', ['id']);   //物品配置表
        exports.gConfGem = new csv.CommonCSV('conf/gem.dat', ['id']);
        exports.gConfFate = new csv.CommonCSV('conf/fate.dat', ['id']);
        exports.gConfFateTreasure = new csv.CommonCSV('conf/fatetreasure.dat', ['id']);
        exports.gConfDestiny = new csv.CommonCSV('conf/destiny.dat', ['level']);
        exports.gConfInnate = new csv.CommonCSV('conf/innate.dat', ['id']);
        exports.gConfInnateGroup = new csv.CommonCSV('conf/innategroup.dat', ['id']);

        // 关卡
        exports.gConfCustom = new csv.CommonCSV('conf/custom.dat', ['id']);
        exports.gConfCustomSet = new csv.CommonCSV('conf/customset.dat', ['id']);
        exports.gConfCustomPreview = new csv.CommonCSV('conf/custompreview.dat', ['id']);

        exports.gConfCustomDragon = new csv.CommonCSV('conf/dragon.dat', ['id']);
        exports.gConfCustomTreasure = new csv.CommonCSV('conf/customtreasure.dat', ['id']);
        exports.gConfCustomVillage = new csv.CommonCSV('conf/customvillage.dat', ['id']);
        //exports.gConfCustomKing          = new csv.CommonCSV('conf/customking.dat',  ['chapter', 'id']);
        exports.gConfDragonGemConvert = new csv.CommonCSV('conf/dragongemconvert.dat', ['level']);   // 龙晶转换表
        exports.gConfDragonGem = new csv.CommonCSV('conf/dragongem.dat', ['id']);
        exports.gConfDragonLevel = new csv.CommonCSV('conf/dragonlevel.dat', ['level']);
        exports.gConfCustomElement = new csv.CommonCSV('conf/customelement.dat', ['id']);
        exports.gConfCustomKingWay = new csv.CommonCSV('conf/customkingway.dat', ['id']);
        exports.gConfCustomPrincess = new csv.CommonCSV('conf/customprincess.dat', ['plan']);

        exports.gConfTavern = new csv.CommonCSV('conf/tavern.dat', ['type']);
        exports.gConfTavernLimitHero = new csv.CommonCSV('conf/tavernlimithero.dat', ['id']);

        // 商店配置
        exports.gConfShop = new csv.CommonCSV('conf/shop.dat', ['id']);
        exports.gConfShopNew = new csv.CommonCSV('conf/shopuniversaltab.dat', ['id']);
        exports.gConfShopTab = new csv.CommonCSV('conf/shopuniversalconfig.dat', ['id']);
        exports.gConfShopGoods = new csv.CommonCSV('conf/shopuniversalgoods.dat', ['groupId', 'id']);

        exports.gConfOnline = new csv.CommonCSV('conf/avonline.dat', ['id']);                                    // 在线奖励

        exports.gConfResCopyList = new csv.CommonCSV('conf/rescplist.dat', ['type']);
        exports.gConfCountryJadeRewardFix = new csv.CommonCSV('conf/countryjaderewardfix.dat', ['level']);
        exports.gConfCountryJadeRewardDrop = new csv.CommonCSV('conf/countryjaderewarddrop.dat', ['color']);

        for (var type in exports.gConfResCopyList) {
            var copyConf = exports.gConfResCopyList[type];
            if (copyConf.robotConf) {
                copyConf.robotConf = new csv.CommonCSV('conf/' + copyConf.robotConf, ['id']);
            }
        }
        exports.gConfResCopyInfo = new csv.CommonCSV('conf/rescpinfo.dat', ['id', 'difficulty']);
        exports.gConfBuy = new csv.CommonCSV('conf/buy.dat', ['times']);
        exports.gConfArenaLevel = new csv.CommonCSV('conf/arenalevel.dat', ['level']);

        exports.gConfTowerAttReward = new csv.CommonCSV('conf/towerattreward.dat', ['att']);
        exports.gConfTowerStarReward = new csv.CommonCSV('conf/towerstarreward.dat', ['starNum']);
        exports.gConfTowerCoinReward = new csv.CommonCSV('conf/towercoinreward.dat', ['id']);
        exports.gConfTowerStarShop = new csv.CommonCSV('conf/towerstarshop.dat', ['id']);

        // 勇者之塔
        exports.gConfTowerresultaward = new csv.CommonCSV('conf/towerresultaward.dat', ['id']);
        exports.gConfTower = new csv.CommonCSV('conf/tower.dat', ['id']);

        exports.gConfOctopus = new csv.CommonCSV('conf/avoctopusbase.dat', ['id']);          // 章鱼宝藏
        exports.gConfOctopusAwardRaw = new csv.CommonCSV('conf/avoctopusaward.dat', ['confId', 'id']);          // 章鱼宝藏

        exports.gConfAbyssCustom = new csv.CommonCSV('conf/abysscustom.dat', ['id']);        // 深渊世界 关卡信息
        exports.gConfAbyssBox = new csv.CommonCSV('conf/abyssbox.dat', ['id']);              // 深渊世界 宝箱信息

        exports.gConfTreasure = new csv.CommonCSV('conf/treasure.dat', ['id', 'active']);
        // 装备相关配置
        exports.gConfEquip = new csv.CommonCSV('conf/equipconf.dat', ['id']);
        exports.gConfEquipBase = new csv.CommonCSV('conf/equipbase.dat', ['type', 'quality']);
        exports.gConfEquipTalent = new csv.CommonCSV('conf/equiptalent.dat', ['type', 'level']);

        exports.gConfEquipSuit = new csv.CommonCSV('conf/equipsuit.dat', ['id']);
        exports.gConfEquipRefine = new csv.CommonCSV('conf/equiprefine.dat', ['id', 'level']);
        exports.gConfEquipRefineSuit = new csv.CommonCSV('conf/equiprefinesuit.dat', ['id']);
        exports.gConfEquipUpgrade = new csv.CommonCSV('conf/equipupgrade.dat', ['level']);
        exports.gConfEquipUpgradeMaster = new csv.CommonCSV('conf/equipmasterupgrade.dat', ['level']);
        exports.gConfEquipRefineMaster = new csv.CommonCSV('conf/equipmasterrefine.dat', ['level']);
        exports.gConfEquipImprove = new csv.CommonCSV('conf/equipimprove.dat', ['quality', 'grade']);

        exports.gConfGemSuit = new csv.CommonCSV('conf/gemsuit.dat', ['id']);
        exports.gConfThief = new csv.CommonCSV('conf/thief.dat', ['id']);
        exports.gConfTrial = new csv.CommonCSV('conf/trial.dat', ['level']);

        exports.gConfHelpEquipRaw = new csv.CommonCSV('conf/avhelpequip.dat', ['confId', 'id']);           // 矮人支援

        // 竞技场相关配置
        exports.gConfArenaBase = new csv.CommonCSV('conf/arenabase.dat', ['type']);
        exports.gConfArenaRank = new csv.CommonCSV('conf/arenarank.dat', ['type', 'level']);
        exports.gConfArenaAchievement = new csv.CommonCSV('conf/arenaachievement.dat', ['type', 'level']);
        exports.gConfArenaRefresh = new csv.CommonCSV('conf/arenarefresh.dat', ['id']);

        exports.gConfDailyTaskReward = new csv.CommonCSV('conf/dailytaskreward.dat', ['active']);
        exports.gConfTask = new csv.CommonCSV('conf/task.dat', ['type', 'goalId']);
        exports.gConfGuideTask = new csv.CommonCSV('conf/guidetask.dat', ['id']);

        exports.gConfTowerType = new csv.CommonCSV('conf/towertype.dat', ['type']);
        exports.gConfRecharge = new csv.CommonCSV('conf/recharge.dat', ['id']);
        exports.gConfShipper = new csv.CommonCSV('conf/shipper.dat', ['shipper']);
        exports.gConfShipperReward = new csv.CommonCSV('conf/shipperreward.dat', ['level']);
        exports.gConfGuardField = new csv.CommonCSV('conf/guardfield.dat', ['city']);
        exports.gConfGuardMonster = new csv.CommonCSV('conf/guardmonster.dat', ['id']);
        exports.gConfGuardSkill = new csv.CommonCSV('conf/guardskill.dat', ['city', 'level']);
        exports.gConfAltar = new csv.CommonCSV('conf/altar.dat', ['id']);
        exports.gConfAltarGem = new csv.CommonCSV('conf/altargem.dat', ['level']);
        exports.gConfSign = new csv.CommonCSV('conf/avsignin.dat', ['round', 'sort']);
        exports.gConfSignHigh = new csv.CommonCSV('conf/avsignin_high.dat', ['round', 'sort']);

        exports.gConfAVSignNew = new csv.CommonCSV('conf/avsign_new.dat', ['round', 'sort']);

        // exports.gConfSignMonth = new csv.CommonCSV('conf/signmonth.dat', ['month']);
        // exports.gConfSignReward = new csv.CommonCSV('conf/signreward.dat', ['day']);
        exports.gConfExploitWall = new csv.CommonCSV('conf/exploitwall.dat', ['key', 'rank']);
        exports.gConfJadeSeal = new csv.CommonCSV('conf/jadeseal.dat', ['id']);
        exports.gConfJadeSealHero = new csv.CommonCSV('conf/jadesealhero.dat', ['star']);
        exports.gConfLegionCopyReward = new csv.CommonCSV('conf/legioncopyreward.dat', ['damage']);
        exports.gConfSpecialReward = new csv.CommonCSV('conf/specialreward.dat', ['id']);
        exports.gConfModuleOpen = new csv.CommonCSV('conf/moduleopen.dat', ['module']);
        exports.gConfModuleOpen_new = new csv.CommonCSV('conf/moduleopen_new.dat', ['module']);
        exports.gConfTraining = new csv.CommonCSV('conf/training.dat', ['id']);
        exports.gConfHookTreasure = new csv.CommonCSV('conf/hooktreasure.dat', ['id']);
        exports.gConfCastleLevel = new csv.CommonCSV('conf/castlelevel.dat', ['level']);
        exports.gConfArenaHistory = new csv.CommonCSV('conf/arenahistory.dat', ['stage']);
        exports.gConfAchievement = new csv.CommonCSV('conf/achievement.dat', ['egg']);
        exports.gConfMarket = new csv.CommonCSV('conf/market.dat', ['id']);
        exports.gConfFeilongFly = new csv.CommonCSV('conf/feilongfly.dat', ['id']);
        exports.gConfHeroBox = new csv.CommonCSV('conf/herobox.dat', ['id']);
        exports.gConfTowerCoinAward = new csv.CommonCSV('conf/towercoinreward.dat', ['star']);
        exports.gConfRobot = new csv.CommonCSV('conf/robot.dat', ['id']);
        exports.gConfRobotType = new csv.CommonCSV('conf/robotconf.dat', ['id']);
        exports.gConfRobotAtt = new csv.CommonCSV('conf/robotatt.dat', ['level']);

        exports.gConfLegionWarCity = new csv.CommonCSV('conf/legionwarcity.dat', ['id']);
        exports.gConfLegionWarCityBuf = new csv.CommonCSV('conf/legionwarcitybuf.dat', ['bufType']);
        exports.gConfLegionWarAttackAward = new csv.CommonCSV('conf/legionwarattackaward.dat', ['attackCount']);
        exports.gConfTavernLuck = new csv.CommonCSV('conf/tavernluck.dat', ['level']);
        exports.gConfWarCollege = new csv.CommonCSV('conf/warcollege.dat', ['id']);
        exports.gConfWorldSituation = new csv.CommonCSV('conf/worldsituation.dat', ['id']);

        exports.gConfLegionConstruct = new csv.CommonCSV('conf/legionconstruct.dat', ['id']);
        exports.gConfLegionConstructReward = new csv.CommonCSV('conf/legionconstructreward.dat', ['progress']);
        exports.gConfHeadpic = new csv.CommonCSV('conf/settingheadicon.dat', ['id']);
        exports.gConfUser = new csv.CommonCSV('conf/user.dat', ['id']);
        exports.gConfLog = new csv.CommonCSV('conf/log.dat', ['modAct', 'index']);
        exports.gConfLogIndex = new csv.CommonCSV('conf/logindex.dat', ['modAct']);
        exports.gConfPlayLog = new csv.CommonCSV('conf/playlog.dat', ['type', 'name']);
        exports.gConfCityTribute = new csv.CommonCSV('conf/citytribute.dat', ['id']);
        exports.gConfLocalText = new csv.CommonCSV('conf/language/' + config.language + '/localtext.dat', ['Id']);
        exports.gConfDiggingDistribution = new csv.CommonCSV('conf/diggingdistribution.dat', ['id']);
        exports.gConfDiggingProduct = new csv.CommonCSV('conf/diggingproduct.dat', ['id']);
        exports.gConfDiggingEvent = new csv.CommonCSV('conf/diggingevent.dat', ['level']);
        exports.gConfDiggingProgress = new csv.CommonCSV('conf/diggingprogress.dat', ['id']);
        exports.gConfDiggingBomb = new csv.CommonCSV('conf/diggingbomb.dat', ['id']);
        exports.gConfDiggingRobot = new csv.CommonCSV('conf/diggingrobot.dat', ['id']);
        exports.gConfNewUserMail = new csv.CommonCSV('conf/newusermail.dat', ['plat']);
        exports.gConfExchangeKey = new csv.CommonCSV('conf/exchangekey.dat', ['id']);
        exports.gConfLegionRobot = new csv.CommonCSV('conf/legiontrialrobot.dat', ['id']);
        exports.gConfWorldWarScore = new csv.CommonCSV('conf/worldwarscore.dat', ['id']);
        exports.gConfWorldWarBattle = new csv.CommonCSV('conf/worldwarbattle.dat', ['id']);
        exports.gConfChatNotice = new csv.CommonCSV('conf/chatnotice.dat', ['key']);
        exports.gConfResback = new csv.CommonCSV('conf/resback.dat', ['type']);
        exports.gConfGoldMine = new csv.CommonCSV('conf/goldmine.dat', ['id'])
        exports.gConfPositionShp = new csv.CommonCSV('conf/positionshop.dat', ['id'])

        /** 礼包邮件配置 */
        exports.gConfGiftMail = new csv.CommonCSV('conf/giftmail.dat', ['pid']);

        // 活动相关配置
        exports.gConfAvPayOnlyRaw = new csv.CommonCSV('conf/avpayonly.dat', ['confId', 'id']);
        exports.gConfAvSingleRechargeRaw = new csv.CommonCSV('conf/avsinglerecharge.dat', ['confId', 'id']);
        exports.gConfAvDailyRechargeRaw = new csv.CommonCSV('conf/avdailyrecharge.dat', ['confId', 'id']);
        exports.gConfAvTodayDoubleRaw = new csv.CommonCSV('conf/avtodaydouble.dat', ['confId', 'day']);
        exports.gConfAvLoginGiftRaw = new csv.CommonCSV('conf/avlogingift.dat', ['confId', 'day']);
        exports.gConfAvDayRechargeRaw = new csv.CommonCSV('conf/avday_recharge.dat', ['confId', 'id']);
        exports.gConfAvAccumulateDailyRaw = new csv.CommonCSV('conf/avaccumulatedaily.dat', ['confId', 'day', 'id']);
        exports.gConfAvAccumulatePayRaw = new csv.CommonCSV('conf/accumulatepay.dat', ['confId', 'id']);
        exports.gConfAvAccumulateRechargeRaw = new csv.CommonCSV('conf/avaccumulaterecharge.dat', ['confId', 'id']);
        exports.gConfAvExpendGiftRaw = new csv.CommonCSV('conf/avexpendgift.dat', ['confId', 'id']);
        exports.gConfAvDailyCostRaw = new csv.CommonCSV('conf/avdailycost.dat', ['confId', 'id']);
        exports.gConfAvOvervaluedGiftIdRaw = new csv.CommonCSV('conf/avovervaluedgift.dat', ['confId', 'day', 'id']);
        exports.gConfAvOvervaluedGiftNewId = new csv.CommonCSV('conf/avovervaluedgiftnew.dat', ['day', 'id']);
        exports.gConfAvPrivilegeGift = new csv.CommonCSV('conf/avprivilegegift.dat', ['id']);
        exports.gConfAvWeekGift = new csv.CommonCSV('conf/avweekgift.dat', ['id']);
        exports.gConfAvLuckyWheelScore = new csv.CommonCSV('conf/avluckywheelscore.dat', ['score']);
        exports.gConfAvTavernRecruit = new csv.CommonCSV('conf/avtavernrecruit.dat', ['id']);
        exports.gConfAvTavernRecruitFrequencyRaw = new csv.CommonCSV('conf/avtavernrecruitfrequency.dat', ['confId', 'timeId']);
        exports.gConfAvTavernRecruitFrequency = new csv.CommonCSV('conf/avtavernrecruitfrequency.dat', ['timeId']);
        exports.gConfAvExchangePointsId = new csv.CommonCSV('conf/avexchangepoints.dat', ['id']);
        exports.gConfAvExchangePoints = new csv.CommonCSV('conf/avexchangepoints.dat', ['key']);
        exports.gConfAvExchangePointsRound = new csv.CommonCSV('conf/avexchangepoints.dat', ['round', 'key', 'id']);
        exports.gConfAvExchangePointsKey = new csv.CommonCSV('conf/avexchangepoints.dat', ['key', 'id']);
        exports.gConfAvExchangePointsAward = new csv.CommonCSV('conf/avexchangepointsaward.dat', ['id']);
        exports.gConfAvExchangePointsTime = new csv.CommonCSV('conf/avexchangepointstime.dat', ['id']);
        exports.gConfAvRoulette = new csv.CommonCSV('conf/avroulette.dat', ['id']);
        exports.gConfAvLevelGift = new csv.CommonCSV('conf/avlevelgift.dat', ['id']);
        exports.gConfAvLuckyDragon = new csv.CommonCSV('conf/avluckydragon.dat', ['frequency']);
        exports.gConfAvGrowFund = new csv.CommonCSV('conf/avgrowfund.dat', ['id']);
        exports.gConfAvDropsDragon = new csv.CommonCSV('conf/avdropsdragon.dat', ['id']);
        exports.gConfAvDropsDragonLotteryFrequency = new csv.CommonCSV('conf/avdropsdragonlotteryfrequency.dat', ['level']);
        exports.gConfAvOneYuanBuy = new csv.CommonCSV('conf/avoneyuanbuy.dat', ['id']);
        exports.gConfAvThreeYuanBuy = new csv.CommonCSV('conf/avthreeyuanbuy.dat', ['id']);
        exports.gConfAvDayChallenge = new csv.CommonCSV('conf/avdaychallenge.dat', ['day']);
        exports.gConfAvDayChallengeId = new csv.CommonCSV('conf/avdaychallenge.dat', ['day', 'id']);
        exports.gConfAvDayVouchsafeRaw = new csv.CommonCSV('conf/avdayvouchsafe.dat', ['confId', 'day']);
        exports.gConfAvpromoteexchange = new csv.CommonCSV('conf/avpromoteexchange.dat', ['id']);
        exports.gConfAvstepawards = new csv.CommonCSV('conf/avstepawards.dat', ['step']);
        exports.gConfAvstepinfo = new csv.CommonCSV('conf/avstepinfo.dat', ['pos']);
        exports.gConfAvhuman_armsRaw = new csv.CommonCSV('conf/avhuman_arms.dat', ['confId', 'level']);
        exports.gConfAvhuman_wingRaw = new csv.CommonCSV('conf/avhuman_wing.dat', ['confId', 'level']);
        exports.gConfAvhuman_mountRaw = new csv.CommonCSV('conf/avhuman_mount.dat', ['confId', 'level']);
        exports.gConfAvFirstPay = new csv.CommonCSV('conf/avfirstpay.dat', ['id']);
        // exports.gConfAvFirstPayKey1Id = new csv.CommonCSV('conf/avfirstpay.dat', ['key1', 'id']);
        // exports.gConfAvFirstPayKey2Id = new csv.CommonCSV('conf/avfirstpay.dat', ['key2', 'id']);
        exports.gConfAvTavernNormalRaw = new csv.CommonCSV('conf/avrecruit_ordinary.dat', ['confId', 'id']);
        exports.gConfAvTavernHighRaw = new csv.CommonCSV('conf/avrecruit_senior.dat', ['confId', 'id']);
        exports.gConfAvLimitExchangeRaw = new csv.CommonCSV('conf/avlimit_exchange.dat', ['confId', 'id']);
        exports.gConfAvPrayRaw = new csv.CommonCSV('conf/avalasd_pray.dat', ['confId', 'id']);
        exports.gConfAvDayExchangeRaw = new csv.CommonCSV('conf/avday_exchange.dat', ['confId', 'id']);

        exports.gConfAvmanuallyLevelRaw = new csv.CommonCSV('conf/avmanuallylevel.dat', ['confId', 'id']);       // 龙纹手册
        exports.gConfAvmanuallyTaskRaw = new csv.CommonCSV('conf/avmanuallytask.dat', ['confId', 'id']);         // 龙纹手册
        exports.gConfAvmanuallyAwardRaw = new csv.CommonCSV('conf/avmanuallyaward.dat', ['confId', 'id']);       // 龙纹手册

        exports.gConfAvAssetsFeed = new csv.CommonCSV('conf/avassets_feed.dat', ['id']);                      // 资源补给站
        exports.gConfAvAssetsFeedAward = new csv.CommonCSV('conf/avassets_feedaward.dat', ['startDay']);            // 资源补给站

        // 开服七天乐配置
        exports.gConfOpenSeven = new csv.CommonCSV('conf/openseven.dat', ['day', 'id']);
        exports.gConfOpenSevenReward = new csv.CommonCSV('conf/opensevenreward.dat', ['id']);
        exports.gConfOpenSevenBox = new csv.CommonCSV('conf/opensevenbox.dat', ['id']);

        exports.gConfOpenHoliday_data = new csv.CommonCSV('conf/openholiday.dat', ['confId', 'day', 'id']);
        exports.gConfOpenHolidayReward = new csv.CommonCSV('conf/openholidayreward.dat', ['id']);
        exports.gConfOpenHolidayBox_data = new csv.CommonCSV('conf/openholidaybox.dat', ['confId', 'id']);
        exports.gConfavbuy_award = new csv.CommonCSV('conf/avbuy_award.dat', ['confId', 'week', 'id']);
        //一本万利奖励配置
        exports.gConfAvinvestmentReward = new csv.CommonCSV('conf/avinvestment.dat', ['conf']);
        // // 20170823之后用老配置
        // var timeopenSevenOld =  csv.parseDate("2017:08:23:05:00:00");
        // if (getGameDate(timeopenSevenOld) > common.GLOBAL_SERVER_INFO_DICT.serverStartDate) {
        //     exports.gConfOpenSevenReward = new csv.CommonCSV('conf/oldopensevenreward.dat', ['id']);
        //     exports.gConfOpenSeven = new csv.CommonCSV('conf/oldopenseven.dat', ['day', 'id']);
        //     exports.gConfOpenSevenBox = new csv.CommonCSV('conf/oldopensevenbox.dat', ['id']);
        // }

        // 礼包活动
        if ((config.ServerId - 0) <= 20 && config.platform == "korea") {
            exports.gConfGiftBag = new csv.CommonCSV('conf/avgiftbag_old.dat', ['id']);
        }
        else {
            exports.gConfGiftBag = new csv.CommonCSV('conf/avgiftbag.dat', ['id']);
        }

        // 无限关卡
        exports.gConfItMain = new csv.CommonCSV('conf/itmain.dat', ['id', 'num']);
        exports.gConfItMainIsBranch = new csv.CommonCSV('conf/itmain.dat', ['id', 'isBranch']);
        exports.gConfItMainOpenCondition = new csv.CommonCSV('conf/itmain.dat', ['id', 'openCondition']);
        exports.gConfItBoss = new csv.CommonCSV('conf/itboss.dat', ['level']);
        exports.gConfItSectionBox = new csv.CommonCSV('conf/itsectionbox.dat', ['id', 'level']);
        exports.gConfItMapelement = new csv.CommonCSV('conf/itmapelement.dat', ['id', 'index']);

        // 军团试炼
        exports.gConfLegionTrialAchievement = new csv.CommonCSV('conf/trialachievement.dat', ['type', 'id']);
        exports.gConfLegionTrialAdventure = new csv.CommonCSV('conf/trialadventure.dat', ['id']);
        exports.gConfLegionTrialBaseConfig = new csv.CommonCSV('conf/trialbaseconfig.dat', ['level']);
        exports.gConfLegionTrialCoinIncreaseType = new csv.CommonCSV('conf/trialcoinincreasetype.dat', ['id']);
        exports.gConfLegionTrialGoods = new csv.CommonCSV('conf/trialgoods.dat', ['id', 'number']);

        // 城池升级
        exports.gConfLegionCityBase = new csv.CommonCSV('conf/legioncitybase.dat', ['type']);
        exports.gConfLegionCityConf = new csv.CommonCSV('conf/legioncityconf.dat', ['id', 'level']);
        exports.gConfLegionCityMain = new csv.CommonCSV('conf/legioncitymain.dat', ['level']);
        exports.gConfLegionCityFunction = new csv.CommonCSV('conf/legioncityfunction.dat', ['key']);
        //exports.gConfTerritoryWarActionCost = new csv.CommonCSV('conf/dfactioncost.dat', ['times']);

        exports.gConfTerritoryBossCost = new csv.CommonCSV('conf/dfbosscost.dat', ['times']);
        exports.gConfTerritoryBossLegionConf = new csv.CommonCSV('conf/dfbosslegionconf.dat', ['legionLevel']);
        exports.gConfTerritoryBossSelfAward = new csv.CommonCSV('conf/dfbossselfaward.dat', ['id']);

        // 军团许愿
        exports.gConfLegionWishConf = new csv.CommonCSV('conf/legionwishconf.dat', ['heroQuality']);
        exports.gConfLegionWishAchievement = new csv.CommonCSV('conf/legionwishachievement.dat', ['id', 'level']);
        exports.gConfLegionWishAchievementKey = new csv.CommonCSV('conf/legionwishachievement.dat', ['key']);

        //天下合谋
        exports.gConfFateadvancedconf = new csv.CommonCSV('conf/fateadvancedconf.dat', ['fateType', 'fateLevel']);
        exports.gConfFateadvancedtype = new csv.CommonCSV('conf/fateadvancedtype.dat', ['fateType']);

        // 化神进阶
        exports.gConfPromote = new csv.CommonCSV('conf/promoteorange.dat', ['id']);
        exports.gConfPromoteProgress = new csv.CommonCSV('conf/promoteorange.dat', ['progress']);
        exports.gConfPromoteType = new csv.CommonCSV('conf/promoteorange.dat', ['type', 'progress']);
        exports.gConfHeroChange = new csv.CommonCSV('conf/herochange.dat', ['id']);
        exports.gConfHeroChangeKey = new csv.CommonCSV('conf/herochange.dat', ['key']);
        exports.gConfHeroChangeQuality = new csv.CommonCSV('conf/herochange.dat', ['quality']);
        exports.gConfPromoteRed = new csv.CommonCSV('conf/promotered.dat', ['type', 'progress']);
        exports.gConfPromoteGold = new csv.CommonCSV('conf/promotegold.dat', ['type', 'progress']);
        exports.gConfPromoteLucklyOrange = new csv.CommonCSV('conf/promotelucklyorange.dat', ['id']);
        exports.gConfPromoteLucklyRed = new csv.CommonCSV('conf/promotelucklyred.dat', ['id']);
        exports.gConfPromoteAwardOrange = new csv.CommonCSV('conf/promoteawardorange.dat', ['number']);
        exports.gConfPromoteAwardRed = new csv.CommonCSV('conf/promoteawardred.dat', ['number']);
        exports.gConfPromoteRankRed = new csv.CommonCSV('conf/promoterankred.dat', ['rank']);
        exports.gConfPromoteOrangeItem = new csv.CommonCSV('conf/promoteorangeitem.dat', ['id']);
        exports.gConfPromoteOrangeItemKey = new csv.CommonCSV('conf/promoteorangeitem.dat', ['key']);
        exports.gConfPromoteRedItem = new csv.CommonCSV('conf/promotereditem.dat', ['id']);
        exports.gConfPromoteRedItemKey = new csv.CommonCSV('conf/promotereditem.dat', ['key']);

        exports.gConfLordSpecialDrop = new csv.CommonCSV('conf/lordspecialdrop.dat', ['cnt', 'id']);
        exports.gConfHeadFrame = new csv.CommonCSV('conf/settingheadframe.dat', ['id']);

        // 封爵
        exports.gConfNobiltyLevel = new csv.CommonCSV('conf/nobiltylevel.dat', ['level']);
        exports.gConfNobiltyLevelKey = new csv.CommonCSV('conf/nobiltylevel.dat', ['key']);
        exports.gConfNobiltyBase = new csv.CommonCSV('conf/nobiltybase.dat', ['id']);
        exports.gConfNobiltyBaseKey = new csv.CommonCSV('conf/nobiltybase.dat', ['key']);
        exports.gConfNobiltyTitle = new csv.CommonCSV('conf/nobiltytitle.dat', ['id']);
        exports.gConfNobiltyTitleKey = new csv.CommonCSV('conf/nobiltytitle.dat', ['key']);
        exports.gConfNobiltyTitleKeyAndId = new csv.CommonCSV('conf/nobiltytitle.dat', ['key', 'id']);
        // 人皇套装
        exports.gConfSkyWeap = new csv.CommonCSV('conf/skyweap.dat', ['level']);
        exports.gConfSkyWing = new csv.CommonCSV('conf/skywing.dat', ['level']);
        exports.gConfSkyMount = new csv.CommonCSV('conf/skymount.dat', ['level']);
        exports.gConfSkySkill = new csv.CommonCSV('conf/skyskill.dat', ['type', 'id']);
        exports.gConfSkySkillUp = new csv.CommonCSV('conf/skyskillup.dat', ['id', 'level']);
        exports.gConfSkyBloodAwaken = new csv.CommonCSV('conf/skybloodawaken.dat', ['type', 'level']);
        exports.gConfSkyGasAwaken = new csv.CommonCSV('conf/skygasawaken.dat', ['type', 'level']);
        exports.gConfSkyChange = new csv.CommonCSV('conf/skychange.dat', ['type', 'id']);
        exports.gConfSkyChangeId = new csv.CommonCSV('conf/skychange.dat', ['type', 'value']);
        exports.gConfSkyCollect = new csv.CommonCSV('conf/skycollect.dat', ['type', 'collect']);


        // 挂机配置(黑森林探索)
        exports.gConfExploreBase = new csv.CommonCSV('conf/explorebase.dat', ['key']);
        exports.gConfExploreMonster = new csv.CommonCSV('conf/exploremonster.dat', ['level']);
        exports.gConfItemGroupBase = new csv.CommonCSV('conf/itemgroupbase.dat', ['id']);
        exports.gConfItemGroupConfig = new csv.CommonCSV('conf/itemgroupconfig.dat', ['groupId', 'id']);

        // 大本营-boss(黑森林探索)
        exports.gConfExploreBoss = new csv.CommonCSV('conf/exploreboss.dat', ['type']);
        exports.gConfExplorePath = new csv.CommonCSV('conf/explorepath.dat', ['pathId']);

        // 搜寻任务 (黑森林探索)
        exports.gConfExploreTaskBasic = new csv.CommonCSV('conf/exploretaskbasic.dat', ['type']);
        exports.gConfExploreTaskDetail = new csv.CommonCSV('conf/exploretaskdetail.dat', ['type', 'level']);

        // 山洞
        exports.gConfCustomCaveEvent = new csv.CommonCSV('conf/customcaveevent.dat', ['key']);
        exports.gConfCustomCaveDiceWeight = new csv.CommonCSV('conf/customcavediceweight.dat', ['point']);
        exports.gConfCustomCaveAward = new csv.CommonCSV('conf/customcaveaward.dat', ['level']);

        // 魔法阵
        exports.gConfExploreMagic = new csv.CommonCSV('conf/exploremagic.dat', ['id']);
        exports.gConfexploreMagiConvert = new csv.CommonCSV('conf/exploremagicconvert.dat', ['id']);

        // 部位
        exports.gConfPartAwake = new csv.CommonCSV('conf/partawake.dat', ['type', 'level']);
        exports.gConfPartBase = new csv.CommonCSV('conf/partbase.dat', ['Id']);
        exports.gConfPartEmbed = new csv.CommonCSV('conf/partembed.dat', ['level']);
        //exports.gConfMasterAwake     = new csv.CommonCSV('conf/partmasterawake.dat', ['level']);
        exports.gConfMasterEmbed = new csv.CommonCSV('conf/partmasterembed.dat', ['level']);
        exports.gConfPartTitleActive = new csv.CommonCSV('conf/parttitleactivate.dat', ['type', 'titileLevel']);

        // 符文配置
        exports.gConfRuneConf = new csv.CommonCSV('conf/runeconf.dat', ['id']);
        exports.gConfRuneBoxConf = new csv.CommonCSV('conf/runebox.dat', ['id']);
        exports.gConfRuneSlotConf = new csv.CommonCSV('conf/runetrench.dat', ['type', 'id']);
        exports.gConfRuneUpgradeConf = new csv.CommonCSV('conf/runeupgrade.dat', ['level']);
        exports.gConfRuneHandleBookConf = new csv.CommonCSV('conf/runehandbook.dat', ['type']);
        exports.gConfRuneBaseAttConf = new csv.CommonCSV('conf/runebaseatt.dat', ['level']);
        exports.gConfRuneSpecialAttConf = new csv.CommonCSV('conf/runespecialatt.dat', ['id', 'num']);
        exports.gConfRuneBoxAwardConf = new csv.CommonCSV('conf/runeboxaward.dat', ['id', 'num']);

        exports.gConfBarrenLand = new csv.CommonCSV('conf/territorywarbarrenland.dat', ['id']);
        exports.gConfLegionBossAakb = new csv.CommonCSV('conf/legionbossaakb.dat', ['type']);

        exports.gConfTerritoryWarTransfer = new csv.CommonCSV('conf/dftransmit.dat', ['id']);

        // 村庄争夺战
        exports.gConfPersonalLand = new csv.CommonCSV('conf/territorywarpersonal.dat', ['id', 'landId']);

        // 在线奖励
        exports.gConfOutlineBeadChange = new csv.CommonCSV('conf/outlinebeadchange.dat', ['id']);
        exports.gConfOutlineCondition = new csv.CommonCSV('conf/outlinecondition.dat', ['id']);
        exports.gConfOutlineDayBoss = new csv.CommonCSV('conf/outlinedayboss.dat', ['id']);
        exports.gConfOutlineTheme = new csv.CommonCSV('conf/outlinetheme.dat', ['id']);

        exports.gConfExploreMagicAwardUp = new csv.CommonCSV('conf/exploremagicawardup.dat', ['id', 'level']);

        // 幸运轮盘
        exports.gConfAvLuckyRotateBase = new csv.CommonCSV('conf/avlucky_rotate_base.dat', ['id']);
        exports.gConfAvLuckyRotateItem = new csv.CommonCSV('conf/avlucky_rotate_item.dat', ['groupId', 'num']);

        // 命运之轮
        exports.gConfAvDestinyRotateCostRaw = new csv.CommonCSV('conf/avdestinyrotate_cost.dat', ['confId', 'id']);
        exports.gConfAvDestinyRotateNormalRaw = new csv.CommonCSV('conf/avdestinyrotate_normal.dat', ['confId', 'id', 'sort']);
        exports.gConfAvDestinyRotateHighRaw = new csv.CommonCSV('conf/avdestinyrotate_high.dat', ['confId', 'id', 'sort']);

        // 月度返利
        exports.gConfAvMonthRebate = new csv.CommonCSV('conf/avmonthrebate.dat', ['id']);
    }

    if (!serverName || serverName == ServerName.WORLD) {//'world'

        exports.gConfRobot = new csv.CommonCSV('conf/robot.dat', ['id']);
        exports.gConfRobotType = new csv.CommonCSV('conf/robotconf.dat', ['id']);
        exports.gConfRobotAtt = new csv.CommonCSV('conf/robotatt.dat', ['level']);
        exports.gConfDestiny = new csv.CommonCSV('conf/destiny.dat', ['level']);

        exports.gConfGoldMine = new csv.CommonCSV('conf/goldmine.dat', ['id']);
        exports.gConfLegionLog = new csv.CommonCSV('conf/legionlog.dat', ['event']);
        exports.gConfArenaDaily = new csv.CommonCSV('conf/arenadaily.dat', ['rank']);
        exports.gConfWorldWarGlory = new csv.CommonCSV('conf/worldwarglory.dat', ['rank']);
        exports.gConfWorldWarReward = new csv.CommonCSV('conf/worldwarreward.dat', ['rank']);
        exports.gConfLegionCopy = new csv.CommonCSV('conf/legioncopy.dat', ['id']);
        exports.gConfAvWeekGift = new csv.CommonCSV('conf/avweekgift.dat', ['id']);
        exports.gConfHookRepos = new csv.CommonCSV('conf/hookrepos.dat', ['id']);
        exports.gConfArenaLevel = new csv.CommonCSV('conf/arenalevel.dat', ['level']);
        exports.gConfAvLuckyWheelRank = new csv.CommonCSV('conf/avluckywheelrank.dat', ['rank']);
        exports.gConfCountryJade = new csv.CommonCSV('conf/countryjade.dat', ['id']);
        exports.gConfCountryJadeRewardFix = new csv.CommonCSV('conf/countryjaderewardfix.dat', ['level']);
        exports.gConfCountryJadeRewardDrop = new csv.CommonCSV('conf/countryjaderewarddrop.dat', ['color']);

        exports.gConfLegionWarSchedule = new csv.CommonCSV('conf/legionwarschedule.dat', ['type', 'id']);
        exports.gConfLegionWarCityBuf = new csv.CommonCSV('conf/legionwarcitybuf.dat', ['bufType']);
        //exports.gConfLegionWarCityCard = new csv.CommonCSV('conf/legionwarcard.dat', ['id']);
        exports.gConfLegionWarRank = new csv.CommonCSV('conf/legionwarrank.dat', ['id']);
        exports.gConfLegionWarAttackAward = new csv.CommonCSV('conf/legionwarattackaward.dat', ['attackCount']);
        exports.gConfTavernLuck = new csv.CommonCSV('conf/tavernluck.dat', ['level']);
        exports.gConfLordCountrySalary = new csv.CommonCSV('conf/lordcountrysalary.dat', ['rank']);

        exports.gConfLegionCityBase = new csv.CommonCSV('conf/legioncitybase.dat', ['type']);
        exports.gConfLegionCityConf = new csv.CommonCSV('conf/legioncityconf.dat', ['id', 'level']);
        exports.gConfModuleOpen = new csv.CommonCSV('conf/moduleopen.dat', ['module']);
        exports.gConfModuleOpen_new = new csv.CommonCSV('conf/moduleopen_new.dat', ['module']);
        exports.gConfChatNotice = new csv.CommonCSV('conf/chatnotice.dat', ['key']);
        exports.gConfLocalText = new csv.CommonCSV('conf/language/' + config.language + '/localtext.dat', ['Id']);

        exports.gConfLegionCityMain = new csv.CommonCSV('conf/legioncitymain.dat', ['level']);
        exports.gConfTerritoryBossLegionConf = new csv.CommonCSV('conf/dfbosslegionconf.dat', ['legionLevel']);
        exports.gConfTerritoryBossSelfAward = new csv.CommonCSV('conf/dfbossselfaward.dat', ['id']);

        exports.gConfLegionWishConf = new csv.CommonCSV('conf/legionwishconf.dat', ['heroQuality']);
        exports.gConfLegionWishAchievementKey = new csv.CommonCSV('conf/legionwishachievement.dat', ['key']);
        exports.gConfPromoteRankRed = new csv.CommonCSV('conf/promoterankred.dat', ['rank']);

        exports.gConfGrowFundBought = new csv.CommonCSV('conf/avgrowfundbought.dat', ['day']);

        // 国战配置
        exports.gConfCountryWarCountryRank = new csv.CommonCSV('conf/countrywarcamp.dat', ['id', 'num']);
        exports.gConfCountryWarPersonalRank = new csv.CommonCSV('conf/countrywarpersonal.dat', ['id']);

        // 开服七天乐配置
        exports.gConfOpenSeven = new csv.CommonCSV('conf/openseven.dat', ['day', 'id']);
        exports.gConfOpenSevenReward = new csv.CommonCSV('conf/opensevenreward.dat', ['id']);
        exports.gConfOpenSevenBox = new csv.CommonCSV('conf/opensevenbox.dat', ['id']);

        exports.gConfOpenHoliday_data = new csv.CommonCSV('conf/openholiday.dat', ['confId', 'day', 'id']);
        exports.gConfOpenHolidayReward = new csv.CommonCSV('conf/openholidayreward.dat', ['id']);
        exports.gConfOpenHolidayBox_data = new csv.CommonCSV('conf/openholidaybox.dat', ['confId', 'id']);
        // // 20170823之后用老配置
        // var timeopenSevenOld =  csv.parseDate("2017:08:23:05:00:00");
        // if (getGameDate(timeopenSevenOld) > common.GLOBAL_SERVER_INFO_DICT.serverStartDate) {
        //     exports.gConfOpenSevenReward = new csv.CommonCSV('conf/oldopensevenreward.dat', ['id']);
        //     exports.gConfOpenSeven = new csv.CommonCSV('conf/oldopenseven.dat', ['day', 'id']);
        //     exports.gConfOpenSevenBox = new csv.CommonCSV('conf/oldopensevenbox.dat', ['id']);
        // }

        // exports.gConfAvRank = new csv.CommonCSV('conf/avrank.dat', ['name', 'rank']);

        exports.gConfAvRankFightForce = new csv.CommonCSV('conf/avrankfightforce.dat', ['sort']);
        exports.gConfAvRankFightForce10 = new csv.CommonCSV('conf/avrankfightforce_10.dat', ['sort']);
        exports.gConfAvRankFightForce15 = new csv.CommonCSV('conf/avrankfightforce_15.dat', ['sort']);
        exports.gConfAvRankLevel = new csv.CommonCSV('conf/avranklevel.dat', ['sort']);

        exports.gConfAvRankRechargeRaw = new csv.CommonCSV('conf/avrank_recharge.dat', ['confId', 'id']);     // 充值排行
        exports.gConfAvRankExpenseRaw = new csv.CommonCSV('conf/avrank_expense.dat', ['confId', 'id']);       // 消费排行

        // 挂机配置(黑森林探索)
        exports.gConfExploreBase = new csv.CommonCSV('conf/explorebase.dat', ['key']);
        exports.gConfExploreMonster = new csv.CommonCSV('conf/exploremonster.dat', ['level']);
        exports.gConfItemGroupBase = new csv.CommonCSV('conf/itemgroupbase.dat', ['id']);
        exports.gConfItemGroupConfig = new csv.CommonCSV('conf/itemgroupconfig.dat', ['groupId', 'id']);

        // 大本营-boss(黑森林探索)
        exports.gConfExploreBoss = new csv.CommonCSV('conf/exploreboss.dat', ['type']);
        exports.gConfExplorePath = new csv.CommonCSV('conf/explorepath.dat', ['pathId']);

        // 竞技场相关配置
        exports.gConfArenaBase = new csv.CommonCSV('conf/arenabase.dat', ['type']);
        exports.gConfArenaRank = new csv.CommonCSV('conf/arenarank.dat', ['type', 'level']);
        exports.gConfArenaAchievement = new csv.CommonCSV('conf/arenaachievement.dat', ['type', 'level']);
        exports.gConfArenaRefresh = new csv.CommonCSV('conf/arenarefresh.dat', ['id']);

        //exports.gConfCustomKing          = new csv.CommonCSV('conf/customking.dat',  ['chapter', 'id']);


        // 村庄争夺
        exports.gConfBarrenLand = new csv.CommonCSV('conf/territorywarbarrenland.dat', ['id']);
        exports.gConfPersonalLand = new csv.CommonCSV('conf/territorywarpersonal.dat', ['id', 'landId']);
        exports.gConfTeamLand = new csv.CommonCSV('conf/territorywarteam.dat', ['id']);

        // 军团boss
        exports.gConfLegionBoss = new csv.CommonCSV('conf/legionbossconf.dat', ['level']);
        exports.gConfLegionBossRank = new csv.CommonCSV('conf/legionbossrank.dat', ['level']);
        exports.gConfLegionBossAakb = new csv.CommonCSV('conf/legionbossaakb.dat', ['type']);

        exports.gConfAvTodayDoubleRaw = new csv.CommonCSV('conf/avtodaydouble.dat', ['confId', 'day']);
        exports.gConfavbuy_award = new csv.CommonCSV('conf/avbuy_award.dat', ['confId', 'week', 'id']);
    }

    if (!serverName || serverName == ServerName.WORLD_WAR) {//'worldwar'
        exports.gConfWorldWarSchedule = new csv.CommonCSV('conf/worldwarschedule.dat', ['progress']);
        exports.gConfRobot = new csv.CommonCSV('conf/robot.dat', ['id']);
        exports.gConfRobotType = new csv.CommonCSV('conf/robotconf.dat', ['id']);
        exports.gConfRobotAtt = new csv.CommonCSV('conf/robotatt.dat', ['level']);
        exports.gConfExploitWall = new csv.CommonCSV('conf/exploitwall.dat', ['key', 'rank']);
        exports.gConfDestiny = new csv.CommonCSV('conf/destiny.dat', ['level']);
        exports.gConfWorldWarScore = new csv.CommonCSV('conf/worldwarscore.dat', ['id']);
        exports.gConfWorldWarGlory = new csv.CommonCSV('conf/worldwarglory.dat', ['id']);
    }

    if (!serverName || serverName == ServerName.LEGION_WAR) {//'legionwar'
        exports.gConfRobot = new csv.CommonCSV('conf/robot.dat', ['id']);
        exports.gConfRobotType = new csv.CommonCSV('conf/robotconf.dat', ['id']);
        exports.gConfRobotAtt = new csv.CommonCSV('conf/robotatt.dat', ['level']);
        exports.gConfDestiny = new csv.CommonCSV('conf/destiny.dat', ['level']);
        //exports.gConfCustomKing = new csv.CommonCSV('conf/customking.dat',  ['chapter', 'id']);

        exports.gConfLegionWarSchedule = new csv.CommonCSV('conf/legionwarschedule.dat', ['type', 'id']);
        exports.gConfLegionWarCity = new csv.CommonCSV('conf/legionwarcity.dat', ['id']);
        exports.gConfLegionWarCityBuf = new csv.CommonCSV('conf/legionwarcitybuf.dat', ['bufType']);
        exports.gConfLegionWarRank = new csv.CommonCSV('conf/legionwarrank.dat', ['id']);
    }

    // 领地战配置
    exports.gConfTerritoryWarBase = new csv.CommonCSV('conf/dfbasepara.dat', ['key']);
    exports.gConfTerritoryWarPuppet = new csv.CommonCSV('conf/dfpuppetconf.dat', ['level']);
    exports.gConfTerritoryWarPuppetRobot = new csv.CommonCSV('conf/dfpuppetrobot.dat', ['id']);
    exports.gConfTerritoryWarBoxDrop = new csv.CommonCSV('conf/dfboxloot.dat', ['level']);
    exports.gConfTerritoryWarMapMine = new csv.CommonCSV('conf/dfmapmine.dat', ['id']);

    if (!serverName || serverName == ServerName.TERRITORY_WAR) {//'territorywar'
        exports.gConfTerritoryWarAchievement = new csv.CommonCSV('conf/dfachievement.dat', ['type', 'goalId']);
        exports.gConfTerritoryWarAchievementAwards = new csv.CommonCSV('conf/dfachievementaward.dat', ['id']);
        exports.gConfTerritoryWarAchievementType = new csv.CommonCSV('conf/dfachievementtype.dat', ['id']);
        exports.gConfTerritoryWarRelic = new csv.CommonCSV('conf/dfrelic.dat', ['id']);
        exports.gConfTerritoryWarTransfer = new csv.CommonCSV('conf/dftransmit.dat', ['id']);
        exports.gConfTerritoryWarMapElement = new csv.CommonCSV('conf/dfelement.dat', ['id']);
        exports.gConfTerritoryWarMapMonster = new csv.CommonCSV('conf/dfmapcreature.dat', ['id']);
        exports.gConfTerritoryWarMapGrid = new csv.CommonCSV('conf/dfmapgrid.dat', ['id']);
        exports.gConfLegionWarRank = new csv.CommonCSV('conf/legionwarrank.dat', ['id']);
        exports.gConfLegionName = new csv.CommonCSV('conf/language/' + config.language + '/dfrobotlegionname.dat', ['id']);

        // 城池升级
        exports.gConfLegionCityBase = new csv.CommonCSV('conf/legioncitybase.dat', ['type']);
        exports.gConfLegionCityConf = new csv.CommonCSV('conf/legioncityconf.dat', ['id', 'level']);
        exports.gConfLegionCityMain = new csv.CommonCSV('conf/legioncitymain.dat', ['level']);
        exports.gConfLegionCityFunction = new csv.CommonCSV('conf/legioncityfunction.dat', ['key']);

        exports.gConfTerritoryBossCost = new csv.CommonCSV('conf/dfbosscost.dat', ['times']);
        exports.gConfTerritoryBossForce = new csv.CommonCSV('conf/dfbossforce.dat', ['level']);
        exports.gConfTerritoryBossLegionConf = new csv.CommonCSV('conf/dfbosslegionconf.dat', ['legionLevel']);
        exports.gConfTerritoryBossSelfAward = new csv.CommonCSV('conf/dfbossselfaward.dat', ['id']);
    }

    // 服战相关配置
    exports.gConfCountryWarBase = new csv.CommonCSV('conf/countrywarbase.dat', ['key']);
    if (!serverName || serverName == ServerName.COUNTRY_WAR) {//'countrywar'
        exports.gConfCountryWarCity = new csv.CommonCSV('conf/countrywarcity.dat', ['id']);
        exports.gConfSoldierLevel = new csv.CommonCSV('conf/soldierlevel.dat', ['id', 'level', 'star']);
        exports.gConfRobot = new csv.CommonCSV('conf/robot.dat', ['id']);
        exports.gConfCountryWarTask = new csv.CommonCSV('conf/countrywartask.dat', ['type', 'id']);
        exports.gConfCountryWarTaskPersonal = new csv.CommonCSV('conf/countrywartaskpersonal.dat', ['id']);
        exports.gConfCountryWarGuard = new csv.CommonCSV('conf/countrywarguard.dat', ['level']);
        exports.gConfCountryRoom = new csv.CommonCSV('conf/countrywargrouppartition.dat', ['groupId']);
        exports.gConfCountryWarKillScore = new csv.CommonCSV('conf/countrywarkillglory.dat', ['cnt']);
    }

    // 跨服竞技场
    if (!serverName || serverName == ServerName.ARENA) {//'arena'
        exports.gConfRobot = new csv.CommonCSV('conf/robot.dat', ['id']);
        exports.gConfRobotType = new csv.CommonCSV('conf/robotconf.dat', ['id']);
        exports.gConfRobotAtt = new csv.CommonCSV('conf/robotatt.dat', ['level']);
        exports.gConfDestiny = new csv.CommonCSV('conf/destiny.dat', ['level']);

        exports.gConfChatNotice = new csv.CommonCSV('conf/chatnotice.dat', ['key']);

        //exports.gConfCustomKing = new csv.CommonCSV('conf/customking.dat',  ['chapter', 'id']);

        // 竞技场相关配置
        exports.gConfArenaBase = new csv.CommonCSV('conf/arenabase.dat', ['type']);
        exports.gConfArenaRank = new csv.CommonCSV('conf/arenarank.dat', ['type', 'level']);
        exports.gConfArenaAchievement = new csv.CommonCSV('conf/arenaachievement.dat', ['type', 'level']);
        exports.gConfArenaRefresh = new csv.CommonCSV('conf/arenarefresh.dat', ['id']);

        // 幸运轮盘
        exports.gConfAvLuckyRotateBase = new csv.CommonCSV('conf/avlucky_rotate_base.dat', ['id']);
        exports.gConfAvLuckyRotateItem = new csv.CommonCSV('conf/avlucky_rotate_item.dat', ['groupId', 'num']);
    }

    // 跨服村庄争夺
    if (!serverName || serverName == ServerName.LAND_GRABBER) {//'landgrabber'
        exports.gConfBarrenLand = new csv.CommonCSV('conf/territorywarbarrenland.dat', ['id']);
        exports.gConfPersonalLand = new csv.CommonCSV('conf/territorywarpersonal.dat', ['id', 'landId']);
        exports.gConfTeamLand = new csv.CommonCSV('conf/territorywarteam.dat', ['id']);

        exports.gConfAvTodayDoubleRaw = new csv.CommonCSV('conf/avtodaydouble.dat', ['confId', 'day']);
    }

    if (!serverName || serverName == ServerName.GLOBAL) {//'global'
        exports.gConfHero = new csv.CommonCSV('conf/hero.dat', ['id']);

        exports.gConfRobotType = new csv.CommonCSV('conf/robotconf.dat', ['id']);
        exports.gConfRobotAtt = new csv.CommonCSV('conf/robotatt.dat', ['level']);
        exports.gConfDestiny = new csv.CommonCSV('conf/destiny.dat', ['level']);

        exports.gConfOctopus = new csv.CommonCSV('conf/avoctopusbase.dat', ['id']);          // 章鱼宝藏
        exports.gConfOctopusAwardRaw = new csv.CommonCSV('conf/avoctopusaward.dat', ['confId', 'id']);          // 章鱼宝藏
    }

    onConfLoaded(serverName);
}

function onConfLoaded(serverName) {
    exports.gConfActivities = clone(exports.gConfActivitiesRaw);

    // 机器人备选武将id
    exports.gRobotHeroIds = [];

    // 玩家最大等级
    exports.gMaxUserLevel = 0;

    // 玩家最大VIP等级
    exports.gMaxVip = 0;

    if (!serverName || serverName == 'game') {
        // 遍历道具表，筛选出精炼道具
        exports.gEquipRefineItems = [];
        exports.gEquipRefineItemsLowToHigh = []; // 从小到大排列
        var index = 0;
        for (var id in exports.gConfItem) {
            var itemConf = exports.gConfItem[id];
            if (itemConf.useType == 'partexp') {
                exports.gEquipRefineItems[index] = {};
                exports.gEquipRefineItems[index].id = parseInt(id);
                exports.gEquipRefineItems[index].exp = itemConf.useEffect;
                index++;
            }
        }

        // 按经验值从大到小排列
        exports.gEquipRefineItems.sort(function (a, b) { return b.exp - a.exp });
        exports.gEquipRefineItemsLowToHigh = clone(exports.gEquipRefineItems);
        exports.gEquipRefineItemsLowToHigh.sort(function (a, b) { return a.exp - b.exp });

        // 建立一个英雄id与缘分id的对应表
        exports.gHeroFateMap = {};
        for (var id in exports.gConfFate) {
            for (var i = 1; i <= 5; i++) {
                var hid = exports.gConfFate[id]['hid' + i];
                if (hid != 0) {
                    if (!exports.gHeroFateMap[hid]) {
                        exports.gHeroFateMap[hid] = [];
                    }

                    exports.gHeroFateMap[hid].push(parseInt(id));
                }
            }
        }

        // 普通招募权重表
        exports.gNormalTavernWeight = {};    // 普通招募权重表

        // 高级招募权重表
        exports.gHighTavernWeight = {};      // 高级招募权重表
        exports.gAdvancedTavernWeight = {};  // 高级招募最低紫和最低橙卡牌的权重表
        exports.gAdvancedTavernWeight[Quality.PURPLE] = {};
        exports.gAdvancedTavernWeight[Quality.ORANGE] = {};

        // buy表times最大值
        exports.gMaxBuyTimes = Object.keys(exports.gConfBuy).max();

        // 千重楼最大层数
        exports.gMaxFloorInTower = 0;

        // 引导任务索引
        exports.gGuideTaskMap = {};

        // 商店组最大等级限制
        exports.gShopGroupLimit = {
            // gid: [minLevel, maxLevel]    // 组id: [最低等级, 最高等级]
        };

        // 商店组权重表
        exports.gShopGroupWeight = {
            /*
            type: {                         // 商店类型
                must: [],                   // 必出的组id
                others: {},                 // 其他组权重
            },
            */
        };

        // 商店行权重表
        exports.gShopItemWeight = {
            /*
            type: {                         // 商店类型
                gid: {                      // 组id
                    id: 0,                  // 项id: 权重
                },
            },
            */
        };

        // 商店列权重表
        exports.gShopGoodWeight = {
            /*
            id: {                           // 项id
                cid: 0,                     // 货币列id: 货币权重
            },
            */
        };

        // 封将转盘权重表
        exports.gPromoteOrangeWeight = {};
        exports.gPromoteRedWeight = {};

        // 神器套装加成最大累计星星数
        exports.gMaxGodSuit = 0;

        // 装备套装加成最大累计等级
        exports.gMaxEquipSuit = 0;

        // 宝石套装加成最大累计等级
        exports.gMaxGemSuit = 0;

        // 山贼权重表
        exports.gThiefWeight = {};

        // 挂机宝箱权重
        exports.gHookTreasureWeights = {};

        for (var type in ShopType) {
            exports.gShopGroupWeight[ShopType[type]] = {
                'must': [],        // 必出的组id
                'others': {},      // 其他组权重
            };
            exports.gShopItemWeight[ShopType[type]] = {};
        }
        for (var id in exports.gConfShop) {
            var confShop = exports.gConfShop[id];
            var type = confShop.type;
            var groupId = confShop.groupId;
            if (!exports.gShopItemWeight[type][groupId]) {
                var groupWeight = confShop.groupWeight;
                if (groupWeight == 0) {
                    exports.gShopGroupWeight[type].must.push(groupId);
                } else if (groupWeight == -1) {
                    // 必不出
                } else {
                    exports.gShopGroupWeight[type].others[groupId] = groupWeight;
                }
                exports.gShopItemWeight[type][groupId] = {};
            }
            var minLevel = confShop.minLevel;
            var maxLevel = confShop.maxLevel;
            if (!exports.gShopGroupLimit[groupId]) {
                exports.gShopGroupLimit[groupId] = [minLevel, maxLevel];
            } else if (exports.gShopGroupLimit[groupId][0] > minLevel) {
                exports.gShopGroupLimit[groupId][0] = minLevel;
            } else if (exports.gShopGroupLimit[groupId][0] < maxLevel) {
                exports.gShopGroupLimit[groupId][1] = maxLevel;
            }
            exports.gShopItemWeight[type][groupId][id] = confShop.weight;
            exports.gShopGoodWeight[id] = {};
            for (var i = 1; i <= 11; i++) {
                if (!exports.gConfShop[id].hasOwnProperty('weight' + i)) {
                    break;
                }
                exports.gShopGoodWeight[id][i] = exports.gConfShop[id]['weight' + i];
            }
        }

        for (var id in exports.gConfPromoteLucklyOrange) {
            exports.gPromoteOrangeWeight[id] = exports.gConfPromoteLucklyOrange[id].weight;
        }
        for (var id in exports.gConfPromoteLucklyRed) {
            exports.gPromoteRedWeight[id] = exports.gConfPromoteLucklyRed[id].weight;
        }

        // 巡逻装备奖励
        var unlocks = {      // 关卡累计解锁装备
            '1': [0, 0],    // 头盔: 等级, 品质
            '2': [0, 0],    // 武器: 等级, 品质
            '3': [0, 0],    // 腰带: 等级, 品质
            '4': [0, 0],    // 盔甲: 等级, 品质
            '5': [0, 0],    // 鞋子: 等级, 品质
            '6': [0, 0],    // 项链: 等级, 品质
        };
        var cids = Object.keys(exports.gConfCity).sort(function (c1, c2) { if (+c1 > +c2) { return 1; } return -1; });
        for (var i = 0, len = cids.length; i < len; i++) {
            var city = exports.gConfCity[cids[i]];
            city.patrolEquipIds = [];

            var type1 = city.patrolEquipType1;
            var type2 = city.patrolEquipType2;
            var level = city.patrolEquipLevel;

            if (type1 && unlocks[type1][0] <= level) {
                unlocks[type1] = [level, city.patrolEquipQuality];
            }

            if (type2 && unlocks[type2][0] <= level) {
                unlocks[type2] = [level, city.patrolEquipQuality];
            }

            /* 巡逻掉落
            for (var eid in exports.gConfEquip) {
                if (exports.gConfEquip[eid].isAncient) continue;

                var equip = exports.gConfEquip[eid];
                var unlock = unlocks[equip.type];
                if (equip.level == unlock[0] && equip.quality <= unlock[1]) {
                    city.patrolEquipIds.push([eid, exports.gConfGlobal['patrolQualityWeight' + equip.quality]]);
                }
            }*/
        }

        exports.gMaxFloorInTower = Object.keys(exports.gConfTower).max();

        /*
        for (var id in exports.gConfGodSuit) {
            var attributes = exports.gConfGodSuit[id].attribute;
            for(var i = 0; i < attributes.length; i++) {
                var segs = attributes[i].split(':');
                exports.gConfGodSuit[id]['att'+(i+1)] = +segs[0];
                exports.gConfGodSuit[id]['value'+(i+1)] = +segs[1];
            }
        }*/

        exports.gEquipSuitId = {};
        for (var id in exports.gConfEquipSuit) {
            for (i = 1; i <= 6; i++) {
                exports.gEquipSuitId[exports.gConfEquipSuit[id]['equip' + i]] = +id;
            }
        }

        // for (var id in exports.gConfEquipSuit) {
        //     for (var j = 1; j <= 6; j++) {
        //         var attributes = exports.gConfEquipSuit[id]['attribute' + j];
        //         if (!attributes) {
        //             continue;
        //         }

        //         exports.gConfEquipSuit[id][j] = {};
        //         for (var i = 0; i < attributes.length; i++) {
        //             var segs = attributes[i].split(':');
        //             exports.gConfEquipSuit[id][j]['att' + (i + 1)] = +segs[0];
        //             exports.gConfEquipSuit[id][j]['value' + (i + 1)] = +segs[1];
        //         }
        //     }
        // }

        for (var id in exports.gConfGemSuit) {
            var attributes = exports.gConfGemSuit[id].attribute;
            for (var i = 0; i < attributes.length; i++) {
                var segs = attributes[i].split(':');
                exports.gConfGemSuit[id]['att' + (i + 1)] = +segs[0];
                exports.gConfGemSuit[id]['value' + (i + 1)] = +segs[1];
            }
        }

        for (var id in exports.gConfThief) {
            exports.gThiefWeight[id] = exports.gConfThief[id].weight;
        }

        for (var id in exports.gConfDailyTask) {
            var dailyTask = exports.gConfDailyTask[id];
            exports.gConfDailyTask[dailyTask.event] = id;
        }

        for (var id in exports.gConfTask) {
            var task = exports.gConfTask[id][1];
            exports.gConfTask[task.event] = id;
            if (id == 1) {
                exports.gConfTask['elite'] = id;
                exports.gConfTask['hard'] = id;
                exports.gConfTask['nightmare'] = id;
                exports.gConfTask['hell'] = id;
            }
        }

        for (var id in exports.gConfGuideTask) {
            var task = exports.gConfGuideTask[id];
            if (!exports.gGuideTaskMap[task.event]) {
                exports.gGuideTaskMap[task.event] = [];
            }
            exports.gGuideTaskMap[task.event].push(id);
        }

        for (var id in exports.gConfJadeSeal) {
            var unlock = exports.gConfJadeSeal[id].unlock;
            if (isNaN(unlock)) {
                var segs = unlock.split('.');
                if (!segs) {
                    continue;
                }
                exports.gConfJadeSeal[segs[0]] = [+id, +segs[1] / 100];
            }
        }

        for (var id in exports.gConfRecharge) {
            var recharge = exports.gConfRecharge[id];
            exports.gConfRecharge[recharge.type] = id;
        }

        for (var id in exports.gConfHookTreasure) {
            var item = exports.gConfHookTreasure[id].item;
            if (!exports.gHookTreasureWeights[item]) {
                exports.gHookTreasureWeights[item] = {};
            }
            exports.gHookTreasureWeights[item][id] = exports.gConfHookTreasure[id].weight;
        }

        exports.gConfAvRoulette.max = Object.keys(exports.gConfAvRoulette).max();
        exports.gConfShipper.max = Object.keys(exports.gConfShipper).max();
        exports.gConfTowerCoinReward.max = Object.keys(exports.gConfTower).max();
        exports.gConfEquipSuit.max = Object.keys(exports.gConfEquipSuit).max();
        exports.gConfGemSuit.max = Object.keys(exports.gConfGemSuit).max();
        exports.gConfAvDropsDragonLotteryFrequency.max = Object.keys(exports.gConfAvDropsDragonLotteryFrequency).max();
        exports.gConfAvDropsDragon.max = Object.keys(exports.gConfAvDropsDragon).max();
        exports.gConfItMain.max = Object.keys(exports.gConfItMain).max();
        exports.gConfHeroChange.max = Object.keys(exports.gConfHeroChange).max();
        exports.gConfNobiltyLevel.max = Object.keys(exports.gConfNobiltyLevel).max();
        exports.gConfAvFirstPay.max = Object.keys(exports.gConfAvFirstPay).max();

        exports.gDragonGemLevel = {};
        for (var id in exports.gConfDragonGem) {
            var conf = exports.gConfDragonGem[id];
            if (exports.gDragonGemLevel[conf.level]) {
                exports.gDragonGemLevel[conf.level].push(+id);
            } else {
                exports.gDragonGemLevel[conf.level] = [+id];
            }
        }

        for (var id in exports.gConfDiggingProduct) {
            var key = exports.gConfDiggingProduct[id].key;
            exports.gConfDiggingProduct[key] = +id;
        }

        // 英雄升级物品id
        exports.gHeroXpItemIds = [];
        for (var id in exports.gConfItem) {
            var item = exports.gConfItem[id];
            if (item['useType'] == 'xp') {
                exports.gHeroXpItemIds.push(+id);
            }
        }
        exports.gHeroXpItemIds.sort(function (a, b) {
            return exports.gConfItem[a].useEffect - exports.gConfItem[b].useEffect;
        });

        exports.gOpenLevelActivities = {};
        for (var name in exports.gConfActivities) {
            if (exports.gConfActivities[name].type == 2) { // 等级开启活动
                var openLevel = exports.gConfActivities[name].openLevel;
                if (exports.gOpenLevelActivities[openLevel]) {
                    exports.gOpenLevelActivities[openLevel].push(name);
                } else {
                    exports.gOpenLevelActivities[openLevel] = [name];
                }
            }
        }

        // 步步惊喜活动每步概率
        exports.gAvStepWeights = {};
        for (var pos in exports.gConfAvstepinfo) {
            var weights = {};
            for (var i = 0; i < exports.gConfAvstepinfo[pos]['steppos'].length; i++) {
                var nextpos = +exports.gConfAvstepinfo[pos]['steppos'][i];
                weights[nextpos] = exports.gConfAvstepinfo[pos]['steppro'][i] | 0;
            }
            exports.gAvStepWeights[pos] = weights;
        }
    }

    // 竞技场机器人武将随机池
    for (var id in exports.gConfHero) {
        var heroCombatConf = getHeroCombatConf(id);
        if (heroCombatConf && heroCombatConf.quality >= Quality.PURPLE && heroCombatConf.camp != 5 && heroCombatConf.camp != 99) {
            exports.gRobotHeroIds.push(id);
        }
    }

    for (var level in exports.gConfLevel) {
        if (+level > exports.gMaxUserLevel) {
            exports.gMaxUserLevel = +level;
        }
    }

    for (var level in exports.gConfVip) {
        if (+level > exports.gMaxVip) {
            exports.gMaxVip = +level;
        }
    }

    for (var id in exports.gConfDrop) {
        var dropConf = exports.gConfDrop[id]
        for (var i = 1; i <= 10; i++) {
            if (!dropConf['weight' + i]) break;
            var awards = dropConf['award' + 1]
            for (var j = 0, len = awards.length; j < len; j++) {
                if (awards[j][0] == 'equip') {
                    dropConf.isEquip = true;
                }
            }
        }
    }
}

var scheduleActivity = exports.scheduleActivity = function () {
    ERROR('scheduleActivity');
    var passedDay = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime));

    for (var name in exports.gConfAvSchedule) {
        if (name == 'human_arms') {
            var a = 0;
        }
        var confs = exports.gConfAvSchedule[name];
        for (var round in confs) {
            var conf = confs[round];
            var delayDays = exports.gConfActivities[name].delayDays;
            if (passedDay >= conf.startDay && passedDay <= (conf.endDay + delayDays)) {
                // console.log("---------name = "+name);
                var avConf = exports.gConfActivities[name];
                avConf.openDay = 0;
                avConf.stage = conf.confId;
                var today = getGameDate();
                var startTime = common.getTime(common.GLOBAL_SERVER_INFO_DICT.serverStartDate) + conf.startDay * 86400 + exports.gConfGlobal.resetHour * 3600;
                avConf.startTime = startTime;
                avConf.endTime = startTime + (conf.endDay - conf.startDay + 1) * 86400 - 60;
            }
        }
    }

    for (var name in exports.gConfAvCondition) {
        var avConf = exports.gConfActivities[name];
        if (avConf && !avConf.stage) {
            var gConfAvCondition_day = common.getDateDiff2(getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime), getGameDate(avConf.startTime)) + 1;
            var conf = exports.gConfAvCondition[name];
            for (var stage in conf) {
                if (gConfAvCondition_day >= conf[stage].startServerTime && gConfAvCondition_day <= conf[stage].endServerTime) {
                    avConf.stage = stage;
                    break;
                }
            }
        }
    }

    for (var name in exports.gConfAvNewStage) {
        var confs = exports.gConfAvNewStage[name];
        for (var round in confs) {
            var conf = confs[round];
            if (passedDay >= conf.startDay && passedDay <= conf.endDay) {
                var avConf = exports.gConfActivities[name];
                avConf.openDay = 0;
                avConf.stage = conf.confId;
            }
        }
    }

    for (var name in exports.gConfActivities) {
        var avConf = exports.gConfActivities[name];
        //delete avConf.name;
        if (avConf.type == 1 || avConf.type == 0) {
            if (!avConf.stage) {
                avConf.stage = 1;
            }

            if (name == 'pay_only' && exports.gConfAvPayOnlyRaw && exports.gConfAvSingleRechargeRaw) {
                exports.gConfAvPayOnly = exports.gConfAvPayOnlyRaw[avConf.stage];
                exports.gConfAvSingleRecharge = exports.gConfAvSingleRechargeRaw[avConf.stage];
            } else if (name == 'single_recharge' && exports.gConfAvSingleRechargeRaw) {
                exports.gConfAvSingleRecharge = exports.gConfAvSingleRechargeRaw[avConf.stage];
            } else if (name == 'todaydouble' && exports.gConfAvTodayDoubleRaw) {
                exports.gConfAvTodayDouble = exports.gConfAvTodayDoubleRaw[avConf.stage];
            } else if (name == 'daily_recharge' && exports.gConfAvDailyRechargeRaw) {
                exports.gConfAvDailyRecharge = exports.gConfAvDailyRechargeRaw[avConf.stage];
            } else if (name == 'login_goodgift' && exports.gConfAvLoginGiftRaw) {
                exports.gConfAvLoginGift = exports.gConfAvLoginGiftRaw[avConf.stage];
            } else if (name == 'expend_gift' && exports.gConfAvExpendGiftRaw) {
                exports.gConfAvExpendGift = exports.gConfAvExpendGiftRaw[avConf.stage];
            } else if (name == 'accumulate_recharge' && exports.gConfAvAccumulateRechargeRaw) {
                exports.gConfAvAccumulateRecharge = exports.gConfAvAccumulateRechargeRaw[avConf.stage];
            } else if (name == 'tavern_recruit' && exports.gConfAvTavernRecruitFrequencyRaw) {
                exports.gConfAvTavernRecruitFrequency = exports.gConfAvTavernRecruitFrequencyRaw[avConf.stage];
            } else if (name == 'daily_cost' && exports.gConfAvDailyCostRaw) {
                exports.gConfAvDailyCost = exports.gConfAvDailyCostRaw[avConf.stage];
            } else if (name == 'value_package' && exports.gConfAvOvervaluedGiftIdRaw) {
                exports.gConfAvOvervaluedGiftId = exports.gConfAvOvervaluedGiftIdRaw[avConf.stage];
            } else if (name == 'human_arms' && exports.gConfAvhuman_armsRaw) {
                exports.gConfAvhuman_arms = exports.gConfAvhuman_armsRaw[avConf.stage];
            } else if (name == 'human_wing' && exports.gConfAvhuman_wingRaw) {
                exports.gConfAvhuman_wing = exports.gConfAvhuman_wingRaw[avConf.stage];
            } else if (name == 'human_mount' && exports.gConfAvhuman_mountRaw) {
                exports.gConfAvhuman_mount = exports.gConfAvhuman_mountRaw[avConf.stage];
            } else if (name == 'day_vouchsafe' && exports.gConfAvDayVouchsafeRaw) {
                exports.gConfAvDayVouchsafe = exports.gConfAvDayVouchsafeRaw[avConf.stage];
                // 特惠活动开服时间+7天需要小于配置结束时间
                var endTime = common.getTime(common.GLOBAL_SERVER_INFO_DICT.serverStartDate) + (avConf.openDay + 7) * 86400 + exports.gConfGlobal.resetHour * 3600 - 1;
                if (endTime > avConf.endTime) {
                    avConf.openDay = 10000;
                }
            } else if (name == 'tavern_normal' && exports.gConfAvTavernNormalRaw) {
                exports.gConfAvTavernNormal = exports.gConfAvTavernNormalRaw[avConf.stage];
            } else if (name == 'tavern_high' && exports.gConfAvTavernHighRaw) {
                exports.gConfAvTavernHigh = exports.gConfAvTavernHighRaw[avConf.stage];
            } else if (name == 'limit_exchange' && exports.gConfAvLimitExchangeRaw) {
                exports.gConfAvLimitExchange = exports.gConfAvLimitExchangeRaw[avConf.stage];
            } else if (name == 'pray' && exports.gConfAvPrayRaw) {
                exports.gConfAvPray = exports.gConfAvPrayRaw[avConf.stage];
            } else if (name == 'day_recharge' && exports.gConfAvDayRechargeRaw) {
                exports.gConfDayRecharge = exports.gConfAvDayRechargeRaw[avConf.stage];
            } else if (name == 'accumulate_daily' && exports.gConfAvAccumulateDailyRaw) {
                var tActPassDay = common.getDateDiff(getGameDate(), common.getDate(exports.gConfActivities[name].startTime)) + 1;
                exports.gConfAvAccumulateDaily = exports.gConfAvAccumulateDailyRaw[avConf.stage][tActPassDay];
            } else if (name == 'accumulate_pay' && exports.gConfAvAccumulatePayRaw) {
                exports.gConfAvAccumulatePay = exports.gConfAvAccumulatePayRaw[avConf.stage];
            } else if (name == 'day_exchange' && exports.gConfAvDayExchangeRaw) {
                exports.gConfDayExchange = exports.gConfAvDayExchangeRaw[avConf.stage];
            } else if (name == 'manually' && exports.gConfAvmanuallyLevelRaw && exports.gConfAvmanuallyTaskRaw && exports.gConfAvmanuallyAwardRaw) {         // 龙纹手册
                exports.gConfAvmanuallyLevel = exports.gConfAvmanuallyLevelRaw[avConf.stage];
                exports.gConfAvmanuallyTask = exports.gConfAvmanuallyTaskRaw[avConf.stage];
                exports.gConfAvmanuallyAward = exports.gConfAvmanuallyAwardRaw[avConf.stage];
            } else if (name == 'open_holiday' && exports.gConfOpenHoliday_data) {
                exports.gConfOpenHoliday = exports.gConfOpenHoliday_data[avConf.stage];
                exports.gConfOpenHolidayBox = exports.gConfOpenHolidayBox_data[avConf.stage];
            } else if (name == 'buy_award' && exports.gConfavbuy_award) {
                exports.gConfBuyAward = exports.gConfavbuy_award[avConf.stage];
            } else if (name == 'open_rank_recharge' && exports.gConfAvRankRechargeRaw) {
                exports.gConfAvRankRecharge = exports.gConfAvRankRechargeRaw[avConf.stage];
            } else if (name == 'open_rank_expense' && exports.gConfAvRankExpenseRaw) {
                exports.gConfAvRankExpense = exports.gConfAvRankExpenseRaw[avConf.stage];
            } else if (name == 'octopus' && exports.gConfOctopusAwardRaw) {
                exports.gConfOctopusAward = exports.gConfOctopusAwardRaw[avConf.stage];
            } else if (name == 'help_equip' && exports.gConfHelpEquipRaw) {
                exports.gConfHelpEquip = exports.gConfHelpEquipRaw[avConf.stage];
            } else if (name == 'destiny_rotate' && exports.gConfAvDestinyRotateCostRaw && exports.gConfAvDestinyRotateNormalRaw && exports.gConfAvDestinyRotateHighRaw) {
                exports.gConfAvDestinyRotateCost = exports.gConfAvDestinyRotateCostRaw[avConf.stage];
                exports.gConfAvDestinyRotateNormal = exports.gConfAvDestinyRotateNormalRaw[avConf.stage];
                exports.gConfAvDestinyRotateHigh = exports.gConfAvDestinyRotateHighRaw[avConf.stage];
            }
        }
    }

    exports.gConfActivitiesClient = clone(exports.gConfActivities);
    for (var name in exports.gConfActivitiesClient) {
        var avConf = exports.gConfActivitiesClient[name];
        if (avConf.type == 1) {
            avConf.startTime = new Date(avConf.startTime * 1000).format('yyyy:MM:dd:hh:mm:ss');
            avConf.endTime = new Date(avConf.endTime * 1000).format('yyyy:MM:dd:hh:mm:ss');
        }
    }

    // 每日重置时间点前30秒刷新活动配置
    var timeout = getResetTime() + 86400 + 10 - common.getTime();
    ERROR('set scheduleActivity timeout: ' + timeout);
    setTimeout(function () {
        scheduleActivity();
    }, timeout * 1000);
}

/** 获取英雄战斗数据 */
function getHeroCombatConf(id, awake) {
    var heroConf = exports.gConfHero[id];
    if (!heroConf) { return null; }

    var heroTemplateId = heroConf.heroTemplateId;     // hero模板id
    if (awake && awake >= 4) {
        heroTemplateId = heroConf.templatedIdUltimate;
    }
    return exports.gConfCombatHeroTemplate[heroTemplateId];
};
exports.getHeroCombatConf = getHeroCombatConf

/**
 * 获取英雄的星级
 * @param {*} hero      英雄信息
 */
function getHeroStar(hero) {
    if (!hero) { return 0; }

    var heroConf = exports.gConfHero[hero.rid];
    if (!heroConf) { return 0; }

    var heroTemplateId = heroConf.heroTemplateId;                                       // hero模板id
    if (hero.awake > 4) {
        heroTemplateId = heroConf.templatedIdUltimate;
    }
    var starBase = exports.gConfCombatHeroTemplate[heroTemplateId]['starBase'];        // 模板類型
    return (starBase + hero.awake - 1);
};
exports.getHeroStar = getHeroStar;