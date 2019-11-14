// jEdit :folding=indent: :collapseFolds=1: :noTabs=true:

"use strict";
if( locandy === undefined ) var locandy={};
if( locandy.player === undefined ) locandy.player={};
if( locandy.player.plugins === undefined ) locandy.player.plugins={};

// variable for debugging
var DEBUG_dialogue = this;

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
        this.dialogueTreeJson = "";
        this.newDialogueId = "";

        this.setActiveDialogue("START");

        // for new Image Upload
        this.imageId = "";

        // for upload verification
        this.lastUploadedImage = "";
    };    

locandy.utilities.inherit(locandy.player.plugins.Dialogue,locandy.player.plugins.Abstract);
locandy.player.plugins.registerPlugin("Dialogue",locandy.player.plugins.Dialogue);

/** @prop {static} restrictedTo @inheritdesc */
locandy.player.plugins.Dialogue.restrictedTo = "contents";

/** @prop {static} groupLabel @inheritdesc */
locandy.player.plugins.Dialogue.groupLabel = "Tasks";

/** @prop {static} groupTag @inheritdesc */
locandy.player.plugins.Dialogue.groupTag = "editor_plugin_label_group_tasks";

/** @prop {static String} returns title for editor */
locandy.player.plugins.Dialogue.getEditorTitleForModel = function(pluginModel, translatedClassname)
    {
        var label = pluginModel.label ? pluginModel.label : "";
        return '<span class="icon-file-picture reusable-color-danger"></span> ' + label;
    }

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
                    "text":"Hallo! Ich bin Diana!", 
                    "audioId":null, 
                    "imageId":null,
                    "answers":[
                    {"text":"Hallo!", "effectId":null, "nextId":"END" },
                    {"text":"Kannst du mir Geld borgen?", "effectId":"d_receive_1gold", "nextId":"END" },
                    {"text":"Gib Diana 10 Gold!", "effectId":"d_give_10gold", "nextId":"END" },
                    ]},
                "END":{
                    "text":"Ich mag das nicht. Ciao!", 
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
        console.log(effectId);
        console.log(effectModel);
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

/** @function {static} importDialogueToModel */
locandy.player.plugins.Dialogue.importDialogueToModel = function(pluginModel, json)
{
    try
        {
            if(json != "") { // empty value
                pluginModel.dialogue = angular.fromJson(json);
            }
        }
    catch(e)
        {
            pluginModel.dialogue = null;
            alert("Dialogue Parese Error in JSON Spec!\nPlease delete JSON or fix it!\n" + e);
        }
    pluginModel.dialogueTreeJson = "";
};

/** @function {static} exportDialogueToClipboard */
locandy.player.plugins.Dialogue.exportDialogueToClipboard = function(pluginModel)
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
        if( pluginModel.dialogue[pluginModel.activeDialogueId].hasOwnProperty("answers") )
        {
            if( pluginModel.dialogue[pluginModel.activeDialogueId].answers instanceof Array )
                locandy.utilities.removeArrayItem(pluginModel.dialogue[pluginModel.activeDialogueId].answers,answer);
        }        
    };

/** @function {static} writeRescourceToModel @inheritdesc */
locandy.player.plugins.Dialogue.writeRescourceToModel = function(pluginModel, serverResponse)
    {
        locandy.player.plugins.Abstract.writeRescourceToModel(pluginModel, serverResponse, pluginModel.imageId);

        // clear textarea
        pluginModel.lastUploadedImage = pluginModel.imageId;
        pluginModel.imageId = null;
    }    


