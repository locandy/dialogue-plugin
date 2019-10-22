# dialogue-plugin
 Temporary Project. This JS is useless outside the Locandy Platform

# Yutsi Dialogue Generator
 Here’s a simple Angular UI for generating interactive text-based dialogue that outputs to JSON format: yutsi.com/dialoguegenerator. Check out the repo for instructions as well as an importable JSON sample. This has proven a very useful tool in the development of HTML5 video games, especially when using Phaser.js, which is a wonderful library but can be tedious when dealing with interactive text. http://yutsi.com/2016/08/14/dialogue-generator?da=true

  * Wie unterscheidet sich YUTSI von unserem Design?
  * Sollen wir was übernehmen/verbessern?
  
# Dateien
 * DialogueTest.js -> TestDatei: aktuellste Version von Dialogue
 * DialogueZwischenstand -> Zwischenstand: akuellste lauffähige Version
 
 # Fragen an Thomas:
 * Dialogue-Dropdown: Funktioniert nicht über die ids. Mit weitererem Attribut dId würde es funktionieren .
 * (Funktion: addDialogueToModel: wie kann ich neue Dialogabschnitte einfügen? (Mit dialogue.push gibt es einen TypeError))
 * Import von JSON Text -> addDialogueToModel
 -> siehe SpriteSheet Plugin
 
         try
        {
            if(json.clickMapJson != "") // empty value
                this.clickMap = angular.fromJson(json.clickMapJson);
        }
        catch(e)
        {
            this.clickMap = null;
            alert("SpriteSheet clickMapJson Parese Error in JSON Spec!\nPlease delete JSON or fix it!\n" + e);
        }
 
 * Funktionen getTemplate - getEditTemplate: Warum greif ich beim einen mit plugin und beim anderen mit pluginModel zu?
