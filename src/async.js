/*!
 * jQuery Validation Plugin 1.12.0pre
 *
 * http://jqueryvalidation.org//
 *
 * Copyright 2013 Jörn Zaefferer
 * Released under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */

(function($) {
    var Validator = $.validator
      , baseForm = Validator.prototype.form
      , baseValid = $.fn.valid
      , keys = Object.keys || function(obj){
            var k = [], i;

            for (i in a) if (a.hasOwnProperty(i)) k.push(i);
            return k   
        };

    $.fn.valid = function(cb) {
		var pending = 0
          , validator;

        if ( typeof cb !== 'function' )
            return baseValid.call(this);
 
		if ( $(this[0]).is("form")) {
			this.validate().form(cb);
		} else {
			valid = true;
			validator = $(this[0].form).validate();

			this.each(function() {
                pending++;

				validator.elementAsync(this, function(err, result){
                    if ( err ) return cb(err);
                    valid = result && valid;
            
                    if (--pending <= 0 ) 
                        cb(null, valid);
                });
			});
		}
	};

    Validator.prototype.form = function(cb){
        var self = this;

        if ( typeof cb !== 'function' )
            return baseForm.call(this);

        self.checkFormAsync(function(){
            $.extend(self.submitted, this.errorMap);
			self.invalid = $.extend({}, this.errorMap);

			if ( !self.valid() ) {
				$(self.currentForm).triggerHandler("invalid-form", [ this ]);
			}
			self.showErrors();
			return self.valid();
        });			
    }

    Validator.prototype.checkFormAsync = function(cb) {
        var self = this
          , pending = 0;

		this.prepareForm();

		for ( var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++ ) {
            pending++;

			this.checkAsync( elements[i], function(err, valid){
                if ( err ) return cb(err);
                if ( --pending <= 0 ) 
                    cb(null, self.valid());
            });
		}
	}

    Validator.prototype.elementAsync =  function( element, cb ) {
		var self = this
          , cleanElement = this.clean( element )
		  , checkElement = this.validationTargetFor( cleanElement );

		this.lastElement = checkElement;

		if ( checkElement === undefined ) {
			delete this.invalid[ cleanElement.name ];
            finish(true);
		} else {
			this.prepareElement( checkElement );
			this.currentElements = $( checkElement );

			this.checkAsync( checkElement, function(err, result){
                result = result !== false;

                if (result) {
				    delete self.invalid[checkElement.name];
			    } else {
				    self.invalid[checkElement.name] = true;
			    }
                finish(result);
            }) 
		}

        function finish(result){
		    $( element ).attr( "aria-invalid", !result );

		    if ( !self.numberOfInvalids() ) {
			    self.toHide = self.toHide.add( self.containers ); // Hide error containers on last error
		    }

		    self.showErrors();
		    cb(null, result);
        }
	};

    Validator.prototype.checkAsync = function( element, cb ) {
		element = this.validationTargetFor( this.clean( element ) );

		var self = this
          , rules = $(element).rules()
	      , rulesCount = size( rules)
		  , dependencyMismatch = false
		  , val = this.elementValue(element)
		  , method;

		Promise
            .map(keys(rules), function(method){
                var result, rule;

                rule = { method: method, parameters: rules[method] };
			    result = $.validator.methods[method].call(self, val, element, rule.parameters );

                if ( result === "pending" ) {
				    self.toHide = self.toHide.not( self.errorsFor(element) );
                    result = self.pending[element.name].promise();
			    }

                return Promise.cast(result)
                    .then(function(valid){
                        if ( valid === "dependency-mismatch" && rulesCount === 1 ) {
					        cb(null);
                            return
                        }

                        if ( !valid ) {
                            self.formatAndAdd( element, rule );
                            cb(null, false);
                        }
                        return valid !== false;
                    });
            })
            .catch(cb)
            .then(function(values){
                var allValid = !$.grep(values, function(v) { return v !== true }).length;

		        if ( allValid ) {
                    if ( size(rules) )
                        self.successList.push(element);
		            
		            cb(null, true);
                }
            });
	}

    Validator.prototype.startRequest = function( element ) {

		if ( !this.pending[element.name] ) {
			this.pendingRequest++;
			this.pending[element.name] = new jQuery.Deferred();
		}
	};

    Validator.prototype.stopRequest = function( element, valid ) {
        var request;

		this.pendingRequest--;

		if ( this.pendingRequest < 0 ) {
			this.pendingRequest = 0;
		}

        this.pending[element.name].resolve(valid);
		delete this.pending[element.name];

		if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
			$(this.currentForm).submit();
			this.formSubmitted = false;
		} else if (!valid && this.pendingRequest === 0 && this.formSubmitted) {
			$(this.currentForm).triggerHandler("invalid-form", [ this ]);
			this.formSubmitted = false;
		}
	};

    //Validator.methods.remote = function( value, element, param ) {
	//	if ( this.optional(element) ) {
	//		return "dependency-mismatch";
	//	}

	//	var previous = this.previousValue(element),
	//		validator, data;

	//	if (!this.settings.messages[element.name] ) {
	//		this.settings.messages[element.name] = {};
	//	}

	//	previous.originalMessage = this.settings.messages[element.name].remote;
	//	this.settings.messages[element.name].remote = previous.message;

	//	param = typeof param === "string" && { url: param } || param;

	//	if ( previous.old === value ) {
	//		return previous.valid;
	//	}

	//	previous.old = value;
	//	validator = this;
			
	//	data = {};
	//	data[element.name] = value;

	//	this.startRequest(element, $.ajax($.extend(true, {
	//		url: param,
	//		mode: "abort",
	//		port: "validate" + element.name,
	//		dataType: "json",
	//		data: data,
	//		context: validator.currentForm,
	//		success: function( response ) {
	//			var valid = response === true || response === "true",
	//				errors, message, submitted;

	//			validator.settings.messages[element.name].remote = previous.originalMessage;
	//			if ( valid ) {
	//				submitted = validator.formSubmitted;
	//				validator.prepareElement(element);
	//				validator.formSubmitted = submitted;
	//				validator.successList.push(element);
	//				delete validator.invalid[element.name];
	//				validator.showErrors();
	//			} else {
	//				errors = {};
	//				message = response || validator.defaultMessage( element, "remote" );
	//				errors[element.name] = previous.message = $.isFunction(message) ? message(value) : message;
	//				validator.invalid[element.name] = true;
	//				validator.showErrors(errors);
	//			}
	//			previous.valid = valid;

	//			validator.stopRequest(element, valid);
	//		}
	//	}, param)));

	//	return "pending";
	//}

    function size(obj){
        var keys = Object.keys || function(obj){
            var k = [], i;

            for (i in a) if (a.hasOwnProperty(i)) k.push(i);
            
            return k   
        }    
    
        return keys(obj).length;
    }

}(jQuery));
