[jQuery Validation Plugin](http://jqueryvalidation.org/) - Form validation made easy
================================

This fork adds better async support to jquery validation, while also removing some of the ancient
compatibility cruft (do we really still need to polyfil event delegation???)

## Changes

Adds a few new Validator instance methods, and adds overloads for the `jQuery.fn` methods.
Makes use of Petka's wonderful [Bluebird](https://github.com/mdevils/node-jscs/blob/master/lib/presets/jquery.json) library internally 
to ensure async behaviour. When using the async methods, remember that they never return syncronously.

### Validator

_Overloads_

- `form(callback)`

_New Methods_ 

- `checkAsync(callback)`
- `checkFormAsync(callback)`
- `elementAsync(callback)`
- `elementAsync(callback)`

### $.fn Overload

use like the original methods, they will function like the sync versions unless 
you pass in a callback ex:

	$('form').valid(function(err, valid){
		console.log(valid) // => true | false
	})


## License
Copyright (c) 2013 Jörn Zaefferer
Licensed under the MIT license.
