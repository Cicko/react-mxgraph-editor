import * as React from "react";
import "./styles.css";
import DiagramEditor from "./components/DiagramEditor/DiagramEditor";
import sampleJsonData from "./sampleJsonData.json";

export default function App() {
  const [data, setData] = React.useState(sampleJsonData);
  const onChange = evt => {
    console.log("on Change");
  };
  const onSelected = evt => {
    console.log("selected");
  };
  const onElementAdd = evt => {
    console.log("On element add");
  };
  const onDragEnd = evt => {
    console.log("On Drag end");
  };

  return (
    <div className="App">
      <div className="container">
        <DiagramEditor
          data={data}
          onChange={onChange}
          onSelected={onSelected}
          onElementAdd={onElementAdd}
          onDragEnd={onDragEnd}
        />
      </div>
    </div>
  );
}
