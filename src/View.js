function View () {

    this.loadCallback = function(){};
    this.tmpCallback = function(){};
    this.tmpName = [];

    // overwrite shadowmap code
    /*
    var shader = THREE.ShaderChunk.shadowmap_pars_fragment;
    shader = shader.replace( '#ifdef USE_SHADOWMAP', THREE.ShadowPCSS );
    shader = shader.replace( '#if defined( SHADOWMAP_TYPE_PCF )',[ "return PCSS( shadowMap, shadowCoord );", "#if defined( SHADOWMAP_TYPE_PCF )"].join( "\n" ) );
    THREE.ShaderChunk.shadowmap_pars_fragment = shader;
    */

	this.isMobile = this.testMobile();
	this.isNeedUpdate = false;
	this.isWithShadow = false;
    this.isWithSky = false;
    this.isWithLight = false;
	this.isWithRay = false;
	this.needResize = false;
	this.t = [0,0,0,0];
    this.fps = 0;
	this.bg = 0x151515;
	this.vs = { w:1, h:1, l:0, x:0 };

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

	// 1 CANVAS
	this.canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' );
    this.canvas.style.cssText = 'position: absolute; top:0; left:0; pointer-events:auto;'
    this.canvas.oncontextmenu = function(e){ e.preventDefault(); };
    this.canvas.ondrop = function(e) { e.preventDefault(); };
    document.body.appendChild( this.canvas );

    // 2 RENDERER
    try {
        this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, antialias:true, alpha:false, precision: "mediump" });
    } catch( error ) {
        if( intro !== null ) intro.message('<p>Sorry, your browser does not support WebGL.</p>'
                    + '<p>This application uses WebGL to quickly draw</p>'
                    + '<p>Physics Labs can be used without WebGL, but unfortunately this application cannot.</p>'
                    + '<p>Have a great day!</p>');
        return;
    }

    this.renderer.setClearColor( this.bg, 1 );
    this.renderer.setPixelRatio( this.isMobile ? 1 : window.devicePixelRatio );

    // 3 CAMERA / CONTROLER

    this.camera = new THREE.PerspectiveCamera( 60 , 1 , 1, 10000 );
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

    // 7 START RENDER

    this.render( 0 );

}

