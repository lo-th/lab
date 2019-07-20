/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*/

function Environement ( view ) {

    this.mapReady = 0;
    this.shaderReady = false;
    this.isPreload = false;
    this.isPreloadShader = false;
    this.callback = function (){};


	this.isAutoSky = false;
	this.isBasicSky = false;

    this.viewBg = true;

	this.view = view;

    // textures Loader
    this.loader = view.loader;

    this.basicEnvmap = new THREE.Texture();



    // basic map

	/*this.basicEnvmap = this.loader.load( './assets/textures/spherical/sky.jpg', function ( texture ) { texture.mapping = THREE.SphericalReflectionMapping; this.mapReady++; this.callback(); }.bind(this) );
    this.noiseMap = this.loader.load( "assets/textures/sky/noise.png", function ( texture ) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.flipY = false; this.mapReady++; this.callback(); }.bind(this)  );
    this.nightSpaceMap = this.loader.load( "assets/textures/sky/milkyway.jpg", function ( texture ) {  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; this.mapReady++; this.callback(); }.bind(this)  );

    // shader Loader
    this.shader = new THREE.ShaderLoader();
    this.shader.path = './assets/shaders/';
    this.shader.load(['sky_v.vs', 'sky_f.fs', 'basic_sky_f.fs'], function () { 
        
        BasicSky.vertexShader = this.shader.shader.sky_v;
        BasicSky.fragmentShader = this.shader.shader.basic_sky_f;
        SuperSkyShader.vertexShader = this.shader.shader.sky_v;
        SuperSkyShader.fragmentShader = this.shader.shader.sky_f;

        this.shaderReady = true; 
        this.callback();

    }.bind(this) );*/

	this.isHdr = false;

	this.n = 0;

	this.debug = true;

	this.needsUpdate = false;

	// contant sun color
	this.sv0 = new THREE.Vector3( 0, .99, 0 );
    this.sv1 = new THREE.Vector3( .188, .458, .682 );

    this.lup = new THREE.Vector3( 0, 1.0, 0 );

    this.torad = 0.0174532925199432957;

    this.colors = {
        sun:new THREE.Color(1,1,1),
        moon:new THREE.Color(1,1,1),
        ground:new THREE.Color(0,0,0),
        sky:new THREE.Color(0,0,0),
        fog:new THREE.Color(0,0,0),
        fogbase:new THREE.Color(0,0,0),
    };

    
    this.bg = false;
    this.tmpBg = false;

    this.q = this.view.isMobile ? 2 : 4;
	this.resolution = 128*this.q;

    
	this.setting = {

		distance: 10000,
		resolution: this.resolution,

		timelap:0,
		fog:0.1,
		cloud_size: .45,
		cloud_covr: .3,
		cloud_dens: 40,

		sample:32*this.q,
		iteration:2*this.q,

		inclination: 45,
		azimuth: 90,
		hour: 12,

		toneMapping: 'No',
		exposure:1.22,
		whitePoint:1.25,

		cloudColor: 0xFFFFFF,
		groundColor: 0x3b4c5a,
		fogColor: 0x9fabb2,

	}

    //console.log(this.resolution, this.setting.sample)

	this.astralDistance = 1;

	this.material = new THREE.ShaderMaterial({});

	this.sunPosition = new THREE.Vector3();
    this.moonPosition = new THREE.Vector3();

    this.sunSphere = new THREE.Spherical();
    this.moonSphere = new THREE.Spherical();

    
    

    this.scene = new THREE.Scene();
	this.sphere = new THREE.Mesh( new THREE.SphereBufferGeometry( 1, 32, 32 ), this.material );
	this.scene.add( this.sphere );
	
	var options = { type:THREE.UnsignedByteType, encoding:THREE.RGBEEncoding, format: THREE.RGBAFormat, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps:false, anisotropy:0 };
	//if( this.isHdr ) options = { type:THREE.UnsignedByteType, encoding:THREE.RGBEEncoding , format: THREE.RGBAFormat, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps:false, anisotropy:0 };
	//else options = { type:THREE.UnsignedByteType, format: THREE.RGBAFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter };
	this.camera = new THREE.CubeCamera( 0.1, 1, this.resolution, options );
	this.scene.add( this.camera );

    //this.initColorTest();

	

	THREE.Group.call( this );
	this.view.followGroup.add( this );

}


