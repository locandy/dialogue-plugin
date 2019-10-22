// jEdit :folding=indent: :collapseFolds=1: :noTabs=true:

"use strict";
if( locandy === undefined ) var locandy={};
if( locandy.player === undefined ) locandy.player={};
if( locandy.player.plugins === undefined ) locandy.player.plugins={};

/** @class locandy.player.plugins.Dialogue
    @extends locandy.player.plugins.Abstract
	*/

/** @constructor {public} Dialogue @inheritdesc */
locandy.player.plugins.Dialogue = function(spot, json)
    {
    	locandy.player.plugins.Abstract.apply(this,arguments);

        // inject localizer service
        this.localizerService = locandy.player.playerMainSingleton.injector.get("localizerService");


        // dialogue properties
        this.activeDialogueId = "START";
        this.dialogue = json.dialogue;
  

    	// read-write runtime properties
        this.answers = null;

    	// this.message = null; // saves the current displayed message
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
                    "text":"Hallo! Ich bin Diana!", 
                    "audioId":null, 
                    "answers":[
                    {"text":"Hallo!", "effectId":null, "nextId":"END" },
                    {"text":"Kannst du mir Geld borgen?", "effectId":"d_receive_1gold", "nextId":"END" },
                    {"text":"Gib Diana 10 Gold!", "effectId":"d_give_10gold", "nextId":"END" },
                    ]},
                "END":{
                    "text":"Ich mag das nicht. Ciao!", 
                    "audioId":null, 
                    "answers":[]
                    }
            },
        };
    };

/** @function {static} getSkeleton @inheritdesc */
locandy.player.plugins.Dialogue.writeEffectToModel = function(effectModel,effectId)
    {
        if( effectModel.hasOwnProperty('effect') )
            effectModel.effect = effectId;
    };

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.addAnswerToModel = function(pluginModel)
    {
        pluginModel.dialogue[pluginModel.activeDialogueId].answers.push({
            "text": "blah",
            "effectId": null,
            "nextId": null,
        })
    };

/** @function {static} importDialogueToModel */
locandy.player.plugins.Dialogue.importDialogueToModel = function(pluginModel)
{
    pluginModel.dialogue = pluginModel.dialogueTreeJson;
};

    

/** @function {static} addDialogueToModel */
locandy.player.plugins.Dialogue.addDialogueToModel = function(pluginModel)
    {
        // var oldJson = pluginModel.dialogue;
        // var parsedJson = JSON.parse(oldJson);
        // parsedJson.TEST = {"dId": "TEST", "text": "new Dialogue", "audioId": null, "answers": null}
        // pluginModel.dialogue = JSON.stringify(parsedJson);
        pluginModel.dialogue["TEST"] = {
            "text": "blah",
            "audioId": null,
            "answers": null}
    };  

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.removeAnswerFromModel = function(pluginModel,answer)
    {
        if( pluginModel.hasOwnProperty("answers") )
        {
            if( pluginModel.dialogue[pluginModel.activeDialogueId].answers instanceof Array )
                locandy.utilities.removeArrayItem(pluginModel.dialogue[pluginModel.activeDialogueId].answers,answer);
        }        
    };

/** @function {static} getTemplate @inheritdesc */    
locandy.player.plugins.Dialogue.getTemplate = function()
    {               
        return '<div> \
                    <select data-ng-model="plugin.activeDialogueId" class="form-control full-border ng-pristine ng-valid ng-touched" > \
                        <option data-ng-repeat="x in plugin.dialogue" value="{{x.dId}}">{{x.dId}}</option> \
                    </select> \
                    <div class="question"> \
                        <p>{{plugin.dialogue[plugin.activeDialogueId].text}}</p> \
                    </div> \
                    <div> \
                        <p>SelectedIndex: {{plugin.selectedIndex}}</p>\
                    </div> \
                    <div class="answers"> \
                        <a href="javascript:void(0);" \
                            data-ng-show="answer.text"  \
                            data-ng-repeat="answer in plugin.dialogue[plugin.activeDialogueId].answers" \
                            data-button-handler="plugin.selectAnswer(answer)"> \
                        <span class="label-for-icon">{{answer.text}}</span> \
                        </a> \
                    </div> \
                </div>';

        // return '<div> \
        //             <p class="question">{{plugin.dialogue[plugin.activeDialogueId].text}}</p> \
        //             <div data-ng-if="plugin.message" class="message alert alert-info"> \
        //                 <button type="button" class="close" data-button-handler="plugin.hideMessage()">&times;</button> \
        //                 <span>{{plugin.message}}</span> \
        //             </div> \
        //             <div class="answers"> \
        //                 <a \
        //                     href="javascript:void(0);" \
        //                     data-ng-show="answer.text" \
        //                     data-ng-repeat="answer in plugin.dialogue[plugin.activeDialogueId].answers" \
        //                     data-button-handler="plugin.selectAnswer($index)" \
        //                     data-ng-class="{\
        //                         disabled:answer.disabled,\
        //                         selected:plugin.selectedIndex==$index,\
        //                         success:answer.disabled && $index==plugin.correctIndex,\
        //                         failure:answer.disabled && $index!=plugin.correctIndex \
        //                     }"> \
        //                     <span class="label-for-icon">{{answer.text}}</span> \
        //                 </a> \
        //             </div> \
        //         </div>';
    };