View.prototype = {

	byName: {},

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

    initGeometry: function (){

        this.geo = {

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

        this.geo.cicle.rotateX( -Math.PI90 );
        
        this.geo.agent.rotateX( -Math.PI90 );
        this.geo.agent.rotateY( -Math.PI90 );

        //this.geo.plane.rotateZ( -Math.PI90 );
        this.geo.plane.rotateX( -Math.PI90 );
        this.geo.wheel.rotateZ( -Math.PI90 );

    },

    initEnvMap: function ( url ){

        this.envmap = this.loader.load( url || './assets/textures/spherical/chrome.jpg' );
        this.envmap.mapping = THREE.SphericalReflectionMapping;

    },

    initMaterial: function (){

        this.mat = {

            basic: new THREE.MeshStandardMaterial({ color:0x999999, name:'basic', wireframe:false, envMap:this.envmap, metalness:0.8, roughness:0.5 }),

            statique: new THREE.MeshStandardMaterial({ color:0x333344, name:'statique', wireframe:false, transparent:true, opacity:0.1, depthTest:true, depthWrite: false }),
            plane: new THREE.MeshBasicMaterial({ color:0x111111, name:'plane', wireframe:true }),
           
            sleep: new THREE.MeshStandardMaterial({ color:0x6666DD, name:'sleep', wireframe:false, envMap:this.envmap, metalness:0.6, roughness:0.4 }),
            move: new THREE.MeshStandardMaterial({ color:0x999999, name:'move', wireframe:false, envMap:this.envmap, metalness:0.6, roughness:0.4 }),
            movehigh: new THREE.MeshStandardMaterial({ color:0xff9999, name:'movehigh', wireframe:false, envMap:this.envmap, metalness:0.6, roughness:0.4 }),

            kinematic: new THREE.MeshStandardMaterial({ name:'kinematic', color:0xAA9933, envMap:this.envmap,  metalness:0.6, roughness:0.4 }),//, transparent:true, opacity:0.6
            donut: new THREE.MeshStandardMaterial({ name:'donut', color:0xAA9933, envMap:this.envmap,  metalness:0.6, roughness:0.4 }),

            hide: new THREE.MeshBasicMaterial({ color:0x111111, name:'hide', wireframe:true, visible:false }),

            skyUp: new THREE.MeshBasicMaterial({ color:0xFFFFFF }),

            hero: new THREE.MeshStandardMaterial({ color:0x993399, name:'hero', envMap:this.envmap,  metalness:0.6, roughness:0.4, skinning:true }),
            debug: new THREE.MeshBasicMaterial({ color:0x11ff11, name:'debug', wireframe:true, opacity:0.1, transparent:true }),
            soft: new THREE.MeshStandardMaterial({ vertexColors: THREE.VertexColors, name:'soft', wireframe:false, transparent:true, opacity:0.9, envMap:this.envmap, side: THREE.DoubleSide }),

        }

    },

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

        if( this.needResize ) this.upResize();

        THREE.SEA3D.AnimationHandler.update( 0.017 );

		//requestAnimationFrame( function(s){ this.render(s); }.bind(this) );

        TWEEN.update();

        this.updateExtra();

        //user.update(); // gamepad

		if( this.isNeedUpdate ){

            this.update();
            this.updateIntern();
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
        

        this.update = function () {};
        this.tmpCallback = function(){};
        this.byName = {};

    },

    setLeft: function ( x ) { 

    	this.vs.x = x;
    	this.resize();

    },

	resize: function ( e ) {

		//this.needResize = false;
		var v = this.vs;
		var w = window.innerWidth - v.x;
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

    addMap: function( url, name ) {

        var map = this.loader.load( './assets/textures/' + url );
        //map.wrapS = THREE.RepeatWrapping;
        //map.wrapT = THREE.RepeatWrapping;
        map.flipY = false;
        this.mat[name] = new THREE.MeshStandardMaterial({ name:name, map:map, envMap:this.envmap,  metalness:0.6, roughness:0.4, shadowSide:false });

    },

    loadTexture: function ( name ){

        var n = this.getName( name );
        this.txt[ n ] = this.loader.load( './assets/textures/'+ name );
        return this.txt[ n ];

    },

    load: function ( Urls, Callback ){

        pool.load( Urls, Callback );

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
        this.tmpCallback = function(){ this.afterLoad() }.bind(this);
        pool.load( urls, this.tmpCallback );

    },

    afterLoad: function () {

        var r = pool.getResult(), o, m, j;

        for(var i=0; i < this.tmpName.length; i++){

            o = r[this.tmpName[i]];
            j = o.length;
            while(j--){
                m = o[j];
                this.geo[m.name] = m.geometry;

                if(m.name==='wheel'){

                    this.geo['wheelR'] = this.geo.wheel.clone();
                    this.geo['wheelL'] = this.geo.wheel.clone();
                    this.geo.wheelL.rotateY( -Math.PI90 );
                    this.geo.wheelR.rotateY( Math.PI90 );

                }

                //console.log(m.name)
            }

        }

        this.loadCallback();

    },

    getMesh: function ( name, meshName ) {

        return pool.getMesh( name, meshName );

    },

    addMesh: function ( m ) {

        m.castShadow = true;
        m.receiveShadow = true;

        this.extraMesh.add( m );

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

        var g = new THREE.PlaneBufferGeometry( 100, 100 );
        g.rotateX( -Math.PI90 );
        this.moveplane = new THREE.Mesh( g,  new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0 }));
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

        //renderer.physicallyCorrectLights = true;
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

    addLights: function(){

        if( this.isWithLight ) return;

    	this.sun = new THREE.DirectionalLight( 0xffffff, 1 );
    	this.sun.position.set( 0, 200, 10 );

    	this.moon = new THREE.PointLight( 0x909090, 1, 400, 2 );
    	this.moon.position.set( 0, -200, -10 );

    	this.ambient = new THREE.HemisphereLight( 0x303030, 0x101010, 0.5 );

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

        this.isWithShadow = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.soft = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
        this.shadowGround = new THREE.Mesh( new THREE.PlaneBufferGeometry( 200, 200, 1, 1 ), new THREE.ShadowMaterial({opacity:0.4}) );
        this.shadowGround.geometry.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI*0.5) );
        this.shadowGround.castShadow = false;
        this.shadowGround.receiveShadow = true;
        this.scene.add( this.shadowGround );

        var d = 150;
        var camShadow = new THREE.OrthographicCamera( d, -d, d, -d,  100, 400 );
        this.sun.shadow = new THREE.LightShadow( camShadow );

        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.bias = 0.0002;
        this.sun.castShadow = true;

        for(var m in this.mat){
            this.mat[m].shadowSide = false;
        }

        //this.followGroup.add( new THREE.CameraHelper( this.sun.shadow.camera ));

    },

    //-----------------------------
    //
    // SKY
    //
    //-----------------------------

    addSky: function () {

        if( this.isWithSky ) return;
        if( !this.isWithLight ) this.addLights();

        this.sky = new THREE.Sky();
        this.sky.scale.setScalar( 5000 );
        this.scene.add( this.sky );

        ///
        this.sceneSky = new THREE.Scene();
        this.cubeSky = new THREE.CubeCamera( 1, 10000, 256 );
        this.cubeSky.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
        this.sceneSky.add( this.cubeSky );
        this.sceneSky.add( this.sky.clone() );

        this.tmpRender = new THREE.WebGLRenderTarget( 2,2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType } );

        this.vUp = new THREE.Vector3( 0,1000,0 );
        this.vDown = new THREE.Vector3( 0,-1000,0 );


        this.camTmp = new THREE.OrthographicCamera(-1,1,1,-1, 1, 10000 );

        this.skyset  = {
            distance: 200,
            turbidity: 10,
            rayleigh: 2,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.8,
            luminance: 1,
            inclination: 45,//-25,//0.49, // elevation / inclination
            azimuth: 45,//0.25, // Facing front,
        };

        this.vSphe = new THREE.Spherical(this.skyset.distance);
        this.mSphe = new THREE.Spherical(this.skyset.distance);
        this.sunPosition =  new THREE.Vector3();
        this.moonPosition =  new THREE.Vector3();

        this.isWithSky = true;

        this.updateSky();

    },

    updateSky: function ( o ) {

        if( !this.isWithSky ) return;

        o = o || {};

        if(o.hour){
            if(o.hour>24) o.hour = 0;
            if(o.hour<0) o.hour = 24;
            this.skyset.inclination = (o.hour*15)-90;
        }

        var uniforms = this.sky.material.uniforms;

        uniforms.turbidity.value = this.skyset.turbidity;
        uniforms.rayleigh.value = this.skyset.rayleigh;
        uniforms.luminance.value = this.skyset.luminance;
        uniforms.mieCoefficient.value = this.skyset.mieCoefficient;
        uniforms.mieDirectionalG.value = this.skyset.mieDirectionalG;

        this.vSphe.phi = (this.skyset.inclination-90) * Math.torad;
        this.vSphe.theta = (this.skyset.azimuth-90) * Math.torad;

        this.mSphe.phi = (this.skyset.inclination+90) * Math.torad;
        this.mSphe.theta = (this.skyset.azimuth-90) * Math.torad;

        this.sunPosition.setFromSpherical( this.vSphe );
        this.moonPosition.setFromSpherical( this.mSphe );

        this.moon.position.copy( this.moonPosition );
        this.sun.position.copy( this.sunPosition );
        uniforms.sunPosition.value.copy( this.sunPosition );

        this.cubeSky.update( this.renderer, this.sceneSky );

        this.camTmp.lookAt( this.vUp );
        this.renderer.render( this.sceneSky, this.camTmp, this.tmpRender, true );
        var read = new Float32Array( 4 );
        this.renderer.readRenderTargetPixels( this.tmpRender, 0, 0, 1, 1, read );

        this.ambient.color.setRGB( read[0], read[1], read[2] );

        //console.log('up', read)

        this.camTmp.lookAt( this.vDown );
        this.renderer.render( this.sceneSky, this.camTmp, this.tmpRender, true );
        read = new Float32Array( 4 );
        this.renderer.readRenderTargetPixels( this.tmpRender, 0, 0, 1, 1, read );

        this.ambient.groundColor.setRGB( read[0], read[1], read[2] );

        //console.log('down', read)

        this.camTmp.lookAt( this.sunPosition );
        this.renderer.render( this.sceneSky, this.camTmp, this.tmpRender, true );
        read = new Float32Array( 4 );
        this.renderer.readRenderTargetPixels( this.tmpRender, 0, 0, 1, 1, read );

        this.sun.color.setRGB( read[0], read[1], read[2] );
        this.sun.intensity = read[0];
        var mi = (1 - read[0])*0.7;
        if( mi < 0 ) mi = 0;
        this.moon.intensity = mi;

        // update envmap
        this.updateEnvMap( this.cubeSky.renderTarget.texture );

    },

    updateEnvMap: function ( texture ) {

        this.envmap = texture;

        for( var m in this.mat ){
            if(this.mat[m].envMap) this.mat[m].envMap = this.envmap;
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

    setFollow: function( name, r ){

        if(!this.byName[ name ]) return
        if( r !== undefined ) this.controler.cam.rotationOffset = r;//-90;
        this.controler.followTarget = this.byName[ name ];

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