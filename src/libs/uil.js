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

	var Tools = {

	    ui: [],



	    main: null,

	    e:{
	        type:null,
	        clientX:0,
	        clientY:0,
	        keyCode:NaN,
	        key:null,
	    },

	    ID: null,
	    lock:false,


	    input: null,
	    firstImput: true,
	    callbackImput: null,

	    //tmpSvg: null,
	    //tmpContent: null,



	    tmpTime: null,
	    tmpImage: null,
	    

	    isEventsInit: false,
	    eventCallback: function(){},

	    //Mevent: [ 'mousemove','mouseup', 'mousewheel', 'keydown', 'keyup' ],
	    //event : 

	    doc: document,
	    frag: document.createDocumentFragment(),
	    hidefrag: document.createDocumentFragment(),
	    xmlserializer: new XMLSerializer(),

	    colorRing: null,

	    current:-1,

	    URL: window.URL || window.webkitURL,

	    isLoop: false,
	    listens: [],

	    tmpCursor:'auto',

	    svgns: "http://www.w3.org/2000/svg",
	    htmls: "http://www.w3.org/1999/xhtml",

	    DOM_SIZE: [ 'height', 'width', 'top', 'left', 'bottom', 'right', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom'],
	    SVG_TYPE_D: [ 'pattern', 'defs', 'transform', 'stop', 'animate', 'radialGradient', 'linearGradient', 'animateMotion' ],
	    SVG_TYPE_G: [ 'svg', 'rect', 'circle', 'path', 'polygon', 'text', 'g', 'line', 'foreignObject' ],

	    TwoPI: 6.283185307179586,

	    size: {
	        
	        w: 240,
	        h: 20,
	        p: 30,
	        s: 20,

	    },

	    push: function( o ){

	        Tools.ui.push( o );
	        if( !Tools.isEventsInit ) Tools.initEvents();

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    initEvents: function(){

	        if(Tools.isEventsInit) return;

	        Tools.doc.addEventListener( 'click',  Tools, false );
	        Tools.doc.addEventListener( 'mousedown',  Tools, false );
	        Tools.doc.addEventListener( 'mousemove',  Tools, false );
	        Tools.doc.addEventListener( 'mouseup',    Tools, false );
	        Tools.doc.addEventListener( 'mousewheel', Tools, false );

	        Tools.doc.addEventListener( 'keydown',    Tools, false );
	        Tools.doc.addEventListener( 'keyup',      Tools, false );

	        //window.addEventListener("resize", Tools, false );

	        //console.log('event root init')

	        Tools.isEventsInit = true;

	    },

	    handleEvent : function ( event ) {

	        event.preventDefault();

	        //var act = false;

	        if( event.type === 'keydown') Tools.editText( event );
	        else{

	            var e = Tools.e;

	            e.clientX = event.clientX || 0;
	            e.clientY = event.clientY || 0;
	            e.type = event.type;

	            if(e.type === 'mousedown') Tools.lock = true;
	            if(e.type === 'mouseup') { Tools.lock = false; }//Tools.cursor(); }
	            if( (e.type === 'mousemove') && (!Tools.lock) ) Tools.findID( e );
	            //if( e.type === 'keydown') console.log(e.key)

	            if( Tools.ID !== null ) if( Tools.ID[e.type] ) { 
	                if(Tools.ID.mouse !== null) {
	                     e.clientX = Tools.ID.mouse.x;
	                     e.clientY = Tools.ID.mouse.y;
	                }
	                Tools.ID[e.type]( e );
	                Tools.eventCallback();
	            }


	        }

	        //Tools.eventCallback();

	        //if( Tools.ID ) 

	    },

	    // ----------------------
	    //   INPUT
	    // ----------------------

	    overInput: function (){

	        var input = Tools.input;

	        //if(input===null) return;
	        //if(!Tools.firstImput && Tools.callbackImput) Tools.callbackImput();
	        //Tools.callbackImput = null;
	        input.style.border = '1px dashed ' + Tools.colors.border;
	        //input.contentEditable = false;
	        //input.blur();
	        //input = null;

	    },

	    clearInput: function (){

	        var input = Tools.input;

	        if(input===null) return;
	        if(!Tools.firstImput && Tools.callbackImput) Tools.callbackImput();
	        Tools.callbackImput = null;
	        input.style.border = '1px dashed ' + Tools.colors.hide;
	        input.contentEditable = false;
	        input.blur();
	        input = null;

	    },

	    setInput: function ( Input, Callback ){

	        Tools.clearInput();
	        Tools.firstImput = true;
	        Tools.callbackImput = Callback;
	        Tools.input = Input;
	        Tools.input.style.border = '1px dashed ' + Tools.colors.borderSelect;
	        Tools.input.contentEditable = true;
	        Tools.input.focus();
	        Tools.select( Tools.input );

	    },

	    editText: function ( e ){



	        var input = Tools.input;

	        if( input === null ) return;

	        //console.log('key', e.keyCode)

	        if( e.keyCode === 13 ){//enter
	            Tools.callbackImput();
	            Tools.clearInput();
	        }

	        if( input.isNum ){
	            if ( ((e.keyCode > 95) && (e.keyCode < 106)) || e.keyCode === 110 || e.keyCode === 109 ){
	                if(Tools.firstImput){ input.textContent = e.key; Tools.firstImput = false; }
	                else input.textContent += e.key;
	            }
	        } else {
	            if(Tools.firstImput){ input.textContent = e.key; Tools.firstImput = false; }
	            else input.textContent += e.key;
	        }

	    },

	    // ----------------------
	    //   ID
	    // ----------------------

	    findID:function ( e ) {

	        //if( Tools.ID !== null ) 

	        //if( e.clientX === undefined || e.clientY === undefined ) return null;

	        var i = Tools.ui.length, next = -1, tmp;
	        while( i-- ){
	            tmp = Tools.ui[i];

	            Tools.getZone( tmp );


	            if( tmp.mouse !== null ) {
	                if( Tools.over( tmp, tmp.mouse.x, tmp.mouse.y ) ){ 
	                    next = i;
	                    if( next !== Tools.current ){
	                        Tools.clearOldID();
	                        Tools.current = next;
	                        Tools.ID = tmp;
	                    }
	                    break;
	                }
	            } else {
	                if( Tools.over( tmp, e.clientX, e.clientY ) ){ 
	                    next = i;
	                    if( next !== Tools.current ){
	                        Tools.clearOldID();
	                        Tools.current = next;
	                        Tools.ID = tmp;
	                    }
	                    break;
	                }
	            }
	                
	        }

	        if( next === -1  ) Tools.clearOldID();

	        /*if( next !== -1  ){
	            
	            Tools.ID = Tools.ui[ Tools.current ];

	        }*/

	        //return u;

	    },

	    clearOldID: function(){

	        if( !Tools.ID ) return;
	        Tools.current = -1;
	        Tools.ID.reset();
	        Tools.ID = null;

	    },

	    cursor:function( name ){



	        if(!name) name = 'auto';

	        //console.log('cursor', name)

	        if( name !== Tools.tmpCursor ){
	            Tools.doc.body.style.cursor = name;
	            Tools.tmpCursor = name;
	        }

	    },

	    getZone: function( o ){

	        if( o.isReady ) return;

	        var r = o.getDom().getBoundingClientRect();
	        //console.log(r)
	        if( r.width!==0 && r.height!==0  ) o.isReady = true;
	        //if( r.left!==0 || r.top!==0 || r.width!==0 || r.height!==0  ) o.isReady = true;
	        o.zone = { x:r.left, y:r.top, w:r.width, h:r.height };

	    },


	    // zone for solo proto

	    zone: function( o, y ){

	        y = y || 0;

	        /*var rec = { left:0, top:0, width:0, height:0 };
	        var mw = o.style.width;
	        var mh = o.style.height;
	        rec.width = Number(mw.substring(0, mw.length-2));
	        rec.height = Number(mh.substring(0, mh.length-2));
	        while(o) {
	            rec.left += (o.offsetLeft - o.scrollLeft + o.clientLeft);
	            rec.top += (o.offsetTop - o.scrollTop + o.clientTop);
	            o = o.offsetParent;
	        }*/
	        
	        var rec = o.getBoundingClientRect();
	        //console.log(rec);
	        return { x:rec.left, y:rec.top-y, w:rec.width, h:rec.height };

	    },

	    over: function ( o, x, y ) {

	        if( x === undefined || y === undefined ) return false;

	        var z = o.zone;
	        var l = o.local;

	        l.x = x - z.x;
	        l.y = y - z.y;
	        
	        return ( l.x >= 0 ) && ( l.y >= 0 ) && ( l.x <= z.w ) && ( l.y <= z.h );

	    },

	    select: function (){
	        Tools.doc.execCommand("selectall",null,false);
	    },


	    calcUis: function ( uis, zone, py ) {

	        var lng = uis.length, u, i, px = 0;

	        for( i = 0; i < lng; i++ ){

	            u = uis[i];

	            u.zone.w = u.w;
	            u.zone.h = u.h;

	            if( !u.autoWidth ){

	                if( px === 0 ) py += u.h+1;
	                u.zone.y = py-u.h;
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

	    // colors

	    colors: {

	        text : '#C0C0C0',
	        background: 'rgba(44,44,44,0.3)',
	        backgroundOver: 'rgba(11,11,11,0.5)',

	        border : '#454545',
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
	        basic: '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select:none;' + 'position:absolute; pointer-events:none; box-sizing:border-box; margin:0; padding:0; border:none; overflow:hidden; background:none;',
	    },

	    // svg path

	    GPATH: 'M 7 7 L 7 8 8 8 8 7 7 7 M 5 7 L 5 8 6 8 6 7 5 7 M 3 7 L 3 8 4 8 4 7 3 7 M 7 5 L 7 6 8 6 8 5 7 5 M 6 6 L 6 5 5 5 5 6 6 6 M 7 3 L 7 4 8 4 8 3 7 3 M 6 4 L 6 3 5 3 5 4 6 4 M 3 5 L 3 6 4 6 4 5 3 5 M 3 3 L 3 4 4 4 4 3 3 3 Z',

	    setText : function( size, color, font ){

	        size = size || 11;
	        color = color || '#CCC';
	        font = font || '"Consolas", "Lucida Console", Monaco, monospace';

	        Tools.colors.text = color;

	        Tools.css.txt = Tools.css.basic + 'font-family:'+font+'; font-size:'+size+'px; color:'+color+'; padding:2px 10px; left:0; top:2px; height:16px; width:100px; overflow:hidden; white-space: nowrap;';
	        //Tools.css.txtedit = Tools.css.txt + 'pointer-events:auto; padding:2px 5px; outline:none; -webkit-appearance:none; -moz-appearance:none; border:1px dashed #4f4f4f; -ms-user-select:element;';
	        Tools.css.txtedit = Tools.css.txt + 'padding:2px 5px; outline:none; -webkit-appearance:none; -moz-appearance:none; border:1px dashed #4f4f4f; -ms-user-select:element;';
	        //Tools.css.txtselect = Tools.css.txt + 'pointer-events:auto; padding:2px 5px; outline:none; -webkit-appearance:none; -moz-appearance:none; border:1px dashed ' + Tools.colors.border+'; -ms-user-select:element;';
	        Tools.css.txtselect = Tools.css.txt + 'padding:2px 5px; outline:none; -webkit-appearance:none; -moz-appearance:none; border:1px dashed ' + Tools.colors.border+'; -ms-user-select:element;';
	        Tools.css.txtnumber = Tools.css.txt + 'letter-spacing:-1px; padding:2px 5px;';
	        Tools.css.item = Tools.css.txt + 'position:relative; background:rgba(0,0,0,0.2); margin-bottom:1px; ';//pointer-events:auto; cursor:pointer;

	    },

	    clone: function ( o ) {

	        return o.cloneNode(true);

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

	    /*setDom : function( dom, type, value ){

	        var ext = Tools.DOM_SIZE.indexOf(type) !== -1 ? 'px' : '';
	        dom.style[type] = value + ext;

	    },*/

	    dom : function ( type, css, obj, dom, id ) {

	        type = type || 'div';

	        if( Tools.SVG_TYPE_D.indexOf(type) !== -1 || Tools.SVG_TYPE_G.indexOf(type) !== -1 ){ // is svg element

	            if( type ==='svg' ){

	                dom = Tools.doc.createElementNS( Tools.svgns, 'svg' );
	                Tools.set( dom, obj );

	            } else {
	                // create new svg if not def
	                if( dom === undefined ) dom = Tools.doc.createElementNS( Tools.svgns, 'svg' );
	                Tools.addAttributes( dom, type, obj, id );

	            }
	            
	        } else { // is html element

	            if( dom === undefined ) dom = Tools.doc.createElementNS( Tools.htmls, type );
	            else dom = dom.appendChild( Tools.doc.createElementNS( Tools.htmls, type ) );

	        }

	        if( css ) dom.style.cssText = css; 

	        if( id === undefined ) return dom;
	        else return dom.childNodes[ id || 0 ];

	    },

	    addAttributes : function( dom, type, o, id ){

	        var g = Tools.doc.createElementNS( Tools.svgns, type );
	        Tools.set( g, o );
	        Tools.get( dom, id ).appendChild( g );
	        if( Tools.SVG_TYPE_G.indexOf(type) !== -1 ) g.style.pointerEvents = 'none';
	        return g;

	    },

	    clear : function( dom ){

	        Tools.purge( dom );
	        while (dom.firstChild) {
	            if ( dom.firstChild.firstChild ) Tools.clear( dom.firstChild );
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
	                Tools.purge( dom.childNodes[i] ); 
	            }
	        }

	    },



	    // LOOP

	    loop : function(){

	        if( Tools.isLoop ) requestAnimationFrame( Tools.loop );
	        Tools.update();

	    },

	    update : function(){

	        var i = Tools.listens.length;
	        while(i--) Tools.listens[i].listening();

	    },

	    removeListen : function ( proto ){

	        var id = Tools.listens.indexOf( proto );
	        Tools.listens.splice(id, 1);

	        if( Tools.listens.length === 0 ) Tools.isLoop = false;

	    },

	    addListen : function ( proto ){

	        var id = Tools.listens.indexOf( proto );

	        if( id !== -1 ) return; 

	        Tools.listens.push( proto );

	        if( !Tools.isLoop ){
	            Tools.isLoop = true;
	            Tools.loop();
	        }

	    },

	    // ----------------------
	    //   Color function
	    // ----------------------

	    ColorLuma : function ( hex, lum ) {

	        // validate hex string
	        hex = String(hex).replace(/[^0-9a-f]/gi, '');
	        if (hex.length < 6) {
	            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	        }
	        lum = lum || 0;

	        // convert to decimal and change luminosity
	        var rgb = "#", c, i;
	        for (i = 0; i < 3; i++) {
	            c = parseInt(hex.substr(i*2,2), 16);
	            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
	            rgb += ("00"+c).substr(c.length);
	        }

	        return rgb;

	    },

	    findDeepInver: function( rgb ){ 

	        return (rgb[0] * 0.3 + rgb[1] * .59 + rgb[2] * .11) <= 0.6;
	        
	    },


	    hexToHtml: function(v){ 
	        v = v === undefined ? 0x000000 : v;
	        return "#" + ("000000" + v.toString(16)).substr(-6);
	        
	    },

	    htmlToHex: function(v){ 

	        return v.toUpperCase().replace("#", "0x");

	    },

	    u255: function(color, i){

	        return parseInt(color.substring(i, i + 2), 16) / 255;

	    },

	    u16: function( color, i ){

	        return parseInt(color.substring(i, i + 1), 16) / 15;

	    },

	    unpack: function( color ){

	        if (color.length == 7) return [ Tools.u255(color, 1), Tools.u255(color, 3), Tools.u255(color, 5) ];
	        else if (color.length == 4) return [ Tools.u16(color,1), Tools.u16(color,2), Tools.u16(color,3) ];

	    },

	    htmlRgb: function( rgb ){

	        return 'rgb(' + Math.round(rgb[0] * 255) + ','+ Math.round(rgb[1] * 255) + ','+ Math.round(rgb[2] * 255) + ')';

	    },

	    rgbToHex : function( rgb ){

	        return '#' + ( '000000' + ( ( rgb[0] * 255 ) << 16 ^ ( rgb[1] * 255 ) << 8 ^ ( rgb[2] * 255 ) << 0 ).toString( 16 ) ).slice( - 6 );

	    },

	    hueToRgb: function( p, q, t ){

	        if ( t < 0 ) t += 1;
	        if ( t > 1 ) t -= 1;
	        if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
	        if ( t < 1 / 2 ) return q;
	        if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
	        return p;

	    },

	    rgbToHsl: function(rgb){

	        var r = rgb[0], g = rgb[1], b = rgb[2], min = Math.min(r, g, b), max = Math.max(r, g, b), delta = max - min, h = 0, s = 0, l = (min + max) / 2;
	        if (l > 0 && l < 1) s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
	        if (delta > 0) {
	            if (max == r && max != g) h += (g - b) / delta;
	            if (max == g && max != b) h += (2 + (b - r) / delta);
	            if (max == b && max != r) h += (4 + (r - g) / delta);
	            h /= 6;
	        }
	        return [ h, s, l ];

	    },

	    hslToRgb: function( hsl ){

	        var p, q, h = hsl[0], s = hsl[1], l = hsl[2];

	        if ( s === 0 ) return [ l, l, l ];
	        else {
	            q = l <= 0.5 ? l * (s + 1) : l + s - ( l * s );
	            p = l * 2 - q;
	            return [ Tools.hueToRgb(p, q, h + 0.33333), Tools.hueToRgb(p, q, h), Tools.hueToRgb(p, q, h - 0.33333) ];
	        }

	    },

	    makeColorRing: function( width, stroke ){

	        var w = width || 256;

	       // var svg = Tools.dom( 'svg', Tools.css.basic + 'width:100%; height:100%; ', { viewBox:'0 0 '+w+' '+w, width:w, height:w } );//visibility:hidden;
	        var svg = Tools.dom( 'svg', Tools.css.basic , { viewBox:'0 0 '+w+' '+w, width:w, height:w, preserveAspectRatio:'none' } );//visibility:hidden;xMaxYMax meet
	        Tools.dom( 'defs', null, {}, svg );
	        Tools.dom( 'g', null, {}, svg );

	        var s = stroke || 40;
	        var r =( w-s )*0.5;
	        var mid = w*0.5;
	        var n = 24, nudge = 8 / r / n * Math.PI, a1 = 0, d1;
	        var am, tan, d2, a2, ar, i, j, path;
	        var color = [];
	        
	        for ( i = 0; i <= n; ++i) {

	            d2 = i / n;
	            a2 = d2 * Math.PI * 2;
	            am = (a1 + a2) * 0.5;
	            tan = 1 / Math.cos((a2 - a1) * 0.5);

	            ar = [
	                Math.sin(a1), -Math.cos(a1), 
	                Math.sin(am) * tan, -Math.cos(am) * tan, 
	                Math.sin(a2), -Math.cos(a2)
	            ];
	            
	            color[1] = Tools.rgbToHex( Tools.hslToRgb([d2, 1, 0.5]) );
	            //color[3] = Tools.rgbToHex( Tools.hslToRgb([0, d2, d2]) );

	            if (i > 0) {

	                j = 6;
	                while(j--){
	                   ar[j] = ((ar[j]*r)+mid).toFixed(2);
	                }

	                path = ' M' + ar[0] + ' ' + ar[1] + ' Q' + ar[2] + ' ' + ar[3] + ' ' + ar[4] + ' ' + ar[5];
	                Tools.dom( 'linearGradient', '', { id:'G'+i, x1:ar[0], y1:ar[1], x2:ar[4], y2:ar[5], gradientUnits:"userSpaceOnUse" }, svg, 0 );
	                Tools.dom( 'stop', '', { offset:'0%', 'stop-color':color[0] }, svg, [0,i-1] );
	                Tools.dom( 'stop', '', { offset:'100%', 'stop-color':color[1] }, svg, [0,i-1] );
	                Tools.dom( 'path', '', { d:path, 'stroke-width':s, stroke:'url(#G'+i+')', 'stroke-linecap':"butt" }, svg, 1 );
	                
	            }
	            a1 = a2 - nudge; 
	            color[0] = color[1];
	            //color[2] = color[3];
	            d1 = d2;
	        }

	        var br = (128 - s )+2;
	        var bw = 60;//br*0.8;

	        //console.log(bw)

	        Tools.dom( 'linearGradient', '', { id:'GL1', x1:mid-bw, y1:mid-bw, x2:mid-bw, y2:mid+bw, gradientUnits:"userSpaceOnUse" }, svg, 0 );
	       // Tools.dom( 'linearGradient', '', { id:'GL1', x1:0, y1:0, x2:0, y2:1 }, svg, 0 );
	        Tools.dom( 'stop', '', { offset:'0%', 'stop-color':'#FFFFFF' }, svg, [0,24] );
	        Tools.dom( 'stop', '', { offset:'50%', 'stop-color':'#FFFFFF', 'stop-opacity':0 }, svg, [0,24] );
	        Tools.dom( 'stop', '', { offset:'50%', 'stop-color':'#000000', 'stop-opacity':0 }, svg, [0,24] );
	        Tools.dom( 'stop', '', { offset:'100%', 'stop-color':'#000000' }, svg, [0,24] );

	        //Tools.dom( 'linearGradient', '', { id:'GL2', x1:0, y1:0, x2:1, y2:0 }, svg, 0 );
	        Tools.dom( 'linearGradient', '', { id:'GL2', x1:mid-bw, y1:mid-bw, x2:mid+bw, y2:mid-bw, gradientUnits:"userSpaceOnUse" }, svg, 0 );
	        Tools.dom( 'stop', '', { offset:'0%', 'stop-color':'#7f7f7f','stop-opacity':0 }, svg, [0,25] );
	        Tools.dom( 'stop', '', { offset:'50%', 'stop-color':'#7f7f7f','stop-opacity':0.5 }, svg, [0,25] );
	        Tools.dom( 'stop', '', { offset:'100%', 'stop-color':'#7f7f7f' }, svg, [0,25] );

	        Tools.dom( 'circle', '', { cx:128, cy:128, r:br, fill:'red' }, svg );//2
	        Tools.dom( 'circle', '', { cx:128, cy:128, r:br, fill:'url(#GL2)' }, svg );//3
	        Tools.dom( 'circle', '', { cx:128, cy:128, r:br, fill:'url(#GL1)' }, svg );//4

	        Tools.dom( 'circle', '', { cx:0, cy:0, r:6, 'stroke-width':3, stroke:'#FFF', fill:'none' }, svg );//5
	        Tools.dom( 'circle', '', { cx:0, cy:0, r:6, 'stroke-width':3, stroke:'#000', fill:'none' }, svg );//6

	        Tools.colorRing = svg;

	        //console.log(svg)

	        //return svg;

	    },

	    // svg to canvas test 

	    toCanvas: function( canvas, content, callback, w, h, force ){

	        if(force) { clearTimeout(Tools.tmpTime); Tools.tmpTime = null;  }

	        if( Tools.tmpTime !== null ) return;

	        Tools.tmpTime = setTimeout( function(){ Tools.tmpTime = null; }, 10 );

	        var ctx = canvas.getContext("2d");
	        var autosize = false;
	        var isNewSize = false;

	        if( w===undefined || h===undefined ) autosize = true;

	        if( autosize ){
	            var box = content.getBoundingClientRect();
	            w = box.width;
	            h = box.height;
	            if( w !== canvas.width || h !== canvas.height ) isNewSize = true;
	            
	        }


	        if(Tools.tmpImage === null) Tools.tmpImage = new Image();

	        var img = Tools.tmpImage; //new Image();

	        var htmlString = Tools.xmlserializer.serializeToString( content );
	        
	        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject style="pointer-events: none; left:0;" width="100%" height="100%">'+ htmlString +'</foreignObject></svg>';

	        img.onload = function() {

	            if( isNewSize ){ 
	                canvas.width = w;
	                canvas.height = h;
	            }else{
	                ctx.clearRect( 0, 0, w, h );
	            }
	            ctx.drawImage( this, 0, 0 );//, 0, 0, w, h );

	            //console.log('draw')

	            if( callback !== undefined ) callback();

	        };

	        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
	        //img.src = 'data:image/svg+xml;base64,'+ window.btoa( svg );
	        img.crossOrigin = '';


	    },

	};

	Tools.setText();

	/**
	 * @author lo-th / https://github.com/lo-th
	 */

	function Proto ( o ) {

	    o = o || {};

	    this.type = '';
	    this.name = 'proto';
	    this.mouse = null;
	    this.zone = { x:0, y:0, w:0, h:0 };
	    this.local = { x:-1, y:-1 };

	    //this.decal = 0;

	    //this.actif = false;
	    //this.over = false;

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

	    this.isGroup = false;
	    this.parentGroup = null;

	    // if height can change
	    this.autoHeight = false;

	    // radius for toolbox
	    this.radius = o.radius || 0;

	    

	    // only for number
	    this.isNumber = false;

	    // only most simple 
	    this.mono = false;

	    // stop listening for edite slide text
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

	    this.isReady = false;
	    
	    
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
	    

	    if( !this.simple ){ 
	        //this.c[1] = Tools.dom('UIL text');
	        this.c[1] = Tools.dom( 'div', Tools.css.txt );
	        this.s[1] = this.c[1].style;
	        this.c[1].textContent = this.rename === '' ? this.txt : this.rename;
	        this.s[1].color = this.titleColor;
	    }

	    if(o.pos){
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

	    reset:  function () {
	    },

	    init: function () {

	        var s = this.s; // style cache
	        var c = this.c; // div cache

	        s[0].height = this.h + 'px';

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

	        //!!! solo proto

	        if( !this.isUI ){

	            this.c[0].style.pointerEvents = 'auto';
	            //this.c[0].addEventListener('onblur', function(){console.log('show')}, false)
	            //this.getZone();
	            Tools.push( this );
	            this.isReady = false;
	            
	        } else {
	            this.isReady = true;
	        }

	    },

	    getDom: function () {
	        return this.c[0];
	    },

	    /*getZone: function( y ){
	        
	        this.zone = Tools.zone( this.c[0], y );
	        if( this.isGroup ) this.calcUis();

	    },*/

	    uiout: function () {

	        this.s[0].background = this.bg;
	        //this.main.cursor();
	        //this.actif = false;
	        //Tools.down = this.isUI ? this.main : null;;

	    },

	    uiover: function () {

	        this.s[0].background = this.bgOver;
	        //if( this.type === 'bool' ) this.main.cursor('pointer');
	        //this.actif = true;
	        //Tools.down = this;

	    },

	    rename: function ( s ) {

	        this.c[1].textContent = s;

	    },

	    listen: function () {

	        Tools.addListen( this );
	        Tools.listens.push( this );
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

	        //this.clearEvent();
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
	            this.sa = ~~ pp + 10;
	            this.sb = ~~ this.w - pp - 20;
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
	    //   Events dispatch
	    // ----------------------

	    /*addEvent: function () {

	        var i = this.c.length, j, c;
	        while( i-- ){
	            c = this.c[i];
	            if( c !== undefined ){
	                if( c.events !== undefined ){
	                    j = c.events.length;
	                    while( j-- ) c.addEventListener( c.events[j], this, false );
	                }
	            }
	        }

	    },

	    clearEvent: function () {

	        var i = this.c.length, j, c;
	        while( i-- ){
	            c = this.c[i];
	            if( c !== undefined ){
	                if( c.events !== undefined ){
	                    j = c.events.length;
	                    while( j-- ) c.removeEventListener( c.events[j], this, false );
	                }
	            }
	        }

	    },*/

	    /*handleEvent: function ( e ) {

	        e.preventDefault();

	        if( this[e.type] ) this[e.type]( e );
	        if( this.isUI ) this.main.eventCallback();
	        
	    },*/

	    // ----------------------
	    //   EVENTS DEFAULT
	    // ----------------------

	    mousewheel: function ( e ){},

	    mousedown: function( e ){},

	    mousemove: function( e ){},

	    mouseup: function( e ){},

	    keydown: function ( e ){},

	    keyup: function ( e ){},

	    click: function( e ){},


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
	        this.isReady = v ? false : true;

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


	};

	function Bool ( o ){

	    Proto.call( this, o );

	    this.type = 'bool';

	    this.value = o.value || false;

	    this.buttonColor = o.bColor || Tools.colors.button;

	    this.inh = o.inh || this.h;

	    var t = ~~ (this.h*0.5)-((this.inh-2)*0.5);

	    this.c[2] = Tools.dom( 'div', Tools.css.basic + 'background:'+ Tools.colors.boolbg +'; height:'+(this.inh-2)+'px; width:36px; top:'+t+'px; border-radius:20px;  transition:0.1s ease-out;' );//pointer-events:auto; cursor:pointer;
	    this.c[3] = Tools.dom( 'div', Tools.css.basic + 'opasity:0, background:'+ Tools.colors.boolbg +'; height:'+(this.inh-6)+'px; width:'+(this.inh-6)+'px; top:'+(t+2)+'px; border-radius:20px; ' );
	    this.c[4] = Tools.dom( 'div', Tools.css.basic + 'border:1px solid '+this.buttonColor+'; height:'+(this.inh-4)+'px; width:16px; top:'+(t+1)+'px; border-radius:20px; background:'+this.buttonColor+'; transition:margin 0.1s ease-out;' );

	    if(this.value){
	        this.c[4].style.marginLeft = '18px';
	        this.c[2].style.background = this.fontColor;
	        this.c[2].style.borderColor = this.fontColor;
	    }

	    //this.c[2].events = [ 'click' ];

	    this.init();

	}

	Bool.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Bool,

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mousemove: function( e ){
	        Tools.cursor('pointer');
	    },

	    click: function( e ){

	        this.value = this.value ? false : true;
	        this.update();
	        this.send();

	    },

	    update: function() {

	        var s = this.s;

	        if(this.value){
	            s[4].marginLeft = '18px';
	            s[2].background = this.fontColor;
	            s[2].borderColor = this.fontColor;
	            s[4].borderColor = this.fontColor;
	        } else {
	            s[4].marginLeft = '0px';
	            s[2].background = Tools.colors.boolbg;
	            s[2].borderColor = Tools.colors.boolbg;
	            s[4].borderColor = Tools.colors.border;
	        }
	            
	    },

	    rSize: function(){

	        Proto.prototype.rSize.call( this );
	        var s = this.s;
	        s[2].left = this.sa + 'px';
	        s[3].left = this.sa+1+ 'px';
	        s[4].left = this.sa+1 + 'px';

	    }

	} );

	function Button ( o ) {

	    Proto.call( this, o );

	    this.value = o.value || [this.txt];

	    this.selected = null;
	    this.isDown = false;

	    this.buttonColor = o.bColor || Tools.colors.button;

	    this.isLoadButton = o.loader || false;
	    this.isDragButton = o.drag || false;
	    if(this.isDragButton ) this.isLoadButton = true;

	    this.lng = this.value.length;
	    this.tmp = [];

	    for(var i = 0; i < this.lng; i++){
	        this.c[i+2] = Tools.dom( 'div', Tools.css.txt + 'text-align:center; top:1px; background:'+this.buttonColor+'; height:'+(this.h-2)+'px; border-radius:'+this.radius+'px; line-height:'+(this.h-4)+'px;' );
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

	        if(!Tools.over( this, e.clientX, e.clientY )) return '';

	        var i = this.lng;
	        var t = this.tmp;
	        var l = this.local;

	        while( i-- ){
	        	if( l.x>t[i][0] && l.x<t[i][2] ) return i+2;
	        }

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    click: function ( e ) {

	    	var name = this.testZone( e );
	    	if(name){
	    		this.send( this.value[name-2] );
	    	}

	    },

	    mouseup: function( e ){
	        
	        var name = this.testZone( e );

	    	if(name){
	    		this.isDown = false;
	    		this.mousemove( e );
	    	}
	        
	    },

	    mousedown: function( e ){

	    	var name = this.testZone( e );

	    	if(name){
	    		this.isDown = true;
	    		this.mousemove( e );
	    	}

	    },

	    mousemove: function( e ){

	        var name = this.testZone( e );

	        this.reset();

	        if(name){
	        	this.selected = name;
	        	this.s[ name ].color = '#FFF';
	            this.s[ name ].background = this.isDown ? Tools.colors.down : Tools.colors.select;
	            Tools.cursor('pointer');
	        } else {
	        	
	        }

	    },

	    // ----------------------

	    reset: function () {

	    	if( this.selected ){
	    		this.s[ this.selected ].color = this.fontColor;
	            this.s[ this.selected ].background = this.buttonColor;
	            this.selected = null;
	            Tools.cursor();
	    	}

	    },

	    // ----------------------

	    dragover: function () {

	        this.s[4].borderColor = Tools.colors.select;
	        this.s[4].color = Tools.colors.select;

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

	        this.c[4] = Tools.dom( 'div', Tools.css.txt +' text-align:center; line-height:'+(this.h-8)+'px; border:1px dashed '+this.fontColor+'; top:2px;  height:'+(this.h-4)+'px; border-radius:'+this.r+'px;' );//pointer-events:auto; cursor:default;
	        this.c[4].textContent = 'DRAG';

	        this.c[2].events = [  ];
	        this.c[4].events = [ 'dragover', 'dragend', 'dragleave', 'drop' ];


	    },

	    initLoader: function () {

	        this.c[3] = Tools.dom( 'input', Tools.css.basic +'border:1px solid '+Tools.colors.border+'; top:1px; opacity:0;  height:'+(this.h-2)+'px;' );//pointer-events:auto; cursor:pointer;
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

	    this.buttonColor = Tools.colors.button;

	    this.setTypeNumber( o );

	    this.radius = Math.floor((this.w-20)*0.5);

	    /*this.radius = o.radius || 15;
	    
	    this.w = (this.radius*2)+20;

	    if(o.width !== undefined){
	        this.w = o.width;
	        this.radius = ~~ (this.w-20)*0.5;
	    }

	    if(o.size !== undefined){
	        this.w = o.size;
	        this.radius = ~~ (this.w-20)*0.5;
	    }*/

	    this.ww = this.height = this.radius * 2;
	    //this.h = o.height || (this.height + 40);

	    this.h = (this.radius * 2)+40;



	    this.twoPi = Math.PI * 2;

	    this.top = 0;

	    this.c[0].style.width = this.w +'px';

	    if(this.c[1] !== undefined) {

	        this.c[1].style.width = this.w +'px';
	        this.c[1].style.textAlign = 'center';
	        this.top = 20;

	    }

	    this.percent = 0;

	    this.c[2] = Tools.dom( 'div', Tools.css.txtnumber + 'text-align:center; top:'+(this.height+24)+'px; width:'+this.w+'px; color:'+ this.fontColor );
	    this.c[3] = Tools.dom( 'circle', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px; ', { cx:this.radius, cy:this.radius, r:this.radius, fill:'rgba(0,0,0,0.3)' });//pointer-events:auto; cursor:pointer;
	    this.c[4] = Tools.dom( 'path', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { d:this.makePath(), fill:this.fontColor });
	    this.c[5] = Tools.dom( 'circle', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius, r:this.radius*0.5, fill:this.buttonColor, 'stroke-width':1, stroke:Tools.colors.stroke });

	    this.init();

	    this.update();

	}

	Circular.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Circular,

	    mode: function ( mode ) {

	        switch(mode){
	            case 0: // base
	                this.s[2].color = this.fontColor;
	                Tools.setSvg( this.c[3], 'fill','rgba(0,0,0,0.2)');
	                Tools.setSvg( this.c[4], 'fill', this.fontColor );
	            break;
	            case 1: // over
	                this.s[2].color = this.colorPlus;
	                Tools.setSvg( this.c[3], 'fill','rgba(0,0,0,0.6)');
	                Tools.setSvg( this.c[4], 'fill', this.colorPlus );
	            break;
	        }

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    /*mouseover: function ( e ) {

	        this.isOver = true;
	        this.mode(1);

	    },

	    mouseout: function ( e ) {

	        this.isOver = false;
	        if(this.isDown) return;
	        this.mode(0);

	    },*/

	    reset: function() {
	        this.mode(0);
	    },

	    mouseup: function ( e ) {

	        this.isDown = false;
	        //document.removeEventListener( 'mouseup', this, false );
	        //document.removeEventListener( 'mousemove', this, false );

	        //if(this.isOver) this.mode(1);
	        //else this.mode(0);

	        this.sendEnd();

	    },

	    mousedown: function ( e ) {

	        this.isDown = true;

	        //console.log(this.zone)
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
	        Tools.setSvg( this.c[4], 'd', this.makePath() );
	        if( up ) this.send();
	        
	    },

	} );

	function Color ( o ) {
	    
	    Proto.call( this, o );

	    this.autoHeight = true;

	    this.ctype = o.ctype || 'array';
	    this.ww = this.sb;

	    // color up or down
	    this.side = o.side || 'down';
	    this.holdTop = 0;

	    this.decal = this.h + 2;
	    
	    this.mid = Math.floor( this.ww * 0.5 );
	    this.baseH = this.h;
	    this.oldH = this.h;
	    this.oldDiff = 0;
	    this.openHeight = 0;

	    this.offset = [];


	    //this.c[2] = Tools.dom( 'div',  Tools.css.txt + 'height:'+(this.h-4)+'px;' + 'border-radius:3px; pointer-events:auto; cursor:pointer; border:1px solid '+ Tools.colors.border + '; line-height:'+(this.h-8)+'px;' );
	    this.c[2] = Tools.dom( 'div',  Tools.css.txt + 'height:'+(this.h-4)+'px;' + 'border-radius:'+this.radius+'px; line-height:'+(this.h-8)+'px;' );

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

		/*handleEvent: function( e ) {

		    e.preventDefault();
		    e.stopPropagation();

		    switch( e.type ) {
		        case 'click': this.click(e); break;
		        case 'mousedown': this.mousedown(e); break;
		        case 'mousemove': this.mousemove(e); break;
		        case 'mouseup': this.mouseup(e); break;
		        //case 'mouseout': this.mouseout(e); break;
		    }

		},*/

		testZone: function( mx, my ){

			if(!Tools.over( this, mx, my )) return '';

	        var l = this.local;

	    	if( l.y < this.baseH+2 ) return 'title';
	    	else return 'color';

	    },

		// ----------------------
	    //   EVENTS
	    // ----------------------

		click: function( e ){

			var name = this.testZone( e.clientX, e.clientY );

			if(name === 'title'){
				if( !this.isOpen ) this.open();
		        else this.close();
			}

		},

		mouseup: function( e ){

		    this.isDown = false;

		},

		mousedown: function( e ){

			var name = this.testZone( e.clientX, e.clientY );

			//if( !name ) return;

			if( name === 'color' ){
				this.isDown = true;
		        this.mousemove( e );
			}

		},

		mousemove: function( e ){

		    var name = this.testZone( e.clientX, e.clientY );

		    if( name === 'title' ){

		        Tools.cursor('pointer');

		    }

		    if( name === 'color' ){

		    	Tools.cursor('crosshair');

		    	if(this.isDown){

			    	this.offset[0] = this.zone.x + this.sa + this.mid;
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

		changeHeight: function(){

			this.h = this.isOpen ? this.openHeight + this.baseH : this.baseH;

			if( this.oldH !== this.h ){
				this.s[0].height = this.h + 'px';
				if ( this.parentGroup !== null ) this.parentGroup.calc( this.h - this.oldH );
		        else if ( this.isUI ) this.main.calc( this.h - this.oldH );
		        this.oldH = this.h;
		        this.zone.h = this.h;
			}

		},


		open: function(){

			if( this.isOpen ) return;
	        this.isOpen = true;

		    this.s[3].visibility = 'visible';
		    //this.s[3].display = 'block';
		    this.changeHeight();

		},

		close: function(){

		    if( !this.isOpen ) return;
	        this.isOpen = false;

		    this.s[3].visibility  = 'hidden';
		    //this.s[3].display = 'none';
		    this.changeHeight();

		},

		update: function( up ){

		    var cc = Tools.rgbToHex( Tools.hslToRgb([this.hsl[0], 1, 0.5]) );

		    this.drawMarkers();
		    
		    this.value = this.bcolor;

		    Tools.setSvg( this.c[3], 'fill', cc, 2 );

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

		    Tools.setSvg( this.c[3], 'cx', ar[2]+128, 5 );
		    Tools.setSvg( this.c[3], 'cy', ar[3]+128, 5 );
		    Tools.setSvg( this.c[3], 'stroke', c1, 5 );

		    Tools.setSvg( this.c[3], 'cx', ar[0]+128, 6 );
		    Tools.setSvg( this.c[3], 'cy', ar[1]+128, 6 );

		},

		rSize: function(){

		    Proto.prototype.rSize.call( this );

		    this.ww = this.sb;
		    this.openHeight = this.ww+10;

		    if( this.side === 'up' ) this.decal = 5;
		    this.mid = Math.floor( this.ww * 0.5 );

		    var s = this.s;

		    s[2].width = this.sb + 'px';
		    s[2].left = this.sa + 'px';

		    Tools.setSvg( this.c[3], 'viewBox', '0 0 '+this.ww+' '+this.ww );
		    //Tools.setSvg( this.c[3], 'width', this.ww );
		    //Tools.setSvg( this.c[3], 'height', this.ww );

		    s[3].width = this.ww + 'px';//'100%';//
		    s[3].height = this.ww + 'px';//''100%';//this.ww;

	    	//s[3].width = s[3].height = this.ww;
	    	s[3].left = this.sa + 'px';
		    s[3].top = this.decal + 'px';

		    this.ratio = 256/this.ww;
		    this.square = (60)*(this.ww/256);
		    
		    this.changeHeight();
		    
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

	    this.c[2] = Tools.dom( 'path', Tools.css.basic + panelCss , { fill:'rgba(200,200,200,0.3)', 'stroke-width':1, stroke:this.fontColor, 'vector-effect':'non-scaling-stroke' });

	    this.c[2].setAttribute('viewBox', '0 0 '+this.res+' 42' );
	    this.c[2].setAttribute('height', '100%' );
	    this.c[2].setAttribute('width', '100%' );
	    this.c[2].setAttribute('preserveAspectRatio', 'none' );

	    Tools.dom( 'path', null, { fill:'rgba(255,255,0,0.3)', 'stroke-width':1, stroke:'#FF0', 'vector-effect':'non-scaling-stroke' }, this.c[2] );
	    Tools.dom( 'path', null, { fill:'rgba(0,255,255,0.3)', 'stroke-width':1, stroke:'#0FF', 'vector-effect':'non-scaling-stroke' }, this.c[2] );


	    // bottom line
	    this.c[3] = Tools.dom( 'div', Tools.css.basic + 'width:100%; bottom:0px; height:1px; background: rgba(255, 255, 255, 0.2);');

	    this.c[4] = Tools.dom( 'path', Tools.css.basic + 'position:absolute; width:10px; height:10px; left:4px; top:'+fltop+'px;', { d:'M 3 8 L 8 5 3 2 3 8 Z', fill:this.fontColor, stroke:'none'});

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

	    /*handleEvent: function ( e ) {

	        e.preventDefault();

	        switch( e.type ) {
	            case 'click': this.click(e); break;
	            case 'mouseover': this.mode(1); break;
	            case 'mousedown': this.mode(2); break;
	            case 'mouseout':  this.mode(0); break;
	        }

	    },*/

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    click: function ( e ) {

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

	        Tools.setSvg( svg, 'd', this.makePath( this.pa1 ), 0 );

	        this.pa2.shift();
	        this.pa2.push( 8.5 + this.round( ( 1 - (this.ms / 200)) * 30 ) );

	        Tools.setSvg( svg, 'd', this.makePath( this.pa2 ), 1 );

	        if ( this.isMem ) {

	            this.pa3.shift();
	            this.pa3.push( 8.5 + this.round( ( 1 - this.mm) * 30 ) );

	            Tools.setSvg( svg, 'd', this.makePath( this.pa3 ), 2 );

	        }

	    },

	    show: function(){

	        this.h = this.hplus + this.baseH;

	        Tools.setSvg( this.c[4], 'd','M 5 8 L 8 3 2 3 5 8 Z');


	        if( this.parentGroup !== null ){ this.parentGroup.calc( this.hplus );}
	        else if( this.isUI ) this.main.calc( this.hplus );

	        this.s[0].height = this.h +'px';
	        this.s[2].display = 'block'; 
	        this.isShow = true;

	        Tools.addListen( this );

	    },

	    hide: function(){

	        this.h = this.baseH;

	        Tools.setSvg( this.c[4], 'd','M 3 8 L 8 5 3 2 3 8 Z');

	        if( this.parentGroup !== null ){ this.parentGroup.calc( -this.hplus );}
	        else if( this.isUI ) this.main.calc( -this.hplus );
	        
	        this.s[0].height = this.h +'px';
	        this.s[2].display = 'none';
	        this.isShow = false;

	        Tools.removeListen( this );
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
	    this.isGroup = true;

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

	    testZone: function( mx, my ){

	        if( Tools.lock ) return;

	        //this.decal = this.isUI ? this.main.decal : 0;
	        //my+=this.decal;

	        if(!Tools.over( this, mx, my )) return '';



	        //this.unSelected();

	        var l = this.local;
	        var next = -1;



	        if( l.y < this.baseH+2 ) return 'title';
	        else{
	            if( this.isOpen ){
	                if( l.y > this.baseH+2 ){

	                    next = this.findID( mx, my );
	                    if( next !== this.current ){

	                        this.clearTarget();
	                        this.current = next;

	                    }

	                    if( next !== -1 ){ 
	                        this.target = this.uis[this.current];
	                        this.target.uiover();
	                    }/* else {
	                        this.target = null;
	                    }*/

	                    return 'content';
	                }
	                return '';
	            }

	        }

	    },

	    clearTarget: function (){

	        if(!this.target) return;
	        this.target.uiout();
	        this.target.reset();
	        this.target = null;

	    },

	    findID: function ( mx, my ){

	        var i = this.uis.length;

	        while( i-- ){
	            if( Tools.over( this.uis[i], mx, my ) ) return i;
	        }

	        return -1;

	    },

	    reset: function(noC){

	        this.clearTarget();

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    click: function ( e ) {

	        if(this.target) this.target.click( e );
	        var name = this.testZone( e.clientX, e.clientY );

	        //if(e.clientY > this.zone.y+this.baseH ) return;
	        if( name === 'title' ){
	            if( this.isOpen ) this.close();
	            else this.open();
	        }

	    },

	    mousedown: function( e ){

	        if(this.target) this.target.mousedown( e );
	        //var name = this.testZone( e.clientX, e.clientY );
	        

	    },

	    mousemove: function( e ){

	        //if(this.decal) e.clientY+=this.decal;

	        if(this.target) this.target.mousemove( e );
	        var name = this.testZone( e.clientX, e.clientY );

	        if( name === 'title' ) this.reset();

	    },

	    mouseup: function( e ){

	        if(this.target) this.target.mouseup( e );

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

	        Tools.calcUis( this.uis, this.zone, this.zone.y + this.baseH );

	        /*var lng = this.uis.length, u, i, py = this.zone.y + this.baseH, px = 0;

	        for( i = 0; i < lng; i++){

	            u = this.uis[i];

	            u.zone.w = u.w;
	            u.zone.h = u.h;

	            if( !u.autoWidth ){
	                if(px===0) py += u.h+1;
	                u.zone.y = py-u.h;
	                u.zone.x = this.zone.x + px;
	                px += u.w;

	                if(px+u.w>this.w) px = 0

	            } else {
	                u.zone.x = this.zone.x;
	                u.zone.y = py;
	                py += u.h + 1;
	            }
	            
	            

	        }*/

	    },

	    /*calcUis: function () {

	        var i = this.uis.length;
	        while(i--){
	            this.uis[i].getZone();
	        }

	    },*/

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

	    open: function () {

	        Proto.prototype.open.call( this );

	        Tools.setSvg( this.c[4], 'd','M 5 8 L 8 3 2 3 5 8 Z');
	        //this.s[4].background = UIL.F1;
	        this.rSizeContent();



	        if( this.isUI ) this.main.calc( this.h - this.baseH );
	        //console.log('open', this.h - this.baseH)

	    },

	    close: function () {

	        Proto.prototype.close.call( this );

	        if( this.isUI ) this.main.calc( -( this.h - this.baseH ) );

	        Tools.setSvg( this.c[4], 'd','M 3 8 L 8 5 3 2 3 8 Z');
	        this.h = this.baseH;
	        this.s[0].height = this.h + 'px';

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

	    /*this.radius = o.radius || 50;

	    this.w = (this.radius*2)+20;

	    if(o.width !== undefined){
	        this.w = o.width;
	        this.radius = ~~ (( this.w-20 )*0.5);
	    }
	    if(o.size !== undefined){
	        this.w = o.size;
	        this.radius = ~~ (this.w-20)*0.5;
	    }*/

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

	    this.c[2] = Tools.dom( 'circle', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.w+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius, r:this.radius, fill:'url(#grad)' });
	    this.c[3] = Tools.dom( 'circle', Tools.css.basic + 'left:0px; top:'+(this.top-10)+'px; width:'+(this.w+20)+'px; height:'+(this.height+20)+'px;', { cx:this.radius+10, cy:this.radius+10, r:this.innerRadius+10, fill:'url(#gradS)'});
	    this.c[4] = Tools.dom( 'circle', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.w+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius, r:this.innerRadius, fill:'url(#gradIn)', 'stroke-width':1, stroke:'#000'  });
	    this.c[5] = Tools.dom( 'div', Tools.css.txt + 'text-align:center; top:'+(this.height+20)+'px; width:'+this.w+'px; color:'+ this.fontColor );

	    // gradian bakground
	    var svg = this.c[2];
	    Tools.dom( 'defs', null, {}, svg );
	    Tools.dom( 'radialGradient', null, {id:'grad', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, svg, 1 );
	    Tools.dom( 'stop', null, { offset:'40%', style:'stop-color:rgb(0,0,0); stop-opacity:0.3;' }, svg, [1,0] );
	    Tools.dom( 'stop', null, { offset:'80%', style:'stop-color:rgb(0,0,0); stop-opacity:0;' }, svg, [1,0] );
	    Tools.dom( 'stop', null, { offset:'90%', style:'stop-color:rgb(50,50,50); stop-opacity:0.4;' }, svg, [1,0] );
	    Tools.dom( 'stop', null, { offset:'100%', style:'stop-color:rgb(50,50,50); stop-opacity:0;' }, svg, [1,0] );

	    // gradian shadow
	    svg = this.c[3];
	    Tools.dom( 'defs', null, {}, svg );
	    Tools.dom( 'radialGradient', null, {id:'gradS', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, svg, 1 );
	    Tools.dom( 'stop', null, { offset:'60%', style:'stop-color:rgb(0,0,0); stop-opacity:0.5;' }, svg, [1,0] );
	    Tools.dom( 'stop', null, { offset:'100%', style:'stop-color:rgb(0,0,0); stop-opacity:0;' }, svg, [1,0] );

	    // gradian stick

	    var cc0 = ['rgb(40,40,40)', 'rgb(48,48,48)', 'rgb(30,30,30)'];
	    var cc1 = ['rgb(1,90,197)', 'rgb(3,95,207)', 'rgb(0,65,167)'];

	    svg = this.c[4];
	    Tools.dom( 'defs', null, {}, svg );
	    Tools.dom( 'radialGradient', null, {id:'gradIn', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, svg, 1 );
	    Tools.dom( 'stop', null, { offset:'30%', style:'stop-color:'+cc0[0]+'; stop-opacity:1;' }, svg, [1,0] );
	    Tools.dom( 'stop', null, { offset:'60%', style:'stop-color:'+cc0[1]+'; stop-opacity:1;' }, svg, [1,0]  );
	    Tools.dom( 'stop', null, { offset:'80%', style:'stop-color:'+cc0[1]+'; stop-opacity:1;' }, svg, [1,0]  );
	    Tools.dom( 'stop', null, { offset:'100%', style:'stop-color:'+cc0[2]+'; stop-opacity:1;' }, svg, [1,0]  );

	    Tools.dom( 'radialGradient', null, {id:'gradIn2', cx:'50%', cy:'50%', r:'50%', fx:'50%', fy:'50%' }, this.c[4], 1 );
	    Tools.dom( 'stop', null, { offset:'30%', style:'stop-color:'+cc1[0]+'; stop-opacity:1;' }, svg, [1,1]  );
	    Tools.dom( 'stop', null, { offset:'60%', style:'stop-color:'+cc1[1]+'; stop-opacity:1;' }, svg, [1,1] );
	    Tools.dom( 'stop', null, { offset:'80%', style:'stop-color:'+cc1[1]+'; stop-opacity:1;' }, svg, [1,1] );
	    Tools.dom( 'stop', null, { offset:'100%', style:'stop-color:'+cc1[2]+'; stop-opacity:1;' }, svg, [1,1] );

	    //console.log( this.c[4] )

	    this.c[5].textContent = 'x'+ this.value[0] +' y' + this.value[1];

	    this.init();

	    this.update(false);
	}

	Joystick.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Joystick,

	    mode: function ( mode ) {

	        switch(mode){
	            case 0: // base
	                Tools.setSvg( this.c[4], 'fill','url(#gradIn)');
	                Tools.setSvg( this.c[4], 'stroke', '#000' );
	            break;
	            case 1: // over
	                Tools.setSvg( this.c[4], 'fill', 'url(#gradIn2)' );
	                Tools.setSvg( this.c[4], 'stroke', 'rgba(0,0,0,0)' );
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

	        Tools.setSvg( this.c[3], 'cx', sx );
	        Tools.setSvg( this.c[3], 'cy', sy );
	        Tools.setSvg( this.c[4], 'cx', x );
	        Tools.setSvg( this.c[4], 'cy', y );

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

	    this.buttonColor = Tools.colors.button;

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

	    this.c[2] = Tools.dom( 'div', Tools.css.txtnumber + 'text-align:center; top:'+(this.height+24)+'px; width:'+this.w+'px; color:'+ this.fontColor );
	    this.c[3] = Tools.dom( 'circle', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px; ', { cx:this.radius, cy:this.radius, r:this.radius-4, fill:'rgba(0,0,0,0.3)' });
	    this.c[4] = Tools.dom( 'circle', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { cx:this.radius, cy:this.radius*0.5, r:3, fill:this.fontColor });
	    this.c[5] = Tools.dom( 'path', Tools.css.basic + 'left:10px; top:'+this.top+'px; width:'+this.ww+'px; height:'+this.height+'px;', { d:this.makeGrad(), 'stroke-width':1, stroke:Tools.colors.stroke });
	    
	    Tools.dom( 'circle', null, { cx:this.radius, cy:this.radius, r:this.radius*0.7, fill:this.buttonColor, 'stroke-width':1, stroke:Tools.colors.stroke }, this.c[3] );

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

	        Tools.setSvg( this.c[4], 'transform', 'rotate('+ r +' '+this.radius+' '+this.radius+')' );

	        if( up ) this.send();
	        
	    },

	} );

	function List ( o ) {

	    Proto.call( this, o );

	    this.autoHeight = false;
	    var align = o.align || 'center';

	    this.sMode = 0;
	    this.tMode = 0;

	    this.buttonColor = o.bColor || Tools.colors.button;

	    var fltop = Math.floor(this.h*0.5)-5;

	    //this.c[2] = Tools.dom( 'div', Tools.css.basic + 'top:0; height:90px; cursor:s-resize; pointer-events:auto; display:none; overflow:hidden; border:1px solid '+Tools.colors.border+';' );
	    //this.c[3] = Tools.dom( 'div', Tools.css.txt + 'text-align:'+align+'; line-height:'+(this.h-4)+'px; border:1px solid '+Tools.colors.border+'; top:1px; pointer-events:auto; cursor:pointer; background:'+this.buttonColor+'; height:'+(this.h-2)+'px;' );

	    this.c[2] = Tools.dom( 'div', Tools.css.basic + 'top:0; height:90px;  display:none; overflow:hidden;' );//cursor:s-resize; pointer-events:auto;
	    this.c[3] = Tools.dom( 'div', Tools.css.txt + 'text-align:'+align+'; line-height:'+(this.h-4)+'px; top:1px;  background:'+this.buttonColor+'; height:'+(this.h-2)+'px; border-radius:'+this.radius+'px;' );//pointer-events:auto; cursor:pointer;
	    this.c[4] = Tools.dom( 'path', Tools.css.basic + 'position:absolute; width:10px; height:10px; top:'+fltop+'px;', { d:'M 3 8 L 8 5 3 2 3 8 Z', fill:this.fontColor, stroke:'none'});

	    this.scroller = Tools.dom( 'div', Tools.css.basic + 'right:5px;  width:10px; background:#666; display:none;');

	    this.c[3].style.color = this.fontColor;

	    this.list = o.list || [];
	    this.items = [];

	    this.baseH = this.h;

	    //this.maxItem = o.maxItem || 5;
	    this.itemHeight = o.itemHeight || (this.h-3);
	    //this.length = this.list.length;

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

	    this.listIn = Tools.dom( 'div', Tools.css.basic + 'left:0; top:0; width:100%; background:rgba(0,0,0,0.2);');
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

	        if(!Tools.over( this, e.clientX, e.clientY )) return '';

	        this.unSelected();

	        var l = this.local;

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
	                name = 'item';
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
	            this.currentItem.style.color = Tools.colors.text;
	            this.currentItem = null;
	        }

	    },

	    selected: function(){

	        this.currentItem.style.background = Tools.colors.select;
	        this.currentItem.style.color = '#FFF';

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    click: function( e ){

	        var name = this.testZone( e );

	        if(name === 'title'){
	            if( !this.isOpen ) this.open();
	            else this.close();
	        }
	        if(this.currentItem){
	            this.value = this.currentItem.textContent;//name;
	            this.c[3].textContent = this.value;
	            this.send();
	            this.close();
	        }

	    },

	    mouseup: function( e ){

	        this.isDown = false;

	    },

	    mousedown: function( e ){

	        var name = this.testZone( e );

	        if( !name ) return;

	        if(name === 'title'){
	            this.modeTitle(2);
	        }

	        if( name === 'scroll' ){
	            this.isDown = true;
	            this.mousemove( e );

	        }

	    },

	    mousemove: function( e ){

	        var name = this.testZone( e );

	        if( !name ) return;

	        if( name === 'title' ){
	            this.modeTitle(1);
	            Tools.cursor('pointer');

	        }

	        if( name === 'item' ){
	            this.modeTitle(0);
	            this.modeScroll(0);
	            Tools.cursor('pointer');
	        }

	        if( name === 'scroll' ){

	            Tools.cursor('s-resize');
	            this.modeScroll(1);
	            if( this.isDown ){
	                this.modeScroll(2);
	                var top = this.zone.y+this.baseH-2;
	                this.update( ( e.clientY - top  ) - ( this.sh*0.5 ) );
	            }
	            //if(this.isDown) this.listmove(e);


	        }/*else{
	            
	        }*/

	        //console.log(name)

	    },

	    mousewheel: function( e ){

	        /*
	        if( !this.scroll ) return;
	        if( this.isUI ) this.main.lockwheel = true;
	        var delta = 0;
	        if( e.wheelDeltaY ) delta = -e.wheelDeltaY*0.04;
	        else if( e.wheelDelta ) delta = -e.wheelDelta*0.2;
	        else if( e.detail ) delta = e.detail*4.0;

	        this.py += delta;

	        this.update(this.py);
	        */

	    },



	    // ----------------------

	    reset: function () {

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
	                this.scroller.style.background = Tools.colors.select;
	            break;
	            case 2: // edit / down
	                this.scroller.style.background = Tools.colors.down;
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
	                s[3].background = Tools.colors.select;
	            break;
	            case 2: // edit / down
	                s[3].color = this.fontColor;
	                s[3].background = Tools.colors.down;
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
	            item = Tools.dom( 'div', Tools.css.item + 'width:'+this.ww+'px; height:'+this.itemHeight+'px; line-height:'+(this.itemHeight-5)+'px;');
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
	        if( this.side === 'up' ) Tools.setSvg( this.c[4], 'd','M 5 2 L 2 7 8 7 5 2 Z');
	        else Tools.setSvg( this.c[4], 'd','M 5 8 L 8 3 2 3 5 8 Z');

	        this.rSizeContent();

	        var t = this.h - this.baseH;

	        this.zone.h = this.h;

	        if( this.parentGroup !== null ) this.parentGroup.calc( t );
	        else if( this.isUI ) this.main.calc( t );

	    },

	    close: function(){

	        Proto.prototype.close.call( this );

	        var t = this.h - this.baseH;

	        if( this.parentGroup !== null ) this.parentGroup.calc( -t );
	        else if( this.isUI ) this.main.calc( -t );

	        this.h = this.baseH;
	        this.s[0].height = this.h + 'px';
	        this.s[2].display = 'none';
	        Tools.setSvg( this.c[4], 'd','M 3 8 L 8 5 3 2 3 8 Z');
	        this.zone.h = this.h;
	        
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

	        //s[5].width = w + 'px';
	        //s[5].left = d + 'px';

	        this.ww = w;
	        if( this.max > this.maxHeight ) this.ww = w-20;

	        if(this.isOpen) this.rSizeContent();

	    }

	} );

	function Numeric( o ){

	    Proto.call( this, o );

	    this.type = 'number';

	    this.setTypeNumber( o );

	    this.allway = o.allway || false;
	    this.isDrag = o.drag === undefined ? true : o.drag;

	    this.value = [0];
	    this.toRad = 1;
	    this.isNumber = true;
	    this.isAngle = false;
	    this.isVector = false;
	    this.isSelect = false;

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

	    //this.w = ((Tools.base.BW+5)/(this.lng))-5;
	    this.current = undefined;
	    this.selected = null;
	    
	    var i = this.lng;
	    while(i--){
	        if(this.isAngle) this.value[i] = (this.value[i] * 180 / Math.PI).toFixed( this.precision );
	        this.c[2+i] = Tools.dom( 'div', Tools.css.txtselect + 'letter-spacing:-1px; height:'+(this.h-4)+'px; line-height:'+(this.h-8)+'px;');
	        //this.c[2+i].name = i;
	        if(this.isDrag) this.c[2+i].style.cursor = 'move';
	        if(o.center) this.c[2+i].style.textAlign = 'center';

	        this.c[2+i].textContent = this.value[i];
	        this.c[2+i].style.color = this.fontColor;
	        //this.c[2+i].contentEditable = true;
	       // this.c[2+i].events = [ 'keydown', 'keyup', 'mousedown', 'blur', 'focus' ]; //'click', 

	    }

	    this.init();
	}

	Numeric.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Numeric,

	    testZone: function( e ){

	        if(!Tools.over( this, e.clientX, e.clientY )) return '';

	        var i = this.lng;
	        var t = this.tmp;
	        var l = this.local;

	        while( i-- ){
	            if( l.x>t[i][0] && l.x<t[i][2] ) return i;//+2;
	        }

	    },

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mousedown: function ( e ) {

	        if(this.isSelect) return;

	        var name = this.testZone( e );

	        //e.preventDefault();

	        if( name ){

	            this.current = name;//parseFloat(e.target.name);
	            this.prev = { x:e.clientX, y:e.clientY, d:0, id:(this.current+2)};
	            if( this.isNumber ) this.prev.v = parseFloat(this.value);
	            else this.prev.v = parseFloat( this.value[this.current] );

	        }



	        //document.addEventListener( 'mouseup', this, false );
	        //if(this.isDrag) document.addEventListener( 'mousemove', this, false );

	    },

	    mouseup: function( e ){

	        var name = this.testZone( e );

	        //e.preventDefault();

	        //document.removeEventListener( 'mouseup', this, false );
	        //if(this.isDrag) document.removeEventListener( 'mousemove', this, false );

	        if( this.current !== undefined ){ 

	            if( this.current === name ){ 
	                e.target.contentEditable = true;
	                e.target.focus();
	            }

	        }

	    },

	    mousemove: function( e ){

	        var name = this.testZone( e );

	        if(name){
	            this.selected = name+2;
	        }

	        //console.log(name)

	        if( this.current === undefined ) return;

	        this.prev.d += ( e.clientX - this.prev.x ) - ( e.clientY - this.prev.y );
	        var n = this.prev.v + ( this.prev.d * this.step);

	        this.value[this.current] = this.numValue(n);
	        //this.c[2+this.current].value = this.value[this.current];

	        this.c[2+this.current].textContent = this.value[this.current];

	        this.validate();

	        this.prev.x = e.clientX;
	        this.prev.y = e.clientY;

	    },

	    // ----------------------

	    reset: function () {

	        /*if( this.selected ){
	            this.s[ this.selected ].color = this.fontColor;
	            this.s[ this.selected ].background = this.buttonColor;
	            this.selected = null;
	            Tools.cursor();
	        }*/

	    },

	    // ----------------------

	    /////

	    /*handleEvent: function( e ) {

	        //e.preventDefault();
	        //e.stopPropagation();

	        switch( e.type ) {
	            //case 'click': this.click( e ); break;
	            case 'mousedown': this.down( e ); break;
	            case 'keydown': this.keydown( e ); break;
	            case 'keyup': this.keyup( e ); break;

	            case 'blur': this.blur( e ); break;
	            case 'focus': this.focus( e ); break;

	            // document
	            case 'mouseup': this.up( e ); break;
	            case 'mousemove': this.move( e ); break;

	        }

	    },*/

	    setValue: function ( v, n ) {

	        n = n || 0;
	        this.value[n] = this.numValue( v );
	        this.c[2+n].textContent = this.value[n];

	    },

	    keydown: function ( e ) {

	        e.stopPropagation();

	        if( e.keyCode === 13 ){
	            e.preventDefault();
	            this.testValue( parseFloat(e.target.name) );
	            this.validate();
	            e.target.blur();
	        }

	    },

	    keyup: function ( e ) {
	        
	        e.stopPropagation();

	        if( this.allway ){ 
	            this.testValue( parseFloat(e.target.name) );
	            this.validate();
	        }

	    },

	    blur: function ( e ) {

	        this.isSelect = false;
	        e.target.style.borderColor = Tools.colors.border;
	        e.target.contentEditable = false;
	        //e.target.style.border = '1px solid rgba(255,255,255,0.1)';
	        if(this.isDrag) e.target.style.cursor = 'move';
	        else  e.target.style.cursor = 'pointer';

	    },

	    focus: function ( e ) {

	        this.isSelect = true;
	        this.current = undefined;
	        e.target.style.borderColor = Tools.colors.borderSelect;
	        
	        //e.target.style.border = '1px solid ' + UIL.BorderSelect;
	        if(this.isDrag) e.target.style.cursor = 'auto';

	    },

	    

	    testValue: function( n ){

	        if(!isNaN( this.c[2+n].textContent )){ 
	            var nx = this.numValue( this.c[2+n].textContent );
	            this.c[2+n].textContent = nx;
	            this.value[n] = nx;
	        } else { // not number
	            this.c[2+n].textContent = this.value[n];
	        }

	    },

	    validate: function(){

	        var ar = [];
	        var i = this.lng;
	        while(i--) ar[i] = this.value[i]*this.toRad;

	        if( this.isNumber ) this.send( ar[0] );
	        else this.send( ar );

	    },

	    rSize: function(){

	        Proto.prototype.rSize.call( this );

	        this.w = Math.floor( ( this.sb + 5 ) / this.lng )-5;
	        var s = this.s;
	        var i = this.lng;
	        while(i--){
	            this.tmp[i] = [ Math.floor( this.sa + ( this.w * i )+( 5 * i )), this.w ];
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
	    this.buttonColor = o.bColor || Tools.colors.button;

	    //this.old = this.value;
	    this.isDown = false;
	    this.isOver = false;
	    this.allway = o.allway || false;

	    this.firstImput = false;

	    this.c[2] = Tools.dom( 'div', Tools.css.txtselect + 'letter-spacing:-1px; padding:2px 5px; text-align:right;  width:47px; border:1px solid '+Tools.colors.hide+'; color:'+ this.fontColor );
	    this.c[3] = Tools.dom( 'div', Tools.css.basic + ' top:0; height:'+this.h+'px;' );
	    //this.c[4] = Tools.dom( 'div', Tools.css.basic + 'border:1px solid '+this.buttonColor+'; pointer-events:none; background:rgba(0,0,0,0.3); top:2px; height:'+(this.h-4)+'px;' );
	    this.c[4] = Tools.dom( 'div', Tools.css.basic + 'background:rgba(0,0,0,0.3); top:2px; height:'+(this.h-4)+'px;' );
	    this.c[5] = Tools.dom( 'div', Tools.css.basic + 'left:4px; top:5px; height:'+(this.h-10)+'px; background:' + this.fontColor +';' );

	    this.c[2].isNum = true;

	    //this.c[2].name = 'text';
	    //this.c[3].name = 'scroll';

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

	        this.c[6] = Tools.dom( 'div', Tools.css.basic + 'border-radius:'+ra+'px; margin-left:'+(-ww*0.5)+'px; border:1px solid '+Tools.colors.border+'; background:'+this.buttonColor+'; left:4px; top:2px; height:'+(this.h-4)+'px; width:'+ww+'px;' );
	    }

	    this.init();

	}

	Slide.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: Slide,

	    testZone: function( e ){

	        if(!Tools.over( this, e.clientX, e.clientY )) return '';

	        var l = this.local;
	        
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
	        }
	        
	    },

	    mousedown: function( e ){

	        var name = this.testZone( e );

	        //if( !name ) return;

	        if( name === 'scroll' ){ 
	            this.isDown = true;
	            this.old = this.value;
	            this.mousemove( e );
	            
	        }

	        if( name === 'text' ){
	            Tools.setInput( this.c[2], function(){this.validate();}.bind(this) );
	        }else{
	            Tools.clearInput();
	        }

	    },

	    mousemove: function( e ){

	        var name = this.testZone( e );

	        if( name==='scroll' ) {
	            this.mode(1);
	            Tools.cursor('w-resize');
	        } else if(name==='text'){ 
	            Tools.cursor('pointer');
	        }

	        if( this.isDown ){

	            var n = ((( e.clientX - (this.zone.x+this.sa) - 3 ) / this.ww ) * this.range + this.min ) - this.old;
	            if(n >= this.step || n <= this.step){ 
	                n = Math.floor( n / this.step );
	                this.value = this.numValue( this.old + ( n * this.step ) );
	                this.update( true );
	                this.old = this.value;
	            }
	        }

	    },

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

	        //Tools.clearInput();
	        this.mode(0);

	    },

	    mode: function ( mode ) {

	        var s = this.s;

	        switch(mode){
	            case 0: // base
	               // s[2].border = '1px solid ' + Tools.colors.hide;
	                s[2].color = this.fontColor;
	                s[4].background = 'rgba(0,0,0,0.3)';
	                s[5].background = this.fontColor;
	            break;
	            case 1: // scroll over
	                //s[2].border = '1px dashed ' + Tools.colors.hide;
	                s[2].color = this.colorPlus;
	                s[4].background = 'rgba(0,0,0,0.6)';
	                s[5].background = this.colorPlus;
	            break;
	           /* case 2: 
	                s[2].border = '1px solid ' + Tools.colors.borderSelect;
	            break;
	            case 3: 
	                s[2].border = '1px dashed ' + this.fontColor;//Tools.colors.borderSelect;
	            break;
	            case 4: 
	                s[2].border = '1px dashed ' + Tools.colors.hide;
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

	    this.value = o.value || '';
	    this.allway = o.allway || false;
	    this.firstImput = false;

	    this.c[2] = Tools.dom( 'div',  Tools.css.txtselect );
	    this.c[2].name = 'input';
	    //this.c[2].style.color = ;
	    this.c[2].textContent = this.value;

	    //this.c[2].events = [ 'mousedown', 'keydown', 'keyup', 'blur', 'focus' ];

	    this.init();

	}

	TextInput.prototype = Object.assign( Object.create( Proto.prototype ), {

	    constructor: TextInput,

	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    mousedown: function( e ){

	        this.activeText(true);

	    },

	    keydown: function( e ){
	        
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
	        
	    },

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

	    activeText: function( b ){

	        if(b){
	            this.c[2].contentEditable = true;
	            this.c[2].focus();
	            this.isEdit = true;
	            this.mode(1);
	            this.firstImput = true;
	            Tools.select( this.c[2] );
	        } else {
	            this.c[2].contentEditable = false;
	            this.c[2].blur();
	            this.isEdit = false;
	            this.mode(0);

	        }

	    },

	    mode: function ( mode ) {

	        var s = this.s;

	        switch(mode){
	            case 0: 
	                s[2].border = '1px dashed ' + Tools.colors.hide;
	            break;
	            case 1: 
	                s[2].border = '1px dashed ' + this.fontColor;
	            break;
	        }
	    },

	} );

	function Title ( o ) {
	    
	    Proto.call( this, o );

	    //var id = o.id || 0;
	    var prefix = o.prefix || '';

	    this.c[2] = Tools.dom( 'div', Tools.css.txt + 'text-align:right; width:60px; line-height:'+ (this.h-8) + 'px; color:' + this.fontColor );

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

	var REVISION = '1.0';

	/**
	 * @author lo-th / https://github.com/lo-th
	 */

	function Gui ( o ) {

	    //this.name = 'ui';

	    this.isGui = true;
	    this.isReady = false;



	    o = o || {};

	    this.isReset = true;

	    this.is3d = o.is3d || false;
	    this.css = o.css !== undefined ? o.css : '';
	    this.callback = o.callback  === undefined ? null : o.callback;

	    this.mHeight = o.maxHeight || undefined;







	    this.zone = { x:0, y:0, w:0, h:0 };
	    this.local = { x:-1, y:-1 };

	    this.mouse = null;


	    // size define
	    this.size = Tools.size;
	    if( o.p !== undefined ) this.size.p = o.p;
	    if( o.w !== undefined ) this.size.w = o.w;
	    if( o.h !== undefined ) this.size.h = o.h;
	    if( o.s !== undefined ) this.size.s = o.s;

	    this.size.h = this.size.h < 11 ? 11 : this.size.h;

	    this.zone.w = this.size.w;

	    // bottom height
	    this.bh = this.size.h;


	    // tmp variable
	    //this.height = 0;
	    this.h = 0;
	    this.prevY = -1;
	    this.sw = 0;

	    
	 

	    // color
	    this.colors = Tools.colors;
	    this.bg = o.bg || Tools.colors.background;

	    // bottom and close height
	    this.isWithClose = true;
	    

	    //this.baseH = Tools.size.height;

	    if(o.close !== undefined ){
	        this.isWithClose = o.close;
	        this.bh = !this.isWithClose ? 0 : this.bh;
	    }

	    
	    this.isCenter = o.center || false;
	    this.lockwheel = false;
	    this.onWheel = false;
	    this.isOpen = true;

	    this.uis = [];

	    this.current = -1;
	    this.target = null;
	    this.decal = 0;
	    this.ratio = 1;

	    this.content = Tools.dom( 'div', Tools.css.basic + 'display:block; width:0px; height:auto; top:0px; right:10px; pointer-events:auto;' + this.css );
	    //this.content.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
	    //this.content = Tools.dom( 'div', Tools.css.basic + 'display:block; width:0px; height:auto; top:0; right:10px; transition:height 0.1s ease-out; pointer-events:auto;' + this.css );

	    if( o.parent !== undefined ){ 
	        if( o.parent ) o.parent.appendChild( this.content );
	        //else Tools.hidefrag.appendChild( this.content );
	    } else {
	        document.body.appendChild( this.content );
	    }

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
	    if( this.autoResize ) window.addEventListener("resize", function(){ this.resize(); }.bind(this), false );

	    //

	    this.setWidth();
	    this.getCorner();


	    Tools.main = this;

	    Tools.push( this );

	}

	Gui.prototype = {

	    constructor: Gui,

	    getDom: function () {
	        return this.content;
	    },

	    setMouse: function( m ){

	        this.mouse = m;

	    },

	    setEventCallback: function(callback){

	        Tools.eventCallback  = callback;

	    },

	    getCorner: function () {

	        var box = this.content.getBoundingClientRect();
	        this.zone.x = box.left || 0;
	        this.zone.y = box.top || 0;

	    },

	    testZone: function ( e ) {

	        //if( Tools.lock ) return;

	        if(!Tools.over( this, e.clientX, e.clientY )) return '';

	        this.isReset = false;

	        var name = '';
	        //var over = Tools.over( this, mx, my );

	        //if( !over ) return name;

	        var l = this.local;

	        var s = this.isScroll ?  this.zone.w  - this.size.s : this.zone.w;
	        var next = -1;

	        if( l.y > this.zone.h-this.bh ) name = 'bottom';
	        else name = l.x > s ? 'scroll' : 'content';



	        if( !Tools.lock ){

	            next = name === 'content' ? this.findID( e ) : -1;

	            if( next !== this.current ){

	                this.clearTarget();
	                this.current = next;

	            }


	            if( next !== -1 ){ 
	                this.target = this.uis[this.current];
	                this.target.uiover();
	            }/* else {
	                this.target = null;
	            }*/
	        }

	        return name;

	    },

	    clearTarget: function (){

	        if(!this.target) return;
	        this.target.uiout();
	        this.target.reset();
	        this.target = null;
	        this.current = -1;

	    },

	    findID: function ( e ){

	        var i = this.uis.length;

	        while( i-- ){
	            if( Tools.over( this.uis[i], e.clientX, e.clientY  ) ) return i;
	        }

	        return -1;

	    },

	    setText: function ( size, color, font ) {

	        Tools.setText( size, color, font );

	    },

	    hide : function (b) {

	        if(b) this.content.style.display = 'none';
	        else this.content.style.display = 'block';
	        
	    },

	    getHTML : function(){

	        return this.content;

	    },

	    onChange : function( f ){

	        this.callback = f;
	        return this;

	    },

	    action: function (){

	    },

	    


	    // ----------------------
	    //   EVENTS
	    // ----------------------

	    click: function( e ){

	        if(this.target) this.target.click( e );

	    },

	    mousedown: function( e ){

	        if(this.target) this.target.mousedown( e );

	        var name = this.testZone( e );

	        if( !name ) return;

	        if(name === 'scroll'){
	            this.isDown = true;
	            //Tools.down = this;
	            this.mousemove( e );
	        }
	        if(name === 'bottom'){
	            this.isOpen = this.isOpen ? false : true;
	            this.bottom.textContent = this.isOpen ? 'close' : 'open';
	            this.setHeight();
	        }

	    },

	    mousemove: function( e ){

	        if(this.target) this.target.mousemove( e );

	        var name = this.testZone( e );

	        if(name === 'scroll'){
	            this.scroll.style.background = this.isDown ? this.colors.down : this.colors.select;
	            Tools.cursor('s-resize');
	        } 
	        if(name === 'bottom'){
	            this.bottom.style.color = '#FFF';
	            this.bottom.style.background = this.colors.backgroundOver;
	            Tools.cursor('pointer');
	        }
	        

	        if(!this.isDown) return;
	        //this.scroll.style.background = this.colors.down;
	        this.update( (e.clientY-this.zone.y)-(this.sh*0.5) );

	    },

	    mouseup: function( e ){

	        if(this.target) this.target.mouseup( e );

	        if( this.isDown ){
	            this.isDown = false;
	            if(this.isScroll) this.calcUis();
	            //this.reset();
	            //Tools.down = null;
	        }

	        

	    },

	    mousewheel: function ( e ){

	        if(this.target) this.target.mousewheel( e );

	        //e.preventDefault();
	        //e.stopPropagation();

	        if( this.lockwheel || !this.isScroll ) return;

	        //this.onWheel = true;

	        var x = e.clientX - this.zone.x;
	        //var px = this.content.getBoundingClientRect().left;

	        if( x<0 || x>this.zone.w ) return;

	        //if(x<px) return;
	        //if(x>(px+this.zone.w)) return;

	        var delta = 0;
	        if(e.wheelDeltaY) delta = -e.wheelDeltaY*0.04;
	        else if(e.wheelDelta) delta = -e.wheelDelta*0.2;
	        else if(e.detail) delta = e.detail*4.0;

	        this.py += delta;

	        this.update( this.py );

	    },

	    keydown: function ( e ){

	        if(this.target) this.target.keydown( e );

	    },


	    ////

	    reset: function( force ){

	        if(this.isReset) return;

	        this.mouse = null;

	        Tools.clearInput();
	        this.clearTarget();

	        //if( !this.over ) return;

	        /*if( this.current!==-1 && !noC ) { 
	            this.uis[this.current].uiout();
	            Tools.cursor();
	        }*/

	        this.scroll.style.background = this.colors.scroll;
	        this.bottom.style.background = this.colors.background;
	        this.bottom.style.color = '#CCC';

	        //console.log('ui reset')

	        Tools.eventCallback( force );

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

	        return u;

	    },

	    calcUis: function () {

	        Tools.calcUis( this.uis, this.zone, this.zone.y - this.decal );

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
	        Tools.listens = [];

	        this.calc( - this.h );

	    },

	    // -----------------------------------

	    // Scroll

	    update: function ( y ){

	        y = y < 0 ? 0 :y;
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

	            //if(this.maxHeight !== undefined) this.maxView = this.maxHeight - this.top - this.bh;
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

	    resize:function(e){

	        this.setHeight();
	        //this.getCorner();
	        this.isReady = false;

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

	            var hhh = this.mHeight !== undefined ? this.mHeight : window.innerHeight;

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

	        if( this.isOpen ) { this.calcUis(); }

	        Tools.eventCallback();

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

	exports.Tools = Tools;
	exports.Gui = Gui;
	exports.Proto = Proto;
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
	exports.add = add;
	exports.REVISION = REVISION;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
