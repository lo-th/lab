THREE.CubeCamera.prototype.getPixel = function ( renderer, scene, w, h, face, nFaces, gl2 ){

	w = w || 2;
	h = h || 2;
	gl2 = gl2 || false;
	nFaces = nFaces || 6;
	face = face || 0;

	var inv255 = 1/256;

	var pixelRender = new THREE.WebGLRenderTarget( w, h, { encoding: THREE.RGBEEncoding, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: gl2 ? THREE.UnsignedByteType : THREE.FloatType } );
	//pixelRender.texture.generateMipmaps = false;
	var px = w * h * 4;
    

    var pixel = [], read;

    if ( this.parent === null ) this.updateMatrixWorld();

	var currentRenderTarget = renderer.getRenderTarget();

	var color = new THREE.Color();

	for ( var i = face; i < nFaces; i ++ ) {

		read = gl2 ? new Uint8Array( px ) : new Float32Array( px );

		renderer.setRenderTarget( pixelRender, i );
		renderer.render( scene, this.children[i] );
		renderer.readRenderTargetPixels( pixelRender, 0, 0, w, h, read );

		if( !gl2 ){

			var j = read.length; 
			while(j--) read[j] *= inv255;

		} else {

			var j = w * h, n, a;
			while(j--){

				n = j*4
				a = Math.pow( 2, read[n+3] - 128 );
				read[n+0] *= a;
				read[n+1] *= a;
				read[n+2] *= a;
				read[n+3] = 255;

			}
		}

		pixel.push( read );

	}

	renderer.setRenderTarget( currentRenderTarget );

	return pixel

}