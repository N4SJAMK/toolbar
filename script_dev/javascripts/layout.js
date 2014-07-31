// opens a modal dialog with given message. Title is shown on dialog topbar
function showResponse(message, title, open) {
  if (!title) {
    title = "";
  }

  $("#responseLbl").text(message);
  $("#dialog-response").dialog('option', 'title', title);
  if (open) {
    $("#dialog-response").dialog("open");
  }
}

// return true if email is valid
// also change border color green/red
// emailtxt : JQuery selected textfield object 
function checkEmail(emailtxt) {
  var patt_email = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  if (patt_email.test(emailtxt.val() )) {
    emailtxt.css('border-color','green');
    return true;
  } else {
    emailtxt.css('border-color', 'red');
    return false;
  }
}


// checks if password match
// also changes border colors accordingly
function checkPassword(pwtxt, pwtxt2) {
  if (pwtxt.val() === pwtxt2.val() && pwtxt2.val().length >= 1) {
    pwtxt2.css('border-color', 'green');
    return true;
  } else {
    pwtxt2.css('border-color', 'red');
    return false;
  }
}


// checks if submit button can be enabled on register dialog
// if enabled === false, disables button
function enableRegister() {
  if (  checkEmail($("#txtRegEmail"))
        && checkPassword($("#txtRegPassword"), $("#txtRegPassword2")) ) {
    $(".ui-dialog-buttonpane button:contains('Register')").button("enable");
  } else {
    $(".ui-dialog-buttonpane button:contains('Register')").button("disable");
  }
}

function logout() {
/* jshint undef:false */
  $.ajax({
    type: 'POST',
      url: '/logout'
    }).done(function(response) {
      $("#btnBarPassword").hide();
      window.location.replace("/");
      createTopbarButtons(null);
    }).fail(function() {
      showResponse('Something went wrong!', 'Log out', true);
    });
}


//update topbar buttons based on user status (loggedIn/not loggedIn)
function createTopbarButtons(user) { // jshint ignore:line
  /* jshint undef:false */
  $("#topbarButtons").empty();
  var btnTutorial = ""; 
  if (document.URL.slice(-4) === "edit") { // show tutorial only on edit -page
    btnTutorial = "<div id='tutorial'><i class='fa fa-question-circle' title='Show tutorial'></i></div>";
  }

  if (user === null) {
    toolbar.bar.user = null;

    $("#topbarButtons").append("<button id='btnRegister'>Register</button><button id='btnLogin'>Log in</button>" + btnTutorial);

    //open register dialog
    $("#btnRegister").click(function() {
      $(".ui-dialog-buttonpane button:contains('Register')").button("disable");
      $( "#dialog-register" ).dialog( "open" );
    });
    
    //open login dialog
    $("#btnLogin").click(function() {
      $( "#dialog-login" ).dialog( "open" );
    });

  } else {
    toolbar.user = user;

    $("#topbarButtons").append("<div id='lines'><i class='fa fa-bars circle'></i><div class='submenu'><a href='/profile'><div class='submenuButton'>Account</div></a><a href='/bars'><div class='submenuButton'>Toolbars</div></a><a href='#'><div id='logout' class='submenuButton'>Log out</div></a></div></div>" + btnTutorial + "<div id='email'>" +user +"</div>");
    $(".submenuButton").disableSelection();

    //submenu open/close button click event
    $("#lines").click(function(e) {
      e.stopImmediatePropagation();
      $(".submenu").toggle();

      if ($(".submenu").is(":visible")) {
          //add document click event to close submenu when clicked outside
          $(document).click(function(e) {
            if ($(".submenu").is(":visible") && e.target.id !== "lines") {
              $(".submenu").hide();
              $(document).unbind("click"); //remove click event from document
            }
          });
      }
    });

    //prevent click event on submenu
    $(".submenuButton").click(function(e) {
      e.stopPropagation();
    });

    $("#logout").click(function() {
      logout();
    });

  }
}


function confirmationDialog(cb, text, title) {
  if (!title) {
    title = "Are you sure?";
  }

  $("#confirmationDiv").text(text);
  $("#dialog-confirmation").data('cb', cb)
    .dialog('option', 'title', title)
    .dialog("open");
}


