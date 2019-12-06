THREE.SpotLight.prototype.volumetric = function () {

	var material = new THREE.ShaderMaterial( THREE.VolumetricShader );

	var geometry = new THREE.CylinderBufferGeometry( 0.01, 1, 1, 32*2, 20, true);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );

	var mesh	= new THREE.Mesh( geometry, material );
	mesh.receiveShadow	= false;
	mesh.castShadow		= false;
	mesh.lookAt( new THREE.Vector3(0,0, 0) );
	material.uniforms = THREE.UniformsUtils.clone( material.uniforms );
	material.uniforms.lightColor.value = this.color;
	material.uniforms.spotPosition.value = this.position;
	this.add( mesh );

	this.cone = mesh;
	this.vector = new THREE.Vector3();

	this.isVolumetric = true;

};

THREE.SpotLight.prototype.volumetricUpdate = function () {

	if(!this.isVolumetric) return;

	var coneLength = this.distance ? this.distance : 1000;
	var coneWidth = coneLength * Math.tan( this.angle );

	this.cone.scale.set( coneWidth, coneWidth, coneLength );

	this.cone.scale.set( coneWidth, coneWidth, coneLength );

	this.vector.setFromMatrixPosition( this.target.matrixWorld );

	this.cone.material.uniforms.attenuation.value = coneLength*0.8;
	this.cone.material.uniforms.anglePower.value = this.intensity;


	this.cone.lookAt(this.vector);


}

THREE.SpotLight.prototype.updateMatrixWorld = function ( force ) {

	THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

	this.volumetricUpdate()

};

THREE.VolumetricShader	= {

	uniforms: { 
		attenuation	: {value	: 5.0},
		anglePower	: {value	: 1},
		spotPosition		: { value	: new THREE.Vector3( 0, 0, 0 )},
		lightColor	: { value : new THREE.Color(0xffffff)},
	},

	vertexShader : [
		'varying vec3 vNormal;',
		'varying vec3 vWorldPosition;',
		
		'void main(){',
			// compute intensity
			'vNormal = normalize( normalMatrix * normal );',

			'vec4 worldPosition	= modelMatrix * vec4( position, 1.0 );',
			'vWorldPosition	= worldPosition.xyz;',

			// set gl_Position
			'gl_Position	= projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}',
	].join('\n'),

	fragmentShader : [
		'varying vec3		vNormal;',
		'varying vec3		vWorldPosition;',
		'uniform vec3		lightColor;',
		'uniform vec3		spotPosition;',
		'uniform float		attenuation;',
		'uniform float		anglePower;',

		'void main(){',
			'float intensity;',
			// distance attenuation	
			'intensity	= distance( vWorldPosition, spotPosition)/attenuation;',
			'intensity	= 1.0 - clamp(intensity, 0.0, 1.0);',

			// intensity on angle
			'vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));',
			'float angleIntensity	= pow( abs(dot(normal, vec3(0.0, 0.0, 1.0))), anglePower );',
			'intensity	= intensity * angleIntensity;',		

			// set the final color
			'gl_FragColor	= vec4( lightColor, intensity);',

		'}',
	].join('\n'),

	// side		: THREE.DoubleSide,
	blending	: THREE.AdditiveBlending,
	transparent	: true,
	depthWrite	: false,

}