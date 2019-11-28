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
        this.importJsonDialogue = "";
        this.setActiveDialogue("START");

        // new attribute id
        this.newDialogueId = "";
        this.newImageId = "";
        this.playingSound = null;

        // id to remove attribute from model
        this.removeDialogueId = "";
        this.removeImageId = "";

        // last uploaded image id - for upload verification
        this.lastUploadedImageId = "";
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
	        "dialogue": {
                "START":{
                    "text":"You don't look like you're from around here.", 
                    "audioId":null, 
                    "imageId":null,
                    "answers":[
                        {"text":"I've lived here all my life!", "effectId":null, "nextId":"P1" },
                        {"text":"I came here from Newton", "effectId":null, "nextId":"P2" }
                    ]},
                "P1":{
                    "text":"Oh really? Then you must know Mr. Bowler.",
                    "audioId":null, 
                    "imageId":null,
                    "answers":[
                        {"text":"Mr. Bowler is a good friend of mine!", "effectId":null, "nextId":"P3" },
                        {"text":"Who?", "effectId":null, "nextId":"P4" }
                    ]},
                "P2":{
                    "text":"Newton, eh? I heard there's trouble brewing down there.",
                    "audioId":null, 
                    "imageId":null,
                    "answers":[
                        {"text":"I haven't heard about any trouble.", "effectId":null, "nextId":"P4" },
                        {"text":"Did I say Newton? I'm actually from Springville", "effectId":null, "nextId":"P1" }
                    ]},
                "P3":{
                    "text":"You liar! There ain't no Mr. Bowler, I made him up!", 
                    "audioId":null, 
                    "imageId":null,
                    "answers":[]
                    },
                "P4":{
                    "text":"Don't you worry about it. Say do you have something to eat? I'm starving", 
                    "audioId":null, 
                    "imageId":null,
                    "answers":[]
                    }
            },
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
        locandy.player.plugins.Abstract.writeRescourceToModel(pluginModel, serverResponse, pluginModel.newImageId);

        // clear textarea
        pluginModel.lastUploadedImageId = pluginModel.newImageId;
        pluginModel.newImageId = null;
    }     

