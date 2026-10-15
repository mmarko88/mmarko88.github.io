#!/bin/sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
docker build -t profdev --file "$SCRIPT_DIR/hugoenv.dockerfile" "$SCRIPT_DIR/.."