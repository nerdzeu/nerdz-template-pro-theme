// ProTheme Javascript file
// Handles protheme related stuff, like the preferences.
// The theme will perfectly work without this file, but you won't
// be able to configure it. You will need to remove this from the
// template.values too.

var ProTheme = {
    PreferencesAPI: {
        settings: [],
        storage: {},
        masterKey: "",
        REJECTED: ":::___err___:::",
        hook: function (thId, onPrefLoaded) {
            if (document.location.pathname == "/preferences.php")
            {
                onPrefLoaded();
                $(document).ajaxComplete (function (evt, xhr, settings) {
                    if (settings.url ==
                        "/pages/preferences/" + thId + ".html.php")
                        ProTheme.PreferencesAPI._onHookedSectionLoaded();
                });
            }
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
            var storage = this.storage, // shorthand
                pushTo = $("#content form");
            pushTo.append("<hr>");
            for (var i = 0; i < this.settings.length; i++)
            {
                if (typeof this.settings[i] !== "object") continue;
                if (storage[this.masterKey]
                    .hasOwnProperty (this.settings[i].name)) {
                    this.settings[i].onRestore (this.settings[i].element,
                        storage[this.masterKey][this.settings[i].name]);
                }
                pushTo = this.settings[i].element
                    .append ("<br>").insertAfter (pushTo);
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
    /*CustomLangsAPI: {
        templateNumber: "0",
        //loadLanguageFile: function(langFileName)
        _retrieveTemplateNumber: function() {
            $("link").each (function() {
                var res = /^\/tpl\/(\d+)\//.exec ($(this).attr ("href"));
                if (res !== null)
                {
                    ProTheme.CustomLangsAPI.templateNumber = res[1];
                    return;
                }
            });
        }
    },*/
    onLoad: function() {
        //ProTheme.CustomLangsAPI.retrieveTemplateNumber();
        ProTheme.PreferencesAPI.load ("protheme");
        ProTheme.PreferencesAPI.hook ("themes", function() {
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
        });
        // and now apply the real preferences
        ProTheme.restorePreferences();
    },
    restorePreferences: function(_refresh) {
        if (ProTheme.PreferencesAPI.getValue ("blackoverlay-enabled", true) &&
            $("#center_col").length)
        {
            var opa = ProTheme.PreferencesAPI.getValue("blackoverlay-opacity");
            if (typeof opa !== "string")
                opa = "0.25";
            $("#center_col").css ({
                padding: "4px",
                backgroundColor: "rgba(0,0,0," + opa + ")",
                boxShadow: "0px 2px 3px #414141"
            });
        }
        else if (_refresh && $("#center_col").length) {
            $("#center_col").css ({
                padding: 0,
                backgroundColor: "transparent",
                boxShadow: "none"
            });
        }
    }
};

$(document).ready (ProTheme.onLoad);