Environement.prototype = Object.assign( Object.create( THREE.Group.prototype ), {

    constructor: Environement,

    setResolution: function ( r ) {

        this.resolution = r;
        var options = { type:THREE.UnsignedByteType, encoding:THREE.RGBEEncoding, format: THREE.RGBAFormat, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps:false, anisotropy:0 };
        this.camera = new THREE.CubeCamera( 0.1, 1, this.resolution, options );


    },

    defaultSky: function () {
        
        //this.material.dispose();

        
        

        this.isAutoSky = false;
        this.isBasicSky = false;
        this.tmpBg = false;
        this.isHdr = false;

        this.view.scene.background = null;
        this.view.envmap = this.basicEnvmap;
        this.view.updateEnvMap();

        //console.log( 'reset', this.isAutoSky, this.isBasicSky )
        
    },

    setSky: function ( o ) {

        o = o || {}

        this.tmpBg = o.bg !== undefined ? o.bg : true;
        this.isHdr = o.hdr !== undefined ? o.hdr : false;
        //this.setting.hour = o.hour !== undefined ? o.hour : 12;

        for ( var name in o ) {
            if ( this.setting[ name ] !== undefined ) this.setting[ name ] = o[ name ];
        }

        this.viewBg = o.visible !== undefined ? o.visible : true;

        if( o.url !== undefined ){
            this.load( o.url );
        } else {
            this.initAutoSky();
        }

        //if( o.visible !== undefined ) 

    },

    parse: function ( buffer, type ) {

        var loader, texture, o;

        if( type === 'hdr' ){

            loader = new THREE.RGBELoader();
            o = loader._parser( buffer );

            texture = new THREE.DataTexture( o.data, o.width, o.height, o.format, o.type, 300, 1001, 1001, THREE.NearestFilter, THREE.NearestFilter, 1, THREE.RGBEEncoding )
            texture.encoding = THREE.RGBEEncoding;
            
            texture.needsUpdate = true;
            this.update( texture );

        }

        if( type === 'jpg' ){

            var img = new Image();
            img.src = buffer;

            img.onload = function (){

                var texture = new THREE.Texture( img );
                texture.needsUpdate = true;
                this.initBasicSky( texture );

            }.bind(this)
           
        }

    },

	load: function ( url ) {

		//this.callback = callback || new function(){};

        var loader;
        var mapHdr = false;
        var type = url.substring( url.lastIndexOf('.')+1 );

        if( type === 'jpg' || type === 'png' ){
        	mapHdr = false;
            loader = new THREE.TextureLoader();
        }

        if( type === 'hdr' ){
        	mapHdr = true;
            loader = new THREE.RGBELoader();
        }

        var self = this;
 
        loader.load( './assets/textures/envmap/'+url, function ( texture ){ 

            if( mapHdr ){

            	texture.type = THREE.UnsignedByteType;
            	texture.encoding = THREE.RGBEEncoding;
            	texture.format = THREE.RGBAFormat;
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
                //texture.minFilter = THREE.LinearFilter;
                //texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;
                texture.anisotropy = 0;

            }
            //texture.flipY = isHdr; texture.minFilter = THREE.NearestFilter; 

            self.initBasicSky( texture, mapHdr ); 

        });

	},

    initBasicSky: function ( texture, mapHdr ) {

        if( texture !== undefined ) this.tmptexture = texture;
        if( mapHdr !== undefined ) this.tmpMapHdr = mapHdr !== undefined ? mapHdr : false;

        //if( !this.isPreloadShader ) this.preloadderShader();

    	if( !this.isBasicSky ){

            /*if( !this.shaderReady ){
                this.callback = this.initBasicSky;
                return;
            } else {
                this.callback = function (){};
            }*/

    		this.material.dispose();
	    	this.material = new THREE.ShaderMaterial( BasicSky );
	    	this.sphere.material = this.material;
	    	this.isBasicSky = true;

    	}

    	this.material.uniforms.map.value = this.tmptexture;
        this.material.uniforms.isHdr.value = this.tmpMapHdr ? 1 : 0;
        //this.needsUpdate = true;

        this.render();

        //this.showBackground( this.viewBg )

    },

    preloadderShader: function () {

        this.isPreloadShader = true;

        // shader Loader
        this.shader = new THREE.ShaderLoader();
        this.shader.path = './assets/shaders/';
        this.shader.load(['sky_f.fs'], function () { 
            
            //BasicSky.vertexShader = this.shader.shader.sky_v;
            //BasicSky.fragmentShader = this.shader.shader.basic_sky_f;
            SuperSkyShader.vertexShader = BasicSky.vertexShader;//this.shader.shader.sky_v;
            SuperSkyShader.fragmentShader = this.shader.shader.sky_f;

            this.shaderReady = true; 
            this.callback();

        }.bind(this) );

    },

    preloadder: function () {

        this.isPreload = true;

        // basic map

        //this.basicEnvmap = this.loader.load( './assets/textures/spherical/sky.jpg', function ( texture ) { texture.mapping = THREE.SphericalReflectionMapping; this.mapReady++; this.callback(); }.bind(this) );
        this.noiseMap = this.loader.load( "assets/textures/sky/noise.png", function ( texture ) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.flipY = false; this.mapReady++; this.callback(); }.bind(this)  );
        this.nightSpaceMap = this.loader.load( "assets/textures/sky/milkyway.jpg", function ( texture ) {  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; this.mapReady++; this.callback(); }.bind(this)  );


    },

    initAutoSky: function () {


    	if( !this.isAutoSky ){

            if( !this.isPreload ) this.preloadder();
            if( !this.isPreloadShader ) this.preloadderShader();

            //console.log(this.mapReady)

            if( this.mapReady !== 2 || !this.shaderReady ){
                this.callback = this.initAutoSky;
                return;
            } else {
                this.callback = function (){};
            }

	    	this.material.dispose();

	    	var setting = this.setting;

	    	//var noiseMap = this.loader.load( "assets/textures/sky/noise.png", function ( texture ) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.flipY = false; this.needsUpdate = true; }.bind(this) );
		    //var nightMap = loader.load( "assets/textures/sky/milkyway.png" );

		    //var nightSpaceMap = this.loader.load( "assets/textures/sky/milkyway.jpg", function ( texture ) {  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; this.needsUpdate = true; }.bind(this) );

		    var lens0 = this.loader.load( "assets/textures/sky/lens0.png" );
		    var lens1 = this.loader.load( "assets/textures/sky/lens1.png" );
		    var lensSun = this.loader.load( "assets/textures/sky/lensSun.png" );
		    var lensMoon = this.loader.load( "assets/textures/sky/lensMoon.png" );

	    	// fake sun / moon
	        //this.sun = new THREE.Sprite( new THREE.SpriteMaterial( { map:lensSun, blending:THREE.AdditiveBlending, opacity:0.5 } ) );
	        //this.moon = new THREE.Sprite( new THREE.SpriteMaterial( { map:lensMoon, blending:THREE.AdditiveBlending, opacity:0.5 } ) );
            //this.add( this.moon );

	    	this.lensflare = new THREE.Lensflare();
		    var c = this.colors.sun;
			this.lensflare.addElement( new THREE.LensflareElement( lensSun, 30, 0, c ) );
			this.lensflare.addElement( new THREE.LensflareElement( lens0, 700, 0.01, c ) );
			this.lensflare.addElement( new THREE.LensflareElement( lens1, 60, 0.6, c ) );
			this.lensflare.addElement( new THREE.LensflareElement( lens1, 70, 0.7, c ) );
			this.lensflare.addElement( new THREE.LensflareElement( lens1, 120, 0.9, c ) );
			this.lensflare.addElement( new THREE.LensflareElement( lens1, 70, 1, c ) );
			this.add( this.lensflare );

			
			

		    var uniforms = SuperSkyShader.uniforms;
		    uniforms.noiseMap.value = this.noiseMap;
		    uniforms.nightMap.value = this.nightSpaceMap;
		    uniforms.isHdr.value = this.isHdr? 1:0;
		    uniforms.lightdir.value = this.sunPosition;
		    uniforms.cloud_size.value = setting.cloud_size;
		    uniforms.cloud_covr.value = setting.cloud_covr;
		    uniforms.cloud_dens.value = setting.cloud_dens;
		    uniforms.cloudColor.value = new THREE.Color( setting.cloudColor );
		    uniforms.groundColor.value = new THREE.Color( setting.groundColor );
		    uniforms.cloudColor.value = new THREE.Color( setting.cloudColor );

            var fogColor = new THREE.Color( setting.fogColor );
		    uniforms.fogColor.value = fogColor;
		    uniforms.fog.value = setting.fog;
            this.view.setFogColor( fogColor );

            this.colors.fogbase.copy( fogColor );
            this.colors.fog.copy( fogColor );
		    
		    uniforms.nSample.value = setting.sample;
		    uniforms.iteration.value = setting.iteration;
            uniforms.iteration.value = setting.iteration

            setting.timelap = setting.hour;
            uniforms.timelap.value = setting.timelap;

            

            this.material = new THREE.ShaderMaterial( SuperSkyShader );

            
            //this.material.uniforms.timelap.value = s.timelap;

            //console.log(this.material.uniforms) 

            this.sphere.material = this.material;

            this.isAutoSky = true;
            
			//this.initColorTest();
			this.setSize();
			this.updateAutoSky();

		}

	},

    showBackground: function ( b ) {

        //if( b !== this.bg ){

            this.bg = b;
            this.view.scene.background = this.bg ? this.camera.renderTarget : null;

        //}

    },

    

    clear: function () {

        if( this.isAutoSky ){



        	//this.remove( this.sun );
        	//this.remove( this.moon );
            this.remove( this.lensflare );
        	//this.remove( this.dome );

        	//this.view.followGroup.remove( this );
        }

        this.defaultSky();

    },

    setSize: function ( v ) {

    	if( v !== undefined ) this.setting.distance = v;
    	var s = this.setting.distance * 0.05;
    	//console.log(s)
    	this.astralDistance = this.setting.distance; //- s;
    	//console.log( this.astralDistance )
    	//this.dome.scale.set( 1,1,1 ).multiplyScalar( this.setting.distance );
    	//this.sun.scale.set( s,s,1 );
    	//this.moon.scale.set( s,s,1 );

    	//console.log(s)

    },

    k: function ( e, p ) {

    	var n = p.dot(p), a = 2 * p.dot(e), o = e.dot(e) - 1, 
    	    r = a * a - 4 * n * o,
            i = Math.sqrt(r), l = (-a - i) * 0.5;
        return o / l;

    },

    calculateSunColor: function ( position ) {

    	var c = { r:0, g:0, b:0 };
    	var e = 0.028 / this.k( this.sv0, position );
    	var t = 1.8;
    	var r = position.y >= 0 ? 1 : 0;
    	c.r = (t - t * Math.pow( this.sv1.x, e )) * r;
    	c.g = (t - t * Math.pow( this.sv1.y, e )) * r;
    	c.b = (t - t * Math.pow( this.sv1.z, e )) * r;
    	c.r = c.r > 1.0 ? 1.0 : c.r;
        c.g = c.g > 1.0 ? 1.0 : c.g;
        c.b = c.b > 1.0 ? 1.0 : c.b;
    	this.colors.sun.setRGB( c.r, c.g, c.b );

        var mr = 1 - c.r;
        var mg = 1 - c.g;
        var mb = 1 - c.b;
        
        this.colors.moon.setRGB( mr, mg, mb );

    },

    timelap: function ( t, frame ) {

        frame = frame || 16;

    	var s = this.setting;
    	s.hour += t;
    	if(s.hour>24) s.hour = 0;
        if(s.hour<0) s.hour = 24;

        this.n ++;

        if( this.n === frame ){
        	this.n = 0;
            this.updateAutoSky();
        }

    },

    setOption: function ( o ){

    	o = o || {};
    	var s = this.setting;

    	for( var i in o ){
			if( s[i] !== undefined ) s[i] = o[i];
		}

		this.updateAutoSky();

    },

    updateAutoSky: function () {

        if( !this.isAutoSky ) return;

    	var s = this.setting;
    	var r = this.torad;

    	s.inclination = ( s.hour * 15 ) - 90;
    	s.timelap = s.hour;

    	this.sunSphere.phi = ( s.inclination - 90 ) * r;
        this.sunSphere.theta = ( s.azimuth - 90 ) * r;
        this.sunPosition.setFromSpherical( this.sunSphere );

        
        this.moonSphere.phi = ( s.inclination + 90 ) * r;
        this.moonSphere.theta = ( s.azimuth - 90 ) * r;
        this.moonPosition.setFromSpherical( this.moonSphere );

        

        // fake sun / moon
        //this.sun.position.copy( this.sunPosition ).multiplyScalar( this.astralDistance );
        //this.moon.position.copy( this.moonPosition ).multiplyScalar( this.astralDistance );
        this.lensflare.position.copy( this.sunPosition ).multiplyScalar( this.astralDistance );



        this.calculateSunColor( this.sunPosition );

       // this.sun.material.color.copy( this.colors.sun );
       // this.moon.material.color.copy( this.colors.moon );

        

        // light

        this.view.sun.position.copy( this.sunPosition ).multiplyScalar( this.view.lightDistance );
        this.view.moon.position.copy( this.moonPosition ).multiplyScalar( this.view.lightDistance );
        //this.view.sun.lookAt( this.view.followGroup.position )//target.position.set(0,0,0)

        this.view.sun.color.copy( this.colors.sun );
        this.view.sun.intensity = this.colors.sun.r + (this.colors.sun.r*0.3);
        this.view.moon.color.copy( this.colors.moon );
        this.view.moon.intensity = this.colors.moon.r - (this.colors.moon.r*0.6);

        var fg = this.colors.moon.r * 0.6;
        this.colors.fog.setRGB( this.colors.fogbase.r-fg, this.colors.fogbase.g-fg, this.colors.fogbase.b-fg );
        this.view.setFogColor( this.colors.fog );

		this.material.uniforms.timelap.value = s.timelap;
		this.material.uniforms.fog.value = s.fog;
		this.material.uniforms.cloud_size.value = s.cloud_size;
		this.material.uniforms.cloud_covr.value = s.cloud_covr;
		this.material.uniforms.cloud_dens.value = s.cloud_dens;

        this.render();

    },

    render: function () {

        var view = this.view;



		this.camera.update( view.renderer, this.scene );

       // 
       //this.getColor();
			
		//if( view.envmap ) view.envmap.dispose();
		view.envmap = this.isHdr ? this.convertToHdr() : this.camera.renderTarget.texture;

		

        //view.scene.background = this.tmpBg ? this.camera.renderTarget : null;

        this.showBackground( this.viewBg );

		view.updateEnvMap();


    },

    convertToHdr: function () {

    	var pmremGenerator = new THREE.PMREMGenerator( this.camera.renderTarget.texture, 32, 256 );
        pmremGenerator.update( this.view.renderer );

        var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
        pmremCubeUVPacker.update( this.view.renderer );

        var hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;

        pmremGenerator.dispose();
        pmremCubeUVPacker.dispose();

        return hdrCubeRenderTarget.texture;

    },

    initColorTest: function () {

    	//if( !this.view.isWithSphereLight ) return;

    	this.pixelRender = new THREE.WebGLRenderTarget( 2,2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: this.view.isGl2 ? THREE.UnsignedByteType : THREE.FloatType } );
        this.vMid = new THREE.Vector3( 0,0,1 );
        this.vUp = new THREE.Vector3( 0,1,0 );
        this.vDown = new THREE.Vector3( 0,-1,0 );
        var x = 0.1;
        this.camPixel = new THREE.OrthographicCamera( -x, x, x, -x, 0.1, 1 );
        this.scene.add( this.camPixel );

    },

    getColor: function () {

        var currentRenderTarget = this.view.renderer.getRenderTarget();

        var rgb = this.view.isGl2 ? Math.inv255 : 1;
        var read = this.view.isGl2 ? new Uint8Array( 4 ) : new Float32Array( 4 );

        //var read = new Float32Array( 4 );
        //view.renderer.readRenderTargetPixels( hdrCubeRenderTarget, 0, 128, 1, 1, read );
        //this.colors.fog.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

    	/*if( this.view.isWithFog ) {


	    	var rgb = this.view.isGl2 ? Math.inv255 : 1;
	        var read = this.view.isGl2 ? new Uint8Array( 4 ) : new Float32Array( 4 );

	        this.camPixel.lookAt( this.vMid );
	        this.view.renderer.render( this.scene, this.camPixel, this.pixelRender, true );

	        this.view.renderer.readRenderTargetPixels( this.pixelRender, 0, 0, 1, 1, read );
	        this.colors.fog.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

	        //console.log(this.colors.fog.getHexString())

	        //this.view.fog.color.copy( this.colors.fog );
            this.view.setFogColor( this.colors.fog );
	    }*/

        //if( this.view.isWithSphereLight ) {

            //this.view.renderer.clear();

	        /*this.camPixel.lookAt( this.vUp );
            this.view.renderer.setRenderTarget( this.pixelRender );
	        this.view.renderer.render( this.scene, this.camPixel );
	        this.view.renderer.readRenderTargetPixels( this.pixelRender, 0, 0, 1, 1, read );
	        this.colors.sky.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

	        this.camPixel.lookAt( this.vDown );
	        this.view.renderer.render( this.scene, this.camPixel );
	        this.view.renderer.readRenderTargetPixels( this.pixelRender, 0, 0, 1, 1, read );
	        this.colors.ground.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );*/

            this.camPixel.lookAt( this.vUp );
            this.view.renderer.setRenderTarget( this.pixelRender );
            this.view.renderer.render( this.scene, this.camPixel );
            this.view.renderer.readRenderTargetPixels( this.pixelRender, 0, 0, 1, 1, read );
            this.colors.fog.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

            this.view.setFogColor( this.colors.fog );

	        
          //  this.view.sphereLight.color.copy( this.colors.sky );
	       // this.view.sphereLight.groundColor.copy( this.colors.ground );
	        //this.view.sphereLight.intensity = 0.6;
           

	        //this.view.ambient.color.copy( this.colors.ground );

	    //}

        this.view.renderer.setRenderTarget( currentRenderTarget );

    },

    /*getEnvMap: function () {

    	return this.camera.renderTarget.texture;

    },*/

    /*updateMatrixWorld: function ( force ) {

    	this.render();

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate || force ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].updateMatrixWorld( force );

		}

	},*/

 });




