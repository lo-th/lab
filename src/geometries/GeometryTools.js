/**
 * @author lth / https://github.com/lo-th/
 */

THREE.GeometryTools = {

    reversUV: function ( geometry ){

        // correct inversion of normal map in symetrics mesh
        var uv = geometry.attributes.uv.array;
        var i = Math.floor(uv.length * 0.25);
        while( i-- ) uv[ i * 2 ] *= -1;
        geometry.attributes.uv.needsUpdate = true;

    },

    addVertexColor: function( geometry ){

        var color = new THREE.Float32BufferAttribute( geometry.attributes.position.count*3, 3 );
        var i = color.count, n;

        while(i--){ 
            n = i*3
            color[n] = 1;
            color[n+1] = 1;
            color[n+2] = 1;
        }

        geometry.setAttribute( 'color', color );
        geometry.attributes.color.needsUpdate = true;

    },

    addUV2: function( geometry ){

        geometry.setAttribute( 'uv2', geometry.attributes.uv );

    },

    mergeGeometryArray : function( geos ){

        var tmp = [];
        var i = geos.length;
        while(i--){
            tmp[i] = new THREE.Geometry().fromBufferGeometry( geos[i] );
            //tmp[i].mergeVertices();
        }

        var g = new THREE.Geometry();

        while( tmp.length > 0 ){
            i = tmp.pop();
            g.merge(i);
            i.dispose();
        }

        g.mergeVertices();

        var geometry = new THREE.BufferGeometry().fromGeometry( g );
        g.dispose();

        return geometry;

    },

    prepaGeometry : function ( g, type ) {

        var verticesOnly = false;
        var facesOnly = false;
        var withColor = true;

        if(type == 'mesh') facesOnly = true;
        if(type == 'convex') verticesOnly = true;

        var i, j, n, p, n2;

        var tmpGeo = new THREE.Geometry().fromBufferGeometry( g );
        tmpGeo.mergeVertices();

        var totalVertices = g.attributes.position.array.length/3;
        var numVertices = tmpGeo.vertices.length;
        var numFaces = tmpGeo.faces.length;

        g.realVertices = new Float32Array( numVertices * 3 );
        g.realIndices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

        if(withColor){
            g.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( totalVertices*3 ), 3 ) );
            var cc = g.attributes.color.array;

            i = totalVertices;
            while(i--){
                n = i * 3;
                cc[ n ] = 1;
                cc[ n + 1 ] = 1;
                cc[ n + 2 ] = 1;
            }
        }

        i = numVertices;
        while(i--){
            p = tmpGeo.vertices[ i ];
            n = i * 3;
            g.realVertices[ n ] = p.x;
            g.realVertices[ n + 1 ] = p.y;
            g.realVertices[ n + 2 ] = p.z;
        }

        if(verticesOnly){ 
            tmpGeo.dispose();
            return g.realVertices;
        }

        i = numFaces;
        while(i--){
            p = tmpGeo.faces[ i ];
            n = i * 3;
            g.realIndices[ n ] = p.a;
            g.realIndices[ n + 1 ] = p.b;
            g.realIndices[ n + 2 ] = p.c;
        }

        tmpGeo.dispose();

        //g.realIndices = g.getIndex();
        //g.setIndex(g.realIndices);

        if(facesOnly){ 
            var faces = [];
            i = g.realIndices.length;
            while(i--){
                n = i * 3;
                p = g.realIndices[i]*3;
                faces[n] = g.realVertices[ p ];
                faces[n+1] = g.realVertices[ p+1 ];
                faces[n+2] = g.realVertices[ p+2 ];
            }
            return faces;
        }

        // find same point
        var ar = [];
        var pos = g.attributes.position.array;
        i = numVertices;
        while(i--){
            n = i*3;
            ar[i] = [];
            j = totalVertices;
            while(j--){
                n2 = j*3;
                if( pos[n2] == g.realVertices[n] && pos[n2+1] == g.realVertices[n+1] && pos[n2+2] == g.realVertices[n+2] ) ar[i].push(j);
            }
        }

        // generate same point index
        var pPoint = new ( numVertices > 65535 ? Uint32Array : Uint16Array )( numVertices );
        var lPoint = new ( totalVertices > 65535 ? Uint32Array : Uint16Array )( totalVertices );

        p = 0;
        for(i=0; i<numVertices; i++){
            n = ar[i].length;
            pPoint[i] = p;
            j = n;
            while(j--){ lPoint[p+j] = ar[i][j]; }
            p += n;
        }

        g.numFaces = numFaces;
        g.numVertices = numVertices;
        g.maxi = totalVertices;
        g.pPoint = pPoint;
        g.lPoint = lPoint;

    },

    getGeomtryInfo: function ( o ) {

        var rev = o.Revers !== undefined ? o.Revers : true;

        var isBufferGeo = false;

        //if(o.geometry instanceof THREE.Geometry) console.log( 'is geometry')
        if(o.geometry instanceof THREE.BufferGeometry) isBufferGeo = true;

        var tmpGeo = isBufferGeo ? new THREE.Geometry().fromBufferGeometry( o.geometry ) : o.geometry;

        // remove duplicate
        if( isBufferGeo ) tmpGeo.mergeVertices();

        var numVertices = tmpGeo.vertices.length;
        var numFaces = tmpGeo.faces.length;

        o.vertices = new Float32Array( numVertices * 3 );
        o.indices = new Int32Array(numFaces * 3);

        var i = numVertices, n, p;
        while(i--){
            p = tmpGeo.vertices[ i ];
            n = i * 3;
            o.vertices[ n ] = p.x;
            o.vertices[ n + 1 ] = rev ? p.z : p.y;
            o.vertices[ n + 2 ] = rev ? p.y : p.z;
        }

        i = numFaces;
        while(i--){
            p = tmpGeo.faces[ i ];
            n = i * 3;
            o.indices[ n ] = p.a;
            o.indices[ n + 1 ] = rev ? p.c : p.b;
            o.indices[ n + 2 ] = rev ? p.b : p.c;
        }

        if( isBufferGeo ) tmpGeo.dispose();

    },





}