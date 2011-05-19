Ext.namespace('afStudio.wd');

/**
 * WD wrapper panel.
 * 
 * @class afStudio.wd.WidgetPanel
 * @extends Ext.Panel
 * @author Nikolai
 */
afStudio.wd.WidgetPanel = Ext.extend(Ext.Panel, {	
	/**
	 * @cfg {String} (required) actionPath
	 * Widget action path 
	 */	
	/**
	 * @cfg {String} (required) securityPath
	 * Widget security path  
	 */	
	/**
	 * @cfg {String} (required) widgetUri
	 * Widget URI  
	 */

	/**
	 * @cfg {String} layout
	 * Layout type.
	 */
	layout : 'fit'
	
	/**
	 * Widget definition component.
	 * 
	 * @property widgetDefinition
	 * @type {afStudio.wd.WidgetDefinition}
	 */
	
	/**
	 * Widget meta data object:
	 * <u>
	 *   <li><b>actionPath</b>: Path to widget's action controller.</li>
	 *   <li><b>securityPath</b>: Path to widget's security config.</li>
	 *   <li><b>widgetUri</b>: Widget URI</li>
	 *   <li><b>definition</b>: Widget's metadata definition.</li>
	 * </ul>
	 * 
	 * @property widgetMetaData
	 * @type {Object}
	 */
	
	/**
	 * WidgetPanel constructor.
	 * @constructor
	 * @param {Object} config The configuration object
	 */
	,constructor : function(config) {
		config = config || {};
		config.widgetMetaData = {};
		
		if (config.actionPath) {
			config.widgetMetaData.actionPath = config.actionPath;
			delete config.actionPath;
		}
		if (config.securityPath) {
			config.widgetMetaData.securityPath = config.securityPath;
			delete config.securityPath;
		}
		if (config.widgetUri) {
			config.widgetMetaData.widgetUri = config.widgetUri;
			delete config.widgetUri;
		}
		
		Ext.apply(config, {
			title: config.widgetMetaData.widgetUri
		});
		
		this.widgetDefinition = new afStudio.wd.WidgetDefinition({
			widgetUri: config.widgetMetaData.widgetUri
		});		
		
		afStudio.wd.WidgetPanel.superclass.constructor.call(this, config);
	}//eo constructor
		
	/**
	 * Ext Template method
	 * @private
	 */
	,initComponent : function() {
		afStudio.wd.WidgetPanel.superclass.initComponent.apply(this, arguments);
		this._afterInitComponent();
	}//eo initComponent	
	
	/**
	 * Initializes events & does post configuration
	 * @private
	 */
	,_afterInitComponent : function() {
		var _this = this;
		
		this.on({
			scope: _this,
			afterrender: _this.initWidgetPanel
		});		
	}//eo _afterInitComponent 
	
	/**
	 * Initialises widget panel after it was rendered.
	 * This widget panel <u>afterrender</u> event listener.
	 * @private
	 */
	,initWidgetPanel : function() {
		afStudio.vp.mask({region: 'center'});
		
		//start fetching  widget's data
		this.widgetDefinition.fetchDefinition({
			scope: this,
			
			success: function(metadata) {
				afStudio.vp.unmask('center');
				//add definition into widget's metadata
				this.widgetMetaData.definition = metadata;
				
				this.openWidgetDesigner(metadata);
			},
			
			error: function(response) {
				afStudio.vp.unmask('center');
				var msg = String.format('Fetching widget "{0}" data failed. <br/> {1}',
								this.widgetMetaData.widgetUri, response.message);
				afStudio.Msg.error(msg);				 
			}
		});
	}//eo initWidgetPanel
	
	/**
	 * Opens widget designer based on passed in definition.
	 * @param {Object} definition The widget metadata.
	 */
	,openWidgetDesigner : function(definition) {		
		this.add({
			xtype: 'afStudio.wd.widgetTabPanel',
			widgetMeta: this.widgetMetaData
		});		
		this.doLayout();       
	}//eo openWidgetDesigner
});

/**
 * @type 'afStudio.wd.widgetPanel'
 */
Ext.reg('afStudio.wd.widgetPanel', afStudio.wd.WidgetPanel);