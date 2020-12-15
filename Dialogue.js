// jEdit :folding=indent: :collapseFolds=1: :noTabs=true:

"use strict";
if( locandy === undefined ) var locandy={};
if( locandy.player === undefined ) locandy.player={};
if( locandy.player.plugins === undefined ) locandy.player.plugins={};

var DEBUG_dialogue = null;

/** @class locandy.player.plugins.Dialogue
    @extends locandy.player.plugins.Abstract
	*/

/** @constructor {public} Dialogue @inheritdesc */
locandy.player.plugins.Dialogue = function(spot, pluginModel)
    {
    	locandy.player.plugins.Abstract.apply(this,arguments);

        // inject localizer service
        this.localizerService = locandy.player.playerMainSingleton.injector.get("localizerService");

        DEBUG_dialogue = this;
        this.imageWidth = "150px";

        // dialogue properties
        this.dialogue = pluginModel.dialogue;       
        this.playingSound = null;

        // last uploaded image id - for upload verification
        this.lastUploadedImageId = "";
        
        // This will fire the first time the PLAYER plugin's DOM is rendered (also works for editor dom)
        this.isRendered = false;
        var me = this;
        this._unregisterRenderedF=this.spot.quest.scope.$on("plugin_element_rendered",function(event,element)
        {

            // avoid mismatching of plugin/element!
            if( element.id !== me.id ) return;

            if(me.isRendered === false) // play audio on first rendering of dialogue
            {
                setTimeout(function(){ me.setActiveDialogue("START"); me.spot.quest.angularApply(); }, 100);
                    // delay autoplay a bit until scope settles, user has some time
                me.isRendered = true;
            }
            
            var scope = angular.element(element).scope();
            // listen to $destroy from scope for getting notification
            // when plugin element's dom gets removed from screen, as 
            // we have to stop the depending media player instance then!
            // THIS FIRES 2 TIMES also on creation of the scope!
            scope.$on('$destroy',function(){ me.stopAudio(); });
        });
        
        this.watchStateId = "activeDialogueNode"; // Could be set dynamically in Editor or hardwired
        this.activateOrChangeWatch();
        
        this.activeDialogueId = "START";
        this.nodeVisited = {};
    };

locandy.utilities.inherit(locandy.player.plugins.Dialogue,locandy.player.plugins.Abstract);
locandy.player.plugins.registerPlugin("Dialogue",locandy.player.plugins.Dialogue);

/** @prop {static} restrictedTo @inheritdesc */
locandy.player.plugins.Dialogue.restrictedTo = "contents";

/** @prop {static} groupLabel @inheritdesc */
locandy.player.plugins.Dialogue.groupLabel = "Tasks";

/** @prop {static} groupTag @inheritdesc */
locandy.player.plugins.Dialogue.groupTag = "editor_plugin_label_group_tasks";

/** @function {static} getSkeleton returns a fresh puginModel to be used to construct a new Dialogue inastance. @inheritdesc */
locandy.player.plugins.Dialogue.getSkeleton = function()
    {
        return {
            "showIf":[],
            "section":"contents",
            "type":"Dialogue",
	        "dialogue": {
                "START":{
                    "text":"Hello creator! What should I say now?", 
                    "audioId":null, 
                    "imageId":null,
                    "imageWidth":null,
                    "answers":[]
                }
            },
            "resources": {}
        };
    };

/** @function {static} getSkeleton @inheritdesc */
locandy.player.plugins.Dialogue.writeEffectToModel = function(effectModel, effectId)
    {
        if( effectModel.hasOwnProperty('effectId')){
            effectModel.effectId = effectId;
        }
    };

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.addAnswerToModel = function(pluginModel, editorActiveDialogueId)
    {
        pluginModel.dialogue[editorActiveDialogueId].answers.push({
            "text": "",
            "effectId": null,
            "nextId": null,
        });
    };

/** @function {static} importJsonDialogueToModel */
locandy.player.plugins.Dialogue.importJsonDialogueToModel = function(pluginModel, inputs)
{
    try
    {
        if(inputs.importJsonDialogue != "") { // empty value
            pluginModel.dialogue = angular.fromJson(inputs.importJsonDialogue);
        }
        inputs.importJsonDialogue = "";
    }
    catch(e)
    {
        alert("Dialogue Parese Error in JSON Spec!\nPlease delete JSON or fix it!\n" + e);
    }
};

/** @function {static} exportJsonDialogueToClipboard */
locandy.player.plugins.Dialogue.exportJsonDialogueToClipboard = function(pluginModel)
    {
        var copyElement = document.createElement('textarea');
        copyElement.value = JSON.stringify(pluginModel.dialogue, null, 2);
        copyElement.setAttribute('readonly', '');
        copyElement.style = {position: 'absolute', left: '-9999px'};
        document.body.appendChild(copyElement);
        copyElement.select();
        document.execCommand('copy');
        document.body.removeChild(copyElement);
    };

