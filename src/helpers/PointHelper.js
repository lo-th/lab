

THREE.PointHelper = function ( size, color ) {

	size = size || 1;

	var sx = size * 0.5;
	var mx = size * 0.1;

	var vertices = [
		-sx, 0, 0,	sx, 0, 0,
		0, -sx, 0,	0, sx, 0,
		0, 0, -sx,	0, 0, sx,


		-mx, mx, mx,	mx, mx, mx,
		-mx, -mx, mx,	mx, -mx, mx,
		-mx, -mx, -mx,	mx, -mx, -mx,
		-mx, mx, -mx,	mx, mx, -mx,

		mx,-mx,  mx,	mx,mx,  mx,
		-mx,-mx,  mx,	-mx,mx,  mx,
		-mx,-mx,  -mx,	-mx,mx,  -mx,
		 mx,-mx, -mx,	mx,mx,  -mx,

		  mx, mx,-mx,	 mx, mx,mx,
		  -mx,mx,-mx,	 -mx, mx,mx,
		 -mx, -mx,-mx,	 -mx, -mx,mx,
		 mx, -mx,-mx,	 mx, -mx,mx,


	];

	/*var colors = [
		1, 0, 0,	1, 0.6, 0,
		0, 1, 0,	0.6, 1, 0,
		0, 0, 1,	0, 0.6, 1
	];*/

	var geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	//geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

	var material = new THREE.LineBasicMaterial( { color: color } );

	THREE.LineSegments.call( this, geometry, material );

}

THREE.PointHelper.prototype = Object.create( THREE.LineSegments.prototype );
THREE.PointHelper.prototype.constructor = THREE.PointHelper;