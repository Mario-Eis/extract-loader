"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));var _vm = _interopRequireDefault(require("vm"));
var _path = _interopRequireDefault(require("path"));
var _loaderUtils = require("loader-utils");
var _resolve = _interopRequireDefault(require("resolve"));
var _btoa = _interopRequireDefault(require("btoa"));
var babel = _interopRequireWildcard(require("@babel/core"));function _getRequireWildcardCache(e) {if ("function" != typeof WeakMap) return null;var r = new WeakMap(),t = new WeakMap();return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {return e ? t : r;})(e);}function _interopRequireWildcard(e, r) {if (!r && e && e.__esModule) return e;if (null === e || "object" != typeof e && "function" != typeof e) return { default: e };var t = _getRequireWildcardCache(r);if (t && t.has(e)) return t.get(e);var n = { __proto__: null },a = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) {var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];}return n.default = e, t && t.set(e, n), n;}

/**
 * @typedef {Object} LoaderContext
 * @property {function} cacheable
 * @property {function} async
 * @property {function} addDependency
 * @property {function} loadModule
 * @property {string} resourcePath
 * @property {object} options
 */

/**
 * Executes the given module's src in a fake context in order to get the resulting string.
 *
 * @this LoaderContext
 * @param {string} src
 * @throws Error
 */function
extractLoader(_x) {return _extractLoader.apply(this, arguments);}function _extractLoader() {_extractLoader = (0, _asyncToGenerator2.default)(function* (src) {
    const done = this.async();
    const options = (0, _loaderUtils.getOptions)(this) || {};
    const publicPath = getPublicPath(options, this);

    this.cacheable();

    try {
      done(null, yield evalDependencyGraph({
        loaderContext: this,
        src,
        filename: this.resourcePath,
        publicPath
      }));
    } catch (error) {
      done(error);
    }
  });return _extractLoader.apply(this, arguments);}

