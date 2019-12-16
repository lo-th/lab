/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*/

var materials = ( function () {

'use strict';

var data = new Map();
var pathTexture = './assets/textures/';
var shaderShadow = null;
var settings = {

    shadowSide:THREE.BackSide, //null,
    envPower:1.2,//1.2,
    mode:0,

};

var id = 0;



materials = {

    getMat: function () {

        var mat = {};
        data.forEach( function ( m, key ) { mat[key] = m; } );
        return mat;

    },

    get: function ( name ){ 

        return data.has( name ) ? data.get( name ) : null;

    },

   /* clearOne: function ( name ){

        var ref = materials.get( name );
        if( ref !== null ) {

        }

    },*/

    clone: function ( name, newName ){

        var ref = materials.get( name );
        if( ref !== null ) {

            var m = ref.clone();
            m.name = newName;
            data.set( newName, m );
            return m;

        } else {
            console.log( 'base material not existe !!' );
        }

    },

    getList: function () {

        //var list = [''];
        //for( var name in data ) list.push( name );
        return data.entries();

    },

    reset: function (){

        data.forEach( function ( m, key ) { if( m.isTmp ){ data.delete( key ); m.dispose(); } } );
        textures.reset();

        //console.log( 'material reset' ); 

    },

    clear: function (){

        id = 0;

        textures.clear();

        data.forEach( function ( m, key ) { m.dispose(); } );
        data.clear(); 

        //for( var name in data ) data[name].dispose(); 
    },

    

    updateEnvmap: function (){ 

        var env = view.getEnvmap();

        data.forEach( function ( m, key ) { 

                if( m.envMap === undefined ) return; 
                if( m.wireframe || m.noEnv) m.envMap = null;
                else {
                    m.envMap = env;
                    m.needsUpdate = true;
                }

            } 

        );
        
    },

    // disable shadow for work only in shadow pass
    // launch on start before create any material

    /*disableShadow: function ( ) {

        shaderShadow = THREE.ShaderChunk.shadowmap_pars_fragment;
        shaderShadow = shaderShadow.replace( 'float shadow = 1.0;', ['float shadow = 1.0;','if( renderMode != 3 ) return shadow;',  ''].join( "\n" ) )

    },*/

    setMode:function( n ){

        // 0 default 
        // 1 depth
        // 2 normal

        settings.mode = n;
        data.forEach( function ( value, key ) { value.uniforms.renderMode.value = n; } );

    },


    make: function ( o ){

        /*if( shaderShadow === null ){

            shaderShadow = THREE.ShaderChunk.lights_fragment_begin;
            //shaderShadow = shaderShadow.replace( 'float shadow = 1.0;', ['float shadow = 1.0;','if( renderMode != 3 ) return shadow;',  ''].join( "\n" ) );

           // shaderShadow = shaderShadow.replace( 'pointLight.shadowCameraFar )', 'pointLight.shadowCameraFar )*extraShadow' );
           // shaderShadow = shaderShadow.replace( 'vSpotShadowCoord[ i ] )', 'vSpotShadowCoord[ i ] )*extraShadow' );

           shaderShadow = shaderShadow.replace( 'geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );',
            ['geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );', 'float extraShadowColor = 1.0;' ].join( "\n" ) );
            shaderShadow = shaderShadow.replace( 
                '#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )', 
                [
               //'',
                '#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )',
                ' ',
                  'extraShadowColor = all( bvec3( directionalLight.shadow, directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;',
                  //'directLight.color *= extraShadowColor',
                  ].join( "\n" ) );

        }*/

        var name;

        if( o.name !== undefined ) name = o.name;
        else{ 
            name = 'mat' + id++;
            o.name = name;
        }
        
        // avoid duplication
        if( data.has( name ) ) return data.get( name );

        // dissable environement
        var noEnv = false;
        if(o.noEnv){ 
            noEnv = true;
            delete( o.noEnv );
        }

        // extrra shader 
        var extraCompile = null;
        if( o.extraCompile ){
        	extraCompile = o.extraCompile;
        	delete( o.extraCompile );
        }
        

        // define material type
        var type = o.type !== undefined ? o.type : 'Standard';
        if( o.sheen !== undefined || o.clearcoat !== undefined || o.reflectivity !== undefined || o.transparency !== undefined ) type = 'Physical';
        delete( o.type );

        if( type !== 'Standard' ){
            delete( o.metalness ); 
            delete( o.roughness );
        }

        if( type !== 'Phong' ){
            delete( o.shininess ); 
            delete( o.specular );
        }

        
        /*if( type === 'Basic' ){
        	type = 'Lambert';
        	if( o.color ) o.emissive = o.color;
        	if( o.map ) o.emissiveMap = o.map;
        	delete( o.map );

        	o.lights = false;

        }*/

        // clear on reset
        var isTmp = o.isTmp !== undefined ? o.isTmp : true;
        delete( o.isTmp );  

        // search best setting
        // if null SIDE    |  SHADOWSIDE
        // THREE.FrontSide    THREE.BackSide 
        // THREE.BackSide     THREE.FrontSide
        // THREE.DoubleSide   THREE.DoubleSide
        o.shadowSide = o.shadowSide !== undefined || null;

        // parametre refine 

        for( var n in o ){

            // is texture
            if( n.substring( n.length - 3 ) === 'Map' || n === 'map' ){ 

                if( o[n].isTexture ){

                    textures.add( o[n].name, o[n] );

                    // todo add to textures

                } else {

                    var param = o[n];
                    param.isTmp = isTmp;
                    o[n] = textures.make( param );

                }
            }

            // Front, Back, Double
            if( n === 'side' ){
                if( typeof o[n]  === 'string' || o[n] instanceof String ) o[n] = THREE[ o[n] + 'Side' ];
            }

            // Never, Always, Less, LessEqual, Greater, GreaterEqual, NotEqual
            if( n === 'depth' ) o[n] = THREE[ o[n] + 'Depth' ];

            // isVector
            if( n === 'normalScale' || n === 'clearcoatNormalScale' ){ 
                if( !o[n].isVector2 ) o[n] = new THREE.Vector2().fromArray( o[n] );
            }


        }

        // create three material
        var mat = data[name] ? data[name] : new THREE[ 'Mesh' + type + 'Material' ]( o );

        //mat.lights = withLight;
        
        // auto envmap
        

        if(noEnv){
            mat.noEnv = true;
        }else {
            if( mat.envMap !== undefined ) mat.envMap = view.getEnvmap();
        }
        
        // clear on reset
        mat.isTmp = isTmp;



        // CUSTOM SHADER
        materials.customize( mat, o, extraCompile );


        // add to data
        data.set( name, mat );

        return mat;

    },


    customize: function ( mat, o, extraCompile ) {

    	 mat.onBeforeCompile = function ( shader ) {

    	 	

    	 	var uniforms = shader.uniforms;

    	 	uniforms['renderMode'] = { value: settings.mode };
    	 	uniforms['depthPacking'] = { value: 1 };
            //uniforms['extraShadowColor'] = { value: 1 };
            uniforms['extraShadow'] = { value: 0.3 };
            

            shader.uniforms = uniforms;

            this.uniforms = shader.uniforms;



            var fragment = shader.fragmentShader;

            //fragment = fragment.replace( '#include <shadowmap_pars_fragment>', ['#include <shadowmap_pars_fragment>', '#include <shadowmask_pars_fragment>'].join("\n")  );

            fragment = fragment.replace( 'uniform vec3 diffuse;', ['uniform vec3 diffuse;', 'uniform int renderMode;', 'uniform int depthPacking;', 'uniform float extraShadow;'].join("\n") );

            // depth pass
            fragment = fragment.replace('#include <alphatest_fragment>', materials.directDepth );

            // normal pass
            if( mat.type === 'MeshBasicMaterial' ){
            	//fragment = fragment.replace('varying vec3 vNormal;', '' );
            	fragment = fragment.replace('#include <specularmap_pars_fragment>', ['#include <specularmap_pars_fragment>', '#include <packing>', '#include <normalmap_pars_fragment>'].join("\n") );
            	//fragment = fragment.replace('#include <specularmap_fragment>', ['#include <specularmap_fragment>', '#include <normal_fragment_begin>', '#include <normal_fragment_maps>'].join("\n") );

            }
            
            if( mat.type !=='MeshBasicMaterial') fragment = fragment.replace('#include <normal_fragment_maps>', materials.directNormal );


            if( mat.type === 'MeshStandardMaterial' ){

                fragment = fragment.replace( '#include <lights_fragment_begin>', materials.lightBegin  );

                //vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;


                //fragment = fragment.replace('varying vec3 vNormal;', '' );
                fragment = fragment.replace( 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );', [

                    'float sd = shadowFull;',
                    '#ifdef USE_AOMAP',
                    '    sd *= ambientOcclusion;',
                    '#if defined( USE_ENVMAP ) && defined( STANDARD )',
                        //'float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );',
                        'sd *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );',
                    '#endif',
                    '#endif',

                    //'float dotNVX = saturate( dot( geometry.normal, geometry.viewDir ) );',
                    //'sd *= dotNVX;',


                    //'float sd = getShadowMask();',
                    //'sd = pow( abs(sd), 0.99);',
                    //'sd = clamp(sd*3.0, 0.0, 1.0);',
                    //'gl_FragColor = vec4( vec3(0.0), opacity * ( 1.0 - sd) );',
                    'vec3 shadowMaping = mix( vec3(0.0), outgoingLight, sd );',
                    'outgoingLight = mix( outgoingLight, shadowMaping, extraShadow );',

                    /*'float diff = (reflectedLight.directDiffuse.r + reflectedLight.directDiffuse.g + reflectedLight.directDiffuse.b)/3.0;',//metal
                    'float spec = (reflectedLight.directSpecular.r + reflectedLight.directSpecular.g + reflectedLight.directSpecular.b)/3.0;',// metal & rough
                    //'vec3 tmpS = reflectedLight.directSpecular;',
                    'vec3 tmpS = (reflectedLight.directDiffuse + reflectedLight.directSpecular);',
                    'vec3 tmpG = reflectedLight.indirectDiffuse + reflectedLight.indirectSpecular;',
                    
                    'float sg = (tmpG.r + tmpG.g + tmpG.b)/3.0;',

                    //'spec /= ( 1.0 - max( roughnessFactor, 0.9 ) );',
                    'float sd = diff + spec;',
                    //'sd /= ( 1.0 - max( metalnessFactor, 0.9 ) );',
                    //',
                    //'sd /= ( 1.0 - metalnessFactor );',
                    
                    //*/
                    //'sd *= 10.0;', 
                    //'gl_FragColor = vec4( vec3(sd), diffuseColor.a );',
                    'if( renderMode == 3 ) gl_FragColor = vec4( vec3(sd), diffuseColor.a );',
                    'else gl_FragColor = vec4( outgoingLight, diffuseColor.a );'
                ].join("\n") );
                //fragment = fragment.replace('#include <specularmap_fragment>', ['#include <specularmap_fragment>', '#include <normal_fragment_begin>', '#include <normal_fragment_maps>'].join("\n") );

            }


            // remplace end of main
            //fragment = fragment.replace(/.$/, materials.shaderEnd );

            shader.fragmentShader = fragment;


            if( extraCompile !== null ) shader = extraCompile( shader );

        }

        //return mat;


    	
    },

    /*customize_older: function ( mat, o ) {

        mat.onBeforeCompile = function ( shader ) {

            shader.uniforms['renderMode'] = { value: 0 };
            shader.uniforms['extraShadow'] = { value: null };

            shader.uniforms['velvet'] = { value: new THREE.Color( Number( o.velvet || '0x000000' ) ) };

            //console.log(view.getDepthPacking() ? 1 : 0)

            shader.uniforms['depthPacking'] = { value: view.getDepthPacking() ? 1 : 0 };

            if( mat.subdermal ){ 
                shader.uniforms['subdermal'] = { value: mat.subdermal };
            }


            var fragment = shader.fragmentShader;

            fragment = fragment.replace( '#include <shadowmap_pars_fragment>', shaderShadow );

            fragment = fragment.replace( 'varying vec3 vViewPosition;', ['varying vec3 vViewPosition;', 'uniform int renderMode;', 'uniform int depthPacking;', 'uniform sampler2D extraShadow;', 'uniform sampler2D subdermal;' , 'uniform vec3 velvet;'].join("\n") );

            if( o.isSpec ){ 
                fragment = fragment.replace( '#include <roughnessmap_fragment>', ['float roughnessFactor = roughness;', '#ifdef USE_METALNESSMAP', 'vec4 texelRoughness = vec4(1.0) - texture2D( metalnessMap, vUv );', 'roughnessFactor *= texelRoughness.g;', '#endif' ,''].join("\n") );
                fragment = fragment.replace( '#include <metalnessmap_fragment>', ['float metalnessFactor = metalness;', '#ifdef USE_METALNESSMAP', 'vec4 texelMetalness = texture2D( metalnessMap, vUv );', 'metalnessFactor *= texelMetalness.b;', '#endif' ,''].join("\n") );
            }

            if( o.revers ) fragment = fragment.replace( '#include <normal_fragment_maps>', materials.normalFragRevers );

            //if( o.alpha ) fragment = fragment.replace( '#include <dithering_fragment>', materials.shaderEnd + ['float RR = diffuseColor.a;', 'if ( RR < 0.5 ) { discard; }', ''].join("\n") );
            //else fragment = fragment.replace( '#include <dithering_fragment>', materials.shaderEnd );


            if( o.subdermal ){
                fragment = fragment.replace( '#include <map_fragment>', materials.mapSkinFrag );
            }

            fragment = fragment.replace( '#include <lights_physical_fragment>', materials.lightStart );
            fragment = fragment.replace( '#include <lights_fragment_end>', materials.lightEnd );



            //fragment = fragment.replace( '#include <encodings_fragment>', '' );
            //fragment = fragment.replace( '#include <tonemapping_fragment>', '' );

            shader.fragmentShader = fragment;

            this.uniforms = shader.uniforms;

        }

        return mat;

    },*/

    // --------------------------
    //
    //  SHADER
    //
    // --------------------------

    directDepth: [
    '#include <alphatest_fragment>',

    'if( renderMode == 1 ){',
        'gl_FragColor = depthPacking == 1 ? packDepthToRGBA( gl_FragCoord.z ) : vec4( vec3( 1.0 - gl_FragCoord.z ), opacity );',
        'return;',
    '}',
    ].join("\n"),


    directNormal: [
    '#include <normal_fragment_maps>',

    'if( renderMode == 2 ){',
        'gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',
        'return;',
    '}',

    ].join("\n"),



    shaderEnd: [
    //'    if( renderMode == 1 ) gl_FragColor = depthPacking == 1 ? packDepthToRGBA( gl_FragCoord.z ) : vec4( vec3( 1.0 - gl_FragCoord.z ), opacity );',// depth render
    //'    if( renderMode == 1 ) gl_FragColor = packDepthToRGBA( gl_FragCoord.z );',// depth render
    '    if( renderMode == 2 ) gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',// normal render

    '}',
    ].join("\n"),









    mapSkinFrag: [
        '#ifdef USE_MAP',

        'vec4 underColor = texture2D( subdermal, vUv );',
        'vec4 texelColor = texture2D( map, vUv );',

        'float mx = ((underColor.r + underColor.g)-underColor.b)*0.5;',

        'texelColor.xyz = mix( texelColor.xyz,vec3(0.0,underColor.g,underColor.b),  underColor.b*0.2 );',

        'texelColor = mapTexelToLinear( texelColor );',
        'diffuseColor *= texelColor;',

        '#endif',
        ''
    ].join("\n"),


    normalFragRevers: [
        '#ifdef USE_NORMALMAP',
            '#ifdef OBJECTSPACE_NORMALMAP',
                'normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;',
                '#ifdef FLIP_SIDED',
                '   normal = - normal;',
                '#endif',
                '#ifdef DOUBLE_SIDED',
                '   normal = normal * ( float( gl_FrontFacing ) * 2.0 - 1.0 );',
                '#endif',
                'normal = normalize( normalMatrix * normal );',
            '#else', // tangent-space normal map
                //'normal = perturbNormal2Arb( -vViewPosition, normal );',
                'normal = perturbNormal2Arb( vViewPosition, normal );',
            '#endif',
            '#elif defined( USE_BUMPMAP )',
            'normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );',
            '#endif',
        '',
    ].join("\n"),


    /*extraFragColor: [

    'vec3 maskingColor = texture2D( emissiveMap, vUv ).rgb;',
    'vec3 colorPlus = vec3(0.0);',
    //'vec3 colorMask = vec3(0.0);',
    'colorPlus = mix( colorPlus, extraColor1, vec3( maskingColor.r ) );',
    'colorPlus = mix( colorPlus, extraColor2, vec3( maskingColor.g ) );',
    'colorPlus = mix( colorPlus, extraColor3, vec3( maskingColor.b ) );',
    'vec3 colorMask = vec3( maskingColor.r ) + vec3( maskingColor.g ) + vec3( maskingColor.b );',
    'colorMask = clamp(colorMask, 0.0, 1.0);',


    'diffuseColor.rgb *= mix( diffuseColor.rgb, colorPlus, colorMask );',
    '',
    ].join("\n"),*/

    

    lightStart: [
    'PhysicalMaterial material;',

    'if( renderMode == 3 ){',
            'diffuseColor = vec4(1.0, 1.0, 1.0, diffuseColor.a);',
            //'metalnessFactor = 0.0;',
            //'roughnessFactor = 0.0;',
    '}',

    'material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );',
    'material.specularRoughness = clamp( roughnessFactor, 0.04, 1.0 );',

    'vec3 ccc = diffuseColor.rgb;',
    'if( velvet.r > 0.7 ) ccc = diffuseColor.r < 0.45 ? diffuseColor.rgb : velvet;',

    '#ifdef REFLECTIVITY',
        'material.specularColor = mix( vec3( MAXIMUM_SPECULAR_COEFFICIENT * pow2( reflectivity ) ), ccc, metalnessFactor );',
    '#else',
        'material.specularColor = mix( vec3( DEFAULT_SPECULAR_COEFFICIENT ), ccc, metalnessFactor );',
    '#endif',
    '#ifdef CLEARCOAT',
        'material.clearcoat = saturate( clearcoat );', // Burley clearcoat model
        'material.clearcoatRoughness = clamp( clearcoatRoughness, 0.04, 1.0 );',
    '#endif',
    '#ifdef USE_SHEEN',
        'if( velvet.r > 0.7 ) material.sheenColor = diffuseColor.r > 0.25 ? sheen : vec3(0.2,0.19,0.24);',
        'else material.sheenColor =sheen;',
    '#endif',
    '',
    ].join("\n"),

    lightEnd: [
    '#if defined( RE_IndirectDiffuse )',
        //'if( renderMode == 3 ) irradiance = vec3(0.0);',
        'irradiance = vec3(0.0);',
        'RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );',
    '#endif',
    '#if defined( RE_IndirectSpecular )',
        //'if( renderMode == 3 ) radiance = vec3(0.0);',
        'radiance = vec3(0.0);',
        'RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );',
    '#endif',
    '',
    ].join("\n"),


    lightBegin: [

    'float shadowTmp = 1.0;',
    'float shadowFull = 1.0;',

    'GeometricContext geometry;',
    'geometry.position = - vViewPosition;',
    'geometry.normal = normal;',
    'geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );',
    
    '#ifdef CLEARCOAT',
    '   geometry.clearcoatNormal = clearcoatNormal;',
    '#endif',

    'IncidentLight directLight;',
    '#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )',
    '   PointLight pointLight;',
    '   #pragma unroll_loop',
    '   for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {',
    '       pointLight = pointLights[ i ];',
    '       getPointDirectLightIrradiance( pointLight, geometry, directLight );',
    '       #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )',
    '       shadowTmp = all( bvec3( pointLight.shadow, directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;',
    '       directLight.color *= shadowTmp',
    '       shadowFull *= shadowTmp;',
    '       #endif',
    '       RE_Direct( directLight, geometry, material, reflectedLight );',
    '   }',
    '#endif',

    '#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )',
    '   SpotLight spotLight;',
    '   #pragma unroll_loop',
    '   for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {',
    '       spotLight = spotLights[ i ];',
    '       getSpotDirectLightIrradiance( spotLight, geometry, directLight );',
    '       #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )',
    '       shadowTmp = all( bvec3( spotLight.shadow, directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;',
    '       directLight.color *= shadowTmp',
    '       shadowFull *= shadowTmp;',
    '       #endif',
    '       RE_Direct( directLight, geometry, material, reflectedLight );',
    '   }',
    '#endif',

    '#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )',
    '   DirectionalLight directionalLight;',
    '   #pragma unroll_loop',
    '   for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {',
    '       directionalLight = directionalLights[ i ];',
    '       getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );',
    '       #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )',
    '       shadowTmp = all( bvec3( directionalLight.shadow, directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;',
    '       directLight.color *= shadowTmp;',
    '       shadowFull *= shadowTmp;',
    '       #endif',
    '       RE_Direct( directLight, geometry, material, reflectedLight );',
    '   }',
    '#endif',

    '#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )',
    '   RectAreaLight rectAreaLight;',
    '   #pragma unroll_loop',
    '   for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {',
    '       rectAreaLight = rectAreaLights[ i ];',
    '       RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );',
    '   }',
    '#endif',

    '#if defined( RE_IndirectDiffuse )',
    '   vec3 iblIrradiance = vec3( 0.0 );',
    '   vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );',
    '   irradiance += getLightProbeIrradiance( lightProbe, geometry );',
    '   #if ( NUM_HEMI_LIGHTS > 0 )',
    '       #pragma unroll_loop',
    '       for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {',
    '           irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );',
    '       }',
    '   #endif',

    '#endif',
    '#if defined( RE_IndirectSpecular )',
    '   vec3 radiance = vec3( 0.0 );',
    '   vec3 clearcoatRadiance = vec3( 0.0 );',
    '#endif',
    '',
    ].join("\n")


}


return materials;

})();