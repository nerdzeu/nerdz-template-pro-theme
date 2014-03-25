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
    var _settings  = [],    // settings array
        _storage   = {},    // storage object
        _usrNs,             // namespace
        _section,           // current section
        _hookedSec,         // the section requested by the user
        _saveCallback,      // callback set with setOnSaveCallback()
        _hooked    = false; // true if onHookedSectionLoaded has been called

    /**
     * Inits the PreferencesAPI class. You __must__ use this method before
     * any other.
     *
     * @method init
     * @param {String} namespace The master namespace used to store
     * data in localStorage. Please pick an unique, appropriate name.
     * @param {String} sectionId The ID of the section you are going
     * to hook into. Section names can be retrieved from the preferences
     * internal files' name in `/pages/preferences/`.
     * @param {Function} onPrefsLoaded The function which is called if
     * the user is in the preferences page. You __SHOULD__ register any kind
     * of setting here, to avoid unnecessary memory wasting.
     */
    PreferencesAPI.init = function (namespace, sectionId, onPrefsLoaded) {
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
     *       // an element which will be added in the preferences page.
     *       // generic DOM elements and jQuery objects are allowed.
     *       element: ...,
     *       // the following will be called each time the user clicks
     *       // on the 'Save' button. You must perform any kind of data
     *       // sanitization here, and if anything goes wrong you should throw
     *       // an exception with throw "error message".
     *       // Otherwise, if the sanitization succeeds, return the value which
     *       // will be saved and then restored when the page is reloaded.
     *       // The only argument passed is your object, where you can use
     *       // the 'element' attribute to get any value you may need.
     *       onSave: function (object) {},
     *       // the following will be called each time the settings are
     *       // restored from the localStorage. You should restore the element
     *       // in the exact same way it was saved. No sanitization is
     *       // necessary here - if any kind of value screws up, it is not
     *       // our fault.
     *       onRestore: function (object, restoredValue) {}
     *     }
     * 
     * Adding other fields is fine, as long as you don't remove the ones
     * specified in the structure.
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
            if (typeof arguments[i] === 'object')
                _settings.push (arguments[i]);
        if (_hooked && _hookedSec === _section)
            onHookedSectionLoaded();
    };
    /**
     * Retrieves a value from the stored settings.
     * You can specify a default value if it is not defined.
     *
     * @method getSetting
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
        retrieveTemplateNumber(); // sync
        for (var i = 0; i < arguments.length; i++)
        {
            if (typeof arguments[i] === "function")
            {
                _callback = arguments[i];
                continue;
            }
            _langFiles[arguments[i]] = {};
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
            if (typeof _langFiles[lname] !== "object")
                continue;
            if (_langFiles[lname].hasOwnProperty (key))
                return _langFiles[lname][key];
        }
        return defaultValue;
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
            }).fail (function() {
                console.error (
                    "LangsAPI: %s: can't load %s.json",
                    lname, lname
                );
            }).always (_callback);
        }
    }
}(window.CustomLangsAPI = window.CustomLangsAPI || {}));

var ProTheme = {
    onLoad: function() {
        PreferencesAPI.init ("protheme", "themes", function() {
            CustomLangsAPI.init ("protheme", function() {
                var lang = CustomLangsAPI.getLang ("protheme"),
                    enableBlackOverlay = $(document.createElement ("label"))
                        .append ($(document.createElement("input")).attr ({
                            type: "checkbox",
                            value: lang.BLACK_OVERLAY_ENABLE
                        }).prop ("checked", true))
                        .append (lang.BLACK_OVERLAY_ENABLE);
                var blackOverlayOpacity = $(document.createElement("label"))
                    .append (lang.BLACK_OVERLAY_OPACITY)
                    .append ($(document.createElement("input"))
                    .attr ("type", "text").val ("0.25"));
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
                });
            });
        });
        PreferencesAPI.setOnSaveCallback (ProTheme.restorePreferences);
        // and now apply the real preferences
        ProTheme.restorePreferences (true);
    },
    // the boolean flag is used to avoid setting unnecessary CSS rules
    // while not refreshing
    restorePreferences: function (_std) {
        if ($("#center_col").length)
        {
            if (PreferencesAPI.getValue ("blackoverlay-enabled", true))
            {
                var opa = PreferencesAPI.getValue (
                    "blackoverlay-opacity", "0.25"
                );
                $("#center_col").css ({
                    padding: "4px",
                    backgroundColor: "rgba(0,0,0," + opa + ")",
                    boxShadow: "0px 2px 3px #414141"
                });
            }
            else if (!_std) {
                $("#center_col").css ({
                    padding: 0,
                    backgroundColor: "transparent",
                    boxShadow: "none"
                });
            }
        }
    }
};

$(document).ready (ProTheme.onLoad);