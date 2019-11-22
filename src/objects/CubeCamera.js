
/**
 * Camera for rendering cube maps
 *	- renders scene into axis-aligned cube
 *
 * @author alteredq / http://alteredqualia.com/
 */

THREE.CubeCamera = function ( near, far, cubeResolution, options ) {

	THREE.Object3D.call( this );

	this.type = 'CubeCamera';

	this.cam = [];
	var vup = [ [0,-1,0], [0,-1,0], [0,0,1], [0,0,-1], [0,-1,0], [0,-1,0] ];
	var look = [ [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1] ];

	var c, v = new THREE.Vector3();

	for ( var i = 0; i<6; i++ ){

		c = new THREE.PerspectiveCamera( 90, 1, near, far );
	    c.up.fromArray( vup[i] );
	    c.lookAt( v.fromArray( look[i] ) );
	    this.add( c );
	    this.cam.push(c);

	}

	options = options || { format: THREE.RGBFormat, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter };

	this.renderTarget = new THREE.WebGLRenderTargetCube( cubeResolution, cubeResolution, options );
	this.renderTarget.texture.name = "CubeCamera";

}

THREE.CubeCamera.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

    constructor: THREE.CubeCamera,

    update: function ( renderer, scene ) {

		if ( this.parent === null ) this.updateMatrixWorld();

		var currentRenderTarget = renderer.getRenderTarget();

		var renderTarget = this.renderTarget;
		var generateMipmaps = renderTarget.texture.generateMipmaps;

		renderTarget.texture.generateMipmaps = false;

		for ( var i = 0; i < 6; i ++ ) {

			if(i===5) renderTarget.texture.generateMipmaps = generateMipmaps;
			renderer.setRenderTarget( renderTarget, i );
			renderer.render( scene, this.cam[i] );

		}

		renderer.setRenderTarget( currentRenderTarget );

	},

	clear: function ( renderer, color, depth, stencil ) {

		var currentRenderTarget = renderer.getRenderTarget();

		var renderTarget = this.renderTarget;

		for ( var i = 0; i < 6; i ++ ) {

			renderer.setRenderTarget( renderTarget, i );
			renderer.clear( color, depth, stencil );

		}

		renderer.setRenderTarget( currentRenderTarget );

	},

	getPixel: function ( renderer, scene, w, h, face, nFaces, gl2 ){

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
			renderer.render( scene, this.cam[i] );
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

	},

});
