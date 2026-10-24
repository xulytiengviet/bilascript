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
# Constructor owner = deployer CALLER, stored in reserved slot 0.
DEPLOYER=$(cast wallet address --private-key "$PK")
OWNER_SLOT=$(cast storage "$ADDR" 0 --rpc-url "$RPC")
node -e 'const actual=BigInt(process.argv[1]).toString(16).padStart(40,"0").slice(-40).toLowerCase(); if(actual!==process.argv[2].slice(2).toLowerCase())process.exit(1)' "$OWNER_SLOT" "$DEPLOYER"
CODE=$(cast code "$ADDR" --rpc-url "$RPC")
node -e 'if(process.argv[1].toLowerCase()!==process.argv[2].toLowerCase())process.exit(1)' "$CODE" "$RUNTIME"
WRITE_JSON=$(cast send "$ADDR" "ganj(uint256)" 42 --rpc-url "$RPC" --private-key "$PK" --json)
node -e 'if(BigInt(JSON.parse(process.argv[1]).status)!==1n)process.exit(1)' "$WRITE_JSON"
# Unauthorized sender must be rejected and must not change storage.
OTHER="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
if cast call "$ADDR" "ganj(uint256)" 99 --from "$OTHER" --rpc-url "$RPC" >/tmp/bila-unauth.out 2>/tmp/bila-unauth.err; then
 echo "ERROR: unauthorized CALLER was accepted" >&2; exit 1
fi
# Nonzero value must revert (nonpayable runtime).
if cast call "$ADDR" "docr()(uint256)" --value 1 --rpc-url "$RPC" >/tmp/bila-value.out 2>/tmp/bila-value.err; then
 echo "ERROR: nonpayable runtime accepted ETH" >&2; exit 1
fi
VALUE=$(cast storage "$ADDR" 1 --rpc-url "$RPC")
test "$(cast to-dec "$VALUE")" = "42"
READ=$(cast call "$ADDR" "docr()(uint256)" --rpc-url "$RPC")
test "$(cast to-dec "$READ")" = "42"
INC_JSON=$(cast send "$ADDR" "tago()" --rpc-url "$RPC" --private-key "$PK" --json)
node -e 'if(BigInt(JSON.parse(process.argv[1]).status)!==1n)process.exit(1)' "$INC_JSON"
NEXT=$(cast storage "$ADDR" 1 --rpc-url "$RPC")
test "$(cast to-dec "$NEXT")" = "43"
# Reproduce a real EVM revert when uint256 addition would overflow.
MAX_UINT256="115792089237316195423570985008687907853269984665640564039457584007913129639935"
OVERFLOW_SETUP=$(cast send "$ADDR" "ganj(uint256)" "$MAX_UINT256" --rpc-url "$RPC" --private-key "$PK" --json)
node -e 'if(BigInt(JSON.parse(process.argv[1]).status)!==1n)process.exit(1)' "$OVERFLOW_SETUP"
if cast call "$ADDR" "tago()" --rpc-url "$RPC" >/tmp/bila-overflow.out 2>/tmp/bila-overflow.err; then
  echo "ERROR: expected checked increment to REVERT at max uint256" >&2
  exit 1
fi
STILL_MAX=$(cast storage "$ADDR" 1 --rpc-url "$RPC")
test "$(cast to-dec "$STILL_MAX")" = "$MAX_UINT256"
echo "ANVIL PASS: chain=$CHAIN contract=$ADDR initial=42 incremented=43 overflow=revert runtime-bytecode=match owner=deployer unauthorized=revert nonpayable=revert"
