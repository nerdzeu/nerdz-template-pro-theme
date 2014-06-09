// ProTheme Javascript file
// Handles protheme related stuff, like the preferences.
// The theme will perfectly work without this file, but you won't
// be able to configure it. You will need to remove this from the
// template.values too.

// Declare the APIs, outside of our ProTheme scope
/**
 * Provides an easy-to-use API to hook into NERDZ's preferences page.
 *
 * @class PreferencesAPI
 * @static
 */
(function (PreferencesAPI) {
    var _available_sections = [
            "account", "profile", "guests", "projects",
            "language", "themes", "delete"
        ],
        _settings  = [],    // settings array
        _storage   = {},    // storage object
        _hooked    = false, // true if onHookedSectionLoaded has been called
        _usrNs,             // namespace
        _section,           // current section
        _hookedSec,         // the section requested by the user
        _saveCallback;      // callback set with setOnSaveCallback()

    /**
     * Inits the PreferencesAPI class. You __must__ use this method before
     * any other.
     *
     * @method init
     * @param {String} namespace The master namespace used to store
     * data in localStorage. Please pick an unique, appropriate name.
     * @param {String} sectionId The ID of the section you are going
     * to hook into. Section names can be retrieved from the preferences
     * internal filenames in `/pages/preferences/`.
     * @param {Function} onPrefsLoaded The function which is called if
     * the user is in the preferences page. You __SHOULD__ register any kind
     * of setting here, to avoid unnecessary memory wasting.
     */
    PreferencesAPI.init = function (namespace, sectionId, onPrefsLoaded) {
        if ($.inArray (sectionId, _available_sections) === -1)
            throw "Invalid sectionId. Please read the documentation.";
        _usrNs = namespace;
        _storage[_usrNs] = {};
        // load preferences
        if (localStorage.getItem ("prefsAPI") !== null)
        {
            var storage_tmp = JSON.parse (localStorage.getItem ("prefsAPI"));
            if (typeof storage_tmp         === 'object' &&
                typeof storage_tmp[_usrNs] === 'object')
                _storage[_usrNs] = storage_tmp[_usrNs];
        }
        // hook in preferences.php if we can
        if (document.location.pathname === "/preferences.php")
        {
            _hookedSec = sectionId;
            onPrefsLoaded();
            // register a global AJAX complete handler
            // to intercept requests targeted to sections
            $(document).ajaxComplete (function (evt, xhr, settings) {
                var rxp = /^\/pages\/preferences\/(.+?)\.html\.php$/
                          .exec (settings.url);
                if (rxp != null)
                {
                    _section = rxp[1];
                    if (_section === _hookedSec)
                        onHookedSectionLoaded();
                }
            });
            // check if there's a name of a section in the anchor
            if ($.inArray (document.location.hash.substr (3),
                    _available_sections))
                $("#" + document.location.hash.substr (3)).click();
        }
    };
    /**
     * Adds settings which will be displayed in the requested section.
     *
     * @method addSettings
     * @param {Object} settings* An object list containing detailed information
     * about every setting.
     * A setting is structured like this:
     *
     *     {
     *       name: "short-setting-name",
     *       // An element which will be added in the preferences page.
     *       // generic DOM elements and jQuery objects are allowed.
     *       element: ...,
     *       // The following will be called each time the user clicks
     *       // on the 'Save' button. You must perform any kind of data
     *       // sanitization here, and if anything goes wrong you should throw
     *       // an exception with throw "error message".
     *       // Otherwise, if the sanitization succeeds, return the value which
     *       // will be saved and then restored when the page is reloaded.
     *       // The only argument passed is your object, where you can use
     *       // the 'element' attribute to get any value you may need.
     *       onSave: function (object) {},
     *       // The following will be called each time the settings are
     *       // restored from the localStorage. You should restore the element
     *       // in the exact same way it was saved. No sanitization is
     *       // necessary here - if any kind of value screws up, it is not
     *       // our fault.
     *       onRestore: function (object, restoredValue) {},
     *       // A boolean value which determines if the setting should be shown
     *       // or not. If this is set to false, the setting won't be added at
     *       // all. This is useful when you need to check if some
     *       // prerequisites are met before showing the option to the user.
     *       // By default it is set to true, and you don't need to include it.
     *       display: true
     *     }
     * 
     * Adding other fields is fine, as long as you don't remove the required
     * ones specified in the structure.
     *
     * You can also create settings groups, which are structured like this:
     *
     *     {
     *       // The name of the group.
     *       groupName: "Miscellaneous settings",
     *       // An array of settings.
     *       groupSettings: [
     *        { ... }, { ... }
     *       ]
     *     }
     *
     */
    PreferencesAPI.addSettings = function() {
        for (var i = 0; i < arguments.length; i++)
            if (typeof arguments[i] === 'object' &&
                (!arguments[i].hasOwnProperty ("display")
                    || arguments[i].display))
                _settings.push (arguments[i]);
        if (_hooked && _hookedSec === _section)
            onHookedSectionLoaded();
    };
    /**
     * Retrieves a value from the stored settings.
     * You can specify a default value if it is not defined.
     *
     * @method getValue
     * @return {Object} The setting, if available, or defaultValue.
     * @param {String} name The name of the setting.
     * @param {Object} [defaultValue=undefined] The value which is returned if
     * `name` is not defined in our storage.
     */
    PreferencesAPI.getValue = function (name, defaultValue) {
        if (_storage[_usrNs].hasOwnProperty (name))
            return _storage[_usrNs][name];
        return defaultValue;
    };
    /**
     * Manually puts a key/value pair in the stored settings.
     * This method should be used only when you know what you are doing.
     * Changing a setting in the wrong way may cause a global thermonuclear
     * disaster. You have been warned.
     *
     * @method setValue
     * @param {String} key The name of the setting.
     * @param {String} value The value of the setting.
     */
    PreferencesAPI.setValue = function (key, value) {
        _storage[_usrNs][key] = value;
        // save in the localStorage
        localStorage.setItem ("prefsAPI", JSON.stringify (_storage));
    };
    /**
     * Registers a callback which is called each time the
     * the user clicks the 'Save' button. You may need this
     * to update the settings in realtime.
     *
     * For example, if an user
     * edits the background of your theme and clicks save, you can
     * re-read the value and update the background accordingly.
     *
     * @method setOnSaveCallback
     * @param {Function} cb The callback.
     */
    PreferencesAPI.setOnSaveCallback = function (cb) {
        if (typeof cb === 'function')
            _saveCallback = cb;
    };
    /**
     * Creates a checkbox object that can be used with
     * {{#crossLink "PreferencesAPI/addSettings:method"}}{{/crossLink}}.
     *
     * @method createCheckbox
     * @return {Object} The created setting.
     * @param {Object} params Configuration parameters. Fields:
     *
     * - `name`: the codename of your setting.
     * - `displayName`: the name of the setting that will be shown to the user.
     * - `defaultValue`: optional. The default value (defaults to `false`).
     * - `onSave`: optional. A custom save callback.
     * - `onRestore`: optional. A custom restore callback.
     *
     */
    PreferencesAPI.createCheckbox = function (params) {
        if (typeof params !== "object" ||
            !params.hasOwnProperty ("name") ||
            !params.hasOwnProperty ("displayName"))
            throw "Missing 'name' / 'displayName' in the parameters.";
        if (params.hasOwnProperty ("element"))
            throw "User error: please insert a new user (don't use 'element')";
        return $.extend ({
            element:
                $(document.createElement ("label"))
                .append (
                    $(document.createElement ("input")).attr (
                        "type", "checkbox"
                    ).prop ("checked", !!params.defaultValue),
                    " ", params.displayName
                ),
            onSave: function (obj) {
                return obj.element.find ("input").is (":checked");
            },
            onRestore: function (obj, restored) {
                obj.element.find ("input").prop ("checked", restored);
            }
        }, params);
    };
    // Private methods
    // Methods that should not be accessed directly are
    // here.
    /**
     * Called when the section set in the initialization method
     * is loaded by the user. This adds the settings to the DOM
     * and restores the values.
     *
     * @method onHookedSectionLoaded
     * @private
     */
    function onHookedSectionLoaded() {
        // remove prefsApiContainer if it already exists
        if ($("#prefsApiContainer").length)
            $("#prefsApiContainer").remove();
        var pushTo = $(document.createElement("div"))
                     .attr ("id", "prefsApiContainer")
                     .insertAfter ($("#content form"));
        pushTo = $(document.createElement("hr")).appendTo (pushTo);
        for (var i = 0; i < _settings.length; i++)
        {
            if (typeof _settings[i] !== "object") continue;
            var realSettings = [];
            if (_settings[i].hasOwnProperty ("groupName") &&
                _settings[i].hasOwnProperty ("groupSettings") &&
                Array.isArray (_settings[i].groupSettings))
            {
                // we are dealing with a group.
                // 
                pushTo =
                    $(document.createElement("div"))
                    .addClass ("group-container")
                    .append (
                        $(document.createElement ("span")).text ("[-]"),
                        " ",
                        $(document.createElement ("span")).text (
                            _settings[i].groupName
                        ),
                        $(document.createElement ("div")).click (function (e) {
                            e.stopPropagation();
                        })
                    )
                    .css ("cursor", "pointer")
                    .click (function() {
                        var $status  = $(this).find ("span").eq (0),
                            $context = $(this).find ("div").eq (0).stop();
                        $context.slideToggle();
                        $status.text (
                            $status.text() === "[-]" ? "[+]" : "[-]"
                        );
                    })
                    .insertAfter (pushTo);
                // because I'm a f*g
                var _textContainers = pushTo.find ("span");
                // yes.
                pushTo.find ("div").css (
                    "marginLeft",
                    _textContainers.eq (1).offset().left -
                        _textContainers.eq (0).offset().left
                );
                realSettings = _settings[i].groupSettings;
            }
            else
                realSettings = [ _settings[i] ];
            for (var j = 0; j < realSettings.length; j++)
            {
                var sobj = realSettings[j], elm;
                if (sobj.hasOwnProperty ("display") && !sobj.display)
                    continue;
                if (_storage[_usrNs].hasOwnProperty (sobj.name))
                    sobj.onRestore (
                        sobj,
                        _storage[_usrNs][sobj.name]
                    );
                elm =
                    $(document.createElement("div"))
                    .attr ("id", sobj.name) // just for nerdy aesthetics
                    .append (sobj.element);
                if (pushTo.hasClass ("group-container"))
                    pushTo.find ("div").eq (0).append (elm);
                else
                    pushTo = elm.insertAfter (pushTo);
                console.log ("PrefsAPI: registered: %s", sobj.name);
            }
        }
        if (_settings.length > 0)
        {
            pushTo = $(document.createElement("input")).attr ({
                type: "button",
                value: (
                    (
                        "CustomLangsAPI" in window &&
                        CustomLangsAPI.getFirstAvailMatch ("SAVE")
                    ) || "Save"
                )
            }).click (onSaveBtnClicked).insertAfter (pushTo);
            $(document.createElement("span"))
                .attr ("id", "prefsApiStatus")
                .insertAfter (pushTo);
        }
        _hooked = true;
    }
    /**
     * Called when the user clicks on the `Save` button.
     * Creates a copy of the storage, calls the `onSave` function
     * on each object and then saves everything to `localStorage`.
     * Calls the save callback if available.
     *
     * @method onSaveBtnClicked
     * @private
     */
    function onSaveBtnClicked() {
        var storageCopy = {};
        $.extend (storageCopy, _storage);
        for (var i = 0; i < _settings.length; i++)
        {
            var realSettings = [];
            if (_settings[i].hasOwnProperty ("groupName") &&
                _settings[i].hasOwnProperty ("groupSettings") &&
                Array.isArray (_settings[i].groupSettings))
                realSettings = _settings[i].groupSettings;
            else
                realSettings = [ _settings[i] ];
            for (var j = 0; j < realSettings.length; j++)
            {
                if (realSettings[j].hasOwnProperty ("display") &&
                    !realSettings[j].display)
                    continue;
                try
                {
                    storageCopy[_usrNs][realSettings[j].name] =
                        realSettings[j].onSave (realSettings[j]);
                }
                catch (e)
                {
                    setStatus (
                        (
                            (
                                "CustomLangsAPI" in window &&
                                CustomLangsAPI.getFirstAvailMatch (
                                    "INVALID_VAL"
                                )
                            ) || "The value of '%' is invalid: "
                        ).replace ("%", realSettings[j].name) + e,
                        false
                    );
                    return;
                }
            }
        }
        _storage = storageCopy;
        localStorage.setItem ("prefsAPI", JSON.stringify (_storage));
        console.log ("PrefsAPI: the settings were saved correctly.");
        setStatus ("OK", true);
        if (typeof _saveCallback === 'function')
            _saveCallback();
    }
    /**
     * Sets the save status of the preferences.
     *
     * @method setStatus
     * @param {String} msg The message.
     * @param {Boolean} isSuccess True if the saving succeeded (displays
     * a greenish color) or false if it didn't. (displays a red color)
     * @private
     */
    function setStatus (msg, isSuccess) {
        $("#prefsApiStatus")
            .css ("color", isSuccess ? "lime" : "red")
            .text (" " + msg);
    }
}(window.PreferencesAPI = window.PreferencesAPI || {}));