/** @function {static} addDialogueToModel */
locandy.player.plugins.Dialogue.addDialogueToModel = function(pluginModel, inputs, editorScope)
    {
        // check if key is already used
        if (!(inputs.newDialogueId in pluginModel.dialogue)){
            pluginModel.dialogue[inputs.newDialogueId] = {
                "text": null,
                "audioId": null,
                "imageId":null,
                "imageWidth":null,
                "answers": []};
                
            editorScope.editorActiveDialogueId = inputs.newDialogueId;
            inputs.newDialogueId = "";
        } else {
            alert("ID is alredy used. Please choose another, or delete the section first.");
        }
    };  

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.removeAnswerFromModel = function(pluginModel, answer, editorActiveDialogueId)
    {
        if(pluginModel.dialogue[editorActiveDialogueId].hasOwnProperty("answers"))
        {
            if( pluginModel.dialogue[editorActiveDialogueId].answers instanceof Array )
                locandy.utilities.removeArrayItem(pluginModel.dialogue[editorActiveDialogueId].answers,answer);
        }        
    };

/** @function {public void} moveAnswerUp */
locandy.player.plugins.Dialogue.moveAnswerUp = function(pluginModel, editorActiveDialogueId, answer)
    {
        var index = pluginModel.dialogue[editorActiveDialogueId].answers.indexOf(answer);
        console.log("index:" + index);
        locandy.utilities.moveArrayItem(pluginModel.dialogue[editorActiveDialogueId].answers, index, index-1 );
    };

/** @function {static} writeRescourceToModel @inheritdesc called by LocationController::updatePluginResource() (via fine-uploader directive) it consumes pluginModel.type to resolve this function */
locandy.player.plugins.Dialogue.writeRescourceToModel = function(specialStruct, serverResponse)
    {
        var newId = specialStruct.rid;
        
        // add extension to separate images and audios with the same name
        var ext="";
        switch(serverResponse.mimetype)
        {
            case "image/jpeg": newId += ".jpg"; break;
            case "image/png": newId += ".png"; break;
            case "image/gif": newId += ".gif"; break;
            case "audio/mp3": newId += ".mp3"; break;
            case "audio/mpeg": newId += ".mp3"; break;
        };
        
        // sanity check ... we cannot replace a sound of the same name with an image, and ...
        // a slow upload may hit the same id if the user retries
        if(specialStruct.pluginModel.resources !== undefined && specialStruct.pluginModel.resources[newId] !== undefined)
        {
            alert("Upload: a resource with the name " + newId + " already exists, delete it first to overwrite!");
            return;
        }
        
        locandy.player.plugins.Abstract.writeRescourceToModel(specialStruct.pluginModel, serverResponse, newId+ext);
        specialStruct.inputs.newImageId = "";
        specialStruct.inputs.newAudioId = "";
    };

/** @prop {static} resourceClipboad copy and paste an image or audio between dialogue instances */
locandy.player.plugins.Dialogue.resourceClipboad = null;

/** @function {static} copyResource copy an image or audio between dialogue instances */
locandy.player.plugins.Dialogue.copyResource = function(pluginModel, resourceId)
    {
        locandy.player.plugins.Dialogue.resourceClipboad = null;
        var resourceMap = pluginModel.resources[resourceId];
        if(resourceMap)
            locandy.player.plugins.Dialogue.resourceClipboad = [ resourceId, {'uuid':resourceMap.uuid, 'keyid':resourceMap.keyid, 'mimetype':resourceMap.mimetype}];
        else
            alert("Resource Clipboard: Nothing to copy!");
    };
    
/** @function {static} pasteResource copy an image or audio between dialogue instances */
locandy.player.plugins.Dialogue.pasteResource = function(pluginModel)
    {
        var rc = locandy.player.plugins.Dialogue.resourceClipboad;
        
        if(rc && rc[0] && rc[1].mimetype)
        {
            if(pluginModel.resources[rc[0]] !== undefined)
                alert("Resource Clipboard:  a resource with the name " + rc[0] + " already exists, delete it first to overwrite!");
            else
                locandy.player.plugins.Abstract.writeRescourceToModel(pluginModel, rc[1], rc[0]);
        }
        else
            alert("Resource Clipboard: Nothing to paste!");
    };
    
