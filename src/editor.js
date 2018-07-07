/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    CODEMIRROR ultimate editor
*/

'use strict';

var editor = ( function () {

var styles;

var subtitle, subtitleS, title, menuBottom, demoContent, bigmenu, menuImg, bigButton = []; 
var contentLeft, contentRight, codeContent, code, separatorLeft, separatorRight, menuCode, github;

var callback = function(){};
var isSelfDrag = false;
var isFocus = false;
var errorLines = [];
var widgets = [];
var interval = null;

var joystick;

var left = 0;
var oldLeft = 0;
var isLeftDown = false;

var right = 0;
var oldRight = 0;
var isRightDown = false;

var option = null;

var selectColor = '#DE5825';
var offColor ='rgba(255,255,255,0.05)';
var bg = '#222322';
var bgMenu = 'rgba(21,21,21,0.75)';
var space = 10;//16;

var isMenu = false;
var isWithCode = false;
var isWithUI = false;
var isWithUIopen = false;
var isCodeInit = false;
var isPause = false;
var isUiInit = false;
var isWithOption = false;

var currentCode = '';
var fileName = '';
var link = '';

var octo, octoArm;

var unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none;';
var inbox = 'box-sizing:border-box; -moz-box-sizing:border-box; -webkit-box-sizing:border-box;';

var mode = 'javascript'; // x-glsl

var saveButton;

editor = {

    init: function ( Callback, withCode, color, Link ) {

        if( Callback ) callback = Callback;

        document.body.style.cssText = 'font-family: "Lucida Console", Monaco, monospace; padding:0; margin:0; font-size: 11px; height:100%; background:#222322; color:#dedede; overflow:hidden;';

        selectColor = color || '#DE5825';

        menuImg = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAKCAYAAABrGwT5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIpJREFUeNpiYKAAMIIITk5OFWyS379/v0NQMwgICQl5YVPw7t27bQQ1g4C0tHQeNkVPnz6dRFAzCCgpKfVgU3jv3r0SgppBQENDYzE28Rs3bsQS1AwCurq6O7GJX7582Z2gZhAwNja+gE387NmzBgQ1g4ClpeVzbOLHjx+XZCQmMdjZ2f3DJg4QYABPYiHCoBQF9AAAAABJRU5ErkJggg==)"

        styles = {

            content : unselectable + 'position:absolute; background:none; pointer-events:none; top:0;  height:100%;',
            codeContent : 'position:absolute; background:none; pointer-events:none; display:block; left:0px; top:45px; width:100%; background:none; height:calc(100% - 45px);',
            separator:  inbox+'position:absolute; background:none; pointer-events:auto; display:block; border-left:1px solid #3f3f3f; border-right:1px solid #3f3f3f; top:0px; width:10px; height:100%; color: rgba(255, 255, 255, 0.2); cursor: e-resize;',
            menuCode :  'position:absolute; top : 0px; left: 0px; width: 100%; font-size: 14px;  font-weight: 500; height: 40px; background: none; border-bottom:1px solid #3f3f3f; line-height: 40px;',

            saveButton: 'position:absolute; width:30px; height:30px; right:5px; top:5px; border-radius:6px; pointer-events:auto; cursor:pointer; ',

            buttonStyle : 'padding:0 0; width:70px; height:30px; font-size: 16px; font-weight: 900; letter-spacing: 1px; text-align: center; pointer-events:auto; cursor:pointer; display: inline-block; margin-left:'+space+'px; border-radius:6px;line-height: 30px; text-shadow: 1px 1px #000000;',//
            menuButton : 'font-size: 13px; pointer-events:auto; cursor: pointer; text-align: left; display: inline-block; width:120px; margin: 3px 3px; padding: 3px 3px; border-radius:6px; text-shadow: 1px 1px #000000;',

        }

       

        isWithCode = withCode || false;

        // big menu

        bigmenu = document.createElement( 'div' );
        bigmenu.style.cssText = inbox + unselectable + 'position: absolute; padding-top:'+space+'px;  border-bottom:none;';
        document.body.appendChild( bigmenu );

        this.makeBigMenu();

        // title

        title = document.createElement( 'div' );
        title.style.cssText = unselectable + 'position:absolute; font-size: 12px;  bottom: '+(space+14)+'px; color:#888988; text-shadow: 1px 1px #000000; text-align:right; right:'+(space)+'px';
        document.body.appendChild( title );

        // subtitle

        subtitle = document.createElement( 'div' );
        subtitle.style.cssText = unselectable + 'font-size: 10px; position:absolute; bottom:'+(space)+'px; color:#787978; text-align:right; right:'+(space)+'px';
        document.body.appendChild( subtitle );

        subtitleS = document.createElement( 'div' );
        subtitleS.style.cssText = unselectable + 'font-size: 10px; position:absolute;  bottom:'+((space)-1)+'px; color:rgba(0,0,0,0.5); text-align:right; right:'+(space-1)+'px';
        document.body.appendChild( subtitleS );

        if( Link !== undefined ) this.setLink( Link );

        if( isWithCode ) this.show();

    },

    icon: function ( type, color, w ){

        w = w || 40;
        var ww = 40;
        color = color || '#DEDEDE';
        var viewBox = '0 0 40 40';

        var t = ["<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='"+w+"px' height='"+w+"px' viewBox='"+viewBox+"'><g>"];
        switch(type){
            case 'save':
            t[1]="<path stroke='"+color+"' stroke-width='4' stroke-linejoin='round' stroke-linecap='round' fill='none' d='M 26.125 17 L 20 22.95 14.05 17 M 20 9.95 L 20 22.95'/><path stroke='"+color+"' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round' fill='none' d='M 32.6 23 L 32.6 25.5 Q 32.6 28.5 29.6 28.5 L 10.6 28.5 Q 7.6 28.5 7.6 25.5 L 7.6 23'/>";
            break;
        }
        t[2] = "</g></svg>";
        return t.join("\n");

    },

    setMode: function ( m ) {

        mode = m;
        if( isCodeInit ) code.setOption('mode', 'text/' + mode);

    },

    addUI: function () {

    	contentRight = document.createElement('div');
        contentRight.style.cssText = styles.content;
        contentRight.style.right = '0';
        
        separatorRight = document.createElement('div');
        separatorRight.style.cssText = styles.separator;
        separatorRight.name = 'right';
        separatorRight.addEventListener('mouseover', editor.mid_over, false );
        separatorRight.addEventListener('mouseout', editor.mid_out, false );
        separatorRight.addEventListener('mousedown', editor.mid_down, false );

        document.body.appendChild( contentRight );
        document.body.appendChild( separatorRight );

        gui.init( contentRight, option );

        isUiInit = true;
        isWithUIopen = true;

    },

    removeUI: function () {

    	if( !isUiInit ) return;

    	gui.dispose();

    	separatorRight.removeEventListener('mouseover', editor.mid_over );
        separatorRight.removeEventListener('mouseout', editor.mid_out );
        separatorRight.removeEventListener('mousedown', editor.mid_down );

        document.body.removeChild( separatorRight );
        document.body.removeChild( contentRight );

        isUiInit = false;
        isWithUIopen = false;

    },

    addCodeEditor: function () {

        contentLeft = document.createElement('div');
        contentLeft.style.cssText = styles.content;
        contentLeft.style.left = '0';
        document.body.appendChild( contentLeft );

        separatorLeft = document.createElement('div');
        separatorLeft.style.cssText =  styles.separator;
        //separatorLeft.style.left = 'calc(50% - 5px)';
        document.body.appendChild( separatorLeft );
        separatorLeft.name = 'left';
        separatorLeft.addEventListener('mouseover', editor.mid_over, false );
        separatorLeft.addEventListener('mouseout', editor.mid_out, false );
        separatorLeft.addEventListener('mousedown', editor.mid_down, false );

        //

        codeContent = document.createElement('div');
        codeContent.style.cssText = styles.codeContent;
        contentLeft.appendChild( codeContent );   

        menuCode = document.createElement('div');
        menuCode.style.cssText = styles.menuCode;
        contentLeft.appendChild( menuCode );

        saveButton = document.createElement('div');
        saveButton.style.cssText = styles.saveButton;
        saveButton.innerHTML = editor.icon('save', selectColor, 30);
        contentLeft.appendChild( saveButton );

        saveButton.addEventListener('mouseover', editor.save_over, false );
        saveButton.addEventListener('mouseout', editor.save_out, false );
        saveButton.addEventListener('click', editor.save, false );

        menuCode.innerHTML = '&nbsp;&bull; ' + fileName + '.js';

        code = CodeMirror( codeContent, {
            value: currentCode,
            mode:'text/' + mode,
            theme:'monokai', 
            lineNumbers: true, matchBrackets: true, indentWithTabs: false, styleActiveLine: true,
            tabSize: 4, indentUnit: 4, highlightSelectionMatches: {showToken: /\w/}
        });

        code.on('change', function () { editor.onChange() } );
        code.on('focus', function () { isFocus = true; view.needFocus(); } );
        code.on('blur', function () { isFocus = false; } );
        code.on('drop', function () { if ( !isSelfDrag ) code.setValue(''); else isSelfDrag = false; } );
        code.on('dragstart', function () { isSelfDrag = true; } );

        isCodeInit = true;

    },

    removeCodeEditor: function (){

        codeContent.removeChild( code.getWrapperElement() );
        code = null;
        
        separatorLeft.removeEventListener('mouseover', editor.mid_over );
        separatorLeft.removeEventListener('mouseout', editor.mid_out );
        separatorLeft.removeEventListener('mousedown', editor.mid_down );

        saveButton.removeEventListener('mouseover', editor.save_over );
        saveButton.removeEventListener('mouseout', editor.save_out );
        saveButton.removeEventListener('click', editor.save );

        contentLeft.removeChild( menuCode );
        contentLeft.removeChild( codeContent );
        contentLeft.removeChild( saveButton );
        document.body.removeChild( separatorLeft );
        document.body.removeChild( contentLeft );

        isCodeInit = false;

    },

    ///// OPTION UI

    uiReset: function () {

        var old = isUiInit ? true : false;

        editor.hideUI();

        if( isWithOption ) isWithUIopen = old;

        editor.Bdesative( bigButton[2] );
        isWithOption = false;
        option = null;
        
    },

    setOption: function ( o ){

    	option = o;
    	isWithOption = true;
        this.Bdefault( bigButton[2] );

        if( isWithUIopen ) this.showUI();

    },

    hideUI: function (){

    	if( isUiInit ) this.removeUI();

        isWithUI = false;
        oldRight = right;
        right = 0;

        this.Bdefault( bigButton[2] );
        this.resize();

    },

    showUI: function (){

    	if( !isWithOption ) return;
    	if( !isUiInit ) this.addUI();

        isWithUI = true;
        if( oldRight ) right = oldRight;
        else right = 310;

        this.Bactive( bigButton[2] );
        this.resize();

    },

    // CODE EDITOR

    hide: function (){

        if( isCodeInit ) this.removeCodeEditor();

        isWithCode = false;
        oldLeft = left;
        left = 0;

        this.Bdefault( bigButton[1] );
        this.resize();

    },

    show: function (){

        if( !isCodeInit ) this.addCodeEditor();

        isWithCode = true;
        if( oldLeft ) left = oldLeft;
        else left = Math.floor(window.innerWidth*0.4);
        this.resize();

    },

    resizeMenu: function ( w ) {

        if( bigmenu ) bigmenu.style.width = w +'px';

    },

    resize: function ( e ) {

        if( e ){

        	if( isLeftDown ){ 
        		left = e.clientX + 10; 
        		left = left < 100 ? 100 : left; 
        	}
        	if( isRightDown ){ 
        		right = window.innerWidth - e.clientX + 10; 
        		right = right < 100 ? 100 : right;
        	}
        	
        }

        if( view ) view.setLeft( left, right );
        
        bigmenu.style.left = left +'px';
        title.style.left = left +'px';
        subtitle.style.left = left +'px';
        subtitleS.style.left = ( left + 1 ) +'px';
        github.style.right = right + 'px';

        if( isUiInit ){

        	separatorRight.style.right = (right-10) + 'px';
	        contentRight.style.width = (right-10) + 'px';
	        gui.resize( right )

        }

        if( isCodeInit ){

	        separatorLeft.style.left = (left-10) + 'px';
	        contentLeft.style.width = (left-10) + 'px';
	        code.refresh();

	    }
        
    },

    tell: function ( str ) { 

        subtitle.textContent  = str;
        subtitleS.textContent  = str;

    },

    // bigmenu

    makeBigMenu: function(){

        bigmenu.style.width = window.innerWidth - left +'px';

        var m = [ 'DEMO', 'CODE', 'UI', 'PAUSE' ];

        var b, name;

        for( var i = 0; i < m.length; i++ ){

        	name = m[i];
        	b = document.createElement( 'div' );
        	b.style.cssText = styles.buttonStyle;
        	b.addEventListener('click', editor[ 'click' + name ], false );
        	b.style.color = selectColor;
        	b.name = name;
        	
        	if( name === 'PAUSE' ){

        		name = '&#10074;&#10074;'
        		b.style.width = '30px';

        	}

        	if( name === 'UI' ){

        		b.style.width = '30px';

        	}

        	b.innerHTML = name;
	        bigmenu.appendChild( b );
	        bigButton.push( b );

        }

        demoContent = document.createElement( 'div' );
        demoContent.style.cssText = 'padding: 10px 40px; width:100%; display: block; background-position: bottom; background-repeat: repeat-x;';
        bigmenu.appendChild( demoContent );

        //editor.Bdesative( bigButton[2] );

        var i = bigButton.length;
        while(i--){
            bigButton[i].addEventListener('mouseover', editor.Bover, false );
            bigButton[i].addEventListener('mouseout', editor.Bout, false );
        }

    },

    clickDEMO: function ( e ) {

        e.preventDefault();

        if( isMenu ) editor.hideBigMenu();
        else editor.showBigMenu();

    },

    clickCODE: function ( e ){

    	e.preventDefault();

        if(isWithCode) editor.hide();
        else editor.show();

    },

    clickPAUSE: function ( e ) {

        e.preventDefault();

        if(!isPause){
            this.innerHTML = '&#9654;';
            isPause = true;
        } else {
            this.innerHTML = '&#10074;&#10074;';
            isPause = false;

        }

        view.pause = isPause;

    },

    clickUI: function ( e ) {

        e.preventDefault();

        if( isWithUI ) editor.hideUI();
        else editor.showUI();

    },

    

    showBigMenu: function () {

        bigmenu.style.background = bgMenu;
        bigmenu.style.borderBottom = "1px solid #3f3f3f";
        demoContent.style.backgroundImage = menuImg;
        isMenu = true;

        var lng = demos.length, name;
        for( var i = 0; i < lng ; i++ ) {
            name = demos[i];
            if( name !== fileName ) editor.addButtonMenu( demos[i], false );
            else editor.addButtonMenu( demos[i], true );
        }
    },

    hideBigMenu: function () {

        bigmenu.style.background = 'none';
        bigmenu.style.borderBottom = 'none';
        demoContent.style.backgroundImage = 'none';
        isMenu = false;

        var i = demoContent.childNodes.length, b;
        while(i--){
            b = demoContent.childNodes[i];
            if( b.name !== fileName ){
                b.removeEventListener('click', editor.demoSelect );
                b.removeEventListener('mouseover', editor.MBover );
                b.removeEventListener('mouseout', editor.MBout );
            }
            demoContent.removeChild( b );
        }

        editor.Bdefault( bigButton[0] );

    },

    addButtonMenu: function ( name, select ) {

        var b = document.createElement('div');
        b.style.cssText = styles.menuButton;
        b.innerHTML = '&bull; ' + name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
        b.name = name;
        if(!select){
            b.addEventListener('click', editor.demoSelect, false );
            b.addEventListener('mouseover', editor.MBover, false );
            b.addEventListener('mouseout', editor.MBout, false );
        } else {
            b.style.color = '#3f3f3f';
            b.style.pointerEvents = 'none'; 
            //b.style.cursor = pointer;
        }
        
        demoContent.appendChild( b );

    },

    demoSelect: function( e ){

        e.preventDefault();
        editor.hideBigMenu();
        editor.load('demos/' + e.target.name + '.js');

    },

    MBover: function( e ){

        e.preventDefault();
        //e.target.style.background = selectColor;
        //e.target.style.color = "#000000"//

        e.target.style.color = selectColor;

    },

    MBout: function( e ){

        e.preventDefault();
        //e.target.style.background = 'none';
        e.target.style.color = "#dedede";
        //e.target.style.textShadow = "1px 1px #000000";
        
    },

    Bover: function( e ){

        e.preventDefault();
        e.target.style.background = selectColor;
        e.target.style.color = "#000000";
        e.target.style.textShadow = "1px 1px "+selectColor;

    },

    Bout: function( e ){

        e.preventDefault();

        var style = 0;
        if(e.target.name === 'CODE' && isWithCode) style = 1;
        if(e.target.name === 'DEMO' && isMenu) style = 1;
        if(e.target.name === 'UI' && isWithUI) style = 1;

        if(!style){
            editor.Bdefault( e.target );
        } else {
            editor.Bactive( e.target );
        }
        
    },



    Bdefault: function( b ){

        b.style.background = 'none';
        b.style.color = selectColor;
        b.style.textShadow = "1px 1px #000000";
        b.style.pointerEvents = 'auto';

    },

    Bactive:function ( b ) {

        b.style.background = "#3f3f3f";
        b.style.color = "#999999";
        b.style.textShadow = "1px 1px #333333";

    },

    Bdesative: function( b ){

        b.style.background = 'none';
        b.style.color = "#3f3f3f";
        b.style.pointerEvents = 'none';

    },

 
    // separator Left / Right

    mid_over: function ( e ) { 

        e.preventDefault();
        this.style.background = selectColor;

    },

    mid_out: function ( e ) { 

        e.preventDefault();
        var name = e.target.name;
        if( name === 'left' && !isLeftDown ) this.style.background = 'none';
        if( name === 'right' && !isRightDown ) this.style.background = 'none';

    },

    mid_down: function ( e ) {

        e.preventDefault();

        var name = e.target.name;

        if( name === 'left' ) isLeftDown = true;
        if( name === 'right' ) isRightDown = true;

        document.addEventListener('mouseup', editor.mid_up, false );
        document.addEventListener('mousemove', editor.resize, false );

    },

    mid_up: function ( e ) {

    	isLeftDown = false;
        isRightDown = false;

        document.removeEventListener('mouseup', editor.mid_up, false );
        document.removeEventListener('mousemove', editor.resize, false );

    },

    // code

    save_over: function ( e ) {

        e.preventDefault();
        saveButton.innerHTML = editor.icon('save', '#000', 30);
        saveButton.style.background = selectColor;

    },

    save_out: function ( e ) {

        e.preventDefault();
        saveButton.innerHTML = editor.icon('save', selectColor, 30);
        saveButton.style.background = 'none';

    },

    save: function ( e ) {

        e.preventDefault();
        var blob = new Blob( [currentCode], {type: "text/plain"} );
        saveAs( blob, fileName + '.js' );
    
    },

    load: function ( url ) {

        fileName = url.substring(url.indexOf("/")+1, url.indexOf("."));

        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain; charset=x-user-defined'); 
        xhr.open('GET', url, true);
        xhr.onload = function(){ 

            //if( isUiInit ) isWithUIopen = true;

            

            editor.uiReset();



             

            if( isCodeInit ){ 
                code.setValue( xhr.responseText );
            } else { 
                currentCode = xhr.responseText;
                editor.inject();
            }

        }
        
        xhr.send();

    },

    unFocus: function () {

        if( isCodeInit ) code.getInputField().blur();
        view.haveFocus();

    },

    getFocus: function () {

        return isFocus;

    },

    validate: function ( value ) {

        return code.operation( function () {
            while ( errorLines.length > 0 ) code.removeLineClass( errorLines.shift(), 'background', 'errorLine' );
            var i = widgets.length;
            while(i--) code.removeLineWidget( widgets[ i ] );
            widgets.length = 0;
            var string = currentCode;
            try {
                var result = esprima.parse( string, { tolerant: true } ).errors;
                i = result.length;
                while(i--){
                    var error = result[ i ];
                    var m = document.createElement( 'div' );
                    m.className = 'esprima-error';
                    m.textContent = error.message.replace(/Line [0-9]+: /, '');
                    var l = error.lineNumber - 1;
                    errorLines.push( l );
                    code.addLineClass( l, 'background', 'errorLine' );
                    var widget = code.addLineWidget( l, m );
                    widgets.push( widget );
                }
            } catch ( error ) {
                var m = document.createElement( 'div' );
                m.className = 'esprima-error';
                m.textContent = error.message.replace(/Line [0-9]+: /, '');
                var l = error.lineNumber - 1;
                errorLines.push( l );
                code.addLineClass( l, 'background', 'errorLine' );
                var widget = code.addLineWidget( l, m );
                widgets.push( widget );
            }
            return errorLines.length === 0;
        });

    },

    onChange: function () {



        var full = true;
        var hash = location.hash.substr( 1 );
        if( hash === fileName ) full = false;

        //callbackReset( full );

        clearTimeout( interval );

        currentCode = code.getValue();
        if( this.validate() ) interval = setTimeout( function() { editor.inject(); }, 0);

    },

    inject: function () {

        location.hash = fileName;

        var oScript = document.createElement("script");
        oScript.language = "javascript";
        oScript.type = "text/javascript";
        oScript.text = currentCode;
        document.getElementsByTagName('BODY').item(0).appendChild(oScript);

        if( isCodeInit ) menuCode.innerHTML = '&nbsp;&bull; ' + fileName + '.js';
        title.innerHTML = fileName.charAt(0).toUpperCase() + fileName.substring(1).toLowerCase();

        callback( fileName );

    },


    //--------------------------
    // GITHUB LINK
    //--------------------------

    setLink: function ( l ) {
        
        link = l;
        this.addGithubLink();

    },

    addGithubLink: function () {

        var bgx = 'rgba(0,0,0,0.3)';

        var icon_Github = [
            "<svg width='60' height='60' viewBox='0 0 250 250' style='fill:"+offColor+"; color:"+bgx+"; position: absolute; top: 0; border: 0; right: 0;'>",
            "<path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' id='octo' onmouseover='editor.Gover();' onmouseout='editor.Gout();' onmousedown='editor.Gdown();' style='cursor:pointer; pointer-events:auto;'></path>",
            "<path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' style='transform-origin: 130px 106px; pointer-events:none;' id='octo-arm'></path>",
            "<path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' id='octo-body' style='pointer-events:none;'></path></svg>",
        ].join("\n");

        // github logo

        github = document.createElement( 'div' );
        github.style.cssText = unselectable + "position:absolute; right:0; top:0; width:1px; height:1px; pointer-events:none;";
        github.innerHTML = icon_Github; 
        document.body.appendChild( github );

        octo = document.getElementById('octo');
        octoArm = document.getElementById('octo-arm');

    },

    Gover: function(){

        octo.setAttribute('fill', selectColor);
        octoArm.style.webkitAnimationName = 'octocat-wave'; 
        octoArm.style.webkitAnimationDuration = '560ms';

    },

    Gout: function(){

        octo.setAttribute('fill', offColor);  
        octoArm.style.webkitAnimationName = 'none';

    },

    Gdown: function(){

        if( link ) window.location.assign('https://github.com/lo-th/' + link );

    },


    // JOYSTICK

    joyMove: function ( t ) {

        //console.log(t)

        user.key[0] = t[0];
        user.key[1] = t[1];

    },

    addJoystick: function(){
        joystick = UIL.add( user, 'axeL', { type:'joystick', target:document.body, pos:{left:'10px', top:'auto', bottom:'10px' },name:'MOVE', w:150, multiplicator:1, precision:2, fontColor:'#308AFF', mode:1 } ).onChange( editor.joyMove ).listen();
        //joystick = UIL.add('joystick', {  target:document.body, pos:{left:'10px', top:'auto', bottom:'10px' }, name:'MOVE', w:150, multiplicator:1, precision:2, fontColor:'#308AFF', mode:1 }).onChange( editor.joyMove );

    },

    removeJoystick: function(){

        joystick.clear()

    },


}

return editor;
})();