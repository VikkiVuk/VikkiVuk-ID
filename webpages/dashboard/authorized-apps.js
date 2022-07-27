function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

$(document).ready(() => {
  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") })
    .done((data) => {
      for (const connection in data.connections) {
        if (connection == "authorized_apps") {
          for (const index in connection) {
            let appusername = data.connections["authorized_apps"][index]["name"];
            let appicon;
            if (data.connections["authorized_apps"][index]["picture"] !== "placeholder") {
              appicon = data.connections["authorized_apps"][index]["picture"];
            }

            $.get("authorized-app.html", function (unparsedData) {
              addApp(unparsedData, capitalizeFirstLetter(appusername), appicon, data.connections["authorized_apps"][index]["id"], index);
            });
          }
        }
      }
    })
    .fail((data) => {
      alert("Unable to load User Data.");
      window.location.assign("/login.html");
    });
});

function addApp(unparsedData, appusername, appicon, clientId, index) {
  let data = $.parseHTML(unparsedData);
  $("#appusername", data).text(appusername);
  if (appicon) {
    $("#appicon", data).attr("src", appicon);
  }
  $("#deauthorize", data).click(function () {
    $.post("/connections/deauthorize", { jwt: Cookies.get("jwt"), client_id: clientId, index: index })
    .done((data) => {
      alert("The app " + appusername + " no longer has access to your account");
      location.reload()
    })
    .fail((data) => {
      alert("Unable to Deauthorize App, please try again.")
    });
  });

  $("#bruhidk").append(data);
}