/** @function {static} removeResourceFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeResourceFromModel = function(pluginModel, removeResourceId)
    {
        if(pluginModel.resources === undefined || pluginModel.resources === null)
        {
            pluginModel.resources = {};
        }

        delete pluginModel.resources[removeResourceId];
    }    

/** @function {static} removeImageFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeImageFromModel = function(pluginModel, removeImageId){
    // if image-resource is used in dialogue set reference to null
    for (var key in pluginModel.dialogue){
        if (pluginModel.dialogue[key].imageId === removeImageId){
            pluginModel.dialogue[key].imageId = null;
        }
    }

    locandy.player.plugins.Dialogue.removeResourceFromModel(pluginModel, removeImageId);
}

/** @function {static} removeAudioFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeAudioFromModel = function(pluginModel, removeAudioId){
    // if audio-resource is used in dialogue set reference to null
    for (var key in pluginModel.dialogue){
        if (pluginModel.dialogue[key].audioId === removeAudioId){
            pluginModel.dialogue[key].audioId = null;
        }
    }

    locandy.player.plugins.Dialogue.removeResourceFromModel(pluginModel, removeAudioId);
}

/** @function {static} removeDialogueFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeDialogueFromModel = function(pluginModel, editorScope)
    {
        if(pluginModel.dialogue === undefined || pluginModel.dialogue === null)
        {
            pluginModel.dialogue = {};
        }

        // set answer references to null if dialogue is used in nextId of any answer
        for (var key in pluginModel.dialogue){
            for (var answer in pluginModel.dialogue[key].answers){
                if (pluginModel.dialogue[key].answers[answer].nextId === pluginModel.removeDialogueId){
                    pluginModel.dialogue[key].answers[answer].nextId = null;
                }
            }
        }
        
        if (!(editorScope.editorActiveDialogueId == "START")){
            delete pluginModel.dialogue[editorScope.editorActiveDialogueId];
            editorScope.editorActiveDialogueId = "START";
        }
        
    }
    
/** @function {static} setAudioToNull @inheritdesc */
locandy.player.plugins.Dialogue.setAudioToNull = function(pluginModel, editorActiveDialogueId)
    {       
        if(pluginModel.dialogue[editorActiveDialogueId].audioId === ""){
            pluginModel.dialogue[editorActiveDialogueId].audioId = null;
        }
    }

/** @function {static} setNextIdToNull @inheritdesc */
locandy.player.plugins.Dialogue.setNextIdToNull = function(answer)
    {       
        if(answer.nextid === undefined){
            answer.nextId = null;
        }
    }

/** @function {static} setImageToNull @inheritdesc */
locandy.player.plugins.Dialogue.setImageToNull = function(pluginModel, editorActiveDialogueId)
    {       
        if(pluginModel.dialogue[editorActiveDialogueId].imageId === undefined){
            pluginModel.dialogue[editorActiveDialogueId].imageId = null;
        }
    };
    
/** @function {static} HTML Helper function */
locandy.player.plugins.Dialogue.autoresizeTextArea = function(event, htmlElement)
    {
        htmlElement.style.height = htmlElement.scrollHeight+"px";
    };

/** @function {static} getTemplate @inheritdesc */    
locandy.player.plugins.Dialogue.getTemplate = function(scope)
    {
        return '<div \
                    id="{{plugin.id}}" \
                    data-plugin-element-rendered \
                    style="overflow:hidden" \
                    data-ng-if="plugin.isHidden()">\
                    <div style="float:left; margin-right: 10px" ng-style="{\'width\':plugin.imageWidth}" \
                        ng-show="plugin.dialogue[plugin.activeDialogueId].imageId "= null"> \
                        <div class="image"\
                            data-ng-show="plugin.resources[plugin.dialogue[plugin.activeDialogueId].imageId]"\
                            data-ng-class="{visible:plugin.resources[plugin.dialogue[plugin.activeDialogueId].imageId]}"> \
                            <div class="thumbnail" style="margin-bottom:2px"> \
                                <img data-ng-src="{{plugin.resources[plugin.dialogue[plugin.activeDialogueId].imageId].uuid}}"/> \
                            </div> \
                        </div> \
                    </div> \
                    <div> \
                        <div class="btn" style="float:right; margin: 0px 0px 10px 10px;" ng-show="plugin.dialogue[plugin.activeDialogueId].audioId != null"> \
                            <a href="javascript:void(0);" \
                                data-button-handler="plugin.executeSound(plugin.dialogue[plugin.activeDialogueId].audioId)"> \
                                <span class="icon-play4"></span>\
                            </a> \
                        </div> \
                        <div class="question"> \
                            <div id="agentText" data-compile-markdown="plugin.textToDisplay"></div> \
                            <div style="float:right; width: auto; margin-bottom:3px;" data-ng-if="plugin.moreLessOrHidden>0"> \
                                <button class="btn" id="moreLessBtn" style="width:100%" data-button-handler="plugin.moreLessTextButtonPressed()"><span ng-class="{ \'icon-arrow-down2\': plugin.moreLessOrHidden == 1, \'icon-arrow-up2\': plugin.moreLessOrHidden == 2}"></span></button> \
                            </div> \
                        </div> \
                    </div> \
                    <div> \
                        <div class="answers" style="padding-top:5px"> \
                            <a href="javascript:void(0);" \
                                data-ng-show="answer.text"  \
                                data-ng-repeat="answer in plugin.dialogue[plugin.activeDialogueId].answers" \
                                data-button-handler="plugin.executeAnswer(answer)"> \
                            <span class="label-for-icon">{{answer.text}}</span> \
                            </a> \
                        </div> \
                    </div> \
                </div>';
    };

