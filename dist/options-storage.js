/****************************************************************************
	application-storage.js,

	(c) 2016, FCOO

	https://github.com/FCOO/options-storage
	https://github.com/FCOO

****************************************************************************/

;(function ($, window, document, undefined) {
	"use strict";

/*
	function generateUUID(){
		var d = new Date().getTime();
			if ( window.performance && typeof window.performance.now === "function" )
				d += window.performance.now(); //use high-precision timer if available

    var mask = 'xxxxxxxxxx',
				uuid = mask.replace(/[x]/g, function() {
					var r = (d + Math.random()*16)%16 || 0;
					d = Math.floor(d/16);
					return r.toString(16);
				});
    return uuid;
	}
*/

	var ns = window;

	ns.APPLICATION_STORAGE_SPECIFIC = 'specific';
	ns.APPLICATION_STORAGE_SETTINGS = 'settings';
	ns.APPLICATION_STORAGE_STATE		= 'state';

	function ApplicationStorage( options ) {

		options = $.extend({
			//Default options
			autoSaveOptions	: {},

			}, options || {} );

		options.propertyNames = ['metadata', 'optionsList'];

		this.optionsStorageList = [];

		ns.OptionsStorage.call(this, this, options );

	}

  // expose access to the constructor
  ns.ApplicationStorage = ApplicationStorage;


	//Extend the prototype
	ns.ApplicationStorage.prototype = {

		//Overwrite osSave
		osSave: ns.OptionsStorage.prototype.save,

		//add
		add: function( object, type ){
			var optionsStorage = object.optionsStorage ? object.optionsStorage : object;
			optionsStorage.type = type || ns.APPLICATION_STORAGE_SPECIFIC;


			if (optionsStorage && optionsStorage.options.id)
			  this.optionsStorageList.push( optionsStorage );
			else
				console.log('No optionsStorage or id');
		},

		//_setOptions( options ) - set the metadata and options in optionsList in the optionsStorage in this.optionsStorageList
		_setOptions: function( options ){
			var originalOptions;

			//First - check if any of the optionsStorage in this.optionsStorageList will need to reload the page when the new options are used
			var needToReload = false;
			$.each( this.optionsStorageList, function( index, optionsStorage ){
				var newOptions = options.optionsList[ optionsStorage.options.id ];
				if (newOptions){
					originalOptions = optionsStorage._getObjectOptions();
					if ( optionsStorage._needToReload( originalOptions, newOptions ) ){
						needToReload = true;
						return false;
					}
				}
			});

			//If reload is nedded => save ALL options as FORCE or in this and reload
			if (needToReload){
				var allOptionsList = this._getOptionsList();
				$.each( this.optionsStorageList, function( index, optionsStorage ){
					var id = optionsStorage.options.id,
							newOptions = options.optionsList[ id ] || allOptionsList[ id ];
					if (newOptions){
						//New options exists => save them as FORCE or copy to saved options
						if (optionsStorage.options.storageId){
							optionsStorage._saveOptions( newOptions, 'FORCE' );
							allOptionsList[id] = null;						}
						else
							allOptionsList[id] = newOptions;
					}
				});
				//Save ALL OptionsStorage as RELOAD and reload
				this.save( 'RELOAD', {_setMetadataIdList: false}, this.options.metadata, allOptionsList );
				window.location.reload(true);
			}

			//ELSE (not needToReload):
			//Set metadata
			this.metadata = options.metadata || {};

			//Set options for the all the optionsStorage in this.optionsStorageList
			$.each( this.optionsStorageList, function( index, optionsStorage ){
				var newOptions = options.optionsList[ optionsStorage.options.id ];
				if (newOptions){
					optionsStorage._setObjectOptions( newOptions );
				}
			});
		},

		//_getOptionsList( saveOptions )  - get options from the optionsStorage in this.optionsStorageList
		_getOptionsList: function( saveOptions ){
			saveOptions = $.extend({
				saveSpecific			: true,
				saveSettings			: true,
				saveState					: true,
				_setMetadataIdList: true
			}, saveOptions || {} );

			var result = {};
			$.each( this.optionsStorageList, function( index, optionsStorage ){
				if (
						( (optionsStorage.type == ns.APPLICATION_STORAGE_SPECIFIC)	&& saveOptions.saveSpecific ) ||
						( (optionsStorage.type == ns.APPLICATION_STORAGE_SETTINGS)	&& saveOptions.saveSettings ) ||
						( (optionsStorage.type == ns.APPLICATION_STORAGE_STATE)			&& saveOptions.saveState )
					){
					optionsStorage._apply( optionsStorage.options.beforeSave, optionsStorage.options.context );
					result[ optionsStorage.options.id ] = optionsStorage._getObjectOptions();
				}
			});
			return result;
		},

		//load
		load: function( id ){
			this._setOptions( this._loadOptions( id ) );
		},

		//save
		save: function( id, saveOptions, metadata, optionsList ){
			id = id+'';
			saveOptions = $.extend({
				saveSpecific			: true,
				saveSettings			: true,
				saveState					: true,
				_setMetadataIdList: true
			}, saveOptions || {} );

			this.options.optionsList = optionsList || this._getOptionsList( saveOptions );

			//Update metadata
			this.options.metadata = metadata || {};
			this.options.metadata.id = this.options.metadata.id || ''+id;
			this.options.metadata.dateISOStr = (new Date()).toISOString();

			if (saveOptions._setMetadataIdList){
				//Update/add list of metadata-id
				var list = this._getMetadataIdList(),
						index = list.indexOf( id );
				if (index == -1){
					list.push( id );
					this._setMetadataIdList( list );
				}
			}

			//Save the options
			return this.osSave( id );
		},

		//remove
		remove: function( id ){
			id = id+'';
			this.rm( this._getStorageId( id ) );

			//Remove the id from the list of metadata-id
			var list = this._getMetadataIdList(),
					index = list.indexOf( id );
			if (index > -1){
			  list.splice(index, 1);
				this._setMetadataIdList( list );
			}
		},

		//loadDefault, saveDefault, removeDefault
		loadDefault		: function()							{	return this.load	('DEFAULT');								},
		saveDefault		: function( saveOptions )	{	return this.save	('DEFAULT', saveOptions);	},
		removeDefault	: function()							{	return this.remove('DEFAULT');								},
		existsDefault	: function()							{	return this.exists('DEFAULT');								},

		//METADATA
		_getMetadataIdList: function(){
			return this.get( this.options.storageId + '_METADATA', [] );
		},

		_setMetadataIdList: function( list ){
			return this.set( this.options.storageId + '_METADATA', list || this.metadataList );
		},


		//loadMetadataList - return an array of metadata-objects
		loadMetadataList: function(){
			var list = this._getMetadataIdList(),
					result = [], i;
			for (i=0; i<list.length; i++ )
				result.push( this._loadOptions( list[i] ).metadata );
			return result;
		},


		//windowLoad
		windowLoad: function(){
			if ( this.exists('RELOAD') ){
				//Special case:
				//RELOAD is used when the page was reloaded.
				//Load options and setOptions for all OptionsStorage that have not loaded FORCE themself or don't have a storageId
				var options = this._loadOptions( 'RELOAD' );
				this.remove( 'RELOAD' );
				//Set options for the all the optionsStorage in this.optionsStorageList
				$.each( this.optionsStorageList, function( index, optionsStorage ){
					//If the optionsStorage has a storageId => load FORCE it it exists ELSE Ok (loaded by optionsStorage self)
					if ( optionsStorage.options.storageId ){
						if ( optionsStorage.exists('FORCE') )
							optionsStorage.load();
					}
					else {
						//Try to load and set options
						var newOptions = options.optionsList[ optionsStorage.options.id ];
						if (newOptions)
							optionsStorage._setObjectOptions( newOptions );
					}
				});
			}
			else
			  if ( this.options.autoLoad && this.existsDefault() )
					this.loadDefault();
		},

		//windowUnload
		windowUnload: function(){
			if (this.options.autoSave)
				this.saveDefault( this.options.autoSaveOptions );
		}

	};

	ns.ApplicationStorage.prototype = $.extend( {}, ns.OptionsStorage.prototype, ns.ApplicationStorage.prototype );


	/******************************************
	Initialize/ready
	*******************************************/
	$(function() {


	}); //End of initialize/ready
	//******************************************

}(jQuery, this, document));;/****************************************************************************
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
		this.VERSION = "1.0.0";

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



}(jQuery, this, document));;/****************************************************************************
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
		this.VERSION = "1.0.0";
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