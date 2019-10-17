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

        // dialogue properties
        this.activeDialogueId = "START";
        this.dialogue = json.dialogue;

    	// read-only model properties    	
    	this.question = json.question;
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
            "correctIndex":0,
            "activeDialogueId": "START",
	        "dialogue": {
                "START":{
                    "dId": "START",
                    "text":"Hallo! Ich bin Diana!", 
                    "audioId":null, 
                    "answers":[
                    {"text":"Hallo!", "effectId":null, "nextId":"END" },
                    {"text":"Kannst du mir Geld borgen?", "effectId":"d_receive_1gold", "nextId":"END" },
                    {"text":"Gib Diana 10 Gold!", "effectId":"d_give_10gold", "nextId":"END" },
                    ]},
                "END":{
                    "dId": "END",
                    "text":"Ich mag das nicht. Ciao!", 
                    "audioId":null, 
                    "answers":[]
                    }
            },
            "question":null,
            "answers":[],
            "dialogueTreeJson":""
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

/** @function {static} addDialogueToModel */
locandy.player.plugins.Dialogue.addDialogueToModel = function(pluginModel)
    {
        pluginModel.dialogue.push({
            "text": "blah",
            "audioId": null,
            "answers": null
        })
    };  

/** @function {static} addAnswerToModel */
locandy.player.plugins.Dialogue.removeAnswerFromModel = function(pluginModel,answer)
    {
        if( pluginModel.hasOwnProperty("answers") )
        {
            if( pluginModel.answers instanceof Array )
                locandy.utilities.removeArrayItem(pluginModel.answers,answer);
        }        
    };

/** @function {static} getTemplate @inheritdesc */    
locandy.player.plugins.Dialogue.getTemplate = function()
    {               
        return '<div <!--data-ng-if="plugin.isHidden()" data-ng-class="{visible:plugin.isHidden()}"-->> \
                    <p class="question">{{plugin.dialogue[pluginModel.activeDialogueId].text}}</p> \
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
                    <button class="evaluate btn btn-large btn-block" href="javascript:void(0);" data-ng-if="plugin.answers.length>1" data-button-handler="plugin.evaluateAnswer()">{{"Check answer"|localize}}</button> \
                </div>';
    };

/** @function {static} getEditTemplate @inheritdesc */
locandy.player.plugins.Dialogue.getEditTemplate = function()
    {
        return '<div> \
                    <select data-ng-model="pluginModel.activeDialogueId" class="form-control full-border ng-pristine ng-valid ng-touched" > \
                        <option data-ng-repeat="x in pluginModel.dialogue" value="{{x.dId}}">{{x.dId}}</option> \
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
                    data-ng-if="pluginModel.answers.length===0"> \
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
            answeredCorrectly: this.answeredCorrectly,            
            selectedIndex: null, // clears property!
            message: null, // clears property!
            answers: []
        };

        for( var idx in this.answers )
        {
            var answer = this.answers[idx];
            var disabled = answer.disabled||false;
            storedObject.answers.push({disabled:disabled});                
        }

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
        if( this.answeredCorrectly === true )
        {
            this.showMessage(this.localizerService.get("The question is already done!"));
            return;
        }

        // 2) no answer was selected yet
        if( this.selectedIndex === null )
        {
            this.showMessage(this.localizerService.get("Please choose an answer first!"));
            return;
        }

        // 3) check if quiz is already finished now 
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
        }

        // 4) fetch the currently selected answer from plugin
        // and perform the effect of this answer from json 
        // AFTER answer's state change in 3) - persistence!
        new locandy.player.Effect(this.spot.quest, selectedAnswer.effect).execute();

        // 5) reset members to get fresh state for
        // template when user tries another answer
        this.selectedIndex = null;        
        this.message = null;
    };


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