/** @function {static} getEditTemplate @inheritdesc

    Editor scope temporary variables declared in inputs in this template.
    The editor-scope isFinite this in the template context and can be passed from the template to a function that needs to update the sate of the scope. 
    inputs = {
        importJsonDialogue = "";
        newDialogueId = "";
        newImageId = "";
        newAudioId = "";
    }
        // id to remove attribute from model
        removeImageId = "";
        removeAudioId = "";
    */
locandy.player.plugins.Dialogue.getEditTemplate = function(scope)
    {
        // console.log(scope); defined: editorActiveDialogueId: "START" but pluginModel is not; hmmm
        
        // Fine Uploader Directive
        // Here we need to pass an extra parameter throught fine uploader. This is really tricky!
        // So we create a pseudo puginModel (LocationController::updatePluginResource consumes pluginModel.type !) 
        // with the extra parameter ... This is the only correct way to deal with async upload.
        // data-fine-uploader-callback-pass-through="{ \'pluginModel\':pluginModel, \'type\':pluginModel.type, \'rid\':newAudioId }"
        
        return '<div> \
                    <div class="form-group" data-ng-init="editorActiveDialogueId=\'START\'"> \
                        <select data-ng-model="editorActiveDialogueId" class="form-control full-border ng-pristine ng-valid ng-touched" > \
                            <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                        </select> \
                    </div> \
                    <div style="overflow:hidden"> \
                        <div> \
                            <textarea \
                                onfocus="locandy.player.plugins.Dialogue.autoresizeTextArea(event, this)"\
                                onscroll="locandy.player.plugins.Dialogue.autoresizeTextArea(event, this)"\
                                style="margin-bottom:5px min-height:96px" \
                                class="form-control question" \
                                data-ng-model="pluginModel.dialogue[editorActiveDialogueId].text" \
                                placeholder="{{\'Text Agent\'|i18n:\'editor_plugin_dialogue_agent_text\'}}"/> \
                        </div> \
                        <div> \
                            <div style="float:left; width:30%; min-height:90px;"> \
                                <div class="image" data-ng-show="pluginModel.resources[pluginModel.dialogue[editorActiveDialogueId].imageId]"> \
                                    <div class="thumbnail"> \
                                        <img data-ng-src="{{pluginModel.resources[pluginModel.dialogue[editorActiveDialogueId].imageId].uuid}}"/> \
                                    </div> \
                                </div> \
                            </div> \
                            <div style="margin-left:35%;"> \
                                <div style="overflow: hidden"> \
                                    <div style="width:50%; float:left; margin-top:3px;"> \
                                        <span class="label-for-icon">{{"Image Id"|i18n:"editor_plugin_dialogue_image_select"}}</span> \
                                    </div> \
                                    <div style="width:50%; float:left"> \
                                        <select required data-ng-model="pluginModel.dialogue[editorActiveDialogueId].imageId" \
                                                class="form-control full-border ng-pristine" \
                                                onchange="global.locandy.player.plugins.Dialogue.setImageToNull(pluginModel, editorActiveDialogueId)"> \
                                            <option data-ng-repeat="(key, value) in pluginModel.resources"  ng-if="value.mimetype==\'image/png\' || value.mimetype==\'image/jpeg\' || value.mimetype==\'image/gif\'">{{key}}</option> \
                                            <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                        </select> \
                                    </div> \
                                </div> \
                                <div style="overflow: hidden; margin-top:10px;"> \
                                    <div style="float:left; width:50%"> \
                                        <span class="label-for-icon">{{"Image Width"|i18n:"editor_plugin_dialogue_image_height"}}</span> \
                                    </div> \
                                    <div class="form-group" style="float:right; width:50%"> \
                                        <input type="number" \
                                            class="form-control question" \
                                            data-ng-model="pluginModel.dialogue[editorActiveDialogueId].imageWidth" \
                                            min="80" max="280" \
                                            placeholder="150"/> \
                                    </div> \
                                </div> \
                                <div style="overflow: hidden; margin-top: 10px"> \
                                    <div style="width:50%; float:left;"> \
                                        <span class="label-for-icon">{{"Audio Id"|i18n:"editor_plugin_dialogue_audio_select"}}</span> \
                                    </div> \
                                    <div style="width:50%; float:left"> \
                                        <select data-ng-model="pluginModel.dialogue[editorActiveDialogueId].audioId"\
                                                class="form-control full-border ng-pristine"  \
                                                onchange="global.locandy.player.plugins.Dialogue.setAudioToNull(pluginModel, editorActiveDialogueId)">\
                                                <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'audio/mp3\' || value.mimetype==\'audio/mpeg\'">{{key}}</option> \
                                                <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                        </select> \
                                    </div> \
                                </div> \
                            </div> \
                        </div> \
                    </div> \
                    <div class="alert alert-info" \
                            data-ng-if="pluginModel.dialogue[editorActiveDialogueId].answers.length===0"> \
                            {{"You\'ve not provided any answers for this dialogue yet."|i18n:"editor_plugin_dialogue_no_answers"}} \
                    </div>\
                    <div \
                        class="answer form-group row small" \
                        data-ng-if="pluginModel.dialogue[editorActiveDialogueId].answers.length > 0" \
                        data-ng-repeat="answer in pluginModel.dialogue[editorActiveDialogueId].answers"> \
                        <div class="form-group"> \
                            <input  type="text" \
                                    class="form-control question" \
                                    data-ng-model="answer.text" \
                                    data-focus-element="!answer.text" \
                                    placeholder="{{\'Answer #%s\'|i18nP:\'editor_plugin_dialogue_label_answer\':($index+1)}}"> \
                        </div> \
                        <div style="margin-left:5%"> \
                            <div style="float: left; margin-top:5px;"> \
                                <span class="icon-arrow-right17"></span> \
                            </div> \
                            <div style="float:left; padding-right:10px"> \
                                <select data-ng-model="answer.nextId" class="form-control full-border ng-pristine ng-valid ng-touched" \
                                        onchange="document.getElementById(\'btnSetNextIdNull\').click()"> \
                                    <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                                    <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                </select> \
                            </div> \
                            <!--<button style="display: none" id="btnSetNextIdNull" data-button-handler="global.locandy.player.plugins.Dialogue.setNextIdToNull(answer)"></button>-->  \
                            <div style="float:left; margin-left: 5%;"> \
                                <span \
                                    class="effect" \
                                    data-ng-init="popOverConfig={ \
                                        callbackPassThrough:answer, \
                                        selectedOption:answer.effectId, \
                                        updatePluginStaticMethodName:global.locandy.player.plugins.Dialogue.writeEffectToModel \
                                    }" \
                                    data-ng-include="effectPopOverPartialUrl">\
                                </span> \
                                <small class="connection" data-ng-if="!answer.effectId"> \
                                    <span class="icon-notification2 reusable-color-warning"></span> \
                                    <span class="label-for-icon">{{"No effect connected"|i18n:"editor_plugin_dialogue_effect_not_connected"}}</span> \
                                </small> \
                                <small class="connection" data-ng-if="answer.effectId && mrmResource.effects[answer.effectId]"> \
                                    <span class="icon-checkmark reusable-color-success"></span> \
                                    <span class="label-for-icon"><button class="btn btn-fancy btn-success" data-button-handler="showEffectModal(answer.effectId)">{{answer.effectId}}</button></span> \
                                </small> \
                                <small class="connection" data-ng-if="answer.effectId && !mrmResource.effects[answer.effectId]"> \
                                    <span class="icon-notification2 reusable-color-danger"></span> \
                                    <span class="label-for-icon">{{"Connection corrupted"|i18n:"editor_plugin_dialogue_effect_not_connected_correctly"}}</span> \
                                </small> \
                            </div> \
                            <div style="float:right;"> \
                                <button \
                                    class="btn btn-fancy btn-medium btn-default" \
                                    data-ng-class="{\'disabled\':$first}" \
                                    data-button-handler="global.locandy.player.plugins.Dialogue.moveAnswerUp(pluginModel, editorActiveDialogueId, answer)">\
                                    <span class="icon-arrow-up5"></span> \
                                </button> \
                            </div> \
                            <div style="float:right; margin-right:3px;"> \
                                <button \
                                    class="btn btn-fancy btn-medium btn-default" \
                                    data-button-handler="global.locandy.player.plugins.Dialogue.removeAnswerFromModel(pluginModel, answer, editorActiveDialogueId)">\
                                    <span class="icon-minus-circle2 reusable-color-danger"></span>\
                                </button> \
                            </div> \
                        </div> \
                    </div> \
                    <button \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.addAnswerToModel(pluginModel, editorActiveDialogueId)"> \
                        <span class="icon-plus-circle2 reusable-color-success"></span> \
                        <span class="label-for-icon">{{"Add answer"|i18n:"editor_plugin_dialogue_answer_add"}}</span> \
                    </button>\
                    <button \
                        ng-disabled="editorActiveDialogueId == \'START\'" \
                        style="float:right" \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.removeDialogueFromModel(pluginModel, this)">\
                        <span class="label-for-icon">{{"Remove section "|i18n:"editor_plugin_dialogue_remove"}}</span> \
                        <span class="icon-minus-circle2 reusable-color-danger"></span>\
                    </button> \
                    <hr> \
                    <div> \
                        <div style="width:33%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add section:"|i18n:"editor_plugin_dialogue_add"}}</span> \
                        </div> \
                        <div style="float: left; width:33%; margin-right: 10px"> \
                            <input  type="text" \
                                id="newDialogueId" class="form-control" rows="1" style="float:left; width=100px" \
                                data-ng-model="inputs.newDialogueId" \
                                placeholder="{{\'New dialogue id\'|i18nP:\'editor_plugin_dialogue_new_id\'}}"/> \
                        </div> \
                        <div> \
                            <button \
                            ng-disabled="inputs.newDialogueId == null || inputs.newDialogueId == \'\'" \
                            class="btn btn-fancy btn-medium btn-default" \
                            data-button-handler="global.locandy.player.plugins.Dialogue.addDialogueToModel(pluginModel, inputs, this)">\
                            <span class="icon-plus-circle2 reusable-color-success"></span> \
                            <span class="label-for-icon">{{"Add"|i18n:"editor_plugin_dialogue_add_btn"}}</span> \
                            </button> \
                        </div> \
                    </div> \
                    <hr> \
                    <div style="overflow: hidden"> \
                        <div style="width:33%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add image:"|i18n:"editor_plugin_image_upload_add"}}</span> \
                        </div> \
                        <div style="float: left; width:33%; margin-right: 10px"> \
                            <input  type="text" \
                                id="newImageId" class="form-control" rows="1" style="float:left; width=100px" \
                                data-ng-model="inputs.newImageId" \
                                placeholder="{{\'Image id\'|i18nP:\'editor_plugin_image_upload_id\'}}"/> \
                        </div> \
                        <div \
                            data-fine-uploader \
                            data-omit-drop-zone \
                            data-omit-file-input \
                            data-fetch-url="uploadFetchUrl" \
                            data-fine-uploader-options="imagePluginUploadOptions" \
                            data-fine-uploader-callback-pass-through="{ \'pluginModel\':pluginModel, \'type\':pluginModel.type, \'rid\':inputs.newImageId, \'inputs\':inputs }" \
                            data-fine-uploader-callback-on-complete="updatePluginResource(fineUploaderCallbackPassThrough,responseJSON)"> \
                            <div class="form-group">\
                                <div \
                                    ng-disabled="readOnly || (pluginModel.resources[inputs.newImageId+\'.png\'] !== undefined) || (pluginModel.resources[inputs.newImageId+\'.jpg\'] !== undefined) || (pluginModel.resources[inputs.newImageId+\'.gif\'] !== undefined) || inputs.newImageId == null || inputs.newImageId == \'\'"\
                                    class="upload" \
                                    data-fine-uploader-file-input \
                                    data-is-multiple="imagePluginUploadOptions.multiple"> \
                                    <span class="label-for-icon">{{"Upload"|i18n:"editor_plugin_image_upload"}}</span> \
                                </div> \
                                <button \
                                    class="btn btn-fancy btn-medium btn-default" \
                                    data-button-handler="global.locandy.player.plugins.Dialogue.pasteResource(pluginModel)">\
                                    <span class="icon-copy"></span>\
                                </button> \
                            </div>\
                        </div> \
                    </div> \
                    <div> \
                        <div style="width:33%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Remove image:"|i18n:"editor_plugin_image_remove"}}</span> \
                        </div> \
                        <div style="float: left; width:33%; margin-right: 10px"> \
                            <select data-ng-model="removeImageId" class="form-control full-border ng-pristine"> \
                                <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'image/png\' || value.mimetype==\'image/jpeg\' || value.mimetype==\'image/gif\'">{{key}}</option> \
                            </select> \
                        </div> \
                        <div> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.removeImageFromModel(pluginModel, removeImageId)">\
                                <span class="icon-minus-circle2 reusable-color-danger"></span>\
                            </button> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.copyResource(pluginModel, removeImageId)">\
                                <span class="icon-copy"></span>\
                            </button> \
                        </div> \
                    </div> \
                    <hr> \
                    <div style="overflow: hidden"> \
                        <div style="width:33%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add sound:"|i18n:"editor_plugin_audio_upload_add"}}</span> \
                        </div> \
                        <div style="float: left; width:33%; margin-right: 10px"> \
                            <input  type="text" \
                                id="newAudioId" class="form-control" rows="1" style="float:left; width=100px" \
                                data-ng-model="inputs.newAudioId" \
                                placeholder="{{\'Audio id\'|i18nP:\'editor_plugin_audio_upload_id\'}}"/> \
                        </div> \
                        <div \
                            data-fine-uploader \
                            data-omit-drop-zone \
                            data-omit-file-input \
                            data-fetch-url="uploadFetchUrl" \
                            data-fine-uploader-options="audioPluginUploadOptions" \
                            data-fine-uploader-callback-pass-through="{ \'pluginModel\':pluginModel, \'type\':pluginModel.type, \'rid\':inputs.newAudioId, \'inputs\':inputs}" \
                            data-fine-uploader-callback-on-complete="updatePluginResource(fineUploaderCallbackPassThrough,responseJSON)"> \
                            <div class="form-group">\
                                <div \
                                    ng-disabled="readOnly || (pluginModel.resources[inputs.newAudioId+\'.mp3\'] !== undefined) || inputs.newAudioId == null || inputs.newAudioId == \'\'"\
                                    class="upload" \
                                    data-fine-uploader-file-input \
                                    data-is-multiple="audioPluginUploadOptions.multiple"> \
                                    <span class="label-for-icon">{{"Upload"|i18n:"editor_plugin_audio_upload"}}</span> \
                                </div> \
                            </div>\
                        </div> \
                    </div> \
                    <div> \
                        <div style="width:33%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Remove sound:"|i18n:"editor_plugin_sound_remove"}}</span> \
                        </div> \
                        <div style="float: left; width:33%; margin-right: 10px"> \
                            <select data-ng-model="removeAudioId" class="form-control full-border ng-pristine"> \
                                <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'audio/mp3\' || value.mimetype==\'audio/mpeg\'">{{key}}</option> \
                            </select> \
                        </div> \
                        <div> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.removeAudioFromModel(pluginModel, removeAudioId)">\
                                <span class="icon-minus-circle2 reusable-color-danger"></span>\
                            </button> \
                        </div> \
                    </div> \
                    <hr> \
                    <div class="form-group"> \
                        <textarea \
                            class="form-control" \
                            rows="3" \
                            data-ng-model="inputs.importJsonDialogue" \
                            placeholder="{{\'Paste new Dialogue (JSON)\'|i18n:\'editor_plugin_dialogue_json_import_textarea\'}}"/> \
                    </div> \
                    <div style="overflow: hidden"> \
                        <div style="float:left"> \
                            <button \
                                ng-disabled="inputs.importJsonDialogue == null || inputs.importJsonDialogue == \'\'" \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.importJsonDialogueToModel(pluginModel, inputs)"> \
                                <span class="icon-plus-circle2 reusable-color-success"></span> \
                                <span class="label-for-icon">{{"Import json"|i18n:"editor_plugin_dialogue_json_import"}}</span> \
                            </button>\
                        </div> \
                        <div style="float:right"> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.exportJsonDialogueToClipboard(pluginModel)"> \
                                <span class="icon-copy reusable-color-success"></span> \
                                <span class="label-for-icon">{{"Copy json to clipboard"|i18n:"editor_plugin_dialogue_json_export"}}</span> \
                            </button>\
                        </div> \
                    </div> \
                </div>';
    };

