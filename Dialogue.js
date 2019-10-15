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

        // fix correctIndex (if answers has been removed)
        json.correctIndex = json.answers[json.correctIndex] 
            ? json.correctIndex 
            : 0;
    	
    	// read-only model properties

	this.activeDialogueId = "START";
	this.dialogue = json.dialogue;
	this.question="";

        this.buttonText = json.buttonText;   
    	
    	// read-write runtime properties
        this.correctIndex = json.correctIndex;
        this.answers = angular.copy(json.answers);

    	// plugin-specific runtime properties
    	this.answeredCorrectly = false; // saves the current quiz state
    	this.selectedIndex = null; // avoids lots of data in persist()
    	this.message = null; // saves the current displayed message
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
        // return  '<div class="col-xs-5 left"> \
        //                 <div class="radio"> \
        //                     <label> \
        //                         <input \
        //                             type="radio" \
        //                             name="answers" \
        //                             class="indicator" \
        //                             data-ng-value="$index" \
        //                             data-ng-model="pluginModel.correctIndex"> \
        //                         <div class="icon"><span class="holder"></span></div> \
        //                     </label> \
        //                 </div> \
        //                 <div class="holder"> \
        //                     <input \
        //                         type="text" \
        //                         class="form-control text" \
        //                         data-ng-model="answer.text" \
        //                         data-focus-element="!answer.text" \
        //                         placeholder="{{\'Answer #%s\'|i18nP:\'editor_plugin_multiplechoice_label_answer\':($index+1)}}"> \
        //                 </div> \
        //             </div>';

    };

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.removeAnswerFromModel = function(pluginModel, activeDialogueId, answer)
    {
        if (pluginModel.dialogue[activeDialogueId].answers)
        {
            locandy.utilities.removeArrayItem(pluginModel.dialogue[activeDialogueId].answers, answer);
        }
        // if( pluginModel.hasOwnProperty("answers") )
        // {
        //     if( pluginModel.answers instanceof Array )
        //         locandy.utilities.removeArrayItem(pluginModel.answers,answer);
        // }        
    };

/** @function {static} getTemplate @inheritdesc */    
locandy.player.plugins.Dialogue.getTemplate = function()
    {               
        return '<div data-ng-if="plugin.isHidden()" data-ng-class="{visible:plugin.isHidden()}"> \
                <p class="question">{{plugin.question}}</p> \
                <div data-ng-if="plugin.message" class="message alert alert-info"> \
                    <button type="button" class="close" data-button-handler="plugin.hideMessage()">&times;</button> \
                    <span>{{plugin.message}}</span> \
                </div> \
                <div class="answers"> \
                    <a \
                        href="javascript:void(0);" \
                        data-ng-show="answer.text" \
                        data-ng-repeat="answer in plugin.answers" \
                        data-button-handler="plugin.selectAnswer($index)" \
                        data-ng-class="{\
                            disabled:answer.disabled,\
                            selected:plugin.selectedIndex==$index,\
                            success:answer.disabled && $index==plugin.correctIndex,\
                            failure:answer.disabled && $index!=plugin.correctIndex \
                        }"> \
                        <span data-ng-class="{\
                            \'icon-radio-unchecked\':plugin.selectedIndex!=$index&&!answer.disabled||plugin.correctIndex!=$index&&answer.disabled,\
                            \'icon-radio-checked\':plugin.selectedIndex==$index&&!answer.disabled||plugin.correctIndex==$index&&answer.disabled \
                        }"> \
                        </span> \
                        <span class="label-for-icon">{{answer.text}}</span> \
                    </a> \
                </div> \
                <button class="evaluate btn btn-large btn-block" href="javascript:void(0);" data-ng-if="plugin.answers.length>1" data-button-handler="plugin.evaluateAnswer()">{{"Check answer"|localize}}</button></div>';
    };

