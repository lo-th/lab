/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*/

function View () {

    this.loadCallback = function(){};
    this.tmpCallback = function(){};
    this.rayCallBack = function(){};
    this.tmpName = [];

    this.pause = false;
    this.isPause = false;

    this.fog = null;

    this.matType = 'Standard';

    this.refEditor = null;

    this.lightDistance = 200;
    this.shadowMat = null;
    this.shadowGround = null;

	this.isMobile = this.testMobile();

    this.isDebug = false;
    this.isWithJoystick = false;
	this.isNeedUpdate = false;
	this.isWithShadow = false;
    this.isShadowDebug = false;
    this.isWithSky = false;
    this.isWithLight = false;
    this.isWithFog = false;
    this.isWithSphereLight = false;//this.isMobile ? false : true;
	this.isWithRay = false;
	this.needResize = false;
	this.t = [0,0,0,0];
    this.delta = 0;
    this.fps = 0;
	this.bg = 0x222322;//151515;
	this.vs = { w:1, h:1, l:0, x:0, y:0 };

	this.agents = [];
    this.heros = [];
    this.cars = [];
    this.softs = [];
	this.bodys = [];
	this.solids = [];
	this.extraMesh = [];
	this.extraGeo = [];

    this.helper = [];

    this.mesh = {};
    this.geo = {};
    this.mat = {};
    this.txt = {};

    this.tmpTxt = {};
    this.tmpMat = {};



	// 1 CANVAS GL1 or GL2

    var options = this.getGL();

    // 2 RENDERER
    try {

        this.renderer = new THREE.WebGLRenderer( options );

    } catch( error ) {
        if( intro !== undefined ) intro.message('<p>Sorry, your browser does not support WebGL.</p>'
                    + '<p>This application uses WebGL to quickly draw</p>'
                    + '<p>Physics Labs can be used without WebGL, but unfortunately this application cannot.</p>'
                    + '<p>Have a great day!</p>');
        return;
    }

    console.log('THREE webgl' , this.isGl2 ? 2 : 1 );



    this.renderer.setClearColor( this.bg, 1 );
    this.renderer.setPixelRatio( this.isMobile ? 1 : window.devicePixelRatio );

    // 3 CAMERA / CONTROLER

    this.camera = new THREE.PerspectiveCamera( 50 , 1 , 0.1, 20000 );
    this.camera.position.set( 0, 15, 30 );
    this.controler = new THREE.OrbitControlsExtra( this.camera, this.canvas );
    this.controler.target.set( 0, 0, 0 );
    this.controler.enableKeys = false;
    this.controler.screenSpacePanning = true;
    
    // 4 SCENE AND GROUP

    this.scene = new THREE.Scene();

    this.content = new THREE.Group();
    this.scene.add( this.content );

    this.followGroup = this.controler.followGroup;
    this.scene.add( this.followGroup );

    this.extraMesh = new THREE.Group();
    this.scene.add( this.extraMesh );


    // 5 TEXTURE LOADER

    this.loader = new THREE.TextureLoader();


    this.envmap = null;
    this.environement = new Environement( this );
    

    // AUDIO

    this.listener = null;
    //this.autoAddAudio = this.autoAudio.bind( this )
    //this.canvas.addEventListener( 'click', this.autoAddAudio, false );

    // 6 RESIZE

    this.resize();
    var _this = this;
    window.addEventListener( 'resize', function(e){ _this.resize(e); }, false );

    // 7 KEYBOARD & JOSTICK 

    if( !this.isMobile && user ) user.init();

    this.mouse = new THREE.Vector3();
    this.offset = new THREE.Vector3();

    

    // 8 START RENDER

    this.render( 0 );

}