/** @function {static} getEditTemplate @inheritdesc */
locandy.player.plugins.Dialogue.getEditTemplate = function()
    {
        return '<div> \
                    <select data-ng-model="pluginModel.activeDialogueId" class="form-control full-border ng-pristine ng-valid ng-touched" > \
                        <option data-ng-repeat="(key, value) in pluginModel.dialogue">{{key}}</option> \
                    </select> \
                    <button \
                        class="btn btn-fancy btn-medium btn-default" \
                        data-button-handler="global.locandy.player.plugins.Dialogue.addDialogueToModel(pluginModel)">\
                        <span class="icon-plus-circle2 reusable-color-success"></span> \
                        <span class="label-for-icon">{{"New"|i18n:"system_label_add"}}</span> \
                    </button> \
                </div> \
                <p class="description"> \
                    <span>{{"Edit Dialogue:"|i18n:"editor_plugin_multiplechoice_text"}}</span><br> \
                </p> \
                <div> \
                    <hr> \
                    <div> \
                        {{pluginModel.dialogue[pluginModel.activeDialogueId]}} \
                    </div> \
                    <hr> \
                    <div> \
                    Id: {{pluginModel.activeDialogueId}} \
                    <hr> \
                    </div> \
                </div> \
                <div class="form-group"> \
                    <input \
                        type="text" \
                        class="form-control question" \
                        data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].text" \
                        data-focus-element="!pluginModel.question" \
                        placeholder="{{\'Text Agent\'|i18n:\'editor_plugin_multiplechoice_label_question\'}}"> \
                </div> \
                <div \
                    class="alert alert-info" \
                    data-ng-if="pluginModel.dialogue[pluginModel.activeDialogueId].answers.length===0"> \
                    {{"You\'ve not provided any answers for this plugin yet."|i18n:"editor_plugin_multiplechoice_no_answers"}} \
                </div>\
                <div \
                    class="answer form-group row small" \
                    data-ng-if="pluginModel.dialogue[pluginModel.activeDialogueId].answers.length > 0" \
                    data-ng-repeat="answer in pluginModel.dialogue[pluginModel.activeDialogueId].answers"> \
                    <div class="col-xs-5 left"> \
                        <div class="holder"> \
                            <input \
                                type="text" \
                                class="form-control text" \
                                data-ng-model="answer.text" \
                                data-focus-element="!answer.text" \
                                placeholder="{{\'Answer #%s\'|i18nP:\'editor_plugin_multiplechoice_label_answer\':($index+1)}}"> \
                        </div> \
                    </div> \
                    <div class="col-xs-7 right"> \
                        <button \
                            class="btn btn-fancy btn-medium btn-default" \
                            data-button-handler="global.locandy.player.plugins.Dialogue.removeAnswerFromModel(pluginModel,answer)">\
                            <span class="icon-minus-circle2 reusable-color-danger"></span>\
                        </button> \
                        <span \
                            class="effect" \
                            data-ng-init="popOverConfig={ \
                                callbackPassThrough:answer, \
                                selectedOption:answer.effect, \
                                updatePluginStaticMethodName:global.locandy.player.plugins.Dialogue.writeEffectToModel \
                            }" \
                            data-ng-include="effectPopOverPartialUrl">\
                        </span> \
                        <div> \
                            <select data-ng-model="answer.nextId" class="ng-pristine ng-valid ng-touched" > \
                                <option data-ng-repeat="x in pluginModel.dialogue" value="{{x.dId}}">{{x.dId}}</option> \
                            </select> \
                        </div> \
                        <small class="connection" data-ng-if="!answer.effect"> \
                            <span class="icon-notification2 reusable-color-warning"></span> \
                            <span class="label-for-icon">{{"No effect connected"|i18n:"editor_text_effect_not_connected"}}</span> \
                        </small> \
                        <small class="connection" data-ng-if="answer.effect && mrmResource.effects[answer.effect]"> \
                            <span class="icon-checkmark reusable-color-success"></span> \
                            <span class="label-for-icon"><button class="btn btn-fancy btn-success" data-button-handler="showEffectModal(answer.effect)">{{answer.effect}}</button></span> \
                        </small> \
                        <small class="connection" data-ng-if="answer.effect && !mrmResource.effects[answer.effect]"> \
                            <span class="icon-notification2 reusable-color-danger"></span> \
                            <span class="label-for-icon">{{"Connection corrupted"|i18n:"editor_text_effect_not_connected_correctly"}}</span> \
                        </small> \
                    </div> \
                </div> \
                <button \
                    class="btn btn-fancy btn-medium btn-default" \
                    data-button-handler="global.locandy.player.plugins.Dialogue.addAnswerToModel(pluginModel)"> \
                    <span class="icon-plus-circle2 reusable-color-success"></span> \
                    <span class="label-for-icon">{{"Add answer"|i18n:"system_label_add"}}</span> \
                </button>\
                <div class="form-group"> \
                    <textarea \
                        class="form-control" \
                        rows="3" \
                        data-ng-model="pluginModel.dialogueTreeJson" \
                        placeholder="Dialogue Tree JSON"/> \
                <button \
                    class="btn btn-fancy btn-medium btn-default" \
                    data-button-handler="global.locandy.player.plugins.Dialogue.importDialogueToModel(pluginModel)"> \
                    <span class="icon-plus-circle2 reusable-color-success"></span> \
                    <span class="label-for-icon">{{"Import json"|i18n:"system_label_add"}}</span> \
                </button>\
                <div> \
                    <hr> \
                    <div> \
                        {{pluginModel.dialogueTreeJson}} \
                    </div> \
                    <hr> \
                </div> \
                </div>';
    };

