// @author Artur Vill _ @shaderology
// @author lth _ @3dflashlo

function SuperSky ( view, o ) {

	this.view = view;

	this.n = 0;

	this.debug = true;

	

	this.needsUpdate = false;

	// contant sun color
	this.sv0 = new THREE.Vector3( 0, .99, 0 );
    this.sv1 = new THREE.Vector3( .188, .458, .682 );

    this.lup = new THREE.Vector3( 0, 1.0, 0 );

    this.torad = 0.0174532925199432957;

    this.sunColor = new THREE.Color(1,1,1);
    this.moonColor = new THREE.Color(1,1,1);

    this.groundColor = new THREE.Color(1,1,1);
    this.skyColor = new THREE.Color(1,1,1);
    this.fogColor = new THREE.Color(1,1,1);

    this.q = 2;
	var q = this.q;



	var setting = {

		distance: 10000,
		resolution: 256*q,

		timelap:0,
		fog:0.1,
		cloud_size: .45,
		cloud_covr: .3,
		cloud_dens: 40,

		sample:64*q,//128,
		iteration:4*q,//8,

		inclination: 45,
		azimuth: 90,
		hour:12,

		toneMapping: 'No',
		exposure:1.22,
		whitePoint:1.25,

		cloudColor: 0xFFFFFF,
		groundColor: 0x3b4c5a,
		fogColor: 0xff0000,

	}

	/*for( var i in o ){
		if( setting[i] ) setting[i] = o[i];
	}*/

	this.setting = setting;

	this.astralDistance = 1;

	this.sunPosition = new THREE.Vector3();
    this.moonPosition = new THREE.Vector3();

    this.sunSphere = new THREE.Spherical();
    this.moonSphere = new THREE.Spherical();

    // textures

    var loader = new THREE.TextureLoader();
    var noiseMap = loader.load( "assets/textures/sky/noise.png", function ( texture ) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.flipY = false; this.needsUpdate = true;}.bind(this) );
    var nightMap = loader.load( "assets/textures/sky/milkyway.png" );
    var lens0 = loader.load( "assets/textures/sky/lens0.png" );
    var lens1 = loader.load( "assets/textures/sky/lens1.png" );
    var lensSun = loader.load( "assets/textures/sky/lensSun.png" );
    var lensMoon = loader.load( "assets/textures/sky/lensMoon.png" );

    // material

	this.materialSky = new THREE.ShaderMaterial( {

		uniforms: {

			lightdir: { value: this.sunPosition },
			noiseMap: { value: noiseMap },
            cloud_size: { value: setting.cloud_size },
            cloud_covr: { value: setting.cloud_covr },
            cloud_dens: { value: setting.cloud_dens },
            cloudColor: { value: new THREE.Color( setting.cloudColor ) },
            groundColor: { value: new THREE.Color( setting.groundColor ) },
            fogColor: { value: new THREE.Color( setting.fogColor ) },
            fog: { value: setting.fog },
            t: { value: setting.timelap },

            nSample: { value: setting.sample },
            iteration: { value: setting.iteration }

		},

		vertexShader:[
			'varying vec3 worldPosition;',
			'void main(){',
			'	worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;',
			'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'}'
		].join( '\n' ),

		fragmentShader: [

		    'varying vec3 worldPosition;',
			'uniform vec3 fogColor;',
			'uniform vec3 groundColor;',
			'uniform vec3 cloudColor;',
			'uniform sampler2D noiseMap;',
			'uniform vec3 lightdir;',
			'uniform float fog;',
			'uniform float cloud_size;',
			'uniform float cloud_covr;',
			'uniform float cloud_dens;',
			'uniform float t;',

			'uniform float nSample;',
			'uniform float iteration;',

			'const float c = 6.36e6;',
			'const float d = 6.38e6;',
			'const float g = 0.76;',
			'const float h = g*g;',
			'const float icc = 1.0/8e3;',
			'const float jcc = 1.0/1200.0;',
			'const float pi = 3.141592653589793;',
			'const vec3 vm = vec3( 0,-c,0 );',
			'const vec3 vn = vec3( 2.1e-5 );',
			'const vec3 vo = vec3( 5.8e-6, 1.35e-5, 3.31e-5 );',

			//#define USE_PROCEDURAL

			'#ifdef USE_PROCEDURAL',

			'float hash( float n ) { return fract(sin(n)*753.5453123); }',

			'float noise( in vec3 x ){',

			'    vec3 p = floor(x);',
			'    vec3 f = fract(x);',
			'    f = f*f*(3.0-2.0*f);',
			    
			'    float n = p.x + p.y*157.0 + 113.0*p.z;',
			'    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),',
			'                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),',
			'               mix(mix( hash(n+113.0), hash(n+114.0),f.x),',
			'                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);',
			'}',

			'#else',

			// optimized noise from map

			'float noise( in vec3 x ){',

			'    vec3 p = floor(x);',
			'    vec3 f = fract(x);',
			'    f = f*f*(3.0-2.0*f);',
			    
			'    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;',
			'    vec2 rg = texture2D( noiseMap, (uv+0.5)/256.0, -16.0 ).yx;',
			'    return mix( rg.x, rg.y, f.z );',
			'}',

			'#endif',


			'float NOISE( vec3 r ){',

			'	r.xz += t;',
			'	r *= 0.5;',
			'	float s;',
			'	s = 0.5 * noise(r);',
			'	r = r * 2.52;',
			'	s += 0.25 * noise(r);',
			'	r = r * 2.53;',
			'	s += 0.125 * noise(r);',
			'	r = r * 2.51;',
			'	s += 0.0625 * noise(r);',
			'	r = r * 2.53;',
			'	s += 0.03125 * noise(r);',
			'	r = r * 2.52;',
			'	s += 0.015625 * noise(r);',
			'	return s;',

			'}',

			'float MakeNoise( vec3 r ){',

			'	float s,t;',
			'	s = NOISE( r * 2e-4 * ( 1.0 - cloud_size ) );',
			'	t = ( 1.0 - cloud_covr ) * 0.5 + 0.2;',
			'	s = smoothstep( t, t+.2 , s );',
			'	s *= 0.5 * cloud_dens;',
			'	return s;',

			'}',

			'void cloudLayer( in vec3 r,out float s,out float t,out float u ){',

			'	float v,w;',
			'	v = length( r-vm ) - c;',
			'	w = 0.0;',
			'	if( 5e3 < v && v < 1e4 ) w = MakeNoise( r ) * sin( pi*(v-5e3)/5e3 );',
			'	s = exp(-v*icc) + fog;',
			'	t = exp(-v*jcc) + w + fog;',
			'	u = w + fog;',

			'}',

			'float ca( in vec3 r,in vec3 s,in float t ){',

			'	vec3 u = r-vm;',
			'	float v,w,x,y,z,A;',
			'	v = dot(u,s);',
			'	w = dot(u,u)-t*t;',
			'	x = v*v-w;',
			'	if( x<0.0 ) return -1.0;',
			'	y = sqrt(x);',
			'	z = -v-y;',
			'	A = -v+y;',
			'	return z >= 0.0 ? z : A;',

			'}',

			'vec3 makeSky( in vec3 r, in vec3 s, out float t){',

			'   int SAMPLE = int( nSample );',
			'   int STEP = int ( iteration ) ;',
				
			'	float u,v,w,x,y,z,A,B,C,m,F;',
			'	vec3 p = normalize( lightdir );',
			'	u = ca(r,s,d);',
			'	v = dot(s,p);',
			'	w = 1.0+v*v;',
			'	x = 0.0596831*w;',
			'	y = 0.0253662*(1.0-h)*w/((2.0+h)*pow(abs(1.0+h-2.0*g*v),1.5));',
			'	z = 50. * pow( abs(1.+dot(s,-p)),2.0 ) * dot( vec3(0,1,0), p ) * ( 1.0-cloud_covr ) * ( 1.0 - min( fog, 1.0 ) );',
			'	A = 0.0;',
			'	B = 0.0;',
			'	C = 0.0;',
			'	m = 0.0;',
			'	vec3 D,E;',
				//float H,J,K,L,M, N,O,P,Q, S,U,V,W;
			'	D = vec3(0);',
			'	E = vec3(0);',
			'	F = u / float( SAMPLE );',

			'	for( int G=0; G<SAMPLE; ++G ){',
			'		float H,J,K,L,M;',
			'		H = float(G)*F;',
			'		vec3 I = r + s * H;',
			'		L = 0.0;',
			'		cloudLayer( I, J, K, L );',
			'		J *= F;',
			'		K *= F;',
			'		A += J;',
			'		B += K;',
			'		C += L;',
			'		M = ca(I,p,d);',
			'		if( M > 0.0 ){',
			'			float N,O,P,Q;',
			'			N=M/float(STEP);',
			'			O=0.0;',
			'			P=0.0;',
			'			Q=0.0;',
			'			for( int R=0; R<STEP; ++R ){',
			'				float S,U,V,W;',
			'				S = float(R)*N;',
			'				vec3 T=I+p*S;',
			'				W = 0.0;',
			'				cloudLayer( T, U, V, W );',
			'				O+=U*N;',
			'				P+=V*N;',
			'				Q+=W*N;',
			'			}',
			'			vec3 S = exp(-(vo*(O+A)+vn*(P+B)));',
			'			m+=L;',
			'			D+=S*J;',
			'			E+=S*K+z*m;',
			'		}',
			'		else return vec3(0.0);',
			'	}',
			'	t = m * 0.0125;',
			'	return ( (D * vo * x) + (E * vn * y)) * 15.0;',
			'}',

			'void main(){',

			'	vec3 light = normalize( lightdir );',
			'	vec3 r = normalize( worldPosition );',
			'	float uvy = acos( r.y ) / pi;',

			'	float top = uvy <= 0.505 ? 1.0 : smoothstep(1.0, 0.0, (uvy-0.505)*25.0);',
			'	float low = uvy > 0.505 ? 1.0 : smoothstep(1.0, 0.0, (0.505-uvy)*100.0);',

			'	vec3 s = vec3( 0, 0.99, 0 );',
			'	float m = 0.0;',
			'	vec3 sky = clamp( makeSky( s, r, m ), vec3( 0.0 ), vec3( 10000.0 ) );',

				//float u = pow( abs( 1.0 - abs(r.y) ), 10.0 );
				//float top = r.y >= 0.0 ? 1.0 : u; 
				//float low = r.y <= 0.0 ? 1.0 : 
			'	float luma = 0.005 + max( dot( vec3( 0, 1.0, 0 ), light ), 0.0 ) * 0.2;',
				//x = ;
				//sky = mix(vec3(x),t,v*0.8);
				// cloudColor
			'	sky = mix( groundColor*luma, sky , top);',
				//sky = smoothstep( groundColor*x, sky , vec3(v));
			'	float alpha = clamp( m + low, 0.0 , 0.99 ) + 0.01;',

			'	vec3 color = pow( abs( sky ), vec3( .5 ) );',

				//color = vec3(worldPosition.y);

			'	gl_FragColor = vec4( color, alpha );',

				//#include <tonemapping_fragment>

			'}'
		].join( '\n' ),

		depthWrite: false,
		depthTest: false,
		side:THREE.BackSide,
		fog:false,
		
	});

    this.scene = new THREE.Scene();
	var sphere = new THREE.Mesh( new THREE.SphereBufferGeometry( 1, 30, 15 ), this.materialSky );
	this.scene.add( sphere );

	this.camera = new THREE.CubeCamera( 0.5, 2, setting.resolution );
	this.scene.add( this.camera );
	this.camera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
	this.camera.renderTarget.texture.format = THREE.RGBAFormat;


	this.material = new THREE.ShaderMaterial( {

			uniforms: {
				lightdir: { value: this.sunPosition },
				lunardir: { value: this.moonPosition },
				tCube: { value: this.camera.renderTarget.texture },
                tDome: { value: nightMap },
			},
			vertexShader:[
				'varying vec3 worldPosition;',
				'void main(){',
				'	worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;',
				'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
				'}'
			].join( '\n' ),

			fragmentShader: [
			    'varying vec3 worldPosition;',

				'uniform vec3 lightdir;',
				'uniform vec3 lunardir;',
				'uniform sampler2D tDome;',
				'uniform samplerCube tCube;',

				'const float pi = 3.141592653589793;',

				'vec3 M33(vec3 e){ return e-floor(e*(1./289.))*289.; }',
				'vec4 M44(vec4 e){ return e-floor(e*(1./289.))*289.; }',
				'vec4 N(vec4 e){ return M44((e*34.+1.)*e); }',
				'vec4 O(vec4 e){ return 1.79284291400159-.85373472095314*e; }',

				'float P(vec3 e){',
				'	const vec2 f = vec2(1./6.,1./3.);',
				'	const vec4 g = vec4(0,.5,1,2);',
				'	vec3 h,i,j,k,l,m,n,o,p,s,G,H,I,J;',
				'	h = floor(e+dot(e,f.yyy));',
				'	i = e-h+dot(h,f.xxx);',
				'	j = step(i.yzx,i.xyz);',
				'	k = 1.-j;l=min(j.xyz,k.zxy);',
				'	m = max(j.xyz,k.zxy);',
				'	n = i-l+f.xxx;',
				'	o = i-m+f.yyy;',
				'	p = i-g.yyy;',
				'	h = M33(h);',
				'	vec4 q,t,u,v,w,x,y,z,A,B,C,D,E,F,K,L;',
				'	q = N(N(N(h.z+vec4(0,l.z,m.z,1))+h.y+vec4(0,l.y,m.y,1))+h.x+vec4(0,l.x,m.x,1));',
				'	float r = 0.142857142857;',
				'	s = r*g.wyz-g.xzx;',
				'	t = q-49.*floor(q*s.z*s.z);',
				'	u = floor(t*s.z);',
				'	v = floor(t-7.*u);',
				'	w = u*s.x+s.yyyy;',
				'	x = v*s.x+s.yyyy;',
				'	y = 1.-abs(w)-abs(x);',
				'	z = vec4(w.xy,x.xy);',
				'	A = vec4(w.zw,x.zw);',
				'	B = floor(z)*2.+1.;',
				'	C = floor(A)*2.+1.;',
				'	D = -step(y,vec4(0));',
				'	E = z.xzyw+B.xzyw*D.xxyy;',
				'	F = A.xzyw+C.xzyw*D.zzww;',
				'	G = vec3(E.xy,y.x);',
				'	H = vec3(E.zw,y.y);',
				'	I = vec3(F.xy,y.z);',
				'	J = vec3(F.zw,y.w);',
				'	K = O(vec4(dot(G,G),dot(H,H),dot(I,I),dot(J,J)));',
				'	G *= K.x;',
				'	H *= K.y;',
				'	I *= K.z;',
				'	J *= K.w;',
				'	L = max(.6-vec4(dot(i,i),dot(n,n),dot(o,o),dot(p,p)),0.);',
				'	L = L*L;',
				'	return 21.*dot(L*L,vec4(dot(G,i),dot(H,n),dot(I,o),dot(J,p)))+.5;',
				'}',

				'vec2 Q(vec3 e){',
				'	return vec2(.5+atan(e.z,e.x)/(2.*pi),.5+atan(e.y,length(e.xz))/pi);',
				'}',

				'mat3 R(vec3 e,vec3 f){',
				'	vec3 g,h;',
				'	g = normalize(cross(f,e));',
				'	h = normalize(cross(e,g));',
				'	return mat3(g.x,g.y,g.z,h.x,h.y,h.z,e.x,e.y,e.z);',
				'}',

				'void main(){',

				'	vec3 light = normalize( lightdir );',
				'	vec3 e = normalize( worldPosition );',
				'	vec3 f = R( light, vec3(0,1,0) )*e;',
				'	vec3 milk = texture2D( tDome, Q(f) ).rgb;',
				'	float h,j,k,l;',
				'	h=(milk.x+milk.y+milk.z)/3.;',
				'	const float i=1.0;',
				'	j = P(f*i*134.);',
				'	j += P( f*i*370.);',
				'	j += P( f*i*870.);',
				'	k = pow(abs(j),9.)*2e-4;',
				'	l = pow(abs(j),19.)*1e-8;',
				'	vec3 star = clamp(mix(normalize(milk)*(l+k*h),milk,h*.1),0.,2.);',
				'	vec4 cubi = textureCube( tCube, e );',
				'	star = star*(1.0-cubi.a)*clamp(pow(abs(1.-light.y),10.),0.,1.);',
				'	gl_FragColor = vec4( star + cubi.rgb,1);',
					
				//'	#include <tonemapping_fragment>',

				'}'
			].join( '\n' ),

			side: THREE.BackSide,
			depthWrite: false,
			fog:false,
			//depthTest: false,
		
		});

	    this.geometry = new THREE.SphereBufferGeometry( 1, 30, 15 );

	    // fake sun / moon
	    this.sun = new THREE.Sprite( new THREE.SpriteMaterial( { map:lensSun, blending:THREE.AdditiveBlending, opacity:0.5 } ) );
	    this.moon = new THREE.Sprite( new THREE.SpriteMaterial( { map:lensMoon, blending:THREE.AdditiveBlending, opacity:0.5 } ) );

	    
	    this.lensflare = new THREE.Lensflare();
	    var c = this.sun.material.color;
		this.lensflare.addElement( new THREE.LensflareElement( lens0, 700, 0, c ) );
		this.lensflare.addElement( new THREE.LensflareElement( lens1, 60, 0.6, c ) );
		this.lensflare.addElement( new THREE.LensflareElement( lens1, 70, 0.7, c ) );
		this.lensflare.addElement( new THREE.LensflareElement( lens1, 120, 0.9, c ) );
		this.lensflare.addElement( new THREE.LensflareElement( lens1, 70, 1, c ) );
		this.sun.add( this.lensflare );
		

		this.dome = new THREE.Mesh( this.geometry, this.material );



		//THREE.Mesh.call( this, this.geometry, this.material );

		THREE.Group.call( this );

		
		this.add( this.sun );
		this.add( this.moon );
		this.add( this.dome );

		this.initColorTest();

		this.view.updateEnvMap( this.camera.renderTarget.texture );

		this.setSize();
		this.update( o, true );

		this.view.followGroup.add( this );

}


