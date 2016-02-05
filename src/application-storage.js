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

}(jQuery, this, document));