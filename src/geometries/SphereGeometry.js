/**
 * @author mrdoob / http://mrdoob.com/
 * @author benaadams / https://twitter.com/ben_a_adams
 * @author Mugen87 / https://github.com/Mugen87
 */

// SphereGeometry

THREE.SphereGeometry = function ( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) {

	THREE.Geometry.call( this );

	this.type = 'SphereGeometry';

	this.parameters = {
		radius: radius,
		widthSegments: widthSegments,
		heightSegments: heightSegments,
		phiStart: phiStart,
		phiLength: phiLength,
		thetaStart: thetaStart,
		thetaLength: thetaLength
	};

	this.fromBufferGeometry( new THREE.SphereBufferGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) );
	this.mergeVertices();

}

THREE.SphereGeometry.prototype = Object.create( THREE.Geometry.prototype );
THREE.SphereGeometry.prototype.constructor = THREE.SphereGeometry;

// SphereBufferGeometry

THREE.SphereBufferGeometry = function ( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) {

	THREE.BufferGeometry.call( this );

	this.type = 'SphereBufferGeometry';

	this.parameters = {
		radius: radius,
		widthSegments: widthSegments,
		heightSegments: heightSegments,
		phiStart: phiStart,
		phiLength: phiLength,
		thetaStart: thetaStart,
		thetaLength: thetaLength
	};

	radius = radius || 1;

	//widthSegments = Math.max( 3, Math.floor( widthSegments ) || 8 );
	//heightSegments = Math.max( 2, Math.floor( heightSegments ) || 6 );

	widthSegments = Math.floor( widthSegments ) || 8;
	heightSegments = Math.floor( heightSegments ) || 6;

	phiStart = phiStart !== undefined ? phiStart : 0;
	phiLength = phiLength !== undefined ? phiLength : Math.PI * 2;

	thetaStart = thetaStart !== undefined ? thetaStart : 0;
	thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;

	var thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

	var ix, iy;

	var index = 0;
	var grid = [];

	var vertex = new THREE.Vector3();
	var normal = new THREE.Vector3();

	// buffers

	var indices = [];
	var vertices = [];
	var normals = [];
	var uvs = [];

	// generate vertices, normals and uvs

	for ( iy = 0; iy <= heightSegments; iy ++ ) {

		var verticesRow = [];

		var v = iy / heightSegments;

		// special case for the poles

		var uOffset = 0;

		if ( iy == 0 && thetaStart == 0 ) {

			uOffset = 0.5 / widthSegments;

		} else if ( iy == heightSegments && thetaEnd == Math.PI ) {

			uOffset = - 0.5 / widthSegments;

		}

		for ( ix = 0; ix <= widthSegments; ix ++ ) {

			var u = ix / widthSegments;

			// vertex

			vertex.x = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
			vertex.y = radius * Math.cos( thetaStart + v * thetaLength );
			vertex.z = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

			vertices.push( vertex.x, vertex.y, vertex.z );

			// normal

			normal.copy( vertex ).normalize();
			normals.push( normal.x, normal.y, normal.z );

			// uv

			uvs.push( u + uOffset, 1 - v );

			verticesRow.push( index ++ );

		}

		grid.push( verticesRow );

	}

	// indices

	for ( iy = 0; iy < heightSegments; iy ++ ) {

		for ( ix = 0; ix < widthSegments; ix ++ ) {

			var a = grid[ iy ][ ix + 1 ];
			var b = grid[ iy ][ ix ];
			var c = grid[ iy + 1 ][ ix ];
			var d = grid[ iy + 1 ][ ix + 1 ];

			if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
			if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );

		}

	}

	// build geometry

	this.setIndex( indices );
	this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
	this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

}

THREE.SphereBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.SphereBufferGeometry.prototype.constructor = THREE.SphereBufferGeometry;