SuperSky.prototype = Object.assign( Object.create( THREE.Group.prototype ), {

    constructor: SuperSky,

    clear: function () {

    	this.remove( this.sun );
    	this.remove( this.moon );
    	this.remove( this.dome );

    	this.view.followGroup.remove( this );

    },

    setSize: function ( v ) {

    	if( v !== undefined ) this.setting.distance = v;
    	var s = this.setting.distance * 0.05;
    	//console.log(s)
    	this.astralDistance = this.setting.distance; //- s;
    	//console.log( this.astralDistance )
    	this.dome.scale.set( 1,1,1 ).multiplyScalar( this.setting.distance );
    	this.sun.scale.set( s,s,1 );
    	this.moon.scale.set( s,s,1 );

    },

    k: function ( e, p ) {

    	var n = p.dot(p), a = 2 * p.dot(e), o = e.dot(e) - 1, 
    	    r = a * a - 4 * n * o,
            i = Math.sqrt(r), l = (-a - i) * 0.5;
        return o / l;

    },

    calculateSunColor: function ( position ) {

    	var c = { r:0, g:0, b:0 };
    	var e = 0.028 / this.k( this.sv0, position );
    	var t = 1.8;
    	var r = position.y >= 0 ? 1 : 0;
    	c.r = (t - t * Math.pow( this.sv1.x, e )) * r;
    	c.g = (t - t * Math.pow( this.sv1.y, e )) * r;
    	c.b = (t - t * Math.pow( this.sv1.z, e )) * r;
    	c.r = c.r > 1.0 ? 1.0 : c.r;
        c.g = c.g > 1.0 ? 1.0 : c.g;
        c.b = c.b > 1.0 ? 1.0 : c.b;
    	this.sunColor.setRGB( c.r, c.g, c.b );

        var mr = 1 - c.r;
        var mg = 1 - c.g;
        var mb = 1 - c.b;
        
        this.moonColor.setRGB( mr, mg, mb );

    },

    timelap: function ( t, f ) {

    	var s = this.setting;
    	s.hour += t;
    	//s.timelap += t;
    	if(s.hour>24) s.hour = 0;
        if(s.hour<0) s.hour = 24;

        this.n ++;

        if(this.n===f){
        	this.n = 0;
        	this.update ();
        }

    },

    update: function ( o, first ) {

    	o = o || {};
    	var s = this.setting;
    	var r = this.torad;

    	for( var i in o ){
			if( s[i] !== undefined ) s[i] = o[i];
		}

    	s.inclination = ( s.hour * 15 ) - 90;
    	s.timelap = s.hour;

    	this.sunSphere.phi = ( s.inclination - 90 ) * r;
        this.sunSphere.theta = ( s.azimuth - 90 ) * r;
        this.sunPosition.setFromSpherical( this.sunSphere );
        
        this.moonSphere.phi = ( s.inclination + 90 ) * r;
        this.moonSphere.theta = ( s.azimuth - 90 ) * r;
        this.moonPosition.setFromSpherical( this.moonSphere );

        

        // fake sun / moon
        this.sun.position.copy( this.sunPosition ).multiplyScalar( this.astralDistance );
        this.moon.position.copy( this.moonPosition ).multiplyScalar( this.astralDistance );



        this.calculateSunColor( this.sunPosition );

        this.sun.material.color.copy( this.sunColor );
        this.moon.material.color.copy( this.moonColor );

        // light

        this.view.sun.position.copy( this.sunPosition ).multiplyScalar( this.view.lightDistance );
        this.view.moon.position.copy( this.moonPosition ).multiplyScalar( this.view.lightDistance );
        //this.view.sun.lookAt( this.view.followGroup.position )//target.position.set(0,0,0)

        this.view.sun.color.copy( this.sunColor );
        this.view.sun.intensity = this.sunColor.r + (this.sunColor.r*0.3);
        this.view.moon.color.copy( this.moonColor );
        this.view.moon.intensity = this.moonColor.r - (this.moonColor.r*0.3);


        


        /*var luma = 0.005 + Math.max( this.lup.dot( this.sunPosition ), 0 ) * 0.2;
        this.groundColor.setHex( s.groundColor ).multiplyScalar( luma );
        if( this.view.isWithSphereLight ){
        	
        	//this.view.ambient.intensity = 1;
        	//this.view.ambient.color.copy( this.groundColor )
        	this.view.ambient.groundColor.copy( this.groundColor );
        } else {
        	this.view.ambient.color.copy( this.groundColor );
        }*/

        

        this.materialSky.uniforms.lightdir.value = this.sunPosition;
		this.material.uniforms.lightdir.value = this.sunPosition;

		this.materialSky.uniforms.t.value = s.timelap;
		this.materialSky.uniforms.fog.value = s.fog;
		this.materialSky.uniforms.cloud_size.value = s.cloud_size;
		this.materialSky.uniforms.cloud_covr.value = s.cloud_covr;
		this.materialSky.uniforms.cloud_dens.value = s.cloud_dens;

        if( !first ) this.needsUpdate = true;

    },

    render: function () {



    	if( this.needsUpdate ){

    		//console.log('up')

    		this.camera.update( this.view.renderer, this.scene );
    		this.view.envmap = this.camera.renderTarget.texture;
    		//

    		this.getColor();

		    this.needsUpdate = false;

    	}

    },

    initColorTest: function () {

    	//if( !this.view.isWithSphereLight ) return;

    	this.pixelRender = new THREE.WebGLRenderTarget( 2,2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: this.view.isGl2 ? THREE.UnsignedByteType : THREE.FloatType } );
        this.vMid = new THREE.Vector3( 1,0.1,0 );
        this.vUp = new THREE.Vector3( 0,1,0 );
        this.vDown = new THREE.Vector3( 0,-1,0 );
        var x = 0.1;
        this.camPixel = new THREE.OrthographicCamera( -x, x, x, -x, 0.5, 2 );
        this.scene.add( this.camPixel );

    },

    getColor: function () {

    	if( this.view.isWithFog ) {


	    	var rgb = this.view.isGl2 ? Math.inv255 : 1;
	        var read = this.view.isGl2 ? new Uint8Array( 4 ) : new Float32Array( 4 );

	        this.camPixel.lookAt( this.vMid );
	        this.view.renderer.render( this.scene, this.camPixel, this.pixelRender, true );

	        this.view.renderer.readRenderTargetPixels( this.pixelRender, 0, 0, 1, 1, read );
	        this.fogColor.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

	        //console.log(this.fogColor.getHexString())

	        this.view.fog.color.copy( this.fogColor );
	    }

        if( this.view.isWithSphereLight ) {

	        this.camPixel.lookAt( this.vUp );
	        this.view.renderer.render( this.scene, this.camPixel, this.pixelRender, true );

	        this.view.renderer.readRenderTargetPixels( this.pixelRender, 0, 0, 1, 1, read );
	        this.skyColor.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

	        this.camPixel.lookAt( this.vDown );
	        this.view.renderer.render( this.scene, this.camPixel, this.pixelRender, true );

	        this.view.renderer.readRenderTargetPixels( this.pixelRender, 0, 0, 1, 1, read );
	        this.groundColor.setRGB( read[0]*rgb, read[1]*rgb, read[2]*rgb );

	        
	        this.view.sphereLight.color.copy( this.skyColor );
	        this.view.sphereLight.groundColor.copy( this.groundColor );
	        this.view.sphereLight.intensity = 0.6;

	        this.view.ambient.color.copy( this.groundColor );

	    }

    },

    getEnvMap: function () {

    	return this.camera.renderTarget.texture;

    },

    updateMatrixWorld: function ( force ) {

    	this.render();

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate || force ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		var children = this.children;

		for ( var i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].updateMatrixWorld( force );

		}

	},

 });