const fs = require('fs');
const parser = require('./parser');
const js_yaml = require('js-yaml');

function generate(path, output) {
    if (fs.lstatSync(path).isDirectory()){
        fs.readdir(path, function(err, files) {
            if(err){
                console.error('Error: '+path+' not a file and not a exist directory\n\r'+err)
                return false;
            }
            files.forEach(function(file){
                if (file.split('.').pop().toLowerCase() !== 'yml' && file.split('.').pop().toLowerCase() !== 'yaml')
                    return
                generate(path+file, output)
            })
        })
    } else if (fs.lstatSync(path).isFile()) {
        let file = fs.readFileSync(path, 'utf8');
        if (!file){
            console.error('Error: Readed file ' + path + 'not valid');
            return;
        }

        try {
            let json = js_yaml.safeLoad(file);
            console.log('File '+ path +' parsed successfully')
            parser.parse(json, output, path.split('/').pop().split('.')[0]);
        } catch(e) {
            console.error('Error: Exeption when try parse ' + path + ' to JSON')
            console.error(e)
            return false;
        }
    } else {
        console.error('Error: '+path+' not a file or directory')
        return false;
    }
}

module.exports.generate = generate;
