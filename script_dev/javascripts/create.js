/* jshint node:false */

// toggle Info for element tis
function toggleInfo(tis) {
  
  tis.parent().parent().siblings('.boxInfo').children('.boxInfoContent').slideToggle({
    duration: 200, 
    queue: false,
    easing: "linear"});
  // change plus/minus icon
  if (tis.hasClass("plus")) {
    tis.removeClass("plus");
    tis.html('<i class="fa fa-chevron-circle-up" title="Show less"></i>');
  } else {
    tis.addClass("plus");
    tis.html('<i class="fa fa-chevron-circle-down" title="Show more"></i>');
  }
  
}

// updates taborder at global toolbar.bar.tabs
function updateTabOrder() {
  var orderedTabs = [];
  $(".tab").each(function(i) {
    var id = $(this).attr('id').slice(4);
    toolbar.bar.tabs.forEach(function(tab) {
      if (id === tab.id.toString()) {
        orderedTabs.push(tab);
      }
    });
  });
  toolbar.bar.tabs = orderedTabs;
}


// tutorial
function startIntro(){
  var startStep = 1;
  if (toolbar.user) { // if user logged in, don't advertise topbarbuttons
    startStep = 2;
  }
  var intro = introJs();
  $('body').data("intro", intro); // get access to intro in newtab dialog
  intro.setOptions({
    exitOnOverlayClick: false,
    skipLabel: "Exit",
    keyboardNavigation: false,
    showStepNumbers: false,
    steps: [
      {
        element: "#topbarButtons",
        intro: "Register and log in to save the toolbar to your account."
      },
      {
        element: '#editBarTitle',
        intro: "Enter a name for your toolbar."
      },
      {
        element: '#btnOpenAddTab',
        intro: "Add new tabs to group your links."
      },
      {
        element: '#btnAddBox',
        intro: "Add a new link. You can also edit existing links by clicking them"
      },
      {
        element: '#btnCreateBar',
        intro: 'When you are ready, click save to generate unique link for your toolbar.',
        position: 'top'
      }
    ]
  });


  // when exiting intro, set reference to intro to null at newtab dialog
  intro.goToStep(startStep).start().onexit(function() {
    $('body').data("intro", null);
  }).oncomplete(function() {
    $('body').data("intro", null);
  });

}


// opens box with given ID open for edits. Prevents e if given
// if boxID < 0 creates new box
function openBoxDialog(boxID, e) {
  if(e) {
    e.preventDefault();
  }

  $("#txtBoxID").val(boxID);
  $("#dialog-newBox").dialog('option', 'title', 'Add new link');  
  
  if (boxID >= 0) {
    $("#txtBoxInfo").val(toolbar.bar.getInfo(boxID));
    $("#txtBoxDesc").val(toolbar.bar.getDesc(boxID));
    $("#txtBoxContent").val(toolbar.bar.getContent(boxID));
    $("#dialog-newBox").dialog('option', 'title', 'Edit link');  
  }

  $("#dialog-newBox").dialog("open");   
}


