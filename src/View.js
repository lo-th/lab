function View () {

    this.loadCallback = function(){};
    this.tmpCallback = function(){};
    this.tmpName = [];

    this.pause = false;
    this.isPause = false;

    // overwrite shadowmap code
    /*
    var shader = THREE.ShaderChunk.shadowmap_pars_fragment;
    shader = shader.replace( '#ifdef USE_SHADOWMAP', THREE.ShadowPCSS );
    shader = shader.replace( '#if defined( SHADOWMAP_TYPE_PCF )',[ "return PCSS( shadowMap, shadowCoord );", "#if defined( SHADOWMAP_TYPE_PCF )"].join( "\n" ) );
    THREE.ShaderChunk.shadowmap_pars_fragment = shader;
    */

    this.matType = 'Lambert';//'Standard';

    this.lightDistance = 200;

	this.isMobile = this.testMobile();

    this.isWithJoystick = false;
	this.isNeedUpdate = false;
	this.isWithShadow = false;
    this.isWithSky = false;
    this.isWithLight = false;
    this.isWithSphereLight = false;//this.isMobile ? false : true;
	this.isWithRay = false;
	this.needResize = false;
	this.t = [0,0,0,0];
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

    this.mesh = {};
    this.geo = {};
    this.mat = {};
    this.txt = {};

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

    this.camera = new THREE.PerspectiveCamera( 60 , 1 , 0.1, 20000 );
    this.camera.position.set( 0, 15, 30 );
    this.controler = new THREE.OrbitControlsExtra( this.camera, this.canvas );
    this.controler.target.set( 0, 0, 0 );
    this.controler.enableKeys = false;

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

    // 6 RESIZE

    this.resize();
    var _this = this;
    window.addEventListener( 'resize', function(e){ _this.resize(e); }, false );


    // 7 KEYBOARD & JOSTICK 
    
    if(!this.isMobile) user.init();


    // 8 START RENDER

    this.render( 0 );

}

