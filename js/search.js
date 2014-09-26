$(document).ready(function() {
    var load = true;
    var tmpDivId = "scrtxt";
    var qs = $.trim($("#qs").html());
    var plist = $("#postlist");
    var num = 10;

    var type = window.getParameterByName('type'), loc = window.getParameterByName('location'), id = window.getParameterByName('id');
    var manageResponse = function(d) {
        plist.html(d);
        window.fixHeights();
        load = true;
    };

    if(qs !== '') {
        if(type == 'project') {
            if(loc == 'home') {
                N.html.search.globalProjectPosts(num, qs, manageResponse);
            } else if(loc == 'project') {
                N.html.search.specificProjectPosts(num, qs, id, manageResponse);
            }
        } else if(type == 'profile') {
            if(loc == 'home') {
                N.html.search.globalProfilePosts(num, qs, manageResponse);
            } else if(loc == 'profile') {
                N.html.search.specificProfilePosts(num, qs, id, manageResponse);
            }
        } else {
            N.html.search.globalPosts(num, qs, manageResponse);
        }
    } else {
        plist.html(N.getLangData().ERROR);
    }

    // since functions in default.js depends on plist.data('type')
    // but in the search page we got both projects and profiles posts
    // thus we must change the type according to the selected post
    // best hack btw
    plist.on('mouseenter focus', "div[id^='post']", function(e) {
        plist.data('type', /\.(\d+)$/i.test($(this).find('a.post_link').attr('href')) ? 'profile' : 'project');
    });

    plist.on("mouseleave focusout", "div[id^='post']", function(e) {
            plist.data('type','search');
    });

    var manageScrollResponse = function(data) {
        $("#"+tmpDivId).remove();
        if(data.length > 0) {
            plist.append(data);
            window.fixHeights();
            load = true;
        }
    };

    $(window).scroll(function() {
        if($(this).scrollTop()+200 >= ( $(document).height() - $(this).height() ))
        {
            var num = 10;
            var hpid = plist.find("div[id^='post']").last().data('hpid');
            var append = '<h3 id="'+tmpDivId+'">'+N.getLangData().LOADING+'...</h3>';

            if(load && !$("#"+tmpDivId).length)
            {
                plist.append(append);
            }

            if(load) {
                load = false;
                if(type == 'project') {
                    if(loc == 'home') {
                        N.html.search.globalProjectPostsBeforeHpid(num, qs, hpid, manageScrollResponse);
                    } else if(loc == 'project') {
                        N.html.search.specificProjectPostsBeforeHpid(num, qs, id, hpid, manageScrollResponse);
                    }
                } else if(type == 'profile') {
                    if(loc == 'home') {
                        N.html.search.globalProfilePostsBeforeHpid(num, qs, hpid, manageScrollResponse);
                    } else if(loc == 'profile') {
                        N.html.search.specificProfilePostsBeforeHpid(num, qs, id, hpid, manageScrollResponse);
                    }
                } else {
                    N.html.search.globalPostsBeforeHpid(num, qs, hpid, manageScrollResponse);
                }
            }
        }
    });

});
