#!/bin/bash

# check if one argument is given
if [ $# -eq 0 ]
  then
    echo "No arguments supplied: please add the json-file you want to use!";
    exit;
fi

effects=( $(jq -r ".effects | keys[]" $1;) )
printf '%s\n' "${test[@]}"

# create for each effect a ssml-file
for effect in ${effects[@]} ; do 
    echo "<speak>" > $effect.ssml
    jq -r ".effects.$effect.effects[0][4]" $1 >> $effect.ssml
    echo "</speak>" >> $effect.ssml
done



