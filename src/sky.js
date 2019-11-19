/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*/


// RGBELoader.js
// Lensflare.js
// PMREMCubeUVPacker.js
// PMREMGenerator.js

var sky = ( function () {

'use strict';

var setting = {

	distance: 10000,
	resolution: 1024,

	timelap:0,
	fog:0.1,
	cloud_size: .45,
	cloud_covr: .3,
	cloud_dens: 40,

	sample:128,
	iteration:8,

	inclination: 45,
	azimuth: 90,
	hour: 12,

	toneMapping: 'No',
	exposure:1.22,
	whitePoint:1.25,

	cloudColor: 0xFFFFFF,
	groundColor: 0x3b4c5a,
	fogColor: 0x9fabb2,

};

var torad = 0.0174532925199432957;

var colors = null;
var options = null;

var isHdr = false;
var showBackground = false;

var n = 0;
var debug = true;


//var viewBg = false;

var sv0 = null;
var sv1 = null;
var lup = null;
var sunPosition = null;
var moonPosition = null;
var sunSphere = null;
var moonSphere = null;

var isPreload = false;

var noiseMap = null;
var nightSpaceMap = null;
var lensflare = null;


var isAutoSky = false;
var isBasicSky = false;
var astralDistance = 1;

var loader = null
var loaderRGBE = null;

var scene = null;
var camera = null;
var sphere = null;
var renderer = null;

var material = null;

//var envmap = null;

var isInit = false;

var ctxPixel = null;
var ccSize = 2;

sky = {

	mapReady:0,

	callback: function (){},

    render: function () {

        camera.update( renderer, scene );

        this.showBackground( showBackground );

        view.setEnvmap( isHdr ? this.convertToHdr() : camera.renderTarget.texture );
        view.updateEnvMap();


    },

	getHdr: function () { return isHdr; },
	//getEnvmap: function () { return envmap; },

	init: function () {

		if( isInit ) return;

		renderer = view.getRenderer();


		// contant sun color
		sv0 = new THREE.Vector3( 0, .99, 0 );
	    sv1 = new THREE.Vector3( .188, .458, .682 );
	    lup = new THREE.Vector3( 0, 1.0, 0 );

		colors = {
		    sun:new THREE.Color(1,1,1),
		    moon:new THREE.Color(1,1,1),
		    ground:new THREE.Color(0,0,0),
		    sky:new THREE.Color(0,0,0),
		    fog:new THREE.Color(0,0,0),
		    fogbase:new THREE.Color(0,0,0),
		};

		sunPosition = new THREE.Vector3();
	    moonPosition = new THREE.Vector3();

	    sunSphere = new THREE.Spherical();
	    moonSphere = new THREE.Spherical();

		loader = view.getLoader();
		

		material = new THREE.ShaderMaterial({});

		scene = new THREE.Scene();

		sphere = new THREE.Mesh( new THREE.SphereBufferGeometry( 1, 32, 32 ), material );
		scene.add( sphere );
		
		//options = { type:THREE.UnsignedByteType, encoding:THREE.RGBEEncoding, format: THREE.RGBAFormat, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, generateMipmaps:false, anisotropy:0 };
		options = { type:THREE.UnsignedByteType, encoding: THREE.RGBEEncoding, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter, anisotropy:1 };
		
		camera = new THREE.CubeCamera( 0.1, 1, setting.resolution, options );

		scene.add( camera );

		isInit = true;

	},

	clear: function () {

        if( isAutoSky ){
            view.getFollowGroup().remove( lensflare );
        }

        this.defaultSky();

    },

	setResolution: function ( r ) {

        setting.resolution = r;
        camera = new THREE.CubeCamera( 0.1, 1, setting.resolution, options );

    },

    defaultSky: function () {

        isAutoSky = false;
        isBasicSky = false;
        showBackground = false;
        isHdr = false;

        view.getScene().background = null;
        view.updateEnvMap();
        
    },

    setSky: function ( o ) {

    	if( !isInit ) this.init();

        o = o || {}

        if( o.resolution !== undefined ) this.setResolution( o.resolution );

        showBackground = o.visible !== undefined ? o.visible : false;
        isHdr = o.hdr !== undefined ? o.hdr : true;

        for ( var name in o ) {
            if ( setting[ name ] !== undefined ) setting[ name ] = o[ name ];
        }

        if( o.url !== undefined ){
            this.load( o.url );
        } else {
            showBackground = true;
            this.initAutoSky();
        }

    },

    getCube: function () {

        return camera.renderTarget.texture;

    },

    convertToHdr: function () {

    	var pmremGenerator = new THREE.PMREMGenerator( camera.renderTarget.texture, 32, 256 );
        pmremGenerator.update( renderer );

        var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
        pmremCubeUVPacker.update( renderer );

        var hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;

        pmremGenerator.dispose();
        pmremCubeUVPacker.dispose();

        return hdrCubeRenderTarget.texture;

    },

    showBackground: function ( b ) {

        view.getScene().background = b ? camera.renderTarget : null;

    },

    initBasicSky: function ( texture, mapHdr ) {

    	var tmptexture, tmpMapHdr = false;

        if( texture !== undefined ) tmptexture = texture;
        if( mapHdr !== undefined ) tmpMapHdr = mapHdr !== undefined ? mapHdr : false;

        //if( !this.isPreloadShader ) this.preloadderShader();

    	if( !isBasicSky ){

    		material.dispose();
	    	material = new THREE.ShaderMaterial( BasicSky );
	    	sphere.material = material;
	    	isBasicSky = true;

    	}

    	material.uniforms.map.value = tmptexture;
        material.uniforms.isHdr.value = tmpMapHdr ? 1 : 0;

        this.render();

    },


    preloadder: function () {

        isPreload = true;

        // sky map
        noiseMap = loader.load( "assets/textures/sky/noise.png", function ( texture ) { 
        	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
        	//texture.format = THREE.RGBFormat;
        	texture.flipY = false; 
        	sky.mapReady++; 
        	sky.callback(); 
        });
        //nightSpaceMap = loader.load( "assets/textures/sky/milkyway.jpg", function ( texture ) {  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; sky.mapReady++; sky.callback(); }  );

    },

    initAutoSky: function () {

    	if( this.isAutoSky ) return;

    	if( !isPreload ) this.preloadder();

        if( sky.mapReady !== 1 ){
            sky.callback = sky.initAutoSky;
            return;
        } else {
            sky.callback = function (){};
        }

    	material.dispose();

    	//var milky = loader.load( "assets/textures/envmap/milkyway.jpg", function ( texture ) { texture.wrapS = THREE.RepeatWrapping;  }  );
    	var stars = loader.load( "assets/textures/envmap/stars.jpg", function ( texture ) { texture.wrapS = THREE.RepeatWrapping;  }  );


	    var lens0 = loader.load( "assets/textures/sky/lens0.png" );
	    var lens1 = loader.load( "assets/textures/sky/lens1.png" );
	    var lensSun = loader.load( "assets/textures/sky/lensSun.png" );
	    //var lensMoon = loader.load( "assets/textures/sky/lensMoon.png" );

    	// fake sun / moon
        //this.sun = new THREE.Sprite( new THREE.SpriteMaterial( { map:lensSun, blending:THREE.AdditiveBlending, opacity:0.5 } ) );
        //this.moon = new THREE.Sprite( new THREE.SpriteMaterial( { map:lensMoon, blending:THREE.AdditiveBlending, opacity:0.5 } ) );
        //this.add( this.moon );

    	lensflare = new THREE.Lensflare();
	    var c = colors.sun;
		lensflare.addElement( new THREE.LensflareElement( lensSun, 30, 0, c ) );
		lensflare.addElement( new THREE.LensflareElement( lens0, 700, 0.01, c ) );
		lensflare.addElement( new THREE.LensflareElement( lens1, 60, 0.6, c ) );
		lensflare.addElement( new THREE.LensflareElement( lens1, 70, 0.7, c ) );
		lensflare.addElement( new THREE.LensflareElement( lens1, 120, 0.9, c ) );
		lensflare.addElement( new THREE.LensflareElement( lens1, 70, 1, c ) );
		view.getFollowGroup().add( lensflare );

	    var uniforms = SuperSkyShader.uniforms;
	    uniforms.noiseMap.value = noiseMap;
	   // uniforms.nightMap.value = milky;
	    uniforms.starsMap.value = stars;
	    uniforms.isHdr.value = isHdr? 1:0;
	    uniforms.sunPosition.value = sunPosition;
	    uniforms.moonPosition.value = moonPosition;
	    uniforms.cloud_size.value = setting.cloud_size;
	    uniforms.cloud_covr.value = setting.cloud_covr;
	    uniforms.cloud_dens.value = setting.cloud_dens;
	    uniforms.cloudColor.value = new THREE.Color( setting.cloudColor );
	    uniforms.groundColor.value = new THREE.Color( setting.groundColor );
	    uniforms.cloudColor.value = new THREE.Color( setting.cloudColor );

	    uniforms.withGamma.value = 1;

        var fogColor = new THREE.Color( setting.fogColor );
	    uniforms.fogColor.value = fogColor;
	    uniforms.fog.value = setting.fog;
        view.setFogColor( fogColor );

        colors.fogbase.copy( fogColor );
        colors.fog.copy( fogColor );
	    
	    uniforms.nSample.value = setting.sample;
	    uniforms.iteration.value = setting.iteration;

        setting.timelap = setting.hour;
        uniforms.timelap.value = setting.timelap;

        

        material = new THREE.ShaderMaterial( SuperSkyShader ); 

        sphere.material = material;

        isAutoSky = true;
        
		//this.initColorTest();
		this.setSize();
		this.updateAutoSky();

    },

    setSize: function ( v ) {

    	if( v !== undefined ) setting.distance = v;
    	var s = setting.distance * 0.05;
    	astralDistance = setting.distance; //- s;

    },

    updateAutoSky: function () {

        if( !isAutoSky ) return;

    	var s = setting;
    	var r = torad;

    	s.inclination = ( s.hour * 15 ) - 90;
    	s.timelap = s.hour;

    	sunSphere.phi = ( s.inclination - 90 ) * r;
        sunSphere.theta = ( s.azimuth - 90 + 12) * r;
        sunPosition.setFromSpherical( sunSphere );

        
        moonSphere.phi = ( s.inclination + 90  ) * r;
        moonSphere.theta = ( s.azimuth - 90 - 22 ) * r;
        moonPosition.setFromSpherical( moonSphere );

        

        // fake sun / moon
        //this.sun.position.copy( this.sunPosition ).multiplyScalar( this.astralDistance );
        //this.moon.position.copy( this.moonPosition ).multiplyScalar( this.astralDistance );
        lensflare.position.copy( sunPosition ).multiplyScalar( astralDistance );

        this.calculateSunColor( sunPosition );
        

        // light

        var d = view.getLightDistance();
        var sun = view.getSun();
        var moon = view.getMoon();
        

        sun.position.copy( sunPosition ).multiplyScalar( d );
        moon.position.copy( moonPosition ).multiplyScalar( d );
        //this.view.sun.lookAt( this.view.followGroup.position )//target.position.set(0,0,0)

        sun.color.copy( colors.sun );
        sun.intensity = colors.sun.r + (colors.sun.r*0.3);
        moon.color.copy( colors.moon );
        moon.intensity = (colors.moon.r - (colors.moon.r*0.6))*0.25;

        //console.log( sun.intensity, moon.intensity )

        var fg = colors.moon.r * 0.6;
        colors.fog.setRGB( colors.fogbase.r-fg, colors.fogbase.g-fg, colors.fogbase.b-fg );
        view.setFogColor( colors.fog );

		material.uniforms.timelap.value = s.timelap;
		material.uniforms.fog.value = s.fog;
		material.uniforms.cloud_size.value = s.cloud_size;
		material.uniforms.cloud_covr.value = s.cloud_covr;
		material.uniforms.cloud_dens.value = s.cloud_dens;

        this.render();

    },

    timelap: function ( t, frame ) {

        frame = frame || 16;

    	var s = setting;
    	s.hour += t;
    	if(s.hour>24) s.hour = 0;
        if(s.hour<0) s.hour = 24;

        n ++;

        if( n === frame ){
        	n = 0;
            this.updateAutoSky();
        }

    },

    setOption: function ( o ){

    	o = o || {};
    	var s = setting;

    	for( var i in o ){
			if( s[i] !== undefined ) s[i] = o[i];
		}

		this.updateAutoSky();

    },

    k: function ( e, p ) {

    	var n = p.dot(p), a = 2 * p.dot(e), o = e.dot(e) - 1, 
    	    r = a * a - 4 * n * o,
            i = Math.sqrt(r), l = (-a - i) * 0.5;
        return o / l;

    },

    calculateSunColor: function ( position ) {

    	var c = { r:0, g:0, b:0 };
    	var e = 0.028 / this.k( sv0, position );
    	var t = 1.8;
    	var r = position.y >= 0 ? 1 : 0;
    	c.r = (t - t * Math.pow( sv1.x, e )) * r;
    	c.g = (t - t * Math.pow( sv1.y, e )) * r;
    	c.b = (t - t * Math.pow( sv1.z, e )) * r;
    	c.r = c.r > 1.0 ? 1.0 : c.r;
        c.g = c.g > 1.0 ? 1.0 : c.g;
        c.b = c.b > 1.0 ? 1.0 : c.b;
    	colors.sun.setRGB( c.r, c.g, c.b );

        var mr = 1 - c.r;
        var mg = 1 - c.g;
        var mb = 1 - c.b;
        
        colors.moon.setRGB( mr, mg, mb );

    },

    // LOAD OR PARSE

    parse: function ( buffer, type ) {

        var loader, texture, o;

        if( type === 'hdr' ){

        	if( loaderRGBE === null ) loaderRGBE = new THREE.RGBELoader();

            o = loaderRGBE._parser( buffer );

            texture = new THREE.DataTexture( o.data, o.width, o.height, o.format, o.type, 300, 1001, 1001, THREE.NearestFilter, THREE.NearestFilter, 1, THREE.RGBEEncoding )
            texture.encoding = THREE.RGBEEncoding;
            
            texture.needsUpdate = true;
            sky.update( texture );

        }

        if( type === 'jpg' ){

            var img = new Image();
            img.src = buffer;

            img.onload = function (){

                var texture = new THREE.Texture( img );
                texture.needsUpdate = true;
                sky.initBasicSky( texture );

            }
           
        }

    },

	load: function ( url ) {

        var l;
        var mapHdr = false;
        var type = url.substring( url.lastIndexOf('.')+1 );

        if( type === 'jpg' || type === 'png' ){
        	mapHdr = false;
        	l = loader
        }

        if( type === 'hdr' ){
        	mapHdr = true;
        	if( loaderRGBE === null ) loaderRGBE = new THREE.RGBELoader();
            l = loaderRGBE;
        }
 
        l.load( './assets/textures/envmap/' + url, function ( texture ){ 

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

            sky.initBasicSky( texture, mapHdr ); 

        });

	},

	testColor: function ( w ){

        ccSize = w || 2;

		var canvas = document.createElement('canvas'); 
		canvas.width = ccSize * 6;
		canvas.height = ccSize;

		canvas.style.cssText = 'position:absolute; bottom:10px; left:10px; border:1px solid #000;'

		document.body.appendChild( canvas );

		ctxPixel = canvas.getContext("2d");


	},

	getCtxPixel: function () {

		return ctxPixel;

	},

    getColor: function () {

       // var currentRenderTarget = renderer.getRenderTarget();

        var gl2 = view.getGL2();

        var w = ccSize;

        var color = new THREE.Color();
        var face = 0;
        /*var coord = new THREE.Vector3();
        var dir = new THREE.Vector3();

        var norm, lengthSq, weight, totalWeight = 0;
        var shBasis = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        var sh = new THREE.SphericalHarmonics3();
        var shCoefficients = sh.coefficients;*/

        var reads = camera.getPixel( renderer, scene, w, w, gl2 );

        if( ctxPixel ){

        	for(var k = 0; k<6; k++){

	        	var d = ctxPixel.createImageData( w, w );
	        	var data = d.data;
	        	var i = data.length/4, n, m;
                var pixelSize = 2 / w;
	        	
			    while( i-- ){

			    	n = i*4;

                    color.setRGB( reads[k][n+0] / 255, reads[k][n+1] / 255, reads[k][n+2] / 255 );
                    color.copyLinearToGamma( color, 2.5 );

                    /*var col = - 1 + ( n % w + 0.5 ) * pixelSize;
                    var row = 1 - ( Math.floor( n / w ) + 0.5 ) * pixelSize;

                    switch ( k ) {

                        case 0: coord.set( - 1, row, - col ); break;
                        case 1: coord.set( 1, row, col ); break;
                        case 2: coord.set( - col, 1, - row ); break;
                        case 3: coord.set( - col, - 1, row ); break;
                        case 4: coord.set( - col, row, 1 ); break;
                        case 5: coord.set( col, row, - 1 ); break;

                    }

                    // weight assigned to this pixel

                    lengthSq = coord.lengthSq();
                    weight = 4 / ( Math.sqrt( lengthSq ) * lengthSq );
                    totalWeight += weight;

                    // direction vector to this pixel
                    dir.copy( coord ).normalize();

                    // evaluate SH basis functions in direction dir
                    THREE.SphericalHarmonics3.getBasisAt( dir, shBasis );

                    // accummuulate
                    for ( var j = 0; j < 9; j ++ ) {

                        shCoefficients[ j ].x += shBasis[ j ] * color.r * weight;
                        shCoefficients[ j ].y += shBasis[ j ] * color.g * weight;
                        shCoefficients[ j ].z += shBasis[ j ] * color.b * weight;

                    }*/

			    	data[n+0] = color.r*255;//reads[k][n+0];
			    	data[n+1] = color.g*255;//reads[k][n+1];
			    	data[n+2] = color.b*255;//reads[k][n+2];
			    	data[n+3] = 255;//reads[k][n+3];
			    }

                switch ( k ) {

                    case 0: face = 0; break;
                    case 1: face = 2; break;
                    case 2: face = 5; break;
                    case 3: face = 4; break;
                    case 4: face = 3; break;
                    case 5: face = 1; break;

                }

			    ctxPixel.putImageData(d, face*w, 0);

			}

            // normalize
            /*norm = ( 4 * Math.PI ) / totalWeight;

            for ( var j = 0; j < 9; j ++ ) {

                shCoefficients[ j ].x *= norm;
                shCoefficients[ j ].y *= norm;
                shCoefficients[ j ].z *= norm;

            }

            view.getProbe().copy( new THREE.LightProbe( sh ) );
            view.getProbe().intensity = 1.0;*/

        }

        


        //var read = view.getGL2() ? new Uint8Array( 4 ) : new Float32Array( 4 );

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

        /*    camPixel.lookAt( vUp );
            renderer.setRenderTarget( pixelRender );
            renderer.render( scene, camPixel );
            renderer.readRenderTargetPixels( pixelRender, 0, 0, 1, 1, read );
            colors.fog.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

            view.setFogColor( colors.fog );

	        
          //  this.view.sphereLight.color.copy( this.colors.sky );
	       // this.view.sphereLight.groundColor.copy( this.colors.ground );
	        //this.view.sphereLight.intensity = 0.6;
           

	        //this.view.ambient.color.copy( this.colors.ground );

	    //}

        renderer.setRenderTarget( currentRenderTarget );*/

    },




}

return sky;

})();


