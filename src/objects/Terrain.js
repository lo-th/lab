

THREE.Terrain = function  ( o ) {

    o = o === undefined ? {} : o;

    // terrain, water, road
    this.ttype = o.terrainType || 'terrain';
    
    this.needsUpdate = false;

    this.callback = null;
    this.physicsUpdate = function(){};

    this.uvx = [ o.uv || 18, o.uv || 18 ];


    this.sample = o.sample == undefined ? [64,64] : o.sample;
    this.size = o.size === undefined ? [100,10,100] : o.size;

    this.data = {
        level: o.level || [1,0.2,0.05],
        frequency: o.frequency || [0.016,0.05,0.2],
        expo: o.expo || 1,
    }

    this.isWater = o.water || false;

    this.isBorder = false;
    this.wantBorder = o.border || false;

    this.isBottom = false;
    this.wantBottom = o.bottom || false;

    this.colorBase = this.isWater ? { r:0, g:0.7, b:1 } : { r:1, g:0.7, b:0 };

    this.maxspeed = o.maxSpeed || 0.1;
    this.acc = o.acc == undefined ? 0.01 : o.acc;
    this.dec = o.dec == undefined ? 0.01 : o.dec;

    this.deep = o.deep == undefined ? 0 : o.deep;

    this.ease = new THREE.Vector2();

    // for perlin
    this.complexity = o.complexity == undefined ? 30 : o.complexity;
    this.complexity2 = o.complexity2 == undefined ? null : o.complexity2;

    this.local = new THREE.Vector3();
    if( o.local ) this.local.fromArray( o.local );

    this.pp = new THREE.Vector3();

    this.lng = this.sample[0] * this.sample[1];
    var sx = this.sample[0] - 1;
    var sz = this.sample[1] - 1;
    this.rx = sx / this.size[0];
    this.rz = sz / this.size[2];
    this.ratio = 1 / this.sample[0];
    this.ruvx =  1.0 / ( this.size[0] / this.uvx[0] );
    this.ruvy = - ( 1.0 / ( this.size[2] / this.uvx[1] ) );

    this.is64 = o.is64 || false;

    this.heightData = this.is64 ? new Float64Array( this.lng ) : new Float32Array( this.lng );
    this.height = [];

    this.isAbsolute = o.isAbsolute || false;
    this.isReverse = o.isReverse || false;
    if( this.isReverse ) this.getReverseID();

    this.colors = new Float32Array( this.lng * 3 );
    this.geometry = new THREE.PlaneBufferGeometry( this.size[0], this.size[2], this.sample[0] - 1, this.sample[1] - 1 );
    this.geometry.rotateX( -Math.PI90 );
    this.geometry.computeBoundingSphere();

    this.geometry.setAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );
    //this.geometry.setAttribute( 'uv2', this.geometry.attributes.uv );
    this.vertices = this.geometry.attributes.position.array;

    this.waterNormal = this.isWater ? view.texture({ url:'terrain/water_n.jpg', repeat:[3,3]}) : null;
    

    var materialData = { 
        
        name:'terrain', 
        vertexColors: THREE.VertexColors, 
        metalness: this.isWater ? 0.8 : 0.2, 
        roughness: this.isWater ? 0.2 : 0.6, 

        normalScale:o.normalScale || (this.isWater ? [0.25,0.25]:[-1,-1]),
     
        transparent: this.isWater ? true : false,
        opacity: this.isWater ? (o.opacity || 0.8) : 1,

        side: this.isWater ? 'Double' : 'Front',

    };


    if(!this.isWater){

        this.maps = o.maps || [ 'sand', 'grass', 'rock', 'sand_n', 'grass_n', 'rock_n' ];

        var txt = {}
        var name;
        for( var i in this.maps ){

            name = this.maps[i];
            txt[name] = view.texture({ url:'terrain/'+name+'.jpg', repeat:this.uvx});

        }

        materialData.map = txt[ this.maps[0] ];
        materialData.normalMap = txt[ this.maps[0] + '_n' ];

        this.isORM = false;
        this.isDIS = false;

        if( this.maps.length > 6 ){ 


            this.isORM = true;

            materialData.aoMapIntensity = o.ao || 1;
            materialData.metalness = 1;
            materialData.roughness = 1;
            materialData.roughnessMap = txt[ this.maps[0] + '_orm' ];
            materialData.aoMap = txt[ this.maps[0] + '_orm' ];

        }

        if( this.maps.length > 9 ){ 


            this.isDIS = true;

            materialData.displacementBias = 0;
            materialData.displacementScale = o.displacementScale || 1;
            materialData.displacementMap = txt[ this.maps[0] + '_d' ];

        }

        var self = this;

        materialData.onBeforeCompile = function ( shader ) {

            //console.log(shader)

            var uniforms = shader.uniforms;

            uniforms['map1'] = { value: txt[self.maps[1]] };
            uniforms['map2'] = { value: txt[self.maps[2]] };

            uniforms['normalMap1'] = { value: txt[self.maps[1]+'_n'] };
            uniforms['normalMap2'] = { value: txt[self.maps[2]+'_n'] };

            if( self.isORM ){
                uniforms['roughnessMap1'] = { value: txt[self.maps[1]+'_orm'] };
                uniforms['roughnessMap2'] = { value: txt[self.maps[2]+'_orm'] };
            }

            if( self.isDIS ){
                uniforms['displacementMap1'] = { value: txt[self.maps[1]+'_d'] };
                uniforms['displacementMap2'] = { value: txt[self.maps[2]+'_d'] };
            }

            shader.uniforms = uniforms;


            var vertex = shader.vertexShader;
            var fragment = shader.fragmentShader;

            var T = THREE.TerrainShader;

            fragment = fragment.replace( '#include <map_pars_fragment>', T.map_pars );
            fragment = fragment.replace( '#include <normalmap_pars_fragment>', T.normal_pars );

            fragment = fragment.replace( '#include <map_fragment>', T.map );
            fragment = fragment.replace( '#include <normal_fragment_maps>', T.normal );

            fragment = fragment.replace( '#include <color_fragment>', '' );

            if( self.isORM ){
                
                fragment = fragment.replace( '#include <roughnessmap_pars_fragment>', T.rough_pars );
                fragment = fragment.replace( '#include <metalnessmap_pars_fragment>', '' );
                fragment = fragment.replace( '#include <aomap_pars_fragment>', '' );

                
                fragment = fragment.replace( '#include <roughnessmap_fragment>', T.rough );
                fragment = fragment.replace( '#include <metalnessmap_fragment>', '' );
                fragment = fragment.replace( '#include <aomap_fragment>', T.ao );

            }

            if( self.isDIS ){

                vertex = vertex.replace( '#include <displacementmap_pars_vertex>', T.displacement_part );
                vertex = vertex.replace( '#include <displacementmap_vertex>', T.displacement );

            }

            
            shader.fragmentShader = fragment;
            shader.vertexShader = vertex;

            //return shader;
        }

    } else {

        materialData.normalMap = this.waterNormal;

    }

    //this.uniforms = uniforms;

    this.material = view.material( materialData );
    

    THREE.Mesh.call( this, this.geometry, this.material );

    if( this.wantBorder ) this.addBorder( o );
    if( this.wantBottom ) this.addBottom( o );

    this.update();

    this.name = o.name === undefined ? 'terrain' : o.name;
    if( o.pos ) this.position.fromArray( o.pos );


    this.castShadow = false;
    this.receiveShadow = true;

};

