#!/bin/bash
# You must first run npm run build
sudo chown -R olmozavala:www-data 1/
sudo chown -R olmozavala:www-data 2/
sudo chown -R olmozavala:www-data 4/
sudo chown -R olmozavala:www-data 8/
sudo chown -R olmozavala:www-data 10/

sudo chmod -R 755 1/
sudo chmod -R 755 2/
sudo chmod -R 755 4/
sudo chmod -R 755 8/
sudo chmod -R 755 10/

chmod -R 755 1
chmod -R 755 2
chmod -R 755 3
chmod -R 755 4
chmod -R 755 8
chmod -R 755 10

chmod  755 countries.json
chmod  755 ReachedTablesData.json
chmod  755 World_litter_stats.tar.xz

chown -R olmozavala:www-data 1
chown -R olmozavala:www-data 2
chown -R olmozavala:www-data 3
chown -R olmozavala:www-data 4
chown -R olmozavala:www-data 8
chown -R olmozavala:www-data 10

chown -R olmozavala:www-data countries.json
chown -R olmozavala:www-data ReachedTablesData.json