var BasicSky = {

    uniforms:{
        map: { value: null },
        decode: { value: 0 },
        isHdr: { value: 1 },
        rev: { value: 0 },
        alpha:{ value: 0.5 },
        withGamma: { value: 0 },
    },

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
    'uniform int withGamma;',
    'varying vec2 vUv;',
    'uniform float alpha;',

    'void main() {',
        //'int flip = isHdr;',
        //'vec2 uVx = vec2( rev == 1 ? 0.5 - vUv.x : vUv.x, flip == 1 ? 1.0 - vUv.y : vUv.y );',
        'vec2 uVx = vec2( rev == 1 ? 0.5 - vUv.x : vUv.x, vUv.y );',
        'vec4 c = texture2D( map, uVx );',
        'vec4 color = isHdr == 1 ? c : toHDR( c );',
        
        'gl_FragColor = decode == 1 ? RGBEToLinear( color ) : color;',

        //'gl_FragColor = color;',

        'if ( withGamma == 1 ){',
            '#if defined( TONE_MAPPING )',
            'gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );',
            '#endif',
            'gl_FragColor = linearToOutputTexel( gl_FragColor );',
        '}',
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

		starsMap: { value: null },
		//nightMap: { value: null },
		noiseMap: { value: null },
		sunPosition: { value: new THREE.Vector3() },
		moonPosition: { value: new THREE.Vector3() },
		
        cloud_size: { value: 0.3 },
        cloud_covr: { value: 0.45 },
        cloud_dens: { value: 40 },
        cloudColor: { value: new THREE.Color() },
        groundColor: { value: new THREE.Color() },
        fogColor: { value: new THREE.Color() },
        fog: { value: 0 },
        timelap: { value: 0 },

        nSample: { value: 0 },
        iteration: { value: 0 },

        withGamma: { value: 0 },

	},

    

	vertexShader:[
	    'varying vec2 vUv;',
		'varying vec3 worldPosition;',
		'void main(){',
		'   vUv = uv;',
		'	worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'
	].join( '\n' ),

	fragmentShader: [

	    '#include <common>',

	    '#define GOLDEN 1.61803398875',

	    'varying vec3 worldPosition;',
	    'varying vec2 vUv;',

	    'uniform int withGamma;',

	    'uniform int isHdr;',
		'uniform vec3 fogColor;',
		'uniform vec3 groundColor;',
		'uniform vec3 cloudColor;',
		'uniform sampler2D noiseMap;',
		//'uniform sampler2D nightMap;',
		'uniform sampler2D starsMap;',
		'uniform vec3 sunPosition;',
		'uniform vec3 moonPosition;',
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
		'   int STEP = int( iteration ) ;',
			
		'	float u,v,w,x,y,z,A,B,C,m,F;',
		'	vec3 p = normalize( sunPosition );',
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
		'}',

		'vec4 toHDR( in vec4 c ) {',
	        'vec3 v = c.rgb;',
	        'v = pow( abs(v), vec3( GOLDEN ));',// exposure and gamma increase to match HDR
	        'return ToRGBE( vec4(v.r, v.g, v.b, 1.0) );',
	    '}',


		'void main(){',

		'	vec3 light = normalize( sunPosition );',
		'	vec3 r = normalize( worldPosition );',
		'	vec3 f = R( light, vec3(0,1,0) )*r;',
		'	float uvy = acos( r.y ) / pi;',
		'   float uvx = atan(r.x, r.z) / pi;',

		'	float top = uvy <= 0.505 ? 1.0 : smoothstep(1.0, 0.0, (uvy-0.505)*25.0);',
		'	float low = uvy > 0.505 ? 1.0 : smoothstep(1.0, 0.0, (0.505-uvy)*100.0);',

		'	vec3 s = vec3( 0, 0.99, 0 );',
		'	float m = 0.0;',
		'	vec3 sky = clamp( makeSky( s, r, m ), vec3( 0.0 ), vec3( 10000.0 ) );',

			//float u = pow( abs( 1.0 - abs(r.y) ), 10.0 );
			//float top = r.y >= 0.0 ? 1.0 : u; 
			//float low = r.y <= 0.0 ? 1.0 : 
		//'	float luma = 0.005 + max( dot( vec3( 0, 1.0, 0 ), light ), 0.0 ) * 0.2;',
		'	float luma = 0.05 + max( dot( vec3( 0, 1.0, 0 ), light ), 0.0 ) * 0.2;',
			//x = ;
			//sky = mix(vec3(x),t,v*0.8);
			// cloudColor
		'	sky = mix( groundColor*luma, sky , top);',
			//sky = smoothstep( groundColor*x, sky , vec3(v));
		'	float alpha = clamp( m + low, 0.0 , 0.99 ) + 0.01;',

		'   vec3 star = vec3(0.0);',

		'   if( light.y < 0.0 ){', // is night

		'       vec3 milk = texture2D( starsMap, vec2( vUv.x+(timelap/24.0), vUv.y ) ).rgb;',
		'		star = milk*(1.0-alpha) * clamp(pow(abs(1.-light.y),10.),0.,1.);',
		'	}',


		'	vec3 color = pow( abs( sky ), vec3( 0.5 ) );',
		'   vec4 final = vec4( star + color, 1.0 );',

		//'	final.xyz = sky;',

		'if ( withGamma == 1 ){',
            //'#if defined( TONE_MAPPING )',
            //'final.rgb = toneMapping( final.rgb );',
            //'#endif',
            //'final = linearToOutputTexel( final );',
        '}',

		'	gl_FragColor = toHDR( final );',//LinearToRGBE( final );',
		//'	gl_FragColor = LinearToRGBE( final );',

			

		'}'
	].join( '\n' ),

	depthWrite: false,
	depthTest: false,
	side:THREE.BackSide,
	fog:false,
	
};