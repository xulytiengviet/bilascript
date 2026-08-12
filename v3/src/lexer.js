import { keywordOf, MAPPED_ENGLISH } from "./vocabulary.js";

const OPS = ["===", "!==", ">>>", "**=", "=>", "==", "!=", "<=", ">=", "++", "--", "+=", "-=", "*=", "/=", "%=", "&&", "||", "**", "<<", ">>", "&=", "|=", "^="];
const ONE = new Set("{}()[];,.?:+-*/%<>=!&|^~");

export class BilaSyntaxError extends SyntaxError {
  constructor(message, token) {
    super(`${message}${token ? ` tại dòng ${token.line}, cột ${token.column}` : ""}`);
    this.name = "BilaSyntaxError";
    this.token = token || null;
  }
}

export function detectProfile(source) {
  const re = /^\uFEFF?\s*---(?:bila(?::(strict|js))?|cvss|cvnss|cvnss40|cvnss4)---\s*(?:\r?\n|$)/;
  const m = source.match(re);
  if (!m) return { mode: "bila", source, directive: null };
  return { mode: m[1] || "bila", source: source.slice(m[0].length), directive: m[0].trim() };
}

export function lex(input) {
  const profile = detectProfile(String(input));
  const source = profile.source;
  const tokens = [];
  let i = 0, line = 1, column = 1;

  const peek = (n = 0) => source[i + n] || "";
  const advance = () => {
    const ch = source[i++] || "";
    if (ch === "\n") { line++; column = 1; } else column++;
    return ch;
  };
  const add = (type, value, raw, startLine, startColumn) => tokens.push({ type, value, raw, line: startLine, column: startColumn });

  while (i < source.length) {
    const ch = peek();
    if (/\s/.test(ch)) { advance(); continue; }
    if (ch === "/" && peek(1) === "/") { while (i < source.length && advance() !== "\n") {} continue; }
    if (ch === "/" && peek(1) === "*") {
      advance(); advance();
      while (i < source.length && !(peek() === "*" && peek(1) === "/")) advance();
      if (i >= source.length) throw new BilaSyntaxError("Comment chưa đóng", { line, column });
      advance(); advance(); continue;
    }

    const sl = line, sc = column;
    if (/[A-Za-z_$]/.test(ch)) {
      let raw = advance();
      while (/[A-Za-z0-9_$]/.test(peek())) raw += advance();
      if (profile.mode === "strict" && MAPPED_ENGLISH.has(raw)) {
        throw new BilaSyntaxError(`Từ khóa English '${raw}' bị cấm trong bila:strict; hãy dùng canonical CVNSS4.0`, { line: sl, column: sc });
      }
      const kw = keywordOf(raw, profile.mode);
      add(kw ? "keyword" : "identifier", kw || raw, raw, sl, sc);
      continue;
    }

    if (/\d/.test(ch) || (ch === "." && /\d/.test(peek(1)))) {
      let raw = "";
      if (ch === "0" && /[xX]/.test(peek(1))) {
        raw += advance() + advance(); while (/[0-9A-Fa-f]/.test(peek())) raw += advance();
      } else {
        while (/\d/.test(peek())) raw += advance();
        if (peek() === ".") { raw += advance(); while (/\d/.test(peek())) raw += advance(); }
        if (/[eE]/.test(peek())) { raw += advance(); if (/[+-]/.test(peek())) raw += advance(); while (/\d/.test(peek())) raw += advance(); }
      }
      add("number", Number(raw), raw, sl, sc); continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = advance(); let value = "", raw = quote, closed = false;
      while (i < source.length) {
        const c = advance(); raw += c;
        if (c === quote) { closed = true; break; }
        if (c === "\\") {
          const e = advance(); raw += e;
          const map = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0" };
          value += map[e] ?? e;
        } else value += c;
      }
      if (!closed) throw new BilaSyntaxError("Chuỗi chưa đóng", { line: sl, column: sc });
      add("string", value, raw, sl, sc); continue;
    }

    let op = OPS.find(x => source.startsWith(x, i));
    if (op) { for (let k = 0; k < op.length; k++) advance(); add("punctuator", op, op, sl, sc); continue; }
    if (ONE.has(ch)) { advance(); add("punctuator", ch, ch, sl, sc); continue; }
    throw new BilaSyntaxError(`Ký tự không hợp lệ '${ch}'`, { line: sl, column: sc });
  }
  tokens.push({ type: "eof", value: "<eof>", raw: "", line, column });
  return { mode: profile.mode, directive: profile.directive, tokens };
}
