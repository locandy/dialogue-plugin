# dialogue-plugin
 Temporary Project. This JS is useless outside the Locandy Platform

# TODO
  1. (Code Kommentieren (alle Variablen besonders transient oder persistent!, komplexe Stellen))
  1. GUI aufräumen
     * Zeile 1: Antwort text, - Button
     * Zeile 2: NEXT dropdown, Effekt Interface
     * Übersetzungen (i18n Filter): Tags anpassen z.B. {{"Add answer"|i18n:"editor_plugin_dialogue_answer_add"}} und alle verwendeten neuen Tags mit dialogue_* hier auflisten (siehe Neue Übersetzungen) - sonst werden im Deutschen Interface alle Button-Labels falsch angezeigt, wenn das Label nicht existiert wird der englische Text verwendet.
     * DialogNode löschen Button mit JS confirm()
     * Neuen Dialog-bereich nach unten verschieben
     * Audio einbauen
     * JSON-Buttons in einer zeile
     * Save-und Reset Funktion einbauen: persist und desist
  1. Bild des Agents einfügen (siehe Image Plugin), das Bild sollte 1/3 des Bildschirms breit (z.B. CSS: float:left?) sein und der Text den es sagt sollte rechts daneben sein.
     * Das Agent wird in Zukunft mehrere Bilder haben können (verschiedene Personen oder Stimmungen des Agents) - ob wir das mittels Effekt oder direkt im DialogNode (als Attribut) umschalten, ist noch unentschieden.
  1. (Agent-Bild (siehe Image-Plugin) -> später UI für hochladen und zuweisen mehrer Bilder)

# Neue Übersetzungen i18n
  * "Upload image"|i18n:"editor_plugin_dialogue_agent_image_upload"
  * "No file connected"|i18n:"editor_plugin_dialogue_file_not_connected"
  * "File connected"|i18n:"editor_plugin_dialogue_file_connected"
  * 'Text Agent\'|i18n:\'editor_plugin_dialogue_agent_text\'
  * "You\'ve not provided any answers for this dialogue yet."|i18n:"editor_plugin_dialogue_no_answers"
  * 'Answer #%s\'|i18nP:\'editor_plugin_dialogue_label_answer\':($index+1)
  * "No effect connected"|i18n:"editor_plugin_dialogue_effect_not_connected"
  * "Connection corrupted"|i18n:"editor_plugin_dialogue_effect_not_connected_correctly"
  * "Add answer"|i18n:"editor_plugin_dialogue_answer_add"
  * "New dialogue"|i18n:"editor_plugin_dialogue_add"
  * "Import json"|i18n:"editor_plugin_dialogue_json_import"
  * "Copy json to clipboard"|i18n:"editor_plugin_dialogue_json_export"
  *  SHARED multiplechoice:
     * "You\'ve not provided any answers for this plugin yet."|i18n:"editor_plugin_multiplechoice_no_answers"

# Dateien
 * DialogueTest.js -> TestDatei: aktuellste Version von Dialogue
 * Dialogue -> Zwischenstand: akuellste lauffähige Version

# Fragen Thomas
 * Agent-Bilder: 
   * Grundprinzip von Upload und Speicherung richtig?
   * Soll ein Multi-Upload möglich sein? Nein.
   * Bilder werden beim Upload nach kurzer Zeit gemerged. Kann ich das verhindern? Die imageID ist bei dir immer "url", siehe Email von mir.
   * Wie soll der Upload Bereich genau ausschauen? mit Popup-Menü?
   * Soll es eine Möglichkeit geben allen Dialogen das gleiche Bild zuzuweisen? Nein.
 * Audio:
   * Soll es einen Erneut-Abspielen Button geben? Ja.
   * Wie kann ich eine Audio-Datei abspielen? Kann ich dafür in Effect.js nachschauen?
   
         var sound = this.quest.getResource(resourceIdString);

         if(sound)
         {
             locandy.player.plugins.Media.updateCurrentMediaInstance(null);
             sound.play();
         }
         else
             return "ERROR: Missing upload for sound-effect: " + value;


# Yutsi Dialogue Generator
 Here’s a simple Angular UI for generating interactive text-based dialogue that outputs to JSON format: yutsi.com/dialoguegenerator. Check out the repo for instructions as well as an importable JSON sample. This has proven a very useful tool in the development of HTML5 video games, especially when using Phaser.js, which is a wonderful library but can be tedious when dealing with interactive text. http://yutsi.com/2016/08/14/dialogue-generator?da=true

  * Wie unterscheidet sich YUTSI von unserem Design?
  * Sollen wir was übernehmen/verbessern?
