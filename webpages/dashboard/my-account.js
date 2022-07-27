let enabled = false;

$(document).ready(function () {
  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") })
    .done((data) => {
      $("#username").val(data.profile.username);
      $("#email").val(data.email);
      $("#gender").val(data.profile.gender ? data.profile.gender : "Unknown");

      var bday = new Date(data.profile.birthday);

      var day = ("0" + bday.getDate()).slice(-2);
      var month = ("0" + (bday.getMonth() + 1)).slice(-2);

      var fullBday = bday.getFullYear() + "-" + month + "-" + day;
      $("#bday").val(fullBday);
    
      $("#profile-profilepic").attr("src","https://www.gravatar.com/avatar/" + $.md5(data.email) + "?s=200");
      $("#profile-username").text(data.profile.username);
      $("#profile-email").text(data.email);
      $("#profile-bday").text(fullBday);

    })
    .fail((data) => {
      alert("Unable to load User Data.");
      window.location.assign("/login.html");
    });

  $("#edit").click(function () {
    if (enabled) {
      $("#username").prop("disabled", true);
      $("#email").prop("disabled", true);
      $("#gender").prop("disabled", true);
      $("#bday").prop("disabled", true);
      enabled = false;
    } else {
      $("#username").prop("disabled", false);
      $("#email").prop("disabled", false);
      $("#gender").prop("disabled", false);
      $("#bday").prop("disabled", false);
      enabled = true;
    }
  });

  $("#submit").click(function () {
    const email = $("#email").val();
    const username = $("#username").val();
    const gender = $("#gender").val();
    const bday = $("#bday").val();

    if (email.length <= 0 || username.length <= 0 || gender.length <= 0) {
      alert("Please fill out all fields!");
      $("#submit").removeClass("submit--loading");
    } else {
      $.post("/personalization/account-settings", {
        email: email,
        username: username,
        gender: gender,
        bday: bday,
        jwt: Cookies.get("jwt"),
      })
        .done((data) => {
          $("#submit").removeClass("submit--loading");
          $("#username").prop("disabled", true);
          $("#email").prop("disabled", true);
          $("#gender").prop("disabled", true);
          $("#bday").prop("disabled", true);
          enabled = false;
          alert("Saved!");
        })
        .fail((data) => {
          alert("An error has occured, please try again.");
          $("#submit").removeClass("submit--loading");
        });
    }
  });
});

window.addEventListener("beforeunload", function (e) {
  if (enabled) {
    var confirmationMessage =
      "It looks like you have been editing something. " +
      "If you leave before saving, your changes will be lost.";

    (e || window.event).returnValue = confirmationMessage;
    return confirmationMessage;
  }
});
