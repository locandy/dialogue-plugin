# dialogue-plugin
 Temporary Project. This JS is useless outside the Locandy Platform

# TODO
  1. (Code Kommentieren (alle Variablen besonders transient oder persistent!, komplexe Stellen))
  1. GUI aufräumen
     * Zeile 1: Antwort text, - Button
     * Zeile 2: NEXT dropdown, Effekt Interface
     * Übersetzungen (i18n Filter): Tags anpassen z.B. {{"Add answer"|i18n:"editor_plugin_dialogue_answer_add"}} und alle verwendeten neuen Tags mit dialogue_* hier auflisten (siehe Neue Übersetzungen) - sonst werden im Deutschen Interface alle Button-Labels falsch angezeigt, wenn das Label nicht existiert wird der englische Text verwendet.
     * DialogNode löschen Button mit JS confirm()
     1. Neuen Dialog-bereich nach unten verschieben
     1. Audio einbauen
     1. JSON-Buttons in einer zeile
     1. Save-und Reset Funktion einbauen: persist und desist
  1. Bild des Agents einfügen (siehe Image Plugin), das Bild sollte 1/3 des Bildschirms breit (z.B. CSS: float:left?) sein und der Text den es sagt sollte rechts daneben sein.
     * Das Agent wird in Zukunft mehrere Bilder haben können (verschiedene Personen oder Stimmungen des Agents) - ob wir das mittels Effekt oder direkt im DialogNode (als Attribut) umschalten, ist noch unentschieden.
  1. (Agent-Bild (siehe Image-Plugin) -> später UI für hochladen und zuweisen mehrer Bilder)

# Neue Übersetzungen i18n
  * "Add answer"|i18n:"editor_plugin_dialogue_answer_add"
  *  SHARED multiplechoice:
     * "You\'ve not provided any answers for this plugin yet."|i18n:"editor_plugin_multiplechoice_no_answers"

# Dateien
 * DialogueTest.js -> TestDatei: aktuellste Version von Dialogue
 * Dialogue -> Zwischenstand: akuellste lauffähige Version
 
 # Fragen an Thomas:
 * Import von JSON Text -> addDialogueToModel
   -> siehe SpriteSheet Plugin

Locandy Wanderausstellung: https://www.locandy.com/q/slwa1/edit/readonly


# Yutsi Dialogue Generator
 Here’s a simple Angular UI for generating interactive text-based dialogue that outputs to JSON format: yutsi.com/dialoguegenerator. Check out the repo for instructions as well as an importable JSON sample. This has proven a very useful tool in the development of HTML5 video games, especially when using Phaser.js, which is a wonderful library but can be tedious when dealing with interactive text. http://yutsi.com/2016/08/14/dialogue-generator?da=true

  * Wie unterscheidet sich YUTSI von unserem Design?
  * Sollen wir was übernehmen/verbessern?
  
