import React from "react";

const Canvas = React.memo(
  ({ _3D_render }) => {
    return (
      <div
        id="threejs_holder"
        style={{ display: _3D_render ? "block" : "none" }}
      />
    );
  },
  (p,c) => p._3D_render === c._3D_render
);

export default Canvas;
