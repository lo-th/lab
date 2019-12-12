THREE.SpotLight.prototype.volumetric = function ( g ) {





	this.material = new THREE.ShaderMaterial( THREE.VolumetricShader );

	//var geometry = new THREE.CylinderBufferGeometry( 0.01, 1, 1, 32*2, 20, true);

	/*var geometrybase = new THREE.CylinderBufferGeometry( 1, 1, 1, 24, 6, true);

	geometrybase.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -0.5, 0 ) );
	geometrybase.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
	*/

	var geometry = new THREE.CylinderBufferGeometry( 0.01, 1, 1, 64, 20, true);

	//var geometry = new THREE.CylinderBufferGeometry( 0.02, 1, 1, 20, 1, true);
	//var geometry = new THREE.CylinderGeometry( 0.01, 1, 1, 24, 3, true);


	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -0.5, 0 ) );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

	//geometry.setAttribute( 'uv', geometrybase.attributes.uv );
	//geometry.setAttribute( 'normal', geometrybase.attributes.normal );
   // geometry.mergeVertices();
	//geometry.computeVertexNormals(true);
	//geometry.normalizeNormals()
	//geometry.toNonIndexed()


	/*if ( g !== undefined ){ 
		geometry = g;
		g.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -1.0, 0 ) );
	    g.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
	}
	*/

	//geometry.attributes.position.array[0] *= 0.01;
    //geometry.attributes.position.array[3] *= 0.01;

   //console.log(geometry.attributes.position.array)

    //var geometry = this.planeCone();

	var mesh = new THREE.Mesh( geometry, this.material );
	mesh.receiveShadow	= false;
	mesh.castShadow		= false;
	mesh.lookAt( new THREE.Vector3(0,0, 0) );
	this.material.uniforms = THREE.UniformsUtils.clone( this.material.uniforms );
	this.material.uniforms.lightColor.value = this.color;
	this.material.uniforms.spotPosition.value = this.position;
	this.material.uniforms.normalMap.value = new THREE.TextureLoader().load('./assets/textures/cone.png')
	this.add( mesh );

	this.cone = mesh;
	this.vector = new THREE.Vector3();

	this.isVolumetric = true;

};

THREE.SpotLight.prototype.planeCone = function () {

	var g1 = new THREE.PlaneGeometry(2,1,1,1);
	g1.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -g1.parameters.height/2, 0 ) );
	g1.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
	g1.vertices[0].x *= 0.01;
    g1.vertices[1].x *= 0.01;

    var g2 = g1.clone();
    g2.applyMatrix( new THREE.Matrix4().makeRotationZ( 120 * ( Math.PI / 180 ) ) );

    var g3 = g1.clone();
    g3.applyMatrix( new THREE.Matrix4().makeRotationZ( -120 * ( Math.PI / 180 ) ) );

    g1.merge(g2);
    g1.merge(g3);

    var g = new THREE.BufferGeometry().fromGeometry( g1 );

	return g;
}

THREE.SpotLight.prototype.setVolumetric = function ( o ) {

	if(!this.isVolumetric) return;

	if( o.anglePower ) this.material.uniforms.anglePower.value = o.anglePower;
	if( o.attenuation ) this.material.uniforms.attenuation.value = o.attenuation;


}

THREE.SpotLight.prototype.volumetricUpdate = function () {

	if(!this.isVolumetric) return;

	this.vector.setFromMatrixPosition( this.target.matrixWorld );

	var targetLength = this.position.distanceTo(this.vector )

	var coneLength = this.distance ? this.distance : 1000;
	var coneWidth = coneLength * Math.tan( this.angle );

	this.cone.scale.set( coneWidth, coneWidth, coneLength );
	this.cone.lookAt(this.vector);

	

	//this.material.uniforms.attenuation.value = targetLength*0.8;
	//this.cone.material.uniforms.anglePower.value = this.intensity;
	this.material.uniforms.maxDistance.value = coneLength;


	


}

THREE.SpotLight.prototype.updateMatrixWorld = function ( force ) {

	THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

	this.volumetricUpdate()

};

