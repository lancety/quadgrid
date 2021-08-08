const path = require('path');
const webpack = require('webpack');

const ROOT = path.resolve( __dirname, 'src' );
const DESTINATION = path.resolve( __dirname, 'demo' );

module.exports = {
    context: ROOT,

    entry: {
        'demo': './demo.ts',
        'demoNode': '/demoNode.ts',
        'lib': './lib.ts'
    },

    output: {
        filename: '[name].bundle.js',
        path: DESTINATION
    },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },

    module: {
        rules: [
            /****************
             * LOADERS
             *****************/
            {
                test: /\.ts$/,
                exclude: [ /node_modules/ ],
                use: 'ts-loader'
            }
        ]
    },

    devtool: 'source-map',
    devServer: {}
};
