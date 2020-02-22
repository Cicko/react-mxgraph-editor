import * as React from "react";
import * as ReactDOM from "react-dom";
import "./styles/diagramEditor.css";
import { default as MxGraph } from "mxgraph";
import { mxGraph } from "mxgraph-js";
import { CompactPicker } from "react-color";
import {
  initToolbar,
  getStyleByKey,
  getStyleStringByObj,
  setInitialConfiguration,
  setInitialConfigurationNew
} from "./utils";

const {
  mxEvent,
  // mxGraph,
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
    mxEvent.disableContextMenu(containerRef.current);
    if (!graph) {
      setGraph(new mxGraph(containerRef.current));
    }
    // Adds cells to the model in a single step
    if (graph) {
      // setInitialConfiguration(graph, toolbarRef);
      setInitialConfigurationNew(graph, toolbarRef);

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

  const renderColorChange = (type, content) => {
    if (!selected || !selected.style) {
      return null;
    }
    return (
      <div
        className={"button-color-change"}
        onClick={() => {
          setColorPickerVisible(!colorPickerVisible);
          setColorPickerType(type);
        }}
        style={{
          backgroundColor: getStyleByKey(selected.style, type)
        }}
      >
        {content}
      </div>
    );
  };

  const updateCellColor = (type, color) => {
    graph.setCellStyles(type, color.hex);
  };

  const renderColorPicker = () =>
    colorPickerVisible &&
    selected &&
    selected.style && (
      <div>
        <div className="toolbar-separator" />
        <CompactPicker
          color={getStyleByKey(selected.style, "fillColor")}
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
          {renderColorChange("fillColor")}
          {renderColorChange("fontColor", "T")}
          {renderColorChange("strokeColor", "|")}
        </div>
        {renderColorPicker()}
      </div>
      <div ref={containerRef} className="mxgraph-drawing-container" />
    </div>
  );
}