THREE.VolumetricShader	= {

	uniforms: { 
		attenuation	: {value	: 20},
		anglePower	: {value	: 8},
		spotPosition		: { value	: new THREE.Vector3( 0, 0, 0 )},
		lightColor	: { value : new THREE.Color(0xffffff)},
		maxDistance: {  value : 0.5 },
		normalMap:{ value: null },
	},

	vertexShader : [

	    'uniform float maxDistance;',
	    'uniform float attenuation;',
		'varying vec3 vNormal;',
		'varying vec3 vWorldPosition;',
		'varying vec2 vUv;',
		'varying vec3 e;',
		'varying vec3 n;',
		'varying float vFalloff;',

		'uniform sampler2D normalMap;',

		'void main(){',

		    //'vec3 copy = position;',

            //'if(copy.z < 0.9) copy.xy *= 0.02;',
		    
		    'vFalloff = 1.0 - (length(position) / maxDistance) * attenuation;',
		    'vUv = uv;',
            ///'vec3 direction = normalMatrix * vec3(0.,1.,0.);',
            //'vec3 nn = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0; ',
            'e = normalize( vec3( modelViewMatrix * vec4( position, 1.0 ) ) );',
            'n = normalize( normalMatrix * normal );',

            

            //'n = normalize( normalMatrix * nn );',
            

            //'n = normalize( normalMatrix * (texture2D( normalMap, vUv ).xyz * 2.0 - 1.0 ));',


            //'n = normalize(modelViewMatrix * vec4( normal.xyz, 0.0) );',
			// compute intensity
			//'vNormal = normalize( normalMatrix * normal );',

			//'vNormal = normalMatrix * normal;',

			'vec4 worldPosition	= modelMatrix * vec4( position, 1.0 );',
			'vWorldPosition	= worldPosition.xyz;',

		    

			// set gl_Position
			'gl_Position	= projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}',
	].join('\n'),

	fragmentShader : [
	    'precision highp float;',
		'varying vec3		vNormal;',
		'varying vec3		vWorldPosition;',
		'varying vec2       vUv;',
		'varying vec3 e;',
		'varying vec3 n;',
		'varying float vFalloff;',

		'uniform sampler2D normalMap;',

		'uniform vec3		lightColor;',
		'uniform vec3		spotPosition;',
		'uniform float		attenuation;',
		'uniform float		anglePower;',

		'float my_smoothstep( float x, float n ){',
		    'return pow(x,n) / (pow(x,n) + pow(1.0-x,n) );',
		    
		    // single pow() optimization, if x is not 0.0
		    //
		    // return 1.0/(1.0+pow(1.0/x-1.0,n) );
		'}',

		'void main(){',

			'float intensity;',

			
			// distance attenuation	
			'intensity	= distance( vWorldPosition, spotPosition) / attenuation;',
			//'intensity	= distance(vUv, vec2(0.,1.0))/attenuation;',
			'intensity	= 1.0 - clamp(intensity, 0.0, 1.0);',




			// intensity on angle
			//'vec3 norm = normalize(texture2D( normalMap, vUv ).xyz);',
			//'float lt = dot( e, n );',

			'float lt = dot( normalize(e), normalize(n) );',


			//'vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));',
			//'float angleIntensity = pow(abs(dot( (e), (n) )), anglePower);',

			'float angleIntensity = pow( abs(lt), anglePower );',
			//'angleIntensity = my_smoothstep( angleIntensity, 0.5 );',
			//'angleIntensity = pow( abs(smoothstep(1.0,0.0,lt)), anglePower );',
            //'angleIntensity = smoothstep( 0., abs(lt), anglePower ), anglePower );', 
			//'float angleIntensity = pow( abs(e), anglePower );',
			//'normal	= vec3(vUv.x, vUv.y, abs(vNormal.z));',
			//'float angleIntensity = pow( abs(dot(normal, vec3(0.0, 0.0, 1.0))), anglePower );',
			
			'intensity	= intensity * angleIntensity;',

			//'intensity	= vFalloff * angleIntensity;',

			//'intensity	= clamp(intensity, 0.0, 1.0);',

			//'intensity= 0.5- smoothstep( intensity, 0.0,    angleIntensity);', 

			//'float alphaR = sin( (distance(vec2(0.,1.0), vUv) )) ;',


			// set the final color
			'gl_FragColor= vec4( lightColor, intensity);',

			//'gl_FragColor	= vec4( vec3(abs(lt)), 1.0);',

		'}',
	].join('\n'),

	//side		: THREE.DoubleSide,
	blending	: THREE.AdditiveBlending,
	//transparent	: true,
	//depthWrite	: false,
	flatShading : false,

}