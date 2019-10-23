var _offsetMatrix = new THREE.Matrix4();
var _identityMatrix = new THREE.Matrix4();

//-----------------------
// skeleton referency
//-----------------------

THREE.Skeleton.prototype.setReference = function ( ref ) {

    this.reference_skeleton = ref;

    var bone, name;

    for ( var i = 0, il = this.bones.length; i < il; i ++ ) {

        bone = this.bones[i];
        name = bone.name;
        bone.userData.idr = -1;

        for ( var j = 0, jl = ref.bones.length; j < jl; j ++ ) {

            if( !ref.bones[j].userData.phyMtx ){ 
                ref.bones[j].userData.isPhysics = false;
                ref.bones[j].userData.phyMtx = new THREE.Matrix4();
            }

            if( name === ref.bones[j].name ){ 

            	bone.userData.idr = j;

            }

        }


    }

}

//-----------------------
//
//  T pose
//
//-----------------------

THREE.Skeleton.prototype.setTPose = function ( offsets ) {

    this.reference_position = [];

    //var parent;
	var tmpOffsets = {};
	var o, b, i, lng = this.bones.length;
    var fingerName;

    var fingerGroup = ['Tho','Thu','Ind','Mid','Rin','Pin'];

	for( i = 0; i < offsets.length; i++ ){

        o = offsets[i];
        tmpOffsets[ o[0] ] = new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( THREE.Math.degToRad( o[1] ), THREE.Math.degToRad( o[2] ), THREE.Math.degToRad( o[3] ) ) );

    }

	for ( i = 0; i < lng; i ++ ) {

		b = this.bones[ i ];

		if( tmpOffsets[ b.name ] ){ 

            b.matrix.multiply( tmpOffsets[ b.name ] );
            b.matrix.decompose( b.position, b.quaternion, b.scale );
            b.updateMatrixWorld( true );

        }

        // reset Hand finger

        fingerName = b.name.substring( 1, 4 )

        if( fingerGroup.indexOf(fingerName) !== -1 ){
            b.quaternion.setFromEuler(new THREE.Euler(0,0,0));
        }

        this.reference_position.push( b.position.clone() );

	}

	this.calculateInverses();

}

THREE.Skeleton.prototype.resetPosition = function () {

    var i = this.bones.length;

    while ( i-- ) {

        this.bones[ i ].position.copy( this.reference_position[i] );

    }

}

THREE.Skeleton.prototype.setScalling = function () {

    var o, b, i, lng = this.bones.length;
    var parent;

    this.resetPosition();

    for ( i = 0; i < lng; i ++ ) {

        b = this.bones[ i ];
        parent = b.parent || null;

        if( parent !== null && parent.scalling ){

            b.position.multiply( parent.scalling );
            b.updateMatrixWorld( true );

        }

    }

    this.calculateInverses();

}


//-----------------------
//
// force local scalling
//
//-----------------------

THREE.Skeleton.prototype.update = function () {

    var bones = this.bones;
    var boneInverses = this.boneInverses;
    var boneMatrices = this.boneMatrices;
    var boneTexture = this.boneTexture;

    var bone, refBone;

    // flatten bone matrices to array

    for ( var i = 0, il = bones.length; i < il; i ++ ) {

        bone = bones[ i ];

        // compute the offset between the current and the original transform

        var matrix = bone ? bone.matrixWorld : _identityMatrix;

        // reference skeleton update

        if( this.reference_skeleton ){ 
            if( bone.userData.idr !== -1 ){ 

                refBone = this.reference_skeleton.bones[ bone.userData.idr ];
                matrix = refBone.userData.isPhysics ? refBone.userData.phyMtx : refBone.matrixWorld;

            } else if ( bone.parent.userData.idr !== -1 ) { // extra bones 

                matrix.copy( this.reference_skeleton.bones[ bone.parent.userData.idr ].matrixWorld );
                matrix.multiply( bone.matrix );

            }
        } else {
            // apply physics
            if( bone.userData.isPhysics ){ 
                matrix = bone.userData.phyMtx;

               
            }
            else if( bone.parent.userData.isPhysics ){
                matrix.copy( bone.parent.userData.phyMtx );
                matrix.multiply( bone.matrix ); 

                var children = bone.children;

                for ( var k = 0, l = children.length; k < l; k ++ ) {

                    if( !children[ k ].userData.isPhysics ) children[ k ].updateWorldMatrix( false, true );

                }
            }
        }

        // bones scalling

        if( bone.scalling !== undefined  ){

            matrix.scale( bone.scalling );

        }

        // default
      
        _offsetMatrix.multiplyMatrices( matrix, boneInverses[ i ] );
        _offsetMatrix.toArray( boneMatrices, i * 16 );
        
    }

    if ( boneTexture !== undefined ) {

        boneTexture.needsUpdate = true;

    }

}

//})();