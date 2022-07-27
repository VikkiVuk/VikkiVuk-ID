$(document).ready(function () {
  $("#submit").click(function () {
    const email = $("#email").val();
    const password = $("#password").val();
    if (email.length <= 0 || password.length <= 0) {
      alert("Please fill out all fields!");
      $("#submit").removeClass("submit--loading");
    } else {
      $.post("/login", { email: email, password: password })
        .done(async (data) => {
          $("#submit").removeClass("submit--loading");
          //sessionStorage.setItem("jwt", data.jwtToken);
          Cookies.set("jwt", data.jwtToken, { expires: 3 });

          const queryString = window.location.search;
          const urlParams = new URLSearchParams(queryString);

          let redirect = urlParams.get("redirect");
          if (redirect) {
            window.location.assign(decodeURIComponent(redirect));
          } else {
            window.location.assign("/dashboard/my-account.html");
          }
        })
        .fail((data) => {
          if (data.msg == "Account is still awaiting verification.") {
            window.location.assign("/verify-email.html");
          } else {
            alert(
              "Your login is incorrect, this can be due to incorrect credentials or a server error."
            );
            $("#submit").removeClass("submit--loading");
          }
        });
    }
  });
  
  if (Cookies.get("jwt")) {
    $.post("/user/jwtGet", { jwt: Cookies.get("jwt") }).done(async (data) => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);

      let redirect = urlParams.get("redirect");
      if (redirect) {
        window.location.assign(decodeURIComponent(redirect));
      } else {
        window.location.assign("/dashboard/my-account.html");
      }
    });
  }
  
});
