$(document).ready(function() {
    $("#submit").click(function(){
        const email = $("#email").val()
        const password = $("#lastpass").val()
        if (email.length <= 0 || password.length <= 0) {
          alert("Please fill out all fields!")
          $("#submit").removeClass("submit--loading")
        } else {
          $.post("/user/reset-password", {email: email, password: password}).done((data) => {
            $("#submit").removeClass("submit--loading")
            alert("Please check your email.")
          }).fail((data) => {
            alert("An error has occured, please try again.")
            $("#submit").removeClass("submit--loading")
          })
        }
    }); 
});