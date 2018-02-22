
THREE.OrbitControlsExtra = function ( object, domElement ) {

	THREE.OrbitControls.call( this, object, domElement );

	this.followTarget = null;
    this.camTween = null;

	this.cam = {

	    isFollow: false,
	    rotation:180,
	    height:4,
	    acceleration: 0.05,
	    speed:10,
	    distance:10,

	    v: new THREE.Vector3(),
        s: new THREE.Spherical(),

	}

	this.followGroup = new THREE.Group();

    /*this.originUpdate = this.update;

    this.update = function () {

        
        if( !this.followTarget ) this.follow();
        else this.originUpdate();

    }*/

}

THREE.OrbitControlsExtra.prototype = Object.assign( Object.create( THREE.OrbitControls.prototype ), {

	constructor: THREE.OrbitControlsExtra,

	resetFollow: function () {

		this.followTarget = null;

	},

	follow: function () {

        if( !this.followTarget ) return;

        this.stopMoveCam();

        var cam = this.cam;

        this.enabled = false;
        cam.isFollow = true;

        var rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion( this.followTarget.quaternion );
        var yRotation = Math.atan2( rotMatrix.elements[8], rotMatrix.elements[10] );

        var radians = ( cam.rotation * THREE.Math.DEG2RAD ) + yRotation;

        cam.v.copy( this.followTarget.position );
        cam.v.add( { x:Math.sin(radians) * cam.distance, y:cam.height, z:Math.cos(radians) * cam.distance });
        cam.v.sub( this.object.position );
        cam.v.multiply( { x:cam.acceleration * 2, y:cam.acceleration, z:cam.acceleration * 2 } );

        var v = cam.v;

        if (v.x > cam.speed || v.x < -cam.speed) v.x = v.x < 1 ? -cam.speed : cam.speed;
        if (v.y > cam.speed || v.y < -cam.speed) v.y = v.y < 1 ? -cam.speed : cam.speed;
        if (v.z > cam.speed || v.z < -cam.speed) v.z = v.z < 1 ? -cam.speed : cam.speed;
        

        this.object.position.add( cam.v );
        this.target.copy( this.followTarget.position );
        this.object.lookAt( this.target );

        this.updateFollowGroup();

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

        if( o.constructor === Array ){ 
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

        } else if( !o ) o = {};

        o.x = o.x !== undefined ? o.x : 0;
    	o.y = o.y !== undefined ? o.y : 0;
    	o.z = o.z !== undefined ? o.z : 0;

    	o.phi = o.phi !== undefined ? o.phi : 0;
    	o.theta = o.theta !== undefined ? o.theta : 0;

    	o.phi = o.polar !== undefined ? o.polar : o.phi;
    	o.theta = o.azim !== undefined ? o.azim : o.theta;

        this.enabled = false;

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
        this.object.position.copy( this.target ).setFromSpherical( cam.s );
        this.object.lookAt( this.target );

        this.updateFollowGroup();

    },

    updateFollowGroup: function(){

    	this.followGroup.position.copy( this.target );
    	this.followGroup.position.y = 0;

    },

});