Ext.namespace('afStudio.widgetDesigner');

/**
 * In WI Tree each node has its label that is visible in browser.
 * For some nodes we need to update that label automatically when some property changes
 * This behavior allows to define property name that when changed will be used to
 * update WI tree node label
 **/
afStudio.widgetDesigner.WithNamePropertyAsLabelBehavior = Ext.extend(afStudio.widgetDesigner.BaseBehavior, {
	
    /**
     * We need to detect when valueSource was changed
     * @override
     */
    propertyChanged : function(property) {
        if (property.id == 'name') {
            this.namePropertyChanged(property);
        }
    }
    
    ,namePropertyChanged : function(property) {
        this.node.setText(property.get('value'));
    }
});
