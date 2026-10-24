#!/usr/bin/env bash
set -euo pipefail
# This private key is the PUBLIC well-known Anvil test account ONLY. Never use on a funded chain.
RPC="http://127.0.0.1:8545"
PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
anvil --host 127.0.0.1 --port 8545 --chain-id 31337 --silent > /tmp/bila-anvil.log 2>&1 &
ANVIL_PID=$!
trap 'kill "$ANVIL_PID" 2>/dev/null || true' EXIT
for i in $(seq 1 40); do
  if cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then break; fi
  sleep 1
done
CHAIN=$(cast chain-id --rpc-url "$RPC")
test "$CHAIN" = "31337"
CREATION=$(node --input-type=module -e 'import {compileBila,EXAMPLE} from "./v6/compiler.mjs";process.stdout.write(compileBila(EXAMPLE).creationBytecode)')
RUNTIME=$(node --input-type=module -e 'import {compileBila,EXAMPLE} from "./v6/compiler.mjs";process.stdout.write(compileBila(EXAMPLE).runtimeBytecode)')
DEPLOY_JSON=$(cast send --rpc-url "$RPC" --private-key "$PK" --create "$CREATION" --json)
ADDR=$(node -e 'const r=JSON.parse(process.argv[1]);if(BigInt(r.status)!==1n)process.exit(1);process.stdout.write(r.contractAddress)' "$DEPLOY_JSON")
test -n "$ADDR"
CODE=$(cast code "$ADDR" --rpc-url "$RPC")
node -e 'if(process.argv[1].toLowerCase()!==process.argv[2].toLowerCase())process.exit(1)' "$CODE" "$RUNTIME"
WRITE_JSON=$(cast send "$ADDR" "gan(uint256)" 42 --rpc-url "$RPC" --private-key "$PK" --json)
node -e 'if(BigInt(JSON.parse(process.argv[1]).status)!==1n)process.exit(1)' "$WRITE_JSON"
VALUE=$(cast storage "$ADDR" 0 --rpc-url "$RPC")
test "$(cast to-dec "$VALUE")" = "42"
READ=$(cast call "$ADDR" "doc()(uint256)" --rpc-url "$RPC")
test "$(cast to-dec "$READ")" = "42"
INC_JSON=$(cast send "$ADDR" "tang()" --rpc-url "$RPC" --private-key "$PK" --json)
node -e 'if(BigInt(JSON.parse(process.argv[1]).status)!==1n)process.exit(1)' "$INC_JSON"
NEXT=$(cast storage "$ADDR" 0 --rpc-url "$RPC")
test "$(cast to-dec "$NEXT")" = "43"
echo "ANVIL PASS: chain=$CHAIN contract=$ADDR initial=42 incremented=43 runtime-bytecode=match"
