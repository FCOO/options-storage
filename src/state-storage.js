/****************************************************************************
	options-storage.js,

	(c) 2016, FCOO

	https://github.com/FCOO/options-storage
	https://github.com/FCOO

****************************************************************************/

;(function ($, window, document, undefined) {
	"use strict";

	var ns = window,
			plugin_count = 1;

	function StateStorage( options ) {
		this.plugin_count = plugin_count++;
		this.VERSION = "{VERSION}";
		this.options = {
			elements			: {},
			list					: [],
		};
		options = $.extend( options, {
			propertyNames	: ['elements'],

			// afterLoad
			// this.options.elements = {id1:class-names-for-id1, id2:class-names-for-id2, .., idN:class-names-for-idN}
			// class-names = string of class-names or 'NOT:'+class-name.
			// Eq. options.elements = {elementId: 'open NOT:selected'} => the element with id = elementId' will get class-name 'open' added and class-name 'selected' removed
			afterLoad: function(){
				$.each( this.options.elements, function( id, classNames ){
					var classList=classNames.split(' '), i=0, length=classList.length, nextClass;
					for (i=0; i<length; i++ ){
						nextClass = classList[i];
						if (nextClass.substring(0,4) == 'NOT:')
							$('#'+id).removeClass( nextClass.substring(4) );
						else
							$('#'+id).addClass( nextClass );
					}
				});
				//Call the afterLoad-functions (if any)
				var THIS = this;
				$.each( this.options.list, function( index, childOptions ){
					THIS.optionsStorage._apply( childOptions.afterLoad, childOptions.context );
				});
			},


			//beforeSave get the state of all the elements found with the list[].search
			beforeSave: function(){
				this.options.elements = {};
				var THIS = this;
				function addToOptionsElements(id, className){
					THIS.options.elements[id] = THIS.options.elements[id] ? THIS.options.elements[id] +' ' + className : className;
				}

				$.each( this.options.list, function( index, childOptions ){
					//Call beforeSave (if any)
					THIS.optionsStorage._apply( childOptions.beforeSave, childOptions.context );

					var classList = childOptions.classNames.split(' ');
					$( childOptions.selector ).each( function () {
						var nextId = $(this).prop('id');
						if (nextId)
							for (var i=0; i<classList.length; i++ ){
								var nextClass = classList[i];
								if ( $(this).hasClass(nextClass) )
									addToOptionsElements( nextId, nextClass );
								else
									if (childOptions.saveNOTClasss)
										addToOptionsElements( nextId, 'NOT:'+nextClass );
							}
					});
				});
			} //end of beforeSave
		}); //options = $.extend(...

		ns.optionsStorage( this, options );
	}

  // expose access to the constructor
  ns.StateStorage = StateStorage;


	//Extend the prototype
	ns.StateStorage.prototype = {
		//addSelector
		addSelector: function( options ){
			options = $.extend({
				//Default options
				saveNOTClasss: true
			}, options || {} );
			this.options.list.push( options );
		},

		load: function(){ this.osLoad(); },
		save: function(){ this.osSave(); },

	};

//	ns.StateStorage.prototype = $.extend( {}, ns.OptionsStorage.prototype, ns.StateStorage.prototype );


	/******************************************
	Initialize/ready
	*******************************************/
	$(function() { //"$( function() { ... });" is short for "$(document).ready( function(){...});"


	}); //End of initialize/ready
	//******************************************



}(jQuery, this, document));