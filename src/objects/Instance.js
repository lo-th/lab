THREE.Instance = function  ( o ) {

	o = o || {};

	this.num = o.num || 1000;

	this.isMorph = false;
    this.isAnimation = false;

    this.material = o.material || new THREE.MeshBasicMaterial({ color:0x00FF00 });

    this.isAnimation = this.material.skinning !== undefined ? this.material.skinning : false;
    this.isMorph = this.material.morphTargets !== undefined ? this.material.morphTargets : false;;

	this.setGeometry( o );
	this.setMaterial( o );
	this.setShadow( o );

	if( this.isAnimation ) this.mesh = new THREE.SkinnedMesh( this.geometry, this.material );
	else this.mesh = new THREE.Mesh( this.geometry, this.material );

	//console.log( this )

	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;
	this.mesh.frustumCulled = false;


	THREE.Object3D.call( this );
	this.add( this.mesh );

	this.mesh.customDepthMaterial = this.depthMaterial;


	if( this.isAnimation ){

		this.mesh.skeleton = this.skeleton;
		this.rootBone = this.skeleton.bones[ 0 ];
		this.mesh.add( this.rootBone );

		this.mesh.bind( this.skeleton, this.matrixWorld );
		this.offsetMatrix = new THREE.Matrix4();

		this.setMixer();

		/*var parent = this.parent;
		this.add( parent.children[ 0 ] ); // move bones under SkinnedMesh

		while ( parent.children.length > 0 ) {

			parent.remove( parent.children[ 0 ] );

		}*/
			
		//this.type = 'SkinnedMesh';
	
		/*this.bindMode = 'attached';
		this.bindMatrix = new THREE.Matrix4();
		this.bindMatrixInverse = new THREE.Matrix4();*/
	}

	
	//this.customDepthMaterial = this.materialDepth;


}

