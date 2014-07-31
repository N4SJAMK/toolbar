var toolbar = {};  // jshint ignore:line

// title : toolbar title
// tabs : array of tabs
toolbar.Bar = function(title, tabs, id) {
	this.title = title;
	this.tabs = tabs;
  this.id = id;
  this.pwEnabled = false;
  this.pw = "";

  // Adds a tab to array with the given parameters. TabID given automatically
  // if iconID empty, gives ID ic_case
  this.addTab = function(title, iconID, boxes) {
    if (iconID === "") {
      iconID = "ic_case";
    }

    this.tabs.push(new toolbar.Tab(title, iconID, toolbar.nextTabID++, boxes));
  };

 
  this.setTitle = function(title) {
    this.title = he.encode(title);
  };


  this.getTitle = function() {
    return he.decode(this.title);
  };


  // deletes the tab currently open
  this.deleteTab = function() {
     //remove the toolbar.openTab
    this.tabs.splice(toolbar.openTab, 1);
  
    //update tab ids
    for (var i=0; i<this.tabs.length; i++) {
      this.tabs[i].id = i;
    }
    --toolbar.nextTabID;
  };


  // gives new info to box with the given ID
  this.changeInfo = function(boxID, info) {
    this.tabs[toolbar.openTab].boxes[boxID].info = he.encode(info.replace(/"/g, "''"));
  };

  
  // get boxInfo for opentab with given boxid
  this.getInfo = function(boxID) {
    return he.decode(this.tabs[toolbar.openTab].boxes[boxID].info);
  };


  // changes description for given boxid in opentab
  this.changeDesc = function(boxID, desc) {
    this.tabs[toolbar.openTab].boxes[boxID].description = he.encode(desc.replace(/"/g, "''"));
  };


  this.getDesc = function(boxID) {
    return he.decode(this.tabs[toolbar.openTab].boxes[boxID].description);
  };


  // changes URL to opentab with given boxID.
  this.changeContent = function(boxID, content) {
    this.tabs[toolbar.openTab].boxes[boxID].content = content;
  };

 
  // gets URL from opentab with given boxID. Prepends http:// if not found
  this.getContent = function(boxID) {
    if (!/^(f|ht)tps?:\/\//i.test(this.tabs[toolbar.openTab].boxes[boxID].content)) {
      return "http://" + this.tabs[toolbar.openTab].boxes[boxID].content; 
    }
    return this.tabs[toolbar.openTab].boxes[boxID].content;
  };


  this.deleteBox = function(boxID) {
    this.tabs[toolbar.openTab].deleteBox(boxID);
  };


  this.addBox = function(info, content, description) {
    this.tabs[toolbar.openTab].addBox(info, content, description);
  };


  this.changeTabTitle = function(content) {
    this.tabs[toolbar.openTab].title = he.encode(content.replace(/"/g, "''"));
  };


  this.getTabTitle = function() {
    return he.decode(this.tabs[toolbar.openTab].title);
  };
};