/** @function {public} desist @inheritdesc */
locandy.player.plugins.Dialogue.prototype.persist = function()
    {        
        var storedObject = {
            activeDialogueId: this.activeDialogueId,
        };

        return storedObject;
    };

/** @function {public} persist @inheritdesc */
locandy.player.plugins.Dialogue.prototype.desist = function(storedObject)
    {
        this.setActiveDialogue(storedObject.activeDialogueId);
    };

/** @function {public} stopAudio stops Audio if scope gets destroves .... see constructor */
locandy.player.plugins.Dialogue.prototype.stopAudio = function()
    {
        if(this.playingSound)
        {
            this.playingSound.stop();
            this.playingSound = null;
        }    
    };

/** @function {public} moreLessTextButtonPressed shrinks or expands the text displayed. */
locandy.player.plugins.Dialogue.prototype.moreLessTextButtonPressed = function()
    {
        if(this.moreLessOrHidden == 1)
        {
            this.moreLessOrHidden = 2;  // expanded
            this.textToDisplay = this.dialogue[this.activeDialogueId].text;
        }
        else
        {
            this.moreLessOrHidden = 1;  // short text
            this.textToDisplay = this.dialogue[this.activeDialogueId].text;
            
            if(this.textToDisplay.length < 50)
            {
                this.moreLessOrHidden = 0;
                return; // >>>>>>>>>>>>>>> EXIT >>>>>>>>>>>>>>>>
            }
            
            var regex = /[*]{2}([^*]*)[*]{2}/g;  // match all bold sections!
            var array = Array.from(this.textToDisplay.matchAll(regex));
            
            if(array.length > 0)
            {
                this.textToDisplay = "";
                for(var i=0; i<array.length; i++)
                    this.textToDisplay += array[i][1] + " ";
                
                this.textToDisplay += " ...";
            }
            else
            {
                var regex = /[^.?!]*./;  // match 1st sentence
                var array = this.textToDisplay.match(regex);
                
                if(array.length > 0)
                {
                    if(this.textToDisplay.length == array[0].length) // HRRRMPF!
                    {
                        this.moreLessOrHidden = 0;
                        return; // >>>>>>>>>>>>>>> EXIT >>>>>>>>>>>>>>>>
                    }
                    
                    this.textToDisplay = array[0] + " ...";
                }
                else
                    this.textToDisplay = this.textToDisplay.substring(0,45) + " ...";
            }
        }
    };
    
