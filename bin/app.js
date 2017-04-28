#!/usr/bin/env node

const generator = require('../lib/index.js')

if (process.argv.length === 2) {
    console.log(`
        -h for help
    `)
    return;
}


let path = '';
let output = '';

process.argv.forEach(function(val, index) {
        if(val === '-h'){
            console.log(`
                -p <path_to_swagger.yaml>
                -o <path_to_resut_output>
            `);
        } else if (val === '-p') {
            if (process.argv[index+1] !== '-o') {
                path = process.argv[index+1];
            }
        } else if (val === '-o') {
            if (process.argv[index+1] !== '-p') {
                output = process.argv[index+1];
            }
        } 
}, this);

if (path.length == 0){
    console.error('Error: No path')
    return;
}

if (output.length == 0){
    console.error('Error: No output')
    return;
}

console.log(`
from '` + path + `'
to '` + output + `'
`)

generator.generate(path, output)