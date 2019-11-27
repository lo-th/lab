/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    CODEMIRROR ultimate editor
*/

'use strict';

var editor = ( function () {

var mode = 'javascript'; // glsl

var codes = {};
var types = {};


var styles;

var fullSc, miniDebug, miniDebugS, subtitle, subtitleS, title, menuBottom, demoContent, bigmenu, menuImg, bigButton = []; 
var contentLeft, contentRight, codeContent, code, separatorLeft, separatorRight, menuCode, github;

var bottomLogo, logoSvg;

var bottomRight, bottomLeft, extra01, extra02;


var callback = function(){};
var modeCallBack = function(){};
var isSelfDrag = false;
var isFocus = false;
var errorLines = [];
var widgets = [];
var interval = null;

var joystickLeft = null;

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
var isCodeEditorOpen = false;
var isPause = false;
var isUiInit = false;
var isWithOption = false;

var currentCode = '';
var current = '';
var fileName = '';
var link = '';

var golden = 1.618;

var octo, octoArm;

var unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none;';
var inbox = 'box-sizing:border-box; -moz-box-sizing:border-box; -webkit-box-sizing:border-box;';

var saveButton;

editor = {

    isFullScreen: false,
    extraMode:'',

    init: function ( Callback, withCode, color, Link ) {

        if( Callback ) callback = Callback;

        document.body.style.cssText = 'font-family: Consolas,monaco,monospace; padding:0; margin:0; font-size: 13px; height:100%; background:#222322; color:#dedede; overflow:hidden;';

        selectColor = color || '#DE5825';

        menuImg = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAQAAABKxSfDAAAAI0lEQVR42kXCsQ0AIAzAsKgDAwM/8P+R6RjZSHCCJ3iDL/izpHclY0Bn72IAAAAASUVORK5CYII=)";

        //menuImg = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAKCAYAAABrGwT5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIpJREFUeNpiYKAAMIIITk5OFWyS379/v0NQMwgICQl5YVPw7t27bQQ1g4C0tHQeNkVPnz6dRFAzCCgpKfVgU3jv3r0SgppBQENDYzE28Rs3bsQS1AwCurq6O7GJX7582Z2gZhAwNja+gE387NmzBgQ1g4ClpeVzbOLHjx+XZCQmMdjZ2f3DJg4QYABPYiHCoBQF9AAAAABJRU5ErkJggg==)"

        styles = {

            content : unselectable + 'position:absolute; background:none; pointer-events:none; top:0;  height:100%;',
            
            separator:  inbox+'position:absolute; background:none; pointer-events:auto; display:block; border-left:1px solid #3f3f3f; border-right:1px solid #3f3f3f; top:0px; width:10px; height:100%; color: rgba(255, 255, 255, 0.2); cursor: e-resize;',
            
            buttonStyle : 'padding:0 0; width:70px; height:30px; font-size: 16px; font-weight: 900; letter-spacing: 1px; text-align: center; pointer-events:auto; cursor:pointer; display: inline-block; margin-left:'+space+'px; border-radius:6px;line-height: 30px; text-shadow: 1px 1px #000000;',//
            
            menuButton : 'font-size: 13px; pointer-events:auto; cursor: pointer; text-align: left; display: inline-block; width:120px; padding:2px 3px; text-shadow: 1px 1px #000000;',
            menuRubric : 'vertical-align: top; pointer-events:none; font-size: 12px; height: 12px; padding: 2px 0px; margin : 2px 0px; width:calc(100% - 40px); display: block; text-align: left; border-bottom: 1px dashed #626262; color:#626262;',

            codeContent : 'position:absolute; background:none; pointer-events:none; display:block; left:0px; top:45px; width:100%; background:none; height:calc(100% - 45px);',
            menuCode : 'position:absolute; top:0px; left:0px; width:100%; height:40px; background:none; border-bottom:1px solid #3f3f3f; box-sizing:border-box;',
            buttonCode : 'pointer-events:auto; cursor:pointer; border-top-left-radius:6px; border-top-right-radius:6px; height: 35px; font-size: 14px; font-weight: 500; text-align: center; padding:10px 10px; margin-left:5px; margin-top:5px; border:1px solid #3f3f3f; border-bottom:none; display:inline-block; box-sizing:border-box;',
            saveButton: 'position:absolute; width:30px; height:30px; right:5px; top:5px; border-radius:6px; pointer-events:auto; cursor:pointer; ',

        }

       

        isWithCode = withCode || false;

        // big menu

        bigmenu = document.createElement( 'div' );
        bigmenu.style.cssText = inbox + unselectable + 'position: absolute; padding-top:'+space+'px; border-bottom:none; overflow:hidden;';
        document.body.appendChild( bigmenu );

        editor.resizeMenu();
        editor.makeBigMenu();

        // demo list 

        demoContent = document.createElement( 'div' );
        demoContent.style.cssText = 'padding: 10px 20px; width:100%; display: block; background-position: bottom; background-repeat: repeat-x;';
        bigmenu.appendChild( demoContent );


        //

        bottomRight = document.createElement( 'div' );
        bottomRight.style.cssText = unselectable + 'position:absolute; right:0; bottom:0;';
        document.body.appendChild( bottomRight );

        bottomLeft = document.createElement( 'div' );
        bottomLeft.style.cssText = unselectable + 'position:absolute; left:0; bottom:0;';
        document.body.appendChild( bottomLeft );

        // mini debug

        miniDebugS = document.createElement( 'div' );
        miniDebugS.style.cssText = unselectable + 'width:150px; font-size: 10px; position:absolute;  bottom:'+((space)-1)+'px; color:#000000; text-align:left; left:'+((space*2)+1)+'px';
        bottomLeft.appendChild( miniDebugS );


        miniDebug = document.createElement( 'div' );
        miniDebug.style.cssText = unselectable + 'width:150px; font-size: 10px; position:absolute; bottom:'+space+'px; color:'+selectColor+'; text-align:left; left:'+((space*2)+50)+'px';
        bottomLeft.appendChild( miniDebug );

        // title

        title = document.createElement( 'div' );
        title.style.cssText = unselectable + 'position:absolute; font-size: 14px;  bottom: '+(space+14)+'px; color:#888988; text-shadow: 1px 1px #000000; text-align:right; right:'+(space+40)+'px';
        bottomRight.appendChild( title );

        // subtitle

        subtitleS = document.createElement( 'div' );
        subtitleS.style.cssText = unselectable + 'width:150px; font-size: 10px; position:absolute;  bottom:'+((space)-1)+'px; color:#000000; text-align:right; right:'+(space+40-1)+'px';
        bottomRight.appendChild( subtitleS );

        subtitle = document.createElement( 'div' );
        subtitle.style.cssText = unselectable + 'width:150px; font-size: 10px; position:absolute; bottom:'+space+'px; color:#787978; text-align:right; right:'+(space+40)+'px';
        bottomRight.appendChild( subtitle );

        

        fullSc = document.createElement( 'div' );
        fullSc.style.cssText = 'position:absolute; width:30px; height:30px; right:10px; bottom:10px; pointer-events:auto; cursor:pointer; '
        fullSc.innerHTML = editor.icon('scrIn', '#787978', 30, 30);
        bottomRight.appendChild( fullSc );

        fullSc.addEventListener('click', editor.toggleFullScreen, false );
        fullSc.addEventListener('mouseover', function(){ this.innerHTML = editor.icon( !editor.isFullScreen ? 'scrIn' : 'scrOut', selectColor, 30, 30); }, false );
        fullSc.addEventListener('mouseout', function(){ this.innerHTML = editor.icon( !editor.isFullScreen ? 'scrIn' : 'scrOut', '#787978', 30, 30); }, false );

        bottomLogo = document.createElement( 'a' );
        bottomLogo.href = "https://github.com/lo-th";
        bottomLogo.target = "_blank";
        bottomLogo.style.cssText = 'position:absolute; width:60px; height:30px; left:6px; bottom:13px; pointer-events:auto; cursor:pointer;'
        bottomLogo.innerHTML = editor.icon( '3TH', '#787978' );
        bottomLeft.appendChild( bottomLogo );

        logoSvg = document.getElementById( '3TH' );
        //bottomLogo.addEventListener('click',  window.location.assign('https://github.com/lo-th'  );, false );
        bottomLogo.addEventListener('mouseover', function(){ logoSvg.setAttributeNS(null,"fill",selectColor) }, false );
        bottomLogo.addEventListener('mouseout', function(){ logoSvg.setAttributeNS(null,"fill",'#787978') }, false );


        document.addEventListener("fullscreenchange", editor.screenChange, false );
        document.addEventListener("webkitfullscreenchange", editor.screenChange, false );
        document.addEventListener("mozfullscreenchange", editor.screenChange, false );
        document.addEventListener("MSFullscreenChange", editor.screenChange, false );

        document.addEventListener( 'contextmenu', editor.noMenu, false );

        //document.bind( 'contextmenu', editor.noMenu )

        if( Link !== undefined ) this.setLink( Link );

        if( isWithCode ) this.show();

    },

    noMenu: function ( e ) {

        if( e.clientX < left - 10 && e.clientY > 40 ) return;
        e.preventDefault();
    },

    addExtraOption: function ( callback ) {

        modeCallBack = callback;

        extra01 = document.createElement( 'div' );
        extra01.style.cssText = 'position:absolute; width:30px; height:30px; right:10px; bottom:50px; pointer-events:auto; cursor:pointer; '
        extra01.innerHTML = editor.icon('shoot', '#383938', 30, 30);
        bottomRight.appendChild( extra01 );

        extra02 = document.createElement( 'div' );
        extra02.style.cssText = 'position:absolute; width:30px; height:30px; right:10px; bottom:90px; pointer-events:auto; cursor:pointer; '
        extra02.innerHTML = editor.icon('picker', '#383938', 30, 30);
        bottomRight.appendChild( extra02 );

        extra01.addEventListener('click', function(){ editor.toggleExtraMode( 'shoot' ) }, false );
        extra01.addEventListener('mouseover', function(){ this.innerHTML = editor.icon('shoot',   selectColor, 30, 30); }, false );
        extra01.addEventListener('mouseout', function(){ this.innerHTML = editor.icon('shoot',  editor.extraMode === 'shoot' ? '#787978' : '#383938', 30, 30); }, false );

        extra02.addEventListener('click',  function(){ editor.toggleExtraMode( 'picker' ); }, false );
        extra02.addEventListener('mouseover', function(){ this.innerHTML = editor.icon('picker', selectColor, 30, 30); }, false );
        extra02.addEventListener('mouseout', function(){ this.innerHTML = editor.icon('picker',  editor.extraMode === 'picker' ? '#787978' : '#383938', 30, 30); }, false );

    },

    toggleExtraMode: function ( mode ) {

        if( mode !== editor.extraMode ) editor.extraMode = mode;
        else editor.extraMode = '';
        extra01.innerHTML = editor.icon('shoot',  editor.extraMode === 'shoot' ? '#787978' : '#383938', 30, 30);
        extra02.innerHTML = editor.icon('picker',  editor.extraMode === 'picker' ? '#787978' : '#383938', 30, 30);

        modeCallBack( editor.extraMode );

    },

    icon: function ( type, color, w, ww ){

        w = w || 40;
        var h = w;
        ww = ww || 40;
        color = color || '#DEDEDE';
        var viewBox = '0 0 '+ww+' '+ww;
        var extra = '';

        if(type === '3TH'){ 
            viewBox = '0 0 100 50'; 
            w = 60;//60;
            h = 30;//30;
            extra = "<filter id='f1' x='0' y='0' width='200%' height='200%'><feOffset result='offOut' in='SourceAlpha' dx='1' dy='1' /><feGaussianBlur result='blurOut' in='offOut' stdDeviation='1' /><feBlend in='SourceGraphic' in2='blurOut' mode='normal' /></filter>"
        }

        var t = ["<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='"+w+"px' height='"+h+"px' viewBox='"+viewBox+"'>"+extra+"<g>"];
        switch(type){
            case 'save':
            t[1]="<path stroke='"+color+"' stroke-width='4' stroke-linejoin='round' stroke-linecap='round' fill='none' d='M 26.125 17 L 20 22.95 14.05 17 M 20 9.95 L 20 22.95'/>";
            t[1]+="<path stroke='"+color+"' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round' fill='none' d='M 32.6 23 L 32.6 25.5 Q 32.6 28.5 29.6 28.5 L 10.6 28.5 Q 7.6 28.5 7.6 25.5 L 7.6 23'/>";
            break;
            case 'scrIn':
            t[1]="<path fill='rgba(0,0,0,0.5)' stroke='none' d='M 3 20 L 1 20 1 30 11 30 11 28 3 28 3 20 M 11 3 L 11 1 1 1 1 11 3 11 3 3 11 3 M 30 11 L 30 1 20 1 20 3 28 3 28 11 30 11 M 30 20 L 28 20 28 28 20 28 20 30 30 30 30 20 M 24 22 L 24 9 7 9 7 22 24 22 M 22 11 L 22 20 9 20 9 11 22 11 Z'/>";
            t[1]+="<path fill='"+color+"' stroke='none' d='M 23 21 L 23 8 6 8 6 21 23 21 M 21 10 L 21 19 8 19 8 10 21 10 M 2 19 L 0 19 0 29 10 29 10 27 2 27 2 19 M 10 2 L 10 0 0 0 0 10 2 10 2 2 10 2 M 29 19 L 27 19 27 27 19 27 19 29 29 29 29 19 M 27 10 L 29 10 29 0 19 0 19 2 27 2 27 10 Z'/>";
            break;
            case 'scrOut':
            t[1]="<path fill='rgba(0,0,0,0.5)' stroke='none' d='M 30 1 L 1 1 1 30 30 30 30 1 M 3 3 L 28 3 28 28 3 28 3 3 M 9 17 L 7 17 7 22 12 22 12 20 9 20 9 17 M 12 11 L 12 9 7 9 7 14 9 14 9 11 12 11 M 22 14 L 24 14 24 9 19 9 19 11 22 11 22 14 M 24 17 L 22 17 22 20 19 20 19 22 24 22 24 17 Z'/>";
            t[1]+="<path fill='"+color+"' stroke='none' d='M 29 0 L 0 0 0 29 29 29 29 0 M 27 27 L 2 27 2 2 27 2 27 27 M 8 16 L 6 16 6 21 11 21 11 19 8 19 8 16 M 11 10 L 11 8 6 8 6 13 8 13 8 10 11 10 M 21 16 L 21 19 18 19 18 21 23 21 23 16 21 16 M 21 10 L 21 13 23 13 23 8 18 8 18 10 21 10 Z'/>";
            break;

            case 'shoot':
            t[1]="<path fill='rgba(0,0,0,0.5)' stroke='none' d='M 12.1 11.1 Q 11.9 11.55 10.7 11.9 9.5 12.2 10.4 13.15 12.45 14.3 12 14.8 11.55 15 11.15 15.4 10.15 16.4 10.15 17.85 10.15 19.3 11.15 20.3 12.15 21.3 13.6 21.3 L 17.3 21.3 Q 21.1 21.1 21.45 16.25 21.85 14.05 19.7 14.65 17.35 15.5 16.5 14.35 16.6 14.3 16.65 14.2 17.5 13.4 17.5 12.25 17.5 11.05 16.65 10.25 15.85 9.45 14.7 9.45 13.5 9.45 12.7 10.25 12.35 10.6 12.15 11.1 L 12.1 11.1 M 3 18 L 3 24 7 28 13 28 13 26 8 26 5 23 5 18 3 18 M 13 5 L 13 3 7 3 3 7 3 13 5 13 5 8 8 5 13 5 M 28 18 L 26 18 26 23 23 26 18 26 18 28 24 28 28 24 28 18 M 23 5 L 26 8 26 13 28 13 28 7 24 3 18 3 18 5 23 5 M 14.5 25 L 14.5 30 16.5 30 16.5 25 14.5 25 M 1 14.5 L 1 16.5 6 16.5 6 14.5 1 14.5 M 16.5 6 L 16.5 1 14.5 1 14.5 6 16.5 6 M 30 14.5 L 25 14.5 25 16.5 30 16.5 30 14.5 Z'/>";
            t[1]+="<path fill='"+color+"' stroke='none' d='M 11.1 10.05 L 11.1 10.1 Q 10.9 10.57 9.7 10.85 8.5 11.2 9.4 12.15 11.48 13.3 10.95 13.75 10.53 14 10.15 14.4 9.15 15.4 9.15 16.85 9.15 18.3 10.15 19.3 11.15 20.3 12.6 20.3 L 16.3 20.3 Q 20.1 20.1 20.45 15.25 20.8625 13 18.7 13.65 16.36 14.5 15.5 13.35 15.57 13.27 15.65 13.2 16.5 12.4 16.5 11.25 16.5 10.05 15.65 9.25 14.85 8.45 13.7 8.45 12.5 8.45 11.7 9.25 11.33 9.61 11.1 10.05 M 2 17 L 2 23 6 27 12 27 12 25 7 25 4 22 4 17 2 17 M 12 4 L 12 2 6 2 2 6 2 12 4 12 4 7 7 4 12 4 M 27 17 L 25 17 25 22 22 25 17 25 17 27 23 27 27 23 27 17 M 22 4 L 25 7 25 12 27 12 27 6 23 2 17 2 17 4 22 4 M 5 15.5 L 5 13.5 0 13.5 0 15.5 5 15.5 M 15.5 24 L 13.5 24 13.5 29 15.5 29 15.5 24 M 15.5 5 L 15.5 0 13.5 0 13.5 5 15.5 5 M 24 13.5 L 24 15.5 29 15.5 29 13.5 24 13.5 Z'/>";
            break;

            case 'picker':
            t[1]="<path fill='rgba(0,0,0,0.5)' stroke='none' d='M 7.15 14.25 L 5.75 12.85 2.95 15.65 4.35 17.05 7.15 14.25 M 5 9 L 1 9 1 11 5 11 5 9 M 4.35 2.95 L 2.95 4.35 5.75 7.15 7.15 5.75 4.35 2.95 M 14.25 7.15 L 17.05 4.35 15.65 2.95 12.85 5.75 14.25 7.15 M 11 5 L 11 1 9 1 9 5 11 5 M 22.9 19.9 L 28 17 10 10 17 28 19.9 22.9 26 29 29 26 22.9 19.9 M 19 20 L 17 24 13 13 24 17 20 19 27 26 26 27 19 20 Z'/>";
            t[1]+="<path fill='"+color+"' stroke='none' d='M 3.35 16.05 L 6.15 13.25 4.75 11.85 1.95 14.65 3.35 16.05 M 4 10 L 4 8 0 8 0 10 4 10 M 3.35 1.95 L 1.95 3.35 4.75 6.15 6.15 4.75 3.35 1.95 M 8 4 L 10 4 10 0 8 0 8 4 M 16.05 3.35 L 14.65 1.95 11.85 4.75 13.25 6.15 16.05 3.35 M 21.9 18.9 L 27 16 9 9 16 27 18.9 21.9 25 28 28 25 21.9 18.9 M 18 19 L 16 23 12 12 23 16 19 18 26 25 25 26 18 19 Z'/>";
            break;

            case '3TH':
            t[1]="<path id='3TH' filter='url(#f1)' fill='"+color+"' stroke='none' stroke-width='0' d='M 83.7 48.3 L 94 48.3 94 32.95 Q 94 26.65 89.5 22.1 85.05 17.7 78.65 17.7 L 78.55 17.7 Q 78.35 17.7 78.15 17.7 L 73.6 17.7 73.6 8 63.4 8 63.4 17.7 49.7 17.7 49.7 8 39.5 8 39.5 17.7 34.05 17.7";
            t[1]+="Q 34.35 16.35 34.35 14.8 L 34.35 14.7 Q 34.35 12.45 33.65 10.45 32.7 7.7 30.55 5.55 30.15 5.1 29.6 4.7 26.1 1.7 21.25 1.7 18.3 1.7 15.8 2.85 13.75 3.75 12 5.55 8.3 9.35 8.2 14.6 8.2 14.7 8.2 14.8 L 18.4 14.8 18.4 14.7";
            t[1]+="Q 18.4 13.55 19.2 12.75 20.05 11.9 21.15 11.9 L 21.35 11.9 Q 22.5 11.9 23.35 12.75 24.05 13.55 24.15 14.7 L 24.15 14.8 Q 24.15 15.95 23.35 16.85 22.5 17.6 21.35 17.7";
            t[1]+="L 18.4 17.7 18.4 27.9 21.6 27.9 Q 23.45 28 24.9 29.35 25.5 30.05 25.9 30.85 26.3 31.8 26.3 32.95 26.3 35.1 24.9 36.55 23.45 38 21.35 38.1 L 21.25 38.1 Q 19.1 38.1 17.65 36.55 16.1 35.1 16.1 32.95 16.1 32.85 16.1 32.75 L 6 32.75";
            t[1]+="Q 6 32.85 6 32.95 6 39.3 10.45 43.75 12.8 46.15 15.8 47.25 18.3 48.3 21.25 48.3 L 21.35 48.3 Q 26 48.2 29.6 45.8 30.95 44.9 32.1 43.75 36.5 39.3 36.5 32.95 36.5 31.9 36.4 30.85 36.2 29.35 35.8 27.9 L 39.5 27.9 39.5 32.75 Q 39.5 32.85 39.5 32.95 39.5 39.3 44.05 43.75 48.45 48.3 54.85 48.3 L 60.45 48.3 60.45 38.1 54.75 38.1";
            t[1]+="Q 52.7 38.1 51.15 36.55 49.7 35.1 49.7 32.95 L 49.7 27.9 54.75 27.9 Q 54.85 27.9 54.95 27.9 L 63.4 27.9 63.4 48.3 73.6 48.3 73.6 32.95 Q 73.6 30.85 75.05 29.35 76.3 28.2 77.85 27.9 78.15 27.9 78.55 27.9 L 78.65 27.9 Q 80.85 27.9 82.25 29.35 83.7 30.85 83.7 32.95 L 83.7 48.3 Z'/>"
            break;

        }
        t[2] = "</g></svg>";
        return t.join("\n");

    },

    

    addUI: function () {

    	contentRight = document.createElement('div');
        contentRight.style.cssText = styles.content;
        contentRight.style.right = '0';

        //contentRight.addEventListener( 'contextmenu', editor.noMenu, false );

        //contentRight.oncontextmenu = null;//function(e){ e.preventDefault(); };
        
        separatorRight = document.createElement('div');
        separatorRight.style.cssText = styles.separator;
        separatorRight.name = 'right';
        separatorRight.addEventListener('mouseover', editor.mid_over, false );
        separatorRight.addEventListener('mouseout', editor.mid_out, false );
        separatorRight.addEventListener('mousedown', editor.mid_down, false );

        //separatorRight.addEventListener( 'contextmenu', editor.noMenu, false );

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

        //menuCode.innerHTML = '&nbsp;&bull; ' + fileName + '.js';

        editor.addCode( fileName, true );//

        code = CodeMirror( codeContent, {
            value: currentCode,
            mode:'text/' + mode,
            theme:'monokai', 
            lineNumbers: true, matchBrackets: true, indentWithTabs: false, styleActiveLine: false,
            tabSize: 4, indentUnit: 4/*, highlightSelectionMatches: {showToken: /\w/}*/
        });

        code.on('change', function () { editor.onChange() } );
        code.on('focus', function () { isFocus = true; if( view ) view.needFocus(); } );
        code.on('blur', function () { isFocus = false; } );
        code.on('drop', function () { if ( !isSelfDrag ) code.setValue(''); else isSelfDrag = false; } );
        code.on('dragstart', function () { isSelfDrag = true; } );

        //codeContent.addEventListener( 'contextmenu', editor.displayMenu, false );

        //document.oncontextmenu = function(e){ e.preventDefault(); };
        //code.oncontextmenu = function(e){ };

        isCodeEditorOpen = true;

    },

    setMode: function ( m ) {

        // javascript or glsl
        mode = m;
        if( isCodeEditorOpen ) code.setOption('mode', mode === 'glsl' ? 'text/x-' + mode : 'text/' + mode );

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

        isCodeEditorOpen = false;

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

        if( isCodeEditorOpen ) this.removeCodeEditor();

        isWithCode = false;
        oldLeft = left;
        left = 0;

        this.Bdefault( bigButton[1] );
        this.resize();

    },

    show: function (){

        if( !isCodeEditorOpen ) this.addCodeEditor();

        isWithCode = true;
        if( oldLeft ) left = oldLeft;
        else left = Math.floor( window.innerWidth - (window.innerWidth/golden) );
        this.resize();

        code.refresh();
        

    },

    resizeMenu: function ( w ) {

        //bigmenu.style.width = w +'px';
        bigmenu.style.width = ( w || window.innerWidth-left-right ) +'px';

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

        if(joystickLeft!==null){ joystickLeft.s[0].left = (left+70) +'px'; joystickLeft.needZone() }

        bottomLeft.style.left = left +'px';
        bottomRight.style.right = right +'px';
        
        bigmenu.style.left = left +'px';

        github.style.right = right + 'px';

        if( isUiInit ){

        	separatorRight.style.right = (right-10) + 'px';
	        contentRight.style.width = (right-10) + 'px';
	        gui.resize( right );

        }

        if( isCodeEditorOpen ){

	        separatorLeft.style.left = (left-10) + 'px';
	        contentLeft.style.width = (left-10) + 'px';
	       // code.refresh();

	    }
        
    },

    log: function ( str ) { 

        miniDebug.textContent  = str;
        miniDebugS.textContent  = str;

    },

    tell: function ( str ) { 

        subtitle.textContent  = str;
        subtitleS.textContent  = str;

    },

    //-------------------------------------
    //
    //   MAIN MENU
    //
    //-------------------------------------

    makeBigMenu: function(){

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

        if( view ) view.pause = isPause;

    },

    clickUI: function ( e ) {

        e.preventDefault();

        if( isWithUI ) editor.hideUI();
        else editor.showUI();

    },

    //-------------------------------------
    //
    //   MENU DEMO
    //
    //-------------------------------------

    showBigMenu: function () {

        var i, lng;

        var checkType = Array.isArray( demos );

        bigmenu.style.background = bgMenu;
        //bigmenu.style.borderBottom = "1px solid rgb(255,255,255,0.25);"//#3f3f3f";
        demoContent.style.backgroundImage = menuImg;
        isMenu = true;

        if( checkType ){ // simple array menu


            demos.sort();

            lng = demos.length;
            for( i = 0; i < lng; i++ ) editor.addButtonMenu( demos[i], demos[i] === fileName );

            
        } else { // object menu

            for( var m in demos ){

                editor.addRubric( m );
                
                demos[m].sort();

                lng = demos[m].length;
                for( i = 0; i < lng; i++ ) editor.addButtonMenu( demos[m][i], demos[m][i] === fileName );

            }

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
            if( b.isButton ){
                b.removeEventListener('click', editor.demoSelect );
                b.removeEventListener('mouseover', editor.MBover );
                b.removeEventListener('mouseout', editor.MBout );
            }
            demoContent.removeChild( b );
        }

        editor.Bdefault( bigButton[0] );

    },

    addRubric : function ( name ) {

        var r = document.createElement('div');
        r.style.cssText = styles.menuRubric;
        r.innerHTML = name;
        demoContent.appendChild( r );

    },

    addButtonMenu: function ( name, select ) {

        var b = document.createElement('div');
        b.style.cssText = styles.menuButton;
        b.innerHTML = '&bull; ' + name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
        b.name = name;
        if(!select){
            b.isButton = true;
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

    //-------------------------------------
    //
    //   MENU CODE
    //
    //-------------------------------------

    clearMenuCode : function () {

        var i = menuCode.childNodes.length, b;
        while(i--){
            b = menuCode.childNodes[i];
            b.removeEventListener('mousedown', editor.codeDown );
            menuCode.removeChild( b );
        }

    },

    selectMenuCode : function () {

        var i = menuCode.childNodes.length, b;
        while(i--){
            b = menuCode.childNodes[i];
            if( b.name === current ) b.style.borderBottom = '1px solid #222322';
            else b.style.borderBottom = 'none';
        }

    },

    addCode : function ( name, m ) {

        var b = document.createElement('div');
        b.style.cssText = styles.buttonCode;
        b.name = name;
        b.innerHTML = name;
        b.addEventListener('mousedown', editor.codeDown );
        if( m ) b.style.borderBottom = '1px solid #222322';
        menuCode.appendChild( b );

    },

    codeDown : function ( e ) {

        var name = e.target.name;

        if( name === current ) return;

        current = name;

        editor.selectMenuCode();
        code.setValue( codes[name] );

    },

    //-------------------------------------
    //
    //   CODE
    //
    //-------------------------------------

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

    clearTmpCode : function ( name ){

        codes = {};
        types = {};

    }, 

    getChannelNumber : function ( name ){

        var n = 0;
        var t = name.substring( name.length - 1 );
        if(t === 'A') n = 1;
        if(t === 'B') n = 2;
        if(t === 'C') n = 3;
        if(t === 'D') n = 4;
        if(t === 'V') n = 5;
        if(t === 'E') n = 6;
        return n;

    },


    load: function ( url ) {

        var name = url.substring( url.lastIndexOf("/")+1, url.lastIndexOf(".") );
        var type = url.substring( url.lastIndexOf(".")+1 );

        var n = editor.getChannelNumber( name );
        var isMain = n === 0 ? true : false;

        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain; charset=x-user-defined'); 
        xhr.open( 'GET', url, true );

        xhr.onload = function(){ 

            codes[ name ] = xhr.responseText;
            types[ name ] = type === 'js' ? 'javascript' : 'glsl';
            

            //if( isUiInit ) isWithUIopen = true;
            editor.uiReset();

            if( isCodeEditorOpen ){ 

                editor.clearMenuCode();
                editor.addCode( name, true );

                fileName = name;
                code.setValue( codes[ name ] );
                
            } else { 
                
                fileName = name;
                currentCode = codes[ name ];
                editor.inject();

            }

        }
        
        xhr.send();

    },

    unFocus: function () {

        if( isCodeEditorOpen ) code.getInputField().blur();
        if( view ) view.haveFocus();

    },

    getFocus: function () {

        return isFocus;

    }, 

    onChange: function () {

        clearTimeout( interval );

        currentCode = code.getValue();
        if( this.validate() ) interval = setTimeout( function() { editor.inject(); }, 300 );

    },

    inject: function ( n ) {

    	n = n || 0;

    	if( n===0 ){

    		var full = true;
	        var hash = location.hash.substr( 1 );
	        if( hash === fileName ) full = false;

	        location.hash = fileName;
	        title.innerHTML = fileName.charAt(0).toUpperCase() + fileName.substring(1).toLowerCase();

    	}

    	// insert script

        var oScript = document.createElement("script");
        oScript.language = "javascript";
        oScript.type = "text/javascript";
        oScript.text = currentCode;
        document.getElementsByTagName('BODY').item( n ).appendChild( oScript );
        

        if( n===0 ) callback( fileName, full );

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


    //-------------------------------------
    //
    //   GITHUB LINK
    //
    //-------------------------------------

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


    //-------------------------------------
    //
    //   JOYSTICK
    //
    //-------------------------------------

    joyMove: function ( t ) {

        user.key[0] = t[0];
        user.key[1] = t[1];

    },

    addJoystick: function( o ){

        o = o || {}
        user.setSameAxis( o.sameAxis !== undefined ? o.sameAxis : false );

        //console.log(o)

        joystickLeft = UIL.add( user, 'axeL', { type:'joystick', target:document.body, pos:{left:(left+70)+'px', top:'auto', bottom:'10px' },name:'MOVE', w:150, multiplicator:1, precision:2, fontColor:'#308AFF', mode:1 } ).onChange( editor.joyMove ).listen();
        //joystickLeft = UIL.add('joystickLeft', {  target:document.body, pos:{left:'10px', top:'auto', bottom:'10px' }, name:'MOVE', w:150, multiplicator:1, precision:2, fontColor:'#308AFF', mode:1 }).onChange( editor.joyMove );

    },

    removeJoystick: function(){

        joystickLeft.clear()
        joystickLeft = null;

    },


    //-------------------------------------
    //
    //   FULL SCREEN
    //
    //-------------------------------------

    screenChange: function () {

        editor.isFullScreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement ? true : false;
        fullSc.innerHTML = editor.icon( !editor.isFullScreen ? 'scrIn' : 'scrOut', '#787978', 30, 30);

    },

    toggleFullScreen: function () {

        if(!editor.isFullScreen){

            if ( "fullscreenEnabled" in document || "webkitFullscreenEnabled" in document || "mozFullScreenEnabled" in document || "msFullscreenEnabled" in document ){
                if(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled){

                    var element = document.body;
                    if("requestFullscreen" in element) element.requestFullscreen();
                    else if ("webkitRequestFullscreen" in element) element.webkitRequestFullscreen();
                    else if ("mozRequestFullScreen" in element) element.mozRequestFullScreen();
                    else if ("msRequestFullscreen" in element) element.msRequestFullscreen();
                        
                }
            }

        } else {
            if ("exitFullscreen" in document) document.exitFullscreen();
            else if ("webkitExitFullscreen" in document) document.webkitExitFullscreen();
            else if ("mozCancelFullScreen" in document) document.mozCancelFullScreen();
            else if ("msExitFullscreen" in document) document.msExitFullscreen();
        }
      
    },


}

return editor;

})();