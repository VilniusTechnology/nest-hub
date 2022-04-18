#!/bin/bash
# 1. Build
npm run build

# 2. Send over SSH
rsync -avz --exclude '.*/' --exclude '.*' --progress --exclude 'node_modules' --exclude '.idea' --exclude 'mandarinas-settings' --exclude 'config/production/config.js' --exclude 'config/development/config.js' --progress . tangerine@hub.local:/home/tangerine/tangerine-hub
