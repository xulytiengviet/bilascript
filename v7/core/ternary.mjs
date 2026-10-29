/**
 * BilaScript v7 — experimental balanced-ternary backend (pure JavaScript).
 * Trits are represented by Int8Array (-1, 0, +1). No physical ternary hardware.
 * T27 alphabet: a..z + SPACE. Arbitrary BilaScript source uses UTF-8/6.
 */
export const ALPHABET27 = "abcdefghijklmnopqrstuvwxyz ";
export const MAX_U256 = (1n << 256n) - 1n;
export const U256_TRITS = 163; // 3^163 > 2^257, enough for unsigned uint256 in balanced form.

function checkTrit(t) {
  if (!Number.isInteger(t) || t < -1 || t > 1) throw Error("TRIT_INVALID: cần -1, 0 hoặc +1.");
  return t;
}
export function toBalanced(value, width) {
  let n = BigInt(value);
  if (!Number.isInteger(width) || width < 1 || width > 16384) throw Error("Độ rộng trit không hợp lệ.");
  const out = new Int8Array(width);
  for (let i = width - 1; i >= 0; i--) {
    const remainder = ((n + 1n) % 3n + 3n) % 3n - 1n;
    out[i] = Number(remainder);
    n = (n - remainder) / 3n;
  }
  if (n !== 0n) throw Error("TRIT_OVERFLOW: giá trị vượt số trit đang chọn.");
  return out;
}
export function fromBalanced(trits) {
  let n = 0n;
  for (const d of trits) n = n * 3n + BigInt(checkTrit(d));
  return n;
}
const t27Lut = Array.from({length: 27}, (_, i) => toBalanced(BigInt(i - 13), 3));
const t27Index = new Map(t27Lut.map((d, i) => [Array.from(d).join(","), i]));

export function encodeT27(text) {
  const out = new Int8Array(text.length * 3);
  for (let i = 0; i < text.length; i++) {
    const idx = ALPHABET27.indexOf(text[i]);
    if (idx < 0) throw Error("T27 chỉ chấp nhận a–z và khoảng trắng; mã BilaScript đầy đủ hãy chọn UTF-8/6.");
    out.set(t27Lut[idx], i * 3);
  }
  return out;
}
export function decodeT27(trits) {
  if (trits.length % 3 !== 0) throw Error("Số trit T27 phải chia hết cho 3.");
  let result = "";
  for (let i = 0; i < trits.length; i += 3) {
    const key = [checkTrit(trits[i]), checkTrit(trits[i + 1]), checkTrit(trits[i + 2])].join(",");
    const index = t27Index.get(key);
    if (index === undefined) throw Error("Bộ ba trit T27 không hợp lệ.");
    result += ALPHABET27[index];
  }
  return result;
}
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", {fatal: true});
const utf8Lut = Array.from({length: 256}, (_, i) => toBalanced(BigInt(i - 128), 6));
export function encodeUtf8Trits(text) {
  const bytes = encoder.encode(text);
  const out = new Int8Array(bytes.length * 6);
  for (let i = 0; i < bytes.length; i++) out.set(utf8Lut[bytes[i]], i * 6);
  return out;
}
export function decodeUtf8Trits(trits) {
  if (trits.length % 6 !== 0) throw Error("Số trit UTF-8/6 phải chia hết cho 6.");
  const out = new Uint8Array(trits.length / 6);
  for (let i = 0; i < out.length; i++) {
    const n = fromBalanced(trits.subarray(i * 6, i * 6 + 6)) + 128n;
    if (n < 0n || n > 255n) throw Error("Byte giải mã ngoài khoảng 0..255.");
    out[i] = Number(n);
  }
  return decoder.decode(out);
}
export function addU256Ternary(a, b) {
  const x = BigInt(a), y = BigInt(b);
  if (x < 0n || y < 0n || x > MAX_U256 || y > MAX_U256) {
    throw Error("U256_RANGE: toán hạng ngoài miền uint256.");
  }
  const left = toBalanced(x, U256_TRITS), right = toBalanced(y, U256_TRITS);
  const result = new Int8Array(U256_TRITS);
  let carry = 0;
  for (let i = U256_TRITS - 1; i >= 0; i--) {
    const sum = left[i] + right[i] + carry;
    const digit = ((sum + 1) % 3 + 3) % 3 - 1;
    result[i] = digit;
    carry = (sum - digit) / 3;
  }
  if (carry !== 0) throw Error("TRIT_WIDTH_OVERFLOW.");
  const value = fromBalanced(result);
  if (value < 0n || value > MAX_U256) throw Error("U256_OVERFLOW: phép cộng vượt uint256.");
  return {value, trits: result, digitOperations: U256_TRITS};
}
export function formatTrits(trits, max = 180) {
  const body = Array.from(trits.subarray(0, max), d => d === -1 ? "−" : d === 1 ? "+" : "0").join("");
  return body + (trits.length > max ? `… (+${trits.length - max} trit)` : "");
}
