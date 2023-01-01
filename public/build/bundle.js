
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
        return context;
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    // Some props for the app
    const width = writable(window.innerWidth);
    const height = writable(window.innerHeight);
    const pixelRatio = writable(window.devicePixelRatio);
    const context = writable();
    const canvas = writable();
    const time = writable(0);
    // A more convenient store for grabbing all game props
    const props = deriveObject({
        context,
        canvas,
        width,
        height,
        pixelRatio,
        time
    });
    const key = Symbol();
    const renderable = (render) => {
        const api = getContext(key);
        const element = {
            ready: false,
            mounted: false
        };
        if (typeof render === 'function') {
            element.render = render;
        }
        else if (render) {
            if (render.render)
                element.render = render.render;
            if (render.setup)
                element.setup = render.setup;
        }
        api.add(element);
        onMount(() => {
            element.mounted = true;
            return () => {
                api.remove(element);
                element.mounted = false;
            };
        });
    };
    function deriveObject(obj) {
        const keys = Object.keys(obj);
        const list = keys.map(key => {
            return obj[key];
        });
        return derived(list, (array) => {
            return array.reduce((dict, value, i) => {
                dict[keys[i]] = value;
                return dict;
            }, {});
        });
    }

    const showVertexLabel = writable(localStorage.getItem('showVertexLabel') === null ? true : localStorage.showVertexLabel === 'true');
    showVertexLabel.subscribe((value) => localStorage.showVertexLabel = String(value));
    const showEdgeLabel = writable(localStorage.getItem('showEdgeLabel') === null ? true : localStorage.showEdgeLabel === 'true');
    showEdgeLabel.subscribe((value) => localStorage.showEdgeLabel = String(value));
    const removeEdgesOnMoving = writable(localStorage.getItem('removeEdgesOnMoving') === null ? false : localStorage.removeEdgesOnMoving === 'true');
    removeEdgesOnMoving.subscribe((value) => localStorage.removeEdgesOnMoving = String(value));
    const isSimulationMode = writable(localStorage.getItem('isSimulationMode') === null ? false : localStorage.isSimulationMode === 'true');
    isSimulationMode.subscribe((value) => localStorage.isSimulationMode = String(value));
    const vertexColorId = writable(localStorage.getItem('vertexColorId') === null ? 0 : parseInt(localStorage.vertexColorId));
    vertexColorId.subscribe((value) => localStorage.vertexColorId = String(value));
    const edgeColorId = writable(localStorage.getItem('edgeColorId') === null ? 0 : parseInt(localStorage.edgeColorId));
    edgeColorId.subscribe((value) => localStorage.edgeColorId = String(value));

    var TRANSLATIONS = {
        language: {
            en: "Language",
            ru: "Язык",
        },
        english: {
            en: "English",
            ru: "Английский",
        },
        russian: {
            en: "Russian",
            ru: "Русский",
        },
        showMenu: {
            en: "Show Menu",
            ru: "Показать меню"
        },
        hideMenu: {
            en: "Hide menu",
            ru: "Скрыть меню"
        },
        addHint: {
            en: 'Click to add vertex.',
            ru: 'Нажмите чтобы добавить вершину.',
        },
        showHint: {
            en: 'Show Hint',
            ru: 'Показать подсказку'
        },
        about: {
            en: "About",
            ru: "О программе"
        },
        graphicalSettings: {
            en: "Graphical settings",
            ru: "Настройки просмотра",
        },
        showFPS: {
            en: "Show FPS",
            ru: "Показать FPS",
        },
        vertexColor: {
            en: "Vertex color",
            ru: "Цвет вершин",
        },
        edgeColor: {
            en: "Edge color",
            ru: "Цвет граней",
        },
        vertexSize: {
            en: "Vertex size",
            ru: "Размер вершин",
        },
        edgeSize: {
            en: "Edge size",
            ru: "Размер грани",
        },
        showVertexLabel: {
            en: "Show vertex label",
            ru: "Показывать координаты вершин",
        },
        vertexLabelSize: {
            en: "Vertex label size",
            ru: "Размер шрифта координат вершины",
        },
        vertexLabelColor: {
            en: "Vertex label color",
            ru: "Цвет шрифта координат вершины",
        },
        graphControls: {
            en: "Graph Controls",
            ru: "Управление Графом",
        },
        removeAllVertices: {
            en: "Remove all vertices",
            ru: "Удалить все вершины",
        },
        removeAllEdges: {
            en: "Remove all edges",
            ru: "Удалить все грани",
        },
        generateVertices: {
            en: "Generate vertices",
            ru: "Генерировать вершины",
        },
        verticesGenerationCount: {
            en: "Vertices generation count",
            ru: "Количество генерируемых вершин",
        },
        removeEdgesOnMoving: {
            en: "Remove edges on moving",
            ru: "Удалять грани при перемещении",
        },
        edgeLabelDistance: {
            en: "Edge label distance",
            ru: "Удалённость этикетки грани",
        },
        edgeLabelSize: {
            en: "Edge label size",
            ru: "Размер этикетки грани",
        },
        edgeLabelColor: {
            en: "Edge label color",
            ru: "Цвет этикетки грани",
        },
        showEdgeLabel: {
            en: "Show edge label",
            ru: "Показывать этекетку грани",
        },
        vertexSettings: {
            en: "Vertex Settings",
            ru: "Настройка вершин",
        },
        edgeSettings: {
            en: "Edge Settings",
            ru: "Настройка граней",
        },
        otherSettings: {
            en: "Other Settings",
            ru: "Другие Настройки",
        },
        settings: {
            en: "Settings",
            ru: "Настройки",
        },
        openVertexSettings: {
            en: "Open Vertex Settings",
            ru: "Открыть настройки вершин"
        },
        openEdgeSettings: {
            en: "Open Edge Settings",
            ru: "Открыть настройки граней"
        },
        openOtherSettings: {
            en: "Open Other Settings",
            ru: "Открыть другие настройки"
        },
        exitFullsceen: {
            en: "Exit fullscreen",
            ru: "Выйти из полноэкранного режима"
        },
        enterFullsceen: {
            en: "Enter fullscreen",
            ru: "Развернуть на весь экран"
        },
        pcbDrillingOptimazer: {
            en: "PCB drilling optimazer",
            ru: "Оптимизатор сверления печатных плат"
        },
        githubPage: {
            en: "GitHub page",
            ru: "Страница на GitHub"
        },
        developedUsingSvelte: {
            en: "Developed using svelte",
            ru: "Разработано с использованием svelte"
        },
        distance: {
            en: "Distance",
            ru: "Расстояние"
        },
        totalDistance: {
            en: "Total distance",
            ru: "Общее расстояние"
        },
        totalDistanceWithStart: {
            en: "Total distance with start",
            ru: "Общее расстояние со старта"
        },
        showTotalDistance: {
            en: "Show total distance",
            ru: "Показать общее расстояние"
        },
        connectVertices: {
            en: "Connect vertices",
            ru: "Соединить вершины"
        },
        connect: {
            en: "Connect",
            ru: "Соединить"
        },
        algorithms: {
            en: "Algorithms",
            ru: "Алгоритмы"
        },
        zAlgorithm: {
            en: "Z-algorithm",
            ru: "Z-алгоритм"
        },
        greedy: {
            en: "Greedy",
            ru: "Жадный"
        },
        spanningTreePrim: {
            en: "Prim (Spanning tree)",
            ru: "Прима (Остановое дерево)"
        },
        prim: {
            en: "Prim",
            ru: "Прима"
        },
        salesman: {
            en: "Salesman",
            ru: "Конвояжёры"
        },
        lastOrder: {
            en: "Last order",
            ru: "В текущем порядке"
        },
        simulationMode: {
            en: "Simulation mode",
            ru: "Режим симулятора"
        },
        simulationControls: {
            en: "Simulation Controls",
            ru: "Управление симулятором"
        },
        startSimulation: {
            en: "Start simulation",
            ru: "Запустить симуляцию"
        },
        moveDrillToStart: {
            en: "Move drill to start",
            ru: "Переместить дрель в начало"
        },
        simulationSettings: {
            en: "Simulation Settings",
            ru: "Настройки симуляции"
        },
        drillMoveSpeed: {
            en: "Drill move speed",
            ru: "Скорость перемещения дрели"
        },
        drillSpinSpeed: {
            en: "Drill spin speed",
            ru: "Скорость вращения дрели"
        },
        drillRotationsCount: {
            en: "Drill rotations count",
            ru: "Число вращений дрели"
        },
        drillColor: {
            en: "Drill color",
            ru: "Цвет дрели"
        },
        drillNormalColor: {
            en: "Normal color",
            ru: "Цвет нормали"
        },
        drillLabelSize: {
            en: "Drill label size",
            ru: "Размер этикетки дрели"
        },
        drillLabelColor: {
            en: "Drill label color",
            ru: "Цвет этикетки дрели"
        },
        showDrillLabel: {
            en: "Show drill label",
            ru: "Показывать этикетку дрели"
        },
        infiniteSimulation: {
            en: "Infinite simulation",
            ru: "Бесконечная симуляция"
        },
        showDrillingTime: {
            en: "Show drilling time",
            ru: "Показать время сверления"
        },
        drillingTime: {
            en: "Drilling time",
            ru: "Время сверления"
        },
        minutesShort: {
            en: "m",
            ru: "м"
        },
        secondsShort: {
            en: "s",
            ru: "с"
        },
        milliSecondsShort: {
            en: "ms",
            ru: "мс"
        },
        lastDrillingTime: {
            en: "Last drilling time",
            ru: "Последнее время сверления"
        },
        returnDrillToStart: {
            en: "Return drill to start",
            ru: "Вернуть дрель в начало"
        },
        drilledVertexColor: {
            en: "Drilled vertex color",
            ru: "Цвет высверленной вершины"
        },
        backgroundColor: {
            en: "Background color",
            ru: "Цвет фона"
        },
        zAlgorithmRowSize: {
            en: "Z-algorithm row size",
            ru: "Размер ряда для z-алгоритма"
        }
    };

    let languages = [{ option: 'en', label: 'english', id: "en_radio" },
        { option: 'ru', label: 'russian', id: "ru_radio" }];
    function getTranslation(lang, key) {
        const phrase = TRANSLATIONS[key];
        return Object.keys(phrase).includes(lang) ? phrase[lang] : phrase["en"];
    }
    const lang = writable(localStorage.getItem('lang') === null ? 'en'
        : localStorage.lang);
    lang.subscribe((value) => localStorage.lang = value);

    const COLORS = [
        "#fa1414",
        "#c88c64",
        "#50aa8c",
        "#0096e6",
        "#0a14e6",
        "#8200c8",
        "#fa96d2",
        "#828282",
        "#417530",
        "white",
        "#1a1a1a",
    ];
    const showMenu = writable(localStorage.getItem('showMenu') === null ? true : localStorage.showMenu === 'true');
    showMenu.subscribe((value) => localStorage.showMenu = String(value));
    const showFPS = writable(localStorage.getItem('showFPS') === null ? true : localStorage.showFPS === 'true');
    showFPS.subscribe((value) => localStorage.showFPS = String(value));
    const showHint = writable(localStorage.getItem('showHint') === null ? true : localStorage.showHint === 'true');
    showHint.subscribe((value) => localStorage.showHint = String(value));

    /* src\Canvas.svelte generated by Svelte v3.49.0 */

    const { console: console_1$2, window: window_1$1 } = globals;

    const file$6 = "src\\Canvas.svelte";

    function create_fragment$c(ctx) {
    	let canvas_1;
    	let canvas_1_width_value;
    	let canvas_1_height_value;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(canvas_1, "width", canvas_1_width_value = /*$width*/ ctx[5] * /*$pixelRatio*/ ctx[4]);
    			attr_dev(canvas_1, "height", canvas_1_height_value = /*$height*/ ctx[6] * /*$pixelRatio*/ ctx[4]);
    			set_style(canvas_1, "width", /*$width*/ ctx[5] + "px");
    			set_style(canvas_1, "height", /*$height*/ ctx[6] + "px");
    			add_location(canvas_1, file$6, 100, 0, 2016);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[12](canvas_1);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1$1, "resize", /*handleResize*/ ctx[7], { passive: true }, false, false),
    					listen_dev(
    						canvas_1,
    						"click",
    						prevent_default(function () {
    							if (is_function(/*onClick*/ ctx[0])) /*onClick*/ ctx[0].apply(this, arguments);
    						}),
    						false,
    						true,
    						false
    					),
    					listen_dev(
    						canvas_1,
    						"mousedown",
    						function () {
    							if (is_function(/*onMouseDown*/ ctx[1])) /*onMouseDown*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						canvas_1,
    						"touchstart",
    						function () {
    							if (is_function(/*onTouchStart*/ ctx[2])) /*onTouchStart*/ ctx[2].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (!current || dirty & /*$width, $pixelRatio*/ 48 && canvas_1_width_value !== (canvas_1_width_value = /*$width*/ ctx[5] * /*$pixelRatio*/ ctx[4])) {
    				attr_dev(canvas_1, "width", canvas_1_width_value);
    			}

    			if (!current || dirty & /*$height, $pixelRatio*/ 80 && canvas_1_height_value !== (canvas_1_height_value = /*$height*/ ctx[6] * /*$pixelRatio*/ ctx[4])) {
    				attr_dev(canvas_1, "height", canvas_1_height_value);
    			}

    			if (!current || dirty & /*$width*/ 32) {
    				set_style(canvas_1, "width", /*$width*/ ctx[5] + "px");
    			}

    			if (!current || dirty & /*$height*/ 64) {
    				set_style(canvas_1, "height", /*$height*/ ctx[6] + "px");
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[12](null);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $props;
    	let $pixelRatio;
    	let $width;
    	let $height;
    	validate_store(props, 'props');
    	component_subscribe($$self, props, $$value => $$invalidate(15, $props = $$value));
    	validate_store(pixelRatio, 'pixelRatio');
    	component_subscribe($$self, pixelRatio, $$value => $$invalidate(4, $pixelRatio = $$value));
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(5, $width = $$value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(6, $height = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, ['default']);
    	let { killLoopOnError = true } = $$props;
    	let { attributes = {} } = $$props;

    	let { onClick = ev => {
    		
    	} } = $$props;

    	let { onMouseDown = ev => {
    		
    	} } = $$props;

    	let { onTouchStart = ev => {
    		
    	} } = $$props;

    	let listeners = [];
    	let canvas$1;
    	let context$1;
    	let frame;

    	onMount(() => {
    		// prepare canvas stores
    		context$1 = canvas$1.getContext('2d', attributes);

    		canvas.set(canvas$1);
    		context.set(context$1);

    		// setup entities
    		listeners.forEach(async entity => {
    			if (entity.setup) {
    				let p = entity.setup($props);
    				if (p && p.then) await p;
    			}

    			entity.ready = true;
    		});

    		// start game loop
    		return createLoop((elapsed, dt) => {
    			time.set(elapsed);
    			render(dt);
    		});
    	});

    	setContext(key, {
    		add(fn) {
    			this.remove(fn);
    			listeners.push(fn);
    		},
    		remove(fn) {
    			const idx = listeners.indexOf(fn);
    			if (idx >= 0) listeners.splice(idx, 1);
    		}
    	});

    	function render(dt) {
    		context$1.save();
    		context$1.scale($pixelRatio, $pixelRatio);

    		listeners.forEach(entity => {
    			try {
    				if (entity.mounted && entity.ready && entity.render) {
    					entity.render($props, dt);
    				}
    			} catch(err) {
    				console.error(err);

    				if (killLoopOnError) {
    					cancelAnimationFrame(frame);
    					console.warn('Animation loop stopped due to an error');
    				}
    			}
    		});

    		context$1.restore();
    	}

    	function handleResize() {
    		width.set(window.innerWidth);
    		height.set(window.innerHeight);
    		pixelRatio.set(window.devicePixelRatio);
    	}

    	function createLoop(fn) {
    		let elapsed = 0;
    		let lastTime = performance.now();

    		(function loop() {
    			frame = requestAnimationFrame(loop);
    			const beginTime = performance.now();
    			const dt = (beginTime - lastTime) / 1000;
    			lastTime = beginTime;
    			elapsed += dt;
    			fn(elapsed, dt);
    		})();

    		return () => {
    			cancelAnimationFrame(frame);
    		};
    	}

    	const writable_props = ['killLoopOnError', 'attributes', 'onClick', 'onMouseDown', 'onTouchStart'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas$1 = $$value;
    			$$invalidate(3, canvas$1);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('killLoopOnError' in $$props) $$invalidate(8, killLoopOnError = $$props.killLoopOnError);
    		if ('attributes' in $$props) $$invalidate(9, attributes = $$props.attributes);
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('onMouseDown' in $$props) $$invalidate(1, onMouseDown = $$props.onMouseDown);
    		if ('onTouchStart' in $$props) $$invalidate(2, onTouchStart = $$props.onTouchStart);
    		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		setContext,
    		key,
    		width,
    		height,
    		canvasStore: canvas,
    		contextStore: context,
    		pixelRatio,
    		props,
    		time,
    		killLoopOnError,
    		attributes,
    		onClick,
    		onMouseDown,
    		onTouchStart,
    		listeners,
    		canvas: canvas$1,
    		context: context$1,
    		frame,
    		render,
    		handleResize,
    		createLoop,
    		$props,
    		$pixelRatio,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ('killLoopOnError' in $$props) $$invalidate(8, killLoopOnError = $$props.killLoopOnError);
    		if ('attributes' in $$props) $$invalidate(9, attributes = $$props.attributes);
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('onMouseDown' in $$props) $$invalidate(1, onMouseDown = $$props.onMouseDown);
    		if ('onTouchStart' in $$props) $$invalidate(2, onTouchStart = $$props.onTouchStart);
    		if ('listeners' in $$props) listeners = $$props.listeners;
    		if ('canvas' in $$props) $$invalidate(3, canvas$1 = $$props.canvas);
    		if ('context' in $$props) context$1 = $$props.context;
    		if ('frame' in $$props) frame = $$props.frame;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		onClick,
    		onMouseDown,
    		onTouchStart,
    		canvas$1,
    		$pixelRatio,
    		$width,
    		$height,
    		handleResize,
    		killLoopOnError,
    		attributes,
    		$$scope,
    		slots,
    		canvas_1_binding
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			killLoopOnError: 8,
    			attributes: 9,
    			onClick: 0,
    			onMouseDown: 1,
    			onTouchStart: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get killLoopOnError() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set killLoopOnError(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get attributes() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set attributes(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClick() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onMouseDown() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onMouseDown(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onTouchStart() {
    		throw new Error("<Canvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onTouchStart(value) {
    		throw new Error("<Canvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Background.svelte generated by Svelte v3.49.0 */

    function create_fragment$b(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Background', slots, ['default']);
    	let { color = null } = $$props;

    	renderable(props => {
    		const { context, width, height } = props;
    		context.clearRect(0, 0, width, height);

    		if (color) {
    			context.fillStyle = color;
    			context.fillRect(0, 0, width, height);
    		}
    	});

    	const writable_props = ['color'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Background> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ renderable, color });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, $$scope, slots];
    }

    class Background extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Background",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get color() {
    		throw new Error("<Background>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Background>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\DotGrid.svelte generated by Svelte v3.49.0 */

    function create_fragment$a(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DotGrid', slots, ['default']);
    	let { color = 'black' } = $$props;
    	let { divisions = 20 } = $$props;
    	let { pointSize = 1 } = $$props;

    	renderable(props => {
    		const { context, width, height } = props;
    		const aspect = width / height;
    		context.save();

    		for (let y = 0; y < divisions; y++) {
    			context.beginPath();

    			for (let x = 0; x < divisions; x++) {
    				const u = divisions <= 1 ? 0.5 : x / (divisions - 1);
    				const v = divisions <= 1 ? 0.5 : y / (divisions - 1);
    				let px, py;

    				if (width > height) {
    					px = u * width;
    					py = v * aspect * height;
    				} else {
    					px = u / aspect * width;
    					py = v * height;
    				}

    				context.arc(px, py, pointSize, 0, Math.PI * 2);
    			}

    			context.fillStyle = color;
    			context.fill();
    		}

    		context.restore();
    	});

    	const writable_props = ['color', 'divisions', 'pointSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DotGrid> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('divisions' in $$props) $$invalidate(1, divisions = $$props.divisions);
    		if ('pointSize' in $$props) $$invalidate(2, pointSize = $$props.pointSize);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ renderable, color, divisions, pointSize });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('divisions' in $$props) $$invalidate(1, divisions = $$props.divisions);
    		if ('pointSize' in $$props) $$invalidate(2, pointSize = $$props.pointSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, divisions, pointSize, $$scope, slots];
    }

    class DotGrid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { color: 0, divisions: 1, pointSize: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DotGrid",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get color() {
    		throw new Error("<DotGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<DotGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get divisions() {
    		throw new Error("<DotGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set divisions(value) {
    		throw new Error("<DotGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pointSize() {
    		throw new Error("<DotGrid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pointSize(value) {
    		throw new Error("<DotGrid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Text.svelte generated by Svelte v3.49.0 */

    function create_fragment$9(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Text', slots, ['default']);
    	let { show = true } = $$props;
    	let { color = 'hsl(0, 0%, 100%)' } = $$props;
    	let { align = 'center' } = $$props;
    	let { baseline = 'middle' } = $$props;
    	let { text = '' } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { fontSize = 16 } = $$props;
    	let { fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica' } = $$props;

    	renderable(props => {
    		const { context, width, height } = props;

    		if (text && show) {
    			context.fillStyle = color;
    			context.font = `${fontSize}px ${fontFamily}`;
    			context.textAlign = align;
    			context.textBaseline = baseline;
    			context.fillText(text, x, y);
    		}
    	});

    	const writable_props = [
    		'show',
    		'color',
    		'align',
    		'baseline',
    		'text',
    		'x',
    		'y',
    		'fontSize',
    		'fontFamily'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Text> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('show' in $$props) $$invalidate(0, show = $$props.show);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('align' in $$props) $$invalidate(2, align = $$props.align);
    		if ('baseline' in $$props) $$invalidate(3, baseline = $$props.baseline);
    		if ('text' in $$props) $$invalidate(4, text = $$props.text);
    		if ('x' in $$props) $$invalidate(5, x = $$props.x);
    		if ('y' in $$props) $$invalidate(6, y = $$props.y);
    		if ('fontSize' in $$props) $$invalidate(7, fontSize = $$props.fontSize);
    		if ('fontFamily' in $$props) $$invalidate(8, fontFamily = $$props.fontFamily);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		renderable,
    		show,
    		color,
    		align,
    		baseline,
    		text,
    		x,
    		y,
    		fontSize,
    		fontFamily
    	});

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(0, show = $$props.show);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('align' in $$props) $$invalidate(2, align = $$props.align);
    		if ('baseline' in $$props) $$invalidate(3, baseline = $$props.baseline);
    		if ('text' in $$props) $$invalidate(4, text = $$props.text);
    		if ('x' in $$props) $$invalidate(5, x = $$props.x);
    		if ('y' in $$props) $$invalidate(6, y = $$props.y);
    		if ('fontSize' in $$props) $$invalidate(7, fontSize = $$props.fontSize);
    		if ('fontFamily' in $$props) $$invalidate(8, fontFamily = $$props.fontFamily);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, color, align, baseline, text, x, y, fontSize, fontFamily, $$scope, slots];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			show: 0,
    			color: 1,
    			align: 2,
    			baseline: 3,
    			text: 4,
    			x: 5,
    			y: 6,
    			fontSize: 7,
    			fontFamily: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get show() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get baseline() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set baseline(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontSize() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontSize(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontFamily() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontFamily(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var epsilon = 0.000001;

    var create_1 = create;

    /**
     * Creates a new, empty vec2
     *
     * @returns {vec2} a new 2D vector
     */
    function create() {
        var out = new Float32Array(2);
        out[0] = 0;
        out[1] = 0;
        return out
    }

    var clone_1 = clone;

    /**
     * Creates a new vec2 initialized with values from an existing vector
     *
     * @param {vec2} a vector to clone
     * @returns {vec2} a new 2D vector
     */
    function clone(a) {
        var out = new Float32Array(2);
        out[0] = a[0];
        out[1] = a[1];
        return out
    }

    var fromValues_1 = fromValues;

    /**
     * Creates a new vec2 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @returns {vec2} a new 2D vector
     */
    function fromValues(x, y) {
        var out = new Float32Array(2);
        out[0] = x;
        out[1] = y;
        return out
    }

    var copy_1 = copy;

    /**
     * Copy the values from one vec2 to another
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the source vector
     * @returns {vec2} out
     */
    function copy(out, a) {
        out[0] = a[0];
        out[1] = a[1];
        return out
    }

    var set_1 = set;

    /**
     * Set the components of a vec2 to the given values
     *
     * @param {vec2} out the receiving vector
     * @param {Number} x X component
     * @param {Number} y Y component
     * @returns {vec2} out
     */
    function set(out, x, y) {
        out[0] = x;
        out[1] = y;
        return out
    }

    var equals_1 = equals;



    /**
     * Returns whether or not the vectors have approximately the same elements in the same position.
     *
     * @param {vec2} a The first vector.
     * @param {vec2} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    function equals(a, b) {
      var a0 = a[0];
      var a1 = a[1];
      var b0 = b[0];
      var b1 = b[1];
      return (Math.abs(a0 - b0) <= epsilon * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
              Math.abs(a1 - b1) <= epsilon * Math.max(1.0, Math.abs(a1), Math.abs(b1)))
    }

    var exactEquals_1 = exactEquals;

    /**
     * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
     *
     * @param {vec2} a The first vector.
     * @param {vec2} b The second vector.
     * @returns {Boolean} True if the vectors are equal, false otherwise.
     */
    function exactEquals(a, b) {
      return a[0] === b[0] && a[1] === b[1]
    }

    var add_1 = add;

    /**
     * Adds two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    function add(out, a, b) {
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        return out
    }

    var subtract_1 = subtract;

    /**
     * Subtracts vector b from vector a
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    function subtract(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        return out
    }

    var sub = subtract_1;

    var multiply_1 = multiply;

    /**
     * Multiplies two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    function multiply(out, a, b) {
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        return out
    }

    var mul = multiply_1;

    var divide_1 = divide;

    /**
     * Divides two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    function divide(out, a, b) {
        out[0] = a[0] / b[0];
        out[1] = a[1] / b[1];
        return out
    }

    var div = divide_1;

    var inverse_1 = inverse;

    /**
     * Returns the inverse of the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to invert
     * @returns {vec2} out
     */
    function inverse(out, a) {
      out[0] = 1.0 / a[0];
      out[1] = 1.0 / a[1];
      return out
    }

    var min_1 = min;

    /**
     * Returns the minimum of two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    function min(out, a, b) {
        out[0] = Math.min(a[0], b[0]);
        out[1] = Math.min(a[1], b[1]);
        return out
    }

    var max_1 = max;

    /**
     * Returns the maximum of two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */
    function max(out, a, b) {
        out[0] = Math.max(a[0], b[0]);
        out[1] = Math.max(a[1], b[1]);
        return out
    }

    var rotate_1 = rotate;

    /**
     * Rotates a vec2 by an angle
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to rotate
     * @param {Number} angle the angle of rotation (in radians)
     * @returns {vec2} out
     */
    function rotate(out, a, angle) {
      var c = Math.cos(angle),
          s = Math.sin(angle);
      var x = a[0],
          y = a[1];

      out[0] = x * c - y * s;
      out[1] = x * s + y * c;

      return out
    }

    var floor_1 = floor;

    /**
     * Math.floor the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to floor
     * @returns {vec2} out
     */
    function floor(out, a) {
      out[0] = Math.floor(a[0]);
      out[1] = Math.floor(a[1]);
      return out
    }

    var ceil_1 = ceil;

    /**
     * Math.ceil the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to ceil
     * @returns {vec2} out
     */
    function ceil(out, a) {
      out[0] = Math.ceil(a[0]);
      out[1] = Math.ceil(a[1]);
      return out
    }

    var round_1 = round;

    /**
     * Math.round the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to round
     * @returns {vec2} out
     */
    function round(out, a) {
      out[0] = Math.round(a[0]);
      out[1] = Math.round(a[1]);
      return out
    }

    var scale_1 = scale;

    /**
     * Scales a vec2 by a scalar number
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to scale
     * @param {Number} b amount to scale the vector by
     * @returns {vec2} out
     */
    function scale(out, a, b) {
        out[0] = a[0] * b;
        out[1] = a[1] * b;
        return out
    }

    var scaleAndAdd_1 = scaleAndAdd;

    /**
     * Adds two vec2's after scaling the second operand by a scalar value
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @param {Number} scale the amount to scale b by before adding
     * @returns {vec2} out
     */
    function scaleAndAdd(out, a, b, scale) {
        out[0] = a[0] + (b[0] * scale);
        out[1] = a[1] + (b[1] * scale);
        return out
    }

    var distance_1 = distance;

    /**
     * Calculates the euclidian distance between two vec2's
     *
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {Number} distance between a and b
     */
    function distance(a, b) {
        var x = b[0] - a[0],
            y = b[1] - a[1];
        return Math.sqrt(x*x + y*y)
    }

    var dist = distance_1;

    var squaredDistance_1 = squaredDistance;

    /**
     * Calculates the squared euclidian distance between two vec2's
     *
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {Number} squared distance between a and b
     */
    function squaredDistance(a, b) {
        var x = b[0] - a[0],
            y = b[1] - a[1];
        return x*x + y*y
    }

    var sqrDist = squaredDistance_1;

    var length_1 = length;

    /**
     * Calculates the length of a vec2
     *
     * @param {vec2} a vector to calculate length of
     * @returns {Number} length of a
     */
    function length(a) {
        var x = a[0],
            y = a[1];
        return Math.sqrt(x*x + y*y)
    }

    var len = length_1;

    var squaredLength_1 = squaredLength;

    /**
     * Calculates the squared length of a vec2
     *
     * @param {vec2} a vector to calculate squared length of
     * @returns {Number} squared length of a
     */
    function squaredLength(a) {
        var x = a[0],
            y = a[1];
        return x*x + y*y
    }

    var sqrLen = squaredLength_1;

    var negate_1 = negate;

    /**
     * Negates the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to negate
     * @returns {vec2} out
     */
    function negate(out, a) {
        out[0] = -a[0];
        out[1] = -a[1];
        return out
    }

    var normalize_1 = normalize;

    /**
     * Normalize a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to normalize
     * @returns {vec2} out
     */
    function normalize(out, a) {
        var x = a[0],
            y = a[1];
        var len = x*x + y*y;
        if (len > 0) {
            //TODO: evaluate use of glm_invsqrt here?
            len = 1 / Math.sqrt(len);
            out[0] = a[0] * len;
            out[1] = a[1] * len;
        }
        return out
    }

    var dot_1 = dot;

    /**
     * Calculates the dot product of two vec2's
     *
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {Number} dot product of a and b
     */
    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1]
    }

    var cross_1 = cross;

    /**
     * Computes the cross product of two vec2's
     * Note that the cross product must by definition produce a 3D vector
     *
     * @param {vec3} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec3} out
     */
    function cross(out, a, b) {
        var z = a[0] * b[1] - a[1] * b[0];
        out[0] = out[1] = 0;
        out[2] = z;
        return out
    }

    var lerp_1 = lerp;

    /**
     * Performs a linear interpolation between two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @param {Number} t interpolation amount between the two inputs
     * @returns {vec2} out
     */
    function lerp(out, a, b, t) {
        var ax = a[0],
            ay = a[1];
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        return out
    }

    var random_1 = random;

    /**
     * Generates a random vector with the given scale
     *
     * @param {vec2} out the receiving vector
     * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
     * @returns {vec2} out
     */
    function random(out, scale) {
        scale = scale || 1.0;
        var r = Math.random() * 2.0 * Math.PI;
        out[0] = Math.cos(r) * scale;
        out[1] = Math.sin(r) * scale;
        return out
    }

    var transformMat2_1 = transformMat2;

    /**
     * Transforms the vec2 with a mat2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat2} m matrix to transform with
     * @returns {vec2} out
     */
    function transformMat2(out, a, m) {
        var x = a[0],
            y = a[1];
        out[0] = m[0] * x + m[2] * y;
        out[1] = m[1] * x + m[3] * y;
        return out
    }

    var transformMat2d_1 = transformMat2d;

    /**
     * Transforms the vec2 with a mat2d
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat2d} m matrix to transform with
     * @returns {vec2} out
     */
    function transformMat2d(out, a, m) {
        var x = a[0],
            y = a[1];
        out[0] = m[0] * x + m[2] * y + m[4];
        out[1] = m[1] * x + m[3] * y + m[5];
        return out
    }

    var transformMat3_1 = transformMat3;

    /**
     * Transforms the vec2 with a mat3
     * 3rd vector component is implicitly '1'
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat3} m matrix to transform with
     * @returns {vec2} out
     */
    function transformMat3(out, a, m) {
        var x = a[0],
            y = a[1];
        out[0] = m[0] * x + m[3] * y + m[6];
        out[1] = m[1] * x + m[4] * y + m[7];
        return out
    }

    var transformMat4_1 = transformMat4;

    /**
     * Transforms the vec2 with a mat4
     * 3rd vector component is implicitly '0'
     * 4th vector component is implicitly '1'
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the vector to transform
     * @param {mat4} m matrix to transform with
     * @returns {vec2} out
     */
    function transformMat4(out, a, m) {
        var x = a[0], 
            y = a[1];
        out[0] = m[0] * x + m[4] * y + m[12];
        out[1] = m[1] * x + m[5] * y + m[13];
        return out
    }

    var forEach_1 = forEach;

    var vec = create_1();

    /**
     * Perform some operation over an array of vec2s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */
    function forEach(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i];
            vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0];
            a[i+1] = vec[1];
        }
        
        return a
    }

    var limit_1 = limit;

    /**
     * Limit the magnitude of this vector to the value used for the `max`
     * parameter.
     *
     * @param  {vec2} the vector to limit
     * @param  {Number} max the maximum magnitude for the vector
     * @returns {vec2} out
     */
    function limit(out, a, max) {
      var mSq = a[0] * a[0] + a[1] * a[1];

      if (mSq > max * max) {
        var n = Math.sqrt(mSq);
        out[0] = a[0] / n * max;
        out[1] = a[1] / n * max;
      } else {
        out[0] = a[0];
        out[1] = a[1];
      }

      return out;
    }

    var glVec2 = {
      EPSILON: epsilon
      , create: create_1
      , clone: clone_1
      , fromValues: fromValues_1
      , copy: copy_1
      , set: set_1
      , equals: equals_1
      , exactEquals: exactEquals_1
      , add: add_1
      , subtract: subtract_1
      , sub: sub
      , multiply: multiply_1
      , mul: mul
      , divide: divide_1
      , div: div
      , inverse: inverse_1
      , min: min_1
      , max: max_1
      , rotate: rotate_1
      , floor: floor_1
      , ceil: ceil_1
      , round: round_1
      , scale: scale_1
      , scaleAndAdd: scaleAndAdd_1
      , distance: distance_1
      , dist: dist
      , squaredDistance: squaredDistance_1
      , sqrDist: sqrDist
      , length: length_1
      , len: len
      , squaredLength: squaredLength_1
      , sqrLen: sqrLen
      , negate: negate_1
      , normalize: normalize_1
      , dot: dot_1
      , cross: cross_1
      , lerp: lerp_1
      , random: random_1
      , transformMat2: transformMat2_1
      , transformMat2d: transformMat2d_1
      , transformMat3: transformMat3_1
      , transformMat4: transformMat4_1
      , forEach: forEach_1
      , limit: limit_1
    };

    /* src\Drill.svelte generated by Svelte v3.49.0 */

    function create_fragment$8(ctx) {
    	let text_1;
    	let t;
    	let current;

    	let text_1_props = {
    		fontSize: /*labelSize*/ ctx[0],
    		color: /*labelColor*/ ctx[1],
    		baseline: "top"
    	};

    	text_1 = new Text({ props: text_1_props, $$inline: true });
    	/*text_1_binding*/ ctx[17](text_1);
    	const default_slot_template = /*#slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	const block = {
    		c: function create() {
    			create_component(text_1.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(text_1, target, anchor);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const text_1_changes = {};
    			if (dirty & /*labelSize*/ 1) text_1_changes.fontSize = /*labelSize*/ ctx[0];
    			if (dirty & /*labelColor*/ 2) text_1_changes.color = /*labelColor*/ ctx[1];
    			text_1.$set(text_1_changes);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[15],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*text_1_binding*/ ctx[17](null);
    			destroy_component(text_1, detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function angle$1(cx, cy, ex, ey) {
    	let dy = ey - cy;
    	let dx = ex - cx;
    	return Math.atan2(dy, dx); // range (-PI, PI]
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Drill', slots, ['default']);
    	let { isShow = true } = $$props;
    	let { isShowLabel = true } = $$props;
    	let { drillColor = '#419e5a' } = $$props;
    	let { normalColor = '#ffe554' } = $$props;
    	let { size = 10 } = $$props;
    	let { thickness = 3 } = $$props;
    	let { moveTo = [0, 0] } = $$props;
    	let { isSpinEnabled = false } = $$props;
    	let { isFinished = true } = $$props;
    	let { moveSpeed = 0.1 } = $$props;
    	let { spinSpeed = 0.5 } = $$props;
    	let { rotationsCount = 50 } = $$props;
    	let { labelSize = 8 } = $$props;
    	let { labelColor = 'hsl(0, 0%, 100%)' } = $$props;
    	let text;
    	let x = 0;
    	let y = 0;
    	let velocity = [0, 0];
    	let lastNormal = [1, 0];
    	let isSpin = false;
    	let spinOffset = 0;
    	let rotationsCompleted = 0;

    	renderable((props, dt) => {
    		const { context, width, height } = props;

    		if (!isShow) {
    			text.$set({ text: '', x, y: y + size + 10 });
    			return;
    		}

    		let position = [x, y];

    		if (!isFinished) {
    			const delta = glVec2.sub([], moveTo, position);
    			glVec2.normalize(delta, delta);
    			glVec2.scaleAndAdd(velocity, velocity, delta, moveSpeed);
    		}

    		if (x < 0 || x > width) {
    			velocity = [0, 0];
    		}

    		if (y < 0 || y > height) {
    			velocity = [0, 0];
    		}

    		x += velocity[0];
    		y += velocity[1];
    		position[0] = x;
    		position[1] = y;
    		const delta = glVec2.sub([], moveTo, position);

    		if (checkDistance(delta, 0) && checkDistance(delta, 1)) {
    			stop();
    		}

    		context.lineCap = 'round';
    		context.beginPath();
    		context.fillStyle = drillColor;
    		context.strokeStyle = drillColor;
    		context.lineWidth = thickness;
    		context.arc(x, y, size, 0, Math.PI * 2);
    		context.fill();
    		let normal;

    		if (glVec2.squaredLength(velocity) > 0) {
    			normal = glVec2.normalize([], velocity);
    			lastNormal = normal;
    		} else {
    			normal = lastNormal;
    		}

    		context.fillStyle = normalColor;
    		context.strokeStyle = normalColor;
    		context.lineWidth = thickness;

    		if (isSpin) {
    			spin(context, normal);
    		} else {
    			drawNormal(context, position, normal, size);
    		}

    		// We use this to make sure the text is in sync with the character
    		// Because regular prop reactivity happens a frame too late
    		if (isShowLabel) {
    			text.$set({
    				text: `(${position.map(n => Math.round(n)).join(', ')})`,
    				x,
    				y: y + size + 10
    			});
    		} else {
    			text.$set({ text: '', x, y: y + size + 10 });
    		}
    	});

    	function drawNormal(context, position, normal, length) {
    		const point = glVec2.scaleAndAdd([], position, normal, length);
    		context.beginPath();
    		context.moveTo(position[0], position[1]);
    		context.lineTo(point[0], point[1]);
    		context.stroke();
    	}

    	function stop() {
    		x = moveTo[0];
    		y = moveTo[1];
    		velocity = [0, 0];

    		if (isSpinEnabled) {
    			if (!isFinished) {
    				isSpin = true;
    			}
    		} else {
    			$$invalidate(3, isFinished = true);
    		}
    	}

    	function spin(context, normal) {
    		let theta = angle$1(0, 0, normal[0], normal[1]) + spinOffset;
    		let resultX = Math.cos(theta);
    		let resultY = Math.sin(theta);
    		drawNormal(context, [x, y], glVec2.normalize([], [resultX, resultY]), size);
    		let isFinishingRotation = spinOffset + spinSpeed - 2 * Math.PI > 0.01;

    		if (!isFinishingRotation) {
    			spinOffset += spinSpeed;
    		} else {
    			spinOffset = 0;
    			rotationsCompleted++;

    			if (rotationsCompleted >= rotationsCount) {
    				rotationsCompleted = 0;
    				isSpin = false;
    				$$invalidate(3, isFinished = true);
    			}
    		}
    	}

    	function checkDistance(delta, index) {
    		let zone = Math.abs(velocity[index]);
    		zone = zone !== 0 ? zone : 1;
    		return Math.abs(delta[index]) < zone;
    	}

    	const writable_props = [
    		'isShow',
    		'isShowLabel',
    		'drillColor',
    		'normalColor',
    		'size',
    		'thickness',
    		'moveTo',
    		'isSpinEnabled',
    		'isFinished',
    		'moveSpeed',
    		'spinSpeed',
    		'rotationsCount',
    		'labelSize',
    		'labelColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Drill> was created with unknown prop '${key}'`);
    	});

    	function text_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			text = $$value;
    			$$invalidate(2, text);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('isShow' in $$props) $$invalidate(4, isShow = $$props.isShow);
    		if ('isShowLabel' in $$props) $$invalidate(5, isShowLabel = $$props.isShowLabel);
    		if ('drillColor' in $$props) $$invalidate(6, drillColor = $$props.drillColor);
    		if ('normalColor' in $$props) $$invalidate(7, normalColor = $$props.normalColor);
    		if ('size' in $$props) $$invalidate(8, size = $$props.size);
    		if ('thickness' in $$props) $$invalidate(9, thickness = $$props.thickness);
    		if ('moveTo' in $$props) $$invalidate(10, moveTo = $$props.moveTo);
    		if ('isSpinEnabled' in $$props) $$invalidate(11, isSpinEnabled = $$props.isSpinEnabled);
    		if ('isFinished' in $$props) $$invalidate(3, isFinished = $$props.isFinished);
    		if ('moveSpeed' in $$props) $$invalidate(12, moveSpeed = $$props.moveSpeed);
    		if ('spinSpeed' in $$props) $$invalidate(13, spinSpeed = $$props.spinSpeed);
    		if ('rotationsCount' in $$props) $$invalidate(14, rotationsCount = $$props.rotationsCount);
    		if ('labelSize' in $$props) $$invalidate(0, labelSize = $$props.labelSize);
    		if ('labelColor' in $$props) $$invalidate(1, labelColor = $$props.labelColor);
    		if ('$$scope' in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		renderable,
    		Text,
    		vec2: glVec2,
    		isShow,
    		isShowLabel,
    		drillColor,
    		normalColor,
    		size,
    		thickness,
    		moveTo,
    		isSpinEnabled,
    		isFinished,
    		moveSpeed,
    		spinSpeed,
    		rotationsCount,
    		labelSize,
    		labelColor,
    		text,
    		x,
    		y,
    		velocity,
    		lastNormal,
    		isSpin,
    		spinOffset,
    		rotationsCompleted,
    		drawNormal,
    		stop,
    		spin,
    		checkDistance,
    		angle: angle$1
    	});

    	$$self.$inject_state = $$props => {
    		if ('isShow' in $$props) $$invalidate(4, isShow = $$props.isShow);
    		if ('isShowLabel' in $$props) $$invalidate(5, isShowLabel = $$props.isShowLabel);
    		if ('drillColor' in $$props) $$invalidate(6, drillColor = $$props.drillColor);
    		if ('normalColor' in $$props) $$invalidate(7, normalColor = $$props.normalColor);
    		if ('size' in $$props) $$invalidate(8, size = $$props.size);
    		if ('thickness' in $$props) $$invalidate(9, thickness = $$props.thickness);
    		if ('moveTo' in $$props) $$invalidate(10, moveTo = $$props.moveTo);
    		if ('isSpinEnabled' in $$props) $$invalidate(11, isSpinEnabled = $$props.isSpinEnabled);
    		if ('isFinished' in $$props) $$invalidate(3, isFinished = $$props.isFinished);
    		if ('moveSpeed' in $$props) $$invalidate(12, moveSpeed = $$props.moveSpeed);
    		if ('spinSpeed' in $$props) $$invalidate(13, spinSpeed = $$props.spinSpeed);
    		if ('rotationsCount' in $$props) $$invalidate(14, rotationsCount = $$props.rotationsCount);
    		if ('labelSize' in $$props) $$invalidate(0, labelSize = $$props.labelSize);
    		if ('labelColor' in $$props) $$invalidate(1, labelColor = $$props.labelColor);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('x' in $$props) x = $$props.x;
    		if ('y' in $$props) y = $$props.y;
    		if ('velocity' in $$props) velocity = $$props.velocity;
    		if ('lastNormal' in $$props) lastNormal = $$props.lastNormal;
    		if ('isSpin' in $$props) isSpin = $$props.isSpin;
    		if ('spinOffset' in $$props) spinOffset = $$props.spinOffset;
    		if ('rotationsCompleted' in $$props) rotationsCompleted = $$props.rotationsCompleted;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		labelSize,
    		labelColor,
    		text,
    		isFinished,
    		isShow,
    		isShowLabel,
    		drillColor,
    		normalColor,
    		size,
    		thickness,
    		moveTo,
    		isSpinEnabled,
    		moveSpeed,
    		spinSpeed,
    		rotationsCount,
    		$$scope,
    		slots,
    		text_1_binding
    	];
    }

    class Drill extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			isShow: 4,
    			isShowLabel: 5,
    			drillColor: 6,
    			normalColor: 7,
    			size: 8,
    			thickness: 9,
    			moveTo: 10,
    			isSpinEnabled: 11,
    			isFinished: 3,
    			moveSpeed: 12,
    			spinSpeed: 13,
    			rotationsCount: 14,
    			labelSize: 0,
    			labelColor: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Drill",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get isShow() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isShow(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isShowLabel() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isShowLabel(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillColor() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillColor(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get normalColor() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set normalColor(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thickness() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thickness(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get moveTo() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set moveTo(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isSpinEnabled() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isSpinEnabled(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFinished() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFinished(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get moveSpeed() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set moveSpeed(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spinSpeed() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spinSpeed(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotationsCount() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotationsCount(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelSize() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelSize(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelColor() {
    		throw new Error("<Drill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelColor(value) {
    		throw new Error("<Drill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class PriorityNode {
        constructor(value, priority) {
            this.value = value;
            this.priority = priority;
        }
    }

    class PriorityQueue {
        enqueue(value, priority) {
            const node = new PriorityNode(value, priority);
            if (!this.head) {
                this.head = this.tail = node;
            }
            else {
                let previous = this.head;
                if (previous.priority > priority) {
                    node.next = previous;
                    this.head = node;
                    return node;
                }
                let next = previous === null || previous === void 0 ? void 0 : previous.next;
                while (previous && next) {
                    if (next.priority > priority) {
                        node.next = next;
                        previous.next = node;
                        return node;
                    }
                    previous = previous.next;
                    next = next.next;
                }
                this.tail.next = node;
                this.tail = node;
            }
            return node;
        }
        dequeue() {
            if (!this.head) {
                return;
            }
            const oldHead = this.head;
            this.head = oldHead.next;
            return oldHead;
        }
        peek() {
            var _a;
            return (_a = this.head) === null || _a === void 0 ? void 0 : _a.value;
        }
        isEmpty() {
            return this.head == null;
        }
        get data() {
            const values = [];
            let head = this.head;
            while (head) {
                values.push(head.value);
                head = head.next;
            }
            return values;
        }
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /**
     * @module
     * @author Ophir LOJKINE
     * salesman npm module
     *
     * Good heuristic for the traveling salesman problem using simulated annealing.
     * @see {@link https://lovasoa.github.io/salesman.js/|demo}
     **/

    var salesman = createCommonjsModule(function (module) {
    /**
     * @private
     */
    function Path(points) {
        this.points = points;
        this.order = new Array(points.length);
        for(var i=0; i<points.length; i++) this.order[i] = i;
        this.distances = new Array(points.length * points.length);
        for(var i=0; i<points.length; i++)
            for(var j=0; j<points.length; j++)
                this.distances[j + i*points.length] = distance(points[i], points[j]);
    }
    Path.prototype.change = function(temp) {
        var i = this.randomPos(), j = this.randomPos();
        var delta = this.delta_distance(i, j);
        if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
            this.swap(i,j);
        }
    };
    Path.prototype.size = function() {
        var s = 0;
        for (var i=0; i<this.points.length; i++) {
            s += this.distance(i, ((i+1)%this.points.length));
        }
        return s;
    };
    Path.prototype.swap = function(i,j) {
        var tmp = this.order[i];
        this.order[i] = this.order[j];
        this.order[j] = tmp;
    };
    Path.prototype.delta_distance = function(i, j) {
        var jm1 = this.index(j-1),
            jp1 = this.index(j+1),
            im1 = this.index(i-1),
            ip1 = this.index(i+1);
        var s =
            this.distance(jm1, i  )
            + this.distance(i  , jp1)
            + this.distance(im1, j  )
            + this.distance(j  , ip1)
            - this.distance(im1, i  )
            - this.distance(i  , ip1)
            - this.distance(jm1, j  )
            - this.distance(j  , jp1);
        if (jm1 === i || jp1 === i)
            s += 2*this.distance(i,j);
        return s;
    };
    Path.prototype.index = function(i) {
        return (i + this.points.length) % this.points.length;
    };
    Path.prototype.access = function(i) {
        return this.points[this.order[this.index(i)]];
    };
    Path.prototype.distance = function(i, j) {
        return this.distances[this.order[i] * this.points.length + this.order[j]];
    };
    // Random index between 1 and the last position in the array of points
    Path.prototype.randomPos = function() {
        return 1 + Math.floor(Math.random() * (this.points.length - 1));
    };

    /**
     * Solves the following problem:
     *  Given a list of points and the distances between each pair of points,
     *  what is the shortest possible route that visits each point exactly
     *  once and returns to the origin point?
     *
     * @param {Point[]} points The points that the path will have to visit.
     * @param {Number} [temp_coeff=0.999] changes the convergence speed of the algorithm: the closer to 1, the slower the algorithm and the better the solutions.
     * @param {Function} [callback=] An optional callback to be called after each iteration.
     *
     * @returns {Number[]} An array of indexes in the original array. Indicates in which order the different points are visited.
     *
     * @example
     * var points = [
     *       new salesman.Point(2,3)
     *       //other points
     *     ];
     * var solution = salesman.solve(points);
     * var ordered_points = solution.map(i => points[i]);
     * // ordered_points now contains the points, in the order they ought to be visited.
     **/
    function solve(points, temp_coeff, callback) {
        var path = new Path(points);
        if (points.length < 2) return path.order; // There is nothing to optimize
        if (!temp_coeff)
            temp_coeff = 1 - Math.exp(-10 - Math.min(points.length,1e6)/1e5);
        var has_callback = typeof(callback) === "function";

        for (var temperature = 100 * distance(path.access(0), path.access(1));
             temperature > 1e-6;
             temperature *= temp_coeff) {
            path.change(temperature);
            if (has_callback) callback(path.order);
        }
        return path.order;
    }
    /**
     * Represents a point in two dimensions.
     * @class
     * @param {Number} x abscissa
     * @param {Number} y ordinate
     */
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    function distance(p, q) {
        var dx = p.x - q.x, dy = p.y - q.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    {
        module.exports = {
            "solve": solve,
            "Point": Point
        };
    }
    });

    /* src\Graph.svelte generated by Svelte v3.49.0 */

    const { console: console_1$1 } = globals;

    // (623:6)       
    function fallback_block(ctx) {
    	let drill;
    	let updating_isFinished;
    	let updating_moveTo;
    	let current;

    	function drill_isFinished_binding(value) {
    		/*drill_isFinished_binding*/ ctx[45](value);
    	}

    	function drill_moveTo_binding(value) {
    		/*drill_moveTo_binding*/ ctx[46](value);
    	}

    	let drill_props = {
    		isShow: /*$isSimulationMode*/ ctx[12],
    		size: /*vertexSize*/ ctx[0],
    		drillColor: /*drillColor*/ ctx[1],
    		normalColor: /*drillNormalColor*/ ctx[2],
    		isSpinEnabled: /*isSpinEnabled*/ ctx[11],
    		moveSpeed: /*drillMoveSpeed*/ ctx[5],
    		spinSpeed: /*drillSpinSpeed*/ ctx[6],
    		rotationsCount: /*drillRotationsCount*/ ctx[7],
    		isShowLabel: /*isShowDrillLabel*/ ctx[8],
    		labelSize: /*drillLabelSize*/ ctx[3],
    		labelColor: /*drillLabelColor*/ ctx[4]
    	};

    	if (/*isDrillingHoleFinished*/ ctx[9] !== void 0) {
    		drill_props.isFinished = /*isDrillingHoleFinished*/ ctx[9];
    	}

    	if (/*moveDrillTo*/ ctx[10] !== void 0) {
    		drill_props.moveTo = /*moveDrillTo*/ ctx[10];
    	}

    	drill = new Drill({ props: drill_props, $$inline: true });
    	binding_callbacks.push(() => bind(drill, 'isFinished', drill_isFinished_binding));
    	binding_callbacks.push(() => bind(drill, 'moveTo', drill_moveTo_binding));

    	const block = {
    		c: function create() {
    			create_component(drill.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(drill, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const drill_changes = {};
    			if (dirty[0] & /*$isSimulationMode*/ 4096) drill_changes.isShow = /*$isSimulationMode*/ ctx[12];
    			if (dirty[0] & /*vertexSize*/ 1) drill_changes.size = /*vertexSize*/ ctx[0];
    			if (dirty[0] & /*drillColor*/ 2) drill_changes.drillColor = /*drillColor*/ ctx[1];
    			if (dirty[0] & /*drillNormalColor*/ 4) drill_changes.normalColor = /*drillNormalColor*/ ctx[2];
    			if (dirty[0] & /*isSpinEnabled*/ 2048) drill_changes.isSpinEnabled = /*isSpinEnabled*/ ctx[11];
    			if (dirty[0] & /*drillMoveSpeed*/ 32) drill_changes.moveSpeed = /*drillMoveSpeed*/ ctx[5];
    			if (dirty[0] & /*drillSpinSpeed*/ 64) drill_changes.spinSpeed = /*drillSpinSpeed*/ ctx[6];
    			if (dirty[0] & /*drillRotationsCount*/ 128) drill_changes.rotationsCount = /*drillRotationsCount*/ ctx[7];
    			if (dirty[0] & /*isShowDrillLabel*/ 256) drill_changes.isShowLabel = /*isShowDrillLabel*/ ctx[8];
    			if (dirty[0] & /*drillLabelSize*/ 8) drill_changes.labelSize = /*drillLabelSize*/ ctx[3];
    			if (dirty[0] & /*drillLabelColor*/ 16) drill_changes.labelColor = /*drillLabelColor*/ ctx[4];

    			if (!updating_isFinished && dirty[0] & /*isDrillingHoleFinished*/ 512) {
    				updating_isFinished = true;
    				drill_changes.isFinished = /*isDrillingHoleFinished*/ ctx[9];
    				add_flush_callback(() => updating_isFinished = false);
    			}

    			if (!updating_moveTo && dirty[0] & /*moveDrillTo*/ 1024) {
    				updating_moveTo = true;
    				drill_changes.moveTo = /*moveDrillTo*/ ctx[10];
    				add_flush_callback(() => updating_moveTo = false);
    			}

    			drill.$set(drill_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(drill.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(drill.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(drill, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(623:6)       ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[44].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[43], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(target, anchor);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "mouseup", /*handleMouseUp*/ ctx[14], false, false, false),
    					listen_dev(window, "touchend", /*handleMouseUp*/ ctx[14], false, false, false),
    					listen_dev(window, "mousemove", /*handleMouseMove*/ ctx[13], false, false, false),
    					listen_dev(window, "touchmove", /*handleTouchMove*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 4096)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[43],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[43])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[43], dirty, null),
    						null
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*$isSimulationMode, vertexSize, drillColor, drillNormalColor, isSpinEnabled, drillMoveSpeed, drillSpinSpeed, drillRotationsCount, isShowDrillLabel, drillLabelSize, drillLabelColor, isDrillingHoleFinished, moveDrillTo*/ 8191)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1, -1] : dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const CLICK_TIME_MS = 100;

    function getRandomInt(min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function angle(cx, cy, ex, ey) {
    	let dy = ey - cy;
    	let dx = ex - cx;
    	let theta = Math.atan2(dy, dx); // range (-PI, PI]

    	return theta >= -(Math.PI / 2) && theta <= Math.PI / 2
    	? theta
    	: theta + Math.PI;
    }

    function getDistance(vertexI, vertexJ) {
    	if (vertexI.x === vertexJ.x && vertexI.y === vertexJ.y) {
    		return 0;
    	}

    	let x1 = vertexI.x;
    	let x2 = vertexJ.x;
    	let y1 = vertexI.y;
    	let y2 = vertexJ.y;
    	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $edgeColorId;
    	let $isSimulationMode;
    	let $height;
    	let $width;
    	let $showEdgeLabel;
    	let $showVertexLabel;
    	let $vertexColorId;
    	let $removeEdgesOnMoving;
    	validate_store(edgeColorId, 'edgeColorId');
    	component_subscribe($$self, edgeColorId, $$value => $$invalidate(59, $edgeColorId = $$value));
    	validate_store(isSimulationMode, 'isSimulationMode');
    	component_subscribe($$self, isSimulationMode, $$value => $$invalidate(12, $isSimulationMode = $$value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(60, $height = $$value));
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(61, $width = $$value));
    	validate_store(showEdgeLabel, 'showEdgeLabel');
    	component_subscribe($$self, showEdgeLabel, $$value => $$invalidate(62, $showEdgeLabel = $$value));
    	validate_store(showVertexLabel, 'showVertexLabel');
    	component_subscribe($$self, showVertexLabel, $$value => $$invalidate(63, $showVertexLabel = $$value));
    	validate_store(vertexColorId, 'vertexColorId');
    	component_subscribe($$self, vertexColorId, $$value => $$invalidate(64, $vertexColorId = $$value));
    	validate_store(removeEdgesOnMoving, 'removeEdgesOnMoving');
    	component_subscribe($$self, removeEdgesOnMoving, $$value => $$invalidate(65, $removeEdgesOnMoving = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Graph', slots, ['default']);
    	let { vertexSize = 10 } = $$props;
    	let { edgeSize = 3 } = $$props;
    	let { vertexLabelColor = 'hsl(0, 0%, 100%)' } = $$props;
    	let { vertexLabelSize = 8 } = $$props;
    	let { verticesGenerationCount = 30 } = $$props;
    	let { edgeLabelDistance = 30 } = $$props;
    	let { edgeLabelSize = 8 } = $$props;
    	let { edgeLabelColor = 'hsl(0, 0%, 100%)' } = $$props;
    	let { totalDistance = '0' } = $$props;
    	let { totalDistanceWithStart = '0' } = $$props;
    	let { connectAlgorithm = '' } = $$props;
    	let { drillColor = '#419e5a' } = $$props;
    	let { drillNormalColor = '#ffe554' } = $$props;
    	let { drillLabelSize = 8 } = $$props;
    	let { drillLabelColor = 'hsl(0, 0%, 100%)' } = $$props;
    	let { drillMoveSpeed = 0.1 } = $$props;
    	let { drillSpinSpeed = 0.5 } = $$props;
    	let { drillRotationsCount = 50 } = $$props;
    	let { isShowDrillLabel = true } = $$props;
    	let { isDrillingFinished = true } = $$props;
    	let { isInfiniteSimulation = false } = $$props;
    	let { isReturnDrillToStart = true } = $$props;
    	let { drillingTime = 0 } = $$props;
    	let { lastDrillingTime = 0 } = $$props;
    	let { isBlockDrillControls = false } = $$props;
    	let { drilledVertexColor = 'hsl(0, 0%, 100%)' } = $$props;
    	let { zAlgorithmRowSize = 30 } = $$props;
    	let vertices = [];
    	let drilledVertices = [];
    	let edges = [];
    	let minDistance = 80;
    	let startPosition = { x: 0, y: 0 };
    	let mouse = null;
    	let movingVertexId = -1;
    	let mouseDown = false;
    	let time = -1;
    	let isDrillingHoleFinished = true;
    	let moveDrillTo = [0, 0];
    	let drillingEdgeIndex = -1;
    	let isSpinEnabled = true;
    	let isMovingToStart = false;
    	let drillingStartTime = 0;
    	let drilledVertex = -1;

    	renderable(props => {
    		const { context } = props;

    		if (mouseDown && movingVertexId !== -1 && Date.now() - time > CLICK_TIME_MS) {
    			let x = mouse.x;
    			let y = mouse.y;

    			if (x > $width) {
    				x = $width;
    			} else if (x < 0) {
    				x = 0;
    			}

    			if (y > $height) {
    				y = $height;
    			} else if (y < 0) {
    				y = 0;
    			}

    			vertices[movingVertexId] = { x, y };

    			if ($removeEdgesOnMoving) {
    				removeAllEdges();
    			} else {
    				calculateDistances();
    			}
    		}

    		for (let edge of edges) {
    			drawLine(context, vertices[edge.i], vertices[edge.j]);
    		}

    		for (let [index, vertex] of vertices.entries()) {
    			let vertexDrawColor = COLORS[$vertexColorId];

    			if ($isSimulationMode && drilledVertices.includes(index)) {
    				vertexDrawColor = drilledVertexColor;
    			}

    			context.lineCap = 'round';
    			context.beginPath();
    			context.fillStyle = vertexDrawColor;
    			context.strokeStyle = vertexDrawColor;
    			context.lineWidth = 3;
    			context.arc(vertex.x, vertex.y, vertexSize, 0, Math.PI * 2);
    			context.fill();
    		}

    		if ($showVertexLabel) {
    			for (let vertex of vertices) {
    				let text = `(${Math.round(vertex.x)}, ${Math.round(vertex.y)})`;

    				drawVertexLabel({
    					context,
    					text,
    					x: vertex.x,
    					y: vertex.y + vertexSize + 10
    				});
    			}
    		}

    		if ($showEdgeLabel) {
    			for (let edge of edges) {
    				drawEdgeLabel(context, vertices[edge.i], vertices[edge.j]);
    			}
    		}

    		if (isMovingToStart) {
    			finishMovingToStart();
    		} else if ($isSimulationMode) {
    			moveDrill();
    		}

    		if (drillingStartTime !== 0) {
    			$$invalidate(19, drillingTime = Date.now() - drillingStartTime);
    		}
    	});

    	function handleClick(ev) {
    		if ($isSimulationMode) {
    			return;
    		}

    		if (Date.now() - time > CLICK_TIME_MS && time !== -1) {
    			time = -1;
    			return;
    		}

    		time = -1;
    		removeAllEdges();
    		let x = ev.clientX;
    		let y = ev.clientY;
    		let nearest = getNearestVertex(x, y);

    		if (nearest.value <= vertexSize && nearest.index !== -1) {
    			vertices = [
    				...vertices.slice(0, nearest.index),
    				...vertices.slice(nearest.index + 1, vertices.length)
    			];

    			return;
    		}

    		let vertex = { x, y };
    		vertices = [...vertices, vertex];
    	}

    	function handleMouseDown(ev) {
    		if ($isSimulationMode) {
    			return;
    		}

    		let x = ev.clientX;
    		let y = ev.clientY;
    		let nearest = getNearestVertex(x, y);

    		if (nearest.value > vertexSize || nearest.index === -1) {
    			return;
    		}

    		movingVertexId = nearest.index;
    		mouse = vertices[movingVertexId];
    		mouseDown = true;
    		time = Date.now();
    	}

    	function handleMouseMove(ev) {
    		if (!mouse) {
    			return;
    		}

    		mouse.x += ev.movementX;
    		mouse.y += ev.movementY;
    	}

    	function handleMouseUp() {
    		if ($isSimulationMode) {
    			return;
    		}

    		mouseDown = false;
    		movingVertexId = -1;
    		previousTouch = null;
    	}

    	function handleTouchStart(ev) {
    		let touch = ev.touches[0];
    		handleMouseDown(touch);
    	}

    	let previousTouch = null;

    	function handleTouchMove(ev) {
    		let touch = ev.touches[0];

    		if (previousTouch) {
    			touch.movementX = touch.pageX - previousTouch.pageX;
    			touch.movementY = touch.pageY - previousTouch.pageY;
    			handleMouseMove(touch);
    		}

    		previousTouch = touch;
    	}

    	function removeAllEdges() {
    		edges = [];
    		$$invalidate(16, totalDistance = '0');
    		$$invalidate(17, totalDistanceWithStart = '0');
    		resetDistances();
    	}

    	function removeAllVertices() {
    		removeAllEdges();
    		vertices = [];
    		drilledVertices = [];
    	}

    	function generateVertices() {
    		removeAllVertices();
    		let attempts = 0;

    		while (vertices.length !== verticesGenerationCount && attempts !== 5000) {
    			let x = getRandomInt(0, $width - 1);
    			let y = getRandomInt(0, $height - 1);
    			let nearest = getNearestVertex(x, y);

    			if (nearest.value < minDistance && nearest.index != -1) {
    				attempts++;
    				continue;
    			}

    			let vertex = { x, y };
    			vertices = [...vertices, vertex];
    			attempts = 0;
    		}

    		console.log(`Generated ${vertices.length} vertices`);
    	}

    	function fillEdges() {
    		removeAllEdges();

    		for (let i = 0; i < vertices.length; i++) {
    			let j = i + 1;

    			if (j < vertices.length) {
    				edges = [...edges, { i, j }];
    			}
    		}

    		calculateDistances();
    	}

    	function moveDrillToStart() {
    		$$invalidate(10, moveDrillTo = [0, 0]);
    		$$invalidate(11, isSpinEnabled = false);
    		isMovingToStart = true;
    		$$invalidate(18, isDrillingFinished = true);
    		$$invalidate(9, isDrillingHoleFinished = false);
    		$$invalidate(21, isBlockDrillControls = true);
    	}

    	function finishMovingToStart() {
    		if (isDrillingHoleFinished) {
    			$$invalidate(11, isSpinEnabled = true);
    			isMovingToStart = false;
    			$$invalidate(21, isBlockDrillControls = false);

    			if (isReturnDrillToStart) {
    				stopDrillingTime();
    			}
    		}
    	}

    	function startSimulation() {
    		drillingStartTime = Date.now();

    		if (vertices.length === 0) {
    			generateVertices();
    		}

    		connectEdges();
    		calculateDistances();
    		$$invalidate(11, isSpinEnabled = true);
    		$$invalidate(18, isDrillingFinished = false);
    		drillingEdgeIndex = -1;
    		$$invalidate(21, isBlockDrillControls = true);
    		drilledVertex = -1;
    		drilledVertices = [];
    	}

    	function connectEdges() {
    		switch (connectAlgorithm) {
    			case 'zAlgorithm':
    				zAlgorithm();
    				break;
    			case 'greedy':
    				greedy();
    				break;
    			case 'spanningTreePrim':
    				if (!$isSimulationMode) {
    					spanningTreePrim();
    				} else {
    					prim();
    				}
    				break;
    			case 'prim':
    				prim();
    				break;
    			case 'salesman':
    				salesman$1();
    				break;
    			case 'lastOrder':
    				fillEdges();
    		}
    	}

    	function zAlgorithm() {
    		vertices.sort((a, b) => {
    			let isYEqual = Math.abs(a.y - b.y) < zAlgorithmRowSize;
    			let isYLess = a.y - b.y < -zAlgorithmRowSize;

    			if (isYLess) {
    				return -1;
    			} else if (isYEqual) {
    				if (a.x < b.x) {
    					return -1;
    				} else if (a.x > b.x) {
    					return 1;
    				}
    			} else if (!isYLess) {
    				return 1;
    			}

    			return 0;
    		});

    		fillEdges();
    	}

    	function greedy() {
    		if (vertices.length <= 1) {
    			return;
    		}

    		let sortedVertices = [];
    		let searchVertexes = vertices;

    		let sortVertices = index => {
    			let vertex = searchVertexes[index];
    			sortedVertices.push(vertex);
    			searchVertexes = vertices.filter(n => !sortedVertices.includes(n));

    			if (searchVertexes.length == 0) {
    				return sortedVertices;
    			}

    			let nearestVertex = getNearestVertex(vertex.x, vertex.y, searchVertexes);
    			return sortVertices(nearestVertex.index);
    		};

    		let nearestToDrillVertex = getNearestVertex(moveDrillTo[0], moveDrillTo[1], vertices).index;
    		vertices = sortVertices(nearestToDrillVertex);
    		fillEdges();
    	}

    	function spanningTreePrim() {
    		if (vertices.length === 0) {
    			return;
    		}

    		let keys = [];
    		let p = [];
    		let queue = new PriorityQueue();
    		let allEdges = [];

    		for (let i = 0; i < vertices.length; i++) {
    			keys.push(Infinity);
    			p.push(-1);
    		}

    		for (let i = 0; i < vertices.length; i++) {
    			for (let j = 0; j < i; j++) {
    				allEdges.push({ i, j });
    			}
    		}

    		for (let i = 0; i < vertices.length; i++) {
    			let minKey = Infinity;

    			for (let j = 0; j < i; j++) {
    				let key = getDistance(vertices[i], vertices[j]);

    				if (key < minKey) {
    					minKey = key;
    				}
    			}

    			queue.enqueue(i, minKey);
    		}

    		let nearestVertex = getNearestVertex(moveDrillTo[0], moveDrillTo[0], vertices);

    		if (nearestVertex.index === -1 || nearestVertex.value === -1) {
    			nearestVertex = { index: 0, value: 0 };
    		}

    		keys[nearestVertex.index];

    		while (!queue.isEmpty()) {
    			let v = queue.dequeue().value;

    			for (let edge of allEdges) {
    				let u = -1;

    				if (edge.i === v) {
    					u = edge.j;
    				}

    				if (edge.j === v) {
    					u = edge.i;
    				}

    				if (u !== -1) {
    					let distance = getDistance(vertices[v], vertices[u]);

    					if (queue.data.includes(u) && keys[u] > distance) {
    						p[u] = v;
    						keys[u] = distance;
    					}
    				}
    			}
    		}

    		removeAllEdges();

    		for (let i = 0; i < p.length; i++) {
    			if (p[i] !== -1) {
    				edges = [...edges, { i, j: p[i] }];
    			}
    		}
    	}

    	function prim() {
    		if (vertices.length === 0) {
    			return;
    		}

    		spanningTreePrim();
    		spanningTreeToPath();
    	}

    	function spanningTreeToPath() {
    		let getChildren = (index, edgesList) => {
    			let children = [];

    			for (let edge of edgesList) {
    				if (edge.i === index) {
    					children.push(edge);
    				}
    			}

    			for (let edge of edgesList) {
    				if (edge.j === index) {
    					children.push({ i: edge.j, j: edge.i });
    				}
    			}

    			return children;
    		};

    		let nearestVertex = getNearestVertex(moveDrillTo[0], moveDrillTo[0], vertices);

    		if (nearestVertex.index === -1 || nearestVertex.value === -1) {
    			nearestVertex = { index: 0, value: 0 };
    		}

    		let edgesList = edges;

    		let transformToPath = startIndex => {
    			if (edgesList.length === 0) {
    				return [startIndex];
    			}

    			let isEdgeEqual = edge => {
    				return element => {
    					return element.i === edge.i && element.j === edge.j;
    				};
    			};

    			let children = getChildren(startIndex, edgesList);
    			let path = [startIndex];

    			for (let child of children) {
    				let childIndex = edgesList.findIndex(isEdgeEqual(child));
    				let reversedChildIndex = edgesList.findIndex(isEdgeEqual({ i: child.j, j: child.i }));

    				if (childIndex > -1) {
    					edgesList.splice(childIndex, 1);
    				} else if (reversedChildIndex > -1) {
    					edgesList.splice(reversedChildIndex, 1);
    				}

    				path.push(...transformToPath(child.j));
    			}

    			return path;
    		};

    		let verticesIndexes = transformToPath(nearestVertex.index);
    		let newVertices = [];

    		for (let verticesIndex of verticesIndexes) {
    			newVertices.push(vertices[verticesIndex]);
    		}

    		vertices = newVertices;
    		fillEdges();
    	}

    	function salesman$1() {
    		let points = [];

    		for (let vertex of vertices) {
    			points.push(new salesman.Point(vertex.x, vertex.y));
    		}

    		//  let orderedVertices = salesmanAlgorithm.solve(points, 1-5e-7).map(i => vertices[i]) - take time but better
    		let orderedVertices = salesman.solve(points).map(i => vertices[i]);

    		let nearestVertex = getNearestVertex(moveDrillTo[0], moveDrillTo[1], orderedVertices);

    		if (nearestVertex.index === -1) {
    			vertices = orderedVertices;
    			fillEdges();
    			return;
    		}

    		vertices = [];

    		for (let i = nearestVertex.index; i < orderedVertices.length; i++) {
    			vertices.push(orderedVertices[i]);
    		}

    		for (let i = 0; i < nearestVertex.index; i++) {
    			vertices.push(orderedVertices[i]);
    		}

    		fillEdges();
    	}

    	function calculateDistances() {
    		if (!$isSimulationMode && connectAlgorithm.includes('spanningTree')) {
    			return;
    		}

    		let totalDistanceCount = 0;

    		for (let edge of edges) {
    			totalDistanceCount += getDistance(vertices[edge.i], vertices[edge.j]);
    		}

    		let totalDistanceWithStartCount = totalDistanceCount;

    		if (vertices.length) {
    			totalDistanceWithStartCount += getDistance(startPosition, vertices[0]);
    			totalDistanceWithStartCount += getDistance(startPosition, vertices.at(-1));
    		}

    		$$invalidate(16, totalDistance = Math.round(totalDistanceCount).toString());
    		$$invalidate(17, totalDistanceWithStart = Math.round(totalDistanceWithStartCount).toString());
    	}

    	function resetDistances() {
    		$$invalidate(16, totalDistance = '0');
    		$$invalidate(17, totalDistanceWithStart = '0');
    	}

    	function drawVertexLabel(props) {
    		const { context, text, x, y } = props;
    		let align = 'center';
    		let baseline = 'top';
    		let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica';

    		if (text && context) {
    			context.fillStyle = vertexLabelColor;
    			context.font = `${vertexLabelSize}px ${fontFamily}`;
    			context.textAlign = align;
    			context.textBaseline = baseline;
    			context.fillText(text, x, y);
    		}
    	}

    	function drawLine(context, vertexI, vertexJ) {
    		if (!context) {
    			return;
    		}

    		context.beginPath();
    		context.moveTo(vertexI.x, vertexI.y);
    		context.lineTo(vertexJ.x, vertexJ.y);
    		context.strokeStyle = COLORS[$edgeColorId];
    		context.lineWidth = edgeSize;
    		context.stroke();
    	}

    	function drawEdgeLabel(context, vertexI, vertexJ) {
    		if (!context) {
    			return;
    		}

    		let label = String(Math.round(getDistance(vertexI, vertexJ)));
    		let x = (vertexI.x + vertexJ.x) / 2;
    		let y = (vertexI.y + vertexJ.y) / 2;
    		let thetaVertices = angle(vertexI.x, vertexI.y, vertexJ.x, vertexJ.y);
    		let radius = edgeLabelDistance;
    		let resultX = radius * Math.cos(thetaVertices + 3 * Math.PI / 2) + x;
    		let resultY = radius * Math.sin(thetaVertices + 3 * Math.PI / 2) + y;
    		let align = 'center';
    		let baseline = 'top';
    		let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica';
    		context.beginPath();
    		context.fillStyle = edgeLabelColor;
    		context.font = `${edgeLabelSize}px ${fontFamily}`;
    		context.textAlign = align;
    		context.textBaseline = baseline;
    		context.save();
    		context.translate(resultX, resultY);
    		context.rotate(thetaVertices);
    		context.fillText(label, 0, 0);
    		context.restore();
    	}

    	function getNearestVertex(x, y, verticesList = vertices) {
    		let nearestIndex = -1;
    		let nearestValue = -1;

    		for (let i = 0; i < verticesList.length; i++) {
    			let vertex = verticesList[i];
    			let value = getDistance(vertex, { x, y });

    			if (nearestIndex === -1 || nearestValue > value) {
    				nearestIndex = i;
    				nearestValue = value;
    			}
    		}

    		return { value: nearestValue, index: nearestIndex };
    	}

    	function moveDrill() {
    		if (isDrillingFinished) {
    			if (!isInfiniteSimulation) {
    				drillingEdgeIndex = -1;
    				$$invalidate(21, isBlockDrillControls = false);
    				return;
    			}

    			if (drillingEdgeIndex !== -1) {
    				generateVertices();
    				startSimulation();
    			} else {
    				return;
    			}
    		}

    		if (drillingEdgeIndex >= edges.length || vertices.length === 0) {
    			if (isDrillingHoleFinished) {
    				if (drilledVertex !== -1) {
    					drilledVertices = [...drilledVertices, drilledVertex];
    				}

    				if (!isReturnDrillToStart) {
    					$$invalidate(18, isDrillingFinished = true);
    					stopDrillingTime();
    				} else {
    					moveDrillToStart();
    				}
    			}

    			return;
    		}

    		if (!isDrillingHoleFinished) {
    			return;
    		}

    		if (drilledVertex !== -1) {
    			drilledVertices = [...drilledVertices, drilledVertex];
    		}

    		let moveToVertex;

    		if (edges.length === 0) {
    			moveToVertex = vertices[0];
    			drilledVertex = 0;
    		} else if (drillingEdgeIndex === -1) {
    			moveToVertex = vertices[edges[0].i];
    			drilledVertex = edges[0].i;
    		} else {
    			moveToVertex = vertices[edges[drillingEdgeIndex].j];
    			drilledVertex = edges[drillingEdgeIndex].j;
    		}

    		$$invalidate(10, moveDrillTo = [moveToVertex.x, moveToVertex.y]);
    		$$invalidate(9, isDrillingHoleFinished = false);
    		drillingEdgeIndex++;
    	}

    	function stopDrillingTime() {
    		$$invalidate(20, lastDrillingTime = drillingTime);
    		drillingStartTime = 0;
    		$$invalidate(19, drillingTime = 0);
    	}

    	const writable_props = [
    		'vertexSize',
    		'edgeSize',
    		'vertexLabelColor',
    		'vertexLabelSize',
    		'verticesGenerationCount',
    		'edgeLabelDistance',
    		'edgeLabelSize',
    		'edgeLabelColor',
    		'totalDistance',
    		'totalDistanceWithStart',
    		'connectAlgorithm',
    		'drillColor',
    		'drillNormalColor',
    		'drillLabelSize',
    		'drillLabelColor',
    		'drillMoveSpeed',
    		'drillSpinSpeed',
    		'drillRotationsCount',
    		'isShowDrillLabel',
    		'isDrillingFinished',
    		'isInfiniteSimulation',
    		'isReturnDrillToStart',
    		'drillingTime',
    		'lastDrillingTime',
    		'isBlockDrillControls',
    		'drilledVertexColor',
    		'zAlgorithmRowSize'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Graph> was created with unknown prop '${key}'`);
    	});

    	function drill_isFinished_binding(value) {
    		isDrillingHoleFinished = value;
    		$$invalidate(9, isDrillingHoleFinished);
    	}

    	function drill_moveTo_binding(value) {
    		moveDrillTo = value;
    		$$invalidate(10, moveDrillTo);
    	}

    	$$self.$$set = $$props => {
    		if ('vertexSize' in $$props) $$invalidate(0, vertexSize = $$props.vertexSize);
    		if ('edgeSize' in $$props) $$invalidate(22, edgeSize = $$props.edgeSize);
    		if ('vertexLabelColor' in $$props) $$invalidate(23, vertexLabelColor = $$props.vertexLabelColor);
    		if ('vertexLabelSize' in $$props) $$invalidate(24, vertexLabelSize = $$props.vertexLabelSize);
    		if ('verticesGenerationCount' in $$props) $$invalidate(25, verticesGenerationCount = $$props.verticesGenerationCount);
    		if ('edgeLabelDistance' in $$props) $$invalidate(26, edgeLabelDistance = $$props.edgeLabelDistance);
    		if ('edgeLabelSize' in $$props) $$invalidate(27, edgeLabelSize = $$props.edgeLabelSize);
    		if ('edgeLabelColor' in $$props) $$invalidate(28, edgeLabelColor = $$props.edgeLabelColor);
    		if ('totalDistance' in $$props) $$invalidate(16, totalDistance = $$props.totalDistance);
    		if ('totalDistanceWithStart' in $$props) $$invalidate(17, totalDistanceWithStart = $$props.totalDistanceWithStart);
    		if ('connectAlgorithm' in $$props) $$invalidate(29, connectAlgorithm = $$props.connectAlgorithm);
    		if ('drillColor' in $$props) $$invalidate(1, drillColor = $$props.drillColor);
    		if ('drillNormalColor' in $$props) $$invalidate(2, drillNormalColor = $$props.drillNormalColor);
    		if ('drillLabelSize' in $$props) $$invalidate(3, drillLabelSize = $$props.drillLabelSize);
    		if ('drillLabelColor' in $$props) $$invalidate(4, drillLabelColor = $$props.drillLabelColor);
    		if ('drillMoveSpeed' in $$props) $$invalidate(5, drillMoveSpeed = $$props.drillMoveSpeed);
    		if ('drillSpinSpeed' in $$props) $$invalidate(6, drillSpinSpeed = $$props.drillSpinSpeed);
    		if ('drillRotationsCount' in $$props) $$invalidate(7, drillRotationsCount = $$props.drillRotationsCount);
    		if ('isShowDrillLabel' in $$props) $$invalidate(8, isShowDrillLabel = $$props.isShowDrillLabel);
    		if ('isDrillingFinished' in $$props) $$invalidate(18, isDrillingFinished = $$props.isDrillingFinished);
    		if ('isInfiniteSimulation' in $$props) $$invalidate(30, isInfiniteSimulation = $$props.isInfiniteSimulation);
    		if ('isReturnDrillToStart' in $$props) $$invalidate(31, isReturnDrillToStart = $$props.isReturnDrillToStart);
    		if ('drillingTime' in $$props) $$invalidate(19, drillingTime = $$props.drillingTime);
    		if ('lastDrillingTime' in $$props) $$invalidate(20, lastDrillingTime = $$props.lastDrillingTime);
    		if ('isBlockDrillControls' in $$props) $$invalidate(21, isBlockDrillControls = $$props.isBlockDrillControls);
    		if ('drilledVertexColor' in $$props) $$invalidate(32, drilledVertexColor = $$props.drilledVertexColor);
    		if ('zAlgorithmRowSize' in $$props) $$invalidate(33, zAlgorithmRowSize = $$props.zAlgorithmRowSize);
    		if ('$$scope' in $$props) $$invalidate(43, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		renderable,
    		width,
    		height,
    		showVertexLabel,
    		showEdgeLabel,
    		removeEdgesOnMoving,
    		isSimulationMode,
    		vertexColorId,
    		edgeColorId,
    		COLORS,
    		Drill,
    		PriorityQueue,
    		salesmanAlgorithm: salesman,
    		vertexSize,
    		edgeSize,
    		vertexLabelColor,
    		vertexLabelSize,
    		verticesGenerationCount,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColor,
    		totalDistance,
    		totalDistanceWithStart,
    		connectAlgorithm,
    		drillColor,
    		drillNormalColor,
    		drillLabelSize,
    		drillLabelColor,
    		drillMoveSpeed,
    		drillSpinSpeed,
    		drillRotationsCount,
    		isShowDrillLabel,
    		isDrillingFinished,
    		isInfiniteSimulation,
    		isReturnDrillToStart,
    		drillingTime,
    		lastDrillingTime,
    		isBlockDrillControls,
    		drilledVertexColor,
    		zAlgorithmRowSize,
    		vertices,
    		drilledVertices,
    		edges,
    		minDistance,
    		startPosition,
    		mouse,
    		movingVertexId,
    		mouseDown,
    		time,
    		CLICK_TIME_MS,
    		isDrillingHoleFinished,
    		moveDrillTo,
    		drillingEdgeIndex,
    		isSpinEnabled,
    		isMovingToStart,
    		drillingStartTime,
    		drilledVertex,
    		handleClick,
    		handleMouseDown,
    		handleMouseMove,
    		handleMouseUp,
    		handleTouchStart,
    		previousTouch,
    		handleTouchMove,
    		removeAllEdges,
    		removeAllVertices,
    		getRandomInt,
    		generateVertices,
    		fillEdges,
    		moveDrillToStart,
    		finishMovingToStart,
    		startSimulation,
    		connectEdges,
    		zAlgorithm,
    		greedy,
    		spanningTreePrim,
    		prim,
    		spanningTreeToPath,
    		salesman: salesman$1,
    		calculateDistances,
    		resetDistances,
    		drawVertexLabel,
    		drawLine,
    		drawEdgeLabel,
    		angle,
    		getDistance,
    		getNearestVertex,
    		moveDrill,
    		stopDrillingTime,
    		$edgeColorId,
    		$isSimulationMode,
    		$height,
    		$width,
    		$showEdgeLabel,
    		$showVertexLabel,
    		$vertexColorId,
    		$removeEdgesOnMoving
    	});

    	$$self.$inject_state = $$props => {
    		if ('vertexSize' in $$props) $$invalidate(0, vertexSize = $$props.vertexSize);
    		if ('edgeSize' in $$props) $$invalidate(22, edgeSize = $$props.edgeSize);
    		if ('vertexLabelColor' in $$props) $$invalidate(23, vertexLabelColor = $$props.vertexLabelColor);
    		if ('vertexLabelSize' in $$props) $$invalidate(24, vertexLabelSize = $$props.vertexLabelSize);
    		if ('verticesGenerationCount' in $$props) $$invalidate(25, verticesGenerationCount = $$props.verticesGenerationCount);
    		if ('edgeLabelDistance' in $$props) $$invalidate(26, edgeLabelDistance = $$props.edgeLabelDistance);
    		if ('edgeLabelSize' in $$props) $$invalidate(27, edgeLabelSize = $$props.edgeLabelSize);
    		if ('edgeLabelColor' in $$props) $$invalidate(28, edgeLabelColor = $$props.edgeLabelColor);
    		if ('totalDistance' in $$props) $$invalidate(16, totalDistance = $$props.totalDistance);
    		if ('totalDistanceWithStart' in $$props) $$invalidate(17, totalDistanceWithStart = $$props.totalDistanceWithStart);
    		if ('connectAlgorithm' in $$props) $$invalidate(29, connectAlgorithm = $$props.connectAlgorithm);
    		if ('drillColor' in $$props) $$invalidate(1, drillColor = $$props.drillColor);
    		if ('drillNormalColor' in $$props) $$invalidate(2, drillNormalColor = $$props.drillNormalColor);
    		if ('drillLabelSize' in $$props) $$invalidate(3, drillLabelSize = $$props.drillLabelSize);
    		if ('drillLabelColor' in $$props) $$invalidate(4, drillLabelColor = $$props.drillLabelColor);
    		if ('drillMoveSpeed' in $$props) $$invalidate(5, drillMoveSpeed = $$props.drillMoveSpeed);
    		if ('drillSpinSpeed' in $$props) $$invalidate(6, drillSpinSpeed = $$props.drillSpinSpeed);
    		if ('drillRotationsCount' in $$props) $$invalidate(7, drillRotationsCount = $$props.drillRotationsCount);
    		if ('isShowDrillLabel' in $$props) $$invalidate(8, isShowDrillLabel = $$props.isShowDrillLabel);
    		if ('isDrillingFinished' in $$props) $$invalidate(18, isDrillingFinished = $$props.isDrillingFinished);
    		if ('isInfiniteSimulation' in $$props) $$invalidate(30, isInfiniteSimulation = $$props.isInfiniteSimulation);
    		if ('isReturnDrillToStart' in $$props) $$invalidate(31, isReturnDrillToStart = $$props.isReturnDrillToStart);
    		if ('drillingTime' in $$props) $$invalidate(19, drillingTime = $$props.drillingTime);
    		if ('lastDrillingTime' in $$props) $$invalidate(20, lastDrillingTime = $$props.lastDrillingTime);
    		if ('isBlockDrillControls' in $$props) $$invalidate(21, isBlockDrillControls = $$props.isBlockDrillControls);
    		if ('drilledVertexColor' in $$props) $$invalidate(32, drilledVertexColor = $$props.drilledVertexColor);
    		if ('zAlgorithmRowSize' in $$props) $$invalidate(33, zAlgorithmRowSize = $$props.zAlgorithmRowSize);
    		if ('vertices' in $$props) vertices = $$props.vertices;
    		if ('drilledVertices' in $$props) drilledVertices = $$props.drilledVertices;
    		if ('edges' in $$props) edges = $$props.edges;
    		if ('minDistance' in $$props) minDistance = $$props.minDistance;
    		if ('startPosition' in $$props) startPosition = $$props.startPosition;
    		if ('mouse' in $$props) mouse = $$props.mouse;
    		if ('movingVertexId' in $$props) movingVertexId = $$props.movingVertexId;
    		if ('mouseDown' in $$props) mouseDown = $$props.mouseDown;
    		if ('time' in $$props) time = $$props.time;
    		if ('isDrillingHoleFinished' in $$props) $$invalidate(9, isDrillingHoleFinished = $$props.isDrillingHoleFinished);
    		if ('moveDrillTo' in $$props) $$invalidate(10, moveDrillTo = $$props.moveDrillTo);
    		if ('drillingEdgeIndex' in $$props) drillingEdgeIndex = $$props.drillingEdgeIndex;
    		if ('isSpinEnabled' in $$props) $$invalidate(11, isSpinEnabled = $$props.isSpinEnabled);
    		if ('isMovingToStart' in $$props) isMovingToStart = $$props.isMovingToStart;
    		if ('drillingStartTime' in $$props) drillingStartTime = $$props.drillingStartTime;
    		if ('drilledVertex' in $$props) drilledVertex = $$props.drilledVertex;
    		if ('previousTouch' in $$props) previousTouch = $$props.previousTouch;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		vertexSize,
    		drillColor,
    		drillNormalColor,
    		drillLabelSize,
    		drillLabelColor,
    		drillMoveSpeed,
    		drillSpinSpeed,
    		drillRotationsCount,
    		isShowDrillLabel,
    		isDrillingHoleFinished,
    		moveDrillTo,
    		isSpinEnabled,
    		$isSimulationMode,
    		handleMouseMove,
    		handleMouseUp,
    		handleTouchMove,
    		totalDistance,
    		totalDistanceWithStart,
    		isDrillingFinished,
    		drillingTime,
    		lastDrillingTime,
    		isBlockDrillControls,
    		edgeSize,
    		vertexLabelColor,
    		vertexLabelSize,
    		verticesGenerationCount,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColor,
    		connectAlgorithm,
    		isInfiniteSimulation,
    		isReturnDrillToStart,
    		drilledVertexColor,
    		zAlgorithmRowSize,
    		handleClick,
    		handleMouseDown,
    		handleTouchStart,
    		removeAllEdges,
    		removeAllVertices,
    		generateVertices,
    		moveDrillToStart,
    		startSimulation,
    		connectEdges,
    		$$scope,
    		slots,
    		drill_isFinished_binding,
    		drill_moveTo_binding
    	];
    }

    class Graph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$7,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				vertexSize: 0,
    				edgeSize: 22,
    				vertexLabelColor: 23,
    				vertexLabelSize: 24,
    				verticesGenerationCount: 25,
    				edgeLabelDistance: 26,
    				edgeLabelSize: 27,
    				edgeLabelColor: 28,
    				totalDistance: 16,
    				totalDistanceWithStart: 17,
    				connectAlgorithm: 29,
    				drillColor: 1,
    				drillNormalColor: 2,
    				drillLabelSize: 3,
    				drillLabelColor: 4,
    				drillMoveSpeed: 5,
    				drillSpinSpeed: 6,
    				drillRotationsCount: 7,
    				isShowDrillLabel: 8,
    				isDrillingFinished: 18,
    				isInfiniteSimulation: 30,
    				isReturnDrillToStart: 31,
    				drillingTime: 19,
    				lastDrillingTime: 20,
    				isBlockDrillControls: 21,
    				drilledVertexColor: 32,
    				zAlgorithmRowSize: 33,
    				handleClick: 34,
    				handleMouseDown: 35,
    				handleTouchStart: 36,
    				removeAllEdges: 37,
    				removeAllVertices: 38,
    				generateVertices: 39,
    				moveDrillToStart: 40,
    				startSimulation: 41,
    				connectEdges: 42
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get vertexSize() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertexSize(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeSize() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeSize(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertexLabelColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertexLabelColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertexLabelSize() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertexLabelSize(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get verticesGenerationCount() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set verticesGenerationCount(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeLabelDistance() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeLabelDistance(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeLabelSize() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeLabelSize(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeLabelColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeLabelColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get totalDistance() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set totalDistance(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get totalDistanceWithStart() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set totalDistanceWithStart(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get connectAlgorithm() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set connectAlgorithm(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillNormalColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillNormalColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillLabelSize() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillLabelSize(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillLabelColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillLabelColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillMoveSpeed() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillMoveSpeed(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillSpinSpeed() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillSpinSpeed(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillRotationsCount() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillRotationsCount(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isShowDrillLabel() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isShowDrillLabel(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isDrillingFinished() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isDrillingFinished(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isInfiniteSimulation() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isInfiniteSimulation(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isReturnDrillToStart() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isReturnDrillToStart(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drillingTime() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drillingTime(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lastDrillingTime() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lastDrillingTime(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isBlockDrillControls() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isBlockDrillControls(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get drilledVertexColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set drilledVertexColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zAlgorithmRowSize() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zAlgorithmRowSize(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClick() {
    		return this.$$.ctx[34];
    	}

    	set handleClick(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleMouseDown() {
    		return this.$$.ctx[35];
    	}

    	set handleMouseDown(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleTouchStart() {
    		return this.$$.ctx[36];
    	}

    	set handleTouchStart(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeAllEdges() {
    		return this.$$.ctx[37];
    	}

    	set removeAllEdges(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeAllVertices() {
    		return this.$$.ctx[38];
    	}

    	set removeAllVertices(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get generateVertices() {
    		return this.$$.ctx[39];
    	}

    	set generateVertices(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get moveDrillToStart() {
    		return this.$$.ctx[40];
    	}

    	set moveDrillToStart(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startSimulation() {
    		return this.$$.ctx[41];
    	}

    	set startSimulation(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get connectEdges() {
    		return this.$$.ctx[42];
    	}

    	set connectEdges(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\FPS.svelte generated by Svelte v3.49.0 */

    function create_fragment$6(ctx) {
    	let text_1;
    	let t;
    	let current;

    	text_1 = new Text({
    			props: {
    				text: /*text*/ ctx[0],
    				fontSize: "12",
    				fontFamily: "Courier New",
    				align: "left",
    				baseline: "top",
    				x: 20,
    				y: 20
    			},
    			$$inline: true
    		});

    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			create_component(text_1.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(text_1, target, anchor);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const text_1_changes = {};
    			if (dirty & /*text*/ 1) text_1_changes.text = /*text*/ ctx[0];
    			text_1.$set(text_1_changes);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(text_1, detaching);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $showFPS;
    	validate_store(showFPS, 'showFPS');
    	component_subscribe($$self, showFPS, $$value => $$invalidate(5, $showFPS = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FPS', slots, ['default']);
    	let text = '';
    	let frames = 0;
    	let prevTime = performance.now();

    	renderable((state, dt) => {
    		let time = performance.now();
    		frames++;

    		if (time >= prevTime + 1000) {
    			const fps = frames * 1000 / (time - prevTime);
    			$$invalidate(0, text = `${fps.toFixed(1)} FPS`);
    			prevTime = time;
    			frames = 0;
    		}

    		if (!$showFPS) {
    			$$invalidate(0, text = '');
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FPS> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Text,
    		width,
    		renderable,
    		showFPS,
    		text,
    		frames,
    		prevTime,
    		$showFPS
    	});

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('frames' in $$props) frames = $$props.frames;
    		if ('prevTime' in $$props) prevTime = $$props.prevTime;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, $$scope, slots];
    }

    class FPS extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FPS",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\InputRange.svelte generated by Svelte v3.49.0 */

    const file$5 = "src\\InputRange.svelte";

    function create_fragment$5(ctx) {
    	let label;
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			div = element("div");
    			t0 = text(/*name*/ ctx[1]);
    			t1 = text(": ");
    			t2 = text(/*value*/ ctx[0]);
    			t3 = space();
    			input = element("input");
    			attr_dev(div, "class", "svelte-9fgmxq");
    			add_location(div, file$5, 8, 2, 164);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[2]);
    			attr_dev(input, "max", /*max*/ ctx[3]);
    			attr_dev(input, "step", /*step*/ ctx[4]);
    			attr_dev(input, "class", "svelte-9fgmxq");
    			add_location(input, file$5, 9, 2, 193);
    			attr_dev(label, "class", "wrapper svelte-9fgmxq");
    			add_location(label, file$5, 7, 0, 138);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, div);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(label, t3);
    			append_dev(label, input);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 2) set_data_dev(t0, /*name*/ ctx[1]);
    			if (dirty & /*value*/ 1) set_data_dev(t2, /*value*/ ctx[0]);

    			if (dirty & /*min*/ 4) {
    				attr_dev(input, "min", /*min*/ ctx[2]);
    			}

    			if (dirty & /*max*/ 8) {
    				attr_dev(input, "max", /*max*/ ctx[3]);
    			}

    			if (dirty & /*step*/ 16) {
    				attr_dev(input, "step", /*step*/ ctx[4]);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InputRange', slots, []);
    	let { name } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { value = min } = $$props;
    	let { step = 1 } = $$props;
    	const writable_props = ['name', 'min', 'max', 'value', 'step'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InputRange> was created with unknown prop '${key}'`);
    	});

    	function input_change_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('min' in $$props) $$invalidate(2, min = $$props.min);
    		if ('max' in $$props) $$invalidate(3, max = $$props.max);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('step' in $$props) $$invalidate(4, step = $$props.step);
    	};

    	$$self.$capture_state = () => ({ name, min, max, value, step });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('min' in $$props) $$invalidate(2, min = $$props.min);
    		if ('max' in $$props) $$invalidate(3, max = $$props.max);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('step' in $$props) $$invalidate(4, step = $$props.step);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, name, min, max, step, input_change_input_handler];
    }

    class InputRange extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			name: 1,
    			min: 2,
    			max: 3,
    			value: 0,
    			step: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputRange",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[1] === undefined && !('name' in props)) {
    			console.warn("<InputRange> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<InputRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<InputRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<InputRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<InputRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<InputRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<InputRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<InputRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<InputRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<InputRange>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<InputRange>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Checkbox.svelte generated by Svelte v3.49.0 */

    const file$4 = "src\\Checkbox.svelte";

    function create_fragment$4(ctx) {
    	let label;
    	let input;
    	let t0;
    	let span;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(/*title*/ ctx[1]);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-1nwpgdl");
    			add_location(input, file$4, 6, 2, 80);
    			add_location(span, file$4, 7, 2, 121);
    			attr_dev(label, "class", "svelte-1nwpgdl");
    			add_location(label, file$4, 5, 0, 70);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*checked*/ ctx[0];
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Checkbox', slots, []);
    	let { title } = $$props;
    	let { checked = false } = $$props;
    	const writable_props = ['title', 'checked'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Checkbox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    	};

    	$$self.$capture_state = () => ({ title, checked });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('checked' in $$props) $$invalidate(0, checked = $$props.checked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, title, input_change_handler];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { title: 1, checked: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<Checkbox> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\ColorSelector.svelte generated by Svelte v3.49.0 */

    const { Error: Error_1 } = globals;
    const file$3 = "src\\ColorSelector.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (33:2) {#each Array(...COLORS.entries()) as idAndColor}
    function create_each_block$1(ctx) {
    	let button;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*idAndColor*/ ctx[3]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");

    			attr_dev(button, "class", button_class_value = "" + ((/*selectedId*/ ctx[0] === /*idAndColor*/ ctx[3][0]
    			? 'selected'
    			: '') + " " + /*checkmarkColor*/ ctx[1] + " svelte-1hyvmj2"));

    			attr_dev(button, "name", "color");
    			attr_dev(button, "type", "radio");
    			attr_dev(button, "style", `background-color: ${/*idAndColor*/ ctx[3][1]};`);
    			add_location(button, file$3, 33, 4, 988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selectedId, checkmarkColor*/ 3 && button_class_value !== (button_class_value = "" + ((/*selectedId*/ ctx[0] === /*idAndColor*/ ctx[3][0]
    			? 'selected'
    			: '') + " " + /*checkmarkColor*/ ctx[1] + " svelte-1hyvmj2"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(33:2) {#each Array(...COLORS.entries()) as idAndColor}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_value = Array(...COLORS.entries());
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-1hyvmj2");
    			add_location(div, file$3, 31, 0, 911);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectedId, Array, COLORS, checkmarkColor, invertColor*/ 3) {
    				each_value = Array(...COLORS.entries());
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function invertColor(hex) {
    	if (hex === 'white') {
    		hex = '#FFFFFF';
    	} else if (hex === 'black') {
    		hex = '#000000';
    	}

    	if (hex.indexOf('#') === 0) {
    		hex = hex.slice(1);
    	}

    	// convert 3-digit hex to 6-digits.
    	if (hex.length === 3) {
    		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    	}

    	if (hex.length !== 6) {
    		throw new Error('Invalid HEX color.');
    	}

    	let r = parseInt(hex.slice(0, 2), 16),
    		g = parseInt(hex.slice(2, 4), 16),
    		b = parseInt(hex.slice(4, 6), 16);

    	return r * 0.299 + g * 0.587 + b * 0.114 > 186
    	? 'black'
    	: 'white';
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ColorSelector', slots, []);
    	let { selectedId = 0 } = $$props;
    	let checkmarkColor = 'white';

    	onMount(function () {
    		$$invalidate(1, checkmarkColor = invertColor(COLORS[selectedId]));
    	});

    	const writable_props = ['selectedId'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ColorSelector> was created with unknown prop '${key}'`);
    	});

    	const click_handler = idAndColor => {
    		$$invalidate(0, selectedId = idAndColor[0]);
    		$$invalidate(1, checkmarkColor = invertColor(COLORS[selectedId]));
    	};

    	$$self.$$set = $$props => {
    		if ('selectedId' in $$props) $$invalidate(0, selectedId = $$props.selectedId);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		COLORS,
    		selectedId,
    		checkmarkColor,
    		invertColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('selectedId' in $$props) $$invalidate(0, selectedId = $$props.selectedId);
    		if ('checkmarkColor' in $$props) $$invalidate(1, checkmarkColor = $$props.checkmarkColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedId, checkmarkColor, click_handler];
    }

    class ColorSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { selectedId: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorSelector",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get selectedId() {
    		throw new Error_1("<ColorSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedId(value) {
    		throw new Error_1("<ColorSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Window.svelte generated by Svelte v3.49.0 */

    const { window: window_1 } = globals;
    const file$2 = "src\\Window.svelte";

    // (96:0) {#if isOpened}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[3]);
    			t1 = space();
    			button = element("button");
    			t2 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(h2, "class", "controls-block__title svelte-hg70t");
    			add_location(h2, file$2, 103, 12, 2891);
    			attr_dev(button, "class", "close svelte-hg70t");
    			add_location(button, file$2, 106, 12, 2983);
    			attr_dev(div0, "class", "controls-block svelte-hg70t");
    			add_location(div0, file$2, 102, 8, 2849);
    			attr_dev(div1, "class", "controls svelte-hg70t");
    			set_style(div1, "z-index", /*zIndex*/ ctx[4] + 1);
    			set_style(div1, "left", /*x*/ ctx[1] + "px");
    			set_style(div1, "top", /*y*/ ctx[2] + "px");
    			add_location(div1, file$2, 96, 4, 2632);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(div0, t2);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div1_binding*/ ctx[16](div1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*onClose*/ ctx[6], false, false, false),
    					listen_dev(div1, "mousedown", /*handleMouseDown*/ ctx[9], false, false, false),
    					listen_dev(div1, "touchstart", /*handleTouchStart*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*title*/ 8) set_data_dev(t0, /*title*/ ctx[3]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[14],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*zIndex*/ 16) {
    				set_style(div1, "z-index", /*zIndex*/ ctx[4] + 1);
    			}

    			if (!current || dirty & /*x*/ 2) {
    				set_style(div1, "left", /*x*/ ctx[1] + "px");
    			}

    			if (!current || dirty & /*y*/ 4) {
    				set_style(div1, "top", /*y*/ ctx[2] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			/*div1_binding*/ ctx[16](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(96:0) {#if isOpened}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isOpened*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "mouseup", /*handleMouseUp*/ ctx[11], false, false, false),
    					listen_dev(window_1, "touchend", /*handleMouseUp*/ ctx[11], false, false, false),
    					listen_dev(window_1, "mousemove", /*handleMouseMove*/ ctx[10], false, false, false),
    					listen_dev(window_1, "touchmove", /*handleTouchMove*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isOpened*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isOpened*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $height;
    	let $width;
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(23, $height = $$value));
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(24, $width = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Window', slots, ['default']);
    	let window;
    	let { title = '' } = $$props;
    	let { isOpened = true } = $$props;
    	let { zIndex = 0 } = $$props;
    	let { onCloseHandler = null } = $$props;
    	let { onClickHandler = null } = $$props;
    	let { x = 100 } = $$props;
    	let { y = 100 } = $$props;
    	let isMouseDown = false;
    	let isFirstRender = true;
    	let mouse;
    	let outOfBoundLimitX = 100;
    	let outOfBoundLimitY = 100;

    	afterUpdate(() => {
    		if (isFirstRender && window) {
    			$$invalidate(1, x = Math.floor($width / 2) - Math.floor(window.clientWidth / 2));
    			$$invalidate(2, y = Math.floor($height / 2) - Math.floor(window.clientHeight / 2));
    			isFirstRender = false;
    		}

    		if (window) {
    			outOfBoundLimitX = Math.floor(window.clientWidth / 2);
    			outOfBoundLimitY = Math.floor(window.clientHeight / 2);
    			checkPosition();
    		}
    	});

    	function onClose() {
    		$$invalidate(0, isOpened = false);

    		if (onCloseHandler) {
    			onCloseHandler();
    		}
    	}

    	function checkPosition() {
    		if (x > $width - outOfBoundLimitX) {
    			$$invalidate(1, x = $width - outOfBoundLimitX);
    		} else if (x < -outOfBoundLimitX) {
    			$$invalidate(1, x = -outOfBoundLimitX);
    		}

    		if (y > $height - outOfBoundLimitY) {
    			$$invalidate(2, y = $height - outOfBoundLimitY);
    		} else if (y < -outOfBoundLimitY) {
    			$$invalidate(2, y = -outOfBoundLimitY);
    		}
    	}

    	function handleTouchStart(ev) {
    		let touch = ev.touches[0];
    		handleMouseDown(touch);
    	}

    	let previousTouch = null;

    	function handleTouchMove(ev) {
    		let touch = ev.touches[0];

    		if (previousTouch) {
    			touch.movementX = touch.pageX - previousTouch.pageX;
    			touch.movementY = touch.pageY - previousTouch.pageY;
    			handleMouseMove(touch);
    		}

    		previousTouch = touch;
    	}

    	function handleMouseDown(ev) {
    		const classes = ev.target.className;
    		const moveClasses = ['controls', 'controls-block', 'controls-block__title'];
    		const dy = ev.clientY - y;

    		if (moveClasses.some(classes.includes.bind(classes)) && dy < 50) {
    			isMouseDown = true;
    			mouse = { x, y };
    		}

    		if (onClickHandler) {
    			onClickHandler();
    		}
    	}

    	function handleMouseMove(ev) {
    		if (isMouseDown && mouse) {
    			mouse.x += ev.movementX;
    			mouse.y += ev.movementY;
    			$$invalidate(1, x = mouse.x);
    			$$invalidate(2, y = mouse.y);
    			checkPosition();
    		}
    	}

    	function handleMouseUp() {
    		isMouseDown = false;
    		previousTouch = null;
    	}

    	const writable_props = ['title', 'isOpened', 'zIndex', 'onCloseHandler', 'onClickHandler', 'x', 'y'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Window> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			window = $$value;
    			$$invalidate(5, window);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(3, title = $$props.title);
    		if ('isOpened' in $$props) $$invalidate(0, isOpened = $$props.isOpened);
    		if ('zIndex' in $$props) $$invalidate(4, zIndex = $$props.zIndex);
    		if ('onCloseHandler' in $$props) $$invalidate(12, onCloseHandler = $$props.onCloseHandler);
    		if ('onClickHandler' in $$props) $$invalidate(13, onClickHandler = $$props.onClickHandler);
    		if ('x' in $$props) $$invalidate(1, x = $$props.x);
    		if ('y' in $$props) $$invalidate(2, y = $$props.y);
    		if ('$$scope' in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		height,
    		width,
    		afterUpdate,
    		window,
    		title,
    		isOpened,
    		zIndex,
    		onCloseHandler,
    		onClickHandler,
    		x,
    		y,
    		isMouseDown,
    		isFirstRender,
    		mouse,
    		outOfBoundLimitX,
    		outOfBoundLimitY,
    		onClose,
    		checkPosition,
    		handleTouchStart,
    		previousTouch,
    		handleTouchMove,
    		handleMouseDown,
    		handleMouseMove,
    		handleMouseUp,
    		$height,
    		$width
    	});

    	$$self.$inject_state = $$props => {
    		if ('window' in $$props) $$invalidate(5, window = $$props.window);
    		if ('title' in $$props) $$invalidate(3, title = $$props.title);
    		if ('isOpened' in $$props) $$invalidate(0, isOpened = $$props.isOpened);
    		if ('zIndex' in $$props) $$invalidate(4, zIndex = $$props.zIndex);
    		if ('onCloseHandler' in $$props) $$invalidate(12, onCloseHandler = $$props.onCloseHandler);
    		if ('onClickHandler' in $$props) $$invalidate(13, onClickHandler = $$props.onClickHandler);
    		if ('x' in $$props) $$invalidate(1, x = $$props.x);
    		if ('y' in $$props) $$invalidate(2, y = $$props.y);
    		if ('isMouseDown' in $$props) isMouseDown = $$props.isMouseDown;
    		if ('isFirstRender' in $$props) isFirstRender = $$props.isFirstRender;
    		if ('mouse' in $$props) mouse = $$props.mouse;
    		if ('outOfBoundLimitX' in $$props) outOfBoundLimitX = $$props.outOfBoundLimitX;
    		if ('outOfBoundLimitY' in $$props) outOfBoundLimitY = $$props.outOfBoundLimitY;
    		if ('previousTouch' in $$props) previousTouch = $$props.previousTouch;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isOpened,
    		x,
    		y,
    		title,
    		zIndex,
    		window,
    		onClose,
    		handleTouchStart,
    		handleTouchMove,
    		handleMouseDown,
    		handleMouseMove,
    		handleMouseUp,
    		onCloseHandler,
    		onClickHandler,
    		$$scope,
    		slots,
    		div1_binding
    	];
    }

    class Window extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			title: 3,
    			isOpened: 0,
    			zIndex: 4,
    			onCloseHandler: 12,
    			onClickHandler: 13,
    			x: 1,
    			y: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Window",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get title() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpened() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpened(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zIndex() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zIndex(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onCloseHandler() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onCloseHandler(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClickHandler() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClickHandler(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\RadioButtons.svelte generated by Svelte v3.49.0 */
    const file$1 = "src\\RadioButtons.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i].option;
    	child_ctx[7] = list[i].label;
    	child_ctx[8] = list[i].id;
    	return child_ctx;
    }

    // (7:0) {#each options as { option, label, id }}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let t0;
    	let label;
    	let t1_value = getTranslation(/*$lang*/ ctx[3], /*label*/ ctx[7]) + "";
    	let t1;
    	let label_for_value;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "id", input_id_value = /*id*/ ctx[8]);
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "name", /*groupName*/ ctx[2]);
    			input.__value = input_value_value = /*option*/ ctx[6];
    			input.value = input.__value;
    			attr_dev(input, "class", "svelte-cdr04i");
    			/*$$binding_groups*/ ctx[5][0].push(input);
    			add_location(input, file$1, 9, 12, 281);
    			attr_dev(label, "for", label_for_value = /*id*/ ctx[8]);
    			attr_dev(label, "class", "svelte-cdr04i");
    			add_location(label, file$1, 10, 12, 376);
    			attr_dev(div0, "class", "option svelte-cdr04i");
    			add_location(div0, file$1, 8, 8, 247);
    			attr_dev(div1, "class", "input_row svelte-cdr04i");
    			add_location(div1, file$1, 7, 4, 214);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			input.checked = input.__value === /*group*/ ctx[0];
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, t1);
    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 2 && input_id_value !== (input_id_value = /*id*/ ctx[8])) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*groupName*/ 4) {
    				attr_dev(input, "name", /*groupName*/ ctx[2]);
    			}

    			if (dirty & /*options*/ 2 && input_value_value !== (input_value_value = /*option*/ ctx[6])) {
    				prop_dev(input, "__value", input_value_value);
    				input.value = input.__value;
    			}

    			if (dirty & /*group*/ 1) {
    				input.checked = input.__value === /*group*/ ctx[0];
    			}

    			if (dirty & /*$lang, options*/ 10 && t1_value !== (t1_value = getTranslation(/*$lang*/ ctx[3], /*label*/ ctx[7]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*options*/ 2 && label_for_value !== (label_for_value = /*id*/ ctx[8])) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*$$binding_groups*/ ctx[5][0].splice(/*$$binding_groups*/ ctx[5][0].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(7:0) {#each options as { option, label, id }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*options, getTranslation, $lang, groupName, group*/ 15) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $lang;
    	validate_store(lang, 'lang');
    	component_subscribe($$self, lang, $$value => $$invalidate(3, $lang = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RadioButtons', slots, []);
    	let { options } = $$props;
    	let { group = null } = $$props;
    	let { groupName = "" } = $$props;
    	const writable_props = ['options', 'group', 'groupName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RadioButtons> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input_change_handler() {
    		group = this.__value;
    		$$invalidate(0, group);
    	}

    	$$self.$$set = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('group' in $$props) $$invalidate(0, group = $$props.group);
    		if ('groupName' in $$props) $$invalidate(2, groupName = $$props.groupName);
    	};

    	$$self.$capture_state = () => ({
    		lang,
    		getTranslation,
    		options,
    		group,
    		groupName,
    		$lang
    	});

    	$$self.$inject_state = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('group' in $$props) $$invalidate(0, group = $$props.group);
    		if ('groupName' in $$props) $$invalidate(2, groupName = $$props.groupName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [group, options, groupName, $lang, input_change_handler, $$binding_groups];
    }

    class RadioButtons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { options: 1, group: 0, groupName: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RadioButtons",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*options*/ ctx[1] === undefined && !('options' in props)) {
    			console.warn("<RadioButtons> was created without expected prop 'options'");
    		}
    	}

    	get options() {
    		throw new Error("<RadioButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<RadioButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get group() {
    		throw new Error("<RadioButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set group(value) {
    		throw new Error("<RadioButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupName() {
    		throw new Error("<RadioButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupName(value) {
    		throw new Error("<RadioButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (169:1) <Background color={COLORS[backgroundColorId]}>
    function create_default_slot_9(ctx) {
    	let dotgrid;
    	let current;

    	dotgrid = new DotGrid({
    			props: {
    				divisions: 30,
    				color: "hsla(0, 0%, 100%, 0.5)"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dotgrid.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dotgrid, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dotgrid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dotgrid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dotgrid, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(169:1) <Background color={COLORS[backgroundColorId]}>",
    		ctx
    	});

    	return block;
    }

    // (164:0) <Canvas    onClick={graphClickHandler}    onMouseDown={graphMouseDownHandler}    onTouchStart={graphTouchStartHandler}  >
    function create_default_slot_8(ctx) {
    	let background;
    	let t0;
    	let graph;
    	let updating_totalDistance;
    	let updating_totalDistanceWithStart;
    	let updating_drillingTime;
    	let updating_lastDrillingTime;
    	let updating_isBlockDrillControls;
    	let t1;
    	let text_1;
    	let t2;
    	let fps;
    	let current;

    	background = new Background({
    			props: {
    				color: COLORS[/*backgroundColorId*/ ctx[26]],
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function graph_totalDistance_binding(value) {
    		/*graph_totalDistance_binding*/ ctx[60](value);
    	}

    	function graph_totalDistanceWithStart_binding(value) {
    		/*graph_totalDistanceWithStart_binding*/ ctx[61](value);
    	}

    	function graph_drillingTime_binding(value) {
    		/*graph_drillingTime_binding*/ ctx[62](value);
    	}

    	function graph_lastDrillingTime_binding(value) {
    		/*graph_lastDrillingTime_binding*/ ctx[63](value);
    	}

    	function graph_isBlockDrillControls_binding(value) {
    		/*graph_isBlockDrillControls_binding*/ ctx[64](value);
    	}

    	let graph_props = {
    		vertexSize: /*vertexSize*/ ctx[1],
    		edgeSize: /*edgeSize*/ ctx[2],
    		vertexLabelSize: /*vertexLabelSize*/ ctx[4],
    		vertexLabelColor: COLORS[/*vertexLabelColorId*/ ctx[3]],
    		verticesGenerationCount: /*verticesGenerationCount*/ ctx[5],
    		edgeLabelColor: COLORS[/*edgeLabelColorId*/ ctx[8]],
    		edgeLabelSize: /*edgeLabelSize*/ ctx[7],
    		edgeLabelDistance: /*edgeLabelDistance*/ ctx[6],
    		connectAlgorithm: /*connectAlgorithm*/ ctx[11],
    		isShowDrillLabel: /*isShowDrillLabel*/ ctx[19],
    		drillLabelSize: /*drillLabelSize*/ ctx[17],
    		drillLabelColor: COLORS[/*drillLabelColorId*/ ctx[18]],
    		drillColor: COLORS[/*drillColorId*/ ctx[15]],
    		drillNormalColor: COLORS[/*drillNormalColorId*/ ctx[16]],
    		drillMoveSpeed: /*drillMoveSpeed*/ ctx[12],
    		drillSpinSpeed: /*drillSpinSpeed*/ ctx[13],
    		drillRotationsCount: /*drillRotationsCount*/ ctx[14],
    		isInfiniteSimulation: /*isInfiniteSimulation*/ ctx[20],
    		isReturnDrillToStart: /*isReturnDrillToStart*/ ctx[23],
    		drilledVertexColor: COLORS[/*drilledVertexColorId*/ ctx[25]],
    		zAlgorithmRowSize: /*zAlgorithmRowSize*/ ctx[27]
    	};

    	if (/*totalDistance*/ ctx[9] !== void 0) {
    		graph_props.totalDistance = /*totalDistance*/ ctx[9];
    	}

    	if (/*totalDistanceWithStart*/ ctx[10] !== void 0) {
    		graph_props.totalDistanceWithStart = /*totalDistanceWithStart*/ ctx[10];
    	}

    	if (/*drillingTime*/ ctx[21] !== void 0) {
    		graph_props.drillingTime = /*drillingTime*/ ctx[21];
    	}

    	if (/*lastDrillingTime*/ ctx[22] !== void 0) {
    		graph_props.lastDrillingTime = /*lastDrillingTime*/ ctx[22];
    	}

    	if (/*isBlockDrillControls*/ ctx[24] !== void 0) {
    		graph_props.isBlockDrillControls = /*isBlockDrillControls*/ ctx[24];
    	}

    	graph = new Graph({ props: graph_props, $$inline: true });
    	/*graph_binding*/ ctx[59](graph);
    	binding_callbacks.push(() => bind(graph, 'totalDistance', graph_totalDistance_binding));
    	binding_callbacks.push(() => bind(graph, 'totalDistanceWithStart', graph_totalDistanceWithStart_binding));
    	binding_callbacks.push(() => bind(graph, 'drillingTime', graph_drillingTime_binding));
    	binding_callbacks.push(() => bind(graph, 'lastDrillingTime', graph_lastDrillingTime_binding));
    	binding_callbacks.push(() => bind(graph, 'isBlockDrillControls', graph_isBlockDrillControls_binding));

    	text_1 = new Text({
    			props: {
    				show: /*$showHint*/ ctx[43],
    				text: getTranslation(/*$lang*/ ctx[41], 'addHint'),
    				fontSize: 12,
    				align: "right",
    				baseline: "bottom",
    				x: /*$width*/ ctx[44] - 20,
    				y: /*$height*/ ctx[45] - 20
    			},
    			$$inline: true
    		});

    	fps = new FPS({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(background.$$.fragment);
    			t0 = space();
    			create_component(graph.$$.fragment);
    			t1 = space();
    			create_component(text_1.$$.fragment);
    			t2 = space();
    			create_component(fps.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(background, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(graph, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(text_1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(fps, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const background_changes = {};
    			if (dirty[0] & /*backgroundColorId*/ 67108864) background_changes.color = COLORS[/*backgroundColorId*/ ctx[26]];

    			if (dirty[3] & /*$$scope*/ 1073741824) {
    				background_changes.$$scope = { dirty, ctx };
    			}

    			background.$set(background_changes);
    			const graph_changes = {};
    			if (dirty[0] & /*vertexSize*/ 2) graph_changes.vertexSize = /*vertexSize*/ ctx[1];
    			if (dirty[0] & /*edgeSize*/ 4) graph_changes.edgeSize = /*edgeSize*/ ctx[2];
    			if (dirty[0] & /*vertexLabelSize*/ 16) graph_changes.vertexLabelSize = /*vertexLabelSize*/ ctx[4];
    			if (dirty[0] & /*vertexLabelColorId*/ 8) graph_changes.vertexLabelColor = COLORS[/*vertexLabelColorId*/ ctx[3]];
    			if (dirty[0] & /*verticesGenerationCount*/ 32) graph_changes.verticesGenerationCount = /*verticesGenerationCount*/ ctx[5];
    			if (dirty[0] & /*edgeLabelColorId*/ 256) graph_changes.edgeLabelColor = COLORS[/*edgeLabelColorId*/ ctx[8]];
    			if (dirty[0] & /*edgeLabelSize*/ 128) graph_changes.edgeLabelSize = /*edgeLabelSize*/ ctx[7];
    			if (dirty[0] & /*edgeLabelDistance*/ 64) graph_changes.edgeLabelDistance = /*edgeLabelDistance*/ ctx[6];
    			if (dirty[0] & /*connectAlgorithm*/ 2048) graph_changes.connectAlgorithm = /*connectAlgorithm*/ ctx[11];
    			if (dirty[0] & /*isShowDrillLabel*/ 524288) graph_changes.isShowDrillLabel = /*isShowDrillLabel*/ ctx[19];
    			if (dirty[0] & /*drillLabelSize*/ 131072) graph_changes.drillLabelSize = /*drillLabelSize*/ ctx[17];
    			if (dirty[0] & /*drillLabelColorId*/ 262144) graph_changes.drillLabelColor = COLORS[/*drillLabelColorId*/ ctx[18]];
    			if (dirty[0] & /*drillColorId*/ 32768) graph_changes.drillColor = COLORS[/*drillColorId*/ ctx[15]];
    			if (dirty[0] & /*drillNormalColorId*/ 65536) graph_changes.drillNormalColor = COLORS[/*drillNormalColorId*/ ctx[16]];
    			if (dirty[0] & /*drillMoveSpeed*/ 4096) graph_changes.drillMoveSpeed = /*drillMoveSpeed*/ ctx[12];
    			if (dirty[0] & /*drillSpinSpeed*/ 8192) graph_changes.drillSpinSpeed = /*drillSpinSpeed*/ ctx[13];
    			if (dirty[0] & /*drillRotationsCount*/ 16384) graph_changes.drillRotationsCount = /*drillRotationsCount*/ ctx[14];
    			if (dirty[0] & /*isInfiniteSimulation*/ 1048576) graph_changes.isInfiniteSimulation = /*isInfiniteSimulation*/ ctx[20];
    			if (dirty[0] & /*isReturnDrillToStart*/ 8388608) graph_changes.isReturnDrillToStart = /*isReturnDrillToStart*/ ctx[23];
    			if (dirty[0] & /*drilledVertexColorId*/ 33554432) graph_changes.drilledVertexColor = COLORS[/*drilledVertexColorId*/ ctx[25]];
    			if (dirty[0] & /*zAlgorithmRowSize*/ 134217728) graph_changes.zAlgorithmRowSize = /*zAlgorithmRowSize*/ ctx[27];

    			if (!updating_totalDistance && dirty[0] & /*totalDistance*/ 512) {
    				updating_totalDistance = true;
    				graph_changes.totalDistance = /*totalDistance*/ ctx[9];
    				add_flush_callback(() => updating_totalDistance = false);
    			}

    			if (!updating_totalDistanceWithStart && dirty[0] & /*totalDistanceWithStart*/ 1024) {
    				updating_totalDistanceWithStart = true;
    				graph_changes.totalDistanceWithStart = /*totalDistanceWithStart*/ ctx[10];
    				add_flush_callback(() => updating_totalDistanceWithStart = false);
    			}

    			if (!updating_drillingTime && dirty[0] & /*drillingTime*/ 2097152) {
    				updating_drillingTime = true;
    				graph_changes.drillingTime = /*drillingTime*/ ctx[21];
    				add_flush_callback(() => updating_drillingTime = false);
    			}

    			if (!updating_lastDrillingTime && dirty[0] & /*lastDrillingTime*/ 4194304) {
    				updating_lastDrillingTime = true;
    				graph_changes.lastDrillingTime = /*lastDrillingTime*/ ctx[22];
    				add_flush_callback(() => updating_lastDrillingTime = false);
    			}

    			if (!updating_isBlockDrillControls && dirty[0] & /*isBlockDrillControls*/ 16777216) {
    				updating_isBlockDrillControls = true;
    				graph_changes.isBlockDrillControls = /*isBlockDrillControls*/ ctx[24];
    				add_flush_callback(() => updating_isBlockDrillControls = false);
    			}

    			graph.$set(graph_changes);
    			const text_1_changes = {};
    			if (dirty[1] & /*$showHint*/ 4096) text_1_changes.show = /*$showHint*/ ctx[43];
    			if (dirty[1] & /*$lang*/ 1024) text_1_changes.text = getTranslation(/*$lang*/ ctx[41], 'addHint');
    			if (dirty[1] & /*$width*/ 8192) text_1_changes.x = /*$width*/ ctx[44] - 20;
    			if (dirty[1] & /*$height*/ 16384) text_1_changes.y = /*$height*/ ctx[45] - 20;
    			text_1.$set(text_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background.$$.fragment, local);
    			transition_in(graph.$$.fragment, local);
    			transition_in(text_1.$$.fragment, local);
    			transition_in(fps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background.$$.fragment, local);
    			transition_out(graph.$$.fragment, local);
    			transition_out(text_1.$$.fragment, local);
    			transition_out(fps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(background, detaching);
    			if (detaching) detach_dev(t0);
    			/*graph_binding*/ ctx[59](null);
    			destroy_component(graph, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(text_1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(fps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(164:0) <Canvas    onClick={graphClickHandler}    onMouseDown={graphMouseDownHandler}    onTouchStart={graphTouchStartHandler}  >",
    		ctx
    	});

    	return block;
    }

    // (300:1) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let t_value = getTranslation(/*$lang*/ ctx[41], "showMenu") + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-9ys6l6");
    			add_location(button, file, 300, 2, 10144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_8*/ ctx[76], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*$lang*/ 1024 && t_value !== (t_value = getTranslation(/*$lang*/ ctx[41], "showMenu") + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(300:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (213:1) {#if $showMenu}
    function create_if_block_11(ctx) {
    	let div1;
    	let div0;
    	let button0;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], "about") + "";
    	let t0;
    	let t1;
    	let button1;
    	let t2_value = getTranslation(/*$lang*/ ctx[41], "hideMenu") + "";
    	let t2;
    	let t3;
    	let div4;
    	let h20;
    	let t4_value = getTranslation(/*$lang*/ ctx[41], "graphControls") + "";
    	let t4;
    	let t5;
    	let checkbox;
    	let updating_checked;
    	let t6;
    	let t7;
    	let t8;
    	let inputrange;
    	let updating_value;
    	let t9;
    	let div2;
    	let button2;
    	let t10_value = getTranslation(/*$lang*/ ctx[41], "connectVertices") + "";
    	let t10;
    	let t11;
    	let div3;
    	let button3;
    	let t12_value = getTranslation(/*$lang*/ ctx[41], "showTotalDistance") + "";
    	let t12;
    	let t13;
    	let t14;
    	let div8;
    	let h21;
    	let t15_value = getTranslation(/*$lang*/ ctx[41], "settings") + "";
    	let t15;
    	let t16;
    	let div5;
    	let button4;
    	let t17_value = getTranslation(/*$lang*/ ctx[41], "openVertexSettings") + "";
    	let t17;
    	let t18;
    	let div6;
    	let button5;
    	let t19_value = getTranslation(/*$lang*/ ctx[41], "openEdgeSettings") + "";
    	let t19;
    	let t20;
    	let div7;
    	let button6;
    	let t21_value = getTranslation(/*$lang*/ ctx[41], "openOtherSettings") + "";
    	let t21;
    	let current;
    	let mounted;
    	let dispose;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[67](value);
    	}

    	let checkbox_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "removeEdgesOnMoving")
    	};

    	if (/*$removeEdgesOnMoving*/ ctx[47] !== void 0) {
    		checkbox_props.checked = /*$removeEdgesOnMoving*/ ctx[47];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding));
    	let if_block0 = !/*isBlockDrillControls*/ ctx[24] && create_if_block_14(ctx);
    	let if_block1 = !/*$isSimulationMode*/ ctx[42] && create_if_block_13(ctx);

    	function inputrange_value_binding(value) {
    		/*inputrange_value_binding*/ ctx[69](value);
    	}

    	let inputrange_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "verticesGenerationCount"),
    		min: 2,
    		max: 100,
    		step: 1
    	};

    	if (/*verticesGenerationCount*/ ctx[5] !== void 0) {
    		inputrange_props.value = /*verticesGenerationCount*/ ctx[5];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding));
    	let if_block2 = /*$isSimulationMode*/ ctx[42] && create_if_block_12(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			button1 = element("button");
    			t2 = text(t2_value);
    			t3 = space();
    			div4 = element("div");
    			h20 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			create_component(checkbox.$$.fragment);
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			create_component(inputrange.$$.fragment);
    			t9 = space();
    			div2 = element("div");
    			button2 = element("button");
    			t10 = text(t10_value);
    			t11 = space();
    			div3 = element("div");
    			button3 = element("button");
    			t12 = text(t12_value);
    			t13 = space();
    			if (if_block2) if_block2.c();
    			t14 = space();
    			div8 = element("div");
    			h21 = element("h2");
    			t15 = text(t15_value);
    			t16 = space();
    			div5 = element("div");
    			button4 = element("button");
    			t17 = text(t17_value);
    			t18 = space();
    			div6 = element("div");
    			button5 = element("button");
    			t19 = text(t19_value);
    			t20 = space();
    			div7 = element("div");
    			button6 = element("button");
    			t21 = text(t21_value);
    			attr_dev(button0, "class", "svelte-9ys6l6");
    			add_location(button0, file, 215, 4, 7483);
    			attr_dev(button1, "class", "svelte-9ys6l6");
    			add_location(button1, file, 218, 4, 7602);
    			attr_dev(div0, "class", "buttons-row svelte-9ys6l6");
    			add_location(div0, file, 214, 3, 7452);
    			attr_dev(div1, "class", "controls-block svelte-9ys6l6");
    			add_location(div1, file, 213, 2, 7419);
    			attr_dev(h20, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h20, file, 224, 3, 7762);
    			attr_dev(button2, "class", "svelte-9ys6l6");
    			add_location(button2, file, 262, 4, 8869);
    			attr_dev(div2, "class", "buttons-row svelte-9ys6l6");
    			add_location(div2, file, 261, 3, 8838);
    			attr_dev(button3, "class", "svelte-9ys6l6");
    			add_location(button3, file, 267, 4, 9049);
    			attr_dev(div3, "class", "buttons-row svelte-9ys6l6");
    			add_location(div3, file, 266, 3, 9018);
    			attr_dev(div4, "class", "controls-block svelte-9ys6l6");
    			add_location(div4, file, 223, 2, 7729);
    			attr_dev(h21, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h21, file, 280, 3, 9469);
    			attr_dev(button4, "class", "svelte-9ys6l6");
    			add_location(button4, file, 284, 4, 9590);
    			attr_dev(div5, "class", "buttons-row svelte-9ys6l6");
    			add_location(div5, file, 283, 3, 9559);
    			attr_dev(button5, "class", "svelte-9ys6l6");
    			add_location(button5, file, 289, 4, 9772);
    			attr_dev(div6, "class", "buttons-row svelte-9ys6l6");
    			add_location(div6, file, 288, 3, 9741);
    			attr_dev(button6, "class", "svelte-9ys6l6");
    			add_location(button6, file, 294, 4, 9976);
    			attr_dev(div7, "class", "buttons-row svelte-9ys6l6");
    			set_style(div7, "margin-bottom", "0");
    			add_location(div7, file, 293, 3, 9919);
    			attr_dev(div8, "class", "controls-block svelte-9ys6l6");
    			add_location(div8, file, 279, 2, 9436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(button0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			append_dev(button1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h20);
    			append_dev(h20, t4);
    			append_dev(div4, t5);
    			mount_component(checkbox, div4, null);
    			append_dev(div4, t6);
    			if (if_block0) if_block0.m(div4, null);
    			append_dev(div4, t7);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div4, t8);
    			mount_component(inputrange, div4, null);
    			append_dev(div4, t9);
    			append_dev(div4, div2);
    			append_dev(div2, button2);
    			append_dev(button2, t10);
    			append_dev(div4, t11);
    			append_dev(div4, div3);
    			append_dev(div3, button3);
    			append_dev(button3, t12);
    			append_dev(div4, t13);
    			if (if_block2) if_block2.m(div4, null);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, h21);
    			append_dev(h21, t15);
    			append_dev(div8, t16);
    			append_dev(div8, div5);
    			append_dev(div5, button4);
    			append_dev(button4, t17);
    			append_dev(div8, t18);
    			append_dev(div8, div6);
    			append_dev(div6, button5);
    			append_dev(button5, t19);
    			append_dev(div8, t20);
    			append_dev(div8, div7);
    			append_dev(div7, button6);
    			append_dev(button6, t21);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[65], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[66], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[70], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[71], false, false, false),
    					listen_dev(button4, "click", /*click_handler_5*/ ctx[73], false, false, false),
    					listen_dev(button5, "click", /*click_handler_6*/ ctx[74], false, false, false),
    					listen_dev(button6, "click", /*click_handler_7*/ ctx[75], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], "about") + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t2_value !== (t2_value = getTranslation(/*$lang*/ ctx[41], "hideMenu") + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t4_value !== (t4_value = getTranslation(/*$lang*/ ctx[41], "graphControls") + "")) set_data_dev(t4, t4_value);
    			const checkbox_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox_changes.title = getTranslation(/*$lang*/ ctx[41], "removeEdgesOnMoving");

    			if (!updating_checked && dirty[1] & /*$removeEdgesOnMoving*/ 65536) {
    				updating_checked = true;
    				checkbox_changes.checked = /*$removeEdgesOnMoving*/ ctx[47];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);

    			if (!/*isBlockDrillControls*/ ctx[24]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*isBlockDrillControls*/ 16777216) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_14(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div4, t7);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*$isSimulationMode*/ ctx[42]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_13(ctx);
    					if_block1.c();
    					if_block1.m(div4, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const inputrange_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange_changes.name = getTranslation(/*$lang*/ ctx[41], "verticesGenerationCount");

    			if (!updating_value && dirty[0] & /*verticesGenerationCount*/ 32) {
    				updating_value = true;
    				inputrange_changes.value = /*verticesGenerationCount*/ ctx[5];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t10_value !== (t10_value = getTranslation(/*$lang*/ ctx[41], "connectVertices") + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t12_value !== (t12_value = getTranslation(/*$lang*/ ctx[41], "showTotalDistance") + "")) set_data_dev(t12, t12_value);

    			if (/*$isSimulationMode*/ ctx[42]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_12(ctx);
    					if_block2.c();
    					if_block2.m(div4, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if ((!current || dirty[1] & /*$lang*/ 1024) && t15_value !== (t15_value = getTranslation(/*$lang*/ ctx[41], "settings") + "")) set_data_dev(t15, t15_value);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t17_value !== (t17_value = getTranslation(/*$lang*/ ctx[41], "openVertexSettings") + "")) set_data_dev(t17, t17_value);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t19_value !== (t19_value = getTranslation(/*$lang*/ ctx[41], "openEdgeSettings") + "")) set_data_dev(t19, t19_value);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t21_value !== (t21_value = getTranslation(/*$lang*/ ctx[41], "openOtherSettings") + "")) set_data_dev(t21, t21_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(inputrange.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(inputrange.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div4);
    			destroy_component(checkbox);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(inputrange);
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(div8);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(213:1) {#if $showMenu}",
    		ctx
    	});

    	return block;
    }

    // (232:3) {#if !isBlockDrillControls}
    function create_if_block_14(ctx) {
    	let checkbox;
    	let updating_checked;
    	let current;

    	function checkbox_checked_binding_1(value) {
    		/*checkbox_checked_binding_1*/ ctx[68](value);
    	}

    	let checkbox_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "simulationMode")
    	};

    	if (/*$isSimulationMode*/ ctx[42] !== void 0) {
    		checkbox_props.checked = /*$isSimulationMode*/ ctx[42];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding_1));

    	const block = {
    		c: function create() {
    			create_component(checkbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkbox_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox_changes.title = getTranslation(/*$lang*/ ctx[41], "simulationMode");

    			if (!updating_checked && dirty[1] & /*$isSimulationMode*/ 2048) {
    				updating_checked = true;
    				checkbox_changes.checked = /*$isSimulationMode*/ ctx[42];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(232:3) {#if !isBlockDrillControls}",
    		ctx
    	});

    	return block;
    }

    // (238:3) {#if !$isSimulationMode}
    function create_if_block_13(ctx) {
    	let div0;
    	let button0;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], "removeAllVertices") + "";
    	let t0;
    	let t1;
    	let div1;
    	let button1;
    	let t2_value = getTranslation(/*$lang*/ ctx[41], "removeAllEdges") + "";
    	let t2;
    	let t3;
    	let div2;
    	let button2;
    	let t4_value = getTranslation(/*$lang*/ ctx[41], "generateVertices") + "";
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			button1 = element("button");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			button2 = element("button");
    			t4 = text(t4_value);
    			attr_dev(button0, "class", "svelte-9ys6l6");
    			add_location(button0, file, 239, 5, 8201);
    			attr_dev(div0, "class", "buttons-row svelte-9ys6l6");
    			add_location(div0, file, 238, 4, 8169);
    			attr_dev(button1, "class", "svelte-9ys6l6");
    			add_location(button1, file, 244, 5, 8365);
    			attr_dev(div1, "class", "buttons-row svelte-9ys6l6");
    			add_location(div1, file, 243, 4, 8333);
    			attr_dev(button2, "class", "svelte-9ys6l6");
    			add_location(button2, file, 249, 5, 8523);
    			attr_dev(div2, "class", "buttons-row svelte-9ys6l6");
    			add_location(div2, file, 248, 4, 8491);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button1);
    			append_dev(button1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, button2);
    			append_dev(button2, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*graphRemoveVerticesHandler*/ ctx[32])) /*graphRemoveVerticesHandler*/ ctx[32].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*graphRemoveEdgesHandler*/ ctx[33])) /*graphRemoveEdgesHandler*/ ctx[33].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function(/*graphGenerateVerticesHandler*/ ctx[34])) /*graphGenerateVerticesHandler*/ ctx[34].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[1] & /*$lang*/ 1024 && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], "removeAllVertices") + "")) set_data_dev(t0, t0_value);
    			if (dirty[1] & /*$lang*/ 1024 && t2_value !== (t2_value = getTranslation(/*$lang*/ ctx[41], "removeAllEdges") + "")) set_data_dev(t2, t2_value);
    			if (dirty[1] & /*$lang*/ 1024 && t4_value !== (t4_value = getTranslation(/*$lang*/ ctx[41], "generateVertices") + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(238:3) {#if !$isSimulationMode}",
    		ctx
    	});

    	return block;
    }

    // (272:3) {#if $isSimulationMode}
    function create_if_block_12(ctx) {
    	let div;
    	let button;
    	let t_value = getTranslation(/*$lang*/ ctx[41], "simulationControls") + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-9ys6l6");
    			add_location(button, file, 273, 5, 9259);
    			attr_dev(div, "class", "buttons-row svelte-9ys6l6");
    			add_location(div, file, 272, 4, 9227);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[72], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*$lang*/ 1024 && t_value !== (t_value = getTranslation(/*$lang*/ ctx[41], "simulationControls") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(272:3) {#if $isSimulationMode}",
    		ctx
    	});

    	return block;
    }

    // (324:1) {#if $showVertexLabel}
    function create_if_block_10(ctx) {
    	let inputrange;
    	let updating_value;
    	let current;

    	function inputrange_value_binding_2(value) {
    		/*inputrange_value_binding_2*/ ctx[79](value);
    	}

    	let inputrange_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "vertexLabelSize"),
    		min: 8,
    		max: 16,
    		step: 1
    	};

    	if (/*vertexLabelSize*/ ctx[4] !== void 0) {
    		inputrange_props.value = /*vertexLabelSize*/ ctx[4];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding_2));

    	const block = {
    		c: function create() {
    			create_component(inputrange.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputrange, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputrange_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange_changes.name = getTranslation(/*$lang*/ ctx[41], "vertexLabelSize");

    			if (!updating_value && dirty[0] & /*vertexLabelSize*/ 16) {
    				updating_value = true;
    				inputrange_changes.value = /*vertexLabelSize*/ ctx[4];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputrange.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputrange.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputrange, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(324:1) {#if $showVertexLabel}",
    		ctx
    	});

    	return block;
    }

    // (341:1) {#if $showVertexLabel}
    function create_if_block_9(ctx) {
    	let div;
    	let h2;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], "vertexLabelColor") + "";
    	let t0;
    	let t1;
    	let colorselector;
    	let updating_selectedId;
    	let current;

    	function colorselector_selectedId_binding_1(value) {
    		/*colorselector_selectedId_binding_1*/ ctx[81](value);
    	}

    	let colorselector_props = {};

    	if (/*vertexLabelColorId*/ ctx[3] !== void 0) {
    		colorselector_props.selectedId = /*vertexLabelColorId*/ ctx[3];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding_1));

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(colorselector.$$.fragment);
    			attr_dev(h2, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h2, file, 342, 3, 11243);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 341, 2, 11210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			mount_component(colorselector, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], "vertexLabelColor") + "")) set_data_dev(t0, t0_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*vertexLabelColorId*/ 8) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*vertexLabelColorId*/ ctx[3];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colorselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colorselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(colorselector);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(341:1) {#if $showVertexLabel}",
    		ctx
    	});

    	return block;
    }

    // (306:0) <Window    title="{getTranslation($lang, 'vertexSettings')}"    isOpened={windowsStatus[Windows.VertexSettings]}    zIndex={windowsOrder[Windows.VertexSettings]}    onClickHandler={() => { makeWindowActive(Windows.VertexSettings) }}    onCloseHandler={() => { makeWindowInactive(Windows.VertexSettings) }}  >
    function create_default_slot_7(ctx) {
    	let checkbox;
    	let updating_checked;
    	let t0;
    	let inputrange;
    	let updating_value;
    	let t1;
    	let t2;
    	let div;
    	let h2;
    	let t3_value = getTranslation(/*$lang*/ ctx[41], "vertexColor") + "";
    	let t3;
    	let t4;
    	let colorselector;
    	let updating_selectedId;
    	let t5;
    	let if_block1_anchor;
    	let current;

    	function checkbox_checked_binding_2(value) {
    		/*checkbox_checked_binding_2*/ ctx[77](value);
    	}

    	let checkbox_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "showVertexLabel")
    	};

    	if (/*$showVertexLabel*/ ctx[48] !== void 0) {
    		checkbox_props.checked = /*$showVertexLabel*/ ctx[48];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding_2));

    	function inputrange_value_binding_1(value) {
    		/*inputrange_value_binding_1*/ ctx[78](value);
    	}

    	let inputrange_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "vertexSize"),
    		min: 5,
    		max: 20,
    		step: 0.3
    	};

    	if (/*vertexSize*/ ctx[1] !== void 0) {
    		inputrange_props.value = /*vertexSize*/ ctx[1];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding_1));
    	let if_block0 = /*$showVertexLabel*/ ctx[48] && create_if_block_10(ctx);

    	function colorselector_selectedId_binding(value) {
    		/*colorselector_selectedId_binding*/ ctx[80](value);
    	}

    	let colorselector_props = {};

    	if (/*$vertexColorId*/ ctx[49] !== void 0) {
    		colorselector_props.selectedId = /*$vertexColorId*/ ctx[49];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding));
    	let if_block1 = /*$showVertexLabel*/ ctx[48] && create_if_block_9(ctx);

    	const block = {
    		c: function create() {
    			create_component(checkbox.$$.fragment);
    			t0 = space();
    			create_component(inputrange.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div = element("div");
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			create_component(colorselector.$$.fragment);
    			t5 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(h2, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h2, file, 333, 2, 11024);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 332, 1, 10992);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(inputrange, target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t3);
    			append_dev(div, t4);
    			mount_component(colorselector, div, null);
    			insert_dev(target, t5, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkbox_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox_changes.title = getTranslation(/*$lang*/ ctx[41], "showVertexLabel");

    			if (!updating_checked && dirty[1] & /*$showVertexLabel*/ 131072) {
    				updating_checked = true;
    				checkbox_changes.checked = /*$showVertexLabel*/ ctx[48];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const inputrange_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange_changes.name = getTranslation(/*$lang*/ ctx[41], "vertexSize");

    			if (!updating_value && dirty[0] & /*vertexSize*/ 2) {
    				updating_value = true;
    				inputrange_changes.value = /*vertexSize*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);

    			if (/*$showVertexLabel*/ ctx[48]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[1] & /*$showVertexLabel*/ 131072) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty[1] & /*$lang*/ 1024) && t3_value !== (t3_value = getTranslation(/*$lang*/ ctx[41], "vertexColor") + "")) set_data_dev(t3, t3_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[1] & /*$vertexColorId*/ 262144) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*$vertexColorId*/ ctx[49];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);

    			if (/*$showVertexLabel*/ ctx[48]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[1] & /*$showVertexLabel*/ 131072) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_9(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(inputrange.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(colorselector.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(inputrange.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(colorselector.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(inputrange, detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			destroy_component(colorselector);
    			if (detaching) detach_dev(t5);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(306:0) <Window    title=\\\"{getTranslation($lang, 'vertexSettings')}\\\"    isOpened={windowsStatus[Windows.VertexSettings]}    zIndex={windowsOrder[Windows.VertexSettings]}    onClickHandler={() => { makeWindowActive(Windows.VertexSettings) }}    onCloseHandler={() => { makeWindowInactive(Windows.VertexSettings) }}  >",
    		ctx
    	});

    	return block;
    }

    // (370:1) {#if $showEdgeLabel}
    function create_if_block_8(ctx) {
    	let inputrange0;
    	let updating_value;
    	let t;
    	let inputrange1;
    	let updating_value_1;
    	let current;

    	function inputrange0_value_binding(value) {
    		/*inputrange0_value_binding*/ ctx[86](value);
    	}

    	let inputrange0_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "edgeLabelSize"),
    		min: 8,
    		max: 16,
    		step: 1
    	};

    	if (/*edgeLabelSize*/ ctx[7] !== void 0) {
    		inputrange0_props.value = /*edgeLabelSize*/ ctx[7];
    	}

    	inputrange0 = new InputRange({ props: inputrange0_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange0, 'value', inputrange0_value_binding));

    	function inputrange1_value_binding(value) {
    		/*inputrange1_value_binding*/ ctx[87](value);
    	}

    	let inputrange1_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "edgeLabelDistance"),
    		min: 0,
    		max: 40,
    		step: 0.3
    	};

    	if (/*edgeLabelDistance*/ ctx[6] !== void 0) {
    		inputrange1_props.value = /*edgeLabelDistance*/ ctx[6];
    	}

    	inputrange1 = new InputRange({ props: inputrange1_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange1, 'value', inputrange1_value_binding));

    	const block = {
    		c: function create() {
    			create_component(inputrange0.$$.fragment);
    			t = space();
    			create_component(inputrange1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputrange0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(inputrange1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputrange0_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange0_changes.name = getTranslation(/*$lang*/ ctx[41], "edgeLabelSize");

    			if (!updating_value && dirty[0] & /*edgeLabelSize*/ 128) {
    				updating_value = true;
    				inputrange0_changes.value = /*edgeLabelSize*/ ctx[7];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange0.$set(inputrange0_changes);
    			const inputrange1_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange1_changes.name = getTranslation(/*$lang*/ ctx[41], "edgeLabelDistance");

    			if (!updating_value_1 && dirty[0] & /*edgeLabelDistance*/ 64) {
    				updating_value_1 = true;
    				inputrange1_changes.value = /*edgeLabelDistance*/ ctx[6];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			inputrange1.$set(inputrange1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputrange0.$$.fragment, local);
    			transition_in(inputrange1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputrange0.$$.fragment, local);
    			transition_out(inputrange1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputrange0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(inputrange1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(370:1) {#if $showEdgeLabel}",
    		ctx
    	});

    	return block;
    }

    // (394:1) {#if $showEdgeLabel}
    function create_if_block_7(ctx) {
    	let div;
    	let h2;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], "edgeLabelColor") + "";
    	let t0;
    	let t1;
    	let colorselector;
    	let updating_selectedId;
    	let current;

    	function colorselector_selectedId_binding_3(value) {
    		/*colorselector_selectedId_binding_3*/ ctx[89](value);
    	}

    	let colorselector_props = {};

    	if (/*edgeLabelColorId*/ ctx[8] !== void 0) {
    		colorselector_props.selectedId = /*edgeLabelColorId*/ ctx[8];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding_3));

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(colorselector.$$.fragment);
    			attr_dev(h2, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h2, file, 395, 3, 12545);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 394, 2, 12512);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			mount_component(colorselector, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], "edgeLabelColor") + "")) set_data_dev(t0, t0_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*edgeLabelColorId*/ 256) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*edgeLabelColorId*/ ctx[8];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colorselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colorselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(colorselector);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(394:1) {#if $showEdgeLabel}",
    		ctx
    	});

    	return block;
    }

    // (352:0) <Window    title="{getTranslation($lang, 'edgeSettings')}"    isOpened={windowsStatus[Windows.EdgeSettings]}    zIndex={windowsOrder[Windows.EdgeSettings]}    onClickHandler={() => { makeWindowActive(Windows.EdgeSettings) }}    onCloseHandler={() => { makeWindowInactive(Windows.EdgeSettings) }}  >
    function create_default_slot_6(ctx) {
    	let checkbox;
    	let updating_checked;
    	let t0;
    	let inputrange;
    	let updating_value;
    	let t1;
    	let t2;
    	let div;
    	let h2;
    	let t3_value = getTranslation(/*$lang*/ ctx[41], "edgeColor") + "";
    	let t3;
    	let t4;
    	let colorselector;
    	let updating_selectedId;
    	let t5;
    	let if_block1_anchor;
    	let current;

    	function checkbox_checked_binding_3(value) {
    		/*checkbox_checked_binding_3*/ ctx[84](value);
    	}

    	let checkbox_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "showEdgeLabel")
    	};

    	if (/*$showEdgeLabel*/ ctx[50] !== void 0) {
    		checkbox_props.checked = /*$showEdgeLabel*/ ctx[50];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding_3));

    	function inputrange_value_binding_3(value) {
    		/*inputrange_value_binding_3*/ ctx[85](value);
    	}

    	let inputrange_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "edgeSize"),
    		min: 1,
    		max: 10,
    		step: 0.3
    	};

    	if (/*edgeSize*/ ctx[2] !== void 0) {
    		inputrange_props.value = /*edgeSize*/ ctx[2];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding_3));
    	let if_block0 = /*$showEdgeLabel*/ ctx[50] && create_if_block_8(ctx);

    	function colorselector_selectedId_binding_2(value) {
    		/*colorselector_selectedId_binding_2*/ ctx[88](value);
    	}

    	let colorselector_props = {};

    	if (/*$edgeColorId*/ ctx[51] !== void 0) {
    		colorselector_props.selectedId = /*$edgeColorId*/ ctx[51];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding_2));
    	let if_block1 = /*$showEdgeLabel*/ ctx[50] && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			create_component(checkbox.$$.fragment);
    			t0 = space();
    			create_component(inputrange.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div = element("div");
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			create_component(colorselector.$$.fragment);
    			t5 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(h2, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h2, file, 386, 2, 12332);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 385, 1, 12300);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(inputrange, target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t3);
    			append_dev(div, t4);
    			mount_component(colorselector, div, null);
    			insert_dev(target, t5, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkbox_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox_changes.title = getTranslation(/*$lang*/ ctx[41], "showEdgeLabel");

    			if (!updating_checked && dirty[1] & /*$showEdgeLabel*/ 524288) {
    				updating_checked = true;
    				checkbox_changes.checked = /*$showEdgeLabel*/ ctx[50];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const inputrange_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange_changes.name = getTranslation(/*$lang*/ ctx[41], "edgeSize");

    			if (!updating_value && dirty[0] & /*edgeSize*/ 4) {
    				updating_value = true;
    				inputrange_changes.value = /*edgeSize*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);

    			if (/*$showEdgeLabel*/ ctx[50]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[1] & /*$showEdgeLabel*/ 524288) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty[1] & /*$lang*/ 1024) && t3_value !== (t3_value = getTranslation(/*$lang*/ ctx[41], "edgeColor") + "")) set_data_dev(t3, t3_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[1] & /*$edgeColorId*/ 1048576) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*$edgeColorId*/ ctx[51];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);

    			if (/*$showEdgeLabel*/ ctx[50]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[1] & /*$showEdgeLabel*/ 524288) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_7(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(inputrange.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(colorselector.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(inputrange.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(colorselector.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(inputrange, detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			destroy_component(colorselector);
    			if (detaching) detach_dev(t5);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(352:0) <Window    title=\\\"{getTranslation($lang, 'edgeSettings')}\\\"    isOpened={windowsStatus[Windows.EdgeSettings]}    zIndex={windowsOrder[Windows.EdgeSettings]}    onClickHandler={() => { makeWindowActive(Windows.EdgeSettings) }}    onCloseHandler={() => { makeWindowInactive(Windows.EdgeSettings) }}  >",
    		ctx
    	});

    	return block;
    }

    // (437:4) {:else}
    function create_else_block(ctx) {
    	let t_value = getTranslation(/*$lang*/ ctx[41], 'enterFullsceen') + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*$lang*/ 1024 && t_value !== (t_value = getTranslation(/*$lang*/ ctx[41], 'enterFullsceen') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(437:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (435:4) {#if isFullscreen}
    function create_if_block_6(ctx) {
    	let t_value = getTranslation(/*$lang*/ ctx[41], 'exitFullsceen') + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*$lang*/ 1024 && t_value !== (t_value = getTranslation(/*$lang*/ ctx[41], 'exitFullsceen') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(435:4) {#if isFullscreen}",
    		ctx
    	});

    	return block;
    }

    // (405:0) <Window    title="{getTranslation($lang, 'otherSettings')}"    isOpened={windowsStatus[Windows.OtherSettings]}    zIndex={windowsOrder[Windows.OtherSettings]}    onClickHandler={() => { makeWindowActive(Windows.OtherSettings) }}    onCloseHandler={() => { makeWindowInactive(Windows.OtherSettings) }}  >
    function create_default_slot_5(ctx) {
    	let div0;
    	let checkbox0;
    	let updating_checked;
    	let t0;
    	let checkbox1;
    	let updating_checked_1;
    	let t1;
    	let div1;
    	let h20;
    	let t2_value = getTranslation(/*$lang*/ ctx[41], 'language') + "";
    	let t2;
    	let t3;
    	let radiobuttons;
    	let updating_group;
    	let t4;
    	let div3;
    	let div2;
    	let button;
    	let t5;
    	let div4;
    	let h21;
    	let t6_value = getTranslation(/*$lang*/ ctx[41], "backgroundColor") + "";
    	let t6;
    	let t7;
    	let colorselector;
    	let updating_selectedId;
    	let current;
    	let mounted;
    	let dispose;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[92](value);
    	}

    	let checkbox0_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "showFPS")
    	};

    	if (/*$showFPS*/ ctx[52] !== void 0) {
    		checkbox0_props.checked = /*$showFPS*/ ctx[52];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox0, 'checked', checkbox0_checked_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[93](value);
    	}

    	let checkbox1_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "showHint")
    	};

    	if (/*$showHint*/ ctx[43] !== void 0) {
    		checkbox1_props.checked = /*$showHint*/ ctx[43];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox1, 'checked', checkbox1_checked_binding));

    	function radiobuttons_group_binding(value) {
    		/*radiobuttons_group_binding*/ ctx[94](value);
    	}

    	let radiobuttons_props = { options: languages, groupName: "lang" };

    	if (/*$lang*/ ctx[41] !== void 0) {
    		radiobuttons_props.group = /*$lang*/ ctx[41];
    	}

    	radiobuttons = new RadioButtons({
    			props: radiobuttons_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(radiobuttons, 'group', radiobuttons_group_binding));

    	function select_block_type_1(ctx, dirty) {
    		if (/*isFullscreen*/ ctx[0]) return create_if_block_6;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	function colorselector_selectedId_binding_4(value) {
    		/*colorselector_selectedId_binding_4*/ ctx[95](value);
    	}

    	let colorselector_props = {};

    	if (/*backgroundColorId*/ ctx[26] !== void 0) {
    		colorselector_props.selectedId = /*backgroundColorId*/ ctx[26];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding_4));

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(checkbox0.$$.fragment);
    			t0 = space();
    			create_component(checkbox1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			h20 = element("h2");
    			t2 = text(t2_value);
    			t3 = space();
    			create_component(radiobuttons.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button = element("button");
    			if_block.c();
    			t5 = space();
    			div4 = element("div");
    			h21 = element("h2");
    			t6 = text(t6_value);
    			t7 = space();
    			create_component(colorselector.$$.fragment);
    			attr_dev(div0, "class", "controls-block svelte-9ys6l6");
    			add_location(div0, file, 411, 1, 13040);
    			attr_dev(h20, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h20, file, 422, 2, 13302);
    			attr_dev(div1, "class", "controls-block svelte-9ys6l6");
    			add_location(div1, file, 421, 1, 13270);
    			attr_dev(button, "class", "svelte-9ys6l6");
    			add_location(button, file, 433, 3, 13579);
    			attr_dev(div2, "class", "buttons-row svelte-9ys6l6");
    			set_style(div2, "margin-bottom", "0");
    			add_location(div2, file, 432, 2, 13523);
    			attr_dev(div3, "class", "controls-block svelte-9ys6l6");
    			add_location(div3, file, 431, 1, 13491);
    			attr_dev(h21, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h21, file, 443, 2, 13826);
    			attr_dev(div4, "class", "controls-block svelte-9ys6l6");
    			add_location(div4, file, 442, 1, 13794);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(checkbox0, div0, null);
    			append_dev(div0, t0);
    			mount_component(checkbox1, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h20);
    			append_dev(h20, t2);
    			append_dev(div1, t3);
    			mount_component(radiobuttons, div1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			if_block.m(button, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h21);
    			append_dev(h21, t6);
    			append_dev(div4, t7);
    			mount_component(colorselector, div4, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*switchFullscreen*/ ctx[56], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const checkbox0_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox0_changes.title = getTranslation(/*$lang*/ ctx[41], "showFPS");

    			if (!updating_checked && dirty[1] & /*$showFPS*/ 2097152) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*$showFPS*/ ctx[52];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox1_changes.title = getTranslation(/*$lang*/ ctx[41], "showHint");

    			if (!updating_checked_1 && dirty[1] & /*$showHint*/ 4096) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*$showHint*/ ctx[43];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t2_value !== (t2_value = getTranslation(/*$lang*/ ctx[41], 'language') + "")) set_data_dev(t2, t2_value);
    			const radiobuttons_changes = {};

    			if (!updating_group && dirty[1] & /*$lang*/ 1024) {
    				updating_group = true;
    				radiobuttons_changes.group = /*$lang*/ ctx[41];
    				add_flush_callback(() => updating_group = false);
    			}

    			radiobuttons.$set(radiobuttons_changes);

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if ((!current || dirty[1] & /*$lang*/ 1024) && t6_value !== (t6_value = getTranslation(/*$lang*/ ctx[41], "backgroundColor") + "")) set_data_dev(t6, t6_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*backgroundColorId*/ 67108864) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*backgroundColorId*/ ctx[26];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(radiobuttons.$$.fragment, local);
    			transition_in(colorselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(radiobuttons.$$.fragment, local);
    			transition_out(colorselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(checkbox0);
    			destroy_component(checkbox1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(radiobuttons);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			if_block.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div4);
    			destroy_component(colorselector);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(405:0) <Window    title=\\\"{getTranslation($lang, 'otherSettings')}\\\"    isOpened={windowsStatus[Windows.OtherSettings]}    zIndex={windowsOrder[Windows.OtherSettings]}    onClickHandler={() => { makeWindowActive(Windows.OtherSettings) }}    onCloseHandler={() => { makeWindowInactive(Windows.OtherSettings) }}  >",
    		ctx
    	});

    	return block;
    }

    // (452:0) <Window    title="{getTranslation($lang, 'about')}"    isOpened={windowsStatus[Windows.About]}    zIndex={windowsOrder[Windows.About]}    onClickHandler={() => { makeWindowActive(Windows.About) }}    onCloseHandler={() => { makeWindowInactive(Windows.About) }}  >
    function create_default_slot_4(ctx) {
    	let p0;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], 'pcbDrillingOptimazer') + "";
    	let t0;
    	let br;
    	let t1;
    	let a;
    	let t2_value = getTranslation(/*$lang*/ ctx[41], 'githubPage') + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4_value = getTranslation(/*$lang*/ ctx[41], 'developedUsingSvelte') + "";
    	let t4;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text(t0_value);
    			br = element("br");
    			t1 = space();
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text(t4_value);
    			add_location(br, file, 459, 49, 14350);
    			attr_dev(a, "href", "https://github.com/rodimov/DrillingOptimizer");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 460, 2, 14358);
    			set_style(p0, "text-align", "center");
    			add_location(p0, file, 458, 1, 14269);
    			set_style(p1, "text-align", "center");
    			add_location(p1, file, 467, 1, 14503);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, br);
    			append_dev(p0, t1);
    			append_dev(p0, a);
    			append_dev(a, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*$lang*/ 1024 && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], 'pcbDrillingOptimazer') + "")) set_data_dev(t0, t0_value);
    			if (dirty[1] & /*$lang*/ 1024 && t2_value !== (t2_value = getTranslation(/*$lang*/ ctx[41], 'githubPage') + "")) set_data_dev(t2, t2_value);
    			if (dirty[1] & /*$lang*/ 1024 && t4_value !== (t4_value = getTranslation(/*$lang*/ ctx[41], 'developedUsingSvelte') + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(452:0) <Window    title=\\\"{getTranslation($lang, 'about')}\\\"    isOpened={windowsStatus[Windows.About]}    zIndex={windowsOrder[Windows.About]}    onClickHandler={() => { makeWindowActive(Windows.About) }}    onCloseHandler={() => { makeWindowInactive(Windows.About) }}  >",
    		ctx
    	});

    	return block;
    }

    // (470:0) <Window    title="{getTranslation($lang, 'distance')}"    isOpened={windowsStatus[Windows.TotalDistance]}    zIndex={windowsOrder[Windows.TotalDistance]}    onClickHandler={() => { makeWindowActive(Windows.TotalDistance) }}    onCloseHandler={() => { makeWindowInactive(Windows.TotalDistance) }}  >
    function create_default_slot_3(ctx) {
    	let div0;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], 'totalDistance') + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let t4_value = getTranslation(/*$lang*/ ctx[41], 'totalDistanceWithStart') + "";
    	let t4;
    	let t5;
    	let t6;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(/*totalDistance*/ ctx[9]);
    			t3 = space();
    			div1 = element("div");
    			t4 = text(t4_value);
    			t5 = text(": ");
    			t6 = text(/*totalDistanceWithStart*/ ctx[10]);
    			add_location(div0, file, 476, 1, 14898);
    			add_location(div1, file, 479, 1, 14976);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*$lang*/ 1024 && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], 'totalDistance') + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*totalDistance*/ 512) set_data_dev(t2, /*totalDistance*/ ctx[9]);
    			if (dirty[1] & /*$lang*/ 1024 && t4_value !== (t4_value = getTranslation(/*$lang*/ ctx[41], 'totalDistanceWithStart') + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*totalDistanceWithStart*/ 1024) set_data_dev(t6, /*totalDistanceWithStart*/ ctx[10]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(470:0) <Window    title=\\\"{getTranslation($lang, 'distance')}\\\"    isOpened={windowsStatus[Windows.TotalDistance]}    zIndex={windowsOrder[Windows.TotalDistance]}    onClickHandler={() => { makeWindowActive(Windows.TotalDistance) }}    onCloseHandler={() => { makeWindowInactive(Windows.TotalDistance) }}  >",
    		ctx
    	});

    	return block;
    }

    // (499:1) {#if connectAlgorithm === 'zAlgorithm'}
    function create_if_block_5(ctx) {
    	let inputrange;
    	let updating_value;
    	let current;

    	function inputrange_value_binding_4(value) {
    		/*inputrange_value_binding_4*/ ctx[103](value);
    	}

    	let inputrange_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "zAlgorithmRowSize"),
    		min: 0,
    		max: 150,
    		step: 1
    	};

    	if (/*zAlgorithmRowSize*/ ctx[27] !== void 0) {
    		inputrange_props.value = /*zAlgorithmRowSize*/ ctx[27];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding_4));

    	const block = {
    		c: function create() {
    			create_component(inputrange.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputrange, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputrange_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange_changes.name = getTranslation(/*$lang*/ ctx[41], "zAlgorithmRowSize");

    			if (!updating_value && dirty[0] & /*zAlgorithmRowSize*/ 134217728) {
    				updating_value = true;
    				inputrange_changes.value = /*zAlgorithmRowSize*/ ctx[27];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputrange.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputrange.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputrange, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(499:1) {#if connectAlgorithm === 'zAlgorithm'}",
    		ctx
    	});

    	return block;
    }

    // (508:1) {#if !$isSimulationMode}
    function create_if_block_4(ctx) {
    	let div1;
    	let div0;
    	let button;
    	let t_value = getTranslation(/*$lang*/ ctx[41], 'connect') + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-9ys6l6");
    			add_location(button, file, 510, 4, 15926);
    			attr_dev(div0, "class", "buttons-row svelte-9ys6l6");
    			set_style(div0, "margin-bottom", "0");
    			add_location(div0, file, 509, 3, 15869);
    			attr_dev(div1, "class", "controls-block svelte-9ys6l6");
    			add_location(div1, file, 508, 2, 15836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*graphConnectEdgesHandler*/ ctx[35])) /*graphConnectEdgesHandler*/ ctx[35].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[1] & /*$lang*/ 1024 && t_value !== (t_value = getTranslation(/*$lang*/ ctx[41], 'connect') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(508:1) {#if !$isSimulationMode}",
    		ctx
    	});

    	return block;
    }

    // (484:0) <Window    title="{getTranslation($lang, 'connectVertices')}"    isOpened={windowsStatus[Windows.ConnectVertices]}    zIndex={windowsOrder[Windows.ConnectVertices]}    onClickHandler={() => { makeWindowActive(Windows.ConnectVertices) }}    onCloseHandler={() => { makeWindowInactive(Windows.ConnectVertices) }}  >
    function create_default_slot_2(ctx) {
    	let h2;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], 'algorithms') + "";
    	let t0;
    	let t1;
    	let radiobuttons;
    	let updating_group;
    	let t2;
    	let t3;
    	let if_block1_anchor;
    	let current;

    	function radiobuttons_group_binding_1(value) {
    		/*radiobuttons_group_binding_1*/ ctx[102](value);
    	}

    	let radiobuttons_props = {
    		options: /*connectAlgorithms*/ ctx[53],
    		groupName: "connectAlgorithm"
    	};

    	if (/*connectAlgorithm*/ ctx[11] !== void 0) {
    		radiobuttons_props.group = /*connectAlgorithm*/ ctx[11];
    	}

    	radiobuttons = new RadioButtons({
    			props: radiobuttons_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(radiobuttons, 'group', radiobuttons_group_binding_1));
    	let if_block0 = /*connectAlgorithm*/ ctx[11] === 'zAlgorithm' && create_if_block_5(ctx);
    	let if_block1 = !/*$isSimulationMode*/ ctx[42] && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(radiobuttons.$$.fragment);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(h2, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h2, file, 490, 1, 15398);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(radiobuttons, target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], 'algorithms') + "")) set_data_dev(t0, t0_value);
    			const radiobuttons_changes = {};

    			if (!updating_group && dirty[0] & /*connectAlgorithm*/ 2048) {
    				updating_group = true;
    				radiobuttons_changes.group = /*connectAlgorithm*/ ctx[11];
    				add_flush_callback(() => updating_group = false);
    			}

    			radiobuttons.$set(radiobuttons_changes);

    			if (/*connectAlgorithm*/ ctx[11] === 'zAlgorithm') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*connectAlgorithm*/ 2048) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t3.parentNode, t3);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*$isSimulationMode*/ ctx[42]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(radiobuttons.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(radiobuttons.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			destroy_component(radiobuttons, detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(484:0) <Window    title=\\\"{getTranslation($lang, 'connectVertices')}\\\"    isOpened={windowsStatus[Windows.ConnectVertices]}    zIndex={windowsOrder[Windows.ConnectVertices]}    onClickHandler={() => { makeWindowActive(Windows.ConnectVertices) }}    onCloseHandler={() => { makeWindowInactive(Windows.ConnectVertices) }}  >",
    		ctx
    	});

    	return block;
    }

    // (518:0) {#if $isSimulationMode}
    function create_if_block(ctx) {
    	let window0;
    	let t;
    	let window1;
    	let current;

    	window0 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], 'simulationControls'),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].SimulationControls],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].SimulationControls],
    				onClickHandler: /*func_12*/ ctx[118],
    				onCloseHandler: /*func_13*/ ctx[119],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window1 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], "drillingTime"),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].DrillingTime],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].DrillingTime],
    				onClickHandler: /*func_14*/ ctx[120],
    				onCloseHandler: /*func_15*/ ctx[121],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(window0.$$.fragment);
    			t = space();
    			create_component(window1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(window0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(window1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const window0_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window0_changes.title = getTranslation(/*$lang*/ ctx[41], 'simulationControls');
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window0_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].SimulationControls];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window0_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].SimulationControls];
    			if (dirty[1] & /*Windows*/ 128) window0_changes.onClickHandler = /*func_12*/ ctx[118];
    			if (dirty[1] & /*Windows*/ 128) window0_changes.onCloseHandler = /*func_13*/ ctx[119];

    			if (dirty[0] & /*drilledVertexColorId, drillLabelColorId, isShowDrillLabel, drillNormalColorId, drillColorId, drillLabelSize, drillRotationsCount, drillSpinSpeed, drillMoveSpeed, isBlockDrillControls, isReturnDrillToStart, isInfiniteSimulation*/ 60813312 | dirty[1] & /*$lang, Windows, moveDrillToStartHandler, startSimulationHandler*/ 1248 | dirty[3] & /*$$scope*/ 1073741824) {
    				window0_changes.$$scope = { dirty, ctx };
    			}

    			window0.$set(window0_changes);
    			const window1_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window1_changes.title = getTranslation(/*$lang*/ ctx[41], "drillingTime");
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window1_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].DrillingTime];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window1_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].DrillingTime];
    			if (dirty[1] & /*Windows*/ 128) window1_changes.onClickHandler = /*func_14*/ ctx[120];
    			if (dirty[1] & /*Windows*/ 128) window1_changes.onCloseHandler = /*func_15*/ ctx[121];

    			if (dirty[0] & /*drillingTime, lastDrillingTime*/ 6291456 | dirty[1] & /*$lang*/ 1024 | dirty[3] & /*$$scope*/ 1073741824) {
    				window1_changes.$$scope = { dirty, ctx };
    			}

    			window1.$set(window1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(window0.$$.fragment, local);
    			transition_in(window1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(window0.$$.fragment, local);
    			transition_out(window1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(window0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(window1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(518:0) {#if $isSimulationMode}",
    		ctx
    	});

    	return block;
    }

    // (539:3) {#if !isBlockDrillControls}
    function create_if_block_3(ctx) {
    	let div0;
    	let button0;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], 'startSimulation') + "";
    	let t0;
    	let t1;
    	let div1;
    	let button1;
    	let t2_value = getTranslation(/*$lang*/ ctx[41], 'moveDrillToStart') + "";
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			button1 = element("button");
    			t2 = text(t2_value);
    			attr_dev(button0, "class", "svelte-9ys6l6");
    			add_location(button0, file, 540, 5, 16873);
    			attr_dev(div0, "class", "buttons-row svelte-9ys6l6");
    			add_location(div0, file, 539, 4, 16841);
    			attr_dev(button1, "class", "svelte-9ys6l6");
    			add_location(button1, file, 545, 5, 17031);
    			attr_dev(div1, "class", "buttons-row svelte-9ys6l6");
    			add_location(div1, file, 544, 4, 16999);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button1);
    			append_dev(button1, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*startSimulationHandler*/ ctx[37])) /*startSimulationHandler*/ ctx[37].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*moveDrillToStartHandler*/ ctx[36])) /*moveDrillToStartHandler*/ ctx[36].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[1] & /*$lang*/ 1024 && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], 'startSimulation') + "")) set_data_dev(t0, t0_value);
    			if (dirty[1] & /*$lang*/ 1024 && t2_value !== (t2_value = getTranslation(/*$lang*/ ctx[41], 'moveDrillToStart') + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(539:3) {#if !isBlockDrillControls}",
    		ctx
    	});

    	return block;
    }

    // (582:3) {#if isShowDrillLabel}
    function create_if_block_2(ctx) {
    	let inputrange;
    	let updating_value;
    	let current;

    	function inputrange_value_binding_5(value) {
    		/*inputrange_value_binding_5*/ ctx[113](value);
    	}

    	let inputrange_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "drillLabelSize"),
    		min: 8,
    		max: 16,
    		step: 1
    	};

    	if (/*drillLabelSize*/ ctx[17] !== void 0) {
    		inputrange_props.value = /*drillLabelSize*/ ctx[17];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding_5));

    	const block = {
    		c: function create() {
    			create_component(inputrange.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputrange, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const inputrange_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange_changes.name = getTranslation(/*$lang*/ ctx[41], "drillLabelSize");

    			if (!updating_value && dirty[0] & /*drillLabelSize*/ 131072) {
    				updating_value = true;
    				inputrange_changes.value = /*drillLabelSize*/ ctx[17];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputrange.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputrange.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputrange, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(582:3) {#if isShowDrillLabel}",
    		ctx
    	});

    	return block;
    }

    // (608:2) {#if isShowDrillLabel}
    function create_if_block_1(ctx) {
    	let div;
    	let h2;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], "drillLabelColor") + "";
    	let t0;
    	let t1;
    	let colorselector;
    	let updating_selectedId;
    	let current;

    	function colorselector_selectedId_binding_5(value) {
    		/*colorselector_selectedId_binding_5*/ ctx[116](value);
    	}

    	let colorselector_props = {};

    	if (/*drillLabelColorId*/ ctx[18] !== void 0) {
    		colorselector_props.selectedId = /*drillLabelColorId*/ ctx[18];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding_5));

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(colorselector.$$.fragment);
    			attr_dev(h2, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h2, file, 609, 4, 18671);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 608, 3, 18637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			mount_component(colorselector, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], "drillLabelColor") + "")) set_data_dev(t0, t0_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*drillLabelColorId*/ 262144) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*drillLabelColorId*/ ctx[18];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colorselector.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colorselector.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(colorselector);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(608:2) {#if isShowDrillLabel}",
    		ctx
    	});

    	return block;
    }

    // (519:1) <Window     title="{getTranslation($lang, 'simulationControls')}"     isOpened={windowsStatus[Windows.SimulationControls]}     zIndex={windowsOrder[Windows.SimulationControls]}     onClickHandler={() => { makeWindowActive(Windows.SimulationControls) }}     onCloseHandler={() => { makeWindowInactive(Windows.SimulationControls) }}   >
    function create_default_slot_1(ctx) {
    	let checkbox0;
    	let updating_checked;
    	let t0;
    	let checkbox1;
    	let updating_checked_1;
    	let t1;
    	let checkbox2;
    	let updating_checked_2;
    	let t2;
    	let div1;
    	let t3;
    	let div0;
    	let button;
    	let t4_value = getTranslation(/*$lang*/ ctx[41], 'showDrillingTime') + "";
    	let t4;
    	let t5;
    	let div2;
    	let h20;
    	let t6_value = getTranslation(/*$lang*/ ctx[41], 'simulationSettings') + "";
    	let t6;
    	let t7;
    	let inputrange0;
    	let updating_value;
    	let t8;
    	let inputrange1;
    	let updating_value_1;
    	let t9;
    	let inputrange2;
    	let updating_value_2;
    	let t10;
    	let t11;
    	let div3;
    	let h21;
    	let t12_value = getTranslation(/*$lang*/ ctx[41], "drillColor") + "";
    	let t12;
    	let t13;
    	let colorselector0;
    	let updating_selectedId;
    	let t14;
    	let div4;
    	let h22;
    	let t15_value = getTranslation(/*$lang*/ ctx[41], "drillNormalColor") + "";
    	let t15;
    	let t16;
    	let colorselector1;
    	let updating_selectedId_1;
    	let t17;
    	let t18;
    	let div5;
    	let h23;
    	let t19_value = getTranslation(/*$lang*/ ctx[41], "drilledVertexColor") + "";
    	let t19;
    	let t20;
    	let colorselector2;
    	let updating_selectedId_2;
    	let current;
    	let mounted;
    	let dispose;

    	function checkbox0_checked_binding_1(value) {
    		/*checkbox0_checked_binding_1*/ ctx[106](value);
    	}

    	let checkbox0_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "showDrillLabel")
    	};

    	if (/*isShowDrillLabel*/ ctx[19] !== void 0) {
    		checkbox0_props.checked = /*isShowDrillLabel*/ ctx[19];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox0, 'checked', checkbox0_checked_binding_1));

    	function checkbox1_checked_binding_1(value) {
    		/*checkbox1_checked_binding_1*/ ctx[107](value);
    	}

    	let checkbox1_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "infiniteSimulation")
    	};

    	if (/*isInfiniteSimulation*/ ctx[20] !== void 0) {
    		checkbox1_props.checked = /*isInfiniteSimulation*/ ctx[20];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox1, 'checked', checkbox1_checked_binding_1));

    	function checkbox2_checked_binding(value) {
    		/*checkbox2_checked_binding*/ ctx[108](value);
    	}

    	let checkbox2_props = {
    		title: getTranslation(/*$lang*/ ctx[41], "returnDrillToStart")
    	};

    	if (/*isReturnDrillToStart*/ ctx[23] !== void 0) {
    		checkbox2_props.checked = /*isReturnDrillToStart*/ ctx[23];
    	}

    	checkbox2 = new Checkbox({ props: checkbox2_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox2, 'checked', checkbox2_checked_binding));
    	let if_block0 = !/*isBlockDrillControls*/ ctx[24] && create_if_block_3(ctx);

    	function inputrange0_value_binding_1(value) {
    		/*inputrange0_value_binding_1*/ ctx[110](value);
    	}

    	let inputrange0_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "drillMoveSpeed"),
    		min: 0.05,
    		max: 1,
    		step: 0.05
    	};

    	if (/*drillMoveSpeed*/ ctx[12] !== void 0) {
    		inputrange0_props.value = /*drillMoveSpeed*/ ctx[12];
    	}

    	inputrange0 = new InputRange({ props: inputrange0_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange0, 'value', inputrange0_value_binding_1));

    	function inputrange1_value_binding_1(value) {
    		/*inputrange1_value_binding_1*/ ctx[111](value);
    	}

    	let inputrange1_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "drillSpinSpeed"),
    		min: 0.05,
    		max: 1,
    		step: 0.05
    	};

    	if (/*drillSpinSpeed*/ ctx[13] !== void 0) {
    		inputrange1_props.value = /*drillSpinSpeed*/ ctx[13];
    	}

    	inputrange1 = new InputRange({ props: inputrange1_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange1, 'value', inputrange1_value_binding_1));

    	function inputrange2_value_binding(value) {
    		/*inputrange2_value_binding*/ ctx[112](value);
    	}

    	let inputrange2_props = {
    		name: getTranslation(/*$lang*/ ctx[41], "drillRotationsCount"),
    		min: 1,
    		max: 100,
    		step: 1
    	};

    	if (/*drillRotationsCount*/ ctx[14] !== void 0) {
    		inputrange2_props.value = /*drillRotationsCount*/ ctx[14];
    	}

    	inputrange2 = new InputRange({ props: inputrange2_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange2, 'value', inputrange2_value_binding));
    	let if_block1 = /*isShowDrillLabel*/ ctx[19] && create_if_block_2(ctx);

    	function colorselector0_selectedId_binding(value) {
    		/*colorselector0_selectedId_binding*/ ctx[114](value);
    	}

    	let colorselector0_props = {};

    	if (/*drillColorId*/ ctx[15] !== void 0) {
    		colorselector0_props.selectedId = /*drillColorId*/ ctx[15];
    	}

    	colorselector0 = new ColorSelector({
    			props: colorselector0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector0, 'selectedId', colorselector0_selectedId_binding));

    	function colorselector1_selectedId_binding(value) {
    		/*colorselector1_selectedId_binding*/ ctx[115](value);
    	}

    	let colorselector1_props = {};

    	if (/*drillNormalColorId*/ ctx[16] !== void 0) {
    		colorselector1_props.selectedId = /*drillNormalColorId*/ ctx[16];
    	}

    	colorselector1 = new ColorSelector({
    			props: colorselector1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector1, 'selectedId', colorselector1_selectedId_binding));
    	let if_block2 = /*isShowDrillLabel*/ ctx[19] && create_if_block_1(ctx);

    	function colorselector2_selectedId_binding(value) {
    		/*colorselector2_selectedId_binding*/ ctx[117](value);
    	}

    	let colorselector2_props = {};

    	if (/*drilledVertexColorId*/ ctx[25] !== void 0) {
    		colorselector2_props.selectedId = /*drilledVertexColorId*/ ctx[25];
    	}

    	colorselector2 = new ColorSelector({
    			props: colorselector2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector2, 'selectedId', colorselector2_selectedId_binding));

    	const block = {
    		c: function create() {
    			create_component(checkbox0.$$.fragment);
    			t0 = space();
    			create_component(checkbox1.$$.fragment);
    			t1 = space();
    			create_component(checkbox2.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			div0 = element("div");
    			button = element("button");
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			h20 = element("h2");
    			t6 = text(t6_value);
    			t7 = space();
    			create_component(inputrange0.$$.fragment);
    			t8 = space();
    			create_component(inputrange1.$$.fragment);
    			t9 = space();
    			create_component(inputrange2.$$.fragment);
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			t12 = text(t12_value);
    			t13 = space();
    			create_component(colorselector0.$$.fragment);
    			t14 = space();
    			div4 = element("div");
    			h22 = element("h2");
    			t15 = text(t15_value);
    			t16 = space();
    			create_component(colorselector1.$$.fragment);
    			t17 = space();
    			if (if_block2) if_block2.c();
    			t18 = space();
    			div5 = element("div");
    			h23 = element("h2");
    			t19 = text(t19_value);
    			t20 = space();
    			create_component(colorselector2.$$.fragment);
    			attr_dev(button, "class", "svelte-9ys6l6");
    			add_location(button, file, 551, 4, 17225);
    			attr_dev(div0, "class", "buttons-row svelte-9ys6l6");
    			set_style(div0, "margin-bottom", "0");
    			add_location(div0, file, 550, 3, 17168);
    			attr_dev(div1, "class", "controls-block svelte-9ys6l6");
    			add_location(div1, file, 537, 2, 16775);
    			attr_dev(h20, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h20, file, 557, 3, 17414);
    			attr_dev(div2, "class", "controls-block svelte-9ys6l6");
    			add_location(div2, file, 556, 2, 17381);
    			attr_dev(h21, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h21, file, 592, 3, 18237);
    			attr_dev(div3, "class", "controls-block svelte-9ys6l6");
    			add_location(div3, file, 591, 2, 18204);
    			attr_dev(h22, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h22, file, 600, 3, 18434);
    			attr_dev(div4, "class", "controls-block svelte-9ys6l6");
    			add_location(div4, file, 599, 2, 18401);
    			attr_dev(h23, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h23, file, 618, 3, 18893);
    			attr_dev(div5, "class", "controls-block svelte-9ys6l6");
    			add_location(div5, file, 617, 2, 18860);
    		},
    		m: function mount(target, anchor) {
    			mount_component(checkbox0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(checkbox1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(checkbox2, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(button, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h20);
    			append_dev(h20, t6);
    			append_dev(div2, t7);
    			mount_component(inputrange0, div2, null);
    			append_dev(div2, t8);
    			mount_component(inputrange1, div2, null);
    			append_dev(div2, t9);
    			mount_component(inputrange2, div2, null);
    			append_dev(div2, t10);
    			if (if_block1) if_block1.m(div2, null);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h21);
    			append_dev(h21, t12);
    			append_dev(div3, t13);
    			mount_component(colorselector0, div3, null);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h22);
    			append_dev(h22, t15);
    			append_dev(div4, t16);
    			mount_component(colorselector1, div4, null);
    			insert_dev(target, t17, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h23);
    			append_dev(h23, t19);
    			append_dev(div5, t20);
    			mount_component(colorselector2, div5, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_9*/ ctx[109], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const checkbox0_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox0_changes.title = getTranslation(/*$lang*/ ctx[41], "showDrillLabel");

    			if (!updating_checked && dirty[0] & /*isShowDrillLabel*/ 524288) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*isShowDrillLabel*/ ctx[19];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox1_changes.title = getTranslation(/*$lang*/ ctx[41], "infiniteSimulation");

    			if (!updating_checked_1 && dirty[0] & /*isInfiniteSimulation*/ 1048576) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*isInfiniteSimulation*/ ctx[20];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			const checkbox2_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) checkbox2_changes.title = getTranslation(/*$lang*/ ctx[41], "returnDrillToStart");

    			if (!updating_checked_2 && dirty[0] & /*isReturnDrillToStart*/ 8388608) {
    				updating_checked_2 = true;
    				checkbox2_changes.checked = /*isReturnDrillToStart*/ ctx[23];
    				add_flush_callback(() => updating_checked_2 = false);
    			}

    			checkbox2.$set(checkbox2_changes);

    			if (!/*isBlockDrillControls*/ ctx[24]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div1, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || dirty[1] & /*$lang*/ 1024) && t4_value !== (t4_value = getTranslation(/*$lang*/ ctx[41], 'showDrillingTime') + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t6_value !== (t6_value = getTranslation(/*$lang*/ ctx[41], 'simulationSettings') + "")) set_data_dev(t6, t6_value);
    			const inputrange0_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange0_changes.name = getTranslation(/*$lang*/ ctx[41], "drillMoveSpeed");

    			if (!updating_value && dirty[0] & /*drillMoveSpeed*/ 4096) {
    				updating_value = true;
    				inputrange0_changes.value = /*drillMoveSpeed*/ ctx[12];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange0.$set(inputrange0_changes);
    			const inputrange1_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange1_changes.name = getTranslation(/*$lang*/ ctx[41], "drillSpinSpeed");

    			if (!updating_value_1 && dirty[0] & /*drillSpinSpeed*/ 8192) {
    				updating_value_1 = true;
    				inputrange1_changes.value = /*drillSpinSpeed*/ ctx[13];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			inputrange1.$set(inputrange1_changes);
    			const inputrange2_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) inputrange2_changes.name = getTranslation(/*$lang*/ ctx[41], "drillRotationsCount");

    			if (!updating_value_2 && dirty[0] & /*drillRotationsCount*/ 16384) {
    				updating_value_2 = true;
    				inputrange2_changes.value = /*drillRotationsCount*/ ctx[14];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			inputrange2.$set(inputrange2_changes);

    			if (/*isShowDrillLabel*/ ctx[19]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*isShowDrillLabel*/ 524288) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty[1] & /*$lang*/ 1024) && t12_value !== (t12_value = getTranslation(/*$lang*/ ctx[41], "drillColor") + "")) set_data_dev(t12, t12_value);
    			const colorselector0_changes = {};

    			if (!updating_selectedId && dirty[0] & /*drillColorId*/ 32768) {
    				updating_selectedId = true;
    				colorselector0_changes.selectedId = /*drillColorId*/ ctx[15];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector0.$set(colorselector0_changes);
    			if ((!current || dirty[1] & /*$lang*/ 1024) && t15_value !== (t15_value = getTranslation(/*$lang*/ ctx[41], "drillNormalColor") + "")) set_data_dev(t15, t15_value);
    			const colorselector1_changes = {};

    			if (!updating_selectedId_1 && dirty[0] & /*drillNormalColorId*/ 65536) {
    				updating_selectedId_1 = true;
    				colorselector1_changes.selectedId = /*drillNormalColorId*/ ctx[16];
    				add_flush_callback(() => updating_selectedId_1 = false);
    			}

    			colorselector1.$set(colorselector1_changes);

    			if (/*isShowDrillLabel*/ ctx[19]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*isShowDrillLabel*/ 524288) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t18.parentNode, t18);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty[1] & /*$lang*/ 1024) && t19_value !== (t19_value = getTranslation(/*$lang*/ ctx[41], "drilledVertexColor") + "")) set_data_dev(t19, t19_value);
    			const colorselector2_changes = {};

    			if (!updating_selectedId_2 && dirty[0] & /*drilledVertexColorId*/ 33554432) {
    				updating_selectedId_2 = true;
    				colorselector2_changes.selectedId = /*drilledVertexColorId*/ ctx[25];
    				add_flush_callback(() => updating_selectedId_2 = false);
    			}

    			colorselector2.$set(colorselector2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(checkbox2.$$.fragment, local);
    			transition_in(inputrange0.$$.fragment, local);
    			transition_in(inputrange1.$$.fragment, local);
    			transition_in(inputrange2.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(colorselector0.$$.fragment, local);
    			transition_in(colorselector1.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(colorselector2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(checkbox2.$$.fragment, local);
    			transition_out(inputrange0.$$.fragment, local);
    			transition_out(inputrange1.$$.fragment, local);
    			transition_out(inputrange2.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(colorselector0.$$.fragment, local);
    			transition_out(colorselector1.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(colorselector2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(checkbox0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(checkbox1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(checkbox2, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div2);
    			destroy_component(inputrange0);
    			destroy_component(inputrange1);
    			destroy_component(inputrange2);
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div3);
    			destroy_component(colorselector0);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(div4);
    			destroy_component(colorselector1);
    			if (detaching) detach_dev(t17);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(div5);
    			destroy_component(colorselector2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(519:1) <Window     title=\\\"{getTranslation($lang, 'simulationControls')}\\\"     isOpened={windowsStatus[Windows.SimulationControls]}     zIndex={windowsOrder[Windows.SimulationControls]}     onClickHandler={() => { makeWindowActive(Windows.SimulationControls) }}     onCloseHandler={() => { makeWindowInactive(Windows.SimulationControls) }}   >",
    		ctx
    	});

    	return block;
    }

    // (627:1) <Window     title={getTranslation($lang, "drillingTime")}     isOpened={windowsStatus[Windows.DrillingTime]}     zIndex={windowsOrder[Windows.DrillingTime]}     onClickHandler={() => { makeWindowActive(Windows.DrillingTime) }}     onCloseHandler={() => { makeWindowInactive(Windows.DrillingTime) }}   >
    function create_default_slot(ctx) {
    	let div0;
    	let t0_value = getTranslation(/*$lang*/ ctx[41], "lastDrillingTime") + "";
    	let t0;
    	let t1;
    	let t2_value = /*msToStringTime*/ ctx[57](/*lastDrillingTime*/ ctx[22]) + "";
    	let t2;
    	let t3;
    	let div1;
    	let t4_value = getTranslation(/*$lang*/ ctx[41], "drillingTime") + "";
    	let t4;
    	let t5;
    	let t6_value = /*msToStringTime*/ ctx[57](/*drillingTime*/ ctx[21]) + "";
    	let t6;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			t4 = text(t4_value);
    			t5 = text(": ");
    			t6 = text(t6_value);
    			add_location(div0, file, 633, 2, 19390);
    			add_location(div1, file, 636, 2, 19493);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*$lang*/ 1024 && t0_value !== (t0_value = getTranslation(/*$lang*/ ctx[41], "lastDrillingTime") + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*lastDrillingTime*/ 4194304 && t2_value !== (t2_value = /*msToStringTime*/ ctx[57](/*lastDrillingTime*/ ctx[22]) + "")) set_data_dev(t2, t2_value);
    			if (dirty[1] & /*$lang*/ 1024 && t4_value !== (t4_value = getTranslation(/*$lang*/ ctx[41], "drillingTime") + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*drillingTime*/ 2097152 && t6_value !== (t6_value = /*msToStringTime*/ ctx[57](/*drillingTime*/ ctx[21]) + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(627:1) <Window     title={getTranslation($lang, \\\"drillingTime\\\")}     isOpened={windowsStatus[Windows.DrillingTime]}     zIndex={windowsOrder[Windows.DrillingTime]}     onClickHandler={() => { makeWindowActive(Windows.DrillingTime) }}     onCloseHandler={() => { makeWindowInactive(Windows.DrillingTime) }}   >",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let canvas;
    	let t0;
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let window0;
    	let t2;
    	let window1;
    	let t3;
    	let window2;
    	let t4;
    	let window3;
    	let t5;
    	let window4;
    	let t6;
    	let window5;
    	let t7;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	canvas = new Canvas({
    			props: {
    				onClick: /*graphClickHandler*/ ctx[29],
    				onMouseDown: /*graphMouseDownHandler*/ ctx[30],
    				onTouchStart: /*graphTouchStartHandler*/ ctx[31],
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_11, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$showMenu*/ ctx[46]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	window0 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], 'vertexSettings'),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].VertexSettings],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].VertexSettings],
    				onClickHandler: /*func*/ ctx[82],
    				onCloseHandler: /*func_1*/ ctx[83],
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window1 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], 'edgeSettings'),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].EdgeSettings],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].EdgeSettings],
    				onClickHandler: /*func_2*/ ctx[90],
    				onCloseHandler: /*func_3*/ ctx[91],
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window2 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], 'otherSettings'),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].OtherSettings],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].OtherSettings],
    				onClickHandler: /*func_4*/ ctx[96],
    				onCloseHandler: /*func_5*/ ctx[97],
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window3 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], 'about'),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].About],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].About],
    				onClickHandler: /*func_6*/ ctx[98],
    				onCloseHandler: /*func_7*/ ctx[99],
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window4 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], 'distance'),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].TotalDistance],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].TotalDistance],
    				onClickHandler: /*func_8*/ ctx[100],
    				onCloseHandler: /*func_9*/ ctx[101],
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window5 = new Window({
    			props: {
    				title: getTranslation(/*$lang*/ ctx[41], 'connectVertices'),
    				isOpened: /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].ConnectVertices],
    				zIndex: /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].ConnectVertices],
    				onClickHandler: /*func_10*/ ctx[104],
    				onCloseHandler: /*func_11*/ ctx[105],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block1 = /*$isSimulationMode*/ ctx[42] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			create_component(canvas.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if_block0.c();
    			t1 = space();
    			create_component(window0.$$.fragment);
    			t2 = space();
    			create_component(window1.$$.fragment);
    			t3 = space();
    			create_component(window2.$$.fragment);
    			t4 = space();
    			create_component(window3.$$.fragment);
    			t5 = space();
    			create_component(window4.$$.fragment);
    			t6 = space();
    			create_component(window5.$$.fragment);
    			t7 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div, "class", "controls svelte-9ys6l6");
    			toggle_class(div, "controls_opened", /*$showMenu*/ ctx[46]);
    			add_location(div, file, 211, 0, 7341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(canvas, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			insert_dev(target, t1, anchor);
    			mount_component(window0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(window1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(window2, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(window3, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(window4, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(window5, target, anchor);
    			insert_dev(target, t7, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "fullscreenchange", /*fullscreenchange_handler*/ ctx[58], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const canvas_changes = {};
    			if (dirty[0] & /*graphClickHandler*/ 536870912) canvas_changes.onClick = /*graphClickHandler*/ ctx[29];
    			if (dirty[0] & /*graphMouseDownHandler*/ 1073741824) canvas_changes.onMouseDown = /*graphMouseDownHandler*/ ctx[30];
    			if (dirty[1] & /*graphTouchStartHandler*/ 1) canvas_changes.onTouchStart = /*graphTouchStartHandler*/ ctx[31];

    			if (dirty[0] & /*vertexSize, edgeSize, vertexLabelSize, vertexLabelColorId, verticesGenerationCount, edgeLabelColorId, edgeLabelSize, edgeLabelDistance, connectAlgorithm, isShowDrillLabel, drillLabelSize, drillLabelColorId, drillColorId, drillNormalColorId, drillMoveSpeed, drillSpinSpeed, drillRotationsCount, isInfiniteSimulation, isReturnDrillToStart, drilledVertexColorId, zAlgorithmRowSize, graphComponent, totalDistance, totalDistanceWithStart, drillingTime, lastDrillingTime, isBlockDrillControls, backgroundColorId*/ 536870910 | dirty[1] & /*$showHint, $lang, $width, $height*/ 29696 | dirty[3] & /*$$scope*/ 1073741824) {
    				canvas_changes.$$scope = { dirty, ctx };
    			}

    			canvas.$set(canvas_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div, null);
    			}

    			if (dirty[1] & /*$showMenu*/ 32768) {
    				toggle_class(div, "controls_opened", /*$showMenu*/ ctx[46]);
    			}

    			const window0_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window0_changes.title = getTranslation(/*$lang*/ ctx[41], 'vertexSettings');
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window0_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].VertexSettings];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window0_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].VertexSettings];
    			if (dirty[1] & /*Windows*/ 128) window0_changes.onClickHandler = /*func*/ ctx[82];
    			if (dirty[1] & /*Windows*/ 128) window0_changes.onCloseHandler = /*func_1*/ ctx[83];

    			if (dirty[0] & /*vertexLabelColorId, vertexLabelSize, vertexSize*/ 26 | dirty[1] & /*$lang, $showVertexLabel, $vertexColorId*/ 394240 | dirty[3] & /*$$scope*/ 1073741824) {
    				window0_changes.$$scope = { dirty, ctx };
    			}

    			window0.$set(window0_changes);
    			const window1_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window1_changes.title = getTranslation(/*$lang*/ ctx[41], 'edgeSettings');
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window1_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].EdgeSettings];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window1_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].EdgeSettings];
    			if (dirty[1] & /*Windows*/ 128) window1_changes.onClickHandler = /*func_2*/ ctx[90];
    			if (dirty[1] & /*Windows*/ 128) window1_changes.onCloseHandler = /*func_3*/ ctx[91];

    			if (dirty[0] & /*edgeLabelColorId, edgeLabelDistance, edgeLabelSize, edgeSize*/ 452 | dirty[1] & /*$lang, $showEdgeLabel, $edgeColorId*/ 1573888 | dirty[3] & /*$$scope*/ 1073741824) {
    				window1_changes.$$scope = { dirty, ctx };
    			}

    			window1.$set(window1_changes);
    			const window2_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window2_changes.title = getTranslation(/*$lang*/ ctx[41], 'otherSettings');
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window2_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].OtherSettings];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window2_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].OtherSettings];
    			if (dirty[1] & /*Windows*/ 128) window2_changes.onClickHandler = /*func_4*/ ctx[96];
    			if (dirty[1] & /*Windows*/ 128) window2_changes.onCloseHandler = /*func_5*/ ctx[97];

    			if (dirty[0] & /*backgroundColorId, isFullscreen*/ 67108865 | dirty[1] & /*$lang, $showHint, $showFPS*/ 2102272 | dirty[3] & /*$$scope*/ 1073741824) {
    				window2_changes.$$scope = { dirty, ctx };
    			}

    			window2.$set(window2_changes);
    			const window3_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window3_changes.title = getTranslation(/*$lang*/ ctx[41], 'about');
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window3_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].About];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window3_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].About];
    			if (dirty[1] & /*Windows*/ 128) window3_changes.onClickHandler = /*func_6*/ ctx[98];
    			if (dirty[1] & /*Windows*/ 128) window3_changes.onCloseHandler = /*func_7*/ ctx[99];

    			if (dirty[1] & /*$lang*/ 1024 | dirty[3] & /*$$scope*/ 1073741824) {
    				window3_changes.$$scope = { dirty, ctx };
    			}

    			window3.$set(window3_changes);
    			const window4_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window4_changes.title = getTranslation(/*$lang*/ ctx[41], 'distance');
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window4_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].TotalDistance];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window4_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].TotalDistance];
    			if (dirty[1] & /*Windows*/ 128) window4_changes.onClickHandler = /*func_8*/ ctx[100];
    			if (dirty[1] & /*Windows*/ 128) window4_changes.onCloseHandler = /*func_9*/ ctx[101];

    			if (dirty[0] & /*totalDistanceWithStart, totalDistance*/ 1536 | dirty[1] & /*$lang*/ 1024 | dirty[3] & /*$$scope*/ 1073741824) {
    				window4_changes.$$scope = { dirty, ctx };
    			}

    			window4.$set(window4_changes);
    			const window5_changes = {};
    			if (dirty[1] & /*$lang*/ 1024) window5_changes.title = getTranslation(/*$lang*/ ctx[41], 'connectVertices');
    			if (dirty[1] & /*windowsStatus, Windows*/ 640) window5_changes.isOpened = /*windowsStatus*/ ctx[40][/*Windows*/ ctx[38].ConnectVertices];
    			if (dirty[1] & /*windowsOrder, Windows*/ 384) window5_changes.zIndex = /*windowsOrder*/ ctx[39][/*Windows*/ ctx[38].ConnectVertices];
    			if (dirty[1] & /*Windows*/ 128) window5_changes.onClickHandler = /*func_10*/ ctx[104];
    			if (dirty[1] & /*Windows*/ 128) window5_changes.onCloseHandler = /*func_11*/ ctx[105];

    			if (dirty[0] & /*zAlgorithmRowSize, connectAlgorithm*/ 134219776 | dirty[1] & /*graphConnectEdgesHandler, $lang, $isSimulationMode*/ 3088 | dirty[3] & /*$$scope*/ 1073741824) {
    				window5_changes.$$scope = { dirty, ctx };
    			}

    			window5.$set(window5_changes);

    			if (/*$isSimulationMode*/ ctx[42]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[1] & /*$isSimulationMode*/ 2048) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(window0.$$.fragment, local);
    			transition_in(window1.$$.fragment, local);
    			transition_in(window2.$$.fragment, local);
    			transition_in(window3.$$.fragment, local);
    			transition_in(window4.$$.fragment, local);
    			transition_in(window5.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(window0.$$.fragment, local);
    			transition_out(window1.$$.fragment, local);
    			transition_out(window2.$$.fragment, local);
    			transition_out(window3.$$.fragment, local);
    			transition_out(window4.$$.fragment, local);
    			transition_out(window5.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(canvas, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t1);
    			destroy_component(window0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(window1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(window2, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(window3, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(window4, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(window5, detaching);
    			if (detaching) detach_dev(t7);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $lang;
    	let $isSimulationMode;
    	let $showHint;
    	let $width;
    	let $height;
    	let $showMenu;
    	let $removeEdgesOnMoving;
    	let $showVertexLabel;
    	let $vertexColorId;
    	let $showEdgeLabel;
    	let $edgeColorId;
    	let $showFPS;
    	validate_store(lang, 'lang');
    	component_subscribe($$self, lang, $$value => $$invalidate(41, $lang = $$value));
    	validate_store(isSimulationMode, 'isSimulationMode');
    	component_subscribe($$self, isSimulationMode, $$value => $$invalidate(42, $isSimulationMode = $$value));
    	validate_store(showHint, 'showHint');
    	component_subscribe($$self, showHint, $$value => $$invalidate(43, $showHint = $$value));
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(44, $width = $$value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(45, $height = $$value));
    	validate_store(showMenu, 'showMenu');
    	component_subscribe($$self, showMenu, $$value => $$invalidate(46, $showMenu = $$value));
    	validate_store(removeEdgesOnMoving, 'removeEdgesOnMoving');
    	component_subscribe($$self, removeEdgesOnMoving, $$value => $$invalidate(47, $removeEdgesOnMoving = $$value));
    	validate_store(showVertexLabel, 'showVertexLabel');
    	component_subscribe($$self, showVertexLabel, $$value => $$invalidate(48, $showVertexLabel = $$value));
    	validate_store(vertexColorId, 'vertexColorId');
    	component_subscribe($$self, vertexColorId, $$value => $$invalidate(49, $vertexColorId = $$value));
    	validate_store(showEdgeLabel, 'showEdgeLabel');
    	component_subscribe($$self, showEdgeLabel, $$value => $$invalidate(50, $showEdgeLabel = $$value));
    	validate_store(edgeColorId, 'edgeColorId');
    	component_subscribe($$self, edgeColorId, $$value => $$invalidate(51, $edgeColorId = $$value));
    	validate_store(showFPS, 'showFPS');
    	component_subscribe($$self, showFPS, $$value => $$invalidate(52, $showFPS = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let connectAlgorithmsStrings = ['zAlgorithm', 'greedy', 'spanningTreePrim', 'prim', 'salesman', 'lastOrder'];

    	let connectAlgorithms = connectAlgorithmsStrings.map(algorithm => {
    		return {
    			option: algorithm,
    			label: algorithm,
    			id: algorithm + '_radio'
    		};
    	});

    	let isFullscreen = false;
    	let vertexSize = 10;
    	let edgeSize = 3;
    	let vertexLabelColorId = 9;
    	let vertexLabelSize = 8;
    	let verticesGenerationCount = 30;
    	let edgeLabelDistance = 30;
    	let edgeLabelSize = 8;
    	let edgeLabelColorId = 9;
    	let totalDistance = '0';
    	let totalDistanceWithStart = '0';
    	let connectAlgorithm = connectAlgorithmsStrings[0];
    	let drillMoveSpeed = 0.1;
    	let drillSpinSpeed = 0.5;
    	let drillRotationsCount = 10;
    	let drillColorId = 1;
    	let drillNormalColorId = 0;
    	let drillLabelSize = 8;
    	let drillLabelColorId = 9;
    	let isShowDrillLabel = true;
    	let isInfiniteSimulation = false;
    	let drillingTime = 0;
    	let lastDrillingTime = 0;
    	let isReturnDrillToStart = false;
    	let isBlockDrillControls = false;
    	let drilledVertexColorId = 9;
    	let backgroundColorId = 10;
    	let zAlgorithmRowSize = 30;
    	let graphComponent;
    	let graphClickHandler;
    	let graphMouseDownHandler;
    	let graphTouchStartHandler;
    	let graphRemoveVerticesHandler;
    	let graphRemoveEdgesHandler;
    	let graphGenerateVerticesHandler;
    	let graphConnectEdgesHandler;
    	let moveDrillToStartHandler;
    	let startSimulationHandler;

    	onMount(function () {
    		$$invalidate(29, graphClickHandler = function (ev) {
    			graphComponent.handleClick(ev);
    		});

    		$$invalidate(30, graphMouseDownHandler = function (ev) {
    			graphComponent.handleMouseDown(ev);
    		});

    		$$invalidate(31, graphTouchStartHandler = function (ev) {
    			graphComponent.handleTouchStart(ev);
    		});

    		$$invalidate(32, graphRemoveVerticesHandler = function () {
    			graphComponent.removeAllVertices();
    		});

    		$$invalidate(33, graphRemoveEdgesHandler = function () {
    			graphComponent.removeAllEdges();
    		});

    		$$invalidate(34, graphGenerateVerticesHandler = function () {
    			graphComponent.generateVertices();
    		});

    		$$invalidate(35, graphConnectEdgesHandler = function () {
    			graphComponent.connectEdges();
    		});

    		$$invalidate(36, moveDrillToStartHandler = function () {
    			if (!$isSimulationMode) {
    				return;
    			}

    			graphComponent.moveDrillToStart();
    		});

    		$$invalidate(37, startSimulationHandler = function () {
    			if (!$isSimulationMode) {
    				return;
    			}

    			graphComponent.startSimulation();
    		});
    	});

    	var Windows;

    	(function (Windows) {
    		Windows[Windows["VertexSettings"] = 0] = "VertexSettings";
    		Windows[Windows["EdgeSettings"] = 1] = "EdgeSettings";
    		Windows[Windows["OtherSettings"] = 2] = "OtherSettings";
    		Windows[Windows["About"] = 3] = "About";
    		Windows[Windows["TotalDistance"] = 4] = "TotalDistance";
    		Windows[Windows["ConnectVertices"] = 5] = "ConnectVertices";
    		Windows[Windows["SimulationControls"] = 6] = "SimulationControls";
    		Windows[Windows["DrillingTime"] = 7] = "DrillingTime";
    		Windows[Windows["Size"] = 8] = "Size";
    	})(Windows || (Windows = {}));

    	let windowsOrder = [...Array(Windows.Size).keys()];
    	let windowsStatus = new Array(Windows.Size);
    	windowsStatus.fill(false);

    	function makeWindowActive(window) {
    		$$invalidate(40, windowsStatus[window] = true, windowsStatus);

    		for (let i = 0; i < windowsOrder.length; i++) {
    			if (windowsOrder[i] > windowsOrder[window]) {
    				$$invalidate(39, windowsOrder[i] -= 1, windowsOrder);
    			}
    		}

    		$$invalidate(39, windowsOrder[window] = Windows.Size - 1, windowsOrder);
    	}

    	function makeWindowInactive(window) {
    		$$invalidate(40, windowsStatus[window] = false, windowsStatus);

    		for (let i = 0; i < windowsOrder.length; i++) {
    			if (windowsOrder[i] < windowsOrder[window]) {
    				$$invalidate(39, windowsOrder[i] += 1, windowsOrder);
    			}
    		}

    		$$invalidate(39, windowsOrder[window] = 0, windowsOrder);
    	}

    	function switchFullscreen() {
    		if (document.fullscreenElement) {
    			document.exitFullscreen().then(function () {
    				
    			}).catch(function (error) {
    				// element could not exit fullscreen mode
    				// error message
    				console.log(error.message); // element has exited fullscreen mode
    			});

    			$$invalidate(0, isFullscreen = false);
    		} else {
    			document.documentElement.requestFullscreen().then(function () {
    				
    			}).catch(function (error) {
    				// element could not enter fullscreen mode
    				// error message
    				console.log(error.message); // element has entered fullscreen mode successfully
    			});

    			$$invalidate(0, isFullscreen = true);
    		}
    	}

    	function msToStringTime(time) {
    		let seconds = Math.floor(time / 1000);
    		let minutes = Math.floor(seconds / 60);
    		seconds = seconds % 60;
    		let milliseconds = time % 1000;
    		return minutes + getTranslation($lang, 'minutesShort') + " " + seconds + getTranslation($lang, 'secondsShort') + " " + milliseconds + getTranslation($lang, 'milliSecondsShort');
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const fullscreenchange_handler = () => {
    		$$invalidate(0, isFullscreen = document.fullscreenElement !== null);
    	};

    	function graph_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			graphComponent = $$value;
    			$$invalidate(28, graphComponent);
    		});
    	}

    	function graph_totalDistance_binding(value) {
    		totalDistance = value;
    		$$invalidate(9, totalDistance);
    	}

    	function graph_totalDistanceWithStart_binding(value) {
    		totalDistanceWithStart = value;
    		$$invalidate(10, totalDistanceWithStart);
    	}

    	function graph_drillingTime_binding(value) {
    		drillingTime = value;
    		$$invalidate(21, drillingTime);
    	}

    	function graph_lastDrillingTime_binding(value) {
    		lastDrillingTime = value;
    		$$invalidate(22, lastDrillingTime);
    	}

    	function graph_isBlockDrillControls_binding(value) {
    		isBlockDrillControls = value;
    		$$invalidate(24, isBlockDrillControls);
    	}

    	const click_handler = () => {
    		makeWindowActive(Windows.About);
    	};

    	const click_handler_1 = () => set_store_value(showMenu, $showMenu = false, $showMenu);

    	function checkbox_checked_binding(value) {
    		$removeEdgesOnMoving = value;
    		removeEdgesOnMoving.set($removeEdgesOnMoving);
    	}

    	function checkbox_checked_binding_1(value) {
    		$isSimulationMode = value;
    		isSimulationMode.set($isSimulationMode);
    	}

    	function inputrange_value_binding(value) {
    		verticesGenerationCount = value;
    		$$invalidate(5, verticesGenerationCount);
    	}

    	const click_handler_2 = () => {
    		makeWindowActive(Windows.ConnectVertices);
    	};

    	const click_handler_3 = () => {
    		makeWindowActive(Windows.TotalDistance);
    	};

    	const click_handler_4 = () => {
    		makeWindowActive(Windows.SimulationControls);
    	};

    	const click_handler_5 = () => {
    		makeWindowActive(Windows.VertexSettings);
    	};

    	const click_handler_6 = () => {
    		makeWindowActive(Windows.EdgeSettings);
    	};

    	const click_handler_7 = () => {
    		makeWindowActive(Windows.OtherSettings);
    	};

    	const click_handler_8 = () => set_store_value(showMenu, $showMenu = true, $showMenu);

    	function checkbox_checked_binding_2(value) {
    		$showVertexLabel = value;
    		showVertexLabel.set($showVertexLabel);
    	}

    	function inputrange_value_binding_1(value) {
    		vertexSize = value;
    		$$invalidate(1, vertexSize);
    	}

    	function inputrange_value_binding_2(value) {
    		vertexLabelSize = value;
    		$$invalidate(4, vertexLabelSize);
    	}

    	function colorselector_selectedId_binding(value) {
    		$vertexColorId = value;
    		vertexColorId.set($vertexColorId);
    	}

    	function colorselector_selectedId_binding_1(value) {
    		vertexLabelColorId = value;
    		$$invalidate(3, vertexLabelColorId);
    	}

    	const func = () => {
    		makeWindowActive(Windows.VertexSettings);
    	};

    	const func_1 = () => {
    		makeWindowInactive(Windows.VertexSettings);
    	};

    	function checkbox_checked_binding_3(value) {
    		$showEdgeLabel = value;
    		showEdgeLabel.set($showEdgeLabel);
    	}

    	function inputrange_value_binding_3(value) {
    		edgeSize = value;
    		$$invalidate(2, edgeSize);
    	}

    	function inputrange0_value_binding(value) {
    		edgeLabelSize = value;
    		$$invalidate(7, edgeLabelSize);
    	}

    	function inputrange1_value_binding(value) {
    		edgeLabelDistance = value;
    		$$invalidate(6, edgeLabelDistance);
    	}

    	function colorselector_selectedId_binding_2(value) {
    		$edgeColorId = value;
    		edgeColorId.set($edgeColorId);
    	}

    	function colorselector_selectedId_binding_3(value) {
    		edgeLabelColorId = value;
    		$$invalidate(8, edgeLabelColorId);
    	}

    	const func_2 = () => {
    		makeWindowActive(Windows.EdgeSettings);
    	};

    	const func_3 = () => {
    		makeWindowInactive(Windows.EdgeSettings);
    	};

    	function checkbox0_checked_binding(value) {
    		$showFPS = value;
    		showFPS.set($showFPS);
    	}

    	function checkbox1_checked_binding(value) {
    		$showHint = value;
    		showHint.set($showHint);
    	}

    	function radiobuttons_group_binding(value) {
    		$lang = value;
    		lang.set($lang);
    	}

    	function colorselector_selectedId_binding_4(value) {
    		backgroundColorId = value;
    		$$invalidate(26, backgroundColorId);
    	}

    	const func_4 = () => {
    		makeWindowActive(Windows.OtherSettings);
    	};

    	const func_5 = () => {
    		makeWindowInactive(Windows.OtherSettings);
    	};

    	const func_6 = () => {
    		makeWindowActive(Windows.About);
    	};

    	const func_7 = () => {
    		makeWindowInactive(Windows.About);
    	};

    	const func_8 = () => {
    		makeWindowActive(Windows.TotalDistance);
    	};

    	const func_9 = () => {
    		makeWindowInactive(Windows.TotalDistance);
    	};

    	function radiobuttons_group_binding_1(value) {
    		connectAlgorithm = value;
    		$$invalidate(11, connectAlgorithm);
    	}

    	function inputrange_value_binding_4(value) {
    		zAlgorithmRowSize = value;
    		$$invalidate(27, zAlgorithmRowSize);
    	}

    	const func_10 = () => {
    		makeWindowActive(Windows.ConnectVertices);
    	};

    	const func_11 = () => {
    		makeWindowInactive(Windows.ConnectVertices);
    	};

    	function checkbox0_checked_binding_1(value) {
    		isShowDrillLabel = value;
    		$$invalidate(19, isShowDrillLabel);
    	}

    	function checkbox1_checked_binding_1(value) {
    		isInfiniteSimulation = value;
    		$$invalidate(20, isInfiniteSimulation);
    	}

    	function checkbox2_checked_binding(value) {
    		isReturnDrillToStart = value;
    		$$invalidate(23, isReturnDrillToStart);
    	}

    	const click_handler_9 = () => {
    		makeWindowActive(Windows.DrillingTime);
    	};

    	function inputrange0_value_binding_1(value) {
    		drillMoveSpeed = value;
    		$$invalidate(12, drillMoveSpeed);
    	}

    	function inputrange1_value_binding_1(value) {
    		drillSpinSpeed = value;
    		$$invalidate(13, drillSpinSpeed);
    	}

    	function inputrange2_value_binding(value) {
    		drillRotationsCount = value;
    		$$invalidate(14, drillRotationsCount);
    	}

    	function inputrange_value_binding_5(value) {
    		drillLabelSize = value;
    		$$invalidate(17, drillLabelSize);
    	}

    	function colorselector0_selectedId_binding(value) {
    		drillColorId = value;
    		$$invalidate(15, drillColorId);
    	}

    	function colorselector1_selectedId_binding(value) {
    		drillNormalColorId = value;
    		$$invalidate(16, drillNormalColorId);
    	}

    	function colorselector_selectedId_binding_5(value) {
    		drillLabelColorId = value;
    		$$invalidate(18, drillLabelColorId);
    	}

    	function colorselector2_selectedId_binding(value) {
    		drilledVertexColorId = value;
    		$$invalidate(25, drilledVertexColorId);
    	}

    	const func_12 = () => {
    		makeWindowActive(Windows.SimulationControls);
    	};

    	const func_13 = () => {
    		makeWindowInactive(Windows.SimulationControls);
    	};

    	const func_14 = () => {
    		makeWindowActive(Windows.DrillingTime);
    	};

    	const func_15 = () => {
    		makeWindowInactive(Windows.DrillingTime);
    	};

    	$$self.$capture_state = () => ({
    		width,
    		height,
    		showVertexLabel,
    		showEdgeLabel,
    		removeEdgesOnMoving,
    		isSimulationMode,
    		vertexColorId,
    		edgeColorId,
    		languages,
    		getTranslation,
    		lang,
    		COLORS,
    		showMenu,
    		showFPS,
    		showHint,
    		onMount,
    		Canvas,
    		Background,
    		DotGrid,
    		Graph,
    		Text,
    		FPS,
    		InputRange,
    		Checkbox,
    		ColorSelector,
    		Window,
    		RadioButtons,
    		connectAlgorithmsStrings,
    		connectAlgorithms,
    		isFullscreen,
    		vertexSize,
    		edgeSize,
    		vertexLabelColorId,
    		vertexLabelSize,
    		verticesGenerationCount,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColorId,
    		totalDistance,
    		totalDistanceWithStart,
    		connectAlgorithm,
    		drillMoveSpeed,
    		drillSpinSpeed,
    		drillRotationsCount,
    		drillColorId,
    		drillNormalColorId,
    		drillLabelSize,
    		drillLabelColorId,
    		isShowDrillLabel,
    		isInfiniteSimulation,
    		drillingTime,
    		lastDrillingTime,
    		isReturnDrillToStart,
    		isBlockDrillControls,
    		drilledVertexColorId,
    		backgroundColorId,
    		zAlgorithmRowSize,
    		graphComponent,
    		graphClickHandler,
    		graphMouseDownHandler,
    		graphTouchStartHandler,
    		graphRemoveVerticesHandler,
    		graphRemoveEdgesHandler,
    		graphGenerateVerticesHandler,
    		graphConnectEdgesHandler,
    		moveDrillToStartHandler,
    		startSimulationHandler,
    		Windows,
    		windowsOrder,
    		windowsStatus,
    		makeWindowActive,
    		makeWindowInactive,
    		switchFullscreen,
    		msToStringTime,
    		$lang,
    		$isSimulationMode,
    		$showHint,
    		$width,
    		$height,
    		$showMenu,
    		$removeEdgesOnMoving,
    		$showVertexLabel,
    		$vertexColorId,
    		$showEdgeLabel,
    		$edgeColorId,
    		$showFPS
    	});

    	$$self.$inject_state = $$props => {
    		if ('connectAlgorithmsStrings' in $$props) connectAlgorithmsStrings = $$props.connectAlgorithmsStrings;
    		if ('connectAlgorithms' in $$props) $$invalidate(53, connectAlgorithms = $$props.connectAlgorithms);
    		if ('isFullscreen' in $$props) $$invalidate(0, isFullscreen = $$props.isFullscreen);
    		if ('vertexSize' in $$props) $$invalidate(1, vertexSize = $$props.vertexSize);
    		if ('edgeSize' in $$props) $$invalidate(2, edgeSize = $$props.edgeSize);
    		if ('vertexLabelColorId' in $$props) $$invalidate(3, vertexLabelColorId = $$props.vertexLabelColorId);
    		if ('vertexLabelSize' in $$props) $$invalidate(4, vertexLabelSize = $$props.vertexLabelSize);
    		if ('verticesGenerationCount' in $$props) $$invalidate(5, verticesGenerationCount = $$props.verticesGenerationCount);
    		if ('edgeLabelDistance' in $$props) $$invalidate(6, edgeLabelDistance = $$props.edgeLabelDistance);
    		if ('edgeLabelSize' in $$props) $$invalidate(7, edgeLabelSize = $$props.edgeLabelSize);
    		if ('edgeLabelColorId' in $$props) $$invalidate(8, edgeLabelColorId = $$props.edgeLabelColorId);
    		if ('totalDistance' in $$props) $$invalidate(9, totalDistance = $$props.totalDistance);
    		if ('totalDistanceWithStart' in $$props) $$invalidate(10, totalDistanceWithStart = $$props.totalDistanceWithStart);
    		if ('connectAlgorithm' in $$props) $$invalidate(11, connectAlgorithm = $$props.connectAlgorithm);
    		if ('drillMoveSpeed' in $$props) $$invalidate(12, drillMoveSpeed = $$props.drillMoveSpeed);
    		if ('drillSpinSpeed' in $$props) $$invalidate(13, drillSpinSpeed = $$props.drillSpinSpeed);
    		if ('drillRotationsCount' in $$props) $$invalidate(14, drillRotationsCount = $$props.drillRotationsCount);
    		if ('drillColorId' in $$props) $$invalidate(15, drillColorId = $$props.drillColorId);
    		if ('drillNormalColorId' in $$props) $$invalidate(16, drillNormalColorId = $$props.drillNormalColorId);
    		if ('drillLabelSize' in $$props) $$invalidate(17, drillLabelSize = $$props.drillLabelSize);
    		if ('drillLabelColorId' in $$props) $$invalidate(18, drillLabelColorId = $$props.drillLabelColorId);
    		if ('isShowDrillLabel' in $$props) $$invalidate(19, isShowDrillLabel = $$props.isShowDrillLabel);
    		if ('isInfiniteSimulation' in $$props) $$invalidate(20, isInfiniteSimulation = $$props.isInfiniteSimulation);
    		if ('drillingTime' in $$props) $$invalidate(21, drillingTime = $$props.drillingTime);
    		if ('lastDrillingTime' in $$props) $$invalidate(22, lastDrillingTime = $$props.lastDrillingTime);
    		if ('isReturnDrillToStart' in $$props) $$invalidate(23, isReturnDrillToStart = $$props.isReturnDrillToStart);
    		if ('isBlockDrillControls' in $$props) $$invalidate(24, isBlockDrillControls = $$props.isBlockDrillControls);
    		if ('drilledVertexColorId' in $$props) $$invalidate(25, drilledVertexColorId = $$props.drilledVertexColorId);
    		if ('backgroundColorId' in $$props) $$invalidate(26, backgroundColorId = $$props.backgroundColorId);
    		if ('zAlgorithmRowSize' in $$props) $$invalidate(27, zAlgorithmRowSize = $$props.zAlgorithmRowSize);
    		if ('graphComponent' in $$props) $$invalidate(28, graphComponent = $$props.graphComponent);
    		if ('graphClickHandler' in $$props) $$invalidate(29, graphClickHandler = $$props.graphClickHandler);
    		if ('graphMouseDownHandler' in $$props) $$invalidate(30, graphMouseDownHandler = $$props.graphMouseDownHandler);
    		if ('graphTouchStartHandler' in $$props) $$invalidate(31, graphTouchStartHandler = $$props.graphTouchStartHandler);
    		if ('graphRemoveVerticesHandler' in $$props) $$invalidate(32, graphRemoveVerticesHandler = $$props.graphRemoveVerticesHandler);
    		if ('graphRemoveEdgesHandler' in $$props) $$invalidate(33, graphRemoveEdgesHandler = $$props.graphRemoveEdgesHandler);
    		if ('graphGenerateVerticesHandler' in $$props) $$invalidate(34, graphGenerateVerticesHandler = $$props.graphGenerateVerticesHandler);
    		if ('graphConnectEdgesHandler' in $$props) $$invalidate(35, graphConnectEdgesHandler = $$props.graphConnectEdgesHandler);
    		if ('moveDrillToStartHandler' in $$props) $$invalidate(36, moveDrillToStartHandler = $$props.moveDrillToStartHandler);
    		if ('startSimulationHandler' in $$props) $$invalidate(37, startSimulationHandler = $$props.startSimulationHandler);
    		if ('Windows' in $$props) $$invalidate(38, Windows = $$props.Windows);
    		if ('windowsOrder' in $$props) $$invalidate(39, windowsOrder = $$props.windowsOrder);
    		if ('windowsStatus' in $$props) $$invalidate(40, windowsStatus = $$props.windowsStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isFullscreen,
    		vertexSize,
    		edgeSize,
    		vertexLabelColorId,
    		vertexLabelSize,
    		verticesGenerationCount,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColorId,
    		totalDistance,
    		totalDistanceWithStart,
    		connectAlgorithm,
    		drillMoveSpeed,
    		drillSpinSpeed,
    		drillRotationsCount,
    		drillColorId,
    		drillNormalColorId,
    		drillLabelSize,
    		drillLabelColorId,
    		isShowDrillLabel,
    		isInfiniteSimulation,
    		drillingTime,
    		lastDrillingTime,
    		isReturnDrillToStart,
    		isBlockDrillControls,
    		drilledVertexColorId,
    		backgroundColorId,
    		zAlgorithmRowSize,
    		graphComponent,
    		graphClickHandler,
    		graphMouseDownHandler,
    		graphTouchStartHandler,
    		graphRemoveVerticesHandler,
    		graphRemoveEdgesHandler,
    		graphGenerateVerticesHandler,
    		graphConnectEdgesHandler,
    		moveDrillToStartHandler,
    		startSimulationHandler,
    		Windows,
    		windowsOrder,
    		windowsStatus,
    		$lang,
    		$isSimulationMode,
    		$showHint,
    		$width,
    		$height,
    		$showMenu,
    		$removeEdgesOnMoving,
    		$showVertexLabel,
    		$vertexColorId,
    		$showEdgeLabel,
    		$edgeColorId,
    		$showFPS,
    		connectAlgorithms,
    		makeWindowActive,
    		makeWindowInactive,
    		switchFullscreen,
    		msToStringTime,
    		fullscreenchange_handler,
    		graph_binding,
    		graph_totalDistance_binding,
    		graph_totalDistanceWithStart_binding,
    		graph_drillingTime_binding,
    		graph_lastDrillingTime_binding,
    		graph_isBlockDrillControls_binding,
    		click_handler,
    		click_handler_1,
    		checkbox_checked_binding,
    		checkbox_checked_binding_1,
    		inputrange_value_binding,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		checkbox_checked_binding_2,
    		inputrange_value_binding_1,
    		inputrange_value_binding_2,
    		colorselector_selectedId_binding,
    		colorselector_selectedId_binding_1,
    		func,
    		func_1,
    		checkbox_checked_binding_3,
    		inputrange_value_binding_3,
    		inputrange0_value_binding,
    		inputrange1_value_binding,
    		colorselector_selectedId_binding_2,
    		colorselector_selectedId_binding_3,
    		func_2,
    		func_3,
    		checkbox0_checked_binding,
    		checkbox1_checked_binding,
    		radiobuttons_group_binding,
    		colorselector_selectedId_binding_4,
    		func_4,
    		func_5,
    		func_6,
    		func_7,
    		func_8,
    		func_9,
    		radiobuttons_group_binding_1,
    		inputrange_value_binding_4,
    		func_10,
    		func_11,
    		checkbox0_checked_binding_1,
    		checkbox1_checked_binding_1,
    		checkbox2_checked_binding,
    		click_handler_9,
    		inputrange0_value_binding_1,
    		inputrange1_value_binding_1,
    		inputrange2_value_binding,
    		inputrange_value_binding_5,
    		colorselector0_selectedId_binding,
    		colorselector1_selectedId_binding,
    		colorselector_selectedId_binding_5,
    		colorselector2_selectedId_binding,
    		func_12,
    		func_13,
    		func_14,
    		func_15
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