THREE.Instance.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

    constructor: THREE.Instance,

    //isSkinnedMesh: true,

    setGeometry: function ( o ) {

    	this.clear();

    	var source;

    	if( o.mesh !== undefined ) source = o.mesh.geometry;
    	else if( o.geometry !== undefined ) source = o.geometry;
    	else source = new THREE.BoxBufferGeometry( 2, 2, 2 )

		this.geometry = new THREE.InstancedBufferGeometry();
		this.geometry.maxInstancedCount = this.num;

		//

		var name;

		// attributes

		var attributes = source.attributes;

		for ( name in attributes ){
			//this.geometry.attributes[k] = source.attributes[k];

			//var attribute = attributes[ name ];
			this.geometry.setAttribute( name, source.getAttribute( name ) );
			//this.geometry.setAttribute( name, attribute.clone() );

		}

		//this.geometry.index = source.index;
		this.geometry.setIndex( source.getIndex() );

		//console.log(this.geometry)

		// morph attributes

		if( this.isMorph ){

			var morphAttributes = source.morphAttributes;

			for ( name in morphAttributes ) {

				var array = [];
				var morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

				for ( var i = 0, l = morphAttribute.length; i < l; i ++ ) {

					array.push( morphAttribute[ i ].clone() );

				}

				this.geometry.morphAttributes[ name ] = array;

			}

			this.geometry.morphTargets = source.morphTargets;
		}

		// animation
		if( source.animations && this.isAnimation ){

			this.skeleton = o.mesh.skeleton.clone();
			//this.parent = o.mesh.parent
			//console.log(this.parent)
			//
			//this.geometry.animations = source.animations;
		    //this.geometry.bones = source.bones;

		    

		    var bones = this.skeleton.bones;


		    var size = Math.sqrt( bones.length * 4 );
			size = THREE.Math.ceilPowerOfTwo( size );
			size = Math.max( size, 4 );

			var boneMatrices = new Float32Array( size * size * 4 * this.num );
			boneMatrices.set( this.skeleton.boneMatrices );

			var boneTexture = new THREE.DataTexture2DArray( boneMatrices, size, size, this.num );
			boneTexture.format = THREE.RGBAFormat;
			boneTexture.type = THREE.FloatType;
			boneTexture.needsUpdate = true;

			this.skeleton.boneMatrices = boneMatrices
			this.skeleton.boneTexture = boneTexture;
			this.skeleton.boneTextureSize = size;

			//

			//var sourceAnimation = o.mesh.clips;
			var sourceAnimation = source.animations;
			this.clips = [];

			for(var k = 0; k < sourceAnimation.length; k++ ){

				var clip = sourceAnimation[k];
				var track = clip.tracks;
				var tracks = [];

				for (var f=0; f<track.length; f++){

					track[f].name = track[f].name.replace('.bones[', '');
					track[f].name = track[f].name.replace('].', '.');

					tracks.push( track[ f ].clone() );

				}

				var anim = new THREE.AnimationClip( clip.name, clip.duration, tracks )
				//anim.optimize();
				anim.trim()
				anim.resetDuration();
				//

				//anim.validate()
				this.clips.push( anim );

			}

			//console.log( source, this.clips )

			this.skeleton.update = function () {};

			/*this.mesh = new THREE.SkinnedMesh( this.geometry, new THREE.MeshBasicMaterial({skinning:true}) );
			this.mesh.bind( this.skeleton, this.matrixWorld );

			this.mesh.skeleton = this.skeleton*/

			//view.scene.add(this.mesh)

			/*this.geometry.setAttribute( 'instanceMatrixColumn0', new THREE.InstancedBufferAttribute( new Float32Array( instanceMatrixColumns0 ), 4 ) );
			this.geometry.setAttribute( 'instanceMatrixColumn1', new THREE.InstancedBufferAttribute( new Float32Array( instanceMatrixColumns1 ), 4 ) );
			this.geometry.setAttribute( 'instanceMatrixColumn2', new THREE.InstancedBufferAttribute( new Float32Array( instanceMatrixColumns2 ), 4 ) );
			this.geometry.setAttribute( 'instanceMatrixColumn3', new THREE.InstancedBufferAttribute( new Float32Array( instanceMatrixColumns3 ), 4 ) );
			this.geometry.setAttribute( 'instanceNormalMatrixColumn0', new THREE.InstancedBufferAttribute( new Float32Array( instanceNormalMatrixColumns0 ), 3 ) );
			this.geometry.setAttribute( 'instanceNormalMatrixColumn1', new THREE.InstancedBufferAttribute( new Float32Array( instanceNormalMatrixColumns1 ), 3 ) );
			this.geometry.setAttribute( 'instanceNormalMatrixColumn2', new THREE.InstancedBufferAttribute( new Float32Array( instanceNormalMatrixColumns2 ), 3 ) );
			*/

		    
		}

		
//if(this.isAnimation) this.bind( this.skeleton, this.matrixWorld );


		//console.log(source, this.geometry)

		/*Object.keys(source.attributes).forEach(attributeName=>{
		  this.geometry.attributes[attributeName] = source.attributes[attributeName]
		})*/



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
		
		this.geometry.setAttribute( 'offset', this.offsetAttribute );
		this.geometry.setAttribute( 'scales', this.scaleAttribute );
		this.geometry.setAttribute( 'orientation', this.orientationAttribute );

    },

    setMaterial: function ( o ) {

    	


    	var extraFrag = [
    	//'varying mat4 mvmtx;',
    	].join('\n');

    	this.vertexPars_V2 = [
    	    'uniform mat4 cmtx;',
    	    'uniform float morpher[ 8 ];',
    	    //'varying mat4 mvmtx;',
			'attribute vec3 offset;',
			'attribute vec3 scales;',
			'attribute vec4 orientation;',

			'mat4 ComposeWorldMatrix( vec3 position, vec4 quaternion, vec3 scale ) {',

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

			'mat3 getNormalMatrix( mat4 A ) {',

			    'return transpose( inverse( mat3( A ) ) );',
			    
			'}',
			
		].join('\n') + '\n';

    	this.vertexPars_V1 = [
    	    'uniform mat4 cmtx;',
    	    'uniform float morpher[ 8 ];',
    	    //'varying mat4 mvmtx;',
			'attribute vec3 offset;',
			'attribute vec3 scales;',
			'attribute vec4 orientation;',

			/*'vec3 applyTRS( vec3 position, vec3 translation, vec4 quaternion, vec3 scale ) {',
			'   position *= scale;',
			'   position += 2.0 * cross( quaternion.xyz, cross( quaternion.xyz, position ) + quaternion.w * position );',
			'   return position + translation;',
			'}',*/

			'mat4 ComposeWorldMatrix( vec3 position, vec4 quaternion, vec3 scale ) {',

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

			'mat3 getNormalMatrix( mat4 A ) {',

			    //'if( isGL2 ) return transpose( inverse( mat3( A ) ) );',
			    //'else 
			    'return tmpTranspose( tmpInverse( mat3( A[0][0], A[0][1], A[0][2], A[1][0], A[1][1], A[1][2], A[2][0], A[2][1], A[2][2] ) ) );',
			    
			'}',
			
		].join('\n') + '\n';

		this.beginInstanceVertex = [
			'mat4 world = ComposeWorldMatrix( offset, orientation, scales );',
			'mat4 viewMatrix = ( cmtx * world );',
			
			//'vec3 objectNormal = (world * vec4( normal , 1.0 )).xyz;',
			//'vec3 objectNormal = (viewMatrix * vec4( normal , 1.0 )).xyz;',
			/*'vec3 objectNormal = vec3( normal );',
			'#ifdef USE_TANGENT',
				'vec3 objectTangent = vec3( tangent.xyz );',
			'#endif',*/
		].join('\n') + '\n';

		/*var extraMain = [
		    'vec3 transformed = (world * vec4( position , 1.0 )).xyz;',

			//'vec3 transformed = applyTRS( position.xyz, offset, orientation, scales );',
		].join('\n') + '\n';*/

		this.projectVertex = [
		    
		    'vec4 mvPosition = viewMatrix * vec4( transformed, 1.0 );',
			'gl_Position = projectionMatrix * mvPosition;',

		].join('\n') + '\n';

		this.worldPosVertex = [
			'#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )',
			'vec4 worldPosition = world * vec4( transformed, 1.0 );',
			'#endif',
		].join('\n') + '\n';


		this.normalVertex = [
		    'mat3 normalMtx = getNormalMatrix( viewMatrix );',
		    'vec3 transformedNormal = normalMtx * objectNormal;',

			'#ifdef FLIP_SIDED',
				'transformedNormal = - transformedNormal;',
			'#endif',
			'#ifdef USE_TANGENT',
				'vec3 transformedTangent = normalMatrix * objectTangent;',
				'#ifdef FLIP_SIDED',
					'transformedTangent = - transformedTangent;',
				'#endif',
			'#endif',
		].join('\n') + '\n';

		this.morping = [

		    '#ifdef USE_MORPHTARGETS',

				'transformed += ( morphTarget0 - position ) * morpher[ 0 ];',
				'transformed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];',
				'transformed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];',
				'transformed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];',

				'#ifndef USE_MORPHNORMALS',

				'transformed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];',
				'transformed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];',
				'transformed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];',
				'transformed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];',

				'#endif',

			'#endif',
		].join('\n') + '\n';

		this.skinningParsChunk = [
			'#ifdef USE_SKINNING',
			'precision highp sampler2DArray;',
			'uniform mat4 bindMatrix;',
			'uniform mat4 bindMatrixInverse;',
			'uniform sampler2DArray boneTexture;',
			'uniform int boneTextureSize;',
			'mat4 getBoneMatrix( const in float i ) {',
			'	float j = i * 4.0;',
			'	float x = mod( j, float( boneTextureSize ) );',
			'	float y = floor( j / float( boneTextureSize ) );',
			'	float dx = 1.0 / float( boneTextureSize );',
			'	float dy = 1.0 / float( boneTextureSize );',
			'	y = dy * ( y + 0.5 );',
			'	vec4 v1 = texture( boneTexture, vec3( dx * ( x + 0.5 ), y, gl_InstanceID ) );',
			'	vec4 v2 = texture( boneTexture, vec3( dx * ( x + 1.5 ), y, gl_InstanceID ) );',
			'	vec4 v3 = texture( boneTexture, vec3( dx * ( x + 2.5 ), y, gl_InstanceID ) );',
			'	vec4 v4 = texture( boneTexture, vec3( dx * ( x + 3.5 ), y, gl_InstanceID ) );',
			'	mat4 bone = mat4( v1, v2, v3, v4 );',
			'	return bone;',
			'}',
			'#endif'
		].join( '\n' ) + '\n';

    	var self = this;

    	this.material.onBeforeCompile = function ( shader ) {

    		shader.uniforms['cmtx'] = { value: view.camera.matrixWorldInverse };
    		shader.uniforms['morpher'] = { value: [0,0,0,0,0,0,0,0] };

    		shader.vertexShader = shader.vertexShader
    		    .replace( '#include <common>\n', '#include <common>\n' + ( view.isWebGL2 ? self.vertexPars_V2 : self.vertexPars_V1 ) )
    		    .replace( '#include <uv_vertex>', '#include <uv_vertex>\n' + self.beginInstanceVertex )
    		    .replace( '#include <defaultnormal_vertex>', self.normalVertex )
    		    .replace( '#include <project_vertex>', self.projectVertex )
    		    .replace( '#include <worldpos_vertex>', self.worldPosVertex );

    		//shader.vertexShader = ( view.isWebGL2 ? self.vertexPars_V2 : self.vertexPars_V1 ) + '\n' + shader.vertexShader;
    		//shader.vertexShader = shader.vertexShader
    		//shader.vertexShader = shader.vertexShader
    		//shader.vertexShader = shader.vertexShader.replace( '#include <begin_vertex>', extraMain );
    		//shader.vertexShader = shader.vertexShader
    		//shader.vertexShader = shader.vertexShader
    		if( self.isAnimation ) shader.vertexShader = shader.vertexShader.replace( '#include <skinning_pars_vertex>\n', self.skinningParsChunk );
    		//shader.vertexShader = shader.vertexShader.replace( '#include <morphtarget_vertex>', morping );

    		shader.fragmentShader = extraFrag + '\n' + shader.fragmentShader;

    		this.uniforms = shader.uniforms;

    		

    	};


    	//this.materialDepth = new THREE.MeshBasicMaterial({ color:0x00FF00 });


    },

    setShadow: function () {

    	this.depthMaterial = new THREE.MeshDepthMaterial( { 
    		depthPacking: THREE.RGBADepthPacking,
			skinning: this.isAnimation,
			morphTargets: this.isMorph,
	    });

	    var self = this;

	    this.depthMaterial.onBeforeCompile = function ( shader ) {

	    	shader.uniforms['cmtx'] = { value: view.camShadow.matrixWorldInverse };

	    	shader.vertexShader = shader.vertexShader
				.replace( '#include <common>\n', '#include <common>\n' + ( view.isWebGL2 ? self.vertexPars_V2 : self.vertexPars_V1 ) )
				.replace( '#include <uv_vertex>', '#include <uv_vertex>\n' + self.beginInstanceVertex )
    		   // .replace( '#include <defaultnormal_vertex>', self.normalVertex )
    		    .replace( '#include <project_vertex>', self.projectVertex )
    		    //.replace( '#include <worldpos_vertex>', self.worldPosVertex );

    		 if( self.isAnimation ) shader.vertexShader = shader.vertexShader.replace( '#include <skinning_pars_vertex>\n', self.skinningParsChunk );
	    }

    },

    update: function ( delta ) {

    	if ( this.mixers.length === 0 ) return;

    	var root = this.mixers[ 0 ]._root;
		var geometry = root.geometry;
		var skeleton = root.skeleton;

        
		//var geometry = this.geometry;
		//var skeleton = this.skeleton;
		var bones = skeleton.bones;
		var boneInverses = skeleton.boneInverses;
		var boneMatrices = skeleton.boneMatrices;
		var boneTexture = skeleton.boneTexture;
		var identityMatrix = new THREE.Matrix4();

		for ( var i = 0, il = this.num; i < il; i ++ ) {

			this.mixers[ i ].update( delta );
			this.rootBone.updateMatrixWorld();
			//identityMatrix.copy(this.rootBone.matrixWorld) 

			for ( var j = 0, jl = bones.length; j < jl; j ++ ) {

				//var matrix = bones[ j ] ? bones[ j ].matrixWorld : identityMatrix;

				//offsetMatrix.multiplyMatrices( matrix, boneInverses[ j ] );
				this.offsetMatrix.multiplyMatrices( bones[ j ].matrixWorld, boneInverses[ j ] );
				this.offsetMatrix.toArray( boneMatrices, j * 16 + i * boneTexture.image.width * boneTexture.image.height * 4 );

			}

			boneTexture.needsUpdate = true;

		}

    },

    setMixer: function () {

    	this.mixers = [];

    	for ( var i = 0; i < this.num; i ++ ) {

    		var mixer = new THREE.AnimationMixer( this.mesh );

    		var n = Math.randInt(0, 2);
    		var action;
    		if(n===0) action = mixer.clipAction( this.clips[0] );
    		else if(n===1) action = mixer.clipAction( this.clips[1] );
    		else if(n===2) action = mixer.clipAction( this.clips[2] );
    		
    		action.loop = THREE.LoopRepeat;
    		action.weight = 1;
    		action.setLoop( THREE.LoopRepeat, Infinity ).reset();
		    action.clampWhenFinished = false;
		    action.paused = false;
		    action.play()

		//action.setEffectiveWeight( 1 ).play();
    		//a
    		mixer.timeScale = 0.1 + Math.random();
    		//action.weight = Math.random() * 0.5 + 0.5;
			//action.timeScale = Math.random() * 0.5 + 0.75;

    		
    		//console.log(mixer)

    		mixer.update( 0 );
    		//

    		this.mixers.push( mixer );

    	}

    },

    setMorph: function ( v ) {

    	//this.material.uniforms.morpher.value[ 0 ] = v;
    	this.mesh.morphTargetInfluences[ 0 ] = v;
    },

    

    /*play: function ( v ) {

    	//this.material.uniforms.morpher.value[ 0 ] = v;
    	//this.morphTargetInfluences[ 0 ] = v;
    },*/

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

    	if( this.mesh !== undefined ) this.remove( this.mesh );
    	if( this.geometry !== undefined ) this.geometry.dispose();

    },

});