/** @function {public} executeAnswer. performs effect if existing and goes to next dialogue-point */
locandy.player.plugins.Dialogue.prototype.executeAnswer = function(answer)
    {
        if(!answer.nextId || this.dialogue[answer.nextId] === undefined)
        {
            alert("Dialogue: ERROR: the answer has no next dialogue and is broken (contact the author). Author: If this is intentional, set the next dialogue to this dialogue's ID!");
            return;
        }
        
        // execute effect
        if (answer.effectId != null) {
            var me = this;
            new locandy.player.Effect(this.spot.quest, answer.effectId).execute({}, 
                function() { me.setActiveDialogue(answer.nextId); });
        }
        else
            this.setActiveDialogue(answer.nextId);
    };


/** @function {public} setActiveDialogue. updated activeDialogueId and executes sound of next dialogue */
locandy.player.plugins.Dialogue.prototype.setActiveDialogue = function(activeDialogueId)
{
    console.log("Dialogue.setActiveDialogue(" + activeDialogueId + ")");
    
    if(this.dialogue[activeDialogueId] === undefined) // safety after removeNode etc.
        this.activeDialogueId = "START"; // cannot be removed
    else
        this.activeDialogueId = activeDialogueId;
    
    this.imageUrl = null;
    if (this.dialogue[this.activeDialogueId].imageId !== null 
        && this.dialogue[this.activeDialogueId].imageId !== ""
        && this.dialogue[this.activeDialogueId].imageId !== undefined){
        if (this.resources[this.dialogue[this.activeDialogueId].imageId] !== undefined){
            this.imageUrl = locandy.player.playerMainSingleton.resourceResolverService.getUrl(this.resources[this.dialogue[this.activeDialogueId].imageId].uuid);
        }
    }

    // check if text is too long and set textToLong property
    this.textToDisplay = this.dialogue[activeDialogueId].text;
    if(this.dialogue[this.activeDialogueId].audioId !== null)
    {
        this.moreLessOrHidden = 2;
        this.moreLessTextButtonPressed();  // shrink text
    }
    else
        this.moreLessOrHidden = 0;
    
    // set new imageWidth
    if ((this.dialogue[this.activeDialogueId].imageWidth !== undefined) && typeof(this.dialogue[this.activeDialogueId].imageWidth) == "number") {
        this.imageWidth = "" + this.dialogue[this.activeDialogueId].imageWidth + "px";
    }

    // execute sound of next dialogue

    if (this.playingSound){
        this.playingSound.stop();
        this.playingSound = null;
    }

    if(this.nodeVisited[activeDialogueId] === undefined) // never
        this.nodeVisited[activeDialogueId]=1;
    else
        this.nodeVisited[activeDialogueId]++;
    
    if(this.dialogue[this.activeDialogueId].audioId !== null && this.nodeVisited[activeDialogueId] <= 1)
    {
        this.executeSound(this.dialogue[this.activeDialogueId].audioId);
    }
};


