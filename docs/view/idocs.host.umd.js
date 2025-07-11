(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vega"), require("vega-lite")) : typeof define === "function" && define.amd ? define(["exports", "vega", "vega-lite"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.IDocs = global.IDocs || {}, global.IDocs.host = {}), global.vega, global.vegaLite));
})(this, function(exports2, vega, vegaLite) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const u = (e, t) => {
    t && e.forEach(([s, n]) => {
      switch (s) {
        case "class":
          t.attrJoin("class", n);
          break;
        case "css-module":
          t.attrJoin("css-module", n);
          break;
        default:
          t.attrPush([s, n]);
      }
    });
  }, _ = ".", x = "#", v = /[^\t\n\f />"'=]/, O = " ", E = "=", d = (e, t, { left: s, right: n, allowed: o }) => {
    let i = "", l = "", r = true, c = false;
    const f = [];
    for (let h = t + s.length; h < e.length; h++) {
      if (e.slice(h, h + n.length) === n) {
        i !== "" && f.push([i, l]);
        break;
      }
      const a = e.charAt(h);
      if (a === E && r) {
        r = false;
        continue;
      }
      if (a === _ && i === "") {
        e.charAt(h + 1) === _ ? (i = "css-module", h++) : i = "class", r = false;
        continue;
      }
      if (a === x && i === "") {
        i = "id", r = false;
        continue;
      }
      if (a === '"' && l === "" && !c) {
        c = true;
        continue;
      }
      if (a === '"' && c) {
        c = false;
        continue;
      }
      if (a === O && !c) {
        if (i === "") continue;
        f.push([i, l]), i = "", l = "", r = true;
        continue;
      }
      if (!(r && a.search(v) === -1)) {
        if (r) {
          i += a;
          continue;
        }
        l += a;
      }
    }
    return o.length ? f.filter(([h]) => o.some((a) => a instanceof RegExp ? a.test(h) : a === h)) : f;
  }, y = ({ left: e, right: t }, s) => {
    if (!["start", "end", "only"].includes(s)) throw new Error(`Invalid 'where' parameter: ${s}. Expected 'start', 'end', or 'only'.`);
    return (n) => {
      const o = e.length, i = t.length, l = o + 1 + i, r = o + 1;
      if (!n || typeof n != "string" || n.length < l) return false;
      const c = (p) => [_, x].includes(p.charAt(o)) ? p.length >= l + 1 : p.length >= l;
      let f, h, a, m;
      return s === "start" ? (a = n.slice(0, o), f = a === e ? 0 : -1, h = f === -1 ? -1 : n.indexOf(t, r), m = n.charAt(h + i), m && t.includes(m) && (h = -1)) : s === "end" ? (f = n.lastIndexOf(e), h = f === -1 ? -1 : n.indexOf(t, f + r), h = h === n.length - i ? h : -1) : (a = n.slice(0, o), f = a === e ? 0 : -1, a = n.slice(n.length - i), h = a === t ? n.length - i : -1), f !== -1 && h !== -1 && c(n.substring(f, h + i));
    };
  }, g = (e, t) => {
    const s = e[t];
    if (s.type === "softbreak") return null;
    if (s.nesting === 0) return s;
    const n = s.level, o = s.type.replace("_close", "_open");
    for (; t >= 0; ) {
      const i = e[t];
      if (i.type === o && i.level === n) return i;
      t--;
    }
    /* istanbul ignore next -- @preserve */
    return null;
  }, b = (e) => e.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), w = (e, t, s) => {
    const n = b(t), o = b(s), i = e.search(new RegExp(`[ \\n]?${n}[^${n}${o}]+${o}$`));
    return i !== -1 ? e.slice(0, i) : e;
  }, $ = (e, t) => t >= 0 ? e[t] : e[e.length + t], C = (e) => Array.isArray(e) && !!e.length && e.every((t) => typeof t == "function"), I = (e) => Array.isArray(e) && !!e.length && e.every((t) => typeof t == "object"), k = (e, t, s) => {
    var _a, _b;
    const n = { match: false, position: null }, o = s.shift !== void 0 ? t + s.shift : s.position;
    if (s.shift !== void 0 && o < 0) return n;
    const i = $(e, o);
    if (!i) return n;
    for (const l of Object.keys(s)) {
      if (l === "shift" || l === "position") continue;
      if (i[l] === void 0) return n;
      if (l === "children" && I(s.children)) {
        if (((_a = i.children) == null ? void 0 : _a.length) === 0) return n;
        let c;
        const f = s.children, h = i.children;
        if (f.every((a) => a.position !== void 0)) {
          if (c = f.every((a) => k(h, a.position, a).match), c) {
            const a = ((_b = f[f.length - 1]) == null ? void 0 : _b.position) ?? 0;
            n.position = a >= 0 ? a : h.length + a;
          }
        } else for (let a = 0; a < h.length; a++) if (c = f.every((m) => k(h, a, m).match), c) {
          n.position = a;
          break;
        }
        if (c === false) return n;
        continue;
      }
      const r = s[l];
      switch (typeof r) {
        case "boolean":
        case "number":
        case "string": {
          if (i[l] !== r) return n;
          break;
        }
        case "function": {
          if (!r(i[l])) return n;
          break;
        }
        default: {
          if (C(r)) {
            if (!r.every((c) => c(i[l]))) return n;
            break;
          }
          throw new Error(`Unknown type of pattern test (key: ${l}). Test should be of type boolean, number, string, function or array of functions.`);
        }
      }
    }
    return n.match = true, n;
  }, S = (e) => ({ name: "end of block", tests: [{ shift: 0, type: "inline", children: [{ position: -1, content: y(e, "end"), type: (t) => t !== "code_inline" && t !== "math_inline" }] }], transform: (t, s, n) => {
    const o = t[s].children[n], { content: i } = o, l = i.lastIndexOf(e.left), r = d(i, l, e);
    let c = s + 1;
    for (; t[c + 1] && t[c + 1].nesting === -1; ) c++;
    const f = g(t, c);
    u(r, f);
    const h = i.slice(0, l), a = h[h.length - 1] === " ";
    o.content = a ? h.slice(0, -1) : h;
  } }), T = (e) => ({ name: "code-block", tests: [{ shift: 0, block: true, info: y(e, "end") }], transform: (t, s) => {
    const n = t[s];
    let o = "";
    const i = /{(?:[\d,-]+)}/.exec(n.info);
    i && (n.info = n.info.replace(i[0], ""), o = i[0]);
    const l = n.info.lastIndexOf(e.left), r = d(n.info, l, e);
    u(r, n);
    const c = w(n.info, e.left, e.right);
    n.info = `${c} ${o}`.trim();
  } }), D = (e) => [{ name: "inline nesting self-close", tests: [{ shift: 0, type: "inline", children: [{ shift: -1, type: (t) => t === "image" || t === "code_inline" }, { shift: 0, type: "text", content: y(e, "start") }] }], transform: (t, s, n) => {
    const o = e.right.length, i = t[s].children[n], l = i.content.indexOf(e.right), r = t[s].children[n - 1], c = d(i.content, 0, e);
    u(c, r), i.content.length === l + o ? t[s].children.splice(n, 1) : i.content = i.content.slice(l + o);
  } }, { name: "inline attributes", tests: [{ shift: 0, type: "inline", children: [{ shift: -1, nesting: -1 }, { shift: 0, type: "text", content: y(e, "start") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], { content: i } = o, l = d(i, 0, e), r = g(t[s].children, n - 1);
    u(l, r);
    const c = i.indexOf(e.right) + e.right.length;
    o.content = i.slice(c);
  } }], K = (e) => [{ name: "list softbreak", tests: [{ shift: -2, type: "list_item_open" }, { shift: 0, type: "inline", children: [{ position: -2, type: "softbreak" }, { position: -1, type: "text", content: y(e, "only") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], i = d(o.content, 0, e);
    let l = s - 2;
    for (; t[l - 1] && t[l - 1].type !== "ordered_list_open" && t[l - 1].type !== "bullet_list_open"; ) l--;
    u(i, t[l - 1]), t[s].children = t[s].children.slice(0, -2);
  } }, { name: "list double softbreak", tests: [{ shift: 0, type: (t) => t === "bullet_list_close" || t === "ordered_list_close" }, { shift: 1, type: "paragraph_open" }, { shift: 2, type: "inline", content: y(e, "only"), children: (t) => t.length === 1 }, { shift: 3, type: "paragraph_close" }], transform: (t, s) => {
    const n = t[s + 2], o = d(n.content, 0, e), i = g(t, s);
    u(o, i), t.splice(s + 1, 3);
  } }, { name: "list item end", tests: [{ shift: -2, type: "list_item_open" }, { shift: 0, type: "inline", children: [{ position: -1, type: "text", content: y(e, "end") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], { content: i } = o, l = i.lastIndexOf(e.left), r = d(i, l, e);
    u(r, t[s - 2]);
    const c = i.slice(0, l), f = c[c.length - 1] === " ";
    o.content = f ? c.slice(0, -1) : c;
  } }], L = (e) => ({ name: `
{.a} softbreak then curly in start`, tests: [{ shift: 0, type: "inline", children: [{ position: -2, type: "softbreak" }, { position: -1, type: "text", content: y(e, "only") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], i = d(o.content, 0, e);
    let l = s + 1;
    for (; t[l + 1] && t[l + 1].nesting === -1; ) l++;
    const r = g(t, l);
    u(i, r), t[s].children = t[s].children.slice(0, -2);
  } }), M = (e) => ({ name: "horizontal rule", tests: [{ shift: 0, type: "paragraph_open" }, { shift: 1, type: "inline", children: (t) => t.length === 1, content: (t) => new RegExp(`^ {0,3}[-*_]{3,} ?${b(e.left)}[^${b(e.right)}]`).test(t) }, { shift: 2, type: "paragraph_close" }], transform: (t, s) => {
    const n = t[s];
    n.type = "hr", n.tag = "hr", n.nesting = 0;
    const o = t[s + 1], { content: i } = o, l = i.lastIndexOf(e.left), r = d(i, l, e);
    u(r, n), n.markup = i, t.splice(s + 1, 2);
  } }), A = (e) => {
    var _a;
    e.hidden = true, (_a = e.children) == null ? void 0 : _a.forEach((t) => {
      t.content = "", A(t);
    });
  }, P = (e, t, s, n, o, i) => {
    let l = n - (o > 0 ? o : 1);
    for (let r = t, c = i; r < s && c > 1; r++) if (e[r].type === "tr_open") {
      const f = e[r];
      f.meta ?? (f.meta = {}), f.meta.columnCount && (l -= 1), f.meta.columnCount = l, c--;
    }
  }, j = (e, t, s) => {
    var _a;
    const n = (_a = e[t].meta) == null ? void 0 : _a.columnCount;
    if (n) for (let o = t, i = 0; o < s; o++) {
      const l = e[o];
      if (l.type === "td_open") i += 1;
      else if (l.type === "tr_close") break;
      i > n && !l.hidden && A(l);
    }
  }, N = (e, t, s, n, o, i) => {
    var _a;
    const l = [], r = e[t];
    let c = t + 3, f = n;
    for (let p = t; p > i; p--) if (e[p].type === "tr_open") {
      f = ((_a = e[p].meta) == null ? void 0 : _a.columnCount) ?? f;
      break;
    } else e[p].type === "td_open" && l.unshift(p);
    for (let p = t + 2; p < s; p++) if (e[p].type === "tr_close") {
      c = p;
      break;
    } else e[p].type === "td_open" && l.push(p);
    const h = l.indexOf(t), a = Math.min(o, f - h);
    o > a && r.attrSet("colspan", a.toString());
    const m = l.slice(f + 1 - n - a)[0];
    for (let p = m; p < c; p++) e[p].hidden || A(e[p]);
  }, B = (e) => [{ name: "table", tests: [{ shift: 0, type: "table_close" }, { shift: 1, type: "paragraph_open" }, { shift: 2, type: "inline", content: y(e, "only") }], transform: (t, s) => {
    const n = t[s + 2], o = g(t, s), i = d(n.content, 0, e);
    u(i, o), t.splice(s + 1, 3);
  } }, { name: "table cell attributes", tests: [{ shift: -1, type: (t) => t === "td_open" || t === "th_open" }, { shift: 0, type: "inline", children: [{ shift: 0, type: "text", content: y(e, "end") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], i = t[s - 1], { content: l } = o, r = l.lastIndexOf(e.left), c = d(l, r, e);
    u(c, i), o.content = l.substring(0, r).trim();
  } }, { name: "table thead metadata", tests: [{ shift: 0, type: "tr_close" }, { shift: 1, type: "thead_close" }, { shift: 2, type: "tbody_open" }], transform: (t, s) => {
    const n = g(t, s), o = t[s - 1];
    let i = 0, l = s - 1;
    for (; l > 0; ) {
      const c = t[l];
      if (c === n) {
        const f = t[l - 1];
        f.meta = { ...f.meta, columnCount: i };
        break;
      }
      c.level === o.level && c.type === o.type && i++, l--;
    }
    const r = t[s + 2];
    r.meta = { ...r.meta, columnCount: i };
  } }, { name: "table tbody calculate", tests: [{ shift: 0, type: "tbody_close", hidden: false }], transform: (t, s) => {
    var _a;
    let n = s - 2;
    for (; n > 0 && (n--, t[n].type !== "tbody_open"); ) ;
    const o = Number(((_a = t[n].meta) == null ? void 0 : _a.columnCount) ?? 0);
    if (o < 2) return;
    const i = t[s].level + 2;
    for (let l = n; l < s; l++) {
      if (t[l].level > i) continue;
      const r = t[l], c = r.hidden ? 0 : Number(r.attrGet("rowspan")), f = r.hidden ? 0 : Number(r.attrGet("colspan"));
      c > 1 && P(t, l, s, o, f, c), r.type === "tr_open" && j(t, l, s), f > 1 && N(t, l, s, o, f, n);
    }
  } }], R$1 = ["fence", "inline", "table", "list", "hr", "softbreak", "block"], F = (e) => {
    const t = e.rule === false ? [] : Array.isArray(e.rule) ? e.rule.filter((n) => R$1.includes(n)) : R$1, s = [];
    return t.includes("fence") && s.push(T(e)), t.includes("inline") && s.push(...D(e)), t.includes("table") && s.push(...B(e)), t.includes("list") && s.push(...K(e)), t.includes("softbreak") && s.push(L(e)), t.includes("hr") && s.push(M(e)), t.includes("block") && s.push(S(e)), s;
  }, G = (e, { left: t = "{", right: s = "}", allowed: n = [], rule: o = "all" } = {}) => {
    const i = F({ left: t, right: s, allowed: n, rule: o }), l = ({ tokens: r }) => {
      for (let c = 0; c < r.length; c++) for (let f = 0; f < i.length; f++) {
        const h = i[f];
        let a = null;
        h.tests.every((m) => {
          const p = k(r, c, m);
          return p.position !== null && ({ position: a } = p), p.match;
        }) && (h.transform(r, c, a), (h.name === "inline attributes" || h.name === "inline nesting self-close") && f--);
      }
    };
    e.core.ruler.before("linkify", "attrs", l);
  };
  const R = (p, u2) => {
    if (typeof u2 != "object" || !u2.name) throw new Error("[@mdit/plugin-container]: 'name' option is required.");
    const { name: c, marker: l = ":", validate: $2 = (e) => e.trim().split(" ", 2)[0] === c, openRender: g2 = (e, t, n, k2, o) => (e[t].attrJoin("class", c), o.renderToken(e, t, n)), closeRender: C2 = (e, t, n, k2, o) => o.renderToken(e, t, n) } = u2, m = l[0], i = l.length, I2 = (e, t, n, k2) => {
      const o = e.bMarks[t] + e.tShift[t], h = e.eMarks[t], d2 = e.sCount[t];
      if (m !== e.src[o]) return false;
      let r = o + 1;
      for (; r <= h && l[(r - o) % i] === e.src[r]; ) r++;
      const M2 = Math.floor((r - o) / i);
      if (M2 < 3) return false;
      r -= (r - o) % i;
      const _2 = e.src.slice(o, r), T2 = e.src.slice(r, h);
      if (!$2(T2, _2)) return false;
      if (k2) return true;
      let s = t + 1, x2 = false;
      for (; s < n; s++) {
        const a = e.bMarks[s] + e.tShift[s], b2 = e.eMarks[s];
        if (a < b2 && e.sCount[s] < d2) break;
        if (e.sCount[s] === d2 && m === e.src[a]) {
          for (r = a + 1; r <= b2 && l[(r - a) % i] === e.src[r]; r++) ;
          if (Math.floor((r - a) / i) >= M2 && (r -= (r - a) % i, r = e.skipSpaces(r), r >= b2)) {
            x2 = true;
            break;
          }
        }
      }
      const S2 = e.parentType, v2 = e.lineMax, w2 = e.blkIndent;
      e.parentType = "container", e.lineMax = s, e.blkIndent = d2;
      const f = e.push(`container_${c}_open`, "div", 1);
      f.markup = _2, f.block = true, f.info = T2, f.map = [t, s], e.md.block.tokenize(e, t + 1, s);
      const y2 = e.push(`container_${c}_close`, "div", -1);
      return y2.markup = e.src.slice(o, r), y2.block = true, e.parentType = S2, e.lineMax = v2, e.blkIndent = w2, e.line = s + (x2 ? 1 : 0), true;
    };
    p.block.ruler.before("fence", `container_${c}`, I2, { alt: ["paragraph", "reference", "blockquote", "list"] }), p.renderer.rules[`container_${c}_open`] = g2, p.renderer.rules[`container_${c}_close`] = C2;
  };
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  const plugins = [];
  function registerMarkdownPlugin(plugin) {
    plugins.push(plugin);
    return "register";
  }
  function create(options) {
    var _a;
    const md = new markdownit();
    for (const plugin of plugins) {
      plugin.initializePlugin(md);
    }
    md.use(G);
    (_a = options == null ? void 0 : options.classList) == null ? void 0 : _a.forEach((name) => {
      const containerOptions = { name };
      md.use(R, containerOptions);
    });
    const originalFence = md.renderer.rules.fence;
    md.renderer.rules.fence = function(tokens, idx, options2, env, slf) {
      const token = tokens[idx];
      const info = token.info.trim();
      if (info.startsWith("json ")) {
        const pluginName = info.slice(5).trim();
        const plugin = plugins.find((p) => p.name === pluginName);
        if (plugin && plugin.fence) {
          return plugin.fence(token, idx);
        }
      }
      if (originalFence) {
        return originalFence(tokens, idx, options2, env, slf);
      } else {
        return "";
      }
    };
    return md;
  }
  function definePlugin(md, pluginName) {
    md.block.ruler.before("fence", `${pluginName}_block`, function(state, startLine, endLine) {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const marker = `json ${pluginName}`;
      if (!state.src.slice(start, max).trim().startsWith("```" + marker)) {
        return false;
      }
      let nextLine = startLine;
      while (nextLine < endLine) {
        nextLine++;
        if (state.src.slice(state.bMarks[nextLine] + state.tShift[nextLine], state.eMarks[nextLine]).trim() === "```") {
          break;
        }
      }
      state.line = nextLine + 1;
      const token = state.push("fence", "code", 0);
      token.info = marker;
      token.content = state.getLines(startLine + 1, nextLine, state.blkIndent, true);
      token.map = [startLine, state.line];
      return true;
    });
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  var LogLevel;
  (function(LogLevel2) {
    LogLevel2[LogLevel2["none"] = 0] = "none";
    LogLevel2[LogLevel2["some"] = 1] = "some";
    LogLevel2[LogLevel2["all"] = 2] = "all";
  })(LogLevel || (LogLevel = {}));
  class SignalBus {
    constructor(dataSignalPrefix) {
      __publicField(this, "dataSignalPrefix");
      __publicField(this, "broadcastingStack");
      __publicField(this, "logLevel");
      __publicField(this, "logWatchIds");
      __publicField(this, "active");
      __publicField(this, "peers");
      __publicField(this, "signalDeps");
      __publicField(this, "peerDependencies");
      this.dataSignalPrefix = dataSignalPrefix;
      this.logLevel = LogLevel.none;
      this.logWatchIds = [];
      this.reset();
    }
    log(id, message, ...optionalParams) {
      if (this.logLevel === LogLevel.none)
        return;
      if (this.logWatchIds.length > 0 && !this.logWatchIds.includes(id))
        return;
      console.log(`[Signal Bus][${id}] ${message}`, ...optionalParams);
    }
    async broadcast(originId, batch) {
      if (this.broadcastingStack.includes(originId)) {
        this.log(originId, "Additional broadcast from", originId, this.broadcastingStack.join(" -> "));
      }
      this.log(originId, "Broadcasting batch from", originId, batch);
      this.broadcastingStack.push(originId);
      for (const peerId of this.peerDependencies[originId]) {
        const peer = this.peers.find((p) => p.id === peerId);
        if (!peer)
          continue;
        const peerBatch = {};
        let hasBatch = false;
        for (const signalName in batch) {
          if (peer.initialSignals.some((s) => s.name === signalName) && batch[signalName].value !== this.signalDeps[signalName].value) {
            peerBatch[signalName] = batch[signalName];
            hasBatch = true;
          }
        }
        if (!hasBatch)
          continue;
        peer.recieveBatch && await peer.recieveBatch(peerBatch, originId);
      }
      this.broadcastingStack.pop();
      for (const signalName in batch) {
        const signalDep = this.signalDeps[signalName];
        signalDep.value = batch[signalName].value;
      }
      if (this.broadcastingStack.length === 0) {
        for (const peer of this.peers) {
          peer.broadcastComplete && await peer.broadcastComplete();
        }
      }
    }
    getPriorityPeer(signalName) {
      const signalDep = this.signalDeps[signalName];
      if (!signalDep)
        return null;
      return this.peers.find((p) => p.id === signalDep.initialPriorityId);
    }
    registerPeer(peer) {
      this.peers.push(peer);
      for (const initialSignal of peer.initialSignals) {
        if (!(initialSignal.name in this.signalDeps)) {
          this.signalDeps[initialSignal.name] = {
            deps: [peer],
            priority: initialSignal.priority,
            initialPriorityId: peer.id,
            value: initialSignal.value,
            isData: initialSignal.isData
          };
        } else {
          const signalDep = this.signalDeps[initialSignal.name];
          if (!signalDep.deps.includes(peer)) {
            signalDep.deps.push(peer);
          }
          if (initialSignal.priority > signalDep.priority) {
            signalDep.priority = initialSignal.priority;
            signalDep.initialPriorityId = peer.id;
            signalDep.value = initialSignal.value;
            signalDep.isData = initialSignal.isData;
          }
        }
      }
    }
    beginListening() {
      this.log("beginListening", "begin initial batch", this.signalDeps);
      for (const peer of this.peers) {
        const batch = {};
        for (const signalName in this.signalDeps) {
          const signalDep = this.signalDeps[signalName];
          const { value, isData } = signalDep;
          batch[signalName] = { value, isData };
        }
        peer.recieveBatch && peer.recieveBatch(batch, "initial");
      }
      this.log("beginListening", "end initial batch");
      const peerSignals = {};
      for (const signalName in this.signalDeps) {
        const signalDep = this.signalDeps[signalName];
        if (signalDep.deps.length === 1)
          continue;
        for (const peer of signalDep.deps) {
          if (!(peer.id in peerSignals)) {
            peerSignals[peer.id] = [];
            this.peerDependencies[peer.id] = [];
          }
          peerSignals[peer.id].push({ signalName, isData: signalDep.isData });
          for (const otherPeer of signalDep.deps) {
            if (otherPeer.id !== peer.id && !this.peerDependencies[peer.id].includes(otherPeer.id)) {
              this.peerDependencies[peer.id].push(otherPeer.id);
            }
          }
        }
      }
      this.log("beginListening", "======= dependencies =========", peerSignals, this.peerDependencies);
      for (const peer of this.peers) {
        const sharedSignals = peerSignals[peer.id];
        if (sharedSignals) {
          this.log(peer.id, "Shared signals:", sharedSignals);
          if (this.peerDependencies[peer.id]) {
            this.log(peer.id, "Shared dependencies:", this.peerDependencies[peer.id]);
          }
          peer.beginListening && peer.beginListening(sharedSignals);
        } else {
          this.log(peer.id, "No shared signals");
        }
      }
      this.active = true;
    }
    reset() {
      this.signalDeps = {};
      this.active = false;
      this.peers = [];
      this.broadcastingStack = [];
      this.peerDependencies = {};
    }
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  const defaultRendererOptions = {
    vegaRenderer: "canvas",
    dataNameSelectedSuffix: "_selected",
    dataSignalPrefix: "data-signal:",
    classList: ["markdown-block"]
  };
  class Renderer {
    constructor(element, options) {
      __publicField(this, "element");
      __publicField(this, "md");
      __publicField(this, "instances");
      __publicField(this, "signalBus");
      __publicField(this, "options");
      this.element = element;
      this.options = { ...defaultRendererOptions, ...options };
      this.md = create({ classList: this.options.classList });
      this.signalBus = this.options.signalBus || new SignalBus(this.options.dataSignalPrefix);
      this.instances = {};
    }
    async render(markdown, errorHandler) {
      if (!errorHandler) {
        errorHandler = (error, pluginName, instanceIndex, phase) => {
          console.error(`Error in plugin ${pluginName} instance ${instanceIndex} phase ${phase}`, error);
        };
      }
      await this.destroy();
      const parsedHTML = this.md.render(markdown);
      this.element.innerHTML = parsedHTML;
      this.signalBus.log("Renderer", "rendering DOM");
      const hydrationPromises = [];
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (plugin.hydrateComponent) {
          hydrationPromises.push(plugin.hydrateComponent(this, errorHandler).then((instances) => {
            return {
              pluginName: plugin.name,
              instances
            };
          }));
        }
      }
      try {
        const pluginHydrations = await Promise.all(hydrationPromises);
        for (const hydration of pluginHydrations) {
          if (hydration && hydration.instances) {
            this.instances[hydration.pluginName] = hydration.instances;
            for (const instance of hydration.instances) {
              this.signalBus.registerPeer(instance);
            }
          }
        }
        this.signalBus.beginListening();
      } catch (error) {
        console.error("Error in rendering plugins", error);
      }
    }
    async destroy() {
      this.signalBus.reset();
      for (const pluginName of Object.keys(this.instances)) {
        const instances = this.instances[pluginName];
        for (const instance of instances) {
          instance.destroy && await instance.destroy();
        }
      }
      this.instances = {};
    }
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  function sanitizedHTML(tagName, attributes, content) {
    const element = document.createElement(tagName);
    Object.keys(attributes).forEach((key) => {
      element.setAttribute(key, attributes[key]);
    });
    element.textContent = content;
    return element.outerHTML;
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  const dropdownPlugin = {
    name: "dropdown",
    initializePlugin: (md) => definePlugin(md, "dropdown"),
    fence: (token, idx) => {
      const DropdownId = `Dropdown-${idx}`;
      return sanitizedHTML("div", { id: DropdownId, class: "dropdown" }, token.content.trim());
    },
    hydrateComponent: async (renderer, errorHandler) => {
      const dropdownInstances = [];
      const containers = renderer.element.querySelectorAll(".dropdown");
      for (const [index2, container] of Array.from(containers).entries()) {
        if (!container.textContent)
          continue;
        try {
          const spec = JSON.parse(container.textContent);
          const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.name}</span>
                            <select class="vega-bind-select" id="${spec.name}" name="${spec.name}" ${spec.multiple ? "multiple" : ""} size="${spec.size || 1}">
${getOptions(spec.multiple ?? false, spec.options ?? [], spec.value ?? (spec.multiple ? [] : ""))}
                            </select>
                        </label>
                    </div>
                </form>`;
          container.innerHTML = html;
          const element = container.querySelector("select");
          const dropdownInstance = { id: container.id, spec, element };
          dropdownInstances.push(dropdownInstance);
        } catch (e) {
          container.innerHTML = `<div class="error">${e.toString()}</div>`;
          errorHandler(e, "Dropdown", index2, "parse", container);
          continue;
        }
      }
      const instances = dropdownInstances.map((dropdownInstance, index2) => {
        const { element, spec } = dropdownInstance;
        const initialSignals = [{
          name: spec.name,
          value: spec.value || null,
          priority: 1,
          isData: false
        }];
        if (spec.dynamicOptions) {
          initialSignals.push({
            name: spec.dynamicOptions.dataSignalName,
            value: null,
            priority: -1,
            isData: true
          });
        }
        return {
          ...dropdownInstance,
          initialSignals,
          recieveBatch: async (batch) => {
            var _a, _b;
            const { dynamicOptions } = spec;
            if (dynamicOptions == null ? void 0 : dynamicOptions.dataSignalName) {
              const newData = (_a = batch[dynamicOptions.dataSignalName]) == null ? void 0 : _a.value;
              if (newData) {
                let hasFieldName = false;
                const uniqueOptions = /* @__PURE__ */ new Set();
                newData.forEach((d2) => {
                  if (d2.hasOwnProperty(dynamicOptions.fieldName)) {
                    hasFieldName = true;
                    uniqueOptions.add(d2[dynamicOptions.fieldName]);
                  }
                });
                if (hasFieldName) {
                  const options = Array.from(uniqueOptions);
                  const existingSelection = spec.multiple ? Array.from(element.selectedOptions).map((option) => option.value) : element.value;
                  element.innerHTML = getOptions(spec.multiple ?? false, options, existingSelection);
                  if (!spec.multiple) {
                    element.value = ((_b = batch[spec.name]) == null ? void 0 : _b.value) || options[0];
                  }
                } else {
                  element.innerHTML = `<option value="">Field "${dynamicOptions.fieldName}" not found</option>`;
                  element.value = "";
                }
              }
            }
            if (batch[spec.name]) {
              const value = batch[spec.name].value;
              if (spec.multiple) {
                Array.from(element.options).forEach((option) => {
                  option.selected = !!(value && Array.isArray(value) && value.includes(option.value));
                });
              } else {
                element.value = value;
              }
            }
          },
          beginListening() {
            element.addEventListener("change", (e) => {
              const value = spec.multiple ? Array.from(e.target.selectedOptions).map((option) => option.value) : e.target.value;
              const batch = {
                [spec.name]: {
                  value,
                  isData: false
                }
              };
              renderer.signalBus.broadcast(dropdownInstance.id, batch);
            });
          },
          getCurrentSignalValue: () => {
            if (spec.multiple) {
              return Array.from(element.selectedOptions).map((option) => option.value);
            }
            return element.value;
          },
          destroy: async () => {
            element.removeEventListener("change", dropdownInstance.element.onchange);
          }
        };
      });
      return instances;
    }
  };
  function getOptions(multiple, options, selected) {
    if (!options) {
      if (multiple) {
        if (Array.isArray(selected)) {
          options = selected;
        } else {
          if (selected) {
            options = [selected];
          }
        }
      } else {
        if (selected) {
          options = [selected];
        }
      }
    }
    if (!options) {
      return "";
    }
    return options.map((option) => {
      let attr = "";
      if (multiple) {
        attr = (selected || []).includes(option) ? "selected" : "";
      } else {
        attr = selected === option ? "selected" : "";
      }
      return `<option value="${option}" ${attr}>${option}</option>`;
    }).join("\n");
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  var ImageOpacity;
  (function(ImageOpacity2) {
    ImageOpacity2["full"] = "1";
    ImageOpacity2["loading"] = "0.1";
    ImageOpacity2["error"] = "0.5";
  })(ImageOpacity || (ImageOpacity = {}));
  const imagePlugin = {
    name: "image",
    initializePlugin: (md) => definePlugin(md, "image"),
    fence: (token, idx) => {
      const ImageId = `Image-${idx}`;
      return sanitizedHTML("div", { id: ImageId, class: "image" }, token.content.trim());
    },
    hydrateComponent: async (renderer, errorHandler) => {
      const imageInstances = [];
      const containers = renderer.element.querySelectorAll(".image");
      for (const [index2, container] of Array.from(containers).entries()) {
        if (!container.textContent)
          continue;
        try {
          const spec = JSON.parse(container.textContent);
          const element = document.createElement("img");
          const spinner = document.createElement("div");
          spinner.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="gray" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="0">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                        </circle>
                    </svg>`;
          if (spec.alt)
            element.alt = spec.alt;
          if (spec.width)
            element.width = spec.width;
          if (spec.height)
            element.height = spec.height;
          element.onload = () => {
            spinner.style.display = "none";
            element.style.opacity = ImageOpacity.full;
          };
          element.onerror = () => {
            spinner.style.display = "none";
            element.style.opacity = ImageOpacity.error;
            errorHandler(new Error("Image failed to load"), "image", index2, "load", container, element.src);
          };
          container.style.position = "relative";
          spinner.style.position = "absolute";
          container.innerHTML = "";
          container.appendChild(spinner);
          container.appendChild(element);
          const imageInstance = { id: container.id, spec, element, spinner };
          imageInstances.push(imageInstance);
        } catch (e) {
          container.innerHTML = `<div class="error">${e.toString()}</div>`;
          errorHandler(e, "Image", index2, "parse", container);
        }
      }
      const instances = imageInstances.map((imageInstance, index2) => {
        const { element, spinner, id, spec } = imageInstance;
        return {
          id,
          initialSignals: [
            {
              name: spec.srcSignalName,
              value: null,
              priority: -1,
              isData: false
            }
          ],
          destroy: async () => {
            if (element) {
              element.remove();
            }
            if (spinner) {
              spinner.remove();
            }
          },
          recieveBatch: async (batch, from) => {
            if (spec.srcSignalName in batch) {
              const src = batch[spec.srcSignalName].value;
              if (src) {
                spinner.style.display = "";
                element.src = src.toString();
                element.style.opacity = ImageOpacity.loading;
              } else {
                element.src = "";
                spinner.style.display = "none";
                element.style.opacity = ImageOpacity.full;
              }
            }
          }
        };
      });
      return instances;
    }
  };
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  function createTemplateFunction(template) {
    const parts = template.split(/(%7B%7B.*?%7D%7D)/g).map((part) => {
      if (part.startsWith("%7B%7B") && part.endsWith("%7D%7D")) {
        const key = part.slice(6, -6);
        return (batch) => {
          var _a, _b;
          return ((_b = (_a = batch[key]) == null ? void 0 : _a.value) == null ? void 0 : _b.toString()) || "";
        };
      } else {
        return () => part;
      }
    });
    return (batch) => parts.map((fn) => fn(batch)).join("");
  }
  function handleDynamicUrl(tokens, idx, attrName, elementType) {
    const token = tokens[idx];
    const attrValue = token.attrGet(attrName);
    if (attrValue && attrValue.includes("%7B%7B")) {
      if (!token.attrs) {
        token.attrs = [];
      }
      token.attrSet("data-template-url", attrValue);
    }
    return token;
  }
  const placeholdersPlugin = {
    name: "placeholders",
    initializePlugin: async (md) => {
      md.use(function(md2) {
        md2.inline.ruler.after("emphasis", "dynamic_placeholder", function(state, silent) {
          let token;
          const max = state.posMax;
          const start = state.pos;
          if (state.src.charCodeAt(start) !== 123 || state.src.charCodeAt(start + 1) !== 123) {
            return false;
          }
          for (let pos = start + 2; pos < max; pos++) {
            if (state.src.charCodeAt(pos) === 125 && state.src.charCodeAt(pos + 1) === 125) {
              if (!silent) {
                state.pos = start + 2;
                state.posMax = pos;
                token = state.push("dynamic_placeholder", "", 0);
                token.markup = state.src.slice(start, pos + 2);
                token.content = state.src.slice(state.pos, state.posMax);
                state.pos = pos + 2;
                state.posMax = max;
              }
              return true;
            }
          }
          return false;
        });
        md2.renderer.rules["dynamic_placeholder"] = function(tokens, idx) {
          const key = tokens[idx].content.trim();
          return `<span class="dynamic-placeholder" data-key="${key}">{${key}}</span>`;
        };
      });
      md.renderer.rules["link_open"] = function(tokens, idx, options, env, slf) {
        handleDynamicUrl(tokens, idx, "href");
        return slf.renderToken(tokens, idx, options);
      };
      md.renderer.rules["image"] = function(tokens, idx, options, env, slf) {
        handleDynamicUrl(tokens, idx, "src");
        return slf.renderToken(tokens, idx, options);
      };
    },
    hydrateComponent: async (renderer) => {
      const templateFunctionMap = /* @__PURE__ */ new WeakMap();
      const placeholders = renderer.element.querySelectorAll(".dynamic-placeholder");
      const dynamicUrls = renderer.element.querySelectorAll("[data-template-url]");
      const elementsByKeys = /* @__PURE__ */ new Map();
      for (const placeholder of Array.from(placeholders)) {
        const key = placeholder.getAttribute("data-key");
        if (!key) {
          continue;
        }
        if (elementsByKeys.has(key)) {
          elementsByKeys.get(key).push(placeholder);
        } else {
          elementsByKeys.set(key, [placeholder]);
        }
      }
      for (const element of Array.from(dynamicUrls)) {
        const templateUrl = element.getAttribute("data-template-url");
        if (!templateUrl) {
          continue;
        }
        const keys = [];
        const regex = /%7B%7B(.*?)%7D%7D/g;
        let match;
        while ((match = regex.exec(templateUrl)) !== null) {
          keys.push(match[1]);
        }
        const templateFunction = createTemplateFunction(templateUrl);
        templateFunctionMap.set(element, { templateFunction, batch: {} });
        for (const key of keys) {
          if (elementsByKeys.has(key)) {
            elementsByKeys.get(key).push(element);
          } else {
            elementsByKeys.set(key, [element]);
          }
        }
      }
      const initialSignals = Array.from(elementsByKeys.keys()).map((name) => {
        const prioritizedSignal = {
          name,
          value: null,
          priority: -1,
          isData: false
        };
        return prioritizedSignal;
      });
      const instances = [
        {
          id: "placeholders",
          initialSignals,
          recieveBatch: async (batch) => {
            var _a;
            for (const key of Object.keys(batch)) {
              const elements = elementsByKeys.get(key) || [];
              for (const element of elements) {
                if (element.classList.contains("dynamic-placeholder")) {
                  const markdownContent = ((_a = batch[key].value) == null ? void 0 : _a.toString()) || "";
                  const parsedMarkdown = isMarkdownInline(markdownContent) ? renderer.md.renderInline(markdownContent) : renderer.md.render(markdownContent);
                  element.innerHTML = parsedMarkdown;
                } else if (element.hasAttribute("data-template-url")) {
                  const templateData = templateFunctionMap.get(element);
                  if (templateData) {
                    templateData.batch = { ...templateData.batch, ...batch };
                    const updatedUrl = templateData.templateFunction(templateData.batch);
                    if (element.tagName === "A") {
                      element.setAttribute("href", updatedUrl);
                    } else if (element.tagName === "IMG") {
                      element.setAttribute("src", updatedUrl);
                    }
                  }
                }
              }
            }
          }
        }
      ];
      return instances;
    }
  };
  function isMarkdownInline(markdown) {
    if (!markdown.includes("\n")) {
      return true;
    }
    const blockElements = ["#", "-", "*", ">", "```", "~~~"];
    for (const element of blockElements) {
      if (markdown.trim().startsWith(element)) {
        return false;
      }
    }
    return true;
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  const presetsPlugin = {
    name: "presets",
    initializePlugin: (md) => definePlugin(md, "presets"),
    fence: (token, idx) => {
      const spec = JSON.parse(token.content.trim());
      const pluginId = `preset-${idx}`;
      return sanitizedHTML("div", { id: pluginId, class: "presets" }, JSON.stringify(spec));
    },
    hydrateComponent: async (renderer, errorHandler) => {
      const presetsInstances = [];
      const containers = renderer.element.querySelectorAll(".presets");
      for (const [index2, container] of Array.from(containers).entries()) {
        if (!container.textContent)
          continue;
        const id = `presets${index2}`;
        let presets;
        try {
          presets = JSON.parse(container.textContent);
        } catch (e) {
          container.innerHTML = `<div class="error">${e.toString()}</div>`;
          errorHandler(e, "presets", index2, "parse", container);
          continue;
        }
        if (!Array.isArray(presets)) {
          container.innerHTML = '<div class="error">Expected an array of presets</div>';
          continue;
        }
        container.innerHTML = "";
        const ul = document.createElement("ul");
        const presetsInstance = { id, presets, element: ul };
        container.appendChild(ul);
        for (const preset of presets) {
          const li = document.createElement("li");
          if (!preset.name || !preset.state) {
            const span = document.createElement("span");
            span.className = "error";
            span.textContent = "Each preset must have a name and state";
            li.appendChild(span);
          } else {
            const button = document.createElement("button");
            button.textContent = preset.name;
            button.onclick = () => {
              const batch = {};
              for (const [signalName, value] of Object.entries(preset.state)) {
                batch[signalName] = { value, isData: false };
              }
              renderer.signalBus.broadcast(id, batch);
            };
            li.appendChild(button);
            li.appendChild(document.createTextNode(" "));
            if (preset.description) {
              button.title = preset.description;
            }
          }
          ul.appendChild(li);
        }
        presetsInstances.push(presetsInstance);
      }
      const instances = presetsInstances.map((presetsInstance, index2) => {
        const initialSignals = presetsInstance.presets.flatMap((preset) => {
          return Object.keys(preset.state).map((signalName) => {
            return {
              name: signalName,
              value: null,
              priority: -1,
              isData: void 0
              // we do not know if it is data or not
            };
          });
        });
        return {
          ...presetsInstance,
          initialSignals,
          broadcastComplete: async () => {
            const state = {};
            for (const signalName of Object.keys(renderer.signalBus.signalDeps)) {
              state[signalName] = renderer.signalBus.signalDeps[signalName].value;
            }
            setAllPresetsActiveState(presetsInstance, state);
          }
        };
      });
      return instances;
    }
  };
  function isPresetActive(preset, state) {
    for (const [signalName, value] of Object.entries(preset.state)) {
      if (state[signalName] !== value) {
        return false;
      }
    }
    return true;
  }
  function setAllPresetsActiveState(presetsInstance, state) {
    for (const [presetIndex, preset] of presetsInstance.presets.entries()) {
      const { classList } = presetsInstance.element.children[presetIndex];
      if (isPresetActive(preset, state)) {
        classList.add("active");
      } else {
        classList.remove("active");
      }
    }
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  const tabulatorPlugin = {
    name: "tabulator",
    initializePlugin: (md) => definePlugin(md, "tabulator"),
    fence: (token, idx) => {
      const tabulatorId = `tabulator-${idx}`;
      return sanitizedHTML("div", { id: tabulatorId, class: "tabulator", style: "box-sizing: border-box;" }, token.content.trim());
    },
    hydrateComponent: async (renderer, errorHandler) => {
      const tabulatorInstances = [];
      const containers = renderer.element.querySelectorAll(".tabulator");
      for (const [index2, container] of Array.from(containers).entries()) {
        if (!container.textContent)
          continue;
        if (!Tabulator) {
          errorHandler(new Error("Tabulator not found"), "tabulator", index2, "init", container);
          continue;
        }
        try {
          const spec = JSON.parse(container.textContent);
          let options = {
            autoColumns: true,
            layout: "fitColumns",
            maxHeight: "200px"
          };
          if (spec.options && Object.keys(spec.options).length > 0) {
            options = spec.options;
          }
          const table = new Tabulator(container, options);
          const tabulatorInstance = { id: container.id, spec, table, built: false };
          table.on("tableBuilt", () => {
            table.off("tableBuilt");
            tabulatorInstance.built = true;
          });
          tabulatorInstances.push(tabulatorInstance);
        } catch (e) {
          container.innerHTML = `<div class="error">${e.toString()}</div>`;
          errorHandler(e, "tabulator", index2, "parse", container);
          continue;
        }
      }
      const dataNameSelectedSuffix = renderer.options.dataNameSelectedSuffix;
      const instances = tabulatorInstances.map((tabulatorInstance, index2) => {
        var _a;
        const initialSignals = [{
          name: tabulatorInstance.spec.dataSignalName,
          value: null,
          priority: -1,
          isData: true
        }];
        if ((_a = tabulatorInstance.spec.options) == null ? void 0 : _a.selectableRows) {
          initialSignals.push({
            name: `${tabulatorInstance.spec.dataSignalName}${dataNameSelectedSuffix}`,
            value: [],
            priority: -1,
            isData: true
          });
        }
        return {
          ...tabulatorInstance,
          initialSignals,
          recieveBatch: async (batch) => {
            var _a2;
            const newData = (_a2 = batch[tabulatorInstance.spec.dataSignalName]) == null ? void 0 : _a2.value;
            if (newData) {
              if (!tabulatorInstance.built) {
                tabulatorInstance.table.off("tableBuilt");
                tabulatorInstance.table.on("tableBuilt", () => {
                  tabulatorInstance.built = true;
                  tabulatorInstance.table.off("tableBuilt");
                  tabulatorInstance.table.setData(newData);
                });
              } else {
                tabulatorInstance.table.setData(newData);
              }
            }
          },
          beginListening(sharedSignals) {
            var _a2;
            if ((_a2 = tabulatorInstance.spec.options) == null ? void 0 : _a2.selectableRows) {
              for (const { isData, signalName } of sharedSignals) {
                if (isData) {
                  const matchData = signalName === `${tabulatorInstance.spec.dataSignalName}${dataNameSelectedSuffix}`;
                  if (matchData) {
                    tabulatorInstance.table.on("rowSelectionChanged", (e, rows) => {
                      const selectedData = tabulatorInstance.table.getSelectedData();
                      const batch = {
                        [`${tabulatorInstance.spec.dataSignalName}${dataNameSelectedSuffix}`]: {
                          value: selectedData,
                          isData: true
                        }
                      };
                      renderer.signalBus.log(tabulatorInstance.id, "sending batch", batch);
                      renderer.signalBus.broadcast(tabulatorInstance.id, batch);
                    });
                  }
                }
              }
            }
          },
          getCurrentSignalValue() {
            return tabulatorInstance.table.getSelectedData();
          },
          destroy: async () => {
            tabulatorInstance.table.destroy();
          }
        };
      });
      return instances;
    }
  };
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  const vegaLitePlugin = {
    name: "vega-lite",
    initializePlugin: (md) => definePlugin(md, "vega-lite"),
    fence: (token, idx) => {
      const vegaLiteId = `vega-lite-${idx}`;
      return sanitizedHTML("div", { id: vegaLiteId, class: "vega-chart" }, token.content.trim());
    }
  };
  async function resolveSpec(textContent) {
    try {
      const either = JSON.parse(textContent);
      if (typeof either === "object") {
        return resolveToVega(either);
      } else {
        return { error: new Error(`Spec must be either a JSON object or a string url, found type ${typeof either}`) };
      }
    } catch (error) {
      if (textContent.startsWith("http://") || textContent.startsWith("https://") || textContent.startsWith("//")) {
        try {
          const response = await fetch(textContent);
          const either = await response.json();
          if (typeof either === "object") {
            return resolveToVega(either);
          } else {
            return { error: new Error(`Expected a JSON object, found type ${typeof either}`) };
          }
        } catch (error2) {
          return { error: error2 };
        }
      } else {
        return { error: new Error("Spec string must be a url") };
      }
    }
  }
  function resolveToVega(either) {
    if ("$schema" in either && typeof either.$schema === "string") {
      if (either.$schema.includes("vega-lite")) {
        try {
          const runtime = vegaLite.compile(either);
          const { spec } = runtime;
          return { spec };
        } catch (error) {
          return { error };
        }
      } else if (either.$schema.includes("vega")) {
        return { spec: either };
      } else {
        return { error: new Error("$schema property must be a string with vega or vega-lite version.") };
      }
    } else {
      return { error: new Error("Missing $schema property, must be a string with vega or vega-lite version.") };
    }
  }
  function urlParam(urlParamName, value) {
    if (value === void 0 || value === null)
      return "";
    if (Array.isArray(value)) {
      return value.map((vn) => `${urlParamName}[]=${encodeURIComponent(vn)}`).join("&");
    } else {
      return `${urlParamName}=${encodeURIComponent(value)}`;
    }
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  const ignoredSignals = ["width", "height", "padding", "autosize", "background", "style", "parent", "datum", "item", "event", "cursor"];
  const vegaPlugin = {
    name: "vega",
    initializePlugin: (md) => definePlugin(md, "vega"),
    fence: (token, idx) => {
      const vegaId = `vega-${idx}`;
      return sanitizedHTML("div", { id: vegaId, class: "vega-chart" }, token.content.trim());
    },
    hydrateComponent: async (renderer, errorHandler) => {
      const vegaInstances = [];
      const containers = renderer.element.querySelectorAll(".vega-chart");
      const specInits = [];
      for (const [index2, container] of Array.from(containers).entries()) {
        const specInit = await createSpecInit(container, index2, renderer, errorHandler);
        if (specInit) {
          specInits.push(specInit);
        }
      }
      prioritizeSignalValues(specInits);
      for (const specInit of specInits) {
        const vegaInstance = await createVegaInstance(specInit, renderer, errorHandler);
        if (vegaInstance) {
          vegaInstances.push(vegaInstance);
        }
      }
      const dataSignals = vegaInstances.map((vegaInstance) => vegaInstance.initialSignals.filter((signal) => signal.isData)).flat();
      for (const vegaInstance of vegaInstances) {
        if (!vegaInstance.spec.data)
          continue;
        for (const data of vegaInstance.spec.data) {
          const dataSignal = dataSignals.find((signal) => signal.name === data.name || `${signal.name}${renderer.options.dataNameSelectedSuffix}` === data.name);
          if (dataSignal) {
            vegaInstance.initialSignals.push({
              name: data.name,
              value: data.values,
              priority: data.values ? 1 : 0,
              isData: true
            });
          }
        }
      }
      const instances = vegaInstances.map((vegaInstance) => {
        const { spec, view, initialSignals } = vegaInstance;
        const startBatch = (from) => {
          if (!vegaInstance.batch) {
            renderer.signalBus.log(vegaInstance.id, "starting batch", from);
            vegaInstance.batch = {};
            view.runAfter(() => {
              const { batch } = vegaInstance;
              vegaInstance.batch = void 0;
              renderer.signalBus.log(vegaInstance.id, "sending batch", batch);
              renderer.signalBus.broadcast(vegaInstance.id, batch);
            });
          }
        };
        return {
          ...vegaInstance,
          initialSignals,
          recieveBatch: async (batch, from) => {
            renderer.signalBus.log(vegaInstance.id, "recieved batch", batch, from);
            return new Promise((resolve) => {
              view.runAfter(async () => {
                if (recieveBatch(batch, renderer, vegaInstance)) {
                  renderer.signalBus.log(vegaInstance.id, "running after _pulse, changes from", from);
                  vegaInstance.needToRun = true;
                } else {
                  renderer.signalBus.log(vegaInstance.id, "no changes");
                }
                renderer.signalBus.log(vegaInstance.id, "running view after _pulse finished");
                resolve();
              });
            });
          },
          broadcastComplete: async () => {
            renderer.signalBus.log(vegaInstance.id, "broadcastComplete");
            if (vegaInstance.needToRun) {
              view.runAfter(() => {
                view.runAsync();
                vegaInstance.needToRun = false;
                renderer.signalBus.log(vegaInstance.id, "running view after broadcastComplete");
              });
            }
          },
          beginListening: (sharedSignals) => {
            var _a, _b;
            for (const { isData, signalName } of sharedSignals) {
              if (ignoredSignals.includes(signalName))
                return;
              if (isData) {
                const matchData = (_a = spec.data) == null ? void 0 : _a.find((data) => data.name === signalName);
                if (matchData && vegaInstance.dataSignals.includes(matchData.name)) {
                  renderer.signalBus.log(vegaInstance.id, "listening to data", signalName);
                  view.addDataListener(signalName, async (name, value) => {
                    startBatch(`data:${signalName}`);
                    vegaInstance.batch[name] = { value, isData };
                  });
                }
              }
              const matchSignal = (_b = spec.signals) == null ? void 0 : _b.find((signal) => signal.name === signalName);
              if (matchSignal) {
                const isChangeSource = matchSignal.on || // event streams
                matchSignal.bind || // ui elements
                matchSignal.update;
                if (isChangeSource) {
                  renderer.signalBus.log(vegaInstance.id, "listening to signal", signalName);
                  view.addSignalListener(signalName, async (name, value) => {
                    startBatch(`signal:${signalName}`);
                    vegaInstance.batch[name] = { value, isData };
                  });
                }
              }
            }
          },
          getCurrentSignalValue: (signalName) => {
            var _a;
            const matchSignal = (_a = spec.signals) == null ? void 0 : _a.find((signal) => signal.name === signalName);
            if (matchSignal) {
              return view.signal(signalName);
            } else {
              return void 0;
            }
          },
          destroy: async () => {
            vegaInstance.view.finalize();
          }
        };
      });
      return instances;
    }
  };
  function recieveBatch(batch, renderer, vegaInstance) {
    var _a, _b;
    const { spec, view } = vegaInstance;
    const doLog = renderer.signalBus.logLevel === LogLevel.all;
    doLog && renderer.signalBus.log(vegaInstance.id, "recieveBatch", batch);
    let hasAnyChange = false;
    for (const signalName in batch) {
      const batchItem = batch[signalName];
      if (ignoredSignals.includes(signalName)) {
        doLog && renderer.signalBus.log(vegaInstance.id, "ignoring reverved signal name", signalName, batchItem.value);
        continue;
      }
      if (batchItem.isData) {
        let logReason2;
        if (!batchItem.value) {
          logReason2 = "not updating data, no value";
        } else {
          const matchData = (_a = spec.data) == null ? void 0 : _a.find((data) => data.name === signalName);
          if (!matchData) {
            logReason2 = "not updating data, no match";
          } else {
            logReason2 = "updating data";
            view.change(signalName, vega.changeset().remove(() => true).insert(batchItem.value));
            hasAnyChange = true;
          }
        }
        doLog && renderer.signalBus.log(vegaInstance.id, `(isData) ${logReason2}`, signalName, batchItem.value);
      }
      let logReason = "";
      const matchSignal = (_b = spec.signals) == null ? void 0 : _b.find((signal) => signal.name === signalName);
      if (!matchSignal) {
        logReason = "not updating signal, no match";
      } else {
        if (matchSignal.update) {
          logReason = "not updating signal, it is a calculation";
        } else {
          if (isSignalDataBridge(matchSignal)) {
            logReason = "not updating signal, data bridge";
          } else {
            const oldValue = view.signal(signalName);
            if (oldValue === batchItem.value) {
              logReason = "not updating signal, same value";
            } else {
              logReason = "updating signal";
              view.signal(signalName, batchItem.value);
              hasAnyChange = true;
            }
          }
        }
      }
      doLog && renderer.signalBus.log(vegaInstance.id, logReason, signalName, batchItem.value);
    }
    return hasAnyChange;
  }
  async function createSpecInit(container, index2, renderer, errorHandler) {
    var _a;
    if (!container.textContent) {
      container.innerHTML = '<div class="error">Expected a spec object or a url</div>';
      return;
    }
    let result;
    try {
      result = await resolveSpec(container.textContent);
    } catch (e) {
      container.innerHTML = `<div class="error">${e.toString()}</div>`;
      errorHandler(e, "vega", index2, "resolve", container);
      return;
    }
    if (result.error) {
      container.innerHTML = `<div class="error">${result.error.toString()}</div>`;
      errorHandler(result.error, "vega", index2, "resolve", container);
      return;
    }
    if (!result.spec) {
      container.innerHTML = '<div class="error">Expected a spec object</div>';
      return;
    }
    const { spec } = result;
    const initialSignals = ((_a = spec.signals) == null ? void 0 : _a.map((signal) => {
      if (ignoredSignals.includes(signal.name))
        return;
      let isData = isSignalDataBridge(signal);
      if (signal.name.startsWith(renderer.options.dataSignalPrefix)) {
        isData = true;
      }
      return {
        name: signal.name,
        value: signal.value,
        priority: signal.bind ? 1 : 0,
        isData
      };
    }).filter(Boolean)) || [];
    const specInit = { container, index: index2, initialSignals, spec };
    return specInit;
  }
  async function createVegaInstance(specInit, renderer, errorHandler) {
    const { container, index: index2, initialSignals, spec } = specInit;
    const id = `vega-${index2}`;
    let runtime;
    let view;
    try {
      runtime = vega.parse(spec);
    } catch (e) {
      container.innerHTML = `<div class="error">${e.toString()}</div>`;
      errorHandler(e, "vega", index2, "parse", container);
      return;
    }
    try {
      view = new vega.View(runtime, {
        container,
        renderer: renderer.options.vegaRenderer,
        logger: new VegaLogger((error) => {
          errorHandler(error, "vega", index2, "view", container);
        })
      });
      view.run();
      for (const signal of initialSignals) {
        if (signal.isData)
          continue;
        const currentValue = view.signal(signal.name);
        if (currentValue !== signal.value) {
          renderer.signalBus.log(id, "re-setting initial signal", signal.name, signal.value, currentValue);
          signal.value = currentValue;
        }
      }
    } catch (e) {
      container.innerHTML = `<div class="error">${e.toString()}</div>`;
      errorHandler(e, "vega", index2, "view", container);
      return;
    }
    const dataSignals = initialSignals.filter((signal) => {
      var _a;
      return signal.isData && ((_a = spec.data) == null ? void 0 : _a.some((data) => data.name === signal.name));
    }).map((signal) => signal.name);
    const instance = { ...specInit, view, id, dataSignals };
    return instance;
  }
  function isSignalDataBridge(signal) {
    return signal.update === `data('${signal.name}')`;
  }
  function prioritizeSignalValues(specInits) {
    var _a;
    const highPrioritySignals = specInits.map((specInit) => specInit.initialSignals.filter((signal) => signal.priority > 0)).flat();
    for (const specInit of specInits) {
      for (const prioritySignal of highPrioritySignals) {
        const matchSignal = (_a = specInit.spec.signals) == null ? void 0 : _a.find((signal) => signal.name === prioritySignal.name);
        if (matchSignal && matchSignal.value !== void 0 && matchSignal.value !== prioritySignal.value) {
          matchSignal.value = prioritySignal.value;
        }
      }
    }
  }
  vega.expressionFunction("urlParam", urlParam);
  class VegaLogger {
    constructor(errorHandler) {
      __publicField(this, "errorHandler");
      __publicField(this, "logLevel", 0);
      this.errorHandler = errorHandler;
      this.error = this.error.bind(this);
      this.warn = this.warn.bind(this);
      this.info = this.info.bind(this);
      this.debug = this.debug.bind(this);
    }
    level(level) {
      if (level === void 0) {
        return this.logLevel;
      }
      this.logLevel = level;
      return this;
    }
    error(...args) {
      if (this.errorHandler) {
        this.errorHandler(args[0]);
      }
      if (this.logLevel >= 1) {
        console.error(...args);
      }
      return this;
    }
    warn(...args) {
      if (this.logLevel >= 2) {
        console.warn(...args);
      }
      return this;
    }
    info(...args) {
      if (this.logLevel >= 3) {
        console.info(...args);
      }
      return this;
    }
    debug(...args) {
      if (this.logLevel >= 4) {
        console.debug(...args);
      }
      return this;
    }
  }
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  function registerNativePlugins() {
    registerMarkdownPlugin(dropdownPlugin);
    registerMarkdownPlugin(imagePlugin);
    registerMarkdownPlugin(placeholdersPlugin);
    registerMarkdownPlugin(presetsPlugin);
    registerMarkdownPlugin(tabulatorPlugin);
    registerMarkdownPlugin(vegaLitePlugin);
    registerMarkdownPlugin(vegaPlugin);
  }
  function bindTextarea$1(textarea, outputElement, options) {
    const renderer = new Renderer(outputElement, options);
    const render = () => {
      const content = textarea.value;
      renderer.render(content);
    };
    textarea.addEventListener("input", render);
    render();
    return renderer;
  }
  const interfaces = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null
  }, Symbol.toStringTag, { value: "Module" }));
  /*!
  * Copyright (c) Microsoft Corporation.
  * Licensed under the MIT License.
  */
  registerNativePlugins();
  const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Plugins: interfaces,
    Renderer,
    bindTextarea: bindTextarea$1,
    definePlugin,
    plugins,
    registerMarkdownPlugin,
    sanitizedHTML
  }, Symbol.toStringTag, { value: "Module" }));
  function safeVariableName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  function getChartType(spec) {
    const $schema2 = spec == null ? void 0 : spec.$schema;
    if (!$schema2) {
      return "vega-lite";
    }
    return $schema2.includes("vega-lite") ? "vega-lite" : "vega";
  }
  function changePageOrigin(page, oldOrigin, newOriginUrl) {
    const newPage = {
      ...page,
      dataLoaders: page.dataLoaders.map((loader) => {
        if (loader.type === "url" && loader.urlRef.origin === oldOrigin) {
          return {
            ...loader,
            urlRef: {
              ...loader.urlRef,
              origin: newOriginUrl.origin
            }
          };
        }
        return loader;
      }),
      groups: page.groups.map((group) => ({
        ...group,
        elements: group.elements.map((element) => {
          if (typeof element === "object" && element.type === "image" && element.urlRef.origin === oldOrigin) {
            const newImageElement = {
              ...element,
              urlRef: {
                ...element.urlRef,
                origin: newOriginUrl.origin
              }
            };
            return newImageElement;
          }
          return element;
        })
      }))
    };
    return newPage;
  }
  function addStaticDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;
    if (!spec.signals) {
      spec.signals = [];
    }
    spec.signals.push({
      name: dataSourceName,
      update: `data('${dataSourceName}')`
    });
    if (!spec.data) {
      spec.data = [];
    }
    const newData = {
      name: dataSourceName,
      values: []
    };
    if (dataSource.type === "json") {
      newData.values = dataSource.content;
    } else if (dataSource.type === "file") {
      newData.format = {
        type: dataSource.format
      };
      newData.values = [dataSource.content];
    }
    spec.data.push(newData);
  }
  function addDynamicDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;
    const urlSignal = vegaScope.createUrlSignal(dataSource.urlRef);
    const url = { signal: urlSignal.name };
    if (!spec.signals) {
      spec.signals = [];
    }
    spec.signals.push({
      name: dataSourceName,
      update: `data('${dataSourceName}')`
    });
    if (!spec.data) {
      spec.data = [];
    }
    spec.data.unshift({
      name: dataSourceName,
      url,
      format: { type: dataSource.format || "json" },
      transform: dataSource.dataFrameTransformations || []
    });
  }
  class VegaScope {
    constructor(spec) {
      __publicField(this, "spec");
      __publicField(this, "urlCount", 0);
      this.spec = spec;
    }
    addOrigin(origin) {
      if (!this.spec.signals) {
        this.spec.signals = [];
      }
      let origins = this.spec.signals.find((d2) => d2.name === "origins");
      if (!origins) {
        origins = {
          name: "origins",
          value: {}
        };
        this.spec.signals.unshift(origins);
      }
      origins.value[origin] = origin;
    }
    createUrlSignal(urlRef) {
      const { origin, urlPath, mappedParams } = urlRef;
      const name = `url:${this.urlCount++}:${safeVariableName(origin + urlPath)}`;
      const signal = { name };
      this.addOrigin(origin);
      signal.update = `origins[${JSON.stringify(origin)}]+'${urlPath}'`;
      if (mappedParams && mappedParams.length > 0) {
        signal.update += ` + '?' + ${mappedParams.map((p) => `urlParam('${p.name}', ${variableValueExpression(p)})`).join(` + '&' + `)}`;
      }
      if (!this.spec.signals) {
        this.spec.signals = [];
      }
      this.spec.signals.push(signal);
      return signal;
    }
  }
  function variableValueExpression(param) {
    if (param.variableId) {
      return param.variableId;
    } else if (param.calculation) {
      return "(" + param.calculation.vegaExpression + ")";
    } else {
      return JSON.stringify(param.value);
    }
  }
  function topologicalSort(list) {
    var _a;
    const nameToObject = /* @__PURE__ */ new Map();
    const inDegree = /* @__PURE__ */ new Map();
    const graph = /* @__PURE__ */ new Map();
    for (const obj of list) {
      nameToObject.set(obj.variableId, obj);
      inDegree.set(obj.variableId, 0);
      graph.set(obj.variableId, []);
    }
    for (const obj of list) {
      const sources = ((_a = obj.calculation) == null ? void 0 : _a.dependsOn) || [];
      for (const dep of sources) {
        if (!graph.has(dep)) {
          continue;
        }
        graph.get(dep).push(obj.variableId);
        inDegree.set(obj.variableId, inDegree.get(obj.variableId) + 1);
      }
    }
    const queue = [];
    for (const [name, degree] of inDegree.entries()) {
      if (degree === 0)
        queue.push(name);
    }
    const sorted = [];
    while (queue.length) {
      const current = queue.shift();
      sorted.push(nameToObject.get(current));
      for (const neighbor of graph.get(current)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    if (sorted.length !== list.length) {
      throw new Error("Cycle or missing dependency detected");
    }
    return sorted;
  }
  function createSpecWithVariables(dataNameSelectedSuffix, variables, stubDataLoaders) {
    const spec = {
      $schema: "https://vega.github.io/schema/vega/v5.json",
      signals: [],
      data: []
    };
    topologicalSort(variables).forEach((v2) => {
      if (isDataframePipeline(v2)) {
        const { dataFrameTransformations } = v2.calculation;
        const data = {
          name: v2.variableId,
          source: v2.calculation.dependsOn || [],
          transform: dataFrameTransformations
        };
        spec.data.push(data);
        if (!spec.signals) {
          spec.signals = [];
        }
        spec.signals.push({
          name: v2.variableId,
          update: `data('${v2.variableId}')`
        });
      } else {
        const signal = { name: v2.variableId, value: v2.initialValue };
        if (v2.calculation) {
          signal.update = v2.calculation.vegaExpression;
        }
        spec.signals.push(signal);
      }
    });
    return spec;
  }
  function isDataframePipeline(variable) {
    var _a, _b;
    return variable.type === "object" && !!variable.isArray && (((_a = variable.calculation) == null ? void 0 : _a.dependsOn) !== void 0 && variable.calculation.dependsOn.length > 0 || ((_b = variable.calculation) == null ? void 0 : _b.dataFrameTransformations) !== void 0 && variable.calculation.dataFrameTransformations.length > 0);
  }
  function mdWrap(type, content) {
    return `\`\`\`json ${type}
${content}
\`\`\``;
  }
  function chartWrap(spec) {
    const chartType = getChartType(spec);
    return mdWrap(chartType, JSON.stringify(spec, null, 4));
  }
  function mdContainerWrap(id, content) {
    return `::: markdown-block {#${id}}
${content}
:::`;
  }
  const $schema = "https://vega.github.io/schema/vega/v5.json";
  function targetMarkdown(page, rendererOptions) {
    const mdSections = [];
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];
    const vegaScope = dataLoaderMarkdown(dataLoaders.filter((dl) => dl.type !== "spec"), variables, rendererOptions);
    for (const dataLoader of dataLoaders.filter((dl) => dl.type === "spec")) {
      mdSections.push(chartWrap(dataLoader.spec));
    }
    for (const group of page.groups) {
      mdSections.push(mdContainerWrap(group.groupId, groupMarkdown(group, variables, vegaScope)));
    }
    mdSections.unshift(chartWrap(vegaScope.spec));
    const markdown = mdSections.join("\n\n");
    return markdown;
  }
  function dataLoaderMarkdown(dataSources, variables, rendererOptions) {
    const spec = createSpecWithVariables(rendererOptions.dataNameSelectedSuffix, variables);
    const vegaScope = new VegaScope(spec);
    for (const dataSource of dataSources) {
      switch (dataSource.type) {
        case "json": {
          addStaticDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
        case "file": {
          addStaticDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
        case "url": {
          addDynamicDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
      }
      if (!spec.data) {
        spec.data = [];
      }
      spec.data.unshift({
        name: dataSource.dataSourceName + rendererOptions.dataNameSelectedSuffix
      });
    }
    return vegaScope;
  }
  function groupMarkdown(group, variables, vegaScope) {
    var _a, _b, _c, _d;
    const mdElements = [];
    for (const element of group.elements) {
      if (typeof element === "string") {
        mdElements.push(element);
      } else if (typeof element === "object") {
        switch (element.type) {
          case "chart": {
            const chartFull = element.chart;
            if (!chartFull.spec) {
              mdElements.push("![Chart Spinner](/img/chart-spinner.gif)");
            } else {
              mdElements.push(chartWrap(chartFull.spec));
            }
            break;
          }
          case "checkbox": {
            const spec = {
              $schema,
              signals: [
                {
                  name: element.variableId,
                  value: (_a = variables.find((v2) => v2.variableId === element.variableId)) == null ? void 0 : _a.initialValue,
                  bind: {
                    input: "checkbox"
                  }
                }
              ]
            };
            mdElements.push(chartWrap(spec));
            break;
          }
          case "dropdown": {
            const ddSpec = {
              name: element.variableId,
              value: (_b = variables.find((v2) => v2.variableId === element.variableId)) == null ? void 0 : _b.initialValue,
              label: element.label
            };
            if (element.dynamicOptions) {
              ddSpec.dynamicOptions = {
                dataSignalName: element.dynamicOptions.dataSourceName,
                fieldName: element.dynamicOptions.fieldName
              };
            } else {
              ddSpec.options = element.options;
            }
            if (element.multiple) {
              ddSpec.multiple = element.multiple;
              ddSpec.size = element.size || 1;
            }
            mdElements.push(mdWrap("dropdown", JSON.stringify(ddSpec, null, 2)));
            break;
          }
          case "image": {
            const urlSignal = vegaScope.createUrlSignal(element.urlRef);
            const imageSpec = {
              srcSignalName: urlSignal.name,
              alt: element.alt,
              width: element.width,
              height: element.height
            };
            mdElements.push(mdWrap("image", JSON.stringify(imageSpec, null, 2)));
            break;
          }
          case "presets": {
            const presetsSpec = element.presets;
            mdElements.push(mdWrap("presets", JSON.stringify(presetsSpec, null, 2)));
            break;
          }
          case "slider": {
            const spec = {
              $schema,
              signals: [
                {
                  name: element.variableId,
                  value: (_c = variables.find((v2) => v2.variableId === element.variableId)) == null ? void 0 : _c.initialValue,
                  bind: {
                    input: "range",
                    min: element.min,
                    max: element.max,
                    step: element.step,
                    debounce: 100
                  }
                }
              ]
            };
            mdElements.push(chartWrap(spec));
            break;
          }
          case "table": {
            const tableSpec = {
              dataSignalName: element.dataSourceName,
              options: element.options
            };
            mdElements.push(mdWrap("tabulator", JSON.stringify(tableSpec, null, 2)));
            break;
          }
          case "textbox": {
            const spec = {
              $schema,
              signals: [
                {
                  name: element.variableId,
                  value: (_d = variables.find((v2) => v2.variableId === element.variableId)) == null ? void 0 : _d.initialValue,
                  bind: {
                    input: "text",
                    debounce: 100
                  }
                }
              ]
            };
            mdElements.push(chartWrap(spec));
            break;
          }
        }
      }
    }
    const markdown = mdElements.join("\n\n");
    return markdown;
  }
  function bindTextarea(textarea, outputElement, options) {
    const renderer = new Renderer(outputElement, options);
    const showError = (error) => {
      console.error("Error parsing JSON:", error);
      outputElement.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; background-color: #ffe6e6; border-radius: 4px;">
            <strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}
        </div>`;
    };
    const render = () => {
      const json = textarea.value;
      try {
        const page = JSON.parse(json);
        if (typeof page !== "object") {
          showError(new Error("Invalid JSON format"));
          return;
        }
        const md = targetMarkdown(page, renderer.options);
        renderer.render(md);
      } catch (error) {
        showError(error);
      }
    };
    textarea.addEventListener("input", render);
    render();
    return renderer;
  }
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    bindTextarea,
    changePageOrigin,
    targetMarkdown
  }, Symbol.toStringTag, { value: "Module" }));
  function readFile(file, host) {
    if (file.name.endsWith(".idoc.json") || file.name.endsWith(".idoc.md")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a;
        let content = (_a = e.target) == null ? void 0 : _a.result;
        if (!content) {
          host.errorHandler(
            new Error("File content is empty"),
            "The file is empty. Please use a valid markdown or JSON file."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            new Error("File content is empty"),
            "The file is empty or contains only whitespace. Please use a valid markdown or JSON file."
          );
          return;
        }
        if (file.name.endsWith(".idoc.json")) {
          try {
            const idoc = JSON.parse(content);
            host.render(void 0, idoc);
            return;
          } catch (jsonError) {
            host.errorHandler(
              new Error("Invalid JSON content"),
              "The file content is not valid JSON."
            );
            return;
          }
        } else if (file.name.endsWith(".idoc.md")) {
          host.render(content);
        }
      };
      reader.onerror = (e) => {
        host.errorHandler(new Error("Failed to read file"), "Error reading file");
      };
      reader.readAsText(file);
    } else {
      host.errorHandler(
        new Error("Invalid file type"),
        "Only markdown (.idoc.md) or JSON (.idoc.json) files are supported."
      );
    }
  }
  function determineContent(content, host) {
    if (!content) {
      host.errorHandler(
        new Error("Content is empty"),
        "The content was empty. Please use valid markdown content or JSON."
      );
      return;
    }
    if (typeof content !== "string") {
      host.errorHandler(
        new Error("Invalid content type"),
        "The content is not a string. Please use valid markdown content or JSON."
      );
      return;
    }
    content = content.trim();
    if (!content) {
      host.errorHandler(
        new Error("Content is empty"),
        "The content was only whitespace. Please use valid markdown content or JSON."
      );
      return;
    }
    if (content.startsWith("{") && content.endsWith("}")) {
      try {
        const idoc = JSON.parse(content);
        host.render(void 0, idoc);
      } catch (jsonError) {
        host.errorHandler(
          new Error("Invalid JSON content in clipboard"),
          "The pasted content is not valid JSON. Please copy a valid interactive document JSON file."
        );
        return;
      }
    } else {
      host.render(content);
    }
  }
  function setupClipboardHandling(host) {
    const pasteHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clipboardData = e.clipboardData;
      if (clipboardData && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        readFile(file, host);
      } else if (clipboardData && clipboardData.items) {
        let handled = false;
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.kind === "string" && item.type === "text/plain") {
            item.getAsString((content) => {
              if (!content) {
                host.errorHandler(
                  new Error("Pasted content is empty"),
                  "The pasted content was empty. Please paste valid markdown content or JSON."
                );
                return;
              }
              content = content.trim();
              if (!content) {
                host.errorHandler(
                  new Error("Pasted content is empty"),
                  "The pasted content was only whitespace. Please paste valid markdown content or JSON."
                );
                return;
              }
              determineContent(content, host);
            });
            handled = true;
            break;
          }
        }
        if (!handled) {
          host.errorHandler(
            new Error("Unsupported clipboard content"),
            "Please paste a markdown file, JSON file, or valid text content."
          );
        }
      } else {
        host.errorHandler(
          new Error("Unsupported clipboard content"),
          "Please paste a markdown file, JSON file, or valid text content."
        );
      }
    };
    document.addEventListener("paste", pasteHandler);
    return () => {
      document.removeEventListener("paste", pasteHandler);
    };
  }
  function setupDragDropHandling(host) {
    const dragHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const dropHandler = (e) => {
      var _a, _b;
      e.preventDefault();
      e.stopPropagation();
      const files = (_a = e.dataTransfer) == null ? void 0 : _a.files;
      if (files && files.length > 0) {
        const file = files[0];
        readFile(file, host);
      } else if ((_b = e.dataTransfer) == null ? void 0 : _b.types.includes("text/plain")) {
        let content = e.dataTransfer.getData("text/plain");
        if (!content) {
          host.errorHandler(
            new Error("Dropped content is empty"),
            "The dropped content was empty. Please drop valid markdown content or JSON."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            new Error("Dropped content is empty"),
            "The dropped content was only whitespace. Please drop valid markdown content or JSON."
          );
          return;
        }
        determineContent(content, host);
      } else {
        host.errorHandler(
          new Error("Unsupported drop content"),
          "Please drop a markdown file, JSON file, or valid text content."
        );
      }
    };
    document.addEventListener("drop", dropHandler);
    document.addEventListener("dragover", dragHandler);
    return () => {
      document.removeEventListener("drop", dropHandler);
      document.removeEventListener("dragover", dragHandler);
    };
  }
  function setupFileUpload(host) {
    const { uploadButton, fileInput } = host;
    if (!uploadButton || !fileInput) {
      host.errorHandler(
        new Error("Upload button or file input not found"),
        "Please ensure the upload button and file input elements are present in the HTML."
      );
      return;
    }
    uploadButton == null ? void 0 : uploadButton.addEventListener("click", () => {
      fileInput == null ? void 0 : fileInput.click();
    });
    fileInput == null ? void 0 : fileInput.addEventListener("change", (event) => {
      var _a;
      const file = (_a = event.target.files) == null ? void 0 : _a[0];
      if (file) {
        readFile(file, host);
      } else {
        host.errorHandler(
          new Error("No file selected"),
          "Please select a markdown or JSON file to upload."
        );
      }
    });
  }
  function checkUrlForFile(host) {
    const urlParams = new URLSearchParams(window.location.search);
    const loadUrl = urlParams.get(host.options.urlParamName);
    if (loadUrl) {
      try {
        fetch(loadUrl).then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load ${loadUrl}`);
          }
          return response.text();
        }).then((content) => {
          determineContent(content, host);
        }).catch((error) => {
          host.errorHandler(error, `Error loading file: ${loadUrl}`);
        });
      } catch (error) {
        host.errorHandler(error, `Error loading file: ${loadUrl}`);
      }
      return true;
    } else {
      return false;
    }
  }
  function setupPostMessageHandling(host) {
    window.addEventListener("message", (event) => {
      try {
        if (!event.data || typeof event.data !== "object") {
          host.errorHandler(
            new Error("Invalid message format"),
            "Received message is not an object or is undefined."
          );
          return;
        }
        const data = event.data;
        if (data.markdown) {
          host.render(data.markdown, void 0);
        } else if (data.interactiveDocument) {
          host.render(void 0, data.interactiveDocument);
        } else {
        }
      } catch (error) {
        host.errorHandler(
          error,
          "Error processing postMessage event"
        );
      }
    });
  }
  function postStatus(target, message) {
    if (target) {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now()
      };
      target.postMessage(messageWithTimestamp, "*");
    }
  }
  function getElement(elementOrSelector) {
    if (typeof elementOrSelector === "string") {
      return document.querySelector(elementOrSelector);
    }
    return elementOrSelector;
  }
  function show(element, shown) {
    if (!element) {
      return;
    }
    element.style.display = shown ? "" : "none";
  }
  const defaultOptions = {
    clipboard: true,
    dragDrop: true,
    fileUpload: true,
    postMessage: true,
    postMessageTarget: window.opener || window.parent || window,
    url: true,
    urlParamName: "load"
  };
  class Listener {
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "appDiv");
      __publicField(this, "loadingDiv");
      __publicField(this, "helpDiv");
      __publicField(this, "uploadButton");
      __publicField(this, "fileInput");
      __publicField(this, "textarea");
      __publicField(this, "renderer");
      __publicField(this, "removeInteractionHandlers");
      this.options = { ...defaultOptions, ...options.options };
      this.removeInteractionHandlers = [];
      this.appDiv = getElement(options.app);
      this.loadingDiv = getElement(options.loading);
      this.helpDiv = getElement(options.help);
      this.uploadButton = getElement(options.uploadButton);
      this.fileInput = getElement(options.fileInput);
      this.textarea = getElement(options.textarea);
      if (!this.appDiv) {
        throw new Error("App container not found");
      }
      show(this.loadingDiv, true);
      show(this.helpDiv, false);
      this.renderer = new Renderer(this.appDiv, {});
      if (this.options.clipboard) {
        this.removeInteractionHandlers.push(setupClipboardHandling(this));
      }
      if (this.options.dragDrop) {
        this.removeInteractionHandlers.push(setupDragDropHandling(this));
      }
      if (this.options.fileUpload) {
        setupFileUpload(this);
      }
      if (this.options.postMessage) {
        setupPostMessageHandling(this);
      }
      if (!this.options.url || this.options.url && !checkUrlForFile(this)) {
        show(this.loadingDiv, false);
        show(this.helpDiv, true);
        postStatus(this.options.postMessageTarget, { status: "ready" });
      }
    }
    errorHandler(error, details) {
      show(this.loadingDiv, false);
      this.appDiv.innerHTML = `<div style="color: red; padding: 20px;">
    <strong>Error:</strong> ${error.message}<br>
      ${details}
    </div>`;
    }
    render(markdown, interactiveDocument) {
      if (interactiveDocument) {
        if (this.textarea) {
          this.textarea.value = JSON.stringify(interactiveDocument, null, 2);
          this.hideLoadingAndHelp();
          bindTextarea(this.textarea, this.appDiv);
        } else {
          this.renderInteractiveDocument(interactiveDocument);
        }
      } else if (markdown) {
        if (this.textarea) {
          this.textarea.value = markdown;
          this.hideLoadingAndHelp();
          bindTextarea$1(this.textarea, this.appDiv);
        } else {
          this.renderMarkdown(markdown);
        }
      } else {
        this.errorHandler(new Error("No content provided"), "Please provide either markdown or an interactive document to render.");
      }
      this.removeInteractionHandlers.forEach((removeHandler) => removeHandler());
      this.removeInteractionHandlers = [];
    }
    renderInteractiveDocument(content) {
      postStatus(this.options.postMessageTarget, { status: "compiling", details: "Starting interactive document compilation" });
      const markdown = targetMarkdown(content, this.renderer.options);
      this.renderMarkdown(markdown);
    }
    hideLoadingAndHelp() {
      show(this.loadingDiv, false);
      show(this.helpDiv, false);
    }
    renderMarkdown(content) {
      this.hideLoadingAndHelp();
      if (!this.renderer) {
        this.errorHandler(new Error("Renderer not initialized"), "Please wait for the application to load.");
        return;
      }
      try {
        postStatus(this.options.postMessageTarget, { status: "rendering", details: "Starting markdown rendering" });
        this.renderer.destroy();
        this.renderer.render(
          content,
          (error, pluginName, instanceIndex, phase, container, detail) => {
            const msg = `<strong>Error in ${pluginName}:</strong> ${error.message}<br>
          <strong>Instance:</strong> ${instanceIndex}<br>
          <strong>Phase:</strong> ${phase}<br>
          <strong>Container:</strong> ${container.tagName}<br>
          ${detail ? `<strong>Detail:</strong> ${detail}` : ""}`;
            this.errorHandler(error, msg);
            postStatus(this.options.postMessageTarget, { status: "error", details: `Rendering error in ${pluginName}: ${error.message}` });
          }
        );
        postStatus(this.options.postMessageTarget, { status: "rendered", details: "Markdown rendering completed successfully" });
      } catch (error) {
        this.errorHandler(
          error,
          "Error rendering markdown content"
        );
        postStatus(this.options.postMessageTarget, { status: "error", details: `Rendering failed: ${error.message}` });
      }
    }
  }
  exports2.Listener = Listener;
  exports2.compiler = index;
  exports2.markdown = index$1;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
