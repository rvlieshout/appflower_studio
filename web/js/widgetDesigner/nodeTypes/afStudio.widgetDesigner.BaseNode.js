Ext.namespace('afStudio.widgetDesigner');

N = afStudio.widgetDesigner;

/**
 * BaseNode is common class for all other WI node types
 * @param {Object} 
 */
N.BaseNode = function(data){
	
	this.initialData = data;
	
    var config = this.getNodeConfig(data);
    this.createContextMenu();
    afStudio.widgetDesigner.BaseNode.superclass.constructor.apply(this, [config]);
    this._initEvents();
};
Ext.extend(N.BaseNode, Ext.tree.TreeNode, {
    createContextMenu: Ext.emptyFn,
    /**
     * Returns fields for properties grid
     */
	getProperties: function(){
        return {};
	},
	
	/**
	 * Function prepareProperties
	 * Prepares node properties before inserting in PropertyGrid
	 * @param {Array} array of node properties
	 * @return {Object} object with properties which optimized for PropertyGrid
	 */
	prepareProperties: function(props){
//		var properties = {};
//		for(var i = 0, l = props.length; i<l; i++){
//			var p = props[i];
//			properties[p.fieldLabel] = p.value;
//		}
//		return properties;
		
		var properties = props;
		return properties;
	},
	
    /**
     * Returns node configuration, something like: {text: 'sadads', iconCls: 'icon'}
     */
    getNodeConfig: Ext.emptyFn,
    _initEvents: Ext.emptyFn
});