/** @function {public} executeSound */
locandy.player.plugins.Dialogue.prototype.executeSound = function(audioId)
    {
        if (this.resources[audioId] !== undefined &&
            this.resources[audioId] !== null) {
            var sound = locandy.player.MediaPlayer.factory(audioId, this.resources[audioId]);   //this.spot.quest.getResource(audioId);

            this.playingSound = sound;
    
            if(sound)
            {
                locandy.player.plugins.Media.updateCurrentMediaInstance(null);
                
                if(!this.isRendered)
                    sound.autoplay = false;
                else
                    sound.playExclusive( { playAudioWhenScreenIsLocked:true } );
            }
            else{
                alert("ERROR: Sound could not be loaded: " + audioId);
                return;
            }
        } 
        else {
            alert("ERROR: Missing upload for audioID: " + audioId);
            return;
        }
    };

/** @function {public} activateOrChangeWatch */
locandy.player.plugins.Dialogue.prototype.activateOrChangeWatch = function()  // aufrufen wenn this.watchStateId geändert wird (falls änderbar)
    {
        if(this._removeWatchF)
            this._removeWatchF();
        
        if(!this.watchStateId)  // watchStateId may be empty, see also SpriteSheet Plugin!
        {
            var me=this;
            var scopeId = "main.quest.stateRegistry." + this.spot.id + ".state." + this.watchStateId;
            this._removeWatchF = this.spot.quest.scope.$watch(scopeId, function(val){ me.setActiveDialogue(val); console.log("Dialogue Watch fired:", val); });
        }
    }

/** @function {public} destroy */
locandy.player.plugins.Dialogue.prototype.destroy = function()
    {
        if (this.playingSound){
            this.playingSound.stop();
            this.playingSound = null;
        }
        
        if(this._removeWatchF)
            this._removeWatchF();
        
        if(this._unregisterRenderedF)
            this._unregisterRenderedF();
    };

/** @function {public Array} ? verifies integrity of quest before publish in Editor. */
locandy.player.plugins.Dialogue.prototype.verifyBeforePublish = function()
    {
        for (var d in this.dialogue)
        {
            var node = this.dialogue[d];
            if (node.text === null || node.text.trim() === "")
            {
                return "editor_warn_dialogueTexts_need_not_be_empty_or_null";
            }
        }
    };

