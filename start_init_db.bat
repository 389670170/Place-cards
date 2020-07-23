start "init db game" node ./init_db/init_game_db.js ../config/config.js bate
start "init db game" node ./init_db/init_game_db.js ../config/config.js alone
start "init db game" node ./init_db/init_game_db.js ../config/config.js
rem start "init db logserver" node ./init_db/init_logserver_db.js ../config/config.js

start "init db arena" node ./init_db/init_arena_db.js ../config/config.js
start "init db countrywar" node ./init_db/init_countrywar_db.js ../config/config.js
start "init db global_server" node ./init_db/init_global_server_db.js ../config/config.js
start "init db landgrabber" node ./init_db/init_landgrabber_db.js ../config/config.js
start "init db legionwar" node ./init_db/init_legionwar_db.js ../config/config.js
start "init db teamzone" node ./init_db/init_teamzone_db.js ../config/config.js
start "init db territorywar" node ./init_db/init_territorywar_db.js ../config/config.js
start "init db worldwar" node ./init_db/init_worldwar_db.js ../config/config.js