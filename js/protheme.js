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
     * about every setting. Any object __must__ have the following structure:
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
     *       // all. This is useful when you need to check if some prerequisites
     *       // are met before showing the option to the user.
     *       // By default it is set to true, and you don't need to include it.
     *       display: true
     *     }
     * 
     * Adding other fields is fine, as long as you don't remove the required
     * ones specified in the structure.
     * Here's a simple example: a checkbox.
     *
     *     {
     *        name: "my-checkbox", // will be saved with this name
     *        element: $(document.createElement ("input"))..., // not covered
     *        onSave: function (obj) {
     *          return obj.element.is (":checked");
     *        },
     *        onRestore: function (obj, value) {
     *          obj.element.prop ("checked", value);
     *        }
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
            if (_storage[_usrNs].hasOwnProperty (_settings[i].name))
                _settings[i].onRestore (
                    _settings[i],
                    _storage[_usrNs][_settings[i].name]
                );
            pushTo = $(document.createElement("div"))
                     .append (_settings[i].element)
                     .insertAfter (pushTo);
            console.log ("PrefsAPI: registered: %s", _settings[i].name);
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
            try
            {
                storageCopy[_usrNs][_settings[i].name] =
                    _settings[i].onSave (_settings[i]);
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
                    ).replace ("%", _settings[i].name) + e,
                    false
                );
                return;
            }
        }
        _storage = storageCopy;
        localStorage.setItem ("prefsAPI", JSON.stringify (_storage));
        console.log ("PrefsAPI: saved %d element(s)", i);
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
    }
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
                // *note: not using the var x, y, ... notation for clarity
                var lang = CustomLangsAPI.getLang ("protheme");
                // Enable black overlay
                // boolean / checkbox
                var enableBlackOverlay =
                    $(document.createElement ("label"))
                    .append (
                        $(document.createElement("input")).attr (
                            "type", "checkbox"
                        ).prop ("checked", true),
                        " ", lang.BLACK_OVERLAY_ENABLE
                    );
                // Black overlay opacity
                // double / inputbox (0 <= val <= 1)
                var blackOverlayOpacity = $(document.createElement("label"))
                    .append (lang.BLACK_OVERLAY_OPACITY,
                        $(document.createElement("input"))
                        .attr ("type", "text").val ("0.25")
                    );
                // Preferred protocol
                // string / combobox (whatever, http, https)
                var preferredProtocol = $(document.createElement ("label"))
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
                    );
                // Enable desktop notifications
                // boolean / checkbox
                var enableDesktopNotifications =
                    $(document.createElement ("label"))
                    .append (
                        $(document.createElement("input")).attr (
                            "type", "checkbox"
                        ), " ",
                        lang.ENABLE_DESKTOP_NOTIFICATIONS
                    );
                PreferencesAPI.addSettings ({
                    name: "blackoverlay-enabled",
                    element: enableBlackOverlay,
                    onSave: function (obj) {
                        return obj.element.find ("input").is (":checked");
                    },
                    onRestore: function (obj, restored) {
                        obj.element.find ("input").attr ("checked", restored);
                    }
                }, {
                    name: "blackoverlay-opacity",
                    element: blackOverlayOpacity,
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
                }, {
                    name: "preferred-protocol",
                    element: preferredProtocol,
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
                }, {
                    name: "desktop-notifications",
                    element: enableDesktopNotifications,
                    onSave: function (obj) {
                        if (!obj.element.find ("input").is (":checked"))
                        {
                            $(document).unbind ("ajaxSuccess.ptheme");
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
                    onRestore: function (obj, restored) {
                        obj.element.find ("input").prop ("checked", restored);
                    },
                    display: ("Notification" in window)
                });
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
        if ($("#center_col").length)
        {
            var center_col_css = {
                padding: 0,
                backgroundColor: "transparent",
                boxShadow: "none"
            };
            if (PreferencesAPI.getValue ("blackoverlay-enabled", true))
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
            $(document).bind ("ajaxSuccess.ptheme", function (evt, xhr, sett) {
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