View.prototype = {

	byName: {},

    

    getGL: function ( forceV1 ) {

        //forceV1 = true;

        var isWebGL2 = false, gl;

        var canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
        canvas.style.cssText = 'position: fixed; top:0; left:0; pointer-events:auto; image-rendering: pixelated;'
        if( !this.isMobile ){
            document.oncontextmenu = function(e){ e.preventDefault(); };
            canvas.ondrop = function(e) { e.preventDefault(); };
        }
        document.body.appendChild( canvas );

        /*var options = { 
            antialias: this.isMobile ? false : true, alpha: false, 
            stencil:false, depth:true, precision: this.isMobile ? "mediump" :"highp", premultipliedAlpha:true, preserveDrawingBuffer:false 
        }*/

        var options = { 
            antialias: this.isMobile ? false : true, alpha: false, 
            stencil:false, depth:true, precision: "highp", premultipliedAlpha:true, preserveDrawingBuffer:false 
        }

        if( forceV1 === undefined ){

            gl = canvas.getContext( 'webgl2', options );
            if (!gl) gl = canvas.getContext( 'experimental-webgl2', options );
            isWebGL2 = !!gl;
            //gl.v2 = isWebGL2 ? true : false;

        }

        if( !isWebGL2 ) {
            gl = canvas.getContext( 'webgl', options );
            if (!gl) gl = canvas.getContext( 'experimental-webgl', options );
        }

        options.canvas = canvas;
        options.context = gl;
        this.canvas = canvas;
        this.isGl2 = isWebGL2;

        return options;

    },

    init: function ( Callback, noObj ) {

        this.shaderHack();
        this.initGeometry();
        //this.initEnvMap();
        this.initMaterial();
        this.initGrid();
        this.addTone();
        this.addLights();
        this.addShadow();

        this.environement.defaultSky()

        if( !noObj ) this.loadObject( 'basic', Callback );

    },

	update: function(){},

	updateIntern: function(){},

    updateExtra: function(){},

	needUpdate: function ( b ){ this.isNeedUpdate = b; },

	render: function ( stamp ) {

        this.t[0] = stamp === undefined ? now() : stamp;
        this.delta = ( this.t[0] - this.t[3] ) * 0.001;
        this.t[3] = this.t[0];

        var _this = this;

        requestAnimationFrame(  function(s){ _this.render(s); } );

        if( this.pause ) this.isPause = true;
        if( this.isPause && !this.pause ){ this.isPause = false; unPause(); }

        if( this.needResize ) this.upResize();

        THREE.SEA3D.AnimationHandler.update( this.delta ); // sea3d model

        if( user ) user.update(); // gamepad

        TWEEN.update(); // tweener

        this.updateExtra();
        this.update();


		if( this.isNeedUpdate ){

            // if physics change 

            this.isNeedUpdate = false;


           // this.update();
            this.updateIntern();
            
            this.controler.follow();
            
            
			

		}



		this.renderer.render( this.scene, this.camera );

        // fps

        
        if ( (this.t[0] - 1000) > this.t[1] ){ this.t[1] = this.t[0]; this.fps = this.t[2]; this.t[2] = 0; }; this.t[2]++;

	},

	reset: function ( full ) {

        this.controler.resetFollow();

        this.setShadowRange();

        //this.removeAudio();

        this.isNeedUpdate = false;

        this.grid.visible = true;
        if( this.shadowGround !== null ) this.shadowGround.visible = true;

        while( this.extraMesh.children.length > 0 ) this.scene.remove( this.extraMesh.children.pop() );

        while( this.extraGeo.length > 0 ) this.extraGeo.pop().dispose();

        while( this.bodys.length > 0 ) this.clear( this.bodys.pop() );
        while( this.solids.length > 0 ) this.clear( this.solids.pop() );
        while( this.heros.length > 0 ) this.clear( this.heros.pop() );
        while( this.softs.length > 0 ) this.clear( this.softs.pop() );
        //while( terrains.length > 0 ) this.scene.remove( terrains.pop() );

        while( this.cars.length > 0 ){

            var c = this.cars.pop();
            if( c.userData.helper ){
                c.remove( c.userData.helper );
                c.userData.helper.dispose();
            }
            var i = c.userData.w.length;
            while( i-- ){
                this.scene.remove( c.userData.w[i] );
            }
            this.scene.remove( c );
        }

        //for( var t in this.txt ) this.txt[t].dispose();

        this.removeRay();
        this.removeSky();
        this.removeFog();
        this.resetLight();
        this.removeShadowDebug();
        //this.resetMaterial();
        this.removeJoystick();
        

        this.update = function () {};
        this.tmpCallback = function(){};
        this.byName = {};

        if( full ){

            for( var m in this.tmpTxt ){ this.tmpTxt[m].dispose(); this.tmpTxt[m] = undefined; }
            for( var m in this.tmpMat ){ this.tmpMat[m].dispose(); this.tmpMat[m] = undefined; }

            this.tmpMat = {};
            this.tmpTxt = {};

        }

    },

    clear: function ( b ) {

        var m;
        while( b.children.length > 0 ) {
            m = b.children.pop();
            while( m.children.length > 0 ) m.remove( m.children.pop() );
            b.remove( m );
        }

        this.scene.remove( b );

    },

    setLeft: function ( x, y ) { 

    	this.vs.x = x;
        this.vs.y = y;
    	this.resize();

    },

    setRefEditor: function ( ed ) {

        this.refEditor = ed;

    },

	resize: function ( e ) {

		//this.needResize = false;
		var v = this.vs;
		var w = window.innerWidth - v.x - v.y;
		var h = window.innerHeight;

		if( v.w !== w || v.h !== h ){

			v.h = h;
            v.w = w;

            this.needResize = true;

            if( this.refEditor ) this.refEditor.resizeMenu( v.w );

		}
    },

    upResize: function () {

    	var v = this.vs;
        this.canvas.style.left = v.x +'px';
        this.camera.aspect = v.w / v.h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( v.w, v.h );
        this.needResize = false;

    },


    getName: function ( url ) {

        return url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );

    },

    

    loadTexture: function ( name ){

        var n = this.getName( name );
        this.txt[ n ] = this.loader.load( './assets/textures/'+ name );
        return this.txt[ n ];

    },

    load: function ( Urls, Callback, autoPath, autoTexture ){

        pool.load( Urls, Callback, autoPath, autoTexture );

    },

    loadObject: function( Urls, Callback ){

        var urls = [];
        this.tmpName = [];

        if ( typeof Urls == 'string' || Urls instanceof String ){ 
            urls.push( './assets/models/'+ Urls + '.sea' );
            this.tmpName.push(  Urls );
        } else {
            for(var i=0; i < Urls.length; i++){
                urls.push( './assets/models/'+ Urls[i] + '.sea' );
                this.tmpName.push(  Urls[i] );
            }
        }
            
        this.loadCallback = Callback || function(){};
        this.tmpCallback = function(p){ this.afterLoad(p) }.bind(this);
        pool.load( urls, this.tmpCallback );

    },

    afterLoad: function ( p ) {

        var o, mesh, j;

        for(var i=0; i < this.tmpName.length; i++){

            o = p[ this.tmpName[i] ];
            j = o.length;

            while(j--){

                mesh = o[j];
                this.geo[mesh.name] = mesh.geometry;

                if( mesh.name === 'wheel' ){

                    this.geo['wheelR'] = this.geo.wheel.clone();
                    this.geo['wheelL'] = this.geo.wheel.clone();
                    this.geo.wheelL.rotateY( -Math.PI90 );
                    this.geo.wheelR.rotateY( Math.PI90 );

                }
                
            }

        }

        this.tmpName = [];
        this.loadCallback();

    },

    getTexture: function ( name ) {

        var t = pool.getResult()[name];

        if(t.isTexture){
            t.flipY = false;
            return t;
        }else{ // is img
            t = new THREE.Texture( t );
            t.needsUpdate = true;
            t.flipY = false;
            return t;
        }

    },

    getGeometry: function ( name, meshName ) {

        if(this.getMesh( name, meshName )) return this.getMesh( name, meshName ).geometry;
        else return null;

    },

    getMesh: function ( name, meshName ) {

        var m = pool.getMesh( name, meshName );
        if( m ){
            m.castShadow = true;
            m.receiveShadow = true;
        }
        return m;

    },

    addMesh: function ( m ) {

        m.castShadow = true;
        m.receiveShadow = true;

        this.extraMesh.add( m );

    },

    testMesh: function ( geom ) {

        var mesh = new THREE.Mesh( geom, this.mat.basic );
        this.addMesh(mesh);

    },

   

    //-----------------------------

    // GET

	getFps: function () { return this.fps; },
	getEnvMap: function () { return this.envmap; },
    getSun: function (){ return this.sun.position.clone().normalize(); },
    getAzimuthal: function (){ return -this.getControls().getAzimuthalAngle(); },
    getGeo: function () { return this.geo; },
    getMat: function () { return this.mat; },
    getScene: function () { return this.scene; },
	getBody: function () { return this.bodys; },
    getHero: function () { return this.heros; },

	getControls: function () { return this.controler; },
    getCamera: function () { return this.camera; },
    getMouse: function () { return this.mouse; },
    //getOffset: function () { return this.offset; },


	needFocus: function () {

        if( !editor ) return;
        this.canvas.addEventListener('mouseover', editor.unFocus, false );

    },

    haveFocus: function () {

        if( !editor ) return;
        this.canvas.removeEventListener('mouseover', editor.unFocus, false );

    },

	testMobile: function () {

        var n = navigator.userAgent;
        if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i)) return true;
        else return false;  

    },


    //-----------------------------
    //
    // GEOMETRY
    //
    //-----------------------------

    initGeometry: function (){

        var geo = {

            agent: new THREE.CircleBufferGeometry( 1, 3 ),
            circle: new THREE.CircleBufferGeometry( 1, 6 ),

            plane:      new THREE.PlaneBufferGeometry(1,1,1,1),
            box:        new THREE.BoxBufferGeometry(1,1,1),
            hardbox:    new THREE.BoxBufferGeometry(1,1,1),
            cone:       new THREE.CylinderBufferGeometry( 0,1,0.5 ),
            wheel:      new THREE.CylinderBufferGeometry( 1,1,1, 18 ),
            sphere:     new THREE.SphereBufferGeometry( 1, 16, 12 ),
            highsphere: new THREE.SphereBufferGeometry( 1, 32, 24 ),
            cylinder:   new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),
            hardcylinder: new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),

        }

        geo.circle.rotateX( -Math.PI90 );
        geo.agent.rotateX( -Math.PI90 );
        geo.agent.rotateY( -Math.PI90 );
        geo.plane.rotateX( -Math.PI90 );
        geo.wheel.rotateZ( -Math.PI90 );

        this.geo = geo;

    },

    //-----------------------------
    //
    // MATERIALS
    //
    //-----------------------------

    material: function ( option, type ){

        var name = option.name;

        if( this.tmpMat[ name ] ){

            for( var o in option ){
                if( o === 'color' ) this.tmpMat[ name ].color.setHex( option[o] );
                else this.tmpMat[ name ][o] = option[o];
            }

            return this.tmpMat[ name ];
        }

        type = type || this.matType;

        if( type !== 'Phong' ){
            delete( option.shininess ); 
            delete( option.specular );
        }

        if( type !== 'Standard' ){
            option.reflectivity = option.metalness || 0.5;
            delete( option.metalness ); 
            delete( option.roughness );
        }

        option.envMap = this.envmap;
        
        option.shadowSide = option.shadowSide || null;

        this.tmpMat[ name ] = new THREE['Mesh'+type+'Material']( option );

        /*if( type === 'Standard' ){
            this.tmpMat[ name ].onBeforeCompile = function ( shader ) {

            }
        }*/

        return this.tmpMat[ name ];

    },

    makeMaterial: function ( option, type ){

        type = type || this.matType;

        if( type !== 'Phong' ){
            delete( option.shininess ); 
            delete( option.specular );
        }

        if( type !== 'Standard' ){
            option.reflectivity = option.metalness || 0.5;
            delete( option.metalness ); 
            delete( option.roughness );
        }

        option.envMap = this.envmap;
        //option.shadowSide = false;

        return new THREE['Mesh'+type+'Material']( option );

    },

    resetMaterial: function (){

        for( var m in this.mat ){
            this.mat[m].dispose();
        }

        this.initMaterial();

    },

    initMaterial: function (){

        this.check = this.loader.load( './assets/textures/check.jpg' );
        this.check.repeat = new THREE.Vector2( 2, 2 );
        this.check.wrapS = this.check.wrapT = THREE.RepeatWrapping;

        //http://www.color-hex.com/popular-colors.php

        this.mat = {

            ttest: new THREE.MeshBasicMaterial( { color: 0xffffff, depthTest:true, depthWrite:false } ),//this.makeMaterial({ color:0xFFFFFF, name:'basic', envMap:this.envmap, metalness:0, roughness:0 }),
           

            contactOn: this.makeMaterial({ color:0x33FF33, name:'contactOn', metalness:0.8, roughness:0.5 }),
            contactOff: this.makeMaterial({ color:0xFF3333, name:'contactOff', metalness:0.8, roughness:0.5 }),

            check: this.makeMaterial({ map:this.check, name:'check', metalness:0.5, roughness:0.5 }),
            basic: this.makeMaterial({ color:0xDDDEDD, name:'basic',  metalness:0.5, roughness:0.5 }),
            sleep: this.makeMaterial({ color:0x433F3C, name:'sleep', metalness:0.5, roughness:0.5 }),
            move: this.makeMaterial({ color:0xCBBEB5, name:'move', metalness:0.5, roughness:0.5 }),
            movehigh: this.makeMaterial({ color:0xff4040, name:'movehigh', metalness:0.5, roughness:0.5 }),
            speed: this.makeMaterial({ color:0xff4040, name:'speed', metalness:0.5, roughness:0.5 }),

            statique: this.makeMaterial({ color:0x626362, name:'statique',  transparent:true, opacity:0.3, depthTest:true, depthWrite:false }),
            static: this.makeMaterial({ color:0x626362, name:'static',  transparent:true, opacity:0.3, depthTest:true, depthWrite:false, metalness:0.6, roughness:0.4 }),
            plane: new THREE.MeshBasicMaterial({ color:0x111111, name:'plane', wireframe:true }),
           
            kinematic: this.makeMaterial({ name:'kinematic', color:0xD4AF37,  metalness:0.7, roughness:0.4, shininess:40, specular:0xFAF7F0 }, 'Phong' ),//0xD4AF37
            donut: this.makeMaterial({ name:'donut', color:0xAA9933,  metalness:0.6, roughness:0.4 }),

            hide: this.makeMaterial({ color:0x000000, name:'hide', wireframe:true, visible:false }, 'Basic'),
            debug: this.makeMaterial({ color:0x11ff11, name:'debug', wireframe:true}, 'Basic'),
            skyUp: this.makeMaterial({ color:0xFFFFFF }, 'Basic'),

            hero: this.makeMaterial({ color:0xffffff, name:'hero', metalness:0.4, roughness:0.6, skinning:true }), 
            soft: this.makeMaterial({ vertexColors:THREE.VertexColors, name:'soft', transparent:true, opacity:0.9, envMap:this.envmap, side: THREE.DoubleSide }),

            shadow: new THREE.ShadowMaterial({ opacity:0.4, depthWrite:false }),

        }

        for( var m in this.mat ) this.mat[m].shadowSide = false;

    },

    addMaterial: function( option ) {

        var maptype = ['map', 'emissiveMap', 'lightMap', 'aoMap', 'alphaMap', 'normalMap', 'bumpMap', 'displacementMap', 'roughnessMap', 'metalnessMap'];

        var i = maptype.length;
        while(i--){
            if( option[maptype[i]] ){ 
                option[maptype[i]] = this.loader.load( './assets/textures/' + option[maptype[i]] );
                option[maptype[i]].flipY = false;
            }
        }
        
        option.envMap = this.envmap;
        

        this.mat[option.name] = this.makeMaterial( option );

    },

    addMap: function( url, name ) {

        if(this.mat[name]) return;

        var map = this.loader.load( './assets/textures/' + url );
        //map.wrapS = THREE.RepeatWrapping;
        //map.wrapT = THREE.RepeatWrapping;
        map.flipY = false;
        this.mat[name] = this.makeMaterial({ name:name, map:map, envMap:this.envmap, metalness:0.6, roughness:0.4, shadowSide:false });//

    },

    //-----------------------------
    //
    // TEXTURES
    //
    //-----------------------------

    texture: function ( name, o ) {

    	o = o || {};

    	var n = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') );

        if( this.tmpTxt[ n ] ) return this.tmpTxt[ n ];

    	this.tmpTxt[ n ] = this.loader.load( './assets/textures/' + name, function ( tx ) {

            tx.flipY = o.flip !== undefined ? o.flip : false;

    		//if( o.flip !== undefined ) tx.flipY = o.flip;
			if( o.repeat !== undefined ){ 
				tx.repeat.set( o.repeat[0], o.repeat[1] );
				if(o.repeat[0]>1) tx.wrapS = THREE.RepeatWrapping;
				if(o.repeat[1]>1) tx.wrapT = THREE.RepeatWrapping;
			}
			if( o.anisotropy !== undefined ) tx.anisotropy = o.anisotropy;

    	});

    	return this.tmpTxt[ n ];

    },

    

    //-----------------------------
    //
    // TONE
    //
    //-----------------------------

	addTone : function( o ) {

        o = o || {};

        var toneMappings = {
            None: THREE.NoToneMapping,
            Linear: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Uncharted2: THREE.Uncharted2ToneMapping,
            Cineon: THREE.CineonToneMapping,
            Filmic: THREE.ACESFilmicToneMapping,
        };

        //
        /*this.renderer.gammaInput = o.gammaInput !== undefined ? o.gammaInput : true;
        this.renderer.gammaOutput = o.gammaOutput !== undefined ? o.gammaOutput : true;

        this.renderer.toneMapping = toneMappings[ o.tone !== undefined ? o.tone : 'Uncharted2' ];
        this.renderer.toneMappingExposure = o.exposure !== undefined ? o.exposure : 2.0;
        this.renderer.toneMappingWhitePoint = o.whitePoint !== undefined ? o.whitePoint : 3.0;*/
        this.renderer.physicallyCorrectLights = o.correctLight !== undefined ? o.correctLight : false;
        this.renderer.gammaInput = o.gammaInput !== undefined ? o.gammaInput : true;
        this.renderer.gammaOutput = o.gammaOutput !== undefined ? o.gammaOutput : true;

        this.renderer.toneMapping = toneMappings[ o.tone !== undefined ? o.tone : 'Filmic' ];
        this.renderer.toneMappingExposure = o.exposure !== undefined ? o.exposure : 1.0;
        this.renderer.toneMappingWhitePoint = o.whitePoint !== undefined ? o.whitePoint : 3.0;

    },

    //-----------------------------
    //
    // DEBUG
    //
    //-----------------------------

    debug: function () {

        if( !this.isDebug ){

            this.helper[0] = new THREE.PointHelper( 20, 0xFFFF00 );
            this.helper[1] = new THREE.PointHelper( 20, 0x00FFFF );
            this.helper[2] = new THREE.PointHelper( 5, 0xFF8800 );


            /*this.vMid = new THREE.Vector3( 1,0.1,0 );
            this.camPixel = new THREE.OrthographicCamera( -0.1,0.1,0.1,-0.1, 1, 2 );
            this.scene.add( this.camPixel );
            this.camPixel.lookAt( this.vMid );

            this.helper[2].add(this.camPixel)

            this.scene.add(new THREE.CameraHelper(this.camPixel))
            */

            

            this.sun.add( this.helper[0] )
            this.moon.add( this.helper[1] )
            this.followGroup.add( this.helper[2] )

            this.isDebug = true;

        } else {

            this.sun.remove( this.helper[0] )
            this.moon.remove( this.helper[1] )
            this.followGroup.remove( this.helper[2] )

            this.isDebug = false;

        }
        

    },

    //-----------------------------
    //
    // FOG
    //
    //-----------------------------

    addFog: function ( o ) {
        
        if(this.isWithFog) return;
        o = o || {};
        if(o.exp) this.fog = new THREE.FogExp2( o.color || 0x3b4c5a, o.exp );
        else this.fog = new THREE.Fog( o.color || 0x3b4c5a, o.near || 1, o.far || 300 );

        this.scene.fog = this.fog;

        this.isWithFog = true;

    },

    removeFog: function () {
        
        if(!this.isWithFog) return;
        this.fog = null;
        this.scene.fog = null;
        this.isWithFog = false;

    },



    //-----------------------------
    //
    // LIGHT
    //
    //-----------------------------

    resetLight: function () {

        if( !this.isWithLight ) return;

        this.followGroup.position.set(0,0,0);

        this.lightDistance = 200;

        this.sun.color.setHex(0xffffff);
        this.sun.intensity = 1.3;

        this.moon.color.setHex(0x919091);
        this.moon.intensity = 0.3;

        this.sun.position.set( 0, this.lightDistance, 10 );
        this.moon.position.set( 0, -this.lightDistance, -10 );

    },

    addLights: function () {

        if( this.isWithLight ) return;

    	this.sun = new THREE.DirectionalLight( 0xffffff, 1.3 );
    	this.sun.position.set( 0, this.lightDistance, 10 );

    	this.moon = new THREE.DirectionalLight( 0x919091, 0.3 );//new THREE.PointLight( 0x919091, 1, this.lightDistance*2, 2 );
    	this.moon.position.set( 0, -this.lightDistance, -10 );

        /*if( this.isWithSphereLight ){
            this.sphereLight = new THREE.HemisphereLight( 0xff0000, this.bg, 0.6 );
            this.sphereLight.position.set( 0, 1, 0 );
            this.followGroup.add( this.sphereLight );
        }

    	this.ambient = new THREE.AmbientLight( this.bg );*/

        //this.ambient.position.set( 0, 50, 0 );

    	this.followGroup.add( this.sun );
        this.followGroup.add( this.sun.target );
    	this.followGroup.add( this.moon );
        this.followGroup.add( this.moon.target );

    	//this.scene.add( this.ambient );

        /*this.scene.add( this.sun );
        this.scene.add( this.moon );
        this.scene.add( this.ambient );*/

        this.isWithLight = true;

    },

    //-----------------------------
    //
    // SHADOW
    //
    //-----------------------------

    addShadow: function(){

    	if( this.isWithShadow ) return;
        if( !this.isWithLight ) this.addLights();

        if( this.shadowMat === null ){ 

            this.shadowMat = new THREE.ShadowMaterial({ opacity:0.5, depthTest:true, depthWrite:false });

            // overwrite shadowmap code
            /*var shaderShadow = THREE.ShaderChunk.shadowmap_pars_fragment;
            shaderShadow = shaderShadow.replace( '#ifdef USE_SHADOWMAP', THREE.ShadowPCSS );
            shaderShadow = shaderShadow.replace( '#if defined( SHADOWMAP_TYPE_PCF )',[ "return PCSS( shadowMap, shadowCoord );", "#if defined( SHADOWMAP_TYPE_PCF )"].join( "\n" ) );

            this.shadowMat.onBeforeCompile = function ( shader ) {

                var fragment = shader.fragmentShader;
                fragment = fragment.replace( '#include <shadowmap_pars_fragment>', shaderShadow );
                shader.fragmentShader = fragment;

            }*/


        }

        this.isWithShadow = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.soft = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.shadowGround = new THREE.Mesh( this.geo.plane, this.shadowMat );
        this.shadowGround.scale.set( 200, 1, 200 );
        //this.shadowGround.position.y = 0.001;
        this.shadowGround.castShadow = false;
        this.shadowGround.receiveShadow = true;
        this.scene.add( this.shadowGround );

        var d = 150;
        //this.camShadow = new THREE.OrthographicCamera( -d, d, d, -d,  100, 300 );
        this.camShadow = new THREE.OrthographicCamera( d, -d, d, -d,  100, 300 );
        //this.followGroup.add( this.camShadow );
        this.sun.shadow = new THREE.LightShadow( this.camShadow );

        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.bias = 0.00001;
        //this.sun.shadow.bias = 0.0001;
        this.sun.castShadow = true;

        //for( var m in this.mat ) this.mat[m].shadowSide = false;

        //

    },

    setShadowRange: function ( d, near, far, debug ) {

        if( !this.isWithShadow ) return;

        var cam = this.camShadow;
        d = ( d !== undefined ) ? d : 150;
        cam.left =  d;
        cam.right = - d;
        cam.top =  d;
        cam.bottom = - d;
        /*cam.left = - d;
        cam.right =  d;
        cam.top =  d;
        cam.bottom = - d;*/
        cam.near = ( near !== undefined ) ? near : 100;
        cam.far = ( far !== undefined ) ? far : 300;

        this.camShadow.updateProjectionMatrix();

        if( debug ){
            this.addShadowDebug();
        }

        //

    },

    addShadowDebug: function () {

        if( this.isShadowDebug ) {
            this.campHelper.update();
        } else {
            this.campHelper = new THREE.CameraHelper( this.camShadow )
            this.followGroup.add( this.campHelper );
            this.isShadowDebug = true;
        }

    },

    removeShadowDebug: function () {

        if( !this.isShadowDebug ) return;
        this.followGroup.remove( this.campHelper );
        this.isShadowDebug = false;

    },

    

    //-----------------------------
    //
    // GRID
    //
    //-----------------------------

    initGrid: function ( c1, c2 ){

        this.grid = new THREE.GridHelper( 40, 16, c1 || 0x111111, c2 || 0x050505 );
        this.grid.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.25, depthTest:true, depthWrite:false } );
        //this.grid.position.y = -0.001;
        //this.grid.rotation.x = -Math.Pi*0.5;
        this.scene.add( this.grid );

    },

    hideGrid: function () {

        if( this.grid.visible ){ this.grid.visible = false; if( this.shadowGround !== null ) this.shadowGround.visible = false; }
        else{ this.grid.visible = true; if( this.shadowGround !== null ) this.shadowGround.visible = true; }

    },

    //-----------------------------
    //
    //  ENVIRONEMENT
    //
    //-----------------------------

    removeSky: function () {

        //if( !this.isWithSky ) return;

        this.environement.clear();
        //this.isWithSky = false;

        // default envmap spherical
        //this.initEnvMap();
        //this.updateEnvMap();

    },

    setSky: function () {

    },

    addSky: function ( o ) {

        o = o || {};

        //if( this.isWithSky ) return;
        if( !this.isWithLight ) this.addLights();
        //if( o.hdr && this.isMobile ) o.hdr = false;

        this.environement.setSky( o );

        //this.sky = new SuperSky( this, o );
        //this.isWithSky = true;

    },

    skyTimelap: function ( t, frame ) {

        this.environement.timelap( t, frame );

    },

    updateSky: function ( o ) {

        //if( !this.isWithSky ) return;

        this.environement.setOption( o );

    },

    updateEnvMap: function (  ) {

        var hdr = this.environement.isHdr;
        var mat;

        // intern material
        for( var m in this.mat ){

            mat = this.mat[m];

            if( mat.envMap !== undefined ){
                if( mat.type === 'MeshStandardMaterial' ) mat.envMap = this.envmap;
                else mat.envMap =  hdr ? null : this.envmap;
                mat.needsUpdate = true;
            }

        }

        // tmp material
        for( var m in this.tmpMat ){

            mat = this.tmpMat[m];

            if( mat.envMap !== undefined ){
                if( mat.type === 'MeshStandardMaterial' ) mat.envMap = this.envmap;
                else mat.envMap =  hdr ? null : this.envmap;
                mat.needsUpdate = true;
            }

        }

        this.extraUpdateMat( this.envmap, hdr );

    },

    extraUpdateMat: function ( env, hdr ) {

    }, 


    //--------------------------------------
    //
    //   CAMERA CONTROL AUTO AND FOLLOW
    //
    //--------------------------------------

    moveCam: function ( o, callback ) {

        this.controler.moveCam( o, callback );

    },

    setFollow: function( name, o ){

        if( name === 'none' ) this.controler.resetFollow();
        if( !this.byName[ name ] ) return;
        o = o || {};

        this.controler.initFollow( this.byName[ name ], o );

    },

    //-----------------------------
    //
    // RAYCAST
    //
    //-----------------------------

    activeRay: function ( callback, debug ) {

        if( this.isWithRay ) return;

        this.ray = new THREE.Raycaster();

        this.dragPlane = new THREE.Mesh( 
            debug ?  new THREE.PlaneBufferGeometry( 1, 1, 4, 4 ) : new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ),  
            new THREE.MeshBasicMaterial({ color:0x00ff00, transparent:true, opacity:debug ? 0.3 : 0, depthTest:false, depthWrite:false, wireframe: debug ? true : false })
        );

        this.dragPlane.castShadow = false;
        this.dragPlane.receiveShadow = false;
        this.setDragPlane( null, 100 );
        this.scene.add( this.dragPlane );

        this.fray = function(e){ this.rayTest(e); }.bind( this );
        this.mDown = function(e){ this.rayTest(e); this.mouse.z = 1; }.bind( this );
        this.mUp = function(e){ this.mouse.z = 0; }.bind( this );

        this.canvas.addEventListener( 'mousemove', this.fray, false );
        this.canvas.addEventListener( 'mousedown', this.mDown, false );
        document.addEventListener( 'mouseup', this.mUp, false );

        this.rayCallBack = callback;
        this.isWithRay = true;

    },

    removeRay: function () {

        if( !this.isWithRay ) return;

        this.canvas.removeEventListener( 'mousemove', this.fray, false );
        this.canvas.removeEventListener( 'mousedown', this.mDown, false );
        document.removeEventListener( 'mouseup', this.mUp, false );

        this.rayCallBack = function(){};

        this.scene.remove( this.dragPlane );

        this.isWithRay = false;
        this.offset.set( 0,0,0 );

    },

    rayTest: function ( e ) {

        this.mouse.x = ( (e.clientX - this.vs.x )/ this.vs.w ) * 2 - 1;
        this.mouse.y = - ( e.clientY / this.vs.h ) * 2 + 1;

        this.ray.setFromCamera( this.mouse, this.camera );
        //var intersects = this.ray.intersectObjects( this.content.children, true );
        var intersects = this.ray.intersectObject( this.dragPlane );
        if ( intersects.length ){ 
            this.offset.copy( intersects[0].point );
            this.rayCallBack( this.offset );
        }

    },

    setDragPlane: function ( pos, size ) {

        size = size || 200;
        this.dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( size );
        if( pos ){
            this.dragPlane.position.fromArray( pos );
            this.dragPlane.rotation.set( 0, this.controler.getAzimuthalAngle(), 0 );
            //this.dragPlane.lookAt( this.camera.position );
        } else {
            this.dragPlane.position.set( 0, 0, 0 );
            this.dragPlane.rotation.set( -Math.PI90, 0, 0 );
        }

    },

    //--------------------------------------
    //
    //   SRC UTILS ViewUtils
    //
    //--------------------------------------

    addUV2: function ( m ) {

        THREE.GeometryTools.addUV2( m.geometry );

    },

    mergeGeometry: function(m){

        return THREE.GeometryTools.mergeGeometryArray( m );

    },

    mergeMesh: function(m){

        return THREE.GeometryTools.mergeGeometryArray( m );

    },

    prepaGeometry: function ( g, type ) {

        return THREE.GeometryTools.prepaGeometry( g, type );

    },

    getGeomtryInfo: function ( o ) {

        return THREE.GeometryTools.getGeomtryInfo( o );

    },

    //--------------------------------------
    //
    //   Joystick support html / mobile
    //
    //--------------------------------------


    addJoystick: function ( o ) {

        if( !editor ) return;
        if( this.isWithJoystick ) return;

        editor.addJoystick( o );
        this.isWithJoystick = true;

    },

    removeJoystick: function () {

        if( !editor ) return;
        if( !this.isWithJoystick ) return;

        editor.removeJoystick();
        this.isWithJoystick = false;

    },

    distanceFromCenter: function () {

        var p = this.followGroup.position;
        return Math.sqrt( p.x * p.x + p.z * p.z );


    },


    //--------------------------------------
    //
    //   AUDIO
    //
    //--------------------------------------

    needAudio: function () {

        this.autoAddAudio = this.autoAudio.bind( this )
        this.canvas.addEventListener( 'click', this.autoAddAudio, false );

    },

    autoAudio: function( e ){ 

        this.addAudio();
        this.canvas.removeEventListener( 'click', this.autoAddAudio );
        this.autoAddAudio = null;

    },

    addAudio: function () {

        //this.needsAudio = true;

        if( this.listener !== null ) return;
        this.listener = new THREE.AudioListener();
        this.camera.add( this.listener );

    },

    removeAudio: function () {

        //this.needsAudio = false;

        if( this.listener === null ) return;
        
        this.camera.remove( this.listener );
        this.listener = null;

    },


    addSound: function ( name ){

        if( this.listener === null ) this.addAudio();

        if(!pool.buffer[name]) return null;

        var audio = new THREE.PositionalAudio( this.listener );
        //audio.volume = 1;
        audio.setBuffer( pool.buffer[name] );
        return audio;

    },

    shaderHack: function (){

        THREE.ShaderChunk.aomap_fragment = [
            '#ifdef USE_AOMAP',
            '    float ambientOcclusion = ( texture2D( aoMap, vUv ).r - 1.0 ) * aoMapIntensity + 1.0;',
            '    reflectedLight.indirectDiffuse *= ambientOcclusion;',
            '    #if defined( USE_ENVMAP ) && defined( PHYSICAL )',
            '        float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );',
            '        reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );',
            '   #endif',
            '#endif',
        ].join("\n");


        console.log('Shader hack')






    }

}