/**
 * Allows the usage of custom language files (in JSON)
 * with a simple and effective asynchronous interface.
 *
 * @class CustomLangsAPI
 * @static
 */
(function (CustomLangsAPI) {
    var _tplNo     = "0",
        _currLang  = "en",
        _langFiles = {},
        _callback;

    /**
     * Inits the CustomLangsAPI interface.
     *
     * @method init
     * @param {String} langFiles* A list of strings containing the filenames
     * of the languages to load (excluding the `.json` extension).
     * @param {Function} cb The callback which will be called once the
     * language files are loaded.
     */
    CustomLangsAPI.init = function() {
        var alreadyInitialized = Object.keys (_langFiles).length > 0;
        for (var i = 0; i < arguments.length; i++)
        {
            if (typeof arguments[i] === "function")
            {
                if (alreadyInitialized)
                    return arguments[i]();
                _callback = arguments[i];
                continue;
            }
            if (!_langFiles.hasOwnProperty (arguments[i]))
                _langFiles[arguments[i]] = {};
        }
        retrieveTemplateNumber(); // sync
        // cache system
        // register a global AJAX handler if necessary: it clears the
        // cache when the user changes language.
        if (document.location.pathname === "/preferences.php")
            $(document).ajaxComplete (function (evt, xhr, settings) {
                if (settings.url==="/pages/preferences/language.html.json.php")
                    CustomLangsAPI.clearCache();
            });
        if (localStorage.getItem ("langsApiCache") != null)
        {
            var cache = JSON.parse (localStorage.getItem ("langsApiCache"));
            if (typeof cache === "object" &&
                cache.hasOwnProperty ("updated") &&
                cache.hasOwnProperty ("tpl-" + _tplNo) &&
                typeof cache.updated === "number" &&
                typeof cache["tpl-" + _tplNo] === "object" &&
                (Date.now() - cache.updated) < 21600000) // 6 hours
            {
                console.log ("LangsAPI: restored languages from the cache");
                $.extend (_langFiles, cache["tpl-" + _tplNo]);
                if (_callback) _callback();
                return;
            }
            else
                CustomLangsAPI.clearCache();
        }
        retrieveCurrentLanguage(); // async, requires an AJAX request
        console.log (
            "LangsAPI: loading %d langfile(s)",
            arguments.length - (_callback ? 1 : 0)
        );
    };
    /**
     * Gets the translated strings for a given `name`,
     * if available. (if not, an empty object)
     *
     * @method getLang
     * @param {String} name The name of your language file.
     * @return {Object} The translated strings for `name` if available, or
     * an empty object.
     */
    CustomLangsAPI.getLang = function (name) {
        return _langFiles[name] || {};
    };
    /**
     * Retrieves the first available match for a given `key`.
     * Useful when you do not have a specified `name`.
     *
     * @method getFirstAvailMatch
     * @param {String} key The key which should be find in our lang objects.
     * @param {Object} [defaultValue=undefined] The value which should be
     * returned if the `key` is not found.
     * @return {Object} The translated `key`, if found, or `defaultValue`.
     */
    CustomLangsAPI.getFirstAvailMatch = function (key, defaultValue) {
        for (var lname in _langFiles)
        {
            if (typeof _langFiles[lname] === "object" &&
                _langFiles[lname].hasOwnProperty (key))
                return _langFiles[lname][key];
        }
        return defaultValue;
    };
    /**
     * Clears the internal language cache, which is used to restore
     * language data from localStorage instead of requesting it every time.
     *
     * @method clearCache
     */
    CustomLangsAPI.clearCache = function() {
        localStorage.removeItem ("langsApiCache");
    };
    // Private methods
    /**
     * Retrieves the current template number.
     *
     * @method retrieveTemplateNumber
     * @private
     */
    function retrieveTemplateNumber() {
        $("link").each (function() {
            var res = /^\/tpl\/(\d+)\//.exec ($(this).attr ("href"));
            if (res !== null)
            {
                _tplNo = res[1];
                console.log ("LangsAPI: templateNumber is %d", _tplNo);
                return;
            }
        });
    }
    /**
     * Retrieves the board language used by the user, by performing
     * an AJAX request on the language preferences page.
     *
     * __NOTE__: this implementation is not portable between templates
     * and should be improved once a global and safe solution comes out.
     *
     * @method retrieveCurrentLanguage
     * @private
     */
    function retrieveCurrentLanguage() {
        // the ?api is used to avoid the triggering of the global
        // AJAX handler in the PreferencesAPI
        $.get ("/pages/preferences/language.html.php?api", function (res) {
            var lang = $(res).find ("#boardfrm option:selected");
            if (lang.length)
            {
                _currLang = lang.val();
                console.log ("LangsAPI: currentLanguage is %s", _currLang);
            }
        }).fail (function() {
            console.error (
                "LangsAPI: can't retrieve currentLanguage. Defaulting to %s",
                _currLang
            );
        }).always (loadLanguages);
    }
    /**
     * Loads the language from the remote server from the path
     * `/tpl/$num/langs/$lang/json/$name.json`. Calls the
     * `callback` set in the initialization function if available.
     *
     * @method loadLanguages
     * @private
     */
    function loadLanguages() {
        var cache = {}; cache["tpl-" + _tplNo] = {};
        for (var lname in _langFiles)
        {
            console.log ("LangsAPI: %s: loading", lname);
            $.get (
                "/tpl/"   + _tplNo +
                "/langs/" + _currLang +
                "/json/"  + lname + ".json",
                null, null, "json"
            ).done (function (res) {
                if (typeof res !== "object")
                {
                    console.error (
                        "LangsAPI: %s: server didn't send us JSON: %s",
                        lname, res
                    );
                    return;
                }
                // Object.keys is only implemented in >=IE9 but
                // hell, who cares
                console.log (
                    "LangsAPI: %s: loaded %d record(s)",
                    lname, Object.keys (res).length
                );
                _langFiles[lname] = res;
                // store in the cache
                cache["updated"] = Date.now();
                cache["tpl-" + _tplNo][lname] = res;
                localStorage.setItem ("langsApiCache", JSON.stringify (cache));
                _callback (lname);
            }).fail (function() {
                console.error (
                    "LangsAPI: %s: can't load %s.json",
                    lname, lname
                );
            });
        }
    }
}(window.CustomLangsAPI = window.CustomLangsAPI || {}));

