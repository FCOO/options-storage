# options-storage
>


## Description
This package contains tree different object-classes

1. **`OptionsStorage`** - A mixin to load and save parts of the a object's `options` in localStorage
2. **`StateStorage`** - descending from `OptionsStorage` but it load and save the 'state' of DOM elements eq. if a sub-menu is open or closed
3. **`ApplicationStorage`** - a collections of `OptionsStorage` and `StateStorage` that can be loaded and saved together 


## Installation
### bower
`bower install https://github.com/FCOO/options-storage.git --save`

## Demo
http://FCOO.github.io/options-storage/demo/ 

## OptionsStorage

### Usage
To use options-storage to save and load the `options` of a object you need to extend your object or object-class with `OptionsStorage` by calling `window.optionsStorage( object, options )` on the object or constructor
		
	//Extend an existing object
	window.optionsStorage( myObject, options ); //Creating myObject.optionsStorage

	//Extend the constructor (using jQuery or other 'extend'-function)
	MyClass = function(){ ... }
	  ...
	  window.optionsStorage( this, options )
	}

This will add a `optionsStorage`-object to `object`

### options
Option  | Type | Default | Description
:------------- | :-------------: | :------------------ | :----------------------------
`propertyNames` | `string` or `array` | `` | name or array of names of the properties of `object.options` that are to be saved
`storageId` | `string` | `` | Mandatory: The name of the [localStorage](http://www.w3schools.com/html/html5_webstorage.asp) where the options are saved
`autoLoad` | `boolean` | `false` | if true the last saved options are automatic loaded when the page is loaded 
`autoSave` | `boolean` | `false` | if true the options are automatic saved before the page is unloaded 
`afterLoad` | `function` | `null` | Function to be called after the options are loaded. Will typical update elements etc. according to the loaded values of the `options` properties
`beforeSave` | `function` | `null` | Function to be called before the options are saved. Will typical get the properties of the `options` before they are saved
`context` | `object` | `object` | Context for the `afterLoad` and `beforeSave` functions
`id` | `string` | `null` | Id of the `optionsStorage`. Only needed if the `optionsStorage` is part of a `ApplicationStorage`

### Methods
The `optionsStorage`-object has the following methods

    addProperty( propertyNames ) //Add one or more properties from object.options to be saved and loaded 
    removeProperty( propertyName ) //Removes one or more properties from the list of properties object.options 
    load( storageId ) //Load the saved options and restore them in object.options
    save( storageId ) //Save the properties of object.options
    remove( storageId ) //Remove the saved properties of object.options

`storageId`are optional to be used instead of the default id `options.storageId`

### Short-hand 
There will also be added short-named versions of the methods directly to the `object`

    .osAddProperty(...) //same as .optionsStorage.addProperty(...)
    osRemoveProperty(...)
    osLoad(...)
    osSave(...)
    osRemove(...)

### Example
	var myObject = new AConstructor( { 
		  optionA:'This is option A', 
		  optionB:'This is option B', 
		  optionC:'This is option C - Will not be saved'
		} );
	window.optionsStorage(myObject, {
	  propertyNames: ['optionA', 'optionB'],
	  storageId: 'com.mywebpage.settings'
	});	
	...
	myObject.optionsStorage.save();

or

	myObject.options.optionA = 'a new value';
	myObject.optionsStorage.save('aIndividualeName');	 


## StateStorage

The `StateStorage` is a descending of `OptionsStorage` used to save the *state* of DOM-elements but is don't have a object assigned

The DOM-elements must have a unique `id` and the state is defined by the present or absent of specified class-name(s) 

### Usage

There are no property-names or common `afterLoad` or `beforeSave` functions. Instead the `.addSelector`-functions is used to add combinations of
  
- 	selection
- 	class-name(s)
- 	beforeSave-function (optional)
- 	afterLoad-function (optional)
- 	context (optional)

### options
Option  | Type | Default | Description
:------------- | :-------------: | :------------------ | :----------------------------
`storageId` | `string` | `` | The name of the [localStorage](http://www.w3schools.com/html/html5_webstorage.asp) where the options are saved
`id` | `string` | `null` | Id of the `stateStorage`. Only needed if the `stateStorage` is part of a `ApplicationStorage`
`name` | `string` | `null` | Name of the `stateStorage`. Only needed if the `stateStorage` is part of a `ApplicationStorage`


### Methods
The `stateStorage`-object has the following methods

#### `addSelector( options )`

Option  | Type | Default | Description
:------------- | :-------------: | :------------------ | :----------------------------
`selector` | `string` | `` | The css selector to get the DOM-elements to save state for
`classNames` | `string` | `` | class-name or class-names separated by space. 
`saveNOTClass` | `boolean` | `true` | if true the elements without the class-names are also saved. 
`afterLoad` | `function` | `null` | Function to be called after the state has been loaded and applied to the elements
`beforeSave` | `function` | `null` | Function to be called before the state is saved.
`context` | `object` | `object` | Context for the `afterLoad` and `beforeSave` functions


#### `load(), save()` 
Are the same as for `optionsStorage` 

### Example

	//HTML
	<ul>
		<li id="firstMenu" class="menu">A menu
			<ul>...</ul>
		</li>
		<li id="secondMenu" class="menu isOpen">Another menu
			<ul>...</ul>
		</li>
	...
	</ul>

	//Javascript
	myStateStorage = new StateStorage({ storageId: 'com.mywebpage.menu' });
	myStateStorage.addSelector( { 
		selector: 'li.menu',
		classNames: 'isOpen'
	}); 

	myStateStorage.save(); //Save the state of 'firstMenu' and 'secondMenu'
	myStateStorage.load(); //Load the state of 'firstMenu' and 'secondMenu'


## ApplicationStorage

`ApplicationStorage` is used to load and save a collection of `OptionsStorage` or `StateStorage`
Each saved collection will get a unique id and a optional set of options (name, description, date and user specified)
Each `OptionsStorage` or `StateStorage` is added using `.add( object, type)` where they are marked as `type` = `specific`, `settings`, or `state`:
- `specific` (default) is specific for the current application (`'specific'` or `APPLICATION_STORAGE_SPECIFIC`)
- `settings` is used for general options (e.q. language, date-format etc.) that can be used in other applications (`'settings'` or `APPLICATION_STORAGE_SETTINGS`)
- `state` is used for the current state of e.q. menus (open/closed), "show on screen"-options (`'state'` or `APPLICATION_STORAGE_STATE`)


### Usage

    myApplicationStorage = new ApplicationStorage( options );
	myApplicationStorage.add( myOptionsStorage );
	myApplicationStorage.add( myStateStorage );
	...
	myApplicationStorage.saveAs( 2, {
		name:'This is the name', 
		description:'This is the description'
	});

### options
Option  | Type | Default | Description
:------------- | :-------------: | :------------------ | :----------------------------
`storageId` | `string` | `` | The name of the [localStorage](http://www.w3schools.com/html/html5_webstorage.asp) where the options are saved
`autoLoad` | `boolean` | `false` | if true the default-options are automatic loaded when the page is loaded 
`autoSave` | `boolean` | `false` | if true the options are automatic saved as default before the page is unloaded 


### Methods

#### `add( object, type )`
Adds an OptionsStorage-object or an object with `.optionsStorage` to the list
type = `APPLICATION_STORAGE_SPECIFIC`, `APPLICATION_STORAGE_SETTINGS`, or `APPLICATION_STORAGE_STATE`

#### `save( id, options, metadata )`
Save the application options under `id`
##### options
`saveSpecific` (default `true`): Save optionsStorages added with `type ==  APPLICATION_STORAGE_SPECIFIC`
`saveSettings` (default `true`): Save optionsStorages added with `type ==  APPLICATION_STORAGE_SETTINGS`
`saveState` (default `true`): Save optionsStorages added with `type ==  APPLICATION_STORAGE_STATE`


#### `load( id )`
Load the options saved under `id`

#### `remove( id )`
Remove the saved options saved under `id`


#### `saveDefault( options )`
Save the current options as the default options. Will automatic load if `ApplicationStorage.options.autoLoad == true`

#### `loadDefault()`
Load the options saved by `saveDefault(..)`

#### `removeDefault()`
Remove the saved options saved by `saveDefault(..)`

### Metadata
When a `ApplicationStorage` is saved a optional `metadata` can be added witch is a JSON-object with optional metadata, eq. `metadata = {name: "The name", description:"This is ...", owner:"Niels Holt"}`

Two properties are added automatic:
`metadata.id`
`metadata.dateISOStr` = date and time of saving as ISO-string

When a `ApplicationStorage` is loaded the current metadata is loaded into `this.metadata`

#### `loadMetadataList()`
Return an array of metadata-objects. Can be used for UI with selection of saved options


## Copyright and License
This plug-in is licensed under the [MIT license](https://github.com/FCOO/options-storage/LICENSE).

Copyright (c) 2015 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk


## Credits and acknowledgements


## Known bugs

## Troubleshooting

## Changelog



