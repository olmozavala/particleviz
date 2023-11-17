module.exports = {
  module: {
    rules: [
      {
        test: /\.(glsl|vert|frag)$/,
        use: "raw-loader",
        type:"string"
      },
    ],
  },
};
