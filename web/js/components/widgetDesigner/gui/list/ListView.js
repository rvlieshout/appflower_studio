Ext.ns('afStudio.wd.list');

/**
 * GUI List View.
 * 
 * @dependency
 * Model nodes: {@link afStudio.ModelNode}
 * 
 * @class afStudio.wd.list.ListView
 * @extends Ext.grid.GridPanel
 * @author Nikolai Babinski <niba@appflower.com>
 */
afStudio.wd.list.ListView = Ext.extend(Ext.grid.GridPanel, {
	/**
	 * @cfg {afStudio.controller.BaseController} (Required) controller
	 * The associated with this tree controller.
	 */

	//TODO should be deleted after ListGridView cleaning
	columnName : 'newcolumn',
	
	EXEC_ADD : 'add',
	
	EXEC_INSERT : 'insert',
	
	EXEC_REMOVE : 'remove',
	
	EXEC_UPDATE : 'update',
	
	/**
	 * Initializes component
	 * @private
	 * @return {Object} The configuration object 
	 */
	_beforeInitComponent : function() {
		var _me = this,
			nodes = afStudio.ModelNode,
			vm = this.controller.viewDefinition.getData();

		/**
		 * model->component associations holder
		 * @property modelMapper
		 * @type {Object}
		 */
		this.modelMapper = {};

		var columns = this.createColumns();
	
		var sm = this.resolveSelectionModel();

		var store = new Ext.data.ArrayStore({
			idIndex: 0,
			data: [[]],
			fields: []
		});
		
		var actions = this.createActions();
		
		var desc = this.createDescription();
		
		return {
			header: true,
	        store: store,
	        selModel: sm,
			columns: columns,
	        view: new afStudio.wd.list.ListGridView(),
	        columnLines: true,
	        autoScroll: true,
	        tbar: {
	        	xtype: 'container',
	        	defaults: {
	        		xtype: 'toolbar'
	        	},
	        	items: [actions, desc]
	        },
	        bbar: {
	        	xtype: 'paging',
	        	hidden: true,
		        store: store,
		        displayInfo: true
	        }
		};		
	},
	//eo _beforeInitComponent	
	
	/**
	 * ExtJS template method
	 * @private
	 */
	initComponent : function() {
		Ext.apply(this, 
			Ext.apply(this.initialConfig, this._beforeInitComponent())
		);
		
		afStudio.wd.list.SimpleListView.superclass.initComponent.apply(this, arguments);
		
		this._afterInitComponent();
	},
	
	/**
	 * Initializes events & does post configuration
	 * @private
	 */	
	_afterInitComponent : function() {
		var _me = this;
		
		this.configureView();
	},
	//eo _afterInitComponent
	
	/**
	 * After construction view configuration
	 * @protected
	 */
	configureView : function() {
		var nodes = afStudio.ModelNode,
			mpr = this.getModelNodeMapper(),
			v = this.getValueKey(),
		    tb = this.getTopToolbar(),
		    a = tb.getComponent('actions'),
		    ma = a.getComponent('more').menu;
		
		//title    
		var nTitle = this.getModelNodeByPath(nodes.TITLE),
			vTitle = this.getModelNodeValue(nTitle);
		this.setTitle(vTitle[v]);
		this.mapCmpToModel(nTitle.id, this);
		
		//top toolbar
		var nFields = this.getModelNode(nodes.FIELDS);
		
		var selAll = ma.getComponent('sel-all'),
			deselAll = ma.getComponent('desel-all'),
			exp = ma.getComponent('exports'),
			expView = a.getComponent('expanded-view');
		
		//mapping	
		this.mapCmpToModel(nFields.id + '#selectable', this.createMapper(
				function(){ return [selAll, deselAll]; }
		));
		selAll[mpr] = deselAll[mpr] = nFields.id + '#selectable';
		
		this.mapCmpToModel(nFields.id + '#exportable', exp);
		exp[mpr] = nFields.id + '#exportable';
		
		this.mapCmpToModel(nFields.id + '#expandButton', expView);
		expView[mpr] = nFields.id + '#expandButton';
		
		var pFields = this.getModelNodeProperties(nodes.FIELDS);
		pFields.selectable ? (selAll.enable(), deselAll.enable()) : (selAll.disable(), deselAll.disable());
		pFields.exportable ? exp.show() : exp.hide();
		pFields.expandButton ? expView.show() : expView.hide();
		
		this.updateActionBarVisibilityState();
		//end top toolbar
		
		//bottom toolbar
		if (this.isModelStatus(nodes.FIELDS, {pager: true})) {
			var bb = this.getBottomToolbar();
			bb.show();
			this.mapCmpToModel(nFields.id + '#pager', bb);
		}
	},
	//eo configureView
	
	/**
	 * Ext template method
	 * @private
	 */
	initEvents : function() {
		afStudio.wd.list.ListView.superclass.initEvents.call(this);
		
		var _me = this;
		
		this.addEvents(
			/**
			 * @event 'changeColumnPosition' Fires when a column was moved from his previous position.
			 * @param {Ext.grid.Column} clm The column being moved.
			 * @param {Number} oldPos The column's previous(old) position.
			 * @param {Number} newPos The column's new position where it was moved.
			 */
			'changeColumnPosition',
			
			/**
			 * @event 'changeColumnLabel' Fires when a column's header was modified 
			 * @param {Ext.grid.Column} clm The column which header was modified.
			 * @param {Number} clmIndex The column index inside {@link Ext.grid.ColumnModel}.
			 * @param {String} value The header's new value.
			 */
			'changeColumnLabel',
			
			/**
			 * @event 'deleteColumn' Fires after a column was deleted
			 * @param {String} clmName The colomn <tt>name</tt> attribute
			 */
			'deleteColumn'
		);
		
		this.on({
			scope: _me,
			
			contextmenu: function(e) {
				e.preventDefault();
			},
			columnmove: _me.onColumnMove,
			
            /**
             * @relayed controller
             */
            modelNodeAppend: _me.onModelNodeAppend,
            /**
             * @relayed controller
             */
            modelNodeInsert: _me.onModelNodeInsert,
    		/**
    		 * @relayed controller
    		 */
            modelNodeRemove: _me.onModelNodeRemove,
    		/**
    		 * @relayed controller
    		 */
            modelPropertyChanged: _me.onModelPropertyChanged
		});
	},
	//eo initEvents
	
	/**
	 * Returns executor method.
	 * @protected
	 * @param {String} type The executor type
	 * @param {String} tag The node's tag name
	 * @param {String} (Optional) property The node's property name
	 * @return {Function} executor or null if executor is not exist
	 */
	getExecutor : function(type, tag, property) {
		var line = tag.replace(/^i:(\w+)/i, '$1').ucfirst(),
			exe  = String.format('execute{0}{1}{2}', type.ucfirst(), line.ucfirst(), property ? property.ucfirst() : '');
		
		console.log('executor', exe);
			
		return Ext.isFunction(this[exe]) ? this[exe].createDelegate(this) : null;
	},
	
	/**
	 * Returns grid's component by a model.
	 * @public
	 * @interface
	 * @param {String/afStudio.model.Node} node The model node or its id
	 * @return {Ext.Component} node
	 */
	getCmpByModel : function(node) {
		var nId = Ext.isString(node) ? node : node.id;
		var mapping = this.modelMapper[nId];
		if (mapping) {
			return  Ext.isFunction(mapping) ? mapping() : mapping;
		}
		
    	return null;
	},
	//eo getCmpByModel	
	
	/**
	 * Returns model node by component associated with it. If node was not found returns null/undefined.
	 * @public
	 * @interface
	 * @param {Ext.Component} cmp The grid's component associated with a model node
	 * @return {Node} model node
	 */
	getModelByCmp : function(cmp) {
		var mpr = this.getModelNodeMapper(),
			nodeId = cmp[mpr];
			
		return this.getModelNode(nodeId);
	},
	
	/**
	 * Relayed <u>modelNodeAppend</u> event listener.
	 * More details {@link afStudio.controller.BaseController#modelNodeAppend}.
	 * @protected
	 * @interface
	 */
	onModelNodeAppend : function(ctr, parent, node, index) {
		console.log('@view [ListView] modelNodeAppend');
		var executor = this.getExecutor(this.EXEC_ADD, node.tag);
		if (executor) {
			executor(node, index);
		}
	},
	//eo onModelNodeAppend
	
	/**
	 * Relayed <u>modelNodeInsert</u> event listener.
	 * More details {@link afStudio.controller.BaseController#modelNodeInsert}.
	 * @protected
	 * @interface
	 */
	onModelNodeInsert : function(ctr, parent, node, refNode) {
		console.log('@view [ListView] modelNodeInsert');
		var refCmp = this.getCmpByModel(refNode),
			executor = this.getExecutor(this.EXEC_INSERT, node.tag);
		if (executor) {
			executor(node, refNode, refCmp);
		}
	},
	//eo onModelNodeInsert
	
	/**
	 * Relayed <u>modelNodeRemove</u> event listener.
	 * More details {@link afStudio.controller.BaseController#modelNodeRemove}.
	 * @protected
	 * @interface
	 */
	onModelNodeRemove : function(ctr, parent, node) {
    	console.log('@view [ListView] modelNodeRemove');
		var vCmp = this.getCmpByModel(node),
			executor = this.getExecutor(this.EXEC_REMOVE, node.tag);
		if (executor) {
			executor(node, vCmp);
		}
	},
	//eo onModelNodeRemove	
	
	/**
	 * Relayed <u>modelPropertyChanged</u> event listener.
	 * More details {@link afStudio.controller.BaseController#modelPropertyChanged}.
	 * @protected
	 * @interface
	 */
	onModelPropertyChanged : function(node, p, v) {
		console.log('@view [ListView] modelPropertyChanged');
		var vCmp = this.getCmpByModel(node),
			executor = this.getExecutor(this.EXEC_UPDATE, node.tag, p);
		if (executor) {
			executor(node, vCmp, p, v);
		}
	},
	
	/**
	 * Handler of <u>columnmove</u> event.
	 * @param {Number} oldIndex
	 * @param {Number} newIndex
	 */
	onColumnMove : function(oldIndex, newIndex) {
		if (oldIndex != newIndex) {
			var clm = this.getColumnModel().config[newIndex];
			this.fireEvent('changeColumnPosition', clm, oldIndex, newIndex);	
		}
	},
	
	/**
	 * Updates action bar <u>visibility</u> state.
	 * @protected 
	 */
	updateActionBarVisibilityState : function() {
		var aBar = this.getTopToolbar().getComponent('actions'),		
			aHidden = 0;

		this.updateMoreActionVisibilityState();
			
		aBar.items.each(function(i) {
			if (i.hidden) {
				aHidden++;
			}
		});		
		if (aHidden > 0 && ((aHidden + 1)  == aBar.items.getCount())) {
			aBar.hide();
		} else {
			aBar.show();
		}		
		this.doLayout();
	},
	//eo updateActionBarVisibilityState
	
	/**
	 * Updates <i>more actions</i> <u>visibility</u> state.
	 * @protected
	 */
	updateMoreActionVisibilityState : function() {
		var aBar   = this.getTopToolbar().getComponent('actions'),		
			aMore  = aBar.getComponent('more'),
			bSel   = aMore.menu.getComponent('sel-all'),
			bDesel = aMore.menu.getComponent('desel-all');				
		
		if (bSel.disabled && bDesel.disabled) {
			var ic = 2;	
			aMore.menu.items.each(function(i) {
				if (i.hidden) {
					ic++;
				}
			});
			if (ic == aMore.menu.items.getCount()) {
				aMore.hide();
			} else {
				aMore.show();
			}
		} else {
			aMore.show();
		}		
	},
	//eo updateMoreActionVisibilityState
	
	/**
	 * Maps this grid's component to a model node.
	 * @protected
	 * @param {String} node The model node ID
	 * @param {Component/Function} cmp The component being mapped to the model node or a function returning a mapped component
	 */
	mapCmpToModel : function(node, cmp) {
		this.modelMapper[node] = cmp;
	},
	
	/**
	 * Unmaps the grid's component from the model node.
	 * @protected
	 * @param {String/Node} node The model node's ID or model node
	 */
	unmapCmpFromModel : function(node) {
		node = Ext.isString(node) ? node : node.id;
		delete this.modelMapper[node];
	},
	
	/**
	 * Creates the mapper function. All passed in parameters except the first one(mapper function) are added to the mapper.
	 * @protected
	 * @param {Function} fn The function mapper
	 * @return {Funtion} mapper
	 */
	createMapper : function(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return fn.createDelegate(this, args);
	},
	
	/**
	 * Column mapper responsible for returning a column from column 
	 * model {@link #colModel} by model node's ID associated with it.
	 * @private
	 * @param {String} n The model node id
	 * @return {Array} column:
	 * <ul>
	 * 	<li><b>0</b> - {Ext.grid.Column} The column itself</li>
	 * 	<li><b>1</b> - {Number} The column's index inside column model</li>
	 * </ul> 
	 */
	columnMapper : function(n) {
		var mpr = this.getModelNodeMapper(),
			cm = this.getColumnModel(),
			idx = Ext.each(cm.config, function(c){return !(c[mpr] == n);});
			
		return [cm.config[idx], idx];
	},
	
	/**
	 * RowAction mapper responsible for returning a row-action from action column
	 * by model node's ID associated with the action.
	 * @private
	 * @param {String} n The model node id
	 * @return {Array} row-action:
	 * <ul>
	 * 	<li><b>0</b> - {Object} The row-action itself</li>
	 * 	<li><b>1</b> - {Number} The row-action's index inside the action column</li>
	 * </ul> 
	 */
	rowActionMapper : function(n) {
		var mpr = this.getModelNodeMapper(),
			cm = this.getColumnModel(),
			aClm = cm.getColumnById('action-column'),
			idx = Ext.each(aClm.items, function(a){return !(a[mpr] == n);});
			
		return [aClm.items[idx], idx] ;
	},
	
	/**
	 * Action mapper responsible for returning an action from action toolbar
	 * by model node's ID associated with the action.
	 * @private
	 * @param {String} n The model node id
	 * @return {Array} action:
	 * <ul>
	 * 	<li><b>0</b> - {Ext.Toolbar.Item} The action itself</li>
	 * 	<li><b>1</b> - {Number} The action's index inside the action toolbar items</li>
	 * </ul> 
	 */
	actionMapper : function(n) {
		var mpr = this.getModelNodeMapper(),
			ab = this.getTopToolbar().getComponent('actions'),
			idx;
			
		ab.items.each(function(a, i, l) {
			if (i > l - 3) {
				return false;
			}
			if (a[mpr] == n) {
				idx = i;
				return false;
			}
		});
				
		return [ab.items.itemAt(idx), idx];
	},
	
	/**
	 * MoreAction mapper responsible for returning an action from more-action menu
	 * by model node's ID associated with the action.
	 * @private
	 * @param {String} n The model node id
	 * @return {Array} action:
	 * <ul>
	 * 	<li><b>0</b> - {Ext.menu.Item} The action itself</li>
	 * 	<li><b>1</b> - {Number} The action's index inside the more-action menu items</li>
	 * </ul> 
	 */
	moreActionMapper : function(n) {
    	var mpr = this.getModelNodeMapper(),
    		ab = this.getTopToolbar().getComponent('actions'),
    		more = ab.getComponent('more').menu,
    		idx;
    		
		more.items.each(function(a, i) {
			if (i > 2 && a[mpr] == n) {
				idx = i;
				return false;
			}
		});
				
		return [more.items.itemAt(idx), idx];
	},
	
	/**
	 * Resolve selection model for the grid.
	 * @protected
	 * @return {Ext.grid.RowSelectionModel} selection model
	 */
	resolveSelectionModel : function() {
		return this.isModelStatus(afStudio.ModelNode.FIELDS, {'select': true}) 
					? new Ext.grid.CheckboxSelectionModel() 
					: new Ext.grid.RowSelectionModel();
	},
	
	/**
	 * Creates columns.
	 * @protected
	 * @return {Object} column model {@link Ext.grid.ColumnModel} init object
	 */
	createColumns : function() {
		var _me = this,
			nodes = afStudio.ModelNode,
			columns = [];
		
		var sm = this.resolveSelectionModel(); 	
		if (sm instanceof Ext.grid.CheckboxSelectionModel) {
			columns.push(sm);
		}
			
		if (_me.isModelNodeExists(nodes.COLUMN, true)) {
			var clm = _me.getColumns();
			
			for (var i = 0, l = clm.length; i < l; i++) {
				var c = this.createColumn(clm[i], i);
				columns.push(c);
			}
		}
		
		//i:rowactions
		var ra = _me.getRowActions();
		if (!Ext.isEmpty(_me.getRowActions())) {
			columns.push(
				this.createRowActionColumn(ra)
			);
		}
		
		return columns;
	},
	//eo createColumns
	
	/**
	 * Creates grid's column object.
	 * @protected
	 * @param {Object} clm The column definition object
	 * @param {Number} idx The column index inside column model {@link #colModel}
	 * @return {Object} column {@link Ext.grid.Column} init object
	 */
	createColumn : function(clm, idx) {
		var mpr = this.getModelNodeMapper();
		
		this.mapCmpToModel(clm[mpr], this.createMapper(this.columnMapper, clm[mpr]));
		
		var column = {
			header:   clm.label,
			name:     clm.name,
			width:    clm.width,
			hidden:   clm.hidden,
			hideable: clm.hideable
		};
		
		//add model node mapping
		column[mpr] = clm[mpr];
		
		return column;
	},
	//eo createColumn
	
	/**
	 * Removes grid's column.
	 * @param {Ext.grid.Column} clm The column being removed
	 */
	removeColumn : function(clm) {
		var n = this.getModelByCmp(clm);
		n.remove(true);
	},
	
	/**
	 * Creates grid's <i>action</i> column.
	 * @param {Array} actions The actions definition
	 * @return {Object} action column {Ext.grid.ActionColumn} init object
	 */
	createRowActionColumn : function(actions) {			
		var	_me = this,
			aWidth = 18, //default row action width
			actClmWidth = 50; //default action column width
			
		var actClm = {
			id: 'action-column',
            xtype: 'listactioncolumn',
            header: 'Actions',
            menuDisabled: true,
            width: actClmWidth,
            fixed: true,
            items: []
		};
		
		Ext.iterate(actions, function(ra, idx) {
			var a = _me.createRowAction(ra, idx);
			actClm.items.push(a);
		});
		actClm.width = (actions.length * aWidth) > actClmWidth ? (actions.length * aWidth) : actClmWidth;
		
		return actClm;
	},
	//eo createRowActionColumn
	
	/**
	 * Creates row-action.
	 * @param {Object} action The row-action definition object
	 * @param {Number} idx The row-action index inside action column
	 * @return {Object} row-action init object 
	 */
	createRowAction : function(action, idx) {
		var mpr = this.getModelNodeMapper();

		this.mapCmpToModel(action[mpr], this.createMapper(this.rowActionMapper, action[mpr]));
		
		var rowAction = {
			name: action.name,
			iconCls: action.iconCls,
			icon: action.icon,				
			altText: action.text ? action.text : action.name,
			tooltip: action.tooltip ? action.tooltip : action.name
		};
		
		//add model node mapping
		rowAction[mpr] = action[mpr];		
		
		return rowAction;
	},
	//eo createRowAction
	
	/**
	 * Creates actions toolbar.
	 * @protected
	 * @return {Object} actions {@link Ext.Toolbar} init object 
	 */
	createActions : function() {
		var actions = {
    		itemId: 'actions',
        	items: [
        	'->',
        	{
        		itemId: 'expanded-view',
        		text: 'Expanded View',
        		iconCls: 'icon-application-split'
        	},{
        		itemId: 'more',
    			text: 'More Actions',
				menu: {
					items: [
					{
						itemId: 'exports',
						text: 'Exports',
						iconCls: 'icon-database-save'
					},{
						itemId: 'sel-all',
						text: 'Select All'
					},{
						itemId: 'desel-all',
						text: 'Deselect All'
					}]
				}
        	}]
		};
		
		var moreAct = actions.items[2];
		
		//i:actions
		var act = this.getActions();
		if (!Ext.isEmpty(act)) {
			Ext.iterate(act, function(a, idx) {
				actions.items.unshift(
					this.createAction(a, idx)
				);
			}, this);
		}
		
		//i:moreactions
		act = this.getMoreActions();
		if (!Ext.isEmpty(act)) {
			Ext.iterate(act, function(a, idx) {
				moreAct.menu.items.push(
					//idx + 3 because of previous 3 components "exports", "sel-all" and "desel-all"
					this.createMoreAction(a, idx + 3)
				);
			}, this);
		}
		
		return actions;
	},
	//eo createActions
	
	/**
	 * @protected
	 * @param {Object} a The action definition
	 * @return {Object}
	 */
	createActionObj : function(a) {
		var mpr = this.getModelNodeMapper();
		var action = {
			name: a.name,
			text: a.text ? a.text : a.name,
			iconCls: a.iconCls,
			icon: a.icon,
			tooltip: a.tooltip,
			style: a.style
		};			
		//add model node mapping
		action[mpr] = a[mpr];		
		
		return action;		
	},
	
	/**
	 * Creates action.
	 * @protected
	 * @param {Object} act The action definition object.
	 * @return {Object} action init object 
	 */
	createAction : function(act, idx) {
		var mpr = this.getModelNodeMapper();
		this.mapCmpToModel(act[mpr], this.createMapper(this.actionMapper, act[mpr]));
		
		return this.createActionObj(act);		
	},
	//eo createIAction
	
	/**
	 * Creates more-action.
	 * @protected
	 * @param {Object} act The action definition object.
	 * @return {Object} action init object 
	 */
	createMoreAction : function(act, idx) {
		var mpr = this.getModelNodeMapper();
		this.mapCmpToModel(act[mpr], this.createMapper(this.moreActionMapper, act[mpr]));
		
		return this.createActionObj(act);		
	},
	//eo createMoreAction
	
	createDescription : function() {
		var dsc = {
    		itemId: 'desc',
    		hidden: true,
        	items: {
        		xtype: 'tbtext',
        		style: 'white-space: normal;',
        		text: ''
        	}
		};
		
		var v =	this.getValueKey(),
			mpr = this.getModelNodeMapper(),
			nodes = afStudio.ModelNode;
			
		var dn = this.getModelNodeByPath(nodes.DESCRIPTION);
		
		var descData = this.getModelNodeValue(dn);
		if (descData[v]) {
			dsc.hidden = false;
			dsc.items.text = descData[v]; 			
		}

		this.mapCmpToModel(descData[mpr], this.createMapper(function(){
			return this.getTopToolbar().getComponent('desc');
		}));
		dsc[mpr] = descData[mpr];
		
		return dsc;
	}

});

//@mixin ListModelInterface
Ext.apply(afStudio.wd.list.ListView.prototype, afStudio.wd.list.ListModelInterface);

//@mixin ModelReflector
Ext.apply(afStudio.wd.list.ListView.prototype, afStudio.wd.list.ModelReflector);

/**
 * @type 'wd.listView'
 */
Ext.reg('wd.listView', afStudio.wd.list.ListView);