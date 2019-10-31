

THREE.SphereBox = function( radius, widthSegs, heightSegs, depthSegs ) {

    THREE.BufferGeometry.call( this );

    this.type = 'SphereBox';

    radius = radius || 1;

    // segments

    widthSegs = Math.floor( widthSegs ) || 8;
    heightSegs = Math.floor( heightSegs ) || 8;
    depthSegs = Math.floor( depthSegs ) || 8;


    
    var g = new THREE.BoxGeometry( 1,1,1, widthSegs, heightSegs, depthSegs ), v;

    for ( var i = 0, l = g.vertices.length; i < l; i ++ ) {

        v = g.vertices[ i ];
        v.normalize().multiplyScalar( radius );

    }

    // final geometry

    g.mergeVertices();
    g.computeVertexNormals();

    this.fromGeometry( g );
    g.dispose();

}

THREE.SphereBox.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.SphereBox.prototype.constructor = THREE.SphereBox;