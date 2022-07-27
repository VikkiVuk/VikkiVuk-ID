$(document).ready(function () {
  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") })
    .done((data) => {
      $("#aboutme").val((data.profile.about) ? data.profile.about : "");
      $("#profilecolor").val((data.profile.color) ? data.profile.color : "#FFFFFF");

      var bday = new Date(data.profile.birthday);
      var day = ("0" + bday.getDate()).slice(-2);
      var month = ("0" + (bday.getMonth() + 1)).slice(-2);
      var fullBday = bday.getFullYear() + "-" + month + "-" + day;

      $("#profile-profilepic").attr(
        "src",
        "https://www.gravatar.com/avatar/" + $.md5(data.email) + "?s=200"
      );
      $("#profile-username").text(data.profile.username);
      $("#profile-email").text(data.email);
      $("#profile-bday").text(fullBday);
    })
    .fail((data) => {
      alert("Unable to load User Data.");
      window.location.assign("/login.html");
    });

  $("#submit").click(function () {
    const profileColor = $("#profilecolor").val();
    const aboutme = $("#aboutme").val();

    if (aboutme.length <= 0) {
      alert("Please fill out all fields!");
      $("#submit").removeClass("submit--loading");
    } else {
      $.post("/personalization/profile", {
        profileColor: profileColor,
        aboutme: aboutme,
        jwt: Cookies.get("jwt"),
      })
        .done((data) => {
          $("#submit").removeClass("submit--loading");
          alert("Saved!");
        })
        .fail((data) => {
          $("#submit").removeClass("submit--loading");
          alert("An error has occured, please try again.");
      });
    }
  });
});