var BasicSky = {

    uniforms:{
        map: { value: null },
        decode: { value: 0 },
        isHdr: { value: 1 },
        rev: { value: 0 },
        alpha:{ value: 0.5 },
    },

    //vertexShader: this.shader.shader.sky_v,
    //fragmentShader: this.shader.shader.basic_sky_f,


    vertexShader: [
    'varying vec2 vUv;',
    'varying vec3 worldPosition;',
    'void main() {',
        'vUv = uv;',
        'worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
    '}'
    ].join("\n"),

    fragmentShader: [

    '#include <common>',

    '#define GOLDEN 1.61803398875',

    'vec4 ToRGBE( in vec4 value ) {',
		'float maxComponent = max( max( value.r, value.g ), value.b );',
		'float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );',
		'return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );',
	'}',

    'vec4 toHDR( in vec4 c ) {',
        'vec3 v = c.rgb;',
        'v = pow( abs(v), vec3( GOLDEN ));',// exposure and gamma increase to match HDR
        'return ToRGBE( vec4(v.r, v.g, v.b, 1.0) );',
    '}',

    'uniform sampler2D map;',
    'uniform int decode;',
    'uniform int isHdr;',
    'uniform int rev;',
    'varying vec2 vUv;',
    'uniform float alpha;',

    'void main() {',
        'int flip = isHdr;',
        'vec2 uVx = vec2( rev == 1 ? 0.5 - vUv.x : vUv.x, flip == 1 ? 1.0 - vUv.y : vUv.y );',
        'vec4 c = texture2D( map, uVx );',
        'vec4 color = isHdr == 1 ? c : toHDR( c );',
        
        'gl_FragColor = decode == 1 ? RGBEToLinear( color ) : color;',
    '}'
    ].join("\n"),

    depthTest: false,
    depthWrite: false,
    side: THREE.BackSide,
    fog:false,

};


