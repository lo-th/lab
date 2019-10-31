/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*/

var materials = ( function () {

'use strict';

var data = {};
var pathTexture = './assets/textures/';
var shaderShadow = null;
var settings = {

    shadowSide:THREE.BackSide, //null,
    envPower:1.2,//1.2,

};

var current = '';


materials = {

    get: function ( name ){ 

        return data[name] || null;

    },

    clone: function ( name, newName ){

        var ref = materials.get( name );
        if( ref!== null ){

            data[newName] = ref.clone();
            return data[newName];

        } else {
            console.log( 'base material not existe !!' );
        }

    },

    getList: function () {

        var list = [''];
        for( var name in data ) list.push( name );
        return list;

    },

    clear: function (){

        for( var name in data ) data[name].dispose(); 

    },

    setMode:function( n ){

        // 0 default 
        // 1 depth
        // 2 normal

        for( var name in data ){
             if( data[name].uniforms ) data[name].uniforms.renderMode.value = n;
        }

    },

    updateEnvmap: function (){ 

        var env = view.getEnvmap();

        for( var name in data ){

            if( data[name].envMap !== undefined ){ 
                
                data[name].envMap = env;
                data[name].needsUpdate = true;

            }

        }
        
    },

    select: function ( name ) {

        current = name;

    },

    make: function ( param, special ){

        // disable shadow for work only in shadow pass
        
        if( shaderShadow === null ){

            shaderShadow = THREE.ShaderChunk.shadowmap_pars_fragment;
            shaderShadow = shaderShadow.replace( 'float shadow = 1.0;', ['float shadow = 1.0;','if( renderMode != 3 ) return shadow;',  ''].join( "\n" ) );

        }
        
        special = special || false;
        var name = param.matname !== undefined ? param.matname : param.name;

        var isSpec = false;

        // avoid duplication
        if( data[name] ) return data[name];

        

        var type = param.matType !== undefined ? param.matType : 'Standard';//

        if( param.sheen!== undefined || param.clearcoat!== undefined || param.reflectivity!== undefined || param.transparency!== undefined ) type = 'Physical';

        var mat = data[name] ? data[name] : new THREE[ 'Mesh' + type + 'Material' ]();

        mat.name = name;

        mat.envMapIntensity = settings.envPower;

        //if( param.color ){  mat.color = param.color; }
        if( param.color ){
            if( param.color.constructor === String ) param.color =  Number(param.color);
            mat.color = new THREE.Color( param.color );
        }
        

        if( param.depthTest !== undefined ) mat.depthTest = param.depthTest;
        if( param.depthWrite !== undefined ) mat.depthWrite = param.depthWrite;

        // transparency
        if( param.transparent ) mat.transparent = param.transparent;
        if( param.transparency ) mat.transparent = param.transparency;
        if( param.premultipliedAlpha ) mat.premultipliedAlpha = param.premultipliedAlpha;
        if( param.opacity !== undefined ) mat.opacity = param.opacity;
        if( param.alphaTest !== undefined ) mat.alphaTest = param.alphaTest;
        if( param.alphaMap ) mat.alphaMap = view.makeTexture( name+'_a', pathTexture + param.alphaMap, name === 'head_Model' ? true : false );



        if( param.side ){ 
            switch(param.side){
                case 'front': mat.side = THREE.FrontSide; break;
                case 'back': mat.side = THREE.BackSide; break;
                case 'double': mat.side = THREE.DoubleSide; break;
            }
        }

        if( param.depthFunc ){ 
            switch(param.depthFunc){
                case 'never': mat.depthFunc = THREE.NeverDepth; break;
                case 'alway':mat.depthFunc = THREE.AlwaysDepth; break;
                case 'less':mat.depthFunc = THREE.LessDepth; break;
                case 'lessEqual': mat.depthFunc = THREE.LessEqualDepth; break;
                case 'greaterEqual':mat.depthFunc = THREE.GreaterEqualDepth; break;
                case 'greater':mat.depthFunc = THREE.GreaterDepth; break;
                case 'notEqual':mat.depthFunc = THREE.NotEqualDepth; break;
            }
        }

        if( param.colorWrite !== undefined ){  mat.colorWrite = param.colorWrite; }

        

         
        /*if( param.alphaMap && special){  
            mat.alphaMap = param.alphaMap; 
            mat.transparent = true;
        }*/
        //if( param.transparent ){  mat.opasity = param.opasity; }
        if( param.map ){
            mat.map = special ? param.map : view.makeTexture( name+'_d', pathTexture + param.map, false ); 
        }

        // apply skin color
        ///if( param.skinColor ){  mat.color = skinColor; }

        //if( param.alphaMap && param.alpha ) mat.alphaMap = view.makeTexture( name+'_a', pathTexture + param.alphaMap, name==='head_Model'? true : false );
        if( param.normalMap ) mat.normalMap = view.makeTexture( name+'_n', pathTexture + param.normalMap, false );

        if( param.emissiveMap ) mat.emissiveMap = view.makeTexture( name+'_e', pathTexture + param.emissiveMap, false );
        if( param.emissive ) mat.emissive = new THREE.Color( Number(param.emissive) );

        // extra setting to test ?
        if( param.reflectivity ) mat.reflectivity = param.reflectivity;// def 0.5
        if( param.sheen ) mat.sheen = new THREE.Color( Number(param.sheen) );// def null

        if( param.clearcoat !== undefined  ) mat.clearcoat = param.clearcoat;// def 0.0
        if( param.clearcoatRoughness !== undefined  ) mat.clearcoatRoughness = param.clearcoatRoughness;// def 0.0
        if( param.clearcoatNormalMap ) mat.clearcoatNormalMap = view.makeTexture( name + '_cc', pathTexture + param.clearcoatNormalMap, false );
        if( param.clearcoatNormalScale ) mat.clearcoatNormalScale.set( param.clearcoatNormalScale, param.clearcoatNormalScale );

        if( param.aoMap ){ 
            mat.aoMap = view.makeTexture( name+'_ao', pathTexture + param.aoMap, false );
            mat.aoMapIntensity = 1;
        }

        if( param.normalScale ) mat.normalScale.set( param.normalScale, param.normalScale );
        //else mat.normalScale.set( settings.normal, settings.normal );

        if( param.bumpMap ) mat.bumpMap = view.makeTexture( name+'_b', pathTexture + param.bumpMap, false );
        if( param.bumpScale )  mat.bumpScale = param.bumpScale;
        

        //mat.shadowSide = settings.shadowSide;//;

        //if( param.roughness || param.metalness ) specialMat.push( name );

        if( param.roughness !== undefined ) mat.roughness = param.roughness;
        if( param.metalness !== undefined ) mat.metalness = param.metalness;

        

        if( param.roughnessMap ) mat.roughnessMap = view.makeTexture( name+'_r', pathTexture + param.roughnessMap, false );
        if( param.metalnessMap ) mat.metalnessMap = view.makeTexture( name+'_m', pathTexture + param.metalnessMap, false );
        //mat.dithering = true;

        if( param.extraColor ) mat.emissiveMap = view.makeTexture( name+'_x', pathTexture + param.extraColor, false );

        if( param.specular && !special){ 

            mat.metalnessMap = view.makeTexture( name+'_s', pathTexture + param.specular, false );
            mat.roughness = 1;
            mat.metalness = 1;

            //specialMat.push( name );
            isSpec = true;
            param.isSpec = true;

        }

        if( param.subdermal ){ 
            mat.subdermal = view.makeTexture( name+'_u', pathTexture + param.subdermal, false );
        }

        if( param.side ) mat.side = param.side === 'double' ? THREE.DoubleSide : THREE.FrontSide; 

        if( mat.envMap !== undefined ) mat.envMap = view.getEnvmap();
        
       
        data[name] = materials.customize( mat, param );

        //console.log(data[name])

        return data[name];

    },

    customize: function ( mat, param ) {

        mat.onBeforeCompile = function ( shader ) {

            shader.uniforms['renderMode'] = { value: 0 };
            shader.uniforms['extraShadow'] = { value: null };

            shader.uniforms['velvet'] = { value: new THREE.Color( Number( param.velvet || '0x000000' ) ) };

            //console.log(view.getDepthPacking() ? 1 : 0)

            shader.uniforms['depthPacking'] = { value: view.getDepthPacking() ? 1 : 0 };

            if( mat.subdermal ){ 
                shader.uniforms['subdermal'] = { value: mat.subdermal };
            }


            var fragment = shader.fragmentShader;

            fragment = fragment.replace( '#include <shadowmap_pars_fragment>', shaderShadow );

            fragment = fragment.replace( 'varying vec3 vViewPosition;', ['varying vec3 vViewPosition;', 'uniform int renderMode;', 'uniform int depthPacking;', 'uniform sampler2D extraShadow;', 'uniform sampler2D subdermal;' , 'uniform vec3 velvet;'].join("\n") );

            if( param.isSpec ){ 
                fragment = fragment.replace( '#include <roughnessmap_fragment>', ['float roughnessFactor = roughness;', '#ifdef USE_METALNESSMAP', 'vec4 texelRoughness = vec4(1.0) - texture2D( metalnessMap, vUv );', 'roughnessFactor *= texelRoughness.g;', '#endif' ,''].join("\n") );
                fragment = fragment.replace( '#include <metalnessmap_fragment>', ['float metalnessFactor = metalness;', '#ifdef USE_METALNESSMAP', 'vec4 texelMetalness = texture2D( metalnessMap, vUv );', 'metalnessFactor *= texelMetalness.b;', '#endif' ,''].join("\n") );
            }

            if( param.revers ) fragment = fragment.replace( '#include <normal_fragment_maps>', materials.normalFragRevers );

            if( param.alpha ) fragment = fragment.replace( '#include <dithering_fragment>', materials.shaderEnd + ['float RR = diffuseColor.a;', 'if ( RR < 0.5 ) { discard; }', ''].join("\n") );
            else fragment = fragment.replace( '#include <dithering_fragment>', materials.shaderEnd );


            if( param.subdermal ){
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

    },

        // --------------------------
    //
    //  SHADER
    //
    // --------------------------

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

    shaderEnd: [
    '#if defined( DITHERING )',
    '    gl_FragColor.rgb = dithering( gl_FragColor.rgb );',
    '#endif',

    'if( renderMode == 1 ) gl_FragColor = depthPacking == 1 ? packDepthToRGBA( gl_FragCoord.z ) : vec4( vec3( 1.0 - gl_FragCoord.z ), opacity );',// depth render
    'if( renderMode == 2 ) gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',// normal render

    '',
    ].join("\n"),

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
        'if( renderMode == 3 ) irradiance = vec3(0.0);',
        'RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );',
    '#endif',
    '#if defined( RE_IndirectSpecular )',
        'if( renderMode == 3 ) radiance = vec3(0.0);',
        'RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );',
    '#endif',
    '',
    ].join("\n"),


}


return materials;

})();