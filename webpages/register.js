$(document).ready(function() {
  $("#submit").click(function(){
        const email = $("#email").val()
        const password = $("#password").val()
        const name = $("#name").val()
        const bday = $("#birthday").val()
        
        if (email.length <= 0 || password.length <= 0 || name.length <= 0 || bday.length <= 0) {
          alert("Please fill out all fields!")
          $("#submit").removeClass("submit--loading")
        } else {
          $.post("/register", {email: email, password: password, name: name, birthday: bday}).done((data) => {
            $("#submit").removeClass("submit--loading")
            window.location.assign("/verify-email.html?token=" + data.token);
          }).fail(async(data) => {
            alert("An error has occured, please try again.")
            $("#submit").removeClass("submit--loading")
          })
        }
    }); 
});