// Updates tab's boxes
function updateBoxes(editMode) {
  if (toolbar.openTab === -1) {
    $("#boxView").hide();
    document.getElementById('boxes').innerHTML = "";
    return;
  }

  $("#boxView").show();
  document.getElementById('boxes').innerHTML = "";
  var boxtxt = "";
  var txt = "";

  // iterate through tab's boxes and add them to DOM
  for (var i = 0; i < toolbar.bar.tabs[toolbar.openTab].boxes.length; ++i) {

    boxtxt = '<a class="boxLink" target="_blank" href="' + toolbar.bar.getContent(i) + '"></a>';

    txt = '<div class="boxContent">' + 
            '<div class="boxContentText">' +
              boxtxt +
            '</div>' +
            '<div class="buttons">' + 
              '<div class="boxExpand"><i class="fa fa-chevron-circle-up" title="Show less"></i></div>';

    if (editMode) {
      txt += '<div class="boxRemove"><i class="fa fa-trash-o" title="Delete link"></i></div>' + 
             '<div class="boxEdit"><i class="fa fa-pencil"></i></div>';
    }
    
    txt +=  '</div>' + 
          '</div>';
    txt += '<div class="boxInfo"><div class="boxInfoContent"></div></div>';

    var divID = 'box_' + toolbar.bar.tabs[toolbar.openTab].boxes[i].id;
    document.getElementById('boxes').innerHTML += '<div id="' + divID + '" class="box">' + txt + '</div>';
    $('#' + divID).find('.boxInfoContent').text(toolbar.bar.getInfo(i));
    $('#' + divID).find('.boxLink').text(toolbar.bar.getDesc(i));

  }
  
  $('#showAllInfo').html( '<i class="fa fa-chevron-circle-up" title="Hide all"></i> ');
  $('#showAllInfo').removeClass("plus");

  // if not on editmode, by default don't display box additional info
  if (!editMode) {
    $("#showAllInfo").html(' <i class="fa fa-chevron-circle-down" title="Show all"></i>');
    $("#showAllInfo").addClass("plus");
    $(".boxInfoContent").css("display", "none");
    $(".boxExpand").html('<i class="fa fa-chevron-circle-down" title="Show more"></i>');
    $(".boxExpand").addClass("plus");
  }


  if (editMode) {
    $("#boxes").sortable({ 
      helper: "clone", 
      stop: function(event, ui) {
        //save box order after sort event
        var orderedBoxes = [];
        $(".box").each(function(i) {
          var id = $(this).attr('id').slice(4);
          toolbar.bar.tabs[toolbar.openTab].boxes.forEach(function(box) {
            if (id === box.id.toString()) {
              orderedBoxes.push(box);
            }
          });
        });
        toolbar.bar.tabs[toolbar.openTab].boxes = orderedBoxes;
      }
    });

  // if editmode, put toggle only to icon
  $(".boxExpand").click(function() {
    toggleInfo($(this));
  });
  }


  // if not on editmode, expand plus/minus click area is set to be wider
  if (!editMode) {
    $(".buttons").click(function() {
      toggleInfo($(this).children(".boxExpand"));
    });

    $(".boxContentText").click(function(e) {
      if (e.target.nodeName !== "A") {
        toggleInfo($(this).siblings(".buttons").children(".boxExpand"));
      }
    });
  }
  
  // add click events for each box
  $(".box").each(function() { 
    var boxID = $(this).attr('id').slice('4');

    // click events for editing and remove on editmode
    if (editMode) {
      $(this).find(".boxEdit").click(function() {
        openBoxDialog(boxID);
      });

      // box remove button
      $(this).find(".boxRemove").click(function() {
        confirmationDialog( function() { // jshint ignore:line
          toolbar.bar.deleteBox(boxID);
          updateBoxes(true);
        }, "Delete link and info?");
      });
    }
  });
}


function changeSelectedTab(clicked, editMode) {
  $(".tab").each(function() {
    $(this).css("background-color", toolbar.staticCol);
    $(this).siblings(".tabControlsButtons").html("");
  });
  $(clicked).css("background-color", toolbar.selectedCol);
  $(clicked).siblings(".tabControlsButtons").html(" <i class='fa fa-pencil circle' id='btnEditTab' title='Edit tab'></i>" +
                                                "<i class='fa fa-trash-o circle' id='btnDeleteTab' title='Delete tab'></i>");
  toolbar.openTab = $(clicked).attr("id").slice(4);
  updateBoxes(editMode);


  $("#btnEditTab").click(function() {
    $("#dialog-newTab").dialog("option", "title", "Edit tab");
    $("#txtTabTitle").val(toolbar.bar.tabs[toolbar.openTab].title);
    changeSelectedIcon(toolbar.bar.tabs[toolbar.openTab].iconID);
    $("#txtTabID").val(toolbar.openTab);
    $("#dialog-newTab").dialog("open");
  });


  $("#btnDeleteTab").click(function() {
    confirmationDialog(function() { // jshint ignore:line
      toolbar.bar.deleteTab();
      toolbar.openTab = -1;
      createTabs(true);
      updateBoxes(true);
    }, "Do you want to delete tab?");
  });
}


