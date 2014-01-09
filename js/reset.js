$(document).ready(function() {
    $("#resfrm").submit(function(e) {
        $("#error").html($("#loadtxt").data('loading'));
        e.preventDefault();
        N.json.resetPassword($(this).serialize(),function(d) {
            $("#error").html(d.message);
            N.reloadCaptcha();
            if(d.status == 'ok')
            {
                $("#mait").val('');
            }
        });
    });
});
