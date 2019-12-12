/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*/

var textures = ( function () {

'use strict';

var data = new Map();
var pathTexture = './assets/textures/';
var loader = new THREE.TextureLoader();
var id = 0;

textures = {

	get: function ( name ){ 

        return data.has( name ) ? data.get( name ) : null;

    },

	reset: function (){

		data.forEach( function ( value, key ) { if( value.isTmp ){ value.dispose(); data.delete( key );} } );

    },

    clear: function (){

    	id = 0;
    	data.forEach( function ( value, key ) { value.dispose(); } );
        data.clear(); 

    },

    add: function ( name, txt, isTmp ) {

    	txt.isTmp = isTmp !== undefined ? isTmp : true;
    	data.set( name, txt );

    },

	make: function ( o ){

		var name, tx = null;

		if( o.url !== undefined ) name = o.url.substring( o.url.lastIndexOf('/')+1, o.url.lastIndexOf('.') );
		else if( o.name !== undefined ) name = o.name;
		else name = 'txt' + id++;

		// avoid duplication
        if( data.has( name ) ) return data.get( name );

        if( o.url !== undefined ) {
        	
        	tx = loader.load( pathTexture + o.url );

        	tx.flipY = o.flip !== undefined ? o.flip : false;

			if( o.repeat !== undefined ){ 
				tx.repeat.fromArray( o.repeat );
				if(o.repeat[0]>1) tx.wrapS = THREE.RepeatWrapping;
				if(o.repeat[1]>1) tx.wrapT = THREE.RepeatWrapping;
			}

			if( o.anisotropy !== undefined ) tx.anisotropy = o.anisotropy;

			// clear on reset
            tx.isTmp = o.isTmp !== undefined ? o.isTmp : true;
            tx.encoding = THREE.sRGBEncoding;

			tx.name = name;

			// add to data
			this.add( name, tx );

			return tx;

        }

	}

}

return textures;

})();