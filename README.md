# options-storage

A mixin to load and save parts of the object's options in localStorage or sessionStorage


## Installation
### bower
`bower install https://github.com/NielsHolt/options-storage.git --save`

## Configuration instructions
Use `optionsStorage_initialize( osOptions )` in the constructor of a class to initialize the options-storage methods 

	//Create your own class
	function MyModule( options ) {
		this.options = options;

		this.optionsStorage_initialize( {
			optionNames: ['optionA', 'optionB'], 
			storageId: 'com.myWebsite.settings.someName'
		});

	    this.myMethod = function myMethod() {
    	  console.log('myMethod');
	    };
	  }
 
	// Extend the constructor with the options-storage mixin (using jQuery)
	$.extend( MyModule.prototype, OptionsStorage );

	// expose access to the constructor
	window.MyModule = MyModule;


### osOptions
Option  | Type | Default | Description
:------------- | :-------------: | :------------------ | :----------------------------
`propertyNames` | `string` or `array` | `` | name or array of names of the properties of `this.options` that are to be saved
`storageId` | `string` | `` | The name of the [localStorage/sessionStorage](http://www.w3schools.com/html/html5_webstorage.asp) where the options are saved
`inSession` | `boolean` | `false` | If true the options are saved in a [sessionStorage](http://www.w3schools.com/html/html5_webstorage.asp) instead of a [localStorage](http://www.w3schools.com/html/html5_webstorage.asp) 
`afterLoad` | `function` | `null` | Function to be called after the options are loaded
`beforeSave` | `function` | `null` | Function to be called before the options are saved
`context` | `object` | `this` | Context for the `afterLoad` and `beforeSave` functions
`id` | `string` | `null` | Id of the optionsStorage (NOT USED)
`name` | `string` | `null` | Name of the optionsStorage (NOT USED)

### Methods
The following methods are added to the object-class

    optionsStorage_add( propertyNames )
    optionsStorage_remove( propertyName )
    optionsStorage_asString()
    optionsStorage_load( storageId, inSession, afterLoad, context )
    optionsStorage_save( storageId, inSession, beforeSave, context )

`storageId`, `inSession`, `afterLoad`, `beforeSave`, and `context` are all optional provided that they ware set in `osOptions`
 
There is also a short-named version of this methods

    osAdd( propertyNames )
    osRemove( propertyName )
    osAsString()
    osLoad( storageId, inSession, afterLoad, context )
    osSave( storageId, inSession, beforeSave, context )

| x | Y |    
|---|:--:|
| test | tetsdfjsgfjsjf jsdfj sdghf |
|fdff|dkfsdkf|

| column | column | column|
|:--------|:--------:|---:|
|left|center|right|
|kkshdfksjhfd|sdfsdfsdf|sdfsdfsdfsdfsfsdf|
[TOC]


## Operating instructions
	var myObject = new MyModule( 
		{ optionA:'This is options A', 
		  optionB:'This is option B', 
		  optionC:'This is op...'
		} );
	myObject.optionsStorage.load();	//Will overwrite myObject.options.optionA and myObject.options.optionB 
	...
	myObject.optionsStorage.save();

OR

	myObject.options.optionA = 'a new value';
	myObject.optionsStorage.save('aIndividualeName');	 




## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/NielsHolt/options-storage/LICENSE).

Copyright (c) 2015 [Niels Holt](https://github.com/NielsHolt)

## Contact information

Niels Holt <niels@steenbuchholt.dk>


## Credits and acknowledgements


## Known bugs

## Troubleshooting

## Changelog



