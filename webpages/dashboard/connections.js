function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

$(document).ready(() => {
  $("#github").attr("href",`https://github.com/login/oauth/authorize?client_id=da3e1df049fa4a8a931a&allow_signup=true&scope=read:user+user:email&state=${Cookies.get("jwt")}`);
  $("#reddit").attr("href", `https://www.reddit.com/api/v1/authorize?client_id=wsMh_rtkmOE3YjLbaiBdAg&response_type=code&state=${Cookies.get("jwt")}&duration=permanent&scope=identity+mysubreddits&redirect_uri=https://id.vikkivuk.xyz/connections/reddit/callback`)
  $("#steam").attr("href", `https://id.vikkivuk.xyz/connections/steam?jwt=${Cookies.get("jwt")}`)
  $("#youtube").attr("href", `https://accounts.google.com/o/oauth2/v2/auth?client_id=435554639611-veb22lbqgkcaf40bmrfqo29qv4psf0si.apps.googleusercontent.com&redirect_uri=https://id.vikkivuk.xyz/connections/google/callback&state=${Cookies.get("jwt")}&response_type=code&scope=profile+email+openid+https://www.googleapis.com/auth/youtube.readonly&prompt=consent&include_granted_scopes=true`)
  $("#twitch").attr("href", `https://accounts.twitch.tv/oauth2/authorize?client_id=o93fsppxqbsfoefl0oaep323mlqn5l&redirect_uri=https://id.vikkivuk.xyz/connections/twitch/callback&response_type=code&scope=openid&state=${Cookies.get("jwt")}`)
  $("#discord").attr("href", `https://discord.com/api/oauth2/authorize?client_id=975161504703840258&redirect_uri=https%3A%2F%2Fid.vikkivuk.xyz%2Fconnections%2Fdiscord%2Fcallback&response_type=code&scope=identify%20email&state=${Cookies.get("jwt")}`)

  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") })
    .done((data) => {
      for (const connection in data.connections) {
        if (connection !== "authorized_apps") {
          let appname = connection;
          let appusername = data.connections[connection]["name"];
          let appicon = data.connections[connection]["appicon"]

          $.get("connected-app.html", function (unparsedData) {
            addApp(
              unparsedData,
              appname,
              appusername,
              appicon
            );
          });
        }
      }
    })
    .fail((data) => {
      alert("Unable to load User Data.");
      window.location.assign("/login.html");
    });
});

function addApp(unparsedData, appname, appusername, appicon) {
  let data = $.parseHTML(unparsedData);
  $("#appname", data).text(capitalizeFirstLetter(appname));
  $("#appusername", data).text(appusername);
  $("#appicon", data).attr("src", appicon);
  $("#disconnect", data).click(function () {
    $.post("/connections/delete", { jwt: Cookies.get("jwt"), connection: appname })
    .done((data) => {
      alert("Disconnected App: " + appname);
      location.reload()
    })
    .fail((data) => {
      alert("Unable to Disconnect, please try again.")
    });
  });

  $("#bruhidk").append(data);
}

function fbLogin() {
  FB.login(
    function (response) {
      if (response.authResponse) {
        let access_token = response.authResponse.accessToken;

        FB.api("/me", function (response) {
          let name = response.name;
          let uid = response.id;
          $.get("connected-app.html", function (unparsedData) {
            $.post("/connections/facebook", {
              jwt: Cookies.get("jwt"),
              name: name,
              id: uid,
            })
              .done((data) => {
               location.reload()
              })
              .fail((data) => {
                alert(
                  "An Error occurred while adding your connection, please try again."
                );
              });
          });
        });
      } else {
        
      }
    },
    {
      scope: "public_profile,email",
    }
  );
}
