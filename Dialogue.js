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
        this.imageHeight = "150px";

        // dialogue properties
        this.dialogue = pluginModel.dialogue;        
        this.playingSound = null;

        // last uploaded image id - for upload verification
        this.lastUploadedImageId = "";
        
        // This will fire the first time the PLAYER plugin's DOM is rendered
        this.isRendered = false;
        var me = this;
        var unRegisterEvent=this.spot.quest.scope.$on("plugin_element_rendered",function(event,element){

            // avoid mismatching of plugin/element!
            if( element.id !== me.id ) return;

            if(me.isRendered === false) // play audio on first rendering of dialogue
            {
                me.isRendered = true;
                me.setActiveDialogue("START");
            }
        });
        
        this.watchStateId = "activeDialogueNode"; // Could be set dynamically in Editor or hardwired
        this.activateOrChangeWatch();

        // me.setActiveDialogue("START");
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
                    "text":"Text Agent", 
                    "audioId":null, 
                    "imageId":null,
                    "imageHeight":null,
                    "answers":[]
                }
            }
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
locandy.player.plugins.Dialogue.addAnswerToModel = function(pluginModel, activeDialogueId)
    {
        pluginModel.dialogue[activeDialogueId].answers.push({
            "text": "",
            "effectId": null,
            "nextId": null,
        })
    };

