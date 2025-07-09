(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory((global.IDocs = global.IDocs || {}, global.IDocs.editor = {})));
})(this, function(exports2) {
  "use strict";
  function Editor(props) {
    return /* @__PURE__ */ React.createElement("div", null, "Hello world");
  }
  exports2.Editor = Editor;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
