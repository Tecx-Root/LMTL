/*
 * LMTL 大数库
 * 采用十进制「尾数 × 10^指数」表示，尾数保留 1~16 位有效数字，指数为整数。
 * 支持科学计数法字符串（如 "1.23e500"）的解析、运算、比较与序列化。
 * 纯静态实现，可直接通过 file:// 加载。
 */
(function (global) {
  "use strict";

  var MAX_EXP = 1000000000;

  function BigNumber(mantissa, exponent) {
    this.m = mantissa;
    this.e = exponent;
  }

  function normalize(m, e) {
    if (m === 0) return ZERO;
    if (!isFinite(m)) return m > 0 ? INFINITY : NEG_INFINITY;
    var sign = m < 0 ? -1 : 1;
    m = Math.abs(m);
    e = Math.round(e);
    while (m >= 10) {
      m /= 10;
      e += 1;
    }
    while (m < 1) {
      m *= 10;
      e -= 1;
    }
    if (e > MAX_EXP) return sign > 0 ? INFINITY : NEG_INFINITY;
    if (e < -MAX_EXP) return ZERO;
    return new BigNumber(sign * m, e);
  }

  function fromString(text) {
    var parts = /^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?$/.exec(text);
    if (!parts) return ZERO;
    var sign = parts[1] === "-" ? -1 : 1;
    var exp = parts[3] ? parseInt(parts[3], 10) : 0;
    if (!isFinite(exp)) exp = exp > 0 ? MAX_EXP : -MAX_EXP;
    if (exp > MAX_EXP) exp = MAX_EXP;
    if (exp < -MAX_EXP) exp = -MAX_EXP;

    var dot = parts[2].indexOf(".");
    var intPart = dot < 0 ? parts[2] : parts[2].slice(0, dot);
    var fracPart = dot < 0 ? "" : parts[2].slice(dot + 1);
    var digits = (intPart || "0") + fracPart;
    var first = 0;
    while (first < digits.length && digits.charAt(first) === "0") first += 1;
    if (first === digits.length) return ZERO;

    var mantissa = Number(digits.charAt(first) + "." + digits.slice(first + 1));
    return normalize(sign * mantissa, exp + intPart.length - first - 1);
  }

  function from(value) {
    if (value instanceof BigNumber) return value;
    if (typeof value === "number") {
      if (value === 0) return ZERO;
      if (!isFinite(value)) return value > 0 ? INFINITY : NEG_INFINITY;
      return fromString(value.toString());
    }
    if (typeof value === "string") return fromString(value.trim());
    return ZERO;
  }

  function add(a, b) {
    a = from(a);
    b = from(b);
    if (a.isZero()) return b;
    if (b.isZero()) return a;
    if (a.isInfinite() || b.isInfinite()) {
      if (a.isInfinite() && b.isInfinite() && a.m !== b.m) return ZERO;
      return a.isInfinite() ? a : b;
    }
    var target = Math.max(a.e, b.e);
    var shiftA = target - a.e;
    var shiftB = target - b.e;
    if (shiftA > 18) return b;
    if (shiftB > 18) return a;
    return normalize(
      a.m * Math.pow(10, -shiftA) + b.m * Math.pow(10, -shiftB),
      target
    );
  }

  function cmp(a, b) {
    a = from(a);
    b = from(b);
    if (a.isInfinite() || b.isInfinite()) {
      if (a.isInfinite() && b.isInfinite()) {
        if (a.m === b.m) return 0;
        return a.m > b.m ? 1 : -1;
      }
      if (a.isInfinite()) return a.m > 0 ? 1 : -1;
      return b.m > 0 ? -1 : 1;
    }
    if (a.isZero()) return b.isZero() ? 0 : (b.m > 0 ? -1 : 1);
    if (b.isZero()) return a.m > 0 ? 1 : -1;
    if (a.m > 0 && b.m < 0) return 1;
    if (a.m < 0 && b.m > 0) return -1;
    var sign = a.m > 0 ? 1 : -1;
    if (a.e !== b.e) return (a.e > b.e ? 1 : -1) * sign;
    if (a.m === b.m) return 0;
    return (a.m > b.m ? 1 : -1) * sign;
  }

  BigNumber.prototype.isZero = function () {
    return this.m === 0;
  };

  BigNumber.prototype.isInfinite = function () {
    return !isFinite(this.m);
  };

  BigNumber.prototype.isFinite = function () {
    return isFinite(this.m);
  };

  BigNumber.prototype.neg = function () {
    return normalize(-this.m, this.e);
  };

  BigNumber.prototype.add = function (other) {
    return add(this, other);
  };

  BigNumber.prototype.sub = function (other) {
    return add(this, from(other).neg());
  };

  BigNumber.prototype.mul = function (other) {
    var b = from(other);
    if (this.isZero() || b.isZero()) return ZERO;
    if (!this.isFinite() || !b.isFinite()) {
      return normalize(this.m * b.m, 0);
    }
    return normalize(this.m * b.m, this.e + b.e);
  };

  BigNumber.prototype.div = function (other) {
    var b = from(other);
    if (b.isZero()) return this.isZero() ? ZERO : (this.m > 0 ? INFINITY : NEG_INFINITY);
    if (this.isZero()) return ZERO;
    if (!this.isFinite() || !b.isFinite()) return normalize(this.m / b.m, 0);
    return normalize(this.m / b.m, this.e - b.e);
  };

  BigNumber.prototype.powInt = function (n) {
    n = Math.floor(Number(n));
    if (!isFinite(n) || n <= 0) return ONE;
    if (n > 10000000) n = 10000000;
    var result = ONE;
    var base = this;
    while (n > 0) {
      if (n % 2 === 1) result = result.mul(base);
      n = Math.floor(n / 2);
      if (n > 0) base = base.mul(base);
    }
    return result;
  };

  BigNumber.prototype.ceil = function () {
    if (!this.isFinite() || this.isZero() || this.e > 15) return this;
    return from(Math.ceil(this.m * Math.pow(10, this.e)));
  };

  BigNumber.prototype.cmp = function (other) {
    return cmp(this, other);
  };

  BigNumber.prototype.eq = function (other) {
    return this.cmp(other) === 0;
  };
  BigNumber.prototype.gt = function (other) {
    return this.cmp(other) > 0;
  };
  BigNumber.prototype.gte = function (other) {
    return this.cmp(other) >= 0;
  };
  BigNumber.prototype.lt = function (other) {
    return this.cmp(other) < 0;
  };
  BigNumber.prototype.lte = function (other) {
    return this.cmp(other) <= 0;
  };

  BigNumber.prototype.toNumber = function () {
    return this.m * Math.pow(10, this.e);
  };

  BigNumber.prototype.toScientific = function (digits) {
    if (this.isZero()) return "0";
    if (this.isInfinite()) return this.m > 0 ? "Infinity" : "-Infinity";
    var fixed = digits == null ? 6 : Math.max(0, Math.min(15, Math.floor(digits)));
    var e = this.e;
    var text = this.m.toFixed(fixed);
    if (Math.abs(Number(text)) >= 10) {
      text = (Number(text) / 10).toFixed(fixed);
      e += 1;
    }
    if (fixed > 0) text = text.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    return text + "e" + e;
  };

  BigNumber.prototype.toString = function () {
    if (!this.isFinite() || this.e < -6 || this.e >= 9) return this.toScientific();
    return String(Number(this.toNumber().toPrecision(15)));
  };

  var ZERO = new BigNumber(0, 0);
  var ONE = new BigNumber(1, 0);
  var INFINITY = new BigNumber(Infinity, 0);
  var NEG_INFINITY = new BigNumber(-Infinity, 0);

  BigNumber.from = from;
  BigNumber.ZERO = ZERO;
  BigNumber.ONE = ONE;

  global.LMTLBigNumber = BigNumber;
  if (!global.BigNumber) global.BigNumber = BigNumber;
})(window);
