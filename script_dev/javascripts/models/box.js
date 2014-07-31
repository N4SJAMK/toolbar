// header : header for box
// content : URL
// description : Visible text for URL
// id : this id
toolbar.Box = function(info, content, description, id) {
  this.info = he.escape(info.replace(/"/g, "''"));
  this.content = he.escape(content.replace(/"/g, "''"));
  this.description = he.escape(description.replace(/"/g, "''"));
  this.id = id;
};
