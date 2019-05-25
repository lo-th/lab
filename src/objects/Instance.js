THREE.Instance = function  ( o ) {

	o = o || {};

	this.num = o.num || 1000;

	this.setGeometry( o );

	this.setMaterial( o );

	THREE.Mesh.call( this, this.geometry, this.material );

	this.castShadow = false;
	this.receiveShadow = false;
	this.frustumCulled = false;
	//this.customDepthMaterial = this.materialDepth;


}

THREE.Instance.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), {

    constructor: THREE.Instance,

    setGeometry: function ( o ) {

    	this.clear();

    	var bufferGeometry = o.geometry || new THREE.BoxBufferGeometry( 2, 2, 2 );

		this.geometry = new THREE.InstancedBufferGeometry();
		this.geometry.maxInstancedCount = this.num;

		for ( var k in bufferGeometry.attributes ){
			this.geometry.attributes[k] = bufferGeometry.attributes[k];
		}

		/*Object.keys(bufferGeometry.attributes).forEach(attributeName=>{
		  this.geometry.attributes[attributeName] = bufferGeometry.attributes[attributeName]
		})*/

		this.geometry.index = bufferGeometry.index;

		this.offsets = new Float32Array( this.num * 3 );
		this.scales = new Float32Array( this.num * 3 );
		this.orientations = new Float32Array( this.num * 4 );

		var q = new THREE.Quaternion();
		var e = new THREE.Euler();
		var torad = THREE.Math.DEG2RAD;
		
		for ( var i = 0; i < this.num; i ++ ) {

			var n = 3 * i;
			var n4 = 4 * i;

			// position

			if(o.pos){
				this.offsets[n] = o.pos[n];
			    this.offsets[n+1] = o.pos[n+1];
			    this.offsets[n+2] = o.pos[n+2];
			}else{
				this.offsets[n] = Math.rand(-200, 200);
			    this.offsets[n+1] = Math.rand(-20, 20);
			    this.offsets[n+2] = Math.rand(-200, 200);
			}

			// rotation

			if(o.rot){
				q.setFromEuler( e.set(o.rot[n]*torad, o.rot[n+1]*torad, o.rot[n+2]*torad ) )
			} else {
				q.set( 0, 0, 0, 1 );
			}
			
			q.normalize();
			this.orientations[n4] = q.x;
			this.orientations[n4+1] = q.y;
			this.orientations[n4+2] = q.z;
			this.orientations[n4+3] = q.w;

			// scale

			if(o.scale){
				this.scales[n] = o.scale[n];
			    this.scales[n+1] = o.scale[n+1];
			    this.scales[n+2] = o.scale[n+2];
			} else {
				this.scales[n] = 1;
			    this.scales[n+1] = 1;
			    this.scales[n+2] = 1;
			}

		}


		this.offsetAttribute = new THREE.InstancedBufferAttribute( this.offsets, 3 );
		this.scaleAttribute = new THREE.InstancedBufferAttribute( this.scales, 3 );//.setDynamic( true );
		this.orientationAttribute = new THREE.InstancedBufferAttribute( this.orientations, 4 );

		/*
		this.offsetAttribute.dynamic = true
		this.scaleAttribute.dynamic = true
		this.orientationAttribute.dynamic = true
		*/
		
		this.geometry.addAttribute( 'offset', this.offsetAttribute );
		this.geometry.addAttribute( 'scales', this.scaleAttribute );
		this.geometry.addAttribute( 'orientation', this.orientationAttribute );

    },

    setMaterial: function ( o ) {

    	var extraFrag = [
    	'varying mat4 mvmtx;',
    	].join("\n");

    	var extra = [
    	    'uniform mat4 cmtx;',
    	    'varying mat4 mvmtx;',
			'attribute vec3 offset;',
			'attribute vec3 scales;',
			'attribute vec4 orientation;',
			'vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {',
			'   position *= scale;',
			'   position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );',
			'   return position + translation;',
			'}',
			'mat4 tmpWorldMatrix( vec3 position, vec4 quaternion, vec3 scale ) {',
				'float x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;',
				'float x2 = x + x,	y2 = y + y, z2 = z + z;',
				'float xx = x * x2, xy = x * y2, xz = x * z2;',
				'float yy = y * y2, yz = y * z2, zz = z * z2;',
				'float wx = w * x2, wy = w * y2, wz = w * z2;',
				'float sx = scale.x, sy = scale.y, sz = scale.z;',
				'mat4 B;',
				'B[0][0] = ( 1.0 - ( yy + zz ) ) * sx;',
				'B[0][1] = ( xy + wz ) * sx;',
				'B[0][2] = ( xz - wy ) * sx;',
				'B[0][3] = 0.0;',
			 
				'B[1][0] = ( xy - wz ) * sy;',
				'B[1][1] = ( 1.0 - ( xx + zz ) ) * sy;',
				'B[1][2] = ( yz + wx ) * sy;',
				'B[1][3] = 0.0;',
			 
				'B[2][0] = ( xz + wy ) * sz;',
				'B[2][1] = ( yz - wx ) * sz;',
				'B[2][2] = ( 1.0 - ( xx + yy ) ) * sz;',
				'B[2][3] = 0.0;',
			 
				'B[3][0] = position.x;',
				'B[3][1] = position.y;',
				'B[3][2] = position.z;',
				'B[3][3] = 1.0;',
			    'return B;',
			'}',
			'mat3 tmpInverse( mat3 A ) {',

				'float n11 = A[0][0], n21 = A[0][1], n31 = A[0][2];',
				'float n12 = A[1][0], n22 = A[1][1], n32 = A[1][2];',
				'float n13 = A[2][0], n23 = A[2][1], n33 = A[2][2];',
				'float t11 = n33 * n22 - n32 * n23;',
				'float t12 = n32 * n13 - n33 * n12;',
				'float t13 = n23 * n12 - n22 * n13;',
				'float det = n11 * t11 + n21 * t12 + n31 * t13;',
				'float detInv = 1.0 / det;',

				'mat3 B;',

				'B[0][0] = t11 * detInv;',
				'B[0][1] = ( n31 * n23 - n33 * n21 ) * detInv;',
				'B[0][2] = ( n32 * n21 - n31 * n22 ) * detInv;',

				'B[1][0] = t12 * detInv;',
				'B[1][1] = ( n33 * n11 - n31 * n13 ) * detInv;',
				'B[1][2] = ( n31 * n12 - n32 * n11 ) * detInv;',

				'B[2][0] = t13 * detInv;',
				'B[2][1] = ( n21 * n13 - n23 * n11 ) * detInv;',
				'B[2][2] = ( n22 * n11 - n21 * n12 ) * detInv;',

				'return B;',
			'}',

			'mat3 tmpTranspose( mat3 A ) {',
			    'mat3 B;',
			    'B[0][0] = A[0][0];',
			    'B[0][1] = A[1][0];',
			    'B[0][2] = A[2][0];',

			    'B[1][0] = A[0][1];',
			    'B[1][1] = A[1][1];',
			    'B[1][2] = A[2][1];',

			    'B[2][0] = A[0][2];',
			    'B[2][1] = A[1][2];',
			    'B[2][2] = A[2][2];',
			    'return B;',
			'}',
			'mat3 tmpNormalMatrix( mat4 A ) {',

			    'mat3 B = mat3( A[0][0], A[0][1], A[0][2], A[1][0], A[1][1], A[1][2], A[2][0], A[2][1], A[2][2] );',
			    /*
			    'B[0][0] = A[0][0];',//0
			    'B[0][1] = A[0][1];',//1
			    'B[0][2] = A[0][2];',//2

			    'B[1][0] = A[1][0];',//3
			    'B[1][1] = A[1][1];',//4
			    'B[1][2] = A[1][2];',//5

			    'B[2][0] = A[2][0];',//6
			    'B[2][1] = A[2][1];',//7
			    'B[2][2] = A[2][2];',//8
			    */
			    'return tmpTranspose( tmpInverse(B) );',
			'}',
			
		].join("\n");

		var extraMain0 = [
			'mat4 world = tmpWorldMatrix( offset, orientation, scales );',
			'mat4 viewMatrix = (cmtx*world);',
			'mat3 normalMtx = tmpNormalMatrix( viewMatrix );',
			//'vec3 objectNormal = (world * vec4( normal , 1.0 )).xyz;',
			//'vec3 objectNormal = (viewMatrix * vec4( normal , 1.0 )).xyz;',
			'vec3 objectNormal = vec3( normal );',
			'#ifdef USE_TANGENT',
				'vec3 objectTangent = vec3( tangent.xyz );',
			'#endif',
		].join("\n");

		var extraMain = [
		    'vec3 transformed = (world * vec4( position , 1.0 )).xyz;',

			//'vec3 transformed = applyTRS( position.xyz, offset, orientation, scales );',
		].join("\n");

		var extraMain2 = [
		    
		    'vec4 mvPosition = viewMatrix * vec4( transformed, 1.0 );',
			//'vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );',
			'gl_Position = projectionMatrix * mvPosition;',
		].join("\n");

		var extraMain3 = [
			'#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )',
			'vec4 worldPosition = world * vec4( transformed, 1.0 );',
			'#endif',
		].join("\n");

		var extraMain20 = [

		    'vec3 transformedNormal = normalMtx * objectNormal;',
			//'vec3 transformedNormal = normalMatrix * objectNormal;',

			'#ifdef FLIP_SIDED',

				'transformedNormal = - transformedNormal;',

			'#endif',

			'#ifdef USE_TANGENT',

				'vec3 transformedTangent = normalMatrix * objectTangent;',

				'#ifdef FLIP_SIDED',

					'transformedTangent = - transformedTangent;',

				'#endif',

			'#endif',
		].join("\n");

    	this.material = o.material;// || new THREE.MeshBasicMaterial({ color:0x00FF00 });

    	this.material.onBeforeCompile = function ( shader ) {

    		shader.uniforms['cmtx'] = { value: view.camera.matrixWorldInverse };

    		

    		shader.vertexShader = extra + '\n' + shader.vertexShader;
    		shader.vertexShader = shader.vertexShader.replace( '#include <beginnormal_vertex>', extraMain0 );
    		shader.vertexShader = shader.vertexShader.replace( '#include <defaultnormal_vertex>', extraMain20 )
    		//shader.vertexShader = shader.vertexShader.replace( '#include <begin_vertex>', extraMain );
    		shader.vertexShader = shader.vertexShader.replace( '#include <project_vertex>', extraMain2 );
    		shader.vertexShader = shader.vertexShader.replace( '#include <worldpos_vertex>', extraMain3 );

    		shader.fragmentShader = extraFrag + '\n' + shader.fragmentShader;

    	};


    	//this.materialDepth = new THREE.MeshBasicMaterial({ color:0x00FF00 });


    },

    setPosition: function ( ar ) {

    	this.offsetAttribute.needsUpdate = true;
    	
    },

    setOrientation: function ( ar ) {

    	this.orientationAttribute.needsUpdate = true;
    	
    },

    setScale: function ( ar ) {

    	this.scaleAttribute.needsUpdate = true;
    	
    },

    clear: function () {

    	if( this.geometry !== undefined ) this.geometry.dispose();

    },

});