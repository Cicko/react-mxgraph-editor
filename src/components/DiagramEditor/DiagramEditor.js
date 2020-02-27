import * as React from "react";
import * as ReactDOM from "react-dom";
import "./styles/diagramEditor.css";
import { default as MxGraph } from "mxgraph";
import { CompactPicker } from "react-color";
import {
  initToolbar,
  getStyleByKey,
  getStyleStringByObj,
  setInitialConfiguration,
  configureKeyBindings
} from "./utils";

const {
  mxGraph,
  mxEvent,
  mxVertexHandler,
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
  mxCellState,
  mxConnectionConstraint,
  mxDragSource
} = MxGraph();

export default function App(props) {
  const containerRef = React.useRef(null);
  const toolbarRef = React.useRef(null);
  const [colorPickerVisible, setColorPickerVisible] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [colorPickerType, setColorPickerType] = React.useState(null);
  const [graph, setGraph] = React.useState(null);

  React.useEffect(() => {
    if (!graph) {
      mxEvent.disableContextMenu(containerRef.current);
      setGraph(new mxGraph(containerRef.current));
    }
    // Adds cells to the model in a single step
    if (graph) {
      // setInitialConfiguration(graph, toolbarRef);
      setInitialConfiguration(graph, toolbarRef);
      configureKeyBindings(graph);

      // Updates the display
      graph.getModel().endUpdate();
      graph.getModel().addListener(mxEvent.CHANGE, onChange);
      graph.getSelectionModel().addListener(mxEvent.CHANGE, onSelected);
      graph.getModel().addListener(mxEvent.ADD, onElementAdd);
      graph.getModel().addListener(mxEvent.MOVE_END, onDragEnd);
    }
  }, [graph]);

  const getEditPreview = () => {
    var dragElt = document.createElement("div");
    dragElt.style.border = "dashed black 1px";
    dragElt.style.width = "120px";
    dragElt.style.height = "40px";
    return dragElt;
  };
  const createDragElement = () => {
    const { graph } = this.state;
    const tasksDrag = ReactDOM.findDOMNode(
      this.refs.mxSidebar
    ).querySelectorAll(".task");
    Array.prototype.slice.call(tasksDrag).forEach(ele => {
      const value = ele.getAttribute("data-value");
      let ds = mxUtils.makeDraggable(
        ele,
        this.graphF,
        (graph, evt, target, x, y) =>
          this.funct(graph, evt, target, x, y, value),
        this.dragElt,
        null,
        null,
        graph.autoscroll,
        true
      );
      ds.isGuidesEnabled = function() {
        return graph.graphHandler.guidesEnabled;
      };
      ds.createDragElement = mxDragSource.prototype.createDragElement;
    });
  };

  const settingConnection = () => {
    mxConstraintHandler.prototype.intersects = function(
      icon,
      point,
      source,
      existingEdge
    ) {
      return !source || existingEdge || mxUtils.intersects(icon.bounds, point);
    };

    var mxConnectionHandlerUpdateEdgeState =
      mxConnectionHandler.prototype.updateEdgeState;
    mxConnectionHandler.prototype.updateEdgeState = function(pt, constraint) {
      if (pt != null && this.previous != null) {
        var constraints = this.graph.getAllConnectionConstraints(this.previous);
        var nearestConstraint = null;
        var dist = null;

        for (var i = 0; i < constraints.length; i++) {
          var cp = this.graph.getConnectionPoint(this.previous, constraints[i]);

          if (cp != null) {
            var tmp =
              (cp.x - pt.x) * (cp.x - pt.x) + (cp.y - pt.y) * (cp.y - pt.y);

            if (dist == null || tmp < dist) {
              nearestConstraint = constraints[i];
              dist = tmp;
            }
          }
        }

        if (nearestConstraint != null) {
          this.sourceConstraint = nearestConstraint;
        }

        // In case the edge style must be changed during the preview:
        // this.edgeState.style['edgeStyle'] = 'orthogonalEdgeStyle';
        // And to use the new edge style in the new edge inserted into the graph,
        // update the cell style as follows:
        //this.edgeState.cell.style = mxUtils.setStyle(this.edgeState.cell.style, 'edgeStyle', this.edgeState.style['edgeStyle']);
      }

      mxConnectionHandlerUpdateEdgeState.apply(this, arguments);
    };

    if (graph.connectionHandler.connectImage == null) {
      graph.connectionHandler.isConnectableCell = function(cell) {
        return false;
      };
      mxEdgeHandler.prototype.isConnectableCell = function(cell) {
        return graph.connectionHandler.isConnectableCell(cell);
      };
    }

    graph.getAllConnectionConstraints = function(terminal) {
      if (terminal != null && this.model.isVertex(terminal.cell)) {
        return [
          new mxConnectionConstraint(new mxPoint(0.5, 0), true),
          new mxConnectionConstraint(new mxPoint(0, 0.5), true),
          new mxConnectionConstraint(new mxPoint(1, 0.5), true),
          new mxConnectionConstraint(new mxPoint(0.5, 1), true)
        ];
      }
      return null;
    };

    // Connect preview
    graph.connectionHandler.createEdgeState = function(me) {
      var edge = graph.createEdge(
        null,
        null,
        "Edge",
        null,
        null,
        "edgeStyle=orthogonalEdgeStyle"
      );

      return new mxCellState(
        this.graph.view,
        edge,
        this.graph.getCellStyle(edge)
      );
    };
  };

  const onChange = evt => {
    if (props.onChange) {
      props.onChange(evt);
    }
  };

  const onSelected = evt => {
    if (props.onSelected) {
      props.onSelected(evt);
    }
    setSelected(evt.cells[0]);
    setColorPickerVisible(false);
    // console.log(mxVertexHandler.getSelectionColor());
  };

  const onElementAdd = evt => {
    if (props.onElementAdd) {
      props.onElementAdd(evt);
    }
  };

  const onDragEnd = evt => {
    if (props.onDragEnd) {
      props.onDragEnd(evt);
    }
  };

  const onAdd = geometry => () => {
    console.log("lets add an", geometry);
  };

  const renderAddButton = geometry => (
    <div
      className={`toolbar-button button-add-${geometry}`}
      onClick={onAdd(geometry)}
      role="button"
    >
      {geometry === "text" && "T"}
    </div>
  );

  const updateCellColor = (type, color) => {
    graph.setCellStyles(type, color.hex);
  };

  const pushCellsBack = (moveBack) => () => {
    graph.orderCells(moveBack);
  }; 

  const renderMoveBackAndFrontButtons = () => selected && 
    <React.Fragment>
          <button className="button-toolbar-action" onClick={pushCellsBack(true)}>Move back</button>
          <button className="button-toolbar-action" onClick={pushCellsBack(false)}>Move front</button>
    </React.Fragment>;

  const renderColorChange = (type, content) => {
    if (!selected) {
      return null;
    }
    return (
      <button
        className={"button-toolbar-action"}
        onClick={() => {
          setColorPickerVisible(!colorPickerVisible);
          setColorPickerType(type);
        }}
        style={{
          backgroundColor: selected.style && getStyleByKey(selected.style, type)
        }}
      >
        {content}
      </button>
    );
  };

  const renderColorPicker = () =>
    colorPickerVisible &&
    selected && (
      <div>
        <div className="toolbar-separator" />
        <CompactPicker
          color={selected.style && getStyleByKey(selected.style, "fillColor")}
          onChange={color => {
            updateCellColor(colorPickerType, color);
          }}
        />
      </div>
    );

  return (
    <div className="mxgraph-container">
      <div className="mxgraph-toolbar-container">
        <div className="mxgraph-toolbar-container" ref={toolbarRef} />
        <div>
          {renderMoveBackAndFrontButtons()}
          {renderColorChange("fillColor", "Change fill color")}
          {renderColorChange("fontColor", "Change font color")}
          {renderColorChange("strokeColor", "Change border color")}
        </div>
        {renderColorPicker()}
      </div>
      <div ref={containerRef} className="mxgraph-drawing-container" />
    </div>
  );
}
