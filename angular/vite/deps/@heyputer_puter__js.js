import {
  __commonJS,
  __require,
  __spreadProps,
  __spreadValues,
  __toESM
} from "./chunk-VL5VAURS.js";

// node_modules/@heyputer/putility/src/bases/BasicBase.js
var require_BasicBase = __commonJS({
  "node_modules/@heyputer/putility/src/bases/BasicBase.js"(exports2, module2) {
    var BasicBase = class _BasicBase {
      /**
       * Gets the inheritance chain for the current instance, starting from the most derived class
       * and working up to BasicBase (excluded).
       * @returns {Array<Function>} Array of constructor functions in inheritance order
       */
      _get_inheritance_chain() {
        const chain = [];
        let cls = this.constructor;
        while (cls && cls !== _BasicBase) {
          chain.push(cls);
          cls = cls.__proto__;
        }
        return chain.reverse();
      }
      /**
       * Merges static array properties from all classes in the inheritance chain.
       * Avoids duplicating the same array reference from contiguous members
       * of the inheritance chain (useful when using the decorator pattern with
       * multiple classes sharing a common base)
       * @param {string} key - The name of the static property to merge
       * @returns {Array} Combined array containing all values from the inheritance chain
       */
      _get_merged_static_array(key) {
        const chain = this._get_inheritance_chain();
        const values = [];
        let last = null;
        for (const cls of chain) {
          if (cls[key] && cls[key] !== last) {
            last = cls[key];
            values.push(...cls[key]);
          }
        }
        return values;
      }
      /**
       * Merges static object properties from all classes in the inheritance chain.
       * Properties from derived classes override those from base classes.
       * @param {string} key - The name of the static property to merge
       * @returns {Object} Combined object containing all properties from the inheritance chain
       */
      _get_merged_static_object(key) {
        const chain = this._get_inheritance_chain();
        const values = {};
        for (const cls of chain) {
          if (cls[key]) {
            Object.assign(values, cls[key]);
          }
        }
        return values;
      }
    };
    module2.exports = {
      BasicBase
    };
  }
});

// node_modules/@heyputer/putility/src/bases/FeatureBase.js
var require_FeatureBase = __commonJS({
  "node_modules/@heyputer/putility/src/bases/FeatureBase.js"(exports2, module2) {
    var { BasicBase } = require_BasicBase();
    var FeatureBase = class extends BasicBase {
      constructor(parameters, ...a2) {
        super(parameters, ...a2);
        this._ = {
          features: this._get_merged_static_array("FEATURES")
        };
        for (const feature of this._.features) {
          feature.install_in_instance(
            this,
            {
              parameters: parameters || {}
            }
          );
        }
      }
    };
    module2.exports = {
      FeatureBase
    };
  }
});

// node_modules/@heyputer/putility/src/features/NodeModuleDIFeature.js
var require_NodeModuleDIFeature = __commonJS({
  "node_modules/@heyputer/putility/src/features/NodeModuleDIFeature.js"(exports2, module2) {
    module2.exports = {
      install_in_instance: (instance, { parameters }) => {
        const modules = instance._get_merged_static_object("MODULES");
        if (parameters.modules) {
          for (const k2 in parameters.modules) {
            modules[k2] = parameters.modules[k2];
          }
        }
        instance.modules = modules;
        instance.require = (name) => {
          if (instance.modules[name]) {
            return instance.modules[name];
          }
          return __require(name);
        };
      }
    };
  }
});

// node_modules/@heyputer/putility/src/features/PropertiesFeature.js
var require_PropertiesFeature = __commonJS({
  "node_modules/@heyputer/putility/src/features/PropertiesFeature.js"(exports2, module2) {
    module2.exports = {
      name: "Properties",
      depends: ["Listeners"],
      install_in_instance: (instance, { parameters }) => {
        const properties = instance._get_merged_static_object("PROPERTIES");
        instance.onchange = (name, callback) => {
          instance._.properties[name].listeners.push(callback);
        };
        instance._.properties = {};
        for (const k2 in properties) {
          const state = {
            definition: properties[k2],
            listeners: [],
            value: void 0
          };
          instance._.properties[k2] = state;
          let spec = null;
          if (typeof properties[k2] === "object") {
            spec = properties[k2];
            if (spec.factory) {
              spec.value = spec.factory({ parameters });
            }
          } else if (typeof properties[k2] === "function") {
            spec = {};
            spec.value = properties[k2]();
          }
          if (spec === null) {
            throw new Error("this will never happen");
          }
          Object.defineProperty(instance, k2, {
            get: () => {
              return state.value;
            },
            set: (value) => {
              for (const listener of instance._.properties[k2].listeners) {
                listener(value, {
                  old_value: instance[k2]
                });
              }
              const old_value = instance[k2];
              const intermediate_value = value;
              if (spec.adapt) {
                value = spec.adapt(value);
              }
              state.value = value;
              if (spec.post_set) {
                spec.post_set.call(instance, value, {
                  intermediate_value,
                  old_value
                });
              }
            }
          });
          state.value = spec.value;
          if (properties[k2].construct) {
            const k_cons = typeof properties[k2].construct === "string" ? properties[k2].construct : k2;
            instance[k2] = parameters[k_cons];
          }
        }
      }
    };
  }
});

// node_modules/@heyputer/putility/src/features/TraitsFeature.js
var require_TraitsFeature = __commonJS({
  "node_modules/@heyputer/putility/src/features/TraitsFeature.js"(exports2, module2) {
    module2.exports = {
      // old implementation
      install_in_instance_: (instance, { parameters }) => {
        const impls = instance._get_merged_static_object("IMPLEMENTS");
        instance._.impls = {};
        for (const impl_name in impls) {
          const impl = impls[impl_name];
          const bound_impl = {};
          for (const method_name in impl) {
            const fn = impl[method_name];
            bound_impl[method_name] = fn.bind(instance);
          }
          instance._.impls[impl_name] = bound_impl;
        }
        instance.as = (trait_name) => instance._.impls[trait_name];
        instance.list_traits = () => Object.keys(instance._.impls);
      },
      // new implementation
      install_in_instance: (instance, { parameters }) => {
        const chain = instance._get_inheritance_chain();
        instance._.impls = {};
        instance.as = (trait_name) => instance._.impls[trait_name];
        instance.list_traits = () => Object.keys(instance._.impls);
        instance.mixin = (name, impl) => instance._.impls[name] = impl;
        for (const cls of chain) {
          const cls_traits = cls.IMPLEMENTS;
          if (!cls_traits) continue;
          const trait_keys = [
            ...Object.getOwnPropertySymbols(cls_traits),
            ...Object.keys(cls_traits)
          ];
          for (const trait_name of trait_keys) {
            const impl = instance._.impls[trait_name] ?? (instance._.impls[trait_name] = {});
            const cls_impl = cls_traits[trait_name];
            for (const method_name in cls_impl) {
              const fn = cls_impl[method_name];
              impl[method_name] = fn.bind(instance);
            }
          }
        }
      }
    };
  }
});

// node_modules/@heyputer/putility/src/features/NariMethodsFeature.js
var require_NariMethodsFeature = __commonJS({
  "node_modules/@heyputer/putility/src/features/NariMethodsFeature.js"(exports2, module2) {
    module2.exports = {
      readme: `
        Normalized Asynchronous Request Invocation (NARI) Methods Feature

        This feature allows a class to define "Nari methods", which are methods
        that support both async/await and callback-style invocation, have
        positional arguments, and an options argument.

        "the expected interface for methods in puter.js"

        The underlying method will receive parameters as an object, with the
        positional arguments as keys in the object. The options argument will
        be merged into the parameters object unless the method spec specifies
        \`separate_options: true\`.

        Example:

        \`\`\`
        class MyClass extends AdvancedBase {
            static NARI_METHODS = {
                myMethod: {
                    positional: ['param1', 'param2'],
                    fn: ({ param1, param2 }) => {
                        return param1 + param2;
                    }
                }
            }
        }

        const instance = new MyClass();
        const result = instance.myMethod(1, 2); // returns 3
        \`\`\`

        The method can also be called with options and callbacks:

        \`\`\`
        instance.myMethod(1, 2, { option1: 'value' }, (result) => {
            console.log('success', result);
        }, (error) => {
            console.error('error', error);
        });
        \`\`\`
    `,
      install_in_instance: (instance) => {
        const nariMethodSpecs = instance._get_merged_static_object("NARI_METHODS");
        instance._.nariMethods = {};
        for (const method_name in nariMethodSpecs) {
          const spec = nariMethodSpecs[method_name];
          const bound_fn = spec.fn.bind(instance);
          instance._.nariMethods[method_name] = bound_fn;
          instance[method_name] = async (...args) => {
            const endArgsIndex = (() => {
              if (spec.firstarg_options) {
                if (typeof args[0] === "object") {
                  return 0;
                }
              }
              return spec.positional.length;
            })();
            const posArgs = args.slice(0, endArgsIndex);
            const endArgs = args.slice(endArgsIndex);
            const parameters = {};
            const options = {};
            const callbacks = {};
            for (const [index, arg] of posArgs.entries()) {
              parameters[spec.positional[index]] = arg;
            }
            if (typeof endArgs[0] === "object") {
              Object.assign(options, endArgs[0]);
              endArgs.shift();
            }
            if (typeof endArgs[0] === "function") {
              callbacks.success = endArgs[0];
              endArgs.shift();
            } else if (options.success) {
              callbacks.success = options.success;
            }
            if (typeof endArgs[0] === "function") {
              callbacks.error = endArgs[0];
              endArgs.shift();
            } else if (options.error) {
              callbacks.error = options.error;
            }
            if (spec.separate_options) {
              parameters.options = options;
            } else {
              Object.assign(parameters, options);
            }
            let retval;
            try {
              retval = await bound_fn(parameters);
            } catch (e2) {
              if (callbacks.error) {
                callbacks.error(e2);
              } else {
                throw e2;
              }
            }
            if (callbacks.success) {
              callbacks.success(retval);
            }
            return retval;
          };
        }
      }
    };
  }
});

// node_modules/@heyputer/putility/src/traits/traits.js
var require_traits = __commonJS({
  "node_modules/@heyputer/putility/src/traits/traits.js"(exports2, module2) {
    module2.exports = {
      TTopics: Symbol("TTopics"),
      TDetachable: Symbol("TDetachable"),
      TLogger: Symbol("TLogger"),
      AS: (obj, trait) => {
        if (obj.constructor && obj.constructor.IMPLEMENTS && obj.constructor.IMPLEMENTS[trait]) {
          return obj.as(trait);
        }
        return obj;
      }
    };
  }
});

// node_modules/@heyputer/putility/src/libs/listener.js
var require_listener = __commonJS({
  "node_modules/@heyputer/putility/src/libs/listener.js"(exports2, module2) {
    var { FeatureBase } = require_FeatureBase();
    var { TDetachable } = require_traits();
    var MultiDetachable = class extends FeatureBase {
      static FEATURES = [
        require_TraitsFeature()
      ];
      constructor() {
        super();
        this.delegates = [];
        this.detached_ = false;
      }
      add(delegate) {
        if (this.detached_) {
          delegate.detach();
          return;
        }
        this.delegates.push(delegate);
      }
      static IMPLEMENTS = {
        [TDetachable]: {
          detach() {
            this.detached_ = true;
            for (const delegate of this.delegates) {
              delegate.detach();
            }
          }
        }
      };
    };
    var AlsoDetachable = class extends FeatureBase {
      static FEATURES = [
        require_TraitsFeature()
      ];
      constructor() {
        super();
        this.also = () => {
        };
      }
      also(also) {
        this.also = also;
        return this;
      }
      static IMPLEMENTS = {
        [TDetachable]: {
          detach() {
            this.detach_();
            this.also();
          }
        }
      };
    };
    var RemoveFromArrayDetachable = class extends AlsoDetachable {
      constructor(array, element) {
        super();
        this.array = new WeakRef(array);
        this.element = element;
      }
      detach_() {
        const array = this.array.deref();
        if (!array) return;
        const index = array.indexOf(this.element);
        if (index !== -1) {
          array.splice(index, 1);
        }
      }
    };
    module2.exports = {
      MultiDetachable,
      RemoveFromArrayDetachable
    };
  }
});

// node_modules/@heyputer/putility/src/features/TopicsFeature.js
var require_TopicsFeature = __commonJS({
  "node_modules/@heyputer/putility/src/features/TopicsFeature.js"(exports2, module2) {
    var { RemoveFromArrayDetachable } = require_listener();
    var { TTopics: TTopics2 } = require_traits();
    var { install_in_instance } = require_NodeModuleDIFeature();
    module2.exports = {
      install_in_instance: (instance, { parameters }) => {
        const topics = instance._get_merged_static_array("TOPICS");
        instance._.topics = {};
        for (const name of topics) {
          instance._.topics[name] = {
            listeners_: []
          };
        }
        instance.mixin(TTopics2, {
          pub: (k2, v2) => {
            if (k2.includes("!")) {
              throw new Error(
                '"!" in event name reserved for future use'
              );
            }
            const topic = instance._.topics[k2];
            if (!topic) {
              console.warn("missing topic: " + topic);
              return;
            }
            for (const lis of topic.listeners_) {
              lis();
            }
          },
          sub: (k2, fn) => {
            const topic = instance._.topics[k2];
            if (!topic) {
              console.warn("missing topic: " + topic);
              return;
            }
            topic.listeners_.push(fn);
            return new RemoveFromArrayDetachable(topic.listeners_, fn);
          }
        });
      }
    };
  }
});

// node_modules/@heyputer/putility/src/AdvancedBase.js
var require_AdvancedBase = __commonJS({
  "node_modules/@heyputer/putility/src/AdvancedBase.js"(exports2, module2) {
    var { FeatureBase } = require_FeatureBase();
    var AdvancedBase2 = class extends FeatureBase {
      static FEATURES = [
        require_NodeModuleDIFeature(),
        require_PropertiesFeature(),
        require_TraitsFeature(),
        require_NariMethodsFeature(),
        require_TopicsFeature()
      ];
    };
    module2.exports = {
      AdvancedBase: AdvancedBase2
    };
  }
});

// node_modules/@heyputer/putility/src/features/ServiceFeature.js
var require_ServiceFeature = __commonJS({
  "node_modules/@heyputer/putility/src/features/ServiceFeature.js"(exports2, module2) {
    var { TTopics: TTopics2 } = require_traits();
    module2.exports = {
      install_in_instance: (instance, { parameters }) => {
        const hooks = instance._get_merged_static_array("HOOKS");
        instance._.init_hooks = instance._.init_hooks ?? [];
        for (const spec of hooks) {
          instance._.init_hooks.push(() => {
            const service_entry = instance._.context.services.info(spec.service);
            const service_instance = service_entry.instance;
            service_instance.as(TTopics2).sub(
              spec.event,
              spec.do.bind(instance)
            );
          });
        }
      }
    };
  }
});

// node_modules/@heyputer/putility/src/concepts/Service.js
var require_Service = __commonJS({
  "node_modules/@heyputer/putility/src/concepts/Service.js"(exports2, module2) {
    var { AdvancedBase: AdvancedBase2 } = require_AdvancedBase();
    var ServiceFeature = require_ServiceFeature();
    var NOOP2 = async () => {
    };
    var TService = Symbol("TService");
    var Service = class extends AdvancedBase2 {
      /** @type {Array} Array of features this service supports */
      static FEATURES = [
        ServiceFeature
      ];
      /**
       * Handles events by calling the appropriate event handler
       * 
       * @param {string} id - The event identifier
       * @param {Array} args - Arguments to pass to the event handler
       * @returns {Promise<*>} The result of the event handler
       */
      async __on(id, args) {
        const handler = this.__get_event_handler(id);
        return await handler(id, ...args);
      }
      /**
       * Retrieves the event handler for a given event ID
       * 
       * @param {string} id - The event identifier
       * @returns {Function} The event handler function or NOOP if not found
       */
      __get_event_handler(id) {
        return this[`__on_${id}`]?.bind?.(this) || this.constructor[`__on_${id}`]?.bind?.(this.constructor) || NOOP2;
      }
      /**
       * Factory method to create a new service instance
       * 
       * @param {Object} config - Configuration object
       * @param {Object} config.parameters - Parameters for service construction
       * @param {Object} config.context - Context for the service
       * @returns {Service} A new service instance
       */
      static create({ parameters, context }) {
        const ins = new this();
        ins._.context = context;
        ins.as(TService).construct(parameters);
        return ins;
      }
      static IMPLEMENTS = {
        /** @type {Object} Implementation of the TService trait */
        [TService]: {
          /**
           * Initializes the service by running init hooks and calling _init if present
           * 
           * @param {...*} a - Arguments to pass to _init method
           * @returns {*} Result of _init method if it exists
           */
          init(...a2) {
            if (this._.init_hooks) {
              for (const hook of this._.init_hooks) {
                hook.call(this);
              }
            }
            if (!this._init) return;
            return this._init(...a2);
          },
          /**
           * Constructs the service with given parameters
           * 
           * @param {Object} o - Parameters object
           * @returns {*} Result of _construct method if it exists
           */
          construct(o2) {
            this.$parameters = {};
            for (const k2 in o2) this.$parameters[k2] = o2[k2];
            if (!this._construct) return;
            return this._construct(o2);
          },
          /**
           * Gets the dependencies for this service
           * 
           * @returns {Array} Array of dependencies
           */
          get_depends() {
            return [
              ...this.constructor.DEPENDS ?? [],
              ...this.get_depends?.() ?? []
            ];
          }
        }
      };
    };
    module2.exports = {
      TService,
      Service
    };
  }
});

// node_modules/@heyputer/putility/src/system/ServiceManager.js
var require_ServiceManager = __commonJS({
  "node_modules/@heyputer/putility/src/system/ServiceManager.js"(exports2, module2) {
    var { AdvancedBase: AdvancedBase2 } = require_AdvancedBase();
    var { TService } = require_Service();
    var StatusEnum = {
      Registering: "registering",
      Pending: "pending",
      Initializing: "initializing",
      Running: "running"
    };
    var ServiceManager = class extends AdvancedBase2 {
      constructor({ context } = {}) {
        super();
        this.context = context;
        this.services_l_ = [];
        this.services_m_ = {};
        this.service_infos_ = {};
        this.init_listeners_ = [];
        this.waiting_ = {};
      }
      async register(name, factory, options = {}) {
        await new Promise((rslv) => setTimeout(rslv, 0));
        const ins = factory.create({
          parameters: options.parameters ?? {},
          context: this.context
        });
        const entry = {
          name,
          instance: ins,
          status: StatusEnum.Registering
        };
        this.services_l_.push(entry);
        this.services_m_[name] = entry;
        await this.maybe_init_(name);
      }
      info(name) {
        return this.services_m_[name];
      }
      get(name) {
        const info = this.services_m_[name];
        if (!info) throw new Error(`Service not registered: ${name}`);
        if (info.status !== StatusEnum.Running) {
          return void 0;
        }
        return info.instance;
      }
      async aget(name) {
        await this.wait_for_init([name]);
        return this.get(name);
      }
      /**
       * Wait for the specified list of services to be initialized.
       * @param {*} depends - list of services to wait for
       */
      async wait_for_init(depends) {
        let check;
        await new Promise((rslv) => {
          check = () => {
            const waiting_for = this.get_waiting_for_(depends);
            if (waiting_for.length === 0) {
              const i2 = this.init_listeners_.indexOf(check);
              if (i2 !== -1) {
                this.init_listeners_.splice(i2, 1);
              }
              rslv();
              return true;
            }
          };
          if (check()) return;
          this.init_listeners_.push(check);
        });
      }
      get_waiting_for_(depends) {
        const waiting_for = [];
        for (const depend of depends) {
          const depend_entry = this.services_m_[depend];
          if (!depend_entry) {
            waiting_for.push(depend);
            continue;
          }
          if (depend_entry.status !== StatusEnum.Running) {
            waiting_for.push(depend);
          }
        }
        return waiting_for;
      }
      async maybe_init_(name) {
        const entry = this.services_m_[name];
        const depends = entry.instance.as(TService).get_depends();
        const waiting_for = this.get_waiting_for_(depends);
        if (waiting_for.length === 0) {
          await this.init_service_(name);
          return;
        }
        for (const dependency of waiting_for) {
          if (!this.waiting_[dependency]) {
            this.waiting_[dependency] = /* @__PURE__ */ new Set();
          }
          this.waiting_[dependency].add(name);
        }
        entry.status = StatusEnum.Pending;
        entry.statusWaitingFor = waiting_for;
      }
      // called when a service has all of its dependencies initialized
      // and is ready to be initialized itself
      async init_service_(name, modifiers = {}) {
        const entry = this.services_m_[name];
        entry.status = StatusEnum.Initializing;
        const service_impl = entry.instance.as(TService);
        await service_impl.init();
        entry.status = StatusEnum.Running;
        entry.statusStartTS = /* @__PURE__ */ new Date();
        const maybe_ready_set = this.waiting_[name];
        const promises = [];
        if (maybe_ready_set) {
          for (const dependent of maybe_ready_set.values()) {
            promises.push(this.maybe_init_(dependent, {
              no_init_listeners: true
            }));
          }
        }
        await Promise.all(promises);
        if (!modifiers.no_init_listeners) {
          for (const lis of this.init_listeners_) {
            await lis();
          }
        }
      }
    };
    module2.exports = {
      ServiceManager
    };
  }
});

// node_modules/@heyputer/putility/src/libs/promise.js
var require_promise = __commonJS({
  "node_modules/@heyputer/putility/src/libs/promise.js"(exports2, module2) {
    var TeePromise5 = class {
      static STATUS_PENDING = Symbol("pending");
      static STATUS_RUNNING = {};
      static STATUS_DONE = Symbol("done");
      constructor() {
        this.status_ = this.constructor.STATUS_PENDING;
        this.donePromise = new Promise((resolve, reject) => {
          this.doneResolve = resolve;
          this.doneReject = reject;
        });
      }
      get status() {
        return this.status_;
      }
      set status(status) {
        this.status_ = status;
        if (status === this.constructor.STATUS_DONE) {
          this.doneResolve();
        }
      }
      resolve(value) {
        this.status_ = this.constructor.STATUS_DONE;
        this.doneResolve(value);
      }
      awaitDone() {
        return this.donePromise;
      }
      then(fn, ...a2) {
        return this.donePromise.then(fn, ...a2);
      }
      reject(err) {
        this.status_ = this.constructor.STATUS_DONE;
        this.doneReject(err);
      }
      /**
       * @deprecated use then() instead
       */
      onComplete(fn) {
        return this.then(fn);
      }
    };
    var Lock = class {
      constructor() {
        this._locked = false;
        this._waiting = [];
      }
      async acquire(callback) {
        await new Promise((resolve) => {
          if (!this._locked) {
            this._locked = true;
            resolve();
          } else {
            this._waiting.push({
              resolve
            });
          }
        });
        if (callback) {
          let retval;
          try {
            retval = await callback();
          } finally {
            this.release();
          }
          return retval;
        }
      }
      release() {
        if (this._waiting.length > 0) {
          const { resolve } = this._waiting.shift();
          resolve();
        } else {
          this._locked = false;
        }
      }
    };
    var RWLock2 = class {
      static TYPE_READ = Symbol("read");
      static TYPE_WRITE = Symbol("write");
      constructor() {
        this.queue = [];
        this.readers_ = 0;
        this.writer_ = false;
        this.on_empty_ = () => {
        };
        this.mode = this.constructor.TYPE_READ;
      }
      get effective_mode() {
        if (this.readers_ > 0) return this.constructor.TYPE_READ;
        if (this.writer_) return this.constructor.TYPE_WRITE;
        return void 0;
      }
      push_(item) {
        if (this.readers_ === 0 && !this.writer_) {
          this.mode = item.type;
        }
        this.queue.push(item);
        this.check_queue_();
      }
      check_queue_() {
        if (this.queue.length === 0) {
          if (this.readers_ === 0 && !this.writer_) {
            this.on_empty_();
          }
          return;
        }
        const peek = () => this.queue[0];
        if (this.readers_ === 0 && !this.writer_) {
          this.mode = peek().type;
        }
        if (this.mode === this.constructor.TYPE_READ) {
          while (peek()?.type === this.constructor.TYPE_READ) {
            const item2 = this.queue.shift();
            this.readers_++;
            (async () => {
              await item2.p_unlock;
              this.readers_--;
              this.check_queue_();
            })();
            item2.p_operation.resolve();
          }
          return;
        }
        if (this.writer_) return;
        const item = this.queue.shift();
        this.writer_ = true;
        (async () => {
          await item.p_unlock;
          this.writer_ = false;
          this.check_queue_();
        })();
        item.p_operation.resolve();
      }
      async rlock() {
        const p_read = new TeePromise5();
        const p_unlock = new TeePromise5();
        const handle = {
          unlock: () => {
            p_unlock.resolve();
          }
        };
        this.push_({
          type: this.constructor.TYPE_READ,
          p_operation: p_read,
          p_unlock
        });
        await p_read;
        return handle;
      }
      async wlock() {
        const p_write = new TeePromise5();
        const p_unlock = new TeePromise5();
        const handle = {
          unlock: () => {
            p_unlock.resolve();
          }
        };
        this.push_({
          type: this.constructor.TYPE_WRITE,
          p_operation: p_write,
          p_unlock
        });
        await p_write;
        return handle;
      }
    };
    var asyncSafeSetInterval = async (callback, delay, args, options) => {
      args = args ?? [];
      options = options ?? {};
      const { onBehindSchedule } = options;
      const sleep = (ms) => new Promise((rslv) => setTimeout(rslv, ms));
      for (; ; ) {
        await sleep(delay);
        const ts_start = Date.now();
        await callback(...args);
        const ts_end = Date.now();
        const runtime = ts_end - ts_start;
        const sleep_time = delay - runtime;
        if (sleep_time < 0) {
          if (onBehindSchedule) {
            const cancel = await onBehindSchedule(-sleep_time);
            if (cancel) {
              return;
            }
          }
        } else {
          await sleep(sleep_time);
        }
      }
    };
    var raceCase = async (promise_map) => {
      return Promise.race(Object.entries(promise_map).map(
        ([key, promise]) => promise.then((value) => [key, value])
      ));
    };
    module2.exports = {
      TeePromise: TeePromise5,
      Lock,
      RWLock: RWLock2,
      asyncSafeSetInterval,
      raceCase
    };
  }
});

// node_modules/@heyputer/putility/src/libs/context.js
var require_context = __commonJS({
  "node_modules/@heyputer/putility/src/libs/context.js"(exports2, module2) {
    var Context = class _Context {
      /**
       * Creates a new Context instance with the provided values.
       * @param {Object} [values={}] - Initial values to set on the context, with their property descriptors preserved
       */
      constructor(values = {}) {
        const descs = Object.getOwnPropertyDescriptors(values);
        for (const k2 in descs) {
          Object.defineProperty(this, k2, descs[k2]);
        }
      }
      /**
       * Creates a sub-context that follows specific properties from a source object.
       * The returned context will have getters that reference the source object's properties.
       * @param {Object} source - The source object to follow properties from
       * @param {string[]} keys - Array of property names to follow from the source
       * @returns {Context} A new sub-context with getters pointing to the source properties
       */
      follow(source, keys) {
        const values = {};
        for (const k2 of keys) {
          Object.defineProperty(values, k2, {
            get: () => source[k2]
          });
        }
        return this.sub(values);
      }
      /**
       * Creates a sub-context that inherits from the current context with additional or overridden values.
       * Nested Context instances are recursively sub-contexted with corresponding new values.
       * @param {Object} [newValues={}] - New values to add or override in the sub-context
       * @returns {Context} A new context that inherits from this context with the new values applied
       */
      sub(newValues) {
        if (newValues === void 0) newValues = {};
        const sub = Object.create(this);
        const alreadyApplied = {};
        for (const k2 in sub) {
          if (sub[k2] instanceof _Context) {
            const newValuesForK = newValues.hasOwnProperty(k2) ? newValues[k2] : void 0;
            sub[k2] = sub[k2].sub(newValuesForK);
            alreadyApplied[k2] = true;
          }
        }
        const descs = Object.getOwnPropertyDescriptors(newValues);
        for (const k2 in descs) {
          if (alreadyApplied[k2]) continue;
          Object.defineProperty(sub, k2, descs[k2]);
        }
        return sub;
      }
    };
    module2.exports = {
      Context
    };
  }
});

// node_modules/@heyputer/putility/src/libs/log.js
var require_log = __commonJS({
  "node_modules/@heyputer/putility/src/libs/log.js"(exports2, module2) {
    var { AdvancedBase: AdvancedBase2 } = require_AdvancedBase();
    var { TLogger, AS } = require_traits();
    var ArrayLogger = class extends AdvancedBase2 {
      static PROPERTIES = {
        buffer: {
          factory: () => []
        }
      };
      static IMPLEMENTS = {
        [TLogger]: {
          /**
           * Logs a message by storing it in the internal buffer array.
           * @param {string} level - The log level (e.g., 'info', 'warn', 'error')
           * @param {string} message - The log message
           * @param {Object} fields - Additional fields to include with the log entry
           * @param {Array} values - Additional values to log
           */
          log(level, message, fields, values) {
            this.buffer.push({ level, message, fields, values });
          }
        }
      };
    };
    var CategorizedToggleLogger = class extends AdvancedBase2 {
      static PROPERTIES = {
        categories: {
          description: "categories that are enabled",
          factory: () => ({})
        },
        delegate: {
          construct: true,
          value: null,
          adapt: (v2) => AS(v2, TLogger)
        }
      };
      static IMPLEMENTS = {
        [TLogger]: {
          /**
           * Logs a message only if the category specified in fields is enabled.
           * @param {string} level - The log level
           * @param {string} message - The log message
           * @param {Object} fields - Fields object that should contain a 'category' property
           * @param {Array} values - Additional values to log
           * @returns {*} Result from delegate logger if category is enabled, undefined otherwise
           */
          log(level, message, fields, values) {
            const category = fields.category;
            if (!this.categories[category]) return;
            return this.delegate.log(level, message, fields, values);
          }
        }
      };
      /**
       * Enables logging for the specified category.
       * @param {string} category - The category to enable
       */
      on(category) {
        this.categories[category] = true;
      }
      /**
       * Disables logging for the specified category.
       * @param {string} category - The category to disable
       */
      off(category) {
        delete this.categories[category];
      }
    };
    var ToggleLogger = class extends AdvancedBase2 {
      static PROPERTIES = {
        enabled: {
          construct: true,
          value: true
        },
        delegate: {
          construct: true,
          value: null,
          adapt: (v2) => AS(v2, TLogger)
        }
      };
      static IMPLEMENTS = {
        [TLogger]: {
          /**
           * Logs a message only if the logger is enabled.
           * @param {string} level - The log level
           * @param {string} message - The log message
           * @param {Object} fields - Additional fields to include
           * @param {Array} values - Additional values to log
           * @returns {*} Result from delegate logger if enabled, undefined otherwise
           */
          log(level, message, fields, values) {
            if (!this.enabled) return;
            return this.delegate.log(level, message, fields, values);
          }
        }
      };
    };
    var ConsoleLogger = class extends AdvancedBase2 {
      static MODULES = {
        // This would be cool, if it worked in a browser.
        // util: require('util'),
        util: {
          inspect: (v2) => v2
          // inspect: v => {
          //     if (typeof v === 'string') return v;
          //     try {
          //         return JSON.stringify(v);
          //     } catch (e) {}
          //     return '' + v;
          // }
        }
      };
      static PROPERTIES = {
        console: {
          construct: true,
          factory: () => console
        },
        format: () => ({
          info: {
            ansii: "\x1B[32;1m"
          },
          warn: {
            ansii: "\x1B[33;1m"
          },
          error: {
            ansii: "\x1B[31;1m",
            err: true
          },
          debug: {
            ansii: "\x1B[34;1m"
          }
        })
      };
      static IMPLEMENTS = {
        [TLogger]: {
          /**
           * Logs a formatted message to the console with color coding based on log level.
           * @param {string} level - The log level (info, warn, error, debug)
           * @param {string} message - The main log message
           * @param {Object} fields - Additional fields to display
           * @param {Array} values - Additional values to pass to console
           */
          log(level, message, fields, values) {
            const require2 = this.require;
            const util = require2("util");
            const l2 = this.format[level];
            let str = "";
            str += `${l2.ansii}[${level.toUpperCase()}]\x1B[0m `;
            str += message;
            if (Object.keys(fields).length) {
              str += " ";
              str += Object.entries(fields).map(([k2, v2]) => `
  ${k2}=${util.inspect(v2)}`).join(" ") + "\n";
            }
            (this.console ?? console)[l2.err ? "error" : "log"](str, ...values);
          }
        }
      };
    };
    var PrefixLogger = class extends AdvancedBase2 {
      static PROPERTIES = {
        prefix: {
          construct: true,
          value: ""
        },
        delegate: {
          construct: true,
          value: null,
          adapt: (v2) => AS(v2, TLogger)
        }
      };
      static IMPLEMENTS = {
        [TLogger]: {
          /**
           * Logs a message with the configured prefix prepended to the message.
           * @param {string} level - The log level
           * @param {string} message - The original message
           * @param {Object} fields - Additional fields to include
           * @param {Array} values - Additional values to log
           * @returns {*} Result from the delegate logger
           */
          log(level, message, fields, values) {
            return this.delegate.log(
              level,
              this.prefix + message,
              fields,
              values
            );
          }
        }
      };
    };
    var FieldsLogger = class extends AdvancedBase2 {
      static PROPERTIES = {
        fields: {
          construct: true,
          factory: () => ({})
        },
        delegate: {
          construct: true,
          value: null,
          adapt: (v2) => AS(v2, TLogger)
        }
      };
      static IMPLEMENTS = {
        [TLogger]: {
          /**
           * Logs a message with the configured default fields merged with provided fields.
           * @param {string} level - The log level
           * @param {string} message - The log message
           * @param {Object} fields - Additional fields that will be merged with default fields
           * @param {Array} values - Additional values to log
           * @returns {*} Result from the delegate logger
           */
          log(level, message, fields, values) {
            return this.delegate.log(
              level,
              message,
              Object.assign({}, this.fields, fields),
              values
            );
          }
        }
      };
    };
    var LoggerFacade = class _LoggerFacade extends AdvancedBase2 {
      static PROPERTIES = {
        impl: {
          value: () => {
            return new ConsoleLogger();
          },
          adapt: (v2) => AS(v2, TLogger),
          construct: true
        },
        cat: {
          construct: true
        }
      };
      static IMPLEMENTS = {
        [TLogger]: {
          /**
           * Basic log implementation (currently just outputs to console).
           * @param {string} level - The log level
           * @param {string} message - The log message
           * @param {Object} fields - Additional fields
           * @param {Array} values - Additional values
           */
          log(level, message, fields, values) {
            console.log();
          }
        }
      };
      /**
       * Creates a new logger facade with additional default fields.
       * @param {Object} fields - Default fields to add to all log entries
       * @returns {LoggerFacade} New logger facade instance with the specified fields
       */
      fields(fields) {
        const new_delegate = new FieldsLogger({
          fields,
          delegate: this.impl
        });
        return new _LoggerFacade({
          impl: new_delegate
        });
      }
      /**
       * Logs an info-level message.
       * @param {string} message - The message to log
       * @param {...*} values - Additional values to include in the log
       */
      info(message, ...values) {
        this.impl.log("info", message, {}, values);
      }
      /**
       * Enables logging for a specific category.
       * @param {string} category - The category to enable
       */
      on(category) {
        this.cat.on(category);
      }
      /**
       * Disables logging for a specific category.
       * @param {string} category - The category to disable
       */
      off(category) {
        this.cat.off(category);
      }
    };
    module2.exports = {
      ArrayLogger,
      CategorizedToggleLogger,
      ToggleLogger,
      ConsoleLogger,
      PrefixLogger,
      FieldsLogger,
      LoggerFacade
    };
  }
});

// node_modules/@heyputer/putility/src/libs/string.js
var require_string = __commonJS({
  "node_modules/@heyputer/putility/src/libs/string.js"(exports2, module2) {
    var quot = (str) => {
      if (str === void 0) return "[undefined]";
      if (str === null) return "[null]";
      if (typeof str === "function") return "[function]";
      if (typeof str === "object") return "[object]";
      if (typeof str === "number") return "(" + str + ")";
      str = "" + str;
      str = str.replace(/["`]/g, (m2) => m2 === '"' ? "`" : '"');
      str = JSON.stringify("" + str);
      str = str.replace(/["`]/g, (m2) => m2 === '"' ? "`" : '"');
      return str;
    };
    var osclink = (url, text) => {
      if (!text) text = url;
      return `\x1B]8;;${url}\x1B\\${text}\x1B]8;;\x1B\\`;
    };
    var format_as_usd = (amount) => {
      if (amount < 0.01) {
        if (amount < 1e-5) {
          return "$" + amount.toExponential(2);
        }
        return "$" + amount.toFixed(5);
      }
      return "$" + amount.toFixed(2);
    };
    var wrap_text = (text, width = 71) => {
      const out = [];
      const paras = text.split(/\r?\n\s*\r?\n/);
      for (const p2 of paras) {
        const words = p2.trim().replace(/\s+/g, " ").split(" ");
        if (words.length === 1 && words[0] === "") {
          out.push("");
          continue;
        }
        let line = "";
        for (const w2 of words) {
          if (line.length === 0) {
            line = w2;
          } else if (line.length + 1 + w2.length <= width) {
            line += " " + w2;
          } else {
            out.push(line);
            line = w2;
          }
        }
        if (line) out.push(line);
        out.push("");
      }
      if (out.length && out[out.length - 1] === "") out.pop();
      return out;
    };
    var ansi_visible_length = (str) => {
      const escape_regexes = [
        {
          name: "oscAll",
          re: "/\x1B][^\x07]*(?:\x07|\x1B\\)/g"
        },
        {
          name: "osc8:start",
          re: /\x1B\]8;[^\x07\x1B\\]*;[^\x07\x1B\\]*(?:\x07|\x1B\\)/g
        },
        {
          name: "osc8:end",
          re: /\x1B\]8;;(?:\x07|\x1B\\)/g
        },
        {
          name: "csi",
          re: /\x1B\[[0-?]*[ -/]*[@-~]/g
        }
        // /\x1b\[[0-9;]*m/g,
      ];
      return escape_regexes.reduce(
        (str2, { re }) => str2.replace(re, ""),
        str
      ).length;
    };
    module2.exports = {
      quot,
      osclink,
      format_as_usd,
      wrap_text,
      ansi_visible_length
    };
  }
});

// node_modules/@heyputer/putility/src/libs/time.js
var require_time = __commonJS({
  "node_modules/@heyputer/putility/src/libs/time.js"(exports2, module2) {
    var TimeUnit = class {
      static valueOf() {
        return this.value;
      }
    };
    var MILLISECOND = class extends TimeUnit {
      static value = 1;
    };
    var SECOND = class extends TimeUnit {
      static value = 1e3 * MILLISECOND;
    };
    var MINUTE = class extends TimeUnit {
      static value = 60 * SECOND;
    };
    var HOUR = class extends TimeUnit {
      static value = 60 * MINUTE;
    };
    var DAY = class extends TimeUnit {
      static value = 24 * HOUR;
    };
    var module_epoch = Date.now();
    var module_epoch_d = /* @__PURE__ */ new Date();
    var display_time = (now) => {
      const pad2 = (n2) => String(n2).padStart(2, "0");
      const yyyy = now.getFullYear();
      const mm = pad2(now.getMonth() + 1);
      const dd = pad2(now.getDate());
      const HH = pad2(now.getHours());
      const MM = pad2(now.getMinutes());
      const SS = pad2(now.getSeconds());
      const time = `${HH}:${MM}:${SS}`;
      const needYear = yyyy !== module_epoch_d.getFullYear();
      const needMonth = needYear || now.getMonth() !== module_epoch_d.getMonth();
      const needDay = needMonth || now.getDate() !== module_epoch_d.getDate();
      if (needYear) return `${yyyy}-${mm}-${dd} ${time}`;
      if (needMonth) return `${mm}-${dd} ${time}`;
      if (needDay) return `${dd} ${time}`;
      return time;
    };
    module2.exports = {
      MILLISECOND,
      SECOND,
      MINUTE,
      HOUR,
      DAY,
      module_epoch,
      module_epoch_d,
      display_time
    };
  }
});

// node_modules/@heyputer/putility/src/libs/smol.js
var require_smol = __commonJS({
  "node_modules/@heyputer/putility/src/libs/smol.js"(exports2, module2) {
    var SmolUtil = class {
      // Array coercion
      static ensure_array(value) {
        return Array.isArray(value) ? value : [value];
      }
      // Variadic sum
      static add(...a2) {
        return a2.reduce((a3, b2) => a3 + b2, 0);
      }
      static split(str, sep, options = {}) {
        options = options || {};
        const { trim, discard_empty } = options;
        const operations = [];
        if (options.trim) {
          operations.push((a2) => a2.map((str2) => str2.trim()));
        }
        if (options.discard_empty) {
          operations.push((a2) => a2.filter((str2) => str2.length > 0));
        }
        let result = str.split(sep);
        for (const operation of operations) {
          result = operation(result);
        }
        return result;
      }
    };
    module2.exports = SmolUtil;
  }
});

// node_modules/@heyputer/putility/src/features/EmitterFeature.js
var require_EmitterFeature = __commonJS({
  "node_modules/@heyputer/putility/src/features/EmitterFeature.js"(exports2, module2) {
    module2.exports = ({ decorators } = {}) => ({
      install_in_instance(instance, { parameters }) {
        const state = instance._.emitterFeature = {};
        state.listeners_ = {};
        state.global_listeners_ = [];
        state.callbackDecorators = decorators || [];
        instance.emit = async (key, data, meta) => {
          meta = meta ?? {};
          const parts = key.split(".");
          const promises = [];
          for (let i2 = 0; i2 < state.global_listeners_.length; i2++) {
            let callback = state.global_listeners_[i2];
            for (const decorator of state.callbackDecorators) {
              callback = decorator(callback);
            }
            promises.push(callback(
              key,
              data,
              __spreadProps(__spreadValues({}, meta), { key })
            ));
          }
          for (let i2 = 0; i2 < parts.length; i2++) {
            const part = i2 === parts.length - 1 ? parts.join(".") : parts.slice(0, i2 + 1).join(".") + ".*";
            const listeners = state.listeners_[part];
            if (!listeners) continue;
            for (let i3 = 0; i3 < listeners.length; i3++) {
              let callback = listeners[i3];
              for (const decorator of state.callbackDecorators) {
                callback = decorator(callback);
              }
              promises.push(callback(data, __spreadProps(__spreadValues({}, meta), {
                key
              })));
            }
          }
          return await Promise.all(promises);
        };
        instance.on = (selector, callback) => {
          const listeners = state.listeners_[selector] || (state.listeners_[selector] = []);
          listeners.push(callback);
          const det = {
            detach: () => {
              const idx = listeners.indexOf(callback);
              if (idx !== -1) {
                listeners.splice(idx, 1);
              }
            }
          };
          return det;
        };
        instance.on_all = (callback) => {
          state.global_listeners_.push(callback);
        };
      }
    });
  }
});

// node_modules/@heyputer/putility/src/libs/event.js
var require_event = __commonJS({
  "node_modules/@heyputer/putility/src/libs/event.js"(exports2, module2) {
    var { AdvancedBase: AdvancedBase2 } = require_AdvancedBase();
    var EmitterFeature = require_EmitterFeature();
    var Emitter = class extends AdvancedBase2 {
      static FEATURES = [
        EmitterFeature()
      ];
    };
    module2.exports = { Emitter };
  }
});

// node_modules/@heyputer/putility/index.js
var require_putility = __commonJS({
  "node_modules/@heyputer/putility/index.js"(exports2, module2) {
    var { AdvancedBase: AdvancedBase2 } = require_AdvancedBase();
    var { Service } = require_Service();
    var { ServiceManager } = require_ServiceManager();
    var traits = require_traits();
    module2.exports = {
      AdvancedBase: AdvancedBase2,
      system: {
        ServiceManager
      },
      libs: {
        promise: require_promise(),
        context: require_context(),
        listener: require_listener(),
        log: require_log(),
        string: require_string(),
        time: require_time(),
        smol: require_smol(),
        event: require_event()
      },
      features: {
        EmitterFeature: require_EmitterFeature()
      },
      concepts: {
        Service
      },
      traits
    };
  }
});

// node_modules/@heyputer/kv.js/XMap.js
var require_XMap = __commonJS({
  "node_modules/@heyputer/kv.js/XMap.js"(exports2, module2) {
    "use strict";
    var XMap = class {
      #pool;
      /**
       * Creates an instance of XMap.
       * @param {Array} [entries=[]] - Initial set of key-value pairs to add to the map.
       */
      constructor(entries = []) {
        this.#pool = [new Map(entries)];
      }
      /**
       * Gets the total number of key-value pairs across all maps.
       * @return {number} The total number of key-value pairs.
       */
      get size() {
        return this.#pool.reduce((sum, map) => sum + map.size, 0);
      }
      /**
       * Removes all key-value pairs from the XMap.
       */
      clear() {
        this.#pool = [/* @__PURE__ */ new Map()];
      }
      /**
       * Deletes a key-value pair from the XMap.
       * @param {any} key - The key of the element to remove.
       * @return {boolean} True if an element in the XMap existed and has been removed,
       * or false if the element does not exist.
       */
      delete(key) {
        return this.#pool.some((map) => map.delete(key));
      }
      /**
       * Returns a specified element from the XMap.
       * @param {any} key - The key of the element to return.
       * @return {any} The element associated with the specified key, or undefined if the
       * key can't be found in the XMap.
       */
      get(key) {
        for (const map of this.#pool) {
          if (map.has(key)) {
            return map.get(key);
          }
        }
      }
      /**
       * Checks whether an element with the specified key exists in the XMap.
       * @param {any} key - The key to check for.
       * @return {boolean} True if an element with the specified key exists, otherwise false.
       */
      has(key) {
        return this.#pool.some((map) => map.has(key));
      }
      /**
       * Sets the value for the key in the XMap.
       * @param {any} key - The key of the element to add.
       * @param {any} value - The value of the element to add.
       * @return {XMap} The XMap instance, allowing for chaining.
       */
      set(key, value) {
        let targetMap = this.#pool[0];
        for (const map of this.#pool) {
          if (map.has(key)) {
            targetMap = map;
            break;
          }
        }
        if (!targetMap.has(key) && targetMap.size >= 8388608) {
          this.#pool.unshift(/* @__PURE__ */ new Map());
          targetMap = this.#pool[0];
        }
        targetMap.set(key, value);
        return this;
      }
      /**
       * Creates an iterator that contains all [key, value] pairs for each element in the XMap in insertion order.
       * @return {Iterator} An iterator for the XMap entries.
       */
      *[Symbol.iterator]() {
        for (const map of this.#pool) {
          yield* map;
        }
      }
      /**
       * Creates an iterator that contains the keys for each element in the XMap in insertion order.
       * @return {Iterator} An iterator for the XMap keys.
       */
      *keys() {
        for (const map of this.#pool) {
          yield* map.keys();
        }
      }
      /**
       * Creates an iterator that contains the values for each element in the XMap in insertion order.
       * @return {Iterator} An iterator for the XMap values.
       */
      *values() {
        for (const map of this.#pool) {
          yield* map.values();
        }
      }
      /**
       * Creates an iterator that contains an array of [key, value] for each element in the XMap in insertion order.
       * @return {Iterator} An iterator for the XMap entries.
       */
      *entries() {
        for (const map of this.#pool) {
          yield* map.entries();
        }
      }
      /**
       * Executes a provided function once for each XMap element.
       * @param {Function} callback - Function to execute for each element, taking three arguments:
       * value, key, and the XMap instance.
       * @param {any} [thisArg] - Value to use as this when executing callback.
       */
      forEach(callback, thisArg) {
        for (const [key, value] of this) {
          callback.call(thisArg, value, key, this);
        }
      }
    };
    module2.exports = XMap;
  }
});

// node_modules/@heyputer/kv.js/kv.js
var require_kv = __commonJS({
  "node_modules/@heyputer/kv.js/kv.js"(exports2, module2) {
    "use strict";
    var XMap = require_XMap();
    function simpleMatch(str, pattern) {
      const lowerStr = str.toLowerCase();
      const lowerPattern = pattern.toLowerCase();
      if (lowerPattern === "") return false;
      if (lowerPattern.indexOf("*") === -1 && lowerPattern.indexOf("?") === -1 && lowerPattern.indexOf("[") === -1 && lowerPattern.indexOf("{") === -1) {
        return lowerStr === lowerPattern;
      }
      let expandedPattern = lowerPattern;
      const braceMatch = expandedPattern.match(/\{([^}]+)\}/);
      if (braceMatch) {
        const options = braceMatch[1].split(",");
        const alternatives = options.map((opt) => expandedPattern.replace(braceMatch[0], opt.trim()));
        return alternatives.some((alt) => simpleMatch(str, alt));
      }
      let regexPattern = "";
      let i2 = 0;
      while (i2 < expandedPattern.length) {
        const char = expandedPattern[i2];
        if (char === "*") {
          regexPattern += ".*";
        } else if (char === "?") {
          regexPattern += ".";
        } else if (char === "[") {
          let j2 = i2 + 1;
          let charClass = "[";
          while (j2 < expandedPattern.length && expandedPattern[j2] !== "]") {
            charClass += expandedPattern[j2];
            j2++;
          }
          if (j2 < expandedPattern.length) {
            charClass += "]";
            regexPattern += charClass;
            i2 = j2;
          } else {
            regexPattern += "\\[";
          }
        } else {
          if (/[.+^${}()|\\]/.test(char)) {
            regexPattern += "\\" + char;
          } else {
            regexPattern += char;
          }
        }
        i2++;
      }
      try {
        const regex = new RegExp("^" + regexPattern + "$", "i");
        return regex.test(str);
      } catch (e2) {
        return lowerStr === lowerPattern;
      }
    }
    var CLEANUP_INTERVAL = 20;
    var kvjs2 = class {
      constructor(options = {}) {
        if (typeof options === "string") {
          options = { dbName: options };
        }
        this.store = new XMap();
        this.expireTimes = new XMap();
        this.db = null;
        this.dbName = options.dbName;
        this.dbVersion = options.dbVersion || 1;
        this.isIndexedDBAvailable = false;
        this.isInitialized = false;
        this.initPromise = null;
        this.storeSet = (key, value) => {
          this.store.set(key, value);
          this._initCleanupLoop(CLEANUP_INTERVAL);
          if (this.isIndexedDBAvailable && this.db) {
            this._persistToIndexedDB(key, value);
          }
        };
        this._initIndexedDB();
      }
      /**
       * Initialize IndexedDB if available in the browser environment
       * @private
       */
      _initIndexedDB() {
        if (typeof window !== "undefined" && window.indexedDB && this.dbName) {
          this.isIndexedDBAvailable = true;
          this.initPromise = this._setupIndexedDB();
        } else {
          this.isInitialized = true;
        }
      }
      /**
       * Set up IndexedDB database and load existing data
       * @private
       * @returns {Promise<void>}
       */
      async _setupIndexedDB() {
        try {
          this.db = await this._openDatabase();
          await this._loadFromIndexedDB();
          this.isInitialized = true;
        } catch (error) {
          console.warn("Failed to initialize IndexedDB:", error);
          this.isIndexedDBAvailable = false;
          this.isInitialized = true;
        }
      }
      /**
       * Open IndexedDB database
       * @private
       * @returns {Promise<IDBDatabase>}
       */
      _openDatabase() {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, this.dbVersion);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("store")) {
              db.createObjectStore("store", { keyPath: "key" });
            }
            if (!db.objectStoreNames.contains("expireTimes")) {
              db.createObjectStore("expireTimes", { keyPath: "key" });
            }
          };
        });
      }
      /**
       * Load existing data from IndexedDB into memory
       * @private
       * @returns {Promise<void>}
       */
      async _loadFromIndexedDB() {
        if (!this.db) return;
        try {
          const transaction = this.db.transaction(["store", "expireTimes"], "readonly");
          const storeObjectStore = transaction.objectStore("store");
          const expireTimesObjectStore = transaction.objectStore("expireTimes");
          const storeRequest = storeObjectStore.getAll();
          const expireTimesRequest = expireTimesObjectStore.getAll();
          const [storeData, expireTimesData] = await Promise.all([
            new Promise((resolve, reject) => {
              storeRequest.onsuccess = () => resolve(storeRequest.result);
              storeRequest.onerror = () => reject(storeRequest.error);
            }),
            new Promise((resolve, reject) => {
              expireTimesRequest.onsuccess = () => resolve(expireTimesRequest.result);
              expireTimesRequest.onerror = () => reject(expireTimesRequest.error);
            })
          ]);
          storeData.forEach((item) => {
            this.store.set(item.key, item.value);
          });
          expireTimesData.forEach((item) => {
            this.expireTimes.set(item.key, item.expireTime);
          });
          const currentTime = Date.now();
          for (const [key, expireTime] of this.expireTimes.entries()) {
            if (currentTime > expireTime) {
              this.store.delete(key);
              this.expireTimes.delete(key);
              this._removeFromIndexedDB(key);
            }
          }
        } catch (error) {
          console.warn("Failed to load data from IndexedDB:", error);
        }
      }
      /**
       * Persist a key-value pair to IndexedDB
       * @private
       * @param {*} key - The key to persist
       * @param {*} value - The value to persist
       */
      async _persistToIndexedDB(key, value) {
        if (!this.db) return;
        try {
          const transaction = this.db.transaction(["store"], "readwrite");
          const objectStore = transaction.objectStore("store");
          objectStore.put({ key, value });
        } catch (error) {
          console.warn("Failed to persist to IndexedDB:", error);
        }
      }
      /**
       * Persist expiration time to IndexedDB
       * @private
       * @param {*} key - The key
       * @param {number} expireTime - The expiration timestamp
       */
      async _persistExpirationToIndexedDB(key, expireTime) {
        if (!this.db) return;
        try {
          const transaction = this.db.transaction(["expireTimes"], "readwrite");
          const objectStore = transaction.objectStore("expireTimes");
          if (expireTime !== void 0) {
            objectStore.put({ key, expireTime });
          } else {
            objectStore.delete(key);
          }
        } catch (error) {
          console.warn("Failed to persist expiration to IndexedDB:", error);
        }
      }
      /**
       * Remove a key from IndexedDB
       * @private
       * @param {*} key - The key to remove
       */
      async _removeFromIndexedDB(key) {
        if (!this.db) return;
        try {
          const transaction = this.db.transaction(["store", "expireTimes"], "readwrite");
          const storeObjectStore = transaction.objectStore("store");
          const expireTimesObjectStore = transaction.objectStore("expireTimes");
          storeObjectStore.delete(key);
          expireTimesObjectStore.delete(key);
        } catch (error) {
          console.warn("Failed to remove from IndexedDB:", error);
        }
      }
      /**
       * Wait for IndexedDB initialization to complete
       * @returns {Promise<void>}
       */
      async waitForInitialization() {
        if (this.isInitialized) return;
        if (this.initPromise) {
          await this.initPromise;
        }
      }
      /**
       * Set the string value of a key with optional NX/XX/GET/EX/PX/EXAT/PXAT/KEEPTTL, GET, and expiration options.
       * @param {*} key - The key to set.
       * @param {*} value - The value to set.
       * @param {Object} [options] - An object with optional arguments.
       *                              NX (boolean): Set the key only if it does not exist.
       *                              XX (boolean): Set the key only if it already exists.
       *                              GET (boolean): Return the old value of the key before setting the new value.
       *                              EX (number|undefined): Set the key with an expiration time (in seconds).
       *                              PX (number|undefined): Set the key with an expiration time (in milliseconds).
       *                              EXAT (number|undefined): Set the key with an exact UNIX timestamp (in seconds) for expiration.
       *                              PXAT (number|undefined): Set the key with an exact UNIX timestamp (in milliseconds) for expiration.
       *                              KEEPTTL (boolean): Retain the key's existing TTL when setting a new value.
       * @returns {boolean|undefined} - true if the operation was successful, or the existing value if the GET option is specified and the key already exists.
       */
      set(key, value, options = {}) {
        const {
          NX = false,
          XX = false,
          GET = false,
          EX = void 0,
          PX = void 0,
          EXAT = void 0,
          PXAT = void 0,
          KEEPTTL = false
        } = options;
        const nx = NX;
        const xx = XX;
        const get = GET;
        let ex = EX ? parseInt(EX, 10) : void 0;
        let px = PX ? parseInt(PX, 10) : void 0;
        let exat = EXAT ? parseInt(EXAT, 10) : void 0;
        let pxat = PXAT ? parseInt(PXAT, 10) : void 0;
        const keepttl = KEEPTTL;
        const exists = this.store.has(key);
        if (xx && !exists) {
          return void 0;
        }
        if (nx && exists) {
          return void 0;
        }
        let oldValue;
        if (get && exists) {
          oldValue = this.store.get(key);
        }
        this.storeSet(key, value);
        if (ex !== void 0 || px !== void 0 || exat !== void 0 || pxat !== void 0 || keepttl) {
          let expireTime = void 0;
          if (ex !== void 0) {
            expireTime = Date.now() + ex * 1e3;
          } else if (px !== void 0) {
            expireTime = Date.now() + px;
          } else if (exat !== void 0) {
            expireTime = exat * 1e3;
          } else if (pxat !== void 0) {
            expireTime = pxat;
          } else if (keepttl && exists) {
            expireTime = this.expireTimes.get(key);
          }
          if (expireTime !== void 0) {
            this.expireTimes.set(key, expireTime);
            if (this.isIndexedDBAvailable && this.db) {
              this._persistExpirationToIndexedDB(key, expireTime);
            }
          }
        } else {
          this.expireTimes.delete(key);
          if (this.isIndexedDBAvailable && this.db) {
            this._persistExpirationToIndexedDB(key, void 0);
          }
        }
        return get ? oldValue : true;
      }
      /**
       * Get the value of a key.
       * @param {*} key - The key to get.
       * @returns {*} - The value of the key, or `undefined` if the key does not exist or has expired.
       */
      get(key) {
        const isExpired = this._checkAndRemoveExpiredKey(key);
        if (isExpired)
          return void 0;
        return this.store.get(key);
      }
      /**
       * Delete specified key(s). If a key does not exist, it is ignored.
       * @param {*} key - The key to delete.
       * @returns {number} - 1 if the key was deleted, 0 if the key did not exist or has expired.
       */
      del(...keys) {
        let numDeleted = 0;
        for (const key of keys) {
          const isExpired = this._checkAndRemoveExpiredKey(key);
          if (isExpired) {
            continue;
          }
          if (this.store.delete(key)) {
            this.expireTimes.delete(key);
            if (this.isIndexedDBAvailable && this.db) {
              this._removeFromIndexedDB(key);
            }
            numDeleted++;
          }
        }
        return numDeleted;
      }
      /**
       * Check if one or more keys exist.
       * @param {...string} keys - The keys to check.
       * @returns {number} - The number of keys that exist.
       */
      exists(...keys) {
        let numExists = 0;
        for (const key of keys) {
          const isExpired = this._checkAndRemoveExpiredKey(key);
          if (isExpired) {
            continue;
          }
          if (this.store.has(key)) {
            numExists++;
          }
        }
        return numExists;
      }
      /**
       * Increment the value of a key by 1.
       * @param {*} key - The key to increment.
       * @returns {number} - The new value of the key.
       */
      incr(key) {
        return this.incrby(key, 1);
      }
      /**
       * Increment the value of a key by a given amount.
       * @param {*} key - The key to increment.
       * @param {number} increment - The amount to increment the key by.
       * @returns {number} - The new value of the key.
       * @throws {Error} - If the value of the key is not an integer.
       */
      incrby(key, increment) {
        let value = this.store.get(key);
        if (value === void 0) {
          value = 0;
        } else if (!Number.isInteger(Number(value))) {
          throw new Error("ERR value is not an integer");
        }
        const newValue = Number(value) + increment;
        this.storeSet(key, newValue.toString());
        return newValue;
      }
      /**
       * Decrement the value of a key by 1.
       * @param {*} key - The key to decrement.
       * @returns {number} - The new value of the key.
       * @throws {Error} - If the value is not an integer.
       */
      decr(key) {
        try {
          return this.decrby(key, 1);
        } catch (err) {
          throw err;
        }
      }
      /**
       * Decrement the value of a key by a given amount.
       * @param {*} key - The key to decrement.
       * @param {number} decrement - The amount to decrement the key by.
       * @returns {number} - The new value of the key.
       * @throws {Error} - If the value is not an integer.
       */
      decrby(key, decrement) {
        let value = this.store.get(key);
        if (value === void 0) {
          value = 0;
        } else if (!Number.isInteger(Number(value))) {
          throw new Error("ERR value is not an integer");
        }
        const newValue = Number(value) - decrement;
        this.storeSet(key, newValue.toString());
        return newValue;
      }
      /**
       * Set a key's time to live in seconds.
       * @param {*} key - The key to set the expiry time for.
       * @param {number} seconds - The number of seconds until the key should expire.
       * @param {Object} options - (Optional) An object containing the option for the expiry behavior.
       *                          Can be { NX: true } (set expire only if key has no expiry time),
       *                          { XX: true } (set expire only if key has an expiry time),
       *                          { GT: true } (set expire only if key's expiry time is greater than the specified time),
       *                          or { LT: true } (set expire only if key's expiry time is less than the specified time).
       * @returns {number} - 1 if the key's expiry time was set, 0 otherwise.
       */
      expire(key, seconds, options = {}) {
        if (!this.store.has(key)) {
          return 0;
        }
        const { NX = false, XX = false, GT = false, LT = false } = options;
        const now = Date.now();
        const expireTime = this.expireTimes.get(key);
        if (NX && expireTime !== void 0) {
          return 0;
        } else if (XX && expireTime === void 0) {
          return 0;
        } else if (GT && (expireTime === void 0 || expireTime <= now + seconds * 1e3)) {
          return 0;
        } else if (LT && (expireTime === void 0 || expireTime >= now + seconds * 1e3)) {
          return 0;
        }
        this.expireTimes.set(key, now + seconds * 1e3);
        return 1;
      }
      /**
       * Find all keys matching the specified pattern.
       * @param {string} pattern - The pattern to match keys against. Supports glob-style patterns.
       * @returns {Array} - An array of keys that match the specified pattern.
       */
      keys(pattern) {
        const keys = [];
        for (const [key, value] of this.store.entries()) {
          if (simpleMatch(key, pattern)) {
            const expireTime = this.expireTimes.get(key);
            if (expireTime === void 0 || expireTime > Date.now()) {
              keys.push(key);
            }
          }
        }
        return keys;
      }
      /**
       * Returns an array of values stored at the given keys. If a key is not found, undefined is returned for that key.
       * @param {...string} keys - The keys to retrieve.
       * @returns {Array} - An array of values.
       */
      mget(...keys) {
        return keys.map((key) => this.get(key));
      }
      /**
       * Set multiple keys to their respective values.
       * @param  {...any} keyValuePairs - The keys and values to set, given as alternating arguments.
       * @returns {boolean} - A boolean indicating that the operation was successful.
       * @throws {Error} - If the number of arguments is odd.
       */
      mset(...keyValuePairs) {
        if (keyValuePairs.length % 2 !== 0) {
          throw new Error("MSET requires an even number of arguments");
        }
        for (let i2 = 0; i2 < keyValuePairs.length; i2 += 2) {
          this.set(keyValuePairs[i2], keyValuePairs[i2 + 1]);
        }
        return true;
      }
      /**
       * Renames a key to a new key only if the new key does not exist.
       * @param {string} oldKey - The old key name.
       * @param {string} newKey - The new key name.
       * @returns {number} - 1 if the key was successfully renamed, 0 otherwise.
       */
      renamenx(oldKey, newKey) {
        if (!this.store.has(oldKey) || this.store.has(newKey)) {
          return 0;
        }
        const value = this.store.get(oldKey);
        this.store.delete(oldKey);
        this.storeSet(newKey, value);
        if (this.expireTimes.has(oldKey)) {
          const expireTime = this.expireTimes.get(oldKey);
          this.expireTimes.delete(oldKey);
          this.expireTimes.set(newKey, expireTime);
        }
        return 1;
      }
      /**
       * Return a random key from the cache.
       * @returns {(string|undefined)} - A random key from the cache or undefined if the cache is empty.
       */
      randomkey() {
        const keys = Array.from(this.store.keys());
        if (keys.length === 0)
          return void 0;
        const randomIndex = Math.floor(Math.random() * keys.length);
        return keys[randomIndex];
      }
      /**
       * Set a key's time-to-live in seconds.
       * @param {*} key - The key to set the TTL for.
       * @param {number} timestampSeconds - The UNIX timestamp (in seconds) at which the key should expire.
       * @param {Object} [options] - An object with optional arguments specifying when the expiration should be set:
       *                            - { NX: true } if the key does not have an expiration time
       *                            - { XX: true } if the key already has an expiration time
       *                            - { GT: true } if the expiration should only be set if it is greater than the current TTL
       *                            - { LT: true } if the expiration should only be set if it is less than the current TTL
       * @returns {number} - 1 if the TTL was set, 0 if the key does not exist or the TTL was not set.
       * @throws {Error} - Throws an error if the timestampSeconds parameter is not a valid number.
       */
      expireat(key, timestampSeconds, options = {}) {
        if (typeof timestampSeconds !== "number" || isNaN(timestampSeconds)) {
          throw new Error("ERR invalid expire time in SETEX");
        }
        if (!this.store.has(key)) {
          return 0;
        }
        const { NX = false, XX = false, GT = false, LT = false } = options;
        const now = Date.now();
        const ttlMillis = timestampSeconds * 1e3 - now;
        if (ttlMillis <= 0) {
          this.store.delete(key);
          this.expireTimes.delete(key);
          return 0;
        }
        const existingTtl = this.pttl(key);
        if (XX && existingTtl === -1) {
          return 0;
        } else if (NX && existingTtl !== -1) {
          return 0;
        } else if (GT && (existingTtl !== -1 && ttlMillis <= existingTtl)) {
          return 0;
        } else if (LT && (existingTtl !== -1 && ttlMillis >= existingTtl)) {
          return 0;
        }
        return this.pexpire(key, ttlMillis);
      }
      /**
       * Set a timeout for the key, in milliseconds.
       * @param {*} key - The key to set the expiration for.
       * @param {number} ttlMillis - The time-to-live for the key, in milliseconds.
       * @param {Object} [options] - An object with optional arguments specifying when the expiration should be set:
       *                            - { NX: true } if the key does not have an expiration time
       *                            - { XX: true } if the key already has an expiration time
       *                            - { GT: true } if the expiration should only be set if it is greater than the current TTL
       *                            - { LT: true } if the expiration should only be set if it is less than the current TTL
       * @returns {number} - 1 if the timeout was set, 0 otherwise.
       */
      pexpire(key, ttlMillis, options = {}) {
        const { NX = false, XX = false, GT = false, LT = false } = options;
        if (NX && this.store.has(key) || XX && !this.store.has(key)) {
          return 0;
        }
        if (GT || LT) {
          const existingTTL = this.pttl(key);
          if (GT && existingTTL >= ttlMillis || LT && existingTTL <= ttlMillis) {
            return 0;
          }
        }
        this.expireTimes.set(key, Date.now() + ttlMillis);
        return 1;
      }
      /**
       * Sets the expiration timestamp for the key in milliseconds.
       * @param {*} key - The key to set the expiration timestamp for.
       * @param {number} timestampMillis - The expiration timestamp in milliseconds.
       * @returns {number} - 1 if the timeout was set, 0 if the key does not exist or the timeout could not be set.
       */
      pexpireat(key, timestampMillis) {
        const ttlMillis = timestampMillis - Date.now();
        if (ttlMillis <= 0) {
          this.store.delete(key);
          this.expireTimes.delete(key);
          return 0;
        }
        return this.pexpire(key, ttlMillis);
      }
      /**
       * Returns the remaining time to live of a key that has an expiration set, in milliseconds. 
       * If the key does not exist or does not have an associated expiration time, it returns -2 or -1, respectively.
       * 
       * @param {*} key - The key to check.
       * @returns {number} - The remaining time to live in milliseconds. If the key does not exist or has no expiration, returns -2 or -1 respectively.
       */
      pttl(key) {
        if (!this.store.has(key)) {
          return -2;
        }
        if (!this.expireTimes.has(key)) {
          return -1;
        }
        const ttl = this.expireTimes.get(key) - Date.now();
        return ttl > 0 ? ttl : -2;
      }
      /**
       * Returns the time-to-live of a key in seconds. If the key does not exist or does not have an
       * associated expiration time, it returns -2 or -1, respectively. If the key exists and has an
       * associated expiration time, it returns the number of seconds left until expiration. The returned
       * value can be negative if the key has already expired.
       *
       * @param {*} key - The key to check the time-to-live for.
       * @returns {number} - The time-to-live of the key in seconds, or -2 if the key does not exist,
       * -1 if the key exists but does not have an associated expiration time, or a negative value if
       * the key has already expired.
       */
      ttl(key) {
        if (!this.store.has(key)) {
          return -2;
        }
        if (!this.expireTimes.has(key)) {
          return -1;
        }
        const ttl = Math.floor((this.expireTimes.get(key) - Date.now()) / 1e3);
        return ttl > 0 ? ttl : -2;
      }
      /**
       * Remove the expiration from a key.
       * @param {*} key - The key to remove expiration from.
       * @returns {number} - 1 if the expiration was removed, 0 otherwise.
       */
      persist(key) {
        if (!this.store.has(key) || !this.expireTimes.has(key)) {
          return 0;
        }
        this.expireTimes.delete(key);
        if (this.isIndexedDBAvailable && this.db) {
          this._persistExpirationToIndexedDB(key, void 0);
        }
        return 1;
      }
      /**
       * Get a substring of the string stored at a key.
       * @param {*} key - The key to get the substring from.
       * @param {number} start - The starting index of the substring (0-based).
       * @param {number} end - The ending index of the substring (0-based, inclusive).
       * @returns {string} - The substring, or an empty string if the key does not exist or is not a string.
       */
      getrange(key, start, end) {
        const value = this.get(key);
        if (typeof value !== "string")
          return "";
        return value.slice(start, end + 1);
      }
      /**
       * Replaces the current value of a key with the specified new value and returns the old value.
       * If the key does not exist, it is created and set to the specified value.
       * @param {*} key - The key to update.
       * @param {*} value - The new value to set.
       * @returns {string|undefined} - The old value of the key, or undefined if the key did not exist.
       */
      getset(key, value) {
        const oldValue = this.get(key);
        this.set(key, value);
        return oldValue;
      }
      /**
       * Set the value of a key with an expiration time in milliseconds.
       * If the key already exists, it will be overwritten with the new value.
       * @param {*} key - The key to set.
       * @param {*} value - The value to set for the key.
       * @param {number} ttl - The time-to-live for the key, in milliseconds.
       * @returns {boolean|undefined} - true if the key was set successfully.
       */
      setex(key, value, ttl) {
        if (!this.store.has(key))
          return void 0;
        this.set(key, value);
        this.expire(key, ttl);
        return true;
      }
      /**
       * Sets the substring of the string value stored at the specified key starting at the specified offset
       * with the given value. If the offset is out of range, will return an error.
       * If the key does not exist, a new key holding a zero-length string will be created.
       * The length of the string will be increased as necessary to accommodate the new value.
       * @param {*} key - The key of the string value to set the range of.
       * @param {number} offset - The zero-based index at which to start replacing characters.
       * @param {*} value - The new value to insert into the string.
       * @returns {number} - The length of the string after it has been modified.
       * @throws {Error} - If the offset is out of range or an error occurs while executing the command.
       */
      setrange(key, offset, value) {
        if (typeof offset !== "number" || offset < 0) {
          throw new Error("Invalid offset value");
        }
        if (typeof value !== "string") {
          throw new Error("Value must be a string");
        }
        let currentValue = this.get(key);
        if (currentValue === void 0 || currentValue === void 0) {
          currentValue = "";
        }
        const left = currentValue.slice(0, offset);
        const right = currentValue.slice(offset + value.length);
        const newValue = left + value + right;
        this.set(key, newValue);
        return newValue.length;
      }
      /**
       * Get the length of the value stored at a key.
       * @param {*} key - The key to get the length of.
       * @returns {number} - The length of the value stored at the key, or 0 if the key does not exist.
       */
      strlen(key) {
        const value = this.get(key);
        return value === void 0 ? 0 : value.length;
      }
      /**
       * Set the values of multiple keys.
       * @param {*} keyValuePairs - The key-value pairs to set.
       * @param {*} value - The value to set for the key.
       * @returns {number} - 1 if the key was set, 0 if the key was not set.
       * @throws {Error} - If an error occurs while executing the command.
       */
      msetnx(...keyValuePairs) {
        if (keyValuePairs.length % 2 !== 0) {
          throw new Error("MSETNX requires an even number of arguments");
        }
        for (let i2 = 0; i2 < keyValuePairs.length; i2 += 2) {
          if (this.store.has(keyValuePairs[i2])) {
            return 0;
          }
        }
        for (let i2 = 0; i2 < keyValuePairs.length; i2 += 2) {
          this.set(keyValuePairs[i2], keyValuePairs[i2 + 1]);
        }
        return 1;
      }
      /**
       * Increment the value of a key by a floating-point number.
       * @param {*} key - The key to increment.
       * @param {number} increment - The value to increment by.
       * @returns {number} - The new value of the key.
       * @throws {Error} - If the value is not a valid float.
       */
      incrbyfloat(key, increment) {
        let value = this.store.get(key);
        if (value === void 0) {
          value = 0;
        } else if (isNaN(parseFloat(value))) {
          throw new Error("ERR value is not a valid float");
        }
        const newValue = parseFloat(value) + increment;
        this.storeSet(key, newValue.toString());
        return newValue;
      }
      /**
       * If the key already exists, the value is appended to the end of the existing value. 
       * If the key doesn't exist, a new key is created and set to the value.
       * @param {*} key - The key to append the value to.
       * @param {*} value - The value to append.
       * @returns {number} - The length of the new string.
       */
      append(key, value) {
        const currentValue = this.get(key);
        const newValue = currentValue === void 0 ? value : currentValue + value;
        this.set(key, newValue);
        return newValue.length;
      }
      /**
       * Returns the bit value at a given offset in the string value of a key.
       * @param {*} key - The key to get the bit from.
       * @param {number} offset - The bit offset.
       * @returns {number} - 1 or 0, the bit value at the given offset. If the key does not exist or the offset is out of range, 0 is returned.
       */
      getbit(key, offset) {
        const value = this.get(key);
        if (value === void 0 || offset >= value.length * 8) {
          return 0;
        }
        const byteIndex = Math.floor(offset / 8);
        const bitIndex = 7 - offset % 8;
        const byteValue = value.charCodeAt(byteIndex);
        return byteValue >> bitIndex & 1;
      }
      /**
       * Sets or clears the bit at offset in the string value stored at key.
       * @param {*} key - The key to set the bit on.
       * @param {number} offset - The bit offset.
       * @param {number} bit - The bit value to set.
       * @returns {number} - The original bit value stored at offset.
       */
      setbit(key, offset, bit) {
        if (bit !== 0 && bit !== 1) {
          throw new Error("ERR bit is not an integer or out of range");
        }
        let value = this.get(key);
        if (value === void 0) {
          value = "";
        }
        const byteIndex = Math.floor(offset / 8);
        const bitIndex = 7 - offset % 8;
        while (byteIndex >= value.length) {
          value += "\0";
        }
        const byteValue = value.charCodeAt(byteIndex);
        const oldValue = byteValue >> bitIndex & 1;
        const newValue = byteValue & ~(1 << bitIndex) | bit << bitIndex;
        const newStrValue = String.fromCharCode(newValue);
        const left = value.slice(0, byteIndex);
        const right = value.slice(byteIndex + 1);
        const updatedValue = left + newStrValue + right;
        this.set(key, updatedValue);
        return oldValue;
      }
      /**
       * Copies the value stored at a key to another key.
       * @param {*} source - The key to copy from.
       * @param {*} destination - The key to copy to.
       * @returns {number} - 1 if the key was copied, 0 if the key was not copied.
       */
      copy(source, destination) {
        const value = this.get(source);
        if (value === void 0) {
          return 0;
        }
        this.set(destination, value);
        return 1;
      }
      /**
       * Renames a key. 
       * @param {*} key - The key to rename.
       * @param {*} newKey - The new key name.
       * @returns {boolean} - true if the key was renamed, an error if the key was not renamed.
       */
      rename(key, newKey) {
        if (!this.store.has(key)) {
          throw new Error("ERR no such key");
        }
        if (key === newKey) {
          return true;
        }
        const value = this.store.get(key);
        const expireTime = this.expireTimes.get(key);
        this.storeSet(newKey, value);
        this.store.delete(key);
        if (expireTime !== void 0) {
          this.expireTimes.set(newKey, expireTime);
          this.expireTimes.delete(key);
        }
        return true;
      }
      /**
       * Returns the type of the value stored at a key.
       * @param {*} key - The key to get the type of.
       * @returns {string} - The type of the value stored at the key.
       */
      type(key) {
        if (!this.store.has(key)) {
          return "none";
        }
        const value = this.store.get(key);
        return typeof value;
      }
      /**
       * Add members to a set stored at key.
       * @param {*} key - The key to add the members to.
       * @param {*} members - The members to add to the set.
       * @returns {number} - The number of members that were added to the set, not including all the members that were already present in the set.
       */
      sadd(key, ...members) {
        if (!this.store.has(key)) {
          this.storeSet(key, /* @__PURE__ */ new Set());
        }
        const set = this.store.get(key);
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        let addedCount = 0;
        for (const member of members) {
          if (!set.has(member)) {
            set.add(member);
            addedCount++;
          }
        }
        return addedCount;
      }
      /**
       * Returns the number of members of the set stored at key.
       * @param {*} key - The key to get the size of.
       * @returns {number} - The number of members in the set.
       */
      scard(key) {
        const value = this.store.get(key);
        if (value === void 0) {
          return 0;
        }
        if (!(value instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        return value.size;
      }
      /**
       * This method retrieves the members of a set that are present in the first set but not in any of the subsequent sets, and returns them as a new set.
       * @param {*} key1 - The first key to compare.
       * @param {*} otherKeys - The other keys to compare.
       * @returns {Array} - An array of members.
       */
      sdiff(key1, ...otherKeys) {
        const set1 = this.store.get(key1) || /* @__PURE__ */ new Set();
        if (!(set1 instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        const resultSet = new Set(set1);
        for (const key of otherKeys) {
          const otherSet = this.store.get(key) || /* @__PURE__ */ new Set();
          if (!(otherSet instanceof Set)) {
            throw new Error("ERR Operation against a key holding the wrong kind of value");
          }
          for (const member of otherSet) {
            resultSet.delete(member);
          }
        }
        return Array.from(resultSet);
      }
      /**
       * The functionality of this method is similar to that of sdiff, except that instead of returning the resulting set, it stores the set in the destination provided as an argument.
       * @param {*} destination - The key to store the resulting set in.
       * @param {*} key1 - The first key to compare.
       * @param {*} otherKeys - The other keys to compare.
       * @returns {number} - The number of elements in the resulting set.
       */
      sdiffstore(destination, key1, ...otherKeys) {
        const diff = this.sdiff(key1, ...otherKeys);
        const resultSet = new Set(diff);
        this.storeSet(destination, resultSet);
        return resultSet.size;
      }
      /**
       * This method retrieves the members that are present in all the sets provided as arguments, and returns them as a new set representing the intersection of those sets.
       * @param {*} keys - The keys to intersect.
       * @returns {Array} - An array of members.
       */
      sinter(...keys) {
        if (keys.length === 0) {
          return [];
        }
        const sets = keys.map((key) => {
          const set = this.store.get(key);
          if (set === void 0) {
            return /* @__PURE__ */ new Set();
          }
          if (!(set instanceof Set)) {
            throw new Error("ERR Operation against a key holding the wrong kind of value");
          }
          return set;
        });
        const resultSet = new Set(sets[0]);
        for (let i2 = 1; i2 < sets.length; i2++) {
          for (const member of resultSet) {
            if (!sets[i2].has(member)) {
              resultSet.delete(member);
            }
          }
        }
        return Array.from(resultSet);
      }
      /**
       * Returns the number of elements in the intersection of one or more sets.
       * @param {...string} keys - The keys of the sets to intersect.
       * @returns {number} - The cardinality (number of elements) in the intersection of the sets.
       */
      sintercard(...keys) {
        return this.sinter(...keys).length;
      }
      /**
       * Computes the intersection of one or more sets and stores the result in a new set.
       * @param {string} destination - The key of the new set to store the result in.
       * @param {...string} keys - The keys of the sets to intersect.
       * @returns {number} - The cardinality (number of elements) in the intersection of the sets.
       */
      sinterstore(destination, ...keys) {
        const intersection = this.sinter(...keys);
        const resultSet = new Set(intersection);
        this.storeSet(destination, resultSet);
        return resultSet.size;
      }
      /**
       * This method determines if a given value is a member of the set stored at key.
       * @param {*} key - The key to check.
       * @param {*} member - The member to check for.
       * @returns {number} - 1 if the member is a member of the set stored at key. 0 if the member is not a member of the set, or if key does not exist.
       */
      sismember(key, member) {
        const set = this.store.get(key);
        if (set === void 0) {
          return false;
        }
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        return set.has(member) ? true : false;
      }
      /**
       * This method retrieves all the members of the set value stored at key.
       * @param {*} key - The key to get the members of.
       * @returns {Array} - An array of members.
       */
      smembers(key) {
        const set = this.store.get(key);
        if (set === void 0) {
          return [];
        }
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        return Array.from(set);
      }
      /**
       * Determines whether each member is a member of the set stored at key.
       * @param {*} key - The key to check.
       * @param {*} members - The members to check for.
       * @returns {Array} - An array of 1s and 0s.
       */
      smismember(key, ...members) {
        const set = this.store.get(key) || /* @__PURE__ */ new Set();
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        return members.map((member) => set.has(member) ? 1 : 0);
      }
      /**
       * Moves a member from one set to another.
       * @param {*} source - The key of the set to move the member from.
       * @param {*} destination - The key of the set to move the member to.
       * @param {*} member - The member to move.
       * @returns {number} - 1 if the member was moved. 0 if the member was not moved.
       */
      smove(source, destination, member) {
        const srcSet = this.store.get(source);
        if (srcSet === void 0 || !srcSet.has(member)) {
          return 0;
        }
        if (!(srcSet instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        const destSet = this.store.get(destination) || /* @__PURE__ */ new Set();
        if (!(destSet instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        srcSet.delete(member);
        destSet.add(member);
        this.storeSet(destination, destSet);
        return 1;
      }
      /**
       * Removes and returns one or multiple random members from a set.
       * @param {*} key - The key of the set.
       * @param {number} [count=1] - The number of random members to return.
       * @returns {Array} An array of random members or an empty array if the set is empty or does not exist.
       */
      spop(key, count = 1) {
        const set = this.store.get(key);
        if (set === void 0) {
          return [];
        }
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        const poppedMembers = [];
        for (const member of set) {
          if (poppedMembers.length >= count) {
            break;
          }
          poppedMembers.push(member);
          set.delete(member);
        }
        return poppedMembers;
      }
      /**
       * Get one or multiple random members from a set without removing them.
       * @param {*} key - The key of the set.
       * @param {number} [count=1] - The number of random members to return.
       * @returns {Array} An array of random members or an empty array if the set is empty or does not exist.
       */
      srandmember(key, count = 1) {
        const set = this.store.get(key);
        if (set === void 0) {
          return [];
        }
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        const members = Array.from(set);
        const result = [];
        for (let i2 = 0; i2 < count && i2 < members.length; i2++) {
          const randomIndex = Math.floor(Math.random() * members.length);
          result.push(members[randomIndex]);
          members.splice(randomIndex, 1);
        }
        return result;
      }
      /**
       * Remove one or more members from a set.
       * @param {*} key - The key of the set.
       * @param {...string} members - The members to remove from the set.
       * @returns {number} The number of members removed from the set.
       */
      srem(key, ...members) {
        const set = this.store.get(key);
        if (set === void 0) {
          return 0;
        }
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        let removedCount = 0;
        for (const member of members) {
          if (set.delete(member)) {
            removedCount++;
          }
        }
        return removedCount;
      }
      /**
       * Iterates the set elements using a cursor.
       * @param {*} key - The key of the set.
       * @param {number} cursor - The cursor to start the iteration from.
       * @param {Object} [options] - The optional configuration object.
       * @param {string} [options.match] - A pattern to match the returned elements.
       * @param {number} [options.count] - The number of elements to return in each iteration.
       * @returns {[number, Array]} An array containing the next cursor and an array of elements.
       */
      sscan(key, cursor, options = {}) {
        const { match = "*", count = 10 } = options;
        const set = this.store.get(key);
        if (set === void 0) {
          return [0, []];
        }
        if (!(set instanceof Set)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        const regex = new RegExp(match.replace("*", ".*"));
        const members = Array.from(set);
        const result = [];
        let newCursor = cursor;
        for (let i2 = cursor; i2 < members.length && result.length < count; i2++) {
          if (regex.test(members[i2])) {
            result.push(members[i2]);
          }
          newCursor = i2 + 1;
        }
        return [newCursor >= members.length ? 0 : newCursor, result];
      }
      /**
       * Computes the union of the sets stored at the specified keys.
       * @param {...string} keys - The keys of the sets to compute the union for.
       * @returns {Array} An array containing the members of the union or an empty array if no sets exist.
       */
      sunion(...keys) {
        const resultSet = /* @__PURE__ */ new Set();
        for (const key of keys) {
          const set = this.store.get(key) || /* @__PURE__ */ new Set();
          if (!(set instanceof Set)) {
            throw new Error("ERR Operation against a key holding the wrong kind of value");
          }
          for (const member of set) {
            resultSet.add(member);
          }
        }
        return Array.from(resultSet);
      }
      /**
       * Computes the union of the sets stored at the specified keys and stores the result in a new set at the destination key.
       * @param {string} destination - The key to store the resulting set.
       * @param {...string} keys - The keys of the sets to compute the union for.
       * @returns {number} The number of members in the resulting set.
       */
      sunionstore(destination, ...keys) {
        const resultSet = /* @__PURE__ */ new Set();
        for (const key of keys) {
          const set = this.store.get(key) || /* @__PURE__ */ new Set();
          if (!(set instanceof Set)) {
            throw new Error("ERR Operation against a key holding the wrong kind of value");
          }
          for (const member of set) {
            resultSet.add(member);
          }
        }
        this.storeSet(destination, resultSet);
        return resultSet.size;
      }
      /**
       * Sets the value of an element in a list by its index.
       * @param {*} key - The key of the list.
       * @param {number} index - The index of the element to set the value for.
       * @param {*} value - The value to set.
       * @returns {string} "OK" if the value is successfully set or an error if the index is out of range.
       */
      lset(key, index, value) {
        const list = this.store.get(key);
        if (list === void 0) {
          throw new Error("ERR no such key");
        }
        if (!Array.isArray(list)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        if (index < 0 || index >= list.length) {
          throw new Error("ERR index out of range");
        }
        list[index] = value;
        return true;
      }
      /**
       * Trims a list to the specified range.
       * @param {*} key - The key of the list.
       * @param {number} start - The start index of the range to trim.
       * @param {number} stop - The end index of the range to trim.
       * @returns {string} "OK" if the list is successfully trimmed or an error if the key holds a wrong kind of value.
       */
      ltrim(key, start, stop) {
        const list = this.store.get(key);
        if (list === void 0) {
          return true;
        }
        if (!Array.isArray(list)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        const length = list.length;
        const newStart = start >= 0 ? start : Math.max(length + start, 0);
        const newStop = stop >= 0 ? stop : Math.max(length + stop, -1);
        const newList = list.slice(newStart, newStop + 1);
        this.storeSet(key, newList);
        return true;
      }
      /**
       * Removes and returns the last element of the list stored at the specified key.
       * @param {*} key - The key of the list.
       * @returns {*} The last element of the list or null if the key does not exist.
       */
      rpop(key) {
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return null;
        }
        return list.pop();
      }
      /**
       * Removes the last element of the list stored at the specified key and pushes it to the list stored at the destination key.
       * @param {*} source - The key of the list to pop the element from.
       * @param {*} destination - The key of the list to push the element to.
       * @returns {*} The last element of the list or null if the key does not exist.
       */
      rpoplpush(source, destination) {
        const element = this.rpop(source);
        if (element === void 0) {
          return null;
        }
        this.lpush(destination, element);
        return element;
      }
      /**
       * Adds values to the end of the list stored at the specified key.
       * @param {*} key - The key of the list.
       * @param {...*} values - The values to add to the list.
       * @returns {number} The length of the list after the push operation.
       */
      rpush(key, ...values) {
        let list = this.store.get(key);
        if (list === void 0) {
          list = [];
          this.storeSet(key, list);
        } else if (!Array.isArray(list)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        list.push(...values);
        return list.length;
      }
      /**
       * Adds values to the end of the list stored at the specified key if the key exists and stores a list.
       * @param {*} key - The key of the list.
       * @param {*} value - The value to add to the list.
       * @returns {number} The length of the list after the push operation.
       */
      rpushx(key, value) {
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return 0;
        }
        list.push(value);
        return list.length;
      }
      /**
       * Adds values to the beginning of the list stored at the specified key.
       * @param {*} key - The key of the list.
       * @param {...*} values - The values to add to the list.
       * @returns {number} The length of the list after the push operation.
       */
      lpush(key, ...values) {
        let list = this.store.get(key);
        if (list === void 0) {
          list = [];
          this.storeSet(key, list);
        } else if (!Array.isArray(list)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        list.unshift(...values);
        return list.length;
      }
      /**
       * Adds values to the beginning of the list stored at the specified key if the key exists and stores a list.
       * @param {*} key - The key of the list.
       * @param {*} value - The value to add to the list.
       * @returns {number} The length of the list after the push operation.
       */
      lpushx(key, ...values) {
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return 0;
        }
        list.unshift(...values);
        return list.length;
      }
      /**
       * Retrieve a range of elements from a list stored at the given key.
       *
       * @param {*} key - The key where the list is stored.
       * @param {number} start - The start index of the range (inclusive). If negative, it counts from the end of the list.
       * @param {number} stop - The end index of the range (inclusive). If negative, it counts from the end of the list.
       * @returns {Array} - An array containing the requested range of elements.
       *                    Returns an empty array if the key does not exist,
       *                    or if the stored value is not an array.
       */
      lrange(key, start, stop) {
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return [];
        }
        const length = list.length;
        const newStart = start >= 0 ? start : Math.max(length + start, 0);
        const newStop = stop >= 0 ? stop : Math.max(length + stop, -1);
        return list.slice(newStart, newStop + 1);
      }
      /**
       * Remove elements with the given value from a list stored at the given key.
       *
       * @param {*} key - The key where the list is stored.
       * @param {number} count - The number of occurrences to remove.
       * @param {*} value - The value of the elements to remove.
       * @returns {number} - The number of removed elements.
       */
      lrem(key, count, value) {
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return 0;
        }
        let removed = 0;
        if (count > 0) {
          for (let i2 = 0; i2 < list.length && removed < count; i2++) {
            if (list[i2] === value) {
              list.splice(i2, 1);
              removed++;
              i2--;
            }
          }
        } else if (count < 0) {
          for (let i2 = list.length - 1; i2 >= 0 && removed < -count; i2--) {
            if (list[i2] === value) {
              list.splice(i2, 1);
              removed++;
            }
          }
        } else {
          removed = list.filter((item) => item === value).length;
          this.storeSet(key, list.filter((item) => item !== value));
        }
        return removed;
      }
      /**
       * Pop an element from a list stored at the source key and push it to a list stored at the destination key.
       *
       * @param {string} source - The key where the source list is stored.
       * @param {string} destination - The key where the destination list is stored.
       * @param {string} srcDirection - The direction to pop from the source list ('LEFT' or 'RIGHT').
       * @param {string} destDirection - The direction to push to the destination list ('LEFT' or 'RIGHT').
       * @returns {*} - The element moved or null if the source list is empty.
       */
      lmove(source, destination, srcDirection, destDirection) {
        const popFn = srcDirection === "LEFT" ? "lpop" : "rpop";
        const pushFn = destDirection === "LEFT" ? "lpush" : "rpush";
        const element = this[popFn](source);
        if (element === void 0) {
          return null;
        }
        this[pushFn](destination, element);
        return element;
      }
      /**
       * Pop multiple elements from a list stored at the given key in the specified direction.
       *
       * @param {number} count - The number of elements to pop.
       * @param {*} key - The key where the list is stored.
       * @param {string} direction - The direction to pop from the list ('LEFT' or 'RIGHT').
       * @returns {Array} - An array of popped elements.
       */
      lmpop(count, key, direction) {
        const popFn = direction === "LEFT" ? "lpop" : "rpop";
        const results = [];
        for (let i2 = 0; i2 < count; i2++) {
          const value = this[popFn](key);
          if (value === void 0) {
            break;
          }
          results.push(value);
        }
        return results;
      }
      /**
       * Pop an element from the left end of a list stored at the given key.
       *
       * @param {*} key - The key where the list is stored.
       * @returns {*} - The popped element or null if the list is empty.
       */
      lpop(key) {
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return null;
        }
        return list.shift();
      }
      /**
      * Find the position of an element in a list stored at the given key.
      *
      * @param {*} key - The key where the list is stored.
      * @param {*} element - The element to search for.
      * @param {Object} options - An object with optional parameters.
      * @param {number} options.rank - The rank of the element to find (default is 0).
      * @param {number} options.start - The start index of the search (default is 0).
      * @param {number} options.stop - The stop index of the search (default is -1).
      * @returns {number|undefined} - The position of the element, or undefined if not found.
      */
      lpos(key, element, options = {}) {
        const { rank = 0, start = 0, stop = -1 } = options;
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return void 0;
        }
        let currentRank = 0;
        const length = list.length;
        const newStart = start >= 0 ? start : Math.max(length + start, 0);
        const newStop = stop >= 0 ? stop : Math.max(length + stop, -1);
        for (let i2 = newStart; i2 <= newStop; i2++) {
          if (list[i2] === element) {
            if (currentRank === rank) {
              return i2;
            }
            currentRank++;
          }
        }
        return void 0;
      }
      /**
       * Pop an element from the right end of a list stored at the source key and push it to the left end of a list stored at the destination key.
       *
       * @param {string} source - The key where the source list is stored.
       * @param {string} destination - The key where the destination list is stored.
       * @param {number} timeout - The maximum number of seconds to block waiting for an element to pop.
       * @returns {*} - The element moved or null if the source list is empty.
       */
      brpoplpush(source, destination, timeout) {
        const element = this.brpop(source, timeout);
        if (element === void 0) {
          return null;
        }
        this.lpush(destination, element);
        return element;
      }
      /**
       * Get the element at the specified index in a list stored at the given key.
       *
       * @param {*} key - The key where the list is stored.
       * @param {number} index - The index of the element to retrieve.
       * @returns {*} - The element at the specified index or null if the index is out of range.
       */
      lindex(key, index) {
        const list = this.store.get(key);
        if (list === void 0 || !Array.isArray(list)) {
          return null;
        }
        if (index < 0) {
          index = list.length + index;
        }
        return list[index] !== void 0 ? list[index] : null;
      }
      /**
       * Insert an element before or after a pivot element in a list stored at the given key.
       *
       * @param {*} key - The key where the list is stored.
       * @param {string} position - The position to insert the new element ('BEFORE' or 'AFTER').
       * @param {*} pivot - The pivot element to insert the new element before or after.
       * @param {*} value - The value of the new element to insert.
       * @returns {number} - The length of the list after the insert operation.
       */
      linsert(key, position, pivot, value) {
        const list = this.store.get(key);
        if (list === void 0) {
          return 0;
        }
        if (!Array.isArray(list)) {
          throw new Error("ERR Operation against a key holding the wrong kind of value");
        }
        const pivotIndex = list.indexOf(pivot);
        if (pivotIndex === -1) {
          return 0;
        }
        if (position === "BEFORE") {
          list.splice(pivotIndex, 0, value);
        } else if (position === "AFTER") {
          list.splice(pivotIndex + 1, 0, value);
        } else {
          throw new Error("ERR syntax error");
        }
        return list.length;
      }
      /**
       * Get the length of a list stored at the given key.
       *
       * @param {*} key - The key where the list is stored.
       * @returns {number} - The length of the list.
       */
      llen(key) {
        const list = this.store.get(key);
        return list === void 0 ? 0 : list.length;
      }
      /**
       * Pop an element from a list stored at the source key and push it to a list stored at the destination key, blocking until an element is available or the timeout expires.
       *
       * @param {string} source - The key where the source list is stored.
       * @param {string} destination - The key where the destination list is stored.
       * @param {string} srcDirection - The direction to pop from the source list ('LEFT' or 'RIGHT').
       * @param {string} destDirection - The direction to push to the destination list ('LEFT' or 'RIGHT').
       * @param {number} timeout - The maximum number of seconds to block waiting for an element to pop.
       * @returns {*} - The element moved or null if the source list is empty or the timeout expires.
       */
      blmove(source, destination, srcDirection, destDirection, timeout) {
        const popFn = srcDirection === "LEFT" ? "blpop" : "brpop";
        const pushFn = destDirection === "LEFT" ? "lpush" : "rpush";
        const element = this[popFn]([source], timeout);
        if (element === void 0) {
          return null;
        }
        this[pushFn](destination, element[1]);
        return element[1];
      }
      /**
       * Pop multiple elements from a list stored at the given keys in a blocking manner, waiting until at least one element is available or the timeout expires.
       *
       * @param {number} count - The number of elements to pop.
       * @param {number} timeout - The maximum number of seconds to block waiting for an element to pop.
       * @param {...string} keys - The keys where the lists are stored.
       * @returns {Array} - An array of popped elements.
       */
      blmpop(count, timeout, ...keys) {
        const results = [];
        const timeoutMs = timeout * 1e3;
        const popFn = keys.length === 1 ? "brpop" : "brpoplpush";
        const popArgs = keys.concat(timeoutMs);
        for (let i2 = 0; i2 < count; i2++) {
          const value = this[popFn](popArgs);
          if (value === void 0) {
            break;
          }
          results.push(value);
        }
        return results;
      }
      /**
       * Pop an element from the left end of a list stored at the given keys in a blocking manner, waiting until an element is available or the timeout expires.
       *
       * @param {number} timeout - The maximum number of seconds to block waiting for an element to pop.
       * @param {...string} keys - The keys where the lists are stored.
       * @returns {Array|null} - An array containing the key and the popped element, or null if no element is available or the timeout expires.
       */
      blpop(timeout, ...keys) {
        return this.blmpop(1, timeout, ...keys)[0];
      }
      /**
       * Pop an element from the right end of a list stored at the given keys in a blocking manner, waiting until an element is available or the timeout expires.
       *
       * @param {number} timeout - The maximum number of seconds to block waiting for an element to pop.
       * @param {...string} keys - The keys where the lists are stored.
       * @returns {Array|null} - An array containing the key and the popped element, or null if no element is available or the timeout expires.
       */
      brpop(timeout, ...keys) {
        const timeoutMs = timeout * 1e3;
        const endTime = Date.now() + timeoutMs;
        while (Date.now() < endTime) {
          for (let i2 = 0; i2 < keys.length; i2++) {
            const key = keys[i2];
            const list = this.store.get(key);
            if (list !== void 0 && Array.isArray(list) && list.length > 0) {
              const element = list.pop();
              if (list.length === 0) {
                this.store.delete(key);
              }
              return [key, element];
            }
          }
        }
        return null;
      }
      /**
       * Get the expire time of a key in seconds.
       *
       * @param {*} key - The key to get the expire time for.
       * @returns {number|undefined} - The expire time in seconds, or undefined if the key has no expire time.
       */
      expiretime(key) {
        return this.expireTimes.get(key);
      }
      /**
       * Get the expire time of a key in milliseconds.
       *
       * @param {*} key - The key to get the expire time for.
       * @returns {number|undefined} - The expire time in milliseconds, or undefined if the key has no expire time.
       */
      pexpiretime(key) {
        const expireTime = this.expireTimes.get(key);
        return expireTime ? expireTime * 1e3 : null;
      }
      /**
       * Add a member with the specified score to a sorted set stored at the given key.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} score - The score associated with the member.
       * @param {*} member - The member to add to the sorted set.
       * @returns {number} - The number of elements added to the sorted set (0 or 1).
       */
      zadd(key, score, member) {
        const isExpired = this._checkAndRemoveExpiredKey(key);
        if (isExpired) {
          return 0;
        }
        if (!this.store.has(key)) {
          this.storeSet(key, new XMap());
        }
        const sortedSet = this.store.get(key);
        sortedSet.set(member, Number(score));
        return 1;
      }
      /**
       * Get the number of members in a sorted set stored at the given key.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @returns {number} - The number of members in the sorted set.
       */
      zcard(key) {
        const isExpired = this._checkAndRemoveExpiredKey(key);
        if (isExpired) {
          return 0;
        }
        if (!this.store.has(key)) {
          return 0;
        }
        const sortedSet = this.store.get(key);
        return sortedSet.size;
      }
      /**
       * Count the number of members in a sorted set stored at the given key with a score between min and max (inclusive).
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} min - The minimum score.
       * @param {number} max - The maximum score.
       * @returns {number} - The number of members with a score between min and max.
       */
      zcount(key, min, max) {
        const isExpired = this._checkAndRemoveExpiredKey(key);
        if (isExpired) {
          return 0;
        }
        if (!this.store.has(key)) {
          return 0;
        }
        const sortedSet = this.store.get(key);
        let count = 0;
        for (const score of sortedSet.values()) {
          if (score >= min && score <= max) {
            count++;
          }
        }
        return count;
      }
      /**
       * Compute the difference between the members of the given sorted sets stored at the specified keys.
       *
       * @param {...string} keys - The keys where the sorted sets are stored.
       * @returns {Set} - A set containing the members present in the first sorted set but not in the others.
       */
      zdiff(...keys) {
        if (keys.length === 0) {
          return /* @__PURE__ */ new Set();
        }
        const sortedSets = keys.map((key) => {
          const isExpired = this._checkAndRemoveExpiredKey(key);
          if (isExpired) {
            return new XMap();
          }
          return this.store.get(key) || new XMap();
        });
        const firstSet = new Set(sortedSets[0].keys());
        for (let i2 = 1; i2 < sortedSets.length; i2++) {
          for (const member of sortedSets[i2].keys()) {
            firstSet.delete(member);
          }
        }
        return firstSet;
      }
      /**
       * Compute the difference between the given sorted sets stored at the specified keys and store the result in the destination key.
       *
       * @param {string} destination - The key where the result will be stored.
       * @param {...string} keys - The keys where the sorted sets are stored.
       * @returns {number} - The number of members in the resulting sorted set.
       */
      zdiffstore(destination, ...keys) {
        const diff = this.ZDIFF(...keys);
        const resultMap = new XMap();
        for (const member of diff) {
          const scores = keys.map((key) => {
            const sortedSet = this.store.get(key);
            return sortedSet ? sortedSet.get(member) : void 0;
          }).filter((score) => score !== void 0);
          if (scores.length > 0) {
            resultMap.set(member, Math.min(...scores));
          }
        }
        this.storeSet(destination, resultMap);
        return resultMap.size;
      }
      /**
       * Blockingly pop members with the lowest scores from multiple sorted sets.
       *
       * @param {number} count - The number of members to pop.
       * @param {...string} keys - The keys where the sorted sets are stored.
       * @returns {Array} - An array containing the key and the popped members with their scores.
       */
      bzmpop(count, ...keys) {
        const result = [];
        for (const key of keys) {
          const sortedSet = this.store.get(key);
          if (sortedSet && sortedSet.size > 0) {
            const poppedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]).slice(0, count).map(([member, score]) => {
              sortedSet.delete(member);
              return [member, score];
            });
            result.push([key, ...poppedMembers]);
            break;
          }
        }
        return result;
      }
      /**
       * Pop the specified number of members with the highest scores from a sorted set.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} count - The number of members to pop.
       * @returns {Array} - An array containing the key and the popped members with their scores.
       */
      bzpopmax(key, count) {
        const sortedSet = this.store.get(key);
        if (!sortedSet || sortedSet.size === 0) {
          return [];
        }
        const poppedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => b2[1] - a2[1]).slice(0, count).map(([member, score]) => {
          sortedSet.delete(member);
          return [member, score];
        });
        return [key, ...poppedMembers];
      }
      /**
       * Pop the specified number of members with the lowest scores from a sorted set.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} count - The number of members to pop.
       * @returns {Array} - An array containing the key and the popped members with their scores.
       */
      bzpopmin(key, count) {
        const sortedSet = this.store.get(key);
        if (!sortedSet || sortedSet.size === 0) {
          return [];
        }
        const poppedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]).slice(0, count).map(([member, score]) => {
          sortedSet.delete(member);
          return [member, score];
        });
        return [key, ...poppedMembers];
      }
      /**
       * Increment the score of a member in a sorted set by the specified increment value.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} increment - The value to increment the score by.
       * @param {*} member - The member whose score to increment.
       * @returns {number} - The new score of the member.
       */
      zincrby(key, increment, member) {
        if (!this.store.has(key)) {
          this.storeSet(key, new XMap());
        }
        const sortedSet = this.store.get(key);
        const currentScore = sortedSet.get(member) || 0;
        const newScore = currentScore + Number(increment);
        sortedSet.set(member, newScore);
        return newScore;
      }
      /**
       * Compute the intersection between the members of the given sorted sets stored at the specified keys.
       *
       * @param {...string} keys - The keys where the sorted sets are stored.
       * @returns {Set} - A set containing the members present in all the sorted sets.
       */
      zinter(...keys) {
        if (keys.length === 0) {
          return /* @__PURE__ */ new Set();
        }
        const sortedSets = keys.map((key) => this.store.get(key) || new XMap());
        const firstSet = new Set(sortedSets[0].keys());
        for (let i2 = 1; i2 < sortedSets.length; i2++) {
          const intersection = /* @__PURE__ */ new Set();
          for (const member of sortedSets[i2].keys()) {
            if (firstSet.has(member)) {
              intersection.add(member);
            }
          }
          firstSet.clear();
          for (const member of intersection) {
            firstSet.add(member);
          }
        }
        return firstSet;
      }
      /**
       * Get the number of members in the intersection between the given sorted sets stored at the specified keys.
       *
       * @param {...string} keys - The keys where the sorted sets are stored.
       * @returns {number} - The number of members in the intersection.
       */
      zintercard(...keys) {
        const intersection = this.ZINTER(...keys);
        return intersection.size;
      }
      /**
       * Compute the intersection between the given sorted sets stored at the specified keys and store the result in the destination key.
       *
       * @param {string} destination - The key where the result will be stored.
       * @param {...string} keys - The keys where the sorted sets are stored.
       * @returns {number} - The number of members in the resulting sorted set.
       */
      zinterstore(destination, ...keys) {
        const intersection = this.ZINTER(...keys);
        const resultMap = new XMap();
        for (const member of intersection) {
          const scores = keys.map((key) => {
            const sortedSet = this.store.get(key);
            return sortedSet ? sortedSet.get(member) : void 0;
          }).filter((score) => score !== void 0);
          if (scores.length > 0) {
            resultMap.set(member, Math.max(...scores));
          }
        }
        this.storeSet(destination, resultMap);
        return resultMap.size;
      }
      /**
       * Count the number of members in a sorted set stored at the given key with scores between the given min and max values.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {*} min - The minimum score.
       * @param {*} max - The maximum score.
       * @returns {number} - The number of members with scores between min and max.
       */
      zlexcount(key, min, max) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.keys()).sort();
        let count = 0;
        for (const member of sortedMembers) {
          if (member >= min && member <= max) {
            count++;
          }
        }
        return count;
      }
      /**
       * Pop the specified number of members with the lowest scores from the given sorted sets.
       *
       * @param {number} count - The number of members to pop.
       * @param {...string} keys - The keys where the sorted sets are stored.
       * @returns {Array} - An array containing the key and the popped members with their scores.
       */
      zmpop(count, ...keys) {
        const result = [];
        for (const key of keys) {
          const sortedSet = this.store.get(key);
          if (sortedSet && sortedSet.size > 0) {
            const poppedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]).slice(0, count).map(([member, score]) => {
              sortedSet.delete(member);
              return [member, score];
            });
            result.push([key, ...poppedMembers]);
            break;
          }
        }
        return result;
      }
      /**
       * Get the scores of the specified members in a sorted set stored at the given key.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {...*} members - The members whose scores to retrieve.
       * @returns {Array} - An array containing the scores of the specified members.
       */
      zmscore(key, ...members) {
        const sortedSet = this.store.get(key) || new XMap();
        return members.map((member) => sortedSet.get(member));
      }
      /**
       * Pop the specified number of members with the highest scores from a sorted set.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} count - The number of members to pop.
       * @returns {Array} - An array containing the popped members with their scores.
       */
      zpopmax(key, count) {
        const sortedSet = this.store.get(key);
        if (!sortedSet || sortedSet.size === 0) {
          return [];
        }
        const poppedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => b2[1] - a2[1]).slice(0, count).map(([member, score]) => {
          sortedSet.delete(member);
          return [member, score];
        });
        return poppedMembers;
      }
      /**
       * Pop the specified number of members with the lowest scores from a sorted set.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} count - The number of members to pop.
       * @returns {Array} - An array containing the popped members with their scores.
       */
      zpopmin(key, count) {
        const sortedSet = this.store.get(key);
        if (!sortedSet || sortedSet.size === 0) {
          return [];
        }
        const poppedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]).slice(0, count).map(([member, score]) => {
          sortedSet.delete(member);
          return [member, score];
        });
        return poppedMembers;
      }
      /**
       * Get the specified number of random members from a sorted set stored at the given key.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} [count=1] - The number of random members to retrieve.
       * @returns {Array} - An array containing the randomly chosen members.
       */
      zrandmember(key, count = 1) {
        const sortedSet = this.store.get(key);
        if (!sortedSet || sortedSet.size === 0) {
          return [];
        }
        const members = Array.from(sortedSet.keys());
        const result = [];
        for (let i2 = 0; i2 < count; i2++) {
          const randomIndex = Math.floor(Math.random() * members.length);
          result.push(members[randomIndex]);
        }
        return result;
      }
      /**
       * Get the members in a sorted set stored at the given key with their scores between the specified start and stop indices.
       *
       * @param {*} key - The key where the sorted set is stored.
       * @param {number} start - The start index.
       * @param {number} stop - The stop index.
       * @returns {Array} - An array containing the members and their scores within the specified range.
       */
      zrange(key, start, stop) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]);
        if (start < 0) start = sortedMembers.length + start;
        if (stop < 0) stop = sortedMembers.length + stop;
        return sortedMembers.slice(start, stop + 1).map(([member, score]) => [member, score]);
      }
      /**
       * Returns all elements in the sorted set stored at the key with a value between min and max (inclusive) in lexicographical order.
       * @param {*} key - The key of the sorted set.
       * @param {string} min - The minimum member value.
       * @param {string} max - The maximum member value.
       * @param {Object} [options={}] - Additional options (e.g., { limit: { offset, count } }).
       * @returns {string[]} - The filtered and sorted set members.
       */
      zrangebylex(key, min, max, options = {}) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.keys()).sort();
        let result = sortedMembers.filter((member) => member >= min && member <= max);
        if (options.limit) {
          const { offset, count } = options.limit;
          result = result.slice(offset, offset + count);
        }
        return result;
      }
      /**
       * Returns all elements in the sorted set stored at the key with a score between min and max (inclusive).
       * @param {*} key - The key of the sorted set.
       * @param {number} min - The minimum score value.
       * @param {number} max - The maximum score value.
       * @param {Object} [options={}] - Additional options (e.g., { withscores: true, limit: { offset, count } }).
       * @returns {(string[]|Array[])} - The filtered and sorted set members, with or without scores based on options.
       */
      zrangebyscore(key, min, max, options = {}) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]);
        let result = sortedMembers.filter(([, score]) => score >= min && score <= max);
        if (options.withscores) {
          result = result.map(([member, score]) => [member, score]);
        } else {
          result = result.map(([member]) => member);
        }
        if (options.limit) {
          const { offset, count } = options.limit;
          result = result.slice(offset, offset + count);
        }
        return result;
      }
      /**
       * Copies a range of elements from a sorted set to another sorted set.
       * @param {string} destination - The destination key for the new sorted set.
       * @param {*} key - The key of the source sorted set.
       * @param {number} start - The starting index.
       * @param {number} stop - The ending index.
       * @returns {number} - The number of elements in the new sorted set.
       */
      zrangestore(destination, key, start, stop) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]);
        if (start < 0) start = sortedMembers.length + start;
        if (stop < 0) stop = sortedMembers.length + stop;
        const resultMap = new XMap(sortedMembers.slice(start, stop + 1));
        this.storeSet(destination, resultMap);
        return resultMap.size;
      }
      /**
       * Determines the index of a member in the sorted set stored at the key.
       * @param {*} key - The key of the sorted set.
       * @param {string} member - The member to find the index of.
       * @returns {(number|undefined)} - The index of the member, or undefined if not found.
       */
      zrank(key, member) {
        const sortedSet = this.store.get(key);
        if (!sortedSet)
          return void 0;
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]);
        for (let i2 = 0; i2 < sortedMembers.length; i2++) {
          if (sortedMembers[i2][0] === member) {
            return i2;
          }
        }
        return void 0;
      }
      /**
       * Removes one or more members from the sorted set stored at the key.
       * @param {*} key - The key of the sorted set.
       * @param {...string} members - The members to remove from the sorted set.
       * @returns {number} - The number of members removed.
       */
      zrem(key, ...members) {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return 0;
        }
        let removedCount = 0;
        for (const member of members) {
          if (sortedSet.delete(member)) {
            removedCount++;
          }
        }
        return removedCount;
      }
      /**
       * Removes all elements in the sorted set stored at the key with a value between min and max (inclusive) in lexicographical order.
       * @param {*} key - The key of the sorted set.
       * @param {string} min - The minimum member value.
       * @param {string} max - The maximum member value.
       * @returns {number} - The number of members removed.
       */
      zremrangebylex(key, min, max) {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return 0;
        }
        const sortedMembers = Array.from(sortedSet.keys()).sort();
        let removedCount = 0;
        for (const member of sortedMembers) {
          if (member >= min && member <= max) {
            sortedSet.delete(member);
            removedCount++;
          }
        }
        return removedCount;
      }
      /**
       * Removes all elements in the sorted set stored at key with rank between start and stop.
       * @param {string} key - The key of the sorted set.
       * @param {number} start - The start rank.
       * @param {number} stop - The stop rank.
       * @returns {number} - The number of elements removed.
       */
      zremrangebyrank(key, start, stop) {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return 0;
        }
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]);
        if (start < 0) start = sortedMembers.length + start;
        if (stop < 0) stop = sortedMembers.length + stop;
        let removedCount = 0;
        for (let i2 = start; i2 <= stop; i2++) {
          if (sortedSet.delete(sortedMembers[i2][0])) {
            removedCount++;
          }
        }
        return removedCount;
      }
      /**
       * Removes all elements in the sorted set stored at key with a score between min and max (inclusive).
       * @param {string} key - The key of the sorted set.
       * @param {number} min - The minimum score.
       * @param {number} max - The maximum score.
       * @returns {number} - The number of elements removed.
       */
      zremrangebyscore(key, min, max) {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return 0;
        }
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]);
        let removedCount = 0;
        for (const [member, score] of sortedMembers) {
          if (score >= min && score <= max) {
            sortedSet.delete(member);
            removedCount++;
          }
        }
        return removedCount;
      }
      /**
       * Returns the specified range of elements in the sorted set stored at key in reverse order.
       * @param {string} key - The key of the sorted set.
       * @param {number} start - The start index.
       * @param {number} stop - The stop index.
       * @returns {Array} - The specified range of elements in reverse order.
       */
      zrevrange(key, start, stop) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => b2[1] - a2[1]);
        if (start < 0) start = sortedMembers.length + start;
        if (stop < 0) stop = sortedMembers.length + stop;
        return sortedMembers.slice(start, stop + 1).map(([member, score]) => [member, score]);
      }
      /**
       * Returns all elements in the sorted set stored at key with a value between max and min.
       * @param {string} key - The key of the sorted set.
       * @param {*} max - The maximum value.
       * @param {*} min - The minimum value.
       * @param {Object} options - Additional options.
       * @returns {Array} - The specified range of elements.
       */
      zrevrangebylex(key, max, min, options = {}) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.keys()).sort().reverse();
        let result = sortedMembers.filter((member) => member >= min && member <= max);
        if (options.limit) {
          const { offset, count } = options.limit;
          result = result.slice(offset, offset + count);
        }
        return result;
      }
      /**
       * Returns all elements in the sorted set stored at key with a score between max and min (inclusive) in reverse order.
       * @param {string} key - The key of the sorted set.
       * @param {number} max - The maximum score.
       * @param {number} min - The minimum score.
       * @param {Object} options - Additional options.
       * @returns {Array} - The specified range of elements in reverse order.
       */
      zrevrangebyscore(key, max, min, options = {}) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => b2[1] - a2[1]);
        let result = sortedMembers.filter(([, score]) => score >= min && score <= max);
        if (options.withscores) {
          result = result.map(([member, score]) => [member, score]);
        } else {
          result = result.map(([member]) => member);
        }
        if (options.limit) {
          const { offset, count } = options.limit;
          result = result.slice(offset, offset + count);
        }
        return result;
      }
      /**
       * Returns the rank of member in the sorted set stored at key, with the scores ordered from high to low.
       * @param {string} key - The key of the sorted set.
       * @param {*} member - The member whose rank to determine.
       * @returns {number|undefined} - The rank of the member, or undefined if the member or sorted set does not exist.
       */
      zrevrank(key, member) {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return void 0;
        }
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => b2[1] - a2[1]);
        for (let i2 = 0; i2 < sortedMembers.length; i2++) {
          if (sortedMembers[i2][0] === member) {
            return i2;
          }
        }
        return void 0;
      }
      /**
       * Incrementally iterates the elements of the sorted set stored at key.
       * @param {string} key - The key of the sorted set.
       * @param {number} cursor - The cursor position.
       * @param {Object} options - Additional options.
       * @returns {Array} - An array containing the next cursor and the result.
       */
      zscan(key, cursor, options = {}) {
        const sortedSet = this.store.get(key) || new XMap();
        const sortedMembers = Array.from(sortedSet.entries()).sort((a2, b2) => a2[1] - b2[1]);
        const result = [];
        let count = options.count || 10;
        let index = cursor;
        while (count > 0 && index < sortedMembers.length) {
          if (!options.match || new RegExp(options.match.replace("*", ".*")).test(sortedMembers[index][0])) {
            result.push(sortedMembers[index]);
            count--;
          }
          index++;
        }
        return [index >= sortedMembers.length ? 0 : index, result];
      }
      /**
       * Returns the score of a member in the sorted set stored at key.
       * @param {string} key - The key of the sorted set.
       * @param {*} member - The member whose score to retrieve.
       * @returns {number|undefined} - The score of the member, or undefined if the member or sorted set does not exist.
       */
      zscore(key, member) {
        const sortedSet = this.store.get(key);
        if (!sortedSet)
          return void 0;
        return sortedSet.get(member);
      }
      /**
       * Computes the union of multiple sorted sets specified by the keys array.
       * @param {Array<string>} keys - An array of keys identifying the sorted sets to be combined.
       * @returns {Array} - The union of the specified sorted sets, sorted by score.
       */
      zunion(keys) {
        const unionMap = new XMap();
        for (const key of keys) {
          const sortedSet = this.store.get(key);
          if (sortedSet) {
            for (const [member, score] of sortedSet.entries()) {
              unionMap.set(member, (unionMap.get(member) || 0) + score);
            }
          }
        }
        return Array.from(unionMap.entries()).sort((a2, b2) => a2[1] - b2[1]);
      }
      /**
       * Computes the union of multiple sorted sets specified by the keys array and stores the result in a new sorted set with the given destination key.
       * @param {string} destination - The key of the new sorted set where the result will be stored.
       * @param {Array<string>} keys - An array of keys identifying the sorted sets to be combined.
       * @returns {number} - The size of the resulting sorted set.
       */
      zunionstore(destination, keys) {
        const unionResult = this.zunion(keys);
        const resultMap = new XMap(unionResult);
        this.storeSet(destination, resultMap);
        return resultMap.size;
      }
      /**
       * Adds the specified geospatial item to the sorted set stored at key.
       * @param {*} key - The key of the sorted set.
       * @param {number} longitude - The longitude of the geospatial item.
       * @param {number} latitude - The latitude of the geospatial item.
       * @param {string} member - The member to be added to the sorted set.
       * @returns {number} - The number of elements added to the sorted set (0 or 1).
       */
      geoadd(key, longitude, latitude, member) {
        if (typeof longitude !== "number" || typeof latitude !== "number") {
          throw new Error("Invalid longitude or latitude value");
        }
        const sortedSet = this.store.get(key) || new XMap();
        const existingMember = sortedSet.get(member);
        if (!existingMember) {
          const geoData = { longitude, latitude };
          sortedSet.set(member, geoData);
          this.storeSet(key, sortedSet);
          return 1;
        }
        return 0;
      }
      /**
       * Calculates the distance between two geospatial items.
       * @param {*} key - The key of the sorted set.
       * @param {string} member1 - The first member in the sorted set.
       * @param {string} member2 - The second member in the sorted set.
       * @param {string} [unit='m'] - The unit of the returned distance (m, km, mi, ft).
       * @returns {number|undefined} - The distance between the two members or undefined if not found.
       */
      geodist(key, member1, member2, unit = "m") {
        const sortedSet = this.store.get(key);
        if (!sortedSet)
          return void 0;
        const pos1 = sortedSet.get(member1);
        const pos2 = sortedSet.get(member2);
        if (!pos1 || !pos2)
          return void 0;
        const distance = this._haversineDistance(pos1.latitude, pos1.longitude, pos2.latitude, pos2.longitude);
        return this._convertDistance(distance, unit);
      }
      /**
       * Returns the geohash string of one or more members.
       * @param {*} key - The key of the sorted set.
       * @param {...string} members - One or more members for which to return the geohash.
       * @returns {string[]} - An array of geohash strings for the requested members.
       */
      geohash(key, ...members) {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return [];
        }
        return members.map((member) => {
          const pos = sortedSet.get(member);
          return pos ? this._encodeGeohash(pos.latitude, pos.longitude) : null;
        });
      }
      /**
       * Returns the positions (latitude, longitude) of one or more members.
       * @param {*} key - The key of the sorted set.
       * @param {...string} members - One or more members for which to return the positions.
       * @returns {Array<[number, number]>} - An array of positions for the requested members.
       */
      geopos(key, ...members) {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return [];
        }
        return members.map((member) => {
          const pos = sortedSet.get(member);
          return pos ? [pos.latitude, pos.longitude] : null;
        });
      }
      /**
       * Returns members of a sorted set whose positions are within the specified radius from the given point.
       * @param {*} key - The key of the sorted set.
       * @param {number} longitude - The longitude of the center point.
       * @param {number} latitude - The latitude of the center point.
       * @param {number} radius - The search radius.
       * @param {string} [unit='m'] - The unit of the search radius (m, km, mi, ft).
       * @returns {string[]} - An array of members within the specified radius.
       */
      georadius(key, longitude, latitude, radius, unit = "m") {
        const sortedSet = this.store.get(key);
        if (!sortedSet) {
          return [];
        }
        const convertedRadius = this._convertDistance(radius, unit, "m");
        const result = [];
        for (const [member, pos] of sortedSet.entries()) {
          const distance = this._haversineDistance(latitude, longitude, pos.latitude, pos.longitude);
          if (distance <= convertedRadius) {
            result.push(member);
          }
        }
        return result;
      }
      /**
       * Computes the members of a geospatial index within the given radius (read-only version).
       * @param {number} latitude - The latitude of the center point.
       * @param {number} longitude - The longitude of the center point.
       * @param {number} radius - The radius to search within.
       * @param {string} key - The key of the geospatial index.
       * @returns {Array} - An array of members within the specified radius.
       */
      georadius_ro(latitude, longitude, radius, key) {
        return this.georadius(latitude, longitude, radius, key, true);
      }
      /**
       * Computes the members of a geospatial index within the given radius around a specified member's coordinates.
       * @param {string} key - The key of the geospatial index.
       * @param {*} member - The member around which to search.
       * @param {number} radius - The radius to search within.
       * @returns {Array|undefined} - An array of members within the specified radius or undefined if the member is not found.
       */
      georadiusbymember(key, member, radius) {
        const coord = this.geopos(key, member);
        if (!coord) return void 0;
        return this.georadius(coord[0], coord[1], radius, key);
      }
      /**
       * Computes the members of a geospatial index within the given radius around a specified member's coordinates (read-only version).
       * @param {string} key - The key of the geospatial index.
       * @param {*} member - The member around which to search.
       * @param {number} radius - The radius to search within.
       * @returns {Array|undefined} - An array of members within the specified radius or undefined if the member is not found.
       */
      georadiusbymember_ro(key, member, radius) {
        const coord = this.geopos(key, member);
        if (!coord) return void 0;
        return this.georadius(coord[0], coord[1], radius, key, true);
      }
      /**
       * Searches for members within a specified radius around a given point in a geospatial index.
       * @param {string} key - The key of the geospatial index.
       * @param {number} latitude - The latitude of the center point.
       * @param {number} longitude - The longitude of the center point.
       * @param {number} radius - The radius to search within.
       * @returns {Array} - An array of members within the specified radius.
       */
      geosearch(key, latitude, longitude, radius) {
        return this.georadius(latitude, longitude, radius, key);
      }
      /**
       * Searches for members within a specified radius around a given point in a geospatial index and stores the results in a new key.
       * @param {string} destinationKey - The key where the results will be stored.
       * @param {string} key - The key of the geospatial index.
       * @param {number} latitude - The latitude of the center point.
       * @param {number} longitude - The longitude of the center point.
       * @param {number} radius - The radius to search within.
       * @returns {number} - The number of members found within the specified radius.
       */
      geosearchstore(destinationKey, key, latitude, longitude, radius) {
        const results = this.georadius(latitude, longitude, radius, key);
        this.set(destinationKey, results);
        return results.length;
      }
      /**
       * Scans keys based on the given cursor, match pattern, and count.
       * @param {number} cursor - The starting index for the scan.
       * @param {string} [match='*'] - The pattern to match keys against.
       * @param {number} [count=10] - The maximum number of keys to return.
       * @returns {[number, string[]]} - An array containing the next cursor and the matched keys.
       */
      scan(cursor, match = "*", count = 10) {
        const keys = this.keys(match);
        const endIndex = Math.min(cursor + count, keys.length);
        const nextCursor = endIndex === keys.length ? 0 : endIndex;
        return [nextCursor, keys.slice(cursor, endIndex)];
      }
      /**
       * Sorts the elements in the list, set, or sorted set stored at the key.
       * @param {*} key - The key to retrieve the list, set, or sorted set.
       * @param {string} [order='ASC'] - The order to sort the elements (ASC or DESC).
       * @param {boolean} [alpha=false] - Whether to sort elements alphabetically or numerically.
       * @returns {Array} - The sorted elements.
       */
      sort(key, order = "ASC", alpha = false) {
        const list = this.store.get(key);
        if (!Array.isArray(list)) return [];
        const sorted = list.slice().sort((a2, b2) => {
          if (alpha) {
            return order === "ASC" ? a2.localeCompare(b2) : b2.localeCompare(a2);
          } else {
            return order === "ASC" ? a2 - b2 : b2 - a2;
          }
        });
        return sorted;
      }
      /**
       * Alters the last access time of a key(s).
       * @param {...string} keys - The keys to update the access time.
       * @returns {number} - The number of existing keys touched.
       */
      touch(...keys) {
        return keys.reduce((acc, key) => acc + (this.exists(key) ? 1 : 0), 0);
      }
      /**
       * Alias for the sort method that sorts elements in a read-only manner.
       * @param {*} key - The key to retrieve the list, set, or sorted set.
       * @param {string} [order='ASC'] - The order to sort the elements (ASC or DESC).
       * @param {boolean} [alpha=false] - Whether to sort elements alphabetically or numerically.
       * @returns {Array} - The sorted elements.
       */
      sort_ro(key, order = "ASC", alpha = false) {
        return this.sort(key, order, alpha);
      }
      /**
       * Unlinks (deletes) the specified keys.
       * @param {...string} keys - The keys to be removed.
       * @returns {number} - The number of keys removed.
       */
      unlink(...keys) {
        let removed = 0;
        for (const key of keys) {
          if (this.del(key)) {
            removed++;
          }
        }
        return removed;
      }
      /**
       * Set the value of a field in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {string} field - The field to set the value for.
       * @param {*} value - The value to set.
       * @returns {number} - Returns 1 if a new field is created, 0 otherwise.
       */
      hset(key, field, value) {
        if (!this.store.has(key)) {
          this.storeSet(key, new XMap());
        }
        const hashMap = this.store.get(key);
        const isNewField = !hashMap.has(field);
        hashMap.set(field, value);
        return isNewField ? 1 : 0;
      }
      /**
       * Delete one or more fields from a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {...string} fields - The fields to delete.
       * @returns {number} - The number of fields removed from the hash.
       */
      hdel(key, ...fields) {
        const hashMap = this.store.get(key);
        if (!hashMap) return 0;
        let removed = 0;
        for (const field of fields) {
          if (hashMap.delete(field)) {
            removed++;
          }
        }
        return removed;
      }
      /**
       * Get the value of a field in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {string} field - The field to get the value for.
       * @returns {*} - The value of the field, or undefined if the field does not exist.
       */
      hget(key, field) {
        const hashMap = this.store.get(key);
        return hashMap ? hashMap.get(field) : void 0;
      }
      /**
       * Get all fields and their values in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @returns {Object} - An object containing field-value pairs,
       *                     or an empty object if the hash does not exist.
       */
      hgetall(key) {
        const hashMap = this.store.get(key);
        if (!hashMap) return {};
        const result = {};
        for (const [field, value] of hashMap) {
          result[field] = value;
        }
        return result;
      }
      /**
       * Increment the integer value of a field in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {string} field - The field to increment.
       * @param {number} increment - The value to increment by.
       * @returns {number} - The new value of the field after the increment.
       */
      hincrby(key, field, increment) {
        const hashMap = this.store.get(key) || new XMap();
        const currentValue = parseInt(hashMap.get(field) || 0, 10);
        const newValue = currentValue + increment;
        hashMap.set(field, newValue.toString());
        this.storeSet(key, hashMap);
        return newValue;
      }
      /**
       * Increment the float value of a field in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {string} field - The field to increment.
       * @param {number} increment - The value to increment by.
       * @returns {number} - The new value of the field after the increment.
       */
      hincrbyfloat(key, field, increment) {
        const hashMap = this.store.get(key) || new XMap();
        const currentValue = parseFloat(hashMap.get(field) || 0);
        const newValue = currentValue + increment;
        hashMap.set(field, newValue.toString());
        this.storeSet(key, hashMap);
        return newValue;
      }
      /**
       * Get all field names in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @returns {Array} - An array of field names, or an empty array if the hash does not exist.
       */
      hkeys(key) {
        const hashMap = this.store.get(key);
        return hashMap ? Array.from(hashMap.keys()) : [];
      }
      /**
       * Get the number of fields in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @returns {number} - The number of fields in the hash, or 0 if the hash does not exist.
       */
      hlen(key) {
        const hashMap = this.store.get(key);
        return hashMap ? hashMap.size : 0;
      }
      /**
       * Get the values of multiple fields in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {...string} fields - The fields to get the values for.
       * @returns {Array} - An array of field values.
       */
      hmget(key, ...fields) {
        const hashMap = this.store.get(key) || new XMap();
        return fields.map((field) => hashMap.get(field));
      }
      /**
       * Set the values of multiple fields in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {...*} fieldValuePairs - An array of field-value pairs.
       * @returns {string} - Returns "OK" on successful update.
       */
      hmset(key, ...fieldValuePairs) {
        const hashMap = this.store.get(key) || new XMap();
        for (let i2 = 0; i2 < fieldValuePairs.length; i2 += 2) {
          const field = fieldValuePairs[i2];
          const value = fieldValuePairs[i2 + 1];
          hashMap.set(field, value);
        }
        this.storeSet(key, hashMap);
        return true;
      }
      /**
       * Set the value of a field in a hash stored at the given key, only if the field does not exist.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {string} field - The field to set the value for.
       * @param {*} value - The value to set.
       * @returns {number} - Returns 1 if the field is newly created, 0 otherwise.
       */
      hsetnx(key, field, value) {
        const hashMap = this.store.get(key) || new XMap();
        if (hashMap.has(field)) {
          return 0;
        }
        hashMap.set(field, value);
        this.storeSet(key, hashMap);
        return 1;
      }
      /**
       * Get the length of the string value of a field in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {string} field - The field to get the value length for.
       * @returns {number} - The length of the field value, or 0 if the field does not exist.
       */
      hstrlen(key, field) {
        const hashMap = this.store.get(key);
        const value = hashMap ? hashMap.get(field) : null;
        return value ? value.length : 0;
      }
      /**
       * Get all values in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @returns {Array} - An array of field values, or an empty array if the hash does not exist.
       */
      hvals(key) {
        const hashMap = this.store.get(key);
        return hashMap ? Array.from(hashMap.values()) : [];
      }
      /**
       * Incrementally iterate over a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {number} cursor - The starting position for the iteration.
       * @param {string} match - The pattern to filter field names (default is "*").
       * @param {number} count - The maximum number of elements to return (default is 10).
       * @returns {Array} - An array containing the next cursor and the filtered field-value pairs.
       */
      hscan(key, cursor, match = "*", count = 10) {
        const hashMap = this.store.get(key) || new XMap();
        const filteredFields = Array.from(hashMap.keys()).filter((field) => field.includes(match));
        const endIndex = Math.min(cursor + count, filteredFields.length);
        const nextCursor = endIndex === filteredFields.length ? 0 : endIndex;
        return [nextCursor, filteredFields.slice(cursor, endIndex).map((field) => [field, hashMap.get(field)])];
      }
      /**
       * Check if a field exists in a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {string} field - The field to check for existence.
       * @returns {number} - Returns 1 if the field exists, 0 otherwise.
       */
      hexists(key, field) {
        const hashMap = this.store.get(key);
        return hashMap && hashMap.has(field) ? 1 : 0;
      }
      /**
       * Get random field(s) from a hash stored at the given key.
       *
       * @param {*} key - The key where the hash is stored.
       * @param {number} count - The number of random fields to return (default is 1).
       * @returns {Array} - An array of random field names, or an empty array if the hash does not exist.
       */
      hrandfield(key, count = 1) {
        const hashMap = this.store.get(key);
        if (!hashMap) return [];
        const fields = Array.from(hashMap.keys());
        const result = [];
        for (let i2 = 0; i2 < count; i2++) {
          const randomIndex = Math.floor(Math.random() * fields.length);
          result.push(fields[randomIndex]);
        }
        return result;
      }
      /**
       * Checks if a key has expired and removes it if it has.
       * @param {*} key - The key to check for expiration.
       * @returns {boolean} - Returns true if the key was expired and removed, false otherwise.
       */
      _checkAndRemoveExpiredKey(key) {
        const expireTime = this.expireTimes.get(key);
        if (expireTime && Date.now() > expireTime) {
          this.store.delete(key);
          this.expireTimes.delete(key);
          if (this.isIndexedDBAvailable && this.db) {
            this._removeFromIndexedDB(key);
          }
          return true;
        }
        return false;
      }
      /**
       * Initializes a cleanup loop that runs at a specified interval and removes expired keys from the store.
       * @param {number} cleanupIntervalMs - The interval, in milliseconds, at which the cleanup loop should run.
       */
      _initCleanupLoop(cleanupIntervalMs) {
        if (this.store.size === 1) {
          this.cleanupLoop = setInterval(() => {
            if (this.store.size === 0 && this.cleanupLoop) {
              clearInterval(this.cleanupLoop);
            } else {
              for (const key of this.expireTimes.keys()) {
                this._checkAndRemoveExpiredKey(key);
              }
            }
          }, cleanupIntervalMs);
          if (typeof this.cleanupLoop === "object" && typeof this.cleanupLoop.unref === "function") {
            this.cleanupLoop.unref();
          }
        }
      }
      /**
       * Calculates the haversine distance between two geographic coordinates.
       * @param {number} lat1 - The latitude of the first coordinate.
       * @param {number} lon1 - The longitude of the first coordinate.
       * @param {number} lat2 - The latitude of the second coordinate.
       * @param {number} lon2 - The longitude of the second coordinate.
       * @returns {number} - The haversine distance in meters.
       */
      _haversineDistance(lat1, lon1, lat2, lon2) {
        const toRadians = (angle) => angle * Math.PI / 180;
        const R2 = 6371e3;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a2 = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c2 = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
        return R2 * c2;
      }
      /**
       * Converts a distance value from one unit to another.
       * @param {number} distance - The distance value to convert.
       * @param {string} fromUnit - The unit of the given distance (m, km, mi, ft).
       * @param {string} toUnit - The target unit to convert the distance to (m, km, mi, ft).
       * @returns {number} - The distance value converted to the target unit.
       */
      _convertDistance(distance, fromUnit, toUnit) {
        const conversionFactors = {
          m: 1,
          km: 1e-3,
          mi: 621371e-9,
          ft: 3.28084
        };
        if (!conversionFactors[fromUnit] || !conversionFactors[toUnit]) {
          throw new Error("Invalid distance unit");
        }
        return distance * conversionFactors[fromUnit] / conversionFactors[toUnit];
      }
      /**
       * Encodes a geographic coordinate (latitude, longitude) into a geohash string.
       * @param {number} latitude - The latitude of the coordinate.
       * @param {number} longitude - The longitude of the coordinate.
       * @returns {string} - The geohash string.
       */
      _encodeGeohash(latitude, longitude) {
        const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
        let hash = "";
        let minLat = -90;
        let maxLat = 90;
        let minLon = -180;
        let maxLon = 180;
        let even = true;
        let bit = 0;
        let charIndex = 0;
        while (hash.length < 12) {
          if (even) {
            const midLon = (minLon + maxLon) / 2;
            if (longitude > midLon) {
              charIndex = (charIndex << 1) + 1;
              minLon = midLon;
            } else {
              charIndex = charIndex << 1;
              maxLon = midLon;
            }
          } else {
            const midLat = (minLat + maxLat) / 2;
            if (latitude > midLat) {
              charIndex = (charIndex << 1) + 1;
              minLat = midLat;
            } else {
              charIndex = charIndex << 1;
              maxLat = midLat;
            }
          }
          even = !even;
          if (bit < 4) {
            bit++;
          } else {
            hash += base32[charIndex];
            bit = 0;
            charIndex = 0;
          }
        }
        return hash;
      }
      /**
       * Removes all keys and associated values from the store and clears all expiration times
       * @returns {boolean} - Returns true if the function was successful.
       */
      flushall() {
        this.store.clear();
        this.expireTimes.clear();
        if (this.isIndexedDBAvailable && this.db) {
          this._clearIndexedDB();
        }
        return true;
      }
      /**
       * Clear all data from IndexedDB
       * @private
       */
      async _clearIndexedDB() {
        if (!this.db) return;
        try {
          const transaction = this.db.transaction(["store", "expireTimes"], "readwrite");
          const storeObjectStore = transaction.objectStore("store");
          const expireTimesObjectStore = transaction.objectStore("expireTimes");
          storeObjectStore.clear();
          expireTimesObjectStore.clear();
        } catch (error) {
          console.warn("Failed to clear IndexedDB:", error);
        }
      }
    };
    module2.exports = kvjs2;
  }
});

// node_modules/@heyputer/puter.js/src/index.js
var import_putility12 = __toESM(require_putility());
var import_kv = __toESM(require_kv());

// node_modules/@heyputer/puter.js/src/lib/APICallLogger.js
var APICallLogger = class {
  constructor(config = {}) {
    this.config = __spreadValues({
      enabled: config.enabled ?? false
    }, config);
  }
  /**
   * Updates the logger configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = __spreadValues(__spreadValues({}, this.config), newConfig);
  }
  /**
   * Enables API call logging
   */
  enable() {
    this.config.enabled = true;
  }
  /**
   * Disables API call logging
   */
  disable() {
    this.config.enabled = false;
  }
  /**
   * Checks if logging is enabled for the current configuration
   * @returns {boolean}
   */
  isEnabled() {
    return this.config.enabled;
  }
  /**
   * Logs the completion of an API request in a simple format
   * @param {Object} options - Request completion options
   */
  logRequest(options = {}) {
    if (!this.isEnabled()) return;
    const {
      service = "unknown",
      operation = "unknown",
      params = {},
      result = null,
      error = null
    } = options;
    let paramsStr = "{}";
    if (params && Object.keys(params).length > 0) {
      try {
        paramsStr = JSON.stringify(params);
      } catch (e2) {
        paramsStr = "[Unable to serialize params]";
      }
    }
    const logMessage = `${service} - ${operation} - \x1B[1m${paramsStr}\x1B[22m`;
    if (error) {
      console.error(logMessage, { error: error.message || error, result });
    } else {
      console.log(logMessage, result);
    }
  }
  /**
   * Gets current logging statistics
   * @returns {Object}
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      config: __spreadValues({}, this.config)
    };
  }
};
var APICallLogger_default = APICallLogger;

// node_modules/@heyputer/puter.js/src/lib/path.js
var cwd;
var CHAR_DOT = 46;
var CHAR_FORWARD_SLASH = 47;
function isPosixPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH;
}
function normalizeString(path2, allowAboveRoot, separator, isPathSeparator) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code = 0;
  for (let i2 = 0; i2 <= path2.length; ++i2) {
    if (i2 < path2.length) {
      code = path2.charCodeAt(i2);
    } else if (isPathSeparator(code)) {
      break;
    } else {
      code = CHAR_FORWARD_SLASH;
    }
    if (isPathSeparator(code)) {
      if (lastSlash === i2 - 1 || dots === 1) {
      } else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== CHAR_DOT || res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(res, separator);
            }
            lastSlash = i2;
            dots = 0;
            continue;
          } else if (res.length !== 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = i2;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? `${separator}..` : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `${separator}${path2.slice(lastSlash + 1, i2)}`;
        } else {
          res = path2.slice(lastSlash + 1, i2);
        }
        lastSegmentLength = i2 - lastSlash - 1;
      }
      lastSlash = i2;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
var path = {
  // path.resolve([from ...], to)
  resolve(...args) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for (let i2 = args.length - 1; i2 >= -1 && !resolvedAbsolute; i2--) {
      const path2 = i2 >= 0 ? args[i2] : cwd !== void 0 ? cwd : "/";
      if (path2.length === 0) {
        continue;
      }
      resolvedPath = `${path2}/${resolvedPath}`;
      resolvedAbsolute = path2.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
      return `/${resolvedPath}`;
    }
    return resolvedPath.length > 0 ? resolvedPath : ".";
  },
  normalize(path2) {
    if (path2.length === 0) {
      return ".";
    }
    const isAbsolute = path2.charCodeAt(0) === CHAR_FORWARD_SLASH;
    const trailingSeparator = path2.charCodeAt(path2.length - 1) === CHAR_FORWARD_SLASH;
    path2 = normalizeString(path2, !isAbsolute, "/", isPosixPathSeparator);
    if (path2.length === 0) {
      if (isAbsolute) {
        return "/";
      }
      return trailingSeparator ? "./" : ".";
    }
    if (trailingSeparator) {
      path2 += "/";
    }
    return isAbsolute ? `/${path2}` : path2;
  },
  isAbsolute(path2) {
    return path2.length > 0 && path2.charCodeAt(0) === CHAR_FORWARD_SLASH;
  },
  join(...args) {
    if (args.length === 0) {
      return ".";
    }
    let joined;
    for (let i2 = 0; i2 < args.length; ++i2) {
      const arg = args[i2];
      if (arg.length > 0) {
        if (joined === void 0) {
          joined = arg;
        } else {
          joined += `/${arg}`;
        }
      }
    }
    if (joined === void 0) {
      return ".";
    }
    return path.normalize(joined);
  },
  relative(from, to) {
    if (from === to) {
      return "";
    }
    from = path.resolve(from);
    to = path.resolve(to);
    if (from === to) {
      return "";
    }
    const fromStart = 1;
    const fromEnd = from.length;
    const fromLen = fromEnd - fromStart;
    const toStart = 1;
    const toLen = to.length - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i2 = 0;
    for (; i2 < length; i2++) {
      const fromCode = from.charCodeAt(fromStart + i2);
      if (fromCode !== to.charCodeAt(toStart + i2)) {
        break;
      } else if (fromCode === CHAR_FORWARD_SLASH) {
        lastCommonSep = i2;
      }
    }
    if (i2 === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i2) === CHAR_FORWARD_SLASH) {
          return to.slice(toStart + i2 + 1);
        }
        if (i2 === 0) {
          return to.slice(toStart + i2);
        }
      } else if (fromLen > length) {
        if (from.charCodeAt(fromStart + i2) === CHAR_FORWARD_SLASH) {
          lastCommonSep = i2;
        } else if (i2 === 0) {
          lastCommonSep = 0;
        }
      }
    }
    let out = "";
    for (i2 = fromStart + lastCommonSep + 1; i2 <= fromEnd; ++i2) {
      if (i2 === fromEnd || from.charCodeAt(i2) === CHAR_FORWARD_SLASH) {
        out += out.length === 0 ? ".." : "/..";
      }
    }
    return `${out}${to.slice(toStart + lastCommonSep)}`;
  },
  toNamespacedPath(path2) {
    return path2;
  },
  dirname(path2) {
    if (path2.length === 0) {
      return ".";
    }
    const hasRoot = path2.charCodeAt(0) === CHAR_FORWARD_SLASH;
    let end = -1;
    let matchedSlash = true;
    for (let i2 = path2.length - 1; i2 >= 1; --i2) {
      if (path2.charCodeAt(i2) === CHAR_FORWARD_SLASH) {
        if (!matchedSlash) {
          end = i2;
          break;
        }
      } else {
        matchedSlash = false;
      }
    }
    if (end === -1) {
      return hasRoot ? "/" : ".";
    }
    if (hasRoot && end === 1) {
      return "//";
    }
    return path2.slice(0, end);
  },
  basename(path2, ext) {
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    if (ext !== void 0 && ext.length > 0 && ext.length <= path2.length) {
      if (ext === path2) {
        return "";
      }
      let extIdx = ext.length - 1;
      let firstNonSlashEnd = -1;
      for (let i2 = path2.length - 1; i2 >= 0; --i2) {
        const code = path2.charCodeAt(i2);
        if (code === CHAR_FORWARD_SLASH) {
          if (!matchedSlash) {
            start = i2 + 1;
            break;
          }
        } else {
          if (firstNonSlashEnd === -1) {
            matchedSlash = false;
            firstNonSlashEnd = i2 + 1;
          }
          if (extIdx >= 0) {
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                end = i2;
              }
            } else {
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }
      if (start === end) {
        end = firstNonSlashEnd;
      } else if (end === -1) {
        end = path2.length;
      }
      return path2.slice(start, end);
    }
    for (let i2 = path2.length - 1; i2 >= 0; --i2) {
      if (path2.charCodeAt(i2) === CHAR_FORWARD_SLASH) {
        if (!matchedSlash) {
          start = i2 + 1;
          break;
        }
      } else if (end === -1) {
        matchedSlash = false;
        end = i2 + 1;
      }
    }
    if (end === -1) {
      return "";
    }
    return path2.slice(start, end);
  },
  extname(path2) {
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for (let i2 = path2.length - 1; i2 >= 0; --i2) {
      const code = path2.charCodeAt(i2);
      if (code === CHAR_FORWARD_SLASH) {
        if (!matchedSlash) {
          startPart = i2 + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        matchedSlash = false;
        end = i2 + 1;
      }
      if (code === CHAR_DOT) {
        if (startDot === -1) {
          startDot = i2;
        } else if (preDotState !== 1) {
          preDotState = 1;
        }
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return "";
    }
    return path2.slice(startDot, end);
  },
  format: _format.bind(null, "/"),
  parse(path2) {
    const ret = { root: "", dir: "", base: "", ext: "", name: "" };
    if (path2.length === 0) {
      return ret;
    }
    const isAbsolute = path2.charCodeAt(0) === CHAR_FORWARD_SLASH;
    let start;
    if (isAbsolute) {
      ret.root = "/";
      start = 1;
    } else {
      start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i2 = path2.length - 1;
    let preDotState = 0;
    for (; i2 >= start; --i2) {
      const code = path2.charCodeAt(i2);
      if (code === CHAR_FORWARD_SLASH) {
        if (!matchedSlash) {
          startPart = i2 + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        matchedSlash = false;
        end = i2 + 1;
      }
      if (code === CHAR_DOT) {
        if (startDot === -1) {
          startDot = i2;
        } else if (preDotState !== 1) {
          preDotState = 1;
        }
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (end !== -1) {
      const start2 = startPart === 0 && isAbsolute ? 1 : startPart;
      if (startDot === -1 || // We saw a non-dot character immediately before the dot
      preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        ret.base = ret.name = path2.slice(start2, end);
      } else {
        ret.name = path2.slice(start2, startDot);
        ret.base = path2.slice(start2, end);
        ret.ext = path2.slice(startDot, end);
      }
    }
    if (startPart > 0) {
      ret.dir = path2.slice(0, startPart - 1);
    } else if (isAbsolute) {
      ret.dir = "/";
    }
    return ret;
  },
  sep: "/",
  delimiter: ":",
  win32: null,
  posix: null
};
function _format(sep, pathObject) {
  validateObject(pathObject, "pathObject");
  const dir = pathObject.dir || pathObject.root;
  const base = pathObject.base || `${pathObject.name || ""}${pathObject.ext || ""}`;
  if (!dir) {
    return base;
  }
  return dir === pathObject.root ? `${dir}${base}` : `${dir}${sep}${base}`;
}
var path_default = path;

// node_modules/@heyputer/puter.js/src/lib/polyfills/localStorage.js
var root = {};
var localStorageMemory = {};
var cache = {};
localStorageMemory.length = 0;
localStorageMemory.getItem = function(key) {
  if (key in cache) {
    return cache[key];
  }
  return null;
};
localStorageMemory.setItem = function(key, value) {
  if (typeof value === "undefined") {
    localStorageMemory.removeItem(key);
  } else {
    if (!cache.hasOwnProperty(key)) {
      localStorageMemory.length++;
    }
    cache[key] = `${value}`;
  }
};
localStorageMemory.removeItem = function(key) {
  if (cache.hasOwnProperty(key)) {
    delete cache[key];
    localStorageMemory.length--;
  }
};
localStorageMemory.key = function(index) {
  return Object.keys(cache)[index] || null;
};
localStorageMemory.clear = function() {
  cache = {};
  localStorageMemory.length = 0;
};
if (typeof exports === "object") {
  module.exports = localStorageMemory;
} else {
  root.localStorage = localStorageMemory;
}
var localStorage_default = localStorageMemory;

// node_modules/@heyputer/puter.js/src/lib/polyfills/xhrshim.js
var sReadyState = Symbol("readyState");
var sHeaders = Symbol("headers");
var sRespHeaders = Symbol("response headers");
var sAbortController = Symbol("AbortController");
var sMethod = Symbol("method");
var sURL = Symbol("URL");
var sMIME = Symbol("MIME");
var sDispatch = Symbol("dispatch");
var sErrored = Symbol("errored");
var sTimeout = Symbol("timeout");
var sTimedOut = Symbol("timedOut");
var sIsResponseText = Symbol("isResponseText");
function mergeUint8Arrays(...arrays) {
  const totalSize = arrays.reduce((acc, e2) => acc + e2.length, 0);
  const merged = new Uint8Array(totalSize);
  arrays.forEach((array, i2, arrays2) => {
    const offset = arrays2.slice(0, i2).reduce((acc, e2) => acc + e2.length, 0);
    merged.set(array, offset);
  });
  return merged;
}
async function parseBody(bytes) {
  const responseType = this.responseType || "text";
  const textde2 = new TextDecoder();
  const finalMIME = this[sMIME] || this[sRespHeaders].get("content-type") || "text/plain";
  switch (responseType) {
    case "text":
      this.response = textde2.decode(bytes);
      break;
    case "blob":
      this.response = new Blob([bytes], { type: finalMIME });
      break;
    case "arraybuffer":
      this.response = bytes.buffer;
      break;
    case "json":
      this.response = JSON.parse(textde2.decode(bytes));
      break;
  }
}
var XMLHttpRequestShim = class XMLHttpRequest2 extends EventTarget {
  onreadystatechange() {
  }
  set readyState(value) {
    if (this[sReadyState] === value) return;
    this[sReadyState] = value;
    this.dispatchEvent(new Event("readystatechange"));
    this.onreadystatechange(new Event("readystatechange"));
  }
  get readyState() {
    return this[sReadyState];
  }
  constructor() {
    super();
    this.readyState = this.constructor.UNSENT;
    this.response = null;
    this.responseType = "";
    this.responseURL = "";
    this.status = 0;
    this.statusText = "";
    this.timeout = 0;
    this.withCredentials = false;
    this[sHeaders] = /* @__PURE__ */ Object.create(null);
    this[sHeaders].accept = "*/*";
    this[sRespHeaders] = /* @__PURE__ */ Object.create(null);
    this[sAbortController] = new AbortController();
    this[sMethod] = "";
    this[sURL] = "";
    this[sMIME] = "";
    this[sErrored] = false;
    this[sTimeout] = 0;
    this[sTimedOut] = false;
    this[sIsResponseText] = true;
  }
  static get UNSENT() {
    return 0;
  }
  static get OPENED() {
    return 1;
  }
  static get HEADERS_RECEIVED() {
    return 2;
  }
  static get LOADING() {
    return 3;
  }
  static get DONE() {
    return 4;
  }
  upload = {
    addEventListener() {
    }
  };
  get responseText() {
    if (this[sErrored]) return null;
    if (this.readyState < this.constructor.HEADERS_RECEIVED) return "";
    if (this[sIsResponseText]) return this.response;
    throw new DOMException("Response type not set to text", "InvalidStateError");
  }
  get responseXML() {
    throw new Error("XML not supported");
  }
  [sDispatch](evt) {
    const attr = `on${evt.type}`;
    if (typeof this[attr] === "function") {
      this.addEventListener(evt.type, this[attr].bind(this), {
        once: true
      });
    }
    this.dispatchEvent(evt);
  }
  abort() {
    this[sAbortController].abort();
    this.status = 0;
    this.readyState = this.constructor.UNSENT;
  }
  open(method, url) {
    this.status = 0;
    this[sMethod] = method;
    this[sURL] = url;
    this.readyState = this.constructor.OPENED;
  }
  setRequestHeader(header, value) {
    header = String(header).toLowerCase();
    if (typeof this[sHeaders][header] === "undefined") {
      this[sHeaders][header] = String(value);
    } else {
      this[sHeaders][header] += `, ${value}`;
    }
  }
  overrideMimeType(mimeType) {
    this[sMIME] = String(mimeType);
  }
  getAllResponseHeaders() {
    if (this[sErrored] || this.readyState < this.constructor.HEADERS_RECEIVED) return "";
    return Array.from(this[sRespHeaders].entries().map(([header, value]) => `${header}: ${value}`)).join("\r\n");
  }
  getResponseHeader(headerName) {
    const value = this[sRespHeaders].get(String(headerName).toLowerCase());
    return typeof value === "string" ? value : null;
  }
  send(body = null) {
    if (this.timeout > 0) {
      this[sTimeout] = setTimeout(() => {
        this[sTimedOut] = true;
        this[sAbortController].abort();
      }, this.timeout);
    }
    const responseType = this.responseType || "text";
    this[sIsResponseText] = responseType === "text";
    this.setRequestHeader("user-agent", "puter-js/1.0");
    this.setRequestHeader("origin", "https://puter.work");
    this.setRequestHeader("referer", "https://puter.work/");
    fetch(this[sURL], {
      method: this[sMethod] || "GET",
      signal: this[sAbortController].signal,
      headers: this[sHeaders],
      credentials: this.withCredentials ? "include" : "same-origin",
      body
    }).then(async (resp) => {
      this.responseURL = resp.url;
      this.status = resp.status;
      this.statusText = resp.statusText;
      this[sRespHeaders] = resp.headers;
      this.readyState = this.constructor.HEADERS_RECEIVED;
      if (resp.headers.get("content-type").includes("application/x-ndjson") || this.streamRequestBadForPerformance) {
        let bytes = new Uint8Array();
        for await (const chunk of resp.body) {
          this.readyState = this.constructor.LOADING;
          bytes = mergeUint8Arrays(bytes, chunk);
          parseBody.call(this, bytes);
          this[sDispatch](new CustomEvent("progress"));
        }
      } else {
        const bytesChunks = [];
        for await (const chunk of resp.body) {
          bytesChunks.push(chunk);
        }
        parseBody.call(this, mergeUint8Arrays(...bytesChunks));
      }
      this.readyState = this.constructor.DONE;
      this[sDispatch](new CustomEvent("load"));
    }, (err) => {
      let eventName = "abort";
      if (err.name !== "AbortError") {
        this[sErrored] = true;
        eventName = "error";
      } else if (this[sTimedOut]) {
        eventName = "timeout";
      }
      this.readyState = this.constructor.DONE;
      this[sDispatch](new CustomEvent(eventName));
    }).finally(() => this[sDispatch](new CustomEvent("loadend"))).finally(() => {
      clearTimeout(this[sTimeout]);
      this[sDispatch](new CustomEvent("loadstart"));
    });
  }
};
if (typeof module === "object" && module.exports) {
  module.exports = XMLHttpRequestShim;
} else {
  (globalThis || self).XMLHttpRequestShim = XMLHttpRequestShim;
}
var xhrshim_default = XMLHttpRequestShim;

// node_modules/@heyputer/puter.js/src/lib/polyfills/fileReaderPoly.js
function toBase64FromBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((data, byte) => data + String.fromCharCode(byte), "");
  return typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}
var FileReaderPoly = class {
  constructor() {
    this.result = null;
    this.error = null;
    this.onloadend = null;
  }
  readAsDataURL(blob) {
    const self2 = this;
    (async function() {
      try {
        let buffer;
        if (blob && typeof blob.arrayBuffer === "function") {
          buffer = await blob.arrayBuffer();
        } else if (blob instanceof ArrayBuffer) {
          buffer = blob;
        } else if (ArrayBuffer.isView(blob)) {
          buffer = blob.buffer;
        } else {
          buffer = new Uint8Array(0).buffer;
        }
        const base64 = toBase64FromBuffer(buffer);
        const mime = blob && blob.type || "application/octet-stream";
        self2.result = "data:" + mime + ";base64," + base64;
        if (typeof self2.onloadend === "function") self2.onloadend();
      } catch (err) {
        self2.error = err;
        if (typeof self2.onloadend === "function") self2.onloadend();
      }
    })();
  }
};

// node_modules/@heyputer/puter.js/src/lib/utils.js
async function parseResponse(target) {
  if (target.responseType === "blob") {
    const contentType = target.getResponseHeader("content-type");
    if (contentType.startsWith("application/json")) {
      const text = await target.response.text();
      try {
        return JSON.parse(text);
      } catch (error) {
        return text;
      }
    } else if (contentType.startsWith("application/octet-stream")) {
      return target.response;
    }
    return {
      success: true,
      result: target.response
    };
  }
  const responseText = target.responseText;
  try {
    return JSON.parse(responseText);
  } catch (error) {
    return responseText;
  }
}
function uuidv4() {
  return ("10000000-1000-4000-8000" + -1e11).replace(/[018]/g, (c2) => (c2 ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c2 / 4).toString(16));
}
function initXhr(endpoint, APIOrigin, authToken, method = "post", contentType = "text/plain;actually=json", responseType = void 0) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, APIOrigin + endpoint, true);
  if (authToken) {
    xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
  }
  xhr.setRequestHeader("Content-Type", contentType);
  xhr.responseType = responseType ?? "";
  if (globalThis.puter?.apiCallLogger?.isEnabled()) {
    xhr._puterRequestId = {
      method,
      service: "xhr",
      operation: endpoint.replace(/^\//, ""),
      params: { endpoint, contentType, responseType }
    };
  }
  return xhr;
}
async function handle_resp(success_cb, error_cb, resolve_func, reject_func, response) {
  const resp = await parseResponse(response);
  if (response.status === 401) {
    if (error_cb && typeof error_cb === "function") {
      error_cb({ status: 401, message: "Unauthorized" });
    }
    return reject_func({ status: 401, message: "Unauthorized" });
  } else if (response.status !== 200) {
    if (error_cb && typeof error_cb === "function") {
      error_cb(resp);
    }
    return reject_func(resp);
  } else {
    if (resp.success === false && resp.error?.code === "permission_denied") {
      let perm = await puter.ui.requestPermission({ permission: "driver:puter-image-generation:generate" });
      if (perm.granted) {
      }
    }
    if (success_cb && typeof success_cb === "function") {
      success_cb(resp);
    }
    return resolve_func(resp);
  }
}
function handle_error(error_cb, reject_func, error) {
  if (error_cb && typeof error_cb === "function") {
    error_cb(error);
  }
  return reject_func(error);
}
function setupXhrEventHandlers(xhr, success_cb, error_cb, resolve_func, reject_func) {
  xhr.addEventListener("load", async function(e2) {
    if (globalThis.puter?.apiCallLogger?.isEnabled() && this._puterRequestId) {
      const response = await parseResponse(this).catch(() => null);
      globalThis.puter.apiCallLogger.logRequest({
        service: this._puterRequestId.service,
        operation: this._puterRequestId.operation,
        params: this._puterRequestId.params,
        result: this.status >= 400 ? null : response,
        error: this.status >= 400 ? { message: this.statusText, status: this.status } : null
      });
    }
    return handle_resp(success_cb, error_cb, resolve_func, reject_func, this, xhr);
  });
  xhr.addEventListener("error", function(e2) {
    if (globalThis.puter?.apiCallLogger?.isEnabled() && this._puterRequestId) {
      globalThis.puter.apiCallLogger.logRequest({
        service: this._puterRequestId.service,
        operation: this._puterRequestId.operation,
        params: this._puterRequestId.params,
        error: {
          message: "Network error occurred",
          event: e2.type
        }
      });
    }
    return handle_error(error_cb, reject_func, this);
  });
}
var NOOP = () => {
};
var Valid = class {
  static callback(cb) {
    return cb && typeof cb === "function" ? cb : void 0;
  }
};
function make_driver_method(arg_defs, driverInterface, driverName, driverMethod, settings = {}) {
  return async function(...args) {
    let driverArgs = {};
    let options = {};
    if (args.length === 1 && typeof args[0] === "object" && !Array.isArray(args[0])) {
      driverArgs = __spreadValues({}, args[0]);
      options = {
        success: driverArgs.success,
        error: driverArgs.error
      };
      delete driverArgs.success;
      delete driverArgs.error;
    } else {
      arg_defs.forEach((argName, index) => {
        driverArgs[argName] = args[index];
      });
      options = {
        success: args[arg_defs.length],
        error: args[arg_defs.length + 1]
      };
    }
    if (settings.preprocess && typeof settings.preprocess === "function") {
      driverArgs = settings.preprocess(driverArgs);
    }
    return await driverCall(options, driverInterface, driverName, driverMethod, driverArgs, settings);
  };
}
async function driverCall(options, driverInterface, driverName, driverMethod, driverArgs, settings) {
  const tp = new TeePromise();
  driverCall_(
    options,
    tp.resolve.bind(tp),
    tp.reject.bind(tp),
    driverInterface,
    driverName,
    driverMethod,
    driverArgs,
    void 0,
    void 0,
    settings
  );
  return await tp;
}
async function driverCall_(options = {}, resolve_func, reject_func, driverInterface, driverName, driverMethod, driverArgs, method, contentType = "text/plain;actually=json", settings = {}) {
  let requestInfo = null;
  if (globalThis.puter?.apiCallLogger?.isEnabled()) {
    requestInfo = {
      interface: driverInterface,
      driver: driverName,
      method: driverMethod,
      args: driverArgs
    };
  }
  if (!puter.authToken && puter.env === "web") {
    try {
      await puter.ui.authenticateWithPuter();
    } catch (e2) {
      if (requestInfo && globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "drivers",
          operation: `${driverInterface}::${driverMethod}`,
          params: { interface: driverInterface, driver: driverName, method: driverMethod, args: driverArgs },
          error: { code: "auth_canceled", message: "Authentication canceled" }
        });
      }
      return reject_func({
        error: {
          code: "auth_canceled",
          message: "Authentication canceled"
        }
      });
    }
  }
  const success_cb = Valid.callback(options.success) ?? NOOP;
  const error_cb = Valid.callback(options.error) ?? NOOP;
  const xhr = initXhr("/drivers/call", puter.APIOrigin, void 0, "POST", contentType);
  if (requestInfo) {
    xhr._puterDriverRequestInfo = requestInfo;
  }
  if (settings.responseType) {
    xhr.responseType = settings.responseType;
  }
  let is_stream = false;
  let signal_stream_update = null;
  let lastLength = 0;
  let response_complete = false;
  let buffer = "";
  const lines_received = [];
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 2) {
      if (xhr.getResponseHeader("Content-Type") !== "application/x-ndjson") return;
      is_stream = true;
      const Stream = async function* Stream2() {
        while (!response_complete) {
          const tp = new TeePromise();
          signal_stream_update = tp.resolve.bind(tp);
          await tp;
          if (response_complete) break;
          while (lines_received.length > 0) {
            const line = lines_received.shift();
            if (line.trim() === "") continue;
            const lineObject = JSON.parse(line);
            if (typeof lineObject.text === "string") {
              Object.defineProperty(lineObject, "toString", {
                enumerable: false,
                value: () => lineObject.text
              });
            }
            yield lineObject;
          }
        }
      };
      const startedStream = Stream();
      Object.defineProperty(startedStream, "start", {
        enumerable: false,
        value: async (controller) => {
          const texten3 = new TextEncoder();
          for await (const part of startedStream) {
            controller.enqueue(texten3.encode(part));
          }
          controller.close();
        }
      });
      return resolve_func(startedStream);
    }
    if (xhr.readyState === 4) {
      response_complete = true;
      if (is_stream) {
        signal_stream_update?.();
      }
    }
  };
  xhr.onprogress = function() {
    if (!signal_stream_update) return;
    const newText = xhr.responseText.slice(lastLength);
    lastLength = xhr.responseText.length;
    let hasUpdates = false;
    for (let i2 = 0; i2 < newText.length; i2++) {
      buffer += newText[i2];
      if (newText[i2] === "\n") {
        hasUpdates = true;
        lines_received.push(buffer);
        buffer = "";
      }
    }
    if (hasUpdates) {
      signal_stream_update();
    }
  };
  xhr.addEventListener("load", async function(response) {
    if (is_stream) {
      return;
    }
    const resp = await parseResponse(response.target);
    if (this._puterDriverRequestInfo && globalThis.puter?.apiCallLogger?.isEnabled()) {
      globalThis.puter.apiCallLogger.logRequest({
        service: "drivers",
        operation: `${this._puterDriverRequestInfo.interface}::${this._puterDriverRequestInfo.method}`,
        params: { interface: this._puterDriverRequestInfo.interface, driver: this._puterDriverRequestInfo.driver, method: this._puterDriverRequestInfo.method, args: this._puterDriverRequestInfo.args },
        result: response.status >= 400 || resp?.success === false ? null : resp,
        error: response.status >= 400 || resp?.success === false ? resp : null
      });
    }
    if (response.status === 401 || resp?.code === "token_auth_failed") {
      if (resp?.code === "token_auth_failed" && puter.env === "web") {
        try {
          puter.resetAuthToken();
          await puter.ui.authenticateWithPuter();
        } catch (e2) {
          return reject_func({
            error: {
              code: "auth_canceled",
              message: "Authentication canceled"
            }
          });
        }
      }
      if (error_cb && typeof error_cb === "function") {
        error_cb({ status: 401, message: "Unauthorized" });
      }
      return reject_func({ status: 401, message: "Unauthorized" });
    } else if (response.status && response.status !== 200) {
      error_cb(resp);
      return reject_func(resp);
    } else {
      if (resp.success === false && resp.error?.code === "permission_denied") {
        let perm = await puter.ui.requestPermission({ permission: `driver:${driverInterface}:${driverMethod}` });
        if (perm.granted) {
          return driverCall_(options, resolve_func, reject_func, driverInterface, driverMethod, driverArgs, method, contentType, settings);
        } else {
          error_cb(resp);
          return reject_func(resp);
        }
      } else if (resp.success === false) {
        error_cb(resp);
        return reject_func(resp);
      }
      let result = resp.result !== void 0 ? resp.result : resp;
      if (settings.transform) {
        result = await settings.transform(result);
      }
      if (resolve_func.success) {
        success_cb(result);
      }
      return resolve_func(result);
    }
  });
  xhr.addEventListener("error", function(e2) {
    if (this._puterDriverRequestInfo && globalThis.puter?.apiCallLogger?.isEnabled()) {
      globalThis.puter.apiCallLogger.logRequest({
        service: "drivers",
        operation: `${this._puterDriverRequestInfo.interface}::${this._puterDriverRequestInfo.method}`,
        params: { interface: this._puterDriverRequestInfo.interface, driver: this._puterDriverRequestInfo.driver, method: this._puterDriverRequestInfo.method, args: this._puterDriverRequestInfo.args },
        error: { message: "Network error occurred", event: e2.type }
      });
    }
    return handle_error(error_cb, reject_func, this);
  });
  xhr.send(JSON.stringify({
    interface: driverInterface,
    driver: driverName,
    test_mode: settings?.test_mode,
    method: driverMethod,
    args: driverArgs,
    auth_token: puter.authToken
  }));
}
var TeePromise = class {
  static STATUS_PENDING = {};
  static STATUS_RUNNING = {};
  static STATUS_DONE = {};
  constructor() {
    this.status_ = this.constructor.STATUS_PENDING;
    this.donePromise = new Promise((resolve, reject) => {
      this.doneResolve = resolve;
      this.doneReject = reject;
    });
  }
  get status() {
    return this.status_;
  }
  set status(status) {
    this.status_ = status;
    if (status === this.constructor.STATUS_DONE) {
      this.doneResolve();
    }
  }
  resolve(value) {
    this.status_ = this.constructor.STATUS_DONE;
    this.doneResolve(value);
  }
  awaitDone() {
    return this.donePromise;
  }
  then(fn, rfn) {
    return this.donePromise.then(fn, rfn);
  }
  reject(err) {
    this.status_ = this.constructor.STATUS_DONE;
    this.doneReject(err);
  }
  /**
   * @deprecated use then() instead
   */
  onComplete(fn) {
    return this.then(fn);
  }
};
async function blob_to_url(blob) {
  const tp = new TeePromise();
  const reader = new (globalThis.FileReader || FileReaderPoly)();
  reader.onloadend = () => tp.resolve(reader.result);
  reader.readAsDataURL(blob);
  return await tp;
}
function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new (globalThis.FileReader || FileReaderPoly)();
    reader.onload = function(event) {
      resolve(event.target.result);
    };
    reader.onerror = function(error) {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
}

// node_modules/@heyputer/puter.js/src/modules/AI.js
var normalizeTTSProvider = (value) => {
  if (typeof value !== "string") {
    return "aws-polly";
  }
  const lower = value.toLowerCase();
  if (lower === "openai") return "openai";
  if (["elevenlabs", "eleven", "11labs", "11-labs", "eleven-labs", "elevenlabs-tts"].includes(lower)) return "elevenlabs";
  if (lower === "aws" || lower === "polly" || lower === "aws-polly") return "aws-polly";
  return value;
};
var TOGETHER_IMAGE_MODEL_PREFIXES = [
  "black-forest-labs/",
  "stabilityai/",
  "togethercomputer/",
  "playgroundai/",
  "runwayml/",
  "lightricks/",
  "sg161222/",
  "wavymulder/",
  "prompthero/",
  "bytedance-seed/",
  "hidream-ai/",
  "lykon/",
  "qwen/",
  "rundiffusion/",
  "google/",
  "ideogram/"
];
var TOGETHER_IMAGE_MODEL_KEYWORDS = [
  "flux",
  "kling",
  "sd3",
  "stable-diffusion",
  "kolors"
];
var TOGETHER_VIDEO_MODEL_PREFIXES = [
  "minimax/",
  "google/",
  "bytedance/",
  "pixverse/",
  "kwaivgi/",
  "vidu/",
  "wan-ai/"
];
var AI = class {
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
  }
  /**
   * Sets a new authentication token and resets the socket connection with the updated token, if applicable.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [AI]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  /**
   * Sets the API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [AI]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  /**
   * Returns a list of available AI models.
   * @param {string} provider - The provider to filter the models returned.
   * @returns {Array} Array containing available model objects
   */
  async listModels(provider) {
    const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
    const tryFetchModels = async () => {
      const resp = await fetch(`${this.APIOrigin}/puterai/chat/models/details`, { headers });
      if (!resp.ok) return null;
      const data = await resp.json();
      const models2 = Array.isArray(data?.models) ? data.models : [];
      return provider ? models2.filter((model) => model.provider === provider) : models2;
    };
    const tryDriverModels = async () => {
      const models2 = await puter.drivers.call("puter-chat-completion", "ai-chat", "models");
      const result = Array.isArray(models2?.result) ? models2.result : [];
      return provider ? result.filter((model) => model.provider === provider) : result;
    };
    const models = await (async () => {
      try {
        const apiModels = await tryFetchModels();
        if (apiModels !== null) return apiModels;
      } catch (e2) {
      }
      try {
        return await tryDriverModels();
      } catch (e2) {
        return [];
      }
    })();
    return models;
  }
  /**
   * Returns a list of all available AI providers
   * @returns {Array} Array containing providers
   */
  async listModelProviders() {
    const models = await this.listModels();
    const providers = /* @__PURE__ */ new Set();
    (models ?? []).forEach((item) => {
      if (item?.provider) providers.add(item.provider);
    });
    return Array.from(providers);
  }
  img2txt = async (...args) => {
    const MAX_INPUT_SIZE = 10 * 1024 * 1024;
    if (!args || args.length === 0) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    const isBlobLike = (value) => {
      if (typeof Blob === "undefined") return false;
      return value instanceof Blob || typeof File !== "undefined" && value instanceof File;
    };
    const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value) && !isBlobLike(value);
    const normalizeProvider = (value) => {
      if (!value) return "aws-textract";
      const normalized = String(value).toLowerCase();
      if (["aws", "textract", "aws-textract"].includes(normalized)) return "aws-textract";
      if (["mistral", "mistral-ocr"].includes(normalized)) return "mistral";
      return "aws-textract";
    };
    let options = {};
    if (isPlainObject(args[0])) {
      options = __spreadValues({}, args[0]);
    } else {
      options.source = args[0];
    }
    let testMode = false;
    for (let i2 = 1; i2 < args.length; i2++) {
      const value = args[i2];
      if (typeof value === "boolean") {
        testMode = testMode || value;
      } else if (isPlainObject(value)) {
        options = __spreadValues(__spreadValues({}, options), value);
      }
    }
    if (typeof options.testMode === "boolean") {
      testMode = options.testMode;
    }
    const provider = normalizeProvider(options.provider);
    delete options.provider;
    delete options.testMode;
    if (!options.source) {
      throw { message: "Source is required", code: "source_required" };
    }
    if (isBlobLike(options.source)) {
      options.source = await blobToDataUri(options.source);
    } else if (options.source?.source && isBlobLike(options.source.source)) {
      options.source = await blobToDataUri(options.source.source);
    }
    if (typeof options.source === "string" && options.source.startsWith("data:") && options.source.length > MAX_INPUT_SIZE) {
      throw { message: `Input size cannot be larger than ${MAX_INPUT_SIZE}`, code: "input_too_large" };
    }
    const toText = (result) => {
      if (!result) return "";
      if (Array.isArray(result.blocks) && result.blocks.length) {
        let str = "";
        for (const block of result.blocks) {
          if (typeof block?.text !== "string") continue;
          if (!block.type || block.type === "text/textract:LINE" || block.type.startsWith("text/")) {
            str += `${block.text}
`;
          }
        }
        if (str.trim()) return str;
      }
      if (Array.isArray(result.pages) && result.pages.length) {
        const markdown = result.pages.map((page) => (page?.markdown || "").trim()).filter(Boolean).join("\n\n");
        if (markdown.trim()) return markdown;
      }
      if (typeof result.document_annotation === "string") {
        return result.document_annotation;
      }
      if (typeof result.text === "string") {
        return result.text;
      }
      return "";
    };
    const driverCall2 = make_driver_method(["source"], "puter-ocr", provider, "recognize", {
      test_mode: testMode ?? false,
      transform: async (result) => toText(result)
    });
    return await driverCall2.call(this, options);
  };
  txt2speech = async (...args) => {
    let MAX_INPUT_SIZE = 3e3;
    let options = {};
    let testMode = false;
    if (!args) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    if (typeof args[0] === "string") {
      options = { text: args[0] };
    }
    if (args[1] && typeof args[1] === "object" && !Array.isArray(args[1])) {
      Object.assign(options, args[1]);
    } else if (args[1] && typeof args[1] === "string") {
      options.language = args[1];
      if (args[2] && typeof args[2] === "string") {
        options.voice = args[2];
      }
      if (args[3] && typeof args[3] === "string") {
        options.engine = args[3];
      }
    } else if (args[1] && typeof args[1] !== "boolean") {
      throw { message: 'Second argument must be an options object or language string. Use: txt2speech("text", { voice: "name", engine: "type", language: "code" }) or txt2speech("text", "language", "voice", "engine")', code: "invalid_arguments" };
    }
    if (!options.text) {
      throw { message: "Text parameter is required", code: "text_required" };
    }
    const validEngines = ["standard", "neural", "long-form", "generative"];
    let provider = normalizeTTSProvider(options.provider);
    if (options.engine && normalizeTTSProvider(options.engine) === "openai" && !options.provider) {
      provider = "openai";
    }
    if (options.engine && normalizeTTSProvider(options.engine) === "elevenlabs" && !options.provider) {
      provider = "elevenlabs";
    }
    if (provider === "openai") {
      if (!options.model && typeof options.engine === "string") {
        options.model = options.engine;
      }
      if (!options.voice) {
        options.voice = "alloy";
      }
      if (!options.model) {
        options.model = "gpt-4o-mini-tts";
      }
      if (!options.response_format) {
        options.response_format = "mp3";
      }
      delete options.engine;
    } else if (provider === "elevenlabs") {
      if (!options.voice) {
        options.voice = "21m00Tcm4TlvDq8ikWAM";
      }
      if (!options.model && typeof options.engine === "string") {
        options.model = options.engine;
      }
      if (!options.model) {
        options.model = "eleven_multilingual_v2";
      }
      if (!options.output_format && !options.response_format) {
        options.output_format = "mp3_44100_128";
      }
      if (options.response_format && !options.output_format) {
        options.output_format = options.response_format;
      }
      delete options.engine;
    } else {
      provider = "aws-polly";
      if (options.engine && !validEngines.includes(options.engine)) {
        throw { message: `Invalid engine. Must be one of: ${validEngines.join(", ")}`, code: "invalid_engine" };
      }
      if (!options.voice) {
        options.voice = "Joanna";
      }
      if (!options.engine) {
        options.engine = "standard";
      }
      if (!options.language) {
        options.language = "en-US";
      }
    }
    if (options.text.length > MAX_INPUT_SIZE) {
      throw { message: `Input size cannot be larger than ${MAX_INPUT_SIZE}`, code: "input_too_large" };
    }
    for (let i2 = 0; i2 < args.length; i2++) {
      if (typeof args[i2] === "boolean" && args[i2] === true) {
        testMode = true;
        break;
      }
    }
    const driverName = provider === "openai" ? "openai-tts" : provider === "elevenlabs" ? "elevenlabs-tts" : "aws-polly";
    return await make_driver_method(["source"], "puter-tts", driverName, "synthesize", {
      responseType: "blob",
      test_mode: testMode ?? false,
      transform: async (result) => {
        let url;
        if (typeof result === "string") {
          url = result;
        } else if (result instanceof Blob) {
          url = await blob_to_url(result);
        } else if (result instanceof ArrayBuffer) {
          const blob = new Blob([result]);
          url = await blob_to_url(blob);
        } else if (result && typeof result === "object" && typeof result.arrayBuffer === "function") {
          const arrayBuffer = await result.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: result.type || void 0 });
          url = await blob_to_url(blob);
        } else {
          throw { message: "Unexpected audio response format", code: "invalid_audio_response" };
        }
        const audio = new (globalThis.Audio || Object)();
        audio.src = url;
        audio.toString = () => url;
        audio.valueOf = () => url;
        return audio;
      }
    }).call(this, options);
  };
  speech2speech = async (...args) => {
    const MAX_INPUT_SIZE = 25 * 1024 * 1024;
    if (!args || !args.length) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    const normalizeSource = async (value) => {
      if (value instanceof Blob) {
        return await blobToDataUri(value);
      }
      return value;
    };
    const normalizeOptions = (opts = {}) => {
      const normalized = __spreadValues({}, opts);
      if (normalized.voiceId && !normalized.voice && !normalized.voice_id) normalized.voice = normalized.voiceId;
      if (normalized.modelId && !normalized.model && !normalized.model_id) normalized.model = normalized.modelId;
      if (normalized.outputFormat && !normalized.output_format) normalized.output_format = normalized.outputFormat;
      if (normalized.voiceSettings && !normalized.voice_settings) normalized.voice_settings = normalized.voiceSettings;
      if (normalized.fileFormat && !normalized.file_format) normalized.file_format = normalized.fileFormat;
      if (normalized.removeBackgroundNoise !== void 0 && normalized.remove_background_noise === void 0) {
        normalized.remove_background_noise = normalized.removeBackgroundNoise;
      }
      if (normalized.optimizeStreamingLatency !== void 0 && normalized.optimize_streaming_latency === void 0) {
        normalized.optimize_streaming_latency = normalized.optimizeStreamingLatency;
      }
      if (normalized.enableLogging !== void 0 && normalized.enable_logging === void 0) {
        normalized.enable_logging = normalized.enableLogging;
      }
      delete normalized.voiceId;
      delete normalized.modelId;
      delete normalized.outputFormat;
      delete normalized.voiceSettings;
      delete normalized.fileFormat;
      delete normalized.removeBackgroundNoise;
      delete normalized.optimizeStreamingLatency;
      delete normalized.enableLogging;
      return normalized;
    };
    let options = {};
    let testMode = false;
    const primary = args[0];
    if (primary && typeof primary === "object" && !Array.isArray(primary) && !(primary instanceof Blob)) {
      options = __spreadValues({}, primary);
    } else {
      options.audio = await normalizeSource(primary);
    }
    if (args[1] && typeof args[1] === "object" && !Array.isArray(args[1]) && !(args[1] instanceof Blob)) {
      options = __spreadValues(__spreadValues({}, options), args[1]);
    } else if (typeof args[1] === "boolean") {
      testMode = args[1];
    }
    if (typeof args[2] === "boolean") {
      testMode = args[2];
    }
    if (options.file) {
      options.audio = await normalizeSource(options.file);
      delete options.file;
    }
    if (options.audio instanceof Blob) {
      options.audio = await normalizeSource(options.audio);
    }
    if (!options.audio) {
      throw { message: "Audio input is required", code: "audio_required" };
    }
    if (typeof options.audio === "string" && options.audio.startsWith("data:")) {
      const base64 = options.audio.split(",")[1] || "";
      const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
      const byteLength = Math.floor(base64.length * 3 / 4) - padding;
      if (byteLength > MAX_INPUT_SIZE) {
        throw { message: "Input size cannot be larger than 25 MB", code: "input_too_large" };
      }
    }
    const driverArgs = normalizeOptions(__spreadValues({}, options));
    delete driverArgs.provider;
    return await make_driver_method(["audio"], "puter-speech2speech", "elevenlabs-voice-changer", "convert", {
      responseType: "blob",
      test_mode: testMode,
      transform: async (result) => {
        let url;
        if (typeof result === "string") {
          url = result;
        } else if (result instanceof Blob) {
          url = await blob_to_url(result);
        } else if (result instanceof ArrayBuffer) {
          const blob = new Blob([result]);
          url = await blob_to_url(blob);
        } else if (result && typeof result === "object" && typeof result.arrayBuffer === "function") {
          const arrayBuffer = await result.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: result.type || void 0 });
          url = await blob_to_url(blob);
        } else {
          throw { message: "Unexpected audio response format", code: "invalid_audio_response" };
        }
        const audio = new Audio(url);
        audio.toString = () => url;
        audio.valueOf = () => url;
        return audio;
      }
    }).call(this, driverArgs);
  };
  speech2txt = async (...args) => {
    const MAX_INPUT_SIZE = 25 * 1024 * 1024;
    if (!args || !args.length) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    const normalizeSource = async (value) => {
      if (value instanceof Blob) {
        return await blobToDataUri(value);
      }
      return value;
    };
    let options = {};
    let testMode = false;
    const primary = args[0];
    if (primary && typeof primary === "object" && !Array.isArray(primary) && !(primary instanceof Blob)) {
      options = __spreadValues({}, primary);
    } else {
      options.file = await normalizeSource(primary);
    }
    if (args[1] && typeof args[1] === "object" && !Array.isArray(args[1]) && !(args[1] instanceof Blob)) {
      options = __spreadValues(__spreadValues({}, options), args[1]);
    } else if (typeof args[1] === "boolean") {
      testMode = args[1];
    }
    if (typeof args[2] === "boolean") {
      testMode = args[2];
    }
    if (options.audio) {
      options.file = await normalizeSource(options.audio);
      delete options.audio;
    }
    if (options.file instanceof Blob) {
      options.file = await normalizeSource(options.file);
    }
    if (!options.file) {
      throw { message: "Audio input is required", code: "audio_required" };
    }
    if (typeof options.file === "string" && options.file.startsWith("data:")) {
      const base64 = options.file.split(",")[1] || "";
      const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
      const byteLength = Math.floor(base64.length * 3 / 4) - padding;
      if (byteLength > MAX_INPUT_SIZE) {
        throw { message: "Input size cannot be larger than 25 MB", code: "input_too_large" };
      }
    }
    const driverMethod = options.translate ? "translate" : "transcribe";
    const driverArgs = __spreadValues({}, options);
    delete driverArgs.translate;
    const responseFormat = driverArgs.response_format;
    return await make_driver_method([], "puter-speech2txt", "openai-speech2txt", driverMethod, {
      test_mode: testMode,
      transform: async (result) => {
        if (responseFormat === "text" && result && typeof result === "object" && typeof result.text === "string") {
          return result.text;
        }
        return result;
      }
    }).call(this, driverArgs);
  };
  // Add new methods for TTS engine management
  txt2speech = Object.assign(this.txt2speech, {
    /**
     * List available TTS engines with pricing information
     * @returns {Promise<Array>} Array of available engines
     */
    listEngines: async (options = {}) => {
      let provider = "aws-polly";
      let params = {};
      if (typeof options === "string") {
        provider = normalizeTTSProvider(options);
      } else if (options && typeof options === "object") {
        provider = normalizeTTSProvider(options.provider) || provider;
        params = __spreadValues({}, options);
        delete params.provider;
      }
      if (provider === "openai") {
        params.provider = "openai";
      }
      if (provider === "elevenlabs") {
        params.provider = "elevenlabs";
      }
      const driverName = provider === "openai" ? "openai-tts" : provider === "elevenlabs" ? "elevenlabs-tts" : "aws-polly";
      return await make_driver_method(["source"], "puter-tts", driverName, "list_engines", {
        responseType: "text"
      }).call(this, params);
    },
    /**
     * List all available voices, optionally filtered by engine
     * @param {string} [engine] - Optional engine filter
     * @returns {Promise<Array>} Array of available voices
     */
    listVoices: async (options) => {
      let provider = "aws-polly";
      let params = {};
      if (typeof options === "string") {
        params.engine = options;
      } else if (options && typeof options === "object") {
        provider = normalizeTTSProvider(options.provider) || provider;
        params = __spreadValues({}, options);
        delete params.provider;
      }
      if (provider === "openai") {
        params.provider = "openai";
        delete params.engine;
      }
      if (provider === "elevenlabs") {
        params.provider = "elevenlabs";
      }
      const driverName = provider === "openai" ? "openai-tts" : provider === "elevenlabs" ? "elevenlabs-tts" : "aws-polly";
      return make_driver_method(["source"], "puter-tts", driverName, "list_voices", {
        responseType: "text"
      }).call(this, params);
    }
  });
  // accepts either a string or an array of message objects
  // if string, it's treated as the prompt which is a shorthand for { messages: [{ content: prompt }] }
  // if object, it's treated as the full argument object that the API expects
  chat = async (...args) => {
    let requestParams = {};
    let userParams = {};
    let testMode = false;
    let driver = "openai-completion";
    if (!args) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    if (typeof args[0] === "string") {
      requestParams = { messages: [{ content: args[0] }] };
    }
    if (typeof args[0] === "string" && (!args[1] || typeof args[1] === "boolean")) {
      requestParams = { messages: [{ content: args[0] }] };
    } else if (typeof args[0] === "string" && (typeof args[1] === "string" || args[1] instanceof File)) {
      if (args[1] instanceof File) {
        args[1] = await blobToDataUri(args[1]);
      }
      requestParams = {
        vision: true,
        messages: [
          {
            content: [
              args[0],
              {
                image_url: {
                  url: args[1]
                }
              }
            ]
          }
        ]
      };
    } else if (typeof args[0] === "string" && Array.isArray(args[1])) {
      for (let i2 = 0; i2 < args[1].length; i2++) {
        args[1][i2] = { image_url: { url: args[1][i2] } };
      }
      requestParams = {
        vision: true,
        messages: [
          {
            content: [
              args[0],
              ...args[1]
            ]
          }
        ]
      };
    } else if (Array.isArray(args[0])) {
      requestParams = { messages: args[0] };
    }
    if (typeof args[1] === "boolean" && args[1] === true || typeof args[2] === "boolean" && args[2] === true || typeof args[3] === "boolean" && args[3] === true) {
      testMode = true;
    }
    const is_object = (v2) => {
      return typeof v2 === "object" && !Array.isArray(v2) && v2 !== null;
    };
    for (let i2 = 0; i2 < args.length; i2++) {
      if (is_object(args[i2])) {
        userParams = args[i2];
        break;
      }
    }
    if (userParams.model) {
      requestParams.model = userParams.model;
    }
    if (userParams.temperature) {
      requestParams.temperature = userParams.temperature;
    }
    if (userParams.max_tokens) {
      requestParams.max_tokens = userParams.max_tokens;
    }
    requestParams.model = requestParams.model ?? "";
    if (requestParams.model && requestParams.model.startsWith("anthropic/")) {
      requestParams.model = requestParams.model.replace("anthropic/", "");
    }
    if (requestParams.model === "claude-3-5-sonnet") {
      requestParams.model = "claude-3-5-sonnet-latest";
    }
    if (requestParams.model === "claude-3-7-sonnet" || requestParams.model === "claude") {
      requestParams.model = "claude-3-7-sonnet-latest";
    }
    if (requestParams.model === "claude-sonnet-4" || requestParams.model === "claude-sonnet-4-latest") {
      requestParams.model = "claude-sonnet-4-20250514";
    }
    if (requestParams.model === "claude-opus-4" || requestParams.model === "claude-opus-4-latest") {
      requestParams.model = "claude-opus-4-20250514";
    }
    if (requestParams.model === "mistral") {
      requestParams.model = "mistral-large-latest";
    }
    if (requestParams.model === "groq") {
      requestParams.model = "llama3-8b-8192";
    }
    if (requestParams.model === "deepseek") {
      requestParams.model = "deepseek-chat";
    }
    if (requestParams.model === "o1-mini") {
      requestParams.model = "openrouter:openai/o1-mini";
    }
    if (requestParams.model && requestParams.model.startsWith("openai/")) {
      requestParams.model = requestParams.model.replace("openai/", "");
      driver = "openai-completion";
    }
    if (requestParams.model.startsWith("agentica-org/") || requestParams.model.startsWith("ai21/") || requestParams.model.startsWith("aion-labs/") || requestParams.model.startsWith("alfredpros/") || requestParams.model.startsWith("allenai/") || requestParams.model.startsWith("alpindale/") || requestParams.model.startsWith("amazon/") || requestParams.model.startsWith("anthracite-org/") || requestParams.model.startsWith("arcee-ai/") || requestParams.model.startsWith("arliai/") || requestParams.model.startsWith("baidu/") || requestParams.model.startsWith("bytedance/") || requestParams.model.startsWith("cognitivecomputations/") || requestParams.model.startsWith("cohere/") || requestParams.model.startsWith("deepseek/") || requestParams.model.startsWith("eleutherai/") || requestParams.model.startsWith("google/") || requestParams.model.startsWith("gryphe/") || requestParams.model.startsWith("inception/") || requestParams.model.startsWith("infermatic/") || requestParams.model.startsWith("liquid/") || requestParams.model.startsWith("mancer/") || requestParams.model.startsWith("meta-llama/") || requestParams.model.startsWith("microsoft/") || requestParams.model.startsWith("minimax/") || requestParams.model.startsWith("mistralai/") || requestParams.model.startsWith("moonshotai/") || requestParams.model.startsWith("morph/") || requestParams.model.startsWith("neversleep/") || requestParams.model.startsWith("nousresearch/") || requestParams.model.startsWith("nvidia/") || requestParams.model.startsWith("openrouter/") || requestParams.model.startsWith("perplexity/") || requestParams.model.startsWith("pygmalionai/") || requestParams.model.startsWith("qwen/") || requestParams.model.startsWith("raifle/") || requestParams.model.startsWith("rekaai/") || requestParams.model.startsWith("sao10k/") || requestParams.model.startsWith("sarvamai/") || requestParams.model.startsWith("scb10x/") || requestParams.model.startsWith("shisa-ai/") || requestParams.model.startsWith("sophosympatheia/") || requestParams.model.startsWith("switchpoint/") || requestParams.model.startsWith("tencent/") || requestParams.model.startsWith("thedrummer/") || requestParams.model.startsWith("thudm/") || requestParams.model.startsWith("tngtech/") || requestParams.model.startsWith("undi95/") || requestParams.model.startsWith("x-ai/") || requestParams.model.startsWith("z-ai/")) {
      requestParams.model = `openrouter:${requestParams.model}`;
    }
    if (!requestParams.model || requestParams.model.startsWith("gpt-")) {
      driver = "openai-completion";
    } else if (requestParams.model.startsWith("claude-")) {
      driver = "claude";
    } else if (requestParams.model === "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" || requestParams.model === "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" || requestParams.model === "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo" || requestParams.model === "google/gemma-2-27b-it") {
      driver = "together-ai";
    } else if (requestParams.model.startsWith("mistral-") || requestParams.model.startsWith("codestral-") || requestParams.model.startsWith("pixtral-") || requestParams.model.startsWith("magistral-") || requestParams.model.startsWith("devstral-") || requestParams.model.startsWith("mistral-ocr-") || requestParams.model.startsWith("open-mistral-")) {
      driver = "mistral";
    } else if ([
      "distil-whisper-large-v3-en",
      "gemma2-9b-it",
      "gemma-7b-it",
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "llama3-70b-8192",
      "llama3-8b-8192",
      "llama3-groq-70b-8192-tool-use-preview",
      "llama3-groq-8b-8192-tool-use-preview",
      "llama-guard-3-8b",
      "mixtral-8x7b-32768",
      "whisper-large-v3"
    ].includes(requestParams.model)) {
      driver = "groq";
    } else if (requestParams.model === "grok-beta") {
      driver = "xai";
    } else if (requestParams.model.startsWith("grok-")) {
      driver = "openrouter";
    } else if (requestParams.model === "deepseek-chat" || requestParams.model === "deepseek-reasoner") {
      driver = "deepseek";
    } else if (requestParams.model === "gemini-1.5-flash" || requestParams.model === "gemini-2.0-flash" || requestParams.model === "gemini-2.5-flash" || requestParams.model === "gemini-2.5-flash-lite" || requestParams.model === "gemini-2.0-flash-lite" || requestParams.model === "gemini-3-pro-preview" || requestParams.model === "gemini-2.5-pro") {
      driver = "gemini";
    } else if (requestParams.model.startsWith("openrouter:")) {
      driver = "openrouter";
    } else if (requestParams.model.startsWith("ollama:")) {
      driver = "ollama";
    }
    if (userParams.stream !== void 0 && typeof userParams.stream === "boolean") {
      requestParams.stream = userParams.stream;
    }
    if (userParams.driver) {
      driver = userParams.driver;
    }
    const PARAMS_TO_PASS = ["tools", "response", "reasoning", "reasoning_effort", "text", "verbosity"];
    for (const name of PARAMS_TO_PASS) {
      if (userParams[name]) {
        requestParams[name] = userParams[name];
      }
    }
    if (requestParams.model === "") {
      delete requestParams.model;
    }
    return await make_driver_method(["messages"], "puter-chat-completion", driver, "complete", {
      test_mode: testMode ?? false,
      transform: async (result) => {
        result.toString = () => {
          return result.message?.content;
        };
        result.valueOf = () => {
          return result.message?.content;
        };
        return result;
      }
    }).call(this, requestParams);
  };
  /**
   * Generate images from text prompts or perform image-to-image generation
   *
   * @param {string|object} prompt - Text prompt or options object
   * @param {object|boolean} [options] - Generation options or test mode flag
   * @param {string} [options.prompt] - Text description of the image to generate
   * @param {string} [options.model] - Model to use (e.g., "gemini-2.5-flash-image-preview")
   * @param {object} [options.ratio] - Image dimensions (e.g., {w: 1024, h: 1024})
   * @param {string} [options.input_image] - Base64 encoded input image for image-to-image generation
   * @param {string} [options.input_image_mime_type] - MIME type of input image (e.g., "image/png")
   * @returns {Promise<Image>} Generated image object with src property
   *
   * @example
   * // Text-to-image
   * const img = await puter.ai.txt2img("A beautiful sunset");
   *
   * @example
   * // Image-to-image
   * const img = await puter.ai.txt2img({
   *   prompt: "Transform this into a watercolor painting",
   *   input_image: base64ImageData,
   *   input_image_mime_type: "image/png",
   *   model: "gemini-2.5-flash-image-preview"
   * });
   */
  txt2img = async (...args) => {
    let options = {};
    let testMode = false;
    if (!args) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    if (typeof args[0] === "string") {
      options = { prompt: args[0] };
    }
    if (typeof args[1] === "boolean" && args[1] === true) {
      testMode = true;
    }
    if (typeof args[0] === "string" && typeof args[1] === "object") {
      options = args[1];
      options.prompt = args[0];
    }
    if (typeof args[0] === "object") {
      options = args[0];
    }
    let AIService = "openai-image-generation";
    if (options.model === "nano-banana") {
      options.model = "gemini-2.5-flash-image-preview";
    }
    if (options.model === "nano-banana-pro") {
      options.model = "gemini-3-pro-image-preview";
    }
    const driverHint = typeof options.driver === "string" ? options.driver : void 0;
    const providerRaw = typeof options.provider === "string" ? options.provider : typeof options.service === "string" ? options.service : void 0;
    const providerHint = typeof providerRaw === "string" ? providerRaw.toLowerCase() : void 0;
    const modelLower = typeof options.model === "string" ? options.model.toLowerCase() : "";
    const looksLikeTogetherModel = typeof options.model === "string" && (TOGETHER_IMAGE_MODEL_PREFIXES.some((prefix) => modelLower.startsWith(prefix)) || TOGETHER_IMAGE_MODEL_KEYWORDS.some((keyword) => modelLower.includes(keyword)));
    if (driverHint) {
      AIService = driverHint;
    } else if (providerHint === "gemini") {
      AIService = "gemini-image-generation";
    } else if (providerHint === "together" || providerHint === "together-ai") {
      AIService = "together-image-generation";
    } else if (options.model === "gemini-2.5-flash-image-preview" || options.model === "gemini-3-pro-image-preview") {
      AIService = "gemini-image-generation";
    } else if (looksLikeTogetherModel) {
      AIService = "together-image-generation";
    }
    return await make_driver_method(["prompt"], "puter-image-generation", AIService, "generate", {
      responseType: "blob",
      test_mode: testMode ?? false,
      transform: async (result) => {
        let url;
        if (typeof result === "string") {
          url = result;
        } else if (result instanceof Blob) {
          url = await blob_to_url(result);
        } else if (result instanceof ArrayBuffer) {
          const blob = new Blob([result]);
          url = await blob_to_url(blob);
        } else if (result && typeof result === "object" && typeof result.arrayBuffer === "function") {
          const arrayBuffer = await result.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: result.type || void 0 });
          url = await blob_to_url(blob);
        } else {
          throw { message: "Unexpected image response format", code: "invalid_image_response" };
        }
        let img = new (globalThis.Image || Object)();
        img.src = url;
        img.toString = () => img.src;
        img.valueOf = () => img.src;
        return img;
      }
    }).call(this, options);
  };
  txt2vid = async (...args) => {
    let options = {};
    let testMode = false;
    if (!args) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    if (typeof args[0] === "string") {
      options = { prompt: args[0] };
    }
    if (typeof args[1] === "boolean" && args[1] === true) {
      testMode = true;
    }
    if (typeof args[0] === "string" && typeof args[1] === "object") {
      options = args[1];
      options.prompt = args[0];
    }
    if (typeof args[0] === "object") {
      options = args[0];
    }
    if (!options.prompt) {
      throw { message: "Prompt parameter is required", code: "prompt_required" };
    }
    if (!options.model) {
      options.model = "sora-2";
    }
    if (options.duration !== void 0 && options.seconds === void 0) {
      options.seconds = options.duration;
    }
    let videoService = "openai-video-generation";
    const driverHint = typeof options.driver === "string" ? options.driver : void 0;
    const driverHintLower = driverHint ? driverHint.toLowerCase() : void 0;
    const providerRaw = typeof options.provider === "string" ? options.provider : typeof options.service === "string" ? options.service : void 0;
    const providerHint = typeof providerRaw === "string" ? providerRaw.toLowerCase() : void 0;
    const modelLower = typeof options.model === "string" ? options.model.toLowerCase() : "";
    const looksLikeTogetherVideoModel = typeof options.model === "string" && TOGETHER_VIDEO_MODEL_PREFIXES.some((prefix) => modelLower.startsWith(prefix));
    if (driverHintLower === "together" || driverHintLower === "together-ai") {
      videoService = "together-video-generation";
    } else if (driverHintLower === "together-video-generation") {
      videoService = "together-video-generation";
    } else if (driverHintLower === "openai") {
      videoService = "openai-video-generation";
    } else if (driverHint) {
      videoService = driverHint;
    } else if (providerHint === "together" || providerHint === "together-ai") {
      videoService = "together-video-generation";
    } else if (looksLikeTogetherVideoModel) {
      videoService = "together-video-generation";
    }
    return await make_driver_method(["prompt"], "puter-video-generation", videoService, "generate", {
      responseType: "blob",
      test_mode: testMode ?? false,
      transform: async (result) => {
        let sourceUrl = null;
        let mimeType = null;
        if (result instanceof Blob) {
          sourceUrl = await blob_to_url(result);
          mimeType = result.type || "video/mp4";
        } else if (typeof result === "string") {
          sourceUrl = result;
        } else if (result && typeof result === "object") {
          sourceUrl = result.asset_url || result.url || result.href || null;
          mimeType = result.mime_type || result.content_type || null;
        }
        if (!sourceUrl) {
          return result;
        }
        const video = globalThis.document?.createElement("video") || { setAttribute: () => {
        } };
        video.src = sourceUrl;
        video.controls = true;
        video.preload = "metadata";
        if (mimeType) {
          video.setAttribute("data-mime-type", mimeType);
        }
        video.setAttribute("data-source", sourceUrl);
        video.toString = () => video.src;
        video.valueOf = () => video.src;
        return video;
      }
    }).call(this, options);
  };
};
var AI_default = AI;

// node_modules/@heyputer/puter.js/src/modules/Apps.js
var Apps = class {
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
  }
  /**
   * Sets a new authentication token.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [Apps]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  /**
   * Sets the API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [Apps]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  list = async (...args) => {
    let options = {};
    if (typeof args[0] === "object" && args[0] !== null) {
      options.params = args[0];
    }
    options.predicate = ["user-can-edit"];
    return make_driver_method(["uid"], "puter-apps", void 0, "select").call(this, options);
  };
  create = async (...args) => {
    let options = {};
    if (typeof args[0] === "string") {
      let indexURL = args[1];
      let title = args[2] ?? args[0];
      options = {
        object: {
          name: args[0],
          index_url: indexURL,
          title
        }
      };
    } else if (typeof args[0] === "object" && args[0] !== null) {
      let options_raw = args[0];
      options = {
        object: {
          name: options_raw.name,
          index_url: options_raw.indexURL,
          // title is optional only if name is provided.
          // If title is provided, use it. If not, use name.
          title: options_raw.title ?? options_raw.name,
          description: options_raw.description,
          icon: options_raw.icon,
          maximize_on_start: options_raw.maximizeOnStart,
          background: options_raw.background,
          filetype_associations: options_raw.filetypeAssociations,
          metadata: options_raw.metadata
        },
        options: {
          dedupe_name: options_raw.dedupeName ?? false
        }
      };
    }
    if (!options.object.name) {
      throw {
        success: false,
        error: {
          code: "invalid_request",
          message: "Name is required"
        }
      };
    }
    if (!options.object.index_url) {
      throw {
        success: false,
        error: {
          code: "invalid_request",
          message: "Index URL is required"
        }
      };
    }
    return await make_driver_method(["object"], "puter-apps", void 0, "create").call(this, options);
  };
  update = async (...args) => {
    let options = {};
    if (Array.isArray(args) && typeof args[0] === "string") {
      let object_raw = args[1];
      let object = {
        name: object_raw.name,
        index_url: object_raw.indexURL,
        title: object_raw.title,
        description: object_raw.description,
        icon: object_raw.icon,
        maximize_on_start: object_raw.maximizeOnStart,
        background: object_raw.background,
        filetype_associations: object_raw.filetypeAssociations,
        metadata: object_raw.metadata
      };
      options = { id: { name: args[0] }, object };
    }
    return await make_driver_method(["object"], "puter-apps", void 0, "update").call(this, options);
  };
  get = async (...args) => {
    let options = {};
    if (Array.isArray(args) && typeof args[0] === "string") {
      if (typeof args[1] === "object" && args[1] !== null) {
        options.params = args[1];
      }
      options.id = { name: args[0] };
    }
    if (typeof args[0] === "object" && args[0] !== null) {
      options.params = args[0];
    }
    return make_driver_method(["uid"], "puter-apps", void 0, "read").call(this, options);
  };
  delete = async (...args) => {
    let options = {};
    if (Array.isArray(args) && typeof args[0] === "string") {
      options = { id: { name: args[0] } };
    }
    return make_driver_method(["uid"], "puter-apps", void 0, "delete").call(this, options);
  };
  getDeveloperProfile = function(...args) {
    let options;
    if (typeof args[0] === "object" && args[0] !== null) {
      options = args[0];
    } else {
      options = {
        success: args[0],
        error: args[1]
      };
    }
    return new Promise((resolve, reject) => {
      let options2;
      if (typeof args[0] === "object" && args[0] !== null) {
        options2 = args[0];
      } else {
        options2 = {
          success: args[0],
          error: args[1]
        };
      }
      return new Promise((resolve2, reject2) => {
        const xhr = initXhr("/get-dev-profile", puter.APIOrigin, puter.authToken, "get");
        setupXhrEventHandlers(xhr, options2.success, options2.error, resolve2, reject2);
        xhr.send();
      });
    });
  };
};
var Apps_default = Apps;

// node_modules/@heyputer/puter.js/src/modules/Auth.js
var Auth = class {
  // Used to generate a unique message id for each message sent to the host environment
  // we start from 1 because 0 is falsy and we want to avoid that for the message id
  #messageID = 1;
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
  }
  /**
   * Sets a new authentication token.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [Auth]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  /**
   * Sets the API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [Auth]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  signIn = (options) => {
    options = options || {};
    return new Promise((resolve, reject) => {
      let msg_id = this.#messageID++;
      let w2 = 600;
      let h2 = 600;
      let title = "Puter";
      var left = screen.width / 2 - w2 / 2;
      var top = screen.height / 2 - h2 / 2;
      const popup = window.open(
        `${puter.defaultGUIOrigin}/action/sign-in?embedded_in_popup=true&msg_id=${msg_id}${window.crossOriginIsolated ? "&cross_origin_isolated=true" : ""}${options.attempt_temp_user_creation ? "&attempt_temp_user_creation=true" : ""}`,
        title,
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w2}, height=${h2}, top=${top}, left=${left}`
      );
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
          reject({ error: "auth_window_closed", msg: "Authentication window was closed by the user without completing the process." });
        }
      }, 100);
      function messageHandler(e2) {
        if (e2.data.msg_id == msg_id) {
          clearInterval(checkClosed);
          delete e2.data.msg_id;
          delete e2.data.msg;
          if (e2.data.success) {
            puter.setAuthToken(e2.data.token);
            resolve(e2.data);
          } else {
            reject(e2.data);
          }
          window.removeEventListener("message", messageHandler);
        }
      }
      window.addEventListener("message", messageHandler);
    });
  };
  isSignedIn = () => {
    if (puter.authToken) {
      return true;
    } else {
      return false;
    }
  };
  getUser = function(...args) {
    let options;
    if (typeof args[0] === "object" && args[0] !== null) {
      options = args[0];
    } else {
      options = {
        success: args[0],
        error: args[1]
      };
    }
    return new Promise((resolve, reject) => {
      const xhr = initXhr("/whoami", puter.APIOrigin, puter.authToken, "get");
      setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
      xhr.send();
    });
  };
  signOut = () => {
    puter.resetAuthToken();
  };
  async whoami() {
    try {
      const resp = await fetch(`${this.APIOrigin}/whoami`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });
      const result = await resp.json();
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "whoami",
          params: {},
          result
        });
      }
      return result;
    } catch (error) {
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "whoami",
          params: {},
          error: {
            message: error.message || error.toString(),
            stack: error.stack
          }
        });
      }
      throw error;
    }
  }
  async getMonthlyUsage() {
    try {
      const resp = await fetch(`${this.APIOrigin}/metering/usage`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });
      const result = await resp.json();
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "usage",
          params: {},
          result
        });
      }
      return result;
    } catch (error) {
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "usage",
          params: {},
          error: {
            message: error.message || error.toString(),
            stack: error.stack
          }
        });
      }
      throw error;
    }
  }
  async getDetailedAppUsage(appId) {
    if (!appId) {
      throw new Error("appId is required");
    }
    try {
      const resp = await fetch(`${this.APIOrigin}/metering/usage/${appId}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });
      const result = await resp.json();
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "detailed_app_usage",
          params: { appId },
          result
        });
      }
      return result;
    } catch (error) {
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "detailed_app_usage",
          params: { appId },
          error: {
            message: error.message || error.toString(),
            stack: error.stack
          }
        });
      }
      throw error;
    }
  }
  async getGlobalUsage() {
    try {
      const resp = await fetch(`${this.APIOrigin}/metering/globalUsage`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });
      const result = await resp.json();
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "global_usage",
          params: {},
          result
        });
      }
      return result;
    } catch (error) {
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "auth",
          operation: "global_usage",
          params: {},
          error: {
            message: error.message || error.toString(),
            stack: error.stack
          }
        });
      }
      throw error;
    }
  }
};
var Auth_default = Auth;

// node_modules/@heyputer/puter.js/src/modules/Debug.js
var Debug = class {
  constructor(context, parameters) {
    this.context = context;
    this.parameters = parameters;
    this._init();
  }
  _init() {
    const url = new URL(location.href);
    let enabled_logs = url.searchParams.get("enabled_logs");
    if (!enabled_logs) enabled_logs = "";
    enabled_logs = enabled_logs.split(";");
    for (const category of enabled_logs) {
      if (category === "") continue;
      this.context.puter.logger.on(category);
    }
    globalThis.addEventListener("message", async (e2) => {
      if (e2.source !== globalThis.parent) return;
      if (!e2.data.$) return;
      if (e2.data.$ !== "puterjs-debug") return;
      console.log("Got a puter.js debug event!", e2.data);
      if (e2.data.cmd === "log.on") {
        console.log("Got instruction to turn logs on!");
        this.context.puter.logger.on(e2.data.category);
      }
    });
  }
};

// node_modules/@heyputer/puter.js/src/modules/Drivers.js
var FetchDriverCallBackend = class {
  constructor({ context }) {
    this.context = context;
    this.response_handlers = this.constructor.response_handlers;
  }
  static response_handlers = {
    "application/x-ndjson": async (resp) => {
      const Stream = async function* Stream2(readableStream) {
        const reader = readableStream.getReader();
        let value, done;
        while (!done) {
          ({ value, done } = await reader.read());
          if (done) break;
          const parts = new TextDecoder().decode(value).split("\n");
          for (const part of parts) {
            if (part.trim() === "") continue;
            yield JSON.parse(part);
          }
        }
      };
      return Stream(resp.body);
    },
    "application/json": async (resp) => {
      return await resp.json();
    },
    "application/octet-stream": async (resp) => {
      return await resp.blob();
    }
  };
  async call({ driver, method_name, parameters }) {
    try {
      const resp = await fetch(`${this.context.APIOrigin}/drivers/call`, {
        headers: {
          "Content-Type": "text/plain;actually=json"
        },
        method: "POST",
        body: JSON.stringify(__spreadProps(__spreadValues({
          "interface": driver.iface_name
        }, driver.service_name ? { service: driver.service_name } : {}), {
          method: method_name,
          args: parameters,
          auth_token: this.context.authToken
        }))
      });
      const content_type = resp.headers.get("content-type").split(";")[0].trim();
      const handler = this.response_handlers[content_type];
      if (!handler) {
        const msg = `unrecognized content type: ${content_type}`;
        console.error(msg);
        console.error("creating blob so dev tools shows response...");
        await resp.blob();
        if (globalThis.puter?.apiCallLogger?.isEnabled()) {
          globalThis.puter.apiCallLogger.logRequest({
            service: "drivers",
            operation: `${driver.iface_name}::${method_name}`,
            params: { interface: driver.iface_name, driver: driver.service_name || driver.iface_name, method: method_name, args: parameters },
            error: { message: msg }
          });
        }
        throw new Error(msg);
      }
      const result = await handler(resp);
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "drivers",
          operation: `${driver.iface_name}::${method_name}`,
          params: { interface: driver.iface_name, driver: driver.service_name || driver.iface_name, method: method_name, args: parameters },
          result
        });
      }
      return result;
    } catch (error) {
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "drivers",
          operation: `${driver.iface_name}::${method_name}`,
          params: { interface: driver.iface_name, driver: driver.service_name || driver.iface_name, method: method_name, args: parameters },
          error: {
            message: error.message || error.toString(),
            stack: error.stack
          }
        });
      }
      throw error;
    }
  }
};
var Driver = class {
  constructor({
    iface,
    iface_name,
    service_name,
    call_backend
  }) {
    this.iface = iface;
    this.iface_name = iface_name;
    this.service_name = service_name;
    this.call_backend = call_backend;
  }
  async call(method_name, parameters) {
    return await this.call_backend.call({
      driver: this,
      method_name,
      parameters
    });
  }
};
var Drivers = class {
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
    this.drivers_ = {};
    this.context = {};
    Object.defineProperty(this.context, "authToken", {
      get: () => this.authToken
    });
    Object.defineProperty(this.context, "APIOrigin", {
      get: () => this.APIOrigin
    });
  }
  _init({ puter: puter3 }) {
    puter3.call = this.call.bind(this);
  }
  /**
   * Sets a new authentication token and resets the socket connection with the updated token, if applicable.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [AI]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  /**
   * Sets the API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [AI]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  async list() {
    try {
      const resp = await fetch(`${this.APIOrigin}/lsmod`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        },
        method: "POST"
      });
      const list = await resp.json();
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "drivers",
          operation: "list",
          params: {},
          result: list.interfaces
        });
      }
      return list.interfaces;
    } catch (error) {
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "drivers",
          operation: "list",
          params: {},
          error: {
            message: error.message || error.toString(),
            stack: error.stack
          }
        });
      }
      throw error;
    }
  }
  async get(iface_name, service_name) {
    if (!service_name) service_name = iface_name;
    const key = `${iface_name}:${service_name}`;
    if (this.drivers_[key]) return this.drivers_[key];
    return this.drivers_[key] = new Driver({
      call_backend: new FetchDriverCallBackend({
        context: this.context
      }),
      // iface: interfaces[iface_name],
      iface_name,
      service_name
    });
  }
  async call(...a2) {
    let iface_name, service_name, method_name, parameters;
    if (a2.length === 4) {
      [iface_name, service_name, method_name, parameters] = a2;
    } else if (a2.length === 3) {
      [iface_name, method_name, parameters] = a2;
    } else if (a2.length === 2) {
      [iface_name, parameters] = a2;
      method_name = iface_name;
    }
    const driver = await this.get(iface_name, service_name);
    return await driver.call(method_name, parameters);
  }
};
var Drivers_default = Drivers;

// node_modules/@heyputer/puter.js/src/lib/socket.io/socket.io.esm.min.js
var t = /* @__PURE__ */ Object.create(null);
t.open = "0", t.close = "1", t.ping = "2", t.pong = "3", t.message = "4", t.upgrade = "5", t.noop = "6";
var e = /* @__PURE__ */ Object.create(null);
Object.keys(t).forEach(((s2) => {
  e[t[s2]] = s2;
}));
var s = { type: "error", data: "parser error" };
var n = "function" == typeof Blob || "undefined" != typeof Blob && "[object BlobConstructor]" === Object.prototype.toString.call(Blob);
var i = "function" == typeof ArrayBuffer;
var r = (t2) => "function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(t2) : t2 && t2.buffer instanceof ArrayBuffer;
var o = ({ type: e2, data: s2 }, o2, h2) => n && s2 instanceof Blob ? o2 ? h2(s2) : a(s2, h2) : i && (s2 instanceof ArrayBuffer || r(s2)) ? o2 ? h2(s2) : a(new Blob([s2]), h2) : h2(t[e2] + (s2 || ""));
var a = (t2, e2) => {
  const s2 = new FileReader();
  return s2.onload = function() {
    const t3 = s2.result.split(",")[1];
    e2("b" + (t3 || ""));
  }, s2.readAsDataURL(t2);
};
function h(t2) {
  return t2 instanceof Uint8Array ? t2 : t2 instanceof ArrayBuffer ? new Uint8Array(t2) : new Uint8Array(t2.buffer, t2.byteOffset, t2.byteLength);
}
var c;
var u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var p = "undefined" == typeof Uint8Array ? [] : new Uint8Array(256);
for (let t2 = 0; t2 < 64; t2++) p[u.charCodeAt(t2)] = t2;
var l = "function" == typeof ArrayBuffer;
var d = (t2, n2) => {
  if ("string" != typeof t2) return { type: "message", data: y(t2, n2) };
  const i2 = t2.charAt(0);
  if ("b" === i2) return { type: "message", data: f(t2.substring(1), n2) };
  return e[i2] ? t2.length > 1 ? { type: e[i2], data: t2.substring(1) } : { type: e[i2] } : s;
};
var f = (t2, e2) => {
  if (l) {
    const s2 = ((t3) => {
      let e3, s3, n2, i2, r2, o2 = 0.75 * t3.length, a2 = t3.length, h2 = 0;
      "=" === t3[t3.length - 1] && (o2--, "=" === t3[t3.length - 2] && o2--);
      const c2 = new ArrayBuffer(o2), u2 = new Uint8Array(c2);
      for (e3 = 0; e3 < a2; e3 += 4) s3 = p[t3.charCodeAt(e3)], n2 = p[t3.charCodeAt(e3 + 1)], i2 = p[t3.charCodeAt(e3 + 2)], r2 = p[t3.charCodeAt(e3 + 3)], u2[h2++] = s3 << 2 | n2 >> 4, u2[h2++] = (15 & n2) << 4 | i2 >> 2, u2[h2++] = (3 & i2) << 6 | 63 & r2;
      return c2;
    })(t2);
    return y(s2, e2);
  }
  return { base64: true, data: t2 };
};
var y = (t2, e2) => "blob" === e2 ? t2 instanceof Blob ? t2 : new Blob([t2]) : t2 instanceof ArrayBuffer ? t2 : t2.buffer;
var g = String.fromCharCode(30);
function m() {
  return new TransformStream({ transform(t2, e2) {
    !(function(t3, e3) {
      n && t3.data instanceof Blob ? t3.data.arrayBuffer().then(h).then(e3) : i && (t3.data instanceof ArrayBuffer || r(t3.data)) ? e3(h(t3.data)) : o(t3, false, ((t4) => {
        c || (c = new TextEncoder()), e3(c.encode(t4));
      }));
    })(t2, ((s2) => {
      const n2 = s2.length;
      let i2;
      if (n2 < 126) i2 = new Uint8Array(1), new DataView(i2.buffer).setUint8(0, n2);
      else if (n2 < 65536) {
        i2 = new Uint8Array(3);
        const t3 = new DataView(i2.buffer);
        t3.setUint8(0, 126), t3.setUint16(1, n2);
      } else {
        i2 = new Uint8Array(9);
        const t3 = new DataView(i2.buffer);
        t3.setUint8(0, 127), t3.setBigUint64(1, BigInt(n2));
      }
      t2.data && "string" != typeof t2.data && (i2[0] |= 128), e2.enqueue(i2), e2.enqueue(s2);
    }));
  } });
}
var b;
function v(t2) {
  return t2.reduce(((t3, e2) => t3 + e2.length), 0);
}
function w(t2, e2) {
  if (t2[0].length === e2) return t2.shift();
  const s2 = new Uint8Array(e2);
  let n2 = 0;
  for (let i2 = 0; i2 < e2; i2++) s2[i2] = t2[0][n2++], n2 === t2[0].length && (t2.shift(), n2 = 0);
  return t2.length && n2 < t2[0].length && (t2[0] = t2[0].slice(n2)), s2;
}
function k(t2) {
  if (t2) return (function(t3) {
    for (var e2 in k.prototype) t3[e2] = k.prototype[e2];
    return t3;
  })(t2);
}
k.prototype.on = k.prototype.addEventListener = function(t2, e2) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + t2] = this._callbacks["$" + t2] || []).push(e2), this;
}, k.prototype.once = function(t2, e2) {
  function s2() {
    this.off(t2, s2), e2.apply(this, arguments);
  }
  return s2.fn = e2, this.on(t2, s2), this;
}, k.prototype.off = k.prototype.removeListener = k.prototype.removeAllListeners = k.prototype.removeEventListener = function(t2, e2) {
  if (this._callbacks = this._callbacks || {}, 0 == arguments.length) return this._callbacks = {}, this;
  var s2, n2 = this._callbacks["$" + t2];
  if (!n2) return this;
  if (1 == arguments.length) return delete this._callbacks["$" + t2], this;
  for (var i2 = 0; i2 < n2.length; i2++) if ((s2 = n2[i2]) === e2 || s2.fn === e2) {
    n2.splice(i2, 1);
    break;
  }
  return 0 === n2.length && delete this._callbacks["$" + t2], this;
}, k.prototype.emit = function(t2) {
  this._callbacks = this._callbacks || {};
  for (var e2 = new Array(arguments.length - 1), s2 = this._callbacks["$" + t2], n2 = 1; n2 < arguments.length; n2++) e2[n2 - 1] = arguments[n2];
  if (s2) {
    n2 = 0;
    for (var i2 = (s2 = s2.slice(0)).length; n2 < i2; ++n2) s2[n2].apply(this, e2);
  }
  return this;
}, k.prototype.emitReserved = k.prototype.emit, k.prototype.listeners = function(t2) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + t2] || [];
}, k.prototype.hasListeners = function(t2) {
  return !!this.listeners(t2).length;
};
var _ = "undefined" != typeof self ? self : "undefined" != typeof window ? window : Function("return this")();
function E(t2, ...e2) {
  return e2.reduce(((e3, s2) => (t2.hasOwnProperty(s2) && (e3[s2] = t2[s2]), e3)), {});
}
var A = _.setTimeout;
var O = _.clearTimeout;
function T(t2, e2) {
  e2.useNativeTimers ? (t2.setTimeoutFn = A.bind(_), t2.clearTimeoutFn = O.bind(_)) : (t2.setTimeoutFn = _.setTimeout.bind(_), t2.clearTimeoutFn = _.clearTimeout.bind(_));
}
var R = class extends Error {
  constructor(t2, e2, s2) {
    super(t2), this.description = e2, this.context = s2, this.type = "TransportError";
  }
};
var C = class extends k {
  constructor(t2) {
    super(), this.writable = false, T(this, t2), this.opts = t2, this.query = t2.query, this.socket = t2.socket;
  }
  onError(t2, e2, s2) {
    return super.emitReserved("error", new R(t2, e2, s2)), this;
  }
  open() {
    return this.readyState = "opening", this.doOpen(), this;
  }
  close() {
    return "opening" !== this.readyState && "open" !== this.readyState || (this.doClose(), this.onClose()), this;
  }
  send(t2) {
    "open" === this.readyState && this.write(t2);
  }
  onOpen() {
    this.readyState = "open", this.writable = true, super.emitReserved("open");
  }
  onData(t2) {
    const e2 = d(t2, this.socket.binaryType);
    this.onPacket(e2);
  }
  onPacket(t2) {
    super.emitReserved("packet", t2);
  }
  onClose(t2) {
    this.readyState = "closed", super.emitReserved("close", t2);
  }
  pause(t2) {
  }
  createUri(t2, e2 = {}) {
    return t2 + "://" + this._hostname() + this._port() + this.opts.path + this._query(e2);
  }
  _hostname() {
    const t2 = this.opts.hostname;
    return -1 === t2.indexOf(":") ? t2 : "[" + t2 + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && Number(443 !== this.opts.port) || !this.opts.secure && 80 !== Number(this.opts.port)) ? ":" + this.opts.port : "";
  }
  _query(t2) {
    const e2 = (function(t3) {
      let e3 = "";
      for (let s2 in t3) t3.hasOwnProperty(s2) && (e3.length && (e3 += "&"), e3 += encodeURIComponent(s2) + "=" + encodeURIComponent(t3[s2]));
      return e3;
    })(t2);
    return e2.length ? "?" + e2 : "";
  }
};
var B = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split("");
var N = 64;
var S = {};
var x;
var L = 0;
var q = 0;
function P(t2) {
  let e2 = "";
  do {
    e2 = B[t2 % N] + e2, t2 = Math.floor(t2 / N);
  } while (t2 > 0);
  return e2;
}
function j() {
  const t2 = P(+/* @__PURE__ */ new Date());
  return t2 !== x ? (L = 0, x = t2) : t2 + "." + P(L++);
}
for (; q < N; q++) S[B[q]] = q;
var U = false;
try {
  U = "undefined" != typeof XMLHttpRequest && "withCredentials" in new XMLHttpRequest();
} catch (t2) {
}
var D = U;
function I(t2) {
  const e2 = t2.xdomain;
  try {
    if ("undefined" != typeof XMLHttpRequest && (!e2 || D)) return new XMLHttpRequest();
  } catch (t3) {
  }
  if (!e2) try {
    return new _[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
  } catch (t3) {
  }
}
function F() {
}
var M = null != new I({ xdomain: false }).responseType;
var V = class _V extends k {
  constructor(t2, e2) {
    super(), T(this, e2), this.opts = e2, this.method = e2.method || "GET", this.uri = t2, this.data = void 0 !== e2.data ? e2.data : null, this.create();
  }
  create() {
    var t2;
    const e2 = E(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    e2.xdomain = !!this.opts.xd;
    const s2 = this.xhr = new I(e2);
    try {
      s2.open(this.method, this.uri, true);
      try {
        if (this.opts.extraHeaders) {
          s2.setDisableHeaderCheck && s2.setDisableHeaderCheck(true);
          for (let t3 in this.opts.extraHeaders) this.opts.extraHeaders.hasOwnProperty(t3) && s2.setRequestHeader(t3, this.opts.extraHeaders[t3]);
        }
      } catch (t3) {
      }
      if ("POST" === this.method) try {
        s2.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
      } catch (t3) {
      }
      try {
        s2.setRequestHeader("Accept", "*/*");
      } catch (t3) {
      }
      null === (t2 = this.opts.cookieJar) || void 0 === t2 || t2.addCookies(s2), "withCredentials" in s2 && (s2.withCredentials = this.opts.withCredentials), this.opts.requestTimeout && (s2.timeout = this.opts.requestTimeout), s2.onreadystatechange = () => {
        var t3;
        3 === s2.readyState && (null === (t3 = this.opts.cookieJar) || void 0 === t3 || t3.parseCookies(s2)), 4 === s2.readyState && (200 === s2.status || 1223 === s2.status ? this.onLoad() : this.setTimeoutFn((() => {
          this.onError("number" == typeof s2.status ? s2.status : 0);
        }), 0));
      }, s2.send(this.data);
    } catch (t3) {
      return void this.setTimeoutFn((() => {
        this.onError(t3);
      }), 0);
    }
    "undefined" != typeof document && (this.index = _V.requestsCount++, _V.requests[this.index] = this);
  }
  onError(t2) {
    this.emitReserved("error", t2, this.xhr), this.cleanup(true);
  }
  cleanup(t2) {
    if (void 0 !== this.xhr && null !== this.xhr) {
      if (this.xhr.onreadystatechange = F, t2) try {
        this.xhr.abort();
      } catch (t3) {
      }
      "undefined" != typeof document && delete _V.requests[this.index], this.xhr = null;
    }
  }
  onLoad() {
    const t2 = this.xhr.responseText;
    null !== t2 && (this.emitReserved("data", t2), this.emitReserved("success"), this.cleanup());
  }
  abort() {
    this.cleanup();
  }
};
if (V.requestsCount = 0, V.requests = {}, "undefined" != typeof document) {
  if ("function" == typeof attachEvent) attachEvent("onunload", H);
  else if ("function" == typeof addEventListener) {
    addEventListener("onpagehide" in _ ? "pagehide" : "unload", H, false);
  }
}
function H() {
  for (let t2 in V.requests) V.requests.hasOwnProperty(t2) && V.requests[t2].abort();
}
var K = "function" == typeof Promise && "function" == typeof Promise.resolve ? (t2) => Promise.resolve().then(t2) : (t2, e2) => e2(t2, 0);
var Y = _.WebSocket || _.MozWebSocket;
var W = "undefined" != typeof navigator && "string" == typeof navigator.product && "reactnative" === navigator.product.toLowerCase();
var z = { websocket: class extends C {
  constructor(t2) {
    super(t2), this.supportsBinary = !t2.forceBase64;
  }
  get name() {
    return "websocket";
  }
  doOpen() {
    if (!this.check()) return;
    const t2 = this.uri(), e2 = this.opts.protocols, s2 = W ? {} : E(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (s2.headers = this.opts.extraHeaders);
    try {
      this.ws = W ? new Y(t2, e2, s2) : e2 ? new Y(t2, e2) : new Y(t2);
    } catch (t3) {
      return this.emitReserved("error", t3);
    }
    this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
  }
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (t2) => this.onClose({ description: "websocket connection closed", context: t2 }), this.ws.onmessage = (t2) => this.onData(t2.data), this.ws.onerror = (t2) => this.onError("websocket error", t2);
  }
  write(t2) {
    this.writable = false;
    for (let e2 = 0; e2 < t2.length; e2++) {
      const s2 = t2[e2], n2 = e2 === t2.length - 1;
      o(s2, this.supportsBinary, ((t3) => {
        try {
          this.ws.send(t3);
        } catch (t4) {
        }
        n2 && K((() => {
          this.writable = true, this.emitReserved("drain");
        }), this.setTimeoutFn);
      }));
    }
  }
  doClose() {
    void 0 !== this.ws && (this.ws.close(), this.ws = null);
  }
  uri() {
    const t2 = this.opts.secure ? "wss" : "ws", e2 = this.query || {};
    return this.opts.timestampRequests && (e2[this.opts.timestampParam] = j()), this.supportsBinary || (e2.b64 = 1), this.createUri(t2, e2);
  }
  check() {
    return !!Y;
  }
}, webtransport: class extends C {
  get name() {
    return "webtransport";
  }
  doOpen() {
    "function" == typeof WebTransport && (this.transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]), this.transport.closed.then((() => {
      this.onClose();
    })).catch(((t2) => {
      this.onError("webtransport error", t2);
    })), this.transport.ready.then((() => {
      this.transport.createBidirectionalStream().then(((t2) => {
        const e2 = (function(t3, e3) {
          b || (b = new TextDecoder());
          const n3 = [];
          let i3 = 0, r3 = -1, o3 = false;
          return new TransformStream({ transform(a2, h2) {
            for (n3.push(a2); ; ) {
              if (0 === i3) {
                if (v(n3) < 1) break;
                const t4 = w(n3, 1);
                o3 = 128 == (128 & t4[0]), r3 = 127 & t4[0], i3 = r3 < 126 ? 3 : 126 === r3 ? 1 : 2;
              } else if (1 === i3) {
                if (v(n3) < 2) break;
                const t4 = w(n3, 2);
                r3 = new DataView(t4.buffer, t4.byteOffset, t4.length).getUint16(0), i3 = 3;
              } else if (2 === i3) {
                if (v(n3) < 8) break;
                const t4 = w(n3, 8), e4 = new DataView(t4.buffer, t4.byteOffset, t4.length), o4 = e4.getUint32(0);
                if (o4 > Math.pow(2, 21) - 1) {
                  h2.enqueue(s);
                  break;
                }
                r3 = o4 * Math.pow(2, 32) + e4.getUint32(4), i3 = 3;
              } else {
                if (v(n3) < r3) break;
                const t4 = w(n3, r3);
                h2.enqueue(d(o3 ? t4 : b.decode(t4), e3)), i3 = 0;
              }
              if (0 === r3 || r3 > t3) {
                h2.enqueue(s);
                break;
              }
            }
          } });
        })(Number.MAX_SAFE_INTEGER, this.socket.binaryType), n2 = t2.readable.pipeThrough(e2).getReader(), i2 = m();
        i2.readable.pipeTo(t2.writable), this.writer = i2.writable.getWriter();
        const r2 = () => {
          n2.read().then((({ done: t3, value: e3 }) => {
            t3 || (this.onPacket(e3), r2());
          })).catch(((t3) => {
          }));
        };
        r2();
        const o2 = { type: "open" };
        this.query.sid && (o2.data = `{"sid":"${this.query.sid}"}`), this.writer.write(o2).then((() => this.onOpen()));
      }));
    })));
  }
  write(t2) {
    this.writable = false;
    for (let e2 = 0; e2 < t2.length; e2++) {
      const s2 = t2[e2], n2 = e2 === t2.length - 1;
      this.writer.write(s2).then((() => {
        n2 && K((() => {
          this.writable = true, this.emitReserved("drain");
        }), this.setTimeoutFn);
      }));
    }
  }
  doClose() {
    var t2;
    null === (t2 = this.transport) || void 0 === t2 || t2.close();
  }
}, polling: class extends C {
  constructor(t2) {
    if (super(t2), this.polling = false, "undefined" != typeof location) {
      const e3 = "https:" === location.protocol;
      let s2 = location.port;
      s2 || (s2 = e3 ? "443" : "80"), this.xd = "undefined" != typeof location && t2.hostname !== location.hostname || s2 !== t2.port;
    }
    const e2 = t2 && t2.forceBase64;
    this.supportsBinary = M && !e2, this.opts.withCredentials && (this.cookieJar = void 0);
  }
  get name() {
    return "polling";
  }
  doOpen() {
    this.poll();
  }
  pause(t2) {
    this.readyState = "pausing";
    const e2 = () => {
      this.readyState = "paused", t2();
    };
    if (this.polling || !this.writable) {
      let t3 = 0;
      this.polling && (t3++, this.once("pollComplete", (function() {
        --t3 || e2();
      }))), this.writable || (t3++, this.once("drain", (function() {
        --t3 || e2();
      })));
    } else e2();
  }
  poll() {
    this.polling = true, this.doPoll(), this.emitReserved("poll");
  }
  onData(t2) {
    ((t3, e2) => {
      const s2 = t3.split(g), n2 = [];
      for (let t4 = 0; t4 < s2.length; t4++) {
        const i2 = d(s2[t4], e2);
        if (n2.push(i2), "error" === i2.type) break;
      }
      return n2;
    })(t2, this.socket.binaryType).forEach(((t3) => {
      if ("opening" === this.readyState && "open" === t3.type && this.onOpen(), "close" === t3.type) return this.onClose({ description: "transport closed by the server" }), false;
      this.onPacket(t3);
    })), "closed" !== this.readyState && (this.polling = false, this.emitReserved("pollComplete"), "open" === this.readyState && this.poll());
  }
  doClose() {
    const t2 = () => {
      this.write([{ type: "close" }]);
    };
    "open" === this.readyState ? t2() : this.once("open", t2);
  }
  write(t2) {
    this.writable = false, ((t3, e2) => {
      const s2 = t3.length, n2 = new Array(s2);
      let i2 = 0;
      t3.forEach(((t4, r2) => {
        o(t4, false, ((t5) => {
          n2[r2] = t5, ++i2 === s2 && e2(n2.join(g));
        }));
      }));
    })(t2, ((t3) => {
      this.doWrite(t3, (() => {
        this.writable = true, this.emitReserved("drain");
      }));
    }));
  }
  uri() {
    const t2 = this.opts.secure ? "https" : "http", e2 = this.query || {};
    return false !== this.opts.timestampRequests && (e2[this.opts.timestampParam] = j()), this.supportsBinary || e2.sid || (e2.b64 = 1), this.createUri(t2, e2);
  }
  request(t2 = {}) {
    return Object.assign(t2, { xd: this.xd, cookieJar: this.cookieJar }, this.opts), new V(this.uri(), t2);
  }
  doWrite(t2, e2) {
    const s2 = this.request({ method: "POST", data: t2 });
    s2.on("success", e2), s2.on("error", ((t3, e3) => {
      this.onError("xhr post error", t3, e3);
    }));
  }
  doPoll() {
    const t2 = this.request();
    t2.on("data", this.onData.bind(this)), t2.on("error", ((t3, e2) => {
      this.onError("xhr poll error", t3, e2);
    })), this.pollXhr = t2;
  }
} };
var J = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
var $ = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
function Q(t2) {
  const e2 = t2, s2 = t2.indexOf("["), n2 = t2.indexOf("]");
  -1 != s2 && -1 != n2 && (t2 = t2.substring(0, s2) + t2.substring(s2, n2).replace(/:/g, ";") + t2.substring(n2, t2.length));
  let i2 = J.exec(t2 || ""), r2 = {}, o2 = 14;
  for (; o2--; ) r2[$[o2]] = i2[o2] || "";
  return -1 != s2 && -1 != n2 && (r2.source = e2, r2.host = r2.host.substring(1, r2.host.length - 1).replace(/;/g, ":"), r2.authority = r2.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r2.ipv6uri = true), r2.pathNames = (function(t3, e3) {
    const s3 = /\/{2,9}/g, n3 = e3.replace(s3, "/").split("/");
    "/" != e3.slice(0, 1) && 0 !== e3.length || n3.splice(0, 1);
    "/" == e3.slice(-1) && n3.splice(n3.length - 1, 1);
    return n3;
  })(0, r2.path), r2.queryKey = (function(t3, e3) {
    const s3 = {};
    return e3.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, (function(t4, e4, n3) {
      e4 && (s3[e4] = n3);
    })), s3;
  })(0, r2.query), r2;
}
var X = class _X extends k {
  constructor(t2, e2 = {}) {
    super(), this.binaryType = "arraybuffer", this.writeBuffer = [], t2 && "object" == typeof t2 && (e2 = t2, t2 = null), t2 ? (t2 = Q(t2), e2.hostname = t2.host, e2.secure = "https" === t2.protocol || "wss" === t2.protocol, e2.port = t2.port, t2.query && (e2.query = t2.query)) : e2.host && (e2.hostname = Q(e2.host).host), T(this, e2), this.secure = null != e2.secure ? e2.secure : "undefined" != typeof location && "https:" === location.protocol, e2.hostname && !e2.port && (e2.port = this.secure ? "443" : "80"), this.hostname = e2.hostname || ("undefined" != typeof location ? location.hostname : "localhost"), this.port = e2.port || ("undefined" != typeof location && location.port ? location.port : this.secure ? "443" : "80"), this.transports = e2.transports || ["polling", "websocket", "webtransport"], this.writeBuffer = [], this.prevBufferLen = 0, this.opts = Object.assign({ path: "/engine.io", agent: false, withCredentials: false, upgrade: true, timestampParam: "t", rememberUpgrade: false, addTrailingSlash: true, rejectUnauthorized: true, perMessageDeflate: { threshold: 1024 }, transportOptions: {}, closeOnBeforeunload: false }, e2), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), "string" == typeof this.opts.query && (this.opts.query = (function(t3) {
      let e3 = {}, s2 = t3.split("&");
      for (let t4 = 0, n2 = s2.length; t4 < n2; t4++) {
        let n3 = s2[t4].split("=");
        e3[decodeURIComponent(n3[0])] = decodeURIComponent(n3[1]);
      }
      return e3;
    })(this.opts.query)), this.id = null, this.upgrades = null, this.pingInterval = null, this.pingTimeout = null, this.pingTimeoutTimer = null, "function" == typeof addEventListener && (this.opts.closeOnBeforeunload && (this.beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this.beforeunloadEventListener, false)), "localhost" !== this.hostname && (this.offlineEventListener = () => {
      this.onClose("transport close", { description: "network connection lost" });
    }, addEventListener("offline", this.offlineEventListener, false))), this.open();
  }
  createTransport(t2) {
    const e2 = Object.assign({}, this.opts.query);
    e2.EIO = 4, e2.transport = t2, this.id && (e2.sid = this.id);
    const s2 = Object.assign({}, this.opts, { query: e2, socket: this, hostname: this.hostname, secure: this.secure, port: this.port }, this.opts.transportOptions[t2]);
    return new z[t2](s2);
  }
  open() {
    let t2;
    if (this.opts.rememberUpgrade && _X.priorWebsocketSuccess && -1 !== this.transports.indexOf("websocket")) t2 = "websocket";
    else {
      if (0 === this.transports.length) return void this.setTimeoutFn((() => {
        this.emitReserved("error", "No transports available");
      }), 0);
      t2 = this.transports[0];
    }
    this.readyState = "opening";
    try {
      t2 = this.createTransport(t2);
    } catch (t3) {
      return this.transports.shift(), void this.open();
    }
    t2.open(), this.setTransport(t2);
  }
  setTransport(t2) {
    this.transport && this.transport.removeAllListeners(), this.transport = t2, t2.on("drain", this.onDrain.bind(this)).on("packet", this.onPacket.bind(this)).on("error", this.onError.bind(this)).on("close", ((t3) => this.onClose("transport close", t3)));
  }
  probe(t2) {
    let e2 = this.createTransport(t2), s2 = false;
    _X.priorWebsocketSuccess = false;
    const n2 = () => {
      s2 || (e2.send([{ type: "ping", data: "probe" }]), e2.once("packet", ((t3) => {
        if (!s2) if ("pong" === t3.type && "probe" === t3.data) {
          if (this.upgrading = true, this.emitReserved("upgrading", e2), !e2) return;
          _X.priorWebsocketSuccess = "websocket" === e2.name, this.transport.pause((() => {
            s2 || "closed" !== this.readyState && (c2(), this.setTransport(e2), e2.send([{ type: "upgrade" }]), this.emitReserved("upgrade", e2), e2 = null, this.upgrading = false, this.flush());
          }));
        } else {
          const t4 = new Error("probe error");
          t4.transport = e2.name, this.emitReserved("upgradeError", t4);
        }
      })));
    };
    function i2() {
      s2 || (s2 = true, c2(), e2.close(), e2 = null);
    }
    const r2 = (t3) => {
      const s3 = new Error("probe error: " + t3);
      s3.transport = e2.name, i2(), this.emitReserved("upgradeError", s3);
    };
    function o2() {
      r2("transport closed");
    }
    function a2() {
      r2("socket closed");
    }
    function h2(t3) {
      e2 && t3.name !== e2.name && i2();
    }
    const c2 = () => {
      e2.removeListener("open", n2), e2.removeListener("error", r2), e2.removeListener("close", o2), this.off("close", a2), this.off("upgrading", h2);
    };
    e2.once("open", n2), e2.once("error", r2), e2.once("close", o2), this.once("close", a2), this.once("upgrading", h2), -1 !== this.upgrades.indexOf("webtransport") && "webtransport" !== t2 ? this.setTimeoutFn((() => {
      s2 || e2.open();
    }), 200) : e2.open();
  }
  onOpen() {
    if (this.readyState = "open", _X.priorWebsocketSuccess = "websocket" === this.transport.name, this.emitReserved("open"), this.flush(), "open" === this.readyState && this.opts.upgrade) {
      let t2 = 0;
      const e2 = this.upgrades.length;
      for (; t2 < e2; t2++) this.probe(this.upgrades[t2]);
    }
  }
  onPacket(t2) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) switch (this.emitReserved("packet", t2), this.emitReserved("heartbeat"), this.resetPingTimeout(), t2.type) {
      case "open":
        this.onHandshake(JSON.parse(t2.data));
        break;
      case "ping":
        this.sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong");
        break;
      case "error":
        const e2 = new Error("server error");
        e2.code = t2.data, this.onError(e2);
        break;
      case "message":
        this.emitReserved("data", t2.data), this.emitReserved("message", t2.data);
    }
  }
  onHandshake(t2) {
    this.emitReserved("handshake", t2), this.id = t2.sid, this.transport.query.sid = t2.sid, this.upgrades = this.filterUpgrades(t2.upgrades), this.pingInterval = t2.pingInterval, this.pingTimeout = t2.pingTimeout, this.maxPayload = t2.maxPayload, this.onOpen(), "closed" !== this.readyState && this.resetPingTimeout();
  }
  resetPingTimeout() {
    this.clearTimeoutFn(this.pingTimeoutTimer), this.pingTimeoutTimer = this.setTimeoutFn((() => {
      this.onClose("ping timeout");
    }), this.pingInterval + this.pingTimeout), this.opts.autoUnref && this.pingTimeoutTimer.unref();
  }
  onDrain() {
    this.writeBuffer.splice(0, this.prevBufferLen), this.prevBufferLen = 0, 0 === this.writeBuffer.length ? this.emitReserved("drain") : this.flush();
  }
  flush() {
    if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const t2 = this.getWritablePackets();
      this.transport.send(t2), this.prevBufferLen = t2.length, this.emitReserved("flush");
    }
  }
  getWritablePackets() {
    if (!(this.maxPayload && "polling" === this.transport.name && this.writeBuffer.length > 1)) return this.writeBuffer;
    let t2 = 1;
    for (let s2 = 0; s2 < this.writeBuffer.length; s2++) {
      const n2 = this.writeBuffer[s2].data;
      if (n2 && (t2 += "string" == typeof (e2 = n2) ? (function(t3) {
        let e3 = 0, s3 = 0;
        for (let n3 = 0, i2 = t3.length; n3 < i2; n3++) e3 = t3.charCodeAt(n3), e3 < 128 ? s3 += 1 : e3 < 2048 ? s3 += 2 : e3 < 55296 || e3 >= 57344 ? s3 += 3 : (n3++, s3 += 4);
        return s3;
      })(e2) : Math.ceil(1.33 * (e2.byteLength || e2.size))), s2 > 0 && t2 > this.maxPayload) return this.writeBuffer.slice(0, s2);
      t2 += 2;
    }
    var e2;
    return this.writeBuffer;
  }
  write(t2, e2, s2) {
    return this.sendPacket("message", t2, e2, s2), this;
  }
  send(t2, e2, s2) {
    return this.sendPacket("message", t2, e2, s2), this;
  }
  sendPacket(t2, e2, s2, n2) {
    if ("function" == typeof e2 && (n2 = e2, e2 = void 0), "function" == typeof s2 && (n2 = s2, s2 = null), "closing" === this.readyState || "closed" === this.readyState) return;
    (s2 = s2 || {}).compress = false !== s2.compress;
    const i2 = { type: t2, data: e2, options: s2 };
    this.emitReserved("packetCreate", i2), this.writeBuffer.push(i2), n2 && this.once("flush", n2), this.flush();
  }
  close() {
    const t2 = () => {
      this.onClose("forced close"), this.transport.close();
    }, e2 = () => {
      this.off("upgrade", e2), this.off("upgradeError", e2), t2();
    }, s2 = () => {
      this.once("upgrade", e2), this.once("upgradeError", e2);
    };
    return "opening" !== this.readyState && "open" !== this.readyState || (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", (() => {
      this.upgrading ? s2() : t2();
    })) : this.upgrading ? s2() : t2()), this;
  }
  onError(t2) {
    _X.priorWebsocketSuccess = false, this.emitReserved("error", t2), this.onClose("transport error", t2);
  }
  onClose(t2, e2) {
    "opening" !== this.readyState && "open" !== this.readyState && "closing" !== this.readyState || (this.clearTimeoutFn(this.pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), "function" == typeof removeEventListener && (removeEventListener("beforeunload", this.beforeunloadEventListener, false), removeEventListener("offline", this.offlineEventListener, false)), this.readyState = "closed", this.id = null, this.emitReserved("close", t2, e2), this.writeBuffer = [], this.prevBufferLen = 0);
  }
  filterUpgrades(t2) {
    const e2 = [];
    let s2 = 0;
    const n2 = t2.length;
    for (; s2 < n2; s2++) ~this.transports.indexOf(t2[s2]) && e2.push(t2[s2]);
    return e2;
  }
};
X.protocol = 4;
var G = "function" == typeof ArrayBuffer;
var Z = (t2) => "function" == typeof ArrayBuffer.isView ? ArrayBuffer.isView(t2) : t2.buffer instanceof ArrayBuffer;
var tt = Object.prototype.toString;
var et = "function" == typeof Blob || "undefined" != typeof Blob && "[object BlobConstructor]" === tt.call(Blob);
var st = "function" == typeof File || "undefined" != typeof File && "[object FileConstructor]" === tt.call(File);
function nt(t2) {
  return G && (t2 instanceof ArrayBuffer || Z(t2)) || et && t2 instanceof Blob || st && t2 instanceof File;
}
function it(t2, e2) {
  if (!t2 || "object" != typeof t2) return false;
  if (Array.isArray(t2)) {
    for (let e3 = 0, s2 = t2.length; e3 < s2; e3++) if (it(t2[e3])) return true;
    return false;
  }
  if (nt(t2)) return true;
  if (t2.toJSON && "function" == typeof t2.toJSON && 1 === arguments.length) return it(t2.toJSON(), true);
  for (const e3 in t2) if (Object.prototype.hasOwnProperty.call(t2, e3) && it(t2[e3])) return true;
  return false;
}
function rt(t2) {
  const e2 = [], s2 = t2.data, n2 = t2;
  return n2.data = ot(s2, e2), n2.attachments = e2.length, { packet: n2, buffers: e2 };
}
function ot(t2, e2) {
  if (!t2) return t2;
  if (nt(t2)) {
    const s2 = { _placeholder: true, num: e2.length };
    return e2.push(t2), s2;
  }
  if (Array.isArray(t2)) {
    const s2 = new Array(t2.length);
    for (let n2 = 0; n2 < t2.length; n2++) s2[n2] = ot(t2[n2], e2);
    return s2;
  }
  if ("object" == typeof t2 && !(t2 instanceof Date)) {
    const s2 = {};
    for (const n2 in t2) Object.prototype.hasOwnProperty.call(t2, n2) && (s2[n2] = ot(t2[n2], e2));
    return s2;
  }
  return t2;
}
function at(t2, e2) {
  return t2.data = ht(t2.data, e2), delete t2.attachments, t2;
}
function ht(t2, e2) {
  if (!t2) return t2;
  if (t2 && true === t2._placeholder) {
    if ("number" == typeof t2.num && t2.num >= 0 && t2.num < e2.length) return e2[t2.num];
    throw new Error("illegal attachments");
  }
  if (Array.isArray(t2)) for (let s2 = 0; s2 < t2.length; s2++) t2[s2] = ht(t2[s2], e2);
  else if ("object" == typeof t2) for (const s2 in t2) Object.prototype.hasOwnProperty.call(t2, s2) && (t2[s2] = ht(t2[s2], e2));
  return t2;
}
var ct = ["connect", "connect_error", "disconnect", "disconnecting", "newListener", "removeListener"];
var pt;
!(function(t2) {
  t2[t2.CONNECT = 0] = "CONNECT", t2[t2.DISCONNECT = 1] = "DISCONNECT", t2[t2.EVENT = 2] = "EVENT", t2[t2.ACK = 3] = "ACK", t2[t2.CONNECT_ERROR = 4] = "CONNECT_ERROR", t2[t2.BINARY_EVENT = 5] = "BINARY_EVENT", t2[t2.BINARY_ACK = 6] = "BINARY_ACK";
})(pt || (pt = {}));
function lt(t2) {
  return "[object Object]" === Object.prototype.toString.call(t2);
}
var dt = class _dt extends k {
  constructor(t2) {
    super(), this.reviver = t2;
  }
  add(t2) {
    let e2;
    if ("string" == typeof t2) {
      if (this.reconstructor) throw new Error("got plaintext data when reconstructing a packet");
      e2 = this.decodeString(t2);
      const s2 = e2.type === pt.BINARY_EVENT;
      s2 || e2.type === pt.BINARY_ACK ? (e2.type = s2 ? pt.EVENT : pt.ACK, this.reconstructor = new ft(e2), 0 === e2.attachments && super.emitReserved("decoded", e2)) : super.emitReserved("decoded", e2);
    } else {
      if (!nt(t2) && !t2.base64) throw new Error("Unknown type: " + t2);
      if (!this.reconstructor) throw new Error("got binary data when not reconstructing a packet");
      e2 = this.reconstructor.takeBinaryData(t2), e2 && (this.reconstructor = null, super.emitReserved("decoded", e2));
    }
  }
  decodeString(t2) {
    let e2 = 0;
    const s2 = { type: Number(t2.charAt(0)) };
    if (void 0 === pt[s2.type]) throw new Error("unknown packet type " + s2.type);
    if (s2.type === pt.BINARY_EVENT || s2.type === pt.BINARY_ACK) {
      const n3 = e2 + 1;
      for (; "-" !== t2.charAt(++e2) && e2 != t2.length; ) ;
      const i2 = t2.substring(n3, e2);
      if (i2 != Number(i2) || "-" !== t2.charAt(e2)) throw new Error("Illegal attachments");
      s2.attachments = Number(i2);
    }
    if ("/" === t2.charAt(e2 + 1)) {
      const n3 = e2 + 1;
      for (; ++e2; ) {
        if ("," === t2.charAt(e2)) break;
        if (e2 === t2.length) break;
      }
      s2.nsp = t2.substring(n3, e2);
    } else s2.nsp = "/";
    const n2 = t2.charAt(e2 + 1);
    if ("" !== n2 && Number(n2) == n2) {
      const n3 = e2 + 1;
      for (; ++e2; ) {
        const s3 = t2.charAt(e2);
        if (null == s3 || Number(s3) != s3) {
          --e2;
          break;
        }
        if (e2 === t2.length) break;
      }
      s2.id = Number(t2.substring(n3, e2 + 1));
    }
    if (t2.charAt(++e2)) {
      const n3 = this.tryParse(t2.substr(e2));
      if (!_dt.isPayloadValid(s2.type, n3)) throw new Error("invalid payload");
      s2.data = n3;
    }
    return s2;
  }
  tryParse(t2) {
    try {
      return JSON.parse(t2, this.reviver);
    } catch (t3) {
      return false;
    }
  }
  static isPayloadValid(t2, e2) {
    switch (t2) {
      case pt.CONNECT:
        return lt(e2);
      case pt.DISCONNECT:
        return void 0 === e2;
      case pt.CONNECT_ERROR:
        return "string" == typeof e2 || lt(e2);
      case pt.EVENT:
      case pt.BINARY_EVENT:
        return Array.isArray(e2) && ("number" == typeof e2[0] || "string" == typeof e2[0] && -1 === ct.indexOf(e2[0]));
      case pt.ACK:
      case pt.BINARY_ACK:
        return Array.isArray(e2);
    }
  }
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
  }
};
var ft = class {
  constructor(t2) {
    this.packet = t2, this.buffers = [], this.reconPack = t2;
  }
  takeBinaryData(t2) {
    if (this.buffers.push(t2), this.buffers.length === this.reconPack.attachments) {
      const t3 = at(this.reconPack, this.buffers);
      return this.finishedReconstruction(), t3;
    }
    return null;
  }
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
};
var yt = Object.freeze({ __proto__: null, protocol: 5, get PacketType() {
  return pt;
}, Encoder: class {
  constructor(t2) {
    this.replacer = t2;
  }
  encode(t2) {
    return t2.type !== pt.EVENT && t2.type !== pt.ACK || !it(t2) ? [this.encodeAsString(t2)] : this.encodeAsBinary({ type: t2.type === pt.EVENT ? pt.BINARY_EVENT : pt.BINARY_ACK, nsp: t2.nsp, data: t2.data, id: t2.id });
  }
  encodeAsString(t2) {
    let e2 = "" + t2.type;
    return t2.type !== pt.BINARY_EVENT && t2.type !== pt.BINARY_ACK || (e2 += t2.attachments + "-"), t2.nsp && "/" !== t2.nsp && (e2 += t2.nsp + ","), null != t2.id && (e2 += t2.id), null != t2.data && (e2 += JSON.stringify(t2.data, this.replacer)), e2;
  }
  encodeAsBinary(t2) {
    const e2 = rt(t2), s2 = this.encodeAsString(e2.packet), n2 = e2.buffers;
    return n2.unshift(s2), n2;
  }
}, Decoder: dt });
function gt(t2, e2, s2) {
  return t2.on(e2, s2), function() {
    t2.off(e2, s2);
  };
}
var mt = Object.freeze({ connect: 1, connect_error: 1, disconnect: 1, disconnecting: 1, newListener: 1, removeListener: 1 });
var bt = class extends k {
  constructor(t2, e2, s2) {
    super(), this.connected = false, this.recovered = false, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = t2, this.nsp = e2, s2 && s2.auth && (this.auth = s2.auth), this._opts = Object.assign({}, s2), this.io._autoConnect && this.open();
  }
  get disconnected() {
    return !this.connected;
  }
  subEvents() {
    if (this.subs) return;
    const t2 = this.io;
    this.subs = [gt(t2, "open", this.onopen.bind(this)), gt(t2, "packet", this.onpacket.bind(this)), gt(t2, "error", this.onerror.bind(this)), gt(t2, "close", this.onclose.bind(this))];
  }
  get active() {
    return !!this.subs;
  }
  connect() {
    return this.connected || (this.subEvents(), this.io._reconnecting || this.io.open(), "open" === this.io._readyState && this.onopen()), this;
  }
  open() {
    return this.connect();
  }
  send(...t2) {
    return t2.unshift("message"), this.emit.apply(this, t2), this;
  }
  emit(t2, ...e2) {
    if (mt.hasOwnProperty(t2)) throw new Error('"' + t2.toString() + '" is a reserved event name');
    if (e2.unshift(t2), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) return this._addToQueue(e2), this;
    const s2 = { type: pt.EVENT, data: e2, options: {} };
    if (s2.options.compress = false !== this.flags.compress, "function" == typeof e2[e2.length - 1]) {
      const t3 = this.ids++, n3 = e2.pop();
      this._registerAckCallback(t3, n3), s2.id = t3;
    }
    const n2 = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
    return this.flags.volatile && (!n2 || !this.connected) || (this.connected ? (this.notifyOutgoingListeners(s2), this.packet(s2)) : this.sendBuffer.push(s2)), this.flags = {}, this;
  }
  _registerAckCallback(t2, e2) {
    var s2;
    const n2 = null !== (s2 = this.flags.timeout) && void 0 !== s2 ? s2 : this._opts.ackTimeout;
    if (void 0 === n2) return void (this.acks[t2] = e2);
    const i2 = this.io.setTimeoutFn((() => {
      delete this.acks[t2];
      for (let e3 = 0; e3 < this.sendBuffer.length; e3++) this.sendBuffer[e3].id === t2 && this.sendBuffer.splice(e3, 1);
      e2.call(this, new Error("operation has timed out"));
    }), n2);
    this.acks[t2] = (...t3) => {
      this.io.clearTimeoutFn(i2), e2.apply(this, [null, ...t3]);
    };
  }
  emitWithAck(t2, ...e2) {
    const s2 = void 0 !== this.flags.timeout || void 0 !== this._opts.ackTimeout;
    return new Promise(((n2, i2) => {
      e2.push(((t3, e3) => s2 ? t3 ? i2(t3) : n2(e3) : n2(t3))), this.emit(t2, ...e2);
    }));
  }
  _addToQueue(t2) {
    let e2;
    "function" == typeof t2[t2.length - 1] && (e2 = t2.pop());
    const s2 = { id: this._queueSeq++, tryCount: 0, pending: false, args: t2, flags: Object.assign({ fromQueue: true }, this.flags) };
    t2.push(((t3, ...n2) => {
      if (s2 !== this._queue[0]) return;
      return null !== t3 ? s2.tryCount > this._opts.retries && (this._queue.shift(), e2 && e2(t3)) : (this._queue.shift(), e2 && e2(null, ...n2)), s2.pending = false, this._drainQueue();
    })), this._queue.push(s2), this._drainQueue();
  }
  _drainQueue(t2 = false) {
    if (!this.connected || 0 === this._queue.length) return;
    const e2 = this._queue[0];
    e2.pending && !t2 || (e2.pending = true, e2.tryCount++, this.flags = e2.flags, this.emit.apply(this, e2.args));
  }
  packet(t2) {
    t2.nsp = this.nsp, this.io._packet(t2);
  }
  onopen() {
    "function" == typeof this.auth ? this.auth(((t2) => {
      this._sendConnectPacket(t2);
    })) : this._sendConnectPacket(this.auth);
  }
  _sendConnectPacket(t2) {
    this.packet({ type: pt.CONNECT, data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, t2) : t2 });
  }
  onerror(t2) {
    this.connected || this.emitReserved("connect_error", t2);
  }
  onclose(t2, e2) {
    this.connected = false, delete this.id, this.emitReserved("disconnect", t2, e2);
  }
  onpacket(t2) {
    if (t2.nsp === this.nsp) switch (t2.type) {
      case pt.CONNECT:
        t2.data && t2.data.sid ? this.onconnect(t2.data.sid, t2.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
        break;
      case pt.EVENT:
      case pt.BINARY_EVENT:
        this.onevent(t2);
        break;
      case pt.ACK:
      case pt.BINARY_ACK:
        this.onack(t2);
        break;
      case pt.DISCONNECT:
        this.ondisconnect();
        break;
      case pt.CONNECT_ERROR:
        this.destroy();
        const e2 = new Error(t2.data.message);
        e2.data = t2.data.data, this.emitReserved("connect_error", e2);
    }
  }
  onevent(t2) {
    const e2 = t2.data || [];
    null != t2.id && e2.push(this.ack(t2.id)), this.connected ? this.emitEvent(e2) : this.receiveBuffer.push(Object.freeze(e2));
  }
  emitEvent(t2) {
    if (this._anyListeners && this._anyListeners.length) {
      const e2 = this._anyListeners.slice();
      for (const s2 of e2) s2.apply(this, t2);
    }
    super.emit.apply(this, t2), this._pid && t2.length && "string" == typeof t2[t2.length - 1] && (this._lastOffset = t2[t2.length - 1]);
  }
  ack(t2) {
    const e2 = this;
    let s2 = false;
    return function(...n2) {
      s2 || (s2 = true, e2.packet({ type: pt.ACK, id: t2, data: n2 }));
    };
  }
  onack(t2) {
    const e2 = this.acks[t2.id];
    "function" == typeof e2 && (e2.apply(this, t2.data), delete this.acks[t2.id]);
  }
  onconnect(t2, e2) {
    this.id = t2, this.recovered = e2 && this._pid === e2, this._pid = e2, this.connected = true, this.emitBuffered(), this.emitReserved("connect"), this._drainQueue(true);
  }
  emitBuffered() {
    this.receiveBuffer.forEach(((t2) => this.emitEvent(t2))), this.receiveBuffer = [], this.sendBuffer.forEach(((t2) => {
      this.notifyOutgoingListeners(t2), this.packet(t2);
    })), this.sendBuffer = [];
  }
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  destroy() {
    this.subs && (this.subs.forEach(((t2) => t2())), this.subs = void 0), this.io._destroy(this);
  }
  disconnect() {
    return this.connected && this.packet({ type: pt.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  close() {
    return this.disconnect();
  }
  compress(t2) {
    return this.flags.compress = t2, this;
  }
  get volatile() {
    return this.flags.volatile = true, this;
  }
  timeout(t2) {
    return this.flags.timeout = t2, this;
  }
  onAny(t2) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(t2), this;
  }
  prependAny(t2) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(t2), this;
  }
  offAny(t2) {
    if (!this._anyListeners) return this;
    if (t2) {
      const e2 = this._anyListeners;
      for (let s2 = 0; s2 < e2.length; s2++) if (t2 === e2[s2]) return e2.splice(s2, 1), this;
    } else this._anyListeners = [];
    return this;
  }
  listenersAny() {
    return this._anyListeners || [];
  }
  onAnyOutgoing(t2) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(t2), this;
  }
  prependAnyOutgoing(t2) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(t2), this;
  }
  offAnyOutgoing(t2) {
    if (!this._anyOutgoingListeners) return this;
    if (t2) {
      const e2 = this._anyOutgoingListeners;
      for (let s2 = 0; s2 < e2.length; s2++) if (t2 === e2[s2]) return e2.splice(s2, 1), this;
    } else this._anyOutgoingListeners = [];
    return this;
  }
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  notifyOutgoingListeners(t2) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const e2 = this._anyOutgoingListeners.slice();
      for (const s2 of e2) s2.apply(this, t2.data);
    }
  }
};
function vt(t2) {
  t2 = t2 || {}, this.ms = t2.min || 100, this.max = t2.max || 1e4, this.factor = t2.factor || 2, this.jitter = t2.jitter > 0 && t2.jitter <= 1 ? t2.jitter : 0, this.attempts = 0;
}
vt.prototype.duration = function() {
  var t2 = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var e2 = Math.random(), s2 = Math.floor(e2 * this.jitter * t2);
    t2 = 0 == (1 & Math.floor(10 * e2)) ? t2 - s2 : t2 + s2;
  }
  return 0 | Math.min(t2, this.max);
}, vt.prototype.reset = function() {
  this.attempts = 0;
}, vt.prototype.setMin = function(t2) {
  this.ms = t2;
}, vt.prototype.setMax = function(t2) {
  this.max = t2;
}, vt.prototype.setJitter = function(t2) {
  this.jitter = t2;
};
var wt = class extends k {
  constructor(t2, e2) {
    var s2;
    super(), this.nsps = {}, this.subs = [], t2 && "object" == typeof t2 && (e2 = t2, t2 = void 0), (e2 = e2 || {}).path = e2.path || "/socket.io", this.opts = e2, T(this, e2), this.reconnection(false !== e2.reconnection), this.reconnectionAttempts(e2.reconnectionAttempts || 1 / 0), this.reconnectionDelay(e2.reconnectionDelay || 1e3), this.reconnectionDelayMax(e2.reconnectionDelayMax || 5e3), this.randomizationFactor(null !== (s2 = e2.randomizationFactor) && void 0 !== s2 ? s2 : 0.5), this.backoff = new vt({ min: this.reconnectionDelay(), max: this.reconnectionDelayMax(), jitter: this.randomizationFactor() }), this.timeout(null == e2.timeout ? 2e4 : e2.timeout), this._readyState = "closed", this.uri = t2;
    const n2 = e2.parser || yt;
    this.encoder = new n2.Encoder(), this.decoder = new n2.Decoder(), this._autoConnect = false !== e2.autoConnect, this._autoConnect && this.open();
  }
  reconnection(t2) {
    return arguments.length ? (this._reconnection = !!t2, this) : this._reconnection;
  }
  reconnectionAttempts(t2) {
    return void 0 === t2 ? this._reconnectionAttempts : (this._reconnectionAttempts = t2, this);
  }
  reconnectionDelay(t2) {
    var e2;
    return void 0 === t2 ? this._reconnectionDelay : (this._reconnectionDelay = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setMin(t2), this);
  }
  randomizationFactor(t2) {
    var e2;
    return void 0 === t2 ? this._randomizationFactor : (this._randomizationFactor = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setJitter(t2), this);
  }
  reconnectionDelayMax(t2) {
    var e2;
    return void 0 === t2 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = t2, null === (e2 = this.backoff) || void 0 === e2 || e2.setMax(t2), this);
  }
  timeout(t2) {
    return arguments.length ? (this._timeout = t2, this) : this._timeout;
  }
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && 0 === this.backoff.attempts && this.reconnect();
  }
  open(t2) {
    if (~this._readyState.indexOf("open")) return this;
    this.engine = new X(this.uri, this.opts);
    const e2 = this.engine, s2 = this;
    this._readyState = "opening", this.skipReconnect = false;
    const n2 = gt(e2, "open", (function() {
      s2.onopen(), t2 && t2();
    })), i2 = (e3) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", e3), t2 ? t2(e3) : this.maybeReconnectOnOpen();
    }, r2 = gt(e2, "error", i2);
    if (false !== this._timeout) {
      const t3 = this._timeout, s3 = this.setTimeoutFn((() => {
        n2(), i2(new Error("timeout")), e2.close();
      }), t3);
      this.opts.autoUnref && s3.unref(), this.subs.push((() => {
        this.clearTimeoutFn(s3);
      }));
    }
    return this.subs.push(n2), this.subs.push(r2), this;
  }
  connect(t2) {
    return this.open(t2);
  }
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const t2 = this.engine;
    this.subs.push(gt(t2, "ping", this.onping.bind(this)), gt(t2, "data", this.ondata.bind(this)), gt(t2, "error", this.onerror.bind(this)), gt(t2, "close", this.onclose.bind(this)), gt(this.decoder, "decoded", this.ondecoded.bind(this)));
  }
  onping() {
    this.emitReserved("ping");
  }
  ondata(t2) {
    try {
      this.decoder.add(t2);
    } catch (t3) {
      this.onclose("parse error", t3);
    }
  }
  ondecoded(t2) {
    K((() => {
      this.emitReserved("packet", t2);
    }), this.setTimeoutFn);
  }
  onerror(t2) {
    this.emitReserved("error", t2);
  }
  socket(t2, e2) {
    let s2 = this.nsps[t2];
    return s2 ? this._autoConnect && !s2.active && s2.connect() : (s2 = new bt(this, t2, e2), this.nsps[t2] = s2), s2;
  }
  _destroy(t2) {
    const e2 = Object.keys(this.nsps);
    for (const t3 of e2) {
      if (this.nsps[t3].active) return;
    }
    this._close();
  }
  _packet(t2) {
    const e2 = this.encoder.encode(t2);
    for (let s2 = 0; s2 < e2.length; s2++) this.engine.write(e2[s2], t2.options);
  }
  cleanup() {
    this.subs.forEach(((t2) => t2())), this.subs.length = 0, this.decoder.destroy();
  }
  _close() {
    this.skipReconnect = true, this._reconnecting = false, this.onclose("forced close"), this.engine && this.engine.close();
  }
  disconnect() {
    return this._close();
  }
  onclose(t2, e2) {
    this.cleanup(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", t2, e2), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  reconnect() {
    if (this._reconnecting || this.skipReconnect) return this;
    const t2 = this;
    if (this.backoff.attempts >= this._reconnectionAttempts) this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = false;
    else {
      const e2 = this.backoff.duration();
      this._reconnecting = true;
      const s2 = this.setTimeoutFn((() => {
        t2.skipReconnect || (this.emitReserved("reconnect_attempt", t2.backoff.attempts), t2.skipReconnect || t2.open(((e3) => {
          e3 ? (t2._reconnecting = false, t2.reconnect(), this.emitReserved("reconnect_error", e3)) : t2.onreconnect();
        })));
      }), e2);
      this.opts.autoUnref && s2.unref(), this.subs.push((() => {
        this.clearTimeoutFn(s2);
      }));
    }
  }
  onreconnect() {
    const t2 = this.backoff.attempts;
    this._reconnecting = false, this.backoff.reset(), this.emitReserved("reconnect", t2);
  }
};
var kt = {};
function _t(t2, e2) {
  "object" == typeof t2 && (e2 = t2, t2 = void 0);
  const s2 = (function(t3, e3 = "", s3) {
    let n3 = t3;
    s3 = s3 || "undefined" != typeof location && location, null == t3 && (t3 = s3.protocol + "//" + s3.host), "string" == typeof t3 && ("/" === t3.charAt(0) && (t3 = "/" === t3.charAt(1) ? s3.protocol + t3 : s3.host + t3), /^(https?|wss?):\/\//.test(t3) || (t3 = void 0 !== s3 ? s3.protocol + "//" + t3 : "https://" + t3), n3 = Q(t3)), n3.port || (/^(http|ws)$/.test(n3.protocol) ? n3.port = "80" : /^(http|ws)s$/.test(n3.protocol) && (n3.port = "443")), n3.path = n3.path || "/";
    const i3 = -1 !== n3.host.indexOf(":") ? "[" + n3.host + "]" : n3.host;
    return n3.id = n3.protocol + "://" + i3 + ":" + n3.port + e3, n3.href = n3.protocol + "://" + i3 + (s3 && s3.port === n3.port ? "" : ":" + n3.port), n3;
  })(t2, (e2 = e2 || {}).path || "/socket.io"), n2 = s2.source, i2 = s2.id, r2 = s2.path, o2 = kt[i2] && r2 in kt[i2].nsps;
  let a2;
  return e2.forceNew || e2["force new connection"] || false === e2.multiplex || o2 ? a2 = new wt(n2, e2) : (kt[i2] || (kt[i2] = new wt(n2, e2)), a2 = kt[i2]), s2.query && !e2.query && (e2.query = s2.queryKey), a2.socket(s2.path, e2);
}
Object.assign(_t, { Manager: wt, Socket: bt, io: _t, connect: _t });

// node_modules/@heyputer/puter.js/src/modules/FileSystem/utils/getAbsolutePathForApp.js
var getAbsolutePathForApp = (relativePath) => {
  if (puter.env === "gui") {
    return relativePath;
  }
  if (!relativePath) {
    relativePath = ".";
  }
  if (!relativePath || !relativePath.startsWith("/") && !relativePath.startsWith("~") && puter.appID) {
    relativePath = path_default.join("~/AppData", puter.appID, relativePath);
  }
  return relativePath;
};
var getAbsolutePathForApp_default = getAbsolutePathForApp;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/copy.js
var copy = function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      source: args[0],
      destination: args[1],
      overwrite: args[2]?.overwrite,
      new_name: args[2]?.newName || args[2]?.new_name,
      create_missing_parents: args[2]?.createMissingParents || args[2]?.create_missing_parents,
      new_metadata: args[2]?.newMetadata || args[2]?.new_metadata,
      original_client_socket_id: args[2]?.excludeSocketID || args[2]?.original_client_socket_id,
      success: args[3],
      error: args[4]
      // Add more if needed...
    };
  }
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    options.source = getAbsolutePathForApp_default(options.source);
    options.destination = getAbsolutePathForApp_default(options.destination);
    const xhr = initXhr("/copy", this.APIOrigin, this.authToken);
    setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
    xhr.send(JSON.stringify({
      original_client_socket_id: this.socket.id,
      socket_id: this.socket.id,
      source: options.source,
      destination: options.destination,
      overwrite: options.overwrite,
      new_name: options.new_name || options.newName,
      // if user is copying an item to where its source is, change the name so there is no conflict
      dedupe_name: options.dedupe_name || options.dedupeName
    }));
  });
};
var copy_default = copy;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/mkdir.js
var mkdir = function(...args) {
  let options = {};
  if (typeof args[0] === "string" && typeof args[1] === "object" && !(args[1] instanceof Function) || typeof args[0] === "object" && args[0] !== null) {
    if (typeof args[0] === "string") {
      options.path = args[0];
      Object.assign(options, args[1]);
      options.success = args[2];
      options.error = args[3];
    } else {
      options = args[0];
    }
  } else if (typeof args[0] === "string") {
    options.path = args[0];
    options.success = args[1];
    options.error = args[2];
  }
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    const xhr = initXhr("/mkdir", this.APIOrigin, this.authToken);
    setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
    options.path = getAbsolutePathForApp_default(options.path);
    xhr.send(JSON.stringify({
      parent: path_default.dirname(options.path),
      path: path_default.basename(options.path),
      overwrite: options.overwrite ?? false,
      dedupe_name: (options.rename || options.dedupeName) ?? false,
      shortcut_to: options.shortcutTo,
      original_client_socket_id: this.socket.id,
      create_missing_parents: (options.recursive || options.createMissingParents) ?? false
    }));
  });
};
var mkdir_default = mkdir;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/stat.js
var inflightRequests = /* @__PURE__ */ new Map();
var DEDUPLICATION_WINDOW_MS = 2e3;
var stat = async function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      path: args[0],
      options: typeof args[1] === "object" ? args[1] : {},
      success: typeof args[1] === "object" ? args[2] : args[1],
      error: typeof args[1] === "object" ? args[3] : args[2]
      // Add more if needed...
    };
  }
  return new Promise(async (resolve, reject) => {
    if (!options.consistency) {
      options.consistency = "strong";
    }
    let cacheKey;
    if (options.path) {
      cacheKey = `item:${options.path}`;
    }
    if (options.consistency === "eventual" && !options.returnSubdomains && !options.returnPermissions && !options.returnVersions && !options.returnSize) {
      const cachedResult = await puter._cache.get(cacheKey);
      if (cachedResult) {
        resolve(cachedResult);
        return;
      }
    }
    const deduplicationKey = JSON.stringify({
      path: options.path,
      uid: options.uid,
      returnSubdomains: options.returnSubdomains,
      returnPermissions: options.returnPermissions,
      returnVersions: options.returnVersions,
      returnSize: options.returnSize,
      consistency: options.consistency
    });
    const existingEntry = inflightRequests.get(deduplicationKey);
    const now = Date.now();
    if (existingEntry) {
      const timeSinceRequest = now - existingEntry.timestamp;
      if (timeSinceRequest < DEDUPLICATION_WINDOW_MS) {
        try {
          const result = await existingEntry.promise;
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      } else {
        inflightRequests.delete(deduplicationKey);
      }
    }
    const requestPromise = new Promise(async (resolveRequest, rejectRequest) => {
      if (!puter.authToken && puter.env === "web") {
        try {
          await puter.ui.authenticateWithPuter();
        } catch (e2) {
          rejectRequest("Authentication failed.");
          return;
        }
      }
      const xhr = initXhr("/stat", this.APIOrigin, void 0, "post", "text/plain;actually=json");
      setupXhrEventHandlers(xhr, options.success, options.error, async (result) => {
        const resultSize = JSON.stringify(result).length;
        const MAX_CACHE_SIZE = 20 * 1024 * 1024;
        if (resultSize <= MAX_CACHE_SIZE) {
          puter._cache.set(cacheKey, result);
        }
        resolveRequest(result);
      }, rejectRequest);
      let dataToSend = {};
      if (options.uid !== void 0) {
        dataToSend.uid = options.uid;
      } else if (options.path !== void 0) {
        dataToSend.path = getAbsolutePathForApp_default(options.path);
      }
      dataToSend.return_subdomains = options.returnSubdomains;
      dataToSend.return_permissions = options.returnPermissions;
      dataToSend.return_versions = options.returnVersions;
      dataToSend.return_size = options.returnSize;
      dataToSend.auth_token = this.authToken;
      xhr.send(JSON.stringify(dataToSend));
    });
    inflightRequests.set(deduplicationKey, {
      promise: requestPromise,
      timestamp: now
    });
    try {
      const result = await requestPromise;
      inflightRequests.delete(deduplicationKey);
      resolve(result);
    } catch (error) {
      inflightRequests.delete(deduplicationKey);
      reject(error);
    }
  });
};
var stat_default = stat;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/move.js
var move = function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      source: args[0],
      destination: args[1],
      overwrite: args[2]?.overwrite,
      new_name: args[2]?.newName || args[2]?.new_name,
      create_missing_parents: args[2]?.createMissingParents || args[2]?.create_missing_parents,
      new_metadata: args[2]?.newMetadata || args[2]?.new_metadata,
      original_client_socket_id: args[2]?.excludeSocketID || args[2]?.original_client_socket_id
    };
  }
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    options.source = getAbsolutePathForApp_default(options.source);
    options.destination = getAbsolutePathForApp_default(options.destination);
    if (!options.new_name) {
      try {
        const destStats = await stat_default.bind(this)(options.destination);
        if (!destStats.is_dir) {
          throw "is not directory";
        }
      } catch (e2) {
        options.new_name = path_default.basename(options.destination);
        options.destination = path_default.dirname(options.destination);
      }
    }
    const xhr = initXhr("/move", this.APIOrigin, this.authToken);
    setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
    xhr.send(JSON.stringify({
      source: options.source,
      destination: options.destination,
      overwrite: options.overwrite,
      new_name: options.new_name || options.newName,
      create_missing_parents: options.create_missing_parents || options.createMissingParents,
      new_metadata: options.new_metadata || options.newMetadata,
      original_client_socket_id: options.excludeSocketID
    }));
  });
};
var move_default = move;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/read.js
var read = function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = __spreadValues({
      path: typeof args[0] === "string" ? args[0] : typeof args[0] === "object" && args[0] !== null ? args[0].path : args[0]
    }, typeof args[1] === "object" ? args[1] : {
      success: args[1],
      error: args[2]
    });
  }
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    options.path = getAbsolutePathForApp_default(options.path);
    const xhr = initXhr(`/read?${new URLSearchParams(__spreadValues(__spreadValues({ file: options.path }, options.offset ? { offset: options.offset } : {}), options.byte_count ? { byte_count: options.byte_count } : {})).toString()}`, this.APIOrigin, this.authToken, "get", "application/json;charset=UTF-8", "blob");
    setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
    xhr.send();
  });
};
var read_default = read;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/readdir.js
var inflightRequests2 = /* @__PURE__ */ new Map();
var DEDUPLICATION_WINDOW_MS2 = 2e3;
var readdir = async function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      path: args[0],
      success: args[1],
      error: args[2]
    };
  }
  return new Promise(async (resolve, reject) => {
    if (!options.consistency) {
      options.consistency = "strong";
    }
    if (!options.path && !options.uid) {
      throw new Error({ code: "NO_PATH_OR_UID", message: "Either path or uid must be provided." });
    }
    let cacheKey;
    if (options.path) {
      cacheKey = `readdir:${options.path}`;
    }
    if (options.consistency === "eventual") {
      const cachedResult = await puter._cache.get(cacheKey);
      if (cachedResult) {
        resolve(cachedResult);
        return;
      }
    }
    const deduplicationKey = JSON.stringify({
      path: options.path,
      uid: options.uid,
      no_thumbs: options.no_thumbs,
      no_assocs: options.no_assocs,
      consistency: options.consistency
    });
    const existingEntry = inflightRequests2.get(deduplicationKey);
    const now = Date.now();
    if (existingEntry) {
      const timeSinceRequest = now - existingEntry.timestamp;
      if (timeSinceRequest < DEDUPLICATION_WINDOW_MS2) {
        try {
          const result = await existingEntry.promise;
          resolve(result);
        } catch (error) {
          reject(error);
        }
        return;
      } else {
        inflightRequests2.delete(deduplicationKey);
      }
    }
    const requestPromise = new Promise(async (resolveRequest, rejectRequest) => {
      if (!puter.authToken && puter.env === "web") {
        try {
          await puter.ui.authenticateWithPuter();
        } catch (e2) {
          rejectRequest("Authentication failed.");
          return;
        }
      }
      const xhr = initXhr("/readdir", this.APIOrigin, void 0, "post", "text/plain;actually=json");
      setupXhrEventHandlers(xhr, options.success, options.error, async (result) => {
        const resultSize = JSON.stringify(result).length;
        const MAX_CACHE_SIZE = 100 * 1024 * 1024;
        if (resultSize <= MAX_CACHE_SIZE) {
          puter._cache.set(cacheKey, result);
        }
        for (const item of result) {
          puter._cache.set(`item:${item.path}`, item);
        }
        resolveRequest(result);
      }, rejectRequest);
      const payload = {
        no_thumbs: options.no_thumbs,
        no_assocs: options.no_assocs,
        auth_token: this.authToken
      };
      if (options.uid) {
        payload.uid = options.uid;
      } else if (options.path) {
        payload.path = getAbsolutePathForApp_default(options.path);
      }
      xhr.send(JSON.stringify(payload));
    });
    inflightRequests2.set(deduplicationKey, {
      promise: requestPromise,
      timestamp: now
    });
    try {
      const result = await requestPromise;
      inflightRequests2.delete(deduplicationKey);
      resolve(result);
    } catch (error) {
      inflightRequests2.delete(deduplicationKey);
      reject(error);
    }
  });
};
var readdir_default = readdir;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/rename.js
var rename = function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      path: args[0],
      new_name: args[1],
      success: args[2],
      error: args[3]
      // Add more if needed...
    };
  }
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    const xhr = initXhr("/rename", this.APIOrigin, this.authToken);
    setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
    let dataToSend = {
      original_client_socket_id: options.excludeSocketID || options.original_client_socket_id,
      new_name: options.new_name || options.newName
    };
    if (options.uid !== void 0) {
      dataToSend.uid = options.uid;
    } else if (options.path !== void 0) {
      dataToSend.path = getAbsolutePathForApp_default(options.path);
    }
    xhr.send(JSON.stringify(dataToSend));
  });
};
var rename_default = rename;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/sign.js
var sign = function(...args) {
  let options;
  options = {
    app_uid: args[0],
    items: args[1],
    success: args[2],
    error: args[3]
    // Add more if needed...
  };
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    let items = options.items;
    if (!Array.isArray(items)) {
      items = [items];
    }
    const xhr = initXhr("/sign", this.APIOrigin, this.authToken);
    xhr.addEventListener("load", async function(e2) {
      const resp = await parseResponse(this);
      if (this.status !== 200) {
        if (options.error && typeof options.error === "function") {
          options.error(resp);
        }
        return reject(resp);
      } else {
        let res = resp;
        let result;
        let token = res.token;
        if (items.length == 1) {
          result = __spreadValues({}, res.signatures[0]);
        } else {
          let obj = [];
          for (let i2 = 0; i2 < res.signatures.length; i2++) {
            obj.push(__spreadValues({}, res.signatures[i2]));
          }
          result = obj;
        }
        if (options.success && typeof options.success === "function") {
          options.success({ token, items: result });
        }
        return resolve({ token, items: result });
      }
    });
    xhr.upload.addEventListener("progress", function(e2) {
    });
    xhr.addEventListener("error", function(e2) {
      return handle_error(options.error, reject, this);
    });
    xhr.send(JSON.stringify({
      app_uid: options.app_uid,
      items
    }));
  });
};
var sign_default = sign;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/space.js
var space = function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      success: args[0],
      error: args[1]
      // Add more if needed...
    };
  }
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    const xhr = initXhr("/df", this.APIOrigin, this.authToken);
    setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
    xhr.send();
  });
};
var space_default = space;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/symlink.js
var symlink = async function(target, linkPath) {
  if (!puter.authToken && puter.env === "web") {
    try {
      await puter.ui.authenticateWithPuter();
    } catch (e2) {
      throw "Authentication failed.";
    }
  }
  linkPath = getAbsolutePathForApp_default(linkPath);
  target = getAbsolutePathForApp_default(target);
  const name = path_default.basename(linkPath);
  const linkDir = path_default.dirname(linkPath);
  const op = {
    op: "symlink",
    path: linkDir,
    name,
    target
  };
  const formData = new FormData();
  formData.append("operation", JSON.stringify(op));
  try {
    const response = await fetch(`${this.APIOrigin}/batch`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${puter.authToken}` },
      body: formData
    });
    if (response.status !== 200) {
      const error = await response.text();
      console.error("[symlink] fetch error: ", error);
      throw error;
    }
  } catch (e2) {
    console.error("[symlink] fetch error: ", e2);
    throw e2;
  }
};
var symlink_default = symlink;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/upload.js
var upload = async function(items, dirPath, options = {}) {
  return new Promise(async (resolve, reject) => {
    const DataTransferItem = globalThis.DataTransfer || class DataTransferItem {
    };
    const FileList = globalThis.FileList || class FileList {
    };
    const DataTransferItemList = globalThis.DataTransferItemList || class DataTransferItemList {
    };
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject(e2);
      }
    }
    const error = (e2) => {
      if (options.error && typeof options.error === "function") {
        options.error(e2);
      }
      return reject(e2);
    };
    let xhr = new XMLHttpRequest();
    if (dirPath === "/") {
      return error("Can not upload to root directory.");
    }
    dirPath = getAbsolutePathForApp_default(dirPath);
    const operation_id = uuidv4();
    if (options.init && typeof options.init === "function") {
      options.init(operation_id, xhr);
    }
    let bytes_uploaded_to_server = 0;
    let bytes_uploaded_to_cloud = 0;
    let entries;
    let total_size = 0;
    let file_count = 0;
    let seemsToBeParsedDataTransferItems = false;
    if (Array.isArray(items) && items.length > 0) {
      for (let i2 = 0; i2 < items.length; i2++) {
        if (items[i2] instanceof DataTransferItem || items[i2] instanceof DataTransferItemList) {
          seemsToBeParsedDataTransferItems = true;
        }
      }
    }
    if (items instanceof DataTransferItemList || items instanceof DataTransferItem || items[0] instanceof DataTransferItem || options.parsedDataTransferItems) {
      if (options.parsedDataTransferItems) {
        entries = items;
      } else {
        entries = await puter.ui.getEntriesFromDataTransferItems(items);
      }
      entries.sort((entry_a, entry_b) => {
        if (entry_a.isDirectory && !entry_b.isDirectory) return -1;
        if (!entry_a.isDirectory && entry_b.isDirectory) return 1;
        if (entry_a.isDirectory && entry_b.isDirectory) return 0;
        return entry_a.size - entry_b.size;
      });
    } else if (items instanceof File || items[0] instanceof File || items instanceof FileList || items[0] instanceof FileList) {
      if (!Array.isArray(items)) {
        entries = items instanceof FileList ? Array.from(items) : [items];
      } else {
        entries = items;
      }
      entries.sort((entry_a, entry_b) => {
        return entry_a.size - entry_b.size;
      });
      for (let i2 = 0; i2 < entries.length; i2++) {
        entries[i2].filepath = entries[i2].name;
        entries[i2].fullPath = entries[i2].name;
      }
    } else if (items instanceof Blob) {
      let file = new File([items], options.name, { type: "application/octet-stream" });
      entries = [file];
      for (let i2 = 0; i2 < entries.length; i2++) {
        entries[i2].filepath = entries[i2].name;
        entries[i2].fullPath = entries[i2].name;
      }
    } else if (typeof items === "string") {
      let file = new File([items], "default.txt", { type: "text/plain" });
      entries = [file];
      for (let i2 = 0; i2 < entries.length; i2++) {
        entries[i2].filepath = entries[i2].name;
        entries[i2].fullPath = entries[i2].name;
      }
    } else {
      return error({ code: "field_invalid", message: "upload() items parameter is an invalid type" });
    }
    let dirs = [];
    let uniqueDirs = {};
    let files = [];
    for (let i2 = 0; i2 < entries.length; i2++) {
      if (!entries[i2]) {
        continue;
      }
      if (entries[i2].isDirectory) {
        dirs.push({ path: path_default.join(dirPath, entries[i2].finalPath ? entries[i2].finalPath : entries[i2].fullPath) });
      } else {
        let fileItem = entries[i2].finalPath ? entries[i2].finalPath : entries[i2].fullPath;
        let [dirLevel, fileName] = [fileItem?.slice(0, fileItem?.lastIndexOf("/")), fileItem?.slice(fileItem?.lastIndexOf("/") + 1)];
        fileName != "" && files.push(entries[i2]);
        if (options.createFileParent && fileItem.includes("/")) {
          let incrementalDir;
          dirLevel.split("/").forEach((directory) => {
            incrementalDir = incrementalDir ? `${incrementalDir}/${directory}` : directory;
            let filePath = path_default.join(dirPath, incrementalDir);
            if (!uniqueDirs[filePath]) {
              uniqueDirs[filePath] = true;
              dirs.push({ path: filePath });
            }
          });
        }
      }
      if (entries[i2].size !== void 0) {
        total_size += entries[i2].size;
        file_count++;
      }
    }
    if (dirs.length === 0 && files.length === 0) {
      return error({ code: "EMPTY_UPLOAD", message: "No files or directories to upload." });
    }
    let storage;
    if (puter.env !== "web") {
      try {
        storage = await this.space();
        if (storage.capacity - storage.used < total_size) {
          return error({ code: "NOT_ENOUGH_SPACE", message: "Not enough storage space available." });
        }
      } catch (e2) {
      }
    }
    total_size = total_size * 2;
    const fd = new FormData();
    dirs.sort((a2, b2) => b2.path.length - a2.path.length);
    let mkdir_requests = [];
    for (let i2 = 0; i2 < dirs.length; i2++) {
      for (let j2 = 0; j2 < files.length; j2++) {
        if (!files[j2].puter_path_param && path_default.join(dirPath, files[j2].filepath).startsWith(`${dirs[i2].path}/`)) {
          files[j2].puter_path_param = `$dir_${i2}/${path_default.basename(files[j2].filepath)}`;
        }
      }
      for (let k2 = 0; k2 < dirs.length; k2++) {
        if (!dirs[k2].puter_path_param && dirs[k2].path.startsWith(`${dirs[i2].path}/`)) {
          dirs[k2].puter_path_param = `$dir_${i2}/${path_default.basename(dirs[k2].path)}`;
        }
      }
    }
    for (let i2 = 0; i2 < dirs.length; i2++) {
      let parent_path = path_default.dirname(dirs[i2].puter_path_param || dirs[i2].path);
      let dir_path = dirs[i2].puter_path_param || dirs[i2].path;
      if (parent_path !== "/") {
        dir_path = dir_path.replace(parent_path, "");
      }
      mkdir_requests.push({
        op: "mkdir",
        parent: parent_path,
        path: dir_path,
        overwrite: options.overwrite ?? false,
        dedupe_name: options.dedupeName ?? true,
        create_missing_ancestors: options.createMissingAncestors ?? true,
        as: `dir_${i2}`
      });
    }
    mkdir_requests.reverse();
    fd.append("operation_id", operation_id);
    fd.append("socket_id", this.socket.id);
    fd.append("original_client_socket_id", this.socket.id);
    for (let i2 = 0; i2 < mkdir_requests.length; i2++) {
      fd.append("operation", JSON.stringify(mkdir_requests[i2]));
    }
    if (!options.shortcutTo) {
      for (let i2 = 0; i2 < files.length; i2++) {
        fd.append("fileinfo", JSON.stringify({
          name: files[i2].name,
          type: files[i2].type,
          size: files[i2].size
        }));
      }
    }
    for (let i2 = 0; i2 < files.length; i2++) {
      fd.append("operation", JSON.stringify({
        op: options.shortcutTo ? "shortcut" : "write",
        dedupe_name: options.dedupeName ?? true,
        overwrite: options.overwrite ?? false,
        create_missing_ancestors: options.createMissingAncestors || options.createMissingParents,
        operation_id,
        path: files[i2].puter_path_param && path_default.dirname(files[i2].puter_path_param ?? "") || files[i2].filepath && path_default.join(dirPath, path_default.dirname(files[i2].filepath)) || "",
        name: path_default.basename(files[i2].filepath),
        item_upload_id: i2,
        shortcut_to: options.shortcutTo,
        shortcut_to_uid: options.shortcutTo,
        app_uid: options.appUID
      }));
    }
    if (!options.shortcutTo) {
      for (let i2 = 0; i2 < files.length; i2++) {
        fd.append("file", files[i2] ?? "");
      }
    }
    const progress_handler = (msg) => {
      if (msg.operation_id === operation_id) {
        bytes_uploaded_to_cloud += msg.loaded_diff;
      }
    };
    this.socket.on("upload.progress", progress_handler);
    let previous_chunk_uploaded = null;
    xhr.open("post", `${this.APIOrigin}/batch`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${this.authToken}`);
    xhr.upload.addEventListener("progress", function(e2) {
      let chunk_uploaded;
      if (previous_chunk_uploaded === null) {
        chunk_uploaded = e2.loaded;
        previous_chunk_uploaded = 0;
      } else {
        chunk_uploaded = e2.loaded - previous_chunk_uploaded;
      }
      previous_chunk_uploaded += chunk_uploaded;
      bytes_uploaded_to_server += chunk_uploaded;
      let op_progress = ((bytes_uploaded_to_cloud + bytes_uploaded_to_server) / total_size * 100).toFixed(2);
      op_progress = op_progress > 100 ? 100 : op_progress;
      if (options.progress && typeof options.progress === "function") {
        options.progress(operation_id, op_progress);
      }
    });
    let cloud_progress_check_interval = setInterval(function() {
      let op_progress = ((bytes_uploaded_to_cloud + bytes_uploaded_to_server) / total_size * 100).toFixed(2);
      op_progress = op_progress > 100 ? 100 : op_progress;
      if (options.progress && typeof options.progress === "function") {
        options.progress(operation_id, op_progress);
      }
    }, 100);
    xhr.onabort = () => {
      clearInterval(cloud_progress_check_interval);
      this.socket.off("upload.progress", progress_handler);
      if (options.abort && typeof options.abort === "function") {
        options.abort(operation_id);
      }
    };
    xhr.onreadystatechange = async (e2) => {
      if (xhr.readyState === 4) {
        const resp = await parseResponse(xhr);
        if (xhr.status >= 400 && xhr.status < 600 || options.strict && xhr.status === 218) {
          clearInterval(cloud_progress_check_interval);
          this.socket.off("upload.progress", progress_handler);
          if (options.strict && xhr.status === 218) {
            let failed_operation;
            for (let i2 = 0; i2 < resp.results?.length; i2++) {
              if (resp.results[i2].status !== 200) {
                failed_operation = resp.results[i2];
                break;
              }
            }
            return error(failed_operation);
          }
          return error(resp);
        } else {
          if (!resp || !resp.results || resp.results.length === 0) {
            if (puter.debugMode) {
              console.log("no results");
            }
          }
          let items2 = resp.results;
          items2 = items2.length === 1 ? items2[0] : items2;
          if (options.success && typeof options.success === "function") {
            options.success(items2);
          }
          clearInterval(cloud_progress_check_interval);
          this.socket.off("upload.progress", progress_handler);
          return resolve(items2);
        }
      }
    };
    if (options.start && typeof options.start === "function") {
      options.start();
    }
    xhr.send(fd);
  });
};
var upload_default = upload;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/write.js
var write = async function(targetPath, data, options = {}) {
  if (!targetPath) {
    throw new Error({ code: "NO_TARGET_PATH", message: "No target path provided." });
  }
  if (targetPath instanceof File && data === void 0) {
    data = targetPath;
    targetPath = data.name;
  }
  options.strict = true;
  options.overwrite = options.overwrite ?? true;
  if (options.overwrite && options.dedupeName === void 0) {
    options.dedupeName = false;
  }
  targetPath = getAbsolutePathForApp_default(targetPath);
  const filename = path_default.basename(targetPath);
  const parent = path_default.dirname(targetPath);
  if (typeof data === "string") {
    data = new File([data ?? ""], filename ?? "Untitled.txt", { type: "text/plain" });
  } else if (data instanceof Blob) {
    data = new File([data ?? ""], filename ?? "Untitled", { type: data.type });
  } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    data = new File([data], filename ?? "Untitled", { type: "application/octet-stream" });
  }
  if (!data) {
    data = new File([data ?? ""], filename);
  }
  if (!(data instanceof File)) {
    throw new Error({ code: "field_invalid", message: "write() data parameter is an invalid type" });
  }
  return this.upload(data, parent, options);
};
var write_default = write;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/index.js
var import_putility = __toESM(require_putility(), 1);

// node_modules/@heyputer/puter.js/src/modules/FSItem.js
var FSItem = class {
  constructor(options) {
    this.readURL = options.readURL ?? options.read_url;
    this.writeURL = options.writeURL ?? options.write_url;
    this.metadataURL = options.metadataURL ?? options.metadata_url;
    this.name = options.name ?? options.fsentry_name;
    this.uid = options.uid ?? options.uuid ?? options.fsentry_uid ?? options.fsentry_id ?? options.fsentry_uuid ?? options.id;
    this.id = this.uid;
    this.uuid = this.uid;
    this.path = options.path ?? options.fsentry_path;
    this.size = options.size ?? options.fsentry_size;
    this.accessed = options.accessed ?? options.fsentry_accessed;
    this.modified = options.modified ?? options.fsentry_modified;
    this.created = options.created ?? options.fsentry_created;
    this.isDirectory = options.isDirectory || options.is_dir || options.fsentry_is_dir ? true : false;
    const internalProperties = {};
    Object.defineProperty(this, "_internalProperties", {
      enumerable: false,
      value: internalProperties
    });
    internalProperties.signature = options.signature ?? (() => {
      const url = new URL(this.writeURL ?? this.readURL);
      return url.searchParams.get("signature");
    })();
    internalProperties.expires = options.expires ?? (() => {
      const url = new URL(this.writeURL ?? this.readURL);
      return url.searchParams.get("expires");
    })();
    Object.defineProperty(internalProperties, "file_signature", {
      get: () => ({
        read_url: this.readURL,
        write_url: this.writeURL,
        metadata_url: this.metadataURL,
        fsentry_accessed: this.accessed,
        fsentry_modified: this.modified,
        fsentry_created: this.created,
        fsentry_is_dir: this.isDirectory,
        fsentry_size: this.size,
        fsentry_name: this.name,
        path: this.path,
        uid: this.uid
        // /sign outputs another property called "type", but we don't
        // have that information here, so it's omitted.
      })
    });
  }
  write = async function(data) {
    return puter.fs.write(
      this.path,
      new File([data], this.name),
      {
        overwrite: true,
        dedupeName: false
      }
    );
  };
  // Watches for changes to the item, and calls the callback function
  // with the new data when a change is detected.
  watch = function(callback) {
  };
  open = function(callback) {
  };
  // Set wallpaper
  setAsWallpaper = function(options, callback) {
  };
  rename = function(new_name) {
    return puter.fs.rename(this.uid, new_name);
  };
  move = function(dest_path, overwrite = false, new_name) {
    return puter.fs.move(this.path, dest_path, overwrite, new_name);
  };
  copy = function(destination_directory, auto_rename = false, overwrite = false) {
    return puter.fs.copy(this.path, destination_directory, auto_rename, overwrite);
  };
  delete = function() {
    return puter.fs.delete(this.path);
  };
  versions = async function() {
  };
  trash = function() {
  };
  mkdir = async function(name, auto_rename = false) {
    if (!this.isDirectory) {
      throw new Error("mkdir() can only be called on a directory");
    }
    return puter.fs.mkdir(path_default.join(this.path, name));
  };
  metadata = async function() {
  };
  readdir = async function() {
    if (!this.isDirectory) {
      throw new Error("readdir() can only be called on a directory");
    }
    return puter.fs.readdir(this.path);
  };
  read = async function() {
    return puter.fs.read(this.path);
  };
};
var FSItem_default = FSItem;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/deleteFSEntry.js
var deleteFSEntry = async function(...args) {
  let options;
  if (typeof args[0] === "object" && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      paths: args[0],
      recursive: args[1]?.recursive ?? true,
      descendantsOnly: args[1]?.descendantsOnly ?? false
    };
  }
  let paths = options.paths;
  if (typeof paths === "string") {
    paths = [paths];
  }
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    const xhr = initXhr("/delete", this.APIOrigin, this.authToken);
    setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
    paths = paths.map((path2) => {
      return getAbsolutePathForApp_default(path2);
    });
    xhr.send(JSON.stringify({
      paths,
      descendants_only: (options.descendants_only || options.descendantsOnly) ?? false,
      recursive: options.recursive ?? true
    }));
  });
};
var deleteFSEntry_default = deleteFSEntry;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/operations/getReadUrl.js
var getReadURL = async function(path2, expiresIn = "24h") {
  return new Promise(async (resolve, reject) => {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        reject("Authentication failed.");
      }
    }
    try {
      const { uid, is_dir } = await stat_default.call(this, path2);
      if (is_dir) {
        reject("Cannot create readUrl for directory");
        return;
      }
      const xhr = initXhr("/auth/create-access-token", this.APIOrigin, this.authToken);
      setupXhrEventHandlers(xhr, () => {
      }, () => {
      }, ({ token }) => {
        resolve(`${this.APIOrigin}/token-read?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`);
      }, reject);
      xhr.send(JSON.stringify({
        expiresIn,
        permissions: [
          `fs:${uid}:read`
        ]
      }));
    } catch (e2) {
      reject(e2);
    }
  });
};
var getReadUrl_default = getReadURL;

// node_modules/@heyputer/puter.js/src/modules/FileSystem/index.js
var LAST_VALID_TS = "last_valid_ts";
var PuterJSFileSystemModule = class extends import_putility.AdvancedBase {
  space = space_default;
  mkdir = mkdir_default;
  copy = copy_default;
  rename = rename_default;
  upload = upload_default;
  read = read_default;
  // Why is this called deleteFSEntry instead of just delete? because delete is
  // a reserved keyword in javascript.
  delete = deleteFSEntry_default;
  move = move_default;
  write = write_default;
  sign = sign_default;
  symlink = symlink_default;
  getReadURL = getReadUrl_default;
  readdir = readdir_default;
  stat = stat_default;
  FSItem = FSItem_default;
  static NARI_METHODS = {
    // stat: {
    //     positional: ['path'],
    //     firstarg_options: true,
    //     async fn (parameters) {
    //         const svc_fs = await this.context.services.aget('filesystem');
    //         return svc_fs.filesystem.stat(parameters);
    //     }
    // },
  };
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   * and connects to the socket.
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    super();
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
    this.context = context;
    this.cacheUpdateTimer = null;
    this.initializeSocket();
    const api_info = {};
    Object.defineProperty(api_info, "authToken", {
      get: () => this.authToken
    });
    Object.defineProperty(api_info, "APIOrigin", {
      get: () => this.APIOrigin
    });
  }
  /**
   * Initializes the socket connection to the server using the current API origin.
   * If a socket connection already exists, it disconnects it before creating a new one.
   * Sets up various event listeners on the socket to handle different socket events like
   * connect, disconnect, reconnect, reconnect_attempt, reconnect_error, reconnect_failed, and error.
   *
   * @memberof FileSystem
   * @returns {void}
   */
  initializeSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.socket = _t(this.APIOrigin, {
      auth: {
        auth_token: this.authToken
      },
      autoUnref: this.context.env === "nodejs"
    });
    this.bindSocketEvents();
  }
  bindSocketEvents() {
    this.socket.on("item.renamed", (item) => {
      puter._cache.flushall();
      console.log("Flushed cache for item.renamed");
    });
    this.socket.on("item.removed", (item) => {
      puter._cache.flushall();
      console.log("Flushed cache for item.removed");
    });
    this.socket.on("item.added", (item) => {
      puter._cache.del(`readdir:${path_default.dirname(item.path)}`);
      console.log(`deleted cache for readdir:${path_default.dirname(item.path)}`);
      puter._cache.del(`item:${path_default.dirname(item.path)}`);
      console.log(`deleted cache for item:${path_default.dirname(item.path)}`);
    });
    this.socket.on("item.updated", (item) => {
      puter._cache.flushall();
      console.log("Flushed cache for item.updated");
    });
    this.socket.on("item.moved", (item) => {
      puter._cache.flushall();
      console.log("Flushed cache for item.moved");
    });
    this.socket.on("connect", () => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Connected", this.socket.id);
      }
    });
    this.socket.on("disconnect", () => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Disconnected");
      }
    });
    this.socket.on("reconnect", (attempt) => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnected", this.socket.id);
      }
    });
    this.socket.on("reconnect_attempt", (attempt) => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnection Attemps", attempt);
      }
    });
    this.socket.on("reconnect_error", (error) => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnection Error", error);
      }
    });
    this.socket.on("reconnect_failed", () => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnection Failed");
      }
    });
    this.socket.on("error", (error) => {
      if (puter.debugMode) {
        console.error("FileSystem Socket Error:", error);
      }
    });
  }
  /**
   * Sets a new authentication token and resets the socket connection with the updated token.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [FileSystem]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
    if (this.context.env === "gui") {
      this.checkCacheAndPurge();
      this.startCacheUpdateTimer();
    }
    this.initializeSocket();
  }
  /**
   * Sets the API origin and resets the socket connection with the updated API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [Apps]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
    this.initializeSocket();
  }
  /**
   * The cache-related actions after local and remote updates.
   *
   * @memberof PuterJSFileSystemModule
   * @returns {void}
   */
  invalidateCache() {
    localStorage.setItem(LAST_VALID_TS, "0");
    puter._cache.flushall();
  }
  /**
   * Calls the cache API to get the last change timestamp from the server.
   *
   * @memberof PuterJSFileSystemModule
   * @returns {Promise<number>} The timestamp from the server
   */
  async getCacheTimestamp() {
    return new Promise((resolve, reject) => {
      const xhr = initXhr("/cache/last-change-timestamp", this.APIOrigin, this.authToken, "get", "application/json");
      setupXhrEventHandlers(xhr, void 0, void 0, async (result) => {
        try {
          const response = typeof result === "string" ? JSON.parse(result) : result;
          resolve(response.timestamp || Date.now());
        } catch (e2) {
          reject(new Error("Failed to parse response"));
        }
      }, reject);
      xhr.send();
    });
  }
  /**
   * Checks cache timestamp and purges cache if needed.
   * Only runs in GUI environment.
   *
   * @memberof PuterJSFileSystemModule
   * @returns {void}
   */
  async checkCacheAndPurge() {
    try {
      const serverTimestamp = await this.getCacheTimestamp();
      const localValidTs = parseInt(localStorage.getItem(LAST_VALID_TS)) || 0;
      if (serverTimestamp - localValidTs > 2e3) {
        console.log("Cache is not up to date, purging cache");
        puter._cache.flushall();
        localStorage.setItem(LAST_VALID_TS, "0");
      }
    } catch (error) {
      console.error("Error checking cache timestamp:", error);
    }
  }
  /**
   * Starts the background task to update LAST_VALID_TS every 1 second.
   * Only runs in GUI environment.
   *
   * @memberof PuterJSFileSystemModule
   * @returns {void}
   */
  startCacheUpdateTimer() {
    if (this.context.env !== "gui") {
      return;
    }
    this.cacheUpdateTimer = setInterval(() => {
      localStorage.setItem(LAST_VALID_TS, Date.now().toString());
    }, 1e3);
  }
  /**
   * Stops the background cache update timer.
   *
   * @memberof PuterJSFileSystemModule
   * @returns {void}
   */
  stopCacheUpdateTimer() {
    if (this.cacheUpdateTimer) {
      clearInterval(this.cacheUpdateTimer);
      this.cacheUpdateTimer = null;
    }
  }
};

// node_modules/@heyputer/puter.js/src/modules/Hosting.js
var Hosting = class {
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
  }
  /**
   * Sets a new authentication token.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [Router]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  /**
   * Sets the API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [Apps]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  // todo document the `Subdomain` object.
  list = async (...args) => {
    return (await make_driver_method([], "puter-subdomains", void 0, "select")(...args)).filter((e2) => !e2.subdomain.startsWith("workers.puter."));
  };
  create = async (...args) => {
    let options = {};
    if (typeof args[0] === "string" && args.length === 1) {
      if (args[0].match(/^[a-z0-9]+\.puter\.(site|com)$/)) {
        args[0] = args[0].split(".")[0];
      }
      options = { object: { subdomain: args[0] } };
    } else if (Array.isArray(args) && args.length === 2 && typeof args[0] === "string") {
      if (args[0].match(/^[a-z0-9]+\.puter\.(site|com)$/)) {
        args[0] = args[0].split(".")[0];
      }
      if (args[1]) {
        args[1] = getAbsolutePathForApp_default(args[1]);
      }
      options = { object: { subdomain: args[0], root_dir: args[1] } };
    } else if (typeof args[0] === "object") {
      options = { object: args[0] };
    }
    return await make_driver_method(["object"], "puter-subdomains", void 0, "create").call(this, options);
  };
  update = async (...args) => {
    let options = {};
    if (Array.isArray(args) && typeof args[0] === "string") {
      if (args[0].match(/^[a-z0-9]+\.puter\.(site|com)$/)) {
        args[0] = args[0].split(".")[0];
      }
      if (args[1]) {
        args[1] = getAbsolutePathForApp_default(args[1]);
      }
      options = { id: { subdomain: args[0] }, object: { root_dir: args[1] ?? null } };
    }
    return await make_driver_method(["object"], "puter-subdomains", void 0, "update").call(this, options);
  };
  get = async (...args) => {
    let options = {};
    if (Array.isArray(args) && typeof args[0] === "string") {
      if (args[0].match(/^[a-z0-9]+\.puter\.(site|com)$/)) {
        args[0] = args[0].split(".")[0];
      }
      options = { id: { subdomain: args[0] } };
    }
    return make_driver_method(["uid"], "puter-subdomains", void 0, "read").call(this, options);
  };
  delete = async (...args) => {
    let options = {};
    if (Array.isArray(args) && typeof args[0] === "string") {
      if (args[0].match(/^[a-z0-9]+\.puter\.(site|com)$/)) {
        args[0] = args[0].split(".")[0];
      }
      options = { id: { subdomain: args[0] } };
    }
    return make_driver_method(["uid"], "puter-subdomains", void 0, "delete").call(this, options);
  };
};
var Hosting_default = Hosting;

// node_modules/@heyputer/puter.js/src/modules/KV.js
var import_promise = __toESM(require_promise(), 1);
var gui_cache_keys = [
  "has_set_default_app_user_permissions",
  "window_sidebar_width",
  "sidebar_items",
  "menubar_style",
  "user_preferences.auto_arrange_desktop",
  "user_preferences.show_hidden_files",
  "user_preferences.language",
  "user_preferences.clock_visible",
  "toolbar_auto_hide_enabled",
  "has_seen_welcome_window",
  "desktop_item_positions",
  "desktop_icons_hidden",
  "taskbar_position",
  "has_seen_toolbar_animation"
];
var KV = class {
  MAX_KEY_SIZE = 1024;
  MAX_VALUE_SIZE = 399 * 1024;
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
    this.gui_cached = new import_promise.TeePromise();
    this.gui_cache_init = new import_promise.TeePromise();
    (async () => {
      await this.gui_cache_init;
      this.gui_cache_init = null;
      const resp = await fetch(`${this.APIOrigin}/drivers/call`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;actually=json"
        },
        body: JSON.stringify({
          interface: "puter-kvstore",
          method: "get",
          args: {
            key: gui_cache_keys
          },
          auth_token: this.authToken
        })
      });
      const arr_values = await resp.json();
      if (!Array.isArray(arr_values?.result)) {
        this.gui_cached.resolve({});
        setTimeout(() => {
          this.gui_cached = null;
        }, 4e3);
        return;
      }
      const obj = {};
      for (let i2 = 0; i2 < gui_cache_keys.length; i2++) {
        obj[gui_cache_keys[i2]] = arr_values.result[i2];
      }
      this.gui_cached.resolve(obj);
      setTimeout(() => {
        this.gui_cached = null;
      }, 4e3);
    })();
  }
  /**
   * Sets a new authentication token.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [KV]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  /**
   * Sets the API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [KV]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  /**
   * @typedef {function(key: string, value: any, expireAt?: number): Promise<boolean>} SetFunction
   * Resolves to 'true' on success, or rejects with an error on failure.
   * @param {string} key - Cannot be undefined or null. Cannot be larger than 1KB.
   * @param {any} value - Cannot be larger than 399KB.
   * @param {number} [expireAt] - Optional expiration time for the key. Note that clients with a clock that is not in sync with the server may experience issues with this method.
   * @memberof KV
   */
  /** @type {SetFunction} */
  set = make_driver_method(["key", "value", "expireAt"], "puter-kvstore", void 0, "set", {
    /**
     *
     * @param {object} args
     * @param {string} args.key
     * @param {any} args.value
     * @param {number} [args.expireAt]
     * @memberof [KV]
     * @returns
     */
    preprocess: (args) => {
      if (args.key === void 0 || args.key === null) {
        throw { message: "Key cannot be undefined", code: "key_undefined" };
      }
      if (args.key.length > this.MAX_KEY_SIZE) {
        throw { message: `Key size cannot be larger than ${this.MAX_KEY_SIZE}`, code: "key_too_large" };
      }
      if (args.value && args.value.length > this.MAX_VALUE_SIZE) {
        throw { message: `Value size cannot be larger than ${this.MAX_VALUE_SIZE}`, code: "value_too_large" };
      }
      return args;
    }
  });
  /**
   * Resolves to the value if the key exists, or `undefined` if the key does not exist. Rejects with an error on failure.
   */
  async get(...args) {
    if (typeof args[0] === "string" && gui_cache_keys.includes(args[0]) && this.gui_cached !== null) {
      this.gui_cache_init && this.gui_cache_init.resolve();
      const cache2 = await this.gui_cached;
      return cache2[args[0]];
    }
    return await this.get_(...args);
  }
  get_ = make_driver_method(["key"], "puter-kvstore", void 0, "get", {
    preprocess: (args) => {
      if (args.key.length > this.MAX_KEY_SIZE) {
        throw { message: `Key size cannot be larger than ${this.MAX_KEY_SIZE}`, code: "key_too_large" };
      }
      return args;
    },
    transform: (res) => {
      return res;
    }
  });
  incr = async (...args) => {
    let options = {};
    if (!args || args.length === 0) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    options.key = args[0];
    options.pathAndAmountMap = !args[1] ? { "": 1 } : typeof args[1] === "number" ? { "": args[1] } : args[1];
    if (options.key.length > this.MAX_KEY_SIZE) {
      throw { message: `Key size cannot be larger than ${this.MAX_KEY_SIZE}`, code: "key_too_large" };
    }
    return make_driver_method(["key"], "puter-kvstore", void 0, "incr").call(this, options);
  };
  decr = async (...args) => {
    let options = {};
    if (!args || args.length === 0) {
      throw { message: "Arguments are required", code: "arguments_required" };
    }
    options.key = args[0];
    options.pathAndAmountMap = !args[1] ? { "": 1 } : typeof args[1] === "number" ? { "": args[1] } : args[1];
    if (options.key.length > this.MAX_KEY_SIZE) {
      throw { message: `Key size cannot be larger than ${this.MAX_KEY_SIZE}`, code: "key_too_large" };
    }
    return make_driver_method(["key"], "puter-kvstore", void 0, "decr").call(this, options);
  };
  /**
   * Set a time to live (in seconds) on a key. After the time to live has expired, the key will be deleted.
   * Prefer this over expireAt if you want timestamp to be set by the server, to avoid issues with clock drift.
   * @param  {string} key - The key to set the expiration on.
   * @param  {number} ttl - The ttl
   * @memberof [KV]
   * @returns
   */
  expire = async (key, ttl) => {
    let options = {};
    options.key = key;
    options.ttl = ttl;
    if (options.key.length > this.MAX_KEY_SIZE) {
      throw { message: `Key size cannot be larger than ${this.MAX_KEY_SIZE}`, code: "key_too_large" };
    }
    return make_driver_method(["key", "ttl"], "puter-kvstore", void 0, "expire").call(this, options);
  };
  /**
   *
   * Set the expiration for a key as a UNIX timestamp (in seconds). After the time has passed, the key will be deleted.
   * Note that clients with a clock that is not in sync with the server may experience issues with this method.
   * @param  {string} key - The key to set the expiration on.
   * @param  {number} timestamp - The timestamp (in seconds since epoch) when the key will expire.
   * @memberof [KV]
   * @returns
   */
  expireAt = async (key, timestamp) => {
    let options = {};
    options.key = key;
    options.timestamp = timestamp;
    if (options.key.length > this.MAX_KEY_SIZE) {
      throw { message: `Key size cannot be larger than ${this.MAX_KEY_SIZE}`, code: "key_too_large" };
    }
    return make_driver_method(["key", "timestamp"], "puter-kvstore", void 0, "expireAt").call(this, options);
  };
  // resolves to 'true' on success, or rejects with an error on failure
  // will still resolve to 'true' if the key does not exist
  del = make_driver_method(["key"], "puter-kvstore", void 0, "del", {
    preprocess: (args) => {
      if (args.key.length > this.MAX_KEY_SIZE) {
        throw { message: `Key size cannot be larger than ${this.MAX_KEY_SIZE}`, code: "key_too_large" };
      }
      return args;
    }
  });
  list = async (...args) => {
    let options = {};
    let pattern;
    let returnValues = false;
    if (args && args.length === 1 && args[0] === true || args && args.length === 2 && args[1] === true) {
      options = {};
      returnValues = true;
    } else {
      options = { as: "keys" };
    }
    if (args && args.length === 1 && typeof args[0] === "string" || args && args.length === 2 && typeof args[0] === "string" && args[1] === true) {
      pattern = args[0];
    }
    return make_driver_method([], "puter-kvstore", void 0, "list", {
      transform: (res) => {
        if (pattern) {
          if (!returnValues) {
            let keys = res.filter((key) => {
              return globMatch(pattern, key);
            });
            return keys;
          } else {
            let keys = res.filter((key_value_pair) => {
              return globMatch(pattern, key_value_pair.key);
            });
            return keys;
          }
        }
        return res;
      }
    }).call(this, options);
  };
  // resolve to 'true' on success, or rejects with an error on failure
  // will still resolve to 'true' if there are no keys
  flush = make_driver_method([], "puter-kvstore", void 0, "flush");
  // clear is an alias for flush
  clear = this.flush;
};
function globMatch(pattern, str) {
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let regexPattern = escapeRegExp(pattern).replace(/\\\*/g, ".*").replace(/\\\?/g, ".").replace(/\\\[/g, "[").replace(/\\\]/g, "]").replace(/\\\^/g, "^");
  let re = new RegExp(`^${regexPattern}$`);
  return re.test(str);
}
var KV_default = KV;

// node_modules/@heyputer/puter.js/src/lib/EventListener.js
var EventListener = class {
  // Array of all supported event names.
  #eventNames;
  // Map of eventName -> array of listeners
  #eventListeners;
  constructor(eventNames) {
    this.#eventNames = eventNames;
    this.#eventListeners = (() => {
      const map = /* @__PURE__ */ new Map();
      for (let eventName of this.#eventNames) {
        map[eventName] = [];
      }
      return map;
    })();
  }
  emit(eventName, data) {
    if (!this.#eventNames.includes(eventName)) {
      console.error(`Event name '${eventName}' not supported`);
      return;
    }
    this.#eventListeners[eventName].forEach((listener) => {
      listener(data);
    });
  }
  on(eventName, callback) {
    if (!this.#eventNames.includes(eventName)) {
      console.error(`Event name '${eventName}' not supported`);
      return;
    }
    this.#eventListeners[eventName].push(callback);
    return this;
  }
  off(eventName, callback) {
    if (!this.#eventNames.includes(eventName)) {
      console.error(`Event name '${eventName}' not supported`);
      return;
    }
    const listeners = this.#eventListeners[eventName];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    return this;
  }
};

// node_modules/@heyputer/puter.js/src/modules/networking/parsers.js
var CONNECT = 1;
var DATA = 2;
var CONTINUE = 3;
var CLOSE = 4;
var INFO = 5;
var TCP = 1;
var textde = new TextDecoder();
var texten = new TextEncoder();
var errors = {
  1: "Reason unspecified or unknown. Returning a more specific reason should be preferred.",
  3: "Unexpected stream closure due to a network error.",
  65: "Stream creation failed due to invalid information. This could be sent if the destination was a reserved address or the port is invalid.",
  66: "Stream creation failed due to an unreachable destination host. This could be sent if the destination is an domain which does not resolve to anything.",
  67: "Stream creation timed out due to the destination server not responding.",
  68: "Stream creation failed due to the destination server refusing the connection.",
  71: "TCP data transfer timed out.",
  72: "Stream destination address/domain is intentionally blocked by the proxy server.",
  73: "Connection throttled by the server."
};
function parseIncomingPacket(data) {
  const view = new DataView(data.buffer, data.byteOffset);
  const packetType = view.getUint8(0);
  const streamID = view.getUint32(1, true);
  switch (packetType) {
    // Packet payload starts at Offset 5
    case CONNECT:
      const streamType = view.getUint8(5);
      const port = view.getUint16(6, true);
      const hostname = textde.decode(data.subarray(8, data.length));
      return { packetType, streamID, streamType, port, hostname };
      break;
    case DATA:
      const payload = data.subarray(5, data.length);
      return { packetType, streamID, payload };
      break;
    case CONTINUE:
      const remainingBuffer = view.getUint32(5, true);
      return { packetType, streamID, remainingBuffer };
      break;
    case CLOSE:
      const reason = view.getUint8(5);
      return { packetType, streamID, reason };
      break;
    case INFO:
      const infoObj = {};
      infoObj["version_major"] = view.getUint8(5);
      infoObj["version_minor"] = view.getUint8(6);
      let ptr = 7;
      while (ptr < data.length) {
        const extType = view.getUint8(ptr);
        const extLength = view.getUint32(ptr + 1, true);
        const payload2 = data.subarray(ptr + 5, ptr + 5 + extLength);
        infoObj[extType] = payload2;
        ptr += 5 + extLength;
      }
      return { packetType, streamID, infoObj };
      break;
  }
}
function createWispPacket(instructions) {
  let size = 5;
  switch (instructions.packetType) {
    // Pass 1: determine size of packet
    case CONNECT:
      instructions.hostEncoded = texten.encode(instructions.hostname);
      size += 3 + instructions.hostEncoded.length;
      break;
    case DATA:
      size += instructions.payload.byteLength;
      break;
    case CONTINUE:
      size += 4;
      break;
    case CLOSE:
      size += 1;
      break;
    case INFO:
      size += 2;
      if (instructions.password) {
        size += 6;
      }
      if (instructions.puterAuth) {
        instructions.passwordEncoded = texten.encode(instructions.puterAuth);
        size += 8 + instructions.passwordEncoded.length;
      }
      break;
    default:
      throw new Error("Not supported");
  }
  let data = new Uint8Array(size);
  const view = new DataView(data.buffer);
  view.setUint8(0, instructions.packetType);
  view.setUint32(1, instructions.streamID, true);
  switch (instructions.packetType) {
    // Pass 2: fill out packet
    case CONNECT:
      view.setUint8(5, instructions.streamType);
      view.setUint16(6, instructions.port, true);
      data.set(instructions.hostEncoded, 8);
      break;
    case DATA:
      data.set(instructions.payload, 5);
      break;
    case CONTINUE:
      view.setUint32(5, instructions.remainingBuffer, true);
      break;
    case CLOSE:
      view.setUint8(5, instructions.reason);
      break;
    case INFO:
      view.setUint8(5, 2);
      view.setUint8(6, 0);
      if (instructions.password) {
        view.setUint8(7, 2);
        view.setUint32(8, 1, true);
        view.setUint8(12, 0);
      }
      if (instructions.puterAuth) {
        view.setUint8(7, 2);
        view.setUint32(8, 5 + instructions.passwordEncoded.length, true);
        view.setUint8(12, 0);
        view.setUint16(13, instructions.passwordEncoded.length, true);
        data.set(instructions.passwordEncoded, 15);
      }
  }
  return data;
}

// node_modules/@heyputer/puter.js/src/modules/networking/PWispHandler.js
var PWispHandler = class {
  _ws;
  _nextStreamID = 1;
  _bufferMax;
  onReady = void 0;
  streamMap = /* @__PURE__ */ new Map();
  constructor(wispURL, puterAuth) {
    const setup = () => {
      this._ws = new WebSocket(wispURL);
      this._ws.binaryType = "arraybuffer";
      this._ws.onmessage = (event) => {
        const parsed = parseIncomingPacket(new Uint8Array(event.data));
        switch (parsed.packetType) {
          case DATA:
            this.streamMap.get(parsed.streamID).dataCallBack(parsed.payload.slice(0));
            break;
          case CONTINUE:
            if (parsed.streamID === 0) {
              this._bufferMax = parsed.remainingBuffer;
              this._ws.onclose = () => {
                setTimeout(setup(), 1e3);
              };
              if (this.onReady) {
                this.onReady();
              }
              return;
            }
            this.streamMap.get(parsed.streamID).buffer = parsed.remainingBuffer;
            this._continue();
            break;
          case CLOSE:
            if (parsed.streamID !== 0) {
              this.streamMap.get(parsed.streamID).closeCallBack(parsed.reason);
            }
            break;
          case INFO:
            puterAuth && this._ws.send(createWispPacket({
              packetType: INFO,
              streamID: 0,
              puterAuth
            }));
            break;
        }
      };
    };
    setup();
  }
  _continue(streamID) {
    const queue = this.streamMap.get(streamID).queue;
    for (let i2 = 0; i2 < queue.length; i2++) {
      this.write(streamID, queue.shift());
    }
  }
  register(host, port, callbacks) {
    const streamID = this._nextStreamID++;
    this.streamMap.set(streamID, { queue: [], streamID, buffer: this._bufferMax, dataCallBack: callbacks.dataCallBack, closeCallBack: callbacks.closeCallBack });
    this._ws.send(createWispPacket({
      packetType: CONNECT,
      streamType: TCP,
      streamID,
      hostname: host,
      port
    }));
    return streamID;
  }
  write(streamID, data) {
    const streamData = this.streamMap.get(streamID);
    if (streamData.buffer > 0) {
      streamData.buffer--;
      this._ws.send(createWispPacket({
        packetType: DATA,
        streamID,
        payload: data
      }));
    } else {
      streamData.queue.push(data);
    }
  }
  close(streamID) {
    this._ws.send(createWispPacket({
      packetType: CLOSE,
      streamID,
      reason: 2
    }));
  }
};

// node_modules/@heyputer/puter.js/src/modules/networking/PSocket.js
var texten2 = new TextEncoder();
var requireAuth = false;
var wispInfo = {
  server: "wss://puter.cafe/",
  // Unused currently
  handler: void 0
};
var PSocket = class extends EventListener {
  _events = /* @__PURE__ */ new Map();
  _streamID;
  constructor(host, port) {
    super(["data", "drain", "open", "error", "close", "tlsdata", "tlsopen", "tlsclose"]);
    (async () => {
      if (!puter.authToken && puter.env === "web" && requireAuth) {
        try {
          await puter.ui.authenticateWithPuter();
        } catch (e2) {
          throw e2;
        }
      }
      if (!wispInfo.handler) {
        const { token: wispToken, server: wispServer } = await (await fetch(`${puter.APIOrigin}/wisp/relay-token/create`, {
          method: "POST",
          headers: {
            Authorization: puter.authToken ? `Bearer ${puter.authToken}` : "",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        })).json();
        wispInfo.handler = new PWispHandler(wispServer, wispToken);
        await new Promise((res, req) => {
          wispInfo.handler.onReady = res;
        });
      }
      const callbacks = {
        dataCallBack: (data) => {
          this.emit("data", data);
        },
        closeCallBack: (reason) => {
          if (reason !== 2) {
            this.emit("error", new Error(errors[reason]));
            this.emit("close", true);
            return;
          }
          this.emit("close", false);
        }
      };
      this._streamID = wispInfo.handler.register(host, port, callbacks);
      setTimeout(() => {
        this.emit("open", void 0);
      }, 0);
    })();
  }
  addListener(...args) {
    this.on(...args);
  }
  write(data, callback) {
    if (data.buffer) {
      wispInfo.handler.write(this._streamID, data);
      if (callback) callback();
    } else if (data.resize) {
      data.write(this._streamID, new Uint8Array(data));
      if (callback) callback();
    } else if (typeof data === "string") {
      wispInfo.handler.write(this._streamID, texten2.encode(data));
      if (callback) callback();
    } else {
      throw new Error("Invalid data type (not TypedArray, ArrayBuffer or String!!)");
    }
  }
  close() {
    wispInfo.handler.close(this._streamID);
  }
};

// node_modules/@heyputer/puter.js/src/modules/networking/PTLS.js
var rustls = void 0;
var PTLSSocket = class extends PSocket {
  constructor(...args) {
    super(...args);
    super.on("open", (async () => {
      if (!rustls) {
        if (!globalThis.ReadableByteStreamController) {
          await import(
            /* webpackIgnore: true */
            "https://unpkg.com/web-streams-polyfill@3.0.2/dist/polyfill.js"
          );
        }
        rustls = await import(
          /* webpackIgnore: true */
          "https://puter-net.b-cdn.net/rustls.js"
        );
        await rustls.default("https://puter-net.b-cdn.net/rustls.wasm");
      }
      let cancelled = false;
      const readable = new ReadableStream({
        /**
         *
         * @param {ReadableStreamDefaultController} controller
         */
        start: (controller) => {
          super.on("data", (data) => {
            controller.enqueue(data.buffer);
          });
          super.on("close", () => {
            if (!cancelled) {
              controller.close();
            }
          });
        },
        pull: (controller) => {
        },
        cancel: () => {
          cancelled = true;
        }
      });
      const writable = new WritableStream({
        write: (chunk) => {
          super.write(chunk);
        },
        abort: () => {
          super.close();
        },
        close: () => {
          super.close();
        }
      });
      let read2, write2;
      try {
        const TLSConnnection = await rustls.connect_tls(readable, writable, args[0]);
        read2 = TLSConnnection.read;
        write2 = TLSConnnection.write;
      } catch (e2) {
        this.emit("error", new Error(`TLS Handshake failed: ${e2}`));
        return;
      }
      this.writer = write2.getWriter();
      let reader = read2.getReader();
      let done = false;
      this.emit("tlsopen", void 0);
      try {
        while (!done) {
          const { done: readerDone, value } = await reader.read();
          done = readerDone;
          if (!done) {
            this.emit("tlsdata", value);
          }
        }
        this.emit("tlsclose", false);
      } catch (e2) {
        this.emit("error", e2);
        this.emit("tlsclose", true);
      }
    }));
  }
  on(event, callback) {
    if (event === "data" || event === "open" || event === "close") {
      return super.on(`tls${event}`, callback);
    } else {
      return super.on(event, callback);
    }
  }
  write(data, callback) {
    if (data.buffer) {
      this.writer.write(data.slice(0).buffer).then(callback);
    } else if (data.resize) {
      this.writer.write(data).then(callback);
    } else if (typeof data === "string") {
      this.writer.write(data).then(callback);
    } else {
      throw new Error("Invalid data type (not TypedArray, ArrayBuffer or String!!)");
    }
  }
};

// node_modules/@heyputer/puter.js/src/modules/networking/requests.js
function mergeUint8Arrays2(...arrays) {
  const totalSize = arrays.reduce((acc, e2) => acc + e2.length, 0);
  const merged = new Uint8Array(totalSize);
  arrays.forEach((array, i2, arrays2) => {
    const offset = arrays2.slice(0, i2).reduce((acc, e2) => acc + e2.length, 0);
    merged.set(array, offset);
  });
  return merged;
}
function parseHTTPHead(head) {
  const lines = head.split("\r\n");
  const firstLine = lines.shift().split(" ");
  const status = Number(firstLine[1]);
  const statusText = firstLine.slice(2).join(" ") || "";
  const headersArray = [];
  for (const header of lines) {
    const splitHeaders = header.split(": ");
    const key = splitHeaders[0];
    const value = splitHeaders.slice(1).join(": ");
    headersArray.push([key, value]);
  }
  new Headers(headersArray);
  return { headers: new Headers(headersArray), statusText, status };
}
function pFetch(...args) {
  return new Promise(async (res, rej) => {
    try {
      const reqObj2 = new Request(...args);
      const parsedURL = new URL(reqObj2.url);
      let headers = new Headers(reqObj2.headers);
      let socket;
      if (parsedURL.protocol === "http:") {
        socket = new puter.net.Socket(
          parsedURL.hostname,
          parsedURL.port || 80
        );
      } else if (parsedURL.protocol === "https:") {
        socket = new puter.net.tls.TLSSocket(
          parsedURL.hostname,
          parsedURL.port || 443
        );
      } else {
        const errorMsg = `Failed to fetch. URL scheme "${parsedURL.protocol}" is not supported.`;
        if (globalThis.puter?.apiCallLogger?.isEnabled()) {
          globalThis.puter.apiCallLogger.logRequest({
            service: "network",
            operation: "pFetch",
            params: { url: reqObj2.url, method: reqObj2.method },
            error: { message: errorMsg }
          });
        }
        rej(errorMsg);
        return;
      }
      if (!headers.get("user-agent")) {
        headers.set("user-agent", navigator.userAgent);
      }
      let reqHead = `${reqObj2.method} ${parsedURL.pathname}${parsedURL.search} HTTP/1.1\r
Host: ${parsedURL.host}\r
Connection: close\r
`;
      for (const [key, value] of headers) {
        reqHead += `${key}: ${value}\r
`;
      }
      let requestBody;
      if (reqObj2.body) {
        requestBody = new Uint8Array(await reqObj2.arrayBuffer());
        if (!headers.has("content-length")) {
          headers.set("content-length", requestBody.length);
        } else if (headers.get("content-length") !== String(requestBody.length)) {
          return rej("Content-Length header does not match the body length. Please check your request.");
        }
        reqHead += `Content-Length: ${requestBody.length}\r
`;
      }
      reqHead += "\r\n";
      socket.on("open", async () => {
        socket.write(reqHead);
        if (requestBody) {
          socket.write(requestBody);
        }
      });
      const decoder = new TextDecoder();
      let responseHead = "";
      let dataOffset = -1;
      const fullDataParts = [];
      let responseReturned = false;
      let contentLength = -1;
      let ingestedContent = 0;
      let chunkedTransfer = false;
      let currentChunkLeft = -1;
      let buffer = new Uint8Array(0);
      const outStream = new ReadableStream({
        start(controller) {
          function parseIncomingChunk(data) {
            const tmp = new Uint8Array(buffer.length + data.length);
            tmp.set(buffer, 0);
            tmp.set(data, buffer.length);
            buffer = tmp;
            while (true) {
              if (currentChunkLeft > 0) {
                if (buffer.length >= currentChunkLeft + 2) {
                  const chunk = buffer.slice(0, currentChunkLeft);
                  controller.enqueue(chunk);
                  buffer = buffer.slice(currentChunkLeft + 2);
                  currentChunkLeft = 0;
                } else {
                  controller.enqueue(buffer);
                  currentChunkLeft -= buffer.length;
                  buffer = new Uint8Array(0);
                  break;
                }
              } else {
                let idx = -1;
                for (let i2 = 0; i2 + 1 < buffer.length; i2++) {
                  if (buffer[i2] === 13 && buffer[i2 + 1] === 10) {
                    idx = i2;
                    break;
                  }
                }
                if (idx < 0) {
                  break;
                }
                const sizeText = decoder.decode(buffer.slice(0, idx)).trim();
                currentChunkLeft = parseInt(sizeText, 16);
                if (isNaN(currentChunkLeft)) {
                  controller.error("Invalid chunk length from server");
                }
                buffer = buffer.slice(idx + 2);
                if (currentChunkLeft === 0) {
                  responseReturned = true;
                  controller.close();
                  return;
                }
              }
            }
          }
          socket.on("data", (data) => {
            if (dataOffset !== -1 && !chunkedTransfer) {
              controller.enqueue(data);
              ingestedContent += data.length;
            }
            if (dataOffset === -1) {
              fullDataParts.push(data);
              responseHead += decoder.decode(data, { stream: true });
            }
            if (chunkedTransfer) {
              parseIncomingChunk(data);
            }
            if (responseHead.indexOf("\r\n\r\n") !== -1) {
              dataOffset = responseHead.indexOf("\r\n\r\n");
              responseHead = responseHead.slice(0, dataOffset);
              const parsedHead = parseHTTPHead(responseHead);
              contentLength = Number(parsedHead.headers.get("content-length"));
              chunkedTransfer = parsedHead.headers.get("transfer-encoding") === "chunked";
              if (globalThis.puter?.apiCallLogger?.isEnabled()) {
                globalThis.puter.apiCallLogger.logRequest({
                  service: "network",
                  operation: "pFetch",
                  params: { url: reqObj2.url, method: reqObj2.method },
                  result: { status: parsedHead.status, statusText: parsedHead.statusText }
                });
              }
              res(new Response(outStream, parsedHead));
              const residualBody = mergeUint8Arrays2(...fullDataParts).slice(dataOffset + 4);
              if (!chunkedTransfer) {
                ingestedContent += residualBody.length;
                controller.enqueue(residualBody);
              } else {
                parseIncomingChunk(residualBody);
              }
            }
            if (contentLength !== -1 && ingestedContent === contentLength && !chunkedTransfer) {
              if (!responseReturned) {
                responseReturned = true;
                controller.close();
              }
            }
          });
          socket.on("close", () => {
            if (!responseReturned) {
              responseReturned = true;
              controller.close();
            }
          });
          socket.on("error", (reason) => {
            if (globalThis.puter?.apiCallLogger?.isEnabled()) {
              globalThis.puter.apiCallLogger.logRequest({
                service: "network",
                operation: "pFetch",
                params: { url: reqObj2.url, method: reqObj2.method },
                error: { message: `Socket errored with the following reason: ${reason}` }
              });
            }
            rej(`Socket errored with the following reason: ${reason}`);
          });
        }
      });
    } catch (e2) {
      if (globalThis.puter?.apiCallLogger?.isEnabled()) {
        globalThis.puter.apiCallLogger.logRequest({
          service: "network",
          operation: "pFetch",
          params: { url: reqObj.url, method: reqObj.method },
          error: { message: e2.message || e2.toString(), stack: e2.stack }
        });
      }
      rej(e2);
    }
  });
}

// node_modules/@heyputer/puter.js/src/modules/OS.js
var OS = class {
  /**
   * Creates a new instance with the given authentication token, API origin, and app ID,
   *
   * @class
   * @param {string} authToken - Token used to authenticate the user.
   * @param {string} APIOrigin - Origin of the API server. Used to build the API endpoint URLs.
   * @param {string} appID - ID of the app to use.
   */
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
    this.appID = context.appID;
  }
  /**
   * Sets a new authentication token.
   *
   * @param {string} authToken - The new authentication token.
   * @memberof [OS]
   * @returns {void}
   */
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  /**
   * Sets the API origin.
   *
   * @param {string} APIOrigin - The new API origin.
   * @memberof [Apps]
   * @returns {void}
   */
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  user = function(...args) {
    let options;
    if (typeof args[0] === "object" && args[0] !== null) {
      options = args[0];
    } else {
      options = {
        success: args[0],
        error: args[1]
      };
    }
    let query = "";
    if (options?.query) {
      query = `?${new URLSearchParams(options.query).toString()}`;
    }
    return new Promise((resolve, reject) => {
      const xhr = initXhr(`/whoami${query}`, this.APIOrigin, this.authToken, "get");
      setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
      xhr.send();
    });
  };
  version = function(...args) {
    let options;
    if (typeof args[0] === "object" && args[0] !== null) {
      options = args[0];
    } else {
      options = {
        success: args[0],
        error: args[1]
        // Add more if needed...
      };
    }
    return new Promise((resolve, reject) => {
      const xhr = initXhr("/version", this.APIOrigin, this.authToken, "get");
      setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
      xhr.send();
    });
  };
};
var OS_default = OS;

// node_modules/@heyputer/puter.js/src/modules/Perms.js
var Perms = class {
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
  }
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  async req_(route, body) {
    const resp = await fetch(this.APIOrigin + route, __spreadValues({
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json"
      }
    }, body ? { body: JSON.stringify(body) } : {}));
    return await resp.json();
  }
  // Grant Permissions
  async grantUser(target_username, permission) {
    return await this.req_("/auth/grant-user-user", {
      target_username,
      permission
    });
  }
  async grantGroup(group_uid, permission) {
    return await this.req_("/auth/grant-user-group", {
      group_uid,
      permission
    });
  }
  async grantApp(app_uid, permission) {
    return await this.req_("/auth/grant-user-app", {
      app_uid,
      permission
    });
  }
  async grantAppAnyUser(app_uid, permission) {
    return await this.req_("/auth/grant-dev-app", {
      app_uid,
      permission
    });
  }
  async grantOrigin(origin, permission) {
    return await this.req_("/auth/grant-user-app", {
      origin,
      permission
    });
  }
  // Revoke Permissions
  async revokeUser(target_username, permission) {
    return await this.req_("/auth/revoke-user-user", {
      target_username,
      permission
    });
  }
  async revokeGroup(group_uid, permission) {
    return await this.req_("/auth/revoke-user-group", {
      group_uid,
      permission
    });
  }
  async revokeApp(app_uid, permission) {
    return await this.req_("/auth/revoke-user-app", {
      app_uid,
      permission
    });
  }
  async revokeAppAnyUser(app_uid, permission) {
    return await this.req_("/auth/revoke-dev-app", {
      app_uid,
      permission
    });
  }
  async revokeOrigin(origin, permission) {
    return await this.req_("/auth/revoke-user-app", {
      origin,
      permission
    });
  }
  // Group Management
  async createGroup(metadata = {}, extra = {}) {
    return await this.req_("/group/create", {
      metadata,
      extra
    });
  }
  async addUsersToGroup(uid, usernames) {
    return await this.req_("/group/add-users", {
      uid,
      users: usernames ?? []
    });
  }
  async removeUsersFromGroup(uid, usernames) {
    return await this.req_("/group/remove-users", {
      uid,
      users: usernames ?? []
    });
  }
  async listGroups() {
    return await this.req_("/group/list");
  }
};

// node_modules/@heyputer/puter.js/src/lib/RequestError.js
var RequestError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "RequestError";
  }
};

// node_modules/@heyputer/puter.js/src/modules/Threads.js
var Threads = class {
  constructor(context) {
    this.authToken = context.authToken;
    this.APIOrigin = context.APIOrigin;
  }
  setAuthToken(authToken) {
    this.authToken = authToken;
  }
  setAPIOrigin(APIOrigin) {
    this.APIOrigin = APIOrigin;
  }
  async req_(method, route, body) {
    const resp = await fetch(this.APIOrigin + route, __spreadValues({
      method,
      headers: __spreadValues({
        Authorization: `Bearer ${this.authToken}`
      }, body ? { "Content-Type": "application/json" } : {})
    }, body ? { body: JSON.stringify(body) } : {}));
    if (!resp.ok) {
      const resp_data = await resp.json();
      const err = new RequestError(resp_data.message);
      err.response = resp_data;
      throw err;
    }
    return await resp.json();
  }
  async create(spec, parent) {
    if (typeof spec === "string") spec = { text: spec };
    return await this.req_("POST", "/threads/create", __spreadValues(__spreadValues({}, spec), parent ? { parent } : {}));
  }
  async edit(uid, spec = {}) {
    if (typeof spec === "string") spec = { text: spec };
    await this.req_("PUT", `/threads/edit/${encodeURIComponent(uid)}`, __spreadValues({}, spec));
  }
  async delete(uid) {
    await this.req_("DELETE", `/threads/${encodeURIComponent(uid)}`);
  }
  async list(uid, page, options) {
    return await this.req_(
      "POST",
      `/threads/list/${encodeURIComponent(uid)}/${page}`,
      options ?? {}
    );
  }
  async subscribe(uid, callback) {
    puter.fs.socket.emit("thread.sub-request", { uid });
    const events = [
      "post",
      "edit",
      "delete",
      "child-edit",
      "child-delete"
    ];
    for (const event of events) {
      puter.fs.socket.on(`thread.${event}`, (data) => {
        if (data.subscription === uid) callback(event, data);
      });
    }
  }
};

// node_modules/@heyputer/puter.js/src/modules/UI.js
var import_putility2 = __toESM(require_putility(), 1);

// node_modules/@heyputer/puter.js/src/modules/PuterDialog.js
var PuterDialog = class extends (globalThis.HTMLElement || Object) {
  // It will fall back to only extending Object in environments without a DOM
  /**
   * Detects if the current page is loaded using the file:// protocol.
   * @returns {boolean} True if using file:// protocol, false otherwise.
   */
  isUsingFileProtocol = () => {
    return window.location.protocol === "file:";
  };
  constructor(resolve, reject) {
    super();
    this.reject = reject;
    this.resolve = resolve;
    this.popupLaunched = false;
    this.hasUserActivation = () => {
      if (navigator.userActivation) {
        return navigator.userActivation.hasBeenActive && navigator.userActivation.isActive;
      }
      try {
        const testPopup = window.open("", "_blank", "width=1,height=1,left=-1000,top=-1000");
        if (testPopup) {
          testPopup.close();
          return true;
        }
        return false;
      } catch (e2) {
        return false;
      }
    };
    this.launchPopup = () => {
      try {
        let w2 = 600;
        let h3 = 400;
        let title = "Puter";
        var left = screen.width / 2 - w2 / 2;
        var top = screen.height / 2 - h3 / 2;
        const popup = window.open(
          `${puter.defaultGUIOrigin}/?embedded_in_popup=true&request_auth=true${window.crossOriginIsolated ? "&cross_origin_isolated=true" : ""}`,
          title,
          `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w2}, height=${h3}, top=${top}, left=${left}`
        );
        return popup;
      } catch (e2) {
        console.error("Failed to open popup:", e2);
        return null;
      }
    };
    this.attachShadow({ mode: "open" });
    let h2;
    h2 = `
        <style>
        dialog{
            background: transparent; 
            border: none; 
            box-shadow: none; 
            outline: none;
        }
        .puter-dialog-content {
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            padding: 20px;
            background: white;
            box-shadow: 0 0 9px 1px rgb(0 0 0 / 21%);
            padding: 80px 20px;
            -webkit-font-smoothing: antialiased;
            color: #575762;
            position: relative;
            background-image: url('data:image/webp;base64,UklGRlAbAABXRUJQVlA4WAoAAAAwAAAA8AIArQEAQUxQSB0AAAABB1ChiAgAKNL//xTR/9T//ve///3vf//73/+ZAwBWUDggDBsAAHAjAZ0BKvECrgE+nUyfTKWkMKsjk3mqEBOJaW6WwjzR/6prSfc95r2ztLOrL7Qmk8WYj6B+qfKm8C//+ufPmvfz/L6dZ/lf/79Rn1D/u8lf1n/h51GW/9DvL9u3/+z8//rLz8rv/Ho91qL//9Tf3+Dt29xsjEB3trEAO1CpmGKEcxEE0NTCpyVf/lDAyEBRUXwgPowMARkOmIbfb4QzfbEpqmW/oVDjCDhYdvNTH6wCem7jlfp6TsCUMhAr8Nka9YNDW//M1hIARGlp5TiuWo8zkVrq7MQ8sjAbL2ZDAR5HrshhvuQpLP42dIBC+d2vAQEWdwbMDviLsUYj7YuRYgd/nYcIbMPrxgnEqUps4UewgKUjphAD2DIgVLi0raUFF6zyUCN4z77Os61eB1TcZJ0RwsZHd++GEzQ7mz3e/8Gt7hdASIxvpMWj1hBk/wtwuFUwoyhwmcO1bs85XxEslCt8brpD8GCPMocPhn3/M5wnWvE4CeIukjl4/r+Ma/17kBr2SFIk0YVKOOYHgsl6GX4fv5Tgz90tiX7+h39885X77VVv+c7XN0O/GPWEet/y34k/ypNmTihk+1ziSLuRV3nLSLZDMraRTIfNve0QRePaEiQVD4I+oFEmoBXEet6lDvR2iq+orPAMjasfTuLzL+gpCtJ47qYj+USzv7/+nm7jib/cuN82LsnH50Z/Qk0/cZniT2GD2pL57Z/3gcIbTLEo7saABHxnU5Dv78DbEISkXdIVUjE/Awv/4aAzf8VAkX+XJNfUhTeww6xuB7Zu0m2J+gfOeH0Nn0l+pr9VX7F9aMLFhnIMOTFtu9Xc0Exd7mwlq375ksxdJpEUw6oFlJxzH/DIozmmdzgRB6l9d4UK9eS/pUXkYxjeJ2PI7bFvzs7y4wPLLiaVo9n+5t1O4wnKYicOhiAasGiBV1NxFmFla/CHup6UbeeDHzMZ7shRHDWBgc67HG4Y6QVKrO9Rit+tZR22I4OpyhlNHYqhJmGzk2dsUBm7cbqPRmypC85dJXnXGD7U2CPR42Y70JBkQKnmXLXYEt55FMu3VKekwAhkMW1Q79UIkNMnxJ1geGhorliFjJ+gfca/Jp4D7E92CdB6uuubIZCWwwaftBiWwe5cKLWOTC6b9Tw5nJawLRkmeUDhNZBdhVfuACupAs+NCF8EjDaStA1YbEMziSrNgssdExVpaDRVToIoF4iVTwTb5ZNQjsrf9lfPX4PKlDWwz+vzT+nl7FJlEv75tkQ+rcObWSCvKhbYUlfXyuvIwfIHKu1+Tqd0tIjunozTnB4a6XhLDZIh084eRLvPDCPOaiquqW9Xfb109xNCKIGY36jlHH19tPE3TSyFg+gxtpGM7g/FkY1FVIxaCN+l/y+UuvmfInYIVaigEVQ6Xm/UBjoDaTP5wRkNyvKH+P3q7Z8eVyeDxwc7HwX3+Ga3YD1QTq/ql1v4FMm4fGwg2FwEb6Ng9zG4WzQ1qmNQnWMPWQVTc81z6/pJol8l2RmHRW4lsFaECR4EOJME86gBBPlFjExRZ+MEqoKWbYJh879MOdYFxEUOt+5YtXsQavOsx65aVe/l6EqXyZSBZZRljO/Ywx8uBC/99P+8BYqFFm2sgzw68Rk58Mn8fYOzAtNndX8JOqrrqh/Nvv2nmz/7jdnIivgBNdRI1NSl2mHu4DIVZfYCvx5hq8OCKST64vf9yvvarVU9gh272p8B9RRIBeRRHS5/Krbce41kV59WESLOi8hkkKWwiHJUW0tnkjVBrSi9MUXZkaXeTkRcPQG1X3TKs4PFJqHjUErBx8tuZZCKAb/DZfBdn3CpcCPNKb3GOvLfCJi8SP94JrmDk2um/Zo/zpAtUDNPMJHA3w2vYkL7prMIT4lSV6Newo69qnSXCEHk3jiblYwkAp4lQQBNiJeDxwuaNLlqFltDn4qaUcoK+m6Oc4a8V+/OMJhEtP9PrGfwTTArKufxFqXwqCuiNoCHIm9kDduO6zjA4JHbXL2u5UmVQCtKhVIEatqpersXs5H0WzvX2ja+9EhhbfzYuZrxWM/H7ZRqJAx6nqkZ4Nz5tSeYQYBVT0TobZNNoNJdHCCpHVaZMwxsK4rWon/DqMYw3E6L4moc6X67ZM7pvSnxeqSl9VMLMF3duaw2CsSJJ17xOr/HdJIvYymBsKNQiKlXU+X/Ha16L9FQGyiODd80CAPCgiKBgpP5nIPiRplDZRuTHDLRKS+Mv3c52cZfX9sNxY1vID2AG5g7OK/xysbyq2n4/6zOXOzM3mVWuMTiYR/4vV1kVY/Y3oPEDJPnd4kTjc9A4ReI1qa9AinIrLebNbtO70z0rSxUaoqI/Ddd20APl+fcoK8aumsx1N7w9oOa6z8+vgxqymt2n6Mulhq/yizgRjwLEP8tNbeZ40sp2eLYH+j8oTbix7BCjbM2vKCwcb22/+G79VgP997sfr9IwLz/oAZL8HBpewJQROWUUGdBYPU44uXqUBQ+3RjfXJaFv3w8Q4QpHGnecadb8ax+KVBX6u/y8OfsxwWE9HOUwHlP46APGwQ+GPGpBaKI1SbIPRoa1UNvVhT1Fmu/f/78ibV1WhDu8iCCw2gOI4hcdIes5WJMziWjdawAg4x5eX0jdGnw4oGYhjeqe3+M/+/UrSiKFuXS7f+V2+oNPjw5RdWM/ihv8MXf9RAdzltvZSoibPdhMv9/2aVUrxvR8BHRc3Z7kO4q5f5GfueRP/AgjiQpRp6NfqPUkakThRII9ZhV7SMusfNM1ugq6b9susPW90czpMEcMgsJ6kmVqHn2veFKFxUR7HftHZ3RLayUGJ/Qtrh12rN/g2vH/nlmr7UMqN0nv7daUBxyCAS1j/1Re/U9f9h7i3HfZiACc0AvHk+n6l9biwnkm0/SMNKX7+/i/PopB4KjMlaY2iPhZXE2YM3GUnQvhEUTH1BuP4Y/5tLQPvAJN0xmLUV9aIM+azpAaMDKgVGrhZrD/Wp0wh8l9xEcV/7Y2cS/kV39lzHf+z+Z59JLt6fYeVXBv4wrgJbcpL1l8kb8aiujewjd4tgpWc1domyEBRaMH/jkIgGl+xxvv6kxI87+73ZST+1LL4K6wf3hWERTWle2yOQltkdL8FRfEDdB8H9uAAD+79iqhFzfCubLbi3KpzVtf0fq94WmyWGDBhJqMlbX9eGhEre0W6GTrU0DpOZz0Sp0bpi0GlQ9V79EwoeJg4gBgnqF07+EVYzYAexrVUn3k4ELSUsPhlMq5vZUbqpfAxgyuGcMyn/qxi47SfTJwEw2BOsS5fyEfthIiD1LVJqsAvdKbQZ4t/rcld466i8YpYFWkFygmX+5swl8sq6OSILIOVouQGVUAZiBf/iHqfGdNTsHvlCK1KVc2nwF8WX1R1dWJ9jEpS5tO/SFeRneGPo+AqqOr33kavMdAFEWANbIAwxycDadtirhcrZ2TMT6jUEKxXr6OJWt1xgSVrBtUysZ7VYjpBv/bormAMg84n5IOQiECoUhDyaSQA6azdnJ0r8bfvz7+f24jwKFL/iMmfrzlizpxbsF/Zesri2UFzsnk7ZbRzSSAiCdl+N80zZoYEOPj1vnMCmAItUEBb3q0Ni3OVKeO3a3UfaZc0Gv2Ghj4UIIetvoYxr2mvXUiZpREsvYp7YIz4f5qLpqr9aAjoDzh3f47M8jX4XTshiR9g31ScDA1EBKQtwH96YdlngZCrOLsjhAZWgOVONtvjSL1Wk/uFwSRUctic/1SdrjQiOYSmnobCAS51hlxwZ6xIeWthPP8AAFo+T2IEq1Lw0MlzQGxnjJLpfL8pMcHICMbTfpTr6/jz4zliTWNAgrRMGJw/P1iq0T02Gk8HC/XjB4ssb2CxZCll58HLmnoBiyVAAECWgREVdcJ3/L6NBpjnXVkR0DaPu/kWpNzovmAAGeVkbufex8OHbi3mcKGgVACobGeDilBFAL9ZGuooWAW+JlPApRzw1SGrNSCOEZ7fbYc2+BsSrNCaYCb1grfPghxqp5jAynnabMu8WJlqcWHsTXJCMNpf0sFik0Dh0pPUXsDK0CdmdaU2JB2RX1Jzk59jCkD7YaWVs2dLNLUFxzbqqCDWcPdJ3bfFiqjO5rOkZWKbNP+DfFqTVf2KFb+xrmEAUJtEIQ/g10ArYs1OrYC8cqaBR4CmJsAnuCXQJXocp4Qp908VzvIxaESMkR4zg8iFj9oX0Mle61Yc2jl7UtKGCNqkXy6JGZG1CfrOD+yYmrFBX6xQVif1UlK3a4a8jI3r1CrShUPwCzr7Lg67tKvkh0pifZB7FiMbXjxxGdo7tL/omkt62lEA1q6C7mnxPCiI88A9DiD2PTxf4gGD6W/upL+3nB7qa8Ta0ppjCWpL9cBAO3SQ2G9Kr3NrbUlMreTufoEg8FP7yhpgs0mLKfn5aGHYNONh9geGnHhcl9Hr18jswDyXemHvhMAhipvRKZuOvo2caiG+ZprtB+mywq2sqMQfWaRmfMiX9PoaWTx7L3kdx8buLUr0DIibKA9c6DxfVoiVS1wSsYWf5G2bsx3AIi8Eark/H0fH8WDtT5lQdsI6hOSkTIwyaQEHMRgR5Hba5INB3kNhCbhx6eNwECPIqluE/DWxF/hPFGiuOYz7f6aXKawksWmDqhnHmB0jOlqmMWpuedZOTHCzmjZBCrtz+PYtkAnkmH48HrjmhBLnOLCsGrOieoAh1cr5rdq0wyeqXwZtn5/p5wOocmL06tGcfFCD53CeJwuC09AvVyo+EUdjagIavVV2rkcHCWATnHrrdJmhQQ3ZGGNQt4eywkolaPhCKRaFf9z4MkEQDZQTG1aDbIu+rVc61W/99itGp2pVvIUvjLNR/mP5FRg0q/6d3Nt4C3WsOatn7XLAQ01YaUrAYVSsXNPfLT0JEPTAS2E7U67/TC6HMFPMxoM9Mz4kHVmnorS4vUPUeZ8YG0AT5zi27XrrFtaZa5w/r//mFVXISlF6+YtMR9xktRoFtYv6KbIsDpIl72hfcZVB29jgWwalMe5tijxx6MqRVG63TlGnLomZzW02YlPvHOfK2+I4rcJlv+2tEjZ3Z4ZeTXA19BMiyz+F6UO7XHe9emNM+mASK88YfuWjlgTQ8a4vV2uHb1vTsTPGipfKSudF6HjtcuE+mfXPp/ZTWBmU+kTQxDnwR8c1EtrO+6VnESk9tHWRSQE9DGcw+RomE6ddjmoy1BnNtjABYyh/IZ5q81DyuiWpy+yZ2QrzXUiLaKqJqzwtCIKWayZQBZ4E1uIuxdYL6kRwUmsRJ1FIgpHQVtqdZ0zvb6jfdUN2WkdPML9iZexnc6iqLmF3IzmQ5qXAOwM8omxZjiSl1kirUM4abv4CtsL7PmZtJ1/ZWOwyplpB8vm3U479b1XaAqBKBkAiZ+Ibh1pf8c3gViC008xpz0fSrq1VcOHutDr//jpmS0wPfz4YdQrhIIcWUAA1ikL6rSplUEAGYbl7E4WmvjY1x34W+4aEXX/hyjOUPklFCXBVatZMu4by1vM07fGV4YE5Jv3vGJQ8UJFcQM4y4u5YvaB70ETl7JtC5UFt6d1s8BSXLFjN28I8qAAfZqXU0Vv0NZ2aWIH8BL0SAH2nc3St6fGNAxqnPoPOtFoSN1HZCbPvr9DPqIG2bFH3I+cPatgd6Pj9ndcR4u9emiAuguCkXyz5bhMiRzGyEEG9ru1vpeLSuaGXB8NJoIo2jZcOcUC2EjXnZYEQ/Jf6vSChgn6jqF1uvlO6XYC7p/Rzo75DkxtCp4cbA77h9PY5CsyaBykd1nVGLxui7GPze9/LqsoTSr+4JAwgD8JkPEXXqSMckP8yZbYiJdp4oDXMvjDscvRPROBbGGHJME8apNrXGIf5wFVl50F5aiI2xboHuy+LOA5DgIjduDGFJq0uF2LgaawMmcIX1D9Z+iktUNOfqO51o28KYuDd2w84SRBEty/ola9Lta++BgwwAjczDn+wreIFWqo4RDoi5BbKpqEmTtUVqSzqiZH8Tl1fUxkRfvvUqnw0o1KZ8Mzv5Cg5hNUadG0hhcc/up/cALkm+J+QpTOWEYrXXf0TiZ8vzf2rcAul85hCjixJTdfO2qvWsfBVUf0EaeVYnXFpBX3kj0t6q17/kxF1fp9BhbV1LVUcWiUWCBNIN/clgUJLPHOCu1zscxM8+cqBsSNmhE0NTSfuJDNZTgGvrMfM3srdP0OeJfVpSEaxeEiNlDFNkGkFlJ7xBuNioj9cCUJYvOveexs9DyOdzZkiSZmUDtHXauC83MZhxPxH5LL1NpCoJdYNhQEwdqSevhulQKlx+2K8OEq0OTPXacZlAuT4kLeYHBi9Uy/j10L0M2h8kwiK5HunGAqLtb3kSTMBCQHvWnPWfWubUdClh8YnrCPiCTFDg5XCQY022i9V/fzcf9cy6nHmP+KV0IsJm17ZOLsabqgVs4mR86ttLrPkoCNZIMFQMvJ5rbLpfhdfWMCXR/3Worm/8rfib4pDffCy8iz56yNPd+s6FGpdD8AkeEGyiEqazY72j/sssV69VlAgKKLAy7/UhllSdFQEb8f8za++1RdnCtB+1pwQdiZ9asz5OuMAZ6CwudyC6t1wnU4dGQHzJK/zqXDzcdoSwcy2bHDt6vKFRzdcTUnEr7C9Ws/cj3WpvIS2xIsvDuQRpnWG5IP5k2VVhrsGV9nhpvRzQb8XlCMZi0noHul72X2QFJQ48zVJgCIBSlblTPk/rLfTqmZxk75FmFhfcFszUGCFvAIWyroBPFefNrtZN26hsXbynXPfxNGhXwroIip+eCG/uzurUqFlyy+JblVL+5SEtvK990PrbJl7E5xVImEl6RdsHqYvNhTytMs0dxgQdDInMNAyFtdlciS9qzKvztdcw+oq0W9+BaNaiqssxz7caLrh54IUfUJHnHTpbop1lAyJXEAo6L8eDl1X46mkoNUkoR21o//xnmL2u5zyu8JmaTD8c77VjqRpQayOh5QUgEExPeXrogXDalS48ubECOx7aZBfyn9ci4ir4ifPPokAj0IVMglh85stOMGuZPkq+dIHdNEgAq8ZMTY+NbXs7ah8yP27QWYz1lbJGJJyAU97X1uQ5rG4TQVzqFtxYkqHyeoIygRFD4SVyB8uABK7mE7rXkvBtbGlBKvHMLiwoFvkgL2YNNxjvHilB76ZfounqxabWY1ufFDEULUsCT/nhdTw+P5CbDBzwWdNtxervRm6xdnwtMprXXcFRzVl8uWOIopDKPRF04tHOb9R920BNhv5aEpB4Y0hVrQzuRfxffGafun+4tceUWjtIMd8xWXnfrFjxU2ioEH0oM5oXSLihduRkeYF9gWIuNigtLp/nS3sI49rzxdTLwxMPW13BZPM5FQe/vbtDFPMN/1FFpj3ND7ZEex0MKCVWZhTkyn1f4QOSNu1d2RE0E6QhPdN+exhYztnnFipBW++osJCm2Go2rtg8TRjJQJzA1zcfDtH8NToCCeMzlNMap0mWxKMb850VuMZQaMq8GzRWHTdRRly7lZQl9GIhxH9mzXiJ/RHF5juTu5O45WtXBgVfR33LWLom6CbXrkjje1hE57XeYkgSTPVzelKq4Q95h43KlmyMPh9R91j726nPrCGaYqebkBnwBc6773ZMVdcin533GG5IQcXq7V/CEWWFIIvMDMwvSC35kyspY58QH4aahgG19XPvYf5Qn5ygsNL3TM7dzwfBIZ52qsSOmpaUuBLIJCv0yKDjzTo8+aUI+iwurRUJm5Z1bdbdr2bByKFXHdkbjTFj+BXbPw+zmUOJ5fjBY18uRra6s4zMosDtS899s6fstWhMCstRkK0NaDK5Q3hMbhbUTeXVH99Fup1LmS2yBXbuK+yVvQZ6WTmtctSrvLjNdR1+j2nvyRtNW4DYJGL1QFbdOWx0vqjuJRHGwyvlzC3fnGTJdCgEzzK04KaKT388uvtNwB7sRlSAiyX8HwzjAaIdfWBkuxsmM2zhGA2Esq9dSKsjPJqFpmAw7wtNCWq1GgelC6gmzCjMri9mavI4JYSGj7LoPlwJFqXqMOLN7Nu0Wk00OiW2wfcb8JDzBl6sne3bcj7XYcKezsFzC98WCS4sx5UlNfeJ5kMFhLpq8WeGDL4IeO3PAK98ZvNdmJ52uAyxIfWE44qTgwJsAxwYRBvkUI2yY4VnTBnf8Gh0nPHPFdhwfWYEWEBOw+K1BFNv/mZbic/DwkoqZWAR514lCA0aV43LBemE6zHUpXCMQXs7daqeh2kpwKiYQqUWNlrVShO1NVIUn6ir+SDS6X20QWkly6kWUFajhovz5n38DgutRdpNwngVyBSbd9Ivbh53YjwNAlsa0b8I5LEvhoTTQsfPZ5S3Zu2a/PYIpo51zfsK3f+XmEYWzZoEXbsvtl/usqdVD13+qeTuEU7V+sTf6OD/uo/B4/KpnM53lfCWfJNC3WKm5fyoUSeqj3NqjWfSS6bne3lcMnOk46zJZSIXyxaPs7Gb7NXogDdulXYM5PHj7DTDwprdEMKgENQa9Lxht5U4tfsrFsBR9HBLSMOUTAv3JQd9oEymfBz/lZBpVIM79OlzzKZcBKmTtus9qlm++iXv6eGLdEoEi17rSx1W7X7kQXaIkMsV+Ns9HtgN+2AZuzvsMRPdkX5oF21vVSmE91By9UnhKG8jjNUr66maTmHc0VBff2EPP1MC5OJ3h8EzlOaedk2k0OcEiRYPsasA2vYeu9fkcJLmT2Sq76VYK8/IPpTXI+/TSpXUFc1V5VqNyt/39hTJ/6kjBuuw+1cvJI4Ch4lMhw2xDUPR1uVztKpLamzen1fLYdTeupquuXMLAxtLFUEnwaQ18gb3wxUYIJwE3VkfXA/shqyDSb1+jNg5uBJmQyEgTBHjmHRoLIe/Woh58xTbLtb7IrXITJgvZmFXeSbhjd7ms2Kb0DyyDFPDz1pxEk2VO13dfjgNzw4rRZXDGNxKdW4V8x0ZqfMrs48cLI/j1eOqmLvo3k6gkaYRfrs1ngoVMqazzJrkJYFz8WmsD+K1eEp/LqNxUkodWrAq885E8VeIULxp0u3xb1m7uUnyrHzshPXSnGCDUaxFj6UxoYG6a3Ga7OYz0Sdnw+dQk230G0weEIt9GN3BpWOiGAJZ69w4jr2D+6RkhzNmnY9n1qV05DE1BflAzIDxsPW78jJAFiz5aARulRgVFwgBnMuPWxvLmIXBvAAHy65muvCAsGfVex4ZHKCCv6XnQ2OW9EURTQsdw7Gb8bz9teGINBk3/fz0oAJ5e9QAAAA==');
            background-repeat: no-repeat;
            background-position: center center;
            background-size: 100% 100%;
            background-color: #fff;
        }
        
        dialog * {
            max-width: 500px;
            font-family: "Helvetica Neue", HelveticaNeue, Helvetica, Arial, sans-serif;
        }
        
        dialog p.about{
            text-align: center;
            font-size: 17px;
            padding: 10px 30px;
            font-weight: 400;
            -webkit-font-smoothing: antialiased;
            color: #404048;
            box-sizing: border-box;
        }
        
        dialog .buttons{
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .launch-auth-popup-footnote{
            font-size: 11px;
            color: #666;
            margin-top: 10px;
            /* footer at the bottom */
            position: absolute;
            left: 0;
            right: 0;
            bottom: 10px;
            text-align: center;
            margin: 0 10px;
        }
        
        dialog .close-btn{
            position: absolute;
            right: 15px;
            top: 10px;
            font-size: 17px;
            color: #8a8a8a;
            cursor: pointer;
        }
        
        dialog .close-btn:hover{
            color: #000;
        }
        
        /* ------------------------------------
        Button
        ------------------------------------*/
        
        dialog .button {
            color: #666666;
            background-color: #eeeeee;
            border-color: #eeeeee;
            font-size: 14px;
            text-decoration: none;
            text-align: center;
            line-height: 40px;
            height: 35px;
            padding: 0 30px;
            margin: 0;
            display: inline-block;
            appearance: none;
            cursor: pointer;
            border: none;
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
            border-color: #b9b9b9;
            border-style: solid;
            border-width: 1px;
            line-height: 35px;
            background: -webkit-gradient(linear, left top, left bottom, from(#f6f6f6), to(#e1e1e1));
            background: linear-gradient(#f6f6f6, #e1e1e1);
            -webkit-box-shadow: inset 0px 1px 0px rgb(255 255 255 / 30%), 0 1px 2px rgb(0 0 0 / 15%);
            box-shadow: inset 0px 1px 0px rgb(255 255 255 / 30%), 0 1px 2px rgb(0 0 0 / 15%);
            border-radius: 4px;
            outline: none;
            -webkit-font-smoothing: antialiased;
        }
        
        dialog .button:focus-visible {
            border-color: rgb(118 118 118);
        }
        
        dialog .button:active, dialog .button.active, dialog .button.is-active, dialog .button.has-open-contextmenu {
            text-decoration: none;
            background-color: #eeeeee;
            border-color: #cfcfcf;
            color: #a9a9a9;
            -webkit-transition-duration: 0s;
            transition-duration: 0s;
            -webkit-box-shadow: inset 0 1px 3px rgb(0 0 0 / 20%);
            box-shadow: inset 0px 2px 3px rgb(0 0 0 / 36%), 0px 1px 0px white;
        }
        
        dialog .button.disabled, dialog .button.is-disabled, dialog .button:disabled {
            top: 0 !important;
            background: #EEE !important;
            border: 1px solid #DDD !important;
            text-shadow: 0 1px 1px white !important;
            color: #CCC !important;
            cursor: default !important;
            appearance: none !important;
            pointer-events: none;
        }
        
        dialog .button-action.disabled, dialog .button-action.is-disabled, dialog .button-action:disabled {
            background: #55a975 !important;
            border: 1px solid #60ab7d !important;
            text-shadow: none !important;
            color: #CCC !important;
        }
        
        dialog .button-primary.disabled, dialog .button-primary.is-disabled, dialog .button-primary:disabled {
            background: #8fc2e7 !important;
            border: 1px solid #98adbd !important;
            text-shadow: none !important;
            color: #f5f5f5 !important;
        }
        
        dialog .button-block {
            width: 100%;
        }
        
        dialog .button-primary {
            border-color: #088ef0;
            background: -webkit-gradient(linear, left top, left bottom, from(#34a5f8), to(#088ef0));
            background: linear-gradient(#34a5f8, #088ef0);
            color: white;
        }
        
        dialog .button-danger {
            border-color: #f00808;
            background: -webkit-gradient(linear, left top, left bottom, from(#f83434), to(#f00808));
            background: linear-gradient(#f83434, #f00808);
            color: white;
        }
        
        dialog .button-primary:active, dialog .button-primary.active, dialog .button-primary.is-active, dialog .button-primary-flat:active, dialog .button-primary-flat.active, dialog .button-primary-flat.is-active {
            background-color: #2798eb;
            border-color: #2798eb;
            color: #bedef5;
        }
        
        dialog .button-action {
            border-color: #08bf4e;
            background: -webkit-gradient(linear, left top, left bottom, from(#29d55d), to(#1ccd60));
            background: linear-gradient(#29d55d, #1ccd60);
            color: white;
        }
        
        dialog .button-action:active, dialog .button-action.active, dialog .button-action.is-active, dialog .button-action-flat:active, dialog .button-action-flat.active, dialog .button-action-flat.is-active {
            background-color: #27eb41;
            border-color: #27eb41;
            color: #bef5ca;
        }
        
        dialog .button-giant {
            font-size: 28px;
            height: 70px;
            line-height: 70px;
            padding: 0 70px;
        }
        
        dialog .button-jumbo {
            font-size: 24px;
            height: 60px;
            line-height: 60px;
            padding: 0 60px;
        }
        
        dialog .button-large {
            font-size: 20px;
            height: 50px;
            line-height: 50px;
            padding: 0 50px;
        }
        
        dialog .button-normal {
            font-size: 16px;
            height: 40px;
            line-height: 38px;
            padding: 0 40px;
        }
        
        dialog .button-small {
            height: 30px;
            line-height: 29px;
            padding: 0 30px;
        }
        
        dialog .button-tiny {
            font-size: 9.6px;
            height: 24px;
            line-height: 24px;
            padding: 0 24px;
        }
        
        #launch-auth-popup{
            margin-left: 10px; 
            width: 200px; 
            font-weight: 500; 
            font-size: 15px;
        }
        dialog .button-auth{
            margin-bottom: 10px;
        }
        dialog a, dialog a:visited{
            color: rgb(0 69 238);
            text-decoration: none;
        }
        dialog a:hover{
            text-decoration: underline;
        }
        
        @media (max-width:480px)  { 
            .puter-dialog-content{
                padding: 50px 20px;
            }
            dialog .buttons{
                flex-direction: column-reverse;
            }
            dialog p.about{
                padding: 10px 0;
            }
            dialog .button-auth{
                width: 100% !important;
                margin:0 !important;
                margin-bottom: 10px !important;
            }
        }
        .error-container h1 {
            color: #e74c3c;
            font-size: 20px;
            text-align: center;
        }

        .puter-dialog-content a:focus{
            outline: none;
        }
        </style>`;
    if (window.location.protocol === "file:") {
      h2 += `<dialog>
                    <div class="puter-dialog-content" style="padding: 20px 40px; background:white !important; font-size: 15px;">
                        <span class="close-btn">&#x2715</span>
                        <div class="error-container">
                            <h1>Puter.js Error: Unsupported Protocol</h1>
                            <p>It looks like you've opened this file directly in your browser (using the <code style="font-family: monospace;">file:///</code> protocol) which is not supported by Puter.js for security reasons.</p>
                            <p>To view this content properly, you need to serve it through a web server. Here are some options:</p>
                            <ul>
                                <li>Use a local development server (e.g., Python's built-in server or Node.js http-server)</li>
                                <li>Upload the files to a web hosting service</li>
                                <li>Use a local server application like XAMPP or MAMP</li>
                            </ul>
                            <p class="help-text">If you're not familiar with these options, consider reaching out to your development team or IT support for assistance.</p>
                        </div>
                        <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size:13px;">
                            <a href="https://docs.puter.com" target="_blank">Docs</a><span style="margin:10px; color: #CCC;">|</span>
                            <a href="https://github.com/heyPuter/puter/" target="_blank">Github</a><span style="margin:10px; color: #CCC;">|</span>
                            <a href="https://discord.com/invite/PQcx7Teh8u" target="_blank">Discord</a>
                        </p>
                    </div>
                </dialog>`;
    } else {
      h2 += `<dialog>
                <div class="puter-dialog-content">
                    <span class="close-btn">&#x2715</span>
                    <a href="https://puter.com" target="_blank" style="border:none; outline:none; display: block; width: 70px; height: 70px; margin: 0 auto; border-radius: 4px;"><img style="display: block; width: 70px; height: 70px; margin: 0 auto; border-radius: 4px;" src="data:image/png;base64,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"/></a>
                    <p class="about">This website uses Puter to bring you safe, secure, and private AI and Cloud features.</p>
                    <div class="buttons">
                        <button class="button button-auth" id="launch-auth-popup-cancel">Cancel</button>
                        <button class="button button-primary button-auth" id="launch-auth-popup" style="margin-left:10px;">Continue</button>
                    </div>
                    <p style="text-align: center; margin-top: -15px; font-size: 14px;">Powered by <a href="https://developer.puter.com/?utm_source=sdk-splash" target="_blank">Puter</a></p>
                    <p class="launch-auth-popup-footnote">By clicking 'Continue' you agree to Puter's <a href="https://puter.com/terms" target="_blank">Terms of Service</a> and <a href="https://puter.com/privacy" target="_blank">Privacy Policy</a>.</p>
                </div>
            </dialog>`;
    }
    this.shadowRoot.innerHTML = h2;
    this.messageListener = async (event) => {
      if (event.data.msg === "puter.token") {
        this.close();
        puter.setAuthToken(event.data.token);
        puter.setAppID(event.data.app_uid);
        window.removeEventListener("message", this.messageListener);
        puter.puterAuthState.authGranted = true;
        this.resolve();
        if (puter.onAuth && typeof puter.onAuth === "function") {
          puter.getUser().then((user) => {
            puter.onAuth(user);
          });
        }
        puter.puterAuthState.isPromptOpen = false;
        if (puter.puterAuthState.resolver) {
          if (puter.puterAuthState.authGranted) {
            puter.puterAuthState.resolver.resolve();
          } else {
            puter.puterAuthState.resolver.reject();
          }
          puter.puterAuthState.resolver = null;
        }
        ;
      }
    };
  }
  // Optional: Handle dialog cancellation as rejection
  cancelListener = () => {
    this.close();
    window.removeEventListener("message", this.messageListener);
    puter.puterAuthState.authGranted = false;
    puter.puterAuthState.isPromptOpen = false;
    this.reject(new Error("User cancelled the authentication"));
    if (puter.puterAuthState.resolver) {
      puter.puterAuthState.resolver.reject(new Error("User cancelled the authentication"));
      puter.puterAuthState.resolver = null;
    }
  };
  connectedCallback() {
    this.shadowRoot.querySelector("#launch-auth-popup")?.addEventListener("click", () => {
      let w2 = 600;
      let h2 = 400;
      let title = "Puter";
      var left = screen.width / 2 - w2 / 2;
      var top = screen.height / 2 - h2 / 2;
      window.open(
        `${puter.defaultGUIOrigin}/?embedded_in_popup=true&request_auth=true${window.crossOriginIsolated ? "&cross_origin_isolated=true" : ""}`,
        title,
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w2}, height=${h2}, top=${top}, left=${left}`
      );
    });
    window.addEventListener("message", this.messageListener);
    this.shadowRoot.querySelector("#launch-auth-popup-cancel")?.addEventListener("click", this.cancelListener);
    this.shadowRoot.querySelector(".close-btn")?.addEventListener("click", this.cancelListener);
  }
  open() {
    if (this.hasUserActivation()) {
      let w2 = 600;
      let h2 = 400;
      let title = "Puter";
      var left = screen.width / 2 - w2 / 2;
      var top = screen.height / 2 - h2 / 2;
      window.open(
        `${puter.defaultGUIOrigin}/?embedded_in_popup=true&request_auth=true${window.crossOriginIsolated ? "&cross_origin_isolated=true" : ""}`,
        title,
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w2}, height=${h2}, top=${top}, left=${left}`
      );
    } else {
      this.shadowRoot.querySelector("dialog").showModal();
    }
  }
  close() {
    this.shadowRoot.querySelector("dialog").close();
  }
};
if (PuterDialog.__proto__ === globalThis.HTMLElement) {
  customElements.define("puter-dialog", PuterDialog);
}
var PuterDialog_default = PuterDialog;

// node_modules/@heyputer/puter.js/src/modules/UI.js
var FILE_SAVE_CANCELLED = Symbol("FILE_SAVE_CANCELLED");
var FILE_OPEN_CANCELLED = Symbol("FILE_OPEN_CANCELLED");
var AppConnection = class _AppConnection extends EventListener {
  // targetOrigin for postMessage() calls to Puter
  #puterOrigin = "*";
  // Whether the target app is open
  #isOpen;
  // Whether the target app uses the Puter SDK, and so accepts messages
  // (Closing and close events will still function.)
  #usesSDK;
  static from(values, context) {
    const connection = new _AppConnection(context, {
      target: values.appInstanceID,
      usesSDK: values.usesSDK
    });
    connection.response = values.response;
    return connection;
  }
  constructor(context, { target, usesSDK }) {
    super([
      "message",
      // The target sent us something with postMessage()
      "close"
      // The target app was closed
    ]);
    this.messageTarget = context.messageTarget;
    this.appInstanceID = context.appInstanceID;
    this.targetAppInstanceID = target;
    this.#isOpen = true;
    this.#usesSDK = usesSDK;
    this.log = context.puter.logger.fields({
      category: "ipc"
    });
    this.log.fields({
      cons_source: context.appInstanceID,
      source: context.puter.appInstanceID,
      target
    }).info(`AppConnection created to ${target}`, this);
    globalThis.document && window.addEventListener("message", (event) => {
      if (event.data.msg === "messageToApp") {
        if (event.data.appInstanceID !== this.targetAppInstanceID) {
          return;
        }
        if (event.data.targetAppInstanceID !== this.appInstanceID) {
          console.error(`AppConnection received message intended for wrong app! appInstanceID=${this.appInstanceID}, target=${event.data.targetAppInstanceID}`);
          return;
        }
        this.emit("message", event.data.contents);
        return;
      }
      if (event.data.msg === "appClosed") {
        if (event.data.appInstanceID !== this.targetAppInstanceID) {
          return;
        }
        this.#isOpen = false;
        this.emit("close", {
          appInstanceID: this.targetAppInstanceID,
          statusCode: event.data.statusCode
        });
      }
    });
  }
  // Does the target app use the Puter SDK? If not, certain features will be unavailable.
  get usesSDK() {
    return this.#usesSDK;
  }
  // Send a message to the target app. Requires the target to use the Puter SDK.
  postMessage(message) {
    if (!this.#isOpen) {
      console.warn("Trying to post message on a closed AppConnection");
      return;
    }
    if (!this.#usesSDK) {
      console.warn("Trying to post message to a non-SDK app");
      return;
    }
    this.messageTarget.postMessage({
      msg: "messageToApp",
      appInstanceID: this.appInstanceID,
      targetAppInstanceID: this.targetAppInstanceID,
      // Note: there was a TODO comment here about specifying the origin,
      // but this should not happen here; the origin should be specified
      // on the other side where the expected origin for the app is known.
      targetAppOrigin: "*",
      contents: message
    }, this.#puterOrigin);
  }
  // Attempt to close the target application
  close() {
    if (!this.#isOpen) {
      console.warn("Trying to close an app on a closed AppConnection");
      return;
    }
    this.messageTarget.postMessage({
      msg: "closeApp",
      appInstanceID: this.appInstanceID,
      targetAppInstanceID: this.targetAppInstanceID
    }, this.#puterOrigin);
  }
};
var UI = class extends EventListener {
  // Used to generate a unique message id for each message sent to the host environment
  // we start from 1 because 0 is falsy and we want to avoid that for the message id
  #messageID = 1;
  // Holds the callback functions for the various events
  // that are triggered when a watched item has changed.
  itemWatchCallbackFunctions = [];
  // Holds the unique app instance ID that is provided by the host environment
  appInstanceID;
  // Holds the unique app instance ID for the parent (if any), which is provided by the host environment
  parentInstanceID;
  // If we have a parent app, holds an AppConnection to it
  #parentAppConnection = null;
  // Holds the callback functions for the various events
  // that can be triggered by the host environment's messages.
  #callbackFunctions = [];
  // onWindowClose() is executed right before the window is closed. Users can override this function
  // to perform a variety of tasks right before window is closed. Users can override this function.
  #onWindowClose;
  // When an item is opened by this app in any way onItemsOpened() is executed. Users can override this function.
  #onItemsOpened;
  #onLaunchedWithItems;
  // List of events that can be listened to.
  #eventNames;
  // The most recent value that we received for a given broadcast, by name.
  #lastBroadcastValue = /* @__PURE__ */ new Map();
  // name -> data
  #overlayActive = false;
  #overlayTimer = null;
  // Replaces boilerplate for most methods: posts a message to the GUI with a unique ID, and sets a callback for it.
  #postMessageWithCallback(name, resolve, args = {}) {
    const msg_id = this.#messageID++;
    this.messageTarget?.postMessage(__spreadValues({
      msg: name,
      env: this.env,
      appInstanceID: this.appInstanceID,
      uuid: msg_id
    }, args), "*");
    this.#callbackFunctions[msg_id] = resolve;
  }
  #postMessageWithObject(name, value) {
    const dehydrator = this.util.rpc.getDehydrator({
      target: this.messageTarget
    });
    this.messageTarget?.postMessage({
      msg: name,
      env: this.env,
      appInstanceID: this.appInstanceID,
      value: dehydrator.dehydrate(value)
    }, "*");
  }
  async #ipc_stub({
    callback,
    method,
    parameters
  }) {
    let p2, resolve;
    await new Promise((done_setting_resolve) => {
      p2 = new Promise((resolve_) => {
        resolve = resolve_;
        done_setting_resolve();
      });
    });
    const callback_id = this.util.rpc.registerCallback(resolve);
    this.messageTarget?.postMessage({
      $: "puter-ipc",
      v: 2,
      appInstanceID: this.appInstanceID,
      env: this.env,
      msg: method,
      parameters,
      uuid: callback_id
    }, "*");
    const ret = await p2;
    if (callback) callback(ret);
    return ret;
  }
  constructor(context, { appInstanceID, parentInstanceID }) {
    const eventNames = [
      "localeChanged",
      "themeChanged",
      "connection"
    ];
    super(eventNames);
    this.#eventNames = eventNames;
    this.context = context;
    this.appInstanceID = appInstanceID;
    this.parentInstanceID = parentInstanceID;
    this.appID = context.appID;
    this.env = context.env;
    this.util = context.util;
    if (this.env === "app") {
      this.messageTarget = window.parent;
    } else if (this.env === "gui") {
      return;
    }
    this.context = this.context.sub({
      appInstanceID: this.appInstanceID,
      messageTarget: this.messageTarget
    });
    if (this.parentInstanceID) {
      this.#parentAppConnection = new AppConnection(this.context, {
        target: this.parentInstanceID,
        usesSDK: true
      });
    }
    this.messageTarget?.postMessage({
      msg: "READY",
      appInstanceID: this.appInstanceID
    }, "*");
    globalThis.document && window.addEventListener("focus", (e2) => {
      this.messageTarget?.postMessage({
        msg: "windowFocused",
        appInstanceID: this.appInstanceID
      }, "*");
    });
    let lastDraggedOverElement = null;
    globalThis.document && window.addEventListener("message", async (e2) => {
      if (!e2.data) return;
      if (e2.data.error) {
        throw e2.data.error;
      } else if (e2.data.msg && e2.data.msg === "focus") {
        window.focus();
      } else if (e2.data.msg && e2.data.msg === "click") {
        const clicked_el = document.elementFromPoint(e2.data.x, e2.data.y);
        if (clicked_el !== null) {
          clicked_el.click();
        }
      } else if (e2.data.msg && e2.data.msg === "drag") {
        const draggedOverElement = document.elementFromPoint(e2.data.x, e2.data.y);
        if (draggedOverElement !== lastDraggedOverElement) {
          if (lastDraggedOverElement) {
            const dragLeaveEvent = new Event("dragleave", {
              bubbles: true,
              cancelable: true,
              clientX: e2.data.x,
              clientY: e2.data.y
            });
            lastDraggedOverElement.dispatchEvent(dragLeaveEvent);
          }
          if (draggedOverElement) {
            const dragEnterEvent = new Event("dragenter", {
              bubbles: true,
              cancelable: true,
              clientX: e2.data.x,
              clientY: e2.data.y
            });
            draggedOverElement.dispatchEvent(dragEnterEvent);
          }
          lastDraggedOverElement = draggedOverElement;
        }
      } else if (e2.data.msg && e2.data.msg === "drop") {
        if (lastDraggedOverElement) {
          const dropEvent = new CustomEvent("drop", {
            bubbles: true,
            cancelable: true,
            detail: {
              clientX: e2.data.x,
              clientY: e2.data.y,
              items: e2.data.items
            }
          });
          lastDraggedOverElement.dispatchEvent(dropEvent);
          lastDraggedOverElement = null;
        }
      } else if (e2.data.msg === "windowWillClose") {
        if (this.#onWindowClose === void 0) {
          this.messageTarget?.postMessage({
            msg: true,
            appInstanceID: this.appInstanceID,
            original_msg_id: e2.data.msg_id
          }, "*");
        } else {
          this.messageTarget?.postMessage({
            msg: false,
            appInstanceID: this.appInstanceID,
            original_msg_id: e2.data.msg_id
          }, "*");
          this.#onWindowClose();
        }
      } else if (e2.data.msg === "itemsOpened") {
        if (this.#onItemsOpened === void 0) {
          this.messageTarget?.postMessage({
            msg: true,
            appInstanceID: this.appInstanceID,
            original_msg_id: e2.data.msg_id
          }, "*");
        } else {
          this.messageTarget?.postMessage({
            msg: false,
            appInstanceID: this.appInstanceID,
            original_msg_id: e2.data.msg_id
          }, "*");
          let items = [];
          if (e2.data.items.length > 0) {
            for (let index = 0; index < e2.data.items.length; index++) {
              items.push(new FSItem_default(e2.data.items[index]));
            }
          }
          this.#onItemsOpened(items);
        }
      } else if (e2.data.msg === "getAppDataSucceeded") {
        let appDataItem = new FSItem_default(e2.data.item);
        if (e2.data.original_msg_id && this.#callbackFunctions[e2.data.original_msg_id]) {
          this.#callbackFunctions[e2.data.original_msg_id](appDataItem);
        }
      } else if (e2.data.msg === "instancesOpenSucceeded") {
        if (e2.data.original_msg_id && this.#callbackFunctions[e2.data.original_msg_id]) {
          this.#callbackFunctions[e2.data.original_msg_id](e2.data.instancesOpen);
        }
      } else if (e2.data.msg === "readAppDataFileSucceeded") {
        let appDataItem = new FSItem_default(e2.data.item);
        if (e2.data.original_msg_id && this.#callbackFunctions[e2.data.original_msg_id]) {
          this.#callbackFunctions[e2.data.original_msg_id](appDataItem);
        }
      } else if (e2.data.msg === "readAppDataFileFailed") {
        if (e2.data.original_msg_id && this.#callbackFunctions[e2.data.original_msg_id]) {
          this.#callbackFunctions[e2.data.original_msg_id](null);
        }
      } else if (e2.data.original_msg_id !== void 0 && this.#callbackFunctions[e2.data.original_msg_id]) {
        if (e2.data.msg === "fileOpenPicked") {
          if (e2.data.items.length === 1) {
            this.#callbackFunctions[e2.data.original_msg_id](new FSItem_default(e2.data.items[0]));
          } else if (e2.data.items.length > 1) {
            let items = [];
            for (let index = 0; index < e2.data.items.length; index++) {
              items.push(new FSItem_default(e2.data.items[index]));
            }
            this.#callbackFunctions[e2.data.original_msg_id](items);
          }
        } else if (e2.data.msg === "directoryPicked") {
          if (e2.data.items.length === 1) {
            this.#callbackFunctions[e2.data.original_msg_id](new FSItem_default({
              uid: e2.data.items[0].uid,
              name: e2.data.items[0].fsentry_name,
              path: e2.data.items[0].path,
              readURL: e2.data.items[0].read_url,
              writeURL: e2.data.items[0].write_url,
              metadataURL: e2.data.items[0].metadata_url,
              isDirectory: true,
              size: e2.data.items[0].fsentry_size,
              accessed: e2.data.items[0].fsentry_accessed,
              modified: e2.data.items[0].fsentry_modified,
              created: e2.data.items[0].fsentry_created
            }));
          } else if (e2.data.items.length > 1) {
            let items = [];
            for (let index = 0; index < e2.data.items.length; index++) {
              items.push(new FSItem_default(e2.data.items[index]));
            }
            this.#callbackFunctions[e2.data.original_msg_id](items);
          }
        } else if (e2.data.msg === "colorPicked") {
          this.#callbackFunctions[e2.data.original_msg_id](e2.data.color);
        } else if (e2.data.msg === "fontPicked") {
          this.#callbackFunctions[e2.data.original_msg_id](e2.data.font);
        } else if (e2.data.msg === "alertResponded") {
          this.#callbackFunctions[e2.data.original_msg_id](e2.data.response);
        } else if (e2.data.msg === "promptResponded") {
          this.#callbackFunctions[e2.data.original_msg_id](e2.data.response);
        } else if (e2.data.msg === "languageReceived") {
          this.#callbackFunctions[e2.data.original_msg_id](e2.data.language);
        } else if (e2.data.msg === "fileSaved") {
          this.#callbackFunctions[e2.data.original_msg_id](new FSItem_default(e2.data.saved_file));
        } else if (e2.data.msg === "fileSaveCancelled") {
          this.#callbackFunctions[e2.data.original_msg_id](FILE_SAVE_CANCELLED);
        } else if (e2.data.msg === "fileOpenCancelled") {
          this.#callbackFunctions[e2.data.original_msg_id](FILE_OPEN_CANCELLED);
        } else {
          this.#callbackFunctions[e2.data.original_msg_id](e2.data);
        }
        delete this.#callbackFunctions[e2.data.original_msg_id];
      } else if (e2.data.msg === "itemChanged" && e2.data.data && e2.data.data.uid) {
        if (this.itemWatchCallbackFunctions[e2.data.data.uid] && typeof this.itemWatchCallbackFunctions[e2.data.data.uid] === "function") {
          this.itemWatchCallbackFunctions[e2.data.data.uid](e2.data.data);
        }
      } else if (e2.data.msg === "broadcast") {
        const { name, data } = e2.data;
        if (!this.#eventNames.includes(name)) {
          return;
        }
        this.emit(name, data);
        this.#lastBroadcastValue.set(name, data);
      } else if (e2.data.msg === "connection") {
        e2.data.usesSDK = true;
        const conn = AppConnection.from(e2.data, this.context);
        const accept = (value) => {
          this.messageTarget?.postMessage({
            $: "connection-resp",
            connection: e2.data.appInstanceID,
            accept: true,
            value
          }, "*");
        };
        const reject = (value) => {
          this.messageTarget?.postMessage({
            $: "connection-resp",
            connection: e2.data.appInstanceID,
            accept: false,
            value
          }, "*");
        };
        this.emit("connection", {
          conn,
          accept,
          reject
        });
      }
    });
    globalThis.document?.addEventListener("mousemove", async (event) => {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      this.messageTarget?.postMessage({
        msg: "mouseMoved",
        appInstanceID: this.appInstanceID,
        x: this.mouseX,
        y: this.mouseY
      }, "*");
    });
    globalThis.document?.addEventListener("click", async (event) => {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      this.messageTarget?.postMessage({
        msg: "mouseClicked",
        appInstanceID: this.appInstanceID,
        x: this.mouseX,
        y: this.mouseY
      }, "*");
    });
  }
  onWindowClose(callback) {
    this.#onWindowClose = callback;
  }
  onItemsOpened(callback) {
    if (!this.#onItemsOpened) {
      let URLParams = new URLSearchParams(globalThis.location.search);
      if (URLParams.has("puter.item.name") && URLParams.has("puter.item.uid") && URLParams.has("puter.item.read_url")) {
        let fpath = URLParams.get("puter.item.path");
        if (!fpath.startsWith("~/") && !fpath.startsWith("/")) {
          fpath = `~/${fpath}`;
        }
        callback([new FSItem_default({
          name: URLParams.get("puter.item.name"),
          path: fpath,
          uid: URLParams.get("puter.item.uid"),
          readURL: URLParams.get("puter.item.read_url"),
          writeURL: URLParams.get("puter.item.write_url"),
          metadataURL: URLParams.get("puter.item.metadata_url"),
          size: URLParams.get("puter.item.size"),
          accessed: URLParams.get("puter.item.accessed"),
          modified: URLParams.get("puter.item.modified"),
          created: URLParams.get("puter.item.created")
        })]);
      }
    }
    this.#onItemsOpened = callback;
  }
  // Check if the app was launched with items
  // This is useful for apps that are launched with items (e.g. when a file is opened with the app)
  wasLaunchedWithItems() {
    const URLParams = new URLSearchParams(globalThis.location.search);
    return URLParams.has("puter.item.name") && URLParams.has("puter.item.uid") && URLParams.has("puter.item.read_url");
  }
  onLaunchedWithItems(callback) {
    if (!this.#onLaunchedWithItems) {
      let URLParams = new URLSearchParams(globalThis.location.search);
      if (URLParams.has("puter.item.name") && URLParams.has("puter.item.uid") && URLParams.has("puter.item.read_url")) {
        let fpath = URLParams.get("puter.item.path");
        if (!fpath.startsWith("~/") && !fpath.startsWith("/")) {
          fpath = `~/${fpath}`;
        }
        callback([new FSItem_default({
          name: URLParams.get("puter.item.name"),
          path: fpath,
          uid: URLParams.get("puter.item.uid"),
          readURL: URLParams.get("puter.item.read_url"),
          writeURL: URLParams.get("puter.item.write_url"),
          metadataURL: URLParams.get("puter.item.metadata_url"),
          size: URLParams.get("puter.item.size"),
          accessed: URLParams.get("puter.item.accessed"),
          modified: URLParams.get("puter.item.modified"),
          created: URLParams.get("puter.item.created")
        })]);
      }
    }
    this.#onLaunchedWithItems = callback;
  }
  requestEmailConfirmation() {
    return new Promise((resolve, reject) => {
      this.#postMessageWithCallback("requestEmailConfirmation", resolve, {});
    });
  }
  alert(message, buttons, options, callback) {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("ALERT", resolve, { message, buttons, options });
    });
  }
  openDevPaymentsAccount() {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("openDevPaymentsAccount", resolve, {});
    });
  }
  instancesOpen(callback) {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("getInstancesOpen", resolve, {});
    });
  }
  socialShare(url, message, options, callback) {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("socialShare", resolve, { url, message, options });
    });
  }
  prompt(message, placeholder, options, callback) {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("PROMPT", resolve, { message, placeholder, options });
    });
  }
  showDirectoryPicker(options, callback) {
    return new Promise((resolve, reject) => {
      if (!globalThis.open) {
        return reject("This API is not compatible in Web Workers.");
      }
      const msg_id = this.#messageID++;
      if (this.env === "app") {
        this.messageTarget?.postMessage({
          msg: "showDirectoryPicker",
          appInstanceID: this.appInstanceID,
          uuid: msg_id,
          options,
          env: this.env
        }, "*");
      } else {
        let w2 = 700;
        let h2 = 400;
        let title = "Puter: Open Directory";
        var left = screen.width / 2 - w2 / 2;
        var top = screen.height / 2 - h2 / 2;
        window.open(
          `${puter.defaultGUIOrigin}/action/show-directory-picker?embedded_in_popup=true&msg_id=${msg_id}&appInstanceID=${this.appInstanceID}&env=${this.env}&options=${JSON.stringify(options)}`,
          title,
          `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w2}, height=${h2}, top=${top}, left=${left}`
        );
      }
      this.#callbackFunctions[msg_id] = resolve;
    });
  }
  showOpenFilePicker(options, callback) {
    const undefinedOnCancel = new import_putility2.default.libs.promise.TeePromise();
    const resolveOnlyPromise = new Promise((resolve, reject) => {
      if (!globalThis.open) {
        return reject("This API is not compatible in Web Workers.");
      }
      const msg_id = this.#messageID++;
      if (this.env === "app") {
        this.messageTarget?.postMessage({
          msg: "showOpenFilePicker",
          appInstanceID: this.appInstanceID,
          uuid: msg_id,
          options: options ?? {},
          env: this.env
        }, "*");
      } else {
        let w2 = 700;
        let h2 = 400;
        let title = "Puter: Open File";
        var left = screen.width / 2 - w2 / 2;
        var top = screen.height / 2 - h2 / 2;
        window.open(
          `${puter.defaultGUIOrigin}/action/show-open-file-picker?embedded_in_popup=true&msg_id=${msg_id}&appInstanceID=${this.appInstanceID}&env=${this.env}&options=${JSON.stringify(options ?? {})}`,
          title,
          `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w2}, height=${h2}, top=${top}, left=${left}`
        );
      }
      this.#callbackFunctions[msg_id] = (maybe_result) => {
        if (maybe_result === FILE_OPEN_CANCELLED) {
          undefinedOnCancel.resolve(void 0);
          return;
        }
        undefinedOnCancel.resolve(maybe_result);
        resolve(maybe_result);
      };
    });
    resolveOnlyPromise.undefinedOnCancel = undefinedOnCancel;
    return resolveOnlyPromise;
  }
  showFontPicker(options) {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("showFontPicker", resolve, { options: options ?? {} });
    });
  }
  showColorPicker(options) {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("showColorPicker", resolve, { options: options ?? {} });
    });
  }
  requestUpgrade() {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("requestUpgrade", resolve, {});
    });
  }
  showSaveFilePicker(content, suggestedName, type) {
    const undefinedOnCancel = new import_putility2.default.libs.promise.TeePromise();
    const resolveOnlyPromise = new Promise((resolve, reject) => {
      if (!globalThis.open) {
        return reject("This API is not compatible in Web Workers.");
      }
      const msg_id = this.#messageID++;
      if (!type && Object.prototype.toString.call(content) === "[object URL]") {
        type = "url";
      }
      const url = type === "url" ? content.toString() : void 0;
      const source_path = ["move", "copy"].includes(type) ? content : void 0;
      if (this.env === "app") {
        this.messageTarget?.postMessage({
          msg: "showSaveFilePicker",
          appInstanceID: this.appInstanceID,
          content: url ? void 0 : content,
          save_type: type,
          url,
          source_path,
          suggestedName: suggestedName ?? "",
          env: this.env,
          uuid: msg_id
        }, "*");
      } else {
        window.addEventListener("message", async (e2) => {
          if (e2.data?.msg === "sendMeFileData") {
            e2.source.postMessage({
              msg: "showSaveFilePickerPopup",
              content: url ? void 0 : content,
              url: url ? url.toString() : void 0,
              suggestedName: suggestedName ?? "",
              env: this.env,
              uuid: msg_id
            }, "*");
            window.removeEventListener("message", this);
          }
        });
        let blob = new Blob([content], { type: "application/octet-stream" });
        let objectUrl = URL.createObjectURL(blob);
        let w2 = 700;
        let h2 = 400;
        let title = "Puter: Save File";
        var left = screen.width / 2 - w2 / 2;
        var top = screen.height / 2 - h2 / 2;
        window.open(
          `${puter.defaultGUIOrigin}/action/show-save-file-picker?embedded_in_popup=true&msg_id=${msg_id}&appInstanceID=${this.appInstanceID}&env=${this.env}&blobUrl=${encodeURIComponent(objectUrl)}`,
          title,
          `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w2}, height=${h2}, top=${top}, left=${left}`
        );
      }
      this.#callbackFunctions[msg_id] = (maybe_result) => {
        if (maybe_result === FILE_SAVE_CANCELLED) {
          undefinedOnCancel.resolve(void 0);
          return;
        }
        undefinedOnCancel.resolve(maybe_result);
        resolve(maybe_result);
      };
    });
    resolveOnlyPromise.undefinedOnCancel = undefinedOnCancel;
    return resolveOnlyPromise;
  }
  setWindowTitle(title, window_id, callback) {
    if (typeof window_id === "function") {
      callback = window_id;
      window_id = void 0;
    } else if (typeof window_id === "object" && window_id !== null) {
      window_id = window_id.id;
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("setWindowTitle", resolve, { new_title: title, window_id });
    });
  }
  setWindowWidth(width, window_id, callback) {
    if (typeof window_id === "function") {
      callback = window_id;
      window_id = void 0;
    } else if (typeof window_id === "object" && window_id !== null) {
      window_id = window_id.id;
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("setWindowWidth", resolve, { width, window_id });
    });
  }
  setWindowHeight(height, window_id, callback) {
    if (typeof window_id === "function") {
      callback = window_id;
      window_id = void 0;
    } else if (typeof window_id === "object" && window_id !== null) {
      window_id = window_id.id;
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("setWindowHeight", resolve, { height, window_id });
    });
  }
  setWindowSize(width, height, window_id, callback) {
    if (typeof window_id === "function") {
      callback = window_id;
      window_id = void 0;
    } else if (typeof window_id === "object" && window_id !== null) {
      window_id = window_id.id;
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("setWindowSize", resolve, { width, height, window_id });
    });
  }
  setWindowPosition(x2, y2, window_id, callback) {
    if (typeof window_id === "function") {
      callback = window_id;
      window_id = void 0;
    } else if (typeof window_id === "object" && window_id !== null) {
      window_id = window_id.id;
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("setWindowPosition", resolve, { x: x2, y: y2, window_id });
    });
  }
  setWindowY(y2, window_id, callback) {
    if (typeof window_id === "function") {
      callback = window_id;
      window_id = void 0;
    } else if (typeof window_id === "object" && window_id !== null) {
      window_id = window_id.id;
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("setWindowY", resolve, { y: y2, window_id });
    });
  }
  setWindowX(x2, window_id, callback) {
    if (typeof window_id === "function") {
      callback = window_id;
      window_id = void 0;
    } else if (typeof window_id === "object" && window_id !== null) {
      window_id = window_id.id;
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("setWindowX", resolve, { x: x2, window_id });
    });
  }
  showWindow() {
    this.#postMessageWithObject("showWindow");
  }
  hideWindow() {
    this.#postMessageWithObject("hideWindow");
  }
  toggleWindow() {
    this.#postMessageWithObject("toggleWindow");
  }
  setMenubar(spec) {
    this.#postMessageWithObject("setMenubar", spec);
  }
  requestPermission(options) {
    return new Promise((resolve) => {
      if (this.env === "app") {
        return new Promise((resolve2) => {
          this.#postMessageWithCallback("requestPermission", resolve2, { options });
        });
      } else {
        resolve(false);
      }
    });
  }
  disableMenuItem(item_id) {
    this.#postMessageWithObject("disableMenuItem", { id: item_id });
  }
  enableMenuItem(item_id) {
    this.#postMessageWithObject("enableMenuItem", { id: item_id });
  }
  setMenuItemIcon(item_id, icon) {
    this.#postMessageWithObject("setMenuItemIcon", { id: item_id, icon });
  }
  setMenuItemIconActive(item_id, icon) {
    this.#postMessageWithObject("setMenuItemIconActive", { id: item_id, icon });
  }
  setMenuItemChecked(item_id, checked) {
    this.#postMessageWithObject("setMenuItemChecked", { id: item_id, checked });
  }
  contextMenu(spec) {
    this.#postMessageWithObject("contextMenu", spec);
  }
  /**
   * Asynchronously extracts entries from DataTransferItems, like files and directories.
   *
   * @private
   * @function
   * @async
   * @param {DataTransferItemList} dataTransferItems - List of data transfer items from a drag-and-drop operation.
   * @param {Object} [options={}] - Optional settings.
   * @param {boolean} [options.raw=false] - Determines if the file path should be processed.
   * @returns {Promise<Array<File|Entry>>} - A promise that resolves to an array of File or Entry objects.
   * @throws {Error} - Throws an error if there's an EncodingError and provides information about how to solve it.
   *
   * @example
   * const items = event.dataTransfer.items;
   * const entries = await getEntriesFromDataTransferItems(items, { raw: false });
   */
  getEntriesFromDataTransferItems = async function(dataTransferItems, options = { raw: false }) {
    const checkErr = (err) => {
      if (this.getEntriesFromDataTransferItems.didShowInfo) return;
      if (err.name !== "EncodingError") return;
      this.getEntriesFromDataTransferItems.didShowInfo = true;
      const infoMsg = `${err.name} occurred within datatransfer-files-promise module
Error message: "${err.message}"
Try serving html over http if currently you are running it from the filesystem.`;
      console.warn(infoMsg);
    };
    const readFile = (entry, path2 = "") => {
      return new Promise((resolve, reject) => {
        entry.file((file) => {
          if (!options.raw) file.filepath = path2 + file.name;
          resolve(file);
        }, (err) => {
          checkErr(err);
          reject(err);
        });
      });
    };
    const dirReadEntries = (dirReader, path2) => {
      return new Promise((resolve, reject) => {
        dirReader.readEntries(async (entries2) => {
          let files2 = [];
          for (let entry of entries2) {
            const itemFiles = await getFilesFromEntry(entry, path2);
            files2 = files2.concat(itemFiles);
          }
          resolve(files2);
        }, (err) => {
          checkErr(err);
          reject(err);
        });
      });
    };
    const readDir = async (entry, path2) => {
      const dirReader = entry.createReader();
      const newPath = `${path2 + entry.name}/`;
      let files2 = [];
      let newFiles;
      do {
        newFiles = await dirReadEntries(dirReader, newPath);
        files2 = files2.concat(newFiles);
      } while (newFiles.length > 0);
      return files2;
    };
    const getFilesFromEntry = async (entry, path2 = "") => {
      if (entry === null) {
        return;
      } else if (entry.isFile) {
        const file = await readFile(entry, path2);
        return [file];
      } else if (entry.isDirectory) {
        const files2 = await readDir(entry, path2);
        files2.push(entry);
        return files2;
      }
    };
    let files = [];
    let entries = [];
    for (let i2 = 0, ii = dataTransferItems.length; i2 < ii; i2++) {
      entries.push(dataTransferItems[i2].webkitGetAsEntry());
    }
    for (let entry of entries) {
      const newFiles = await getFilesFromEntry(entry);
      files = files.concat(newFiles);
    }
    return files;
  };
  authenticateWithPuter() {
    if (this.env !== "web") {
      return;
    }
    if (this.authToken) {
      return new Promise((resolve) => {
        resolve();
      });
    }
    if (puter.puterAuthState.isPromptOpen) {
      return new Promise((resolve, reject) => {
        puter.puterAuthState.resolver = { resolve, reject };
      });
    }
    puter.puterAuthState.isPromptOpen = true;
    puter.puterAuthState.authGranted = null;
    return new Promise((resolve, reject) => {
      if (!puter.authToken) {
        const puterDialog = new PuterDialog_default(resolve, reject);
        document.body.appendChild(puterDialog);
        puterDialog.open();
      } else {
        resolve();
      }
    });
  }
  // Returns a Promise<AppConnection>
  /**
   * launchApp opens the specified app in Puter with the specified argumets.
   * @param {*} nameOrOptions - name of the app as a string, or an options object
   * @param {*} args - named parameters that will be passed to the app as arguments
   * @param {*} callback - in case you don't want to use `await` or `.then()`
   * @returns
   */
  launchApp = async function launchApp(nameOrOptions, args, callback) {
    let pseudonym = void 0;
    let file_paths = void 0;
    let items = void 0;
    let app_name = nameOrOptions;
    if (typeof app_name === "object" && app_name !== null) {
      const options = app_name;
      app_name = options.name || options.app_name;
      file_paths = options.file_paths;
      args = args || options.args;
      callback = callback || options.callback;
      pseudonym = options.pseudonym;
      items = options.items;
    }
    if (items) {
      if (!Array.isArray(items)) items = [];
      for (let i2 = 0; i2 < items.length; i2++) {
        if (items[i2] instanceof FSItem_default) {
          items[i2] = items[i2]._internalProperties.file_signature;
        }
      }
    }
    if (app_name && app_name.includes("#(as)")) {
      [app_name, pseudonym] = app_name.split("#(as)");
    }
    if (!app_name) app_name = puter.appName;
    const app_info = await this.#ipc_stub({
      method: "launchApp",
      callback,
      parameters: {
        app_name,
        file_paths,
        items,
        pseudonym,
        args
      }
    });
    return AppConnection.from(app_info, this.context);
  };
  connectToInstance = async function connectToInstance(app_name) {
    const app_info = await this.#ipc_stub({
      method: "connectToInstance",
      parameters: {
        app_name
      }
    });
    return AppConnection.from(app_info, this.context);
  };
  parentApp() {
    return this.#parentAppConnection;
  }
  createWindow(options, callback) {
    return new Promise((resolve) => {
      this.#postMessageWithCallback("createWindow", (res) => {
        resolve(res.window);
      }, { options: options ?? {} });
    });
  }
  // Menubar
  menubar() {
    document.querySelectorAll("style.puter-stylesheet").forEach(function(el) {
      el.remove();
    });
    const style = document.createElement("style");
    style.classList.add("puter-stylesheet");
    style.innerHTML = `
        .--puter-menubar {
            border-bottom: 1px solid #e9e9e9;
            background-color: #fbf9f9;
            padding-top: 3px;
            padding-bottom: 2px;
            display: inline-block;
            position: fixed;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            height: 31px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 13px;
            z-index: 9999;
        }
        
        .--puter-menubar, .--puter-menubar * {
            user-select: none;
            -webkit-user-select: none;
            cursor: default;
        }
        
        .--puter-menubar .dropdown-item-divider>hr {
            margin-top: 5px;
            margin-bottom: 5px;
            border-bottom: none;
            border-top: 1px solid #00000033;
        }
        
        .--puter-menubar>li {
            display: inline-block;
            padding: 10px 5px;
        }
        
        .--puter-menubar>li>ul {
            display: none;
            z-index: 999999999999;
            list-style: none;
            background-color: rgb(233, 233, 233);
            width: 200px;
            border: 1px solid #e4ebf3de;
            box-shadow: 0px 0px 5px #00000066;
            padding-left: 6px;
            padding-right: 6px;
            padding-top: 4px;
            padding-bottom: 4px;
            color: #333;
            border-radius: 4px;
            padding: 2px;
            min-width: 200px;
            margin-top: 5px;
            position: absolute;
        }
        
        .--puter-menubar .menubar-item {
            display: block;
            line-height: 24px;
            margin-top: -7px;
            text-align: center;
            border-radius: 3px;
            padding: 0 5px;
        }
        
        .--puter-menubar .menubar-item-open {
            background-color: rgb(216, 216, 216);
        }
        
        .--puter-menubar .dropdown-item {
            padding: 5px;
            padding: 5px 30px;
            list-style-type: none;
            user-select: none;
            font-size: 13px;
        }
        
        .--puter-menubar .dropdown-item-icon, .--puter-menubar .dropdown-item-icon-active {
            pointer-events: none;
            width: 18px;
            height: 18px;
            margin-left: -23px;
            margin-bottom: -4px;
            margin-right: 5px;
        }
        .--puter-menubar .dropdown-item-disabled .dropdown-item-icon{
            display: inline-block !important;
        }
        .--puter-menubar .dropdown-item-disabled .dropdown-item-icon-active{
            display: none !important;
        }
        .--puter-menubar .dropdown-item-icon-active {
            display:none;
        }
        .--puter-menubar .dropdown-item:hover .dropdown-item-icon{
            display: none;
        }
        .--puter-menubar .dropdown-item:hover .dropdown-item-icon-active{
            display: inline-block;
        }
        .--puter-menubar .dropdown-item-hide-icon .dropdown-item-icon, .--puter-menubar .dropdown-item-hide-icon .dropdown-item-icon-active{
            display: none !important;
        }
        .--puter-menubar .dropdown-item a {
            color: #333;
            text-decoration: none;
        }
        
        .--puter-menubar .dropdown-item:hover, .--puter-menubar .dropdown-item:hover a {
            background-color: rgb(59 134 226);
            color: white;
            border-radius: 4px;
        }
        
        .--puter-menubar .dropdown-item-disabled, .--puter-menubar .dropdown-item-disabled:hover {
            opacity: 0.5;
            background-color: transparent;
            color: initial;
            cursor: initial;
            pointer-events: none;
        }
        
        .--puter-menubar .menubar * {
            user-select: none;
        }                
        `;
    let head = document.head || document.getElementsByTagName("head")[0];
    head.appendChild(style);
    document.addEventListener("click", function(e2) {
      if (e2.target.classList.contains("dropdown-item-disabled")) {
        return false;
      }
      if (!e2.target.classList.contains("menubar-item")) {
        document.querySelectorAll(".menubar-item.menubar-item-open").forEach(function(el) {
          el.classList.remove("menubar-item-open");
        });
        document.querySelectorAll(".dropdown").forEach((el) => el.style.display = "none");
      }
    });
    window.addEventListener("blur", function(e2) {
      document.querySelectorAll(".dropdown").forEach(function(el) {
        el.style.display = "none";
      });
      document.querySelectorAll(".menubar-item.menubar-item-open").forEach((el) => el.classList.remove("menubar-item-open"));
    });
    const siblings = function(e2) {
      const siblings2 = [];
      if (!e2.parentNode) {
        return siblings2;
      }
      let sibling = e2.parentNode.firstChild;
      while (sibling) {
        if (sibling.nodeType === 1 && sibling !== e2) {
          siblings2.push(sibling);
        }
        sibling = sibling.nextSibling;
      }
      return siblings2;
    };
    document.querySelectorAll(".menubar-item").forEach((el) => el.addEventListener("mousedown", function(e2) {
      document.querySelectorAll(".dropdown").forEach(function(el2) {
        el2.style.display = "none";
      });
      document.querySelectorAll(".menubar-item.menubar-item-open").forEach(function(el2) {
        if (el2 != e2.target) {
          el2.classList.remove("menubar-item-open");
        }
      });
      if (this.classList.contains("menubar-item-open")) {
        document.querySelectorAll(".menubar-item.menubar-item-open").forEach(function(el2) {
          el2.classList.remove("menubar-item-open");
        });
      } else if (!e2.target.classList.contains("dropdown-item")) {
        this.classList.add("menubar-item-open");
        siblings(this).forEach(function(el2) {
          el2.style.display = "block";
        });
      }
    }));
    document.querySelectorAll(".--puter-menubar .menubar-item").forEach((el) => el.addEventListener("mouseover", function(e2) {
      const open_menus = document.querySelectorAll(".menubar-item.menubar-item-open");
      if (open_menus.length > 0 && open_menus[0] !== e2.target) {
        e2.target.dispatchEvent(new Event("mousedown"));
      }
    }));
  }
  on(eventName, callback) {
    super.on(eventName, callback);
    if (this.#eventNames.includes(eventName) && this.#lastBroadcastValue.has(eventName)) {
      callback(this.#lastBroadcastValue.get(eventName));
    }
  }
  #showTime = null;
  #hideTimeout = null;
  showSpinner(html) {
    if (this.#overlayActive) return;
    if (!document.getElementById("puter-spinner-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "puter-spinner-styles";
      styleSheet.textContent = `
                .puter-loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }
    
                .puter-loading-text {
                    font-family: Arial, sans-serif;
                    font-size: 16px;
                    margin-top: 10px;
                    text-align: center;
                    width: 100%;
                }
    
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
    
                .puter-loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 120px; 
                    background: #ffffff; 
                    border-radius: 10px;
                    padding: 20px;
                    min-width: 120px;
                }
            `;
      document.head.appendChild(styleSheet);
    }
    const overlay = document.createElement("div");
    overlay.classList.add("puter-loading-overlay");
    const styles = {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      zIndex: "2147483647",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      pointerEvents: "all"
    };
    Object.assign(overlay.style, styles);
    const container = document.createElement("div");
    container.classList.add("puter-loading-container");
    container.innerHTML = `
            <div class="puter-loading-spinner"></div>
            <div class="puter-loading-text">${html ?? "Working..."}</div>
        `;
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    this.#overlayActive = true;
    this.#showTime = Date.now();
    this.#overlayTimer = setTimeout(() => {
      this.#overlayTimer = null;
    }, 1e3);
  }
  hideSpinner() {
    if (!this.#overlayActive) return;
    if (this.#overlayTimer) {
      clearTimeout(this.#overlayTimer);
      this.#overlayTimer = null;
    }
    const elapsedTime = Date.now() - this.#showTime;
    const remainingTime = Math.max(0, 1200 - elapsedTime);
    if (remainingTime > 0) {
      if (this.#hideTimeout) {
        clearTimeout(this.#hideTimeout);
      }
      this.#hideTimeout = setTimeout(() => {
        this.#removeSpinner();
      }, remainingTime);
    } else {
      this.#removeSpinner();
    }
  }
  // Add private method to handle spinner removal
  #removeSpinner() {
    const overlay = document.querySelector(".puter-loading-overlay");
    if (overlay) {
      overlay.parentNode?.removeChild(overlay);
    }
    this.#overlayActive = false;
    this.#showTime = null;
    this.#hideTimeout = null;
  }
  isWorkingActive() {
    return this.#overlayActive;
  }
  /**
   * Gets the current language/locale code (e.g., 'en', 'fr', 'es').
   *
   * @returns {Promise<string>} A promise that resolves with the current language code.
   *
   * @example
   * const currentLang = await puter.ui.getLanguage();
   * console.log(`Current language: ${currentLang}`); // e.g., "Current language: fr"
   */
  getLanguage() {
    if (this.env === "gui") {
      return new Promise((resolve) => {
        resolve(window.locale);
      });
    }
    return new Promise((resolve) => {
      this.#postMessageWithCallback("getLanguage", resolve, {});
    });
  }
};
var UI_default = UI;

// node_modules/@heyputer/puter.js/src/lib/xdrpc.js
var $SCOPE = "9a9c83a4-7897-43a0-93b9-53217b84fde6";
var CallbackManager = class {
  #messageId = 1;
  constructor() {
    this.callbacks = /* @__PURE__ */ new Map();
  }
  register_callback(callback) {
    const id = this.#messageId++;
    this.callbacks.set(id, callback);
    return id;
  }
  attach_to_source(source) {
    source.addEventListener("message", (event) => {
      const { data } = event;
      if (data && typeof data === "object" && data.$SCOPE === $SCOPE) {
        const { id, args } = data;
        const callback = this.callbacks.get(id);
        if (callback) {
          callback(...args);
        }
      }
    });
  }
};
var Dehydrator = class {
  constructor({ callbackManager }) {
    this.callbackManager = callbackManager;
  }
  dehydrate(value) {
    return this.dehydrate_value_(value);
  }
  dehydrate_value_(value) {
    if (typeof value === "function") {
      const id = this.callbackManager.register_callback(value);
      return { $SCOPE, id };
    } else if (Array.isArray(value)) {
      return value.map(this.dehydrate_value_.bind(this));
    } else if (typeof value === "object" && value !== null) {
      const result = {};
      for (const key in value) {
        result[key] = this.dehydrate_value_(value[key]);
      }
      return result;
    } else {
      return value;
    }
  }
};
var Hydrator = class {
  constructor({ target }) {
    this.target = target;
  }
  hydrate(value) {
    return this.hydrate_value_(value);
  }
  hydrate_value_(value) {
    if (value && typeof value === "object" && value.$SCOPE === $SCOPE) {
      const { id } = value;
      return (...args) => {
        this.target.postMessage({ $SCOPE, id, args }, "*");
      };
    } else if (Array.isArray(value)) {
      return value.map(this.hydrate_value_.bind(this));
    } else if (typeof value === "object" && value !== null) {
      const result = {};
      for (const key in value) {
        result[key] = this.hydrate_value_(value[key]);
      }
      return result;
    }
    return value;
  }
};

// node_modules/@heyputer/puter.js/src/modules/Util.js
var Util = class {
  constructor() {
    this.rpc = new UtilRPC();
  }
};
var UtilRPC = class {
  constructor() {
    this.callbackManager = new CallbackManager();
    this.callbackManager.attach_to_source(globalThis);
  }
  getDehydrator() {
    return new Dehydrator({ callbackManager: this.callbackManager });
  }
  getHydrator({ target }) {
    return new Hydrator({ target });
  }
  registerCallback(resolve) {
    return this.callbackManager.register_callback(resolve);
  }
  send(target, id, ...args) {
    target.postMessage({ $SCOPE, id, args }, "*");
  }
};

// node_modules/@heyputer/puter.js/src/modules/Workers.js
var WorkersHandler = class {
  constructor(authToken) {
    this.authToken = authToken;
  }
  async create(workerName, filePath, appName) {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        throw "Authentication failed.";
      }
    }
    let appId;
    if (typeof appName === "string") {
      appId = (await puter.apps.list()).find((el) => el.name === appName).uid;
    }
    workerName = workerName.toLocaleLowerCase();
    let currentWorkers = await puter.kv.get("user-workers");
    if (!currentWorkers) {
      currentWorkers = {};
    }
    filePath = getAbsolutePathForApp_default(filePath);
    const driverResult = await make_driver_method(["authorization", "filePath", "workerName", "appId"], "workers", "worker-service", "create")(puter.authToken, filePath, workerName, appId);
    ;
    if (!driverResult.success) {
      throw new Error(driverResult?.errors || "Driver failed to execute, do you have the necessary permissions?");
    }
    currentWorkers[workerName] = { filePath, url: driverResult["url"], deployTime: Date.now(), createTime: Date.now() };
    await puter.kv.set("user-workers", currentWorkers);
    return driverResult;
  }
  async exec(...args) {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        throw "Authentication failed.";
      }
    }
    const req = new Request(...args);
    if (!req.headers.get("puter-auth")) {
      req.headers.set("puter-auth", puter.authToken);
    }
    return fetch(req);
  }
  async list() {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        throw "Authentication failed.";
      }
    }
    const driverCall2 = await make_driver_method([], "workers", "worker-service", "getFilePaths")();
    return driverCall2;
  }
  async get(workerName) {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        throw "Authentication failed.";
      }
    }
    workerName = workerName.toLocaleLowerCase();
    const driverCall2 = await make_driver_method(["workerName"], "workers", "worker-service", "getFilePaths")(workerName);
    return driverCall2[0];
  }
  async delete(workerName) {
    if (!puter.authToken && puter.env === "web") {
      try {
        await puter.ui.authenticateWithPuter();
      } catch (e2) {
        throw "Authentication failed.";
      }
    }
    workerName = workerName.toLocaleLowerCase();
    const driverResult = await make_driver_method(["authorization", "workerName"], "workers", "worker-service", "destroy")(puter.authToken, workerName);
    if (!driverResult.result) {
      if (!driverResult.result) {
        new Error("Worker doesn't exist");
      }
      throw new Error(driverResult?.errors || "Driver failed to execute, do you have the necessary permissions?");
    } else {
      let currentWorkers = await puter.kv.get("user-workers");
      if (!currentWorkers) {
        currentWorkers = {};
      }
      delete currentWorkers[workerName];
      await puter.kv.set("user-workers", currentWorkers);
      return true;
    }
  }
  async getLoggingHandle(workerName) {
    const loggingEndpoint = await make_driver_method([], "workers", "worker-service", "getLoggingUrl")(puter.authToken, workerName);
    const socket = new WebSocket(`${loggingEndpoint}/${puter.authToken}/${workerName}`);
    const logStreamObject = new EventTarget();
    logStreamObject.onLog = (data) => {
    };
    Object.defineProperty(logStreamObject, "start", {
      enumerable: false,
      value: async (controller) => {
        socket.addEventListener("message", (event) => {
          controller.enqueue(JSON.parse(event.data));
        });
        socket.addEventListener("close", (event) => {
          try {
            controller.close();
          } catch (e2) {
          }
        });
      }
    });
    Object.defineProperty(logStreamObject, "cancel", {
      enumerable: false,
      value: async () => {
        socket.close();
      }
    });
    socket.addEventListener("message", (event) => {
      const logEvent = new MessageEvent("log", { data: JSON.parse(event.data) });
      logStreamObject.dispatchEvent(logEvent);
      logStreamObject.onLog(logEvent);
    });
    logStreamObject.close = socket.close;
    return new Promise((res, rej) => {
      let done = false;
      socket.onopen = () => {
        done = true;
        res(logStreamObject);
      };
      socket.onerror = () => {
        if (!done) {
          rej("Failed to open logging connection");
        }
      };
    });
  }
};

// node_modules/@heyputer/puter.js/src/services/APIAccess.js
var import_putility3 = __toESM(require_putility(), 1);
var { TTopics } = import_putility3.default.traits;
var APIAccessService = class extends import_putility3.default.concepts.Service {
  static TOPICS = ["update"];
  static PROPERTIES = {
    auth_token: {
      post_set(v2) {
        this.as(TTopics).pub("update");
      }
    },
    api_origin: {
      post_set() {
        this.as(TTopics).pub("update");
      }
    }
  };
  // TODO: inconsistent! Update all dependents.
  get_api_info() {
    const self2 = this;
    const o2 = {};
    [
      ["auth_token", "auth_token"],
      ["authToken", "auth_token"],
      ["APIOrigin", "api_origin"],
      ["api_origin", "api_origin"]
    ].forEach(([k1, k2]) => {
      Object.defineProperty(o2, k1, {
        get() {
          return self2[k2];
        },
        set(v2) {
          return self2;
        }
      });
    });
    return o2;
  }
};

// node_modules/@heyputer/puter.js/src/services/Filesystem.js
var import_putility8 = __toESM(require_putility(), 1);

// node_modules/@heyputer/puter.js/src/lib/filesystem/APIFS.js
var import_putility5 = __toESM(require_putility(), 1);
var import_promise2 = __toESM(require_promise(), 1);

// node_modules/@heyputer/puter.js/src/lib/filesystem/definitions.js
var import_putility4 = __toESM(require_putility(), 1);
var TFilesystem = "TFilesystem";
var ProxyFilesystem = class extends import_putility4.default.AdvancedBase {
  static PROPERTIES = {
    delegate: () => {
    }
  };
  // TODO: constructor implied by properties
  constructor({ delegate }) {
    super();
    this.delegate = delegate;
  }
  static IMPLEMENTS = {
    [TFilesystem]: {
      stat: async function(o2) {
        return this.delegate.stat(o2);
      },
      readdir: async function(o2) {
        return this.delegate.readdir(o2);
      }
    }
  };
};

// node_modules/@heyputer/puter.js/src/lib/filesystem/APIFS.js
var PuterAPIFilesystem = class extends import_putility5.default.AdvancedBase {
  constructor({ api_info }) {
    super();
    this.api_info = api_info;
  }
  static IMPLEMENTS = {
    [TFilesystem]: {
      stat: async function(options) {
        this.ensure_auth_();
        const tp = new import_promise2.TeePromise();
        const xhr = new initXhr("/stat", this.api_info.APIOrigin, void 0, "post", "text/plain;actually=json");
        setupXhrEventHandlers(xhr, void 0, void 0, tp.resolve.bind(tp), tp.reject.bind(tp));
        let dataToSend = {};
        if (options.uid !== void 0) {
          dataToSend.uid = options.uid;
        } else if (options.path !== void 0) {
          dataToSend.path = getAbsolutePathForApp_default(options.path);
        }
        dataToSend.return_subdomains = options.returnSubdomains;
        dataToSend.return_permissions = options.returnPermissions;
        dataToSend.return_versions = options.returnVersions;
        dataToSend.return_size = options.returnSize;
        dataToSend.auth_token = this.api_info.authToken;
        xhr.send(JSON.stringify(dataToSend));
        return await tp;
      },
      readdir: async function(options) {
        this.ensure_auth_();
        const tp = new import_promise2.TeePromise();
        const xhr = new initXhr("/readdir", this.api_info.APIOrigin, void 0, "post", "text/plain;actually=json");
        setupXhrEventHandlers(xhr, void 0, void 0, tp.resolve.bind(tp), tp.reject.bind(tp));
        xhr.send(JSON.stringify({ path: getAbsolutePathForApp_default(options.path), auth_token: this.api_info.authToken }));
        return await tp;
      }
    }
  };
  ensure_auth_() {
    if (!this.api_info.authToken && puter.env === "web") {
      try {
        this.ui.authenticateWithPuter();
      } catch (e2) {
        throw new Error("Authentication failed.");
      }
    }
  }
};

// node_modules/@heyputer/puter.js/src/lib/filesystem/CacheFS.js
var import_putility6 = __toESM(require_putility(), 1);
var import_promise3 = __toESM(require_promise(), 1);
var TTL = 5 * 1e3;
var CacheFS = class extends import_putility6.default.AdvancedBase {
  static PROPERTIES = {
    assocs_path_: () => ({}),
    assocs_uuid_: () => ({}),
    entries: () => ({})
  };
  get_entry_ei(external_identifier) {
    if (Array.isArray(external_identifier)) {
      for (const ei of external_identifier) {
        const entry = this.get_entry_ei(ei);
        if (entry) return entry;
      }
      return;
    }
    console.log("GET ENTRY EI", external_identifier);
    const internal_identifier = this.assocs_path_[external_identifier] || this.assocs_uuid_[external_identifier] || external_identifier;
    if (!internal_identifier) {
      return;
    }
    return this.entries[internal_identifier];
  }
  add_entry({ id } = {}) {
    const internal_identifier = id ?? uuidv4();
    const entry = {
      id: internal_identifier,
      stat_has: {},
      stat_exp: 0,
      locks: {
        stat: new import_promise3.RWLock(),
        members: new import_promise3.RWLock()
      }
    };
    this.entries[internal_identifier] = entry;
    return entry;
  }
  assoc_path(path2, internal_identifier) {
    console.log("ASSOC PATH", path2, internal_identifier);
    this.assocs_path_[path2] = internal_identifier;
  }
  assoc_uuid(uuid, internal_identifier) {
    if (uuid === internal_identifier) return;
    this.assocs_uuid_[uuid] = internal_identifier;
  }
};
var CachedFilesystem = class extends ProxyFilesystem {
  constructor(o2) {
    super(o2);
    this.cacheFS = new CacheFS();
  }
  static IMPLEMENTS = {
    [TFilesystem]: {
      stat: async function(o2) {
        let cent = this.cacheFS.get_entry_ei(o2.path ?? o2.uid);
        const modifiers = [
          "subdomains",
          "permissions",
          "versions",
          "size"
        ];
        let values_requested = {};
        for (const mod of modifiers) {
          const optionsKey = `return${mod.charAt(0).toUpperCase()}${mod.slice(1)}`;
          if (!o2[optionsKey]) continue;
          values_requested[mod] = true;
        }
        const satisfactory_cache = (cent2) => {
          for (const mod of modifiers) {
            if (!values_requested[mod]) continue;
            if (!cent2.stat_has[mod]) {
              return false;
            }
          }
          return true;
        };
        let cached_stat;
        if (cent && cent.stat && cent.stat_exp > Date.now()) {
          const l3 = await cent.locks.stat.rlock();
          if (satisfactory_cache(cent)) {
            cached_stat = cent.stat;
          }
          l3.unlock();
        }
        if (cached_stat) {
          console.log("CACHE HIT");
          return cached_stat;
        }
        console.log("CACHE MISS");
        let l2;
        if (cent) {
          l2 = await cent.locks.stat.wlock();
        }
        console.log("DOING THE STAT", o2);
        const entry = await this.delegate.stat(o2);
        let cent_replaced = !!cent;
        cent = this.cacheFS.get_entry_ei([entry.uid, entry.path]);
        if (cent) {
          if (cent_replaced) l2.unlock();
          l2 = await cent.locks.stat.wlock();
        }
        if (!cent) {
          cent = this.cacheFS.add_entry({ id: entry.uid });
          this.cacheFS.assoc_path(entry.path, cent.id);
          this.cacheFS.assoc_uuid(entry.uid, cent.id);
          l2 = await cent.locks.stat.wlock();
        }
        cent.stat = entry;
        cent.stat_has = __spreadValues({}, values_requested);
        cent.stat_exp = Date.now() + TTL;
        l2.unlock();
        console.log("RETRUNING THE ENTRY", entry);
        return entry;
      },
      readdir: async function(o2) {
        let cent = this.cacheFS.get_entry_ei([o2.path, o2.uid]);
        console.log("CENT", cent, o2);
        let stats = null;
        if (cent && cent.members && cent.members_exp > Date.now()) {
          console.log("MEMBERS", cent.members);
          stats = [];
          const l3 = await cent.locks.stat.rlock();
          for (const id of cent.members) {
            const member = this.cacheFS.get_entry_ei(id);
            if (!member || !member.stat || member.stat_exp <= Date.now()) {
              console.log("NO MEMBER OR STAT", member);
              stats = null;
              break;
            }
            console.log("member", member);
            if (!o2.no_assocs && !member.stat_has.subdomains) {
              stats = null;
              break;
            }
            if (!o2.no_assocs && !member.stat_has.apps) {
              stats = null;
              break;
            }
            if (!o2.no_thumbs && !member.stat_has.thumbnail) {
              stats = null;
              break;
            }
            console.log("PUSHING", member.stat);
            stats.push(member.stat);
          }
          l3.unlock();
        }
        console.log("STATS????", stats);
        if (stats) {
          return stats;
        }
        let l2;
        if (cent) {
          l2 = await cent.locks.members.wlock();
        }
        const entries = await this.delegate.readdir(o2);
        if (!cent) {
          cent = this.cacheFS.add_entry(o2.uid ? { id: o2.uid } : {});
          if (o2.path) this.cacheFS.assoc_path(o2.path, cent.id);
          l2 = await cent.locks.members.wlock();
        }
        let cent_ids = [];
        for (const entry of entries) {
          let entry_cent = this.cacheFS.get_entry_ei([entry.path, entry.uid]);
          if (!entry_cent) {
            entry_cent = this.cacheFS.add_entry({ id: entry.uid });
            this.cacheFS.assoc_path(entry.path, entry.uid);
          }
          cent_ids.push(entry_cent.id);
          entry_cent.stat = entry;
          entry_cent.stat_has = {
            subdomains: !o2.no_assocs,
            apps: !o2.no_assocs,
            thumbnail: !o2.no_thumbs
          };
          entry_cent.stat_exp = Date.now() + 1e3 * 3;
        }
        cent.members = [];
        for (const id of cent_ids) {
          cent.members.push(id);
        }
        cent.members_exp = Date.now() + TTL;
        l2.unlock();
        console.log("CACHE ENTRY?", cent);
        return entries;
      }
    }
  };
};

// node_modules/@heyputer/puter.js/src/lib/filesystem/PostMessageFS.js
var import_putility7 = __toESM(require_putility(), 1);
var example = {
  "id": "f485f1ba-de07-422c-8c4b-c2da057d4a44",
  "uid": "f485f1ba-de07-422c-8c4b-c2da057d4a44",
  "is_dir": true,
  "immutable": true,
  "name": "Test"
};
var PostMessageFilesystem = class extends import_putility7.default.AdvancedBase {
  constructor({ rpc, messageTarget }) {
    super();
    this.rpc = rpc;
    this.messageTarget = messageTarget;
  }
  static IMPLEMENTS = {
    [TFilesystem]: {
      stat: async function(o2) {
        return example;
      },
      readdir: async function(o2) {
        const tp = new import_putility7.default.libs.promise.TeePromise();
        const $callback = this.rpc.registerCallback((result) => {
          tp.resolve(result);
        });
        this.messageTarget.postMessage({
          $: "puter-fs",
          $callback,
          op: "readdir",
          args: o2
        }, "*");
        return await tp;
      }
    }
  };
};

// node_modules/@heyputer/puter.js/src/services/Filesystem.js
var FilesystemService = class extends import_putility8.default.concepts.Service {
  static PROPERTIES = {
    // filesystem:
  };
  static DEPENDS = ["api-access"];
  static HOOKS = [
    {
      service: "api-access",
      event: "update",
      description: `
                re-initialize the socket connection whenever the
                authentication token or API origin is changed.
            `,
      async do() {
        this.initializeSocket();
      }
    }
  ];
  _init() {
    const env = this._.context.env;
    if (env === "app") {
      this.init_top_fs_();
    } else {
      this.init_top_fs_();
    }
    this.initializeSocket();
  }
  init_app_fs_() {
    this.fs_nocache_ = new PostMessageFilesystem({
      messageTarget: globalThis.parent,
      rpc: this._.context.util.rpc
    }).as(TFilesystem);
    this.filesystem = this.fs_nocache_;
  }
  init_top_fs_() {
    const api_info = this._.context.services.get("api-access").get_api_info();
    this.fs_nocache_ = new PuterAPIFilesystem({ api_info }).as(TFilesystem);
    this.fs_cache_ = new CachedFilesystem({ delegate: this.fs_nocache_ }).as(TFilesystem);
    this.fs_proxy_ = new ProxyFilesystem({ delegate: this.fs_nocache_ });
    this.filesystem = this.fs_proxy_.as(TFilesystem);
  }
  cache_on() {
    this.fs_proxy_.delegate = this.fs_cache_;
  }
  cache_off() {
    this.fs_proxy_.delegate = this.fs_nocache_;
  }
  async initializeSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }
    const svc_apiAccess = this._.context.services.get("api-access");
    const api_info = svc_apiAccess.get_api_info();
    if (api_info.api_origin === void 0) {
      return;
    }
    this.socket = _t(api_info.api_origin, {
      auth: { auth_token: api_info.auth_token },
      autoUnref: this._.context.env === "nodejs"
    });
    this.bindSocketEvents();
  }
  bindSocketEvents() {
    this.socket.on("connect", () => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Connected", this.socket.id);
      }
    });
    this.socket.on("disconnect", () => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Disconnected");
      }
    });
    this.socket.on("reconnect", (attempt) => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnected", this.socket.id);
      }
    });
    this.socket.on("reconnect_attempt", (attempt) => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnection Attemps", attempt);
      }
    });
    this.socket.on("reconnect_error", (error) => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnection Error", error);
      }
    });
    this.socket.on("reconnect_failed", () => {
      if (puter.debugMode) {
        console.log("FileSystem Socket: Reconnection Failed");
      }
    });
    this.socket.on("error", (error) => {
      if (puter.debugMode) {
        console.error("FileSystem Socket Error:", error);
      }
    });
  }
};

// node_modules/@heyputer/puter.js/src/services/FSRelay.js
var import_putility9 = __toESM(require_putility(), 1);
var example2 = {
  "id": "f485f1ba-de07-422c-8c4b-c2da057d4a44",
  "uid": "f485f1ba-de07-422c-8c4b-c2da057d4a44",
  "is_dir": true,
  "immutable": true,
  "name": "FromParentWindow"
};
var FSRelayService = class extends import_putility9.default.concepts.Service {
  async _init() {
    const services = this._.context.services;
    const util = this._.context.util;
    const svc_xdIncoming = services.get("xd-incoming");
    svc_xdIncoming.register_tagged_listener("puter-fs", (event) => {
      util.rpc.send(event.source, event.data.$callback, [example2]);
    });
  }
};

// node_modules/@heyputer/puter.js/src/services/NoPuterYet.js
var import_putility10 = __toESM(require_putility(), 1);
var NoPuterYetService = class extends import_putility10.default.concepts.Service {
  _init() {
    if (!globalThis.when_puter_happens) return;
    if (puter && puter.env !== "gui") return;
    if (!Array.isArray(globalThis.when_puter_happens)) {
      globalThis.when_puter_happens = [globalThis.when_puter_happens];
    }
    for (const fn of globalThis.when_puter_happens) {
      fn({ context: this._.context });
    }
  }
};

// node_modules/@heyputer/puter.js/src/services/XDIncoming.js
var import_putility11 = __toESM(require_putility(), 1);
var TeePromise4 = import_putility11.default.libs.promise.TeePromise;
var XDIncomingService = class extends import_putility11.default.concepts.Service {
  _construct() {
    this.filter_listeners_ = [];
    this.tagged_listeners_ = {};
  }
  _init() {
    globalThis.addEventListener("message", async (event) => {
      for (const fn of this.filter_listeners_) {
        const tp = new TeePromise4();
        fn(event, tp);
        if (await tp) return;
      }
      const data = event.data;
      if (!data) return;
      const tag = data.$;
      if (!tag) return;
      if (!this.tagged_listeners_[tag]) return;
      for (const fn of this.tagged_listeners_[tag]) {
        fn({ data, source: event.source });
      }
    });
  }
  register_filter_listener(fn) {
    this.filter_listeners_.push(fn);
  }
  register_tagged_listener(tag, fn) {
    if (!this.tagged_listeners_[tag]) {
      this.tagged_listeners_[tag] = [];
    }
    this.tagged_listeners_[tag].push(fn);
  }
};

// node_modules/@heyputer/puter.js/src/index.js
var PROD_ORIGIN = "https://puter.com";
var puterInit = (function() {
  "use strict";
  class Puter {
    // The environment that the SDK is running in. Can be 'gui', 'app' or 'web'.
    // 'gui' means the SDK is running in the Puter GUI, i.e. Puter.com.
    // 'app' means the SDK is running as a Puter app, i.e. within an iframe in the Puter GUI.
    // 'web' means the SDK is running in a 3rd-party website.
    env;
    #defaultAPIOrigin = "https://api.puter.com";
    #defaultGUIOrigin = "https://puter.com";
    get defaultAPIOrigin() {
      return globalThis.PUTER_API_ORIGIN || globalThis.PUTER_API_ORIGIN_ENV || this.#defaultAPIOrigin;
    }
    set defaultAPIOrigin(v2) {
      this.#defaultAPIOrigin = v2;
    }
    get defaultGUIOrigin() {
      return globalThis.PUTER_ORIGIN || globalThis.PUTER_ORIGIN_ENV || this.#defaultGUIOrigin;
    }
    set defaultGUIOrigin(v2) {
      this.#defaultGUIOrigin = v2;
    }
    // An optional callback when the user is authenticated. This can be set by the app using the SDK.
    onAuth;
    /**
     * State object to keep track of the authentication request status.
     * This is used to prevent multiple authentication popups from showing up by different parts of the app.
     */
    puterAuthState = {
      isPromptOpen: false,
      authGranted: null,
      resolver: null
    };
    // Holds the unique app instance ID that is provided by the host environment
    appInstanceID;
    // Holds the unique app instance ID for the parent (if any), which is provided by the host environment
    parentInstanceID;
    // Expose the FSItem class
    static FSItem = FSItem_default;
    // Event handling properties
    eventHandlers = {};
    // debug flag
    debugMode = false;
    /**
     * Puter.js Modules
     *
     * These are the modules you see on docs.puter.com; for example:
     * - puter.fs
     * - puter.kv
     * - puter.ui
     *
     * initSubmodules is called from the constructor of this class.
     */
    initSubmodules = function() {
      this.util = new Util();
      this.registerModule("auth", Auth_default);
      this.registerModule("os", OS_default);
      this.registerModule("fs", PuterJSFileSystemModule);
      this.registerModule("ui", UI_default, {
        appInstanceID: this.appInstanceID,
        parentInstanceID: this.parentInstanceID
      });
      this.registerModule("hosting", Hosting_default);
      this.registerModule("apps", Apps_default);
      this.registerModule("ai", AI_default);
      this.registerModule("kv", KV_default);
      this.registerModule("threads", Threads);
      this.registerModule("perms", Perms);
      this.registerModule("drivers", Drivers_default);
      this.registerModule("debug", Debug);
      this.path = path_default;
    };
    // --------------------------------------------
    // Constructor
    // --------------------------------------------
    constructor() {
      this._cache = new import_kv.default({ dbName: "puter_cache" });
      this._opscache = new import_kv.default();
      this.modules_ = [];
      const context = new import_putility12.default.libs.context.Context().follow(this, ["env", "util", "authToken", "APIOrigin", "appID"]);
      context.puter = this;
      this.services = new import_putility12.default.system.ServiceManager({ context });
      this.context = context;
      context.services = this.services;
      let URLParams = new URLSearchParams(globalThis.location?.search);
      if (URLParams.has("puter.app_instance_id")) {
        this.env = "app";
      } else if (globalThis.puter_gui_enabled === true) {
        this.env = "gui";
      } else if (globalThis.WorkerGlobalScope) {
        if (globalThis.ServiceWorkerGlobalScope) {
          this.env = "service-worker";
          if (!globalThis.XMLHttpRequest) {
            globalThis.XMLHttpRequest = xhrshim_default;
          }
          if (!globalThis.location) {
            globalThis.location = new URL("https://puter.site/");
          }
        } else {
          this.env = "web-worker";
        }
        if (!globalThis.localStorage) {
          globalThis.localStorage = localStorage_default;
        }
      } else if (globalThis.process) {
        this.env = "nodejs";
        if (!globalThis.localStorage) {
          globalThis.localStorage = localStorage_default;
        }
        if (!globalThis.XMLHttpRequest) {
          globalThis.XMLHttpRequest = xhrshim_default;
        }
        if (!globalThis.location) {
          globalThis.location = new URL("https://nodejs.puter.site/");
        }
        if (!globalThis.addEventListener) {
          globalThis.addEventListener = () => {
          };
        }
      } else {
        this.env = "web";
      }
      if (this.env !== "gui") {
        let hostname = location.hostname.replace(/\.$/, "");
        const url = new URL(PROD_ORIGIN);
        const gui_hostname = url.hostname;
        if (hostname === gui_hostname) {
          this.env = "gui";
        }
      }
      if (URLParams.has("puter.args")) {
        this.args = JSON.parse(decodeURIComponent(URLParams.get("puter.args")));
      } else {
        this.args = {};
      }
      if (URLParams.has("puter.app_instance_id")) {
        this.appInstanceID = decodeURIComponent(URLParams.get("puter.app_instance_id"));
      }
      if (URLParams.has("puter.parent_instance_id")) {
        this.parentInstanceID = decodeURIComponent(URLParams.get("puter.parent_instance_id"));
      }
      if (URLParams.has("puter.app.id")) {
        this.appID = decodeURIComponent(URLParams.get("puter.app.id"));
      }
      if (URLParams.has("puter.app.name")) {
        this.appName = decodeURIComponent(URLParams.get("puter.app.name"));
      }
      if (this.appID) {
        this.appDataPath = `~/AppData/${this.appID}`;
      }
      this.APIOrigin = this.defaultAPIOrigin;
      if (URLParams.has("puter.api_origin") && this.env === "app") {
        this.APIOrigin = decodeURIComponent(URLParams.get("puter.api_origin"));
      } else if (URLParams.has("puter.domain") && this.env === "app") {
        this.APIOrigin = `https://api.${URLParams.get("puter.domain")}`;
      }
      let logger = new import_putility12.default.libs.log.ConsoleLogger();
      logger = new import_putility12.default.libs.log.CategorizedToggleLogger({ delegate: logger });
      const cat_logger = logger;
      this.logger = new import_putility12.default.libs.log.LoggerFacade({
        impl: logger,
        cat: cat_logger
      });
      this.apiCallLogger = new APICallLogger_default({
        enabled: false
        // Disabled by default
      });
      this.services.register("no-puter-yet", NoPuterYetService);
      this.services.register("filesystem", FilesystemService);
      this.services.register("api-access", APIAccessService);
      this.services.register("xd-incoming", XDIncomingService);
      if (this.env !== "app") {
        this.services.register("fs-relay", FSRelayService);
      }
      (async () => {
        await this.services.wait_for_init(["api-access"]);
        const svc_apiAccess = this.services.get("api-access");
        svc_apiAccess.auth_token = this.authToken;
        svc_apiAccess.api_origin = this.APIOrigin;
        [
          ["authToken", "auth_token"],
          ["APIOrigin", "api_origin"]
        ].forEach(([k1, k2]) => {
          Object.defineProperty(this, k1, {
            get() {
              return svc_apiAccess[k2];
            },
            set(v2) {
              svc_apiAccess[k2] = v2;
            }
          });
        });
      })();
      if (this.env === "gui") {
        this.authToken = window.auth_token;
        this.initSubmodules();
      } else if (this.env === "app") {
        this.authToken = decodeURIComponent(URLParams.get("puter.auth.token"));
        this.initSubmodules();
        try {
          if (localStorage.getItem("puter.auth.token")) {
            this.setAuthToken(localStorage.getItem("puter.auth.token"));
          }
          if (localStorage.getItem("puter.app.id")) {
            this.setAppID(localStorage.getItem("puter.app.id"));
          }
        } catch (error) {
          console.error("Error accessing localStorage:", error);
        }
      } else if (this.env === "web") {
        this.initSubmodules();
        try {
          if (localStorage.getItem("puter.auth.token")) {
            this.setAuthToken(localStorage.getItem("puter.auth.token"));
          }
          if (localStorage.getItem("puter.app.id")) {
            this.setAppID(localStorage.getItem("puter.app.id"));
          }
        } catch (error) {
          console.error("Error accessing localStorage:", error);
        }
      } else if (this.env === "web-worker" || this.env === "service-worker" || this.env === "nodejs") {
        this.initSubmodules();
      }
      (async () => {
        await this.services.wait_for_init(["api-access"]);
        const whoami = await this.auth.whoami();
        logger = new import_putility12.default.libs.log.PrefixLogger({
          delegate: logger,
          prefix: `[${whoami?.app_name ?? this.appInstanceID ?? "HOST"}] `
        });
        this.logger.impl = logger;
      })();
      this.lock_rao_ = new import_putility12.default.libs.promise.Lock();
      this.p_can_request_rao_ = new import_putility12.default.libs.promise.TeePromise();
      this.rao_requested_ = false;
      (async () => {
        await this.services.wait_for_init(["api-access"]);
        this.p_can_request_rao_.resolve();
      })();
      this.net = {
        generateWispV1URL: async () => {
          const { token: wispToken, server: wispServer } = await (await fetch(`${this.APIOrigin}/wisp/relay-token/create`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.authToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({})
          })).json();
          return `${wispServer}/${wispToken}/`;
        },
        Socket: PSocket,
        tls: {
          TLSSocket: PTLSSocket
        },
        fetch: pFetch
      };
      this.workers = new WorkersHandler(this.authToken);
      this.initNetworkMonitoring();
    }
    /**
     * @internal
     * Makes a request to `/rao`. This method aquires a lock to prevent
     * multiple requests, and is effectively idempotent.
     */
    async request_rao_() {
      await this.p_can_request_rao_;
      if (this.env === "gui") {
        return;
      }
      await this.lock_rao_.acquire();
      if (this.rao_requested_) {
        this.lock_rao_.release();
        return;
      }
      let had_error = false;
      try {
        const resp = await fetch(`${this.APIOrigin}/rao`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            Origin: location.origin
            // This is ignored in the browser but needed for workers and nodejs
          }
        });
        return await resp.json();
      } catch (e2) {
        had_error = true;
        console.error(e2);
      } finally {
        this.lock_rao_.release();
      }
      if (!had_error) {
        this.rao_requested_ = true;
      }
    }
    registerModule(name, cls, parameters = {}) {
      const instance = new cls(this.context, parameters);
      this.modules_.push(name);
      this[name] = instance;
      if (instance._init) instance._init({ puter: this });
    }
    updateSubmodules() {
      for (const name of this.modules_) {
        if (!this[name]) continue;
        this[name]?.setAuthToken?.(this.authToken);
        this[name]?.setAPIOrigin?.(this.APIOrigin);
      }
    }
    setAppID = function(appID) {
      try {
        localStorage.setItem("puter.app.id", appID);
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      }
      this.appID = appID;
    };
    setAuthToken = function(authToken) {
      this.authToken = authToken;
      if (this.env === "web" || this.env === "app") {
        try {
          localStorage.setItem("puter.auth.token", authToken);
        } catch (error) {
          console.error("Error accessing localStorage:", error);
        }
      }
      if (this.env === "gui") {
        setInterval(puter2.checkAndUpdateGUIFScache, 1e4);
      }
      this.updateSubmodules();
      this.request_rao_();
      this.getUser().then((user) => {
        this.whoami = user;
      });
    };
    setAPIOrigin = function(APIOrigin) {
      this.APIOrigin = APIOrigin;
      this.updateSubmodules();
    };
    resetAuthToken = function() {
      this.authToken = null;
      if (this.env === "web" || this.env === "app") {
        try {
          localStorage.removeItem("puter.auth.token");
        } catch (error) {
          console.error("Error accessing localStorage:", error);
        }
      }
      this.updateSubmodules();
    };
    exit = function(statusCode = 0) {
      if (statusCode && typeof statusCode !== "number") {
        console.warn("puter.exit() requires status code to be a number. Treating it as 1");
        statusCode = 1;
      }
      globalThis.parent.postMessage({
        msg: "exit",
        appInstanceID: this.appInstanceID,
        statusCode
      }, "*");
    };
    /**
     * A function that generates a domain-safe name by combining a random adjective, a random noun, and a random number (between 0 and 9999).
     * The result is returned as a string with components separated by hyphens.
     * It is useful when you need to create unique identifiers that are also human-friendly.
     *
     * @param {string} [separateWith='-'] - The character to use to separate the components of the generated name.
     * @returns {string} A unique, hyphen-separated string comprising of an adjective, a noun, and a number.
     *
     */
    randName = function(separateWith = "-") {
      const first_adj = [
        "helpful",
        "sensible",
        "loyal",
        "honest",
        "clever",
        "capable",
        "calm",
        "smart",
        "genius",
        "bright",
        "charming",
        "creative",
        "diligent",
        "elegant",
        "fancy",
        "colorful",
        "avid",
        "active",
        "gentle",
        "happy",
        "intelligent",
        "jolly",
        "kind",
        "lively",
        "merry",
        "nice",
        "optimistic",
        "polite",
        "quiet",
        "relaxed",
        "silly",
        "victorious",
        "witty",
        "young",
        "zealous",
        "strong",
        "brave",
        "agile",
        "bold"
      ];
      const nouns = [
        "street",
        "roof",
        "floor",
        "tv",
        "idea",
        "morning",
        "game",
        "wheel",
        "shoe",
        "bag",
        "clock",
        "pencil",
        "pen",
        "magnet",
        "chair",
        "table",
        "house",
        "dog",
        "room",
        "book",
        "car",
        "cat",
        "tree",
        "flower",
        "bird",
        "fish",
        "sun",
        "moon",
        "star",
        "cloud",
        "rain",
        "snow",
        "wind",
        "mountain",
        "river",
        "lake",
        "sea",
        "ocean",
        "island",
        "bridge",
        "road",
        "train",
        "plane",
        "ship",
        "bicycle",
        "horse",
        "elephant",
        "lion",
        "tiger",
        "bear",
        "zebra",
        "giraffe",
        "monkey",
        "snake",
        "rabbit",
        "duck",
        "goose",
        "penguin",
        "frog",
        "crab",
        "shrimp",
        "whale",
        "octopus",
        "spider",
        "ant",
        "bee",
        "butterfly",
        "dragonfly",
        "ladybug",
        "snail",
        "camel",
        "kangaroo",
        "koala",
        "panda",
        "piglet",
        "sheep",
        "wolf",
        "fox",
        "deer",
        "mouse",
        "seal",
        "chicken",
        "cow",
        "dinosaur",
        "puppy",
        "kitten",
        "circle",
        "square",
        "garden",
        "otter",
        "bunny",
        "meerkat",
        "harp"
      ];
      return first_adj[Math.floor(Math.random() * first_adj.length)] + separateWith + nouns[Math.floor(Math.random() * nouns.length)] + separateWith + Math.floor(Math.random() * 1e4);
    };
    getUser = function(...args) {
      let options;
      if (typeof args[0] === "object" && args[0] !== null) {
        options = args[0];
      } else {
        options = {
          success: args[0],
          error: args[1]
        };
      }
      return new Promise((resolve, reject) => {
        const xhr = initXhr("/whoami", this.APIOrigin, this.authToken, "get");
        setupXhrEventHandlers(xhr, options.success, options.error, resolve, reject);
        xhr.send();
      });
    };
    print = function(...args) {
      let options = {};
      if (args.length > 0 && typeof args[args.length - 1] === "object" && args[args.length - 1] !== null && ("escapeHTML" in args[args.length - 1] || "code" in args[args.length - 1])) {
        options = args.pop();
      }
      for (let arg of args) {
        if ((options.escapeHTML === true || options.code === true) && typeof arg === "string") {
          arg = arg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }
        if (options.code === true) {
          arg = `<code><pre>${arg}</pre></code>`;
        }
        document.body.innerHTML += arg;
      }
    };
    /**
     * Configures API call logging settings
     * @param {Object} config - Configuration options for API call logging
     * @param {boolean} config.enabled - Enable/disable API call logging
      * @param {boolean} config.enabled - Enable/disable API call logging
     */
    configureAPILogging = function(config = {}) {
      if (this.apiCallLogger) {
        this.apiCallLogger.updateConfig(config);
      }
      return this;
    };
    /**
     * Enables API call logging with optional configuration
     * @param {Object} config - Optional configuration to apply when enabling
     */
    enableAPILogging = function(config = {}) {
      if (this.apiCallLogger) {
        this.apiCallLogger.updateConfig(__spreadProps(__spreadValues({}, config), { enabled: true }));
      }
      return this;
    };
    /**
     * Disables API call logging
     */
    disableAPILogging = function() {
      if (this.apiCallLogger) {
        this.apiCallLogger.disable();
      }
      return this;
    };
    /**
     * Initializes network connectivity monitoring to purge cache when connection is lost
     * @private
     */
    initNetworkMonitoring = function() {
      if (typeof globalThis.navigator === "undefined" || typeof globalThis.addEventListener !== "function") {
        return;
      }
      let wasOnline = navigator.onLine;
      const handleNetworkChange = () => {
        const isOnline = navigator.onLine;
        if (wasOnline && !isOnline) {
          console.log("Network connection lost - purging cache");
          try {
            this._cache.flushall();
            console.log("Cache purged successfully");
          } catch (error) {
            console.error("Error purging cache:", error);
          }
        }
        wasOnline = isOnline;
      };
      globalThis.addEventListener("online", handleNetworkChange);
      globalThis.addEventListener("offline", handleNetworkChange);
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          setTimeout(handleNetworkChange, 100);
        });
      }
    };
    /**
     * Checks and updates the GUI FS cache for most-commonly used paths
     * @private
     */
    checkAndUpdateGUIFScache = function() {
      if (puter2.env !== "gui") return;
      if (!puter2.whoami) return;
      let username = puter2.whoami.username;
      let home_path = `/${username}`;
      let desktop_path = `/${username}/Desktop`;
      let documents_path = `/${username}/Documents`;
      let public_path = `/${username}/Public`;
      if (!puter2._cache.get(`item:${home_path}`)) {
        console.log(`/${username} item is not cached, refetching cache`);
        puter2.fs.stat(home_path);
      }
      if (!puter2._cache.get(`item:${desktop_path}`)) {
        console.log(`/${username}/Desktop item is not cached, refetching cache`);
        puter2.fs.stat(desktop_path);
      }
      if (!puter2._cache.get(`item:${documents_path}`)) {
        console.log(`/${username}/Documents item is not cached, refetching cache`);
        puter2.fs.stat(documents_path);
      }
      if (!puter2._cache.get(`item:${public_path}`)) {
        console.log(`/${username}/Public item is not cached, refetching cache`);
        puter2.fs.stat(public_path);
      }
      if (!puter2._cache.get(`readdir:${home_path}`)) {
        console.log(`/${username} is not cached, refetching cache`);
        puter2.fs.readdir(home_path);
      }
      if (!puter2._cache.get(`readdir:${desktop_path}`)) {
        console.log(`/${username}/Desktop is not cached, refetching cache`);
        puter2.fs.readdir(desktop_path);
      }
      if (!puter2._cache.get(`readdir:${documents_path}`)) {
        console.log(`/${username}/Documents is not cached, refetching cache`);
        puter2.fs.readdir(documents_path);
      }
      if (!puter2._cache.get(`readdir:${public_path}`)) {
        console.log(`/${username}/Public is not cached, refetching cache`);
        puter2.fs.readdir(public_path);
      }
    };
  }
  const puterobj = new Puter();
  return puterobj;
});
var puter2 = puterInit();
var src_default = puter2;
globalThis.puter = puter2;
puter2.tools = [];
var puterParent = puter2.ui.parentApp();
globalThis.puterParent = puterParent;
if (puterParent) {
  console.log("I have a parent, registering tools");
  puterParent.on("message", async (event) => {
    console.log("Got tool req ", event);
    if (event.$ === "requestTools") {
      console.log("Responding with tools");
      puterParent.postMessage({
        $: "providedTools",
        tools: JSON.parse(JSON.stringify(puter2.tools))
      });
    }
    if (event.$ === "executeTool") {
      console.log("xecuting tools");
      const [tool] = puter2.tools.filter((e2) => e2.function.name === event.toolName);
      const response = await tool.exec(event.parameters);
      puterParent.postMessage({
        $: "toolResponse",
        response,
        tag: event.tag
      });
    }
  });
  puterParent.postMessage({ $: "ready" });
}
globalThis.addEventListener && globalThis.addEventListener("message", async (event) => {
  if (event.origin !== puter2.defaultGUIOrigin) return;
  if (event.data.msg && event.data.msg === "requestOrigin") {
    event.source.postMessage({
      msg: "originResponse"
    }, "*");
  } else if (event.data.msg === "puter.token") {
    puter2.setAuthToken(event.data.token);
    puter2.setAppID(event.data.app_uid);
    puter2.puterAuthState.authGranted = true;
    if (puter2.onAuth && typeof puter2.onAuth === "function") {
      puter2.getUser().then((user) => {
        puter2.onAuth(user);
      });
    }
    puter2.puterAuthState.isPromptOpen = false;
    if (puter2.puterAuthState.resolver) {
      if (puter2.puterAuthState.authGranted) {
        puter2.puterAuthState.resolver.resolve();
      } else {
        puter2.puterAuthState.resolver.reject();
      }
      puter2.puterAuthState.resolver = null;
    }
    ;
  }
});
export {
  src_default as default,
  puter2 as puter
};
//# sourceMappingURL=@heyputer_puter__js.js.map
