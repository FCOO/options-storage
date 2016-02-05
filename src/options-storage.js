/****************************************************************************
	options-storage.js,

	(c) 2015, FCOO

	https://github.com/FCOO/options-storage
	https://github.com/FCOO

****************************************************************************/

;(function ($, window, document, undefined) {
	"use strict";

	var ns = window,
			plugin_count = 1;

	function OptionsStorage( object, options ) {
		this.plugin_count = plugin_count;
		this.VERSION = "{VERSION}";

		//Extend with Lockr
		$.extend(this, window.Lockr);

		this.object = object;
		this.options = $.extend({
			//Default options
			id						: '',
			name					: '',
			propertyNames	: [],
			storageId			:	'',
			autoLoad			: false,
			autoSave			: false,
			reloadOnSave	: false,
			needToReload	: function( /*diff*/ ){ return true; },
			beforeLoad		: null,
			afterLoad			: null,
			beforeSave		: null,
			afterSave			: null,
			context				: object
		}, options || {} );


		this.addProperty( options.propertyNames );

		//Calling windowLoad and windowUnload when document is ready
		var THIS = this;
		$(function() {
	    $(window).load( $.proxy( THIS.windowLoad, THIS ) );
	    $(window).unload( $.proxy( THIS.windowUnload, THIS ) );
		});


	}

  // expose access to the constructor
  ns.OptionsStorage = OptionsStorage;

	//The mixin-function
	ns.optionsStorage = function( obj, options ){
		obj.optionsStorage = new OptionsStorage( obj, options, plugin_count++ );

		//Short-named versions
		obj = $.extend( obj, {
			osAddProperty		: function(){ return this.optionsStorage.addProperty.apply		( this.optionsStorage, arguments ); },
			osRemoveProperty: function(){ return this.optionsStorage.removeProperty.apply	( this.optionsStorage, arguments ); },
			osLoad					: function(){ return this.optionsStorage.load.apply						( this.optionsStorage, arguments ); },
			osSave					: function(){ return this.optionsStorage.save.apply						( this.optionsStorage, arguments ); },
			osRemove				: function(){ return this.optionsStorage.remove.apply					( this.optionsStorage, arguments ); }
		});

		return obj;
	};

	//Extend the prototype
	ns.OptionsStorage.prototype = {

		//addProperty( propertyNames ) - adds properties of object.options to be saved
		addProperty: function( propertyNames ){
			this.options.propertyNames = this.options.propertyNames.concat( $.isArray(propertyNames) ? propertyNames : [propertyNames] );
		},

		//removeProperty( propertyName )
		removeProperty: function( propertyName ){
			var i, length = this.propertyNames.length;
			for (i=0; i<length; i++ ){
				if (this.propertyNames[i] == propertyName){
					this.propertyNames.splice(i,1);
					break;
				}
			}
		},

		//_apply( method )
		_apply: function( method ){
			if (method){
			  method.apply( this.options.context );
			}
		},

		//_getStorageId( postfix )
		_getStorageId: function( postfix ){
			return this.options.storageId + (postfix ? '_' + postfix : '');
		},

		//_copyOptions( fromOptions, toOptions )
		_copyOptions: function ( fromOptions, toOptions ){
			if (fromOptions && toOptions){
				var i, propertyName, length = this.options.propertyNames.length;
				for (i=0; i<length; i++ ){
					propertyName = this.options.propertyNames[i];
					if (fromOptions.hasOwnProperty(propertyName) ){
					  toOptions[propertyName] = fromOptions[propertyName];
					}
				}
			}
		},

		//_setObjectOptions - set the options for the object
		_setObjectOptions: function( options ){
			this._copyOptions( options, this.object.options );
			this._apply( this.options.afterLoad );
		},

		//_getObjectOptions - get the options from the object - beforeSave and context are optional
		_getObjectOptions: function(){
			this._apply( this.options.beforeSave );
			var result = {};
			this._copyOptions( this.object.options, result );
			return result;
		},

		//_loadOptions
		_loadOptions: function( postfix ){
			return this.get( this._getStorageId( postfix ) );
		},

		//_saveOptions
		_saveOptions: function( options, postfix ){
			if (!this.options.storageId)
			  return false;

			var storageId = this._getStorageId( postfix );
			this.set( storageId, options );
			return JSON.stringify(options) == JSON.stringify(this.get(storageId));
		},

		//_needToReload( originalOptions, newOptions ) - check if the page needs to reload when changing from originalOptions to newOptions
		_needToReload: function( originalOptions, newOptions ){
			if (this.options.reloadOnSave){
				var diff = window.jsondiffpatch.diff(originalOptions, newOptions);
				if (diff && this.options.needToReload( diff ) )
					return true;
			}
			return false;

		},

		//load
		load: function( postfix ){
			if (!this.options.storageId)
			  return false;

			var options;
			this._apply( this.options.beforeLoad );

			//If a version with postfix = 'FORCE' is saved => use it and remove it
			if (this.exists('FORCE')){
			  options = this._loadOptions( 'FORCE' ); 
				this.remove( 'FORCE' );
			}
			else
				options = this._loadOptions( postfix );
			this._setObjectOptions( options  );
		},

		//save
		save: function( postfix, dontReload ){
			if (!this.options.storageId)
			  return false;

			var options = this._getObjectOptions(),
					originalOptions = this._loadOptions( postfix ),
					needToReload = !dontReload && this._needToReload( originalOptions, options ),
					result = this._saveOptions( options, postfix );
			if (result)
			  this._apply( this.options.afterSave );

			if (result && needToReload)
				window.location.reload(true);

			return result;
		},

		//remove
		remove: function( postfix ){
			this.rm( this._getStorageId( postfix ) );
		},

		//exists
		exists: function( postfix ){
			return this.get( this._getStorageId( postfix ) ) !== undefined;
		},

		//windowLoad
		windowLoad: function(){ 
			if (this.options.autoLoad || this.exists('FORCE'))
				this.load();
		},

		//windowUnload
		windowUnload: function(){
			if (this.options.autoSave)
				this.save();
		}


	};



	/******************************************
	Initialize/ready
	*******************************************/
	$(function() { //"$( function() { ... });" is short for "$(document).ready( function(){...});"


	}); //End of initialize/ready
	//******************************************



}(jQuery, this, document));