/****************************************************************************
	options-storage.js, 

	(c) 2016, FCOO

	https://github.com/FCOO/options-storage
	https://github.com/FCOO

****************************************************************************/

;(function ($, window, document, undefined) {
	"use strict";
	
	//Create fcoo-namespace
	window.fcoo = window.fcoo || {};

	//If fcoo.namespace() is defined create a name-space
	var ns = window.fcoo.namespace ? window.fcoo.namespace(''/*Enter the fcoo-namespace here*/) : window.fcoo; 
	//or var ns = window;

	var plugin_count = 1000;

	function OptionsStorage( $elem, options, plugin_count) {
		this.plugin_count = plugin_count;
		this.VERSION = "{VERSION}";
		this.options = $.extend({
			//Default options
		}, options || {} );


		//If OptionsStorage is a extention of class "ParentClass" include the next line 
		//window.ParentClass.call(this, input, options, plugin_count );

	
	}
  
  // expose access to the constructor
  ns.OptionsStorage = OptionsStorage;


	//optionsStorage as jQuery prototype
	$.fn.optionsStorage = function (options) {
		return this.each(function() {
			if (!$.data(this, "optionsStorage"))
				$.data(this, "optionsStorage", new window.OptionsStorage(this, options, plugin_count++));
		});
	};


	//Extend the prototype
	ns.OptionsStorage.prototype = {

		//myMethod
		myMethod: function( /*arg1, arg2*/ ){
		},
		


	};

	//If OptionsStorage is a extention of class "ParentClass" include the next line 
	//window.OptionsStorage.prototype = $.extend( {}, window.ParentClass.prototype, window.OptionsStorage.prototype );


	/******************************************
	Initialize/ready 
	*******************************************/
	$(function() { //"$( function() { ... });" is short for "$(document).ready( function(){...});"

	
	}); //End of initialize/ready
	//******************************************



}(jQuery, this, document));