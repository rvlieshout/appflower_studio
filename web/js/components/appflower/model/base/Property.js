Ext.ns('afStudio.model');

/**
 * @class afStuio.model.Property
 * <p>This class encapsulates the property definition information specified in the {@link afStuio.model.Node#properties}.</p>
 * <p>Developers do not need to instantiate this class. Instances are created by {@link afStuio.model.Node#initProperties}</p>
 * @author Nikolai Babinski
 */
afStudio.model.Property = Ext.extend(Object, {

    /**
     * @cfg {String} name
     * The name by which the property is referenced within the Model Node.
     */
    /**
     * @cfg {Mixed} value
     * The property value.
     */
    /**
     * @cfg {Mixed} type
     * (Optional) The data type. Look at {@link afStudio.model.Types} class.</p>
     */
	/**
	 * @cfg {Boolean} required (defaults to false)
	 */
	required: false,
	
    /**
     * @cfg {Mixed} defaultValue
     * (Optional) The default value (defaults to "").
     */
    defaultValue: "",
    
    constructor : function(config) {
        Ext.apply(this, config);

        var types = afStudio.model.Types;

        if (this.type) {
            if (Ext.isString(this.type)) {
                this.type = types[this.type.toUpperCase()] || types.AUTO;
            }
        } else {
            this.type = types.AUTO;
        }
    },
    
    /**
     * Validates passed in value against property's type.
     * @param {Mixed} v The value to be validated.
     * @return {Boolean}
     */
    validate : function(v) {
    	return this.type.validate(v);
    },
    
    /**
     * Validates property value.
     * @return {Boolean} true if valid otherwise false.
     */
    isValid : function() {
    	return this.required && this.value ? this.validate(this.value) : true;
    },
    
    /**
     * Returns property value.
     * @return {Mixed} value
     */
    getValue : function() {
    	return this.value ? this.value : this.defaultValue;
    },
    
    /**
     * Sets property value. If the passed in value is invalid returns false.
     * @param {Mixed} v The new value being set
     */
    setValue : function(v) {
    	if (!this.validate(v)) {
    		return false;
    	}
    	//fix for boolean type
    	v = (this.type == afStudio.model.Types.BOOLEAN && Ext.isString(v)) ? v.bool() : v;
    	
		this.value = v;    	
    }
});