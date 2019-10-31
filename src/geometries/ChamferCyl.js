
THREE.ChamferCyl = function( radiusTop, radiusBottom, height, filet, radialSegs, heightSegs, filetSegs ) {

    THREE.BufferGeometry.call( this );

    this.type = 'ChamferCyl';

    radiusTop = radiusTop !== undefined ? radiusTop : 1;
    radiusBottom = radiusBottom !== undefined ? radiusBottom : 1;
    height = height || 1;
    filet = filet || 0.1;

    radialSegs = Math.floor( radialSegs ) || 12;
    heightSegs = Math.floor( heightSegs ) || 1;
    filetSegs = Math.floor( filetSegs ) || 1;

    var mr = new THREE.Matrix4();
    var mt = new THREE.Matrix4();
    ///var my = new THREE.Matrix4();

    var pi = Math.PI;
    var p90 = pi * 0.5;
    var twoPi = pi * 2;

    var start = 0;//(twoPi / radialSegs);

    var g = new THREE.CylinderGeometry( radiusTop, radiusBottom, height-(filet*2), radialSegs, heightSegs, true, start );

    // top

    var c1 = new THREE.TorusGeometry( radiusTop-filet, filet, filetSegs, radialSegs, twoPi, 0, p90 );
    var c2 = new THREE.CircleGeometry( radiusTop-filet, radialSegs );

    mt.makeTranslation( 0,0, filet );
    c1.merge( c2, mt );

    mr.makeTranslation( 0,0,( (height*0.5) - filet) );
    mt.makeRotationX( -p90 );
    g.merge( c1, mt.multiply(mr) );

    // bottom

    c1.dispose();
    c2.dispose();

    c1 = new THREE.TorusGeometry( radiusBottom-filet, filet, filetSegs, radialSegs, twoPi, 0, p90 );
    c2 = new THREE.CircleGeometry( radiusBottom-filet, radialSegs );

    mt.makeTranslation( 0,0, filet );
    c1.merge( c2, mt );

    mr.makeTranslation( 0,0,( (height*0.5) - filet) );
    mt.makeRotationX( p90 );
    g.merge( c1, mt.multiply(mr) );

    // clear

    c1.dispose();
    c2.dispose();

    // final geometry

    g.mergeVertices();
    g.computeVertexNormals();

    this.fromGeometry( g );

    g.dispose();

}

THREE.ChamferCyl.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.ChamferCyl.prototype.constructor = THREE.ChamferCyl;