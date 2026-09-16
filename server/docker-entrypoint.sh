#!/bin/sh
set -eu

# The HTTP process must be restartable without waiting for database bootstrap.
# Migrations and first-run seed run in the separate bootstrap service.
exec node dist/src/main.js