// Gets tabs from array and adds them to DOM
function createTabs(editMode) {
  var tabhtml = "";
  var end = ""; 

  for(var i = 0; i < toolbar.bar.tabs.length; i++) {
    if (editMode) {

      tabhtml += "<div class='tabContainer'>" + 
                    "<div class='tabControlsButtons'>";
      end = "</div>";  
      if (toolbar.bar.tabs[i].id.toString() === toolbar.openTab.toString()) {
        tabhtml +=  "<i class='fa fa-pencil' id='btnEditTab' title='Edit tab'></i>" +
                    "<i class='fa fa-trash-o' id='btnDeleteTab' title='Delete tab'></i>";
      }
    }
    tabhtml += end +
               "<div class='tab' style='background: center no-repeat url(../images/icons/" + toolbar.bar.tabs[i].iconID + ".png); background-position: 50% 25%;' 
               id='tab_" + toolbar.bar.tabs[i].id + "'></div>" + end;
  }

  $( "#tabs" ).html(tabhtml);

  var e = 0;
  $(".tab").each(function() {
    $(this).text(toolbar.bar.tabs[e].title);
    $(this).attr('title', toolbar.bar.tabs[e].title);
    e++;
  });

  // bind click events for delete and edit
  $("#btnEditTab").click(function() {
    $("#dialog-newTab").dialog("option", "title", "Edit tab");
    $("#txtTabTitle").val(toolbar.bar.tabs[toolbar.openTab].title);
    changeSelectedIcon(toolbar.bar.tabs[toolbar.openTab].iconID);
    $("#txtTabID").val(toolbar.openTab);
    $("#dialog-newTab").dialog("open");
  });


  $("#btnDeleteTab").click(function() {
    confirmationDialog(function() { // jshint ignore:line
      toolbar.bar.deleteTab();
      toolbar.openTab = -1;
      createTabs(true);
      updateBoxes(true);
    }, "Do you want to delete tab?");
  });

  $(".tab").hover(function() {
    if ($(this).attr('id').slice(4) !== toolbar.openTab) {
      $(this).css("background-color", "rgba(3,113,135,0.8)");
    }
  }, function() {
    if ($(this).attr('id').slice(4) !== toolbar.openTab) {
      $(this).css("background-color", toolbar.staticCol);
    } else {
      $(this).css("background-color", toolbar.selectedCol);
    }
  });

  $( "#tabs" ).disableSelection();
  $("#sort-placeholder").remove();

  $(".tab").each(function() {
    var id = $(this).attr('id').slice(4);

    //set bg color
    if (id === toolbar.openTab) {
      $(this).css("background-color", toolbar.selectedCol);
    } else {
      $(this).css("background-color", toolbar.staticCol);
    }

    //add click functionality for each tab
    $(this).click(function() {
      changeSelectedTab(this, editMode);
    });

  });

    //prevent click after sort
    if (editMode) {

      //save tab order after sort
      $("#tabs").sortable({
        stop: function(event, ui) {
          updateTabOrder();
        }
      });

      $( ".tab" ).sortable({
        stop: function(event, ui) {
          $(event.toElement).one('click', function(e){
            e.stopImmediatePropagation();
          });

          $(".tab").each(function() {
            if ($(this).attr('id').slice(4) !== toolbar.openTab) {
              $(this).css("background-color", toolbar.backgroundCol);
            }
          });
        }
      });
    }

}


function createTitle(editMode) {
  $('#titleBar').text(toolbar.bar.getTitle());
}

//flash message at bottom of page when save is clicked
function setSaveStatus(saved) {

  if (saved) {
    $("#saveStatus").css("opacity", "1");
    $("#saveStatus").text("Toolbar is saved").animate({opacity:0}, 3000);
  } 
}

