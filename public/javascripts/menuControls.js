document.addEventListener('DOMContentLoaded', function() {
  document.querySelector("#addFolder").addEventListener("click", function() {
    var newFolderName = document.querySelector("input[name=folderName]").value;
    addToFolderList(newFolderName);
  });
}, false);

function addToFolderList (folderName) {
  var newElement = document.createElement("li");
  var newContent = document.createTextNode(folderName);
  newElement.appendChild(newContent);

  document.querySelector("#folderList").appendChild(newElement);
}