// @author Artur Vill _ @shaderology

var SuperSkyShader = {

	uniforms: {

		isHdr: {value: 0},

		nightMap: { value: null },
		noiseMap: { value: null },
		lightdir: { value: new THREE.Vector3() },
		
        cloud_size: { value: 0.3 },
        cloud_covr: { value: 0.45 },
        cloud_dens: { value: 40 },
        cloudColor: { value: new THREE.Color() },
        groundColor: { value: new THREE.Color() },
        fogColor: { value: new THREE.Color() },
        fog: { value: 0 },
        timelap: { value: 0 },

        nSample: { value: 0 },
        iteration: { value: 0 }

	},

    

	/*vertexShader:[
	    'varying vec2 vUv;',
		'varying vec3 worldPosition;',
		'void main(){',
		'   vUv = uv;',
		'	worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'
	].join( '\n' ),

	fragmentShader: [

	    '#define GOLDEN 1.61803398875',

	    'varying vec3 worldPosition;',
	    'varying vec2 vUv;',

	    'uniform int isHdr;',
		'uniform vec3 fogColor;',
		'uniform vec3 groundColor;',
		'uniform vec3 cloudColor;',
		'uniform sampler2D noiseMap;',
		'uniform sampler2D nightMap;',
		'uniform vec3 lightdir;',
		'uniform float fog;',
		'uniform float cloud_size;',
		'uniform float cloud_covr;',
		'uniform float cloud_dens;',
		'uniform float timelap;',

		'uniform float nSample;',
		'uniform float iteration;',

		'const float c = 6.36e6;',
		'const float d = 6.38e6;',
		'const float g = 0.76;',
		'const float h = g*g;',
		'const float icc = 1.0/8e3;',
		'const float jcc = 1.0/1200.0;',
		'const float pi = 3.141592653589793;',
		'const vec3 vm = vec3( 0,-c,0 );',
		'const vec3 vn = vec3( 2.1e-5 );',
		'const vec3 vo = vec3( 5.8e-6, 1.35e-5, 3.31e-5 );',

		//#define USE_PROCEDURAL

		'#ifdef USE_PROCEDURAL',

		'float hash( float n ) { return fract(sin(n)*753.5453123); }',

		'float noise( in vec3 x ){',

		'    vec3 p = floor(x);',
		'    vec3 f = fract(x);',
		'    f = f*f*(3.0-2.0*f);',
		    
		'    float n = p.x + p.y*157.0 + 113.0*p.z;',
		'    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),',
		'                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),',
		'               mix(mix( hash(n+113.0), hash(n+114.0),f.x),',
		'                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);',
		'}',

		'#else',

		// optimized noise from map

		'float noise( in vec3 x ){',

		'    vec3 p = floor(x);',
		'    vec3 f = fract(x);',
		'    f = f*f*(3.0-2.0*f);',
		    
		'    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;',
		'    vec2 rg = texture2D( noiseMap, (uv+0.5)/256.0, -16.0 ).yx;',
		'    return mix( rg.x, rg.y, f.z );',
		'}',

		'#endif',


		'float NOISE( vec3 r ){',

		'	r.xz += timelap;',
		'	r *= 0.5;',
		'	float s;',
		'	s = 0.5 * noise(r);',
		'	r = r * 2.52;',
		'	s += 0.25 * noise(r);',
		'	r = r * 2.53;',
		'	s += 0.125 * noise(r);',
		'	r = r * 2.51;',
		'	s += 0.0625 * noise(r);',
		'	r = r * 2.53;',
		'	s += 0.03125 * noise(r);',
		'	r = r * 2.52;',
		'	s += 0.015625 * noise(r);',
		'	return s;',

		'}',

		'float MakeNoise( vec3 r ){',

		'	float s,t;',
		'	s = NOISE( r * 2e-4 * ( 1.0 - cloud_size ) );',
		'	t = ( 1.0 - cloud_covr ) * 0.5 + 0.2;',
		'	s = smoothstep( t, t+.2 , s );',
		'	s *= 0.5 * cloud_dens;',
		'	return s;',

		'}',

		'void cloudLayer( in vec3 r,out float s,out float t,out float u ){',

		'	float v,w;',
		'	v = length( r-vm ) - c;',
		'	w = 0.0;',
		'	if( 5e3 < v && v < 1e4 ) w = MakeNoise( r ) * sin( pi*(v-5e3)/5e3 );',
		'	s = exp(-v*icc) + fog;',
		'	t = exp(-v*jcc) + w + fog;',
		'	u = w + fog;',

		'}',

		'float ca( in vec3 r,in vec3 s,in float t ){',

		'	vec3 u = r-vm;',
		'	float v,w,x,y,z,A;',
		'	v = dot(u,s);',
		'	w = dot(u,u)-t*t;',
		'	x = v*v-w;',
		'	if( x<0.0 ) return -1.0;',
		'	y = sqrt(x);',
		'	z = -v-y;',
		'	A = -v+y;',
		'	return z >= 0.0 ? z : A;',

		'}',

		'vec3 makeSky( in vec3 r, in vec3 s, out float t){',

		'   int SAMPLE = int( nSample );',
		'   int STEP = int ( iteration ) ;',
			
		'	float u,v,w,x,y,z,A,B,C,m,F;',
		'	vec3 p = normalize( lightdir );',
		'	u = ca(r,s,d);',
		'	v = dot(s,p);',
		'	w = 1.0+v*v;',
		'	x = 0.0596831*w;',
		'	y = 0.0253662*(1.0-h)*w/((2.0+h)*pow(abs(1.0+h-2.0*g*v),1.5));',
		'	z = 50. * pow( abs(1.+dot(s,-p)),2.0 ) * dot( vec3(0,1,0), p ) * ( 1.0-cloud_covr ) * ( 1.0 - min( fog, 1.0 ) );',
		'	A = 0.0;',
		'	B = 0.0;',
		'	C = 0.0;',
		'	m = 0.0;',
		'	vec3 D,E;',
			//float H,J,K,L,M, N,O,P,Q, S,U,V,W;
		'	D = vec3(0);',
		'	E = vec3(0);',
		'	F = u / float( SAMPLE );',

		'	for( int G=0; G<SAMPLE; ++G ){',
		'		float H,J,K,L,M;',
		'		H = float(G)*F;',
		'		vec3 I = r + s * H;',
		'		L = 0.0;',
		'		cloudLayer( I, J, K, L );',
		'		J *= F;',
		'		K *= F;',
		'		A += J;',
		'		B += K;',
		'		C += L;',
		'		M = ca(I,p,d);',
		'		if( M > 0.0 ){',
		'			float N,O,P,Q;',
		'			N=M/float(STEP);',
		'			O=0.0;',
		'			P=0.0;',
		'			Q=0.0;',
		'			for( int R=0; R<STEP; ++R ){',
		'				float S,U,V,W;',
		'				S = float(R)*N;',
		'				vec3 T=I+p*S;',
		'				W = 0.0;',
		'				cloudLayer( T, U, V, W );',
		'				O+=U*N;',
		'				P+=V*N;',
		'				Q+=W*N;',
		'			}',
		'			vec3 S = exp(-(vo*(O+A)+vn*(P+B)));',
		'			m+=L;',
		'			D+=S*J;',
		'			E+=S*K+z*m;',
		'		}',
		'		else return vec3(0.0);',
		'	}',
		'	t = m * 0.0125;',
		'	return ( (D * vo * x) + (E * vn * y)) * 15.0;',
		'}',

		'vec2 Q(vec3 e){',
		'	return vec2(.5+atan(e.z,e.x)/(2.*pi),.5+atan(e.y,length(e.xz))/pi);',
		'}',

		'vec2 QQ(vec3 e){',
		'	return vec2(vUv.x+atan(e.z,e.x)/(2.*pi),vUv.y+atan(e.y,length(e.xz))/pi);',
		'}',

		'mat3 R(vec3 e,vec3 f){',
		'	vec3 g,h;',
		'	g = normalize(cross(f,e));',
		'	h = normalize(cross(e,g));',
		'	return mat3(g.x,g.y,g.z,h.x,h.y,h.z,e.x,e.y,e.z);',
		'}',

		'vec4 ToRGBE( in vec4 value ) {',
			'float maxComponent = max( max( value.r, value.g ), value.b );',
			'float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );',
			'return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );',
		    //'return vec4( value.brg, ( 3.0 + 128.0 ) / 256.0 );',
		'}',


		'vec4 toHDRX( in vec4 c ) {',
	        'vec3 v = c.rgb;',
	        'v = pow( abs(v), vec3( GOLDEN ));',// exposure and gamma increase to match HDR
	        'return ToRGBE( vec4(v.r, v.g, v.b, 1.0) );',
	    '}',


		'void main(){',

		'	vec3 light = normalize( lightdir );',
		'	vec3 r = normalize( worldPosition );',
		'	vec3 f = R( light, vec3(0,1,0) )*r;',
		'	float uvy = acos( r.y ) / pi;',

		'	float top = uvy <= 0.505 ? 1.0 : smoothstep(1.0, 0.0, (uvy-0.505)*25.0);',
		'	float low = uvy > 0.505 ? 1.0 : smoothstep(1.0, 0.0, (0.505-uvy)*100.0);',

		'	vec3 s = vec3( 0, 0.99, 0 );',
		'	float m = 0.0;',
		'	vec3 sky = clamp( makeSky( s, r, m ), vec3( 0.0 ), vec3( 10000.0 ) );',

			//float u = pow( abs( 1.0 - abs(r.y) ), 10.0 );
			//float top = r.y >= 0.0 ? 1.0 : u; 
			//float low = r.y <= 0.0 ? 1.0 : 
		'	float luma = 0.005 + max( dot( vec3( 0, 1.0, 0 ), light ), 0.0 ) * 0.2;',
			//x = ;
			//sky = mix(vec3(x),t,v*0.8);
			// cloudColor
		'	sky = mix( groundColor*luma, sky , top);',
			//sky = smoothstep( groundColor*x, sky , vec3(v));
		'	float alpha = clamp( m + low, 0.0 , 0.99 ) + 0.01;',

			//'vec3 f = R( light, vec3(0,1,0) )*r;',
		//'   vec3 star = texture2D( nightMap, QQ(f) ).rgb;',
		'   vec3 star = texture2D( nightMap, vec2( vUv.x+(timelap/24.0), vUv.y ) ).rgb*0.5;',
		//'   star = pow( abs(star), vec3( GOLDEN ));',
		'   star = ((star) - 0.5) * (1.15) + 0.5;',
		//'	star = pow( abs( star ), vec3( .5 ) );',
		'	star = star*(1.0-alpha)*clamp(pow(abs(1.-light.y),10.),0.,1.);',
		//'	star = star*(1.0-cubi.a)*clamp(pow(abs(1.-light.y),10.),0.,1.);',

		'	vec3 color = pow( abs( sky ), vec3( 0.5 ) );',
		'   vec4 final = vec4( star + color, 1.0 );',
		'	gl_FragColor = LinearToRGBE( final );',

		'}'
	].join( '\n' ),*/

	depthWrite: false,
	depthTest: false,
	side:THREE.BackSide,
	fog:false,
	
};