const { VueLoaderPlugin } = require("vue-loader");
const path = require("path");

module.exports = {
    mode: 'development',
    entry: 
    {
        bundle: ['./src/main.js']
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
        new VueLoaderPlugin()
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist'),
        }
    }
}