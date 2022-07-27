import { decodeServerOptions, encodeCredential } from "./encoding.js";
const Cookies = window.Cookies
const authn = window.SimpleWebAuthnBrowser 

$(document).ready(function () {
  $.post("/user/jwtGet", { jwt: Cookies.get("jwt") })
    .done((data) => {
      if (data.account.security) {
        if (data.account.security.email) {
          $("#email_auth").attr("checked", data.account.security.email)
        }
        
        if (data.account.security.onetap) {
          $("#onetap_auth").attr("checked", data.account.security.onetap.isEnabled)
        }
        
        if (data.account.analytics) {
          $("#share_storage_data").attr("checked", data.account.analytics.share_storage_data)
          $("#usage_statistics").attr("checked", data.account.analytics.usage_statistics)
        }
        
        if (data.account.security.keys) {
          for (const key in data.account.security.keys) {
            if (key != "currentChallenge") {
              let keyName = key;

              $.get("securitykey.html", function (unparsedData) {
                addKey(unparsedData, keyName);
              });
            }
          }
        }
      }
      
    })
    .fail((data) => {
      alert("Unable to load User Data.");
      window.location.assign("/login.html");
    });
  
  $.post("/auth/authenticator-app", { jwt: Cookies.get("jwt") }).done(async(data) => {
    $("#authenticator_qr").attr("src", data.qrcode)
    $("#authenticator_app_auth").attr("checked", data.isEnabled)
  }).fail(async(data) => {
    alert("Failed to get AAS")
  })
  
  $("#authenticator_app_auth").on('change', function(){
    if (this.checked) {
      changeStatus("authenticator-app", true)
    } else {
      if (confirm('Are you sure you want to disable the Authenticator App option? This will not re-generate your secret/qrcode.')) {
         changeStatus("authenticator-app", false)
      } else {
        $("#authenticator_app_auth").attr("checked", "true")
      }
    }
  })
  
  $("#onetap_auth").on('change', function(){
    if (this.checked) {
      changeStatus("onetap-auth", true)
    } else {
      if (confirm("Are you sure you want to disable the OneTap Auth option?")) {
        changeStatus("onetap-auth", false)
      } else {
        $("#onetap_auth").attr("checked", "true")
      }
    }
  })
  
  $("#email_auth").on('change', function(){
    if (this.checked) {
      changeStatus("email", true)
    } else {
      if (confirm("Are you sure you want to disable the Email Authentication option?")) {
        changeStatus("email", false)
      } else {
        $("#email_auth").attr("checked", "true")
      }
    }
  })
  
  $("#share_storage_data").on('change', function(){
    if (this.checked) {
      changeStatus("share_storage_data", true)
    } else {
      if (confirm("Are you sure you want to disable the sharing of your data to apps using VikkiVuk Storage? This will impact the user experience on those apps.")) {
        changeStatus("share_storage_data", false)
      } else {
        $("#share_storage_data").attr("checked", "true")
      }
    }
  })

  $("#usage_statistics").on('change', function(){
    if (this.checked) {
      changeStatus("usage_statistics", true)
    } else {
      if (confirm("Are you sure you want to disable usage statistics? This helps us make our services better and fix bugs/issues that may occur.")) {
        changeStatus("usage_statistics", false)
      } else {
        $("#usage_statistics").attr("checked", "true")
      }
    }
  })
  
  $("#request_data").click(async() => {
    $.post("/user/jwtGet", { jwt: Cookies.get("jwt") }).done(async(data) => {
      delete data.account.jwtToken
      delete data.account.corCode
      delete data.account.passwordResetToken
      delete data.password
      delete data._id
      data.account.wallet.card = "censored"
      data.account.security.keys = "censored"
      data.account.security.authenticator = "censored"
      data.account.security.onetap = "censored"
      data._notice = "Some things were removed or changed to 'censored' for safety reasons."
      
      if (confirm("File was generated, are you sure you want to download the file? Note: some things were removed or set to 'censored' for safety reasons!")) {
        $("<a />", { "download": "data.json", "href" : "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data)) }).appendTo("body").click(function() { $(this).remove() })[0].click()
      }
      
      $("#request_data").removeClass("submit--loading");
    }).fail(async() => {
      alert("An error has occured whilst generating a file, please try again.")
      $("#request_data").removeClass("submit--loading");
    })
  })
  
  $("#delete_data").click(async() => {
    alert("This is currently unavailable.")
    $("#delete_data").removeClass("submit--loading");
  })
  
  $("#delete_sessions").click(async() => {
    $.post("/user/delete-jwt", { jwt: Cookies.get("jwt") }).done(async(data) => {
      alert("Logged out, redirecting back to login page...")
      Cookies.remove("jwt", { path: "" })
      window.location.assign("/login.html")
    }).fail(async(data) => {
      alert("Unable to log you out of all sessions, please try again.")
    })
  })

  $("#add_key").click(async function () {
    $.post("/auth/securitykey-options", { jwt: Cookies.get("jwt") })
    .done(async(data) => {
      try {
        console.log(data.excludeCredentials)
        const credential = await authn.startRegistration(data);
        let securitykeyName = prompt("Name your key", "My Key")

        $.post("/auth/securitykey", { jwt: Cookies.get("jwt"), credential: JSON.stringify(credential), name: securitykeyName})
        .done((data) => {
          alert("Security Key Saved!")
          location.reload()
        })
        .fail((data) => {
          if (data.error == "Key already registered!") {
            alert("This key is already on your account, please try a different key!")
          } else if(data.error = "User verification failed") {
            alert("Verification has failed! Please try again.")
          } else {
            alert("Security Key has not been saved! Please try again.");
          }
        });
      } catch(e) {
        console.log(e)
        alert(e)
      }
    })
    .fail((data) => {
      alert(data)
    });
    
  });
});

function changeStatus(ofWhat, toWhat) {
  $.post("/auth/change-status", { jwt: Cookies.get("jwt"), method: ofWhat, enable: toWhat})
    .done((data) => {
      alert("Saved!")
    })
    .fail((data) => {
      alert("An error occured whilst saving, please try again!");
  });
}

function addKey(unparsedData, keyName) {
  let data = $.parseHTML(unparsedData);
  $("#keyname", data).text(keyName);
  $("#delete", data).click(function () {
   if (confirm("Are you sure you want to delete this key?")) {
     $.post("/auth/securitykey-remove", { jwt: Cookies.get("jwt"), name: keyName})
      .done((data) => {
        alert("Security Key Removed!")
        location.reload()
      })
      .fail((data) => {
        alert("Security Key has not been removed!");
      });
   }
  });

  $("#current_keys").append(data);
}