/** @function {static} getEditTemplate @inheritdesc */
locandy.player.plugins.Dialogue.getEditTemplate = function()
    {
        return '<div> \
                <select data-ng-model="pluginModel.dialogue" class="form-control full-border ng-pristine ng-valid ng-touched" ng-options="dialogue as dialogue.text for pluginModel" \
                    <option value class="ng-binding" selected="selected">--- dialogueId ---</option> \
                </select> \
                </div> \
                <p class="description"> \
                    <span>{{"Ask player a question:"|i18n:"editor_plugin_multiplechoice_text"}}</span><br> \
                    <small>{{"Set text of agend and invoke an optional effect per answer."|i18n:"editor_plugin_multiplechoice_helptext"}}</small> \
                </p> \
                <div class="form-group"> \
                    <input \
                        type="text" \
                        class="form-control question" \
                        data-ng-model="pluginModel.dialogue[pluginModel.activeDialogueId].text" \
                        data-focus-element="!pluginModel.question" \
                        placeholder="{{\'Agent spricht\'|i18n:\'editor_plugin_multiplechoice_label_question\'}}"> \
                <hr> \
                <div> \
                    id:{{pluginModel.activeDialogueId}} \
                </div> \
                <div> \
                    {{pluginModel.dialogue[pluginModel.activeDialogueId]}} \
                </div> \
                <hr> \
                </div> \
                <div \
                    class="alert alert-info" \
                    data-ng-if="pluginModel.dialogue[pluginModel.activeDialogueId].answers.length===0"> \
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
                            data-button-handler="global.locandy.player.plugins.Dialogue.removeAnswerFromModel(pluginModel, pluginModel.activeDialogueId, answer)">\
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
                        <select data-ng-model="selectedOption" class="form-control full-border ng-pristine ng-valid ng-touched" > \
                            <option ng-repeat="dialogue in pluginModel.dialogue" ng-value="dialogue.id">--- dialogueId ---</option> \
                        </select> \
                        <!--<select data-ng-model="selectedOption" class="form-control full-border ng-pristine ng-valid ng-touched" ng-options="key as key for (key, value) in options">--> \
                            <!--<option value class="ng-binding" selected="selected">--- dialogueId ---</option>--> \
                        <!--</select>--> \
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
                    <span class="label-for-icon">{{"Add"|i18n:"system_label_add"}}</span> \
                </button>\
                <div class="form-group"> \
                    <textarea \
                        class="form-control" \
                        rows="3" \
                        data-ng-model="pluginModel.dialogueTreeJson" \
                        placeholder="Dialogue Tree JSON"/> \
                </div>';
    };

/** @function {public} desist @inheritdesc
    */
locandy.player.plugins.Dialogue.prototype.persist = function()
    {        
        var storedObject={
            dialogue: this.dialogue,  
	    activeDialogueId: this.activeDialogueId,
        };

        
        
        return storedObject;
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
locandy.player.plugins.Dialogue.prototype.selectAnswer = function(index)
    {   
        // fetch the answer from plugin if possible
        var answer = this.answers[index] || null;
        if( !answer || answer.disabled ) return;
        
        // toggle selection if it's current one
        if( this.selectedIndex === index )
        {
            this.selectedIndex = null;
            return;
        }
        
        // and check answer if not disabled
        this.selectedIndex = index;
    };
    
/** @function {public} evaluateAnswer Checks if the chosen answer is correct and performs effect afterwards. */
locandy.player.plugins.Dialogue.prototype.evaluateAnswer = function()
    {
        // 1) check if quiz was already solved
	/*        
	if( this.answeredCorrectly === true )
        {
            this.showMessage(this.localizerService.get("The question is already done!"));
            return;
        }*/
        
        // 2) no answer was selected yet
        if( this.selectedIndex === null )
        {
            this.showMessage(this.localizerService.get("Please choose an answer first!"));
            return;
        }
        
        // 3) check if quiz is already finished now 
	/*        
	var selectedAnswer = this.answers[this.selectedIndex];
        if(this.selectedIndex !== this.correctIndex)
        {
            // 3a) the answer wasn't correctly,
            // only disable the selected answer
            selectedAnswer.disabled = true;
        }
        else
        {
            // 3b) the answer is correct, set quiz
            // flag and disable all other answers
            this.answeredCorrectly = true;            
            for( var idx in this.answers )
                this.answers[idx].disabled = true;    
        }*/

	var selectedAnswer = this.dialogue[this.activeDialogueId].answers[this.selectedIndex];

        // 4) fetch the currently selected answer from plugin
        // and perform the effect of this answer from json 
        // AFTER answer's state change in 3) - persistence!
        new locandy.player.Effect(this.spot.quest, selectedAnswer.effectId).execute();
        
        // 5) reset members to get fresh state for
        // template when user tries another answer
        this.selectedIndex = null;        
        this.message = null;
    };


/** @function {public Array} ? verifies integrity of quest before publish in Editor.
    */
locandy.player.plugins.Dialogue.prototype.verifyBeforePublish = function()
    {

	// 1. check if text is not empty for all nodes


	/*
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
	*/
        
        return false; // no problem!
    };


