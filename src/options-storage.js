/****************************************************************************
	options-storage, A mixin to load and save parts of the object's options in localStorage or sessionStorage

	(c) 2015, Niels Holt

	https://github.com/NielsHolt/options-storage
	https://github.com/NielsHolt

****************************************************************************/

;(function (window, document, undefined) {
	"use strict";

	var OptionsStorage = function(){
		return { 
			//optionsStorage_initialize( osOptions )
			optionsStorage_initialize: function optionsStorage_initialize( osOptions ){
				this.optionsStorage = {
					id						: osOptions.id || '',
					name					: osOptions.name || '', 
					propertyNames	: [],
					storageId			:	osOptions.storageId || '',
					inSession			: osOptions.inSession || false,
					afterLoad			: osOptions.afterLoad || null,
					beforeSave		: osOptions.beforeLoad || null,
					context				: osOptions.context || this
				};
				this.osAdd( osOptions.propertyNames );
			},

			//optionsStorage_add( propertyNames )
			optionsStorage_add: function optionsStorage_add( propertyNames ){
				this.optionsStorage.propertyNames = this.optionsStorage.propertyNames || [];
				if (propertyNames){
					this.optionsStorage.propertyNames.push.apply(
						this.optionsStorage.propertyNames, 
						Array.isArray(propertyNames) ? propertyNames : [propertyNames]
					);
				}
			},

			//optionsStorage_remove( propertyName )
			optionsStorage_remove: function optionsStorage_remove( propertyName ){
				var i, length = this.optionsStorage.propertyNames.length;
				for (i=0; i<length; i++ ){
					if (this.optionsStorage.propertyNames[i] == propertyName){
						this.optionsStorage.propertyNames.splice(i,1);									  
						break;
					}
				}
			},

			//_optionsStorage_getStorageId( storageId )
			_optionsStorage_getStorageId: function _optionsStorage_getStorageId( storageId ){
				storageId = storageId || this.optionsStorage.storageId;
				this.optionsStorage.storageId = this.optionsStorage.storageId || storageId; //Save new storageId if it is the first
				return storageId;
			},

			//_optionsStorage_getStore( inSession )
			_optionsStorage_getStore: function _optionsStorage_getStore( inSession ){
				return inSession || this.optionsStorage.inSession ? sessionStorage : localStorage;
			},

			//_optionsStorage_copyOptions( fromOptions, toOptions )
			_optionsStorage_copyOptions: function _optionsStorage_copyOptions( fromOptions, toOptions ){
				var i, propertyName, length = this.optionsStorage.propertyNames.length;
				for (i=0; i<length; i++ ){
					propertyName = this.optionsStorage.propertyNames[i];
					if (fromOptions.hasOwnProperty(propertyName) ){
					  toOptions[propertyName] = fromOptions[propertyName]; 
					}
				}
			},

			//_optionsStorage_apply( method, context )
			_optionsStorage_apply: function _optionsStorage_apply( method, context ){
				if (method){
				  method.apply( context || this.optionsStorage.context ); 
				}
			},

			//optionsStorage_asString()
			optionsStorage_asString: function optionsStorage_asString(){
				var saveOptions = {};
				this._optionsStorage_copyOptions( this.options, saveOptions );
				return JSON.stringify(saveOptions);
			},

			//optionsStorage_load( storageId, inSession, afterLoad, context )
			optionsStorage_load: function optionsStorage_load( storageId, inSession, afterLoad, context ){
				storageId = this._optionsStorage_getStorageId( storageId );
				var store = this._optionsStorage_getStore( inSession ),
						loadedOptions =  JSON.parse( store.getItem(storageId) );
				
				this._optionsStorage_copyOptions( loadedOptions, this.options );
				this._optionsStorage_apply( afterLoad || this.optionsStorage.afterLoad, context );
			},				

			//optionsStorage_save( storageId, inSession )
			optionsStorage_save: function optionsStorage_save( storageId, inSession, beforeSave, context ){
				storageId = this._optionsStorage_getStorageId( storageId );
				if (!storageId){
				  return false;
				}
 				this._optionsStorage_apply( beforeSave || this.optionsStorage.beforeSave, context );
				var store = this._optionsStorage_getStore( inSession );
				var asString = this.optionsStorage_asString();//JSON.stringify(saveOptions);
				store.setItem(storageId,  asString);
				return (store.getItem(storageId) == asString);
			},
			
			//Short-named versions
			osInitialize: function osInitialize(){ this.optionsStorage_initialize.apply( this, arguments ); },
			osAdd: function osAdd(){ this.optionsStorage_add.apply( this, arguments ); },
			osRemove: function osRemove(){ this.optionsStorage_remove.apply( this, arguments ); },
			osAsString: function osLoad(){ this.optionsStorage_asString.apply( this, arguments ); },
			osLoad: function osLoad(){ this.optionsStorage_load.apply( this, arguments ); },
			osSave: function osSave(){ this.optionsStorage_save.apply( this, arguments ); }
		};
	}();
	
  

	// expose access to the constructor
  window.OptionsStorage = OptionsStorage;

}(this, document));
