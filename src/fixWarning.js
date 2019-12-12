var fixWarning = function () {

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

};