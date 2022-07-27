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
        const token = getUrlVars()["token"]
        const code = $("#code").val()
        
        if (!token || code.length <= 0) {
          alert("Some information is missing!")
          $("#submit").removeClass("submit--loading")
        } else {
          $.post("/user/verify-email", {uuid: token, code: code}).done((data) => {
            $("#submit").removeClass("submit--loading")
            window.location.assign("/login.html");
          }).fail(async(data) => {
            alert("An error has occured, please try again.")
            $("#submit").removeClass("submit--loading")
          })
        }
    }); 
});