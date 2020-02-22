import { default as MxGraph } from "mxgraph";
import { addToolbarItem, getStyleStringByObj } from "./";

const {
  mxEvent,
  mxRubberband,
  mxUtils,
  mxToolbar,
  mxClient,
  mxDivResizer,
  mxKeyHandler,
  mxGeometry,
  mxCell,
  mxEllipse,
  mxConstants,
  mxPerimeter,
  mxCellRenderer,
  mxText
} = MxGraph();

export default function initToolbar(graph, tbContainer) {
  // Creates new toolbar without event processing
  var toolbar = new mxToolbar(tbContainer);
  toolbar.enabled = false;

  // Workaround for Internet Explorer ignoring certain styles
  if (mxClient.IS_QUIRKS) {
    document.body.style.overflow = "hidden";
    new mxDivResizer(tbContainer);
  }

  // Enables new connections in the graph
  graph.setConnectable(true);
  graph.setMultigraph(false);

  // Stops editing on enter or escape keypress
  var keyHandler = new mxKeyHandler(graph);
  var rubberband = new mxRubberband(graph);

  var addVertex = function(icon, w, h, style, value = null) {
    var vertex = new mxCell(null, new mxGeometry(0, 0, w, h), style);
    if (value) {
      vertex.value = value;
    }
    vertex.setVertex(true);

    var img = addToolbarItem(graph, toolbar, vertex, icon);
    img.enabled = true;

    graph.getSelectionModel().addListener(mxEvent.CHANGE, function() {
      var tmp = graph.isSelectionEmpty();
      mxUtils.setOpacity(img, tmp ? 100 : 20);
      img.enabled = tmp;
    });
  };

  var baseStyle = { ...graph.getStylesheet().getDefaultVertexStyle() };

  addVertex(
    "images/rectangle.gif",
    100,
    40,
    getStyleStringByObj({
      ...baseStyle
    })
  );
  addVertex(
    "images/ellipse.gif",
    40,
    40,
    getStyleStringByObj({
      ...baseStyle,
      [mxConstants.STYLE_SHAPE]: "ellipse"
    })
  );
  // console.log(mxText.getTextCss());
  addVertex(
    "images/text.gif",
    0,
    0,
    "text;html=1;align=center;verticalAlign=middle;resizable=0;points=[];",
    "Text"
  );
}