View.prototype = {

	byName: {},

    addJoystick: function () {

        editor.addJoystick();
        this.isWithJoystick = true;

    },

    removeJoystick: function () {

        if( !this.isWithJoystick ) return;

        editor.removeJoystick();
        this.isWithJoystick = false;

    },

    getGL: function ( forceV1 ) {

        var isWebGL2 = false, gl;

        var canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
        canvas.style.cssText = 'position: absolute; top:0; left:0; pointer-events:auto;'
        canvas.oncontextmenu = function(e){ e.preventDefault(); };
        canvas.ondrop = function(e) { e.preventDefault(); };
        document.body.appendChild( canvas );

        var options = { 
            antialias: this.isMobile ? false : true, alpha: false, 
            stencil:false, depth:true, precision:"highp", premultipliedAlpha:true, preserveDrawingBuffer:false 
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

        this.initGeometry();
        this.initEnvMap();
        this.initMaterial();
        this.initGrid();
        this.addTone();
        this.addLights();
        this.addShadow();

        if( !noObj ) this.loadObject( 'basic', Callback );

    },

    // GEOMETRY

    initGeometry: function (){

        var geo = {

            agent: new THREE.CircleBufferGeometry( 1, 3 ),
            cicle: new THREE.CircleBufferGeometry( 1, 6 ),

            plane:      new THREE.PlaneBufferGeometry(1,1,1,1),
            box:        new THREE.BoxBufferGeometry(1,1,1),
            hardbox:    new THREE.BoxBufferGeometry(1,1,1),
            cone:       new THREE.CylinderBufferGeometry( 0,1,0.5 ),
            wheel:      new THREE.CylinderBufferGeometry( 1,1,1, 18 ),
            sphere:     new THREE.SphereBufferGeometry( 1, 16, 12 ),
            highsphere: new THREE.SphereBufferGeometry( 1, 32, 24 ),
            cylinder:   new THREE.CylinderBufferGeometry( 1,1,1,12,1 ),

        }

        geo.cicle.rotateX( -Math.PI90 );
        geo.agent.rotateX( -Math.PI90 );
        geo.agent.rotateY( -Math.PI90 );
        geo.plane.rotateX( -Math.PI90 );
        geo.wheel.rotateZ( -Math.PI90 );

        this.geo = geo;

    },

    // MATERIAL

    initEnvMap: function ( url ){

        this.envmap = this.loader.load( url || './assets/textures/spherical/metal.jpg' );
        this.envmap.mapping = THREE.SphericalReflectionMapping;

    },

    makeMaterial: function ( option ){

        if( this.matType !== 'Standard' ){
            option.reflectivity = option.metalness || 0.5;
            delete( option.metalness ); delete( option.roughness );
        }
        return new THREE['Mesh'+this.matType+'Material']( option );

    },

    resetMaterial: function (){

        for( var m in this.mat ){
            this.mat[m].dispose();
        }

        this.initMaterial();



    },

    initMaterial: function (){

        this.mat = {

            contactOn: this.makeMaterial({ color:0x33FF33, name:'contactOn', envMap:this.envmap, metalness:0.8, roughness:0.5 }),
            contactOff: this.makeMaterial({ color:0xFF3333, name:'contactOff', envMap:this.envmap, metalness:0.8, roughness:0.5 }),

            basic: this.makeMaterial({ color:0x999999, name:'basic', envMap:this.envmap, metalness:0.8, roughness:0.5 }),
            sleep: this.makeMaterial({ color:0x6666DD, name:'sleep', envMap:this.envmap, metalness:0.6, roughness:0.4 }),
            move: this.makeMaterial({ color:0x999999, name:'move', envMap:this.envmap, metalness:0.6, roughness:0.4 }),
            movehigh: this.makeMaterial({ color:0xff9999, name:'movehigh', envMap:this.envmap, metalness:0.6, roughness:0.4 }),

            statique: this.makeMaterial({ color:0x626362, name:'statique',  transparent:true, opacity:0.3, depthTest:true, depthWrite:false }),
            plane: new THREE.MeshBasicMaterial({ color:0x111111, name:'plane', wireframe:true }),
           
            kinematic: this.makeMaterial({ name:'kinematic', color:0xAA9933, envMap:this.envmap,  metalness:0.6, roughness:0.4 }),//, transparent:true, opacity:0.6
            donut: this.makeMaterial({ name:'donut', color:0xAA9933, envMap:this.envmap,  metalness:0.6, roughness:0.4 }),

            hide: new THREE.MeshBasicMaterial({ color:0x111111, name:'hide', wireframe:true, visible:false }),
            debug: new THREE.MeshBasicMaterial({ color:0x11ff11, name:'debug', wireframe:true}),//, opacity:0.1, transparent:true }),
            skyUp: new THREE.MeshBasicMaterial({ color:0xFFFFFF }),

            hero: this.makeMaterial({ color:0xffffff, name:'hero', envMap:this.envmap, metalness:0.4, roughness:0.6, skinning:true }), 
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
        option.shadowSide = false;

        this.mat[option.name] = this.makeMaterial( option );

    },

    addMap: function( url, name ) {

        var map = this.loader.load( './assets/textures/' + url );
        //map.wrapS = THREE.RepeatWrapping;
        //map.wrapT = THREE.RepeatWrapping;
        map.flipY = false;
        this.mat[name] = this.makeMaterial({ name:name, map:map, envMap:this.envmap, metalness:0.6, roughness:0.4, shadowSide:false });

    },

    // GRID

    initGrid: function ( c1, c2 ){

        this.helper = new THREE.GridHelper( 40, 16, c1 || 0x111111, c2 || 0x050505 );
        this.helper.position.y = -0.001;
        this.scene.add( this.helper );

    },

    

	update: function(){},

	updateIntern: function(){},

    updateExtra: function(){},

	needUpdate: function ( b ){ this.isNeedUpdate = b; },

	render: function ( stamp ) {

        var _this = this;

        requestAnimationFrame(  function(s){ _this.render(s); } );

        if( this.pause ) this.isPause = true;
        if( this.isPause && !this.pause ){ this.isPause = false; unPause(); }

        if( this.needResize ) this.upResize();

        THREE.SEA3D.AnimationHandler.update( 0.017 );

        user.update();

		//requestAnimationFrame( function(s){ this.render(s); }.bind(this) );

        TWEEN.update();

        this.updateExtra();

        //user.update(); // gamepad

		if( this.isNeedUpdate ){

            this.updateIntern();
            this.update();
            this.controler.follow();
			this.isNeedUpdate = false;

		}

		this.renderer.render( this.scene, this.camera );

        this.t[0] = stamp === undefined ? now() : stamp;
        if ( (this.t[0] - 1000) > this.t[1] ){ this.t[1] = this.t[0]; this.fps = this.t[2]; this.t[2] = 0; }; this.t[2]++;

	},

	reset: function () {

        this.controler.resetFollow();

        this.isNeedUpdate = false;

        this.helper.visible = true;
        if( this.shadowGround !== null ) this.shadowGround.visible = true;

        while( this.extraMesh.children.length > 0 ) this.scene.remove( this.extraMesh.children.pop() );

        while( this.extraGeo.length > 0 ) this.extraGeo.pop().dispose();

        while( this.bodys.length > 0 ) this.scene.remove( this.bodys.pop() );
        while( this.solids.length > 0 ) this.scene.remove( this.solids.pop() );
        while( this.heros.length > 0 ) this.scene.remove( this.heros.pop() );
        while( this.softs.length > 0 ) this.scene.remove( this.softs.pop() );
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
        this.resetLight();
        this.resetMaterial();
        this.removeJoystick();
        

        this.update = function () {};
        this.tmpCallback = function(){};
        this.byName = {};

    },

    setLeft: function ( x, y ) { 

    	this.vs.x = x;
        this.vs.y = y;
    	this.resize();

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

            if( editor ) editor.resizeMenu( v.w );

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

    load: function ( Urls, Callback, auto ){

        pool.load( Urls, Callback, auto );

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

        var t = new THREE.Texture( pool.getResult()[name] );
        t.needsUpdate = true;
        t.flipY = false;
        return t;

    },

    getGeometry: function ( name, meshName ) {

        return this.getMesh( name, meshName ).geometry;

    },

    getMesh: function ( name, meshName ) {

        var m = pool.getMesh( name, meshName );
        m.castShadow = true;
        m.receiveShadow = true;
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
    //
    // RAYCAST
    //
    //-----------------------------

    activeRay: function ( callback ) {

        this.isWithRay = true;

        this.ray = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        //var g = new THREE.PlaneBufferGeometry( 100, 100 );
        //g.rotateX( -Math.PI90 );
        this.moveplane = new THREE.Mesh( this.geo.plane,  new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0 }));
        this.moveplane.scale.set(100, 1, 100);
        this.moveplane.castShadow = false;
        this.moveplane.receiveShadow = false;
        this.content.add( this.moveplane );
        //moveplane.visible = false;

        this.targetMouse = new THREE.Mesh( this.geo['box'] ,  new THREE.MeshBasicMaterial({color:0xFF0000}));
        this.scene.add( this.targetMouse );

        this.canvas.addEventListener( 'mousemove', function(e){ this.rayTest(e); }.bind(this), false );

        this.rayCallBack = callback;

    },

    removeRay: function(){

        if( this.isWithRay ){
            this.isWithRay = false;

            this.canvas.removeEventListener( 'mousemove', function(e){ this.rayTest(e); }.bind(this), false );
            this.rayCallBack = null;

            this.content.remove( this.moveplane );
            this.scene.remove( this.targetMouse );

        }

    },

    rayTest: function ( e ) {

        this.mouse.x = ( (e.clientX- this.vs.x )/ this.vs.w ) * 2 - 1;
        this.mouse.y = - ( e.clientY / this.vs.h ) * 2 + 1;

        this.ray.setFromCamera( this.mouse, this.camera );
        var intersects = this.ray.intersectObjects( this.content.children, true );
        if ( intersects.length) {
            this.targetMouse.position.copy( intersects[0].point )
            //paddel.position.copy( intersects[0].point.add(new THREE.Vector3( 0, 20, 0 )) );

            this.rayCallBack( this.targetMouse );
        }
    },

    //-----------------------------

    // SET



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


	needFocus: function () {

        this.canvas.addEventListener('mouseover', editor.unFocus, false );

    },

    haveFocus: function () {

        this.canvas.removeEventListener('mouseover', editor.unFocus, false );

    },

	testMobile: function () {

        var n = navigator.userAgent;
        if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i)) return true;
        else return false;  

    },

    hideGrid: function () {

        if( this.helper.visible ){ this.helper.visible = false; if( this.shadowGround !== null ) this.shadowGround.visible = false; }
        else{ this.helper.visible = true; if( this.shadowGround !== null ) this.shadowGround.visible = true; }

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
            Cineon: THREE.CineonToneMapping
        };

        //this.renderer.renderer.physicallyCorrectLights = true;
        this.renderer.gammaInput = o.gammaInput !== undefined ? o.gammaInput : true;
        this.renderer.gammaOutput = o.gammaOutput !== undefined ? o.gammaOutput : true;

        this.renderer.toneMapping = toneMappings[ o.tone !== undefined ? o.tone : 'Uncharted2' ];
        this.renderer.toneMappingExposure = o.exposure !== undefined ? o.exposure : 2.0;
        this.renderer.toneMappingWhitePoint = o.whitePoint !== undefined ? o.whitePoint : 3.0;

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
        this.moon.intensity = 1;

        this.sun.position.set( 0, this.lightDistance, 10 );
        this.moon.position.set( 0, -this.lightDistance, -10 );

    },

    addLights: function () {

        if( this.isWithLight ) return;

    	this.sun = new THREE.DirectionalLight( 0xffffff, 1.3 );
    	this.sun.position.set( 0, this.lightDistance, 10 );

    	this.moon = new THREE.PointLight( 0x919091, 1, this.lightDistance*2, 2 );
    	this.moon.position.set( 0, -this.lightDistance, -10 );

        if( this.isWithSphereLight ){
            this.sphereLight = new THREE.HemisphereLight( 0xff0000, this.bg, 0.6 );
            this.sphereLight.position.set( 0, 1, 0 );
            this.followGroup.add( this.sphereLight );
        }

    	this.ambient = new THREE.AmbientLight( this.bg );

        //this.ambient.position.set( 0, 50, 0 );

    	this.followGroup.add( this.sun );
    	this.followGroup.add( this.moon );
    	this.followGroup.add( this.ambient );

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

        if(!this.mat.shadow) this.mat.shadow = new THREE.ShadowMaterial({ opacity:0.4 })

        this.isWithShadow = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.soft = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.shadowGround = new THREE.Mesh( this.geo.plane, this.mat.shadow );
        this.shadowGround.scale.set( 200, 1, 200 );
        this.shadowGround.castShadow = false;
        this.shadowGround.receiveShadow = true;
        this.scene.add( this.shadowGround );

        var d = 150;
        var camShadow = new THREE.OrthographicCamera( d, -d, d, -d,  100, 300 );
        this.sun.shadow = new THREE.LightShadow( camShadow );

        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.bias = 0.001;
        //this.sun.shadow.bias = 0.0001;
        this.sun.castShadow = true;

        for( var m in this.mat ) this.mat[m].shadowSide = false;


        

        //this.followGroup.add( new THREE.CameraHelper( this.sun.shadow.camera ));

    },

    //-----------------------------
    //
    // SKY
    //
    //-----------------------------

    removeSky: function () {

        if( !this.isWithSky ) return;

        this.sky.clear();
        this.isWithSky = false;

        this.initEnvMap();
        this.updateEnvMap();

    },

    addSky: function ( o ) {

        if( this.isWithSky ) return;
        if( !this.isWithLight ) this.addLights();

        this.sky = new SuperSky( this, o );
        this.isWithSky = true;

    },

    updateSky: function ( o ) {

        if( !this.isWithSky ) return;

        this.sky.update( o );

    },

    updateEnvMap: function ( texture ) {

        if( texture !== undefined ) this.envmap = texture;

        for( var m in this.mat ){
            if( this.mat[m].envMap ) this.mat[m].envMap = this.envmap;
        }

    },


    //--------------------------------------
    //
    //   CAMERA AUTO CONTROL
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

        /*this.controler.cam.rotation = o.rotation !== undefined ? o.rotation : 180;
        this.controler.cam.distance = o.distance !== undefined ? o.distance : 10;
        this.controler.cam.height = o.height !== undefined ? o.height : 4;
        this.controler.cam.acceleration = o.acceleration !== undefined ? o.acceleration : 0.05;
        this.controler.cam.speed = o.speed !== undefined ? o.speed : 10;
        this.controler.followTarget = this.byName[ name ];*/

    },

    //--------------------------------------
    //
    //   SRC UTILS ViewUtils
    //
    //--------------------------------------

    addUV2: function ( m ) {

        THREE.GeometryTools.addUV2( m.geometry );

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

}