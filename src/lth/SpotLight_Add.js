THREE.SpotLight.prototype.volumetric = function () {





	this.material = new THREE.ShaderMaterial( THREE.VolumetricShader );

	//var geometry = new THREE.CylinderBufferGeometry( 0.01, 1, 1, 32*2, 20, true);

	/*var geometrybase = new THREE.CylinderBufferGeometry( 1, 1, 1, 24, 6, true);

	geometrybase.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -0.5, 0 ) );
	geometrybase.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
	*/

	var geometry = new THREE.CylinderBufferGeometry( 0.01, 1, 1, 64, 20, true);

	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -0.5, 0 ) );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

	//geometry.setAttribute( 'uv', geometrybase.attributes.uv );
	//geometry.setAttribute( 'normal', geometrybase.attributes.normal );

	//geometry.computeVertexNormals();

	//geometry.attributes.position.array[0] *= 0.01;
    //geometry.attributes.position.array[3] *= 0.01;

    //var geometry = this.planeCone();

	var mesh = new THREE.Mesh( geometry, this.material );
	mesh.receiveShadow	= false;
	mesh.castShadow		= false;
	mesh.lookAt( new THREE.Vector3(0,0, 0) );
	this.material.uniforms = THREE.UniformsUtils.clone( this.material.uniforms );
	this.material.uniforms.lightColor.value = this.color;
	this.material.uniforms.spotPosition.value = this.position;
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

		'void main(){',
		    
		    'vFalloff = 1.0 - (length(position) / maxDistance) * attenuation;',
            ///'vec3 direction = normalMatrix * vec3(0.,1.,0.);',
            'e = normalize( vec3( modelViewMatrix * vec4( position, 1.0 ) ) );',
            'n = normalize( normalMatrix * normal );',

           

            //'n = normalize(modelViewMatrix * vec4( normal.xyz, 0.0) );',
			// compute intensity
			//'vNormal = normalize( normalMatrix * normal );',

			//'vNormal = normalMatrix * normal;',

			'vec4 worldPosition	= modelMatrix * vec4( position, 1.0 );',
			'vWorldPosition	= worldPosition.xyz;',

		    'vUv = uv;',

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

		'uniform vec3		lightColor;',
		'uniform vec3		spotPosition;',
		'uniform float		attenuation;',
		'uniform float		anglePower;',

		'void main(){',

			'float intensity;',
			// distance attenuation	
			'intensity	= distance( vWorldPosition, spotPosition) / attenuation;',
			//'intensity	= distance(vUv, vec2(0.,1.0))/attenuation;',
			'intensity	= 1.0 - clamp(intensity, 0.0, 1.0);',

			// intensity on angle
			'float lt = dot(e, n);',
			//'vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));',
			//'float angleIntensity = pow(abs(dot( (e), (n) )), anglePower);',

			'float angleIntensity = pow( abs(lt), anglePower );',
            //'angleIntensity *= smoothstep( 0., angleIntensity, (1.0-e.y)*1.618);', 
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

			//'gl_FragColor	= vec4( vec3(lt), 1.0);',

		'}',
	].join('\n'),

	//side		: THREE.DoubleSide,
	blending	: THREE.AdditiveBlending,
	transparent	: true,
	depthWrite	: false,
	flatShading : false,

}