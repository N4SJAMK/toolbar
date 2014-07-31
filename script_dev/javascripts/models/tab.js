// title: Tab title written in normal text
// iconID: ID for icon (ex. code, message)
// id: ID for a tab (Unique in this toolbar)
// boxes: Array of messages to be shown when the tab is active
toolbar.Tab = function(title, iconID, id, boxes) {
  this.title = title;
  this.id = id;
  this.iconID = iconID;
  this.boxes = boxes;


  this.deleteBox = function(boxID) {
  	this.boxes.splice(boxID, 1);
  
    //update box ids
    for (var i=0; i<this.boxes.length; i++) {
      this.boxes[i].id = i;
    }
  };


  // adds box to tab with the given attributes
  this.addBox = function(info, content, description) {
  	this.boxes.push(new toolbar.Box(info, content, description, this.boxes.length)); // boxes.length becomes boxID
  };

};