//change the selected icon in addTab dialog
function changeSelectedIcon(iconID) {
  toolbar.selectedIcon = iconID;

  $(".tabIcon").each(function() {
    if ($(this).attr('id') === iconID) {
      $(this).css("background-color", toolbar.selectedCol);
    } else {
      $(this).css("background-color", toolbar.staticCol);
    }
  });

}


/*
*  JQuery Magic
*  Executes on pageload
*
*/
$(function() {

  // start intro from icon click
  $('.fa.fa-question-circle').click(function() {
    startIntro();
  });

  // show all box infos
  $("#showAllInfo").click(function() {
    if ( $("#showAllInfo").hasClass("plus") ) {
      $("#showAllInfo").removeClass("plus");
      $("#showAllInfo").html('<i class="fa fa-chevron-circle-up" title="Hide all"></i>');
      $(".boxExpand").each(function() {
        if( $(this).hasClass("plus") ) {
          toggleInfo($(this));
        }
      });
    } else {
      $("#showAllInfo").addClass("plus");
      $("#showAllInfo").html('<i class="fa fa-chevron-circle-down" title="Show all"></i>');
      $(".boxExpand").each(function() {
        if( !$(this).hasClass("plus") ) {
          toggleInfo($(this));
        }
      });
    }
  });  
  
  //Add click events for icon selectors.
  $(".tabIcon").each(function() {
    $(this).click(function() {
      changeSelectedIcon($(this).attr('id'));
    });
  });
  
  // edit toolbar title, opens dialog
  $("#editBarTitle").click(function() {
    $("#txtBarTitle").val( $("#titleBar").text() );
    $("#dialog-editTitle").dialog("open");
  });


  //Hover events for icon selectors
  $(".tabIcon").hover(function() {
    $(this).css("background-color", "rgba(3,113,135,0.8)");
  }, function() {
    if ($(this).attr('id') !== toolbar.selectedIcon) {
      $(this).css("background-color", toolbar.staticCol);
    } else {
      $(this).css("background-color", toolbar.selectedCol);
    }
  });


  //Add new box to tab
  $( "#btnAddBox" ).click(function() {
    openBoxDialog(-1); 
  });


  //open dialog to add new tab
  $("#btnOpenAddTab").bind("click", function() {
    $("#dialog-newTab").dialog("option", "title", "Add new tab");
    $("#txtTabID").val("-1");
    $( "#dialog-newTab" ).dialog( "open" );
  });
  
  $("#btnBarPassword").click(function() {
    $("#dialog-setPassword").dialog("open");
  });

  //create bar
  $( "#btnCreateBar" ).click(function() {

    updateTabOrder();

    $.ajax({
      type: 'POST',
      url: '/save',
      data: {
        title: toolbar.bar.title,
        tabs: JSON.stringify(toolbar.bar.tabs),
        id: toolbar.bar.id,
        barPassword: toolbar.bar.pw,
        barPasswordEnabled: toolbar.bar.pwEnabled
      }
    }).done(function(data) {
      toolbar.bar.id = data;
      $("#barLink").attr("href", "/" + toolbar.bar.id);

      if (toolbar.user === null) {
        window.location.replace("/" + toolbar.bar.id);
      }
      setSaveStatus(true);
    }).fail(function(response) {
      //alert("fail");
      //showResponse(response);
    }).always(function() {
    });

  });


  $("#dialog-editTitle").dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Save: function() {
        toolbar.bar.setTitle($("#txtBarTitle").val());
        $("#txtBarTitle").val("");
        createTitle(true);
        $(this).dialog("close");
        var $led = $("body");
        var intro = $led.data('intro');
        if (intro) {
            intro.refresh();
        }
      },
      Cancel: function() {
        $("#txtBarTitle").val("");
        $(this).dialog("close");
      }
    }
  });


  $( "#dialog-newTab" ).dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Save: function() {
        $(this).dialog("close");

        if ($("#txtTabID").val() !== '-1') {
          toolbar.bar.tabs[toolbar.openTab].title = $("#txtTabTitle").val();
          toolbar.bar.tabs[toolbar.openTab].iconID = toolbar.selectedIcon;
          createTabs(true);
        } else {
          toolbar.bar.addTab($("#txtTabTitle").val(), toolbar.selectedIcon, []);
          toolbar.openTab = toolbar.nextTabID - 1;
          createTabs(true);
          changeSelectedTab($("#tab_" + toolbar.openTab),true);

          var $led = $("body");
          var intro = $led.data('intro');
          if (intro) {
            intro.refresh();
          }
        }
        
        $("#txtTabID").val("");
        $("#txtTabTitle").val("");
      },
      Cancel: function() {
        $(this).dialog("close");
        $("#txtTabTitle").val("");
      }
    }
   });


  $( "#dialog-newBox" ).dialog({
    autoOpen: false,
    modal: true,
    buttons: {
      Save: function() {
        $( this ).dialog("close");
        var ID = parseInt($("#txtBoxID").val());
        if (ID < 0) {
          toolbar.bar.addBox($("#txtBoxInfo").val(), $("#txtBoxContent").val(), $("#txtBoxDesc").val());
        } else {
          toolbar.bar.changeInfo( ID , $("#txtBoxInfo").val() );
          toolbar.bar.changeContent( ID , $("#txtBoxContent").val() );
          toolbar.bar.changeDesc( ID , $("#txtBoxDesc").val() );
        }
        $("#txtBoxID").val("");
        $("#txtBoxInfo").val("");
        $("#txtBoxContent").val("");
        $("#txtBoxDesc").val("");
        updateBoxes(true);
      },
      Cancel: function() {
        $(this).dialog("close");
        $("#txtBoxInfo").val("");
        $("#txtBoxContent").val("");
        $("#txtBoxDesc").val("");
        $("#txtBoxID").val("");
      }
    }
   });

  $( "#dialog-setPassword" ).dialog({
  autoOpen: false,
  modal: true,
  width: 450,
  buttons: {
    'Set password': function() {

      toolbar.bar.pw = $("#txtBarPassword").val();

      if ($("#txtBarPassword").val().length <= 0) {
        toolbar.bar.pwEnabled = false;
      } else {
        toolbar.bar.pwEnabled = true;
      }

      $(this).dialog("close");
      $("#txtBarPassword").val("");
      $("#txtBarPassword2").val("");
      setPasswordDialogButtons();
      enableSetPw();
    },
    'Remove password': function() {
      toolbar.bar.pwEnabled = false;
      toolbar.bar.pw = "";
      $(this).dialog("close");
      $("#txtBarPassword").val("");
      $("#txtBarPassword2").val("");
      setPasswordDialogButtons();
      enableSetPw();
    },
    Cancel: function() {
      $(this).dialog("close");
      $("#txtBarPassword").val("");
      $("#txtBarPassword2").val("");
      enableSetPw();
    }
  }
 });

  $('div[aria-describedby="dialog-setPassword"]').find('.ui-button-text').css('padding', '0px');
  $('.ui-dialog-buttonpane button:contains("Set password")').button().attr("id", "pwSet");
  $('.ui-dialog-buttonpane button:contains("Remove password")').button().attr("id", "pwRemove");
  $('div[aria-describedby="dialog-setPassword"]').find('button:contains("Cancel")').button().attr("id", "pwCancel");

  $('#pwCancel').css('border-left', '1px solid #dfdfdf');

});

function setPasswordDialogButtons() {
  if (toolbar.bar.pwEnabled) {
    $('#pwRemove').show();
    $('#pwSet').css('width', '40%');
    $('#pwRemove').css('width', '40%');
    $('#pwCancel').css('width', '20%');
  } else {
    $('#pwRemove').hide();
    $('div[aria-describedby="dialog-setPassword"]').find('.ui-button').css('width', '50%');
  }
}
