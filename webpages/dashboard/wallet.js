function purchase(amnt) {
  $.post("/payments/buy_balance", {
    jwt: Cookies.get("jwt"),
    amount: amnt,
  })
    .done((data) => {
      window.location = data.link;
    })
    .fail((data) => {
      alert("An error has occured, please try again.");
    });
}

$(document).ready(function () {
  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") })
    .done((data) => {
      $("#balance").text((data.account.wallet.balance) ? "$" + data.account.wallet.balance : "$0")
  })
    .fail((data) => {
      alert("Unable to load User Data.");
      window.location.assign("/login.html");
    });

  $("#add_balance").click(function () {
    $("#purchase_menu").css("z-index", "100");
    $("#purchase_menu").css("opacity", "100");
  });

  $("#purchase_cancel").click(function () {
    $("#purchase_menu").css("z-index", "-1");
    $("#purchase_menu").css("opacity", "0");
  });

  $("#purchase_1").click(function () {
    purchase("100")
  });
  
  $("#purchase_5").click(function () {
    purchase("500")
  });
  
  $("#purchase_10").click(function () {
    purchase("1000")
  });
  
  $("#purchase_20").click(function () {
    purchase("2000")
  });
  
  $("#purchase_50").click(function () {
    purchase("5000")
  });
  
  $("#purchase_100").click(function () {
    purchase("10000")
  });
});
