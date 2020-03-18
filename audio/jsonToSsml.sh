#!/bin/bash

# check if one argument is given
if [ $# -eq 0 ]
  then
    echo "No arguments supplied: please add the json-file you want to use!";
    exit;
fi

# save all nodes to arr
node_list=( $(jq -r '"\(keys[])"' $1;) )
printf '%s\n' "${node_list[@]}"

# create for each node text a ssml-file
for node in ${node_list[@]} ; do 
    echo "<speak>" > $node.ssml
    jq -r ".$node.text" test.json >> $node.ssml
    echo "</speak>" >> $node.ssml
done