/** @function {public} desist @inheritdesc
    */
locandy.player.plugins.Dialogue.prototype.persist = function()
    {        
        // var storedObject={
        //     answeredCorrectly: this.answeredCorrectly,            
        //     selectedIndex: null, // clears property!
        //     message: null, // clears property!
        //     answers: []
        // };

        // for( var idx in this.answers )
        // {
        //     var answer = this.answers[idx];
        //     var disabled = answer.disabled||false;
        //     storedObject.answers.push({disabled:disabled});                
        // }

        // return storedObject;
        return 
    };

/** @function {public} persist @inheritdesc
  */
locandy.player.plugins.Dialogue.prototype.desist = function(storedObject)
    {
        locandy.utilities.mixin(storedObject, this);
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

/** @function {public} selectAnswers Selects an answer by its index. */
locandy.player.plugins.Dialogue.prototype.selectAnswer = function(answer)
    {
        //var answer = this.dialogue[this.activeDialogueId].answers[index];

        console.log(answer);
        new locandy.player.Effect(this.spot.quest, answer.effect).execute();
    };

// /** @function {public} evaluateAnswer Checks if the chosen answer is correct and performs effect afterwards. */
// locandy.player.plugins.Dialogue.prototype.executeAnswer = function()
//     {
//         // 4) fetch the currently selected answer from plugin
//         // and perform the effect of this answer from json 
//         // AFTER answer's state change in 3) - persistence!
//         new locandy.player.Effect(this.spot.quest, selectedAnswer.effect).execute();

//     };


/** @function {public Array} ? verifies integrity of quest before publish in Editor.
    */
locandy.player.plugins.Dialogue.prototype.verifyBeforePublish = function()
    {

        if(this.answers.length<2){
            return "editor_warn_multiplechoice_two_answers_needed_before_publish";
        }

        for( var idx in this.answers )
        {
            if (!(this.answers[idx].text) || this.answers[idx].text.trim() === "")
            {
                return "editor_warn_labeled_before_publish";
            }
            var effect = this.answers[idx].effect;
            if (effect == null || effect === "")
            {
                return "editor_warn_add_effect_before_publish";
            }
        }

        return false; // no problem!
    };