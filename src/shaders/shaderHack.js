THREE.ShaderChunk.color_pars_fragment = [
    '#ifdef USE_COLOR',
    '    varying vec3 vColor;',
    '#endif',
    'uniform int renderMode;',
    'uniform float shadowAlpha;',
].join("\n");


THREE.ShaderChunk.emissivemap_fragment = [
    '#ifdef USE_EMISSIVEMAP',
    '    vec4 emissiveColor = texture2D( emissiveMap, vUv );',
    '    emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;',
    '    totalEmissiveRadiance *= emissiveColor.rgb;',
    '#endif',
    'if( renderMode == 1 ) { gl_FragColor = packDepthToRGBA( gl_FragCoord.z ); return; }',
    'if( renderMode == 2 ) { gl_FragColor = vec4( packNormalToRGB( normal ), opacity ); return; }'
].join("\n");



THREE.ShaderChunk.lights_physical_fragment = [
    'PhysicalMaterial material;',
    'vec3 shadowTemp = vec3(1.0);',
    
	'material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );',
	'material.specularRoughness = clamp( roughnessFactor, 0.04, 1.0 );',
	'#ifdef STANDARD',
	'	material.specularColor = mix( vec3( DEFAULT_SPECULAR_COEFFICIENT ), diffuseColor.rgb, metalnessFactor );',
	'#else',
	'	material.specularColor = mix( vec3( MAXIMUM_SPECULAR_COEFFICIENT * pow2( reflectivity ) ), diffuseColor.rgb, metalnessFactor );',
	'	material.clearCoat = saturate( clearCoat );', // Burley clearcoat model
	'	material.clearCoatRoughness = clamp( clearCoatRoughness, 0.04, 1.0 );',
    // Fresnel specular reflectance at normal incidence
     'vec3 f0 = 0.16 * reflectivity * reflectivity * (1.0 - metalnessFactor) + material.diffuseColor.rgb * metalnessFactor;',
     'if(opacity!=1.0){',
     //'    float reflect = max(max(f0.r, f0.g), f0.b);',
     '    float reflect = max(max(material.specularColor.r, material.specularColor.g), material.specularColor.b);',
     '    float alpha = reflect + opacity * (1.0 - reflect);',
     '    material.diffuseColor *= opacity;',
     '    diffuseColor.a = alpha;',

     '}',
	'#endif',
].join("\n");

var shader = THREE.ShaderChunk.lights_fragment_begin;
shader = shader.replace(
	'directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;',
	'shadowTemp *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;'

);
THREE.ShaderChunk.lights_fragment_begin = shader;

THREE.ShaderChunk.lights_fragment_end = [

    'shadowTemp *= reflectedLight.directDiffuse;',
    'shadowTemp.rgb *= 20.0;',
    'shadowTemp = saturate( shadowTemp );',

    //'reflectedLight.directDiffuse = mix( reflectedLight.directDiffuse, vec3(0.0), (1.0-shadowTemp.r)*shadowAlpha );',

   //'reflectedLight.directDiffuse += shadowTemp*shadowAlpha;',
    //'reflectedLight.directDiffuse*0.5;',
    //'shadowTemp.rgb = vec3(shadowTemp.r) * 20.0;',

	'#if defined( RE_IndirectDiffuse )',
	'	 RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );',
	'#endif',
	'#if defined( RE_IndirectSpecular )',
	'	 RE_IndirectSpecular( radiance, clearCoatRadiance, geometry, material, reflectedLight );',
	'#endif',

    //'shadowTemp *= reflectedLight.indirectSpecular;',

	'reflectedLight.directDiffuse = mix( reflectedLight.directDiffuse, vec3(0.0), (1.0-shadowTemp.r)*shadowAlpha );',
	'reflectedLight.indirectDiffuse = mix( reflectedLight.indirectDiffuse, vec3(0.0), (1.0-shadowTemp.r)*shadowAlpha );',//??
	//'reflectedLight.directSpecular = mix( reflectedLight.directSpecular, vec3(0.0), (1.0-shadowTemp.r)*shadowAlpha );',
	//'reflectedLight.indirectSpecular = mix( reflectedLight.indirectSpecular, vec3(0.0), (1.0-shadowTemp.r)*shadowAlpha );',
	//'totalEmissiveRadiance = mix( totalEmissiveRadiance, vec3(0.0), (1.0-shadowTemp.r)*shadowAlpha );',

	//'reflectedLight.indirectDiffuse *= ( shadowTemp - 1.0 ) * shadowAlpha + 1.0;',

].join("\n");

THREE.ShaderChunk.aomap_fragment = [
    '#ifdef USE_AOMAP',
    '    float ambientOcclusion = ( texture2D( aoMap, vUv ).r - 1.0 ) * aoMapIntensity + 1.0;',
    '    reflectedLight.indirectDiffuse *= ambientOcclusion;',
    '    #if defined( USE_ENVMAP ) && defined( PHYSICAL )',
    '        float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );',
    '        reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );',
    '    #endif',
    '#endif',
    //'if( renderMode == 3 ) { gl_FragColor = vec4( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse+ reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance, opacity ); return; }'
].join("\n");



THREE.ShaderChunk.dithering_fragment = [

//'gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3(0.0), (1.0-shadowTemp.r)*shadowAlpha );',

  // 'vec3 shadowLayer = gl_FragColor.rgb * vec3(shadowTemp.r);',

//'gl_FragColor.rgb *= ( shadowTemp - 1.0 ) * shadowAlpha + 1.0;',

 //	"gl_FragColor.rgb = mix( gl_FragColor.rgb, shadowLayer, shadowAlpha );",

 //	"gl_FragColor = vec4( vec3(shadowTemp.r), (1.0-shadowTemp.r) );",
 	//"gl_FragColor.rgb = shadowLayer;",

 //   'gl_FragColor.rgb = gl_FragColor.rgb+shadowTemp.rgb;',



    '#if defined( DITHERING )',
    '    gl_FragColor.rgb = dithering( gl_FragColor.rgb );',
    '#endif',
    //'if( renderMode == 1 ) gl_FragColor = packDepthToRGBA( gl_FragCoord.z );',// depth render
    //'if( renderMode == 2 ) gl_FragColor = vec4( packNormalToRGB( normal ), opacity );',// normal render
    //'if( renderMode == 3 ) gl_FragColor = vec4( reflectedLight.directDiffuse, opacity );',
    'if( renderMode == 3 ) gl_FragColor = vec4( shadowTemp, opacity );',// totalEmissiveRadiance render
    'if( renderMode == 4 ) gl_FragColor = vec4( reflectedLight.directDiffuse, opacity );',// directDiffuse render
    'if( renderMode == 5 ) gl_FragColor = vec4( reflectedLight.indirectDiffuse, opacity );',// indirectDiffuse render
    'if( renderMode == 6 ) gl_FragColor = vec4( reflectedLight.directSpecular, opacity );',// directSpecular render
    'if( renderMode == 7 ) gl_FragColor = vec4( reflectedLight.indirectSpecular, opacity );',// indirectSpecular render
    'if( renderMode == 8 ) gl_FragColor = vec4( totalEmissiveRadiance, opacity );',// totalEmissiveRadiance render
    

].join("\n");