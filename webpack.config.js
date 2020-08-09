const path = require('path');

module.exports = {
  entry: "./lib/index.ts",
  output: {
    library: 'passportKerberosNegotiation',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'build'),
    filename: "index.js",
    globalObject: 'this'
  },
  mode: "production",
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".json"]
  },
  target: "node",
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
      {
        test: /\.ts?$/,
        use: ["ts-loader"],
        exclude: /node_modules/
      }
    ]
  },
  externals: [
    'kerberos'
  ],
  optimization: {
    minimize: true
  }
};
