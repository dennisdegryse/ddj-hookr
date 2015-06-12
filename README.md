![](https://github.com/dennisdegryse/ddj-hookr/blob/master/src/hookr-icon-256.png?raw=true)

# HookR - A minimal JavaScript hooking framework

This framework lets you hook handlers to specific situations that occur in your page. The original purpose was to provide this functionality to userscripts (a.k.a. Greasemonkey scripts). Most trivial userscripts use CPU-expensive methods, such as multiple `setTimeout` registrations. Instead, frameworks uses an event-driven approach.

## System requirements

HookR requires jQuery 2.1.4 and a browser with MutationObserver support.

## Registering a hook

A hook is modeled as an object with the following properties:

 Field | Description | Type | Required
 ----- | ----------- | ---- |:--------:
urlPattern | Regular expression for matching the document's location | String | No<br>(defaults to `".*"`)
state | Custom data to hook a specific state | Mixed | Yes
selector | jQuery style DOM selector to hook the insertion of any matching elements | String | No<br>(defaults to `"*"`)
condition | A predicate that should hold before the actual handler is triggered | Function | No<br>(defaults to `function (match, urlParams) { return true; }`)
handler | The handler to trigger | Function | No<br>(defaults to `function (match, urlParams) { }`)

Once constructed, the object is registered by utilizing the `ddj.hookr.addHook` function.

## Example

### Simple code example

```javascript
var initialState = 1;
var myHook = {
    urlPattern : '\/profile\/',
    state      : initialState,
    selector   : '#displayPictureContainer button.remove',
    condition  : function (_, urlParams) {
        var myUid = 314159265;
    
        return (urlParams.uid == myUid);
    },
    handler    : function (match, _) {
        $(match).trigger('click');
        console.log('your profile picture was deleted!');
    }
};

ddj.hookr.addHook(myHook);
ddj.hookr.setState(initialState);
```

According to the example above, the script will wait (event-driven) for a page that has _/profile/_ in its URL. If that's the case, the state will be compared. In this case the state stays the same and matches the one for the hook, so nothing interesting is happening here. Then the script finds the matching delete button on the page. When the button is found, a final check is done, by verifying whether or not the _uid_ query in the url matches the given user id. If the check succeeds, the button's click event is triggered, deleting the user's profile picture. A confirmation is also logged in the console for debugging purposes.

### Example projects

- [Mjölnir](https://github.com/dennisdegryse/ddj-mjolnir): A userscript for managing the International PHP Facebook group.
