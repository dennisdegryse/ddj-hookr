var ddj = (ddj === undefined) ? {} : ddj;

ddj.hookr = {
    _internal : {
        scrapedFlag : '_ddj_hooks_scraped',
        state : "",
        isInvalid : false,
        tree : {},
        queryParams : {},
        setState : function (state) {
            var self = ddj.hookr._internal;
            var serializedState = self.serializeState(state)
            
            if (serializedState != self.state) {
                self.state = serializedState;
                self.trigger();
            }
        },
        trigger : function () {
            var self = ddj.hookr._internal;
            var urlPattern, urlRegex, selector, context, i;
            var matchHandler = function () {
                var match = $(this);
                
                if (!match.data(self.scrapedFlag)) {
                    try {
                        if (context[selector].condition(match, self.queryParams) === true) {
                            var newState = context[selector].handler(match, self.queryParams) || null;
                            
                            if (newState !== null) {
                                self.setState(newState);
                            }
                        }
                        
                        match.data(self.scrapedFlag, true);
                    } catch (err) {
                        self.isInvalid = true;
                        
                        throw 'DDJ Hooks - invalid state: ' + err;
                    }
                }
            };
            
            if (!self.isInvalid) {
                for (urlPattern in self.tree) {
                    urlRegex = new RegExp(urlPattern);
                    
                    if (urlRegex.test(document.location)) {                    
                        context = self.tree[urlPattern][self.state];
    
                        if (context) {
                            for (selector in context) {
                                $(selector).each(matchHandler);
                            }
                        }
                    }
                }
            }
        },
        updateQueryParams : function () {
            var query = location.href.slice(location.href.indexOf('?') + 1);
            var pairs = query.split('&');
            var params = {};
            var i;
            
            for (i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
        
                params[pair[0]] = decodeURIComponent(pair[1]).replace(/\+/g, ' ');
            }
            
            ddj.hookr._internal.queryParams = params;
        },
        serializeState : function (state) {
            if (state === null) {
                throw 'DDJ Hooks - invalid state: null is not a valid state';
            }
            
            if (typeof state !== 'object') {
                state = { 
                    value : state 
                };
            }
            
            return $.param(state);
        }
    },
    addHook : function (hook) {
        var self = ddj.hookr._internal;
        var path = {};
        var serializedState;
        var params = {
            urlPattern : '.*',
            state : false,
            selector : '*',
            condition : function (match, queryParams) { return true; },
            handler : function (match, queryParams) { return true; }
        };
        
        $.extend(true, params, hook);
        serializedState = self.serializeState(params.state);
        
        path[params.urlPattern] = {};
        path[params.urlPattern][serializedState] = {};
        path[params.urlPattern][serializedState][params.selector] = params;
        
        $.extend(true, self.tree, path);
        
        self.trigger();
    },
    removeHook : function (reference) {
        /* not implemented */
    },
    setState : function (state) {
        ddj.hookr._internal.setState(state);
    }
};

(function () {
    (function () {
        var history_pushState = history.pushState;
        var history_replaceState = history.replaceState;
        
        var interceptEvent = function (method, eventType, target, args) {
            if (method != null) {
                method.apply(target, args);
            }

            $(document).trigger(eventType);
        }

        history.pushState = function () {
            interceptEvent(history_pushState, 'locationchanged', window.history, arguments);
        };

        history.replaceState = function (state, title, url) {
            interceptEvent(history_replaceState, 'locationchanged', window.history, arguments);
        };

        window.onpopstate = function (event) {
            interceptEvent(null, 'locationchanged', null, null);
        };
    })();
    
    (
        new MutationObserver(ddj.hookr._internal.trigger)).observe(document.body, { 
            childList : true,
            attributes : true,
            subtree : true 
        }
    );
    
    $(document).on("locationchanged", function () {
        ddj.hookr._internal.updateQueryParams();
        ddj.hookr._internal.trigger();
    });
    
    ddj.hookr._internal.updateQueryParams();
})();