/**
 * @author lth / https://github.com/lo-th
 */

function SkeletonPhysics( object ) {

	//this.bones = object.skeleton.bones;
	this.nodes = [];
	this.upMtx = [];
	this.isShow = false;
	this.isReady = false;
	this.isRagdoll = false;

	this.engine = physic.getEngine();

	/*var bone;
	for ( var i = 0, il = this.nodes.length; i < il; i ++ ) {
		//bone = this.bones[ this.nodes[i].userData.boneId ];//
		bone = this.nodes[i].userData.bone;
		bone.userData.isPhysics = true;
		//bone.userData.phyMtx = new THREE.Matrix4();
	}*/

	THREE.Object3D.call( this );

	this.matrix = object.matrixWorld;
	this.matrixAutoUpdate = false;

	this.init( object );
	this.addLinks();


}

SkeletonPhysics.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

	constructor: SkeletonPhysics,

	updateMatrixWorld: function ( force ) {

		if( !this.isReady ) return;

		var mtx = new THREE.Matrix4();
		var mtx2 = new THREE.Matrix4();
		var p = new THREE.Vector3();
	    var s = new THREE.Vector3();
	    var q = new THREE.Quaternion();


		var nodes = this.nodes;

		this.upMtx = [];

		var node, bone;

		var i = nodes.length;

		while( i-- ){

		//for ( var i = 0, lng = nodes.length; i < lng; i ++ ) {

			node = nodes[i];
			bone = node.userData.bone;
			//bone = bones[ node.userData.boneId ];
			//bone.userData.isPhyics = true;

			if( node.userData.isKinematic ){

				mtx.multiplyMatrices( bone.matrixWorld, node.userData.decal ).decompose( p, q, s );
				this.upMtx.push( { name:node.name, pos:p.toArray(), quat:q.toArray(), clamped:true  } );

				bone.userData.phyMtx.copy( bone.matrixWorld );

				//if(node.name ==='hip') console.log(p.x)

			} else {

				mtx
                .copy( node.matrixWorld )
                .decompose( p, q, s )
                .compose( p, q, s.set( 1, 1, 1 ) )
                .multiply( node.userData.decalinv );

                if ( bone.parent && bone.parent.isBone ) {

                        mtx2.getInverse( bone.parent.matrixWorld );
                        mtx2.multiply( mtx );

                    } else {

                        mtx2.copy( mtx );

                    }

                bone.userData.phyMtx.copy( mtx );

			}

		}

		//this.engine.matrix( this.upMtx, true );

    },

	ragdoll: function ( b ) {

        if( !this.isReady ) return

        var nodes = this.nodes;

        var i = nodes.length, b, bone;

        this.isRagdoll = b;

        var isK = this.isRagdoll ? false : true;

        var r = [];

        while(i--){

            b = nodes[i];
            bone = b.userData.bone;
	        bone.userData.isPhysics = isK ? false : true;

            b.userData.isKinematic = isK ? true : false;
            r.push({ 
                name: b.name, 
                flag: isK ? 2 : 0, 
                gravity: isK ? false : true,
                damping: isK ? [0,0] : [0.05,0.85],
            });

        }

        physic.getEngine().options( r );
        
    },

	init: function ( object ) {


	    // get character bones
		var bones = object.skeleton.bones;

		var nodes = [];

		var mat = new THREE.MeshLambertMaterial( { color: 0x40FF40, name: 'bones', wireframe: true, depthTest:false, depthWrite:true, transparent:true, opacity:0.1 } )

        var fingers = [ 'Thumb', 'Index', 'Mid', 'Ring', 'Pinky' ];

        var p = new THREE.Vector3();
        var s = new THREE.Vector3();
        var q = new THREE.Quaternion();
        var e = new THREE.Euler();
        var mtx = new THREE.Matrix4();

        var tmpMtx = new THREE.Matrix4();
        var tmpMtxR = new THREE.Matrix4();

        var p1 = new THREE.Vector3();
        var p2 = new THREE.Vector3();
        var i, lng = bones.length, name, n, boneId, bone, parent, finger;
        var size, dist, type, mesh, r, kinematic, translate, rot;

        for( i = 0; i < lng; i++ ){

            type = null;
            bone = bones[i];
            name = bone.name;

            if( bone.parent && bone.parent.isBone ) {

                parent = bone.parent;
                n = parent.name;
                finger = n.substring( 1, n.length-1 );
                boneId = bones.indexOf( parent );

                rot = [0,0,90];

                // get distance between bone and parent
                p1.setFromMatrixPosition( parent.matrixWorld );
                p2.setFromMatrixPosition( bone.matrixWorld );
                dist = p1.distanceTo( p2 );

                translate = [ -dist * 0.5, 0, 0 ];
                size = [ dist, 1, 1 ];
                kinematic = true;

                // body
                if( n==='head' ){ type = 'capsule'; size = [ 7.5, 8.6, 7.5 ]; }
                if( n==='neck' && name==='head' ){    type = 'box'; size = [ dist, 6, 6 ]; rot[2] = 0; }
                if( n==='chest' && name==='neck' ){   type = 'box'; size = [ dist, 15, 13 ]; rot[2] = 0; }
                if( n==='abdomen' && name==='chest'){ type = 'box'; size = [ dist, 14, 12 ]; rot[2] = 0; }
                //if( n==='hip' && name==='abdomen' ){  type = 'box'; size = [ dist, 13, 11 ]; r = 0; }
                if( n==='hip' && name==='abdomen' ){  type = 'capsule'; size = [ 8, 24.4, 8 ]; translate = [ 0, 0, 0 ]; rot[2] = 0; }
                // arms
                if( n==='lCollar' || n==='rCollar' ){    type = 'cylinder'; size = [ 5, dist, 5 ]; }
                if( n==='rShldr' && name==='rForeArm' ){ type = 'capsule'; size = [ 5, dist+25, 5 ]; }
                if( n==='lShldr' && name==='lForeArm' ){ type = 'capsule'; size = [ 5, dist+25, 5 ]; }
                if( n==='rForeArm' && name==='rHand' ){  type = 'cylinder'; size = [ 2.6, dist, 2.6 ]; }
                if( n==='lForeArm' && name==='lHand' ){  type = 'cylinder'; size = [ 2.6, dist, 2.6 ]; }
                // hand
                if( n==='rHand' && name==='rMid1' ){  type = 'box'; size = [ dist, 2, 4 ];  translate = [ -dist * 0.5, 0.5, 0 ]; rot[2] = -5;}
                if( n==='lHand' && name==='lMid1' ){  type = 'box'; size = [ dist, 2, 4 ];  translate = [ -dist * 0.5, -0.5, 0 ]; rot[2] = 5;}
                // fingers
                if( fingers.indexOf(finger) !== -1 ){

                	var fnum = 4 - Number(n.substring( n.length-1 ));
                    var fs = finger === 'Thumb' ? 1+(fnum*0.25) : 1+(fnum*0.1);
                    type = 'box'; size = [ dist, fs, fs ];
                    rot[2] = 0;

                }
                // legs
                if( n==='rThigh' && name==='rShin' ){ type = 'cylinder'; size = [ 8, dist, 8 ]; }
                if( n==='lThigh' && name==='lShin' ){ type = 'cylinder'; size = [ 8, dist, 8 ]; }
                if( n==='rShin' && name==='rFoot' ){  type = 'cylinder'; size = [ 6, dist, 6 ]; }
                if( n==='lShin' && name==='lFoot' ){  type = 'cylinder'; size = [ 6, dist, 6 ]; }
                // foot
                if( n==='rFoot' && name==='rToes' ){ type = 'box'; size = [ 7, 7, dist ]; r = 0; translate = [ -5, 0, -(dist * 0.5)+5 ]; rot = [0,0,0]; }
                if( n==='lFoot' && name==='lToes' ){ type = 'box'; size = [ 7, 7, dist ]; r = 0; translate = [ -5, 0, -(dist * 0.5)+5 ]; rot = [0,0,0]; }
                if( n==='rToes' ){ type = 'box'; size = [ dist+1, 7, 3 ]; r = 0; translate = [ (-dist * 0.5)-0.5, 0, -1.5 ]; rot[2] = 0; }
                if( n==='lToes' ){ type = 'box'; size = [ dist+1, 7, 3 ]; r = 0; translate = [ (-dist * 0.5)-0.5, 0, -1.5 ]; rot[2] = 0; }


                if( type !== null ){

                    // translation
                    tmpMtx.makeTranslation( translate[0], translate[1], translate[2] );
                    // rotation
                    tmpMtxR.makeRotationFromEuler( e.set( rot[0]*Math.torad, rot[1]*Math.torad, rot[2]*Math.torad ) );
                    tmpMtx.multiply( tmpMtxR );
                   
                     
                    mtx.multiplyMatrices( parent.matrixWorld, tmpMtx );
                    mtx.decompose( p, q, s );

                    var mass = (size[0]+size[1]+size[2]);

                    mesh = physic.getEngine().add({

                        name: n,
                        mass: mass,
                        type: type,
                        size: size,
                        pos: p.toArray(),
                        quat: q.toArray(),
                        kinematic: kinematic,
                        friction: 0.5,//kinematic ? 0 : 1, 
                        restitution:0.1,

                        material:mat,

                        //linear: kinematic ? 0 : 0.5,
                        //angular: kinematic ? 0 : 2,

                        //group: kinematic ? 2 : 1,
                        //mask: kinematic ? 1 : 2,

                        //state: 4,
                        //flag:2
                        neverSleep:true,

                    });

                    mesh.visible = false;
                    mesh.userData.isKinematic = kinematic;
                    mesh.userData.decal = tmpMtx.clone();
                    mesh.userData.decalinv = new THREE.Matrix4().getInverse( tmpMtx );
                    //mesh.userData.boneId = boneId;
                    mesh.userData.bone = parent;

                    parent.userData.isPhysics = true;

                    mesh.castShadow = false;
                    mesh.receiveShadow = false;

                    nodes.push( mesh );

                }
            }

        }

        this.nodes = nodes;

        this.isReady = true;

	},

	show: function ( b ) {

		if( b !== undefined ) this.isShow = b;

		var i = this.nodes.length;
		while( i-- ){
			this.nodes[i].visible = this.isShow;
		}

	},

	clear: function () {

		var bone;
	    var i = this.nodes.length;
		while( i-- ){
		//for( var i=0, lng = this.nodes.length; i<lng; i++ ){
			bone = this.nodes[i].userData.bone;
	        bone.userData.isPhysics = false;
	        //bone.userData.phyMtx = new THREE.Matrix4();
	    }

		this.nodes = [];
		this.upMtx = [];
		this.matrix = new THREE.Matrix4();

	},

    addLinks: function () {

        var low = [-45, -60, -45];
        var high = [45, 60, 45]

        this.makeLink(  'hip', 'abdomen',  [-10,-40,-10] , [10,40,10], 'joint_conetwist', [0,0,0], [0,0,0], [ -45, 45 ] );
        this.makeLink( 'abdomen', 'chest', low, high , 'joint_conetwist', [0,0,0], [0,0,0], [ -45, 45 ]);
        this.makeLink( 'chest', 'neck', low, high, 'joint_conetwist', [0,0,0], [0,0,0], [ -45, 45 ] );
        this.makeLink( 'neck', 'head', low, high, 'joint_conetwist', [0,0,0], [0,0,0], [ -45, 45 ] );

        return;

        // symetry

        for (var i = 0; i<2; i++){
            
            var s = i === 0 ? 'r' : 'l';

            low = [-45, -60, -45];
            high = [45, 60, 45]

            // leg
            //this.makeLink( 'hip', s + 'Thigh', [-90,-90,-90] , [90,90,90] );
            this.makeLink( 'hip', s + 'Thigh', [-90,-90,-90] , [90,90,90], 'joint_conetwist', [0,0,0], [0,0,0], [ -80, 80 ] );
            this.makeLink( s + 'Thigh', s + 'Shin', [-5,-180,-5] , [5,5,5], 'joint_hinge', [1,0,0], [1,0,0], [ -2, 160 ] );
            //this.makeLink( s + 'Thigh', s + 'Shin', [-5,-140,-5] , [5,5,5] );
            this.makeLink( s + 'Shin', s + 'Foot', [-45,-45,-45] , [45,45,45], 'joint_conetwist', [0,0,0], [0,0,0], [ -45, 45 ] );
            this.makeLink( s + 'Foot', s + 'Toes', [-5,-45,-5] , [5,45,5])///, 'joint_hinge', [1,0,0], [1,0,0], [ -45, 45 ] );

            // arm
            this.makeLink( 'chest', s + 'Collar', [-5,-5,-5] , [5,5,5])//, 'joint_conetwist', [0,0,0], [0,0,0], [ -2, 2 ] );
            this.makeLink( s + 'Collar', s + 'Shldr', low , high, 'joint_conetwist', [0,0,0], [0,0,0], [ -160, 160 ] );
            this.makeLink( s + 'Shldr' , s + 'ForeArm', [-5,-180,-5] , [5,5,5], 'joint_hinge', [1,0,0], [1,0,0], [ -2, 160 ] );
            this.makeLink( s + 'ForeArm', s + 'Hand', [0,-10,0] , [0,10,0], 'joint_conetwist', [0,0,0], [0,0,0], [ -45, 45 ] );

            // finger

            low = [0, 0, -90];
            high = [0, 0, 90];

            var aa = i === 0 ? [ -90, 0 ] : [ 0, 90 ];

            var fingers = [ 'Thumb', 'Index', 'Mid', 'Ring', 'Pinky' ], name;

            for(var j = 0; j < fingers.length; j++) {

            	name = fingers[j];
            	this.makeLink( s + 'Hand', s + name + '1', low , high, 'joint_hinge', [0,0,1], [0,0,1], aa );
	            this.makeLink( s + name + '1', s + name + '2', low , high, 'joint_hinge', [0,0,1], [1,0,0], aa );
	            this.makeLink( s + name + '2', s + name + '3', low , high, 'joint_hinge', [0,0,1], [0,0,1], aa );

            }

        }


    },

    makeLink: function ( A, B, low, high, type, a1, a2, limit ){


    	var torad = Math.PI / 180;

        var a = physic.byName(A);
        var b = physic.byName(B);

        var s = new THREE.Vector3();
        var p1 = new THREE.Vector3();
        var p2 = new THREE.Vector3();
        var q = new THREE.Quaternion();
        var q1 = new THREE.Quaternion();
        var q2 = new THREE.Quaternion();

        var mtx = new THREE.Matrix4();
        var m = new THREE.Matrix4();
        var m2 = new THREE.Matrix4();
        var e = new THREE.Euler();

        mtx.copy( b.userData.decalinv ).decompose( p2, q2, s );
        mtx.copy( a.userData.decalinv ).decompose( p1, q1, s );

        b.updateMatrixWorld( true );
        a.updateMatrixWorld( true );

        //console.log( a.up, b.up )

        

        

        //var d = new THREE.Vector3().subVectors( b.position, a.position ).normalize().applyEuler( e.set( 90*torad,180*torad,0 ) );

        

        //mtx.copy( b.userData.decalinv ).multiply( a.matrixWorld );
        //m.multiplyMatrices( mtx, m2.getInverse( a.matrixWorld ) );
        //m.decompose( p1, q1, s );
        //mtx.multiply( m.getInverse( a.matrixWorld ) ).decompose( p1, q1, s );




        p1 = b.localToWorld( p2.clone() )
        p1 = a.worldToLocal( p1 );

        if( A==="hip" && B==="rThigh" ) q1.multiply( q.setFromEuler( e.set( 180*torad,180*torad,0 ) ) );
        if( A==="hip" && B==="lThigh" ) q1.multiply( q.setFromEuler( e.set( 180*torad,180*torad,0 ) ) );

        if( A==="chest" && B==="rCollar" ) q1.multiply( q.setFromEuler( e.set( 180*torad,0*torad,90*torad ) ) );
        if( A==="chest" && B==="lCollar" ) q1.multiply( q.setFromEuler( e.set( 180*torad,0*torad,-90*torad ) ) );

        if( A==="rForeArm" && B==="rHand" ) q1.multiply( q.setFromEuler( e.set( 180*torad,0*torad,0*torad ) ) );
        if( A==="lForeArm" && B==="lHand" ) q1.multiply( q.setFromEuler( e.set( 180*torad,0*torad,0*torad ) ) );

        if( A==="rFoot" && B==="rToes" ){ q2.multiply( q.setFromEuler( e.set( 0*torad,90*torad,0 ) ) ); }
        if( A==="lFoot" && B==="lToes" ){ q2.multiply( q.setFromEuler( e.set( 0*torad,90*torad,0 ) ) ); }



        if(a1 && a2){

            var dirA = new THREE.Vector3().fromArray(a1).applyQuaternion(q1).normalize()
            var dirB = new THREE.Vector3().fromArray(a2).applyQuaternion(q2).normalize()

            a1 = dirA.toArray();
            a2 = dirB.toArray();


            //console.log( A, B, dirA )
        }
        //if(a.userData.r !== b.userData.r) {
          //  console.log(A,B)

         //   q1.multiply( q.setFromEuler( e.set( 0, 0, a.userData.r*torad ) ).inverse() );
        //    q2.multiply( q.setFromEuler( e.set( 0, 0, b.userData.r*torad ) ).inverse() );
        //}

        //p1 = p2.clone().applyMatrix4( b.matrixWorld );
        //p1.applyMatrix4( m.getInverse( a.matrixWorld ) );

        q1.normalize();
        q2.normalize();

      
       // this.testPoint( a, p1, q1, 0xFFFF00 );
       // this.testPoint( b, p2, q2, 0x00FFFF );



        physic.getEngine().add( this.link( A, B, p1.toArray(), p2.toArray(), q1.toArray(), q2.toArray(), low, high, type, a1, a2, limit  )  );

    },

    testPoint: function ( mesh, p, q, color ){

        var m = new THREE.Mesh( new THREE.CircleBufferGeometry( 0.25, 5 ), new THREE.MeshBasicMaterial( { color:color }));
        m.rotation.x = -Math.PI*0.5;
        //var a = new THREE.AxesHelper(1);
        //var d = new THREE.ArrowHelper( undefined,undefined, 0.5, color, undefined, 0.15 );
        m.position.copy( p );
        m.quaternion.copy( q );
        mesh.add( m );
        //m.add(a)
        //m.add(d)

    },

    vectorad: function ( r ) {

        var i = r.length;
        while(i--) r[i] *= Math.PI / 180;
        return r;

    },

    link: function ( b1, b2, pos1, pos2, q1, q2, low, high, type, a1, a2, limit ){

    	var epsilon = 0.00000001;

        /*var rlow = this.vectorad( low );
        var rhigh = this.vectorad( high );

        if( rlow[0] === 0 ) rlow[0] = -epsilon;
        if( rlow[1] === 0 ) rlow[1] = -epsilon;
        if( rlow[2] === 0 ) rlow[2] = -epsilon;

        if( rhigh[0] === 0 ) rhigh[0] = epsilon;
        if( rhigh[1] === 0 ) rhigh[1] = epsilon;
        if( rhigh[2] === 0 ) rhigh[2] = epsilon;*/

        //console.log(rlow,rhigh )

        return {

            //type:'joint',
            type: type || 'joint_spring_dof',
            //type:'joint_conetwist',
            //type:'joint_hinge',
            //type:'joint_dof',
            b1:b1, 
            b2:b2,
            pos1:pos1,
            pos2:pos2,
            quatA: q1 ? q1 : undefined,
            quatB: q2 ? q2 : undefined,

            useA:true,

            axe1: a1 || [1,0,0],
            axe2: a2 || [1,0,0],
            //limit: limit || [ -45, 45, 0.9, 0.3, 1 ],
            //spring:[2,0.3,0.1],
            collision: false,

            

            
            linLower:[-epsilon,-epsilon,-epsilon],
            linUpper:[epsilon,epsilon,epsilon],
            //linLower:[-1,-1,-1],
            //linUpper:[1,1,1],

            angLower: low,
            angUpper: high,

            //spring:[0,0,0,  0.5,0.5,0.5],
            //damping:[0,0,0,  0.01,0.01,0.01],

           // enableSpring:[0,true],
           // stiffness:[0, 39.478],
           // damping:[0, 0.01],
            

            //springPosition:[0,0,0],
            //springRotation:[0,1,0],

        }

    },

});

