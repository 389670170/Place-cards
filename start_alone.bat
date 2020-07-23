start "alone gateway" node ./gateway/gateway.js ../config/config.js alone
start "alone game1" node ./game/game.js ../config/config.js alone 1
start "alone world" node ./world/world.js ../config/config.js alone
start "alone wss" node ./wss/wss.js ../config/config.js alone
start "alone log" node ./logserver/logserver.js ../config/config.js alone

start "alone global" node ./global_server/global_server.js ../config/config.js
start "alone arena" node ./arena/arena.js ../config/config.js
start "alone countrywar" node ./countrywar/countrywar.js ../config/config.js
start "alone landgrabber" node ./landgrabber/landgrabber.js ../config/config.js
start "alone legionwar" node ./legionwar/legionwar.js ../config/config.js
start "alone teamzone" node ./teamzone/teamzone.js ../config/config.js
start "alone territorywar" node ./territorywar/territorywar.js ../config/config.js
start "alone worldwar" node ./worldwar/worldwar.js ../config/config.js