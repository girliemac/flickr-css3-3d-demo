/**
 * @author Tomomi Imura
 * http://girliemac.com/blog
 */

/* Global Variables */

var apiKey = 'ce35562b47ef1b1182f97b72fae16d6a';
var url = 'http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key='+apiKey+'&per_page=24&format=json';
var list = [];

var db;
var activePic = [];


/* Flickr getting data from API and Displaying */

function getJson() {
 	var head = document.getElementsByTagName('head'); 
	var script = document.createElement('script'); 
	script.src = url;
	head[0].appendChild(script);      
}

function jsonFlickrApi(jsonData) {
	
	var items = jsonData.photos.photo;
				
	for (var i = 0; i < 24; i++) {
		var title = '(untitled)';
		if(items[i].title != ''){
			title = items[i].title;
		}
		list.push ({
			farm: items[i].farm,
			server: items[i].server,
			photo: items[i].id,
			secret: items[i].secret,
			owner: items[i].owner,
			title: title
		});
	}
	
	render();
}

function render() {
	var count = 0;
	var imageLength = list.length;
	var i = 0;
	
	for (i = 0; i < imageLength/2; i++) {
		var thumbDiv = document.createElement('div');
		thumbDiv.setAttribute('id', 'd' + i);
		thumbDiv.setAttribute('class', 'thumb');
		var thumb = document.createElement('img');
		thumb.src = 'http://farm' + list[i].farm + '.static.flickr.com/' + list[i].server + '/' + list[i].photo + '_' + list[i].secret + '_t.jpg';
		thumb.setAttribute('id', 't' + i);
		thumbDiv.appendChild(thumb);
		document.getElementById('gallery').appendChild(thumbDiv);
	}
	for (i = imageLength/2; i < imageLength; i++) {
		var thumbDiv = document.createElement('div');
		thumbDiv.setAttribute('id', 'd' + i);
		thumbDiv.setAttribute('class', 'thumb');
		var thumb = document.createElement('img');
		thumb.src = 'http://farm' + list[i].farm + '.static.flickr.com/' + list[i].server + '/' + list[i].photo + '_' + list[i].secret + '_t.jpg';
		thumb.setAttribute('id', 't' + i);
		thumbDiv.appendChild(thumb);
		document.getElementById('gallery2').appendChild(thumbDiv);
	}
}

function galleryClickHandler(event) {
	
	//event = event || window.event;
	//var target = event.target || event.srcElement;
	
	var target = event.target;
	var flickrImg = {};
	
	if (target.id) {
		var iid = target.id.replace('t', '');

		flickrImg.src = 'http://farm'+list[iid].farm+'.static.flickr.com/'+list[iid].server+'/'+list[iid].photo+'_'+list[iid].secret+'_m.jpg';
		flickrImg.web = 'http://www.flickr.com/photos/'+list[iid].owner+'/'+list[iid].photo+'/';
		flickrImg.title = list[iid].title;
		
		document.getElementById('photoDisplay').style.display = 'block';
		
		document.getElementById('photo').src = flickrImg.src;
		document.getElementById('title').innerHTML = flickrImg.title;
		document.getElementById('flickrUrl').innerHTML = flickrImg.web;
		document.getElementById('flickrUrl').href = flickrImg.web;
		activePic = flickrImg;
		
	}
}

/* Stop Animation */

function stopAnimation() {
	document.getElementById('container').setAttribute("class","noAnimation");
	document.getElementById('stage').setAttribute("class","noAnimation");
	document.getElementById('gallery').setAttribute("class","noAnimation");
	document.getElementById('gallery2').setAttribute("class","noAnimation");
	document.getElementById('galleryWrapper').setAttribute("class","noAnimation");
	document.getElementById('gallery2Wrapper').setAttribute("class","noAnimation");
}

/* DB */

