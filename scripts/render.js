define(function(){
	return {
		renderer: function() {
			var currentColumn = 0;
			var columnPrefix = 'xxx';
			var maxColumnHeight = 600;
			
			var calculateColumnHeight = function(){
				var height = $( "#" + columnPrefix + "-p-" + currentColumn ).height();
				var parHeight = $( "#new" ).height();
				
				console.log( height );
				
				if( height >= maxColumnHeight ){
					currentColumn++;
					$( "#xxx-a" ).append( "<div id='" + columnPrefix + "-p-" + currentColumn + "' class='column span4'></div>" );
					$( "#new" ).appendTo( "#" + columnPrefix + "-p-" + currentColumn );
					$( "#new" ).attr( "id", "" );
				}
			}
			
			return {
				attach: function( parentId ){
					$( "#" + parentId ).append( "<div id='" + columnPrefix + "' class='page span8'></div>" );
					$( "#" + columnPrefix ).append( "<div id='" + columnPrefix + "-a" + "' class='article'></div>" );
					$( "#" + columnPrefix + "-a" ).append( "<div id='" + columnPrefix + "-p-" + currentColumn + "' class='column span4'></div>" );
				},
				
				title: function( title ){
					$( "#" + columnPrefix + "-p-" + currentColumn ).append( "<h3>" + title + "</h3>" );
				},
				
				author: function( author ){
					$( "#" + columnPrefix + "-p-" + currentColumn ).append( "<div id='xxx-attr' class='attribution'></div>" );
					$( "#xxx-attr" ).append( "<p class='author'>" + author + "</p>" );
				},
				
				date: function( date ){
					$( "#xxx .attribution" ).append( "<p class='date'>" + date + "</p>" );
				},
				
				section: function( name ){
					$( "#" + columnPrefix + "-p-" + currentColumn ).append( "<h4>" + name + "</h4>" );
					calculateColumnHeight();
				},
				
				paragraph: function( text ){
					$( "#" + columnPrefix + "-p-" + currentColumn ).append( "<p id='new'>" + text + "</p>" );
					calculateColumnHeight();
				},
				
				footnote: function( text ){
					$( "#" + columnPrefix + "-p-" + currentColumn ).append( "<p>" + text + "</p>" );
					calculateColumnHeight();
				},
				
				image: function( url ) {
					$( "#" + columnPrefix + "-p-" + currentColumn ).append( "<img src='" + url + "'>" );
					calculateColumnHeight();
				},
				
				caption: function( text){
					$( "#" + columnPrefix + "-p-" + currentColumn ).append( "<p>" + text + "</p>" );
					calculateColumnHeight();
				}
			}
		}
	}
})();