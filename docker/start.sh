#!/bin/sh
set -eu

cd /app
npm start &

exec nginx -g "daemon off;"
