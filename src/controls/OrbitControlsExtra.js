
THREE.OrbitControlsExtra = function ( object, domElement ) {

	THREE.OrbitControls.call( this, object, domElement );

	this.followTarget = null;
    this.camTween = null;

    this.isDecal = false;

	this.cam = {

	    //isFollow: false,
	    theta:180,
        phi:20,
	    height:0.6,
	    acceleration: 0.05,
	    speed:10,
	    distance:10,

	    v: new THREE.Vector3(),
        d: new THREE.Vector3(),
        s: new THREE.Spherical(),
        tmp: new THREE.Vector3(),
        old: new THREE.Vector3(),
        oldObj: new THREE.Vector3(),

        offset: new THREE.Vector3(),
        decal:[0,0,0],

        //isDecal: false,
        start: false

	}

	this.followGroup = view.getFollowGroup();

    /*this.originUpdate = this.update;

    this.update = function () {

        
        if( !this.followTarget ) this.follow();
        else this.originUpdate();

    }*/

}

THREE.OrbitControlsExtra.prototype = Object.assign( Object.create( THREE.OrbitControls.prototype ), {

	constructor: THREE.OrbitControlsExtra,

    upExtra: function (z){

        //console.log(z)
        this.cam.distance *= z

    },

    initFollow: function ( mesh, o ) {

        o = o || {};

        var cam = this.cam;

        this.followTarget = mesh;

        cam.height = o.height !== undefined ? o.height : 0.6;
        cam.d.set(0,this.cam.height,0);

        cam.theta = o.theta !== undefined ? o.theta : 180;
        cam.phi = o.phi !== undefined ? o.phi : 20;
        cam.distance = o.distance !== undefined ? o.distance : 10;
        
        cam.acceleration = o.acceleration !== undefined ? o.acceleration : 0.05;
        cam.speed = o.speed !== undefined ? o.speed : 10;

        cam.decal = o.decal !== undefined ? o.decal : [0,0,0];

        cam.offset.fromArray( this.cam.decal );

        cam.start = true;

        //var sph = this.getSpherical();

        this.stopMoveCam();
        
    },

	resetFollow: function () {

		this.followTarget = null;
        //this.cam.isFollow = false;
        this.enabled = true;

	},

	follow: function () {

        if( !this.followTarget ) return;

        var cam = this.cam;

        var p = this.followTarget.position;
        //p.add(this.cam.offset);

        //this.target.copy( p ).add(this.cam.offset);

       // var dist = cam.start ? 10 : p.distanceTo( cam.old );
      //  var state = cam.start ? -1 : this.getState();
        var dist = p.distanceTo( cam.old );
        var state = this.getState();
        var sph = this.getSpherical();
        

        if( this.isDecal ){

            //this.followGroup.position.sub( cam.old );
            //console.log(cam.old)
            var yy = this.object.position.y;
            this.object.position.sub( cam.old );
            this.object.position.y = yy;
            this.target.copy( p ).add(cam.d);
            this.object.lookAt( this.target ); 

        }

        //this.enabled = false;
        //cam.isFollow = true;

        var rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion( this.followTarget.quaternion );
        var tRotation = Math.atan2( rotMatrix.elements[8], rotMatrix.elements[10] );//yaw
        //var pRotation = Math.atan2( rotMatrix.elements[1], rotMatrix.elements[5] );//roll
        //var pRotation = Math.atan2( rotMatrix.elements[0], rotMatrix.elements[3] );

        var theta = ( cam.theta * THREE.Math.DEG2RAD ) + tRotation;// + this.getAzimuthalDeltaAngle();
        var phi = ( (90-cam.phi) * THREE.Math.DEG2RAD );
        

        var radius = cam.distance;//sph.radius;//cam.distance;

        if(cam.start){

        	if( Math.abs(sph.radius-cam.distance) < 1  && Math.abs(sph.phi-phi)<0.1 ){ 

        		cam.start = false;
        	}
        }

        if( state === 0 || state === 3 || dist < 0.01 ){ phi = sph.phi; theta = sph.theta; radius = sph.radius;/*cam.distance = sph.radius;*/ }
        if( state === -1 && !cam.start ) { sph.phi = phi; sph.theta = theta;  sph.radius = radius;/*radius = cam.distance;*/ } 

        cam.s.set( radius, phi, theta );
        cam.s.makeSafe();

        //
        
        cam.tmp.setFromSpherical( cam.s );

        cam.v.copy( p ).add( cam.offset ).add( cam.d );
        cam.v.add( cam.tmp )//{ x:Math.sin(radians) * cam.distance, y:cam.height, z:Math.cos(radians) * cam.distance });
        cam.v.sub( this.object.position );
        cam.v.multiply( { x:cam.acceleration * 2, y:cam.acceleration, z:cam.acceleration * 2 } );

    
        var v = cam.v;

        if (v.x > cam.speed || v.x < -cam.speed) v.x = v.x < 1 ? -cam.speed : cam.speed;
        if (v.y > cam.speed || v.y < -cam.speed) v.y = v.y < 1 ? -cam.speed : cam.speed;
        if (v.z > cam.speed || v.z < -cam.speed) v.z = v.z < 1 ? -cam.speed : cam.speed;
        
        //if(!cam.isDecal) 
        this.object.position.add( cam.v );
        this.target.copy( p ).add( this.cam.offset ).add( cam.d );
        this.object.lookAt( this.target );

        //cam.distance = sph.radius

        this.updateFollowGroup();

        if( !cam.start ) cam.old.copy( p );

        if( this.isDecal ) this.isDecal = false
        //cam.oldObj.copy( this.object.position );

    },


    updateFollowGroup: function( p ){

        this.followGroup.position.copy( this.target );
        this.followGroup.position.y = 0;

    },

    getInfo: function () {

        this.update();

        var t = this.target;
        var c = this.object.position;
        return {
            x:t.x, y:t.y, z:t.z, 
            distance: Math.floor( c.distanceTo( t )), 
            phi: -Math.floor( this.getPolarAngle() * THREE.Math.RAD2DEG ) + 90,
            theta: Math.floor( this.getAzimuthalAngle() * THREE.Math.RAD2DEG )
        };

    },

    stopMoveCam: function (){

        if( this.camTween !== null ){
            TWEEN.remove( this.camTween );
            this.camTween = null;
        }

    },

    moveCam: function ( o, callback ) {

    	var self = this;
        var c = this.getInfo();

        if( o === undefined ) o = {}

        /*if( o.constructor === Array ){ 
           //var t = o;
            var tmp = {};

            if(o[0]) tmp.azim = o[0];
            if(o[1]) tmp.polar = o[1];
            if(o[2]) tmp.distance = o[2];
            if( o[3] ){
                tmp.x = o[3][0];
                tmp.y = o[3][1];
                tmp.z = o[3][2];
            }

            o = tmp;

        } else if( !o ) o = {};*/

        o.x = o.x !== undefined ? o.x : c.x;
    	o.y = o.y !== undefined ? o.y : c.y;
    	o.z = o.z !== undefined ? o.z : c.z;

        o.distance = o.distance !== undefined ? o.distance : c.distance;

        if(o.target){
            o.x = o.target[0];
            o.y = o.target[1];
            o.z = o.target[2];
        }

    	o.phi = o.phi !== undefined ? o.phi : 0;
    	o.theta = o.theta !== undefined ? o.theta : 0;

    	o.phi = o.polar !== undefined ? o.polar : o.phi;
    	o.theta = o.azim !== undefined ? o.azim : o.theta;

        //this.enabled = false;

        if( o.time === 0 ){

            for( var n in o ) c[n] = o[n];
            this.stopMoveCam();
            this.orbit( c );
            this.enabled = true;
            return;

        }

        callback = callback || function(){};

        this.camTween = new TWEEN.Tween( c ).to( o, o.time || 2000 )
            .delay( o.delay || 0 )
            .easing( o.tween || TWEEN.Easing.Quadratic.Out )
            .onUpdate( function() { self.orbit( c ); } )
            .onComplete( function() { self.enabled = true;  callback(); } )
            .start();

    },

    orbit: function ( o ) {

    	var cam = this.cam;

        cam.s.set( o.distance, (-o.phi+90) * THREE.Math.DEG2RAD, o.theta * THREE.Math.DEG2RAD );
    	cam.s.makeSafe();

        this.target.set( o.x, o.y, o.z );
        this.object.position.set( 0,0,0 ).setFromSpherical( cam.s ).add( this.target );
        this.object.lookAt( this.target );

        //this.updateFollowGroup();

    },

    

});