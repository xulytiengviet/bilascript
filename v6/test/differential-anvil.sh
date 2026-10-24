#!/usr/bin/env bash
set -euo pipefail
# Differential fuzzing accepts only local Anvil chain 31337; no private key used.
anvil --host 127.0.0.1 --port 8545 --chain-id 31337 --silent >/tmp/bila-fuzz-anvil.log 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null || true' EXIT
for i in $(seq 1 50); do
 if cast chain-id --rpc-url http://127.0.0.1:8545 >/dev/null 2>&1; then break; fi
 sleep 1
done
test "$(cast chain-id --rpc-url http://127.0.0.1:8545)" = "31337"
node v6/test/differential-fuzz.mjs
