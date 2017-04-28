# swaggerToModels
generate angular2+ .ts model from swagger contracts

model_generator -h

model_generator -p ~/projects/edukit/swagger/ -o ~/models/  

## How it work

U need one, or more yml files with valid swagger contract inside, this program generate model files from them.

- -p - location to swagger files. Here U can specify single file or folder with such files, all yml files in folder will be parsed
- -o - place where generator will storage generated files. One folder from every parsed yml file will be created and one ts file for every definitions in that yml files wil be placed in this file.
   