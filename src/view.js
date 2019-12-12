/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*/



var view = ( function () {

'use strict';


var refEditor = null;
var refUser = null;

var setting = {
	physicallyCorrectLights: false,
    gammaInput: false,
    gammaOutput: true,
    exposure: 1.2,
    whitePoint: 1.0,
    type: "Filmic",
    envIntensity: 1.2,
    sunIntensity: 0.8,
    moonIntensity: 0.25,
};

var toneMappings = {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Uncharted2: THREE.Uncharted2ToneMapping,
    Cineon: THREE.CineonToneMapping,
    Filmic: THREE.ACESFilmicToneMapping,
};

var tmpName = [];

//var pause = false;
var isPause = false;

var container = null;
var canvas = null;
var renderer = null;
var camera = null;
var controler = null;
var scene = null;
var content = null;
var followGroup = null;
var loader = null;
var envmap = null;
var environement = null;
var listener = null;
var mouse = null;
var offset = null;

var grid = null;
var ray = null;
var dragPlane = null;

var sun = null;
var moon = null;
var probe = null;
var sphereLight = null;
var camShadow = null;

var check = null;


var fog = null;

var matType = 'Standard';

var lightDistance = 200;
var shadowMat = null;
var shadowGround = null;
var isHighShadow = false;

var campHelper = null;

var isMobile = false;

var isDebug = false;
var isWithJoystick = false;
var isNeedUpdate = false;
var isWithShadow = false;
var isShadowDebug = false;
var isWithSky = false;

var isLight = false;
var isFog = false;
var isRay = false;
var needResize = false;

var t = [0,0,0,0];
var delta = 0;
var fps = 0;

var bg = 0x222322;
var alpha = 1;
var vs = { w:1, h:1, l:0, x:0, y:0 };

var agents = [];
var heros = [];
var cars = [];
var softs = [];
var bodys = [];
var solids = [];
var extraMesh = [];
var extraGeo = [];

var helper = [];

var mesh = {};
var geo = {};
var mat = {};
var txt = {};

var tmpTxt = {};
var tmpMat = {};

var isGl2 = false;
var isInContainer = false;

var autoAddAudio = null;

var isMirror = false;
var groundMirror = null;
var isRenderPause = false;

	
///

view = {

    pause: false,

    //needsUpdate: false,

    byName: {},

    loadCallback: function(){},
    tmpCallback: function(){},
    rayCallBack: function(){},
    resetCallBack: function(){},
    unPause: function(){},

    //updateIntern: function(){},

    update: function(){},


    //-----------------------------
    //
    //  RENDER LOOP
    //
    //-----------------------------

    pauseRender: function () { isRenderPause = true; },
    restartRender: function () { if(isRenderPause){ isRenderPause = false; view.render(0); } },

    render: function ( stamp ) {

        if( !isRenderPause ) requestAnimationFrame( view.render );

        t[0] = stamp === undefined ? now() : stamp;
        delta = ( t[0] - t[3] ) * 0.001;
        t[3] = t[0];

        if( view.pause ) isPause = true;
        if( isPause && !view.pause ){ isPause = false; view.unPause(); }

        if( needResize ) view.upResize();

        THREE.SEA3D.AnimationHandler.update( delta ); // sea3d animation

        if( refUser ) refUser.update(); // gamepad
        if( controler.enableDamping ) controler.update();


        TWEEN.update(  );// tweener

        view.update( delta );

       // if( view.needsUpdate ){

        //    view.updateIntern();
       //     view.needsUpdate = false;

       // }

        renderer.render( scene, camera );

        // fps
        if ( (t[0] - 1000) > t[1] ){ t[1] = t[0]; fps = t[2]; t[2] = 0; }; t[2]++;

    },

    //-----------------------------
    //
    //  SET BEFORE INIT
    //
    //-----------------------------


    setContainer: function ( cc ) { container = cc; },

    setBg: function ( c, Alpha ) { bg = c; alpha = Alpha !== undefined ? Alpha : alpha; },


    //-----------------------------
    //
    //  INIT THREE VIEW
    //
    //-----------------------------


    init: function ( Callback, Container, forceGL1 ) {

        // 0 correctpow warrning
        this.correctShader();

        // 1 CANVAS / CONTAINER

        isMobile = this.getMobile();
        container = Container !== undefined ? Container : container;

        canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
        canvas.style.cssText = 'position:absolute; top:0; left:0; pointer-events:auto;'//' image-rendering: pixelated;'

        if( !isMobile ){
            //document.oncontextmenu = function(e){ e.preventDefault(); };
            canvas.ondrop = function(e) { e.preventDefault(); };
        }

        // 2 RENDERER

        try {

            renderer = new THREE.WebGLRenderer( this.getContext( forceGL1 ) );

        } catch( error ) {
            if( intro !== undefined ) intro.message('<p>Sorry, your browser does not support WebGL.</p>'
                        + '<p>This application uses WebGL to quickly draw</p>'
                        + '<p>Physics Labs can be used without WebGL, but unfortunately this application cannot.</p>'
                        + '<p>Have a great day!</p>');
            return;
        }

        console.log('THREE '+THREE.REVISION+' GL'+(isGl2 ? 2 : 1) );

        renderer.setClearColor( bg, alpha );
        renderer.setPixelRatio( isMobile ? 1 : window.devicePixelRatio );

        // 3 SCENE / GROUP

        scene = new THREE.Scene();

        content = new THREE.Group();
        scene.add( content );

        followGroup = new THREE.Group();//= controler.followGroup;
        scene.add( followGroup );

        extraMesh = new THREE.Group();
        scene.add( extraMesh );

        // 4 CAMERA / CONTROLER / MOUSE

        camera = new THREE.PerspectiveCamera( 50 , 1 , 0.1, 20000 );
        controler = new THREE.OrbitControlsExtra( camera, renderer.domElement ); //this.canvas );
        controler.target.set( 0, 0, 0 );
        controler.enableKeys = false;
        controler.screenSpacePanning = true;
        controler.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controler.dampingFactor = 0.5;

        this.moveCam({ theta:0, phi:10, distance:30, target:[0,1,0], time:0 });

        mouse = new THREE.Vector3();
        offset = new THREE.Vector3();
        

        // 5 TEXTURE LOADER / ENVMAP

        loader = new THREE.TextureLoader();
        envmap = new THREE.Texture();//null;
        
        // 6 RESIZE

        this.resize();
        window.addEventListener( 'resize', view.resize, false );

        // 7 KEYBOARD & JOSTICK 

        //if( !isMobile && user ) user.init();

        
        // 8 START BASE

        //this.shaderHack();
        this.initGeometry();
        
        this.setTone();
        this.addLights();
        this.addShadow();
        this.initGrid();



        if( container !== null ) container.appendChild( canvas );
        else document.body.appendChild( canvas );

        this.extandGroup();

        this.render( 0 );

        if( Callback !== undefined ) Callback();

    },




    //-----------------------------
    //
    //  RESET THREE VIEW
    //
    //-----------------------------

	reset: function ( full ) {

        this.resetCallBack();

        controler.resetFollow();

        this.setShadow();
        this.removeRay();
        this.removeSky();
        this.removeFog();
        this.resetLight();
        this.removeJoystick();
        this.removeShadowDebug();
        this.initGrid();

        this.removeAudio();

        //isNeedUpdate = false;

        grid.visible = true;
        if( shadowGround !== null ) shadowGround.visible = true;

        while( extraMesh.children.length > 0 ) scene.remove( extraMesh.children.pop() );

        while( extraGeo.length > 0 ) extraGeo.pop().dispose();

        while( bodys.length > 0 ) this.clear( bodys.pop() );
        while( solids.length > 0 ) this.clear( solids.pop() );
        while( heros.length > 0 ) this.clear( heros.pop() );
        while( softs.length > 0 ) this.clear( softs.pop() );
        //while( terrains.length > 0 ) this.scene.remove( terrains.pop() );

        while( cars.length > 0 ){

            var c = cars.pop();
            if( c.userData.helper ){
                c.remove( c.userData.helper );
                c.userData.helper.dispose();
            }
            var i = c.userData.w.length;
            while( i-- ){
                scene.remove( c.userData.w[i] );
            }
            scene.remove( c );
        }

        

        this.update = function () {};
        this.tmpCallback = function(){};
        this.resetCallBack = function(){};

        this.byName = {};

        

        if( full ){

        	materials.reset();

            for( var m in tmpTxt ){ tmpTxt[m].dispose(); tmpTxt[m] = undefined; }
            for( var m in tmpMat ){ tmpMat[m].dispose(); tmpMat[m] = undefined; }

            tmpMat = {};
            tmpTxt = {};

        }

    },

    clear: function ( b ) {

        var m;
        while( b.children.length > 0 ) {
            m = b.children.pop();
            while( m.children.length > 0 ) m.remove( m.children.pop() );
            b.remove( m );
        }

        if ( b.parent ) b.parent.remove( b );

    },

    //-----------------------------
    //
    //  EXTAND THREE GROUP
    //
    //-----------------------------

    extandGroup: function () {

        /*Object.defineProperty( THREE.Mesh.prototype, 'inverse', {
            get: function() { 
                this.updateMatrixWorld(true);
                return new THREE.Matrix4().getInverse( this.matrixWorld ); 
            },
        });*/



        Object.defineProperty( THREE.Group.prototype, 'material', {
            get: function() { return this.children[0].material; },
            set: function( value ) { this.children.forEach( function ( b ) { b.material = value; }); }
        });
        
        Object.defineProperty( THREE.Group.prototype, 'receiveShadow', {
            get: function() { return this.children[0].receiveShadow; },
            set: function( value ) { this.children.forEach( function ( b ) { b.receiveShadow = value; }); }
        });

        Object.defineProperty( THREE.Group.prototype, 'castShadow', {
            get: function() { return this.children[0].castShadow; },
            set: function( value ) { this.children.forEach( function ( b ) { b.castShadow = value; }); }
        });

    },


    //-----------------------------
    //
    //  GET SYSTEM INFO
    //
    //-----------------------------


    getContext: function ( force ) {

        var gl;

        var o = { 
            antialias: isMobile ? false : true, 
            alpha: alpha === 1 ? false: true, 
            stencil:false, depth:true, precision: "highp", 
            premultipliedAlpha:true, 
            preserveDrawingBuffer:false,
            //xrCompatible: true,
        }

        if( !force ){
            gl = canvas.getContext( 'webgl2', o );
            if ( !gl ) gl = canvas.getContext( 'experimental-webgl2', o );
            isGl2 = !!gl;
        }

        if( !isGl2 ) {
            //delete( option.xrCompatible );
            gl = canvas.getContext( 'webgl', o );
            if (!gl) gl = canvas.getContext( 'experimental-webgl', o );
        }

        o.canvas = canvas;
        o.context = gl;
        return o;

    },

    getMobile: function () {

        var n = navigator.userAgent;
        if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i)) return true;
        else return false;  

    },


    //-----------------------------
    //
    //  GET
    //
    //-----------------------------

    getGL2: function () { return isGl2; },
    getFps: function () { return fps; },

    getBg: function () { return bg; },
    
    getAzimuthal: function (){ return -controler.getAzimuthalAngle(); },
    getGeo: function () { return geo; },
    getMat: function () { return mat; },
    
    getBody: function () { return bodys; },
    getSolid: function () { return solids; },
    getHero: function () { return heros; },

    //getPause: function () { return pause; },

    getControls: function () { return controler; },
    getControler: function () { return controler; },
    getCamera: function () { return camera; },
    getCamShadow: function () { return camShadow; },
    getMouse: function () { return mouse; },
    getDom: function () { return renderer.domElement; },

    getLoader:  function () { return loader; },
    getRenderer: function () { return renderer; },
    getScene: function () { return scene; },

    getSun: function () { return sun; },
    getMoon: function () { return moon; },
    getProbe: function () { return probe },
    getSphereLight: function () { return sphereLight; },
    //getLightProbe: function () { return lightProbe; },

    getLightDistance: function () { return lightDistance; },
    getFollowGroup:  function () { return followGroup; },

    getContent:  function () { return content; },
    getCanvas:  function () { return canvas; },

    getVs:  function () { return vs; },


    //-----------------------------
    //
    //  SET
    //
    //-----------------------------

    setPixelRatio: function ( v ) { renderer.setPixelRatio( v ); },

    setEditor: function ( v ) { refEditor = v; },
    
    setUser: function ( v ) {
        refUser = v; 
        if( !isMobile ) refUser.init(); 
    },

    //-----------------------------
    //
    //  FOCUS
    //
    //-----------------------------

    needFocus: function () {

        if( !refEditor )  return;
        canvas.addEventListener( 'mouseover', refEditor.unFocus, false );

    },

    haveFocus: function () {

        if( !refEditor )  return;
        canvas.removeEventListener( 'mouseover', refEditor.unFocus, false );

    },

    //-----------------------------
    //
    //  RESIZE
    //
    //-----------------------------

    setLeft: function ( x, y ) { 

        vs.x = x;
        vs.y = y;
        this.resize();

    },

	resize: function ( e ) {

        var w, h;

        if(container !== null ){
            w = container.offsetWidth - vs.x - vs.y;
            h = container.offsetHeight; 
        } else {
            w = window.innerWidth - vs.x - vs.y;
            h = window.innerHeight;
        }

		if( vs.w !== w || vs.h !== h ){

			vs.h = h;
            vs.w = w;

            needResize = true;

            if( refEditor ) refEditor.resizeMenu( vs.w );

		}
    },

    upResize: function () {

        canvas.style.left = vs.x +'px';
        camera.aspect = vs.w / vs.h;
        camera.updateProjectionMatrix();
        renderer.setSize( vs.w, vs.h );
        needResize = false;

    },


    //-----------------------------
    //
    //  LOADER
    //
    //-----------------------------

    getName: function ( url ) {

        return url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );

    },

    loadTexture: function ( name ){

        var n = this.getName( name );
        txt[ n ] = loader.load( './assets/textures/'+ name );
        return txt[ n ];

    },

    load: function ( Urls, Callback, autoPath, autoTexture ){

        pool.load( Urls, Callback, autoPath, autoTexture );

    },

    loadObject: function( Urls, Callback ){

        var urls = [];
        tmpName = [];

        if ( typeof Urls == 'string' || Urls instanceof String ){ 
            urls.push( './assets/models/'+ Urls + '.sea' );
            tmpName.push(  Urls );
        } else {
            for(var i=0; i < Urls.length; i++){
                urls.push( './assets/models/'+ Urls[i] + '.sea' );
                tmpName.push(  Urls[i] );
            }
        }
            
        this.loadCallback = Callback || function(){};
        this.tmpCallback = function(p){ this.afterLoad(p) }.bind( this );
        pool.load( urls, this.tmpCallback );

    },

    afterLoad: function ( p ) {

        var o, mesh, j;

        for(var i=0; i < tmpName.length; i++){

            o = p[ tmpName[i] ];
            j = o.length;

            while(j--){

                mesh = o[j];
                geo[mesh.name] = mesh.geometry;

                if( mesh.name === 'wheel' ){

                    geo['wheelR'] = geo.wheel.clone();
                    geo['wheelL'] = geo.wheel.clone();
                    geo.wheelL.rotateY( -Math.PI90 );
                    geo.wheelR.rotateY( Math.PI90 );

                }
                
            }

        }

        // test round geom
        //geo['box'] = new THREE.RoundedBoxGeometry(1,1,1, 0.01, 2)

        tmpName = [];
        this.loadCallback();

    },

    getGeometry: function ( name, meshName, uv2 ) {

        var m = this.getMesh( name, meshName );

        if(uv2) m.geometry.setAttribute( 'uv2', m.geometry.attributes.uv );

        if(m) return m.geometry;
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

    add: function ( m ) {

        content.add( m );

    },

    remove: function ( m ) {

        content.remove( m );

    },

    addMesh: function ( m, castS, receiveS ) {

        m.castShadow = castS !== undefined ? castS : true;
        m.receiveShadow = receiveS !== undefined ? receiveS : true;

        extraMesh.add( m );

    },

    testMesh: function ( geom ) {

        var mesh = new THREE.Mesh( geom, mat.basic );
        this.addMesh( mesh );

    },


    //-----------------------------
    //
    // GEOMETRY
    //
    //-----------------------------

    initGeometry: function (){

        geo = {

            agent: new THREE.CircleBufferGeometry( 1, 3 ),
            circle: new THREE.CircleBufferGeometry( 1, 6 ),

            plane:      new THREE.PlaneBufferGeometry(1,1,1,1),
            planeX:      new THREE.PlaneBufferGeometry(1,1,2,2),
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
        geo.planeX.rotateX( -Math.PI90 );
        geo.wheel.rotateZ( -Math.PI90 );

    },

    //-----------------------------
    //
    //  TEXTURES
    //  need textures.js
    //
    //-----------------------------

    texture: function ( o ) {

    	return textures.make( o );

    },

    getTexture: function ( name ){

    	return textures.get( name );

    },


    //-----------------------------
    //
    //  MATERIALS
    //  need materials.js
    //
    //-----------------------------

    material: function ( o ){

    	return materials.make( o );

    },

    getMaterial: function ( name ){

    	return materials.get( name );

    },
    

    //-----------------------------
    //
    // TONE MAPING
    //
    //-----------------------------

	setTone : function( o ) {

        o = o || {};

        for( var v in setting ) setting[v] = o[v] !== undefined ? o[v] : setting[v];

        renderer.physicallyCorrectLights = setting.physicallyCorrectLights;
        //renderer.gammaInput = setting.gammaInput;
        renderer.gammaOutput = setting.gammaOutput;
        renderer.toneMapping = toneMappings[ setting.type ];
        renderer.toneMappingExposure = setting.exposure;
        renderer.toneMappingWhitePoint = setting.whitePoint;

    },


    //-----------------------------
    //
    // DEBUG
    //
    //-----------------------------

    debug: function () {

        if( !isDebug ){

            helper[0] = new THREE.PointHelper( 20, 0xFFFF00 );
            helper[1] = new THREE.PointHelper( 20, 0x00FFFF );
            helper[2] = new THREE.PointHelper( 5, 0xFF8800 );

            sun.add( helper[0] )
            moon.add( helper[1] )
            followGroup.add( helper[2] )

            isDebug = true;

        } else {

            sun.remove( helper[0] )
            moon.remove( helper[1] )
            followGroup.remove( helper[2] )

            isDebug = false;

        }
        

    },


    //-----------------------------
    //
    // FOG
    //
    //-----------------------------

    getWithFog: function (){
        
        return isFog;

    },

    addFog: function ( o ) {
        
        if( isFog ) return;

        o = o || {};

        fog = o.exp !== undefined ? new THREE.FogExp2( o.color || 0x3b4c5a, o.exp ) : new THREE.Fog( o.color || 0x3b4c5a, o.near || 1, o.far || 300 );
        scene.fog = fog;
        isFog = true;

    },

    setFogColor: function ( color ) {
        
        if( !isFog ) return;
        fog.color = color;

    },

    removeFog: function () {
        
        if( !isFog ) return;
        fog = null;
        scene.fog = null;
        isFog = false;

    },


    //-----------------------------
    //
    // LIGHT
    //
    //-----------------------------

    resetLight: function () {

        if( !isLight ) return;

        followGroup.position.set(0,0,0);

        lightDistance = 200;

        sun.color.setHex(0xffffff);
        sun.intensity = setting.sunIntensity;

        moon.color.setHex(0x919091);
        moon.intensity = setting.moonIntensity;

        sun.position.set( 0, lightDistance, 10 );
        moon.position.set( 0, -lightDistance, -10 );

    },

    addLights: function () {

        if( isLight ) return;

    	sun = new THREE.DirectionalLight( 0xffffff, setting.sunIntensity );
    	sun.position.set( 0, lightDistance, 10 );

    	moon = new THREE.DirectionalLight( 0x919091, setting.moonIntensity );//new THREE.PointLight( 0x919091, 1, this.lightDistance*2, 2 );
    	moon.position.set( 0, -lightDistance, -10 );

        /*if( this.isWithSphereLight ){
            this.sphereLight = new THREE.HemisphereLight( 0xff0000, this.bg, 0.6 );
            this.sphereLight.position.set( 0, 1, 0 );
            this.followGroup.add( this.sphereLight );
        }*/

        //sphereLight = new THREE.HemisphereLight( 0xff0000, bg, 0.0 );
        //sphereLight.position.set( 0, 0, 0 );
        //followGroup.add( sphereLight );

        //probe = new THREE.LightProbe();
        //followGroup.add( probe );

    	//ambient = new THREE.AmbientLight( 0x202020 );
        //followGroup.add( ambient );
        //this.ambient.position.set( 0, 50, 0 );

    	followGroup.add( sun );
        followGroup.add( sun.target );
    	followGroup.add( moon );
        followGroup.add( moon.target );

    	//this.scene.add( this.ambient );

        /*this.scene.add( this.sun );
        this.scene.add( this.moon );
        this.scene.add( this.ambient );*/

        isLight = true;

    },

    clearLight: function () {

        if( !isLight ) return

        followGroup.remove( sun );
        followGroup.remove( sun.target );
        followGroup.remove( moon );
        followGroup.remove( moon.target );

        isLight = true;

        view.addLights();

    },


    //-----------------------------
    //
    // SHADOW
    //
    //-----------------------------

    getShadowMap: function () { return shadowMat; },

    addShadow: function( o ){

        o = o || {};

    	if( isWithShadow ) return;
        if( !isLight ) this.addLights();

        if( shadowMat === null ){ 

            shadowMat = new THREE.ShadowMaterial({ opacity:0.5, depthTest:true, depthWrite:false });

            if(isHighShadow){

                // overwrite shadowmap code
                var shaderShadow = THREE.ShaderChunk.shadowmap_pars_fragment;
                shaderShadow = shaderShadow.replace( '#ifdef USE_SHADOWMAP', ShadowPCSS );
                shaderShadow = shaderShadow.replace( '#if defined( SHADOWMAP_TYPE_PCF )',[ "return PCSS( shadowMap, shadowCoord );", "#if defined( SHADOWMAP_TYPE_PCF )"].join( "\n" ) );

                shadowMat.onBeforeCompile = function ( shader ) {

                    var fragment = shader.fragmentShader;
                    fragment = fragment.replace( '#include <shadowmap_pars_fragment>', shaderShadow );
                    shader.fragmentShader = fragment;

                }

            }


        }

        isWithShadow = true;

        renderer.shadowMap.enabled = true;

        if( !isHighShadow ){
            renderer.shadowMap.soft = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        shadowGround = new THREE.Mesh( geo.planeX, shadowMat );
        shadowGround.castShadow = false;
        shadowGround.receiveShadow = true;
        scene.add( shadowGround );

        camShadow = new THREE.OrthographicCamera();
        sun.shadow = new THREE.LightShadow( camShadow );
        //followGroup.add( camShadow );

        sun.castShadow = true;

        this.setShadow( o );

    },

    setShadow: function ( o ) {

        if( !isWithShadow ) return;

        o = o || {};

        shadowMat.opacity = o.opacity || 0.5;

        var cam = camShadow;
        var d = ( o.size !== undefined ) ? o.size : 150;
        cam.left =  d;
        cam.right = - d;
        cam.top =  d;
        cam.bottom = - d;
        cam.near = ( o.near !== undefined ) ? o.near : 100;
        cam.far = ( o.far !== undefined ) ? o.far : 300;
        cam.updateProjectionMatrix();

        sun.shadow.mapSize.width = o.resolution || 2048;
        sun.shadow.mapSize.height = o.resolution || 2048;
        sun.shadow.bias = o.bias || 0.00001;

        var gr = o.groundSize || 200;
        var py = o.groundY || 0;

        shadowGround.scale.set( gr*2, 1, gr*2 );
        shadowGround.position.y = py;

        if( o.debug ) this.addShadowDebug();

    },

    addShadowDebug: function () {

        if( isShadowDebug ) {
            campHelper.update();
        } else {
            campHelper = new THREE.CameraHelper( camShadow );
            scene.add( campHelper );
            isShadowDebug = true;
        }

    },

    removeShadowDebug: function () {

        if( !isShadowDebug ) return;
        scene.remove( campHelper );
        isShadowDebug = false;

    },

    showShadowGround: function ( b ) {

        shadowGround.visible = b;

    },

    //-----------------------------
    //
    // MIRROR
    //
    //-----------------------------

    addMirror: function ( o ) { 

        o = o || {};

        if( isMirror ) return;

        var geometry = new THREE.PlaneBufferGeometry( 200, 200, 2, 2 );
        groundMirror = new THREE.Reflector( geometry, {
            clipBias: 0.003,
            textureWidth: vs.w,
            textureHeight: vs.h,
            color: 0x777777,
            recursion: 1,
            opacity:o.opacity || 1.0,
        });

        //groundMirror.scale.set( 200, 1, 200 );
        groundMirror.position.set(o.x|| 0, o.y||0, o.z||0);
        //groundMirror.scale.set( 200, 1, 200 );
        groundMirror.rotateX( - Math.PI / 2 );
        scene.add( groundMirror );

        isMirror = true;

    },
    

    //-----------------------------
    //
    // GRID
    //
    //-----------------------------

    initGrid: function ( o ){

        if( grid !== null ){ 
            scene.remove( grid );
            grid.geometry.dispose();
            grid.material.dispose();
        }

        o = o || {};
        grid = new THREE.GridHelper( o.s1 || 40, o.s2 || 16, o.c1 || 0x000000, o.c2 || 0x020202 );
        grid.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.15, depthTest:true, depthWrite:false } );
        grid.position.y = -0.01;
        scene.add( grid );

    },

    hideGrid: function ( notGround ) {

        if( grid.visible ){ grid.visible = false; if( shadowGround !== null && !notGround ) shadowGround.visible = false; }
        else{ grid.visible = true; if( shadowGround !== null && !notGround ) shadowGround.visible = true; }

    },

    showGrid: function ( b ) {

        grid.visible = b;

    },


    //-----------------------------
    //
    //  ENVIRONEMENT
    //  need sky.js
    //
    //-----------------------------

    getSky:  function () { return sky; },

    showBackground: function ( b ) {

        sky.showBackground( b );

    },

    getEnvmap: function () { return envmap; },
    getSkyCube: function () { return sky.getCube(); },

    setEnvmap: function ( v ) {

        envmap = v;
        materials.updateEnvmap();

    },

    removeSky: function () {

        if( envmap ) envmap.dispose();
        envmap = null;

        sky.clear();

    },

    setSky: function ( o ) {

        if( !isLight ) this.addLights();
        sky.setSky( o );

    },

    addSky: function ( o, callback ) {

        if( !isLight ) this.addLights();
        sky.setSky( o, callback );

    },

    skyTimelap: function ( t, frame ) {

        sky.timelap( t, frame );

    },

    updateSky: function ( o ) {

        sky.setOption( o );

    },

    updateEnvMap: function () {

        var hdr = sky.getHdr();
        var mt;

        // intern material
        for( var m in mat ){

            mt = mat[m];

            if( mt.envMap !== undefined ){
                if( mt.type === 'MeshStandardMaterial' ) mt.envMap = envmap;
                else mt.envMap =  hdr ? null : envmap;
                if( mt.wireframe ) mt.envMap = null;
                mt.needsUpdate = true;
            }

        }

        // tmp material
        for( var m in tmpMat ){

            mt = tmpMat[m];

            if( mt.envMap !== undefined ){
                if( mt.type === 'MeshStandardMaterial' ) mt.envMap = envmap;
                else mt.envMap =  hdr ? null : envmap;
                if( mt.wireframe ) mt.envMap = null;
                mt.needsUpdate = true;
            }

        }

        this.extraUpdateMat( envmap, hdr );

        ////

       

    },

    extraUpdateMat: function ( env, hdr ) {

    }, 


    //--------------------------------------
    //
    //   CAMERA CONTROL AUTO AND FOLLOW
    //
    //--------------------------------------

    moveCam: function ( o, callback ) {

        controler.moveCam( o, callback );

    },

    setFollow: function( m, o ){

        var mesh = null;

        if ( typeof m === 'string' || m instanceof String ) mesh = this.byName[ m ];
        else if( m.isMesh || m.isGroup ) mesh = m;

        if( mesh === null ){ 
            controler.resetFollow();
            return;
        }
        
        o = o || {};
        controler.initFollow( mesh, o );
        //controler.enableDamping = false;

    },


    //-----------------------------
    //
    // RAYCAST
    //
    //-----------------------------

    activeRay: function ( callback, debug, size ) {

        if( isRay ) return;

        ray = new THREE.Raycaster();

        dragPlane = new THREE.Mesh( 
            debug ?  new THREE.PlaneBufferGeometry( 1, 1, 4, 4 ) : new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ),  
            new THREE.MeshBasicMaterial({ color:0x00ff00, transparent:true, opacity:debug ? 0.3 : 0, depthTest:false, depthWrite:false, wireframe: debug ? true : false })
        );

        dragPlane.castShadow = false;
        dragPlane.receiveShadow = false;
        this.setDragPlane( null, size );
        scene.add( dragPlane );

        this.fray = function(e){ this.rayTest(e); }.bind( this );
        this.mDown = function(e){ this.rayTest(e); mouse.z = 1; }.bind( this );
        this.mUp = function(e){ mouse.z = 0; }.bind( this );

        canvas.addEventListener( 'mousemove', this.fray, false );
        canvas.addEventListener( 'mousedown', this.mDown, false );
        document.addEventListener( 'mouseup', this.mUp, false );

        this.rayCallBack = callback;
        isRay = true;

    },

    removeRay: function () {

        if( !isRay ) return;

        canvas.removeEventListener( 'mousemove', this.fray, false );
        canvas.removeEventListener( 'mousedown', this.mDown, false );
        document.removeEventListener( 'mouseup', this.mUp, false );

        this.rayCallBack = function(){};

        scene.remove( dragPlane );

        isRay = false;
        offset.set( 0,0,0 );

    },

    rayTest: function ( e ) {

        mouse.x = ( (e.clientX - vs.x )/ vs.w ) * 2 - 1;
        mouse.y = - ( e.clientY / vs.h ) * 2 + 1;

        ray.setFromCamera( mouse, camera );
        //var intersects = this.ray.intersectObjects( this.content.children, true );
        var intersects = ray.intersectObject( dragPlane );
        if ( intersects.length ){ 
            offset.copy( intersects[0].point );
            this.rayCallBack( offset );
        }

    },

    setDragPlane: function ( pos, size ) {

        size = size || 200;
        dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( size );
        if( pos ){
            dragPlane.position.fromArray( pos );
            dragPlane.rotation.set( 0, controler.getAzimuthalAngle(), 0 );
            //this.dragPlane.lookAt( this.camera.position );
        } else {
            dragPlane.position.set( 0, 0, 0 );
            dragPlane.rotation.set( -Math.PI90, 0, 0 );
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
        if( isWithJoystick ) return;

        editor.addJoystick( o );
        isWithJoystick = true;

    },

    removeJoystick: function () {

        if( !editor ) return;
        if( !isWithJoystick ) return;

        editor.removeJoystick();
        isWithJoystick = false;

    },

    //--------------------------------------
    //
    //   FOLLOW
    //
    //--------------------------------------

    getCenterPosition: function () {

        return followGroup.position;

    },

    getDistanceToCenter: function () {

        var p = followGroup.position;
        return Math.sqrt( p.x * p.x + p.z * p.z );

    },


    //--------------------------------------
    //
    //   AUDIO
    //
    //--------------------------------------

    needAudio: function () {

        autoAddAudio = this.autoAudio.bind( this )

        canvas.addEventListener( 'click', view.autoAddAudio, false );

    },

    autoAudio: function( e ){ 

        this.addAudio();
        canvas.removeEventListener( 'click', view.autoAddAudio );
        autoAddAudio = null;

    },

    addAudio: function () {

        //this.needsAudio = true;

        if( listener !== null ) return;
        listener = new THREE.AudioListener();
        camera.add( listener );

    },

    removeAudio: function () {

        //this.needsAudio = false;

        if( listener === null ) return;
        
        camera.remove( listener );
        listener = null;

    },


    addSound: function ( name ){

        if( listener === null ) this.addAudio();

        if(!pool.buffer[name]) return null;

        var audio = new THREE.PositionalAudio( listener );
        //audio.volume = 1;
        audio.setBuffer( pool.buffer[name] );
        return audio;

    },


    //--------------------------------------
    //
    //   SHADER
    //
    //--------------------------------------

    makeCheck: function () {

        if( check !== null ) return check;

        var c = document.createElement('canvas');
        c.width = c.height = 128;
        var ctx = c.getContext("2d");

        ctx.beginPath();
        ctx.rect(0, 0, 128, 128);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.beginPath();
        ctx.rect(0, 0, 64, 64);
        ctx.rect(64, 64, 64, 64);
        ctx.fillStyle = "#CCCCCC";
        ctx.fill();

        var img = new Image( 128, 128 );
        img.src = c.toDataURL( 'image/png' );

        check = new THREE.Texture( img );
        check.repeat = new THREE.Vector2( 2, 2 );
        check.wrapS = check.wrapT = THREE.RepeatWrapping;

        img.onload = function(){ check.needsUpdate = true; }

        return check;

    },

    /*shaderHack: function () {

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

    },*/


    //--------------------------------------
    //
    //   JSON
    //
    //--------------------------------------

    loadJson: function ( link, callback ) {

        var xhr = new XMLHttpRequest();
        xhr.open('GET', link, true );
        xhr.overrideMimeType("application/json");

        xhr.onreadystatechange = function () {

            if ( xhr.readyState === 2 ) { 
            } else if ( xhr.readyState === 3 ) {
            } else if ( xhr.readyState === 4 ) {
                if ( xhr.status === 200 || xhr.status === 0 ) callback( JSON.parse( xhr.response ) );
                else console.error( "Couldn't load ["+ link + "] [" + xhr.status + "]" );
            }

        };
        
        xhr.send( null );

    },

    //--------------------------------------
    //
    //   SHADER HACK
    //
    //--------------------------------------

    correctShader: function () {

        // remove warning for pow

        var s = THREE.ShaderChunk.bsdfs;
        s = s.replace( 'pow( lightDistance, decayExponent )', 'pow( abs(lightDistance), decayExponent ) * sign(lightDistance)' );
        s = s.replace( 'return pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );', ['float LL = saturate( -lightDistance / cutoffDistance + 1.0 );', 'return pow( abs(LL), decayExponent ) * sign(LL);'].join('\n') );
        s = s.replace( 'pow( dotNH, shininess );', 'pow( abs(dotNH), shininess ) * sign(dotNH);' );
        s = s.replace( 'pow(sin2h, invAlpha * 0.5) / (2.0 * PI);', '( pow( abs(sin2h), invAlpha * 0.5) * sign(sin2h) ) / (2.0 * PI);' );
        THREE.ShaderChunk.bsdfs = s;

        s = THREE.ShaderChunk.encodings_pars_fragment;
        s = s.replace( 'pow( value.rgb, vec3( gammaFactor ) )', 'pow( abs(value.rgb), vec3( gammaFactor ) )' );
        s = s.replace( 'pow( value.rgb, vec3( 1.0 / gammaFactor ) )', 'pow( abs(value.rgb), vec3( 1.0 / gammaFactor ) )' );
        s = s.replace( 'pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) )', 'pow( abs(value.rgb * 0.9478672986 + vec3( 0.0521327014 )), vec3( 2.4 ) )' );
        s = s.replace( 'pow( value.rgb, vec3( 0.41666 )', 'pow( abs(value.rgb), vec3( 0.41666 )' );
        THREE.ShaderChunk.encodings_pars_fragment = s;

        s = THREE.ShaderChunk.lights_physical_pars_fragment;
        s = s.replace( 'pow( 1.0 - dotNL, 5.0 ) * pow( 1.0 - roughness, 2.0 )', 'pow( abs(1.0 - dotNL), 5.0 ) * pow( abs(1.0 - roughness), 2.0 )' );
        s = s.replace( 'pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) )', 'pow( abs(dotNV + ambientOcclusion), exp2( - 16.0 * roughness - 1.0 ) )' );
        THREE.ShaderChunk.lights_physical_pars_fragment = s;

        s = THREE.ShaderChunk.tonemapping_pars_fragment;
        s = s.replace( 'pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );', 'pow( abs(( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 )), vec3( 2.2 ) );' );
        THREE.ShaderChunk.tonemapping_pars_fragment = s;

        s = THREE.ShaderChunk.cube_uv_reflection_fragment;
        s = s.replace( 'pow(0.559 * variance, 0.25);', 'pow( abs(0.559 * variance), 0.25);' );
        THREE.ShaderChunk.cube_uv_reflection_fragment = s;
        
    },

}

