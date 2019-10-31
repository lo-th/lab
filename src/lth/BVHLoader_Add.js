/**   _  _____ _   _   
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    Description: reads BVH files and outputs a single THREE.Skeleton and an THREE.AnimationClip
*
*/

THREE.BVHLoader.prototype = Object.assign( Object.create( THREE.BVHLoader.prototype ), {

    /*
        recursively converts the internal bvh node structure to a THREE.Bone hierarchy

        source: the bvh root node
        list: pass an empty array, collects a flat list of all converted THREE.Bones

        returns the root THREE.Bone
    */

    toBone: function ( source, list ) {

        var first = list.length === 0 ? true : false;

        var bone = new THREE.Bone();

        list.push( bone );

        if( first ){

            bone.userData.offset = source.offset.clone();
            source.offset.set(0,0,0); 

        }

        bone.position.add( source.offset );

        ///
        
        var name = this.transposeName( source.name );

        if( name === 'rShin' || name === 'rFoot' ) bone.userData.offset = source.offset;

        ///

        bone.name = name;

        if ( source.type !== 'ENDSITE' ) {

            for ( var i = 0; i < source.children.length; i ++ ) {

                bone.add( this.toBone( source.children[ i ], list ) );

            }

        }

        return bone;

    },

    /*
        compatibility for multipe BVH source
        transpose bvh name to standard TrueBones

    */

    transposeName: function( name ){

        // center

        if( name === 'Hips' || name==="SpineBase" ) name = 'hip';
        
        if( name === 'neckLower' || name === 'Neck' || name === 'Neck2') name = 'neck';
        if( name === 'Head' ) name = 'head';

        // arm
        //LeftArm

        /*if( this.isMixamoType ) {

            if( name === 'Spine' ) name = 'abdomen';
            if( name === 'Spine1' ) name = 'none';
            if( name === 'Spine2' ) name = 'chest';

            if( name === 'RightShoulder' ) name = 'rCollar';
            if( name === 'RightArm' ) name = 'rShldr';
            
            if( name === 'LeftShoulder' ) name = 'lCollar';
            if( name === 'LeftArm' ) name = 'lShldr';

        } else {*/

            if( name === 'abdomen2' || name === 'abdomenLower' || name === 'upperback' || name === 'Spine1' || name==='SpineBase2' ) name = 'abdomen';
            if( name === 'chestLower' || name === 'Spine2' || name === 'Chest' || name === 'SpineMid') name = 'chest';

            // collar

            if( name === 'RightCollar' || name === 'CollarRight' ) name = 'rCollar';
            if( name === 'LeftCollar' || name === 'CollarLeft' ) name = 'lCollar';

            // shoulder arm 

            if( name === 'rShldrTwist' || name === 'rShldrBend' || name === 'RightShoulder' || name ==='ShoulderRight' ) name = 'rShldr';
            if( name === 'lShldrTwist' || name === 'lShldrBend' || name === 'LeftShoulder' || name ==='ShoulderLeft' ) name = 'lShldr';
           
        //}

        // fore arm

        if( name === 'rForearmTwist' || name === 'rForearmBend' || name === 'RightForeArm' || name === 'RightElbow' || name === 'ElbowRight' ) name = 'rForeArm';
        if( name === 'lForearmTwist' || name === 'lForearmBend' || name === 'LeftForeArm' || name === 'LeftElbow' || name === 'ElbowLeft' ) name = 'lForeArm';

        // hand

        if( name === 'RightHand' || name === 'HandRight' ) name = 'rHand';
        if( name === 'LeftHand' || name === 'HandLeft' ) name = 'lHand';

        // leg

        if( name === 'rThighBend' || name === 'RightUpLeg' || name === 'RightHip' || name === 'HipRight' ) name = 'rThigh';
        if( name === 'RightLeg' || name === 'RightKnee' || name === 'KneeRight' ) name = 'rShin';
        if( name === 'RightAnkle' || name === 'AnkleRight' || name === 'RightFoot' || name === 'FootRight') name = 'rFoot';
        if( name === 'rToe' || name === 'RightToeBase' || name === 'RightToe' || name === 'RightLeft' ) name = 'rToes';

        if( name === 'lThighBend' || name === 'LeftUpLeg' ||name === 'LeftHip' || name === 'HipLeft'  ) name = 'lThigh';
        if( name === 'LeftLeg' || name === 'LeftKnee' || name === 'KneeLeft'  ) name = 'lShin';
        if( name === 'LeftAnkle' || name === 'AnkleLeft' || name === 'LeftFoot' || name === 'LeftRight') name = 'lFoot';
        if( name === 'lToe' || name === 'LeftToeBase' || name === 'LeftToe' || name === 'ToeLeft' ) name = 'lToes';

        /*var noFinger = true;

        
        if( noFinger ){
            var figerList = [ 'Index', 'Mid', 'Ring', 'Pinky', 'Thumb' ];
            var figerNew = [ 'I', 'M', 'R', 'P', 'T' ];
            var side = name.substring( 0, 1);
            var end = name.substring( name.length-1 );
            var fname = name.substring( 1, name.length-1);
            var id = figerList.indexOf(fname);

            if(id!==-1){ 

                name = side + figerNew[id] + end;
                
            }

        }*/

        return name;
        

    },


    ///

    parseData: function( data ){

        if (typeof data === 'string' || data instanceof String) return this.parse( data );
        else return this.parse( new TextDecoder("utf-8").decode( new Uint8Array( data ) ) );

    },

    findTime: function( times, value ){

        var lng = times.length, i, t, n = 0;

        for( i=0; i<lng; i++ ){

            t = times[i];
            if( t > value ) break;
            n = i;

        }

        return n;

    },


    findSize: function( target, source ){

        var ratio = 0.5;

        var hip = source.getBoneByName('hip');
        var thigh = source.getBoneByName('rThigh');
        var shin = source.getBoneByName('rShin');
        var foot = source.getBoneByName('rFoot');

        if( hip !== undefined && thigh !== undefined  && shin !== undefined  && foot !== undefined ){

            var sourceLegDistance = 0;
            var p = [];

            if( shin.userData.offset ){

                p[1] = new THREE.Vector3();
                p[2] = shin.userData.offset.clone();
                p[3] = foot.userData.offset.clone();

                sourceLegDistance = p[1].distanceTo( p[2] ) + p[1].distanceTo( p[3] );

            } else {

                var i = source.bones.length, b, n;
                var v = new THREE.Vector3();

                // force skeleton update
                hip.updateMatrixWorld( true );

                p[1] = thigh.getWorldPosition( v.clone() );
                p[2] = shin.getWorldPosition( v.clone() );
                p[3] = foot.getWorldPosition( v.clone() );

                sourceLegDistance = p[1].distanceTo( p[2] ) + p[2].distanceTo( p[3] );

            }

            var targetLegDistance = this.sizes[ target.name ];

            ratio = (targetLegDistance / sourceLegDistance).toFixed(2) * 1.0;

        } else {

            console.log( 'Bad bvh name = unexpected result !!' );

        }

        return ratio;

    },

    addModel: function( model, offsets, options ){

       // if( this.tPose === undefined ) this.tPose = {};
        if( this.sizes === undefined ) this.sizes = {};

        var name = model.name;
        var bones = model.skeleton.bones;
        var lng = bones.length, i, b, n, o, m;
        var v = new THREE.Vector3(), p = [];
     //   var pose = [], p = [];
       // var tmpOffsets = {};

    /*    if( offsets !== undefined ){

            for( i = 0; i < offsets.length; i++ ){

                o = offsets[i];
                tmpOffsets[ o[0] ] = new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( THREE.Math.degToRad( o[1] ), THREE.Math.degToRad( o[2] ), THREE.Math.degToRad( o[3] ) ) );

            }

        }*/


        for( i = 0; i < lng; i++ ){ 

            b = bones[ i ];

            // get id of parent bones
            if( b.parent ) b.userData['pid'] = bones.indexOf( b.parent );
            else  b.userData['pid'] = -1;

            //if( options !== undefined ) this.renameBone( b, options.names );

            n = -1;
            if( b.name === 'rThigh' ) n = 1;
            if( b.name === 'rShin' ) n = 2;
            if( b.name === 'rFoot' ) n = 3; 
            if( n!==-1 ) p[n] = b.getWorldPosition( v.clone() );

           /*if( tmpOffsets[ b.name ] ){ 

                b.matrix.multiply( tmpOffsets[ b.name ] );
                b.matrix.decompose( b.position, b.quaternion, b.scale );
                b.updateMatrixWorld();

            }

            m = b.matrixWorld.clone();

            pose.push( m );*/

        }

       // this.tPose[name] = pose;
        this.sizes[name] = p[1].distanceTo( p[2] ) + p[2].distanceTo( p[3] );

    },

    renameBone: function( bone, names ){

        for( var n in names ){
            if( bone.name === n ) bone.name = names[n];
        }

    },

    applyToModel: function ( model, result, seq, Pos, extraModel ) {

        //leg = leg || 1;
        //var hipos = model.userData.posY || 1;
        //var ratio = hipos / Math.abs( leg );
        //var model = this.model;

        // recover the bind-time world matrices
        var inverses = model.skeleton.boneInverses;

       // var tPose = this.tPose[ model.name ];

        var decal = Pos || new THREE.Vector3();

        var ratio = this.findSize( model, result.skeleton );

        var clip = result.clip;

        var lng, lngB, lngS, n, i, j, k, bone, name, tmptime, tracks; 

        var utils = THREE.AnimationUtils;

        var bones = model.skeleton.bones;
        var baseTracks = clip.tracks;
        var nodeTracks = []; // 0:position, 1:quaternion

        var times, positions, resultPositions, rotations, rotations2, resultRotations, pos, rot, rot2;

        var matrixWorld = model.matrixWorld.clone();
        var matrixWorldInv = new THREE.Matrix4().getInverse( matrixWorld );

       // var pp = new THREE.Vector3(0,0,0).setFromMatrixPosition( model.matrixWorld );
        //console.log(pp)
        //if(rootMatrix) matrixWorldInv = rootMatrix.clone();

        var globalQuat = new THREE.Quaternion();
        var globalPos = new THREE.Vector3();
        var globalMtx = new THREE.Matrix4();
        var localMtx = new THREE.Matrix4();
        var parentMtx = new THREE.Matrix4();
        var bonesMtx = new THREE.Matrix4();
        
        var resultQuat = new THREE.Quaternion();
        var resultPos = new THREE.Vector3();
        var resultScale = new THREE.Vector3();

        var extraQuat = new THREE.Quaternion();
        var extraEuler = new THREE.Euler();;
        var globalMtx2 = new THREE.Matrix4();
        // 1° get bones worldMatxix in Tpose

       // if( this.tPose === undefined ) 

        


        /*if( tPose === undefined ){

            tPose = [];
            lngB = bones.length;

            for( i = 0; i < lngB; i++ ){ 

                bone = bones[ i ];
                name = bone.name;

                if(name === 'spine1') bone.name = 'abdomen';
                if(name === 'spine2') bone.name = 'chest';

                //if( name !== 'hip' && name !== 'root' ) bone.rotation.set(0,0,0);
                //if( name === 'lThigh' || name === 'rThigh' ) bone.rotation.set(0,0,0);

                console.log( name, bone.rotation )
                tPose[i] = bone.matrixWorld.clone();

            }

        }*/

        // 2° find same name bones track 

        lngB = bones.length

        for ( i = 0; i < lngB; ++ i ) {

            bone = bones[ i ];
            name = bone.name;

            //if( name === 'root' ) bone.matrixWorld.copy( tPose[i] );
            //if( name === 'hip' ) bone.matrixWorld.copy( tPose[i] );

            //if( name === 'hip' || name === 'root' ) bone.matrixWorld.getInverse( inverses[i] );
            if( name === 'hip' ) bone.matrixWorld.getInverse( inverses[i] );

            nodeTracks[ i ] = this.findBoneTrack( name, baseTracks );

        }

        // 3° divide track in sequency

        var fp = Math.floor(clip.frameTime * 1000);
        var frametime = 1/30;
        if( fp === 33 ) frametime = 1/30;
        if( fp === 16 ) frametime = 1/60;
        if( fp === 11 ) frametime = 1/90;
        if( fp === 8 ) frametime = 1/120;

        //clip.frameTime;

        var clipName = clip.name;
        var clipStart = 0;
        var clipEnd = 0;
        var timeStart = 0;
        var timeEnd = 0;
        var startId = 0;
        var endId = 0;
        var clipLoop = 1;

        var hipId;

        var sequences = [[ clip.name, 0, clip.frames ]];

        if(seq !== undefined ) if(seq.length) sequences = seq;

        lngS = sequences.length;

        for( k = 0; k < lngS; k++ ){

            clipName = sequences[k][0];
            clipStart = sequences[k][1];
            clipEnd = sequences[k][2];//+1;
            clipLoop = sequences[k][3] !== undefined ? sequences[k][3] : 1;

            timeStart = clipStart * frametime;
            timeEnd = clipEnd * frametime;

            tracks = [];

            // 4° copy track to track with correct matrix

            lngB = bones.length;

            for ( i = 0; i < lngB; i ++ ) {

                bone = bones[ i ];
                name = bone.name;

                if( name === 'hip' ) hipId = i;

                if( nodeTracks[i].length >= 2 ){

                    // get parent matrix if existe

                    //parentMtx = bone.userData.pid !== -1 ? tPose[ bone.userData.pid ] : matrixWorldInv;
                    parentMtx = bone.userData.pid !== -1 ? inverses[ bone.userData.pid ] : matrixWorld;

                    // rotation

                    rot = nodeTracks[i][1];

                    startId = this.findTime( baseTracks[rot].times, timeStart );
                    endId = this.findTime( baseTracks[rot].times, timeEnd ) + 1;

                    tmptime = utils.arraySlice( baseTracks[rot].times, startId, endId );
                    rotations = utils.arraySlice( baseTracks[rot].values, startId * 4, endId * 4 );

                    // extra rotation test
                    rotations2 = [];

                    if( nodeTracks[i].length > 2 ){

                        rot2 = nodeTracks[i][2];

                        startId = this.findTime( baseTracks[rot2].times, timeStart );
                        endId = this.findTime( baseTracks[rot2].times, timeEnd ) + 1;

                        rotations2 = utils.arraySlice( baseTracks[rot2].values, startId * 4, endId * 4 );

                    }

                    resultRotations = [];
                    times = [];

                    lng  = tmptime.length;

                    for( j = 0; j < lng; j ++ ){

                        times[j] = tmptime[j] - timeStart;

                        n = j*4;

                        globalQuat.set( rotations[n], rotations[n+1], rotations[n+2], rotations[n+3] );

                        

                         // extra rotation test ??
                        if( rotations2.length ){ 

                            //bonesMtx.getInverse( inverses[ i ] );
                            extraQuat.set( rotations2[n], rotations2[n+1], rotations2[n+2], rotations2[n+3] );
                            //globalMtx2.identity().makeRotationFromQuaternion( extraQuat );
                            //globalMtx2.multiply( bonesMtx );
                            //globalQuat.multiply( extraQuat );

                        }



                        bonesMtx.getInverse( inverses[ i ] );
                        globalMtx.identity().makeRotationFromQuaternion( globalQuat );
                        //if( rotations2.length ) globalMtx.multiply( globalMtx2 );
                        //globalMtx.multiply( tPose[i] );
                        globalMtx.multiply( bonesMtx );

                       

                        //localMtx.identity().getInverse( parentMtx );
                        localMtx.copy( parentMtx );
                        localMtx.multiply( globalMtx );
                        //if( rotations2.length )localMtx.multiply( globalMtx2 );
                        localMtx.decompose( resultPos, resultQuat, resultScale );

                        resultQuat.normalize();

                        resultRotations[n] = resultQuat.x;
                        resultRotations[n+1] = resultQuat.y;
                        resultRotations[n+2] = resultQuat.z;
                        resultRotations[n+3] = resultQuat.w;

                    }

                    if( times.length > 0 ) tracks.push( new THREE.QuaternionKeyframeTrack( ".bones[" + name + "].quaternion", times, resultRotations ) );

                }

            }

            // HIP position 

            i = hipId;
            bone = bones[ i ];
            name = bone.name;

            if( nodeTracks[i].length === 2 ){

                parentMtx = bone.parent ? bone.parent.matrixWorld : matrixWorldInv;

                pos = nodeTracks[i][0];
                
                startId = this.findTime( baseTracks[pos].times, timeStart );
                endId = this.findTime( baseTracks[pos].times, timeEnd ) + 1;

                tmptime = utils.arraySlice( baseTracks[pos].times, startId, endId );
                positions = utils.arraySlice( baseTracks[pos].values, startId * 3, endId * 3 );

                times = [];
                resultPositions = [];

                lng = tmptime.length;

                for( j = 0; j < lng; j++ ){

                    times[j] = tmptime[j] - timeStart;

                    n = j*3;

                    globalPos.set( positions[n], positions[n+1], positions[n+2] );
                    globalPos.multiplyScalar( ratio );
                    globalPos.add(decal);

                    globalMtx.identity();
                    globalMtx.setPosition( globalPos );
                   
                    localMtx.identity().getInverse( parentMtx );
                    localMtx.multiply( globalMtx );

                    localMtx.decompose( resultPos, resultQuat, resultScale );

                    resultPositions[n] = resultPos.x;
                    resultPositions[n+1] = resultPos.y;
                    resultPositions[n+2] = resultPos.z;

                }

                if( times.length > 0 ) tracks.push( new THREE.VectorKeyframeTrack( ".bones[" + name + "].position", times, resultPositions ) );

            }

            // 5° apply new clip to model

            var newClip = new THREE.AnimationClip( clipName, -1, tracks );
            newClip.frameTime = frametime;
            newClip.repeat = clipLoop === 1 ? true : false;
            newClip.timeScale = 1;

            if( extraModel ) extraModel.addAnimation( newClip );

            if( model.addAnimation ) model.addAnimation( newClip );
            else return newClip;

        }

    },

    findBoneTrack: function( name, tracks ){

        var n, nodeName, type, result = [];
        //var i = tracks.length;
        //while( i-- ){
        for ( var i = 0; i < tracks.length; ++ i ) {
            n = tracks[i].name;

            nodeName =  n.substring( n.indexOf('[')+1, n.indexOf(']') );
            type = n.substring( n.lastIndexOf('.')+1 );


            nodeName = this.transposeName( nodeName );

            if( name === nodeName ){
                if( type === 'position' ) result[0] = i;
                else { 
                    if( result[1] ) { console.log('same bone ?', nodeName ); result[2] = i; }
                    result[1] = i;
                }
            } 

        }

        return result;

    }

});