$(document).ready(function () {
  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") })
    .done((data) => {
      if (data.account.stripe.customer_id) {
        $.get("/payments/billing_portal?jwt=" + Cookies.get("jwt")).done(data => {
          window.location = data.url
        })
      }
    })
    .fail((data) => {
      alert("Unable to load User Data.");
      window.location.assign("/login.html");
    });

  $("#purchase_premium").click(function () {
    $.post("/payments/buy_premium/basic", {
      jwt: Cookies.get("jwt"),
    })
      .done((data) => {
        window.location = data.link;
      })
      .fail((data) => {
        alert("An error has occured, please try again.");
        $("#purchase_premium").removeClass("submit--loading");
      });
  });

  $("#purchase_mvp").click(function () {
    $.post("/payments/buy_premium/mvp", {
      jwt: Cookies.get("jwt"),
    })
      .done((data) => {
        window.location = data.link;     
      })
      .fail((data) => {
        alert("An error has occured, please try again.");
        $("#purchase_mvp").removeClass("submit--loading");
      });
  });

  $("#purchase_elite").click(function () {
    $.post("/payments/buy_premium/elite", {
      jwt: Cookies.get("jwt"),
    })
      .done((data) => {
        window.location = data.link;
      })
      .fail((data) => {
        alert("An error has occured, please try again.");
        $("#purchase_elite").removeClass("submit--loading");
      });
  });
});