return view;

})();


var ShadowPCSS = [

    "#ifdef USE_SHADOWMAP",
    "#define LIGHT_WORLD_SIZE 0.005",//0.005
    "#define LIGHT_FRUSTUM_WIDTH 3.75",//3.75 // 1.75
    "#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)",
    "#define NEAR_PLANE 9.5",
    " ",
    "#define NUM_SAMPLES 17",//17
    "#define NUM_RINGS 11",//11
    "#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES",
    "#define PCF_NUM_SAMPLES NUM_SAMPLES",
    " ",
    "vec2 poissonDisk[NUM_SAMPLES];",
    " ",
    "void initPoissonSamples( const in vec2 randomSeed ) {",
    "   float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );",
    "   float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );",

    // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
    "   float angle = rand( randomSeed ) * PI2;",
    "   float radius = INV_NUM_SAMPLES;",
    "   float radiusStep = radius;",

    "   for( int i = 0; i < NUM_SAMPLES; i ++ ) {",
    "       poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( abs(radius), 0.75 );",
    "       radius += radiusStep;",
    "       angle += ANGLE_STEP;",
    "   }",
    "}",

    "float penumbraSize( const in float zReceiver, const in float zBlocker ) { ",// Parallel plane estimation
    "   return (zReceiver - zBlocker) / zBlocker;",
    "}",

    "float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {",
        // This uses similar triangles to compute what
        // area of the shadow map we should search
    "   float searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;",
    "   float blockerDepthSum = 0.0;",
    "   int numBlockers = 0;",

    "   for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {",
    "       float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));",
    "       if ( shadowMapDepth < zReceiver ) {",
    "           blockerDepthSum += shadowMapDepth;",
    "           numBlockers ++;",
    "       }",
    "   }",

    "    if( numBlockers == 0 ) return -1.0;",

    "    return blockerDepthSum / float( numBlockers );",
    "}",

    "float PCF_Filter( sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {",
    "    float sum = 0.0;",
    "    for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {",
    "        float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );",
    "        if( zReceiver <= depth ) sum += 1.0;",
    "    }",
    "    for( int i = 0; i < PCF_NUM_SAMPLES; i ++ ) {",
    "        float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );",
    "        if( zReceiver <= depth ) sum += 1.0;",
    "    }",
    "    return sum / ( 2.0 * float( PCF_NUM_SAMPLES ) );",
    "}",

    "float PCSS ( sampler2D shadowMap, vec4 coords ) {",
    "    vec2 uv = coords.xy;",
    "    float zReceiver = coords.z;", // Assumed to be eye-space z in this code

    "    initPoissonSamples( uv );",
        // STEP 1: blocker search
    "    float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );",

        //There are no occluders so early out (this saves filtering)
    "    if( avgBlockerDepth == -1.0 ) return 1.0;",

        // STEP 2: penumbra size
    "    float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );",
    "    float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;",
        
        // STEP 3: filtering
        // return avgBlockerDepth;
    "    return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );",
    "}",

].join( "\n" );