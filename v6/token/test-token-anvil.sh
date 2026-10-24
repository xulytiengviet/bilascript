#!/usr/bin/env bash
set -euo pipefail
RPC="http://127.0.0.1:8545"
anvil --host 127.0.0.1 --port 8545 --chain-id 31337 --silent >/tmp/bila-token-anvil.log 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null || true' EXIT
for i in $(seq 1 40); do
 if cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then break; fi
 sleep 1
done
test "$(cast chain-id --rpc-url "$RPC")" = "31337"
node v6/token/test-token-anvil.mjs
