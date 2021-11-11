
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
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
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

    /* src\Canvas.svelte generated by Svelte v3.44.0 */

    const { console: console_1$2, window: window_1$1 } = globals;

    const file$6 = "src\\Canvas.svelte";

    function create_fragment$b(ctx) {
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
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
    			id: create_fragment$b.name
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

    /* src\Background.svelte generated by Svelte v3.44.0 */

    function create_fragment$a(ctx) {
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Background",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get color() {
    		throw new Error("<Background>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Background>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\DotGrid.svelte generated by Svelte v3.44.0 */

    function create_fragment$9(ctx) {
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { color: 0, divisions: 1, pointSize: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DotGrid",
    			options,
    			id: create_fragment$9.name
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

    /* src\Graph.svelte generated by Svelte v3.44.0 */

    const { console: console_1$1 } = globals;

    function create_fragment$8(ctx) {
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[26].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[25], null);

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

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "mouseup", /*handleMouseUp*/ ctx[1], false, false, false),
    					listen_dev(window, "touchend", /*handleMouseUp*/ ctx[1], false, false, false),
    					listen_dev(window, "mousemove", /*handleMouseMove*/ ctx[0], false, false, false),
    					listen_dev(window, "touchmove", /*handleTouchMove*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 33554432)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[25],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[25])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[25], dirty, null),
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
    			mounted = false;
    			run_all(dispose);
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

    function instance$8($$self, $$props, $$invalidate) {
    	let $height;
    	let $width;
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(34, $height = $$value));
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(35, $width = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Graph', slots, ['default']);
    	let { vertexColor = '#ffe554' } = $$props;
    	let { edgeColor = '#ffe554' } = $$props;
    	let { vertexSize = 10 } = $$props;
    	let { edgeSize = 3 } = $$props;
    	let { showVertexLabel = true } = $$props;
    	let { removeEdgesOnMoving = false } = $$props;
    	let { vertexLabelColor = 'hsl(0, 0%, 100%)' } = $$props;
    	let { vertexLabelSize = 8 } = $$props;
    	let { vertexesGenerationCount = 30 } = $$props;
    	let { showEdgeLabel = true } = $$props;
    	let { edgeLabelDistance = 30 } = $$props;
    	let { edgeLabelSize = 8 } = $$props;
    	let { edgeLabelColor = 'hsl(0, 0%, 100%)' } = $$props;
    	let { totalDistance = '0' } = $$props;
    	let { totalDistanceWithStart = '0' } = $$props;
    	let vertexes = [];
    	let edges = [];
    	let minDistance = 80;
    	let startPosition = { x: 0, y: 0 };
    	let mouse = null;
    	let movingVertexId = -1;
    	let mouseDown = false;
    	let time = -1;

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

    			vertexes[movingVertexId] = { x, y };

    			if (removeEdgesOnMoving) {
    				removeAllEdges();
    			} else {
    				calculateDistances();
    			}
    		}

    		for (let edge of edges) {
    			drawLine(context, vertexes[edge.i], vertexes[edge.j]);
    		}

    		for (let vertex of vertexes) {
    			context.lineCap = 'round';
    			context.beginPath();
    			context.fillStyle = vertexColor;
    			context.strokeStyle = vertexColor;
    			context.lineWidth = 3;
    			context.arc(vertex.x, vertex.y, vertexSize, 0, Math.PI * 2);
    			context.fill();
    		}

    		if (showVertexLabel) {
    			for (let vertex of vertexes) {
    				let text = `(${Math.round(vertex.x)}, ${Math.round(vertex.y)})`;

    				drawVertexLabel({
    					context,
    					text,
    					x: vertex.x,
    					y: vertex.y + vertexSize + 10
    				});
    			}
    		}

    		if (showEdgeLabel) {
    			for (let edge of edges) {
    				drawEdgeLabel(context, vertexes[edge.i], vertexes[edge.j]);
    			}
    		}
    	});

    	function handleClick(ev) {
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
    			vertexes = [
    				...vertexes.slice(0, nearest.index),
    				...vertexes.slice(nearest.index + 1, vertexes.length)
    			];

    			return;
    		}

    		let vertex = { x, y };
    		vertexes = [...vertexes, vertex];
    	}

    	function handleMouseDown(ev) {
    		let x = ev.clientX;
    		let y = ev.clientY;
    		let nearest = getNearestVertex(x, y);

    		if (nearest.value > vertexSize || nearest.index === -1) {
    			return;
    		}

    		movingVertexId = nearest.index;
    		mouse = vertexes[movingVertexId];
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
    		$$invalidate(3, totalDistance = '0');
    		$$invalidate(4, totalDistanceWithStart = '0');
    		resetDistances();
    	}

    	function removeAllVertexes() {
    		removeAllEdges();
    		vertexes = [];
    	}

    	function generateVertexes() {
    		removeAllVertexes();
    		let attempts = 0;

    		while (vertexes.length !== vertexesGenerationCount && attempts !== 5000) {
    			let x = getRandomInt(0, $width - 1);
    			let y = getRandomInt(0, $height - 1);
    			let nearest = getNearestVertex(x, y);

    			if (nearest.value < minDistance && nearest.index != -1) {
    				attempts++;
    				continue;
    			}

    			let vertex = { x, y };
    			vertexes = [...vertexes, vertex];
    			attempts = 0;
    		}

    		console.log(`Generated ${vertexes.length} vertexes`);
    	}

    	function fillEdgesInAddingOrder() {
    		removeAllEdges();

    		for (let i = 0; i < vertexes.length; i++) {
    			let j = i + 1;

    			if (j < vertexes.length) {
    				edges = [...edges, { i, j }];
    			}
    		}

    		calculateDistances();
    	}

    	function calculateDistances() {
    		let totalDistanceCount = 0;

    		for (let i = 0; i < vertexes.length; i++) {
    			let j = i + 1;

    			if (j < vertexes.length) {
    				totalDistanceCount += getDistance(vertexes[i], vertexes[j]);
    			}
    		}

    		let totalDistanceWithStartCount = totalDistanceCount;

    		if (vertexes.length) {
    			totalDistanceWithStartCount += getDistance(startPosition, vertexes[0]);
    			totalDistanceWithStartCount += getDistance(startPosition, vertexes.at(-1));
    		}

    		$$invalidate(3, totalDistance = Math.round(totalDistanceCount).toString());
    		$$invalidate(4, totalDistanceWithStart = Math.round(totalDistanceWithStartCount).toString());
    	}

    	function resetDistances() {
    		$$invalidate(3, totalDistance = '0');
    		$$invalidate(4, totalDistanceWithStart = '0');
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
    		context.strokeStyle = edgeColor;
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
    		let thetaVertexes = angle(vertexI.x, vertexI.y, vertexJ.x, vertexJ.y);
    		let radius = edgeLabelDistance;
    		let resultX = radius * Math.cos(thetaVertexes + 3 * Math.PI / 2) + x;
    		let resultY = radius * Math.sin(thetaVertexes + 3 * Math.PI / 2) + y;
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
    		context.rotate(thetaVertexes);
    		context.fillText(label, 0, 0);
    		context.restore();
    	}

    	function getNearestVertex(x, y, vertexesList = vertexes) {
    		let nearestIndex = -1;
    		let nearestValue = -1;

    		for (let i = 0; i < vertexesList.length; i++) {
    			let vertex = vertexesList[i];
    			let value = getDistance(vertex, { x, y });

    			if (nearestIndex === -1 || nearestValue > value) {
    				nearestIndex = i;
    				nearestValue = value;
    			}
    		}

    		return { value: nearestValue, index: nearestIndex };
    	}

    	const writable_props = [
    		'vertexColor',
    		'edgeColor',
    		'vertexSize',
    		'edgeSize',
    		'showVertexLabel',
    		'removeEdgesOnMoving',
    		'vertexLabelColor',
    		'vertexLabelSize',
    		'vertexesGenerationCount',
    		'showEdgeLabel',
    		'edgeLabelDistance',
    		'edgeLabelSize',
    		'edgeLabelColor',
    		'totalDistance',
    		'totalDistanceWithStart'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Graph> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('vertexColor' in $$props) $$invalidate(5, vertexColor = $$props.vertexColor);
    		if ('edgeColor' in $$props) $$invalidate(6, edgeColor = $$props.edgeColor);
    		if ('vertexSize' in $$props) $$invalidate(7, vertexSize = $$props.vertexSize);
    		if ('edgeSize' in $$props) $$invalidate(8, edgeSize = $$props.edgeSize);
    		if ('showVertexLabel' in $$props) $$invalidate(9, showVertexLabel = $$props.showVertexLabel);
    		if ('removeEdgesOnMoving' in $$props) $$invalidate(10, removeEdgesOnMoving = $$props.removeEdgesOnMoving);
    		if ('vertexLabelColor' in $$props) $$invalidate(11, vertexLabelColor = $$props.vertexLabelColor);
    		if ('vertexLabelSize' in $$props) $$invalidate(12, vertexLabelSize = $$props.vertexLabelSize);
    		if ('vertexesGenerationCount' in $$props) $$invalidate(13, vertexesGenerationCount = $$props.vertexesGenerationCount);
    		if ('showEdgeLabel' in $$props) $$invalidate(14, showEdgeLabel = $$props.showEdgeLabel);
    		if ('edgeLabelDistance' in $$props) $$invalidate(15, edgeLabelDistance = $$props.edgeLabelDistance);
    		if ('edgeLabelSize' in $$props) $$invalidate(16, edgeLabelSize = $$props.edgeLabelSize);
    		if ('edgeLabelColor' in $$props) $$invalidate(17, edgeLabelColor = $$props.edgeLabelColor);
    		if ('totalDistance' in $$props) $$invalidate(3, totalDistance = $$props.totalDistance);
    		if ('totalDistanceWithStart' in $$props) $$invalidate(4, totalDistanceWithStart = $$props.totalDistanceWithStart);
    		if ('$$scope' in $$props) $$invalidate(25, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		renderable,
    		width,
    		height,
    		vertexColor,
    		edgeColor,
    		vertexSize,
    		edgeSize,
    		showVertexLabel,
    		removeEdgesOnMoving,
    		vertexLabelColor,
    		vertexLabelSize,
    		vertexesGenerationCount,
    		showEdgeLabel,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColor,
    		totalDistance,
    		totalDistanceWithStart,
    		vertexes,
    		edges,
    		minDistance,
    		startPosition,
    		mouse,
    		movingVertexId,
    		mouseDown,
    		time,
    		CLICK_TIME_MS,
    		handleClick,
    		handleMouseDown,
    		handleMouseMove,
    		handleMouseUp,
    		handleTouchStart,
    		previousTouch,
    		handleTouchMove,
    		removeAllEdges,
    		removeAllVertexes,
    		getRandomInt,
    		generateVertexes,
    		fillEdgesInAddingOrder,
    		calculateDistances,
    		resetDistances,
    		drawVertexLabel,
    		drawLine,
    		drawEdgeLabel,
    		angle,
    		getDistance,
    		getNearestVertex,
    		$height,
    		$width
    	});

    	$$self.$inject_state = $$props => {
    		if ('vertexColor' in $$props) $$invalidate(5, vertexColor = $$props.vertexColor);
    		if ('edgeColor' in $$props) $$invalidate(6, edgeColor = $$props.edgeColor);
    		if ('vertexSize' in $$props) $$invalidate(7, vertexSize = $$props.vertexSize);
    		if ('edgeSize' in $$props) $$invalidate(8, edgeSize = $$props.edgeSize);
    		if ('showVertexLabel' in $$props) $$invalidate(9, showVertexLabel = $$props.showVertexLabel);
    		if ('removeEdgesOnMoving' in $$props) $$invalidate(10, removeEdgesOnMoving = $$props.removeEdgesOnMoving);
    		if ('vertexLabelColor' in $$props) $$invalidate(11, vertexLabelColor = $$props.vertexLabelColor);
    		if ('vertexLabelSize' in $$props) $$invalidate(12, vertexLabelSize = $$props.vertexLabelSize);
    		if ('vertexesGenerationCount' in $$props) $$invalidate(13, vertexesGenerationCount = $$props.vertexesGenerationCount);
    		if ('showEdgeLabel' in $$props) $$invalidate(14, showEdgeLabel = $$props.showEdgeLabel);
    		if ('edgeLabelDistance' in $$props) $$invalidate(15, edgeLabelDistance = $$props.edgeLabelDistance);
    		if ('edgeLabelSize' in $$props) $$invalidate(16, edgeLabelSize = $$props.edgeLabelSize);
    		if ('edgeLabelColor' in $$props) $$invalidate(17, edgeLabelColor = $$props.edgeLabelColor);
    		if ('totalDistance' in $$props) $$invalidate(3, totalDistance = $$props.totalDistance);
    		if ('totalDistanceWithStart' in $$props) $$invalidate(4, totalDistanceWithStart = $$props.totalDistanceWithStart);
    		if ('vertexes' in $$props) vertexes = $$props.vertexes;
    		if ('edges' in $$props) edges = $$props.edges;
    		if ('minDistance' in $$props) minDistance = $$props.minDistance;
    		if ('startPosition' in $$props) startPosition = $$props.startPosition;
    		if ('mouse' in $$props) mouse = $$props.mouse;
    		if ('movingVertexId' in $$props) movingVertexId = $$props.movingVertexId;
    		if ('mouseDown' in $$props) mouseDown = $$props.mouseDown;
    		if ('time' in $$props) time = $$props.time;
    		if ('previousTouch' in $$props) previousTouch = $$props.previousTouch;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		handleMouseMove,
    		handleMouseUp,
    		handleTouchMove,
    		totalDistance,
    		totalDistanceWithStart,
    		vertexColor,
    		edgeColor,
    		vertexSize,
    		edgeSize,
    		showVertexLabel,
    		removeEdgesOnMoving,
    		vertexLabelColor,
    		vertexLabelSize,
    		vertexesGenerationCount,
    		showEdgeLabel,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColor,
    		handleClick,
    		handleMouseDown,
    		handleTouchStart,
    		removeAllEdges,
    		removeAllVertexes,
    		generateVertexes,
    		fillEdgesInAddingOrder,
    		$$scope,
    		slots
    	];
    }

    class Graph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$8,
    			create_fragment$8,
    			safe_not_equal,
    			{
    				vertexColor: 5,
    				edgeColor: 6,
    				vertexSize: 7,
    				edgeSize: 8,
    				showVertexLabel: 9,
    				removeEdgesOnMoving: 10,
    				vertexLabelColor: 11,
    				vertexLabelSize: 12,
    				vertexesGenerationCount: 13,
    				showEdgeLabel: 14,
    				edgeLabelDistance: 15,
    				edgeLabelSize: 16,
    				edgeLabelColor: 17,
    				totalDistance: 3,
    				totalDistanceWithStart: 4,
    				handleClick: 18,
    				handleMouseDown: 19,
    				handleTouchStart: 20,
    				removeAllEdges: 21,
    				removeAllVertexes: 22,
    				generateVertexes: 23,
    				fillEdgesInAddingOrder: 24
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get vertexColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertexColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get edgeColor() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set edgeColor(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    	get showVertexLabel() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showVertexLabel(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeEdgesOnMoving() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeEdgesOnMoving(value) {
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

    	get vertexesGenerationCount() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertexesGenerationCount(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showEdgeLabel() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showEdgeLabel(value) {
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

    	get handleClick() {
    		return this.$$.ctx[18];
    	}

    	set handleClick(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleMouseDown() {
    		return this.$$.ctx[19];
    	}

    	set handleMouseDown(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleTouchStart() {
    		return this.$$.ctx[20];
    	}

    	set handleTouchStart(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeAllEdges() {
    		return this.$$.ctx[21];
    	}

    	set removeAllEdges(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeAllVertexes() {
    		return this.$$.ctx[22];
    	}

    	set removeAllVertexes(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get generateVertexes() {
    		return this.$$.ctx[23];
    	}

    	set generateVertexes(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fillEdgesInAddingOrder() {
    		return this.$$.ctx[24];
    	}

    	set fillEdgesInAddingOrder(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Text.svelte generated by Svelte v3.44.0 */

    function create_fragment$7(ctx) {
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
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
    			id: create_fragment$7.name
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

    /* src\FPS.svelte generated by Svelte v3.44.0 */

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

    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FPS', slots, ['default']);
    	let { show = true } = $$props;
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

    		if (!show) {
    			$$invalidate(0, text = '');
    		}
    	});

    	const writable_props = ['show'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FPS> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('show' in $$props) $$invalidate(1, show = $$props.show);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Text,
    		width,
    		renderable,
    		show,
    		text,
    		frames,
    		prevTime
    	});

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(1, show = $$props.show);
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('frames' in $$props) frames = $$props.frames;
    		if ('prevTime' in $$props) prevTime = $$props.prevTime;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, show, $$scope, slots];
    }

    class FPS extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { show: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FPS",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get show() {
    		throw new Error("<FPS>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<FPS>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\InputRange.svelte generated by Svelte v3.44.0 */

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

    /* src\Checkbox.svelte generated by Svelte v3.44.0 */

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

    /* src\ColorSelector.svelte generated by Svelte v3.44.0 */

    const { Error: Error_1 } = globals;
    const file$3 = "src\\ColorSelector.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (33:2) {#each Array(...colors.entries()) as idAndColor}
    function create_each_block$1(ctx) {
    	let button;
    	let button_class_value;
    	let button_style_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*idAndColor*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");

    			attr_dev(button, "class", button_class_value = "" + ((/*selectedId*/ ctx[0] === /*idAndColor*/ ctx[4][0]
    			? 'selected'
    			: '') + " " + /*checkmarkColor*/ ctx[2] + " svelte-1hyvmj2"));

    			attr_dev(button, "name", "color");
    			attr_dev(button, "type", "radio");
    			attr_dev(button, "style", button_style_value = `background-color: ${/*idAndColor*/ ctx[4][1]};`);
    			add_location(button, file$3, 33, 4, 974);
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

    			if (dirty & /*selectedId, colors, checkmarkColor*/ 7 && button_class_value !== (button_class_value = "" + ((/*selectedId*/ ctx[0] === /*idAndColor*/ ctx[4][0]
    			? 'selected'
    			: '') + " " + /*checkmarkColor*/ ctx[2] + " svelte-1hyvmj2"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*colors*/ 2 && button_style_value !== (button_style_value = `background-color: ${/*idAndColor*/ ctx[4][1]};`)) {
    				attr_dev(button, "style", button_style_value);
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
    		source: "(33:2) {#each Array(...colors.entries()) as idAndColor}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_value = Array(.../*colors*/ ctx[1].entries());
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
    			add_location(div, file$3, 31, 0, 897);
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
    			if (dirty & /*selectedId, Array, colors, checkmarkColor, invertColor*/ 7) {
    				each_value = Array(.../*colors*/ ctx[1].entries());
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
    	let { colors = [] } = $$props;
    	let { selectedId = 0 } = $$props;
    	let checkmarkColor = 'white';

    	onMount(function () {
    		$$invalidate(2, checkmarkColor = invertColor(colors[selectedId]));
    	});

    	const writable_props = ['colors', 'selectedId'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ColorSelector> was created with unknown prop '${key}'`);
    	});

    	const click_handler = idAndColor => {
    		$$invalidate(0, selectedId = idAndColor[0]);
    		$$invalidate(2, checkmarkColor = invertColor(colors[selectedId]));
    	};

    	$$self.$$set = $$props => {
    		if ('colors' in $$props) $$invalidate(1, colors = $$props.colors);
    		if ('selectedId' in $$props) $$invalidate(0, selectedId = $$props.selectedId);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		colors,
    		selectedId,
    		checkmarkColor,
    		invertColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('colors' in $$props) $$invalidate(1, colors = $$props.colors);
    		if ('selectedId' in $$props) $$invalidate(0, selectedId = $$props.selectedId);
    		if ('checkmarkColor' in $$props) $$invalidate(2, checkmarkColor = $$props.checkmarkColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedId, colors, checkmarkColor, click_handler];
    }

    class ColorSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { colors: 1, selectedId: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorSelector",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get colors() {
    		throw new Error_1("<ColorSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error_1("<ColorSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedId() {
    		throw new Error_1("<ColorSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedId(value) {
    		throw new Error_1("<ColorSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Window.svelte generated by Svelte v3.44.0 */

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
        removeAllVertexes: {
            en: "Remove all vertexes",
            ru: "Удалить все вершины",
        },
        removeAllEdges: {
            en: "Remove all edges",
            ru: "Удалить все грани",
        },
        generateVertexes: {
            en: "Generate vertexes",
            ru: "Генерировать вершины",
        },
        vertexesGenerationCount: {
            en: "Vertexes generation count",
            ru: "Количество генерируемых вершин",
        },
        fillEdgesInAddingOrder: {
            en: "Fill edges in adding order",
            ru: "Заполнить грани по порядку",
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
        }
    };

    /* src\RadioButtons.svelte generated by Svelte v3.44.0 */

    const file$1 = "src\\RadioButtons.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i].option;
    	child_ctx[8] = list[i].label;
    	child_ctx[9] = list[i].id;
    	return child_ctx;
    }

    // (8:0) {#each options as { option, label, id }}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let t0;
    	let label;
    	let t1_value = /*getTranslation*/ ctx[4](/*lang*/ ctx[3], /*label*/ ctx[8]) + "";
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
    			attr_dev(input, "id", input_id_value = /*id*/ ctx[9]);
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "name", /*groupName*/ ctx[2]);
    			input.__value = input_value_value = /*option*/ ctx[7];
    			input.value = input.__value;
    			attr_dev(input, "class", "svelte-cdr04i");
    			/*$$binding_groups*/ ctx[6][0].push(input);
    			add_location(input, file$1, 10, 12, 305);
    			attr_dev(label, "for", label_for_value = /*id*/ ctx[9]);
    			attr_dev(label, "class", "svelte-cdr04i");
    			add_location(label, file$1, 11, 12, 400);
    			attr_dev(div0, "class", "option svelte-cdr04i");
    			add_location(div0, file$1, 9, 8, 271);
    			attr_dev(div1, "class", "input_row svelte-cdr04i");
    			add_location(div1, file$1, 8, 4, 238);
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
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 2 && input_id_value !== (input_id_value = /*id*/ ctx[9])) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*groupName*/ 4) {
    				attr_dev(input, "name", /*groupName*/ ctx[2]);
    			}

    			if (dirty & /*options*/ 2 && input_value_value !== (input_value_value = /*option*/ ctx[7])) {
    				prop_dev(input, "__value", input_value_value);
    				input.value = input.__value;
    			}

    			if (dirty & /*group*/ 1) {
    				input.checked = input.__value === /*group*/ ctx[0];
    			}

    			if (dirty & /*getTranslation, lang, options*/ 26 && t1_value !== (t1_value = /*getTranslation*/ ctx[4](/*lang*/ ctx[3], /*label*/ ctx[8]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*options*/ 2 && label_for_value !== (label_for_value = /*id*/ ctx[9])) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*$$binding_groups*/ ctx[6][0].splice(/*$$binding_groups*/ ctx[6][0].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(8:0) {#each options as { option, label, id }}",
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
    			if (dirty & /*options, getTranslation, lang, groupName, group*/ 31) {
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RadioButtons', slots, []);
    	let { options } = $$props;
    	let { group = null } = $$props;
    	let { groupName = "" } = $$props;
    	let { lang = 'en' } = $$props;

    	let { getTranslation = (lang, key) => {
    		return key;
    	} } = $$props;

    	const writable_props = ['options', 'group', 'groupName', 'lang', 'getTranslation'];

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
    		if ('lang' in $$props) $$invalidate(3, lang = $$props.lang);
    		if ('getTranslation' in $$props) $$invalidate(4, getTranslation = $$props.getTranslation);
    	};

    	$$self.$capture_state = () => ({
    		options,
    		group,
    		groupName,
    		lang,
    		getTranslation
    	});

    	$$self.$inject_state = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('group' in $$props) $$invalidate(0, group = $$props.group);
    		if ('groupName' in $$props) $$invalidate(2, groupName = $$props.groupName);
    		if ('lang' in $$props) $$invalidate(3, lang = $$props.lang);
    		if ('getTranslation' in $$props) $$invalidate(4, getTranslation = $$props.getTranslation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		group,
    		options,
    		groupName,
    		lang,
    		getTranslation,
    		input_change_handler,
    		$$binding_groups
    	];
    }

    class RadioButtons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			options: 1,
    			group: 0,
    			groupName: 2,
    			lang: 3,
    			getTranslation: 4
    		});

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

    	get lang() {
    		throw new Error("<RadioButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lang(value) {
    		throw new Error("<RadioButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getTranslation() {
    		throw new Error("<RadioButtons>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getTranslation(value) {
    		throw new Error("<RadioButtons>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (148:1) <Background color='hsl(0, 0%, 10%)'>
    function create_default_slot_6(ctx) {
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
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(148:1) <Background color='hsl(0, 0%, 10%)'>",
    		ctx
    	});

    	return block;
    }

    // (143:0) <Canvas   onClick={graphClickHandler}   onMouseDown={graphMouseDownHandler}   onTouchStart={graphTouchStartHandler} >
    function create_default_slot_5(ctx) {
    	let background;
    	let t0;
    	let graph;
    	let updating_totalDistance;
    	let updating_totalDistanceWithStart;
    	let t1;
    	let text_1;
    	let t2;
    	let fps;
    	let current;

    	background = new Background({
    			props: {
    				color: "hsl(0, 0%, 10%)",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function graph_totalDistance_binding(value) {
    		/*graph_totalDistance_binding*/ ctx[41](value);
    	}

    	function graph_totalDistanceWithStart_binding(value) {
    		/*graph_totalDistanceWithStart_binding*/ ctx[42](value);
    	}

    	let graph_props = {
    		vertexColor: /*COLORS*/ ctx[35][/*vertexColorId*/ ctx[8]],
    		edgeColor: /*COLORS*/ ctx[35][/*edgeColorId*/ ctx[9]],
    		vertexSize: /*vertexSize*/ ctx[10],
    		edgeSize: /*edgeSize*/ ctx[11],
    		showVertexLabel: /*showVertexLabel*/ ctx[4],
    		removeEdgesOnMoving: /*removeEdgesOnMoving*/ ctx[6],
    		vertexLabelSize: /*vertexLabelSize*/ ctx[13],
    		vertexLabelColor: /*COLORS*/ ctx[35][/*vertexLabelColorId*/ ctx[12]],
    		vertexesGenerationCount: /*vertexesGenerationCount*/ ctx[14],
    		showEdgeLabel: /*showEdgeLabel*/ ctx[5],
    		edgeLabelColor: /*COLORS*/ ctx[35][/*edgeLabelColorId*/ ctx[17]],
    		edgeLabelSize: /*edgeLabelSize*/ ctx[16],
    		edgeLabelDistance: /*edgeLabelDistance*/ ctx[15]
    	};

    	if (/*totalDistance*/ ctx[18] !== void 0) {
    		graph_props.totalDistance = /*totalDistance*/ ctx[18];
    	}

    	if (/*totalDistanceWithStart*/ ctx[19] !== void 0) {
    		graph_props.totalDistanceWithStart = /*totalDistanceWithStart*/ ctx[19];
    	}

    	graph = new Graph({ props: graph_props, $$inline: true });
    	/*graph_binding*/ ctx[40](graph);
    	binding_callbacks.push(() => bind(graph, 'totalDistance', graph_totalDistance_binding));
    	binding_callbacks.push(() => bind(graph, 'totalDistanceWithStart', graph_totalDistanceWithStart_binding));

    	text_1 = new Text({
    			props: {
    				show: /*showHint*/ ctx[3],
    				text: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'addHint'),
    				fontSize: 12,
    				align: "right",
    				baseline: "bottom",
    				x: /*$width*/ ctx[31] - 20,
    				y: /*$height*/ ctx[32] - 20
    			},
    			$$inline: true
    		});

    	fps = new FPS({
    			props: { show: /*showFPS*/ ctx[2] },
    			$$inline: true
    		});

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

    			if (dirty[2] & /*$$scope*/ 8192) {
    				background_changes.$$scope = { dirty, ctx };
    			}

    			background.$set(background_changes);
    			const graph_changes = {};
    			if (dirty[0] & /*vertexColorId*/ 256) graph_changes.vertexColor = /*COLORS*/ ctx[35][/*vertexColorId*/ ctx[8]];
    			if (dirty[0] & /*edgeColorId*/ 512) graph_changes.edgeColor = /*COLORS*/ ctx[35][/*edgeColorId*/ ctx[9]];
    			if (dirty[0] & /*vertexSize*/ 1024) graph_changes.vertexSize = /*vertexSize*/ ctx[10];
    			if (dirty[0] & /*edgeSize*/ 2048) graph_changes.edgeSize = /*edgeSize*/ ctx[11];
    			if (dirty[0] & /*showVertexLabel*/ 16) graph_changes.showVertexLabel = /*showVertexLabel*/ ctx[4];
    			if (dirty[0] & /*removeEdgesOnMoving*/ 64) graph_changes.removeEdgesOnMoving = /*removeEdgesOnMoving*/ ctx[6];
    			if (dirty[0] & /*vertexLabelSize*/ 8192) graph_changes.vertexLabelSize = /*vertexLabelSize*/ ctx[13];
    			if (dirty[0] & /*vertexLabelColorId*/ 4096) graph_changes.vertexLabelColor = /*COLORS*/ ctx[35][/*vertexLabelColorId*/ ctx[12]];
    			if (dirty[0] & /*vertexesGenerationCount*/ 16384) graph_changes.vertexesGenerationCount = /*vertexesGenerationCount*/ ctx[14];
    			if (dirty[0] & /*showEdgeLabel*/ 32) graph_changes.showEdgeLabel = /*showEdgeLabel*/ ctx[5];
    			if (dirty[0] & /*edgeLabelColorId*/ 131072) graph_changes.edgeLabelColor = /*COLORS*/ ctx[35][/*edgeLabelColorId*/ ctx[17]];
    			if (dirty[0] & /*edgeLabelSize*/ 65536) graph_changes.edgeLabelSize = /*edgeLabelSize*/ ctx[16];
    			if (dirty[0] & /*edgeLabelDistance*/ 32768) graph_changes.edgeLabelDistance = /*edgeLabelDistance*/ ctx[15];

    			if (!updating_totalDistance && dirty[0] & /*totalDistance*/ 262144) {
    				updating_totalDistance = true;
    				graph_changes.totalDistance = /*totalDistance*/ ctx[18];
    				add_flush_callback(() => updating_totalDistance = false);
    			}

    			if (!updating_totalDistanceWithStart && dirty[0] & /*totalDistanceWithStart*/ 524288) {
    				updating_totalDistanceWithStart = true;
    				graph_changes.totalDistanceWithStart = /*totalDistanceWithStart*/ ctx[19];
    				add_flush_callback(() => updating_totalDistanceWithStart = false);
    			}

    			graph.$set(graph_changes);
    			const text_1_changes = {};
    			if (dirty[0] & /*showHint*/ 8) text_1_changes.show = /*showHint*/ ctx[3];
    			if (dirty[0] & /*lang*/ 1) text_1_changes.text = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'addHint');
    			if (dirty[1] & /*$width*/ 1) text_1_changes.x = /*$width*/ ctx[31] - 20;
    			if (dirty[1] & /*$height*/ 2) text_1_changes.y = /*$height*/ ctx[32] - 20;
    			text_1.$set(text_1_changes);
    			const fps_changes = {};
    			if (dirty[0] & /*showFPS*/ 4) fps_changes.show = /*showFPS*/ ctx[2];
    			fps.$set(fps_changes);
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
    			/*graph_binding*/ ctx[40](null);
    			destroy_component(graph, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(text_1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(fps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(143:0) <Canvas   onClick={graphClickHandler}   onMouseDown={graphMouseDownHandler}   onTouchStart={graphTouchStartHandler} >",
    		ctx
    	});

    	return block;
    }

    // (248:1) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let t_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showMenu") + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-9ys6l6");
    			add_location(button, file, 248, 2, 7718);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_5*/ ctx[50], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*lang*/ 1 && t_value !== (t_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showMenu") + "")) set_data_dev(t, t_value);
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
    		source: "(248:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (181:1) {#if showMenu}
    function create_if_block_5(ctx) {
    	let div1;
    	let div0;
    	let button0;
    	let t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "about") + "";
    	let t0;
    	let t1;
    	let button1;
    	let t2_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "hideMenu") + "";
    	let t2;
    	let t3;
    	let div6;
    	let h20;
    	let t4_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "graphControls") + "";
    	let t4;
    	let t5;
    	let checkbox;
    	let updating_checked;
    	let t6;
    	let div2;
    	let button2;
    	let t7_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "removeAllVertexes") + "";
    	let t7;
    	let t8;
    	let div3;
    	let button3;
    	let t9_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "removeAllEdges") + "";
    	let t9;
    	let t10;
    	let div4;
    	let button4;
    	let t11_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "generateVertexes") + "";
    	let t11;
    	let t12;
    	let inputrange;
    	let updating_value;
    	let t13;
    	let div5;
    	let button5;
    	let t14_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "fillEdgesInAddingOrder") + "";
    	let t14;
    	let t15;
    	let div10;
    	let h21;
    	let t16_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "settings") + "";
    	let t16;
    	let t17;
    	let div7;
    	let button6;
    	let t18_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "openVertexSettings") + "";
    	let t18;
    	let t19;
    	let div8;
    	let button7;
    	let t20_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "openEdgeSettings") + "";
    	let t20;
    	let t21;
    	let div9;
    	let button8;
    	let t22_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "openOtherSettings") + "";
    	let t22;
    	let current;
    	let mounted;
    	let dispose;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[45](value);
    	}

    	let checkbox_props = {
    		title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "removeEdgesOnMoving")
    	};

    	if (/*removeEdgesOnMoving*/ ctx[6] !== void 0) {
    		checkbox_props.checked = /*removeEdgesOnMoving*/ ctx[6];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding));

    	function inputrange_value_binding(value) {
    		/*inputrange_value_binding*/ ctx[46](value);
    	}

    	let inputrange_props = {
    		name: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexesGenerationCount"),
    		min: 2,
    		max: 100,
    		step: 1
    	};

    	if (/*vertexesGenerationCount*/ ctx[14] !== void 0) {
    		inputrange_props.value = /*vertexesGenerationCount*/ ctx[14];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding));

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
    			div6 = element("div");
    			h20 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			create_component(checkbox.$$.fragment);
    			t6 = space();
    			div2 = element("div");
    			button2 = element("button");
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			button3 = element("button");
    			t9 = text(t9_value);
    			t10 = space();
    			div4 = element("div");
    			button4 = element("button");
    			t11 = text(t11_value);
    			t12 = space();
    			create_component(inputrange.$$.fragment);
    			t13 = space();
    			div5 = element("div");
    			button5 = element("button");
    			t14 = text(t14_value);
    			t15 = space();
    			div10 = element("div");
    			h21 = element("h2");
    			t16 = text(t16_value);
    			t17 = space();
    			div7 = element("div");
    			button6 = element("button");
    			t18 = text(t18_value);
    			t19 = space();
    			div8 = element("div");
    			button7 = element("button");
    			t20 = text(t20_value);
    			t21 = space();
    			div9 = element("div");
    			button8 = element("button");
    			t22 = text(t22_value);
    			attr_dev(button0, "class", "svelte-9ys6l6");
    			add_location(button0, file, 183, 4, 5768);
    			attr_dev(button1, "class", "svelte-9ys6l6");
    			add_location(button1, file, 186, 4, 5883);
    			attr_dev(div0, "class", "buttons-row svelte-9ys6l6");
    			add_location(div0, file, 182, 3, 5738);
    			attr_dev(div1, "class", "controls-block svelte-9ys6l6");
    			add_location(div1, file, 181, 2, 5706);
    			attr_dev(h20, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h20, file, 192, 3, 6035);
    			attr_dev(button2, "class", "svelte-9ys6l6");
    			add_location(button2, file, 200, 4, 6272);
    			attr_dev(div2, "class", "buttons-row svelte-9ys6l6");
    			add_location(div2, file, 199, 3, 6242);
    			attr_dev(button3, "class", "svelte-9ys6l6");
    			add_location(button3, file, 205, 4, 6425);
    			attr_dev(div3, "class", "buttons-row svelte-9ys6l6");
    			add_location(div3, file, 204, 3, 6395);
    			attr_dev(button4, "class", "svelte-9ys6l6");
    			add_location(button4, file, 210, 4, 6572);
    			attr_dev(div4, "class", "buttons-row svelte-9ys6l6");
    			add_location(div4, file, 209, 3, 6542);
    			attr_dev(button5, "class", "svelte-9ys6l6");
    			add_location(button5, file, 222, 4, 6891);
    			attr_dev(div5, "class", "buttons-row svelte-9ys6l6");
    			add_location(div5, file, 221, 3, 6861);
    			attr_dev(div6, "class", "controls-block svelte-9ys6l6");
    			add_location(div6, file, 191, 2, 6003);
    			attr_dev(h21, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h21, file, 228, 3, 7067);
    			attr_dev(button6, "class", "svelte-9ys6l6");
    			add_location(button6, file, 232, 4, 7183);
    			attr_dev(div7, "class", "buttons-row svelte-9ys6l6");
    			add_location(div7, file, 231, 3, 7153);
    			attr_dev(button7, "class", "svelte-9ys6l6");
    			add_location(button7, file, 237, 4, 7359);
    			attr_dev(div8, "class", "buttons-row svelte-9ys6l6");
    			add_location(div8, file, 236, 3, 7329);
    			attr_dev(button8, "class", "svelte-9ys6l6");
    			add_location(button8, file, 242, 4, 7557);
    			attr_dev(div9, "class", "buttons-row svelte-9ys6l6");
    			set_style(div9, "margin-bottom", "0");
    			add_location(div9, file, 241, 3, 7501);
    			attr_dev(div10, "class", "controls-block svelte-9ys6l6");
    			add_location(div10, file, 227, 2, 7035);
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
    			insert_dev(target, div6, anchor);
    			append_dev(div6, h20);
    			append_dev(h20, t4);
    			append_dev(div6, t5);
    			mount_component(checkbox, div6, null);
    			append_dev(div6, t6);
    			append_dev(div6, div2);
    			append_dev(div2, button2);
    			append_dev(button2, t7);
    			append_dev(div6, t8);
    			append_dev(div6, div3);
    			append_dev(div3, button3);
    			append_dev(button3, t9);
    			append_dev(div6, t10);
    			append_dev(div6, div4);
    			append_dev(div4, button4);
    			append_dev(button4, t11);
    			append_dev(div6, t12);
    			mount_component(inputrange, div6, null);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, button5);
    			append_dev(button5, t14);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, h21);
    			append_dev(h21, t16);
    			append_dev(div10, t17);
    			append_dev(div10, div7);
    			append_dev(div7, button6);
    			append_dev(button6, t18);
    			append_dev(div10, t19);
    			append_dev(div10, div8);
    			append_dev(div8, button7);
    			append_dev(button7, t20);
    			append_dev(div10, t21);
    			append_dev(div10, div9);
    			append_dev(div9, button8);
    			append_dev(button8, t22);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[43], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[44], false, false, false),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function(/*graphRemoveVertexesHandler*/ ctx[24])) /*graphRemoveVertexesHandler*/ ctx[24].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button3,
    						"click",
    						function () {
    							if (is_function(/*graphRemoveEdgesHandler*/ ctx[25])) /*graphRemoveEdgesHandler*/ ctx[25].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button4,
    						"click",
    						function () {
    							if (is_function(/*graphGenerateVertexesHandler*/ ctx[26])) /*graphGenerateVertexesHandler*/ ctx[26].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button5,
    						"click",
    						function () {
    							if (is_function(/*graphFillEdgesInAddingOrderHandler*/ ctx[27])) /*graphFillEdgesInAddingOrderHandler*/ ctx[27].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button6, "click", /*click_handler_2*/ ctx[47], false, false, false),
    					listen_dev(button7, "click", /*click_handler_3*/ ctx[48], false, false, false),
    					listen_dev(button8, "click", /*click_handler_4*/ ctx[49], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*lang*/ 1) && t0_value !== (t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "about") + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t2_value !== (t2_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "hideMenu") + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t4_value !== (t4_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "graphControls") + "")) set_data_dev(t4, t4_value);
    			const checkbox_changes = {};
    			if (dirty[0] & /*lang*/ 1) checkbox_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "removeEdgesOnMoving");

    			if (!updating_checked && dirty[0] & /*removeEdgesOnMoving*/ 64) {
    				updating_checked = true;
    				checkbox_changes.checked = /*removeEdgesOnMoving*/ ctx[6];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			if ((!current || dirty[0] & /*lang*/ 1) && t7_value !== (t7_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "removeAllVertexes") + "")) set_data_dev(t7, t7_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t9_value !== (t9_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "removeAllEdges") + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t11_value !== (t11_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "generateVertexes") + "")) set_data_dev(t11, t11_value);
    			const inputrange_changes = {};
    			if (dirty[0] & /*lang*/ 1) inputrange_changes.name = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexesGenerationCount");

    			if (!updating_value && dirty[0] & /*vertexesGenerationCount*/ 16384) {
    				updating_value = true;
    				inputrange_changes.value = /*vertexesGenerationCount*/ ctx[14];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);
    			if ((!current || dirty[0] & /*lang*/ 1) && t14_value !== (t14_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "fillEdgesInAddingOrder") + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t16_value !== (t16_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "settings") + "")) set_data_dev(t16, t16_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t18_value !== (t18_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "openVertexSettings") + "")) set_data_dev(t18, t18_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t20_value !== (t20_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "openEdgeSettings") + "")) set_data_dev(t20, t20_value);
    			if ((!current || dirty[0] & /*lang*/ 1) && t22_value !== (t22_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "openOtherSettings") + "")) set_data_dev(t22, t22_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(inputrange.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(inputrange.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div6);
    			destroy_component(checkbox);
    			destroy_component(inputrange);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div10);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(181:1) {#if showMenu}",
    		ctx
    	});

    	return block;
    }

    // (272:1) {#if showVertexLabel}
    function create_if_block_4(ctx) {
    	let inputrange;
    	let updating_value;
    	let current;

    	function inputrange_value_binding_2(value) {
    		/*inputrange_value_binding_2*/ ctx[53](value);
    	}

    	let inputrange_props = {
    		name: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexLabelSize"),
    		min: 8,
    		max: 16,
    		step: 1
    	};

    	if (/*vertexLabelSize*/ ctx[13] !== void 0) {
    		inputrange_props.value = /*vertexLabelSize*/ ctx[13];
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
    			if (dirty[0] & /*lang*/ 1) inputrange_changes.name = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexLabelSize");

    			if (!updating_value && dirty[0] & /*vertexLabelSize*/ 8192) {
    				updating_value = true;
    				inputrange_changes.value = /*vertexLabelSize*/ ctx[13];
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(272:1) {#if showVertexLabel}",
    		ctx
    	});

    	return block;
    }

    // (290:1) {#if showVertexLabel}
    function create_if_block_3(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexLabelColor") + "";
    	let t0;
    	let t1;
    	let colorselector;
    	let updating_selectedId;
    	let current;

    	function colorselector_selectedId_binding_1(value) {
    		/*colorselector_selectedId_binding_1*/ ctx[55](value);
    	}

    	let colorselector_props = { colors: /*COLORS*/ ctx[35] };

    	if (/*vertexLabelColorId*/ ctx[12] !== void 0) {
    		colorselector_props.selectedId = /*vertexLabelColorId*/ ctx[12];
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
    			add_location(h2, file, 291, 3, 8784);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 290, 2, 8752);
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
    			if ((!current || dirty[0] & /*lang*/ 1) && t0_value !== (t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexLabelColor") + "")) set_data_dev(t0, t0_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*vertexLabelColorId*/ 4096) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*vertexLabelColorId*/ ctx[12];
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(290:1) {#if showVertexLabel}",
    		ctx
    	});

    	return block;
    }

    // (254:0) <Window   title="{getTranslation(lang, 'vertexSettings')}"   isOpened={windowsStatus[Windows.VertexSettings]}   zIndex={windowsOrder[Windows.VertexSettings]}   onClickHandler={() => { makeWindowActive(Windows.VertexSettings) }}   onCloseHandler={() => { makeWindowInactive(Windows.VertexSettings) }} >
    function create_default_slot_4(ctx) {
    	let checkbox;
    	let updating_checked;
    	let t0;
    	let inputrange;
    	let updating_value;
    	let t1;
    	let t2;
    	let div;
    	let h2;
    	let t3_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexColor") + "";
    	let t3;
    	let t4;
    	let colorselector;
    	let updating_selectedId;
    	let t5;
    	let if_block1_anchor;
    	let current;

    	function checkbox_checked_binding_1(value) {
    		/*checkbox_checked_binding_1*/ ctx[51](value);
    	}

    	let checkbox_props = {
    		title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showVertexLabel")
    	};

    	if (/*showVertexLabel*/ ctx[4] !== void 0) {
    		checkbox_props.checked = /*showVertexLabel*/ ctx[4];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding_1));

    	function inputrange_value_binding_1(value) {
    		/*inputrange_value_binding_1*/ ctx[52](value);
    	}

    	let inputrange_props = {
    		name: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexSize"),
    		min: 5,
    		max: 20,
    		step: 0.3
    	};

    	if (/*vertexSize*/ ctx[10] !== void 0) {
    		inputrange_props.value = /*vertexSize*/ ctx[10];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding_1));
    	let if_block0 = /*showVertexLabel*/ ctx[4] && create_if_block_4(ctx);

    	function colorselector_selectedId_binding(value) {
    		/*colorselector_selectedId_binding*/ ctx[54](value);
    	}

    	let colorselector_props = { colors: /*COLORS*/ ctx[35] };

    	if (/*vertexColorId*/ ctx[8] !== void 0) {
    		colorselector_props.selectedId = /*vertexColorId*/ ctx[8];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding));
    	let if_block1 = /*showVertexLabel*/ ctx[4] && create_if_block_3(ctx);

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
    			add_location(h2, file, 281, 2, 8557);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 280, 1, 8526);
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
    			if (dirty[0] & /*lang*/ 1) checkbox_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showVertexLabel");

    			if (!updating_checked && dirty[0] & /*showVertexLabel*/ 16) {
    				updating_checked = true;
    				checkbox_changes.checked = /*showVertexLabel*/ ctx[4];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const inputrange_changes = {};
    			if (dirty[0] & /*lang*/ 1) inputrange_changes.name = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexSize");

    			if (!updating_value && dirty[0] & /*vertexSize*/ 1024) {
    				updating_value = true;
    				inputrange_changes.value = /*vertexSize*/ ctx[10];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);

    			if (/*showVertexLabel*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*showVertexLabel*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
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

    			if ((!current || dirty[0] & /*lang*/ 1) && t3_value !== (t3_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "vertexColor") + "")) set_data_dev(t3, t3_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*vertexColorId*/ 256) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*vertexColorId*/ ctx[8];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);

    			if (/*showVertexLabel*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*showVertexLabel*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3(ctx);
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(254:0) <Window   title=\\\"{getTranslation(lang, 'vertexSettings')}\\\"   isOpened={windowsStatus[Windows.VertexSettings]}   zIndex={windowsOrder[Windows.VertexSettings]}   onClickHandler={() => { makeWindowActive(Windows.VertexSettings) }}   onCloseHandler={() => { makeWindowInactive(Windows.VertexSettings) }} >",
    		ctx
    	});

    	return block;
    }

    // (320:1) {#if showEdgeLabel}
    function create_if_block_2(ctx) {
    	let inputrange0;
    	let updating_value;
    	let t;
    	let inputrange1;
    	let updating_value_1;
    	let current;

    	function inputrange0_value_binding(value) {
    		/*inputrange0_value_binding*/ ctx[60](value);
    	}

    	let inputrange0_props = {
    		name: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeLabelSize"),
    		min: 8,
    		max: 16,
    		step: 1
    	};

    	if (/*edgeLabelSize*/ ctx[16] !== void 0) {
    		inputrange0_props.value = /*edgeLabelSize*/ ctx[16];
    	}

    	inputrange0 = new InputRange({ props: inputrange0_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange0, 'value', inputrange0_value_binding));

    	function inputrange1_value_binding(value) {
    		/*inputrange1_value_binding*/ ctx[61](value);
    	}

    	let inputrange1_props = {
    		name: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeLabelDistance"),
    		min: 0,
    		max: 40,
    		step: 0.3
    	};

    	if (/*edgeLabelDistance*/ ctx[15] !== void 0) {
    		inputrange1_props.value = /*edgeLabelDistance*/ ctx[15];
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
    			if (dirty[0] & /*lang*/ 1) inputrange0_changes.name = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeLabelSize");

    			if (!updating_value && dirty[0] & /*edgeLabelSize*/ 65536) {
    				updating_value = true;
    				inputrange0_changes.value = /*edgeLabelSize*/ ctx[16];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange0.$set(inputrange0_changes);
    			const inputrange1_changes = {};
    			if (dirty[0] & /*lang*/ 1) inputrange1_changes.name = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeLabelDistance");

    			if (!updating_value_1 && dirty[0] & /*edgeLabelDistance*/ 32768) {
    				updating_value_1 = true;
    				inputrange1_changes.value = /*edgeLabelDistance*/ ctx[15];
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(320:1) {#if showEdgeLabel}",
    		ctx
    	});

    	return block;
    }

    // (345:1) {#if showEdgeLabel}
    function create_if_block_1(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeLabelColor") + "";
    	let t0;
    	let t1;
    	let colorselector;
    	let updating_selectedId;
    	let current;

    	function colorselector_selectedId_binding_3(value) {
    		/*colorselector_selectedId_binding_3*/ ctx[63](value);
    	}

    	let colorselector_props = { colors: /*COLORS*/ ctx[35] };

    	if (/*edgeLabelColorId*/ ctx[17] !== void 0) {
    		colorselector_props.selectedId = /*edgeLabelColorId*/ ctx[17];
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
    			add_location(h2, file, 346, 3, 10063);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 345, 2, 10031);
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
    			if ((!current || dirty[0] & /*lang*/ 1) && t0_value !== (t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeLabelColor") + "")) set_data_dev(t0, t0_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*edgeLabelColorId*/ 131072) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*edgeLabelColorId*/ ctx[17];
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
    		source: "(345:1) {#if showEdgeLabel}",
    		ctx
    	});

    	return block;
    }

    // (302:0) <Window   title="{getTranslation(lang, 'edgeSettings')}"   isOpened={windowsStatus[Windows.EdgeSettings]}   zIndex={windowsOrder[Windows.EdgeSettings]}   onClickHandler={() => { makeWindowActive(Windows.EdgeSettings) }}   onCloseHandler={() => { makeWindowInactive(Windows.EdgeSettings) }} >
    function create_default_slot_3(ctx) {
    	let checkbox;
    	let updating_checked;
    	let t0;
    	let inputrange;
    	let updating_value;
    	let t1;
    	let t2;
    	let div;
    	let h2;
    	let t3_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeColor") + "";
    	let t3;
    	let t4;
    	let colorselector;
    	let updating_selectedId;
    	let t5;
    	let if_block1_anchor;
    	let current;

    	function checkbox_checked_binding_2(value) {
    		/*checkbox_checked_binding_2*/ ctx[58](value);
    	}

    	let checkbox_props = {
    		title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showEdgeLabel")
    	};

    	if (/*showEdgeLabel*/ ctx[5] !== void 0) {
    		checkbox_props.checked = /*showEdgeLabel*/ ctx[5];
    	}

    	checkbox = new Checkbox({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, 'checked', checkbox_checked_binding_2));

    	function inputrange_value_binding_3(value) {
    		/*inputrange_value_binding_3*/ ctx[59](value);
    	}

    	let inputrange_props = {
    		name: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeSize"),
    		min: 1,
    		max: 10,
    		step: 0.3
    	};

    	if (/*edgeSize*/ ctx[11] !== void 0) {
    		inputrange_props.value = /*edgeSize*/ ctx[11];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding_3));
    	let if_block0 = /*showEdgeLabel*/ ctx[5] && create_if_block_2(ctx);

    	function colorselector_selectedId_binding_2(value) {
    		/*colorselector_selectedId_binding_2*/ ctx[62](value);
    	}

    	let colorselector_props = { colors: /*COLORS*/ ctx[35] };

    	if (/*edgeColorId*/ ctx[9] !== void 0) {
    		colorselector_props.selectedId = /*edgeColorId*/ ctx[9];
    	}

    	colorselector = new ColorSelector({
    			props: colorselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorselector, 'selectedId', colorselector_selectedId_binding_2));
    	let if_block1 = /*showEdgeLabel*/ ctx[5] && create_if_block_1(ctx);

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
    			add_location(h2, file, 336, 2, 9842);
    			attr_dev(div, "class", "controls-block svelte-9ys6l6");
    			add_location(div, file, 335, 1, 9811);
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
    			if (dirty[0] & /*lang*/ 1) checkbox_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showEdgeLabel");

    			if (!updating_checked && dirty[0] & /*showEdgeLabel*/ 32) {
    				updating_checked = true;
    				checkbox_changes.checked = /*showEdgeLabel*/ ctx[5];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    			const inputrange_changes = {};
    			if (dirty[0] & /*lang*/ 1) inputrange_changes.name = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeSize");

    			if (!updating_value && dirty[0] & /*edgeSize*/ 2048) {
    				updating_value = true;
    				inputrange_changes.value = /*edgeSize*/ ctx[11];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange.$set(inputrange_changes);

    			if (/*showEdgeLabel*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*showEdgeLabel*/ 32) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
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

    			if ((!current || dirty[0] & /*lang*/ 1) && t3_value !== (t3_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "edgeColor") + "")) set_data_dev(t3, t3_value);
    			const colorselector_changes = {};

    			if (!updating_selectedId && dirty[0] & /*edgeColorId*/ 512) {
    				updating_selectedId = true;
    				colorselector_changes.selectedId = /*edgeColorId*/ ctx[9];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			colorselector.$set(colorselector_changes);

    			if (/*showEdgeLabel*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*showEdgeLabel*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
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
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(302:0) <Window   title=\\\"{getTranslation(lang, 'edgeSettings')}\\\"   isOpened={windowsStatus[Windows.EdgeSettings]}   zIndex={windowsOrder[Windows.EdgeSettings]}   onClickHandler={() => { makeWindowActive(Windows.EdgeSettings) }}   onCloseHandler={() => { makeWindowInactive(Windows.EdgeSettings) }} >",
    		ctx
    	});

    	return block;
    }

    // (391:4) {:else}
    function create_else_block(ctx) {
    	let t_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'enterFullsceen') + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*lang*/ 1 && t_value !== (t_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'enterFullsceen') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(391:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (389:4) {#if isFullscreen}
    function create_if_block(ctx) {
    	let t_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'exitFullsceen') + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*lang*/ 1 && t_value !== (t_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'exitFullsceen') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(389:4) {#if isFullscreen}",
    		ctx
    	});

    	return block;
    }

    // (357:0) <Window   title="{getTranslation(lang, 'otherSettings')}"   isOpened={windowsStatus[Windows.OtherSettings]}   zIndex={windowsOrder[Windows.OtherSettings]}   onClickHandler={() => { makeWindowActive(Windows.OtherSettings) }}   onCloseHandler={() => { makeWindowInactive(Windows.OtherSettings) }} >
    function create_default_slot_2(ctx) {
    	let div0;
    	let checkbox0;
    	let updating_checked;
    	let t0;
    	let checkbox1;
    	let updating_checked_1;
    	let t1;
    	let div1;
    	let h2;
    	let t2_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'language') + "";
    	let t2;
    	let t3;
    	let radiobuttons;
    	let updating_group;
    	let t4;
    	let div3;
    	let div2;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[66](value);
    	}

    	let checkbox0_props = {
    		title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showFPS")
    	};

    	if (/*showFPS*/ ctx[2] !== void 0) {
    		checkbox0_props.checked = /*showFPS*/ ctx[2];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox0, 'checked', checkbox0_checked_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[67](value);
    	}

    	let checkbox1_props = {
    		title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showHint")
    	};

    	if (/*showHint*/ ctx[3] !== void 0) {
    		checkbox1_props.checked = /*showHint*/ ctx[3];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox1, 'checked', checkbox1_checked_binding));

    	function radiobuttons_group_binding(value) {
    		/*radiobuttons_group_binding*/ ctx[68](value);
    	}

    	let radiobuttons_props = {
    		options: /*languages*/ ctx[34],
    		groupName: "lang",
    		getTranslation: /*getTranslation*/ ctx[33],
    		lang: /*lang*/ ctx[0]
    	};

    	if (/*lang*/ ctx[0] !== void 0) {
    		radiobuttons_props.group = /*lang*/ ctx[0];
    	}

    	radiobuttons = new RadioButtons({
    			props: radiobuttons_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(radiobuttons, 'group', radiobuttons_group_binding));

    	function select_block_type_1(ctx, dirty) {
    		if (/*isFullscreen*/ ctx[7]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(checkbox0.$$.fragment);
    			t0 = space();
    			create_component(checkbox1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t2 = text(t2_value);
    			t3 = space();
    			create_component(radiobuttons.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button = element("button");
    			if_block.c();
    			attr_dev(div0, "class", "controls-block svelte-9ys6l6");
    			add_location(div0, file, 363, 1, 10561);
    			attr_dev(h2, "class", "controls-block__title svelte-9ys6l6");
    			add_location(h2, file, 374, 2, 10808);
    			attr_dev(div1, "class", "controls-block svelte-9ys6l6");
    			add_location(div1, file, 373, 1, 10777);
    			attr_dev(button, "class", "svelte-9ys6l6");
    			add_location(button, file, 387, 3, 11124);
    			attr_dev(div2, "class", "buttons-row svelte-9ys6l6");
    			set_style(div2, "margin-bottom", "0");
    			add_location(div2, file, 386, 2, 11069);
    			attr_dev(div3, "class", "controls-block svelte-9ys6l6");
    			add_location(div3, file, 385, 1, 11038);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(checkbox0, div0, null);
    			append_dev(div0, t0);
    			mount_component(checkbox1, div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, t2);
    			append_dev(div1, t3);
    			mount_component(radiobuttons, div1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			if_block.m(button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*switchFullscreen*/ ctx[38], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const checkbox0_changes = {};
    			if (dirty[0] & /*lang*/ 1) checkbox0_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showFPS");

    			if (!updating_checked && dirty[0] & /*showFPS*/ 4) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showFPS*/ ctx[2];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};
    			if (dirty[0] & /*lang*/ 1) checkbox1_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], "showHint");

    			if (!updating_checked_1 && dirty[0] & /*showHint*/ 8) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*showHint*/ ctx[3];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);
    			if ((!current || dirty[0] & /*lang*/ 1) && t2_value !== (t2_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'language') + "")) set_data_dev(t2, t2_value);
    			const radiobuttons_changes = {};
    			if (dirty[0] & /*lang*/ 1) radiobuttons_changes.lang = /*lang*/ ctx[0];

    			if (!updating_group && dirty[0] & /*lang*/ 1) {
    				updating_group = true;
    				radiobuttons_changes.group = /*lang*/ ctx[0];
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(radiobuttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(radiobuttons.$$.fragment, local);
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
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(357:0) <Window   title=\\\"{getTranslation(lang, 'otherSettings')}\\\"   isOpened={windowsStatus[Windows.OtherSettings]}   zIndex={windowsOrder[Windows.OtherSettings]}   onClickHandler={() => { makeWindowActive(Windows.OtherSettings) }}   onCloseHandler={() => { makeWindowInactive(Windows.OtherSettings) }} >",
    		ctx
    	});

    	return block;
    }

    // (398:0) <Window   title="{getTranslation(lang, 'about')}"   isOpened={windowsStatus[Windows.About]}   zIndex={windowsOrder[Windows.About]}   onClickHandler={() => { makeWindowActive(Windows.About) }}   onCloseHandler={() => { makeWindowInactive(Windows.About) }} >
    function create_default_slot_1(ctx) {
    	let p0;
    	let t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'pcbDrillingOptimazer') + "";
    	let t0;
    	let br;
    	let t1;
    	let a;
    	let t2_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'githubPage') + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'developedUsingSvelte') + "";
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
    			add_location(br, file, 405, 48, 11674);
    			attr_dev(a, "href", "https://github.com/ITsJust4Fun/DrillingOptimizer");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 406, 2, 11681);
    			set_style(p0, "text-align", "center");
    			add_location(p0, file, 404, 1, 11595);
    			set_style(p1, "text-align", "center");
    			add_location(p1, file, 413, 1, 11822);
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
    			if (dirty[0] & /*lang*/ 1 && t0_value !== (t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'pcbDrillingOptimazer') + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*lang*/ 1 && t2_value !== (t2_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'githubPage') + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*lang*/ 1 && t4_value !== (t4_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'developedUsingSvelte') + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(398:0) <Window   title=\\\"{getTranslation(lang, 'about')}\\\"   isOpened={windowsStatus[Windows.About]}   zIndex={windowsOrder[Windows.About]}   onClickHandler={() => { makeWindowActive(Windows.About) }}   onCloseHandler={() => { makeWindowInactive(Windows.About) }} >",
    		ctx
    	});

    	return block;
    }

    // (416:0) <Window   title="{getTranslation(lang, 'distance')}"   isOpened={windowsStatus[Windows.TotalDistance]}   zIndex={windowsOrder[Windows.TotalDistance]}   onClickHandler={() => { makeWindowActive(Windows.TotalDistance) }}   onCloseHandler={() => { makeWindowInactive(Windows.TotalDistance) }} >
    function create_default_slot(ctx) {
    	let div0;
    	let t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'totalDistance') + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;
    	let t4_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'totalDistanceWithStart') + "";
    	let t4;
    	let t5;
    	let t6;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(/*totalDistance*/ ctx[18]);
    			t3 = space();
    			div1 = element("div");
    			t4 = text(t4_value);
    			t5 = text(": ");
    			t6 = text(/*totalDistanceWithStart*/ ctx[19]);
    			add_location(div0, file, 422, 1, 12206);
    			add_location(div1, file, 425, 1, 12280);
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
    			if (dirty[0] & /*lang*/ 1 && t0_value !== (t0_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'totalDistance') + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*totalDistance*/ 262144) set_data_dev(t2, /*totalDistance*/ ctx[18]);
    			if (dirty[0] & /*lang*/ 1 && t4_value !== (t4_value = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'totalDistanceWithStart') + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*totalDistanceWithStart*/ 524288) set_data_dev(t6, /*totalDistanceWithStart*/ ctx[19]);
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
    		source: "(416:0) <Window   title=\\\"{getTranslation(lang, 'distance')}\\\"   isOpened={windowsStatus[Windows.TotalDistance]}   zIndex={windowsOrder[Windows.TotalDistance]}   onClickHandler={() => { makeWindowActive(Windows.TotalDistance) }}   onCloseHandler={() => { makeWindowInactive(Windows.TotalDistance) }} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let canvas;
    	let t0;
    	let div;
    	let current_block_type_index;
    	let if_block;
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
    	let current;
    	let mounted;
    	let dispose;

    	canvas = new Canvas({
    			props: {
    				onClick: /*graphClickHandler*/ ctx[21],
    				onMouseDown: /*graphMouseDownHandler*/ ctx[22],
    				onTouchStart: /*graphTouchStartHandler*/ ctx[23],
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_5, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*showMenu*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	window0 = new Window({
    			props: {
    				title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'vertexSettings'),
    				isOpened: /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].VertexSettings],
    				zIndex: /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].VertexSettings],
    				onClickHandler: /*func*/ ctx[56],
    				onCloseHandler: /*func_1*/ ctx[57],
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window1 = new Window({
    			props: {
    				title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'edgeSettings'),
    				isOpened: /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].EdgeSettings],
    				zIndex: /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].EdgeSettings],
    				onClickHandler: /*func_2*/ ctx[64],
    				onCloseHandler: /*func_3*/ ctx[65],
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window2 = new Window({
    			props: {
    				title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'otherSettings'),
    				isOpened: /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].OtherSettings],
    				zIndex: /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].OtherSettings],
    				onClickHandler: /*func_4*/ ctx[69],
    				onCloseHandler: /*func_5*/ ctx[70],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window3 = new Window({
    			props: {
    				title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'about'),
    				isOpened: /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].About],
    				zIndex: /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].About],
    				onClickHandler: /*func_6*/ ctx[71],
    				onCloseHandler: /*func_7*/ ctx[72],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window4 = new Window({
    			props: {
    				title: /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'distance'),
    				isOpened: /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].TotalDistance],
    				zIndex: /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].TotalDistance],
    				onClickHandler: /*func_8*/ ctx[73],
    				onCloseHandler: /*func_9*/ ctx[74],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(canvas.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if_block.c();
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
    			attr_dev(div, "class", "controls svelte-9ys6l6");
    			toggle_class(div, "controls_opened", /*showMenu*/ ctx[1]);
    			add_location(div, file, 179, 0, 5632);
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
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "fullscreenchange", /*fullscreenchange_handler*/ ctx[39], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const canvas_changes = {};
    			if (dirty[0] & /*graphClickHandler*/ 2097152) canvas_changes.onClick = /*graphClickHandler*/ ctx[21];
    			if (dirty[0] & /*graphMouseDownHandler*/ 4194304) canvas_changes.onMouseDown = /*graphMouseDownHandler*/ ctx[22];
    			if (dirty[0] & /*graphTouchStartHandler*/ 8388608) canvas_changes.onTouchStart = /*graphTouchStartHandler*/ ctx[23];

    			if (dirty[0] & /*showFPS, showHint, lang, vertexColorId, edgeColorId, vertexSize, edgeSize, showVertexLabel, removeEdgesOnMoving, vertexLabelSize, vertexLabelColorId, vertexesGenerationCount, showEdgeLabel, edgeLabelColorId, edgeLabelSize, edgeLabelDistance, graphComponent, totalDistance, totalDistanceWithStart*/ 2097021 | dirty[1] & /*$width, $height*/ 3 | dirty[2] & /*$$scope*/ 8192) {
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
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (dirty[0] & /*showMenu*/ 2) {
    				toggle_class(div, "controls_opened", /*showMenu*/ ctx[1]);
    			}

    			const window0_changes = {};
    			if (dirty[0] & /*lang*/ 1) window0_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'vertexSettings');
    			if (dirty[0] & /*windowsStatus, Windows*/ 1342177280) window0_changes.isOpened = /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].VertexSettings];
    			if (dirty[0] & /*windowsOrder, Windows*/ 805306368) window0_changes.zIndex = /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].VertexSettings];
    			if (dirty[0] & /*Windows*/ 268435456) window0_changes.onClickHandler = /*func*/ ctx[56];
    			if (dirty[0] & /*Windows*/ 268435456) window0_changes.onCloseHandler = /*func_1*/ ctx[57];

    			if (dirty[0] & /*vertexLabelColorId, lang, showVertexLabel, vertexColorId, vertexLabelSize, vertexSize*/ 13585 | dirty[2] & /*$$scope*/ 8192) {
    				window0_changes.$$scope = { dirty, ctx };
    			}

    			window0.$set(window0_changes);
    			const window1_changes = {};
    			if (dirty[0] & /*lang*/ 1) window1_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'edgeSettings');
    			if (dirty[0] & /*windowsStatus, Windows*/ 1342177280) window1_changes.isOpened = /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].EdgeSettings];
    			if (dirty[0] & /*windowsOrder, Windows*/ 805306368) window1_changes.zIndex = /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].EdgeSettings];
    			if (dirty[0] & /*Windows*/ 268435456) window1_changes.onClickHandler = /*func_2*/ ctx[64];
    			if (dirty[0] & /*Windows*/ 268435456) window1_changes.onCloseHandler = /*func_3*/ ctx[65];

    			if (dirty[0] & /*edgeLabelColorId, lang, showEdgeLabel, edgeColorId, edgeLabelDistance, edgeLabelSize, edgeSize*/ 231969 | dirty[2] & /*$$scope*/ 8192) {
    				window1_changes.$$scope = { dirty, ctx };
    			}

    			window1.$set(window1_changes);
    			const window2_changes = {};
    			if (dirty[0] & /*lang*/ 1) window2_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'otherSettings');
    			if (dirty[0] & /*windowsStatus, Windows*/ 1342177280) window2_changes.isOpened = /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].OtherSettings];
    			if (dirty[0] & /*windowsOrder, Windows*/ 805306368) window2_changes.zIndex = /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].OtherSettings];
    			if (dirty[0] & /*Windows*/ 268435456) window2_changes.onClickHandler = /*func_4*/ ctx[69];
    			if (dirty[0] & /*Windows*/ 268435456) window2_changes.onCloseHandler = /*func_5*/ ctx[70];

    			if (dirty[0] & /*lang, isFullscreen, showHint, showFPS*/ 141 | dirty[2] & /*$$scope*/ 8192) {
    				window2_changes.$$scope = { dirty, ctx };
    			}

    			window2.$set(window2_changes);
    			const window3_changes = {};
    			if (dirty[0] & /*lang*/ 1) window3_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'about');
    			if (dirty[0] & /*windowsStatus, Windows*/ 1342177280) window3_changes.isOpened = /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].About];
    			if (dirty[0] & /*windowsOrder, Windows*/ 805306368) window3_changes.zIndex = /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].About];
    			if (dirty[0] & /*Windows*/ 268435456) window3_changes.onClickHandler = /*func_6*/ ctx[71];
    			if (dirty[0] & /*Windows*/ 268435456) window3_changes.onCloseHandler = /*func_7*/ ctx[72];

    			if (dirty[0] & /*lang*/ 1 | dirty[2] & /*$$scope*/ 8192) {
    				window3_changes.$$scope = { dirty, ctx };
    			}

    			window3.$set(window3_changes);
    			const window4_changes = {};
    			if (dirty[0] & /*lang*/ 1) window4_changes.title = /*getTranslation*/ ctx[33](/*lang*/ ctx[0], 'distance');
    			if (dirty[0] & /*windowsStatus, Windows*/ 1342177280) window4_changes.isOpened = /*windowsStatus*/ ctx[30][/*Windows*/ ctx[28].TotalDistance];
    			if (dirty[0] & /*windowsOrder, Windows*/ 805306368) window4_changes.zIndex = /*windowsOrder*/ ctx[29][/*Windows*/ ctx[28].TotalDistance];
    			if (dirty[0] & /*Windows*/ 268435456) window4_changes.onClickHandler = /*func_8*/ ctx[73];
    			if (dirty[0] & /*Windows*/ 268435456) window4_changes.onCloseHandler = /*func_9*/ ctx[74];

    			if (dirty[0] & /*totalDistanceWithStart, lang, totalDistance*/ 786433 | dirty[2] & /*$$scope*/ 8192) {
    				window4_changes.$$scope = { dirty, ctx };
    			}

    			window4.$set(window4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(window0.$$.fragment, local);
    			transition_in(window1.$$.fragment, local);
    			transition_in(window2.$$.fragment, local);
    			transition_in(window3.$$.fragment, local);
    			transition_in(window4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(window0.$$.fragment, local);
    			transition_out(window1.$$.fragment, local);
    			transition_out(window2.$$.fragment, local);
    			transition_out(window3.$$.fragment, local);
    			transition_out(window4.$$.fragment, local);
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
    	let $width;
    	let $height;
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(31, $width = $$value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(32, $height = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	function getTranslation(lang, key) {
    		const phrase = TRANSLATIONS[key];

    		return Object.keys(phrase).includes(lang)
    		? phrase[lang]
    		: phrase["en"];
    	}

    	let languages = [
    		{
    			option: 'en',
    			label: 'english',
    			id: "en_radio"
    		},
    		{
    			option: 'ru',
    			label: 'russian',
    			id: "ru_radio"
    		}
    	];

    	const COLORS = [
    		"#fa1414",
    		"#c88c64",
    		"#50aa8c",
    		"#0096e6",
    		"#0a14e6",
    		"#8200c8",
    		"#fa96d2",
    		"#828282",
    		"green",
    		"white"
    	];

    	let lang = new URLSearchParams(location.search).get("lang") || "en";
    	let showMenu = true;
    	let showFPS = true;
    	let showHint = true;
    	let showVertexLabel = true;
    	let showEdgeLabel = true;
    	let removeEdgesOnMoving = false;
    	let isFullscreen = false;
    	let vertexColorId = 0;
    	let edgeColorId = 0;
    	let vertexSize = 10;
    	let edgeSize = 3;
    	let vertexLabelColorId = 9;
    	let vertexLabelSize = 8;
    	let vertexesGenerationCount = 30;
    	let edgeLabelDistance = 30;
    	let edgeLabelSize = 8;
    	let edgeLabelColorId = 9;
    	let totalDistance = '0';
    	let totalDistanceWithStart = '0';
    	let graphComponent;
    	let graphClickHandler;
    	let graphMouseDownHandler;
    	let graphTouchStartHandler;
    	let graphRemoveVertexesHandler;
    	let graphRemoveEdgesHandler;
    	let graphGenerateVertexesHandler;
    	let graphFillEdgesInAddingOrderHandler;

    	onMount(function () {
    		$$invalidate(21, graphClickHandler = function (ev) {
    			graphComponent.handleClick(ev);
    		});

    		$$invalidate(22, graphMouseDownHandler = function (ev) {
    			graphComponent.handleMouseDown(ev);
    		});

    		$$invalidate(23, graphTouchStartHandler = function (ev) {
    			graphComponent.handleTouchStart(ev);
    		});

    		$$invalidate(24, graphRemoveVertexesHandler = function () {
    			graphComponent.removeAllVertexes();
    		});

    		$$invalidate(25, graphRemoveEdgesHandler = function () {
    			graphComponent.removeAllEdges();
    		});

    		$$invalidate(26, graphGenerateVertexesHandler = function () {
    			graphComponent.generateVertexes();
    		});

    		$$invalidate(27, graphFillEdgesInAddingOrderHandler = function () {
    			makeWindowActive(Windows.TotalDistance);
    			graphComponent.fillEdgesInAddingOrder();
    		});
    	});

    	var Windows;

    	(function (Windows) {
    		Windows[Windows["VertexSettings"] = 0] = "VertexSettings";
    		Windows[Windows["EdgeSettings"] = 1] = "EdgeSettings";
    		Windows[Windows["OtherSettings"] = 2] = "OtherSettings";
    		Windows[Windows["About"] = 3] = "About";
    		Windows[Windows["TotalDistance"] = 4] = "TotalDistance";
    		Windows[Windows["Size"] = 5] = "Size";
    	})(Windows || (Windows = {}));

    	let windowsOrder = [...Array(Windows.Size).keys()];
    	let windowsStatus = new Array(Windows.Size);
    	windowsStatus.fill(false);

    	function makeWindowActive(window) {
    		$$invalidate(30, windowsStatus[window] = true, windowsStatus);

    		for (let i = 0; i < windowsOrder.length; i++) {
    			if (windowsOrder[i] > windowsOrder[window]) {
    				$$invalidate(29, windowsOrder[i] -= 1, windowsOrder);
    			}
    		}

    		$$invalidate(29, windowsOrder[window] = Windows.Size - 1, windowsOrder);
    	}

    	function makeWindowInactive(window) {
    		$$invalidate(30, windowsStatus[window] = false, windowsStatus);

    		for (let i = 0; i < windowsOrder.length; i++) {
    			if (windowsOrder[i] < windowsOrder[window]) {
    				$$invalidate(29, windowsOrder[i] += 1, windowsOrder);
    			}
    		}

    		$$invalidate(29, windowsOrder[window] = 0, windowsOrder);
    	}

    	function switchFullscreen() {
    		if (document.fullscreenElement) {
    			document.exitFullscreen().then(function () {
    				
    			}).catch(function (error) {
    				// element could not exit fullscreen mode
    				// error message
    				console.log(error.message); // element has exited fullscreen mode
    			});

    			$$invalidate(7, isFullscreen = false);
    		} else {
    			document.documentElement.requestFullscreen().then(function () {
    				
    			}).catch(function (error) {
    				// element could not enter fullscreen mode
    				// error message
    				console.log(error.message); // element has entered fullscreen mode successfully
    			});

    			$$invalidate(7, isFullscreen = true);
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const fullscreenchange_handler = () => {
    		$$invalidate(7, isFullscreen = document.fullscreenElement !== null);
    	};

    	function graph_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			graphComponent = $$value;
    			$$invalidate(20, graphComponent);
    		});
    	}

    	function graph_totalDistance_binding(value) {
    		totalDistance = value;
    		$$invalidate(18, totalDistance);
    	}

    	function graph_totalDistanceWithStart_binding(value) {
    		totalDistanceWithStart = value;
    		$$invalidate(19, totalDistanceWithStart);
    	}

    	const click_handler = () => {
    		makeWindowActive(Windows.About);
    	};

    	const click_handler_1 = () => $$invalidate(1, showMenu = false);

    	function checkbox_checked_binding(value) {
    		removeEdgesOnMoving = value;
    		$$invalidate(6, removeEdgesOnMoving);
    	}

    	function inputrange_value_binding(value) {
    		vertexesGenerationCount = value;
    		$$invalidate(14, vertexesGenerationCount);
    	}

    	const click_handler_2 = () => {
    		makeWindowActive(Windows.VertexSettings);
    	};

    	const click_handler_3 = () => {
    		makeWindowActive(Windows.EdgeSettings);
    	};

    	const click_handler_4 = () => {
    		makeWindowActive(Windows.OtherSettings);
    	};

    	const click_handler_5 = () => $$invalidate(1, showMenu = true);

    	function checkbox_checked_binding_1(value) {
    		showVertexLabel = value;
    		$$invalidate(4, showVertexLabel);
    	}

    	function inputrange_value_binding_1(value) {
    		vertexSize = value;
    		$$invalidate(10, vertexSize);
    	}

    	function inputrange_value_binding_2(value) {
    		vertexLabelSize = value;
    		$$invalidate(13, vertexLabelSize);
    	}

    	function colorselector_selectedId_binding(value) {
    		vertexColorId = value;
    		$$invalidate(8, vertexColorId);
    	}

    	function colorselector_selectedId_binding_1(value) {
    		vertexLabelColorId = value;
    		$$invalidate(12, vertexLabelColorId);
    	}

    	const func = () => {
    		makeWindowActive(Windows.VertexSettings);
    	};

    	const func_1 = () => {
    		makeWindowInactive(Windows.VertexSettings);
    	};

    	function checkbox_checked_binding_2(value) {
    		showEdgeLabel = value;
    		$$invalidate(5, showEdgeLabel);
    	}

    	function inputrange_value_binding_3(value) {
    		edgeSize = value;
    		$$invalidate(11, edgeSize);
    	}

    	function inputrange0_value_binding(value) {
    		edgeLabelSize = value;
    		$$invalidate(16, edgeLabelSize);
    	}

    	function inputrange1_value_binding(value) {
    		edgeLabelDistance = value;
    		$$invalidate(15, edgeLabelDistance);
    	}

    	function colorselector_selectedId_binding_2(value) {
    		edgeColorId = value;
    		$$invalidate(9, edgeColorId);
    	}

    	function colorselector_selectedId_binding_3(value) {
    		edgeLabelColorId = value;
    		$$invalidate(17, edgeLabelColorId);
    	}

    	const func_2 = () => {
    		makeWindowActive(Windows.EdgeSettings);
    	};

    	const func_3 = () => {
    		makeWindowInactive(Windows.EdgeSettings);
    	};

    	function checkbox0_checked_binding(value) {
    		showFPS = value;
    		$$invalidate(2, showFPS);
    	}

    	function checkbox1_checked_binding(value) {
    		showHint = value;
    		$$invalidate(3, showHint);
    	}

    	function radiobuttons_group_binding(value) {
    		lang = value;
    		$$invalidate(0, lang);
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

    	$$self.$capture_state = () => ({
    		width,
    		height,
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
    		TRANSLATIONS,
    		RadioButtons,
    		getTranslation,
    		languages,
    		COLORS,
    		lang,
    		showMenu,
    		showFPS,
    		showHint,
    		showVertexLabel,
    		showEdgeLabel,
    		removeEdgesOnMoving,
    		isFullscreen,
    		vertexColorId,
    		edgeColorId,
    		vertexSize,
    		edgeSize,
    		vertexLabelColorId,
    		vertexLabelSize,
    		vertexesGenerationCount,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColorId,
    		totalDistance,
    		totalDistanceWithStart,
    		graphComponent,
    		graphClickHandler,
    		graphMouseDownHandler,
    		graphTouchStartHandler,
    		graphRemoveVertexesHandler,
    		graphRemoveEdgesHandler,
    		graphGenerateVertexesHandler,
    		graphFillEdgesInAddingOrderHandler,
    		Windows,
    		windowsOrder,
    		windowsStatus,
    		makeWindowActive,
    		makeWindowInactive,
    		switchFullscreen,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ('languages' in $$props) $$invalidate(34, languages = $$props.languages);
    		if ('lang' in $$props) $$invalidate(0, lang = $$props.lang);
    		if ('showMenu' in $$props) $$invalidate(1, showMenu = $$props.showMenu);
    		if ('showFPS' in $$props) $$invalidate(2, showFPS = $$props.showFPS);
    		if ('showHint' in $$props) $$invalidate(3, showHint = $$props.showHint);
    		if ('showVertexLabel' in $$props) $$invalidate(4, showVertexLabel = $$props.showVertexLabel);
    		if ('showEdgeLabel' in $$props) $$invalidate(5, showEdgeLabel = $$props.showEdgeLabel);
    		if ('removeEdgesOnMoving' in $$props) $$invalidate(6, removeEdgesOnMoving = $$props.removeEdgesOnMoving);
    		if ('isFullscreen' in $$props) $$invalidate(7, isFullscreen = $$props.isFullscreen);
    		if ('vertexColorId' in $$props) $$invalidate(8, vertexColorId = $$props.vertexColorId);
    		if ('edgeColorId' in $$props) $$invalidate(9, edgeColorId = $$props.edgeColorId);
    		if ('vertexSize' in $$props) $$invalidate(10, vertexSize = $$props.vertexSize);
    		if ('edgeSize' in $$props) $$invalidate(11, edgeSize = $$props.edgeSize);
    		if ('vertexLabelColorId' in $$props) $$invalidate(12, vertexLabelColorId = $$props.vertexLabelColorId);
    		if ('vertexLabelSize' in $$props) $$invalidate(13, vertexLabelSize = $$props.vertexLabelSize);
    		if ('vertexesGenerationCount' in $$props) $$invalidate(14, vertexesGenerationCount = $$props.vertexesGenerationCount);
    		if ('edgeLabelDistance' in $$props) $$invalidate(15, edgeLabelDistance = $$props.edgeLabelDistance);
    		if ('edgeLabelSize' in $$props) $$invalidate(16, edgeLabelSize = $$props.edgeLabelSize);
    		if ('edgeLabelColorId' in $$props) $$invalidate(17, edgeLabelColorId = $$props.edgeLabelColorId);
    		if ('totalDistance' in $$props) $$invalidate(18, totalDistance = $$props.totalDistance);
    		if ('totalDistanceWithStart' in $$props) $$invalidate(19, totalDistanceWithStart = $$props.totalDistanceWithStart);
    		if ('graphComponent' in $$props) $$invalidate(20, graphComponent = $$props.graphComponent);
    		if ('graphClickHandler' in $$props) $$invalidate(21, graphClickHandler = $$props.graphClickHandler);
    		if ('graphMouseDownHandler' in $$props) $$invalidate(22, graphMouseDownHandler = $$props.graphMouseDownHandler);
    		if ('graphTouchStartHandler' in $$props) $$invalidate(23, graphTouchStartHandler = $$props.graphTouchStartHandler);
    		if ('graphRemoveVertexesHandler' in $$props) $$invalidate(24, graphRemoveVertexesHandler = $$props.graphRemoveVertexesHandler);
    		if ('graphRemoveEdgesHandler' in $$props) $$invalidate(25, graphRemoveEdgesHandler = $$props.graphRemoveEdgesHandler);
    		if ('graphGenerateVertexesHandler' in $$props) $$invalidate(26, graphGenerateVertexesHandler = $$props.graphGenerateVertexesHandler);
    		if ('graphFillEdgesInAddingOrderHandler' in $$props) $$invalidate(27, graphFillEdgesInAddingOrderHandler = $$props.graphFillEdgesInAddingOrderHandler);
    		if ('Windows' in $$props) $$invalidate(28, Windows = $$props.Windows);
    		if ('windowsOrder' in $$props) $$invalidate(29, windowsOrder = $$props.windowsOrder);
    		if ('windowsStatus' in $$props) $$invalidate(30, windowsStatus = $$props.windowsStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		lang,
    		showMenu,
    		showFPS,
    		showHint,
    		showVertexLabel,
    		showEdgeLabel,
    		removeEdgesOnMoving,
    		isFullscreen,
    		vertexColorId,
    		edgeColorId,
    		vertexSize,
    		edgeSize,
    		vertexLabelColorId,
    		vertexLabelSize,
    		vertexesGenerationCount,
    		edgeLabelDistance,
    		edgeLabelSize,
    		edgeLabelColorId,
    		totalDistance,
    		totalDistanceWithStart,
    		graphComponent,
    		graphClickHandler,
    		graphMouseDownHandler,
    		graphTouchStartHandler,
    		graphRemoveVertexesHandler,
    		graphRemoveEdgesHandler,
    		graphGenerateVertexesHandler,
    		graphFillEdgesInAddingOrderHandler,
    		Windows,
    		windowsOrder,
    		windowsStatus,
    		$width,
    		$height,
    		getTranslation,
    		languages,
    		COLORS,
    		makeWindowActive,
    		makeWindowInactive,
    		switchFullscreen,
    		fullscreenchange_handler,
    		graph_binding,
    		graph_totalDistance_binding,
    		graph_totalDistanceWithStart_binding,
    		click_handler,
    		click_handler_1,
    		checkbox_checked_binding,
    		inputrange_value_binding,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		checkbox_checked_binding_1,
    		inputrange_value_binding_1,
    		inputrange_value_binding_2,
    		colorselector_selectedId_binding,
    		colorselector_selectedId_binding_1,
    		func,
    		func_1,
    		checkbox_checked_binding_2,
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
    		func_4,
    		func_5,
    		func_6,
    		func_7,
    		func_8,
    		func_9
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1, -1]);

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
