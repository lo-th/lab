
//-----------------------
// skeleton referency
//-----------------------

THREE.SkeletonHelper.prototype.setColor = function ( c1, c2 ) {

    var geometry = this.geometry;
    var lng = geometry.getAttribute( 'color' ).count;
    var color = geometry.getAttribute( 'color' ).array;

    var n = 0, m = 0;

    for ( var i = 0; i < lng; i ++ ) {

        n = i*3;

        if( m === 0 ){
            color[n] = c1.r;
            color[n+1] = c1.g;
            color[n+2] = c1.b;
        } else {
            color[n] = c2.r;
            color[n+1] = c2.g;
            color[n+2] = c2.b;
        } 

        m++;

        if( m === 2 ) m = 0;

    }

    geometry.getAttribute( 'color' ).needsUpdate = true;
    

}
