

THREE.ChamferBox = function( width, height, depth, filet, widthSegs, heightSegs, depthSegs, filetSegs ) {

    THREE.BufferGeometry.call( this );

    this.type = 'ChamferBox';

    width = width || 1;
    height = height || 1;
    depth = depth || 1;
    filet = filet || 0.1;

    // segments

    widthSegs = Math.floor( widthSegs ) || 1;
    heightSegs = Math.floor( heightSegs ) || 1;
    depthSegs = Math.floor( depthSegs ) || 1;
    filetSegs = Math.floor( filetSegs ) || 3;

    var pi = Math.PI;
    var p90 = pi * 0.5;
    var twoFilet = filet * 2;

    var midWidth = width * 0.5;
    var midHeight = height * 0.5;
    var midDepth = depth * 0.5;

    var mr = new THREE.Matrix4();
    var mt = new THREE.Matrix4();
    var mp = new THREE.Matrix4();
    
    var g = new THREE.Geometry();
    var f = new THREE.PlaneGeometry( width-twoFilet, height-twoFilet, widthSegs, heightSegs );
    var c1 = new THREE.CylinderGeometry( filet, filet, width-twoFilet, filetSegs ,widthSegs, true, 0, p90 );
    var c2 = new THREE.CylinderGeometry( filet, filet, height-twoFilet, filetSegs ,heightSegs, true, 0, p90 );
    var c3 = new THREE.SphereGeometry( filet, filetSegs, filetSegs, 0, p90, 0, -p90 );

    // front

    mt.makeTranslation( 0, midWidth - filet, 0 );
    mr.makeRotationX( p90 );
    c1.merge( c3, mt.multiply(mr));
    
    mt.makeTranslation( 0, -midWidth + filet, 0 );
    mr.makeRotationX( p90 );
    mp.makeRotationY( -p90 );
    c1.merge( c3, mt.multiply(mr).multiply(mp) );

    mt.makeTranslation( midWidth - filet, 0, -filet );
    
    f.merge( c2, mt);
    mt.makeTranslation( -midWidth + filet, 0, -filet );
    mr.makeRotationZ( pi );
    f.merge( c2, mt.multiply(mr));
    mr.makeRotationZ( p90 );
    mt.makeTranslation( 0, midHeight - filet, -filet );
    f.merge( c1, mt.multiply(mr));
    mt.makeTranslation( 0, -midHeight + filet, -filet );
    mr.makeRotationZ( -p90 );
    f.merge( c1, mt.multiply(mr));

    mt.makeTranslation( 0, 0, midDepth );
    g.merge( f, mt );

    // back

    mt.makeTranslation( 0, 0, -midDepth );
    mr.makeRotationY( pi );
    g.merge( f, mt.multiply(mr) );

    // side left

    f.dispose();
    c1.dispose();

    f = new THREE.PlaneGeometry( depth-twoFilet, height-twoFilet, depthSegs, heightSegs );
    c1 = new THREE.CylinderGeometry( filet, filet, depth-twoFilet, filetSegs, depthSegs, true, 0, p90 );

    mt.makeTranslation( 0, -(midHeight - filet), -filet, 0 );
    mr.makeRotationZ( -p90 );
    
    f.merge( c1, mt.multiply(mr));
    mt.makeTranslation( 0, midHeight - filet, -filet, 0 );
    mr.makeRotationZ( p90 );
    f.merge( c1, mt.multiply(mr));

    mt.makeTranslation( -midWidth, 0, 0 );
    mr.makeRotationY( -p90 );
    g.merge( f, mt.multiply(mr) );

    // side right

    mt.makeTranslation( midWidth, 0, 0 );
    mr.makeRotationY( p90 );
    g.merge( f, mt.multiply(mr) );

    // top

    f.dispose();
    f = new THREE.PlaneGeometry( width-twoFilet, depth-twoFilet, widthSegs, depthSegs );

    mt.makeTranslation( 0, midHeight, 0);
    mr.makeRotationX( -p90 );
    g.merge( f, mt.multiply(mr) );

    // bottom

    mt.makeTranslation( 0, -midHeight, 0);
    mr.makeRotationX( p90 );
    g.merge( f, mt.multiply(mr) );

    // clear

    f.dispose();
    c1.dispose();
    c2.dispose();
    c3.dispose();

    // final geometry

    g.mergeVertices();
    g.computeVertexNormals();

    this.fromGeometry( g );
    g.dispose();

}

THREE.ChamferBox.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.ChamferBox.prototype.constructor = THREE.ChamferBox;