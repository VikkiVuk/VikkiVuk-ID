function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

$(document).ready(function() {
    $("#submit").click(function(){
        const password = $("#password").val()
        const confirmpass = $("#confirmpassword").val()
        if (password.length <= 0 || confirmpass.length <= 0) {
          alert("Please fill out all fields!")
          $("#submit").removeClass("submit--loading")
        } else if(password !== confirmpass) {
          alert("Please make sure both fields match!")
          $("#submit").removeClass("submit--loading")
        } else {
          $.post("/user/change-password", {password: password, token: getUrlVars()["token"]}).done((data) => {
            alert("Password Successfully Changed.")
            $("#submit").removeClass("submit--loading")
            window.location.assign("/login.html")
          }).fail((data) => {
            alert("An error has occured, please try again.")
            $("#submit").removeClass("submit--loading")
          })
        }
    }); 
});