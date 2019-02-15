
// ROW map

export var row = ( function () {

	var map = new Map(); //Empty Map

	row = {

		has: function ( name ) {

			return map.has( name );// true or false

		},

		get: function ( name ) {

			return map.get( name );

		},

		set: function ( name, value ) {

			map.set( name, value );

		},

		delete: function ( name ) {

			return map.delete( name );// true or false

		},

		clear: function () {

			map.clear();// clear all

		},

		size: function () {

			return map.size;

		},

	};

	return row;

} )();