function viewFaves() {
	var faveList = [];
	document.getElementById('faveDisplay').style.display = 'block';
	
	db.transaction(
	    (function (transaction) {
	        transaction.executeSql("SELECT * from myFaves;", [], function(transaction,result){
				//display
				console.log("*** result length ="+result.rows.length);
				
				for (var i=result.rows.length-1; i>=0; i--) {
			        var row = result.rows.item(i);
			        faveList.push ({
						id: row['id'],
						title: row['title'],
						url: row['imgsrc']
					});
			    }
				displayFaveList(faveList);
			}, function(transaction,error){
				alert('Failed to get data from database - ' + error.message);
			});
	    })
	);	
}

function displayFaveList(list) {
	var ol = document.createElement('ol');
	ol.id = 'faveListOl';
	
	for (var j = 0; j < list.length; j++) {
		var li = document.createElement('li');
		//li.id = 'f'+list[j].id;
		
		var a = document.createElement('a');
		a.innerHTML = list[j].title;
		a.href = list[j].url;
		a.target = '_blank;'
		
		var a2 = document.createElement('a');
		a2.innerHTML = '[delete]';
		a2.id = 'd'+list[j].id;
		a2.setAttribute('class','delete');
		a2.setAttribute('onclick', 'deleteData('+list[j].id+');')
		
		li.appendChild(a);
		li.appendChild(a2);
		
		ol.appendChild(li);
	}
	document.getElementById('faveList').appendChild(ol);
}

function refreshList(){
	
	if (document.getElementById('faveListOl')) {	
		document.getElementById('faveList').innerHTML = '';
	}
	viewFaves();
}

function savePic(pic) {
	var picTitle = pic.title;
	//var picSrc = pic.src; 
	var picSrc = pic.web;
	
	db.transaction( 
        (function (transaction) { 
            transaction.executeSql('INSERT INTO myFaves (title, imgsrc) VALUES (?,?)', [picTitle, picSrc], function(result){
				console.log (picTitle +' has been saved!');
				refreshList();
				}, function(transaction,error){alert('Failed to save data into database - ' + error.message);}); 
        })
    );
}

function deleteData(id){
	db.transaction(
		function(transaction){
			transaction.executeSql('DELETE FROM myFaves WHERE id = ?', [id], function(result){
				console.log ('*** deleted 1 record');
				refreshList();
				}, function(transaction,error){
				alert('Failed to delete data from database - ' + error.message);
				return;
		});
	});
	document.getElementById('faveList').innerHTML = '';
}

function deleteTable(){
	db.transaction(
		function(transaction){
			//transaction.executeSql("DELETE FROM myFaves", [], function(result){console.log('*** deleted a whole list');
			transaction.executeSql("DROP TABLE myFaves", [], function(result){
				console.log('*** deleted a whole table');
				createTable();}, function(transaction,error){
				alert('Failed to delete data from database - ' + error.message);
				return;
		});
	});
	document.getElementById('faveList').innerHTML = '';
}

function createTable() {
	db.transaction((
		function(transaction){
			transaction.executeSql('CREATE TABLE IF NOT EXISTS myFaves(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, title TEXT, imgsrc TEXT);', [], function(result){
			console.log('*** Opening a db table');}, function(transaction,error){alert('Failed to create a data table - ' + error.message);});
		})
	);
	
}


window.onload = function () {
	if (window.openDatabase) {
		db = openDatabase('flickrDB', '1.0', 'Flickr DB', 25000);
	}
	createTable();
	getJson();
	
	var gallery = document.getElementById("gallery");
	var gallery2 = document.getElementById("gallery2");
	var stop = document.getElementById("stopButton");
	var fave = document.getElementById("viewFaveButton");
	var save = document.getElementById('addFave');
	
	if (window.addEventListener != null) {
		gallery.addEventListener("click", galleryClickHandler, false);
		gallery2.addEventListener("click", galleryClickHandler, false);
		stop.addEventListener("click", stopAnimation, false);
		fave.addEventListener("click", viewFaves, false);
		
		if (activePic != null) {
			save.addEventListener("click", function(){
				savePic(activePic)
			}, false);
		}
	} 
}