var ProTheme = {
    bbCodes: {
        list: [
            "user", "project", "img", "b", "cur", "small", "big", "del", "u",
            "gist", "youtube", "yt",  "m", "math","quote", "spoiler", "url",
            "video", "twitter", "music",
            { name: "url=", hasParam: true, useQuotes: true, paramDesc: "url"},
            { name: "code", hasParam: true, paramDesc: "lang" },
            { name: "wiki", hasParam: true, paramDesc: "lang" },
            { name: "quote=", hasParam: true },
            { name: "spoiler=", hasParam: true, paramDesc: "label" },
            { name: "hr", isEmpty: true }
        ],
        byName: function (search) {
            for (var i = 0; i < this.list.length; i++)
            {
                if ((typeof this.list[i] === 'object' &&
                    this.list[i].name === search) || this.list[i] === search)
                    return this.list[i];
            }
            return null;
        },
        getNames: function() {
            var ret = [];
            for (var i = 0; i < this.list.length; i++)
            {
                ret.push (typeof this.list[i] === 'object' ?
                    this.list[i].name : this.list[i]);
            }
            return ret;
        }
    },
    onLoad: function() {
        PreferencesAPI.init ("protheme", "themes", function() {
            // check if our querystring has _ptHttps.
            if (document.location.search.indexOf ("_ptHttps=") !== -1)
            {
                var rxp = /_ptHttps=(whatever|https?)/.exec (
                    document.location.search
                );
                if (rxp != null)
                {
                    PreferencesAPI.setValue ("preferred-protocol", rxp[1]);
                    var scroto = document.location.protocol.slice (0, -1),
                        proto;
                    // if we have 'whatever' as the value, it's better to
                    // redirect back to the other protocol (the user may
                    // be annoyed otherwise)
                    if (rxp[1] === "whatever" || rxp[1] !== scroto)
                    {
                        proto = rxp[1] === "whatever"
                                ? (scroto === "http"
                                    ? "https"
                                    : "http")
                                : rxp[1];
                    }
                    else
                        proto = scroto;
                    document.location.href =
                            proto + "://" + document.location.host
                            + "/preferences.php#s-themes";
                }
            }
            CustomLangsAPI.init ("protheme", function() {
                // contains the key/value mappings of protheme.json
                var lang, enableBlackOverlay, blackOverlayOpacity, topBarFixed,
                    enableAutoCompletion, preferredProtocol,
                    enableDesktopNotifications, enableMarkdown;
                lang = CustomLangsAPI.getLang ("protheme");
                // Enable black overlay
                // boolean / checkbox
                enableBlackOverlay = PreferencesAPI.createCheckbox ({
                    name: "blackoverlay-enabled",
                    displayName: lang.BLACK_OVERLAY_ENABLE
                });
                // Black overlay opacity
                // double / inputbox (0 <= val <= 1)
                blackOverlayOpacity = {
                    name: "blackoverlay-opacity",
                    element:
                        $(document.createElement("label"))
                        .append (lang.BLACK_OVERLAY_OPACITY,
                            $(document.createElement("input"))
                            .attr ("type", "text").val ("0.25")
                        ),
                    onSave: function (obj) {
                        var text = obj.element.find ("input").val();
                        if (!/^\d+(?:\.\d+)?$/.test (text) ||
                            parseFloat (text) > 1)
                            throw lang.INVALID_OPACITY;
                        return obj.element.find ("input").val();
                    },
                    onRestore: function (obj, restored) {
                        obj.element.find ("input").val (restored);
                    }
                };
                // Fixed top bar
                // boolean / checkbox
                topBarFixed = PreferencesAPI.createCheckbox ({
                    name: "fixed-top-bar",
                    displayName: lang.TOP_BAR_FIXED,
                    defaultValue: true
                });
                // Autocompletion (using At.js)
                // boolean / checkbox
                enableAutoCompletion = PreferencesAPI.createCheckbox ({
                    name: "auto-completion-bb",
                    displayName: lang.ENABLE_AUTO_COMPLETION,
                    defaultValue: true
                });
                // Preferred protocol
                // string / combobox (whatever, http, https)
                preferredProtocol = {
                    name: "preferred-protocol",
                    element:
                        $(document.createElement ("label"))
                        .append (lang.PREFERRED_PROTOCOL, ": ",
                            $(document.createElement("select"))
                            .append (
                                $(document.createElement("option"))
                                .text (lang.NO_PREFERENCE)
                                .val ("whatever"),
                                $(document.createElement("option"))
                                .text (lang.ALWAYS_USE_HTTP)
                                .val ("http"),
                                $(document.createElement("option"))
                                .text (lang.ALWAYS_USE_HTTPS)
                                .val ("https")
                            )
                            .change (function() {
                                // hack to avoid messing with the location
                                // unnecessarily
                                $(this).data ("has-changed", true);
                            })
                        ),
                    onSave: function (obj) {
                        var val = obj.element.find ("option:selected").val();
                        if (obj.element.find ("select").data ("has-changed"))
                            setTimeout (function() {
                                // TODO: we are doing this hack because
                                // localStorage is not shared between HTTP
                                // and HTTPS sessions. However, we should do
                                // this with the whole settings, otherwise they
                                // will be desynced.
                                document.location.href = 
                                    (document.location.protocol === 'https:'
                                        ? 'http'
                                        : 'https')
                                    + "://" + document.location.host
                                    + "/preferences.php?_ptHttps=" + val;
                            }, 500);
                        return val;
                    },
                    onRestore: function (obj, restored) {
                        obj.element.find ('option[value="' + restored + '"]')
                            .prop ('selected', true);
                    }
                };
                // Enable desktop notifications
                // boolean / checkbox
                enableDesktopNotifications = PreferencesAPI.createCheckbox ({
                    name: "desktop-notifications",
                    displayName: lang.ENABLE_DESKTOP_NOTIFICATIONS,
                    onSave: function (obj) {
                        if (!obj.element.find ("input").is (":checked"))
                        {
                            $(document).off ("ajaxSuccess.ptheme");
                            return false;
                        }
                        else if (Notification.permission === "granted")
                            return true;
                        else/* if (Notification.permission !== "denied")*/
                            Notification.requestPermission (function (perm) {
                                if (!('permission' in Notification))
                                    Notification.permission = perm;
                                if (perm === "granted")
                                {
                                    PreferencesAPI.setValue (
                                        "desktop-notifications",
                                        true
                                    );
                                    ProTheme.configureNotifications();
                                }
                            });
                        return false;
                    },
                    display: ("Notification" in window)
                });
                // Enable markdown support
                // boolean / checkbox
                enableMarkdown = PreferencesAPI.createCheckbox ({
                    name: "enable-markdown",
                    displayName: lang.ENABLE_MARKDOWN_SUPPORT
                });
                PreferencesAPI.addSettings (
                    {
                        groupName: lang.BLACK_OVERLAY,
                        groupSettings: [
                            enableBlackOverlay, blackOverlayOpacity
                        ]
                    },
                    {
                        groupName: lang.FEATURES,
                        groupSettings: [
                            enableAutoCompletion, enableDesktopNotifications,
                            enableMarkdown
                        ]
                    },
                    {
                        groupName: lang.MISCELLANEOUS,
                        groupSettings: [
                            topBarFixed, preferredProtocol
                        ]
                    }
                );
            });
        });
        PreferencesAPI.setOnSaveCallback (ProTheme.restorePreferences);
        // and now apply the real preferences
        ProTheme.restorePreferences (true);
        // fix the protocol if necessary
        if (document.location.search.indexOf ("_ptHttps") === -1)
        {
            var proto = PreferencesAPI.getValue ("preferred-protocol",
                "whatever");
            if (proto !== "whatever" &&
                document.location.protocol !== (proto + ":"))
            {
                // MAGIC!
                document.write ('<script type="text/undefined">');
                document.location.href =
                    proto + "://" + document.location.host
                    + document.location.pathname
                    + document.location.search
                    + document.location.hash;
            }
        }
    },
    // the boolean flag is used to avoid setting unnecessary CSS rules
    // while not refreshing
    restorePreferences: function (normal_restore) {
        // black overlay stuff
        if ($("#center_col").length)
        {
            var center_col_css = {
                padding: 0,
                backgroundColor: "transparent",
                boxShadow: "none"
            };
            if (PreferencesAPI.getValue ("blackoverlay-enabled", false))
            {
                var opa = PreferencesAPI.getValue (
                    "blackoverlay-opacity", "0.25"
                );
                center_col_css = {
                    padding: "4px",
                    backgroundColor: "rgba(0,0,0," + opa + ")",
                    boxShadow: "0px 2px 3px #414141"
                };
            }
            if (center_col_css.padding != 0 || !normal_restore)
                $("#center_col").css (center_col_css);
        }
        // fixed top bar
        var fixed_css = {
            site_title: {
                position: "static"
            },
            body: {
                marginTop: 0
            },
            single_comment: {
                paddingTop: 0,
                marginTop: 0
            }
        };
        if (PreferencesAPI.getValue ("fixed-top-bar", true))
        {
            fixed_css.site_title.position       = "fixed",
            fixed_css.body.marginTop            = "55px",
            fixed_css.single_comment.paddingTop = "55px",
            fixed_css.single_comment.marginTop  = "-55px";
        }
        if (fixed_css.body.marginTop != 0 || !normal_restore)
        {
            $("body")
                .css  (fixed_css.body)
                .find ("#site_title")
                .css  (fixed_css.site_title);
            if ("$singleCommentStyleTag" in ProTheme)
                ProTheme.$singleCommentStyleTag.remove();
            ProTheme.$singleCommentStyleTag = $(
                "<style type='text/css'>.singlecomment { margin-top: " +
                fixed_css.single_comment.marginTop + "; padding-top: " +
                fixed_css.single_comment.paddingTop + "; }</style>"
            ).appendTo ("head");
        }
        // markdown support
        if (PreferencesAPI.getValue ("enable-markdown", false) &&
            !$("script[src$='showdown.min.js']").length)
        {
            $("head").append (
                $(document.createElement ("script")).attr ({
                    type: "application/javascript",
                    src:  "//cdn.rawgit.com/alfateam123/md2bbc/master" +
                          "/src/showdown.min.js"
                })
            );
            $("body").on ("click", "input[type=submit]", function() {
                if (typeof Showdown !== "object") return;
                var converter = new Showdown.converter ({
                    multiline_quoting: true,
                    check_quotes_into_lists: true,
                    recognize_bbcode: true
                });
                $(".bbcode-enabled").each (function() {
                    var $me = $(this);
                    $me.val (converter.makeBBCode ($me.val()));
                });
            });
        }
        // autocompletion
        if (PreferencesAPI.getValue ("auto-completion-bb", true) &&
            !$("script[src$='at.js']").length)
        {
            $("head").append (
                $(document.createElement ("script")).attr ({
                    type: "application/javascript",
                    src:  "//cdn.jsdelivr.net/g/caret.js,at.js"
                })
            );
            $("body").on ("focus", ".bbcode-enabled", function() {
                var $me = $(this), next_offset = [], old_len = 0,
                    fired = false;
                if ($me.data ("ac-enabled")) return;
                $me.data ("ac-enabled", true);
                $me.atwho ({
                    at: "[",
                    tpl: "8=======D",
                    data: ProTheme.bbCodes.getNames(),
                    start_with_space: false,
                    callbacks: {
                        before_insert: function (val, $li) {
                            var bbcode = ProTheme.bbCodes
                                .byName ($li.data ('value')), what, indch;
                            if (typeof bbcode !== 'object')
                                what  = '[' + bbcode + '][/' + bbcode + ']',
                                indch = "]";
                            else
                            {
                                var name = bbcode.name.replace (/=$/, "");
                                what = '[' + name;
                                if (bbcode.hasParam)
                                    what += "=" +(bbcode.useQuotes ? '""': ""),
                                    indch = bbcode.useQuotes ? '"' : "=";
                                else
                                    indch = "]";
                                what += "]";
                                if (!bbcode.isEmpty)
                                    what += "[/" + name + "]";
                            }
                            $li.data ("index", indch).data ("final", what);
                            return what;
                        },
                        tpl_eval: function (tpl, map) {
                            var base = "<li data-value='" + map["name"] + "'>",
                                bbcode = ProTheme.bbCodes.byName (map["name"]),
                                isObj  = typeof bbcode === 'object';
                            map["name"] = map["name"].replace (/=$/, "");
                            base += "[" + map["name"];
                            if (isObj && bbcode.hasParam)
                                base += "=" +
                                    (bbcode.paramDesc ?
                                     bbcode.paramDesc : "...");
                            base += "]";
                            if (!isObj || !bbcode.isEmpty)
                                base += "...[/" + map["name"] + "]";
                            return base + "</li>";
                        },
                        highlighter: function (li, query) {
                            if (!query)
                                return li;
                            return li.replace (
                                new RegExp (">(.+?)(" + query.replace (
                                    /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"
                                ) + ")", "gi"),
                                function (s, $1, $2) {
                                    if ($1 === "[")
                                    {
                                        $1 = "";
                                        $2 = "[" + $2;
                                    }
                                    return ">" + $1 +
                                        "<strong>" + $2 + "</strong>";
                                });
                        },
                        matcher: function (flag, subtext) {
                            var match;
                            match = /\[([A-Za-z0-9_+-=\]]*)$/gi.exec (subtext);
                            if (match)
                                return match[1];
                            return null;
                        }
                    }
                }).on ("inserted.atwho", function (e, $li) {
                    var str = $li.data ("final"), $me = $(this),
                        pos = $me.caret ("pos"), v = $me.val(), index;
                    // remove the trailing space from the textbox
                    $me.val (v.substr (0, pos - 1) + v.substr (pos));
                    index = str.indexOf ($li.data ("index")),
                    next_offset = pos - str.length;
                    if ($li.data ("index") !== "]")
                        next_offset += str.indexOf ("]");
                    else
                        next_offset += str.indexOf ("]", index + 1);
                    old_len = $(this).val().length;
                    if (index === -1) return console.error ("index = -1 :(");
                    $(this).caret ("pos", pos - str.length + index);
                    fired = true;
                }).on ("keydown", function (e) {
                    if (fired)
                    {
                        fired = false;
                        return;
                    }
                    if (next_offset !== -1 && e.which === 9)
                    {
                        e.preventDefault();
                        $(this).caret ("pos", next_offset);
                        next_offset = -1, old_len = 0;
                    }
                }).on ("keyup", function() {
                    if (next_offset !== -1)
                    {
                        var $me = $(this), curr = $me.val().length,
                            delta = curr - old_len;
                        old_len = curr;
                        next_offset += delta;
                        if ($me.caret ("pos") >= next_offset)
                            next_offset = -1, old_len = 0;
                    }
                });
            });
        }
        // desktop notifications 
        ProTheme.configureNotifications();
    },
    configureNotifications: function() {
        if (!PreferencesAPI.getValue ("desktop-notifications", false) ||
            !("Notification" in window))
            return;
        if (Notification.permission !== "granted")
        {
            PreferencesAPI.setValue ("desktop-notifications", false);
            return;
        }
        // register the global ajax handler to intercept notifications and PMs
        CustomLangsAPI.init ("protheme", function() {
            console.log ("registering global ajax handler for notifications");
            var hasNotified   = 0,
                hasNotifiedPM = 0,
                lang          = CustomLangsAPI.getLang ("protheme");
            $(document)
                .off ("ajaxSuccess.ptheme")
                .on ("ajaxSuccess.ptheme", function (evt, xhr, sett) {
                switch (sett.url)
                {
                    case "/pages/profile/notify.json.php":
                    case "/pages/pm/notify.json.php":
                        var isPM  = sett.url === "/pages/pm/notify.json.php",
                            count = (
                                "responseJSON" in xhr &&
                                "message"      in xhr.responseJSON
                            ) ? parseInt (xhr.responseJSON.message) : 0;
                        if (count > 0)
                        {
                            if ((isPM  && hasNotifiedPM === count) ||
                                (!isPM && hasNotified   === count))
                                return; 
                            new Notification ("NERDZ", {
                                body: ProTheme.parseMultiLocalization (
                                    isPM ?
                                    lang.NEW_PMS :
                                    lang.NEW_NOTIFICATIONS,
                                    count
                                ),
                                icon: document.location.protocol + "//" +
                                      document.location.host +
                                      "/static/images/winicon.png"
                            }).addEventListener ("click", function() {
                                if (isPM)
                                    $("#gotopm").click();
                                else
                                    $("#notifycounter").click();
                            });
                            if (isPM) hasNotifiedPM = count;
                            else hasNotified = count;
                        }
                    break;
                    case "/pages/profile/notify.html.php":
                        hasNotified = 0;
                    break;
                }
            });
        });
    },
    parseMultiLocalization: function (message, count) {
        message = message.replace ("%", count);
        var matches = message.match (/\[.+?\]/g);
        if (matches == null) return message;
        for (var i = 0; i < matches.length; i++)
        {
            var arr = matches[i].slice (1, -1).split ("|", 2), res;
            message = message.replace (matches[i],
                count === 1 ? arr.length < 2 ? "" : arr[0] : arr[1] || arr[0]);
        }
        return message;
    }
};

$(document).ready (ProTheme.onLoad);