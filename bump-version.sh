#!/bin/sh
# Force les téléphones à recharger la dernière version du site
V=$(date +%Y%m%d%H%M)
sed -i -E "s/\?v=[0-9]+/?v=$V/g" index.html