/** @function {static} removeResourceFromModel @inheritdesc */
locandy.player.plugins.Dialogue.removeResourceFromModel = function(pluginModel)
    {
        if(pluginModel.resources === undefined || pluginModel.resources === null)
        {
            pluginModel.resources = {};
        }

        // if image is used in dialogue set reference to null
        for (var key in pluginModel.dialogue){
            if (pluginModel.dialogue[key].imageId === pluginModel.removeImageId){
                pluginModel.dialogue[key].imageId === null;
            }
        }
        
        delete pluginModel.resources[pluginModel.removeImageId];
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

        delete pluginModel.dialogue[pluginModel.removeDialogueId];
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

    
/** @function {static} getTemplate @inheritdesc */    
locandy.player.plugins.Dialogue.getTemplate = function()
    {               
        return '<div> \
                    <div style="float:left; width:33%; margin-right: 10px"\
                        ng-show="plugin.dialogue[plugin.activeDialogueId].imageId "= null"> \
                        <div class="image"\
                            data-ng-show="plugin.isHidden() && plugin.resources[plugin.dialogue[plugin.activeDialogueId].imageId]"\
                            data-ng-class="{visible:plugin.isHidden() && plugin.resources[plugin.dialogue[plugin.activeDialogueId].imageId]}"> \
                            <div class="thumbnail"> \
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
                        <div class="question"> \
                            <p>{{plugin.dialogue[plugin.activeDialogueId].text}}</p> \
                        </div> \
                    </div> \
                    <div class="answers"> \
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
                        <div class="form-group"> \
                            <input \
                                type="text" \
                                class="form-control question" \
                                data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].text" \
                                placeholder="{{\'Text Agent\'|i18n:\'editor_plugin_dialogue_agent_text\'}}"> \
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
                                        <span class="label-for-icon">{{"Image"|i18n:"editor_plugin_dialogue_image_select"}}</span> \
                                    </div> \
                                    <div style="width:70%; float:left"> \
                                        <select required data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].imageId" \
                                                class="form-control full-border ng-pristine" \
                                                onchange="document.getElementById(\'btnSetImageNull\').click()"> \
                                            <option data-ng-repeat="(key, value) in pluginModel.resources">{{key}}</option> \
                                            <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                        </select> \
                                    </div> \
                                    <button style="display: none" id="btnSetImageNull" data-button-handler="global.locandy.player.plugins.Dialogue.setImageToNull(pluginModel)"></button>\
                                </div> \
                                <div style="overflow: hidden; margin-top: 10px"> \
                                    <div style="width:30%; float:left; margin-top:3px;"> \
                                        <span class="label-for-icon">{{"Audio"|i18n:"editor_plugin_dialogue_audio_select"}}</span> \
                                    </div> \
                                    <div style="width:70%; float:left"> \
                                        <select data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].audioId"\
                                                class="form-control full-border ng-pristine"  \
                                                onchange="document.getElementById(\'btnSetAudioNull\').click()">\
                                            <option data-ng-repeat="(key, value) in mrmResource.resources">{{key}}</option> \
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
                        style="margin-top: 5px"\
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
                        <div style="margin-left:10%"> \
                            <div style="float: left; margin-top:5px;"> \
                                <span class="icon-arrow-right17"></span> \
                            </div> \
                            <div style="float:left; width:25%; padding-right:10px"> \
                                <select data-ng-model="answer.nextId" class="form-control full-border ng-pristine ng-valid ng-touched" \
                                        onchange="document.getElementById(\'btnSetAudioNull\').click()"> \
                                    <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                                    <option selected value="">{{"none"|i18n:"editor_plugin_dialogue_select_none"}}</option> \
                                </select> \
                            </div> \
                            <button style="display: none" id="btnSetNextIdNull" data-button-handler="global.locandy.player.plugins.Dialogue.setNextIdToNull(answer)"></button>\
                            <div> \
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
                    <hr> \
                    <div> \
                        <div style="width:20%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add"|i18n:"editor_plugin_dialogue_add"}}</span> \
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
                    <div> \
                        <div style="width:20%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Remove"|i18n:"editor_plugin_dialogue_remove"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <select data-ng-model="pluginModel.removeDialogueId" class="form-control full-border ng-pristine"> \
                                <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                            </select> \
                        </div> \
                        <div> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.removeDialogueFromModel(pluginModel)">\
                                <span class="icon-minus-circle2 reusable-color-danger"></span>\
                            </button> \
                        </div> \
                    </div> \
                    <hr> \
                    <div style="overflow: hidden"> \
                        <div style="width:20%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Add"|i18n:"editor_plugin_image_upload_add"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <textarea \
                            id="newImageId" class="form-control" rows="1" style="float:left; width=100px" \
                            data-ng-model="pluginModel.newImageId" \
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
                                    <span class="label-for-icon">{{"Upload"|i18n:"editot_plugin_image_upload"}}</span> \
                                </div> \
                                <small data-ng-if="(pluginModel.newImageId == null) && (pluginModel.resources[pluginModel.lastUploadedImageId])"> \
                                    <span class="icon-checkmark reusable-color-success"></span> \
                                </small> \
                            </div>\
                        </div> \
                    </div> \
                    <div> \
                        <div style="width:20%; float:left; margin-top:3px;"> \
                            <span class="label-for-icon">{{"Remove"|i18n:"editor_plugin_image_remove"}}</span> \
                        </div> \
                        <div style="float: left; width:30%; margin-right: 10px"> \
                            <select data-ng-model="pluginModel.removeImageId" class="form-control full-border ng-pristine"> \
                                <option data-ng-repeat="(key, value) in pluginModel.resources">{{key}}</option> \
                            </select> \
                        </div> \
                        <div> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.removeResourceFromModel(pluginModel)">\
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
    this.activeDialogueId = activeDialogueId;



    if (this.dialogue[this.activeDialogueId].imageId !== null && this.dialogue[this.activeDialogueId].imageId !== "" && this.resources[this.dialogue[this.activeDialogueId].imageId].uuid){
        this.imageUrl = locandy.player.playerMainSingleton.resourceResolverService.getUrl(this.resources[this.dialogue[this.activeDialogueId].imageId].uuid);
    }
    else 
    {
        this.imageUrl = null;
    }

    // execute sound of next dialogue

    if (this.playingSound){
        this.playingSound.pause();
        this.playingSound = null;
    }

    if(this.dialogue[this.activeDialogueId].audioId !== undefined || this.dialogue[this.activeDialogueId].audioId != null){
        this.executeSound(this.dialogue[this.activeDialogueId].audioId);
    }
};

/** @function {public} executeSound */
locandy.player.plugins.Dialogue.prototype.executeSound = function(audioId)
    {

        
        var sound = this.spot.quest.getResource(audioId);

        this.playingSound = sound;

        if(sound)
        {
            locandy.player.plugins.Media.updateCurrentMediaInstance(null);
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

