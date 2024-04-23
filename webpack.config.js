const { VueLoaderPlugin } = require("vue-loader");
const path = require("path");
const webpack = require('webpack')

module.exports = {
    mode: 'development',
    entry: 
    {
        bundle: ['./src/main.js', 'babel-polyfill']
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.js$/,
                loader: "babel-loader"
            },
            {
                test: /\.svg$/,
                loader: "file-loader"
            },
            {
            test: /\.css$/,
            use: ["vue-style-loader", "css-loader"]
            }
        ]
    },
    output : {
        library: 'open_uml',
        filename: 'openuml.js',
        path: path.join(__dirname, "dist")
    },
    plugins : [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__: false,
            __VUE_PROD_DEVTOOLS__: false,
        }),
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist'),
        }
    },
}
