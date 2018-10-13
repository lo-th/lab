var pool = ( function () {

    'use strict';

    var tmp = [];

    //var pool.data = {};
    
    var inLoading = false;
    var seaLoader = null;
    var readers = null;
    var URL = (window.URL || window.webkitURL);

    var textureLoader = null;

    var imgType = ['jpg', 'png'];

    var paths = {

        'sea' : './assets/models/',
        'bvh' : './assets/bvh/',
        'jpg' : './assets/textures/',
        'png' : './assets/textures/',
        'mp3' : './assets/sounds/',
        'wav' : './assets/sounds/',

    }


    //var autoPath = false;
    //var autoTexture = false;

    //var start = 0;
    //var end = 0;

    pool = {

        data:{},
        buffer:{},// for sound


        set: function ( name, res ){

            if( pool.data[ name ] ){ console.error('data of ' + name + ' already existe !! '); return; }
            pool.data[ name ] = res;

        },

        get: function ( name ){

            if( !pool.data[ name ] ) console.error('data of ' + name + ' not find in pool !! ');
            return pool.data[ name ];

        },


        setDirectTexture: function () {

            if( textureLoader === null ) textureLoader = new THREE.TextureLoader();

        },

        load: function( Urls, Callback, AutoPath, AutoTexture ){

            var urls = [];

            var start = ( typeof performance === 'undefined' ? Date : performance ).now();

            if ( typeof Urls === 'string' || Urls instanceof String ) urls.push( Urls );
            else urls = urls.concat( Urls );


            var callback = Callback || function(){};
            var autoPath = AutoPath || false;
            var autoTexture = AutoTexture || false;

            if( autoTexture ) pool.setDirectTexture();

            tmp.push( { urls:urls, callback:callback, autoPath:autoPath, autoTexture:autoTexture, start:start } );

            if( !inLoading ) this.loadOne();

        },

        testTmp: function () {

            tmp.shift();

            if( tmp.length === 0 ) return; 

            tmp[0].start = ( typeof performance === 'undefined' ? Date : performance ).now();
            this.loadOne();

        },

        loadOne: function(){

            inLoading = true;

            var link = tmp[0].urls[0];
            var name = link.substring( link.lastIndexOf('/')+1, link.lastIndexOf('.') );
            var type = link.substring( link.lastIndexOf('.')+1 );

            if( tmp[0].autoTexture && imgType.indexOf( type ) !== -1 && pool.data[name] === undefined ) pool.data[name] = textureLoader.load( tmp[0].autoPath ? paths[type] + link : link );

            if( pool.data[name] !== undefined ) this.next();
            else this.loading( link, name, type );

        },

        next: function () {

            tmp[0].urls.shift();

            if( tmp[0].urls.length === 0 ){

                inLoading = false;

                var end = ( typeof performance === 'undefined' ? Date : performance ).now() - tmp[0].start;
                console.log( 'pool loading time: ', Math.floor(end), 'ms' );

                tmp[0].callback( pool.data );

                //

                this.testTmp();

            } else {

                this.loadOne();

            }

        },

        setAssetLoadTechnique: function( callback ) {

            this.loading = callback;

        },

        reset: function (){

            pool.data = null;
            //callback = null;

        },

        

        getResult : function(){

            return pool.data;

        },

        meshByName : function ( name ){

            var ar = pool.data[ name ];
            var meshs = {}
            var i = ar.length;

            while(i--){
                meshs[ ar[i].name ] = ar[i];
            }

            return meshs;

        },

        getMesh : function ( name, meshName ){

            var ar = pool.data[name];
            var i = ar.length;
            while(i--){
                if( ar[i].name === meshName ) return ar[i];
            }

        },
        
        progress: function ( loaded, total ) {

        },

        loading: function ( link, name, type ) {

            var self = this;

            if( tmp[0].autoPath ) link = paths[type] + link;

            var xhr = new XMLHttpRequest();
            xhr.open('GET', link, true );

            if( type === "json" ) xhr.overrideMimeType("application/json");

            switch( type ){

                case 'sea': case 'z': case 'hex': case 'wasm': case 'mp3': case 'wav': xhr.responseType = "arraybuffer"; break;
                case 'jpg': case 'png': xhr.responseType = 'blob'; break;
                case 'bvh': case 'BVH': case 'glsl':  xhr.responseType = 'text'; break;

            }
            
            //xhr.responseType = 'blob';
            //xhr.onload = function() { self.load_blob( xhr.response, name, type ); }
            //xhr.onload = function() { self.load_direct( xhr.response, name, type ); }

            xhr.onprogress = function ( e ) {

                if ( e.lengthComputable ) self.progress( e.loaded, e.total );

            };

            xhr.onreadystatechange = function () {

                if ( xhr.readyState === 2 ) { //xhr.getResponseHeader("Content-Length");
                } else if ( xhr.readyState === 3 ) { //  progress
                } else if ( xhr.readyState === 4 ) {
                    if ( xhr.status === 200 || xhr.status === 0 ) self.load_direct( xhr.response, name, type );
                    else console.error( "Couldn't load ["+ name + "] [" + xhr.status + "]" );
                }

            };
            
            xhr.send( null );

        },

        //

        load_direct: function ( response, name, type ) {

            var self = this;

            switch( type ){
     
                case 'sea':

                    var lll = new THREE.SEA3D();

                    lll.onComplete = function( e ) { 
                        //pool.data[name] = lll.meshes;

                        self.set( name, lll.meshes );
                        self.next();
                    }

                    lll.load( response );
                    //lll.file.read( response );

                break;
                case 'jpg': case 'png':

                    var img = new Image();
                    img.onload = function(e) {
                        URL.revokeObjectURL( img.src ); // Clean up after yourself.
                        //pool.data[name] = img;
                        self.set( name, img );
                        self.next();
                    };

                    img.src = URL.createObjectURL( response );
                    
                break;

                case 'mp3': case 'wav':

                    var bufferCopy = response.slice( 0 );
                    THREE.AudioContext.getContext().decodeAudioData( 
                        bufferCopy, 
                        function( buffer ){ self.buffer[name] = buffer;/*audio.add( name, buffer );*/ self.next(); }, 
                        function( error ){ console.error('decodeAudioData error', error); }
                    );

                break;

                case 'z': case 'hex':

                    //pool.data[name] = SEA3D.File.LZMAUncompress( response );
                    self.set( name, SEA3D.File.LZMAUncompress( response ) );
                    self.next();

                break;

                case 'bvh': case 'BVH': case 'glsl':

                    //pool.data[name] = response;
                    self.set( name, response );
                    self.next();

                break;

                case 'json':

                    //pool.data[name] = JSON.parse( response );
                    self.set( name, JSON.parse( response ) );
                    self.next();

                break;

                case 'wasm':

                    //pool.data[name] = new Uint8Array( response );
                    self.set( name, new Uint8Array( response ) );
                    self.next();

                break;

            }

        },

        ///  

        load_blob: function ( blob, name, type ) {

            var self = this;
            var reader = readers || new FileReader();

            if( type === 'png' || type === 'jpg' ) reader.readAsDataURL( blob );
            else if( type === 'json' || type === 'glsl' || type === 'bvh' || type === 'BVH' ) reader.readAsText( blob );
            else reader.readAsArrayBuffer( blob );

            reader.onload = function( e ) {

                switch( type ){
 
                    case 'sea':

                        var lll = new THREE.SEA3D();

                        lll.onComplete = function( e ) { 
                            //pool.data[name] = lll.meshes;
                            self.set( name, lll.meshes );
                            self.next(); 
                        }

                        lll.load( e.target.result );
                        //lll.file.read( e.target.result );

                    break;
                    case 'jpg': case 'png':

                        pool.data[name] = new Image();
                        pool.data[name].src = e.target.result;
                        self.next();

                    break;
                    case 'z':

                        //pool.data[name] = SEA3D.File.LZMAUncompress( e.target.result );
                        self.set( name, SEA3D.File.LZMAUncompress( e.target.result ) );
                        self.next();

                    break;
                    case 'bvh': case 'BVH': case 'glsl':

                        //pool.data[name] = e.target.result;
                        self.set( name, e.target.result );
                        self.next();

                    break;

                    case 'json':

                        self.set( name, JSON.parse( e.target.result ) );
                        self.next();

                    break;

                }

            }

        }

    };

    return pool;

})();