$(function() {
 
  // tells if barform button clicked is delete
  var submitDelete = false;
  
  // change submitdelete when barform button clicked
  $(".barsFieldButton").click(function() {
    if ($(this).hasClass('delete')) {
      submitDelete = true;
    } else {
      submitDelete = false;
    }
  });

  
  $(".txtReg").keyup(function() {
    enableRegister();
  });


  // make dialog trigger "save" or "ok" when enter is pressed
  $(document).delegate('.ui-dialog', 'keyup', function(e) {
    var tagName = e.target.tagName.toLowerCase();
  
    tagName = (tagName === 'input' && e.target.type === 'button') ? 'button' : tagName;
  
    if (e.which === $.ui.keyCode.ENTER && tagName !== 'textarea' && tagName !== 'select' && tagName !== 'button') {
      
      if (($("#dialog-login").dialog("isOpen") === true) && ($("#txtLoginPassword").val().length === 0)) {
        return false;
      }

      $(this).find('.ui-dialog-buttonset button').eq(0).trigger('click');
      return false;
    }
  });


  // prevent submit if delete is pressed and ask user for confirmation
  $(".barForm").submit(function(e) {
    if (submitDelete) {
      e.stopImmediatePropagation();
      return confirm("Delete toolbar?");
    } else {
      return true;
    }
  });


  // remember to bind callback to YES
  $("#dialog-confirmation").dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Yes: function() {
        var $led = $("#dialog-confirmation");
        var cb = $led.data('cb');
        $(this).dialog("close");
        return cb();
      },
      No: function() {
        $(this).dialog("close");
        $("#confirmationDiv").text("");
        $(this).dialog('option', 'title', '');
      }
    }
  });


  // click event for when user want's a new password to email
  // assumes that login -dialog is open
  $("#passwordRetrieve").click(function(e) {
    e.preventDefault();
    $("#dialog-login").dialog("close");
    $("#dialog-retrievePassword").dialog("open");
  });

  
  // dialog to inform user about stuff
  $("#dialog-response").dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Ok: function() {
        $("#responseLbl").text("");
        $("#dialog-response").dialog("close");
      }
    }
  });


  $( "#dialog-register" ).dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Register: function() {
        $.ajax({
          type: 'POST',
          url: '/register',
          data: { email: $("#txtRegEmail").val(), password: $("#txtRegPassword").val(), password2: $("#txtRegPassword2").val() }
        }).done(function(data) {
          $( "#dialog-register" ).dialog("close");
          showResponse(data ,"Register", true);
        }).fail(function(response) {
          showResponse(response.responseText, "Register", true);
        }).always(function() {
          $("#txtRegEmail").val("");
          $("#txtRegPassword").val("");
          $("#txtRegPassword2").val("");
        });
      },
      Cancel: function() {
        $(this).dialog("close");
        $("#txtRegEmail").val("");
        $("#txtRegPassword").val("");
        $("#txtRegPassword2").val("");
      }
    }
  });


  $("#dialog-retrievePassword").dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Send: function() {
        $(this).dialog("close");
        $('#loading-image').show();
        $("#txtRetrievePassword").hide();
        showResponse("","",true);
        $.ajax({
          type: 'POST',
          url: '/newpassword',
          data: {email: $("#txtRetrievePassword").val()}
        }).done(function(data) {
          showResponse(data, "Password retrieved succesfully");
        }).fail(function(response) {
          showResponse(response.responseText, "Authentication failed");
        }).always(function() {
          $("#txtRetrievePassword").show();
          $('#loading-image').hide();
          $("#txtRetrievePassword").val("");
        });

      },
      Cancel: function() {
        $(this).dialog("close");
        $("#txtRetrievePassword").val("");
      }
    }
  });


  $( "#dialog-login" ).dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      'Log In': function() {
        
        $.ajax({
          type: 'POST',
          url: '/login',
          data: { email: $("#txtLoginEmail").val(), password: $("#txtLoginPassword").val() }
        }).done(function(response) {
          createTopbarButtons(response);
          $("#btnBarPassword").show();
          $("#dialog-login").dialog( "close" );
        }).fail(function() {
          showResponse('Wrong email or password!',"Authentication failed", true);
        }).always(function() {
          $("#txtLoginEmail").val("");
          $("#txtLoginPassword").val("");
        });
        var $led = $("body");
        var intro = $led.data('intro');
        if (intro) {
            intro.refresh();
        }

      },
      Cancel: function() {
        $(this).dialog("close");
        $("#txtLoginEmail").val("");
        $("#txtLoginPassword").val("");
      }

    }
  });

});

