//Base controller namespace
Ext.ns('afStudio.controller');

/**
 * Base Model controller class.
 * 
 * @class afStudio.controller.BaseController
 * @extends Ext.util.Observable
 * @author Nikolai Babinski <niba@appflower.com>
 */
afStudio.controller.BaseController = Ext.extend(Ext.util.Observable, {

	/**
	 * TODO place real url! correct afStudioWSUrls.getGetWidgetUrl 
	 * 
	 * @cfg {String} url (defaults to 'URL_HERE')
	 */
	url : '/afsWidgetBuilder/getWidget',
	
	/**
	 * @cfg {Object} widget
	 * <ul>
	 * 	<li><b>uri</b>: The view URI.</li>
	 * 	<li><b>placeType</b>: The type of the place where a view is located ("apps"/"plugin").</li>
	 * 	<li><b>place</b>: The place name.</li>
	 * 	<li><b>actionPath</b>: View's actions class path</li>
	 * 	<li><b>securityPath</b>: View's security file path</li>
	 * </ul>
	 * (Required) The widget meta information.
	 */
	/**
	 * @cfg {Object} viewDefinition
	 * (Optional) The view definiton object - meta-data for the Model.
	 */
	
	/**
	 * @cfg {Array} views
	 * The array of views to be associated with this controller.
	 */
	views : [],
	
	/**
	 * Controller ID.
	 * @property id
	 * @type {String}
	 */
	
    /**
     * View definition object, holds the up-to-date definition of the view.
     * @property viewDefinition
     * @type {Object}
     */
    viewDefinition : null,
    
    /**
     * The token used to separate paths in node ids (defaults to '/').
     * @property pathSeparator
     * @type {String}
     */
    pathSeparator: "/",
        
    /**
     * The root node for this controller
     * @property root
     * @type {Node}
     */
    root : null,
    
    /**
     * The flag contains the controller's state.
     * @property ready
     * @type {Boolean}
     */
    ready : false,
    
    /**
     * @constructor
     * @param {Object} config Controller configuration object
     */
    constructor : function(config) {
    	config = config || {};
    	
        this.id = config.id || this.id;
        if (!this.id) {
            this.id = Ext.id(null, 'view-controller-');
        }    	
    	
    	if (config.url) {
    		this.url = config.url;
    	}
    	
    	if (config.viewDefinition) {
    		this.viewDefinition = config.viewDefinition;
    	}
    	
    	if (!config.widget && !Ext.isObject(config.widget)) {
    		throw new afStudio.controller.error.ControllerError('widget-cfg-incorrect');
    	}
		this.widget = config.widget;    	
    	
		this.views = config.views || [];
		
	    /**
	     * The store of all registred in controller model nodes
	     * @property nodeHash
	     * @type {Object}
	     */    	
        this.nodeHash = {};
        
        this.addEvents(
            "beforeModelNodeAppend",

            "modelNodeAppend",
            
            "beforeModelNodeRemove",
            
            "modelNodeRemove",
            
            "beforeModelNodeMove",
            
            "modelNodeMove",

            "beforeModelNodeInsert",
            
            "modelNodeInsert",
            
            "beforeModelPropertyChanged",
            
            "modelPropertyChanged",
            
            "beforeModelNodeCreated",
            
            "modelNodeCreated",
            
            "ready",
            
            "beforeLoadViewDefinition",
            
            "loadViewDefinition",
            
            "beforeSaveViewDefinition",
            
            "saveViewDefinition"
        );
        
        afStudio.controller.BaseController.superclass.constructor.call(this);
        
        if (this.viewDefinition) {
        	this.initModel(this.viewDefinition);
        } else {
        	this.loadViewDefinition();
        }
        
        //initViews
        
        //fireEvent("ready")
    },
    //eo constructor

    /**
     * Returns controller's state.
     * @return {Boolean} ready state
     */
    isReady : function() {
    	return this.ready;
    },

    /**
     * Returns view definition object.
     * @return {Object}
     */
    getViewDefinition : function() {
    	return this.viewDefinition;
    },
    
    /**
     * Loads view definition and instantiates model {@link #initModel} based on loaded definition.
     * @protected
     */
    loadViewDefinition : function() {
    	var _me = this,
    		viewUrl = Ext.urlAppend(this.url, Ext.urlEncode({uri: this.widget.uri}));
    	
    	if (this.fireEvent('beforeLoadViewDefinition')) {
    		
    		afStudio.xhr.executeAction({
    			url: viewUrl,
    			mask: {
    				region: 'center'
    			},
    			scope: _me,
    			run: function(response, ops) {
    				this.fireEvent('loadViewDefinition');
    				this.initModel(response.data);
    			}
    		});
    	}
    },
    //eo loadViewDefinition
    
    /**
     * Instantiates model.
     * Template method.
     * @protected
     * @param {Object} viewDefinition The view definition object
     */
    initModel : function(viewDefinition) {
    	var _self = this,
    		   vd = Ext.apply({}, viewDefinition);

		var root = new afStudio.model.Root({
    		definition: vd
    	});
    	
    	//set up viewDefinition object
    	this.viewDefinition = viewDefinition;
    	
    	this.registerModel(root);
    },
    //eo initModel
    
    /**
     * Saves view definiton.
     */
    saveViewDefinition : function() {
    	var _self = this,
    		   vd = this.viewDefinition;
    		   
    	if (this.fireEvent('beforeSaveViewDefinition', vd)) {
    		//code
    		
    		this.fireEvent('saveViewDefinition');
    	}
    },
    
    /**
     * @private
     */
    proxyNodeEvent : function() {
        return this.fireEvent.apply(this, arguments);
    },

    /**
     * Returns the root node for this controller.
     * @return {Node}
     */
    getRootNode : function() {
        return this.root;
    },

    /**
     * Registers a Model. Sets up a model's root node.
     * @protected
     * @param {Node} node
     * @return {Node} model's root node.
     */
    registerModel : function(node) {
        this.root = node;
        node.isRoot = true;
     	node.setOwnerTree(this);
        
        return node;
    },
    //eo registerModel
    
    registerView : function (view) {
    },

    /**
     * Gets a model node in this controller by its id.
     * @param {String} id
     * @return {Node}
     */
    getNodeById : function(id) {
        return this.nodeHash[id];
    },

    /**
     * @private
     * @param {Node} node
     */
    registerNode : function(node) {
        this.nodeHash[node.id] = node;
    },

    /**
     * @private
     * @param {Node} node
     */
    unregisterNode : function(node) {
        delete this.nodeHash[node.id];
    },

    toString : function() {
        return "[BaseController" + (this.id ? " " + this.id : "") + "]";
    }
});