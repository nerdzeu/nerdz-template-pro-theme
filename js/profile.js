$(document).ready(function() {
    var loading = N.getLangData().LOADING;

    $("#stdfrm").on('submit',function(event) {
        event.preventDefault();
        var $me = $(this);
        setTimeout (function() {
            $("#pmessage").html (loading+'...');
            N.json.profile.newPost({ message: $("#frmtxt").val(), to: $me.data('to') }, function(data) {
                if(data.status == 'ok') {
                    $("#showpostlist").click();
                    $("#frmtxt").val('');
                }
                $("#pmessage").html(data.message);
                setTimeout(function() {
                    $("#pmessage").html('');
                },5000);
            });
        }, 0);
    });

    var oldPlist = "";
    $("#follow").click(function() {
        var me = $(this);
        me.html('...');
        N.json.profile.follow({id: $(this).data('id')},function(d) {
            me.html(d.message);
            me.off('click');
        });
    });

    $("#unfollow").click(function() {
        var me = $(this);
        me.html('...');
        N.json.profile.unfollow({id: $(this).data('id')},function(d) {
            me.html(d.message);
            me.off('click');
        });
    });

    $("#blacklist").click(function() {
        var me = $(this);
        var plist = $("#postlist");
        oldPlist = plist.html();
        plist.html('<form id="blfrm">Motivation: <textarea style="width:100%; height:60px" class="bbcode-enabled" id="blmot"></textarea><br /><input type="submit" value="Blacklist" /></form>');
        plist.on('submit','#blfrm',function(event) {
            event.preventDefault();
            setTimeout (function() {
                me.html('...');
                N.json.profile.blacklist({
                    id: me.data('id'),
                    motivation: $("#blmot").val()
                },function(d) {
                    me.html(d.message);
                    plist.html(oldPlist);
                    me.off('click');
                });
            }, 0);
        });
    });

    $("#unblacklist").click(function() {
        var me = $(this);
        me.html('...');
        N.json.profile.unblacklist({id: $(this).data('id')},function(d) {
            me.html(d.message);
            me.off('click');
        });
    });

    $("#profilepm").on('click',function() {
        var me = $(this), txt = me.html();
        if(oldPlist === '') {
            me.html('...');
            N.html.pm.getForm(function(data) {
                oldPlist = $("#postlist").html();
                $("#postlist").html(data);
                $("#to").val($("#username").html());
                $("#fast_nerdz").hide();
            });
        }
        else
        {
            me.html(txt);
            $("#fast_nerdz").show();
            $("#postlist").html(oldPlist);
            oldPlist = "";
        }
    });

    $("#postlist").on('submit',"#convfrm",function(e) { //per i pm
        e.preventDefault();
        var $me = $(this);
        setTimeout (function() {
            $("#res").html('...');
            N.json.pm.send({
                tok: $me.data('tok'),
                to: $("#to").val(),
                message: $("#message").val(),
            },function(d) {
                $('#res').html(d.message);
                if(d.status == 'ok') {
                    setTimeout(function() {
                        $("#fast_nerdz").show();
                        $("#postlist").html(oldPlist);
                    },500);
                }
            });
        }, 0);
    });
});
