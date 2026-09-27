#!/bin/sh
set -e
# Named/bind volumes may be owned by root; ensure the app user can write spaces.
mkdir -p /app/data/spaces
chown -R nodeapp:nodejs /app/data
exec su-exec nodeapp "$@"