/** @function {static} importJsonDialogueToModel */
locandy.player.plugins.Dialogue.importJsonDialogueToModel = function(pluginModel, json)
{
    try
    {
        if(json != "") { // empty value
            pluginModel.dialogue = angular.fromJson(json);
        }
    }
    catch(e)
    {
        alert("Dialogue Parese Error in JSON Spec!\nPlease delete JSON or fix it!\n" + e);
    }
    pluginModel.importJsonDialogue = "";
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
locandy.player.plugins.Dialogue.addDialogueToModel = function(pluginModel)
    {
        // check if key is already used
        if (!(pluginModel.newDialogueId in pluginModel.dialogue)){
            pluginModel.dialogue[pluginModel.newDialogueId] = {
                "text": null,
                "audioId": null,
                "imageId":null,
                "imageHeight":null,
                "answers": []};
            pluginModel.newDialogueId = "";
        } else {
            alert("Id is alredy used");
        }
    };  

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.removeAnswerFromModel = function(pluginModel, answer, activeDialogueId)
    {
        if(pluginModel.dialogue[activeDialogueId].hasOwnProperty("answers"))
        {
            if( pluginModel.dialogue[activeDialogueId].answers instanceof Array )
                locandy.utilities.removeArrayItem(pluginModel.dialogue[activeDialogueId].answers,answer);
        }        
    };

/** @function {static} writeRescourceToModel @inheritdesc */
locandy.player.plugins.Dialogue.writeRescourceToModel = function(pluginModel, serverResponse)
    {
        var newId = null;
        if (pluginModel.newAudioId != null){
            newId = pluginModel.newAudioId;
        } else if (pluginModel.newImageId != null){
            newId = pluginModel.newImageId;
        }

        locandy.player.plugins.Abstract.writeRescourceToModel(pluginModel, serverResponse, newId);

        // clear textarea
        pluginModel.newAudioId = null;
        pluginModel.newImageId = null;
    }     

/** @function {static} removeResourceFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeResourceFromModel = function(pluginModel)
    {
        if(pluginModel.resources === undefined || pluginModel.resources === null)
        {
            pluginModel.resources = {};
        }

        delete pluginModel.resources[pluginModel.removeResourceId];
    }    

/** @function {static} removeImageFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeImageFromModel = function(pluginModel){
    // if image-resource is used in dialogue set reference to null
    for (var key in pluginModel.dialogue){
        if (pluginModel.dialogue[key].imageId === pluginModel.removeImageId){
            pluginModel.dialogue[key].imageId = null;
        }
    }

    pluginModel.removeResourceId = pluginModel.removeImageId;
    locandy.player.plugins.Dialogue.removeResourceFromModel(pluginModel);
}

/** @function {static} removeAudioFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeAudioFromModel = function(pluginModel){
    // if audio-resource is used in dialogue set reference to null
    for (var key in pluginModel.dialogue){
        if (pluginModel.dialogue[key].audioId === pluginModel.removeAudioId){
            pluginModel.dialogue[key].audioId = null;
        }
    }

    pluginModel.removeResourceId = pluginModel.removeAudioId;
    locandy.player.plugins.Dialogue.removeResourceFromModel(pluginModel);
}

/** @function {static} removeDialogueFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeDialogueFromModel = function(pluginModel, activeDialogueId)
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
        
        if (!(activeDialogueId == "START")){
            delete pluginModel.dialogue[activeDialogueId];
            activeDialogueId = "START";
        }
        
    }     
    
/** @function {static} setAudioToNull @inheritdesc */
locandy.player.plugins.Dialogue.setAudioToNull = function(pluginModel, activeDialogueId)
    {       
        if(pluginModel.dialogue[activeDialogueId].audioId === ""){
            pluginModel.dialogue[activeDialogueId].audioId = null;
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
locandy.player.plugins.Dialogue.setImageToNull = function(pluginModel, activeDialogueId)
    {       
        if(pluginModel.dialogue[activeDialogueId].imageId === undefined){
            pluginModel.dialogue[activeDialogueId].imageId = null;
        }
    }  

/** @function {static} getTemplate @inheritdesc */    
locandy.player.plugins.Dialogue.getTemplate = function()
    {
        return '<div \
                    id="{{plugin.id}}" \
                    data-plugin-element-rendered \
                    style="overflow:hidden" \
                    data-ng-if="plugin.isHidden()">\
                    <div style="float:left; margin-right: 10px" ng-style="{\'width\':plugin.imageHeight}" \
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
                            <p id="agentText" style="font-weight:normal;">{{ plugin.textToDisplay }}</p> \
                            <div style="float:right; width: auto;" data-ng-if="plugin.moreLessOrHidden>0"> \
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

    Editor scope temporary variables declared in this template
        importJsonDialogue = "";
        newDialogueId = "";
        newImageId = "";
        newAudioId = "";

        // id to remove attribute from model
        removeImageId = "";
        removeAudioId = "";
        removeResourceId = "";
    */
locandy.player.plugins.Dialogue.getEditTemplate = function()
    {
        return '<div> \
                    <div class="form-group" data-ng-init="activeDialogueId=\'START\'"> \
                        <select data-ng-model="activeDialogueId" class="form-control full-border ng-pristine ng-valid ng-touched" > \
                            <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                        </select> \
                    </div> \
                    <div style="overflow:hidden"> \
                        <div> \
                            <textarea \
                                rows="4"\
                                style="margin-bottom:5px" \
                                class="form-control question" \
                                data-ng-model="pluginModel.dialogue[activeDialogueId].text" \
                                placeholder="{{\'Text Agent\'|i18n:\'editor_plugin_dialogue_agent_text\'}}"/> \
                        </div> \
                        <div> \
                            <div style="float:left; width:30%; min-height:90px;"> \
                                <div class="image" data-ng-show="pluginModel.resources[pluginModel.dialogue[activeDialogueId].imageId]"> \
                                    <div class="thumbnail"> \
                                        <img data-ng-src="{{pluginModel.resources[pluginModel.dialogue[activeDialogueId].imageId].uuid}}"/> \
                                    </div> \
                                </div> \
                            </div> \
                            <div style="margin-left:35%;"> \
                                <div style="overflow: hidden"> \
                                    <div style="width:30%; float:left; margin-top:3px;"> \
                                        <span class="label-for-icon">{{"Image Id"|i18n:"editor_plugin_dialogue_image_select"}}</span> \
                                    </div> \
                                    <div style="width:70%; float:left"> \
                                        <select required data-ng-model="pluginModel.dialogue[activeDialogueId].imageId" \
                                                class="form-control full-border ng-pristine" \
                                                onchange="document.getElementById(\'btnSetImageNull\').click()"> \
                                            <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'image/png\'">{{key}}</option> \
                                            <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                        </select> \
                                    </div> \
                                    <button style="display: none" id="btnSetImageNull" data-button-handler="global.locandy.player.plugins.Dialogue.setImageToNull(pluginModel, activeDialogueId)"></button>\
                                </div> \
                                <div style="overflow: hidden; margin-left: 40%; margin-top: 10px"> \
                                    <div style="float: left; margin-top:3px"> \
                                        <span class="icon-arrow-right17"></span> \
                                    </div> \
                                    <div style="float:left; margin-top:3px;"> \
                                        <span class="label-for-icon">{{"Height"|i18n:"editor_plugin_dialogue_image_height"}}</span> \
                                    </div> \
                                    <div class="form-group" style="float:right; width:30%"> \
                                        <input type="number" \
                                            class="form-control question" \
                                            data-ng-model="pluginModel.dialogue[activeDialogueId].imageHeight" \
                                            min="80" max="300" \
                                            placeholder="150"/> \
                                    </div> \
                                </div> \
                                <div style="overflow: hidden; margin-top: 10px"> \
                                    <div style="width:30%; float:left; margin-top:3px;"> \
                                        <span class="label-for-icon">{{"Audio Id"|i18n:"editor_plugin_dialogue_audio_select"}}</span> \
                                    </div> \
                                    <div style="width:70%; float:left"> \
                                        <select data-ng-model="pluginModel.dialogue[activeDialogueId].audioId"\
                                                class="form-control full-border ng-pristine"  \
                                                onchange="document.getElementById(\'btnSetAudioNull\').click()">\
                                                <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'audio/mp3\'">{{key}}</option> \
                                                <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                        </select> \
                                    </div> \
                                    <button style="display: none" id="btnSetAudioNull" data-button-handler="global.locandy.player.plugins.Dialogue.setAudioToNull(pluginModel, activeDialogueId)"></button>\
                                </div> \
                            </div> \
                        </div> \
                    </div> \
                    <div class="alert alert-info" \
                            data-ng-if="pluginModel.dialogue[activeDialogueId].answers.length===0"> \
                            {{"You\'ve not provided any answers for this dialogue yet."|i18n:"editor_plugin_dialogue_no_answers"}} \
                    </div>\
                    <div \
                        class="answer form-group row small" \
                        data-ng-if="pluginModel.dialogue[activeDialogueId].answers.length > 0" \
                        data-ng-repeat="answer in pluginModel.dialogue[activeDialogueId].answers"> \
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
                            <div style="float:left; width:50%; padding-right:10px"> \
                                <select data-ng-model="answer.nextId" class="form-control full-border ng-pristine ng-valid ng-touched" \
                                        onchange="document.getElementById(\'btnSetAudioNull\').click()"> \
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
                            <div> \
                                <button \
                                    class="btn btn-fancy btn-medium btn-default" \
                                    style="float:right" \
                                    data-button-handler="global.locandy.player.plugins.Dialogue.removeAnswerFromModel(pluginModel, answer, activeDialogueId)">\
                                    <span class="icon-minus-circle2 reusable-color-danger"></span>\
                                </button> \
                            </div> \
                        </div> \
                    </div> \
                    <button \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.addAnswerToModel(pluginModel, activeDialogueId)"> \
                        <span class="icon-plus-circle2 reusable-color-success"></span> \
                        <span class="label-for-icon">{{"Add answer"|i18n:"editor_plugin_dialogue_answer_add"}}</span> \
                    </button>\
                    <button \
                        ng-disabled="activeDialogueId == \'START\'" \
                        style="float:right" \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.removeDialogueFromModel(pluginModel, activeDialogueId)">\
                        <span class="label-for-icon">{{"Remove section "|i18n:"editor_plugin_dialogue_remove"}}</span> \
                        <span class="icon-minus-circle2 reusable-color-danger"></span>\
                    </button> \
                    <hr> \
                    <div> \
                        <div style="width:35%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add section:"|i18n:"editor_plugin_dialogue_add"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <textarea \
                            id="newDialogueId" class="form-control" rows="1" style="float:left; width=100px" \
                            data-ng-model="pluginModel.newDialogueId" \
                            placeholder="{{\'New dialogue id\'|i18nP:\'editor_plugin_dialogue_new_id\'}}"/> \
                        </div> \
                        <div> \
                            <button \
                            ng-disabled="pluginModel.newDialogueId == null || pluginModel.newDialogueId == \'\'" \
                            class="btn btn-fancy btn-medium btn-default" \
                            data-button-handler="global.locandy.player.plugins.Dialogue.addDialogueToModel(pluginModel)">\
                            <span class="icon-plus-circle2 reusable-color-success"></span> \
                            <span class="label-for-icon">{{"Add"|i18n:"editor_plugin_dialogue_add_btn"}}</span> \
                            </button> \
                        </div> \
                    </div> \
                    <hr> \
                    <div style="overflow: hidden"> \
                        <div style="width:35%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add image:"|i18n:"editor_plugin_image_upload_add"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <textarea \
                            id="newImageId" class="form-control" rows="1" style="float:left; width=100px" \
                            data-ng-model="pluginModel.newImageId" \
                            oninput="document.getElementById(\'newAudioId\').value = null" \
                            placeholder="{{\'Image id\'|i18nP:\'editor_plugin_image_upload_id\'}}"/> \
                        </div> \
                        <div \
                            data-fine-uploader \
                            data-omit-drop-zone \
                            data-omit-file-input \
                            data-fetch-url="uploadFetchUrl" \
                            data-fine-uploader-options="imagePluginUploadOptions" \
                            data-fine-uploader-callback-pass-through="pluginModel" \
                            data-fine-uploader-callback-on-complete="updatePluginResource(fineUploaderCallbackPassThrough,responseJSON)"> \
                            <div class="form-group">\
                                <div \
                                    ng-disabled="pluginModel.newImageId == null || pluginModel.newImageId == \'\'"\
                                    class="upload" \
                                    data-fine-uploader-file-input \
                                    data-is-multiple="imagePluginUploadOptions.multiple"> \
                                    <span class="label-for-icon">{{"Upload"|i18n:"editor_plugin_image_upload"}}</span> \
                                </div> \
                            </div>\
                        </div> \
                    </div> \
                    <div> \
                        <div style="width:35%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Remove image:"|i18n:"editor_plugin_image_remove"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <select data-ng-model="pluginModel.removeImageId" class="form-control full-border ng-pristine"> \
                                <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'image/png\'">{{key}}</option> \
                            </select> \
                        </div> \
                        <div> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.removeImageFromModel(pluginModel)">\
                                <span class="icon-minus-circle2 reusable-color-danger"></span>\
                            </button> \
                        </div> \
                    </div> \
                    <hr> \
                    <div style="overflow: hidden"> \
                        <div style="width:35%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add sound:"|i18n:"editor_plugin_audio_upload_add"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <textarea \
                            id="newAudioId" class="form-control" rows="1" style="float:left; width=100px" \
                            data-ng-model="pluginModel.newAudioId" \
                            oninput="document.getElementById(\'newImageId\').value = null" \
                            placeholder="{{\'Audio id\'|i18nP:\'editor_plugin_audio_upload_id\'}}"/> \
                        </div> \
                        <div \
                            data-fine-uploader \
                            data-omit-drop-zone \
                            data-omit-file-input \
                            data-fetch-url="uploadFetchUrl" \
                            data-fine-uploader-options="audioPluginUploadOptions" \
                            data-fine-uploader-callback-pass-through="pluginModel" \
                            data-fine-uploader-callback-on-complete="updatePluginResource(fineUploaderCallbackPassThrough,responseJSON)"> \
                            <div class="form-group">\
                                <div \
                                    ng-disabled="pluginModel.newAudioId == null || pluginModel.newAudioId == \'\'"\
                                    class="upload" \
                                    data-fine-uploader-file-input \
                                    data-is-multiple="audioPluginUploadOptions.multiple"> \
                                    <span class="label-for-icon">{{"Upload"|i18n:"editor_plugin_audio_upload"}}</span> \
                                </div> \
                            </div>\
                        </div> \
                    </div> \
                    <div> \
                        <div style="width:35%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Remove sound:"|i18n:"editor_plugin_sound_remove"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <select data-ng-model="pluginModel.removeAudioId" class="form-control full-border ng-pristine"> \
                                <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'audio/mp3\'">{{key}}</option> \
                            </select> \
                        </div> \
                        <div> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.removeAudioFromModel(pluginModel)">\
                                <span class="icon-minus-circle2 reusable-color-danger"></span>\
                            </button> \
                        </div> \
                    </div> \
                    <hr> \
                    <div class="form-group"> \
                        <textarea \
                            class="form-control" \
                            rows="3" \
                            data-ng-model="pluginModel.importJsonDialogue" \
                            placeholder="{{\'Paste new Dialogue (JSON)\'|i18n:\'editor_plugin_dialogue_json_import_textarea\'}}"/> \
                    </div> \
                    <div style="overflow: hidden"> \
                        <div style="float:left"> \
                            <button \
                                ng-disabled="pluginModel.importJsonDialogue == null || pluginModel.importJsonDialogue == \'\'" \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.importJsonDialogueToModel(pluginModel, pluginModel.importJsonDialogue)"> \
                                <span class="icon-plus-circle2 reusable-color-success"></span> \
                                <span class="label-for-icon">{{"Import json"|i18n:"editor_plugin_dialogue_json_import"}}</span> \
                            </button>\
                        </div> \
                        <div style="float:right"> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.exportJsonDialogueToClipboard(pluginModel)"> \
                                <span class="icon-plus-circle2 reusable-color-success"></span> \
                                <span class="label-for-icon">{{"Copy json to clipboard"|i18n:"editor_plugin_dialogue_json_export"}}</span> \
                            </button>\
                        </div> \
                    </div> \
                </div>';
    };

locandy.player.plugins.Abstract.prototype.destroy = function()
    {
        if (this.playingSound){
            this.playingSound.stop();
            this.playingSound = null;
        }
    }; 
        
/** @function {public} desist @inheritdesc */
locandy.player.plugins.Dialogue.prototype.persist = function()
    {        
        var storedObject = {
            activeDialogueId: this.activeDialogueId
        };

        return storedObject;
    };

/** @function {public} persist @inheritdesc */
locandy.player.plugins.Dialogue.prototype.desist = function(storedObject)
    {
        this.activeDialogueId = storedObject.activeDialogueId;
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
            this.moreLessOrHidden = 1;
            this.textToDisplay = this.dialogue[this.activeDialogueId].text.substring(0, 45) + "...";
        }
    };
    
/** @function {public} executeAnswer. performs effect if existing and goes to next dialogue-point */
locandy.player.plugins.Dialogue.prototype.executeAnswer = function(answer)
    {
        // execute effect
        if (answer.effectId != null) {
            new locandy.player.Effect(this.spot.quest, answer.effectId).execute();
        }
        
        if(!answer.nextId || this.dialogue[answer.nextId] === undefined)
        {
            alert("Dialogue: ERROR: the answer has no next dialogue and is broken (contact the author).");
            return;
        }
        
        this.setActiveDialogue(answer.nextId);
    };

/** @function {public} setActiveDialogue. updated activeDialogueId and executes sound of next dialogue */
locandy.player.plugins.Dialogue.prototype.setActiveDialogue = function(activeDialogueId)
{
    console.log("Dialogue.setActiveDialogue(" + activeDialogueId + ")");
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
    
    // set new imageHeight
    if ((this.dialogue[this.activeDialogueId].imageHeight !== undefined) && typeof(this.dialogue[this.activeDialogueId].imageHeight) == "number") {
        this.imageHeight = "" + this.dialogue[this.activeDialogueId].imageHeight + "px";
    }

    // execute sound of next dialogue

    if (this.playingSound){
        this.playingSound.stop();
        this.playingSound = null;
    }

    if(this.dialogue[this.activeDialogueId].audioId !== null){
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
                    sound.play();
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
        if(this._removeWatchF)
            this._removeWatchF();
    }

/** @function {public Array} ? verifies integrity of quest before publish in Editor. */
locandy.player.plugins.Dialogue.prototype.verifyBeforePublish = function()
    {
        for (var d in this.dialogue){
            if (d.text.trim() === "" || d.text === null){
                return "editor_warn_dialogueTexts_need_not_be_empty_or_null";
            }
        }
    };

