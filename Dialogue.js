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
locandy.player.plugins.Dialogue = function(spot, json)
    {
    	locandy.player.plugins.Abstract.apply(this,arguments);

        // inject localizer service
        this.localizerService = locandy.player.playerMainSingleton.injector.get("localizerService");

        DEBUG_dialogue = this;

        // dialogue properties
        this.dialogue = json.dialogue;
        this.setActiveDialogue("START");
        this.importJsonDialogue = "";

        // new attribute id
        this.newDialogueId = "";
        this.newImageId = "";
        this.newAudioId = "";
        this.playingSound = null;

        // id to remove attribute from model
        this.removeImageId = "";
        this.removeAudioId = "";
        this.removeResourceId = "";

        this.textVisible = false;
        this.textToLong = true;     // TODO: check where to set value

        // last uploaded image id - for upload verification
        this.lastUploadedImageId = "";
        
        // This will fire the first time the plugin's DOM is rendered
        this.isRendered = false;
        var me = this;
        var unRegisterEvent=this.spot.quest.scope.$on("plugin_element_rendered",function(event,element){

            // avoid mismatching of plugin/element!
            if( element.id !== me.id ) return;

            //me.setActiveDialogue("START");        // wird sonst beim Plugin-Switchen aufgerufen
            me.isRendered = true;
        });
        
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


/** @function {static} getSkeleton @inheritdesc */
locandy.player.plugins.Dialogue.getSkeleton = function()
    {
        return {
            "showIf":[],
            "section":"contents",
            "type":"Dialogue",
            "activeDialogueId": "START",
            "textVisible": false,
            "textToLong": false,
	        "dialogue": {
                "START":{
                    "text":"Text Agent", 
                    "audioId":null, 
                    "imageId":null,
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
locandy.player.plugins.Dialogue.addAnswerToModel = function(pluginModel)
    {
        pluginModel.dialogue[pluginModel.activeDialogueId].answers.push({
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
                "answers": []};
            pluginModel.newDialogueId = "";
        } else {
            alert("Id is alredy used");
        }
    };  

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.removeAnswerFromModel = function(pluginModel,answer)
    {
        if(pluginModel.dialogue[pluginModel.activeDialogueId].hasOwnProperty("answers"))
        {
            if( pluginModel.dialogue[pluginModel.activeDialogueId].answers instanceof Array )
                locandy.utilities.removeArrayItem(pluginModel.dialogue[pluginModel.activeDialogueId].answers,answer);
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
locandy.player.plugins.Dialogue.removeDialogueFromModel = function(pluginModel)
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
        if (!(pluginModel.activeDialogueId == "START")){
            delete pluginModel.dialogue[pluginModel.activeDialogueId];
            pluginModel.activeDialogueId = "START";
        }
        
    }     
    
/** @function {static} setAudioToNull @inheritdesc */
locandy.player.plugins.Dialogue.setAudioToNull = function(pluginModel)
    {       
        if(pluginModel.dialogue[pluginModel.activeDialogueId].audioId === ""){
            pluginModel.dialogue[pluginModel.activeDialogueId].audioId = null;
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
locandy.player.plugins.Dialogue.setImageToNull = function(pluginModel)
    {       
        if(pluginModel.dialogue[pluginModel.activeDialogueId].imageId === undefined){
            pluginModel.dialogue[pluginModel.activeDialogueId].imageId = null;
        }
    }  


/** @function {static} cutText @inheritdesc */
locandy.player.plugins.Dialogue.cutText = function(plugin)
    {   
        if (plugin.dialogue[plugin.activeDialogueId].text.length < 70){
            return plugin.dialogue[plugin.activeDialogueId].text;
        }
        else {
            var first = plugin.dialogue[plugin.activeDialogueId].text.substring(0, 70);
            plugin.textToLong = true;
            return first;
        }
    };

/** @function {static} showText @inheritdesc */
locandy.player.plugins.Dialogue.showText = function(plugin)
    {   
        var text = plugin.dialogue[plugin.activeDialogueId].text;

        document.getElementById("agentText").innerHTML = "<p>" + text + "<button id='hideTextBtn' style='margin-left:2px' data-button-handler='global.locandy.player.plugins.Dialogue.hideText(plugin)'><span class='icon-arrow-up2'></span></button></p>";
    };

/** @function {static} hideText @inheritdesc */
locandy.player.plugins.Dialogue.hideText = function(plugin)
    {   
        alert("test");
        var text = plugin.dialogue[plugin.activeDialogueId].text.substring(0,70);

        document.getElementById("agentText").innerHTML = "<p>" + text + "<button id='showTextBtn' style='padding-left:2px' data-button-handler='global.locandy.player.plugins.Dialogue.showText(plugin)'><span class='icon-arrow-down2'></span></button></p>";
    };

/** @function {static} testF @inheritdesc */
locandy.player.plugins.Dialogue.testF = function()
    {   
        alert("alert");
        document.getElementById("test").innerHTML = "test2: ";
        document.getElementById("testBtn").innerHTML="test2";
    };

/** @function {static} moreLessText @inheritdesc */
locandy.player.plugins.Dialogue.moreLessText = function(plugin)
    {
        
        if (plugin.textVisible){
            document.getElementById("agentText").innerHTML = plugin.dialogue[plugin.activeDialogueId].text.substring(0, 70) + "...";
            document.getElementById("moreLessBtn").innerHTML = "<span class='icon-arrow-down2'></span>"
            plugin.textVisible = false;
            console.log(plugin.textVisible);
        }
        else {
            document.getElementById("agentText").innerHTML = plugin.dialogue[plugin.activeDialogueId].text;
            document.getElementById("moreLessBtn").innerHTML = "<span class='icon-arrow-up2'></span>"
            plugin.textVisible = true;
            console.log(plugin.textVisible);
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
                    <div style="float:left; width:33%; margin-right: 10px"\
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
                        <div class="btn" style="float:right" ng-show="plugin.dialogue[plugin.activeDialogueId].audioId != null"> \
                            <a href="javascript:void(0);" \
                                data-button-handler="plugin.executeSound(plugin.dialogue[plugin.activeDialogueId].audioId)"> \
                                <span class="icon-play4"></span>\
                            </a> \
                        </div> \
                        <!--<div class="question"> \
                            <details> \
                                <summary>{{plugin.dialogue[plugin.activeDialogueId].text.substr(0,70)}}</summary> \
                                <p>{{plugin.dialogue[plugin.activeDialogueId].text.substr(70,plugin.dialogue[plugin.activeDialogueId].text.length)}}</p> \
                            </details> \
                        </div>--> \
                        <!--<div class="question" style="padding: 2px 10px;"> \
                            <p style="white-space: nowrap; overflow: hidden; text-overflow: clip;"> \
                                Hier steht ein sehr langer Text \
                            </p> \
                        </div>--> \
                        <!--<div class="question"> \
                            <p>{{plugin.dialogue[plugin.activeDialogueId].text}}</p> \
                        </div>--> \
                        <!--<div> \
                            <p id="test">test: </p><button id="testBtn" data-button-handler="global.locandy.player.plugins.Dialogue.testF()">test<button> \
                        </div>--> \
                        <div class="question" data-ng-if="!((plugin.textToLong===true) && (plugin.dialogue[plugin.activeDialogueId].audioId !== null))"> \
                            <p id="agentText">{{plugin.dialogue[plugin.activeDialogueId].text}}</p> \
                        </div> \
                        <div class="question" data-ng-if="(plugin.textToLong===true) && (plugin.dialogue[plugin.activeDialogueId].audioId !== null)"> \
                            <p id="agentText">{{global.locandy.player.plugins.Dialogue.cutText(plugin)}}...</p> \
                            <button id="moreLessBtn" style="margin-top:-10px; float:right" data-button-handler="global.locandy.player.plugins.Dialogue.moreLessText(plugin)"><span class="icon-arrow-down2"></span></button> \
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
                </div>';
    };

/** @function {static} getEditTemplate @inheritdesc */
locandy.player.plugins.Dialogue.getEditTemplate = function()
    {
        return '<div> \
                    <div class="form-group"> \
                        <select data-ng-model="pluginModel.activeDialogueId" class="form-control full-border ng-pristine ng-valid ng-touched" > \
                            <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                        </select> \
                    </div> \
                    <div style="overflow:hidden"> \
                        <div> \
                            <textarea \
                                rows="4"\
                                style="margin-bottom:5px" \
                                class="form-control question" \
                                data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].text" \
                                placeholder="{{\'Text Agent\'|i18n:\'editor_plugin_dialogue_agent_text\'}}"/> \
                        </div> \
                        <div> \
                            <div style="float:left; width:30%; min-height:90px;"> \
                                <div class="image" data-ng-show="pluginModel.resources[pluginModel.dialogue[pluginModel.activeDialogueId].imageId]"> \
                                    <div class="thumbnail"> \
                                        <img data-ng-src="{{pluginModel.resources[pluginModel.dialogue[pluginModel.activeDialogueId].imageId].uuid}}"/> \
                                    </div> \
                                </div> \
                            </div> \
                            <div style="margin-left:35%;"> \
                                <div style="overflow: hidden"> \
                                    <div style="width:30%; float:left; margin-top:3px;"> \
                                        <span class="label-for-icon">{{"Image Id"|i18n:"editor_plugin_dialogue_image_select"}}</span> \
                                    </div> \
                                    <div style="width:70%; float:left"> \
                                        <select required data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].imageId" \
                                                class="form-control full-border ng-pristine" \
                                                onchange="document.getElementById(\'btnSetImageNull\').click()"> \
                                            <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'image/png\'">{{key}}</option> \
                                            <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                        </select> \
                                    </div> \
                                    <button style="display: none" id="btnSetImageNull" data-button-handler="global.locandy.player.plugins.Dialogue.setImageToNull(pluginModel)"></button>\
                                </div> \
                                <div style="overflow: hidden; margin-top: 10px"> \
                                    <div style="width:30%; float:left; margin-top:3px;"> \
                                        <span class="label-for-icon">{{"Audio Id"|i18n:"editor_plugin_dialogue_audio_select"}}</span> \
                                    </div> \
                                    <div style="width:70%; float:left"> \
                                        <select data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].audioId"\
                                                class="form-control full-border ng-pristine"  \
                                                onchange="document.getElementById(\'btnSetAudioNull\').click()">\
                                                <option data-ng-repeat="(key, value) in pluginModel.resources" ng-if="value.mimetype==\'audio/mp3\'">{{key}}</option> \
                                                <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                        </select> \
                                    </div> \
                                    <button style="display: none" id="btnSetAudioNull" data-button-handler="global.locandy.player.plugins.Dialogue.setAudioToNull(pluginModel)"></button>\
                                </div> \
                            </div> \
                        </div> \
                    </div> \
                    <div class="alert alert-info" \
                            data-ng-if="pluginModel.dialogue[pluginModel.activeDialogueId].answers.length===0"> \
                            {{"You\'ve not provided any answers for this dialogue yet."|i18n:"editor_plugin_dialogue_no_answers"}} \
                    </div>\
                    <div \
                        class="answer form-group row small" \
                        data-ng-if="pluginModel.dialogue[pluginModel.activeDialogueId].answers.length > 0" \
                        data-ng-repeat="answer in pluginModel.dialogue[pluginModel.activeDialogueId].answers"> \
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
                                    data-button-handler="global.locandy.player.plugins.Dialogue.removeAnswerFromModel(pluginModel,answer)">\
                                    <span class="icon-minus-circle2 reusable-color-danger"></span>\
                                </button> \
                            </div> \
                        </div> \
                    </div> \
                    <button \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.addAnswerToModel(pluginModel)"> \
                        <span class="icon-plus-circle2 reusable-color-success"></span> \
                        <span class="label-for-icon">{{"Add answer"|i18n:"editor_plugin_dialogue_answer_add"}}</span> \
                    </button>\
                    <button \
                        ng-disabled="pluginModel.activeDialogueId == \'START\'" \
                        style="float:right" \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.removeDialogueFromModel(pluginModel)">\
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

/** @function {public} hideMessage Displays a message between question and answers. */
locandy.player.plugins.Dialogue.prototype.hideMessage = function()
    {
        delete this.message;
    };

/** @function {public} showMessage Displays a message between question and answers. */
locandy.player.plugins.Dialogue.prototype.showMessage = function(message)
    {
        this.message = message;
    };

/** @function {public} executeAnswer. performs effect if existing and goes to next dialogue-point */
locandy.player.plugins.Dialogue.prototype.executeAnswer = function(answer)
    {
        // execute effect
        if (answer.effectId != null) {
            new locandy.player.Effect(this.spot.quest, answer.effectId).execute();
        }
        
        this.setActiveDialogue(answer.nextId);
    };

/** @function {public} setActiveDialogue. updated activeDialogueId and executes sound of next dialogue */
locandy.player.plugins.Dialogue.prototype.setActiveDialogue = function(activeDialogueId)
{
    console.log("Dialogue.setActiveDialogue(" + activeDialogueId + ")");
    this.activeDialogueId = activeDialogueId;
    
    if (this.dialogue[this.activeDialogueId].imageId !== null && this.dialogue[this.activeDialogueId].imageId !== "" && this.dialogue[this.activeDialogueId].imageId !== undefined){
        this.imageUrl = locandy.player.playerMainSingleton.resourceResolverService.getUrl(this.resources[this.dialogue[this.activeDialogueId].imageId].uuid);
    }
    else 
    {
        this.imageUrl = null;
    }

    // check it text is too long and set textToLong property
    if(this.dialogue[activeDialogueId].text.length > 50){
        this.textToLong = true;
    }
    else{
        this.textToLong = false;
    }
    console.log(this.dialogue[activeDialogueId].text + ': ' + this.dialogue[activeDialogueId].text.length);
    console.log(this.textToLong);

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
            return "ERROR: Missing upload for sound-effect: " + audioId;
        }
    };
    
/** @function {public Array} ? verifies integrity of quest before publish in Editor. */
locandy.player.plugins.Dialogue.prototype.verifyBeforePublish = function()
    {
        for (var d in this.dialogue){
            if (d.text.trim() === "" || d.text === null){
                return "editor_warn_dialogueTexts_need_not_be_empty_or_null";
            }
        }
    };

