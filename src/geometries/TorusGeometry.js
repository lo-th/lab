/**
 * @author oosmoxiecode
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

// TorusGeometry

THREE.TorusGeometry = function ( radius, tube, radialSegments, tubularSegments, arc, thetaStart, thetaLength ) {

	THREE.Geometry.call( this );

	this.type = 'TorusGeometry';

	this.parameters = {
		radius: radius,
		tube: tube,
		radialSegments: radialSegments,
		tubularSegments: tubularSegments,
		arc: arc
	};

	this.fromBufferGeometry( new THREE.TorusBufferGeometry( radius, tube, radialSegments, tubularSegments, arc, thetaStart, thetaLength ) );
	this.mergeVertices();

}

THREE.TorusGeometry.prototype = Object.create( THREE.Geometry.prototype );
THREE.TorusGeometry.prototype.constructor = THREE.TorusGeometry;

// TorusBufferGeometry

THREE.TorusBufferGeometry = function ( radius, tube, radialSegments, tubularSegments, arc, thetaStart, thetaLength ) {

	THREE.BufferGeometry.call( this );

	this.type = 'TorusBufferGeometry';

	this.parameters = {
		radius: radius,
		tube: tube,
		radialSegments: radialSegments,
		tubularSegments: tubularSegments,
		arc: arc
	};

	radius = radius || 1;
	tube = tube || 0.4;
	radialSegments = Math.floor( radialSegments ) || 8;
	tubularSegments = Math.floor( tubularSegments ) || 6;
	arc = arc || Math.PI * 2;

	thetaStart = thetaStart !== undefined ? thetaStart : 0;
	thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;

	// buffers

	var indices = [];
	var vertices = [];
	var normals = [];
	var uvs = [];

	// helper variables

	var center = new THREE.Vector3();
	var vertex = new THREE.Vector3();
	var normal = new THREE.Vector3();

	var j, i;

	// generate vertices, normals and uvs

	for ( j = 0; j <= radialSegments; j ++ ) {

		for ( i = 0; i <= tubularSegments; i ++ ) {

			var u = i / tubularSegments * arc;
			//var v = j / radialSegments * Math.PI * 2;

			var v = (j / radialSegments) * thetaLength + thetaStart;

		
			// vertex

			vertex.x = ( radius + tube * Math.cos( v ) ) * Math.cos( u );
			vertex.y = ( radius + tube * Math.cos( v ) ) * Math.sin( u );
			vertex.z = tube * Math.sin( v );

			vertices.push( vertex.x, vertex.y, vertex.z );

			// normal

			center.x = radius * Math.cos( u );
			center.y = radius * Math.sin( u );
			normal.subVectors( vertex, center ).normalize();

			normals.push( normal.x, normal.y, normal.z );

			// uv

			uvs.push( i / tubularSegments );
			uvs.push( j / radialSegments );

		}

	}

	// generate indices

	for ( j = 1; j <= radialSegments; j ++ ) {

		for ( i = 1; i <= tubularSegments; i ++ ) {

			// indices

			var a = ( tubularSegments + 1 ) * j + i - 1;
			var b = ( tubularSegments + 1 ) * ( j - 1 ) + i - 1;
			var c = ( tubularSegments + 1 ) * ( j - 1 ) + i;
			var d = ( tubularSegments + 1 ) * j + i;

			// faces

			indices.push( a, b, d );
			indices.push( b, c, d );

		}

	}

	// build geometry

	this.setIndex( indices );
	this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
	this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
	this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

}

THREE.TorusBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.TorusBufferGeometry.prototype.constructor = THREE.TorusBufferGeometry;