/** @function {static} getTemplate @inheritdesc */    
locandy.player.plugins.Dialogue.getTemplate = function()
    {               
        return '<div> \
                    <div style="float:left; width:33%"> \
                        <div class="image" data-ng-show="plugin.isHidden()&&plugin.imageUrl" data-ng-class="{visible:plugin.isHidden()&&plugin.imageUrl}"> \
                            <div class="thumbnail"> \
                                <img data-ng-src="{{plugin.imageUrl}}"/> \
                            </div> \
                        </div> \
                    </div> \
                    <div> \
                        <div style="margin-left:35%"> \
                            <div class="question"> \
                                <p>{{plugin.dialogue[plugin.activeDialogueId].text}}</p> \
                                <div class="btn" style="float:right"> \
                                    <a href="javascript:void(0);" \
                                        data-button-handler="plugin.executeSound(plugin.dialogue[plugin.activeDialogueId].audioId)"> \
                                        <span class="icon-play4"></span>\
                                    </a> \
                                </div> \
                            </div> \
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
                        <hr> \
                        <div class="form-group"> \
                            <input \
                                type="text" \
                                class="form-control question" \
                                data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].text" \
                                placeholder="{{\'Text Agent\'|i18n:\'editor_plugin_dialogue_agent_text\'}}"> \
                        </div> \
                        <div> \
                            <div style="float:left; width:30%"> \
                                <div class="image"> \
                                    <div class="thumbnail"> \
                                        <img data-ng-src="{{pluginModel.resources[pluginModel.dialogue[pluginModel.activeDialogueId].imageId].uuid}}"/> \
                                    </div> \
                                </div> \
                            </div> \
                            <div style="margin-left:35%"> \
                                <div style="overflow: hidden"> \
                                    <div style="width:30%; float:left"> \
                                        <p>Image: </p> \
                                    </div> \
                                    <div style="width:50%; float:left"> \
                                        <select data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].imageId" class="form-control full-border ng-pristine"> \
                                            <option data-ng-repeat="(key, value) in pluginModel.resources">{{key}}</option> \
                                        </select> \
                                    </div> \
                                </div> \
                                <div style="overflow: hidden; margin-top: 10px"> \
                                    <div style="width:30%; float:left"> \
                                        <p>Audio: </p> \
                                    </div> \
                                    <div style="width:50%; float:left"> \
                                        <select data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].audioId" class="form-control full-border ng-pristine"> \
                                            <option data-ng-repeat="(key, value) in mrmResource.resources">{{key}}</option> \
                                            <option value="" >null</option> \
                                        </select> \
                                    </div> \
                                    <div> \
                                    <button \
                                        class="btn btn-fancy btn-medium btn-default" \
                                        style="float:right" \
                                        data-button-handler="global.locandy.player.plugins.Dialogue.executeSound(pluginModel.dialogue[pluginModel.activeDialogueId].audioId)">\
                                        <span class="icon-play4"></span>\
                                    </button> \
                                </div> \
                                </div> \
                            </div> \
                        </div> \
                    </div> \
                    <hr> \
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
                        <div> \
                            <div style="float: left; margin-left:10%"> \
                                <p>&rarr;</p> \
                            </div> \
                            <div style="float:left; width:20%; padding-right:3px"> \
                                <select data-ng-model="answer.nextId" class="form-control full-border ng-pristine ng-valid ng-touched"> \
                                    <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                                    <option>null</option> \
                                </select> \
                            </div> \
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
                    <div style="float: left; width:50%; margin-right: 10px"> \
                        <textarea \
                        id="newDialogueId" class="form-control" rows="1" style="float:left; width=100px" \
                        data-ng-model="pluginModel.newDialogueId" \
                        placeholder="New Dialogue Id"/> \
                    </div> \
                    <div> \
                        <button \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.addDialogueToModel(pluginModel)">\
                        <span class="icon-plus-circle2 reusable-color-success"></span> \
                        <span class="label-for-icon">{{"New dialogue"|i18n:"editor_plugin_dialogue_add"}}</span> \
                        </button> \
                    </div> \
                    <hr> \
                    <div> \
                        <div style="float: left; width:25%; margin-right: 10px"> \
                            <textarea \
                            id="newImageId" class="form-control" rows="1" style="float:left; width=100px" \
                            data-ng-model="pluginModel.imageId" \
                            placeholder="Image Id"/> \
                        </div> \
                        <div \
                            style="margin-left:30%" \
                            data-fine-uploader \
                            data-omit-drop-zone \
                            data-omit-file-input \
                            data-fetch-url="uploadFetchUrl" \
                            data-fine-uploader-options="imagePluginUploadOptions" \
                            data-fine-uploader-callback-pass-through="pluginModel" \
                            data-fine-uploader-callback-on-complete="updatePluginResource(fineUploaderCallbackPassThrough,responseJSON)"> \
                            <div class="form-group">\
                                <div \
                                    ng-disabled="{{readOnly}}"\
                                    class="upload" \
                                    data-fine-uploader-file-input \
                                    data-is-multiple="imagePluginUploadOptions.multiple"> \
                                    <span class="label-for-icon">{{"Upload"|i18n:"system_label_upload"}}</span> \
                                </div> \
                                <small data-ng-if="(pluginModel.imageId == null) && (pluginModel.resources[pluginModel.lastUploadedImage])"> \
                                    <span class="icon-checkmark reusable-color-success"></span> \
                                    <span class="label-for-icon">{{"uploaded"|i18n:"todo"}}</span> \
                                </small> \
                            </div>\
                            <div data-ng-if="pluginModel.resources.url.mimetype==\'image/gif\'" class="form-group"> \
                                <input \
                                    type="number" min="1000"\
                                    class="form-control" \
                                    data-ng-model="pluginModel.animationDuration" \
                                    maxlength="5" \
                                    placeholder="GIF animation duration milliseconds"> \
                            </div>\
                        </div> \
                    </div> \
                    <hr> \
                    <div class="form-group"> \
                        <textarea \
                            class="form-control" \
                            rows="3" \
                            data-ng-model="pluginModel.dialogueTreeJson" \
                            placeholder="Dialogue Tree JSON"/> \
                    </div> \
                    <div style="overflow: hidden"> \
                        <div style="float:left"> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.importDialogueToModel(pluginModel, pluginModel.dialogueTreeJson)"> \
                                <span class="icon-plus-circle2 reusable-color-success"></span> \
                                <span class="label-for-icon">{{"Import json"|i18n:"editor_plugin_dialogue_json_import"}}</span> \
                            </button>\
                        </div> \
                        <div style="float:right"> \
                            <button \
                                class="btn btn-fancy btn-medium btn-default" \
                                data-button-handler="global.locandy.player.plugins.Dialogue.exportDialogueToClipboard(pluginModel)"> \
                                <span class="icon-plus-circle2 reusable-color-success"></span> \
                                <span class="label-for-icon">{{"Copy json to clipboard"|i18n:"editor_plugin_dialogue_json_export"}}</span> \
                            </button>\
                        </div> \
                    </div> \
                </div>';
    };

/** @function {public} desist @inheritdesc
    */
locandy.player.plugins.Dialogue.prototype.persist = function()
    {        
        var storedObject = {
            activeDialogueId: this.activeDialogueId
        };

        return storedObject;
    };

/** @function {public} persist @inheritdesc
  */
locandy.player.plugins.Dialogue.prototype.desist = function(storedObject)
    {
        this.activeDialogueId = storedObject.activeDialogueId;
    };

/** @function {public} showMessage Displays a message between question and answers. */
locandy.player.plugins.Dialogue.prototype.hideMessage = function()
    {
        delete this.message;
    };

/** @function {public} showMessage Displays a message between question and answers. */
locandy.player.plugins.Dialogue.prototype.showMessage = function(message)
    {
        this.message = message;
    };

/** @function {public} setActiveDialogue. updated activeDialogueId and executes sound of next dialogue */
locandy.player.plugins.Dialogue.prototype.setActiveDialogue = function(activeDialogueId)
{
    this.activeDialogueId = activeDialogueId;

    if (this.dialogue[this.activeDialogueId].imageId != null && this.resources[this.dialogue[this.activeDialogueId].imageId].uuid){
        this.imageUrl = locandy.player.playerMainSingleton.resourceResolverService.getUrl(this.resources[this.dialogue[this.activeDialogueId].imageId].uuid); //this.resources[this.dialogue[this.activeDialogueId].imageId].url;
    }
    else 
    {
        this.imageUrl = null;
    }
    console.log(this);

    // execute sound of next dialogue
    if(this.dialogue[this.activeDialogueId].audioId !== undefined || this.dialogue[this.activeDialogueId].audioId != null){
        this.executeSound(this.dialogue[this.activeDialogueId].audioId);
    }
};

/** @function {public} executeAnswer. performs effect if existing and goes to next dialogue-point */
locandy.player.plugins.Dialogue.prototype.executeAnswer = function(answer)
    {
        console.log(answer);

        // execute effect
        if (answer.effectId != null) {
            new locandy.player.Effect(this.spot.quest, answer.effectId).execute();
        }

        this.setActiveDialogue(answer.nextId);
    };

/** @function {public} executeSound */
locandy.player.plugins.Dialogue.prototype.executeSound = function(audioId)
    {
        console.log(this);

        var sound = this.spot.quest.getResource(audioId);

        if(sound)
        {
            locandy.player.plugins.Media.updateCurrentMediaInstance(null);
            sound.play();
        }
        else
            return "ERROR: Missing upload for sound-effect: " + audioId;
    };
    

locandy.player.plugins.Dialogue.prototype.getImageUrl = function()
    {
        console.log(this);

        if(false === this.isHidden()) // isHidden returns true if plugin is visible! redisplay animated gifs
            return "";
        
        // if(this.gifRandom !== undefined)
        // {
        //     // animated GIFs (not looping) must be restarted when the scope changes or they become visible
        //     // the only way to do this is to change the URL and force the browser to reload the same image
        //     // to display the animation again
        //     var me = this;
        //     if(!this._timeout)
        //         this._timeout = setTimeout(function(){ me.gifRandom++; me._timeout = null;}, this.animationDuration);
            
        //     var u = this.url + "?" + this.gifRandom;
        //     console.log("GR:", u);
        //     return u;
        // }
        if (this.dialogue[this.activeDialogueId].imageId != null)
        {
            return this.resources[this.dialogue[this.activeDialogueId].imageId].url;
        }
        
    }; 

/** @function {public Array} ? verifies integrity of quest before publish in Editor.
    */
locandy.player.plugins.Dialogue.prototype.verifyBeforePublish = function()
    {
        for (var d in this.dialogue){
            if (d.text.trim() === "" || d.text == null){
                return "editor_warn_dialogueTexts_need_not_be_empty_or_null";
            }
        }

        // if(this.answers.length<2){
        //     return "editor_warn_multiplechoice_two_answers_needed_before_publish";
        // }

        // for( var idx in this.answers )
        // {
        //     if (!(this.answers[idx].text) || this.answers[idx].text.trim() === "")
        //     {
        //         return "editor_warn_labeled_before_publish";
        //     }
        //     var effect = this.answers[idx].effect;
        //     if (effect == null || effect === "")
        //     {
        //         return "editor_warn_add_effect_before_publish";
        //     }
        // }

        // return false; // no problem!
    };