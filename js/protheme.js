// ProTheme Javascript file
// Handles protheme related stuff, like the preferences.
// The theme will perfectly work without this file, but you won't
// be able to configure it. You will need to remove this from the
// template.values too.

var ProTheme = {
    // set to true when CustomLangsAPI finished
    // the loading of the lang files
    finished: false,
    PreferencesAPI: {
        settings: [],
        storage: {},
        masterKey: "",
        REJECTED: ":::___err___:::",
        currentSection: null,
        hook: function (thId, onPrefLoaded) {
            if (document.location.pathname == "/preferences.php")
            {
                onPrefLoaded();
                $(document).ajaxComplete (function (evt, xhr, settings) {
                    var sec = /^\/pages\/preferences\/(.+?)\.html\.php$/
                        .exec (settings.url);
                    if (sec != null)
                    {
                        ProTheme.PreferencesAPI.currentSection = sec[1];
                        console.log(sec[1]);
                        if (ProTheme.finished && sec[1] === thId)
                            ProTheme.PreferencesAPI._onHookedSectionLoaded();
                    }
                });
            }
        },
        refresh: function (thId)
        {
            if (this.currentSection === thId)
                this._onHookedSectionLoaded();
        },
        addSettings: function() {
            for (var i = 0; i < arguments.length; i++)
                this.settings.push (arguments[i]);
        },
        getValue: function (name, defaultVal) {
            if (this.storage[this.masterKey].hasOwnProperty (name))
                return this.storage[this.masterKey][name];
            return defaultVal;
        },
        load: function (mk) {
            this.masterKey = mk;
            this.storage[this.masterKey] = {};
            if (localStorage.getItem ("prefsAPI") !== null)
            {
                var _storage = JSON.parse (localStorage.getItem ("prefsAPI"));
                if (typeof _storage === 'object' &&
                    typeof _storage[this.masterKey] === 'object')
                    this.storage[this.masterKey] = _storage[this.masterKey];
            }
        },
        _onHookedSectionLoaded: function() {
            // if for whatever reason prefApiContainer
            // is already in the DOM, remove it
            if ($("#prefApiContainer").length)
                $("#prefApiContainer").delete();
            var storage = this.storage, // shorthand
                pushTo = $(document.createElement("div"))
                         .attr ("id", "prefApiContainer")
                         .insertAfter ($("#content form"));
            pushTo = $("<hr>").appendTo (pushTo);
            for (var i = 0; i < this.settings.length; i++)
            {
                if (typeof this.settings[i] !== "object") continue;
                if (storage[this.masterKey]
                    .hasOwnProperty (this.settings[i].name)) {
                    this.settings[i].onRestore (this.settings[i].element,
                        storage[this.masterKey][this.settings[i].name]);
                }
                pushTo = $(document.createElement("div"))
                    .append (this.settings[i].element)
                    .insertAfter (pushTo);
                console.log ("PrefsAPI: registered: %s",this.settings[i].name);
            }
            pushTo = $(document.createElement("input")).attr ({
                type: "button",
                value: "Save"
            }).click (function() {
                ProTheme.PreferencesAPI._onSave();
                ProTheme.restorePreferences(true);
            }).insertAfter (pushTo);
            $(document.createElement("span"))
                .attr ("id", "prefsApiStatus")
                .insertAfter (pushTo);
        },
        _onSave: function() {
            var _storage = this.storage; // copy
            for (var i = 0; i < this.settings.length; i++)
            {
                var saved = this.settings[i].onSave (this.settings[i].element);
                if (saved === this.REJECTED)
                {
                    this._setStatus ("The value of '"
                        + this.settings[i].name
                        + "' is invalid.", false);
                    return;
                }
                this.storage[this.masterKey][this.settings[i].name] = 
                    this.settings[i].onSave (this.settings[i].element);
            }
            console.log ("PrefsAPI: saved %d element(s)", i);
            this.storage = _storage;
            localStorage.setItem ("prefsAPI", JSON.stringify (this.storage));
            this._setStatus ("OK", true);
        },
        _setStatus: function (message, isSuccess) {
            $("#prefsApiStatus")
                .css ("color", isSuccess ? "lime" : "red")
                .text (" " + message);
        }
    },
    CustomLangsAPI: {
        templateNumber: "0",
        currentLanguage: "en",
        lang: {},
        init: function() {
            this._retrieveTemplateNumber();
            var callback;
            for (var i = 0; i < arguments.length; i++)
            {
                if (typeof arguments[i] === "function")
                {
                    callback = arguments[i];
                    continue;
                }
                this.lang[arguments[i]] = {};
            }
            this._retrieveCurrentLanguage (callback);
            console.log ("LangsAPI: loading %d langfile(s)", arguments.length);
        },
        getLang: function (key) {
            return this.lang[key];
        },
        _loadLanguages: function (cb) {
            for (var name in this.lang)
            {
                console.log ("LangsAPI: %s: loading", name);
                $.get (
                    "/tpl/"   + this.templateNumber  +
                    "/langs/" + this.currentLanguage +
                    "/json/"  + name + ".json",
                    null, null, "json"
                ).done (function (res) {
                    if (typeof res !== "object")
                    {
                        console.error (
                            "LangsAPI: %s: server replied %s, and " +
                            "it is not a JSON object.",
                            name, res
                        );
                        return;
                    }
                    console.log (
                        "LangsAPI: %s: loaded %d record(s)",
                        name, Object.keys (res).length
                    );
                    ProTheme.CustomLangsAPI.lang[name] = res;
                }).fail (function() {
                    console.error (
                        "LangsAPI: %s: can't load %s.json.",
                        name, name
                    );
                }).always (cb);
            }
        },
        _retrieveCurrentLanguage: function (cb) {
            $.get ("/pages/preferences/language.html.php?api", function (res) {
                var lang = $(res).find ("#boardfrm option:selected");
                if (lang.length)
                {
                    ProTheme.CustomLangsAPI.currentLanguage = lang.val();
                    console.log("LangsAPI: currentLanguage is %s", lang.val());
                }
            }).fail (function() {
                console.error (
                    "LangsAPI: can't retrieve currentLanguage. " +
                    "Defaulting to %s",
                    ProTheme.CustomLangsAPI.currentLanguage
                );
            }).always (function() {
                ProTheme.CustomLangsAPI._loadLanguages (cb);
            });
        },
        _retrieveTemplateNumber: function() {
            $("link").each (function() {
                var res = /^\/tpl\/(\d+)\//.exec ($(this).attr ("href"));
                if (res !== null)
                {
                    ProTheme.CustomLangsAPI.templateNumber = res[1];
                    console.log("LangsAPI: templateNumber is %d", res[1]);
                    return;
                }
            });
        }
    },
    onLoad: function() {
        ProTheme.PreferencesAPI.load ("protheme");
        ProTheme.PreferencesAPI.hook ("themes", function() {
            ProTheme.CustomLangsAPI.init ("protheme", function() {
                var enableBlackOverlay = $(document.createElement ("label"))
                    .append ($(document.createElement("input")).attr ({
                        type: "checkbox",
                        value: "Enable the semi-transparent black overlay",
                    }).prop ("checked", true))
                    .append ("Enable the semi-transparent black overlay");
                var blackOverlayOpacity = $(document.createElement("label"))
                    .append ("Black overlay opacity: ")
                    .append ($(document.createElement("input"))
                    .attr ("type", "text").val ("0.25"));
                ProTheme.PreferencesAPI.addSettings ({
                    name: "blackoverlay-enabled",
                    element: enableBlackOverlay,
                    onSave: function (elm) {
                        return elm.find ("input").is (":checked");
                    },
                    onRestore: function (elm, restored) {
                        elm.find ("input").attr ("checked", restored);
                    }
                }, {
                    name: "blackoverlay-opacity",
                    element: blackOverlayOpacity,
                    onSave: function (elm) {
                        var text = elm.find ("input").val();
                        if (!/^\d+(?:\.\d+)?$/.test (text) ||
                            parseFloat (text) > 1)
                            return ProTheme.PreferencesAPI.REJECTED;
                        return elm.find ("input").val();
                    },
                    onRestore: function (elm, restored) {
                        elm.find ("input").val (restored);
                    }
                });
                ProTheme.finished = true;
                ProTheme.PreferencesAPI.refresh("themes");
            });
        });
        // and now apply the real preferences
        ProTheme.restorePreferences();
    },
    restorePreferences: function(_refresh) {
        if ($("#center_col").length)
        {
            if (ProTheme.PreferencesAPI.getValue ("blackoverlay-enabled", true))
            {
                var opa = ProTheme.PreferencesAPI.getValue (
                    "blackoverlay-opacity", "0.25"
                );
                $("#center_col").css ({
                    padding: "4px",
                    backgroundColor: "rgba(0,0,0," + opa + ")",
                    boxShadow: "0px 2px 3px #414141"
                });
            }
            else if (_refresh) {
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