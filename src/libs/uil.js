(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.UIL = global.UIL || {})));
}(this, (function (exports) { 'use strict';

	// Polyfills

	if ( Number.EPSILON === undefined ) {

		Number.EPSILON = Math.pow( 2, - 52 );

	}

	//

	if ( Math.sign === undefined ) {

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign

		Math.sign = function ( x ) {

			return ( x < 0 ) ? - 1 : ( x > 0 ) ? 1 : + x;

		};

	}

	if ( Function.prototype.name === undefined ) {

		// Missing in IE9-11.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name

		Object.defineProperty( Function.prototype, 'name', {

			get: function () {

				return this.toString().match( /^\s*function\s*([^\(\s]*)/ )[ 1 ];

			}

		} );

	}

	if ( Object.assign === undefined ) {

		// Missing in IE.
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

		( function () {

			Object.assign = function ( target ) {

				'use strict';

				if ( target === undefined || target === null ) {

					throw new TypeError( 'Cannot convert undefined or null to object' );

				}

				var output = Object( target );

				for ( var index = 1; index < arguments.length; index ++ ) {

					var source = arguments[ index ];

					if ( source !== undefined && source !== null ) {

						for ( var nextKey in source ) {

							if ( Object.prototype.hasOwnProperty.call( source, nextKey ) ) {

								output[ nextKey ] = source[ nextKey ];

							}

						}

					}

				}

				return output;

			};

		} )();

	}

	/**
	 * @author lo-th / https://github.com/lo-th
	 */

	var T = {

	    frag: document.createDocumentFragment(),

	    colorRing: null,

	    svgns: "http://www.w3.org/2000/svg",
	    htmls: "http://www.w3.org/1999/xhtml",

	    DOM_SIZE: [ 'height', 'width', 'top', 'left', 'bottom', 'right', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom'],
	    SVG_TYPE_D: [ 'pattern', 'defs', 'transform', 'stop', 'animate', 'radialGradient', 'linearGradient', 'animateMotion' ],
	    SVG_TYPE_G: [ 'svg', 'rect', 'circle', 'path', 'polygon', 'text', 'g', 'line', 'foreignObject' ],

	    TwoPI: 6.283185307179586,

	    size: {  w: 240, h: 20, p: 30, s: 20 },

	    // ----------------------
	    //   COLOR
	    // ----------------------

	    colors: {

	        text : '#C0C0C0',
	        background: 'rgba(44,44,44,0.3)',
	        backgroundOver: 'rgba(11,11,11,0.5)',

	        border : '#454545',
	        borderOver : '#5050AA',
	        borderSelect : '#308AFF',

	        button : '#404040',
	        boolbg : '#181818',

	        select : '#308AFF',
	        moving : '#03afff',
	        down : '#024699',

	        stroke: 'rgba(11,11,11,0.5)',
	        scroll: '#333333',

	        hide: 'rgba(0,0,0,0)',

	    },

	    // style css

	    css : {
	        //unselect: '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select:none;', 
	        basic: 'position:absolute; pointer-events:none; box-sizing:border-box; margin:0; padding:0; border:none; overflow:hidden; background:none;' + '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select:none;',
	    },

	    // svg path

	    GPATH: 'M 7 7 L 7 8 8 8 8 7 7 7 M 5 7 L 5 8 6 8 6 7 5 7 M 3 7 L 3 8 4 8 4 7 3 7 M 7 5 L 7 6 8 6 8 5 7 5 M 6 6 L 6 5 5 5 5 6 6 6 M 7 3 L 7 4 8 4 8 3 7 3 M 6 4 L 6 3 5 3 5 4 6 4 M 3 5 L 3 6 4 6 4 5 3 5 M 3 3 L 3 4 4 4 4 3 3 3 Z',

	    setText : function( size, color, font ){

	        size = size || 11;
	        color = color || '#CCC';
	        font = font || 'Monospace';//'"Consolas", "Lucida Console", Monaco, monospace';

	        T.colors.text = color;
	        T.css.txt = T.css.basic + 'font-family:'+font+'; font-size:'+size+'px; color:'+color+'; padding:2px 10px; left:0; top:2px; height:16px; width:100px; overflow:hidden; white-space: nowrap;';
	        T.css.txtselect = T.css.txt + 'padding:2px 5px; border:1px dashed ' + T.colors.border+';';
	        T.css.item = T.css.txt + 'position:relative; background:rgba(0,0,0,0.2); margin-bottom:1px;';

	    },

	    clone: function ( o ) {

	        return o.cloneNode( true );

	    },

	    setSvg: function( dom, type, value, id ){

	        if( id === -1 ) dom.setAttributeNS( null, type, value );
	        else dom.childNodes[ id || 0 ].setAttributeNS( null, type, value );

	    },

	    set: function( g, o ){

	        for( var att in o ){
	            if( att === 'txt' ) g.textContent = o[ att ];
	            g.setAttributeNS( null, att, o[ att ] );
	        }
	        
	    },

	    get: function( dom, id ){

	        if( id === undefined ) return dom; // root
	        else if( !isNaN( id ) ) return dom.childNodes[ id ]; // first child
	        else if( id instanceof Array ){
	            if(id.length === 2) return dom.childNodes[ id[0] ].childNodes[ id[1] ];
	            if(id.length === 3) return dom.childNodes[ id[0] ].childNodes[ id[1] ].childNodes[ id[2] ];
	        }

	    },

	    dom : function ( type, css, obj, dom, id ) {

	        type = type || 'div';

	        if( T.SVG_TYPE_D.indexOf(type) !== -1 || T.SVG_TYPE_G.indexOf(type) !== -1 ){ // is svg element

	            if( type ==='svg' ){

	                dom = document.createElementNS( T.svgns, 'svg' );
	                T.set( dom, obj );

	            } else {
	                // create new svg if not def
	                if( dom === undefined ) dom = document.createElementNS( T.svgns, 'svg' );
	                T.addAttributes( dom, type, obj, id );

	            }
	            
	        } else { // is html element

	            if( dom === undefined ) dom = document.createElementNS( T.htmls, type );
	            else dom = dom.appendChild( document.createElementNS( T.htmls, type ) );

	        }

	        if( css ) dom.style.cssText = css; 

	        if( id === undefined ) return dom;
	        else return dom.childNodes[ id || 0 ];

	    },

	    addAttributes : function( dom, type, o, id ){

	        var g = document.createElementNS( T.svgns, type );
	        T.set( g, o );
	        T.get( dom, id ).appendChild( g );
	        if( T.SVG_TYPE_G.indexOf(type) !== -1 ) g.style.pointerEvents = 'none';
	        return g;

	    },

	    clear : function( dom ){

	        T.purge( dom );
	        while (dom.firstChild) {
	            if ( dom.firstChild.firstChild ) T.clear( dom.firstChild );
	            dom.removeChild( dom.firstChild ); 
	        }

	    },

	    purge : function ( dom ) {

	        var a = dom.attributes, i, n;
	        if (a) {
	            i = a.length;
	            while(i--){
	                n = a[i].name;
	                if (typeof dom[n] === 'function') dom[n] = null;
	            }
	        }
	        a = dom.childNodes;
	        if (a) {
	            i = a.length;
	            while(i--){ 
	                T.purge( dom.childNodes[i] ); 
	            }
	        }

	    },

	    // ----------------------
	    //   Color function
	    // ----------------------

	    ColorLuma : function ( hex, l ) {

	        // validate hex string
	        hex = String(hex).replace(/[^0-9a-f]/gi, '');
	        if (hex.length < 6) {
	            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	        }
	        l = l || 0;

	        // convert to decimal and change luminosity
	        var rgb = "#", c, i;
	        for (i = 0; i < 3; i++) {
	            c = parseInt(hex.substr(i*2,2), 16);
	            c = Math.round(Math.min(Math.max(0, c + (c * l)), 255)).toString(16);
	            rgb += ("00"+c).substr(c.length);
	        }

	        return rgb;

	    },

	    findDeepInver: function ( c ) { 

	        return (c[0] * 0.3 + c[1] * .59 + c[2] * .11) <= 0.6;
	        
	    },


	    hexToHtml: function ( v ) { 
	        v = v === undefined ? 0x000000 : v;
	        return "#" + ("000000" + v.toString(16)).substr(-6);
	        
	    },

	    htmlToHex: function ( v ) { 

	        return v.toUpperCase().replace("#", "0x");

	    },

	    u255: function (c, i) {

	        return parseInt(c.substring(i, i + 2), 16) / 255;

	    },

	    u16: function ( c, i ) {

	        return parseInt(c.substring(i, i + 1), 16) / 15;

	    },

	    unpack: function( c ){

	        if (c.length == 7) return [ T.u255(c, 1), T.u255(c, 3), T.u255(c, 5) ];
	        else if (c.length == 4) return [ T.u16(c,1), T.u16(c,2), T.u16(c,3) ];

	    },

	    htmlRgb: function( c ){

	        return 'rgb(' + Math.round(c[0] * 255) + ','+ Math.round(c[1] * 255) + ','+ Math.round(c[2] * 255) + ')';

	    },

	    rgbToHex : function( c ){

	        return '#' + ( '000000' + ( ( c[0] * 255 ) << 16 ^ ( c[1] * 255 ) << 8 ^ ( c[2] * 255 ) << 0 ).toString( 16 ) ).slice( - 6 );

	    },

	    hueToRgb: function( p, q, t ){

	        if ( t < 0 ) t += 1;
	        if ( t > 1 ) t -= 1;
	        if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
	        if ( t < 1 / 2 ) return q;
	        if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
	        return p;

	    },

	    rgbToHsl: function ( c ) {

	        var r = c[0], g = c[1], b = c[2], min = Math.min(r, g, b), max = Math.max(r, g, b), delta = max - min, h = 0, s = 0, l = (min + max) / 2;
	        if (l > 0 && l < 1) s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
	        if (delta > 0) {
	            if (max == r && max != g) h += (g - b) / delta;
	            if (max == g && max != b) h += (2 + (b - r) / delta);
	            if (max == b && max != r) h += (4 + (r - g) / delta);
	            h /= 6;
	        }
	        return [ h, s, l ];

	    },

	    hslToRgb: function ( c ) {

	        var p, q, h = c[0], s = c[1], l = c[2];

	        if ( s === 0 ) return [ l, l, l ];
	        else {
	            q = l <= 0.5 ? l * (s + 1) : l + s - ( l * s );
	            p = l * 2 - q;
	            return [ T.hueToRgb(p, q, h + 0.33333), T.hueToRgb(p, q, h), T.hueToRgb(p, q, h - 0.33333) ];
	        }

	    },

	    // ----------------------
	    //   SVG MODEL
	    // ----------------------

	    makeColorRing: function( width, stroke ){

	        var w = width || 256;
	        var svg = T.dom( 'svg', T.css.basic , { viewBox:'0 0 '+w+' '+w, width:w, height:w, preserveAspectRatio:'none' } );
	        T.dom( 'defs', null, {}, svg );
	        T.dom( 'g', null, {}, svg );

	        var s = stroke || 40;
	        var r =( w-s )*0.5;
	        var mid = w*0.5;
	        var n = 24, nudge = 8 / r / n * Math.PI, a1 = 0, d1;
	        var am, tan, d2, a2, ar, i, j, path;
	        var color = [];
	        
	        for ( i = 0; i <= n; ++i) {

	            d2 = i / n;
	            a2 = d2 * T.TwoPI;
	            am = (a1 + a2) * 0.5;
	            tan = 1 / Math.cos((a2 - a1) * 0.5);

	            ar = [
	                Math.sin(a1), -Math.cos(a1), 
	                Math.sin(am) * tan, -Math.cos(am) * tan, 
	                Math.sin(a2), -Math.cos(a2)
	            ];
	            
	            color[1] = T.rgbToHex( T.hslToRgb([d2, 1, 0.5]) );

	            if (i > 0) {

	                j = 6;
	                while(j--){
	                   ar[j] = ((ar[j]*r)+mid).toFixed(2);
	                }

	                path = ' M' + ar[0] + ' ' + ar[1] + ' Q' + ar[2] + ' ' + ar[3] + ' ' + ar[4] + ' ' + ar[5];
	                T.dom( 'linearGradient', '', { id:'G'+i, x1:ar[0], y1:ar[1], x2:ar[4], y2:ar[5], gradientUnits:"userSpaceOnUse" }, svg, 0 );
	                T.dom( 'stop', '', { offset:'0%', 'stop-color':color[0] }, svg, [0,i-1] );
	                T.dom( 'stop', '', { offset:'100%', 'stop-color':color[1] }, svg, [0,i-1] );
	                T.dom( 'path', '', { d:path, 'stroke-width':s, stroke:'url(#G'+i+')', 'stroke-linecap':"butt" }, svg, 1 );
	                
	            }
	            a1 = a2 - nudge; 
	            color[0] = color[1];
	            d1 = d2;
	        }

	        var br = (128 - s ) + 2;
	        var bw = 60;

	        T.dom( 'linearGradient', '', { id:'GL1', x1:mid-bw, y1:mid-bw, x2:mid-bw, y2:mid+bw, gradientUnits:"userSpaceOnUse" }, svg, 0 );
	        T.dom( 'stop', '', { offset:'0%', 'stop-color':'#FFFFFF' }, svg, [0,24] );
	        T.dom( 'stop', '', { offset:'50%', 'stop-color':'#FFFFFF', 'stop-opacity':0 }, svg, [0,24] );
	        T.dom( 'stop', '', { offset:'50%', 'stop-color':'#000000', 'stop-opacity':0 }, svg, [0,24] );
	        T.dom( 'stop', '', { offset:'100%', 'stop-color':'#000000' }, svg, [0,24] );

	        T.dom( 'linearGradient', '', { id:'GL2', x1:mid-bw, y1:mid-bw, x2:mid+bw, y2:mid-bw, gradientUnits:"userSpaceOnUse" }, svg, 0 );
	        T.dom( 'stop', '', { offset:'0%', 'stop-color':'#7f7f7f','stop-opacity':0 }, svg, [0,25] );
	        T.dom( 'stop', '', { offset:'50%', 'stop-color':'#7f7f7f','stop-opacity':0.5 }, svg, [0,25] );
	        T.dom( 'stop', '', { offset:'100%', 'stop-color':'#7f7f7f' }, svg, [0,25] );

	        T.dom( 'circle', '', { cx:128, cy:128, r:br, fill:'red' }, svg );//2
	        T.dom( 'circle', '', { cx:128, cy:128, r:br, fill:'url(#GL2)' }, svg );//3
	        T.dom( 'circle', '', { cx:128, cy:128, r:br, fill:'url(#GL1)' }, svg );//4

	        T.dom( 'circle', '', { cx:0, cy:0, r:6, 'stroke-width':3, stroke:'#FFF', fill:'none' }, svg );//5
	        T.dom( 'circle', '', { cx:0, cy:0, r:6, 'stroke-width':3, stroke:'#000', fill:'none' }, svg );//6

	        T.colorRing = svg;

	    },

	    icon: function ( type, color, w ){

	        w = w || 40;
	        color = color || '#DEDEDE';
	        var viewBox = '0 0 256 256';
	        var t = ["<svg xmlns='"+T.svgns+"' version='1.1' xmlns:xlink='"+T.htmls+"' style='pointer-events:none;' preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='"+w+"px' height='"+w+"px' viewBox='"+viewBox+"'><g>"];
	        switch(type){
	            case 'logo':
	            t[1]="<path id='logoin' stroke='"+color+"' stroke-width='16' stroke-linejoin='round' stroke-linecap='square' fill='none' d='M 192 44 L 192 148 Q 192 174.5 173.3 193.25 154.55 212 128 212 101.5 212 82.75 193.25 64 174.5 64 148 L 64 44 M 160 44 L 160 148 Q 160 161.25 150.65 170.65 141.25 180 128 180 114.75 180 105.35 170.65 96 161.25 96 148 L 96 44'/>";
	            break;
	            case 'save':
	            t[1]="<path stroke='"+color+"' stroke-width='4' stroke-linejoin='round' stroke-linecap='round' fill='none' d='M 26.125 17 L 20 22.95 14.05 17 M 20 9.95 L 20 22.95'/><path stroke='"+color+"' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round' fill='none' d='M 32.6 23 L 32.6 25.5 Q 32.6 28.5 29.6 28.5 L 10.6 28.5 Q 7.6 28.5 7.6 25.5 L 7.6 23'/>";
	            break;
	        }
	        t[2] = "</g></svg>";
	        return t.join("\n");

	    },

	};

	T.setText();

	var Tools = T;

	// INTENAL FUNCTION


	var Roots = {

		ui: [],

		ID: null,
	    lock:false,
	    wlock:false,
	    current:-1,

		needReZone: true,
		isEventsInit: false,

		xmlserializer: new XMLSerializer(),
		tmpTime: null,
	    tmpImage: null,

	    oldCursor:'auto',

	    input: null,
	    firstImput: true,
	    callbackImput: null,

	    isLoop: false,
	    listens: [],

	    e:{
	        type:null,
	        clientX:0,
	        clientY:0,
	        keyCode:NaN,
	        key:null,
	        delta:0,
	    },

	    

		add: function( o ){

	        Roots.ui.push( o );
	        Roots.getZone( o );

	        if( !Roots.isEventsInit ) Roots.initEvents();

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    initEvents: function(){

	        if( Roots.isEventsInit ) return;

	        var domElement = document.body;

	        domElement.addEventListener( 'contextmenu', function( e ){ e.preventDefault(); }, false );

	        domElement.addEventListener( 'mousedown', Roots, false );
	        domElement.addEventListener( 'wheel', Roots, false );

	        domElement.addEventListener( 'touchstart', Roots, false );
	        domElement.addEventListener( 'touchend', Roots, false );
	        domElement.addEventListener( 'touchmove', Roots, false );

	        document.addEventListener( 'mousemove', Roots, false );
	        document.addEventListener( 'mouseup', Roots, false );

	        window.addEventListener( 'keydown', Roots, false );
	        window.addEventListener( 'resize', Roots, false );

	        Roots.isEventsInit = true;

	    },

	    // ----------------------
	    //   HANDLE EVENTS
	    // ----------------------

	    handleEvent : function ( event ) {

	        if( event.type === 'resize'){
	            Roots.needReZone = true;
	            return;
	        }

	        event.preventDefault();
	        //event.stopPropagation();

	        Roots.findZone();
	       

	        //console.log(Tools.ID)

	        
	        //else{

	            var e = Roots.e;
	            if( event.type === 'keydown') Roots.editText( event );

	            if( event.type === 'wheel' ) e.delta = event.deltaY > 0 ? 1 : -1;
	            else e.delta = 0;
	            
	            e.clientX = event.clientX || 0;
	            e.clientY = event.clientY || 0;
	            e.type = event.type;

	            if( e.type === 'mousedown' ) Roots.lock = true;
	            if( e.type === 'mouseup' ) Roots.lock = false;//Tools.cursor(); }

	            if( (e.type === 'mousemove') && (!Roots.lock) ){ 
	                Roots.findID( e );
	            }

	            if( Roots.ID !== null ){

	                if( Roots.ID.isCanvasOnly ) {
	                    e.clientX = Roots.ID.mouse.x;
	                    e.clientY = Roots.ID.mouse.y;
	                }

	                Roots.ID.handleEvent( e );

	            }

	        //}

	    },

	    // ----------------------
	    //   ID
	    // ----------------------

	    findID:function ( e ) {

	        var i = Roots.ui.length, next = -1, tmp;

	        while( i-- ){

	            tmp = Roots.ui[i];

	            if( tmp.isCanvasOnly ) {
	                if( Roots.onZone( tmp, tmp.mouse.x, tmp.mouse.y ) ){ 
	                    next = i;
	                    if( next !== Roots.current ){
	                        Roots.clearOldID();
	                        Roots.current = next;
	                        Roots.ID = tmp;
	                    }
	                    break;
	                }
	            } else {

	                if( Roots.onZone( tmp, e.clientX, e.clientY ) ){ 
	                    next = i;
	                    if( next !== Roots.current ){
	                        Roots.clearOldID();
	                        Roots.current = next;
	                        Roots.ID = tmp;
	                    }
	                    break;
	                }

	            }
	                
	        }

	        if( next === -1  ) Roots.clearOldID();

	    },

	    clearOldID: function(){

	        if( !Roots.ID ) return;
	        Roots.cursor();
	        Roots.current = -1;
	        Roots.ID.reset();
	        Roots.ID = null;

	    },


	    // ----------------------
	    //   GUI / GROUP FUNCTION
	    // ----------------------


	    calcUis: function ( uis, zone, py ) {

	        var lng = uis.length, u, i, px = 0;

	        for( i = 0; i < lng; i++ ){

	            u = uis[i];

	            u.zone.w = u.w;
	            u.zone.h = u.h;

	            if( !u.autoWidth ){

	                if( px === 0 ) py += u.h+1;
	                u.zone.y = py - u.h;
	                u.zone.x = zone.x + px;
	                px += u.w;
	                if( px + u.w > zone.w ) px = 0;

	            } else {

	                u.zone.x = zone.x;
	                u.zone.y = py;
	                py += u.h + 1;

	            }

	            if( u.isGroup ) u.calcUis();

	        }

	    },


		findTarget: function ( uis, e ){

	        var i = uis.length;

	        while( i-- ){
	            if( Roots.onZone( uis[i], e.clientX, e.clientY ) ) return i;
	        }

	        return -1;

	    },

	    // ----------------------
	    //   ZONE
	    // ----------------------

	    findZone: function () {

	        if( !Roots.needReZone ) return;

	        var i = Roots.ui.length, tmp;

	        while( i-- ){ 

	            tmp = Roots.ui[i];
	            Roots.getZone( tmp );
	            if( tmp.isGui ) tmp.calcUis();

	        }

	        Roots.needReZone = false;

	    },

	    onZone: function ( o, x, y ) {

	        if( x === undefined || y === undefined ) return false;

	        var z = o.zone;
	        var mx = x - z.x;
	        var my = y - z.y;

	        var over = ( mx >= 0 ) && ( my >= 0 ) && ( mx <= z.w ) && ( my <= z.h );

	        o.local = over ? { x:mx, y :my } : { x:-1, y:-1 };

	        return over;

	    },

	    getZone: function( o ){

	        if( o.isCanvasOnly ) return;
	        var r = o.getDom().getBoundingClientRect();
	        o.zone = { x:r.left, y:r.top, w:r.width, h:r.height };

	    },

	    // ----------------------
	    //   CURSOR
	    // ----------------------

	    cursor : function ( name ) {

	        name = name ? name : 'auto';
	        if( name !== Roots.oldCursor ){
	            document.body.style.cursor = name;
	            Roots.oldCursor = name;
	        }

	    },

	    // ----------------------
	    //   CANVAS
	    // ----------------------

	    toCanvas: function ( o, w, h, force ) {

	        if( force ) { clearTimeout(Roots.tmpTime); Roots.tmpTime = null;  }

	        if( Roots.tmpTime !== null ) return;

	        Roots.tmpTime = setTimeout( function(){ Roots.tmpTime = null; }, 10 );

	        var isNewSize = false;
	        if( w !== o.canvas.width || h !== o.canvas.height ) isNewSize = true;

	        if( Roots.tmpImage === null ) Roots.tmpImage = new Image();

	        var img = Roots.tmpImage; //new Image();

	        var htmlString = Roots.xmlserializer.serializeToString( o.content );
	        
	        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject style="pointer-events: none; left:0;" width="100%" height="100%">'+ htmlString +'</foreignObject></svg>';

	        img.onload = function() {

	            var ctx = o.canvas.getContext("2d");

	            if( isNewSize ){ 
	                o.canvas.width = w;
	                o.canvas.height = h;
	            }else{
	                ctx.clearRect( 0, 0, w, h );
	            }
	            ctx.drawImage( this, 0, 0 );

	            o.onDraw();

	        };

	        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
	        //img.src = 'data:image/svg+xml;base64,'+ window.btoa( svg );
	        img.crossOrigin = '';


	    },

	    // ----------------------
	    //   INPUT
	    // ----------------------

	    /*overInput: function (){

	        var input = Roots.input;

	        //if(input===null) return;
	        //if(!Tools.firstImput && Tools.callbackImput) Tools.callbackImput();
	        //Tools.callbackImput = null;
	        input.style.border = '1px dashed ' + Tools.colors.border;
	        //input.contentEditable = false;
	        //input.blur();
	        //input = null;

	    },*/

	    clearInput: function (){

	        if(Roots.input===null) return;
	        if( !Roots.firstImput ) Roots.callbackImput();

	        Roots.callbackImput = null;
	        Roots.input = null;
	        Roots.firstImput = true;
	        //input.style.border = '1px dashed ' + Tools.colors.hide;
	        //input.contentEditable = false;
	        //input.blur();
	        

	    },

	    setInput: function ( Input, Callback ){

	        Roots.clearInput();

	        
	        Roots.callbackImput = Callback;
	        Roots.input = Input;
	        //Tools.input.style.border = '1px dashed ' + Tools.colors.borderSelect;
	        //Roots.input.style.border = '1px dashed ' + Tools.colors.borderSelect;
	        //Roots.input.contentEditable = true;
	        //Roots.input.focus();
	        //Roots.select( Roots.input );

	    },

	    select: function (){

	        document.execCommand( "selectall", null, false );

	    },

	    editText: function ( e ){

	        var input = Roots.input;

	        if( input === null ) return;



	        if( e.keyCode === 13 ){//enter

	            Roots.callbackImput();
	            Roots.clearInput();

	        } else {

	            if( input.isNum ){
	                if ( ((e.keyCode > 95) && (e.keyCode < 106)) || e.keyCode === 110 || e.keyCode === 109 ){
	                    if(Roots.firstImput){ input.textContent = e.key; Roots.firstImput = false; }
	                    else input.textContent += e.key;
	                }
	            } else {
	                if( Roots.firstImput ){ input.textContent = e.key; Roots.firstImput = false; }
	                else input.textContent += e.key;
	            }

	        }

	        

	    },

	    // ----------------------
	    //   LISTENING
	    // ----------------------

	    loop : function(){

	        if( Roots.isLoop ) requestAnimationFrame( Roots.loop );
	        Roots.update();

	    },

	    update : function(){

	        var i = Roots.listens.length;
	        while(i--) Roots.listens[i].listening();

	    },

	    removeListen : function ( proto ){

	        var id = Roots.listens.indexOf( proto );
	        Roots.listens.splice(id, 1);

	        if( Roots.listens.length === 0 ) Roots.isLoop = false;

	    },

	    addListen : function ( proto ){

	        var id = Roots.listens.indexOf( proto );

	        if( id !== -1 ) return; 

	        Roots.listens.push( proto );

	        if( !Roots.isLoop ){
	            Roots.isLoop = true;
	            Roots.loop();
	        }

	    },


	};

	/**
	 * @author lo-th / https://github.com/lo-th
	 */

	function Proto ( o ) {

	    o = o || {};

	    this.css = Tools.css;
	    this.colors = Tools.colors;

	    //this.type = '';
	    this.name = 'proto';
	    //this.mouse = null;
	    this.zone = { x:0, y:0, w:0, h:0 };
	    this.local = { x:-1, y:-1 };

	    this.isCanvasOnly = false;

	    this.main = o.main || null;
	    // if is on ui pannel
	    this.isUI = o.isUI || false;

	    // percent of title
	    this.p = o.p !== undefined ? o.p : Tools.size.p;

	    this.w = this.isUI ? this.main.size.w : Tools.size.w;
	    if( o.w !== undefined ) this.w = o.w;

	    this.h = this.isUI ? this.main.size.h : Tools.size.h;
	    if( o.h !== undefined ) this.h = o.h;
	    this.h = this.h < 11 ? 11 : this.h;

	    // if need resize width
	    this.autoWidth = true;

	    // if need resize height
	    this.isOpen = false;

	    //this.isGroup = false;
	    this.parentGroup = null;

	    // if height can change
	    this.autoHeight = false;

	    // radius for toolbox
	    this.radius = o.radius || 0;

	    // only for number
	    this.isNumber = false;

	    // only most simple 
	    this.mono = false;

	    // stop listening for edit slide text
	    this.isEdit = false;

	    // no title 
	    this.simple = o.simple || false;
	    if( this.simple ) this.sa = 0;

	    // define obj size
	    this.setSize( this.w );

	    // title size
	    if(o.sa !== undefined ) this.sa = o.sa;
	    if(o.sb !== undefined ) this.sb = o.sb;

	    if( this.simple ) this.sb = this.w - this.sa;

	    // last number size for slide
	    this.sc = o.sc === undefined ? 47 : o.sc;

	    // like dat gui
	    this.parent = null;
	    this.val = null;
	    this.isSend = false;

	    //this.isReady = false;
	    
	    
	    // Background
	    this.bg = this.isUI ? this.main.bg : Tools.colors.background;
	    this.bgOver = Tools.colors.backgroundOver;
	    if( o.bg !== undefined ){ this.bg = o.bg; this.bgOver = o.bg; }
	    if( o.bgOver !== undefined ){ this.bgOver = o.bgOver; }

	    // Font Color;
	    this.titleColor = o.titleColor || Tools.colors.text;
	    this.fontColor = o.fontColor || Tools.colors.text;
	    this.colorPlus = Tools.ColorLuma( this.fontColor, 0.3 );

	    this.name = o.name || 'Proto';
	    
	    this.txt = o.name || 'Proto';
	    this.rename = o.rename || '';
	    this.target = o.target || null;

	    this.callback = o.callback === undefined ? null : o.callback;
	    this.endCallback = null;

	    if( this.callback === null && this.isUI && this.main.callback !== null ) this.callback = this.main.callback;

	    // elements

	    this.c = [];

	    // style 

	    this.s = [];

	    //this.c[0] = Tools.dom('UIL', 'div', 'position:relative; height:20px; float:left;');
	    this.c[0] = Tools.dom( 'div', Tools.css.basic + 'position:relative; height:20px; float:left; overflow:hidden;');
	    this.s[0] = this.c[0].style;

	    if( this.isUI ) this.s[0].marginBottom = '1px';

	    // with title
	    if( !this.simple ){ 
	        this.c[1] = Tools.dom( 'div', Tools.css.txt );
	        this.s[1] = this.c[1].style;
	        this.c[1].textContent = this.rename === '' ? this.txt : this.rename;
	        this.s[1].color = this.titleColor;
	    }

	    if( o.pos ){
	        this.s[0].position = 'absolute';
	        for(var p in o.pos){
	            this.s[0][p] = o.pos[p];
	        }
	        this.mono = true;
	    }

	    if(o.css){
	        this.s[0].cssText = o.css; 
	    }

	}

	Proto.prototype = {

	    constructor: Proto,

	    // ----------------------
	    // make de node
	    // ----------------------
	    
	    init: function () {

	        var s = this.s; // style cache
	        var c = this.c; // div cache

	        s[0].height = this.h + 'px';
	        this.zone.h = this.h;

	        if( this.isUI ) s[0].background = this.bg;

	        //if( this.autoHeight ) s[0].transition = 'height 0.01s ease-out';
	        if( c[1] !== undefined && this.autoWidth ){
	            s[1] = c[1].style;
	            s[1].height = (this.h-4) + 'px';
	            s[1].lineHeight = (this.h-8) + 'px';
	        }

	        var frag = Tools.frag;

	        for( var i=1, lng = c.length; i !== lng; i++ ){
	            if( c[i] !== undefined ) {
	                frag.appendChild( c[i] );
	                s[i] = c[i].style;
	            }
	        }

	        if( this.target !== null ){ 
	            this.target.appendChild( c[0] );
	        } else {
	            if( this.isUI ) this.main.inner.appendChild( c[0] );
	            else document.body.appendChild( c[0] );
	        }

	        c[0].appendChild( frag );

	        this.rSize();

	        // ! solo proto
	        if( !this.isUI ){

	            this.c[0].style.pointerEvents = 'auto';
	            Roots.add( this );
	            
	        }

	    },

	    // TRANS FUNCTIONS

	    dom: function ( type, css, obj, dom, id ) {

	        return Tools.dom( type, css, obj, dom, id );

	    },

	    setSvg: function ( dom, type, value, id ) {

	        Tools.setSvg( dom, type, value, id );

	    },

	    cursor: function ( name ) {

	         Roots.cursor( name );

	    },

	    setInput : function( Input, Callback ){

	        Roots.setInput( Input, Callback  );

	    },

	    /////////

	    getDom: function () {
	        return this.c[0];
	    },

	    uiout: function () {

	        this.s[0].background = this.bg;

	    },

	    uiover: function () {

	        this.s[0].background = this.bgOver;

	    },

	    rename: function ( s ) {

	        if( this.c[1] !== undefined) this.c[1].textContent = s;

	    },

	    listen: function () {

	        Roots.addListen( this );
	        Roots.listens.push( this );
	        return this;

	    },

	    listening: function () {

	        if( this.parent === null ) return;
	        if( this.isSend ) return;
	        if( this.isEdit ) return;

	        this.setValue( this.parent[ this.val ] );

	    },

	    setValue: function ( v ) {

	        if( this.isNumber ) this.value = this.numValue( v );
	        else this.value = v;
	        this.update();

	    },

	    update: function () {
	        
	    },

	    // ----------------------
	    // update every change
	    // ----------------------

	    onChange: function ( f ) {

	        this.callback = f;
	        return this;

	    },

	    // ----------------------
	    // update only on end
	    // ----------------------

	    onFinishChange: function ( f ) {

	        this.callback = null;
	        this.endCallback = f;
	        return this;

	    },

	    send: function ( v ) {

	        this.isSend = true;
	        if( this.parent !== null ) this.parent[ this.val ] = v || this.value;
	        if( this.callback ) this.callback( v || this.value );
	        this.isSend = false;

	    },

	    sendEnd: function ( v ) {

	        if( this.endCallback ) this.endCallback( v || this.value );
	        if( this.parent !== null ) this.parent[ this.val ] = v || this.value;

	    },

	    // ----------------------
	    // clear node
	    // ----------------------
	    
	    clear: function () {

	        Tools.clear( this.c[0] );

	        if( this.target !== null ){ 
	            this.target.removeChild( this.c[0] );
	        } else {
	            if( this.isUI ) this.main.clearOne( this );
	            else document.body.removeChild( this.c[0] );
	        }

	        this.c = null;
	        this.s = null;
	        this.callback = null;
	        this.target = null;

	    },

	    // ----------------------
	    // change size 
	    // ----------------------

	    setSize: function ( sx ) {

	        if( !this.autoWidth ) return;

	        this.w = sx;

	        if( this.simple ){
	            //this.sa = 0;
	            this.sb = this.w - this.sa;
	        } else {
	            var pp = this.w * ( this.p / 100 );
	            this.sa = Math.floor( pp + 10 );
	            this.sb = Math.floor( this.w - pp - 20 );
	        }

	    },

	    rSize: function () {

	        if( !this.autoWidth ) return;
	        this.s[0].width = this.w + 'px';
	        if( !this.simple ) this.s[1].width = this.sa + 'px';
	    
	    },

	    // ----------------------
	    // for numeric value
	    // ----------------------

	    setTypeNumber: function ( o ) {

	        this.isNumber = true;

	        this.value = 0;
	        if(o.value !== undefined){
	            if( typeof o.value === 'string' ) this.value = o.value * 1;
	            else this.value = o.value;
	        }

	        this.min = o.min === undefined ? -Infinity : o.min;
	        this.max = o.max === undefined ?  Infinity : o.max;
	        this.precision = o.precision === undefined ? 2 : o.precision;

	        var s;

	        switch(this.precision){
	            case 0: s = 1; break;
	            case 1: s = 0.1; break;
	            case 2: s = 0.01; break;
	            case 3: s = 0.001; break;
	            case 4: s = 0.0001; break;
	        }

	        this.step = o.step === undefined ?  s : o.step;
	        this.range = this.max - this.min;
	        this.value = this.numValue( this.value );
	        
	    },

	    numValue: function ( n ) {

	        return Math.min( this.max, Math.max( this.min, n ) ).toFixed( this.precision ) * 1;

	    },


	    // ----------------------
	    //   EVENTS DEFAULT
	    // ----------------------

	    handleEvent: function ( e ){

	        return this[e.type](e);
	    
	    },

	    wheel: function ( e ){ return false; },

	    mousedown: function( e ){ return false; },

	    mousemove: function( e ){ return false; },

	    mouseup: function( e ){ return false; },

	    keydown: function( e ){ return false; },


	    // ----------------------
	    // object referency
	    // ----------------------

	    setReferency: function ( obj, val ) {

	        this.parent = obj;
	        this.val = val;

	    },

	    display: function ( v ) {
	        
	        v = v || false;
	        this.s[0].display = v ? 'block' : 'none';
	        //this.isReady = v ? false : true;

	    },

	    // ----------------------
	    // resize height 
	    // ----------------------

	    open: function () {

	        if( this.isOpen ) return;
	        this.isOpen = true;

	    },

	    close: function () {

	        if( !this.isOpen ) return;
	        this.isOpen = false;

	    },

	    reset:  function () {
	    
	    },


	};

	function Bool ( o ){

	    Proto.call( this, o );

	    //this.type = 'bool';

	    this.value = o.value || false;

	    this.buttonColor = o.bColor || this.colors.button;

	    this.inh = o.inh || this.h;

	    var t = Math.floor(this.h*0.5)-((this.inh-2)*0.5);

	    this.c[2] = this.dom( 'div', this.css.basic + 'background:'+ this.colors.boolbg +'; height:'+(this.inh-2)+'px; width:36px; top:'+t+'px; border-radius:10px; border:2px solid '+this.boolbg );
	    this.c[3] = this.dom( 'div', this.css.basic + 'height:'+(this.inh-6)+'px; width:16px; top:'+(t+2)+'px; border-radius:10px; background:'+this.buttonColor+';' );

	    this.init();
	    this.update();

	}

	Bool.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Bool,

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mousemove: function ( e ) {

	        this.cursor('pointer');

	    },

	    mousedown: function( e ){

	        this.value = this.value ? false : true;
	        this.update();
	        this.send();
	        return true;

	    },

	    update: function() {

	        var s = this.s;

	        if( this.value ){
	            
	            s[2].background = this.fontColor;
	            s[2].borderColor = this.fontColor;
	            s[3].marginLeft = '17px';

	        } else {
	            
	            s[2].background = this.colors.boolbg;
	            s[2].borderColor = this.colors.boolbg;
	            s[3].marginLeft = '2px';

	        }
	            
	    },

	    rSize: function(){

	        Proto.prototype.rSize.call( this );
	        var s = this.s;
	        s[2].left = this.sa + 'px';
	        s[3].left = this.sa+1+ 'px';

	    }

	} );

	function Button ( o ) {

	    Proto.call( this, o );

	    this.value = o.value || [this.txt];

	    this.selected = null;
	    this.isDown = false;

	    this.buttonColor = o.bColor || this.colors.button;

	    this.isLoadButton = o.loader || false;
	    this.isDragButton = o.drag || false;
	    if( this.isDragButton ) this.isLoadButton = true;

	    this.lng = this.value.length;
	    this.tmp = [];

	    for(var i = 0; i < this.lng; i++){
	        this.c[i+2] = this.dom( 'div', this.css.txt + 'text-align:center; top:1px; background:'+this.buttonColor+'; height:'+(this.h-2)+'px; border-radius:'+this.radius+'px; line-height:'+(this.h-4)+'px;' );
	        this.c[i+2].style.color = this.fontColor;
	        this.c[i+2].innerHTML = this.value[i];
	    }

	    if( this.c[1] !== undefined ) this.c[1].textContent = '';
	    

	    if( this.isLoadButton ) this.initLoader();
	    if( this.isDragButton ){ 
	        this.lng ++;
	        this.initDrager();
	    }

	    this.init();

	    

	}

	Button.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Button,

	    testZone: function( e ){

	        var l = this.local;
	        if( l.x === -1 && l.y === -1 ) return '';

	        var i = this.lng;
	        var t = this.tmp;
	        

	        while( i-- ){
	        	if( l.x>t[i][0] && l.x<t[i][2] ) return i+2;
	        }

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mouseup: function( e ){
	    
	        if( this.isDown ){
	            this.isDown = false;
	            return this.mousemove( e );
	        }

	        return false;

	    },

	    mousedown: function( e ){

	    	var name = this.testZone( e );

	        if( !name ) return false;

	    	this.isDown = true;
	        this.send( this.value[name-2] );
	    	return this.mousemove( e );
	 
	        // true;

	    },

	    mousemove: function( e ){

	        var name = this.testZone( e );

	        this.reset();

	        if(name){
	        	this.selected = name;
	        	this.s[ name ].color = '#FFF';
	            this.s[ name ].background = this.isDown ? this.colors.down : this.colors.select;
	            this.cursor('pointer');
	            return true;
	        } else {
	        	return false;
	        }

	    },

	    // ----------------------

	    reset: function () {

	    	if( this.selected ){
	    		this.s[ this.selected ].color = this.fontColor;
	            this.s[ this.selected ].background = this.buttonColor;
	            this.selected = null;
	            this.cursor();
	    	}

	    },

	    // ----------------------

	    dragover: function () {

	        this.s[4].borderColor = this.colors.select;
	        this.s[4].color = this.colors.select;

	    },

	    dragend: function () {

	        this.s[4].borderColor = this.fontColor;
	        this.s[4].color = this.fontColor;

	    },

	    drop: function ( e ) {

	        this.dragend();
	        this.fileSelect( e.dataTransfer.files[0] );

	    },

	    initDrager: function () {

	        this.c[4] = this.dom( 'div', this.css.txt +' text-align:center; line-height:'+(this.h-8)+'px; border:1px dashed '+this.fontColor+'; top:2px;  height:'+(this.h-4)+'px; border-radius:'+this.r+'px;' );//pointer-events:auto; cursor:default;
	        this.c[4].textContent = 'DRAG';

	        this.c[2].events = [  ];
	        this.c[4].events = [ 'dragover', 'dragend', 'dragleave', 'drop' ];


	    },

	    initLoader: function () {

	        this.c[3] = this.dom( 'input', this.css.basic +'border:1px solid '+this.colors.border+'; top:1px; opacity:0;  height:'+(this.h-2)+'px;' );//pointer-events:auto; cursor:pointer;
	        this.c[3].name = 'loader';
	        this.c[3].type = "file";

	        this.c[2].events = [  ];
	        this.c[3].events = [ 'change', 'mouseover', 'mousedown', 'mouseup', 'mouseout' ];

	        //this.hide = document.createElement('input');

	    },

	    fileSelect: function ( file ) {

	        var dataUrl = [ 'png', 'jpg', 'mp4', 'webm', 'ogg' ];
	        var dataBuf = [ 'sea', 'bvh', 'BVH', 'z' ];

	        //if( ! e.target.files ) return;

	        //var file = e.target.files[0];
	       
	        //this.c[3].type = "null";
	        // console.log( this.c[4] )

	        if( file === undefined ) return;

	        var reader = new FileReader();
	        var fname = file.name;
	        var type = fname.substring(fname.lastIndexOf('.')+1, fname.length );

	        if( dataUrl.indexOf( type ) !== -1 ) reader.readAsDataURL( file );
	        else if( dataBuf.indexOf( type ) !== -1 ) reader.readAsArrayBuffer( file );
	        else reader.readAsText( file );

	        // if( type === 'png' || type === 'jpg' || type === 'mp4' || type === 'webm' || type === 'ogg' ) reader.readAsDataURL( file );
	        //else if( type === 'z' ) reader.readAsBinaryString( file );
	        //else if( type === 'sea' || type === 'bvh' || type === 'BVH' || type === 'z') reader.readAsArrayBuffer( file );
	        //else if(  ) reader.readAsArrayBuffer( file );
	        //else reader.readAsText( file );

	        reader.onload = function(e) {
	            
	            if( this.callback ) this.callback( e.target.result, fname, type );
	            //this.c[3].type = "file";
	            //this.send( e.target.result ); 
	        }.bind(this);

	    },

	    label: function ( string, n ) {

	        n = n || 2;
	        this.c[n].textContent = string;

	    },

	    icon: function ( string, y, n ) {

	        n = n || 2;
	        this.s[n].padding = ( y || 0 ) +'px 0px';
	        this.c[n].innerHTML = string;

	    },

	    rSize: function () {

	        Proto.prototype.rSize.call( this );

	        var s = this.s;
	        var w = this.sb;
	        var d = this.sa;

	        var i = this.lng;
	        var dc =  3;
	        var size = Math.floor( ( w-(dc*(i-1)) ) / i );

	        while(i--){

	        	this.tmp[i] = [ Math.floor( d + ( size * i ) + ( dc * i )), size ];
	        	this.tmp[i][2] = this.tmp[i][0] + this.tmp[i][1];
	            s[i+2].left = this.tmp[i][0] + 'px';
	            s[i+2].width = this.tmp[i][1] + 'px';

	        }

	        if( this.isDragButton ){ 
	            s[4].left = (d+size+dc) + 'px';
	            s[4].width = size + 'px';
	        }

	        if( this.isLoadButton ){
	            s[3].left = d + 'px';
	            s[3].width = size + 'px';
	        }

	    }

	} );

	function Circular ( o ) {

	    Proto.call( this, o );

	    //this.type = 'circular';
	    this.autoWidth = false;

	    this.buttonColor = this.colors.button;

	    this.setTypeNumber( o );

	    this.radius = Math.floor((this.w-20)*0.5);


	    this.ww = this.height = this.radius * 2;

	    this.h = this.height + 40;



	    this.twoPi = Math.PI * 2;

	    this.top = 0;

	    this.c[0].style.width = this.w +'px';

	    if(this.c[1] !== undefined) {

	        this.c[1].style.width = this.w +'px';
	        this.c[1].style.textAlign = 'center';
	        //this.c[1].style.textAlign = 'center';
	        this.top = 20;

	    }

	    this.percent = 0;

	    this.c[2] = this.dom( 'div', this.css.txt + 'text-align:center; top:'+(this.height+24)+'px; width:'+this.w+'px; color:'+ this.fontColor );
	    this.c[3] = this.dom( 'circle', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px; ', { cx:this.radius, cy:this.radius, r:this.radius, fill:'rgba(0,0,0,0.3)' });//pointer-events:auto; cursor:pointer;
	    this.c[4] = this.dom( 'path', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { d:this.makePath(), fill:this.fontColor });
	    this.c[5] = this.dom( 'circle', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius, r:this.radius*0.5, fill:this.buttonColor, 'stroke-width':1, stroke:this.colors.stroke });

	    this.init();

	    this.update();

	}

	Circular.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Circular,

	    mode: function ( mode ) {

	        switch(mode){
	            case 0: // base
	                this.s[2].color = this.fontColor;
	                this.setSvg( this.c[3], 'fill','rgba(0,0,0,0.2)');
	                this.setSvg( this.c[4], 'fill', this.fontColor );
	            break;
	            case 1: // over
	                this.s[2].color = this.colorPlus;
	                this.setSvg( this.c[3], 'fill','rgba(0,0,0,0.6)');
	                this.setSvg( this.c[4], 'fill', this.colorPlus );
	            break;
	        }

	    },


	    reset: function() {
	        this.mode(0);
	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    

	    mouseup: function ( e ) {

	        this.isDown = false;
	        this.sendEnd();

	    },

	    mousedown: function ( e ) {

	        this.isDown = true;
	        this.old = this.value;
	        this.oldr = null;
	        this.mousemove( e );

	    },

	    mousemove: function ( e ) {

	        this.mode(1);

	        if( !this.isDown ) return;

	        var x = this.radius - (e.clientX - this.zone.x - 10 );
	        var y = this.radius - (e.clientY - this.zone.y - this.top );

	        this.r = Math.atan2( y, x ) - (Math.PI * 0.5);
	        this.r = (((this.r%this.twoPi)+this.twoPi)%this.twoPi);

	        if( this.oldr !== null ){ 

	            var dif = this.r - this.oldr;
	            this.r = Math.abs(dif) > Math.PI ? this.oldr : this.r;

	            if(dif > 6) this.r = 0;
	            if(dif < -6) this.r = this.twoPi;

	        }

	        var steps = 1 / this.twoPi;
	        var value = this.r * steps;

	        var n = ( ( this.range * value ) + this.min ) - this.old;

	        if(n >= this.step || n <= this.step){ 
	            n = ~~ ( n / this.step );
	            this.value = this.numValue( this.old + ( n * this.step ) );
	            this.update( true );
	            this.old = this.value;
	            this.oldr = this.r;
	        }

	    },

	    makePath: function () {

	        var r = this.radius;
	        var end = this.percent * this.twoPi - 0.001;
	        var x2 = r + r * Math.sin(end);
	        var y2 = r - r * Math.cos(end);
	        var big = end > Math.PI ? 1 : 0;
	        return "M " + r + "," + r + " L " + r + "," + 0 + " A " + r + "," + r + " 0 " + big + " 1 " + x2 + "," + y2 + " Z";

	    },

	    update: function ( up ) {

	        this.c[2].textContent = this.value;
	        this.percent = ( this.value - this.min ) / this.range;
	        this.setSvg( this.c[4], 'd', this.makePath() );
	        if( up ) this.send();
	        
	    },

	} );

	function Color ( o ) {
	    
	    Proto.call( this, o );

	    this.autoHeight = true;

	    this.ctype = o.ctype || 'array';
	    this.ww = this.sb;

	    this.wfixe = this.sb;


	    // color up or down
	    this.side = o.side || 'down';
	    this.holdTop = 0;

	    this.decal = this.h + 2;

	    this.spaceRight = Tools.size.s;
	    
	    this.mid = Math.floor( this.wfixe * 0.5 );
	    this.baseH = this.h;
	    this.oldH = this.h;
	    this.oldDiff = 0;

	    this.offset = [];

	    this.c[2] = this.dom( 'div',  this.css.txt + 'height:'+(this.h-4)+'px;' + 'border-radius:'+this.radius+'px; line-height:'+(this.h-8)+'px;' );

	    this.s[2] = this.c[2].style;

	    if(this.side === 'up'){
	        this.decal = 5;
	        this.s[2].top = 'auto';
	        this.s[2].bottom = '2px';
	    }


	    if(!Tools.colorRing) Tools.makeColorRing();
	    this.c[3] = Tools.clone(Tools.colorRing);
	    this.c[3].style.visibility  = 'hidden';

	    this.hsl = null;
	    this.value = '#ffffff';
	    if( o.value !== undefined ){
	        if(o.value instanceof Array) this.value = Tools.rgbToHex( o.value );
	        else if(!isNaN(o.value)) this.value = Tools.hexToHtml( o.value );
	        else this.value = o.value;
	    }

	    this.bcolor = null;
	    this.isDown = false;
	    this.isDraw = false;

	    this.setColor( this.value );

	    this.init();

	    if( o.open !== undefined ) this.open();

	}

	Color.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Color,

		testZone: function( mx, my ){

			var l = this.local;
			if( l.x === -1 && l.y === -1 ) return '';

	    	if( l.y < this.baseH+2 ) return 'title';
	    	else return 'color';

	    },

		// ----------------------
	    //   EVENTS
	    // ----------------------

		mouseup: function( e ){

		    this.isDown = false;

		},

		mousedown: function( e ){

			var name = this.testZone( e.clientX, e.clientY );

			//if( !name ) return;
			if(name === 'title'){
				if( !this.isOpen ) this.open();
		        else this.close();
		        return true;
			}

			if( name === 'color' ){
				this.isDown = true;
		        this.mousemove( e );
			}

		},

		mousemove: function( e ){

		    var name = this.testZone( e.clientX, e.clientY );

		    if( name === 'title' ){

		        this.cursor('pointer');

		    }

		    if( name === 'color' ){

		    	this.cursor('crosshair');

		    	if(this.isDown){

			    	this.offset[0] = this.zone.x + this.sa + this.mid - this.spaceRight;
			    	this.offset[1] = this.zone.y + this.decal + this.mid;

				    var pos = { x: e.clientX - this.offset[0], y: e.clientY - this.offset[1] };
				    var d = Math.sqrt( pos.x * pos.x + pos.y * pos.y )*this.ratio;

				    if ( d<128 ) {
					    if ( d>88 ) {
					        var hue = Math.atan2( pos.x, -pos.y ) / 6.28;//Tools.TwoPi;
					        this.setHSL([(hue + 1) % 1, this.hsl[1], this.hsl[2]]);
					    } else {
					        var sat = Math.max(0, Math.min(1, -( pos.x / this.square * 0.5) + .5) );
					        var lum = Math.max(0, Math.min(1, -( pos.y / this.square * 0.5) + .5) );
					        this.setHSL([this.hsl[0], sat, lum]);
					    }
					}
				}
			}

		},

		setHeight: function ( ) {

			this.h = this.isOpen ? this.wfixe + this.baseH + 5 : this.baseH;
			this.s[0].height = this.h + 'px';
			this.zone.h = this.h;

		},

		parentHeight: function ( t ) {

			if ( this.parentGroup !== null ) this.parentGroup.calc( t );
		    else if ( this.isUI ) this.main.calc( t );

		},

		open: function(){

			Proto.prototype.open.call( this );

			//this.h = this.openHeight + this.baseH;

			this.setHeight();

			var t = this.h - this.baseH;

		    this.s[3].visibility = 'visible';
		    //this.s[3].display = 'block';
		    this.parentHeight( t );

		},

		close: function(){

			Proto.prototype.close.call( this );

			var t = this.h - this.baseH;

			this.setHeight();

		    this.s[3].visibility  = 'hidden';
		    //this.s[3].display = 'none';
		    this.parentHeight( -t );

		},

		update: function( up ){

		    var cc = Tools.rgbToHex( Tools.hslToRgb([this.hsl[0], 1, 0.5]) );

		    this.drawMarkers();
		    
		    this.value = this.bcolor;

		    this.setSvg( this.c[3], 'fill', cc, 2 );

		    this.s[2].background = this.bcolor;
		    this.c[2].textContent = Tools.htmlToHex( this.bcolor );

		    this.invert = Tools.findDeepInver( this.rgb );
		    this.s[2].color = this.invert ? '#fff' : '#000';

		    if(!up) return;

		    if( this.ctype === 'array' ) this.send( this.rgb );
		    if( this.ctype === 'rgb' ) this.send( Tools.htmlRgb( this.rgb ) );
		    if( this.ctype === 'hex' ) this.send( Tools.htmlToHex( this.value ) );
		    if( this.ctype === 'html' ) this.send();

		},

		setColor: function( color ){

		    var unpack = Tools.unpack(color);
		    if (this.bcolor != color && unpack) {
		        this.bcolor = color;
		        this.rgb = unpack;
		        this.hsl = Tools.rgbToHsl( this.rgb );
		        this.update();
		    }
		    return this;

		},

		setHSL: function( hsl ){

		    this.hsl = hsl;
		    this.rgb = Tools.hslToRgb( hsl );
		    this.bcolor = Tools.rgbToHex( this.rgb );
		    this.update( true );
		    return this;

		},

		drawMarkers: function(){

		    var sr = 60;
		    var ra = 128-20; 
		    var c1 = this.invert ? '#fff' : '#000';//, c2 = this.invert ? '#000' : '#fff';
		    var angle = this.hsl[0] * 6.28;
		    var ar = [Math.sin(angle) * ra, -Math.cos(angle) * ra, 2 * sr * (.5 - this.hsl[1]), 2 * sr * (.5 - this.hsl[2]) ];

		    this.setSvg( this.c[3], 'cx', ar[2]+128, 5 );
		    this.setSvg( this.c[3], 'cy', ar[3]+128, 5 );
		    this.setSvg( this.c[3], 'stroke', c1, 5 );

		    this.setSvg( this.c[3], 'cx', ar[0]+128, 6 );
		    this.setSvg( this.c[3], 'cy', ar[1]+128, 6 );

		},

		rSize: function(){

		    Proto.prototype.rSize.call( this );

		    this.ww = this.sb;
		    //this.openHeight = this.ww+5;///10;

		    if( this.side === 'up' ) this.decal = 5;
		    this.mid = Math.floor( this.wfixe * 0.5 );

		    var s = this.s;

		    s[2].width = this.sb + 'px';
		    s[2].left = this.sa + 'px';

		    this.setSvg( this.c[3], 'viewBox', '0 0 '+this.wfixe+' '+this.wfixe );
		    s[3].width = this.wfixe + 'px';
		    s[3].height = this.wfixe + 'px';
	    	s[3].left = this.sa - this.spaceRight + 'px';
		    s[3].top = this.decal + 'px';

		    this.ratio = 256/this.wfixe;
		    this.square = (60)*(this.wfixe/256);
		    
		    this.setHeight();
		    
		}

	} );

	function Fps ( o ) {

	    Proto.call( this, o );

	    this.round = Math.round;

	    this.autoHeight = true;

	    this.baseH = this.h;
	    this.hplus = 50;

	    this.res = o.res || 40;
	    this.l = 1;

	    this.pa1 = [];
	    this.pa2 = [];
	    this.pa3 = [];

	    var i = this.res+1;
	    while(i--){
	        this.pa1.push(50);
	        this.pa2.push(50);
	        this.pa3.push(50);
	    }

	    var fltop = Math.floor(this.h*0.5)-6;

	    this.c[1].textContent = 'FPS';
	    this.c[0].style.cursor = 'pointer';
	    this.c[0].style.pointerEvents = 'auto';

	    var panelCss = 'display:none; left:10px; top:'+ this.h + 'px; height:'+(this.hplus - 8)+'px; background: rgba(0, 0, 0, 0.2);' + 'border:1px solid rgba(255, 255, 255, 0.2); ';

	    this.c[2] = this.dom( 'path', this.css.basic + panelCss , { fill:'rgba(200,200,200,0.3)', 'stroke-width':1, stroke:this.fontColor, 'vector-effect':'non-scaling-stroke' });

	    this.c[2].setAttribute('viewBox', '0 0 '+this.res+' 42' );
	    this.c[2].setAttribute('height', '100%' );
	    this.c[2].setAttribute('width', '100%' );
	    this.c[2].setAttribute('preserveAspectRatio', 'none' );

	    this.dom( 'path', null, { fill:'rgba(255,255,0,0.3)', 'stroke-width':1, stroke:'#FF0', 'vector-effect':'non-scaling-stroke' }, this.c[2] );
	    this.dom( 'path', null, { fill:'rgba(0,255,255,0.3)', 'stroke-width':1, stroke:'#0FF', 'vector-effect':'non-scaling-stroke' }, this.c[2] );


	    // bottom line
	    this.c[3] = this.dom( 'div', this.css.basic + 'width:100%; bottom:0px; height:1px; background: rgba(255, 255, 255, 0.2);');

	    this.c[4] = this.dom( 'path', this.css.basic + 'position:absolute; width:10px; height:10px; left:4px; top:'+fltop+'px;', { d:'M 3 8 L 8 5 3 2 3 8 Z', fill:this.fontColor, stroke:'none'});

	    this.isShow = o.show || false;

	    this.c[1].style.marginLeft = '10px';

	    this.now = ( self.performance && self.performance.now ) ? self.performance.now.bind( performance ) : Date.now;
	    this.startTime = this.now();
	    this.prevTime = this.startTime;
	    this.frames = 0;

	    this.isMem = false;

	    this.ms = 0;
	    this.fps = 0;
	    this.mem = 0;
	    this.mm = 0;

	    if ( self.performance && self.performance.memory ) this.isMem = true;

	    //this.c[0].events = [ 'click', 'mousedown', 'mouseover', 'mouseout' ];

	    this.init();

	    //if( this.isShow ) this.show();

	}


	Fps.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Fps,

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mousedown: function ( e ) {

	        if( this.isShow ) this.hide();
	        else this.show();

	    },

	    // ----------------------

	    mode: function ( mode ) {

	        var s = this.s;

	        switch(mode){
	            case 0: // base
	                s[1].color = this.fontColor;
	                //s[1].background = 'none';
	            break;
	            case 1: // over
	                s[1].color = '#FFF';
	                //s[1].background = UIL.SELECT;
	            break;
	            case 2: // edit / down
	                s[1].color = this.fontColor;
	                //s[1].background = UIL.SELECTDOWN;
	            break;

	        }
	    },

	    

	    makePath: function ( point ) {

	        var p = '';
	        p += 'M ' + (-1) + ' ' + 50;
	        for ( var i = 0; i < this.res + 1; i ++ ) { p += ' L ' + i + ' ' + point[i]; }
	        p += ' L ' + (this.res + 1) + ' ' + 50;

	        return p;

	    },

	    drawGraph: function( ){

	        var svg = this.c[2];

	        this.pa1.shift();
	        this.pa1.push( 8.5 + this.round( ( 1 - (this.fps / 100)) * 30 ) );

	        this.setSvg( svg, 'd', this.makePath( this.pa1 ), 0 );

	        this.pa2.shift();
	        this.pa2.push( 8.5 + this.round( ( 1 - (this.ms / 200)) * 30 ) );

	        this.setSvg( svg, 'd', this.makePath( this.pa2 ), 1 );

	        if ( this.isMem ) {

	            this.pa3.shift();
	            this.pa3.push( 8.5 + this.round( ( 1 - this.mm) * 30 ) );

	            this.setSvg( svg, 'd', this.makePath( this.pa3 ), 2 );

	        }

	    },

	    show: function(){

	        this.h = this.hplus + this.baseH;

	        this.setSvg( this.c[4], 'd','M 5 8 L 8 3 2 3 5 8 Z');


	        if( this.parentGroup !== null ){ this.parentGroup.calc( this.hplus );}
	        else if( this.isUI ) this.main.calc( this.hplus );

	        this.s[0].height = this.h +'px';
	        this.s[2].display = 'block'; 
	        this.isShow = true;

	        Roots.addListen( this );

	    },

	    hide: function(){

	        this.h = this.baseH;

	        this.setSvg( this.c[4], 'd','M 3 8 L 8 5 3 2 3 8 Z');

	        if( this.parentGroup !== null ){ this.parentGroup.calc( -this.hplus );}
	        else if( this.isUI ) this.main.calc( -this.hplus );
	        
	        this.s[0].height = this.h +'px';
	        this.s[2].display = 'none';
	        this.isShow = false;

	        Roots.removeListen( this );
	        this.c[1].textContent = 'FPS';
	        
	    },



	    //////////////////

	    begin: function(){

	        this.startTime = this.now();
	        
	    },

	    end: function(){


	        var time = this.now();
	        this.ms = time - this.startTime;

	        this.frames ++;

	        if ( time > this.prevTime + 1000 ) {

	            this.fps = this.round( ( this.frames * 1000 ) / ( time - this.prevTime ) );

	            this.prevTime = time;
	            this.frames = 0;

	            if ( this.isMem ) {

	                var heapSize = performance.memory.usedJSHeapSize;
	                var heapSizeLimit = performance.memory.jsHeapSizeLimit;

	                this.mem = this.round( heapSize * 0.000000954 );

	                this.mm = heapSize / heapSizeLimit;

	            }

	        }

	        this.drawGraph();
	        this.c[1].innerHTML = 'FPS ' + this.fps + '<font color="yellow"> MS '+ ( this.ms | 0 ) + '</font><font color="cyan"> MB '+ this.mem + '</font>';

	        return time;

	        
	    },

	    listening: function(){

	        this.startTime = this.end();
	        
	    },

	    rSize: function(){

	        this.s[0].width = this.w + 'px';
	        this.s[1].width = this.w + 'px';
	        this.s[2].left = 10 + 'px';
	        this.s[2].width = (this.w-20) + 'px';
	        
	    },
	    
	} );

	function Group ( o ) {
	 
	    Proto.call( this, o );

	    this.autoHeight = true;
	    //this.isGroup = true;

	    this.current = -1;
	    this.target = null;

	    this.decal = 0;

	    //this.bg = o.bg || null;
	    

	    //this.h = 25;
	    this.baseH = this.h;
	    var fltop = Math.floor(this.h*0.5)-6;


	    this.isLine = o.line !== undefined ? o.line : false;

	    this.c[2] = Tools.dom( 'div', Tools.css.basic + 'width:100%; left:0; height:auto; overflow:hidden; top:'+this.h+'px');
	    this.c[3] = Tools.dom( 'path', Tools.css.basic + 'position:absolute; width:10px; height:10px; left:0; top:'+fltop+'px;', { d:Tools.GPATH, fill:this.fontColor, stroke:'none'});
	    this.c[4] = Tools.dom( 'path', Tools.css.basic + 'position:absolute; width:10px; height:10px; left:4px; top:'+fltop+'px;', { d:'M 3 8 L 8 5 3 2 3 8 Z', fill:this.fontColor, stroke:'none'});
	    // bottom line
	    if(this.isLine) this.c[5] = Tools.dom( 'div', Tools.css.basic +  'background:rgba(255, 255, 255, 0.2); width:100%; left:0; height:1px; bottom:0px');

	    var s = this.s;

	    s[0].height = this.h + 'px';
	    s[1].height = this.h + 'px';
	    //s[1].top = 4 + 'px';
	    //s[1].left = 4 + 'px';
	    //s[1].pointerEvents = 'auto';
	    //s[1].cursor = 'pointer';
	    this.c[1].name = 'group';

	    this.s[1].marginLeft = '10px';
	    this.s[1].lineHeight = this.h-4;
	    this.s[1].color = this.fontColor;
	    this.s[1].fontWeight = 'bold';

	    this.uis = [];

	    this.c[1].events = [ 'click' ];

	    this.init();

	    if( o.bg !== undefined ) this.setBG(o.bg);
	    if( o.open !== undefined ) this.open();

	}

	Group.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Group,

	    isGroup: true,

	    testZone: function( e ){

	        var l = this.local;
	        if( l.x === -1 && l.y === -1 ) return '';

	        var name = '';

	        if( l.y < this.baseH ) name = 'title';
	        else {
	            if( this.isOpen ) name = 'content';
	        }

	        return name;

	    },

	    clearTarget: function (){

	        if( this.current === -1 ) return false;

	       // if(!this.target) return;
	        this.target.uiout();
	        this.target.reset();
	        this.current = -1;
	        this.target = null;
	        Roots.cursor();
	        return true;

	    },

	    reset: function () {

	        this.clearTarget();

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    handleEvent: function ( e ){

	        var type = e.type;

	        var change = false;
	        var targetChange = false;

	        var name = this.testZone( e );

	        if( !name ) return;

	        switch( name ){

	            case 'content':

	            if( this.target ) targetChange = this.target.handleEvent( e );

	            //if( type === 'mousemove' ) change = this.styles('def');

	            if( !Roots.lock ){

	                //var next = this.findID( e );
	                var next = Roots.findTarget( this.uis, e );

	                if( next !== this.current ){
	                    this.clearTarget();
	                    this.current = next;
	                    change = true;
	                }

	                if( next !== -1 ){ 
	                    this.target = this.uis[this.current];
	                    this.target.uiover();
	                   // this.target.handleEvent( e );
	                }

	            }

	            break;
	            case 'title':
	            if( type === 'mousedown' ){
	                if( this.isOpen ) this.close();
	                else this.open();
	            }
	            break;


	        }

	        if( this.isDown ) change = true;
	        if( targetChange ) change = true;

	        return change;

	    },

	    // ----------------------

	    calcH: function () {

	        var lng = this.uis.length, i, u,  h=0, px=0, tmph=0;
	        for( i = 0; i < lng; i++){
	            u = this.uis[i];
	            if( !u.autoWidth ){

	                if(px===0) h += u.h+1;
	                else {
	                    if(tmph<u.h) h += u.h-tmph;
	                }
	                tmph = u.h;

	                //tmph = tmph < u.h ? u.h : tmph;
	                px += u.w;
	                if(px+u.w>this.w){ px = 0; }

	            }
	            else h += u.h+1;
	        }

	        return h;
	    },

	    calcUis: function () {

	        if( !this.isOpen ) return;

	        Roots.calcUis( this.uis, this.zone, this.zone.y + this.baseH );

	        //console.log('group calcuis')

	    },


	    setBG: function ( c ) {

	        this.s[0].background = c;

	        var i = this.uis.length;
	        while(i--){
	            this.uis[i].setBG( c );
	        }

	    },

	    add: function( ){

	        var a = arguments;

	        if( typeof a[1] === 'object' ){ 
	            a[1].isUI = this.isUI;
	            a[1].target = this.c[2];
	            a[1].main = this.main;
	        } else if( typeof arguments[1] === 'string' ){
	            if( a[2] === undefined ) [].push.call(a, { isUI:true, target:this.c[2], main:this.main });
	            else{ 
	                a[2].isUI = true;
	                a[2].target = this.c[2];
	                a[2].main = this.main;
	            }
	        }

	        var n = add.apply( this, a );
	        this.uis.push( n );

	        if( n.autoHeight ) n.parentGroup = this;

	        return n;

	    },

	    parentHeight: function ( t ) {

	        if ( this.parentGroup !== null ) this.parentGroup.calc( t );
	        else if ( this.isUI ) this.main.calc( t );

	    },

	    open: function () {

	        Proto.prototype.open.call( this );

	        Tools.setSvg( this.c[4], 'd','M 5 8 L 8 3 2 3 5 8 Z');
	        //this.s[4].background = UIL.F1;
	        this.rSizeContent();

	        var t = this.h - this.baseH;

	        this.parentHeight( t );

	    },

	    close: function () {

	        Proto.prototype.close.call( this );

	        var t = this.h - this.baseH;

	        Tools.setSvg( this.c[4], 'd','M 3 8 L 8 5 3 2 3 8 Z');
	        this.h = this.baseH;
	        this.s[0].height = this.h + 'px';

	        this.parentHeight( -t );

	    },

	    clear: function(){

	        this.clearGroup();
	        if( this.isUI ) this.main.calc( -(this.h +1 ));
	        Proto.prototype.clear.call( this );

	    },

	    clearGroup: function(){

	        this.close();

	        var i = this.uis.length;
	        while(i--){
	            this.uis[i].clear();
	            this.uis.pop();
	        }
	        this.uis = [];
	        this.h = this.baseH;

	    },

	    calc: function( y ){

	        if( !this.isOpen ) return;

	        if( y !== undefined ){ 
	            this.h += y;
	            if( this.isUI ) this.main.calc( y );
	        } else {
	            //this.h = this.c[2].offsetHeight + this.baseH;
	            this.h = this.calcH() + this.baseH;
	        }
	        this.s[0].height = this.h + 'px';

	        //if(this.isOpen) this.calcUis();

	    },

	    rSizeContent: function(){

	        var i = this.uis.length;
	        while(i--){
	            this.uis[i].setSize( this.w );
	            this.uis[i].rSize();
	        }
	        this.calc();

	    },

	    rSize: function(){

	        Proto.prototype.rSize.call( this );

	        var s = this.s;

	        s[3].left = ( this.sa + this.sb - 17 ) + 'px';
	        s[1].width = this.w + 'px';
	        s[2].width = this.w + 'px';

	        if( this.isOpen ) this.rSizeContent();

	    }

	} );

	function Joystick ( o ) {

	    Proto.call( this, o );

	    this.autoWidth = false;

	    this.value = [0,0];

	    this.joyType = 'analogique';

	    this.precision = o.precision || 2;
	    this.multiplicator = o.multiplicator || 1;

	    this.x = 0;
	    this.y = 0;

	    this.oldx = 0;
	    this.oldy = 0;

	    this.interval = null;

	    this.radius = Math.floor((this.w-20)*0.5);

	    this.innerRadius = o.innerRadius || this.radius*0.6;
	    this.maxDistance = this.radius - this.innerRadius - 5;
	    this.height = this.radius*2;
	    this.h = o.height || (this.height + 40);

	    this.top = 0;

	    this.c[0].style.width = this.w +'px';

	    if(this.c[1] !== undefined) {

	        this.c[1].style.width = this.w +'px';
	        this.c[1].style.textAlign = 'center';
	        this.top = 20;

	    }

	    this.c[2] = this.dom( 'circle', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.w+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius, r:this.radius, fill:'url(#grad)' });
	    this.c[3] = this.dom( 'circle', this.css.basic + 'left:0px; top:'+(this.top-10)+'px; width:'+(this.w+20)+'px; height:'+(this.height+20)+'px;', { cx:this.radius+10, cy:this.radius+10, r:this.innerRadius+10, fill:'url(#gradS)'});
	    this.c[4] = this.dom( 'circle', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.w+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius, r:this.innerRadius, fill:'url(#gradIn)', 'stroke-width':1, stroke:'#000'  });
	    this.c[5] = this.dom( 'div', this.css.txt + 'text-align:center; top:'+(this.height+20)+'px; width:'+this.w+'px; color:'+ this.fontColor );

	    // gradian bakground
	    var svg = this.c[2];
	    this.dom( 'defs', null, {}, svg );
	    this.dom( 'radialGradient', null, {id:'grad', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, svg, 1 );
	    this.dom( 'stop', null, { offset:'40%', style:'stop-color:rgb(0,0,0); stop-opacity:0.3;' }, svg, [1,0] );
	    this.dom( 'stop', null, { offset:'80%', style:'stop-color:rgb(0,0,0); stop-opacity:0;' }, svg, [1,0] );
	    this.dom( 'stop', null, { offset:'90%', style:'stop-color:rgb(50,50,50); stop-opacity:0.4;' }, svg, [1,0] );
	    this.dom( 'stop', null, { offset:'100%', style:'stop-color:rgb(50,50,50); stop-opacity:0;' }, svg, [1,0] );

	    // gradian shadow
	    svg = this.c[3];
	    this.dom( 'defs', null, {}, svg );
	    this.dom( 'radialGradient', null, {id:'gradS', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, svg, 1 );
	    this.dom( 'stop', null, { offset:'60%', style:'stop-color:rgb(0,0,0); stop-opacity:0.5;' }, svg, [1,0] );
	    this.dom( 'stop', null, { offset:'100%', style:'stop-color:rgb(0,0,0); stop-opacity:0;' }, svg, [1,0] );

	    // gradian stick

	    var cc0 = ['rgb(40,40,40)', 'rgb(48,48,48)', 'rgb(30,30,30)'];
	    var cc1 = ['rgb(1,90,197)', 'rgb(3,95,207)', 'rgb(0,65,167)'];

	    svg = this.c[4];
	    this.dom( 'defs', null, {}, svg );
	    this.dom( 'radialGradient', null, {id:'gradIn', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, svg, 1 );
	    this.dom( 'stop', null, { offset:'30%', style:'stop-color:'+cc0[0]+'; stop-opacity:1;' }, svg, [1,0] );
	    this.dom( 'stop', null, { offset:'60%', style:'stop-color:'+cc0[1]+'; stop-opacity:1;' }, svg, [1,0]  );
	    this.dom( 'stop', null, { offset:'80%', style:'stop-color:'+cc0[1]+'; stop-opacity:1;' }, svg, [1,0]  );
	    this.dom( 'stop', null, { offset:'100%', style:'stop-color:'+cc0[2]+'; stop-opacity:1;' }, svg, [1,0]  );

	    this.dom( 'radialGradient', null, {id:'gradIn2', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, this.c[4], 1 );
	    this.dom( 'stop', null, { offset:'30%', style:'stop-color:'+cc1[0]+'; stop-opacity:1;' }, svg, [1,1]  );
	    this.dom( 'stop', null, { offset:'60%', style:'stop-color:'+cc1[1]+'; stop-opacity:1;' }, svg, [1,1] );
	    this.dom( 'stop', null, { offset:'80%', style:'stop-color:'+cc1[1]+'; stop-opacity:1;' }, svg, [1,1] );
	    this.dom( 'stop', null, { offset:'100%', style:'stop-color:'+cc1[2]+'; stop-opacity:1;' }, svg, [1,1] );

	    this.c[5].textContent = 'x'+ this.value[0] +' y' + this.value[1];

	    this.init();

	    this.update(false);
	}

	Joystick.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Joystick,

	    mode: function ( mode ) {

	        switch(mode){
	            case 0: // base
	                this.setSvg( this.c[4], 'fill','url(#gradIn)');
	                this.setSvg( this.c[4], 'stroke', '#000' );
	            break;
	            case 1: // over
	                this.setSvg( this.c[4], 'fill', 'url(#gradIn2)' );
	                this.setSvg( this.c[4], 'stroke', 'rgba(0,0,0,0)' );
	            break;
	            case 2: // edit
	            break;

	        }
	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    reset: function() {
	        this.mode(0);
	    },

	    mouseup: function( e ){

	        this.isDown = false;
	        this.interval = setInterval(this.update.bind(this), 10);

	        //if(this.isOver) this.mode(1);
	        //else this.mode(0);
	        
	    },

	    mousedown: function( e ){

	        this.isDown = true;
	        this.mousemove( e );
	        this.mode( 2 );

	    },

	    mousemove: function ( e ) {

	        this.mode(1);

	        if( !this.isDown ) return;

	        var x = this.radius - ( e.clientX - this.zone.x - 10 );
	        var y = this.radius - ( e.clientY - this.zone.y - this.top );

	        var distance = Math.sqrt( x * x + y * y );

	        if ( distance > this.maxDistance ) {
	            var angle = Math.atan2(x, y);
	            x = Math.sin(angle) * this.maxDistance;
	            y = Math.cos(angle) * this.maxDistance;
	        }

	        this.x = x / this.maxDistance;
	        this.y = y / this.maxDistance;

	        this.update();

	    },

	    setValue: function ( x, y ) {

	        this.x = x || 0;
	        this.y = y || 0;

	        this.updateSVG();

	    },

	    update: function ( up ) {

	        if(up === undefined) up = true;

	        if( this.interval !== null ){

	            if( !this.isDown ){
	                this.x += (0 - this.x)/3;
	                this.y += (0 - this.y)/3;
	            }

	            if ( this.x.toFixed(2) === this.oldx.toFixed(2) && this.y.toFixed(2) === this.oldy.toFixed(2)){
	                
	                this.x = 0;
	                this.y = 0;
	            }

	        }

	        this.updateSVG();

	        if( up ) this.send();

	        if( this.interval !== null && this.x === 0 && this.y === 0 ){
	            clearInterval( this.interval );
	            this.interval = null;
	        }

	    },

	    updateSVG: function () {

	        var rx = this.x * this.maxDistance;
	        var ry = this.y * this.maxDistance;
	        var x = this.radius - rx;
	        var y = this.radius - ry;
	        var sx = x + ((1-this.x)*5) + 5;
	        var sy = y + ((1-this.y)*5) + 10;

	        this.setSvg( this.c[3], 'cx', sx );
	        this.setSvg( this.c[3], 'cy', sy );
	        this.setSvg( this.c[4], 'cx', x );
	        this.setSvg( this.c[4], 'cy', y );

	        this.oldx = this.x;
	        this.oldy = this.y;

	        this.value[0] = -( this.x * this.multiplicator ).toFixed( this.precision ) * 1;
	        this.value[1] =  ( this.y * this.multiplicator ).toFixed( this.precision ) * 1;

	        this.c[5].textContent = 'x'+ this.value[0] +' y' + this.value[1];

	    },

	} );

	function Knob ( o ) {

	    Proto.call( this, o );

	    this.autoWidth = false;

	    this.buttonColor = this.colors.button;

	    this.setTypeNumber( o );

	    this.mPI = Math.PI * 0.8;
	    this.toDeg = 180 / Math.PI;
	    this.cirRange = this.mPI * 2;

	    this.radius = Math.floor((this.w-20)*0.5);

	    this.ww = this.height = this.radius * 2;
	    this.h = o.height || (this.height + 40);
	    this.top = 0;

	    this.c[0].style.width = this.w +'px';

	    if(this.c[1] !== undefined) {

	        this.c[1].style.width = this.w +'px';
	        this.c[1].style.textAlign = 'center';
	        this.top = 20;

	    }

	    this.percent = 0;

	    this.c[2] = this.dom( 'div', this.css.txt + 'text-align:center; top:'+(this.height+24)+'px; width:'+this.w+'px; color:'+ this.fontColor );
	    this.c[3] = this.dom( 'circle', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px; ', { cx:this.radius, cy:this.radius, r:this.radius-4, fill:'rgba(0,0,0,0.3)' });
	    this.c[4] = this.dom( 'circle', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius*0.5, r:3, fill:this.fontColor });
	    this.c[5] = this.dom( 'path', this.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { d:this.makeGrad(), 'stroke-width':1, stroke:this.colors.stroke });
	    
	    this.dom( 'circle', null, { cx:this.radius, cy:this.radius, r:this.radius*0.7, fill:this.buttonColor, 'stroke-width':1, stroke:this.colors.stroke }, this.c[3] );

	    this.r = 0;

	    this.init();

	    this.update();

	}

	Knob.prototype = Object.assign( Object.create( Circular.prototype ), {

	    constructor: Knob,

	    mousemove: function( e ){

	        this.mode(1);

	        if( !this.isDown ) return;

	        var x = this.radius - (e.clientX - this.zone.x - 10);
	        var y = this.radius - (e.clientY - this.zone.y - this.top);

	        this.r = - Math.atan2( x, y );

	        if( this.oldr !== null ) this.r = Math.abs(this.r - this.oldr) > Math.PI ? this.oldr : this.r;

	        this.r = this.r > this.mPI ? this.mPI : this.r;
	        this.r = this.r < -this.mPI ? -this.mPI : this.r;

	        var steps = 1 / this.cirRange;
	        var value = (this.r + this.mPI) * steps;

	        var n = ( ( this.range * value ) + this.min ) - this.old;

	        if(n >= this.step || n <= this.step){ 
	            n = ~~ ( n / this.step );
	            this.value = this.numValue( this.old + ( n * this.step ) );
	            this.update( true );
	            this.old = this.value;
	            this.oldr = this.r;
	        }

	    },

	    makeGrad: function () {

	        var d = '', step, range, a, x, y, x2, y2, r = this.radius;
	        var startangle = Math.PI + this.mPI;
	        var endangle = Math.PI - this.mPI;

	        if(this.step>5){
	            range =  this.range / this.step;
	            step = ( startangle - endangle ) / range;
	        } else {
	            step = ( startangle - endangle ) / r;
	            range = r;
	        }

	        for ( var i = 0; i <= range; ++i ) {

	            a = startangle - ( step * i );
	            x = r + Math.sin( a ) * r;
	            y = r + Math.cos( a ) * r;
	            x2 = r + Math.sin( a ) * ( r - 3 );
	            y2 = r + Math.cos( a ) * ( r - 3 );
	            d += 'M' + x + ' ' + y + ' L' + x2 + ' '+y2 + ' ';

	        }

	        return d;

	    },

	    update: function ( up ) {

	        this.c[2].textContent = this.value;
	        this.percent = (this.value - this.min) / this.range;

	        var r = ( (this.percent * this.cirRange) - (this.mPI)) * this.toDeg;

	        this.setSvg( this.c[4], 'transform', 'rotate('+ r +' '+this.radius+' '+this.radius+')' );

	        if( up ) this.send();
	        
	    },

	} );

	function List ( o ) {

	    Proto.call( this, o );

	    this.autoHeight = false;
	    var align = o.align || 'center';

	    this.sMode = 0;
	    this.tMode = 0;

	    this.buttonColor = o.bColor || this.colors.button;

	    var fltop = Math.floor(this.h*0.5)-5;

	    this.c[2] = this.dom( 'div', this.css.basic + 'top:0; display:none;' );
	    this.c[3] = this.dom( 'div', this.css.txt + 'text-align:'+align+'; line-height:'+(this.h-4)+'px; top:1px;  background:'+this.buttonColor+'; height:'+(this.h-2)+'px; border-radius:'+this.radius+'px;' );
	    this.c[4] = this.dom( 'path', this.css.basic + 'position:absolute; width:10px; height:10px; top:'+fltop+'px;', { d:'M 3 8 L 8 5 3 2 3 8 Z', fill:this.fontColor, stroke:'none'});

	    this.scroller = this.dom( 'div', this.css.basic + 'right:5px;  width:10px; background:#666; display:none;');

	    this.c[3].style.color = this.fontColor;

	    this.list = o.list || [];
	    this.items = [];

	    this.prevName = '';

	    this.baseH = this.h;

	    this.itemHeight = o.itemHeight || (this.h-3);

	    // force full list 
	    this.full = o.full || false;

	    this.py = 0;
	    this.ww = this.sb;
	    this.scroll = false;
	    this.isDown = false;

	    this.currentItem = null;

	    // list up or down
	    this.side = o.side || 'down';
	    this.holdTop = 0;

	    if( this.side === 'up' ){

	        this.c[2].style.top = 'auto';
	        this.c[3].style.top = 'auto';
	        this.c[4].style.top = 'auto';
	        //this.c[5].style.top = 'auto';

	        this.c[2].style.bottom = this.h-2 + 'px';
	        this.c[3].style.bottom = '1px';
	        this.c[4].style.bottom = fltop + 'px';
	        //this.c[5].style.bottom = '2px';

	    } else {
	        this.c[2].style.top = this.baseH + 'px';
	        //this.c[6].style.top = this.h + 'px';
	    }

	    this.listIn = this.dom( 'div', this.css.basic + 'left:0; top:0; width:100%; background:rgba(0,0,0,0.2);');
	    this.listIn.name = 'list';

	    this.topList = 0;

	    
	    this.c[2].appendChild( this.listIn );
	    this.c[2].appendChild( this.scroller );

	    // populate list

	    this.setList( this.list, o.value );

	   
	    this.init();

	    if( o.open !== undefined ) this.open();

	}

	List.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: List,

	    testZone: function( e ){

	        var l = this.local;
	        if( l.x === -1 && l.y === -1 ) return '';

	        this.unSelected();

	        if( l.y < this.baseH+2 ) return 'title';
	        else{
	            if(this.isOpen){
	                if( this.scroll && ( l.x >= (this.sa+this.sb-20)) ) return 'scroll';
	                if(l.x > this.sa) return this.testItems( l.y-this.baseH );
	                return '';
	            }

	        }

	    },

	    testItems: function( y ){

	        var name = '';

	        var i = this.items.length, item, a, b;
	        while(i--){
	            item = this.items[i];
	            a = item.posy + this.topList;
	            b = item.posy + this.itemHeight + 1 + this.topList;
	            if((y>=a) && (y<=b)){ 
	                name = 'item' + i;
	                this.currentItem = item;
	                this.selected();
	                return name;
	            }

	        }

	        return name;

	    },

	    unSelected: function(){

	        if( this.currentItem ){
	            this.currentItem.style.background = 'rgba(0,0,0,0.2)';
	            this.currentItem.style.color = this.colors.text;
	            this.currentItem = null;
	        }

	    },

	    selected: function(){

	        this.currentItem.style.background = this.colors.select;
	        this.currentItem.style.color = '#FFF';

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mouseup: function( e ){

	        this.isDown = false;

	    },

	    mousedown: function( e ){

	        var name = this.testZone( e );

	        if( !name ) return  false;

	        if( this.currentItem ){
	            this.value = this.currentItem.textContent;
	            this.c[3].textContent = this.value;
	            this.send();
	            this.close();
	        }

	        if( name === 'title' ){
	            this.modeTitle(2);
	            if( !this.isOpen ) this.open();
	            else this.close();
	        }

	        if( name === 'scroll' ){
	            this.isDown = true;
	            this.mousemove( e );
	        }
	        
	        return true;

	    },

	    mousemove: function( e ){

	        var nup = false;
	        var name = this.testZone( e );

	        if( !name ) return nup;

	        if( name === 'title' ){
	            this.modeTitle(1);
	            this.cursor('pointer');

	        } else if( name === 'scroll' ){

	            this.cursor('s-resize');
	            this.modeScroll(1);
	            if( this.isDown ){
	                this.modeScroll(2);
	                var top = this.zone.y+this.baseH-2;
	                this.update( ( e.clientY - top  ) - ( this.sh*0.5 ) );
	            }
	            //if(this.isDown) this.listmove(e);
	        } else {

	            // is item
	            this.modeTitle(0);
	            this.modeScroll(0);
	            this.cursor('pointer');
	        
	        }

	        if( name !== this.prevName ) nup = true;
	        this.prevName = name;

	        return nup;

	    },

	    wheel: function( e ){

	        var name = this.testZone( e );
	        if( name === 'title' ) return false; 
	        this.py += e.delta*10;
	        this.update(this.py);
	        return true;

	    },



	    // ----------------------

	    reset: function () {

	        this.prevName = '';
	        this.modeTitle(0);
	        this.modeScroll(0);
	        
	    },

	    modeScroll: function( mode ){

	        if( mode === this.sMode ) return;

	        switch(mode){
	            case 0: // base
	                this.scroller.style.background = this.buttonColor;
	            break;
	            case 1: // over
	                this.scroller.style.background = this.colors.select;
	            break;
	            case 2: // edit / down
	                this.scroller.style.background = this.colors.down;
	            break;

	        }

	        this.sMode = mode;
	    },

	    modeTitle: function( mode ){

	        if( mode === this.tMode ) return;

	        var s = this.s;

	        switch(mode){
	            case 0: // base
	                s[3].color = this.fontColor;
	                s[3].background = this.buttonColor;
	            break;
	            case 1: // over
	                s[3].color = '#FFF';
	                s[3].background = this.colors.select;
	            break;
	            case 2: // edit / down
	                s[3].color = this.fontColor;
	                s[3].background = this.colors.down;
	            break;

	        }

	        this.tMode = mode;

	    },

	    clearList: function() {

	        while ( this.listIn.children.length ) this.listIn.removeChild( this.listIn.lastChild );
	        this.items = [];

	    },

	    setList: function( list, value ) {

	        this.clearList();

	        this.list = list;
	        this.length = this.list.length;

	        this.maxItem = this.full ? this.length : 5;
	        this.maxItem = this.length < this.maxItem ? this.length : this.maxItem;

	        this.maxHeight = this.maxItem * (this.itemHeight+1) + 2;

	        this.max = this.length * (this.itemHeight+1) + 2;
	        this.ratio = this.maxHeight / this.max;
	        this.sh = this.maxHeight * this.ratio;
	        this.range = this.maxHeight - this.sh;

	        this.c[2].style.height = this.maxHeight + 'px';
	        this.scroller.style.height = this.sh + 'px';

	        if( this.max > this.maxHeight ){ 
	            this.ww = this.sb - 20;
	            this.scroll = true;
	        }

	        var item, n;//, l = this.sb;
	        for( var i=0; i<this.length; i++ ){
	            n = this.list[i];
	            item = this.dom( 'div', this.css.item + 'width:'+this.ww+'px; height:'+this.itemHeight+'px; line-height:'+(this.itemHeight-5)+'px;');
	            item.textContent = n;
	            item.style.color = this.fontColor;
	            item.name = 'item'+i;
	            item.posy = (this.itemHeight+1)*i;
	            this.listIn.appendChild( item );
	            this.items.push(item);
	        }

	        if( value !== undefined ){
	            if(!isNaN(value)) this.value = this.list[ value ];
	            else this.value = value;
	        }else{
	            this.value = this.list[0];
	        }
	        
	        this.c[3].textContent = this.value;

	    },


	    // ----- LIST

	    update: function( y ){

	        if( !this.scroll ) return;

	        y = y < 0 ? 0 : y;
	        y = y > this.range ? this.range : y;

	        this.topList = -Math.floor( y / this.ratio );

	        this.listIn.style.top = this.topList+'px';
	        this.scroller.style.top = Math.floor( y )  + 'px';

	        this.py = y;

	    },

	    parentHeight: function ( t ) {

	        if ( this.parentGroup !== null ) this.parentGroup.calc( t );
	        else if ( this.isUI ) this.main.calc( t );

	    },

	    open: function(){

	        Proto.prototype.open.call( this );

	        this.update( 0 );
	        this.h = this.maxHeight + this.baseH + 5;
	        if( !this.scroll ){
	            this.topList = 0;
	            this.h = this.baseH + 5 + this.max;
	            this.scroller.style.display = 'none';
	        } else {
	            this.scroller.style.display = 'block';
	        }
	        this.s[0].height = this.h + 'px';
	        this.s[2].display = 'block';
	        if( this.side === 'up' ) this.setSvg( this.c[4], 'd','M 5 2 L 2 7 8 7 5 2 Z');
	        else this.setSvg( this.c[4], 'd','M 5 8 L 8 3 2 3 5 8 Z');

	        this.rSizeContent();

	        var t = this.h - this.baseH;

	        this.zone.h = this.h;

	        this.parentHeight( t );

	    },

	    close: function(){

	        Proto.prototype.close.call( this );

	        var t = this.h - this.baseH;

	        this.h = this.baseH;
	        this.s[0].height = this.h + 'px';
	        this.s[2].display = 'none';
	        this.setSvg( this.c[4], 'd','M 3 8 L 8 5 3 2 3 8 Z');

	        this.zone.h = this.h;

	        this.parentHeight( -t );

	    },

	    // -----

	    text: function( txt ){

	        this.c[3].textContent = txt;

	    },

	    rSizeContent: function () {

	        var i = this.length;
	        while(i--) this.listIn.children[i].style.width = this.ww + 'px';

	    },

	    rSize: function () {

	        Proto.prototype.rSize.call( this );

	        var s = this.s;
	        var w = this.sb;
	        var d = this.sa;

	        s[2].width = w + 'px';
	        s[2].left = d +'px';

	        s[3].width = w + 'px';
	        s[3].left = d + 'px';

	        s[4].left = d + w - 17 + 'px';

	        this.ww = w;
	        if( this.max > this.maxHeight ) this.ww = w-20;
	        if(this.isOpen) this.rSizeContent();

	    }

	} );

	function Numeric( o ){

	    Proto.call( this, o );

	    //this.type = 'number';

	    this.setTypeNumber( o );

	    //this.allway = o.allway || false;

	    this.isDown = false;

	    this.value = [0];
	    this.toRad = 1;
	    this.isNumber = true;
	    this.isAngle = false;
	    this.isVector = false;
	    //this.isSelect = false;

	    if( o.value !== undefined ){
	        if(!isNaN(o.value)){ this.value = [o.value];}
	        else if(o.value instanceof Array ){ this.value = o.value; this.isNumber=false;}
	        else if(o.value instanceof Object ){ 
	            this.value = [];
	            if(o.value.x) this.value[0] = o.value.x;
	            if(o.value.y) this.value[1] = o.value.y;
	            if(o.value.z) this.value[2] = o.value.z;
	            if(o.value.w) this.value[3] = o.value.w;
	            this.isVector = true;
	        }
	    }

	    this.lng = this.value.length;
	    this.tmp = [];

	    if(o.isAngle){
	        this.isAngle = true;
	        this.toRad = Math.PI/180;
	    }

	    this.current = -1;
	    this.prev = { x:0, y:0, d:0, v:0 };

	    this.cMode = [];
	    
	    var i = this.lng;
	    while(i--){
	        if(this.isAngle) this.value[i] = (this.value[i] * 180 / Math.PI).toFixed( this.precision );
	        this.c[2+i] = this.dom( 'div', this.css.txtselect + 'letter-spacing:-1px; height:'+(this.h-4)+'px; line-height:'+(this.h-8)+'px;');
	        if(o.center) this.c[2+i].style.textAlign = 'center';
	        this.c[2+i].textContent = this.value[i];
	        this.c[2+i].style.color = this.fontColor;
	        this.c[2+i].isNum = true;

	        this.cMode[i] = 0;

	    }

	    this.init();
	}

	Numeric.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Numeric,

	    testZone: function( e ){

	        var l = this.local;
	        if( l.x === -1 && l.y === -1 ) return '';

	        var i = this.lng;
	        var t = this.tmp;
	        

	        while( i-- ){
	            if( l.x>t[i][0] && l.x<t[i][2] ) return i;
	        }

	        return ''

	    },

	    mode: function ( n, name ) {

	        if( n === this.cMode[name] ) return false;

	        var m;

	        switch(n){

	            case 0: m = this.colors.border; break;
	            case 1: m = this.colors.borderOver; break;
	            case 2: m = this.colors.borderSelect;  break;

	        }

	        this.reset();
	        this.c[name+2].style.borderColor = m;
	        this.cMode[name] = n;

	        return true;

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mousedown: function ( e ) {

	        //if( this.isSelect ) return;

	        var name = this.testZone( e );

	        if( name === '' ) return false;


	        this.current = name;
	        this.isDown = true;

	        this.prev = { x:e.clientX, y:e.clientY, d:0, v: this.isNumber ? parseFloat(this.value) : parseFloat( this.value[this.current] )  };


	        return this.mode( 2, name );

	    },

	    mouseup: function( e ){

	        var name = this.testZone( e );
	        this.isDown = false;

	        if( this.current !== -1 ){ 

	            //var tm = this.current;
	            var td = this.prev.d;

	            this.current = -1;
	            this.prev = { x:0, y:0, d:0, v:0 };

	            if( !td ){

	                this.setInput( this.c[ name+2 ], function(){ this.testValue(); }.bind(this) );
	                return this.mode( 2, name );

	            } else {
	                return this.reset();//this.mode( 0, tm );
	            }

	        }

	    },

	    mousemove: function( e ){

	        var nup = false;

	        var name = this.testZone( e );

	        if( name === '' ){

	            nup = this.reset();
	            this.cursor();

	        } else { 

	            nup = this.mode( 1, name );
	            this.cursor( this.current !== -1 ? 'move' : 'pointer' );

	        }

	        

	        if( this.current !== -1 ){


	            this.prev.d += ( e.clientX - this.prev.x ) - ( e.clientY - this.prev.y );

	            var n = this.prev.v + ( this.prev.d * this.step);

	            this.value[this.current] = this.numValue(n);
	            this.c[2+this.current].textContent = this.value[this.current];

	            this.validate();

	            this.prev.x = e.clientX;
	            this.prev.y = e.clientY;

	            nup = true;
	        }


	        return nup;



	    },

	    keydown: function( e ){ return true; },

	    // ----------------------

	    reset: function () {

	        var nup = false;

	        var i = this.lng;
	        while(i--){ 
	            if(this.cMode[i]!==0){
	                this.cMode[i] = 0;
	                this.c[2+i].style.borderColor = this.colors.border;
	                nup = true;
	            }
	        }

	        return nup;

	    },


	    setValue: function ( v, n ) {

	        n = n || 0;
	        this.value[n] = this.numValue( v );
	        this.c[2+n].textContent = this.value[n];

	    },

	    testValue: function () {

	        var i = this.lng;
	        while(i--){

	            if(!isNaN( this.c[2+i].textContent )){ 
	                var nx = this.numValue( this.c[2+i].textContent );
	                this.c[2+i].textContent = nx;
	                this.value[i] = nx;
	            } else { // not number
	                this.c[2+i].textContent = this.value[i];
	            }
	        }

	        this.validate();

	    },

	    validate: function(){

	        var ar = [];
	        var i = this.lng;
	        while(i--) ar[i] = this.value[i] * this.toRad;

	        if( this.isNumber ) this.send( ar[0] );
	        else this.send( ar );

	    },

	    rSize: function(){

	        Proto.prototype.rSize.call( this );

	        var w = Math.floor( ( this.sb + 5 ) / this.lng )-5;
	        var s = this.s;
	        var i = this.lng;
	        while(i--){
	            this.tmp[i] = [ Math.floor( this.sa + ( w * i )+( 5 * i )), w ];
	            this.tmp[i][2] = this.tmp[i][0] + this.tmp[i][1];
	            s[2+i].left = this.tmp[i][0] + 'px';
	            s[2+i].width = this.tmp[i][1] + 'px';
	        }

	    }

	} );

	function Slide ( o ){

	    Proto.call( this, o );

	    this.setTypeNumber( o );

	    this.stype = o.stype || 0;
	    this.buttonColor = o.bColor || this.colors.button;

	    //this.old = this.value;
	    this.isDown = false;
	    this.isOver = false;
	    this.allway = o.allway || false;

	    this.firstImput = false;

	    this.c[2] = this.dom( 'div', this.css.txtselect + 'letter-spacing:-1px; text-align:right; width:47px; border:1px dashed '+this.colors.hide+'; color:'+ this.fontColor );
	    this.c[3] = this.dom( 'div', this.css.basic + ' top:0; height:'+this.h+'px;' );
	    this.c[4] = this.dom( 'div', this.css.basic + 'background:rgba(0,0,0,0.3); top:2px; height:'+(this.h-4)+'px;' );
	    this.c[5] = this.dom( 'div', this.css.basic + 'left:4px; top:5px; height:'+(this.h-10)+'px; background:' + this.fontColor +';' );

	    this.c[2].isNum = true;


	    if(this.stype !== 0){
	        if(this.stype === 1 || this.stype === 3){
	            var h1 = 4;
	            var h2 = 8;
	            var ww = this.h-4;
	            var ra = 20;
	        }

	        if(this.stype === 2){
	            h1 = 2;
	            h2 = 4;
	            ra = 2;
	            ww = (this.h-4)*0.5;
	        }

	        if(this.stype === 3) this.c[5].style.visible = 'none';

	        this.c[4].style.borderRadius = h1 + 'px';
	        this.c[4].style.height = h2 + 'px';
	        this.c[4].style.top = (this.h*0.5) - h1 + 'px';
	        this.c[5].style.borderRadius = (h1*0.5) + 'px';
	        this.c[5].style.height = h1 + 'px';
	        this.c[5].style.top = (this.h*0.5)-(h1*0.5) + 'px';

	        this.c[6] = this.dom( 'div', this.css.basic + 'border-radius:'+ra+'px; margin-left:'+(-ww*0.5)+'px; border:1px solid '+this.colors.border+'; background:'+this.buttonColor+'; left:4px; top:2px; height:'+(this.h-4)+'px; width:'+ww+'px;' );
	    }

	    this.init();

	}

	Slide.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Slide,

	    testZone: function( e ){

	        //if(!this.over( this, e.clientX, e.clientY )) return '';

	        var l = this.local;
	        if( l.x === -1 && l.y === -1 ) return '';
	        
	        if( l.x >= this.txl ) return 'text';
	        else if( l.x >= this.sa ) return 'scroll';
	        else return '';

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mouseup: function( e ){
	        
	        if(this.isDown){
	            this.isDown = false;
	            //return true;
	        }
	        
	    },

	    mousedown: function( e ){

	        //console.log('down')

	        var name = this.testZone( e );

	        if( !name ) return false;

	        if( name === 'scroll' ){ 
	            this.isDown = true;
	            this.old = this.value;
	            this.mousemove( e );
	            
	        }

	        if( name === 'text' ){
	            this.setInput( this.c[2], function(){ this.validate(); }.bind(this) );
	        }/*else{
	            Roots.clearInput();
	        }*/

	        return true;

	    },

	    mousemove: function( e ){

	        var nup = false;

	        var name = this.testZone( e );

	        if( name === 'scroll' ) {
	            this.mode(1);
	            this.cursor('w-resize');
	        } else if(name === 'text'){ 
	            this.cursor('pointer');
	        } else {
	            this.cursor();
	        }

	        if( this.isDown ){

	            var n = ((( e.clientX - (this.zone.x+this.sa) - 3 ) / this.ww ) * this.range + this.min ) - this.old;
	            if(n >= this.step || n <= this.step){ 
	                n = Math.floor( n / this.step );
	                this.value = this.numValue( this.old + ( n * this.step ) );
	                this.update( true );
	                this.old = this.value;
	            }
	            nup = true;
	        }

	        return nup;

	    },

	    keydown: function( e ){ return true; },

	    // ----------------------

	    validate: function(){
	        
	        var n = this.c[2].textContent;

	        if(!isNaN( n )){ 
	            this.value = this.numValue( n ); 
	            this.update(true); 
	        }

	        else this.c[2].textContent = this.value;

	    },


	    reset:  function () {

	        //this.clearInput();
	        this.mode(0);

	    },

	    mode: function ( mode ) {

	        var s = this.s;

	        switch(mode){
	            case 0: // base
	               // s[2].border = '1px solid ' + this.colors.hide;
	                s[2].color = this.fontColor;
	                s[4].background = 'rgba(0,0,0,0.3)';
	                s[5].background = this.fontColor;
	            break;
	            case 1: // scroll over
	                //s[2].border = '1px dashed ' + this.colors.hide;
	                s[2].color = this.colorPlus;
	                s[4].background = 'rgba(0,0,0,0.6)';
	                s[5].background = this.colorPlus;
	            break;
	           /* case 2: 
	                s[2].border = '1px solid ' + this.colors.borderSelect;
	            break;
	            case 3: 
	                s[2].border = '1px dashed ' + this.fontColor;//this.colors.borderSelect;
	            break;
	            case 4: 
	                s[2].border = '1px dashed ' + this.colors.hide;
	            break;*/


	        }
	    },

	    update: function( up ){

	        var ww = Math.floor( this.ww * (( this.value - this.min ) / this.range ));
	       
	        if(this.stype !== 3) this.s[5].width = ww + 'px';
	        if(this.s[6]) this.s[6].left = ( this.sa + ww + 3 ) + 'px';
	        this.c[2].textContent = this.value;

	        if( up ) this.send();

	    },

	    rSize: function(){

	        Proto.prototype.rSize.call( this );

	        var w = this.sb - this.sc;
	        this.ww = w - 6;

	        var tx = this.sc;
	        if(this.isUI || !this.simple) tx = this.sc+10;
	        this.txl = this.w - tx + 2;

	        var ty = Math.floor(this.h * 0.5) - 8;

	        var s = this.s;

	        s[2].width = (this.sc -2 )+ 'px';
	        s[2].left = this.txl + 'px';
	        s[2].top = ty + 'px';
	        s[3].left = this.sa + 'px';
	        s[3].width = w + 'px';
	        s[4].left = this.sa + 'px';
	        s[4].width = w + 'px';
	        s[5].left = (this.sa + 3) + 'px';

	        this.update();

	    },

	} );

	function TextInput( o ){

	    Proto.call( this, o );

	    this.cmode = 0;

	    this.value = o.value || '';
	    this.allway = o.allway || false;
	    this.firstImput = false;

	    this.c[2] = this.dom( 'div', this.css.txtselect );
	    this.c[2].textContent = this.value;


	    this.init();

	}

	TextInput.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: TextInput,

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mousedown: function( e ){



	        this.setInput( this.c[2], function(){ this.validate(); }.bind(this) );
	        return this.mode(2);

	        //this.activeText(true);

	    },

	    mousemove: function( e ){

	        return this.mode(1);


	    },

	    keydown: function( e ){ return true; },

	    mode: function ( n ) {

	        if( n === this.cmode ) return false;

	        var m;

	        switch ( n ) {

	            case 0: m = this.colors.border; break;
	            case 1: m = this.colors.borderOver; break;
	            case 2: m = this.colors.borderSelect;  break;

	        }

	        this.c[2].style.borderColor = m;
	        this.cmode = n;
	        return true;

	    },

	    reset: function () {

	        this.mode(0);

	    },

	    /*keydown: function( e ){
	        
	        if( e.keyCode === 13 ){
	            this.activeText( false );
	            this.validate();
	        } else{
	            if(this.firstImput){ this.c[2].textContent = e.key; this.firstImput = false; }
	            else this.c[2].textContent += e.key;
	        }

	    },

	    keyup: function( e ){
	        
	        if( this.allway ) this.validate();
	        
	    },*/

	    // ----------------------

	    rSize: function(){

	        Proto.prototype.rSize.call( this );

	        var s = this.s;
	        s[2].color = this.fontColor;
	        s[2].left = this.sa + 'px';
	        s[2].width = this.sb + 'px';
	        s[2].height = this.h -4 + 'px';
	        s[2].lineHeight = this.h - 8 + 'px';
	     
	    },

	    // text

	    validate: function(){

	        this.value = this.c[2].textContent;
	        this.send();

	    },


	} );

	function Title ( o ) {
	    
	    Proto.call( this, o );

	    //var id = o.id || 0;
	    var prefix = o.prefix || '';

	    this.c[2] = this.dom( 'div', this.css.txt + 'text-align:right; width:60px; line-height:'+ (this.h-8) + 'px; color:' + this.fontColor );

	    if( this.h === 31 ){

	        this.s[0].height = this.h + 'px';
	        this.s[1].top = 8 + 'px';
	        this.c[2].style.top = 8 + 'px';

	    }

	    this.c[1].textContent = this.txt.substring(0,1).toUpperCase() + this.txt.substring(1).replace("-", " ");
	    this.c[2].textContent = prefix;

	    this.init();

	}

	Title.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Title,

	    text: function ( txt ) {

	        this.c[1].textContent = txt;

	    },

	    text2: function ( txt ) {

	        this.c[2].textContent = txt;

	    },

	    rSize: function () {

	        Proto.prototype.rSize.call( this );
	        this.s[1].width = this.w-50 + 'px';
	        this.s[2].left = this.w-(50+26) + 'px';

	    },

	} );

	/*function autoType () {

	    var a = arguments;
	    var type = 'Slide';
	    if( a[2].type ) type = a[2].type;
	    return type;

	};*/

	function add (){

	    //if( !Tools.isEventsInit ) Tools.initEvents();

	    var a = arguments; 

	    var type, o, ref = false, n = null;

	    if( typeof a[0] === 'string' ){ 

	        type = a[0];
	        o = a[1] || {};

	    } else if ( typeof a[0] === 'object' ){ // like dat gui

	        ref = true;
	        if( a[2] === undefined ) [].push.call(a, {});

	        type = a[2].type ? a[2].type : 'slide';//autoType.apply( this, a );

	        o = a[2];
	        o.name = a[1];
	        o.value = a[0][a[1]];

	    }

	    var name = type.toLowerCase();

	    switch( name ){

	        case 'bool': n = new Bool(o); break;
	        case 'button': n = new Button(o); break;
	        case 'circular': n = new Circular(o); break;
	        case 'color': n = new Color(o); break;
	        case 'fps': n = new Fps(o); break;
	        case 'group': n = new Group(o); break;
	        case 'joystick': n = new Joystick(o); break;
	        case 'knob': n = new Knob(o); break;
	        case 'list': n = new List(o); break;
	        case 'numeric': case 'number': n = new Numeric(o); break;
	        case 'slide': n = new Slide(o); break;
	        case 'textInput': case 'string': n = new TextInput(o); break;
	        case 'title': n = new Title(o); break;

	    }

	    if(n !== null ){
	        
	         /*if( !n.isUI ){
	            Tools.ui.push(n);
	            n.getZone();
	        }*/

	        if( ref ) n.setReferency( a[0], a[1] );
	        return n;
	    }
	    

	}

	/**
	 * @author lth / https://github.com/lo-th
	 */

	function Gui ( o ) {

	    this.canvas = null;

	    o = o || {};

	    this.isReset = true;

	    this.isCanvas = o.isCanvas || false;
	    this.isCanvasOnly = false;
	    this.css = o.css !== undefined ? o.css : '';
	    this.callback = o.callback  === undefined ? null : o.callback;


	    this.forceHeight = o.maxHeight || 0;

	    this.cn = '';

	    

	    this.mouse = { x:-10, y:-10 };
	    //Tools.mouse = null;


	    // size define
	    this.size = Tools.size;
	    if( o.p !== undefined ) this.size.p = o.p;
	    if( o.w !== undefined ) this.size.w = o.w;
	    if( o.h !== undefined ) this.size.h = o.h;
	    if( o.s !== undefined ) this.size.s = o.s;

	    this.size.h = this.size.h < 11 ? 11 : this.size.h;

	   


	    this.zone = { x:0, y:0, w:this.size.w, h:0 };
	    // local mouse
	    this.local = { x:-1, y:-1 };

	    // bottom height
	    this.bh = this.size.h;

	    this.h = 0;
	    this.prevY = -1;
	    this.sw = 0;

	    
	 

	    // color
	    this.colors = Tools.colors;
	    this.bg = o.bg || Tools.colors.background;

	    // bottom and close height
	    this.isWithClose = true;
	    

	    if(o.close !== undefined ){
	        this.isWithClose = o.close;
	        this.bh = !this.isWithClose ? 0 : this.bh;
	    }

	    
	    this.isCenter = o.center || false;
	    this.isOpen = true;

	    this.uis = [];

	    this.current = -1;
	    this.target = null;
	    this.decal = 0;
	    this.ratio = 1;

	    this.content = Tools.dom( 'div', Tools.css.basic + 'display:block; width:0px; height:auto; top:0px; pointer-events:auto;' + this.css );

	    this.innerContent = Tools.dom( 'div', Tools.css.basic + 'width:100%; top:0; left:0; height:auto; overflow:hidden;');
	    this.content.appendChild( this.innerContent );

	    this.inner = Tools.dom( 'div', Tools.css.basic + 'width:100%; top:0; left:0; height:auto;');// background:'+this.bg+';');
	    this.innerContent.appendChild(this.inner);
	    //this.inner.name = 'inner';

	    // scroll background
	    this.scrollBG = Tools.dom( 'div', Tools.css.basic + 'right:0; top:0; width:'+this.size.s+'px; height:10px;  display:none; background:'+this.bg+'; border-left:1px solid '+this.colors.stroke+';');
	    this.content.appendChild( this.scrollBG );

	    // scroll
	    this.scroll = Tools.dom( 'div', Tools.css.basic + 'background:'+this.colors.scroll+'; right:0px; top:0; width:'+this.size.s+'px; height:10px;');
	    this.scrollBG.appendChild( this.scroll );

	    this.bottom = Tools.dom( 'div',  Tools.css.txt + 'width:100%; top:auto; bottom:0; left:0; border-bottom-right-radius:10px;  border-bottom-left-radius:10px; text-align:center;  height:'+this.bh+'px; line-height:'+(this.bh-5)+'px; border-top:1px solid '+Tools.colors.stroke+';');
	    this.content.appendChild(this.bottom);
	    this.bottom.textContent = 'close';
	    this.bottom.style.background = this.bg;
	    
	    this.isDown = false;
	    this.isScroll = false;


	    this.callbackClose = function(){};

	    //

	    this.autoResize = o.autoResize === undefined ? true : o.autoResize;
	    if( this.autoResize && !this.isCanvas ) window.addEventListener("resize", function(){ this.resize(); }.bind(this), false );


	    this.parent = o.parent !== undefined ? o.parent : null;
	    
	    if( this.parent === null && !this.isCanvas ){ 
	    	this.parent = document.body; 
	    	if(!this.isCenter) this.content.style.right = '10px'; 
	    }

	    if( this.parent !== null ) this.parent.appendChild( this.content );

	    this.setWidth();
	    //this.getCorner();

	    if( this.isCanvas ) this.makeCanvas();

	    if( this.isCanvas && this.parent === null ){ 
	    	this.isCanvasOnly = true;
	    }

	    Roots.add( this );

	}

	Gui.prototype = {

	    constructor: Gui,

	    isGui: true,

	    // ----------------------
	    //   CANVAS
	    // ----------------------

	    onDraw: function () { },

	    makeCanvas: function () {

	    	this.canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', "canvas" );
	    	this.canvas.width = this.zone.w;
	    	this.canvas.height = this.forceHeight ? this.forceHeight : this.zone.h;

	    },

	    draw: function ( force ) {

	    	if( this.canvas === null ) return;

	    	var w = this.zone.w;
	    	var h = this.forceHeight ? this.forceHeight : this.zone.h;
	    	Roots.toCanvas( this, w, h, force );

	    },

	    //////


	    getDom: function () {

	        return this.content;

	    },

	    setMouse: function( m ){

	        this.mouse = m;

	    },

	    setText: function ( size, color, font ) {

	        Tools.setText( size, color, font );

	    },

	    hide : function (b) {

	        if(b) this.content.style.display = 'none';
	        else this.content.style.display = 'block';
	        
	    },


	    onChange : function( f ){

	        this.callback = f;
	        return this;

	    },

	    action: function (){

	    },


	    // ----------------------
	    //   STYLES
	    // ----------------------



	    styles: function ( n ){

	    	var needChange = false;

	    	if( n !== this.cn ){

		    	this.cn = n;

		    	switch( n ){

		    		case 'def': 
		    		   this.scroll.style.background = this.colors.scroll; 
		    		   this.bottom.style.background = this.colors.background;
		    		   this.bottom.style.color = '#CCC';
		    		break;

		    		//case 'scrollDef': this.scroll.style.background = this.colors.scroll; break;
		    		case 'scrollOver': this.scroll.style.background = this.colors.select; break;
		    		case 'scrollDown': this.scroll.style.background = this.colors.down; break;

		    		//case 'bottomDef': this.bottom.style.background = this.colors.background; break;
		    		case 'bottomOver': this.bottom.style.background = this.colors.backgroundOver; this.bottom.style.color = '#FFF'; break;
		    		//case 'bottomDown': this.bottom.style.background = this.colors.select; this.bottom.style.color = '#000'; break;

		    	}

		    	needChange = true;

		    }

	    	return needChange;

	    },

	    


	    // ----------------------
	    //   TARGET
	    // ----------------------

	    clearTarget: function (){

	    	if( this.current === -1 ) return false;
	        //if(!this.target) return;
	        this.target.uiout();
	        this.target.reset();
	        this.target = null;
	        this.current = -1;
	        Roots.cursor();
	        return true;

	    },

	    // ----------------------
	    //   ZONE TEST
	    // ----------------------

	    testZone: function ( e ) {

	        var l = this.local;
	        if( l.x === -1 && l.y === -1 ) return '';

	        this.isReset = false;

	        var name = '';

	        var s = this.isScroll ?  this.zone.w  - this.size.s : this.zone.w;
	        
	        if( l.y > this.zone.h - this.bh &&  l.y < this.zone.h ) name = 'bottom';
	        else name = l.x > s ? 'scroll' : 'content';

	        return name;

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    handleEvent: function ( e ){

	    	var type = e.type;

	    	var change = false;
	    	var targetChange = false;

	    	var name = this.testZone( e );

	    	if( type === 'mouseup' && this.isDown ) this.isDown = false;
	    	if( type === 'mousedown' && !this.isDown ) this.isDown = true;

	    	if( !name ) return;

	    	switch( name ){

	    		case 'content':

	                e.clientY = this.isScroll ?  e.clientY+this.decal : e.clientY;

		    		if( this.target ) targetChange = this.target.handleEvent( e );

		    		if( type === 'mousemove' ) change = this.styles('def');
	                if( type === 'wheel' && !targetChange && this.isScroll ) change = this.onWheel( e );

		    		if( !Roots.lock ){

		    			var next = Roots.findTarget( this.uis, e );

		    			if( next !== this.current ){
			                this.clearTarget();
			                this.current = next;
			                change = true;
			            }

			            if( next !== -1 ){ 
			                this.target = this.uis[this.current];
			                this.target.uiover();
			            }

		    		}

	    		break;
	    		case 'bottom':

		    		this.clearTarget();
		    		if( type === 'mousemove' ) change = this.styles('bottomOver');
		    		if( type === 'mousedown' ) {
		    			this.isOpen = this.isOpen ? false : true;
			            this.bottom.textContent = this.isOpen ? 'close' : 'open';
			            this.setHeight();
			            this.styles('def');
			            change = true;
		    		}

	    		break;
	    		case 'scroll':

		    		this.clearTarget();
		    		if( type === 'mousemove' ) change = this.styles('scrollOver');
		    		if( type === 'mousedown' ) change = this.styles('scrollDown'); 
	                if( type === 'wheel' ) change = this.onWheel( e ); 
		    		if( this.isDown ) this.update( (e.clientY-this.zone.y)-(this.sh*0.5) );

	    		break;


	    	}

	    	if( this.isDown ) change = true;
	    	if( targetChange ) change = true;

	    	if( change ) this.draw();

	    },

	    onWheel: function ( e ) {

	        this.py += 20*e.delta;
	        this.update( this.py );
	        return true;

	    },

	    // ----------------------
	    //   RESET
	    // ----------------------

	    reset: function( force ){

	        if( this.isReset) return;

	        this.mouse = { x:-10, y:-10 };

	        Roots.clearInput();
	        var r = this.styles('def');
	        var r2 = this.clearTarget();

	        if( r || r2 ) this.draw( true );

	        this.isReset = true;

	    },


	    // -----------------------------------

	    // Add node to gui

	    add: function () {

	        var a = arguments;

	        if( typeof a[1] === 'object' ){ 

	            a[1].isUI = true;
	            a[1].main = this;

	        } else if( typeof a[1] === 'string' ){

	            if( a[2] === undefined ) [].push.call(a, { isUI:true, main:this });
	            else {
	                a[2].isUI = true;
	                a[2].main = this;
	            }
	            
	        } 

	        var u = add.apply( this, a );

	        if( u === null ) return;


	        //var n = add.apply( this, a );
	        //var n = UIL.add( ...args );

	        this.uis.push( u );
	        //n.py = this.h;

	        if( !u.autoWidth ){
	            var y = u.c[0].getBoundingClientRect().top;
	            if( this.prevY !== y ){
	                this.calc( u.h + 1 );
	                this.prevY = y;
	            }
	        }else{
	            this.prevY = -1;
	            this.calc( u.h + 1 );
	        }

	        //this.draw();

	        return u;

	    },

	    calcUis: function () {

	        Roots.calcUis( this.uis, this.zone, this.zone.y - this.decal );

	    },

	    // remove one node

	    remove: function ( n ) { 

	        var i = this.uis.indexOf( n ); 
	        if ( i !== -1 ) this.uis[i].clear();

	    },

	    // call after uis clear

	    clearOne: function ( n ) { 

	        var i = this.uis.indexOf( n ); 
	        if ( i !== -1 ) {
	            this.inner.removeChild( this.uis[i].c[0] );
	            this.uis.splice( i, 1 ); 
	        }

	    },

	    // clear all gui

	    clear:function(){

	        var i = this.uis.length;
	        while(i--) this.uis[i].clear();

	        this.uis = [];
	        Roots.listens = [];

	        this.calc( - this.h );

	    },

	    // -----------------------------------

	    // Scroll

	    update: function ( y ){

	        y = y < 0 ? 0 : y;
	        y = y > this.range ? this.range : y;

	        this.decal = Math.floor( y / this.ratio );
	        this.inner.style.top = - this.decal + 'px';
	        this.scroll.style.top = Math.floor( y ) + 'px';
	        this.py = y;

	    },

	    upScroll: function () {

	        this.sw = this.isScroll ? this.size.s : 0;
	        this.scrollBG.style.display = this.isScroll ? 'block' : 'none';

	        if( this.isScroll ){

	            this.total = this.h;

	            this.maxView = this.maxHeight;

	            this.ratio = this.maxView / this.total;
	            this.sh = this.maxView * this.ratio;

	            if( this.sh < 20 ) this.sh = 20;

	            this.range = this.maxView - this.sh;

	            this.scrollBG.style.height = this.maxView + 'px';
	            this.scroll.style.height = this.sh + 'px';

	        }

	        this.setItemWidth( this.zone.w - this.sw );
	        this.update( 0 );

	    },

	    // -----------------------------------

	    resize:function ( e ){

	        this.setHeight();

	    },

	    calc:function( y ) {

	        this.h += y;
	        clearTimeout( this.tmp );
	        this.tmp = setTimeout( this.setHeight.bind(this), 10 );

	    },

	    setHeight:function(){

	        if( this.tmp ) clearTimeout( this.tmp );

	        this.zone.h = this.bh;
	        this.isScroll = false;

	        if( this.isOpen ){

	            var hhh = this.forceHeight ? this.forceHeight : window.innerHeight;

	            this.maxHeight = hhh - this.zone.y - this.bh;

	            if( this.h > this.maxHeight ){

	                this.isScroll = true;
	                this.zone.h = this.maxHeight + this.bh;

	            } else {

	                this.zone.h = this.h + this.bh;
	                
	            }
	        }

	        this.upScroll();

	        this.innerContent.style.height = this.zone.h - this.bh + 'px';
	        this.content.style.height = this.zone.h + 'px';
	        this.bottom.style.top = this.zone.h - this.bh + 'px';

	        if( this.isOpen ) this.calcUis();
	        if( this.isCanvas ) this.draw( true );

	    },

	    setWidth: function( w ) {

	        if( w ) this.zone.w = w;
	        this.content.style.width = this.zone.w + 'px';

	        if( this.isCenter ) this.content.style.marginLeft = -(~~ (this.zone.w*0.5)) + 'px';

	        this.setItemWidth( this.zone.w - this.sw );
	        this.resize();

	    },

	    setItemWidth: function( w ){

	        var i = this.uis.length;
	        while(i--){
	            this.uis[i].setSize( w );
	            this.uis[i].rSize();
	        }

	    },


	};

	var REVISION = '2.0';

	exports.REVISION = REVISION;
	exports.Tools = Tools;
	exports.Gui = Gui;
	exports.Proto = Proto;
	exports.add = add;
	exports.Bool = Bool;
	exports.Button = Button;
	exports.Circular = Circular;
	exports.Color = Color;
	exports.Fps = Fps;
	exports.Group = Group;
	exports.Joystick = Joystick;
	exports.Knob = Knob;
	exports.List = List;
	exports.Numeric = Numeric;
	exports.Slide = Slide;
	exports.TextInput = TextInput;
	exports.Title = Title;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
