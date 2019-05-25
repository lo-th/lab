/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    UI editor
*/

'use strict';

var gui = ( function () {

	var ui = null;

gui = {

    init: function ( parent, option ) {

        ui = new UIL.Gui({ parent:parent, css:'left:0px; right: auto; ', size:240, color:'no', h:22, close:false });

        if(option.withFps){ 
            var fps = ui.add('fps', { height:30 });
            fps.show();
        }

        this.add( option );
        
    },

    add: function ( o ){

        var params = o.base;
        var f = o.function;

        for( var u in params ) {

            //{ min:-1, max:1, stype:0, precision:1, stype :2 }

            if(o[u]) ui.add( params, u, o[u] ).onChange( f );

        }

    },

    dispose: function () {

        ui.dispose();

    },

    resize : function ( r ) {

        ui.setWidth( r-10 );

    },



}

return gui;




})();