$(document).ready(function () {
  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") }).done((data) => { $("#email").text(data.email); }).fail((data) => { window.location.assign(String("/login.html?redirect=" + encodeURIComponent(window.location))); });
  
  $("#submit").click(function () {
    const password = $("#password").val();
    if (password.length <= 0) {
      alert("Please fill out all fields!");
      $("#submit").removeClass("submit--loading");
    } else {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
        
      $.post("/connections/authorize", { jwt: Cookies.get("jwt"), password: password, service: {client_id: urlParams.get("client_id"), redirect_uri: urlParams.get("redirect_uri"), scopes: urlParams.get("scopes"), response_type: urlParams.get('response_type')} })
        .done(async (data) => {
          $("#submit").removeClass("submit--loading");        
          if (urlParams.get("state")) {
            window.location.assign(urlParams.get("redirect_uri") + "?code=" + data.code + "&state=" + urlParams.get("state"));
          } else {
            window.location.assign(urlParams.get("redirect_uri") + "?code=" + data.code);
          }
        })
        .fail(async(data) => {
          let bod = await data.responseJSON
          if (bod.servicecode == "0") {
            alert("Your login is incorrect, this can be due to incorrect credentials or a server error.");
            $("#submit").removeClass("submit--loading");
          } else if(bod.servicecode == "1") {
            alert("This service is in testing or is not verified yet, we will redirect you back.")
            window.location.assign(urlParams.get("redirect_uri") + "?code=unauthorized");
          } else if (bod.servicecode == "2") {
            alert("Service doesn't exist, we will redirect you back.")
            window.location.assign(urlParams.get("redirect_uri") + "?code=unauthorized");
          } else if (bod.servicecode == "3") {
            alert("Some of the request params are incorrect, we will redirect you back.")
            window.location.assign(urlParams.get("redirect_uri") + "?code=unauthorized");
          }
        });
    }
  });
});
