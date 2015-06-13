var ddj = (ddj === undefined) ? {} : ddj;

ddj.hookr = {
    _internal : {
        scrapedFlag : '_ddj_hooks_scraped',
        state : "",
        isInvalid : false,
        tree : {},
        isLocked : false,
        queryParams : {},
        setState : function (state) {
            var self = ddj.hookr._internal;
            var serializedState = self.serializeState(state)
            
            if (self.isLocked) {
                self.isInvalid = true;
                
                throw 'HookR - invalid state: Cannot change the state during the execution of a handler. Return the new state from the handler instead.';
            }
            
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
                var newState;
                
                if (!match.data(self.scrapedFlag)) {
                    self.isLocked = true;
                    
                    try {
                        $.each(context[selector], function (i, hook) {
                            if (typeof hook == 'object' && hook.condition(match, self.queryParams) === true) {
                                newState = hook.handler(match, self.queryParams) || null;
                            }
                            
                            return (newState == null);
                        });
                    } catch (err) {
                        self.isInvalid = true;
                        
                        throw 'HookR - invalid state: ' + err;
                    }
                    
                    self.isLocked = false;
                    
                    match.data(self.scrapedFlag, true);
                    
                    if (newState !== null) {
                        self.setState(newState);
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
                                if (selector != null) {
                                    $(selector).each(matchHandler);
                                } else {
                                    matchHandler();
                                }
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
                ddj.hookr._internal.isInvalid = true;
                
                throw 'HookR - invalid state: null is not a valid state';
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
            selector : null,
            condition : function (match, queryParams) { return true; },
            handler : function (match, queryParams) { }
        };
        
        $.extend(true, params, hook);
        serializedState = self.serializeState(params.state);
        
        path[params.urlPattern] = {};
        path[params.urlPattern][serializedState] = {};
        path[params.urlPattern][serializedState][params.selector] = [ params ];
        
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