THREE.Terrain.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), {

    constructor: THREE.Terrain,

    addBottom: function ( o ){

    	var geometry = new THREE.PlaneBufferGeometry( this.size[0], this.size[2], 1, 1 );
        geometry.rotateX( Math.PI90 );

        this.bottomMesh = new THREE.Mesh( geometry, this.material );

        this.add( this.bottomMesh );

        this.isBottom = true;
    },

    addBorder: function ( o ){

    	this.borderMaterial = view.material({ 

    		vertexColors: THREE.VertexColors, 
    		metalness: this.isWater ? 0.8 : 0.4, 
       		roughness: this.isWater ? 0.2 : 0.6, 
       
            //envMap: view.getEnvMap(),
            //normalMap:this.wn,
            normalScale:this.isWater ?  [0.25,0.25]:[-1,-1],
            transparent:this.isWater ? true : false,
            opacity: this.isWater ? (o.opacity || 0.8) : 1,
    		//shadowSide : false

    	});

    	//view.getMat()[this.name+'border'] = this.borderMaterial;

        var front = new THREE.PlaneGeometry( this.size[0], 2, this.sample[0] - 1, 1 );
        var back = new THREE.PlaneGeometry( this.size[0], 2, this.sample[0] - 1, 1 );
        var left = new THREE.PlaneGeometry( this.size[2], 2, this.sample[1] - 1, 1 );
        var right = new THREE.PlaneGeometry( this.size[2], 2, this.sample[1] - 1, 1 );

        front.translate( 0,1, this.size[2]*0.5);
        back.rotateY( -Math.PI );
        back.translate( 0,1, -this.size[2]*0.5);
        left.rotateY( -Math.PI90 );
        left.translate( -this.size[0]*0.5,1, 0);
        right.rotateY( Math.PI90 );
        right.translate( this.size[0]*0.5,1, 0);

        var border = new THREE.Geometry();

        border.merge( front );
        border.merge( back );
        border.merge( left );
        border.merge( right );

        border.mergeVertices();

        this.borderGeometry = new THREE.BufferGeometry().fromGeometry( border );
        this.borderVertices = this.borderGeometry.attributes.position.array;
        this.lng2 = this.borderVertices.length / 3;
        this.list = new Array( this.lng2 )
        this.borderColors = new Float32Array( this.lng * 3 );
        this.borderGeometry.setAttribute( 'color', new THREE.BufferAttribute( this.borderColors, 3 ) );
        this.borderMesh = new THREE.Mesh( this.borderGeometry, this.borderMaterial );

        var j = this.lng2, n, i;
        while(j--){
            n = j*3;
            i = this.borderVertices[n+1] > 0 ? this.findPoint( this.borderVertices[n], this.borderVertices[n+2] ) : -1;
            this.list[j] = i;

        }

        this.add( this.borderMesh );
        this.isBorder = true;

    },

    dispose: function () {

        this.geometry.dispose();
        this.material.dispose();
        
    },

    easing: function ( wait ) {

        var key = user.key;

        if( !key[0] || !key[1] ) return;

        var r = view.getAzimuthal();

        if( key[7] ) this.maxspeed = 1.5;
        else this.maxspeed = 0.25;

        //acceleration
        this.ease.y += key[1] * this.acc; // up down
        this.ease.x += key[0] * this.acc; // left right
        //speed limite
        this.ease.x = this.ease.x > this.maxspeed ? this.maxspeed : this.ease.x;
        this.ease.x = this.ease.x < -this.maxspeed ? -this.maxspeed : this.ease.x;
        this.ease.y = this.ease.y > this.maxspeed ? this.maxspeed : this.ease.y;
        this.ease.y = this.ease.y < -this.maxspeed ? -this.maxspeed : this.ease.y;

        //break
        if (!key[1]) {
            if (this.ease.y > this.dec) this.ease.y -= this.dec;
            else if (this.ease.y < -this.dec) this.ease.y += this.dec;
            else this.ease.y = 0;
        }
        if (!key[0]) {
            if (this.ease.x > this.dec) this.ease.x -= this.dec;
            else if (this.ease.x < -this.dec) this.ease.x += this.dec;
            else this.ease.x = 0;
        }

        if ( !this.ease.x && !this.ease.y ) return;

        this.local.z += Math.sin(r) * this.ease.x + Math.cos(r) * this.ease.y;
        this.local.x += Math.cos(r) * this.ease.x - Math.sin(r) * this.ease.y;

        this.update( wait );

    },

    getHeight: function ( x, z ) {

        x *= this.rx;
        z *= this.rz; 
        x += this.sample[0]*0.5;
        z += this.sample[1]*0.5;
        x = Math.floor(x);
        z = Math.floor(z);
        var h = this.height[ this.findId( x, z ) ] || 1;
        return ( h * this.size[ 1 ] ) + this.position.y;

    },

    findId: function( x, z ){

        return x+(z*this.sample[1]);

    },

    findPoint: function( x, z ){

        var i = this.lng, n;
        while( i-- ){
            n = i * 3;
            if( this.vertices[ n ] === x && this.vertices[ n + 2 ] === z ) return i;
        }

        return -1;

    },

    getReverseID: function () {

        this.invId = [];

        var i = this.lng, n, x, z, zr, c, l=0;
        var sz = this.sample[1] - 1;

        while(i--){
            x = i % this.sample[0];
            z = Math.floor( i * this.ratio );
            zr = sz - z;
            this.invId[i] = this.findId( x, zr );
        }

    },

    update: function ( wait ) {


        if( this.isWater ){ 
            this.waterNormal.offset.x+=0.002;
            this.waterNormal.offset.y+=0.001;
        } else {
            this.material.map.offset.x = this.local.x * this.ruvx;
            this.material.map.offset.y = this.local.z * this.ruvy;
        }

        var v = this.pp;
        var cc = [1,1,1];
        var i = this.lng, n, x, z,  c, l=0, id, result;
        var oldz, oldh, ccY;

        while( i-- ){

            n = i * 3;
            x = i % this.sample[0];
            z = Math.floor( i * this.ratio );

            v.set( x + ( this.local.x*this.rx ), this.local.y, z + ( this.local.z*this.rz ) );



            c = Math.noise( v, this.data );

            //c = Math.quinticSCurve(c);
            //c = Math.cubicSCurve(c)
            //c = Math.linear(c,0.2, 1);
            //c = Math.clamp(c,0.2,1)

            c = Math.pow( c, this.data.expo );

            c = c>1 ? 1:c;
            c = c<0 ? 0:c;
            
            


            if( this.ttype === 'road' ) {

                if(oldz === z){
                    if(x===1 || x===2 || x===29 || x===30) c = oldh + 0.1;
                    else c = oldh;
                } else { 
                    oldz = z;
                    oldh = c;

                }

                //console.log(x)
            }

            this.height[ i ] = c;

            id = this.isReverse ? this.invId[i] : i;
            result = this.isAbsolute ? c : c * this.size[1];

            this.heightData[ id ] = result;

            ccY = (c * this.size[ 1 ]) + this.deep;

            //this.vertices[ n + 1 ] = 

            

            this.vertices[ n + 1 ] = ccY;

            if( this.isWater ){

                cc = [ c * this.colorBase.r, c * this.colorBase.g, c * this.colorBase.b ];

            } else {

                cc = [ c, 0, 0];

            }

            this.colors[ n ] = cc[0];
            this.colors[ n + 1 ] = cc[1];
            this.colors[ n + 2 ] = cc[2];

            //oldx = x;
            

        }

        /*if( this.ttype === 'road' ) {
            i = this.lng
                console.log(z)
        }*/

        if( this.isBorder ){

            var j = this.lng2, h;
            while(j--){
                n = j*3;
                if(this.list[j]!==-1){
                    h = this.height[ this.list[j] ];
                    this.borderVertices[n+1] = (h * this.size[1]) + this.deep;//this.data.height;
                    var ee = (0.5 + h+0.5);
                    ee = ee > 1 ? 1 : ee;
                    ee = ee < 0.5 ? 0.5 : ee;
                    this.borderColors[n] = h * this.colorBase.r//ee;
                    this.borderColors[n+1] = h * this.colorBase.g//ee*0.5;
                    this.borderColors[n+2] = h * this.colorBase.b//ee*0.3;

                } else{
                    this.borderColors[n] = this.colorBase.r//0.5;
                    this.borderColors[n+1] = this.colorBase.g//0.25;
                    this.borderColors[n+2] = this.colorBase.b//0.15;
                }
            }

        }

        this.physicsUpdate( this.name, this.heightData );

        this.needsUpdate = true;

        if( wait === undefined ) this.updateGeometry();

    },

    updateGeometry: function () {

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.computeVertexNormals();

        if(this.isBorder){
        	this.borderGeometry.attributes.position.needsUpdate = true;
            this.borderGeometry.attributes.color.needsUpdate = true;
        }

    }

});

