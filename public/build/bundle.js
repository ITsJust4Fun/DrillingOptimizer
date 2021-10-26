
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

    const { console: console_1, window: window_1 } = globals;

    const file$4 = "src\\Canvas.svelte";

    function create_fragment$9(ctx) {
    	let canvas_1;
    	let canvas_1_width_value;
    	let canvas_1_height_value;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(canvas_1, "width", canvas_1_width_value = /*$width*/ ctx[3] * /*$pixelRatio*/ ctx[2]);
    			attr_dev(canvas_1, "height", canvas_1_height_value = /*$height*/ ctx[4] * /*$pixelRatio*/ ctx[2]);
    			set_style(canvas_1, "width", /*$width*/ ctx[3] + "px");
    			set_style(canvas_1, "height", /*$height*/ ctx[4] + "px");
    			add_location(canvas_1, file$4, 98, 0, 1941);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[10](canvas_1);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "resize", /*handleResize*/ ctx[5], { passive: true }, false, false),
    					listen_dev(canvas_1, "click", prevent_default(/*click_handler*/ ctx[11]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$width, $pixelRatio*/ 12 && canvas_1_width_value !== (canvas_1_width_value = /*$width*/ ctx[3] * /*$pixelRatio*/ ctx[2])) {
    				attr_dev(canvas_1, "width", canvas_1_width_value);
    			}

    			if (!current || dirty & /*$height, $pixelRatio*/ 20 && canvas_1_height_value !== (canvas_1_height_value = /*$height*/ ctx[4] * /*$pixelRatio*/ ctx[2])) {
    				attr_dev(canvas_1, "height", canvas_1_height_value);
    			}

    			if (!current || dirty & /*$width*/ 8) {
    				set_style(canvas_1, "width", /*$width*/ ctx[3] + "px");
    			}

    			if (!current || dirty & /*$height*/ 16) {
    				set_style(canvas_1, "height", /*$height*/ ctx[4] + "px");
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
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
    			/*canvas_1_binding*/ ctx[10](null);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let $props;
    	let $pixelRatio;
    	let $width;
    	let $height;
    	validate_store(props, 'props');
    	component_subscribe($$self, props, $$value => $$invalidate(14, $props = $$value));
    	validate_store(pixelRatio, 'pixelRatio');
    	component_subscribe($$self, pixelRatio, $$value => $$invalidate(2, $pixelRatio = $$value));
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(3, $width = $$value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(4, $height = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Canvas', slots, ['default']);
    	let { killLoopOnError = true } = $$props;
    	let { attributes = {} } = $$props;

    	let { onClick = ev => {
    		
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

    	const writable_props = ['killLoopOnError', 'attributes', 'onClick'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Canvas> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas$1 = $$value;
    			$$invalidate(1, canvas$1);
    		});
    	}

    	const click_handler = ev => {
    		onClick(ev);
    	};

    	$$self.$$set = $$props => {
    		if ('killLoopOnError' in $$props) $$invalidate(6, killLoopOnError = $$props.killLoopOnError);
    		if ('attributes' in $$props) $$invalidate(7, attributes = $$props.attributes);
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
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
    		if ('killLoopOnError' in $$props) $$invalidate(6, killLoopOnError = $$props.killLoopOnError);
    		if ('attributes' in $$props) $$invalidate(7, attributes = $$props.attributes);
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('listeners' in $$props) listeners = $$props.listeners;
    		if ('canvas' in $$props) $$invalidate(1, canvas$1 = $$props.canvas);
    		if ('context' in $$props) context$1 = $$props.context;
    		if ('frame' in $$props) frame = $$props.frame;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		onClick,
    		canvas$1,
    		$pixelRatio,
    		$width,
    		$height,
    		handleResize,
    		killLoopOnError,
    		attributes,
    		$$scope,
    		slots,
    		canvas_1_binding,
    		click_handler
    	];
    }

    class Canvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			killLoopOnError: 6,
    			attributes: 7,
    			onClick: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Canvas",
    			options,
    			id: create_fragment$9.name
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
    }

    /* src\Background.svelte generated by Svelte v3.44.0 */

    function create_fragment$8(ctx) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { color: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Background",
    			options,
    			id: create_fragment$8.name
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

    function create_fragment$7(ctx) {
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { color: 0, divisions: 1, pointSize: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DotGrid",
    			options,
    			id: create_fragment$7.name
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

    function create_fragment$6(ctx) {
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function drawText(props) {
    	const { context, text, x, y } = props;
    	let color = 'hsl(0, 0%, 100%)';
    	let align = 'center';
    	let baseline = 'top';
    	let fontSize = 8;
    	let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica';

    	if (text && context) {
    		context.fillStyle = color;
    		context.font = `${fontSize}px ${fontFamily}`;
    		context.textAlign = align;
    		context.textBaseline = baseline;
    		context.fillText(text, x, y);
    	}
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Graph', slots, ['default']);
    	let { color = '#ffe554' } = $$props;
    	let { size = 10 } = $$props;
    	let vertexes = [];
    	let edges = [];
    	let minDistance = 45;

    	renderable(props => {
    		const { context } = props;

    		for (let vertex of vertexes) {
    			context.lineCap = 'round';
    			context.beginPath();
    			context.fillStyle = color;
    			context.strokeStyle = color;
    			context.lineWidth = 3;
    			context.arc(vertex.x, vertex.y, size, 0, Math.PI * 2);
    			context.fill();
    			let text = `(${vertex.x}, ${vertex.y})`;

    			drawText({
    				context,
    				text,
    				x: vertex.x,
    				y: vertex.y + size + 10
    			});
    		}
    	});

    	function handleClick(ev) {
    		let x = ev.clientX;
    		let y = ev.clientY;
    		let nearest = getNearestVertex(x, y);

    		if (nearest.value <= size && nearest.index != -1) {
    			vertexes = [
    				...vertexes.slice(0, nearest.index),
    				...vertexes.slice(nearest.index + 1, vertexes.length)
    			];
    		}

    		if (nearest.value < minDistance && nearest.index != -1) {
    			return;
    		}

    		let vertex = { x, y };
    		vertexes = [...vertexes, vertex];
    	}

    	function getNearestVertex(x, y) {
    		let nearestIndex = -1;
    		let nearestValue = -1;

    		for (let i = 0; i < vertexes.length; i++) {
    			let vertex = vertexes[i];
    			let value = getDistance(vertex, { x, y });

    			if (nearestIndex === -1 || nearestValue > value) {
    				nearestIndex = i;
    				nearestValue = value;
    			}
    		}

    		return { value: nearestValue, index: nearestIndex };
    	}

    	const writable_props = ['color', 'size'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Graph> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('size' in $$props) $$invalidate(1, size = $$props.size);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		renderable,
    		color,
    		size,
    		vertexes,
    		edges,
    		minDistance,
    		handleClick,
    		drawText,
    		getDistance,
    		getNearestVertex
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('size' in $$props) $$invalidate(1, size = $$props.size);
    		if ('vertexes' in $$props) vertexes = $$props.vertexes;
    		if ('edges' in $$props) edges = $$props.edges;
    		if ('minDistance' in $$props) minDistance = $$props.minDistance;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, size, handleClick, $$scope, slots];
    }

    class Graph extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { color: 0, size: 1, handleClick: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graph",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get color() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Graph>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClick() {
    		return this.$$.ctx[2];
    	}

    	set handleClick(value) {
    		throw new Error("<Graph>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Text.svelte generated by Svelte v3.44.0 */

    function create_fragment$5(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[8],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[8])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null),
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Text', slots, ['default']);
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

    		if (text) {
    			context.fillStyle = color;
    			context.font = `${fontSize}px ${fontFamily}`;
    			context.textAlign = align;
    			context.textBaseline = baseline;
    			context.fillText(text, x, y);
    		}
    	});

    	const writable_props = ['color', 'align', 'baseline', 'text', 'x', 'y', 'fontSize', 'fontFamily'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Text> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('align' in $$props) $$invalidate(1, align = $$props.align);
    		if ('baseline' in $$props) $$invalidate(2, baseline = $$props.baseline);
    		if ('text' in $$props) $$invalidate(3, text = $$props.text);
    		if ('x' in $$props) $$invalidate(4, x = $$props.x);
    		if ('y' in $$props) $$invalidate(5, y = $$props.y);
    		if ('fontSize' in $$props) $$invalidate(6, fontSize = $$props.fontSize);
    		if ('fontFamily' in $$props) $$invalidate(7, fontFamily = $$props.fontFamily);
    		if ('$$scope' in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		renderable,
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
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('align' in $$props) $$invalidate(1, align = $$props.align);
    		if ('baseline' in $$props) $$invalidate(2, baseline = $$props.baseline);
    		if ('text' in $$props) $$invalidate(3, text = $$props.text);
    		if ('x' in $$props) $$invalidate(4, x = $$props.x);
    		if ('y' in $$props) $$invalidate(5, y = $$props.y);
    		if ('fontSize' in $$props) $$invalidate(6, fontSize = $$props.fontSize);
    		if ('fontFamily' in $$props) $$invalidate(7, fontFamily = $$props.fontFamily);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, align, baseline, text, x, y, fontSize, fontFamily, $$scope, slots];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			color: 0,
    			align: 1,
    			baseline: 2,
    			text: 3,
    			x: 4,
    			y: 5,
    			fontSize: 6,
    			fontFamily: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$5.name
    		});
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

    function create_fragment$4(ctx) {
    	let text_1;
    	let t;
    	let current;

    	text_1 = new Text({
    			props: {
    				text: /*text*/ ctx[0],
    				fontSize: "12",
    				fontFamily: "Courier New",
    				align: "right",
    				baseline: "top",
    				x: /*$width*/ ctx[1] - 20,
    				y: 20
    			},
    			$$inline: true
    		});

    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

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
    			if (dirty & /*$width*/ 2) text_1_changes.x = /*$width*/ ctx[1] - 20;
    			text_1.$set(text_1_changes);

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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $width;
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(1, $width = $$value));
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
    		if ('show' in $$props) $$invalidate(2, show = $$props.show);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Text,
    		width,
    		renderable,
    		show,
    		text,
    		frames,
    		prevTime,
    		$width
    	});

    	$$self.$inject_state = $$props => {
    		if ('show' in $$props) $$invalidate(2, show = $$props.show);
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('frames' in $$props) frames = $$props.frames;
    		if ('prevTime' in $$props) prevTime = $$props.prevTime;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, $width, show, $$scope, slots];
    }

    class FPS extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { show: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FPS",
    			options,
    			id: create_fragment$4.name
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

    const file$3 = "src\\InputRange.svelte";

    function create_fragment$3(ctx) {
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
    			add_location(div, file$3, 8, 2, 164);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[2]);
    			attr_dev(input, "max", /*max*/ ctx[3]);
    			attr_dev(input, "step", /*step*/ ctx[4]);
    			attr_dev(input, "class", "svelte-9fgmxq");
    			add_location(input, file$3, 9, 2, 193);
    			attr_dev(label, "class", "wrapper svelte-9fgmxq");
    			add_location(label, file$3, 7, 0, 138);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
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
    			id: create_fragment$3.name
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

    const file$2 = "src\\Checkbox.svelte";

    function create_fragment$2(ctx) {
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
    			add_location(input, file$2, 6, 2, 80);
    			add_location(span, file$2, 7, 2, 121);
    			attr_dev(label, "class", "svelte-1nwpgdl");
    			add_location(label, file$2, 5, 0, 70);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 1, checked: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$2.name
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

    /* src\ParticleSelector.svelte generated by Svelte v3.44.0 */

    const file$1 = "src\\ParticleSelector.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (6:2) {#each Array(...colors.entries()) as idAndColor}
    function create_each_block(ctx) {
    	let button;
    	let button_style_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*idAndColor*/ ctx[3]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "name", "color");
    			attr_dev(button, "type", "radio");
    			attr_dev(button, "style", button_style_value = `background-color: ${/*idAndColor*/ ctx[3][1]};`);
    			attr_dev(button, "class", "svelte-5i7tqo");
    			toggle_class(button, "selected", /*selectedId*/ ctx[0] === /*idAndColor*/ ctx[3][0]);
    			add_location(button, file$1, 6, 4, 159);
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

    			if (dirty & /*colors*/ 2 && button_style_value !== (button_style_value = `background-color: ${/*idAndColor*/ ctx[3][1]};`)) {
    				attr_dev(button, "style", button_style_value);
    			}

    			if (dirty & /*selectedId, Array, colors*/ 3) {
    				toggle_class(button, "selected", /*selectedId*/ ctx[0] === /*idAndColor*/ ctx[3][0]);
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(6:2) {#each Array(...colors.entries()) as idAndColor}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_value = Array(.../*colors*/ ctx[1].entries());
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-5i7tqo");
    			add_location(div, file$1, 4, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Array, colors, selectedId*/ 3) {
    				each_value = Array(.../*colors*/ ctx[1].entries());
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ParticleSelector', slots, []);
    	let { colors = [] } = $$props;
    	let { selectedId = 0 } = $$props;
    	const writable_props = ['colors', 'selectedId'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ParticleSelector> was created with unknown prop '${key}'`);
    	});

    	const click_handler = idAndColor => $$invalidate(0, selectedId = idAndColor[0]);

    	$$self.$$set = $$props => {
    		if ('colors' in $$props) $$invalidate(1, colors = $$props.colors);
    		if ('selectedId' in $$props) $$invalidate(0, selectedId = $$props.selectedId);
    	};

    	$$self.$capture_state = () => ({ colors, selectedId });

    	$$self.$inject_state = $$props => {
    		if ('colors' in $$props) $$invalidate(1, colors = $$props.colors);
    		if ('selectedId' in $$props) $$invalidate(0, selectedId = $$props.selectedId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedId, colors, click_handler];
    }

    class ParticleSelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { colors: 1, selectedId: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ParticleSelector",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get colors() {
    		throw new Error("<ParticleSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colors(value) {
    		throw new Error("<ParticleSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedId() {
    		throw new Error("<ParticleSelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedId(value) {
    		throw new Error("<ParticleSelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var TRANSLATIONS = {
        showSettings: {
            en: "Show settings",
            ru: "Показать настройки"
        },
        hideSettings: {
            en: "Hide settings",
            ru: "Скрыть настройки"
        },
        copyLink: {
            en: "Copy link",
            ru: "Копировать ссылку"
        },
        currentWorldSettings: {
            en: "Current world settings",
            ru: "Настройки мира",
        },
        simulationsPerFrame: {
            en: "Simulations per frame",
            ru: "Шагов симуляции за кадр",
        },
        temperature: {
            en: "Temperature",
            ru: "Температура",
        },
        friction: {
            en: "Anti-friction",
            ru: "Анти-трение",
        },
        killAllParticles: {
            en: "Kill all particles",
            ru: "Уничтожить все частицы",
        },
        newWorldSettings: {
            en: "New world settings",
            ru: "Настройки нового мира",
        },
        particleTypesAmount: {
            en: "Particle types amount",
            ru: "Кол-во видов (цветов) частиц",
        },
        particleCount: {
            en: "Particle count",
            ru: "Кол-во частиц",
        },
        createNewWorld: {
            en: "Create new world",
            ru: "Создать новый мир",
        },
        particleBrush: {
            en: "Particle brush",
            ru: "Кисть частиц",
        },
        graphicalSettings: {
            en: "Graphical settings",
            ru: "Настройки просмотра",
        },
        drawConnections: {
            en: "Draw connections",
            ru: "Отображать соединения",
        },
        particleRadius: {
            en: "Particle radius",
            ru: "Радиус частицы",
        },
        changeFormBySpeed: {
            en: "Change particle form by speed",
            ru: "Искажать форму частицы в зависимости от скорости",
        },
        displacementMultiplier: {
            en: "Displacement multiplier",
            ru: "Множитель искажения",
        },
        showFPS: {
            en: "Show FPS",
            ru: "Показать FPS",
        },
        vertexColor: {
            en: "Vertex Color",
            ru: "Цвет вершин",
        }
    };

    /* src\App.svelte generated by Svelte v3.44.0 */

    const { Object: Object_1 } = globals;
    const file = "src\\App.svelte";

    // (45:1) <Background color='hsl(0, 0%, 10%)'>
    function create_default_slot_1(ctx) {
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(45:1) <Background color='hsl(0, 0%, 10%)'>",
    		ctx
    	});

    	return block;
    }

    // (44:0) <Canvas onClick={graphClickHandler}>
    function create_default_slot(ctx) {
    	let background;
    	let t0;
    	let graph;
    	let t1;
    	let text_1;
    	let t2;
    	let fps;
    	let current;

    	background = new Background({
    			props: {
    				color: "hsl(0, 0%, 10%)",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let graph_props = {
    		color: /*COLORS*/ ctx[10][/*selectedId*/ ctx[4]]
    	};

    	graph = new Graph({ props: graph_props, $$inline: true });
    	/*graph_binding*/ ctx[12](graph);

    	text_1 = new Text({
    			props: {
    				text: "Click and drag around the page to move the character.",
    				fontSize: 12,
    				align: "right",
    				baseline: "bottom",
    				x: /*$width*/ ctx[7] - 20,
    				y: /*$height*/ ctx[8] - 20
    			},
    			$$inline: true
    		});

    	fps = new FPS({
    			props: { show: /*showFPS*/ ctx[1] },
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

    			if (dirty & /*$$scope*/ 33554432) {
    				background_changes.$$scope = { dirty, ctx };
    			}

    			background.$set(background_changes);
    			const graph_changes = {};
    			if (dirty & /*selectedId*/ 16) graph_changes.color = /*COLORS*/ ctx[10][/*selectedId*/ ctx[4]];
    			graph.$set(graph_changes);
    			const text_1_changes = {};
    			if (dirty & /*$width*/ 128) text_1_changes.x = /*$width*/ ctx[7] - 20;
    			if (dirty & /*$height*/ 256) text_1_changes.y = /*$height*/ ctx[8] - 20;
    			text_1.$set(text_1_changes);
    			const fps_changes = {};
    			if (dirty & /*showFPS*/ 2) fps_changes.show = /*showFPS*/ ctx[1];
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
    			/*graph_binding*/ ctx[12](null);
    			destroy_component(graph, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(text_1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(fps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(44:0) <Canvas onClick={graphClickHandler}>",
    		ctx
    	});

    	return block;
    }

    // (165:1) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "showSettings")}`;
    			attr_dev(button, "class", "svelte-kz9qu7");
    			add_location(button, file, 165, 2, 4210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[24], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(165:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (60:1) {#if showSettings}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let div3;
    	let h20;
    	let t5;
    	let inputrange0;
    	let updating_value;
    	let t6;
    	let inputrange1;
    	let updating_value_1;
    	let t7;
    	let inputrange2;
    	let updating_value_2;
    	let t8;
    	let inputrange3;
    	let updating_value_3;
    	let t9;
    	let div2;
    	let button2;
    	let t11;
    	let div5;
    	let h21;
    	let t13;
    	let inputrange4;
    	let updating_value_4;
    	let t14;
    	let inputrange5;
    	let updating_value_5;
    	let t15;
    	let div4;
    	let button3;
    	let t17;
    	let div6;
    	let h22;
    	let t19;
    	let particleselector;
    	let updating_selectedId;
    	let t20;
    	let div7;
    	let h23;
    	let t22;
    	let checkbox0;
    	let updating_checked;
    	let t23;
    	let checkbox1;
    	let updating_checked_1;
    	let t24;
    	let current;
    	let mounted;
    	let dispose;

    	function inputrange0_value_binding(value) {
    		/*inputrange0_value_binding*/ ctx[14](value);
    	}

    	let inputrange0_props = {
    		name: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "simulationsPerFrame"),
    		min: 1,
    		max: 100
    	};

    	if (/*simulationsPerFrame*/ ctx[2] !== void 0) {
    		inputrange0_props.value = /*simulationsPerFrame*/ ctx[2];
    	}

    	inputrange0 = new InputRange({ props: inputrange0_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange0, 'value', inputrange0_value_binding));

    	function inputrange1_value_binding(value) {
    		/*inputrange1_value_binding*/ ctx[15](value);
    	}

    	let inputrange1_props = {
    		name: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "temperature"),
    		min: 0.1,
    		max: 40,
    		step: 0.1
    	};

    	if (/*simulationsPerFrame*/ ctx[2] !== void 0) {
    		inputrange1_props.value = /*simulationsPerFrame*/ ctx[2];
    	}

    	inputrange1 = new InputRange({ props: inputrange1_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange1, 'value', inputrange1_value_binding));

    	function inputrange2_value_binding(value) {
    		/*inputrange2_value_binding*/ ctx[16](value);
    	}

    	let inputrange2_props = {
    		name: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "friction"),
    		min: 0,
    		max: 1,
    		step: 0.01
    	};

    	if (/*simulationsPerFrame*/ ctx[2] !== void 0) {
    		inputrange2_props.value = /*simulationsPerFrame*/ ctx[2];
    	}

    	inputrange2 = new InputRange({ props: inputrange2_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange2, 'value', inputrange2_value_binding));

    	function inputrange3_value_binding(value) {
    		/*inputrange3_value_binding*/ ctx[17](value);
    	}

    	let inputrange3_props = {
    		name: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "particleRadius"),
    		min: 3,
    		max: 10,
    		step: 0.01
    	};

    	if (/*simulationsPerFrame*/ ctx[2] !== void 0) {
    		inputrange3_props.value = /*simulationsPerFrame*/ ctx[2];
    	}

    	inputrange3 = new InputRange({ props: inputrange3_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange3, 'value', inputrange3_value_binding));

    	function inputrange4_value_binding(value) {
    		/*inputrange4_value_binding*/ ctx[18](value);
    	}

    	let inputrange4_props = {
    		name: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "particleTypesAmount"),
    		min: 1,
    		max: 100
    	};

    	if (/*simulationsPerFrame*/ ctx[2] !== void 0) {
    		inputrange4_props.value = /*simulationsPerFrame*/ ctx[2];
    	}

    	inputrange4 = new InputRange({ props: inputrange4_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange4, 'value', inputrange4_value_binding));

    	function inputrange5_value_binding(value) {
    		/*inputrange5_value_binding*/ ctx[19](value);
    	}

    	let inputrange5_props = {
    		name: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "particleCount"),
    		min: 0,
    		max: 5000
    	};

    	if (/*simulationsPerFrame*/ ctx[2] !== void 0) {
    		inputrange5_props.value = /*simulationsPerFrame*/ ctx[2];
    	}

    	inputrange5 = new InputRange({ props: inputrange5_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange5, 'value', inputrange5_value_binding));

    	function particleselector_selectedId_binding(value) {
    		/*particleselector_selectedId_binding*/ ctx[20](value);
    	}

    	let particleselector_props = { colors: /*COLORS*/ ctx[10] };

    	if (/*selectedId*/ ctx[4] !== void 0) {
    		particleselector_props.selectedId = /*selectedId*/ ctx[4];
    	}

    	particleselector = new ParticleSelector({
    			props: particleselector_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(particleselector, 'selectedId', particleselector_selectedId_binding));

    	function checkbox0_checked_binding(value) {
    		/*checkbox0_checked_binding*/ ctx[21](value);
    	}

    	let checkbox0_props = {
    		title: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "showFPS")
    	};

    	if (/*showFPS*/ ctx[1] !== void 0) {
    		checkbox0_props.checked = /*showFPS*/ ctx[1];
    	}

    	checkbox0 = new Checkbox({ props: checkbox0_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox0, 'checked', checkbox0_checked_binding));

    	function checkbox1_checked_binding(value) {
    		/*checkbox1_checked_binding*/ ctx[22](value);
    	}

    	let checkbox1_props = {
    		title: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "changeFormBySpeed")
    	};

    	if (/*drawConnections*/ ctx[3] !== void 0) {
    		checkbox1_props.checked = /*drawConnections*/ ctx[3];
    	}

    	checkbox1 = new Checkbox({ props: checkbox1_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox1, 'checked', checkbox1_checked_binding));
    	let if_block = /*drawConnections*/ ctx[3] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "hideSettings")}`;
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "copyLink")}`;
    			t3 = space();
    			div3 = element("div");
    			h20 = element("h2");
    			h20.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "currentWorldSettings")}`;
    			t5 = space();
    			create_component(inputrange0.$$.fragment);
    			t6 = space();
    			create_component(inputrange1.$$.fragment);
    			t7 = space();
    			create_component(inputrange2.$$.fragment);
    			t8 = space();
    			create_component(inputrange3.$$.fragment);
    			t9 = space();
    			div2 = element("div");
    			button2 = element("button");
    			button2.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "killAllParticles")}`;
    			t11 = space();
    			div5 = element("div");
    			h21 = element("h2");
    			h21.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "newWorldSettings")}`;
    			t13 = space();
    			create_component(inputrange4.$$.fragment);
    			t14 = space();
    			create_component(inputrange5.$$.fragment);
    			t15 = space();
    			div4 = element("div");
    			button3 = element("button");
    			button3.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "createNewWorld")}`;
    			t17 = space();
    			div6 = element("div");
    			h22 = element("h2");
    			h22.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "vertexColor")}`;
    			t19 = space();
    			create_component(particleselector.$$.fragment);
    			t20 = space();
    			div7 = element("div");
    			h23 = element("h2");
    			h23.textContent = `${/*getTranslation*/ ctx[9](/*lang*/ ctx[11], "graphicalSettings")}`;
    			t22 = space();
    			create_component(checkbox0.$$.fragment);
    			t23 = space();
    			create_component(checkbox1.$$.fragment);
    			t24 = space();
    			if (if_block) if_block.c();
    			attr_dev(button0, "class", "svelte-kz9qu7");
    			add_location(button0, file, 63, 4, 1830);
    			attr_dev(button1, "class", "svelte-kz9qu7");
    			add_location(button1, file, 66, 4, 1941);
    			attr_dev(div0, "class", "buttons-row svelte-kz9qu7");
    			add_location(div0, file, 62, 3, 1800);
    			attr_dev(div1, "class", "controls-block svelte-kz9qu7");
    			add_location(div1, file, 61, 2, 1768);
    			attr_dev(h20, "class", "controls-block__title svelte-kz9qu7");
    			add_location(h20, file, 72, 3, 2071);
    			attr_dev(button2, "class", "svelte-kz9qu7");
    			add_location(button2, file, 103, 4, 2795);
    			attr_dev(div2, "class", "buttons-row svelte-kz9qu7");
    			add_location(div2, file, 102, 3, 2765);
    			attr_dev(div3, "class", "controls-block svelte-kz9qu7");
    			add_location(div3, file, 71, 2, 2039);
    			attr_dev(h21, "class", "controls-block__title svelte-kz9qu7");
    			add_location(h21, file, 111, 3, 2950);
    			attr_dev(button3, "class", "svelte-kz9qu7");
    			add_location(button3, file, 127, 4, 3355);
    			attr_dev(div4, "class", "buttons-row svelte-kz9qu7");
    			add_location(div4, file, 126, 3, 3325);
    			attr_dev(div5, "class", "controls-block svelte-kz9qu7");
    			add_location(div5, file, 110, 2, 2918);
    			attr_dev(h22, "class", "controls-block__title svelte-kz9qu7");
    			add_location(h22, file, 133, 3, 3497);
    			attr_dev(div6, "class", "controls-block svelte-kz9qu7");
    			add_location(div6, file, 132, 2, 3465);
    			attr_dev(h23, "class", "controls-block__title svelte-kz9qu7");
    			add_location(h23, file, 143, 3, 3696);
    			attr_dev(div7, "class", "controls-block svelte-kz9qu7");
    			add_location(div7, file, 142, 2, 3664);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h20);
    			append_dev(div3, t5);
    			mount_component(inputrange0, div3, null);
    			append_dev(div3, t6);
    			mount_component(inputrange1, div3, null);
    			append_dev(div3, t7);
    			mount_component(inputrange2, div3, null);
    			append_dev(div3, t8);
    			mount_component(inputrange3, div3, null);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, button2);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h21);
    			append_dev(div5, t13);
    			mount_component(inputrange4, div5, null);
    			append_dev(div5, t14);
    			mount_component(inputrange5, div5, null);
    			append_dev(div5, t15);
    			append_dev(div5, div4);
    			append_dev(div4, button3);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, h22);
    			append_dev(div6, t19);
    			mount_component(particleselector, div6, null);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, h23);
    			append_dev(div7, t22);
    			mount_component(checkbox0, div7, null);
    			append_dev(div7, t23);
    			mount_component(checkbox1, div7, null);
    			append_dev(div7, t24);
    			if (if_block) if_block.m(div7, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[13], false, false, false),
    					listen_dev(button1, "click", {}, false, false, false),
    					listen_dev(button2, "click", click_handler_1, false, false, false),
    					listen_dev(button3, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const inputrange0_changes = {};

    			if (!updating_value && dirty & /*simulationsPerFrame*/ 4) {
    				updating_value = true;
    				inputrange0_changes.value = /*simulationsPerFrame*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			inputrange0.$set(inputrange0_changes);
    			const inputrange1_changes = {};

    			if (!updating_value_1 && dirty & /*simulationsPerFrame*/ 4) {
    				updating_value_1 = true;
    				inputrange1_changes.value = /*simulationsPerFrame*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			inputrange1.$set(inputrange1_changes);
    			const inputrange2_changes = {};

    			if (!updating_value_2 && dirty & /*simulationsPerFrame*/ 4) {
    				updating_value_2 = true;
    				inputrange2_changes.value = /*simulationsPerFrame*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			inputrange2.$set(inputrange2_changes);
    			const inputrange3_changes = {};

    			if (!updating_value_3 && dirty & /*simulationsPerFrame*/ 4) {
    				updating_value_3 = true;
    				inputrange3_changes.value = /*simulationsPerFrame*/ ctx[2];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			inputrange3.$set(inputrange3_changes);
    			const inputrange4_changes = {};

    			if (!updating_value_4 && dirty & /*simulationsPerFrame*/ 4) {
    				updating_value_4 = true;
    				inputrange4_changes.value = /*simulationsPerFrame*/ ctx[2];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			inputrange4.$set(inputrange4_changes);
    			const inputrange5_changes = {};

    			if (!updating_value_5 && dirty & /*simulationsPerFrame*/ 4) {
    				updating_value_5 = true;
    				inputrange5_changes.value = /*simulationsPerFrame*/ ctx[2];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			inputrange5.$set(inputrange5_changes);
    			const particleselector_changes = {};

    			if (!updating_selectedId && dirty & /*selectedId*/ 16) {
    				updating_selectedId = true;
    				particleselector_changes.selectedId = /*selectedId*/ ctx[4];
    				add_flush_callback(() => updating_selectedId = false);
    			}

    			particleselector.$set(particleselector_changes);
    			const checkbox0_changes = {};

    			if (!updating_checked && dirty & /*showFPS*/ 2) {
    				updating_checked = true;
    				checkbox0_changes.checked = /*showFPS*/ ctx[1];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox0.$set(checkbox0_changes);
    			const checkbox1_changes = {};

    			if (!updating_checked_1 && dirty & /*drawConnections*/ 8) {
    				updating_checked_1 = true;
    				checkbox1_changes.checked = /*drawConnections*/ ctx[3];
    				add_flush_callback(() => updating_checked_1 = false);
    			}

    			checkbox1.$set(checkbox1_changes);

    			if (/*drawConnections*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*drawConnections*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div7, null);
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
    			transition_in(inputrange0.$$.fragment, local);
    			transition_in(inputrange1.$$.fragment, local);
    			transition_in(inputrange2.$$.fragment, local);
    			transition_in(inputrange3.$$.fragment, local);
    			transition_in(inputrange4.$$.fragment, local);
    			transition_in(inputrange5.$$.fragment, local);
    			transition_in(particleselector.$$.fragment, local);
    			transition_in(checkbox0.$$.fragment, local);
    			transition_in(checkbox1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputrange0.$$.fragment, local);
    			transition_out(inputrange1.$$.fragment, local);
    			transition_out(inputrange2.$$.fragment, local);
    			transition_out(inputrange3.$$.fragment, local);
    			transition_out(inputrange4.$$.fragment, local);
    			transition_out(inputrange5.$$.fragment, local);
    			transition_out(particleselector.$$.fragment, local);
    			transition_out(checkbox0.$$.fragment, local);
    			transition_out(checkbox1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_component(inputrange0);
    			destroy_component(inputrange1);
    			destroy_component(inputrange2);
    			destroy_component(inputrange3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div5);
    			destroy_component(inputrange4);
    			destroy_component(inputrange5);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div6);
    			destroy_component(particleselector);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div7);
    			destroy_component(checkbox0);
    			destroy_component(checkbox1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(60:1) {#if showSettings}",
    		ctx
    	});

    	return block;
    }

    // (155:3) {#if drawConnections}
    function create_if_block_1(ctx) {
    	let inputrange;
    	let updating_value;
    	let current;

    	function inputrange_value_binding(value) {
    		/*inputrange_value_binding*/ ctx[23](value);
    	}

    	let inputrange_props = {
    		name: /*getTranslation*/ ctx[9](/*lang*/ ctx[11], "displacementMultiplier"),
    		min: 1,
    		max: 10,
    		step: 1
    	};

    	if (/*simulationsPerFrame*/ ctx[2] !== void 0) {
    		inputrange_props.value = /*simulationsPerFrame*/ ctx[2];
    	}

    	inputrange = new InputRange({ props: inputrange_props, $$inline: true });
    	binding_callbacks.push(() => bind(inputrange, 'value', inputrange_value_binding));

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

    			if (!updating_value && dirty & /*simulationsPerFrame*/ 4) {
    				updating_value = true;
    				inputrange_changes.value = /*simulationsPerFrame*/ ctx[2];
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(155:3) {#if drawConnections}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let canvas;
    	let t;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	canvas = new Canvas({
    			props: {
    				onClick: /*graphClickHandler*/ ctx[6],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*showSettings*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(canvas.$$.fragment);
    			t = space();
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "controls svelte-kz9qu7");
    			toggle_class(div, "controls_opened", /*showSettings*/ ctx[0]);
    			add_location(div, file, 58, 0, 1647);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(canvas, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const canvas_changes = {};
    			if (dirty & /*graphClickHandler*/ 64) canvas_changes.onClick = /*graphClickHandler*/ ctx[6];

    			if (dirty & /*$$scope, showFPS, $width, $height, selectedId, graphComponent*/ 33554866) {
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

    			if (dirty & /*showSettings*/ 1) {
    				toggle_class(div, "controls_opened", /*showSettings*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvas.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvas.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(canvas, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
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

    const click_handler_1 = () => {
    	
    };

    const click_handler_2 = () => {
    	
    };

    function instance($$self, $$props, $$invalidate) {
    	let $width;
    	let $height;
    	validate_store(width, 'width');
    	component_subscribe($$self, width, $$value => $$invalidate(7, $width = $$value));
    	validate_store(height, 'height');
    	component_subscribe($$self, height, $$value => $$invalidate(8, $height = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	function getTranslation(lang, key) {
    		const phrase = TRANSLATIONS[key];

    		return Object.keys(phrase).includes(lang)
    		? phrase[lang]
    		: phrase["en"];
    	}

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
    	let showSettings = true;
    	let showFPS = true;
    	let simulationsPerFrame = 5;
    	let drawConnections = true;
    	let selectedId = 0;
    	let graphComponent;
    	let graphClickHandler;

    	onMount(function () {
    		$$invalidate(6, graphClickHandler = function (ev) {
    			graphComponent.handleClick(ev);
    		});
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function graph_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			graphComponent = $$value;
    			$$invalidate(5, graphComponent);
    		});
    	}

    	const click_handler = () => $$invalidate(0, showSettings = false);

    	function inputrange0_value_binding(value) {
    		simulationsPerFrame = value;
    		$$invalidate(2, simulationsPerFrame);
    	}

    	function inputrange1_value_binding(value) {
    		simulationsPerFrame = value;
    		$$invalidate(2, simulationsPerFrame);
    	}

    	function inputrange2_value_binding(value) {
    		simulationsPerFrame = value;
    		$$invalidate(2, simulationsPerFrame);
    	}

    	function inputrange3_value_binding(value) {
    		simulationsPerFrame = value;
    		$$invalidate(2, simulationsPerFrame);
    	}

    	function inputrange4_value_binding(value) {
    		simulationsPerFrame = value;
    		$$invalidate(2, simulationsPerFrame);
    	}

    	function inputrange5_value_binding(value) {
    		simulationsPerFrame = value;
    		$$invalidate(2, simulationsPerFrame);
    	}

    	function particleselector_selectedId_binding(value) {
    		selectedId = value;
    		$$invalidate(4, selectedId);
    	}

    	function checkbox0_checked_binding(value) {
    		showFPS = value;
    		$$invalidate(1, showFPS);
    	}

    	function checkbox1_checked_binding(value) {
    		drawConnections = value;
    		$$invalidate(3, drawConnections);
    	}

    	function inputrange_value_binding(value) {
    		simulationsPerFrame = value;
    		$$invalidate(2, simulationsPerFrame);
    	}

    	const click_handler_3 = () => $$invalidate(0, showSettings = true);

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
    		ParticleSelector,
    		TRANSLATIONS,
    		getTranslation,
    		COLORS,
    		lang,
    		showSettings,
    		showFPS,
    		simulationsPerFrame,
    		drawConnections,
    		selectedId,
    		graphComponent,
    		graphClickHandler,
    		$width,
    		$height
    	});

    	$$self.$inject_state = $$props => {
    		if ('lang' in $$props) $$invalidate(11, lang = $$props.lang);
    		if ('showSettings' in $$props) $$invalidate(0, showSettings = $$props.showSettings);
    		if ('showFPS' in $$props) $$invalidate(1, showFPS = $$props.showFPS);
    		if ('simulationsPerFrame' in $$props) $$invalidate(2, simulationsPerFrame = $$props.simulationsPerFrame);
    		if ('drawConnections' in $$props) $$invalidate(3, drawConnections = $$props.drawConnections);
    		if ('selectedId' in $$props) $$invalidate(4, selectedId = $$props.selectedId);
    		if ('graphComponent' in $$props) $$invalidate(5, graphComponent = $$props.graphComponent);
    		if ('graphClickHandler' in $$props) $$invalidate(6, graphClickHandler = $$props.graphClickHandler);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showSettings,
    		showFPS,
    		simulationsPerFrame,
    		drawConnections,
    		selectedId,
    		graphComponent,
    		graphClickHandler,
    		$width,
    		$height,
    		getTranslation,
    		COLORS,
    		lang,
    		graph_binding,
    		click_handler,
    		inputrange0_value_binding,
    		inputrange1_value_binding,
    		inputrange2_value_binding,
    		inputrange3_value_binding,
    		inputrange4_value_binding,
    		inputrange5_value_binding,
    		particleselector_selectedId_binding,
    		checkbox0_checked_binding,
    		checkbox1_checked_binding,
    		inputrange_value_binding,
    		click_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

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
