// The total height is height+2*radius, so the height is just the height between the center of each 'sphere' of the capsule caps

THREE.Capsule = function( radius, height, radialSegs, heightSegs ) {

    THREE.BufferGeometry.call( this );

    this.type = 'Capsule';

    radius = radius || 1;
    height = height || 1;

    var pi = Math.PI;

    radialSegs = Math.floor( radialSegs ) || 12;
    var sHeight = Math.floor( radialSegs * 0.5 );

    heightSegs = Math.floor( heightSegs ) || 1;
    var o0 = Math.PI * 2;
    var o1 = Math.PI * 0.5;
    var g = new THREE.Geometry();
    var m0 = new THREE.CylinderGeometry( radius, radius, height, radialSegs, heightSegs, true );

    var mr = new THREE.Matrix4();
    var m1 = new THREE.SphereGeometry( radius, radialSegs, sHeight, 0, o0, 0, o1);
    var m2 = new THREE.SphereGeometry( radius, radialSegs, sHeight, 0, o0, o1, o1);
    var mtx0 = new THREE.Matrix4().makeTranslation( 0,0,0 );
   // if(radialSegs===6) mtx0.makeRotationY( 30 * THREE.Math.DEG2RAD );
    var mtx1 = new THREE.Matrix4().makeTranslation(0, height*0.5,0);
    var mtx2 = new THREE.Matrix4().makeTranslation(0, -height*0.5,0);
    mr.makeRotationZ( pi );
    g.merge( m0, mtx0.multiply(mr) );
    g.merge( m1, mtx1);
    g.merge( m2, mtx2);

    g.mergeVertices();
    g.computeVertexNormals();

    m0.dispose();
    m1.dispose();
    m2.dispose();

    this.fromGeometry( g );

    g.dispose();

}

THREE.Capsule.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.Capsule.prototype.constructor = THREE.Capsule;