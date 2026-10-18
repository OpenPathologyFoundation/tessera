#!/usr/bin/env sh
# Replay entry point. The protocol (replay/README.md) names run.sh; the work is
# in run.js because the patches are JSON and the repository adds no dependency
# to parse it from a shell.
exec node "$(dirname "$0")/run.js" "$@"
