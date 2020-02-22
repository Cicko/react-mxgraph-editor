import { default as MxGraph } from "mxgraph";
import { initToolbar, getStyleByKey, getStyleStringByObj } from ".";

const {
  mxEvent,
  mxGraph,
  mxConnectionHandler,
  mxImage,
  mxClient,
  mxRubberband,
  mxConstants,
  mxUtils,
  mxGeometry,
  mxPoint,
  mxHierarchicalLayout,
  mxFastOrganicLayout,
  mxEdgeHandler,
  mxUndoManager,
  mxKeyHandler,
  mxGraphHandler,
  mxConstraintHandler,
  mxGuide,
  mxEdgeStyle,
  mxCellState,
  mxConnectionConstraint,
  mxDragSource
} = MxGraph();

export default function setInitialConfiguration(graph, toolbarRef) {
  mxConnectionHandler.prototype.connectImage = new mxImage(
    "images/connector.gif",
    16,
    16
  );

  /*
  mxEdgeHandler.prototype.parentHighlightEnabled = true;
  mxEdgeHandler.prototype.dblClickRemoveEnabled = true;
  mxEdgeHandler.prototype.straightRemoveEnabled = true;
  mxEdgeHandler.prototype.virtualBendsEnabled = true;
  mxEdgeHandler.prototype.mergeRemoveEnabled = true;
  mxEdgeHandler.prototype.manageLabelHandle = true;
  mxEdgeHandler.prototype.outlineConnect = true;
  */
  // Specifies if waypoints should snap to the routing centers of terminals
  // mxEdgeHandler.prototype.snapToTerminals = false;

  // mxEdgeHandler.prototype.addEnabled = true;
  // mxEdgeHandler.prototype.removeEnabled = true;

  new mxRubberband(graph);
  mxRubberband.prototype.defaultOpacity = 30;
  mxRubberband.prototype.sharedDiv = document.createElement("div");
  mxRubberband.prototype.sharedDiv.style.backgroundColor = "red";

  graph.setPanning(true);
  graph.setTooltips(true);
  graph.setConnectable(true);
  graph.setEnabled(true);
  graph.setEdgeLabelsMovable(false);
  graph.setVertexLabelsMovable(false);
  graph.setGridEnabled(true);
  graph.setAllowDanglingEdges(false);
  // Workaround for Firefox where first mouse down is received
  // after tap and hold if scrollbars are visible, which means
  // start rubberband immediately if no cell is under mouse.
  var isForceRubberBandEvent = mxRubberband.isForceRubberbandEvent;
  mxRubberband.isForceRubberbandEvent = function(me) {
    return (
      (isForceRubberBandEvent.apply(this, arguments) &&
        !mxEvent.isShiftDown(me.getEvent()) &&
        !mxEvent.isControlDown(me.getEvent())) ||
      (mxClient.IS_CHROMEOS && mxEvent.isShiftDown(me.getEvent())) ||
      (mxUtils.hasScrollbars(this.graph.container) &&
        mxClient.IS_FF &&
        mxClient.IS_WIN &&
        me.getState() == null &&
        mxEvent.isTouchEvent(me.getEvent()))
    );
  };

  mxGraphHandler.prototype.guidesEnabled = true;
  // Alt disables guides
  mxGuide.prototype.isEnabledForEvent = function(evt) {
    return !mxEvent.isAltDown(evt);
  };

  mxConstraintHandler.prototype.pointImage = new mxImage(
    "https://uploads.codesandbox.io/uploads/user/4bf4b6b3-3aa9-4999-8b70-bbc1b287a968/-q_3-point.gif",
    5,
    5
  );

  graph.getView().updateStyle = true;
  initToolbar(graph, toolbarRef.current);
  const parent = graph.getDefaultParent();
  graph.getModel().beginUpdate();
  try {
    const vertexStyles = graph.getStylesheet().getDefaultVertexStyle();
    let edgeStyles = graph.getStylesheet().getDefaultEdgeStyle();
    console.log(edgeStyles);
    console.log(mxEdgeStyle);

    var v1 = graph.insertVertex(parent, null, "Hello,", 20, 20, 80, 30);
    v1.style = getStyleStringByObj(vertexStyles);

    var v2 = graph.insertVertex(parent, null, "World!", 200, 150, 80, 30);
    v2.style = getStyleStringByObj(vertexStyles);
    var e1 = graph.insertEdge(parent, null, "", v1, v2);
    e1.style = getStyleStringByObj(edgeStyles);
  } finally {
    var undoManager = new mxUndoManager();
    var listener = function(sender, evt) {
      undoManager.undoableEditHappened(evt.getProperty("edit"));
    };
    graph.getModel().addListener(mxEvent.UNDO, listener);
    graph.getView().addListener(mxEvent.UNDO, listener);

    const keyHandler = new mxKeyHandler(graph);
    // Undo handler: CTRL + Z
    keyHandler.bindControlKey(90, function(evt) {
      undoManager.undo();
    });

    // Redo handler: CTRL + SHIFT + Z
    keyHandler.bindControlShiftKey(90, function(evt) {
      undoManager.redo();
    });

    // Delete handler.
    keyHandler.bindKey(46, function(evt) {
      if (graph.isEnabled()) {
        const currentNode = graph.getSelectionCell();
        graph.removeCells([currentNode]);
      }
    });
  }
}