// SHADERS

THREE.TerrainShader = {
    
    rough_pars: [
        '#ifdef USE_ROUGHNESSMAP',
        '    uniform sampler2D roughnessMap;',
        '    uniform sampler2D roughnessMap1;',
        '    uniform sampler2D roughnessMap2;',
        '    uniform float aoMapIntensity;',
        '#endif',
    ].join('\n'),

    rough: [
        'float roughnessFactor = roughness;',
        'float metalnessFactor = metalness;',
        '#ifdef USE_ROUGHNESSMAP',

            'float slopeR = vColor.r;',
            'vec4 baseColorR = vec4(0.0);',

            'vec4 sandR = texture2D( roughnessMap, vUv );',
            'vec4 grassR = texture2D( roughnessMap1, vUv );',
            'vec4 rockR = texture2D( roughnessMap2, vUv );',

            'if (slopeR < .5) baseColorR = grassR;',
            'if (slopeR > .8) baseColorR = rockR;',
            'if ((slopeR<.8) && (slopeR >= .5)) baseColorR = mix( grassR , rockR, (slopeR - .5) * (1. / (.8 - .5)));',
            'if (slopeR < .2) baseColorR = mix( sandR, grassR, slopeR * (1.0/0.2) );',
            // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
            'float ambientOcclusion =( baseColorR.r - 1.0 ) * aoMapIntensity + 1.0;',
            'roughnessFactor *= baseColorR.g;',
            'metalnessFactor *= baseColorR.b;',
        '#endif',
    ].join('\n'),

    // ao

    ao: [

        'reflectedLight.indirectDiffuse *= ambientOcclusion;',

        '#if defined( USE_ENVMAP ) && defined( STANDARD )',
        '    float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );',
        '    reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );',
        '#endif',

    ].join('\n'),

    // map

    map_pars: [
        '#ifdef USE_MAP',
        '    uniform sampler2D map;',
        '    uniform sampler2D map1;',
        '    uniform sampler2D map2;',
        '#endif',
    ].join('\n'),

    map: [
        '#ifdef USE_MAP',
            'float slope = vColor.r;',
            'vec4 baseColor = vec4(1.0);',

            'vec4 sand = texture2D( map, vUv );',
            'vec4 grass = texture2D( map1, vUv );',
            'vec4 rock = texture2D( map2, vUv );',

            'if (slope < .5) baseColor = grass;',
            'if (slope > .8) baseColor = rock;',
            'if ((slope<.8) && (slope >= .5)) baseColor = mix( grass , rock, (slope - .5) * (1. / (.8 - .5)));',
            'if (slope < .2) baseColor = mix( sand, grass, slope * (1.0/0.2) );',
            'diffuseColor *= mapTexelToLinear( baseColor );',
        '#endif',
    ].join('\n'),

    // displace

    displacement_part: [
        '#ifdef USE_DISPLACEMENTMAP',
        '    uniform sampler2D displacementMap;',
        '    uniform sampler2D displacementMap1;',
        '    uniform sampler2D displacementMap2;',
        '    uniform float displacementScale;',
        '    uniform float displacementBias;',
        '#endif',
    ].join('\n'),

    displacement: [
        '#ifdef USE_MAP',

            'float slope = vColor.r;',
            'vec4 baseColor = vec4(1.0);',

            'vec4 sand = texture2D( displacementMap, vUv );',
            'vec4 grass = texture2D( displacementMap1, vUv );',
            'vec4 rock = texture2D( displacementMap2, vUv );',

            'if (slope < .5) baseColor = grass;',
            'if (slope > .8) baseColor = rock;',
            'if ((slope<.8) && (slope >= .5)) baseColor = mix( grass , rock, (slope - .5) * (1. / (.8 - .5)));',
            'if (slope < .2) baseColor = mix( sand, grass, slope * (1.0/0.2) );',
            'transformed += normalize( objectNormal ) * ( baseColor.x * displacementScale + displacementBias );',
        '#endif',
    ].join('\n'),

    // normal

    normal_pars: [

        '#ifdef USE_NORMALMAP',

        'uniform sampler2D normalMap;',
        'uniform sampler2D normalMap1;',
        'uniform sampler2D normalMap2;',

        'uniform vec2 normalScale;',

        // Per-Pixel Tangent Space Normal Mapping
        // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html

        'vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 n_color ) {',

            // Workaround for Adreno 3XX dFd*( vec3 ) bug. See #9988

            'vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );',
            'vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );',
            'vec2 st0 = dFdx( vUv.st );',
            'vec2 st1 = dFdy( vUv.st );',

            'vec3 S = normalize( q0 * st1.t - q1 * st0.t );',
            'vec3 T = normalize( -q0 * st1.s + q1 * st0.s );',
            'vec3 N = normalize( surf_norm );',

            'vec3 mapN = n_color.xyz * 2.0 - 1.0;',
            'mapN.xy = normalScale * mapN.xy;',
            'mat3 tsn = mat3( S, T, N );',
            'return normalize( tsn * mapN );',

        '}',

        '#endif',
    ].join('\n'),

    normal : [
        //'#ifdef FLAT_SHADED',
        //'vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );',
        //'vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );',
        //'vec3 normal = normalize( cross( fdx, fdy ) );',
        //'#else',
        //'    vec3 normal = normalize( vNormal );',
        //'#endif',
        '#ifdef USE_NORMALMAP',
        
            'vec4 extraNormal = vec4(1.0);',
            'vec4 sandN =  texture2D( normalMap, vUv );',
            'vec4 grassN = texture2D( normalMap1, vUv );',
            'vec4 rockN = texture2D( normalMap2, vUv );',
            'float slopeN = vColor.r;',

            'if (slopeN < .5) extraNormal = grassN;',
            'if (slopeN > .8) extraNormal = rockN;',
            'if ((slopeN<.8) && (slopeN >= .5)) extraNormal = mix( grassN , rockN, (slopeN - .5) * (1. / (.8 - .5)));',
            'if (slopeN < .2) extraNormal = mix( sandN, grassN, slopeN * (1.0/0.2) );',
            'normal = perturbNormal2Arb( -vViewPosition.xyz, normal.xyz, extraNormal.xyz );',
    
        '#endif',
    ].join('\n'),
    
}