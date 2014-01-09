$(document).ready(function() {
    //tutti gli eventi ajax che evvengono in plist sono nel formato pilst.on(evento,[selettore],function(...){...});
    var plist = $("#postlist");
    var loading = N.getLangData().LOADING;
    var lang = null; /* globale dato che la uso anche altrove */
    var load = false; //gestisce i caricamenti ed evita sovrapposizioni. Dichiarata qui che è il foglio che viene incluso di default ovunque e per primo
    plist.html('<h1>'+loading+'...</h1>');

    var fixHeights = function() {
        plist.find(".nerdz_message").each (function() {
            var el = $(this).find('div:first');
            // TODO: switch from attr('data-parsed') to data('parsed')
            if ((el.height() >= 200 || el.find ('.gistLoad').length > 0) && !el.attr('data-parsed'))
            {
                el.data ('real-height', el.height()).addClass ("compressed");
                var n = el.next();
                n.prepend ('<p class="more">&gt;&gt; ' + N.getLangData().EXPAND + ' &lt;&lt;</p>'); // Spaces master race.
            }
            el.attr('data-parsed','1');
        });
    };

    var onRemoveHiddenPost = function() {
        var me = $(this), target = me.data ("target"), lv = localStorage.getItem ("hid").split ("|"), serialized = "";
        $("#" + target).slideToggle (function() {
            $(this).find (".img_frame > img").each (function() {
                $(this).css ("margin-top", (117 - $(this).height()) / 2);
            });
        });
        me.parent().remove();
        for (var zxcvbn in lv)
            if (lv[zxcvbn] != target)
                serialized += lv[zxcvbn] + "|";
        if (serialized != "")
            localStorage.setItem ("hid", serialized.slice (0, -1));
        else
        {
            localStorage.removeItem ("hid");
            $("#hp-cnt").remove();
            $("#hp-title").remove();
        }
    };

    var hideHidden = function() {
        var hidden = localStorage.getItem ("hid");
        if (hidden != null)
        {
            var pids = hidden.split ("|").sort().reverse(), len = pids.length;
            while (len--)
            {
                var post = plist.find ("#" + pids[len]);
                if (post.length)
                {
                    post.hide();
                    var pLink = window[pids[len].replace (/post/, "lnk")];
                    pids[len] = $(document.createElement("li"))
                        .append ($(document.createElement("a")).attr ("href", pLink).text (decodeURIComponent (pLink.substr (1))))
                        .append ($(document.createElement("a")).data ("target", pids[len]).css ("float", "right").html ("X").click (onRemoveHiddenPost));
                }
                else
                    pids.splice (len, 1);
            }
            if (pids.length)
            {
                if (!$("#hp-cnt").length)
                {
                    // create the hidden posts box
                    $(document.createElement("div")).addClass ("title").click (function() {
                        $("#hp-cnt").slideToggle();
                    }).html (N.getStaticData().lang.HIDDEN_POSTS).attr ("id", "hp-title").appendTo ("#right_col");
                    $(document.createElement("div")).hide().addClass ("box").attr ("id", "hp-cnt")
                        .append ($(document.createElement ("ul")).html (pids)).appendTo ("#right_col");
                }
                else
                    $("#hp-cnt ul").html (pids);
            }
        }
        fixHeights();
    };


    plist.on('click',".spoiler",function(){
      if($(this).data("parsed")) return;
      $.each($(this).find("img"),function(){
        m = (117-$(this).height())/2;
        if (m>1)
          $(this).css("margin-top", m)
      })
      $(this).data("parsed","1");
    });
    
    plist.on('click','.more',function() {
        var me = $(this), par = me.parent(), jenk = par.prev();
        if (me.data ('busy') == 'godyes') return;
        me.data ('busy', 'godyes');
        // obtain the real height of the post and do some hardcore animations
        //jenk.removeClass ("compressed"); var realHeight = jenk.height();
        jenk.animate ({ maxHeight: jenk.data ('real-height') }, 500, function() {
            jenk.removeClass ("compressed").css ("max-height", "none");
            me.slideUp ('slow', function() {
                me.remove();
            });
        });
    });

    plist.on('click',".hide",function() {
        var pid = $(this).data('postid');
        var hidden = localStorage.getItem('hid');
        if(hidden == null) {
            localStorage.setItem('hid',pid);
        }
        else
        {
            hidden += "|"+pid;
            localStorage.setItem('hid',hidden);
        }
        //auto lock
        var lock = $("#post"+pid).find('img.imgunlocked');
        if(lock.length)
        {
            lock.eq(0).click();
        }
        $("#"+pid).slideUp (hideHidden);
    });

    $("#profilePostList").on('click',function() {
        plist.html('<h1>'+loading+'...</h1>');
        $("#fast_nerdz").show();
        $("#nerdzlist").hide();
        $(".selectlang").css('color','');
        localStorage.removeItem("autolang");
        load = false;
        N.html.profile.getHomePostList(0,function(data) {
            plist.html(data);
            plist.data('type','profile');
            plist.data('mode','std');
            hideHidden();
            load = true;
        });
    });
    
    $("#projectPostList").on('click',function() {
        plist.html('<h1>'+loading+'...</h1>');
        $("#fast_nerdz").hide();
        $("#projlist").hide();
        $(".projlang").css('color','');
        load = false;
        N.html.project.getHomePostList(0,function(data) {
            plist.html(data);
            plist.data('type','project');
            plist.data('mode','std');
            hideHidden();
            load = true;
        });
    });

    $("#nerdzselect").on('click',function() {
        $("#nerdzlist").toggle();
    });

    $("#projselect").on('click',function() {
        $("#projlist").toggle();
    });

    $(".selectlang").on('click',function() {
        plist.html('<h1>'+loading+'...</h1>');
        lang = $(this).data('lang');
        localStorage.setItem("autolang",lang);
        $(".selectlang").css('color','');
        $(this).css('color','#2370B6');
        load = false;
        if(lang == 'usersifollow')
        {
            $("#fast_nerdz").show();
            N.html.profile.getFollowedHomePostList(0,function(data) {
                plist.html(data);
                plist.data('type','profile');
                plist.data('mode','followed');
                hideHidden();
                load = true;
            });
        }
        else
        {
            if(lang == '*') {
                $("#fast_nerdz").show();
            }
            else {
                $("#fast_nerdz").hide();
            }

            load = false;
            N.html.profile.getByLangHomePostList(0,lang,function(data) {
                plist.html(data);
                plist.data('mode','language');
                plist.data('type','profile');
                hideHidden();
                load = true;
            });
        }
    });

    $(".projlang").on('click',function() {
        $("#fast_nerdz").hide();
        plist.html('<h1>'+loading+'...</h1>');
        lang = $(this).data('lang');
        $(".projlang").css('color','');
        $(this).css('color','#2370B6');
        load = false;
        if(lang == 'usersifollow')
        {
                N.html.project.getFollowedHomePostList(0,function(data) {
                plist.html(data);
                plist.data('type','project');
                plist.data('mode','followed');
                hideHidden();
                load = true;
            });
        }
        else
        {
            N.html.project.getByLangHomePostList(0,lang,function(data) {
                plist.html(data);
                plist.data('type','project');
                plist.data('mode','language');
                hideHidden();
                load = true;
            });
        }
    });
    
    $("#stdfrm").on('submit',function(e) {
        e.preventDefault();
        $("#pmessage").html(loading+'...');
        N.json.profile.newPost({message: $("#frmtxt").val(), to: 0 },function(data) {
            if(data.status == 'ok') {
                $("#frmtxt").val('');
                load = false;
                if(lang == '*') {
                    N.html.profile.getByLangHomePostList(0,lang,function(data) {
                        plist.html(data);
                        plist.data('type','profile');
                        plist.data('mode','language');
                        hideHidden();
                        load = true;
                    });
                }
                else if(lang == 'usersifollow') {
                    N.html.profile.getFollowedHomePostList(0,function(data) {
                        plist.html(data);
                        plist.data('type','profile');
                        plist.data('mode','followed');
                        hideHidden();
                        load = true;
                    });
                }
                else {
                    $("#profilePostList").click();
                }
            }
            
            $("#pmessage").html(data.message);

            setTimeout(function() {
                        $("#pmessage").html('');
                        },5000);
        });
    });

    //default profile posts
    if(localStorage.getItem("autolang"))
    {
        $("#nerdzselect").click();
        var el = $("#nerdzlist").find("ul").find("[data-lang='"+localStorage.getItem("autolang")+"']");
        el.click();
        el.css('color','#2370B6');
    }
    else
    {
        plist.data('location','home');
        load = false;
        N.html.profile.getHomePostList(0,function(data) {
            plist.html(data);
            hideHidden();
            plist.data('type','profile');
            plist.data('mode','std');
            load = true;
        });
    }

    /* Autoload vecchi post allo scrolldown */
        //questo serve per search, che avendo l'azione iniziale nel file default.js, non condivide la variabile load. Uso sessionStorage per ovviare
    var sl = 'searchLoad'; /*search label */
    sessionStorage.setItem(sl,"0");
    var tmpDivId = "scrtxt";
    var manageScrollResponse = function(data) {
        $("#"+tmpDivId).remove();
        if(data.length > 0) {
            plist.append(data);
            hideHidden();
            load = true;
            sessionStorage.setItem(sl, "0"); // se sono entrato qui, sicuramente non cerco
        }
    };

    var manageScrollSearchResponse = function(data) {
        $("#"+tmpDivId).remove();
        if(data.length > 0) {
            plist.append(data);
            hideHidden();
            sessionStorage.setItem(sl, "1");
            load = false; // se sono entrato qui, sicuramente stavo cercando
        }
    };

    $(window).scroll(function() {
        if($(this).scrollTop()+200 >= ( $(document).height() - $(this).height() ))
        {
            var num = 10; //TODO: numero di posts, parametro?
            var hpid = plist.find("div[id^='post']").last().data('hpid');
            var mode = plist.data('mode');
            var type = plist.data('type');
            var append = '<h3 id="'+tmpDivId+'">'+loading+'...</h3>';

            if((load || ("1" == sessionStorage.getItem(sl))) && !$("#"+tmpDivId).length)
            {
                plist.append(append);
            }

            if(load)
            {
                load = false;
                if(mode == 'std') {
                    N.html[type].getHomePostListBeforeHpid(num,hpid,manageScrollResponse);
                }
                else if(mode == 'followed') {
                    N.html[type].getFollowedHomePostListBeforeHpid(num,hpid,manageScrollResponse);
                }
                else if(mode == 'language') {
                    N.html[type].getByLangHomePostListBeforeHpid(num,lang,hpid, manageScrollResponse);
                }
            }
            //a true ci va in default.js, dopo il primo search
            if(sessionStorage.getItem(sl) == "1")
            {
                sessionStorage.setItem(sl, "0");
                if(type == 'project' && mode == 'search')
                {
                    N.html.search.globalProjectPostsBeforeHpid(num,$("#footersearch input[name=q]").val(), hpid, manageScrollSearchResponse);
                }
                else if(type == 'profile' && mode == 'search')
                {
                    N.html.search.globalProfilePostsBeforeHpid(num, $("#footersearch input[name=q]").val(), hpid, manageScrollSearchResponse);
                }
            }
        }
    });
});