function evalDependencyGraph({ loaderContext, src, filename, publicPath = "" }) {
  const moduleCache = new Map();

  function loadModule(filename) {
    return new Promise((resolve, reject) => {
      // loaderContext.loadModule automatically calls loaderContext.addDependency for all requested modules
      loaderContext.loadModule(filename, (error, src) => {
        if (error) {
          reject(error);
        } else {
          resolve(src);
        }
      });
    });
  }

  function extractExports(exports) {
    const hasBtoa = ("btoa" in global);
    const previousBtoa = global.btoa;

    global.btoa = _btoa.default;

    try {
      return exports.toString();
    } catch (error) {
      throw error;
    } finally {
      if (hasBtoa) {
        global.btoa = previousBtoa;
      } else {
        delete global.btoa;
      }
    }
  }

  function extractQueryFromPath(givenRelativePath) {
    const indexOfLastExclMark = givenRelativePath.lastIndexOf("!");
    const indexOfQuery = givenRelativePath.lastIndexOf("?");

    if (indexOfQuery !== -1 && indexOfQuery > indexOfLastExclMark) {
      return {
        relativePathWithoutQuery: givenRelativePath.slice(0, indexOfQuery),
        query: givenRelativePath.slice(indexOfQuery)
      };
    }

    return {
      relativePathWithoutQuery: givenRelativePath,
      query: ""
    };
  }function

  evalModule(_x2, _x3) {return _evalModule.apply(this, arguments);}function _evalModule() {_evalModule = (0, _asyncToGenerator2.default)(function* (src, filename) {
      src = babel.transform(src, {
        babelrc: false,
        presets: [
        [
        require("@babel/preset-env"), {
          modules: "commonjs",
          targets: { node: "current" }
        }]],


        plugins: [require("babel-plugin-add-module-exports")]
      }).code;

      const script = new _vm.default.Script(src, {
        filename,
        displayErrors: true
      });
      const newDependencies = [];
      const exports = {};
      const sandbox = Object.assign({}, global, {
        module: {
          exports
        },
        exports,
        __webpack_public_path__: publicPath, // eslint-disable-line camelcase
        require: function (_require) {function require(_x4) {return _require.apply(this, arguments);}require.toString = function () {return _require.toString();};return require;}((givenRelativePath) => {
          const _extractQueryFromPath = extractQueryFromPath(givenRelativePath),relativePathWithoutQuery = _extractQueryFromPath.relativePathWithoutQuery,query = _extractQueryFromPath.query;
          const indexOfLastExclMark = relativePathWithoutQuery.lastIndexOf("!");
          const loaders = givenRelativePath.slice(0, indexOfLastExclMark + 1);
          const relativePath = relativePathWithoutQuery.slice(indexOfLastExclMark + 1);
          const absolutePath = _resolve.default.sync(relativePath, {
            basedir: _path.default.dirname(filename)
          });
          const ext = _path.default.extname(absolutePath);

          if (moduleCache.has(absolutePath)) {
            return moduleCache.get(absolutePath);
          }

          // If the required file is a js file, we just require it with node's require.
          // If the required file should be processed by a loader we do not touch it (even if it is a .js file).
          if (loaders === "" && ext === ".js") {
            // Mark the file as dependency so webpack's watcher is working for the css-loader helper.
            // Other dependencies are automatically added by loadModule() below
            loaderContext.addDependency(absolutePath);

            const exports = require(absolutePath); // eslint-disable-line import/no-dynamic-require

            moduleCache.set(absolutePath, exports);

            return exports;
          }

          const rndPlaceholder = "__EXTRACT_LOADER_PLACEHOLDER__" + rndNumber() + rndNumber();

          newDependencies.push({
            absolutePath,
            absoluteRequest: loaders + absolutePath + query,
            rndPlaceholder
          });

          return rndPlaceholder;
        })
      });

      script.runInNewContext(sandbox);

      const extractedDependencyContent = yield Promise.all(
        newDependencies.map( /*#__PURE__*/function () {var _ref = (0, _asyncToGenerator2.default)(function* ({ absolutePath, absoluteRequest }) {
            const src = yield loadModule(absoluteRequest);

            return evalModule(src, absolutePath);
          });return function (_x5) {return _ref.apply(this, arguments);};}())
      );
      const contentWithPlaceholders = extractExports(sandbox.module.exports);
      const extractedContent = extractedDependencyContent.reduce((content, dependencyContent, idx) => {
        const pattern = new RegExp(newDependencies[idx].rndPlaceholder, "g");

        return content.replace(pattern, dependencyContent);
      }, contentWithPlaceholders);

      moduleCache.set(filename, extractedContent);

      return extractedContent;
    });return _evalModule.apply(this, arguments);}

  return evalModule(src, filename);
}

/**
 * @returns {string}
 */
function rndNumber() {
  return Math.random().
  toString().
  slice(2);
}

// getPublicPath() encapsulates the complexity of reading the publicPath from the current
// webpack config. Let's keep the complexity in this function.
/* eslint-disable complexity  */
/**
 * Retrieves the public path from the loader options, context.options (webpack <4) or context._compilation (webpack 4+).
 * context._compilation is likely to get removed in a future release, so this whole function should be removed then.
 * See: https://github.com/peerigon/extract-loader/issues/35
 *
 * @deprecated
 * @param {Object} options - Extract-loader options
 * @param {Object} context - Webpack loader context
 * @returns {string}
 */
function getPublicPath(options, context) {
  let publicPath = "";

  if ("publicPath" in options) {
    publicPath = typeof options.publicPath === "function" ? options.publicPath(context) : options.publicPath;
  } else if (context.options && context.options.output && "publicPath" in context.options.output) {
    publicPath = context.options.output.publicPath;
  } else if (context._compilation && context._compilation.outputOptions && "publicPath" in context._compilation.outputOptions) {
    publicPath = context._compilation.outputOptions.publicPath;
  }

  return publicPath === "auto" ? "" : publicPath;
}
/* eslint-enable complexity */

// For CommonJS interoperability
module.exports = extractLoader;var _default = exports.default =
extractLoader;
//# sourceMappingURL=extractLoader.js.map