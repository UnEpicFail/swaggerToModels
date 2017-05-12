const mustache = require('mustache');
const mkdirp = require('mkdirp');
const fs = require('fs')

const modelTpl = `{{=<% %>=}}
/**
 * title: <%info.title%>
 * version: <%info.version%>
 */
<%#_models%>export { <%.%> } from './<%.%>';\n<%/_models%>`;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

let ParsedData = function(definitionName, definition){
    this.imports = {};
    this.extend = '';
    this.description = definition.description;
    this.definitionName = definitionName;
    this.properties = []
}

ParsedData.prototype.fillProperties = function(){
    let that = this;
    return function(t, render) {
        let text = ''
        for(let i in that.properties){
            if (that.properties[i].type.indexOf('[]') >= 0){
                text+='\t\tthis.' + that.properties[i].name + ' = []\n';
                text+='\t\tif(json["'+that.properties[i].name+'"]){\n';
                if (
                    that.properties[i].type === 'number' ||
                    that.properties[i].type === 'boolean' ||
                    that.properties[i].type === 'string'
                    ) {
                    text+='\t\t\tfor (let i in json["'+that.properties[i].name+'"]){\n\t\t\t\tthis.' + that.properties[i].name+'.push(' + 'json["'+that.properties[i].name+'"][i] || null)\n\t\t\t}\n'
                } else {
                    
                    text+='\t\t\tfor (let i in json["'+that.properties[i].name+'"]){\n\t\t\t\tthis.' + that.properties[i].name+'.push(new ' + that.properties[i].type.replace('[]','') + '(' + 'json["'+that.properties[i].name+'"][i]))\n\t\t\t}\n'
                }
                text+='\t\t}\n'
            }else{
                if (
                    that.properties[i].type === 'number' ||
                    that.properties[i].type === 'boolean' ||
                    that.properties[i].type === 'string'
                    ) {
                    text+='\t\tthis.' + that.properties[i].name + ' = ' + 'json["'+that.properties[i].name+'"] || null;\n';
                } else {
                    text+='\t\tthis.' + that.properties[i].name + ' = new ' + that.properties[i].type + '(' + 'json["'+that.properties[i].name+'"]);\n';
                }
            }
        }
        return text
    }
}

ParsedData.prototype.addImports = function(name, from) {
    this.imports[name] = from;
}

ParsedData.prototype.getImports = function() {
    let that = this;
    return function(t, render) {
        let text = '';
        for (let i in that.imports) {
            text += "import { "+i+" } from '"+that.imports[i]+"';\n"
        }

        return render(text)
    }
}

ParsedData.prototype.addExtends = function(allOf) {
    let that = this
    allOf.forEach(function(item){
        if (item['$ref']) {
            that.extend = that.getTypeFromRef(item['$ref'])
        } else if (item.properties) {
            that.addProperties(item.properties)
        }
    })
}

ParsedData.prototype.addProperties = function(properties) {
    for (let i in properties) {
        if (properties.hasOwnProperty(i)){
            this.properties.push({
                name: i,
                type: this.getType(properties[i]),
                description: properties[i].description
            })
        }
    }
}

ParsedData.prototype.getTypeFromRef = function (ref) {
    let fileName = ref.split('#')[0].split('.')[0]
    let klassName = capitalizeFirstLetter(ref.split('#')[1].split('/').pop())
    if (fileName) {
        this.addImports(klassName, '../'+fileName+'/'+klassName)
        return klassName
    } else {
        if (klassName !== this.definitionName)
            this.addImports(klassName, './'+klassName)
        return klassName
    }
}

ParsedData.prototype.getJSType = function (format, items) {
     switch (format) {
        case 'number':
        case 'integer':
        case 'long':
        case 'float':
        case 'double':
            return 'number';
        case 'bolean':
            return 'bolean';
        case 'array':
            return ((items['$ref'])?this.getTypeFromRef(items['$ref']):this.getJSType(items.type))+'[]';
        case 'object':
            return '{}';
        default:
            return 'string';
     }
}

ParsedData.prototype.getType = function(propertie) {
    if (propertie.type) {
        return this.getJSType ((propertie.format || propertie.type), propertie.items)
    } else if (propertie['$ref']) {
        return this.getTypeFromRef(propertie['$ref'])   
    }
}

function getData(definitionName, definition) {
    let data = new ParsedData(definitionName, definition)
    if (definition.allOf) {
        data.addExtends(definition.allOf)
    } else if (definition.properties) {
        data.addProperties(definition.properties) 
    }
    
    return data;
}

function parse(json, output, fileName) {
    if (!json.definitions){
        console.error('Error: no definition properties')
        return false;
    }
    let _output = output + '/' + fileName;
    mkdirp(_output, function() {
        let _models = []
        for (let i in json.definitions) {
            let data = getData(i, json.definitions[i]);

            if (!data) {
                console.error('Error: can\'t get data from json')
                return false;
            }

            let installedfolder = __dirname.split('/')
            installedfolder.pop()
            let tpl = fs.readFileSync(installedfolder.join('/')+'/tpl/model.mustache', 'utf8')
          
            _models.push(i)
            fs.writeFile(_output +'/'+i+'.ts', mustache.render(tpl, data), { flag: 'w' }, function(res){
               console.log('File write '+_output +'/'+i+'.ts');
            })
        }

        fs.writeFile(_output +'/_models.ts', mustache.render(modelTpl, {_models:_models, info: json.info}), { flag: 'w' }, function(res){
            console.log('File write '+_output +'/_models.ts');
        })
   })
    
}

module.exports.parse = parse