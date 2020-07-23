start "bate gateway" node ./gateway/gateway.js ../config/config.js bate
start "bate game1" node ./game/game.js ../config/config.js bate 1
start "bate world" node ./world/world.js ../config/config.js bate
start "bate wss" node ./wss/wss.js ../config/config.js bate
start "bate log" node ./logserver/logserver.js ../config/config.js bate